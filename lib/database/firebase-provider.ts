/**
 * @fileoverview Firebase Database Provider Implementation
 *
 * Implements the DatabaseProvider interface for Firebase Firestore,
 * providing a standardized API while maintaining Firebase-specific optimizations.
 *
 * @author Universal Learning Platform Team
 * @version 1.0.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  onSnapshot,
  WhereFilterOp,
  enableNetwork,
  disableNetwork,
  getCountFromServer,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/firebase';

import {
  DatabaseProvider,
  DatabaseResult,
  QueryOptions,
  WhereCondition,
  RealtimeSubscription,
  BatchOperation,
  CacheOptions,
  OfflineOptions,
  QueryMetrics,
  SyncResult,
  ConnectionStatus,
} from './interfaces';

/**
 * Database cache service with tagging and invalidation strategies
 */
class DatabaseCacheService {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number; tags: string[] }>();
  private tagIndex = new Map<string, Set<string>>(); // tag -> cache keys
  private queryMetrics = new Map<string, number[]>(); // collection -> query times

  set<T>(key: string, data: T, options: CacheOptions = {}): void {
    const { ttl = 300000, tags = [] } = options;

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
      tags,
    });

    // Update tag index
    tags.forEach(tag => {
      if (!this.tagIndex.has(tag)) {
        this.tagIndex.set(tag, new Set());
      }
      const tagSet = this.tagIndex.get(tag);
      if (tagSet) {
        tagSet.add(key);
      }
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.delete(key);
      return null;
    }

    return entry.data as T | null;
  }

  delete(key: string): void {
    const entry = this.cache.get(key);
    if (entry) {
      // Remove from tag index
      entry.tags.forEach(tag => {
        this.tagIndex.get(tag)?.delete(key);
      });
    }
    this.cache.delete(key);
  }

  invalidateByTag(tag: string): void {
    const keys = this.tagIndex.get(tag);
    if (keys) {
      keys.forEach(key => this.delete(key));
      this.tagIndex.delete(tag);
    }
  }

  recordQueryTime(collection: string, time: number): void {
    if (!this.queryMetrics.has(collection)) {
      this.queryMetrics.set(collection, []);
    }
    const times = this.queryMetrics.get(collection);
    if (times) {
      times.push(time);

      // Keep only last 100 queries per collection
      if (times.length > 100) {
        times.splice(0, times.length - 100);
      }
    }
  }

  getQueryMetrics(collection: string): { average: number; count: number; slowQueries: number } {
    const times = this.queryMetrics.get(collection) ?? [];
    if (times.length === 0) {
      return { average: 0, count: 0, slowQueries: 0 };
    }

    const average = times.reduce((sum, time) => sum + time, 0) / times.length;
    const slowQueries = times.filter(time => time > 1000).length; // > 1 second

    return { average, count: times.length, slowQueries };
  }
}

/**
 * Firebase implementation of the DatabaseProvider interface
 */
export class FirebaseDatabaseProvider implements DatabaseProvider {
  private cache: DatabaseCacheService;
  private isOfflineEnabled = false;
  private slowQueryThreshold = 1000; // 1 second
  private activeSubscriptions = new Set<() => void>();

  constructor() {
    this.cache = new DatabaseCacheService();
  }

  async create<T>(collectionName: string, data: Omit<T, 'id'>, options?: { id?: string }): Promise<DatabaseResult<T>> {
    const startTime = Date.now();

    try {
      const docId = options?.id ?? doc(collection(db, collectionName)).id;
      const docRef = doc(db, collectionName, docId);

      const createData = {
        ...data,
        id: docId,
        createdAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      } as T;

      await setDoc(docRef, createData as Record<string, unknown>);

      // Invalidate collection cache
      this.cache.invalidateByTag(`collection:${collectionName}`);

      const queryTime = Date.now() - startTime;
      this.cache.recordQueryTime(collectionName, queryTime);

      return {
        success: true,
        data: createData,
        metadata: { queryTime, cached: false },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: { queryTime: Date.now() - startTime },
      };
    }
  }

  async read<T>(collectionName: string, id: string, options?: CacheOptions): Promise<DatabaseResult<T | null>> {
    const cacheKey = `doc:${collectionName}:${id}`;
    const startTime = Date.now();

    // Check cache first
    const cached = this.cache.get<T>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        metadata: { queryTime: 0, cached: true },
      };
    }

    try {
      const docRef = doc(db, collectionName, id);
      const docSnap = await getDoc(docRef);

      const queryTime = Date.now() - startTime;
      this.cache.recordQueryTime(collectionName, queryTime);

      if (!docSnap.exists()) {
        return {
          success: true,
          data: null,
          metadata: { queryTime, cached: false },
        };
      }

      const data = { id, ...docSnap.data() } as T;

      // Cache the result
      const { ttl = 300000, tags = [] } = options ?? {};
      this.cache.set(cacheKey, data, {
        ttl,
        tags: [...tags, `collection:${collectionName}`, `doc:${collectionName}:${id}`],
      });

      return {
        success: true,
        data,
        metadata: { queryTime, cached: false },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: { queryTime: Date.now() - startTime },
      };
    }
  }

  async update<T>(collectionName: string, id: string, updates: Partial<T>): Promise<DatabaseResult<void>> {
    const startTime = Date.now();

    try {
      const docRef = doc(db, collectionName, id);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      } as Record<string, unknown>);

      // Invalidate caches
      this.cache.delete(`doc:${collectionName}:${id}`);
      this.cache.invalidateByTag(`collection:${collectionName}`);

      const queryTime = Date.now() - startTime;
      this.cache.recordQueryTime(collectionName, queryTime);

      return {
        success: true,
        metadata: { queryTime, cached: false },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: { queryTime: Date.now() - startTime },
      };
    }
  }

  async delete(collectionName: string, id: string): Promise<DatabaseResult<void>> {
    const startTime = Date.now();

    try {
      const docRef = doc(db, collectionName, id);
      await deleteDoc(docRef);

      // Invalidate caches
      this.cache.delete(`doc:${collectionName}:${id}`);
      this.cache.invalidateByTag(`collection:${collectionName}`);

      const queryTime = Date.now() - startTime;
      this.cache.recordQueryTime(collectionName, queryTime);

      return {
        success: true,
        metadata: { queryTime, cached: false },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: { queryTime: Date.now() - startTime },
      };
    }
  }

  async query<T>(collectionName: string, options?: QueryOptions & CacheOptions): Promise<DatabaseResult<T[]>> {
    const cacheKey = `query:${collectionName}:${JSON.stringify(options)}`;
    const startTime = Date.now();

    // Check cache first
    const cached = this.cache.get<T[]>(cacheKey);
    if (cached) {
      return {
        success: true,
        data: cached,
        metadata: { queryTime: 0, cached: true },
      };
    }

    try {
      let q = query(collection(db, collectionName));

      // Apply where conditions
      if (options?.where) {
        for (const condition of options.where) {
          q = query(q, where(condition.field, this.mapOperator(condition.operator), condition.value));
        }
      }

      // Apply order by
      if (options?.orderBy) {
        for (const order of options.orderBy) {
          q = query(q, orderBy(order.field, order.direction));
        }
      }

      // Apply limit
      if (options?.limit) {
        q = query(q, limit(options.limit));
      }

      const querySnap = await getDocs(q);
      const documents: T[] = [];

      querySnap.forEach(docSnap => {
        documents.push({ id: docSnap.id, ...docSnap.data() } as T);
      });

      const queryTime = Date.now() - startTime;
      this.cache.recordQueryTime(collectionName, queryTime);

      // Cache the result
      const { ttl = 180000, tags = [] } = options ?? {};
      this.cache.set(cacheKey, documents, {
        ttl,
        tags: [...tags, `collection:${collectionName}`],
      });

      // Log slow queries
      if (queryTime > this.slowQueryThreshold) {
        // console.warn(`Slow query detected: ${collectionName} took ${queryTime}ms`, options);
      }

      return {
        success: true,
        data: documents,
        metadata: { queryTime, cached: false },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: { queryTime: Date.now() - startTime },
      };
    }
  }

  async count(collectionName: string, options?: Pick<QueryOptions, 'where'>): Promise<DatabaseResult<number>> {
    const startTime = Date.now();

    try {
      let q = query(collection(db, collectionName));

      // Apply where conditions
      if (options?.where) {
        for (const condition of options.where) {
          q = query(q, where(condition.field, this.mapOperator(condition.operator), condition.value));
        }
      }

      const snapshot = await getCountFromServer(q);
      const { count } = snapshot.data();

      const queryTime = Date.now() - startTime;
      this.cache.recordQueryTime(collectionName, queryTime);

      return {
        success: true,
        data: count,
        metadata: { queryTime, cached: false },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: { queryTime: Date.now() - startTime },
      };
    }
  }

  async batch(operations: BatchOperation[]): Promise<DatabaseResult<void>> {
    const startTime = Date.now();

    try {
      const batch = writeBatch(db);

      for (const operation of operations) {
        const docRef = doc(db, operation.collection, operation.id);

        switch (operation.type) {
          case 'create':
            batch.set(docRef, {
              ...(operation.data as Record<string, unknown>),
              id: operation.id,
              createdAt: Timestamp.fromDate(new Date()),
              updatedAt: Timestamp.fromDate(new Date()),
            });
            break;
          case 'update':
            batch.update(docRef, {
              ...(operation.data as Record<string, unknown>),
              updatedAt: Timestamp.fromDate(new Date()),
            });
            break;
          case 'delete':
            batch.delete(docRef);
            break;
        }
      }

      await batch.commit();

      // Invalidate caches for affected collections
      const affectedCollections = new Set(operations.map(op => op.collection));
      affectedCollections.forEach(coll => {
        this.cache.invalidateByTag(`collection:${coll}`);
      });

      const queryTime = Date.now() - startTime;

      return {
        success: true,
        metadata: { queryTime, cached: false },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        metadata: { queryTime: Date.now() - startTime },
      };
    }
  }

  subscribe<T>(
    collectionName: string,
    callback: (data: T[]) => void,
    options?: QueryOptions & { errorCallback?: (error: Error) => void }
  ): RealtimeSubscription {
    let q = query(collection(db, collectionName));

    // Apply query options (similar to query method)
    if (options?.where) {
      for (const condition of options.where) {
        q = query(q, where(condition.field, this.mapOperator(condition.operator), condition.value));
      }
    }

    if (options?.orderBy) {
      for (const order of options.orderBy) {
        q = query(q, orderBy(order.field, order.direction));
      }
    }

    if (options?.limit) {
      q = query(q, limit(options.limit));
    }

    let paused = false;

    const unsubscribe = onSnapshot(
      q,
      snapshot => {
        if (paused) {
          return;
        }

        const documents: T[] = [];
        snapshot.forEach(docSnap => {
          documents.push({ id: docSnap.id, ...docSnap.data() } as T);
        });
        callback(documents);
      },
      error => {
        if (options?.errorCallback) {
          options.errorCallback(error);
        } else {
          console.error('Subscription error:', error);
        }
      }
    );

    this.activeSubscriptions.add(unsubscribe);

    return {
      unsubscribe: () => {
        unsubscribe();
        this.activeSubscriptions.delete(unsubscribe);
      },
      pause: () => {
        paused = true;
      },
      resume: () => {
        paused = false;
      },
    };
  }

  subscribeToDocument<T>(
    collectionName: string,
    id: string,
    callback: (data: T | null) => void,
    options?: { errorCallback?: (error: Error) => void }
  ): RealtimeSubscription {
    const docRef = doc(db, collectionName, id);
    let paused = false;

    const unsubscribe = onSnapshot(
      docRef,
      docSnap => {
        if (paused) {
          return;
        }

        if (docSnap.exists()) {
          callback({ id, ...docSnap.data() } as T);
        } else {
          callback(null);
        }
      },
      error => {
        if (options?.errorCallback) {
          options.errorCallback(error);
        } else {
          console.error('Document subscription error:', error);
        }
      }
    );

    this.activeSubscriptions.add(unsubscribe);

    return {
      unsubscribe: () => {
        unsubscribe();
        this.activeSubscriptions.delete(unsubscribe);
      },
      pause: () => {
        paused = true;
      },
      resume: () => {
        paused = false;
      },
    };
  }

  async optimize(_collectionName: string, _fields: string[]): Promise<DatabaseResult<void>> {
    // Firebase automatically handles indexing
    // This is a no-op for Firebase but maintains interface consistency
    // console.log(`Firebase auto-optimization enabled for ${collectionName} with fields:`, fields);

    return {
      success: true,
      metadata: { queryTime: 0, cached: false },
    };
  }

  async getQueryPerformance(
    collectionName: string,
    _timeRange?: { start: Date; end: Date }
  ): Promise<DatabaseResult<QueryMetrics>> {
    const metrics = this.cache.getQueryMetrics(collectionName);

    // In a real implementation, this would query Firebase performance APIs
    const queryMetrics: QueryMetrics = {
      averageQueryTime: metrics.average,
      totalQueries: metrics.count,
      slowQueries: [], // Would be populated from logs
      cacheHitRate: 0.75, // Placeholder - would calculate from cache stats
    };

    return {
      success: true,
      data: queryMetrics,
      metadata: { queryTime: 0, cached: true },
    };
  }

  async enableOffline(_options?: OfflineOptions): Promise<void> {
    if (!this.isOfflineEnabled) {
      // Firebase Firestore has automatic offline support
      this.isOfflineEnabled = true;
      // console.log('Firebase offline persistence enabled');
    }
  }

  async disableOffline(): Promise<void> {
    if (this.isOfflineEnabled) {
      await disableNetwork(db);
      this.isOfflineEnabled = false;
    }
  }

  async syncOfflineData(): Promise<DatabaseResult<SyncResult>> {
    // Firebase handles sync automatically
    // This would typically force a sync operation
    await enableNetwork(db);

    return {
      success: true,
      data: {
        syncedDocuments: 0, // Would be populated from Firebase sync status
        conflicts: [],
        errors: [],
      },
      metadata: { queryTime: 0, cached: false },
    };
  }

  async connect(): Promise<void> {
    await enableNetwork(db);
  }

  async disconnect(): Promise<void> {
    // Cleanup subscriptions
    this.activeSubscriptions.forEach(unsubscribe => unsubscribe());
    this.activeSubscriptions.clear();

    await disableNetwork(db);
  }

  isConnected(): boolean {
    return !this.isOfflineEnabled;
  }

  getConnectionStatus(): ConnectionStatus {
    return {
      connected: this.isConnected(),
      provider: 'firebase',
      lastConnected: new Date(),
      offline: this.isOfflineEnabled,
    };
  }

  private mapOperator(operator: WhereCondition['operator']): WhereFilterOp {
    const operatorMap = {
      eq: '==',
      ne: '!=',
      gt: '>',
      gte: '>=',
      lt: '<',
      lte: '<=',
      in: 'in',
      notIn: 'not-in',
      contains: 'array-contains',
      startsWith: '>=', // Firestore doesn't have startsWith, this is a workaround
    };

    return (operatorMap[operator] || '==') as WhereFilterOp;
  }
}
