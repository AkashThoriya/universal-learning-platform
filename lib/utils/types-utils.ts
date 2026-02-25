/**
 * @fileoverview TypeScript Utilities for Scalability
 *
 * Advanced type utilities, type guards, and generic helpers to improve
 * type safety and developer experience across the application.
 *
 * @author Universal Learning Platform Team
 * @version 1.0.0
 */

/**
 * Generic result type for operations that can succeed or fail
 */
export type Result<T, E = Error> =
  | { success: true; data: T; error?: never }
  | { success: false; data?: never; error: E };

/**
 * Generic async result type for async operations
 */
export type AsyncResult<T, E = Error> = Promise<Result<T, E>>;

/**
 * Utility type to make specific properties optional
 */
export type Optional<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Utility type to make specific properties required
 */
export type RequiredFields<T, K extends keyof T> = T & globalThis.Required<Pick<T, K>>;

/**
 * Deep partial type for nested objects
 */
export type DeepPartial<T> = {
  [P in keyof T]?: T[P] extends object ? DeepPartial<T[P]> : T[P];
};

/**
 * Extract keys of type T that have values of type U
 */
export type KeysOfType<T, U> = {
  [K in keyof T]: T[K] extends U ? K : never;
}[keyof T];

/**
 * Type-safe event handler type
 */
export type EventHandler<T = unknown> = (event: T) => void | Promise<void>;

/**
 * Generic loading state type
 */
export interface LoadingState<T = unknown> {
  isLoading: boolean;
  data: T | null;
  error: string | null;
}

/**
 * Generic pagination type
 */
export interface PaginationState {
  page: number;
  limit: number;
  total: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}

/**
 * Generic API response type
 */
export interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
  timestamp: string;
  pagination?: PaginationState;
}

/**
 * Type guard to check if a value is not null or undefined
 */
export function isDefined<T>(value: T | null | undefined): value is T {
  return value !== null && value !== undefined;
}

/**
 * Type guard to check if a value is a string
 */
export function isString(value: unknown): value is string {
  return typeof value === 'string';
}

/**
 * Type guard to check if a value is a number
 */
export function isNumber(value: unknown): value is number {
  return typeof value === 'number' && !isNaN(value);
}

/**
 * Type guard to check if a value is an object
 */
export function isObject(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}

/**
 * Type guard to check if a value is an array
 */
export function isArray<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

/**
 * Type guard to check if an object has a specific property
 */
export function hasProperty<T extends Record<string, unknown>, K extends string>(
  obj: T,
  key: K
): obj is T & Record<K, unknown> {
  return key in obj;
}

/**
 * Safe JSON parse with type checking
 */
export function safeJsonParse<T>(json: string, validator?: (value: unknown) => value is T): Result<T, string> {
  try {
    const parsed = JSON.parse(json);
    if (validator && !validator(parsed)) {
      return { success: false, error: 'Invalid JSON structure' };
    }
    return { success: true, data: parsed };
  } catch (error) {
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Invalid JSON',
    };
  }
}

/**
 * Create a type-safe error result
 */
export function createError<E = Error>(error: E): Result<never, E> {
  return { success: false, error };
}

/**
 * Create a type-safe success result
 */
export function createSuccess<T>(data: T): Result<T, never> {
  return { success: true, data };
}

/**
 * Utility to extract error message from unknown error
 */
export function getErrorMessage(error: unknown): string {
  if (error instanceof Error) {
    return error.message;
  }
  if (typeof error === 'string') {
    return error;
  }
  if (isObject(error) && hasProperty(error, 'message') && isString(error.message)) {
    return error.message;
  }
  return 'An unknown error occurred';
}

/**
 * Debounce function with TypeScript support
 */
export function debounce<T extends (...args: unknown[]) => unknown>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout;

  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
}

/**
 * Throttle function with TypeScript support
 */
export function throttle<T extends (...args: unknown[]) => unknown>(
  func: T,
  limit: number
): (...args: Parameters<T>) => void {
  let inThrottle: boolean;

  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => (inThrottle = false), limit);
    }
  };
}

/**
 * Type-safe local storage utilities
 */
export const storage = {
  get<T>(key: string, validator?: (value: unknown) => value is T): T | null {
    try {
      const item = localStorage.getItem(key);
      if (!item) {
        return null;
      }

      const parsed = JSON.parse(item);
      if (validator && !validator(parsed)) {
        return null;
      }

      return parsed;
    } catch {
      return null;
    }
  },

  set<T>(key: string, value: T): boolean {
    try {
      localStorage.setItem(key, JSON.stringify(value));
      return true;
    } catch {
      return false;
    }
  },

  remove(key: string): boolean {
    try {
      localStorage.removeItem(key);
      return true;
    } catch {
      return false;
    }
  },
};

/**
 * Array utility functions with type safety
 */
export const arrayUtils = {
  /**
   * Remove duplicates from array based on a key function
   */
  uniqueBy<T, K>(array: T[], keyFn: (item: T) => K): T[] {
    const seen = new Set<K>();
    return array.filter(item => {
      const key = keyFn(item);
      if (seen.has(key)) {
        return false;
      }
      seen.add(key);
      return true;
    });
  },

  /**
   * Group array items by a key function
   */
  groupBy<T, K extends string | number>(array: T[], keyFn: (item: T) => K): Record<K, T[]> {
    return array.reduce(
      (groups, item) => {
        const key = keyFn(item);
        if (!groups[key]) {
          groups[key] = [];
        }
        groups[key].push(item);
        return groups;
      },
      {} as Record<K, T[]>
    );
  },

  /**
   * Sort array by multiple criteria
   */
  sortBy<T>(array: T[], ...criteria: ((item: T) => string | number)[]): T[] {
    return [...array].sort((a, b) => {
      for (const criterion of criteria) {
        const valueA = criterion(a);
        const valueB = criterion(b);

        if (valueA < valueB) {
          return -1;
        }
        if (valueA > valueB) {
          return 1;
        }
      }
      return 0;
    });
  },
};

/**
 * Validation utility types and functions
 */
export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export function validateValue<T>(value: T, rules: ValidationRule<T>[]): ValidationResult {
  const errors: string[] = [];

  for (const rule of rules) {
    if (!rule.validate(value)) {
      errors.push(rule.message);
    }
  }

  return {
    isValid: errors.length === 0,
    errors,
  };
}
