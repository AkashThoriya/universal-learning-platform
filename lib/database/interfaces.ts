/**
 * @fileoverview Database Abstraction Layer Interfaces
 *
 * Defines contracts for database operations that can be implemented
 * by different database providers (Firebase, PostgreSQL, MongoDB, etc.)
 *
 * @author Universal Learning Platform Team
 * @version 1.0.0
 */

export interface QueryOptions {
  where?: WhereCondition[];
  orderBy?: OrderByCondition[];
  limit?: number;
  offset?: number;
  select?: string[];
}

export interface WhereCondition {
  field: string;
  operator: 'eq' | 'ne' | 'gt' | 'gte' | 'lt' | 'lte' | 'in' | 'notIn' | 'contains' | 'startsWith';
  value: unknown;
}

export interface OrderByCondition {
  field: string;
  direction: 'asc' | 'desc';
}

export interface DatabaseResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  metadata?: {
    queryTime: number;
    cost?: number;
    cached?: boolean;
  };
}

export interface RealtimeSubscription {
  unsubscribe: () => void;
  pause: () => void;
  resume: () => void;
}

export interface BatchOperation {
  type: 'create' | 'update' | 'delete';
  collection: string;
  id: string;
  data?: unknown;
}

export interface CacheOptions {
  ttl?: number;
  tags?: string[];
  invalidateOnWrite?: boolean;
}

export interface OfflineOptions {
  enableOfflineWrite?: boolean;
  conflictResolution?: 'client' | 'server' | 'manual';
  syncStrategy?: 'immediate' | 'batch' | 'scheduled';
}

/**
 * Core database provider interface that all database implementations must follow
 */
export interface DatabaseProvider {
  // Basic CRUD Operations
  create<T>(collection: string, data: Omit<T, 'id'>, options?: { id?: string }): Promise<DatabaseResult<T>>;
  read<T>(collection: string, id: string, options?: CacheOptions): Promise<DatabaseResult<T | null>>;
  update<T>(collection: string, id: string, updates: Partial<T>): Promise<DatabaseResult<void>>;
  delete(collection: string, id: string): Promise<DatabaseResult<void>>;

  // Advanced Query Operations
  query<T>(collection: string, options?: QueryOptions & CacheOptions): Promise<DatabaseResult<T[]>>;
  count(collection: string, options?: Pick<QueryOptions, 'where'>): Promise<DatabaseResult<number>>;

  // Batch Operations
  batch(operations: BatchOperation[]): Promise<DatabaseResult<void>>;

  // Real-time Operations
  subscribe<T>(
    collection: string,
    callback: (data: T[]) => void,
    options?: QueryOptions & { errorCallback?: (error: Error) => void }
  ): RealtimeSubscription;

  subscribeToDocument<T>(
    collection: string,
    id: string,
    callback: (data: T | null) => void,
    options?: { errorCallback?: (error: Error) => void }
  ): RealtimeSubscription;

  // Performance & Optimization
  optimize(collection: string, fields: string[]): Promise<DatabaseResult<void>>;
  getQueryPerformance(
    collection: string,
    timeRange?: { start: Date; end: Date }
  ): Promise<DatabaseResult<QueryMetrics>>;

  // Offline Capabilities
  enableOffline(options?: OfflineOptions): Promise<void>;
  disableOffline(): Promise<void>;
  syncOfflineData(): Promise<DatabaseResult<SyncResult>>;

  // Connection Management
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  isConnected(): boolean;
  getConnectionStatus(): ConnectionStatus;
}

export interface QueryMetrics {
  averageQueryTime: number;
  totalQueries: number;
  slowQueries: SlowQuery[];
  cacheHitRate: number;
  totalCost?: number;
}

export interface SlowQuery {
  collection: string;
  query: QueryOptions;
  executionTime: number;
  timestamp: Date;
  cost?: number;
}

export interface SyncResult {
  syncedDocuments: number;
  conflicts: ConflictRecord[];
  errors: SyncError[];
}

export interface ConflictRecord {
  collection: string;
  id: string;
  clientVersion: unknown;
  serverVersion: unknown;
  resolvedWith: 'client' | 'server' | 'merged';
}

export interface SyncError {
  collection: string;
  id: string;
  error: string;
  timestamp: Date;
}

export interface ConnectionStatus {
  connected: boolean;
  latency?: number;
  provider: string;
  lastConnected?: Date;
  offline?: boolean;
}

/**
 * Repository interface for domain-specific data operations
 */
export interface Repository<T> {
  findById(id: string): Promise<DatabaseResult<T | null>>;
  findAll(options?: QueryOptions): Promise<DatabaseResult<T[]>>;
  create(data: Omit<T, 'id'>): Promise<DatabaseResult<T>>;
  update(id: string, updates: Partial<T>): Promise<DatabaseResult<void>>;
  delete(id: string): Promise<DatabaseResult<void>>;
  search(searchTerm: string, fields: string[]): Promise<DatabaseResult<T[]>>;

  // Real-time capabilities
  subscribe(callback: (data: T[]) => void, options?: QueryOptions): RealtimeSubscription;
  subscribeToDocument(id: string, callback: (data: T | null) => void): RealtimeSubscription;
}

/**
 * Database factory interface for creating provider instances
 */
export interface DatabaseFactory {
  createProvider(config: DatabaseConfig): DatabaseProvider;
  getSupportedProviders(): string[];
  validateConfig(provider: string, config: unknown): boolean;
}

export interface DatabaseConfig {
  provider: 'firebase' | 'postgresql' | 'mongodb' | 'supabase' | 'sqlite';
  connection: unknown; // Provider-specific connection config
  caching?: {
    enabled: boolean;
    defaultTTL: number;
    maxSize: number;
  };
  offline?: OfflineOptions;
  performance?: {
    enableMetrics: boolean;
    slowQueryThreshold: number;
  };
}
