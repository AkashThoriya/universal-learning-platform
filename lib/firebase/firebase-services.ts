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
  arrayUnion,
  DocumentData,
} from 'firebase/firestore';

import {
  AdaptiveTest,
  TestSession,
  TestResponse,
  AdaptiveQuestion,
  QuestionBank,
  TestAnalyticsData,
  TestRecommendation,
} from '@/types/adaptive-testing';
import { UserJourney, UpdateJourneyProgressRequest, JourneyAnalytics, MilestoneAchievement } from '@/types/journey';
import { MissionDifficulty } from '@/types/mission-system';

import { User, UserStats, TopicProgress, MockTestLog } from '@/types/exam';

import { db } from './firebase';
import { serviceContainer, PerformanceMonitor, ConsoleLogger } from '@/lib/services/service-layer';
import { Result, createSuccess, createError, LoadingState as _LoadingState } from '@/lib/utils/types-utils';

// ============================================================================
// ADAPTIVE TESTING FIREBASE SERVICE
// ============================================================================

// Local interfaces for service-specific data
interface RecommendationsData {
  recommendations?: unknown[];
  expiresAt?: { toDate(): Date };
}

interface MissionData {
  id?: string | undefined;
  track?: string | undefined;
  difficulty?: string | undefined;
  completedAt?: { toDate(): Date } | undefined;
  results?:
    | {
        finalScore?: number | undefined;
        totalTime?: number | undefined;
      }
    | undefined;
  status?: string | undefined;
  createdAt?: { toDate(): Date } | undefined;
}

interface TrackBreakdown {
  exam: number;
  course_tech: number;
}

interface DifficultyBreakdown {
  beginner: number;
  intermediate: number;
  advanced: number;
  expert: number;
}

interface TrendData {
  date: Date;
  score: number;
  timeSpent: number;
}

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

    return entry.data as T;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  private cleanup(): void {
    const now = Date.now();
    const keysToDelete: string[] = [];

    this.cache.forEach((entry, key) => {
      if (now - entry.timestamp > entry.ttl) {
        keysToDelete.push(key);
      }
    });

    keysToDelete.forEach(key => this.cache.delete(key));
  }

  destroy(): void {
    clearInterval(this.cleanupInterval);
    this.clear();
  }

  getStats(): { size: number; keys: string[] } {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
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
  async setDocument<T extends DocumentData>(
    collectionPath: string,
    docId: string,
    data: T,
    options: { merge?: boolean; invalidateCache?: boolean } = {}
  ): Promise<Result<void>> {
    const { merge = false, invalidateCache = true } = options;

    try {
      await this.monitor.measure(`setDocument:${collectionPath}:${docId}`, async () => {
        const docRef = doc(db, collectionPath, docId);
        await setDoc(docRef, data, { merge });
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
          q = query(q, where(condition.field, condition.operator as any, condition.value));
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
                ...safeSpread(op.data),
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
    return this.cache.getStats();
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
 * Utility function to safely spread unknown objects
 */
function safeSpread(obj: unknown): Record<string, unknown> {
  return obj && typeof obj === 'object' && obj !== null && !Array.isArray(obj) ? (obj as Record<string, unknown>) : {};
}

/**
 * Type guard to check if an unknown object has mission-like properties
 */
function isMissionLike(obj: unknown): obj is Record<string, unknown> {
  return !!(obj && typeof obj === 'object' && obj !== null && !Array.isArray(obj));
}

/**
 * Safely extract mission properties with defaults
 */
function extractMissionData(mission: unknown): MissionData {
  if (!isMissionLike(mission)) {
    return {};
  }

  const missionObj = mission;
  return {
    id: typeof missionObj.id === 'string' ? missionObj.id : undefined,
    track: typeof missionObj.track === 'string' ? missionObj.track : undefined,
    difficulty: typeof missionObj.difficulty === 'string' ? missionObj.difficulty : undefined,
    completedAt:
      missionObj.completedAt && typeof missionObj.completedAt === 'object' && 'toDate' in missionObj.completedAt
        ? (missionObj.completedAt as { toDate(): Date })
        : undefined,
    results:
      missionObj.results && typeof missionObj.results === 'object'
        ? (missionObj.results as { finalScore?: number; totalTime?: number })
        : undefined,
    status: typeof missionObj.status === 'string' ? missionObj.status : undefined,
    createdAt:
      missionObj.createdAt && typeof missionObj.createdAt === 'object' && 'toDate' in missionObj.createdAt
        ? (missionObj.createdAt as { toDate(): Date })
        : undefined,
  };
}

/**
 * Safely extract session properties with defaults
 */
function extractSessionData(session: unknown): {
  duration?: number | undefined;
  progress?: { accuracy?: number } | undefined;
  learningTrack?: string | undefined;
} {
  if (!isMissionLike(session)) {
    return {};
  }

  const sessionObj = session;
  return {
    duration: typeof sessionObj.duration === 'number' ? sessionObj.duration : undefined,
    progress:
      sessionObj.progress && typeof sessionObj.progress === 'object'
        ? (sessionObj.progress as { accuracy?: number })
        : undefined,
    learningTrack: typeof sessionObj.learningTrack === 'string' ? sessionObj.learningTrack : undefined,
  };
}

/**
 * Enhanced user operations
 */
export const userService = {
  async create(userId: string, userData: unknown): Promise<Result<void>> {
    const userDoc = {
      ...safeSpread(userData),
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

  async get(userId: string): Promise<Result<User | null>> {
    return firebaseService.getDocument('users', userId);
  },

  async update(userId: string, updates: unknown): Promise<Result<void>> {
    return firebaseService.updateDocument('users', userId, safeSpread(updates));
  },

  async getProgress(userId: string): Promise<Result<unknown[]>> {
    return firebaseService.queryCollection(`users/${userId}/progress`, {
      orderBy: [{ field: 'lastStudied', direction: 'desc' }],
      limit: 100,
    });
  },

  async getStats(userId: string): Promise<Result<UserStats | null>> {
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
      ...safeSpread(logData),
      id: logId,
      createdAt: Timestamp.fromDate(new Date()),
    };

    const result = await firebaseService.setDocument(`users/${userId}/dailyLogs`, logId, dailyLog);

    if (result.success) {
      return createSuccess(logId);
    }
    return createError(result.error);
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
      ...safeSpread(progress),
      topicId,
      lastStudied: Timestamp.fromDate(new Date()),
    };

    return firebaseService.setDocument(`users/${userId}/progress`, topicId, progressData, { merge: true });
  },

  async getTopic(userId: string, topicId: string): Promise<Result<TopicProgress | null>> {
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
    const currentRevisionCount =
      currentProgress.success && currentProgress.data
        ? ((currentProgress.data as TopicProgress).revisionCount ?? 0)
        : 0;

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
      ...safeSpread(testData),
      id: testId,
      createdAt: Timestamp.fromDate(new Date()),
    };

    const result = await firebaseService.setDocument(`users/${userId}/logs_mocks`, testId, mockTest);

    if (result.success) {
      return createSuccess(testId);
    }
    return createError(result.error);
  },

  async getTests(userId: string, limit = 10): Promise<Result<unknown[]>> {
    return firebaseService.queryCollection(`users/${userId}/logs_mocks`, {
      orderBy: [{ field: 'date', direction: 'desc' }],
      limit,
    });
  },

  async getTest(userId: string, testId: string): Promise<Result<MockTestLog | null>> {
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
      const safeTemplate = safeSpread(template);
      const templateId = safeTemplate.id ?? doc(collection(db, `users/${userId}/mission-templates`)).id;
      return firebaseService.setDocument(`users/${userId}/mission-templates`, templateId as string, {
        ...safeTemplate,
        id: templateId,
        createdAt: safeTemplate.createdAt ?? Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      });
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to save template'));
    }
  },

  async getTemplates(userId: string, track?: string): Promise<Result<unknown[]>> {
    try {
      const options: Parameters<typeof firebaseService.queryCollection>[1] = {
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
      const safeMission = safeSpread(mission);
      const missionId = safeMission.id ?? doc(collection(db, `users/${userId}/active-missions`)).id;
      const missionData = {
        ...safeMission,
        id: missionId,
        createdAt: safeMission.createdAt ?? Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
      };

      const result = await firebaseService.setDocument(
        `users/${userId}/active-missions`,
        missionId as string,
        missionData
      );

      if (result.success) {
        return createSuccess(missionId as string);
      }
      return createError(result.error);
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
      const safeProgress = safeSpread(progress);
      const completionPercentage =
        typeof safeProgress.completionPercentage === 'number' ? safeProgress.completionPercentage : 0;
      const status = completionPercentage >= 100 ? 'completed' : 'in_progress';
      return firebaseService.updateDocument(`users/${userId}/active-missions`, missionId, {
        progress: safeProgress,
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
        ...safeSpread(mission.data),
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
        const missionData = extractMissionData(mission);
        if (!missionData.completedAt) {
          return false;
        }
        const completedAt = missionData.completedAt.toDate();
        return completedAt >= period.startDate && completedAt <= period.endDate;
      });

      const analytics = {
        totalMissions: periodMissions.length,
        averageScore:
          periodMissions.length > 0
            ? periodMissions.reduce((sum: number, m: unknown) => {
                const missionData = extractMissionData(m);
                return sum + (missionData.results?.finalScore ?? 0);
              }, 0) / periodMissions.length
            : 0,
        totalTimeSpent: periodMissions.reduce((sum: number, m: unknown) => {
          const missionData = extractMissionData(m);
          return sum + (missionData.results?.totalTime ?? 0);
        }, 0),
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

  calculateTrackBreakdown(missions: unknown[]): TrackBreakdown {
    const breakdown = { exam: 0, course_tech: 0 };
    missions.forEach((mission: unknown) => {
      const missionData = extractMissionData(mission);
      if (missionData.track && breakdown.hasOwnProperty(missionData.track)) {
        breakdown[missionData.track as keyof TrackBreakdown]++;
      }
    });
    return breakdown;
  },

  calculateDifficultyBreakdown(missions: unknown[]): DifficultyBreakdown {
    const breakdown = { beginner: 0, intermediate: 0, advanced: 0, expert: 0 };
    missions.forEach((mission: unknown) => {
      const missionData = extractMissionData(mission);
      if (missionData.difficulty && breakdown.hasOwnProperty(missionData.difficulty)) {
        breakdown[missionData.difficulty as keyof DifficultyBreakdown]++;
      }
    });
    return breakdown;
  },

  calculateTrends(missions: unknown[]): TrendData[] {
    return missions
      .filter((mission: unknown) => {
        const missionData = extractMissionData(mission);
        return missionData.completedAt && missionData.results;
      })
      .sort((a: unknown, b: unknown) => {
        const missionA = extractMissionData(a);
        const missionB = extractMissionData(b);
        const timeA = missionA.completedAt?.toDate().getTime() ?? 0;
        const timeB = missionB.completedAt?.toDate().getTime() ?? 0;
        return timeA - timeB;
      })
      .map((mission: unknown) => {
        const missionData = extractMissionData(mission);
        return {
          date: missionData.completedAt?.toDate() ?? new Date(),
          score: missionData.results?.finalScore ?? 0,
          timeSpent: missionData.results?.totalTime ?? 0,
        };
      });
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
      ...safeSpread(session),
      id: sessionId,
      createdAt: Timestamp.fromDate(new Date()),
      updatedAt: Timestamp.fromDate(new Date()),
    };

    const result = await firebaseService.setDocument(`users/${userId}/micro-learning-sessions`, sessionId, sessionData);

    if (result.success) {
      return createSuccess(sessionId);
    }
    return createError(result.error);
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

    const data = result.data as RecommendationsData;

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
      ...safeSpread(preferences),
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
      totalTimeSpent: sessions.reduce((sum: number, s: unknown) => {
        const sessionData = extractSessionData(s);
        return sum + (sessionData.duration ?? 0);
      }, 0),
      averageAccuracy:
        sessions.length > 0
          ? sessions
              .map((s: unknown) => {
                const sessionData = extractSessionData(s);
                return sessionData.progress?.accuracy ?? 0;
              })
              .filter((accuracy: number) => typeof accuracy === 'number')
              .reduce((sum: number, accuracy: number) => sum + accuracy, 0) / sessions.length
          : 0,
      trackBreakdown: {
        exam: sessions.filter((s: unknown) => {
          const sessionData = extractSessionData(s);
          return sessionData.learningTrack === 'exam';
        }).length,
        course_tech: sessions.filter((s: unknown) => {
          const sessionData = extractSessionData(s);
          return sessionData.learningTrack === 'course_tech';
        }).length,
      },
      generatedAt: new Date(),
    };

    return createSuccess(analytics);
  },
};

// ============================================================================
// CUSTOM LEARNING SERVICE (Phase 2 - Universal Learning Platform)
// ============================================================================

/**
 * Custom Learning Service for Universal Learning Platform
 * Extends existing Firebase infrastructure to support custom learning goals
 */
export const customLearningService = {
  /**
   * Create custom learning mission using existing infrastructure
   */
  async createCustomMission(userId: string, goalId: string, content: any[]): Promise<Result<any>> {
    const monitor = new PerformanceMonitor();

    try {
      const mission = await monitor.measure(`createCustomMission:${userId}:${goalId}`, async () => {
        const missionData = {
          id: `custom_${Date.now()}`,
          userId,
          templateId: 'custom_template',
          track: 'custom_skill',
          frequency: 'custom',
          title: `Custom Learning Mission`,
          description: `Custom learning mission for goal ${goalId}`,
          difficulty: 'intermediate',
          estimatedDuration: content.reduce((sum: number, module: any) => sum + (module.estimatedTime ?? 30), 0),
          content: {
            type: 'custom_module',
            customContent: content,
          },
          status: 'not_started',
          scheduledAt: new Date(),
          deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
          progress: {
            completedSteps: 0,
            totalSteps: content.length,
            currentStep: 0,
            timeSpent: 0,
            accuracy: 0,
            submissions: [],
          },
          personaOptimizations: {
            timeAllocation: {},
            difficultyAdjustment: 0,
            contentPreferences: [],
            motivationalElements: [],
          },
          createdAt: new Date(),
          updatedAt: new Date(),
          isCustomLearningPath: true,
          customGoal: goalId,
          customContent: content,
        };

        // Save mission using existing pattern
        const docRef = doc(db, 'users', userId, 'missions', missionData.id);
        await setDoc(docRef, {
          ...missionData,
          createdAt: Timestamp.fromDate(missionData.createdAt),
          updatedAt: Timestamp.fromDate(missionData.updatedAt),
          scheduledAt: Timestamp.fromDate(missionData.scheduledAt),
          deadline: Timestamp.fromDate(missionData.deadline),
        });

        return missionData;
      });

      return createSuccess(mission);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create custom mission'));
    }
  },

  /**
   * Save custom goal using existing Firebase patterns
   */
  async saveCustomGoal(userId: string, goal: any): Promise<Result<void>> {
    const monitor = new PerformanceMonitor();

    try {
      await monitor.measure(`saveCustomGoal:${userId}:${goal.id}`, async () => {
        const docRef = doc(db, 'users', userId, 'custom_goals', goal.id);
        await setDoc(docRef, {
          ...goal,
          createdAt: Timestamp.fromDate(goal.createdAt),
          updatedAt: Timestamp.fromDate(goal.updatedAt),
          progress: {
            ...goal.progress,
            estimatedCompletion: Timestamp.fromDate(goal.progress.estimatedCompletion),
          },
        });
      });

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to save custom goal'));
    }
  },

  /**
   * Get user's custom goals
   */
  async getUserCustomGoals(userId: string): Promise<Result<any[]>> {
    const monitor = new PerformanceMonitor();

    try {
      const goals = await monitor.measure(`getUserCustomGoals:${userId}`, async () => {
        const goalsCollection = collection(db, 'users', userId, 'custom_goals');
        const snapshot = await getDocs(goalsCollection);

        return snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return {
            ...data,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
            progress: {
              ...data.progress,
              estimatedCompletion: data.progress?.estimatedCompletion?.toDate() ?? new Date(),
            },
          };
        });
      });

      return createSuccess(goals);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get custom goals'));
    }
  },

  /**
   * Update custom goal progress
   */
  async updateCustomGoalProgress(userId: string, goalId: string, progressUpdate: any): Promise<Result<void>> {
    const monitor = new PerformanceMonitor();

    try {
      await monitor.measure(`updateCustomGoalProgress:${userId}:${goalId}`, async () => {
        const docRef = doc(db, 'users', userId, 'custom_goals', goalId);
        await updateDoc(docRef, {
          progress: progressUpdate,
          updatedAt: Timestamp.now(),
        });
      });

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update custom goal progress'));
    }
  },

  /**
   * Get custom missions for a specific goal
   */
  async getCustomMissions(userId: string, goalId: string): Promise<Result<any[]>> {
    const monitor = new PerformanceMonitor();

    try {
      const missions = await monitor.measure(`getCustomMissions:${userId}:${goalId}`, async () => {
        const missionsCollection = collection(db, 'users', userId, 'missions');
        const customMissionsQuery = query(
          missionsCollection,
          where('isCustomLearningPath', '==', true),
          where('customGoal', '==', goalId),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(customMissionsQuery);
        return snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return {
            ...data,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
            scheduledAt: data.scheduledAt?.toDate() ?? new Date(),
            deadline: data.deadline?.toDate() ?? new Date(),
          };
        });
      });

      return createSuccess(missions);
    } catch (error: any) {
      // Check if this is a Firebase index error
      const isIndexError = error?.code === 'failed-precondition' && error?.message?.includes('index');

      if (isIndexError) {
        console.log('Firestore indexes are still building, returning empty custom missions', { userId, goalId });
        return createSuccess([]);
      }

      return createError(error instanceof Error ? error : new Error('Failed to get custom missions'));
    }
  },

  /**
   * Create custom goal from template
   */
  async createCustomGoalFromTemplate(userId: string, templateId: string, customizations?: any): Promise<Result<any>> {
    const monitor = new PerformanceMonitor();

    try {
      const customGoal = await monitor.measure(`createFromTemplate:${userId}:${templateId}`, async () => {
        const { LearningTemplateService } = await import('@/lib/data/learning-templates');

        const template = LearningTemplateService.getTemplateById(templateId);
        if (!template) {
          throw new Error('Template not found');
        }

        const goalData = {
          ...template,
          userId,
          id: `goal_${Date.now()}`,
          createdAt: new Date(),
          updatedAt: new Date(),
          missions: [],
          isActive: true,
          ...customizations,
        };

        // Save the custom goal
        const saveResult = await this.saveCustomGoal(userId, goalData);
        if (!saveResult.success) {
          throw saveResult.error;
        }

        return goalData;
      });

      return createSuccess(customGoal);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create custom goal from template'));
    }
  },

  /**
   * Get learning analytics for custom goals
   */
  async getCustomLearningAnalytics(userId: string): Promise<Result<any>> {
    const monitor = new PerformanceMonitor();

    try {
      const analytics = await monitor.measure(`getCustomLearningAnalytics:${userId}`, async () => {
        const [goalsResult, missionsResult] = await Promise.all([
          this.getUserCustomGoals(userId),
          this.getAllCustomMissions(userId),
        ]);

        if (!goalsResult.success || !missionsResult.success) {
          throw new Error('Failed to load analytics data');
        }

        const goals = goalsResult.data;
        const missions = missionsResult.data;

        return {
          totalGoals: goals.length,
          activeGoals: goals.filter((goal: any) => goal.isActive).length,
          completedGoals: goals.filter((goal: any) => goal.progress.completedMissions === goal.progress.totalMissions)
            .length,
          totalMissions: missions.length,
          completedMissions: missions.filter((mission: any) => mission.status === 'completed').length,
          totalLearningHours:
            missions.reduce((sum: number, mission: any) => sum + (mission.progress?.timeSpent ?? 0), 0) / 60, // Convert to hours
          categoriesActive: Array.from(new Set(goals.map((goal: any) => goal.category))),
          streakDays: Math.max(...goals.map((goal: any) => goal.progress.currentStreak ?? 0)),
          averageProgress:
            goals.length > 0
              ? (goals.reduce(
                  (sum: number, goal: any) =>
                    sum + goal.progress.completedMissions / Math.max(goal.progress.totalMissions, 1),
                  0
                ) /
                  goals.length) *
                100
              : 0,
        };
      });

      return createSuccess(analytics);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get custom learning analytics'));
    }
  },

  /**
   * Helper method to get all custom missions for a user
   */
  async getAllCustomMissions(userId: string): Promise<Result<any[]>> {
    const monitor = new PerformanceMonitor();

    try {
      const missions = await monitor.measure(`getAllCustomMissions:${userId}`, async () => {
        const missionsCollection = collection(db, 'users', userId, 'missions');
        const customMissionsQuery = query(
          missionsCollection,
          where('isCustomLearningPath', '==', true),
          orderBy('createdAt', 'desc')
        );

        const snapshot = await getDocs(customMissionsQuery);
        return snapshot.docs.map(docSnapshot => {
          const data = docSnapshot.data();
          return {
            ...data,
            createdAt: data.createdAt?.toDate() ?? new Date(),
            updatedAt: data.updatedAt?.toDate() ?? new Date(),
            scheduledAt: data.scheduledAt?.toDate() ?? new Date(),
            deadline: data.deadline?.toDate() ?? new Date(),
          };
        });
      });

      return createSuccess(missions);
    } catch (error: any) {
      // Check if this is a Firebase index error
      const isIndexError = error?.code === 'failed-precondition' && error?.message?.includes('index');

      if (isIndexError) {
        console.log('Firestore indexes are still building, returning empty custom missions list', { userId });
        return createSuccess([]);
      }

      return createError(error instanceof Error ? error : new Error('Failed to get all custom missions'));
    }
  },
};

// Adaptive Testing collections
const ADAPTIVE_TESTING_COLLECTIONS = {
  ADAPTIVE_TESTS: 'adaptiveTests',
  TEST_SESSIONS: 'testSessions',
  QUESTION_BANKS: 'questionBanks',
  TEST_RESPONSES: 'testResponses',
  ADAPTIVE_ANALYTICS: 'adaptiveAnalytics',
  QUESTION_BANK_ITEMS: 'questionBankItems',
  TEST_JOURNEY_LINKS: 'testJourneyLinks',
  USER_TEST_PREFERENCES: 'userTestPreferences',
} as const;

// Journey Planning collections
const JOURNEY_COLLECTIONS = {
  USER_JOURNEYS: 'userJourneys',
  JOURNEY_TEMPLATES: 'journeyTemplates',
  JOURNEY_ANALYTICS: 'journeyAnalytics',
  JOURNEY_MILESTONES: 'journeyMilestones',
  JOURNEY_COLLABORATORS: 'journeyCollaborators',
  JOURNEY_COMMENTS: 'journeyComments',
  JOURNEY_INVITATIONS: 'journeyInvitations',
  WEEKLY_PROGRESS: 'weeklyProgress',
} as const;

/**
 * Enhanced Adaptive Testing Firebase Service
 * Integrates with existing Firebase infrastructure for adaptive testing
 */
const adaptiveTestingFirebaseService = {
  /**
   * Create a new adaptive test
   */
  async createAdaptiveTest(_userId: string, test: AdaptiveTest): Promise<Result<AdaptiveTest>> {
    try {
      const testRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.ADAPTIVE_TESTS, test.id);
      await setDoc(testRef, {
        ...test,
        createdAt: Timestamp.fromDate(test.createdAt),
        updatedAt: Timestamp.fromDate(test.updatedAt),
        completedAt: test.completedAt ? Timestamp.fromDate(test.completedAt) : null,
      });

      // Link to user's progress if applicable
      if (test.linkedJourneyId) {
        await this.linkTestToJourney(test.id, test.linkedJourneyId);
      }

      return createSuccess(test);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create adaptive test'));
    }
  },

  /**
   * Start a test session
   */
  async startTestSession(sessionData: TestSession): Promise<Result<TestSession>> {
    try {
      const sessionRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.TEST_SESSIONS, sessionData.id);
      await setDoc(sessionRef, {
        ...sessionData,
        startedAt: Timestamp.fromDate(sessionData.startedAt),
        lastActivity: Timestamp.fromDate(sessionData.lastActivity),
      });

      return createSuccess(sessionData);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to start test session'));
    }
  },

  /**
   * Submit a test response
   */
  async submitTestResponse(response: TestResponse): Promise<Result<void>> {
    try {
      const responseRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.TEST_RESPONSES, `${response.questionId}_${Date.now()}`);

      await setDoc(responseRef, {
        ...response,
        timestamp: Timestamp.fromDate(response.timestamp),
      });

      // Update test session with real-time data
      await this.updateTestSession(response);

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to submit test response'));
    }
  },

  /**
   * Get user's adaptive tests with real-time updates
   */
  subscribeToUserTests(userId: string, callback: (tests: AdaptiveTest[]) => void): () => void {
    const q = query(
      collection(db, ADAPTIVE_TESTING_COLLECTIONS.ADAPTIVE_TESTS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return _onSnapshot(q, snapshot => {
      const tests = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() ?? new Date(),
        updatedAt: doc.data().updatedAt?.toDate() ?? new Date(),
        completedAt: doc.data().completedAt?.toDate() ?? null,
      })) as AdaptiveTest[];

      callback(tests);
    });
  },

  /**
   * Get question bank for test generation
   */
  async getQuestionBank(
    subjects: string[],
    difficulties: MissionDifficulty[],
    maxQuestions = 100
  ): Promise<Result<AdaptiveQuestion[]>> {
    try {
      const questionsRef = collection(db, ADAPTIVE_TESTING_COLLECTIONS.QUESTION_BANK_ITEMS);
      const q = query(
        questionsRef,
        where('subject', 'in', subjects.slice(0, 10)), // Firestore limit
        where('difficulty', 'in', difficulties),
        orderBy('discriminationIndex', 'desc'),
        orderBy('successRate', 'asc'),
        limit(maxQuestions)
      );

      const snapshot = await getDocs(q);
      const questions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as AdaptiveQuestion[];

      return createSuccess(questions);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get question bank'));
    }
  },

  /**
   * Get adaptive test by ID
   */
  async getAdaptiveTest(testId: string): Promise<Result<AdaptiveTest | null>> {
    try {
      const testRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.ADAPTIVE_TESTS, testId);
      const testSnap = await getDoc(testRef);

      if (!testSnap.exists()) {
        return createSuccess(null);
      }

      const testData = testSnap.data();
      const test: AdaptiveTest = {
        ...testData,
        id: testId,
        createdAt: testData.createdAt?.toDate() ?? new Date(),
        updatedAt: testData.updatedAt?.toDate() ?? new Date(),
        completedAt: testData.completedAt?.toDate() ?? null,
      } as AdaptiveTest;

      return createSuccess(test);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get adaptive test'));
    }
  },

  /**
   * Update test session during test
   */
  async updateTestSession(response: TestResponse): Promise<Result<void>> {
    try {
      // Find session by looking for active sessions with the question's test
      const sessionsRef = collection(db, ADAPTIVE_TESTING_COLLECTIONS.TEST_SESSIONS);
      const q = query(sessionsRef, where('isPaused', '==', false), orderBy('lastActivity', 'desc'), limit(1));

      const snapshot = await getDocs(q);
      if (snapshot.empty) {
        return createError(new Error('No active session found'));
      }

      const sessionDoc = snapshot.docs[0];
      if (!sessionDoc) {
        return createError(new Error('Session document not found'));
      }

      const sessionRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.TEST_SESSIONS, sessionDoc.id);

      await updateDoc(sessionRef, {
        lastActivity: Timestamp.fromDate(new Date()),
        currentAbilityEstimate: response.estimatedAbility,
        'sessionMetrics.questionsAnswered': (sessionDoc.data().sessionMetrics?.questionsAnswered ?? 0) + 1,
        'sessionMetrics.averageResponseTime': response.responseTime,
      });

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update test session'));
    }
  },

  /**
   * Complete a test and update all related data
   */
  async completeTest(testId: string, performance: any, metrics: any): Promise<Result<void>> {
    try {
      const testRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.ADAPTIVE_TESTS, testId);

      await updateDoc(testRef, {
        status: 'completed',
        completedAt: Timestamp.fromDate(new Date()),
        updatedAt: Timestamp.fromDate(new Date()),
        performance,
        adaptiveMetrics: metrics,
      });

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to complete test'));
    }
  },

  /**
   * Link test to journey planning system
   */
  async linkTestToJourney(testId: string, journeyId: string): Promise<Result<void>> {
    try {
      const linkRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.TEST_JOURNEY_LINKS, `${testId}_${journeyId}`);
      await setDoc(linkRef, {
        testId,
        journeyId,
        linkedAt: Timestamp.now(),
        status: 'active',
      });

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to link test to journey'));
    }
  },

  /**
   * Get test recommendations for a user
   */
  async getTestRecommendations(_userId: string): Promise<Result<TestRecommendation[]>> {
    try {
      // This would integrate with the recommendation engine
      // For now, return a placeholder implementation
      const recommendations: TestRecommendation[] = [
        {
          testId: `recommended_${Date.now()}`,
          title: 'Weekly Progress Assessment',
          description: 'Evaluate your progress this week across all subjects',
          confidence: 0.85,
          reasons: ['Consistent study pattern detected', 'Time for progress validation'],
          subjects: ['Mathematics', 'General Knowledge'],
          questionCount: 20,
          estimatedDuration: 30,
          tags: ['weekly', 'progress', 'assessment'],
          priority: 'medium',
          difficulty: 'intermediate',
          adaptiveConfig: {
            algorithmType: 'CAT',
            convergenceCriteria: {
              standardError: 0.3,
              minQuestions: 10,
              maxQuestions: 30,
            },
            difficultyRange: {
              min: 'beginner',
              max: 'advanced',
            },
          },
          expectedBenefit: 'Assess current learning progress and identify areas for improvement',
          missionAlignment: 0.9,
          estimatedAccuracy: 0.85,
          aiGenerated: true,
          createdFrom: 'recommendation',
          linkedMissions: [],
          estimatedBenefit_old: {
            abilityImprovement: 0.15,
            weaknessAddressing: ['Current affairs', 'Quantitative aptitude'],
            journeyAlignment: 0.9,
          },
          optimalTiming: {
            recommendedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
            dependsOn: ['Complete pending missions'],
          },
        },
      ];

      return createSuccess(recommendations);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get test recommendations'));
    }
  },

  /**
   * Analytics and reporting
   */
  async getTestAnalytics(userId: string, dateRange?: { start: Date; end: Date }): Promise<Result<TestAnalyticsData>> {
    try {
  const endDate = dateRange?.end ?? new Date();
  const startDate = dateRange?.start ?? new Date(endDate.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Get user's tests in the date range
      const testsRef = collection(db, ADAPTIVE_TESTING_COLLECTIONS.ADAPTIVE_TESTS);
      const q = query(
        testsRef,
        where('userId', '==', userId),
        where('completedAt', '>=', Timestamp.fromDate(startDate)),
        where('completedAt', '<=', Timestamp.fromDate(endDate)),
        orderBy('completedAt', 'desc')
      );

      const snapshot = await getDocs(q);
      const tests = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        completedAt: doc.data().completedAt?.toDate(),
      })) as AdaptiveTest[];

      // Calculate analytics
      const analytics: TestAnalyticsData = {
        userId,
        period: { startDate, endDate },
        overallMetrics: {
          testsCompleted: tests.length,
          averageAccuracy: (tests.length > 0 ? tests.reduce((sum, test) => sum + (test.performance?.accuracy ?? 0), 0) / tests.length : 0),
          averageAbilityEstimate: (tests.length > 0 ? tests.reduce((sum, test) => sum + (test.performance?.finalAbilityEstimate ?? 0), 0) / tests.length : 0),
          totalTimeSpent: tests.reduce((sum, test) => sum + (test.performance?.totalTime ?? 0), 0),
          improvementTrend: 'stable', // This would be calculated based on historical data
        },
        subjectAnalytics: [],
        adaptiveInsights: {
          optimalTestFrequency: 3,
          bestPerformanceTimeOfDay: 'morning',
          strongSubjects: [],
          weakSubjects: [],
          nextRecommendedTest: {
            testId: `next_${Date.now()}`,
            title: 'Suggested Next Test',
            description: 'Based on your recent performance',
            confidence: 0.7,
            reasons: ['Maintain learning momentum'],
            subjects: ['Mathematics'],
            questionCount: 15,
            estimatedDuration: 20,
            tags: ['next', 'suggested'],
            priority: 'medium',
            difficulty: 'intermediate',
            adaptiveConfig: {
              algorithmType: 'CAT',
              convergenceCriteria: {
                standardError: 0.3,
                minQuestions: 10,
                maxQuestions: 20,
              },
              difficultyRange: {
                min: 'beginner',
                max: 'advanced',
              },
            },
            expectedBenefit: 'Continue progress and maintain learning momentum',
            missionAlignment: 0.8,
            estimatedAccuracy: 0.75,
            aiGenerated: true,
            createdFrom: 'recommendation',
            linkedMissions: [],
            estimatedBenefit_old: {
              abilityImprovement: 0.1,
              weaknessAddressing: [],
              journeyAlignment: 0.8,
            },
            optimalTiming: {
              recommendedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000),
              dependsOn: [],
            },
          },
        },
      };

      return createSuccess(analytics);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get test analytics'));
    }
  },

  /**
   * Save question bank for future use
   */
  async saveQuestionBank(questionBank: QuestionBank): Promise<Result<void>> {
    try {
      const bankRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.QUESTION_BANKS, questionBank.id);
      await setDoc(bankRef, {
        ...questionBank,
        lastCalibrated: Timestamp.fromDate(questionBank.lastCalibrated),
      });

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to save question bank'));
    }
  },

  /**
   * Save individual questions to the question bank
   */
  async saveQuestions(questions: AdaptiveQuestion[]): Promise<Result<void>> {
    try {
      const batch = writeBatch(db);

      questions.forEach(question => {
        const questionRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.QUESTION_BANK_ITEMS, question.id);
        batch.set(questionRef, question);
      });

      await batch.commit();
      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to save questions'));
    }
  },

  /**
   * Get test session by ID
   */
  async getTestSession(sessionId: string): Promise<Result<TestSession | null>> {
    try {
      const sessionRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.TEST_SESSIONS, sessionId);
      const sessionSnap = await getDoc(sessionRef);

      if (!sessionSnap.exists()) {
        return createSuccess(null);
      }

      const sessionData = sessionSnap.data();
      const session: TestSession = {
        ...sessionData,
        id: sessionId,
        startedAt: sessionData.startedAt?.toDate() ?? new Date(),
        lastActivity: sessionData.lastActivity?.toDate() ?? new Date(),
      } as TestSession;

      return createSuccess(session);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get test session'));
    }
  },

  /**
   * Update test progress and status
   */
  async updateTest(testId: string, updates: Partial<AdaptiveTest>): Promise<Result<void>> {
    try {
      const testRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.ADAPTIVE_TESTS, testId);
      const updateData = {
        ...updates,
        updatedAt: Timestamp.fromDate(new Date()),
      };

      await updateDoc(testRef, updateData);
      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update test'));
    }
  },

  /**
   * Delete a test and all associated data
   */
  async deleteTest(testId: string): Promise<Result<void>> {
    try {
      const batch = writeBatch(db);

      // Delete test
      const testRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.ADAPTIVE_TESTS, testId);
      batch.delete(testRef);

      // Delete associated sessions
      const sessionsRef = collection(db, ADAPTIVE_TESTING_COLLECTIONS.TEST_SESSIONS);
      const sessionsQuery = query(sessionsRef, where('testId', '==', testId));
      const sessionsSnapshot = await getDocs(sessionsQuery);
      sessionsSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Delete associated responses
      const responsesRef = collection(db, ADAPTIVE_TESTING_COLLECTIONS.TEST_RESPONSES);
      const responsesQuery = query(responsesRef, where('testId', '==', testId));
      const responsesSnapshot = await getDocs(responsesQuery);
      responsesSnapshot.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      await batch.commit();
      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to delete test'));
    }
  },

  /**
   * Get all responses for a test
   */
  async getTestResponses(testId: string): Promise<Result<TestResponse[]>> {
    try {
      const responsesRef = collection(db, ADAPTIVE_TESTING_COLLECTIONS.TEST_RESPONSES);
      const q = query(responsesRef, where('testId', '==', testId), orderBy('timestamp', 'asc'));

      const snapshot = await getDocs(q);
      const responses = snapshot.docs.map(doc => ({
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate() ?? new Date(),
      })) as TestResponse[];

      return createSuccess(responses);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get test responses'));
    }
  },
};

// ============================================================================
// JOURNEY PLANNING FIREBASE SERVICE
// ============================================================================

/**
 * Journey Planning Firebase Service
 * Integrates with existing Firebase infrastructure for journey management
 */
const journeyFirebaseService = {
  /**
   * Create a new journey
   */
  async createJourney(userId: string, journey: UserJourney): Promise<Result<UserJourney>> {
    try {
      const journeyRef = doc(db, JOURNEY_COLLECTIONS.USER_JOURNEYS, journey.id);
      await setDoc(journeyRef, {
        ...journey,
        createdAt: Timestamp.fromDate(journey.createdAt),
        updatedAt: Timestamp.fromDate(journey.updatedAt),
        targetCompletionDate: Timestamp.fromDate(journey.targetCompletionDate),
        customGoals: journey.customGoals.map(goal => ({
          ...goal,
          deadline: Timestamp.fromDate(goal.deadline),
        })),
        progressTracking: {
          ...journey.progressTracking,
          lastSyncedAt: Timestamp.fromDate(journey.progressTracking.lastSyncedAt),
          weeklyProgress: journey.progressTracking.weeklyProgress.map(week => ({
            ...week,
            weekStarting: Timestamp.fromDate(week.weekStarting),
          })),
          milestoneAchievements: journey.progressTracking.milestoneAchievements.map(milestone => ({
            ...milestone,
            achievedAt: Timestamp.fromDate(milestone.achievedAt),
          })),
        },
      });

      // Link journey to user's progress
      await this.linkJourneyToProgress(userId, journey.id);

      return createSuccess(journey);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create journey'));
    }
  },

  /**
   * Get user's journeys with real-time updates
   */
  subscribeToUserJourneys(userId: string, callback: (journeys: UserJourney[]) => void): () => void {
    const q = query(
      collection(db, JOURNEY_COLLECTIONS.USER_JOURNEYS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return _onSnapshot(q, (snapshot: any) => {
      const journeys = snapshot.docs.map((doc: any) => {
        const data = doc.data();
        return {
          ...data,
          id: doc.id,
          createdAt: data.createdAt?.toDate() ?? new Date(),
          updatedAt: data.updatedAt?.toDate() ?? new Date(),
          targetCompletionDate: data.targetCompletionDate?.toDate() ?? new Date(),
          customGoals:
            data.customGoals?.map((goal: any) => ({
              ...goal,
              deadline: goal.deadline?.toDate() ?? new Date(),
            })) ?? [],
          progressTracking: {
            ...data.progressTracking,
            lastSyncedAt: data.progressTracking?.lastSyncedAt?.toDate() ?? new Date(),
            weeklyProgress:
              data.progressTracking?.weeklyProgress?.map((week: any) => ({
                ...week,
                weekStarting: week.weekStarting?.toDate() ?? new Date(),
              })) ?? [],
            milestoneAchievements:
              data.progressTracking?.milestoneAchievements?.map((milestone: any) => ({
                ...milestone,
                achievedAt: milestone.achievedAt?.toDate() ?? new Date(),
              })) ?? [],
          },
        };
      }) as UserJourney[];

      callback(journeys);
    });
  },

  /**
   * Update journey progress
   */
  async updateJourneyProgress(journeyId: string, updates: UpdateJourneyProgressRequest): Promise<Result<void>> {
    try {
      const journeyRef = doc(db, JOURNEY_COLLECTIONS.USER_JOURNEYS, journeyId);

      // Build update object
      const updateData: any = {
        updatedAt: Timestamp.now(),
        'progressTracking.lastSyncedAt': Timestamp.now(),
      };

      // Update individual goals
      updates.goalUpdates.forEach(update => {
        updateData[`progressTracking.goalCompletions.${update.goalId}`] = update.newValue;
      });

      // Add weekly update if provided
      if (updates.weeklyUpdate) {
        updateData['progressTracking.weeklyProgress'] = arrayUnion({
          ...updates.weeklyUpdate,
          weekStarting: Timestamp.fromDate(updates.weeklyUpdate.weekStarting ?? new Date()),
        });
      }

      await updateDoc(journeyRef, updateData);
      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update journey progress'));
    }
  },

  /**
   * Get a specific journey
   */
  async getJourney(journeyId: string): Promise<Result<UserJourney>> {
    try {
      const journeyRef = doc(db, JOURNEY_COLLECTIONS.USER_JOURNEYS, journeyId);
      const journeyDoc = await getDoc(journeyRef);

      if (!journeyDoc.exists()) {
        return createError(new Error('Journey not found'));
      }

      const data = journeyDoc.data();
      const journey: UserJourney = {
        ...data,
        id: journeyDoc.id,
        createdAt: data.createdAt?.toDate() ?? new Date(),
        updatedAt: data.updatedAt?.toDate() ?? new Date(),
        targetCompletionDate: data.targetCompletionDate?.toDate() ?? new Date(),
        customGoals:
          data.customGoals?.map((goal: any) => ({
            ...goal,
            deadline: goal.deadline?.toDate() ?? new Date(),
          })) ?? [],
        progressTracking: {
          ...data.progressTracking,
          lastSyncedAt: data.progressTracking?.lastSyncedAt?.toDate() ?? new Date(),
          weeklyProgress:
            data.progressTracking?.weeklyProgress?.map((week: any) => ({
              ...week,
              weekStarting: week.weekStarting?.toDate() ?? new Date(),
            })) ?? [],
          milestoneAchievements:
            data.progressTracking?.milestoneAchievements?.map((milestone: any) => ({
              ...milestone,
              achievedAt: milestone.achievedAt?.toDate() ?? new Date(),
            })) ?? [],
        },
      } as UserJourney;

      return createSuccess(journey);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get journey'));
    }
  },

  /**
   * Update journey
   */
  async updateJourney(journeyId: string, updates: Partial<UserJourney>): Promise<Result<void>> {
    try {
      const journeyRef = doc(db, JOURNEY_COLLECTIONS.USER_JOURNEYS, journeyId);
      const updateData: any = {
        ...updates,
        updatedAt: Timestamp.now(),
      };

      // Handle date fields
      if (updates.targetCompletionDate) {
        updateData.targetCompletionDate = Timestamp.fromDate(updates.targetCompletionDate);
      }

      if (updates.customGoals) {
        updateData.customGoals = updates.customGoals.map(goal => ({
          ...goal,
          deadline: Timestamp.fromDate(goal.deadline),
        }));
      }

      await updateDoc(journeyRef, updateData);
      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update journey'));
    }
  },

  /**
   * Delete journey
   */
  async deleteJourney(journeyId: string): Promise<Result<void>> {
    try {
      // Delete the journey document
      const journeyRef = doc(db, JOURNEY_COLLECTIONS.USER_JOURNEYS, journeyId);
      await deleteDoc(journeyRef);

      // Clean up related data
      await this.cleanupJourneyData(journeyId);

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to delete journey'));
    }
  },

  /**
   * Add milestone achievement
   */
  async addMilestoneAchievement(journeyId: string, milestone: MilestoneAchievement): Promise<Result<void>> {
    try {
      const journeyRef = doc(db, JOURNEY_COLLECTIONS.USER_JOURNEYS, journeyId);
      const milestoneWithTimestamp = {
        ...milestone,
        achievedAt: Timestamp.fromDate(milestone.achievedAt),
      };

      await updateDoc(journeyRef, {
        'progressTracking.milestoneAchievements': arrayUnion(milestoneWithTimestamp),
        updatedAt: Timestamp.now(),
      });

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to add milestone achievement'));
    }
  },

  /**
   * Link journey to existing progress system
   */
  async linkJourneyToProgress(userId: string, journeyId: string): Promise<Result<void>> {
    try {
      const progressRef = doc(db, 'userProgress', userId);
      await updateDoc(progressRef, {
        linkedJourneys: arrayUnion(journeyId),
        updatedAt: Timestamp.now(),
      });
      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to link journey to progress'));
    }
  },

  /**
   * Get journey analytics
   */
  async getJourneyAnalytics(journeyId: string): Promise<Result<JourneyAnalytics>> {
    try {
      const analyticsRef = doc(db, JOURNEY_COLLECTIONS.JOURNEY_ANALYTICS, journeyId);
      const analyticsDoc = await getDoc(analyticsRef);

      if (!analyticsDoc.exists()) {
        // Generate analytics if not exists
        return this.generateJourneyAnalytics(journeyId);
      }

      const data = analyticsDoc.data();
      const analytics: JourneyAnalytics = {
        ...data,
        predictedCompletionDate: data.predictedCompletionDate?.toDate() ?? new Date(),
      } as JourneyAnalytics;

      return createSuccess(analytics);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get journey analytics'));
    }
  },

  /**
   * Generate journey analytics
   */
  async generateJourneyAnalytics(journeyId: string): Promise<Result<JourneyAnalytics>> {
    try {
      const journeyResult = await this.getJourney(journeyId);
      if (!journeyResult.success) {
        return journeyResult;
      }

      const journey = journeyResult.data;
      const now = new Date();
      const startDate = journey.createdAt;
      const targetDate = journey.targetCompletionDate;

      const totalDays = Math.ceil((targetDate.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));
      const elapsedDays = Math.ceil((now.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24));

      const completedGoals = journey.customGoals.filter(g => g.currentValue >= g.targetValue).length;

      const expectedProgress = (elapsedDays / totalDays) * 100;
      const actualProgress = journey.progressTracking.overallCompletion;

      const weeklyHours =
        journey.progressTracking.weeklyProgress.reduce((acc, week) => acc + week.hoursStudied, 0) /
        Math.max(journey.progressTracking.weeklyProgress.length, 1);

      const riskFactors = [];
      if (actualProgress < expectedProgress - 10) {
        riskFactors.push('Behind schedule');
      }
      if (weeklyHours < 10) {
        riskFactors.push('Low study hours');
      }

      const recommendations = [];
      if (riskFactors.includes('Behind schedule')) {
        recommendations.push('Increase daily study time');
        recommendations.push('Focus on high-priority goals');
      }

      const analytics: JourneyAnalytics = {
        journeyId,
        completionRate: actualProgress,
        averageWeeklyHours: weeklyHours,
        goalCompletionVelocity: completedGoals / Math.max(elapsedDays / 7, 1),
        predictedCompletionDate: new Date(
          startDate.getTime() + totalDays * (100 / Math.max(actualProgress, 1)) * 24 * 60 * 60 * 1000
        ),
        riskFactors,
        recommendations,
        comparisonWithSimilarUsers: {
          percentile: Math.min(95, Math.max(5, 50 + (actualProgress - expectedProgress))),
          averageCompletionTime: totalDays * 1.2, // Simulated data
        },
      };

      // Save analytics
      const analyticsRef = doc(db, JOURNEY_COLLECTIONS.JOURNEY_ANALYTICS, journeyId);
      await setDoc(analyticsRef, {
        ...analytics,
        predictedCompletionDate: Timestamp.fromDate(analytics.predictedCompletionDate),
        updatedAt: Timestamp.now(),
      });

      return createSuccess(analytics);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to generate journey analytics'));
    }
  },

  /**
   * Clean up journey related data when journey is deleted
   */
  async cleanupJourneyData(journeyId: string): Promise<void> {
    try {
      // Clean up analytics
      const analyticsRef = doc(db, JOURNEY_COLLECTIONS.JOURNEY_ANALYTICS, journeyId);
      await deleteDoc(analyticsRef);

      // Clean up collaborators
      const collaboratorsQuery = query(
        collection(db, JOURNEY_COLLECTIONS.JOURNEY_COLLABORATORS),
        where('journeyId', '==', journeyId)
      );
      const collaboratorsSnapshot = await getDocs(collaboratorsQuery);
      const collaboratorDeletions = collaboratorsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(collaboratorDeletions);

      // Clean up comments
      const commentsQuery = query(
        collection(db, JOURNEY_COLLECTIONS.JOURNEY_COMMENTS),
        where('journeyId', '==', journeyId)
      );
      const commentsSnapshot = await getDocs(commentsQuery);
      const commentDeletions = commentsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(commentDeletions);

      // Clean up invitations
      const invitationsQuery = query(
        collection(db, JOURNEY_COLLECTIONS.JOURNEY_INVITATIONS),
        where('journeyId', '==', journeyId)
      );
      const invitationsSnapshot = await getDocs(invitationsQuery);
      const invitationDeletions = invitationsSnapshot.docs.map(doc => deleteDoc(doc.ref));
      await Promise.all(invitationDeletions);
    } catch (error) {
      console.error('Error cleaning up journey data:', error);
    }
  },
};

// ============================================================================
// EXPORTS
// ============================================================================

export { FirebaseService, CacheService, firebaseService, adaptiveTestingFirebaseService, journeyFirebaseService };

// Export the enhanced firebase service as default
export default firebaseService;
