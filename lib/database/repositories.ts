/**
 * @fileoverview Repository Pattern Implementation
 * 
 * Base repository class that provides domain-specific data operations
 * using the database abstraction layer.
 * 
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  DatabaseProvider,
  Repository,
  DatabaseResult,
  QueryOptions,
  RealtimeSubscription
} from './interfaces';

/**
 * Abstract base repository class
 */
export abstract class BaseRepository<T extends { id: string }> implements Repository<T> {
  protected provider: DatabaseProvider;
  protected collectionName: string;

  constructor(provider: DatabaseProvider, collectionName: string) {
    this.provider = provider;
    this.collectionName = collectionName;
  }

  async findById(id: string): Promise<DatabaseResult<T | null>> {
    return this.provider.read<T>(this.collectionName, id);
  }

  async findAll(options?: QueryOptions): Promise<DatabaseResult<T[]>> {
    return this.provider.query<T>(this.collectionName, options);
  }

  async create(data: Omit<T, 'id'>): Promise<DatabaseResult<T>> {
    return this.provider.create<T>(this.collectionName, data);
  }

  async update(id: string, updates: Partial<T>): Promise<DatabaseResult<void>> {
    return this.provider.update<T>(this.collectionName, id, updates);
  }

  async delete(id: string): Promise<DatabaseResult<void>> {
    return this.provider.delete(this.collectionName, id);
  }

  async search(searchTerm: string, fields: string[]): Promise<DatabaseResult<T[]>> {
    // Implementation depends on database capabilities
    // For now, we'll do a simple field-based search
    const whereConditions = fields.map(field => ({
      field,
      operator: 'contains' as const,
      value: searchTerm
    }));

    // Note: This is a simplified search. Real implementation would use
    // full-text search capabilities of the underlying database
    return this.provider.query<T>(this.collectionName, {
      where: whereConditions.slice(0, 1) // Most databases limit OR conditions
    });
  }

  subscribe(
    callback: (data: T[]) => void,
    options?: QueryOptions
  ): RealtimeSubscription {
    return this.provider.subscribe<T>(this.collectionName, callback, options);
  }

  subscribeToDocument(
    id: string,
    callback: (data: T | null) => void
  ): RealtimeSubscription {
    return this.provider.subscribeToDocument<T>(this.collectionName, id, callback);
  }

  // Additional helper methods for common patterns
  protected async findWhere(conditions: { field: string; value: any }[]): Promise<DatabaseResult<T[]>> {
    const whereConditions = conditions.map(({ field, value }) => ({
      field,
      operator: 'eq' as const,
      value
    }));

    return this.provider.query<T>(this.collectionName, {
      where: whereConditions
    });
  }

  protected async findByField(field: string, value: any): Promise<DatabaseResult<T[]>> {
    return this.findWhere([{ field, value }]);
  }

  protected async exists(id: string): Promise<boolean> {
    const result = await this.findById(id);
    return result.success && result.data !== null;
  }

  protected async count(conditions?: { field: string; value: any }[]): Promise<DatabaseResult<number>> {
    if (!conditions) {
      return this.provider.count(this.collectionName);
    }

    const whereConditions = conditions.map(({ field, value }) => ({
      field,
      operator: 'eq' as const,
      value
    }));

    return this.provider.count(this.collectionName, {
      where: whereConditions
    });
  }
}

/**
 * Generic repository implementation for simple use cases
 */
export class GenericRepository<T extends { id: string }> extends BaseRepository<T> {
  constructor(provider: DatabaseProvider, collectionName: string) {
    super(provider, collectionName);
  }
}

/**
 * Repository factory for creating domain-specific repositories
 */
export class RepositoryFactory {
  private provider: DatabaseProvider;

  constructor(provider: DatabaseProvider) {
    this.provider = provider;
  }

  createGeneric<T extends { id: string }>(collectionName: string): Repository<T> {
    return new GenericRepository<T>(this.provider, collectionName);
  }

  // Domain-specific repository creation methods
  createUserRepository(): UserRepository {
    return new UserRepository(this.provider);
  }

  createProgressRepository(): ProgressRepository {
    return new ProgressRepository(this.provider);
  }

  createMissionRepository(): MissionRepository {
    return new MissionRepository(this.provider);
  }

  createAnalyticsRepository(): AnalyticsRepository {
    return new AnalyticsRepository(this.provider);
  }
}

// Domain-specific repository implementations

export interface User {
  id: string;
  email: string;
  name: string;
  persona?: 'student' | 'professional';
  examTargets: string[];
  createdAt: Date;
  updatedAt: Date;
}

export class UserRepository extends BaseRepository<User> {
  constructor(provider: DatabaseProvider) {
    super(provider, 'users');
  }

  async findByEmail(email: string): Promise<DatabaseResult<User | null>> {
    const result = await this.findByField('email', email);
    if (!result.success || !result.data || result.data.length === 0) {
      return { 
        success: true, 
        data: null, 
        metadata: result.metadata || { queryTime: 0, cached: false }
      };
    }
    return { 
      success: true, 
      data: result.data[0] || null, 
      metadata: result.metadata || { queryTime: 0, cached: false }
    };
  }

  async findByPersona(persona: 'student' | 'professional'): Promise<DatabaseResult<User[]>> {
    return this.findByField('persona', persona);
  }

  async updateExamTargets(userId: string, examTargets: string[]): Promise<DatabaseResult<void>> {
    return this.update(userId, { examTargets, updatedAt: new Date() });
  }
}

export interface Progress {
  id: string;
  userId: string;
  subjectId: string;
  topicId?: string;
  completionPercentage: number;
  lastStudied: Date;
  streakDays: number;
  totalTimeSpent: number;
  createdAt: Date;
  updatedAt: Date;
}

export class ProgressRepository extends BaseRepository<Progress> {
  constructor(provider: DatabaseProvider) {
    super(provider, 'progress');
  }

  async findByUser(userId: string): Promise<DatabaseResult<Progress[]>> {
    return this.findByField('userId', userId);
  }

  async findByUserAndSubject(userId: string, subjectId: string): Promise<DatabaseResult<Progress[]>> {
    return this.findWhere([
      { field: 'userId', value: userId },
      { field: 'subjectId', value: subjectId }
    ]);
  }

  async updateProgress(
    userId: string,
    subjectId: string,
    updates: Partial<Pick<Progress, 'completionPercentage' | 'lastStudied' | 'streakDays' | 'totalTimeSpent'>>
  ): Promise<DatabaseResult<void>> {
    const existingResult = await this.findByUserAndSubject(userId, subjectId);
    
    if (!existingResult.success) {
      return {
        success: false,
        error: existingResult.error || 'Failed to fetch existing progress',
        metadata: existingResult.metadata || { queryTime: 0, cached: false }
      };
    }

    if (existingResult.data && existingResult.data.length > 0 && existingResult.data[0]) {
      // Update existing progress
      const progressId = existingResult.data[0].id;
      return this.update(progressId, { ...updates, updatedAt: new Date() });
    } else {
      // Create new progress record
      const newProgress: Omit<Progress, 'id'> = {
        userId,
        subjectId,
        completionPercentage: updates.completionPercentage || 0,
        lastStudied: updates.lastStudied || new Date(),
        streakDays: updates.streakDays || 0,
        totalTimeSpent: updates.totalTimeSpent || 0,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      const createResult = await this.create(newProgress);
      return {
        success: createResult.success,
        error: createResult.error || 'Failed to create progress record',
        metadata: createResult.metadata || { queryTime: 0, cached: false }
      };
    }
  }
}

export interface Mission {
  id: string;
  userId: string;
  title: string;
  description: string;
  targetDate: Date;
  examId: string;
  status: 'active' | 'completed' | 'paused';
  progress: number;
  milestones: Array<{
    id: string;
    title: string;
    completed: boolean;
    dueDate: Date;
  }>;
  createdAt: Date;
  updatedAt: Date;
}

export class MissionRepository extends BaseRepository<Mission> {
  constructor(provider: DatabaseProvider) {
    super(provider, 'missions');
  }

  async findByUser(userId: string): Promise<DatabaseResult<Mission[]>> {
    return this.findByField('userId', userId);
  }

  async findActiveMissions(userId: string): Promise<DatabaseResult<Mission[]>> {
    return this.findWhere([
      { field: 'userId', value: userId },
      { field: 'status', value: 'active' }
    ]);
  }

  async findByExam(examId: string): Promise<DatabaseResult<Mission[]>> {
    return this.findByField('examId', examId);
  }

  async updateMissionProgress(missionId: string, progress: number): Promise<DatabaseResult<void>> {
    return this.update(missionId, { progress, updatedAt: new Date() });
  }

  async completeMilestone(missionId: string, milestoneId: string): Promise<DatabaseResult<void>> {
    const result = await this.findById(missionId);
    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Mission not found',
        metadata: result.metadata || { queryTime: 0, cached: false }
      };
    }

    const mission = result.data;
    const updatedMilestones = mission.milestones.map(milestone =>
      milestone.id === milestoneId
        ? { ...milestone, completed: true }
        : milestone
    );

    const completedCount = updatedMilestones.filter(m => m.completed).length;
    const progress = (completedCount / updatedMilestones.length) * 100;

    return this.update(missionId, {
      milestones: updatedMilestones,
      progress,
      status: progress === 100 ? 'completed' : 'active',
      updatedAt: new Date()
    });
  }
}

export interface AnalyticsEvent {
  id: string;
  userId: string;
  eventType: string;
  eventData: Record<string, any>;
  timestamp: Date;
  sessionId?: string;
  metadata?: Record<string, any>;
}

export class AnalyticsRepository extends BaseRepository<AnalyticsEvent> {
  constructor(provider: DatabaseProvider) {
    super(provider, 'analytics');
  }

  async findByUser(userId: string, limit?: number): Promise<DatabaseResult<AnalyticsEvent[]>> {
    const queryOptions: any = {
      where: [{ field: 'userId', operator: 'eq', value: userId }],
      orderBy: [{ field: 'timestamp', direction: 'desc' }]
    };
    
    if (limit !== undefined) {
      queryOptions.limit = limit;
    }
    
    return this.provider.query<AnalyticsEvent>(this.collectionName, queryOptions);
  }

  async findByEventType(eventType: string, limit?: number): Promise<DatabaseResult<AnalyticsEvent[]>> {
    const queryOptions: any = {
      where: [{ field: 'eventType', operator: 'eq', value: eventType }],
      orderBy: [{ field: 'timestamp', direction: 'desc' }]
    };
    
    if (limit !== undefined) {
      queryOptions.limit = limit;
    }
    
    return this.provider.query<AnalyticsEvent>(this.collectionName, queryOptions);
  }

  async findByDateRange(startDate: Date, endDate: Date): Promise<DatabaseResult<AnalyticsEvent[]>> {
    return this.provider.query<AnalyticsEvent>(this.collectionName, {
      where: [
        { field: 'timestamp', operator: 'gte', value: startDate },
        { field: 'timestamp', operator: 'lte', value: endDate }
      ],
      orderBy: [{ field: 'timestamp', direction: 'desc' }]
    });
  }

  async recordEvent(
    userId: string,
    eventType: string,
    eventData: Record<string, any>,
    sessionId?: string,
    metadata?: Record<string, any>
  ): Promise<DatabaseResult<AnalyticsEvent>> {
    const event: Omit<AnalyticsEvent, 'id'> = {
      userId,
      eventType,
      eventData,
      timestamp: new Date(),
      ...(sessionId && { sessionId }),
      ...(metadata && { metadata })
    };

    return this.create(event);
  }
}
