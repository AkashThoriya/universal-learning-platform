/**
 * @fileoverview Service Layer Architecture
 *
 * Provides a scalable service layer pattern for managing business logic,
 * data operations, and cross-cutting concerns. Implements repository pattern
 * and dependency injection for better testability and maintainability.
 *
 * @author Universal Learning Platform Team
 * @version 1.0.0
 */

import {
  Result,
  createSuccess as _createSuccess,
  createError as _createError,
  LoadingState as _LoadingState,
  PaginationState as _PaginationState,
} from '@/lib/utils/types-utils';

type AsyncResult<T> = Promise<Result<T>>;

/**
 * Base service interface for common operations
 */
export interface BaseService<T, ID = string> {
  findById(id: ID): AsyncResult<T>;
  findAll(options?: QueryOptions): AsyncResult<T[]>;
  create(data: Omit<T, 'id'>): AsyncResult<T>;
  update(id: ID, data: Partial<T>): AsyncResult<T>;
  delete(id: ID): AsyncResult<boolean>;
}

/**
 * Query options for data operations
 */
export interface QueryOptions {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
  filters?: Record<string, string | number | boolean | null | undefined>;
  include?: string[];
}

/**
 * Service configuration interface
 */
export interface ServiceConfig {
  cacheEnabled?: boolean;
  retryAttempts?: number;
  timeout?: number;
}

/**
 * Event types for service operations
 */
export type ServiceEvent =
  | 'before_create'
  | 'after_create'
  | 'before_update'
  | 'after_update'
  | 'before_delete'
  | 'after_delete'
  | 'error';

/**
 * Event handler interface
 */
export interface ServiceEventHandler<T = unknown> {
  (event: ServiceEvent, data: T): void | Promise<void>;
}

/**
 * Abstract base service class with common functionality
 */
export abstract class AbstractService<T, ID = string> implements BaseService<T, ID> {
  protected config: ServiceConfig;
  private eventHandlers: Map<ServiceEvent, ServiceEventHandler[]> = new Map();
  private cache: Map<string, { data: unknown; timestamp: number }> = new Map();

  constructor(config: ServiceConfig = {}) {
    this.config = {
      cacheEnabled: false,
      retryAttempts: 3,
      timeout: 5000,
      ...config,
    };
  }

  /**
   * Register event handler
   */
  on(event: ServiceEvent, handler: ServiceEventHandler): void {
    const handlers = this.eventHandlers.get(event) ?? [];
    handlers.push(handler);
    this.eventHandlers.set(event, handlers);
  }

  /**
   * Emit event to registered handlers
   */
  protected async emit(event: ServiceEvent, data: unknown): Promise<void> {
    const handlers = this.eventHandlers.get(event) ?? [];
    await Promise.all(handlers.map(handler => handler(event, data)));
  }

  /**
   * Get cached data if available and valid
   */
  protected getFromCache<U>(key: string, maxAge = 300000): U | null {
    if (!this.config.cacheEnabled) {
      return null;
    }

    const cached = this.cache.get(key);
    if (!cached) {
      return null;
    }

    const age = Date.now() - cached.timestamp;
    if (age > maxAge) {
      this.cache.delete(key);
      return null;
    }

    return cached.data as U | null;
  }

  /**
   * Store data in cache
   */
  protected setCache(key: string, data: unknown): void {
    if (!this.config.cacheEnabled) {
      return;
    }

    this.cache.set(key, {
      data,
      timestamp: Date.now(),
    });
  }

  /**
   * Execute operation with retry logic
   */
  protected async withRetry<U>(
    operation: () => Promise<U>,
    attempts: number = this.config.retryAttempts ?? 3
  ): Promise<U> {
    let lastError: Error | undefined;

    for (let i = 0; i < attempts; i++) {
      try {
        return await operation();
      } catch (error) {
        lastError = error as Error;
        if (i < attempts - 1) {
          // Exponential backoff
          await new Promise(resolve => setTimeout(resolve, Math.pow(2, i) * 1000));
        }
      }
    }

    if (!lastError) {
      throw new Error('Operation failed without error details');
    }

    throw lastError;
  }

  /**
   * Validate data before operations
   */
  protected abstract validate(data: Partial<T>): Result<T, string>;

  /**
   * Transform data after retrieval
   */
  protected transform(data: unknown): T {
    return data as T;
  }

  // Abstract methods to be implemented by concrete services
  abstract findById(id: ID): AsyncResult<T>;
  abstract findAll(options?: QueryOptions): AsyncResult<T[]>;
  abstract create(data: Omit<T, 'id'>): AsyncResult<T>;
  abstract update(id: ID, data: Partial<T>): AsyncResult<T>;
  abstract delete(id: ID): AsyncResult<boolean>;
}

/**
 * Repository interface for data access
 */
export interface Repository<T, ID = string> {
  findById(id: ID): Promise<T | null>;
  findAll(options?: QueryOptions): Promise<T[]>;
  save(data: T): Promise<T>;
  update(id: ID, data: Partial<T>): Promise<T | null>;
  delete(id: ID): Promise<boolean>;
  count(filters?: Record<string, string | number | boolean | null | undefined>): Promise<number>;
}

/**
 * Service container for dependency injection
 */
export class ServiceContainer {
  private services: Map<string, unknown> = new Map();
  private factories: Map<string, () => unknown> = new Map();

  /**
   * Register a service instance
   */
  register<T>(name: string, service: T): void {
    this.services.set(name, service);
  }

  /**
   * Register a service factory
   */
  registerFactory<T>(name: string, factory: () => T): void {
    this.factories.set(name, factory);
  }

  /**
   * Get a service instance
   */
  get<T>(name: string): T {
    // Return existing instance if available
    if (this.services.has(name)) {
      return this.services.get(name) as T;
    }

    // Create new instance from factory
    if (this.factories.has(name)) {
      const factory = this.factories.get(name);
      if (!factory) {
        throw new Error(`Factory for '${name}' not found`);
      }
      const instance = factory();
      this.services.set(name, instance);
      return instance as T;
    }

    throw new Error(`Service '${name}' not found`);
  }

  /**
   * Check if service is registered
   */
  has(name: string): boolean {
    return this.services.has(name) ?? this.factories.has(name);
  }

  /**
   * Clear all services
   */
  clear(): void {
    this.services.clear();
    this.factories.clear();
  }
}

/**
 * Global service container instance
 */
export const serviceContainer = new ServiceContainer();

/**
 * Decorator for service injection
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function injectable<T extends new (...args: any[]) => any>(constructor: T) {
  return class extends constructor {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    constructor(...args: any[]) {
      super(...args);
      // Auto-register in service container
      const serviceName = constructor.name.toLowerCase();
      if (!serviceContainer.has(serviceName)) {
        serviceContainer.register(serviceName, this);
      }
    }
  };
}

/**
 * Hook for using services in React components
 */
export function useService<T>(serviceName: string): T {
  return serviceContainer.get<T>(serviceName);
}

/**
 * Error handling utilities
 */
export class ServiceError extends Error {
  constructor(
    message: string,
    public code: string,
    public details?: unknown
  ) {
    super(message);
    this.name = 'ServiceError';
  }
}

export function isServiceError(error: unknown): error is ServiceError {
  return error instanceof ServiceError;
}

/**
 * Logging interface for services
 */
export interface Logger {
  debug(message: string, ...args: unknown[]): void;
  info(message: string, ...args: unknown[]): void;
  warn(message: string, ...args: unknown[]): void;
  error(message: string, error?: Error, ...args: unknown[]): void;
}

/**
 * Console logger implementation
 */
export class ConsoleLogger implements Logger {
  constructor(private prefix = '[Service]') {}

  debug(_message: string, ..._args: unknown[]): void {
    // console.debug(`${this.prefix} ${message}`, ...args);
  }

  info(message: string, ...args: unknown[]): void {
    console.info(`${this.prefix} ${message}`, ...args);
  }

  warn(_message: string, ..._args: unknown[]): void {
    // console.warn(`${this.prefix} ${message}`, ...args);
  }

  error(message: string, error?: Error, ...args: unknown[]): void {
    console.error(`${this.prefix} ${message}`, error, ...args);
  }
}

/**
 * Performance monitoring utilities
 */
export class PerformanceMonitor {
  private timers: Map<string, number> = new Map();

  start(label: string): void {
    this.timers.set(label, performance.now());
  }

  end(label: string): number {
    const startTime = this.timers.get(label);
    if (!startTime) {
      console.warn(`Timer '${label}' not found`);
      return 0;
    }

    const duration = performance.now() - startTime;
    this.timers.delete(label);
    return duration;
  }

  measure<T>(label: string, operation: () => T): T;
  measure<T>(label: string, operation: () => Promise<T>): Promise<T>;
  measure<T>(label: string, operation: () => T | Promise<T>): T | Promise<T> {
    this.start(label);

    const result = operation();

    if (result instanceof Promise) {
      return result.finally(() => {
        try {
          this.end(label);
          // console.debug(`Operation '${label}' took ${duration.toFixed(2)}ms`);
        } catch (error) {
          console.warn(`Failed to end timer '${label}':`, error);
        }
      });
    }

    try {
      this.end(label);
      // console.debug(`Operation '${label}' took ${duration.toFixed(2)}ms`);
    } catch (error) {
      console.warn(`Failed to end timer '${label}':`, error);
    }
    return result;
  }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor();
