/**
 * @fileoverview Enhanced Firebase Service Layer Integration
 *
 * Simplified service layer that integrates with existing Firebase utilities
 * while adding performance monitoring, caching, and error handling.
 *
 * @author Exam Strategy Engine Team
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
  onSnapshot as _onSnapshot,
} from 'firebase/firestore';

import { db } from './firebase';
import { serviceContainer, PerformanceMonitor, ConsoleLogger } from './service-layer';
import { Result, createSuccess, createError, LoadingState as _LoadingState } from './types-utils';

// ============================================================================
// ENHANCED ERROR HANDLING & RETRY LOGIC
// ============================================================================

/*
interface _RetryOptions {
  maxRetries: number;
  baseDelay: number;
  maxDelay: number;
  backoffFactor: number;
}
*/

/*
class _RetryService {
  private static defaultOptions: RetryOptions = {
    maxRetries: 3,
    baseDelay: 1000,
    maxDelay: 10000,
    backoffFactor: 2
  };

  static async withRetry<T>(
    operation: () => Promise<T>,
    options: Partial<RetryOptions> = {}
  ): Promise<T> {
    const opts = { ...this.defaultOptions, ...options };
    let lastError: Error;

    for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;

        // Don't retry on certain error types
        if (this.isNonRetryableError(error)) {
          throw error;
        }

        // Don't retry on last attempt
        if (attempt === opts.maxRetries) {
          break;
        }

        // Calculate delay with exponential backoff
        const delay = Math.min(
          opts.baseDelay * Math.pow(opts.backoffFactor, attempt),
          opts.maxDelay
        );

        // Add jitter to prevent thundering herd
        const jitteredDelay = delay + Math.random() * 1000;

        if (process.env.NODE_ENV === 'development') {
          // console.warn(`Retry attempt ${attempt + 1}/${opts.maxRetries} after ${jitteredDelay}ms delay`);
        }

        await new Promise(resolve => setTimeout(resolve, jitteredDelay));
      }
    }

    throw lastError!;
  }

  private static isNonRetryableError(error: unknown): boolean {
    // Don't retry on permission errors, invalid arguments, etc.
    const nonRetryableCodes = [
      'permission-denied',
      'invalid-argument',
      'not-found',
      'already-exists',
      'unauthenticated',
      'failed-precondition'
    ];

    return error?.code && nonRetryableCodes.includes(error.code);
  }
}
*/

// ============================================================================
// CACHE SERVICE
// ============================================================================

class CacheService {
  private cache = new Map<string, { data: unknown; timestamp: number; ttl: number }>();
  private cleanupInterval: NodeJS.Timeout;

  constructor() {
    // Clean up expired entries every 5 minutes
    this.cleanupInterval = setInterval(() => this.cleanup(), 5 * 60 * 1000);
  }

  set<T>(key: string, data: T, ttl = 300000): void {
    this.cache.set(key, {
      data,
      timestamp: Date.now(),
      ttl,
    });
  }

  get<T>(key: string): T | null {
    const entry = this.cache.get(key);
    if (!entry) {
      return null;
    }

    const isExpired = Date.now() - entry.timestamp > entry.ttl;
    if (isExpired) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }
}

// ============================================================================
// ENHANCED FIREBASE OPERATIONS
// ============================================================================

class FirebaseService {
  public cache: CacheService;
  private monitor: PerformanceMonitor;
  private logger: ConsoleLogger;

  constructor() {
    this.cache = new CacheService();
    this.monitor = new PerformanceMonitor();
    this.logger = new ConsoleLogger('[Firebase]');
  }

  /**
   * Enhanced document read with caching
   */
  async getDocument<T>(
    collectionPath: string,
    docId: string,
    options: { useCache?: boolean; cacheTTL?: number } = {}
  ): Promise<Result<T | null>> {
    const { useCache = true, cacheTTL = 300000 } = options;
    const cacheKey = `doc:${collectionPath}:${docId}`;

    try {
      // Check cache first
      if (useCache) {
        const cached = this.cache.get<T>(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for ${cacheKey}`);
          return createSuccess(cached);
        }
      }

      // Fetch from Firestore with performance monitoring
      const result = await this.monitor.measure(`getDocument:${collectionPath}:${docId}`, async () => {
        const docRef = doc(db, collectionPath, docId);
        const docSnap = await getDoc(docRef);

        if (!docSnap.exists()) {
          return null;
        }

        return { id: docId, ...docSnap.data() } as T;
      });

      // Cache the result
      if (useCache && result) {
        this.cache.set(cacheKey, result, cacheTTL);
      }

      return createSuccess(result);
    } catch (error) {
      this.logger.error(`Error getting document ${collectionPath}/${docId}`, error as Error);
      return createError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Enhanced document write with cache invalidation
   */
  async setDocument<T>(
    collectionPath: string,
    docId: string,
    data: T,
    options: { merge?: boolean; invalidateCache?: boolean } = {}
  ): Promise<Result<void>> {
    const { merge = false, invalidateCache = true } = options;

    try {
      await this.monitor.measure(`setDocument:${collectionPath}:${docId}`, async () => {
        const docRef = doc(db, collectionPath, docId);
        await setDoc(docRef, data as any, { merge });
      });

      // Invalidate cache
      if (invalidateCache) {
        const cacheKey = `doc:${collectionPath}:${docId}`;
        this.cache.delete(cacheKey);
      }

      this.logger.debug(`Document set: ${collectionPath}/${docId}`);
      return createSuccess(undefined);
    } catch (error) {
      this.logger.error(`Error setting document ${collectionPath}/${docId}`, error as Error);
      return createError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Enhanced document update with cache invalidation
   */
  async updateDocument<T>(
    collectionPath: string,
    docId: string,
    updates: Partial<T>,
    options: { invalidateCache?: boolean } = {}
  ): Promise<Result<void>> {
    const { invalidateCache = true } = options;

    try {
      await this.monitor.measure(`updateDocument:${collectionPath}:${docId}`, async () => {
        const docRef = doc(db, collectionPath, docId);
        await updateDoc(docRef, {
          ...updates,
          updatedAt: Timestamp.fromDate(new Date()),
        });
      });

      // Invalidate cache
      if (invalidateCache) {
        const cacheKey = `doc:${collectionPath}:${docId}`;
        this.cache.delete(cacheKey);
      }

      this.logger.debug(`Document updated: ${collectionPath}/${docId}`);
      return createSuccess(undefined);
    } catch (error) {
      this.logger.error(`Error updating document ${collectionPath}/${docId}`, error as Error);
      return createError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Enhanced document delete with cache invalidation
   */
  async deleteDocument(
    collectionPath: string,
    docId: string,
    options: { invalidateCache?: boolean } = {}
  ): Promise<Result<void>> {
    const { invalidateCache = true } = options;

    try {
      await this.monitor.measure(`deleteDocument:${collectionPath}:${docId}`, async () => {
        const docRef = doc(db, collectionPath, docId);
        await deleteDoc(docRef);
      });

      // Invalidate cache
      if (invalidateCache) {
        const cacheKey = `doc:${collectionPath}:${docId}`;
        this.cache.delete(cacheKey);
      }

      this.logger.debug(`Document deleted: ${collectionPath}/${docId}`);
      return createSuccess(undefined);
    } catch (error) {
      this.logger.error(`Error deleting document ${collectionPath}/${docId}`, error as Error);
      return createError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Enhanced collection query
   */
  async queryCollection<T>(
    collectionPath: string,
    options: {
      where?: { field: string; operator: unknown; value: unknown }[];
      orderBy?: { field: string; direction: 'asc' | 'desc' }[];
      limit?: number;
      useCache?: boolean;
      cacheTTL?: number;
    } = {}
  ): Promise<Result<T[]>> {
    const {
      where: whereConditions = [],
      orderBy: orderByConditions = [],
      limit: limitCount,
      useCache = true,
      cacheTTL = 180000, // 3 minutes for collections
    } = options;

    // Create cache key from query parameters
    const cacheKey = `query:${collectionPath}:${JSON.stringify(options)}`;

    try {
      // Check cache
      if (useCache) {
        const cached = this.cache.get<T[]>(cacheKey);
        if (cached) {
          this.logger.debug(`Cache hit for query ${cacheKey}`);
          return createSuccess(cached);
        }
      }

      // Build and execute query
      const result = await this.monitor.measure(`queryCollection:${collectionPath}`, async () => {
        let q = query(collection(db, collectionPath));

        // Add where conditions
        for (const condition of whereConditions) {
          q = query(q, where(condition.field, condition.operator, condition.value));
        }

        // Add order by conditions
        for (const order of orderByConditions) {
          q = query(q, orderBy(order.field, order.direction));
        }

        // Add limit
        if (limitCount) {
          q = query(q, limit(limitCount));
        }

        const querySnap = await getDocs(q);
        const documents: T[] = [];

        querySnap.forEach(doc => {
          documents.push({ id: doc.id, ...doc.data() } as T);
        });

        return documents;
      });

      // Cache the result
      if (useCache) {
        this.cache.set(cacheKey, result, cacheTTL);
      }

      return createSuccess(result);
    } catch (error) {
      this.logger.error(`Error querying collection ${collectionPath}`, error as Error);
      return createError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Batch operations with performance monitoring
   */
  async batchWrite(
    operations: Array<{
      type: 'set' | 'update' | 'delete';
      path: string;
      docId: string;
      data?: unknown;
    }>
  ): Promise<Result<void>> {
    try {
      await this.monitor.measure(`batchWrite:${operations.length}ops`, async () => {
        const batch = writeBatch(db);

        for (const op of operations) {
          const docRef = doc(db, op.path, op.docId);

          switch (op.type) {
            case 'set':
              batch.set(docRef, op.data);
              break;
            case 'update':
              batch.update(docRef, {
                ...op.data,
                updatedAt: Timestamp.fromDate(new Date()),
              });
              break;
            case 'delete':
              batch.delete(docRef);
              break;
          }

          // Invalidate cache for each operation
          const cacheKey = `doc:${op.path}:${op.docId}`;
          this.cache.delete(cacheKey);
        }

        await batch.commit();
      });

      this.logger.debug(`Batch write completed: ${operations.length} operations`);
      return createSuccess(undefined);
    } catch (error) {
      this.logger.error('Error in batch write', error as Error);
      return createError(error instanceof Error ? error : new Error('Unknown error'));
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; keys: string[] } {
    const { cache } = this.cache as any;
    return {
      size: cache.size,
      keys: Array.from(cache.keys()),
    };
  }

  /**
   * Clear all caches
   */
  clearCache(): void {
    this.cache.clear();
    this.logger.debug('Cache cleared');
  }
}

// ============================================================================
// SERVICE INITIALIZATION
// ============================================================================

// Create singleton instance
const firebaseService = new FirebaseService();

// Register in service container
serviceContainer.register('FirebaseService', firebaseService);
serviceContainer.register('CacheService', firebaseService.cache);

// ============================================================================
// CONVENIENCE FUNCTIONS (BACKWARD COMPATIBILITY)
// ============================================================================

/**
 * Enhanced user operations
 */
export const userService = {
  async create(userId: string, userData: unknown): Promise<Result<void>> {
    const userDoc = {
      ...userData,
      userId,
      createdAt: Timestamp.fromDate(new Date()),
      onboardingComplete: false,
      stats: {
        totalStudyHours: 0,
        currentStreak: 0,
        longestStreak: 0,
        totalMockTests: 0,
        averageScore: 0,
        topicsCompleted: 0,
        totalTopics: 0,
      },
    };
    return firebaseService.setDocument('users', userId, userDoc);
  },

  async get(userId: string): Promise<Result<any | null>> {
    return firebaseService.getDocument('users', userId);
  },

  async update(userId: string, updates: unknown): Promise<Result<void>> {
    return firebaseService.updateDocument('users', userId, updates);
  },

  async getProgress(userId: string): Promise<Result<unknown[]>> {
    return firebaseService.queryCollection(`users/${userId}/progress`, {
      orderBy: [{ field: 'lastStudied', direction: 'desc' }],
      limit: 100,
    });
  },

  async getStats(userId: string): Promise<Result<any | null>> {
    const userResult = await this.get(userId);
    if (!userResult.success) {
      return userResult;
    }

    return createSuccess(userResult.data?.stats ?? null);
  },
};

/**
 * Enhanced daily log operations
 */
export const dailyLogService = {
  async create(userId: string, logData: unknown): Promise<Result<string>> {
    const logId = doc(collection(db, `users/${userId}/dailyLogs`)).id;
    const dailyLog = {
      ...logData,
      id: logId,
      createdAt: Timestamp.fromDate(new Date()),
    };

    const result = await firebaseService.setDocument(`users/${userId}/dailyLogs`, logId, dailyLog);

    return result.success ? createSuccess(logId) : result;
  },

  async getLogs(userId: string, days = 30): Promise<Result<unknown[]>> {
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    return firebaseService.queryCollection(`users/${userId}/dailyLogs`, {
      where: [{ field: 'date', operator: '>=', value: Timestamp.fromDate(startDate) }],
      orderBy: [{ field: 'date', direction: 'desc' }],
      limit: days,
    });
  },
};

/**
 * Enhanced progress tracking operations
 */
export const progressService = {
  async updateTopic(userId: string, topicId: string, progress: unknown): Promise<Result<void>> {
    const progressData = {
      ...progress,
      topicId,
      lastStudied: Timestamp.fromDate(new Date()),
    };

    return firebaseService.setDocument(`users/${userId}/progress`, topicId, progressData, { merge: true });
  },

  async getTopic(userId: string, topicId: string): Promise<Result<any | null>> {
    return firebaseService.getDocument(`users/${userId}/progress`, topicId);
  },

  async getAllProgress(userId: string): Promise<Result<unknown[]>> {
    return firebaseService.queryCollection(`users/${userId}/progress`, {
      orderBy: [{ field: 'lastStudied', direction: 'desc' }],
    });
  },
};

/**
 * Enhanced revision queue operations
 */
export const revisionService = {
  async getQueue(userId: string): Promise<Result<unknown[]>> {
    // This will use the existing getRevisionQueue logic but wrapped in service pattern
    const progressResult = await firebaseService.queryCollection(`users/${userId}/progress`, {
      where: [{ field: 'nextRevision', operator: '<=', value: Timestamp.fromDate(new Date()) }],
      orderBy: [{ field: 'nextRevision', direction: 'asc' }],
      limit: 20,
    });

    return progressResult;
  },

  async updateRevision(userId: string, topicId: string, masteryScore: number): Promise<Result<void>> {
    const now = Timestamp.fromDate(new Date());
    const nextRevision = new Date();
    nextRevision.setDate(nextRevision.getDate() + 7); // Default 7-day interval

    // Get current revision count
    const currentProgress = await firebaseService.getDocument(`users/${userId}/progress`, topicId);
    const currentRevisionCount = (currentProgress.data as any)?.revisionCount ?? 0;

    return firebaseService.updateDocument(`users/${userId}/progress`, topicId, {
      lastRevised: now,
      nextRevision: Timestamp.fromDate(nextRevision),
      masteryScore,
      revisionCount: currentRevisionCount + 1,
    });
  },
};

/**
 * Enhanced mock test operations
 */
export const mockTestService = {
  async create(userId: string, testData: unknown): Promise<Result<string>> {
    const testId = doc(collection(db, `users/${userId}/logs_mocks`)).id;
    const mockTest = {
      ...testData,
      id: testId,
      createdAt: Timestamp.fromDate(new Date()),
    };

    const result = await firebaseService.setDocument(`users/${userId}/logs_mocks`, testId, mockTest);

    return result.success ? createSuccess(testId) : result;
  },

  async getTests(userId: string, limit = 10): Promise<Result<unknown[]>> {
    return firebaseService.queryCollection(`users/${userId}/logs_mocks`, {
      orderBy: [{ field: 'date', direction: 'desc' }],
      limit,
    });
  },

  async getTest(userId: string, testId: string): Promise<Result<any | null>> {
    return firebaseService.getDocument(`users/${userId}/logs_mocks`, testId);
  },
};

/**
 * Enhanced insights service
 */
export const insightsService = {
  async generate(_userId: string): Promise<Result<unknown[]>> {
    // This would implement the generateStudyInsights logic
    // For now, return empty array as placeholder
    return createSuccess([]);
  },
};

/**
 * Enhanced mission system operations
 */
export const missionFirebaseService = {
  async saveTemplate(userId: string, template: unknown): Promise<Result<void>> {
    try {
      const templateId = template.id ?? doc(collection(db, `users/${userId}/mission-templates`)).id;
      return firebaseService.setDocument(`users/${userId}/mission-templates`, templateId, {
        ...template,
        id: templateId,
        createdAt: template.createdAt ?? Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to save template'));
    }
  },

  async getTemplates(userId: string, track?: string): Promise<Result<unknown[]>> {
    try {
      const options: unknown = {
        useCache: true,
        cacheTTL: 600000, // 10 minutes
      };

      if (track) {
        options.where = [{ field: 'track', operator: '==', value: track }];
      }

      return firebaseService.queryCollection(`users/${userId}/mission-templates`, options);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get templates'));
    }
  },

  async saveActiveMission(userId: string, mission: unknown): Promise<Result<string>> {
    try {
      const missionId = mission.id ?? doc(collection(db, `users/${userId}/active-missions`)).id;
      const missionData = {
        ...mission,
        id: missionId,
        createdAt: mission.createdAt ?? Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      const result = await firebaseService.setDocument(`users/${userId}/active-missions`, missionId, missionData);

      return result.success ? createSuccess(missionId) : result;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to save active mission'));
    }
  },

  async getActiveMissions(userId: string): Promise<Result<unknown[]>> {
    try {
      return firebaseService.queryCollection(`users/${userId}/active-missions`, {
        where: [{ field: 'status', operator: 'in', value: ['not_started', 'in_progress'] }],
        orderBy: [{ field: 'deadline', direction: 'asc' }],
        useCache: true,
        cacheTTL: 300000, // 5 minutes
      });
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get active missions'));
    }
  },

  async updateMissionProgress(userId: string, missionId: string, progress: unknown): Promise<Result<void>> {
    try {
      const status = progress.completionPercentage >= 100 ? 'completed' : 'in_progress';
      return firebaseService.updateDocument(`users/${userId}/active-missions`, missionId, {
        progress,
        status,
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update mission progress'));
    }
  },

  async completeMission(userId: string, missionId: string, results: unknown): Promise<Result<void>> {
    try {
      const mission = await firebaseService.getDocument(`users/${userId}/active-missions`, missionId);
      if (!mission.success || !mission.data) {
        return createError(new Error('Mission not found'));
      }

      // Move to history and update status using batch operation
      const completedMission = {
        ...mission.data,
        status: 'completed',
        results,
        completedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      const operations = [
        {
          type: 'set' as const,
          path: `users/${userId}/mission-history`,
          docId: missionId,
          data: completedMission,
        },
        {
          type: 'delete' as const,
          path: `users/${userId}/active-missions`,
          docId: missionId,
        },
      ];

      const result = await firebaseService.batchWrite(operations);

      if (result.success) {
        // Clear relevant cache entries
        this.clearMissionCache(userId);
      }

      return result;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to complete mission'));
    }
  },

  async getMissionHistory(userId: string, limit = 20): Promise<Result<unknown[]>> {
    try {
      return firebaseService.queryCollection(`users/${userId}/mission-history`, {
        orderBy: [{ field: 'completedAt', direction: 'desc' }],
        limit,
        useCache: true,
        cacheTTL: 600000, // 10 minutes
      });
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get mission history'));
    }
  },

  async deleteMission(userId: string, missionId: string): Promise<Result<void>> {
    try {
      const result = await firebaseService.deleteDocument(`users/${userId}/active-missions`, missionId);

      if (result.success) {
        this.clearMissionCache(userId);
      }

      return result;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to delete mission'));
    }
  },

  async generateMissionAnalytics(userId: string, period: { startDate: Date; endDate: Date }): Promise<Result<unknown>> {
    try {
      const historyResult = await this.getMissionHistory(userId, 100);

      if (!historyResult.success) {
        return historyResult;
      }

      const missions = historyResult.data;
      const periodMissions = missions.filter((mission: unknown) => {
        if (!mission.completedAt) {
          return false;
        }
        const completedAt = mission.completedAt.toDate();
        return completedAt >= period.startDate && completedAt <= period.endDate;
      });

      const analytics = {
        totalMissions: periodMissions.length,
        averageScore:
          periodMissions.length > 0
            ? periodMissions.reduce((sum: number, m: unknown) => sum + (m.results?.finalScore ?? 0), 0) /
              periodMissions.length
            : 0,
        totalTimeSpent: periodMissions.reduce((sum: number, m: unknown) => sum + (m.results?.totalTime ?? 0), 0),
        trackBreakdown: this.calculateTrackBreakdown(periodMissions),
        difficultyBreakdown: this.calculateDifficultyBreakdown(periodMissions),
        trends: this.calculateTrends(periodMissions),
        generatedAt: new Date(),
      };

      return createSuccess(analytics);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to generate analytics'));
    }
  },

  calculateTrackBreakdown(missions: unknown[]): unknown {
    const breakdown = { exam: 0, course_tech: 0 };
    missions.forEach((mission: unknown) => {
      if (mission.track && breakdown.hasOwnProperty(mission.track)) {
        breakdown[mission.track as keyof typeof breakdown]++;
      }
    });
    return breakdown;
  },

  calculateDifficultyBreakdown(missions: unknown[]): unknown {
    const breakdown = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
    missions.forEach((mission: unknown) => {
      if (mission.difficulty && breakdown.hasOwnProperty(mission.difficulty)) {
        breakdown[mission.difficulty as keyof typeof breakdown]++;
      }
    });
    return breakdown;
  },

  calculateTrends(missions: unknown[]): unknown[] {
    return missions
      .filter((mission: unknown) => mission.completedAt && mission.results)
      .sort((a: unknown, b: unknown) => a.completedAt.toDate().getTime() - b.completedAt.toDate().getTime())
      .map((mission: unknown) => ({
        date: mission.completedAt.toDate(),
        score: mission.results?.finalScore ?? 0,
        timeSpent: mission.results?.totalTime ?? 0,
      }));
  },

  clearMissionCache(userId: string): void {
    // Clear relevant cache entries
    if (firebaseService.cache) {
      firebaseService.cache.delete(`users/${userId}/active-missions`);
      firebaseService.cache.delete(`users/${userId}/mission-history`);
      firebaseService.cache.delete(`users/${userId}/mission-templates`);
    }
  },
};

/**
 * Enhanced micro-learning system operations
 */
export const microLearningFirebaseService = {
  async saveSession(userId: string, session: unknown): Promise<Result<string>> {
    const sessionId = doc(collection(db, `users/${userId}/micro-learning-sessions`)).id;
    const sessionData = {
      ...session,
      id: sessionId,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    const result = await firebaseService.setDocument(`users/${userId}/micro-learning-sessions`, sessionId, sessionData);

    return result.success ? createSuccess(sessionId) : result;
  },

  async getSessionHistory(userId: string, limit = 20): Promise<Result<unknown[]>> {
    return firebaseService.queryCollection(`users/${userId}/micro-learning-sessions`, {
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
      limit,
      useCache: true,
      cacheTTL: 300000, // 5 minutes
    });
  },

  async saveRecommendations(userId: string, recommendations: unknown[]): Promise<Result<void>> {
    const recommendationsData = {
      recommendations,
      generatedAt: Timestamp.fromDate(new Date()),
      expiresAt: Timestamp.fromDate(new Date(Date.now() + 24 * 60 * 60 * 1000)), // 24 hours
    };

    return firebaseService.setDocument(`users/${userId}/micro-learning`, 'recommendations', recommendationsData);
  },

  async getRecommendations(userId: string): Promise<Result<unknown[]>> {
    const result = await firebaseService.getDocument(
      `users/${userId}/micro-learning`,
      'recommendations',
      { useCache: true, cacheTTL: 600000 } // 10 minutes
    );

    if (!result.success || !result.data) {
      return createSuccess([]);
    }

    const data = result.data as any;

    // Check if recommendations are expired
    const now = new Date();
    if (data.expiresAt) {
      const expiresAt = data.expiresAt.toDate();
      if (now > expiresAt) {
        return createSuccess([]);
      }
    }

    return createSuccess(data.recommendations ?? []);
  },

  async updateSessionProgress(userId: string, sessionId: string, progress: unknown): Promise<Result<void>> {
    return firebaseService.updateDocument(`users/${userId}/micro-learning-sessions`, sessionId, {
      progress,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  async saveUserPreferences(userId: string, preferences: unknown): Promise<Result<void>> {
    return firebaseService.setDocument(`users/${userId}/micro-learning`, 'preferences', {
      ...preferences,
      updatedAt: Timestamp.fromDate(new Date()),
    });
  },

  async getUserPreferences(userId: string): Promise<Result<unknown>> {
    return firebaseService.getDocument(
      `users/${userId}/micro-learning`,
      'preferences',
      { useCache: true, cacheTTL: 3600000 } // 1 hour
    );
  },

  async getSessionAnalytics(userId: string, period: { startDate: Date; endDate: Date }): Promise<Result<unknown>> {
    const sessionsResult = await firebaseService.queryCollection(`users/${userId}/micro-learning-sessions`, {
      where: [
        { field: 'createdAt', operator: '>=', value: Timestamp.fromDate(period.startDate) },
        { field: 'createdAt', operator: '<=', value: Timestamp.fromDate(period.endDate) },
      ],
      orderBy: [{ field: 'createdAt', direction: 'desc' }],
    });

    if (!sessionsResult.success) {
      return sessionsResult;
    }

    const sessions = sessionsResult.data;
    const analytics = {
      period,
      totalSessions: sessions.length,
      totalTimeSpent: sessions.reduce((sum: number, s: unknown) => sum + (s.duration ?? 0), 0),
      averageAccuracy:
        sessions.length > 0
          ? sessions.reduce((sum: number, s: unknown) => sum + (s.progress?.accuracy ?? 0), 0) / sessions.length
          : 0,
      trackBreakdown: {
        exam: sessions.filter((s: unknown) => s.learningTrack === 'exam').length,
        course_tech: sessions.filter((s: unknown) => s.learningTrack === 'course_tech').length,
      },
      generatedAt: new Date(),
    };

    return createSuccess(analytics);
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export { FirebaseService, CacheService, firebaseService };

// Export the enhanced firebase service as default
export default firebaseService;
