/**
 * @fileoverview Database Service Layer Integration
 *
 * Main service that integrates the database abstraction layer with
 * the existing Firebase-enhanced service layer, providing backward
 * compatibility while enabling future database flexibility.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { DatabaseService, DatabaseConfigHelper } from './factory';
import { RepositoryFactory } from './repositories';
import { DatabaseProvider } from './interfaces';

/**
 * Main database service that maintains compatibility with existing code
 */
class MainDatabaseService extends DatabaseService {
  private repositories: RepositoryFactory;

  constructor() {
    // Use Firebase by default for backward compatibility
    super(DatabaseConfigHelper.getFirebaseConfigFromEnv());
    this.repositories = new RepositoryFactory(this.getProvider());
  }

  // Repository access methods
  get users() {
    return this.repositories.createUserRepository();
  }

  get progress() {
    return this.repositories.createProgressRepository();
  }

  get missions() {
    return this.repositories.createMissionRepository();
  }

  get analytics() {
    return this.repositories.createAnalyticsRepository();
  }

  // Generic repository creator
  createRepository<T extends { id: string }>(collectionName: string) {
    return this.repositories.createGeneric<T>(collectionName);
  }

  // Backward compatibility with firebase-services.ts
  async getDocument<T>(collectionPath: string, docId: string) {
    return this.getProvider().read<T>(collectionPath, docId);
  }

  async setDocument<T>(collectionPath: string, docId: string, data: T) {
    return this.getProvider().update(collectionPath, docId, data as Partial<T>);
  }

  async updateDocument<T>(collectionPath: string, docId: string, updates: Partial<T>) {
    return this.getProvider().update(collectionPath, docId, updates);
  }

  async deleteDocument(collectionPath: string, docId: string) {
    return this.getProvider().delete(collectionPath, docId);
  }

  async queryCollection<T>(collectionPath: string, options: any = {}) {
    return this.getProvider().query<T>(collectionPath, options);
  }

  // Real-time subscriptions with backward compatibility
  onSnapshot<T>(collectionPath: string, callback: (data: T[]) => void, options: any = {}) {
    return this.getProvider().subscribe<T>(collectionPath, callback, options);
  }

  onDocumentSnapshot<T>(collectionPath: string, docId: string, callback: (data: T | null) => void) {
    return this.getProvider().subscribeToDocument<T>(collectionPath, docId, callback);
  }

  // Performance monitoring
  async getQueryPerformance(collection: string) {
    return this.getProvider().getQueryPerformance(collection);
  }

  // Cache management
  clearCache() {
    const provider = this.getProvider();
    if ('cache' in provider && provider.cache && typeof provider.cache === 'object' && 'clear' in provider.cache) {
      (provider.cache as any).clear();
    }
  }
}

// Export singleton instance for backward compatibility
export const databaseService = new MainDatabaseService();
export const enhancedDatabaseService = databaseService; // Legacy alias

// Export for direct provider access
export { DatabaseService, DatabaseConfigHelper, RepositoryFactory };

// Backward compatibility exports that match firebase-services.ts
export const firebaseService = {
  getDocument: enhancedDatabaseService.getDocument.bind(enhancedDatabaseService),
  setDocument: enhancedDatabaseService.setDocument.bind(enhancedDatabaseService),
  updateDocument: enhancedDatabaseService.updateDocument.bind(enhancedDatabaseService),
  deleteDocument: enhancedDatabaseService.deleteDocument.bind(enhancedDatabaseService),
  queryCollection: enhancedDatabaseService.queryCollection.bind(enhancedDatabaseService),
  onSnapshot: enhancedDatabaseService.onSnapshot.bind(enhancedDatabaseService),
  onDocumentSnapshot: enhancedDatabaseService.onDocumentSnapshot.bind(enhancedDatabaseService),
  getQueryPerformance: enhancedDatabaseService.getQueryPerformance.bind(enhancedDatabaseService),
  clearCache: enhancedDatabaseService.clearCache.bind(enhancedDatabaseService),
  cache: {
    clear: enhancedDatabaseService.clearCache.bind(enhancedDatabaseService),
  },
};

/**
 * Database migration utilities
 */
export class DatabaseMigration {
  private sourceProvider: DatabaseProvider;
  private targetProvider: DatabaseProvider;

  constructor(sourceProvider: DatabaseProvider, targetProvider: DatabaseProvider) {
    this.sourceProvider = sourceProvider;
    this.targetProvider = targetProvider;
  }

  async migrateCollection<T>(collectionName: string): Promise<{
    migrated: number;
    errors: Array<{ id: string; error: string }>;
  }> {
    const result = { migrated: 0, errors: [] as Array<{ id: string; error: string }> };

    try {
      // Get all documents from source
      const sourceResult = await this.sourceProvider.query<T>(collectionName);

      if (!sourceResult.success || !sourceResult.data) {
        throw new Error(`Failed to read from source: ${sourceResult.error}`);
      }

      // Migrate documents in batches
      const batchSize = 100;
      const documents = sourceResult.data;

      for (let i = 0; i < documents.length; i += batchSize) {
        const batch = documents.slice(i, i + batchSize);

        for (const doc of batch) {
          try {
            const { id, ...data } = doc as any;
            await this.targetProvider.create(collectionName, data, { id });
            result.migrated++;
          } catch (error) {
            result.errors.push({
              id: (doc as any).id,
              error: error instanceof Error ? error.message : 'Unknown error',
            });
          }
        }

        // Progress callback could be added here
        console.log(`Migrated ${Math.min(i + batchSize, documents.length)}/${documents.length} documents`);
      }
    } catch (error) {
      throw new Error(`Migration failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }

    return result;
  }

  async validateMigration<T>(collectionName: string): Promise<{
    sourceCount: number;
    targetCount: number;
    missingIds: string[];
    valid: boolean;
  }> {
    try {
      // Count documents in both sources
      const sourceCountResult = await this.sourceProvider.count(collectionName);
      const targetCountResult = await this.targetProvider.count(collectionName);

      if (!sourceCountResult.success || !targetCountResult.success) {
        throw new Error('Failed to count documents');
      }

      const sourceCount = sourceCountResult.data || 0;
      const targetCount = targetCountResult.data || 0;

      // Get all document IDs from source
      const sourceResult = await this.sourceProvider.query<T>(collectionName, {
        select: ['id'],
      });

      if (!sourceResult.success || !sourceResult.data) {
        throw new Error('Failed to get source IDs');
      }

      const sourceIds = new Set(sourceResult.data.map((doc: any) => doc.id));
      const missingIds: string[] = [];

      // Check if each source document exists in target
      const sourceIdsArray = Array.from(sourceIds);
      for (const id of sourceIdsArray) {
        const targetResult = await this.targetProvider.read(collectionName, id);
        if (!targetResult.success || !targetResult.data) {
          missingIds.push(id);
        }
      }

      return {
        sourceCount,
        targetCount,
        missingIds,
        valid: sourceCount === targetCount && missingIds.length === 0,
      };
    } catch (error) {
      throw new Error(`Validation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

/**
 * Query optimization analyzer
 */
export class QueryOptimizer {
  private provider: DatabaseProvider;

  constructor(provider: DatabaseProvider) {
    this.provider = provider;
  }

  async analyzeSlowQueries(collection: string) {
    const performance = await this.provider.getQueryPerformance(collection);

    if (!performance.success || !performance.data) {
      return { recommendations: ['Unable to analyze queries'] };
    }

    const recommendations: string[] = [];
    const metrics = performance.data;

    // Analyze average query time
    if (metrics.averageQueryTime > 1000) {
      recommendations.push('Consider adding database indexes for frequently queried fields');
    }

    // Analyze cache hit rate
    if (metrics.cacheHitRate < 0.5) {
      recommendations.push('Increase cache TTL or improve cache strategy');
    }

    // Analyze slow queries
    if (metrics.slowQueries.length > 0) {
      recommendations.push(`${metrics.slowQueries.length} slow queries detected - consider query optimization`);
    }

    return {
      metrics,
      recommendations,
    };
  }

  async suggestIndexes(collection: string, commonQueries: Array<{ field: string; frequency: number }>) {
    const suggestions: Array<{ fields: string[]; reason: string }> = [];

    // Sort by frequency and suggest indexes for most common queries
    const sortedQueries = commonQueries.sort((a, b) => b.frequency - a.frequency);

    for (const query of sortedQueries.slice(0, 5)) {
      // Top 5 most common
      if (query.frequency > 10) {
        // Only if queried more than 10 times
        suggestions.push({
          fields: [query.field],
          reason: `Frequently queried field (${query.frequency} times)`,
        });
      }
    }

    return {
      collection,
      suggestions,
      totalQueries: commonQueries.reduce((sum, q) => sum + q.frequency, 0),
    };
  }
}

/**
 * Offline sync manager
 */
export class OfflineSyncManager {
  private provider: DatabaseProvider;
  private syncQueue: Array<{
    id: string;
    operation: 'create' | 'update' | 'delete';
    collection: string;
    data?: any;
    timestamp: Date;
  }> = [];

  constructor(provider: DatabaseProvider) {
    this.provider = provider;
  }

  async enableOfflineMode() {
    await this.provider.enableOffline({
      enableOfflineWrite: true,
      conflictResolution: 'client',
      syncStrategy: 'batch',
    });
  }

  async disableOfflineMode() {
    await this.provider.disableOffline();
  }

  async queueOperation(operation: {
    id: string;
    operation: 'create' | 'update' | 'delete';
    collection: string;
    data?: any;
  }) {
    this.syncQueue.push({
      ...operation,
      timestamp: new Date(),
    });
  }

  async syncPendingOperations() {
    if (this.syncQueue.length === 0) {
      return { synced: 0, errors: [] };
    }

    const operations = this.syncQueue.map(op => ({
      type: op.operation,
      collection: op.collection,
      id: op.id,
      data: op.data,
    }));

    const result = await this.provider.batch(operations);

    if (result.success) {
      this.syncQueue = [];
      return { synced: operations.length, errors: [] };
    } else {
      return { synced: 0, errors: [result.error || 'Unknown error'] };
    }
  }

  getPendingOperationsCount(): number {
    return this.syncQueue.length;
  }

  clearSyncQueue(): void {
    this.syncQueue = [];
  }
}
