/**
 * @fileoverview Enhanced React Hooks for Scalable Architecture
 *
 * Custom hooks that provide reusable state management, data fetching,
 * and business logic patterns. Optimized for performance and type safety.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';

import { /* Result, AsyncResult, */ LoadingState, /* debounce, */ throttle } from '../lib/types-utils'; // Commented out unused imports

/**
 * Enhanced async data fetching hook with caching and error handling
 */
export function useAsyncData<T>(
  fetchFn: () => Promise<T>,
  deps: React.DependencyList = [],
  options: {
    immediate?: boolean;
    cacheKey?: string;
    cacheTime?: number;
    retryAttempts?: number;
    retryDelay?: number;
  } = {}
): LoadingState<T> & {
  refetch: () => Promise<void>;
  reset: () => void;
} {
  const [state, setState] = useState<LoadingState<T>>({
    isLoading: false,
    data: null,
    error: null,
  });

  const cache = useRef<Map<string, { data: T; timestamp: number }>>(new Map());
  const abortController = useRef<AbortController | null>(null);
  const retryTimeouts = useRef<NodeJS.Timeout[]>([]);

  const {
    immediate = true,
    cacheKey,
    cacheTime = 5 * 60 * 1000, // 5 minutes
    retryAttempts = 3,
    retryDelay = 1000,
  } = options;

  const getCachedData = useCallback((): T | null => {
    if (!cacheKey) {
      return null;
    }

    const cached = cache.current.get(cacheKey);
    if (!cached) {
      return null;
    }

    const isExpired = Date.now() - cached.timestamp > cacheTime;
    if (isExpired) {
      cache.current.delete(cacheKey);
      return null;
    }

    return cached.data;
  }, [cacheKey, cacheTime]);

  const setCachedData = useCallback(
    (data: T): void => {
      if (!cacheKey) {
        return;
      }
      cache.current.set(cacheKey, { data, timestamp: Date.now() });
    },
    [cacheKey]
  );

  const executeWithRetry = useCallback(
    async (fn: () => Promise<T>, attempt = 1): Promise<T> => {
      try {
        return await fn();
      } catch (error) {
        if (attempt < retryAttempts) {
          await new Promise(resolve => {
            const timeout = setTimeout(resolve, retryDelay * Math.pow(2, attempt - 1));
            retryTimeouts.current.push(timeout);
          });
          return executeWithRetry(fn, attempt + 1);
        }
        throw error;
      }
    },
    [retryAttempts, retryDelay]
  );

  const execute = useCallback(async (): Promise<void> => {
    // Check cache first
    const cachedData = getCachedData();
    if (cachedData) {
      setState({ isLoading: false, data: cachedData, error: null });
      return;
    }

    // Cancel previous request
    if (abortController.current) {
      abortController.current.abort();
    }

    abortController.current = new AbortController();
    setState((prev: LoadingState<T>) => ({ ...prev, isLoading: true, error: null }));

    try {
      const data = await executeWithRetry(fetchFn);
      setCachedData(data);
      setState({ isLoading: false, data, error: null });
    } catch (error) {
      if (error instanceof Error && error.name !== 'AbortError') {
        setState({
          isLoading: false,
          data: null,
          error: error.message,
        });
      }
    }
  }, [fetchFn, getCachedData, setCachedData, executeWithRetry]);

  const reset = useCallback((): void => {
    if (abortController.current) {
      abortController.current.abort();
    }

    retryTimeouts.current.forEach(clearTimeout);
    retryTimeouts.current = [];

    if (cacheKey) {
      cache.current.delete(cacheKey);
    }

    setState({ isLoading: false, data: null, error: null });
  }, [cacheKey]);

  useEffect(() => {
    if (immediate) {
      execute();
    }

    return () => {
      if (abortController.current) {
        abortController.current.abort();
      }
      retryTimeouts.current.forEach(clearTimeout);
    };
  }, deps); // eslint-disable-line react-hooks/exhaustive-deps

  return {
    ...state,
    refetch: execute,
    reset,
  };
}

/**
 * Debounced value hook for search inputs and similar use cases
 */
export function useDebouncedValue<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Throttled callback hook
 */
export function useThrottledCallback<T extends (...args: unknown[]) => unknown>(callback: T, delay: number): T {
  const throttledCallback = useMemo(() => throttle(callback, delay), [callback, delay]);

  return throttledCallback as T;
}

/**
 * Local storage hook with type safety
 */
export function useLocalStorage<T>(
  key: string,
  initialValue: T,
  validator?: (value: unknown) => value is T
): [T, (value: T | ((prev: T) => T)) => void, () => void] {
  const [storedValue, setStoredValue] = useState<T>(() => {
    try {
      const item = window.localStorage.getItem(key);
      if (!item) {
        return initialValue;
      }

      const parsed = JSON.parse(item);
      if (validator && !validator(parsed)) {
        return initialValue;
      }

      return parsed;
    } catch {
      return initialValue;
    }
  });

  const setValue = useCallback(
    (value: T | ((prev: T) => T)) => {
      try {
        const valueToStore = value instanceof Function ? value(storedValue) : value;
        setStoredValue(valueToStore);
        window.localStorage.setItem(key, JSON.stringify(valueToStore));
      } catch (error) {
        console.error(`Error setting localStorage key "${key}":`, error);
      }
    },
    [key, storedValue]
  );

  const removeValue = useCallback(() => {
    try {
      setStoredValue(initialValue);
      window.localStorage.removeItem(key);
    } catch (error) {
      console.error(`Error removing localStorage key "${key}":`, error);
    }
  }, [key, initialValue]);

  return [storedValue, setValue, removeValue];
}

/**
 * Previous value hook
 */
export function usePrevious<T>(value: T): T | undefined {
  const ref = useRef<T>();

  useEffect(() => {
    ref.current = value;
  });

  return ref.current;
}

/**
 * Boolean toggle hook
 */
export function useToggle(initialValue = false): [boolean, () => void, (value?: boolean) => void] {
  const [value, setValue] = useState(initialValue);

  const toggle = useCallback(() => {
    setValue(prev => !prev);
  }, []);

  const setToggle = useCallback(
    (newValue?: boolean) => {
      setValue(newValue ?? !value);
    },
    [value]
  );

  return [value, toggle, setToggle];
}

/**
 * Counter hook with min/max bounds
 */
export function useCounter(
  initialValue = 0,
  options: { min?: number; max?: number; step?: number } = {}
): {
  count: number;
  increment: () => void;
  decrement: () => void;
  reset: () => void;
  set: (value: number) => void;
} {
  const { min, max, step = 1 } = options;
  const [count, setCount] = useState(initialValue);

  const increment = useCallback(() => {
    setCount(prev => {
      const newValue = prev + step;
      return max !== undefined ? Math.min(newValue, max) : newValue;
    });
  }, [step, max]);

  const decrement = useCallback(() => {
    setCount(prev => {
      const newValue = prev - step;
      return min !== undefined ? Math.max(newValue, min) : newValue;
    });
  }, [step, min]);

  const reset = useCallback(() => {
    setCount(initialValue);
  }, [initialValue]);

  const set = useCallback(
    (value: number) => {
      let newValue = value;
      if (min !== undefined) {
        newValue = Math.max(newValue, min);
      }
      if (max !== undefined) {
        newValue = Math.min(newValue, max);
      }
      setCount(newValue);
    },
    [min, max]
  );

  return { count, increment, decrement, reset, set };
}

/**
 * Array state hook with common operations
 */
export function useArray<T>(initialValue: T[] = []): {
  array: T[];
  set: (newArray: T[]) => void;
  push: (item: T) => void;
  pop: () => T | undefined;
  shift: () => T | undefined;
  unshift: (item: T) => void;
  insert: (index: number, item: T) => void;
  remove: (index: number) => void;
  clear: () => void;
  filter: (predicate: (item: T) => boolean) => void;
  update: (index: number, item: T) => void;
} {
  const [array, setArray] = useState<T[]>(initialValue);

  const push = useCallback((item: T) => {
    setArray(prev => [...prev, item]);
  }, []);

  const pop = useCallback(() => {
    let poppedItem: T | undefined;
    setArray(prev => {
      poppedItem = prev[prev.length - 1];
      return prev.slice(0, -1);
    });
    return poppedItem;
  }, []);

  const shift = useCallback(() => {
    let shiftedItem: T | undefined;
    setArray(prev => {
      shiftedItem = prev[0];
      return prev.slice(1);
    });
    return shiftedItem;
  }, []);

  const unshift = useCallback((item: T) => {
    setArray(prev => [item, ...prev]);
  }, []);

  const insert = useCallback((index: number, item: T) => {
    setArray(prev => [...prev.slice(0, index), item, ...prev.slice(index)]);
  }, []);

  const remove = useCallback((index: number) => {
    setArray(prev => prev.filter((_, i) => i !== index));
  }, []);

  const clear = useCallback(() => {
    setArray([]);
  }, []);

  const filter = useCallback((predicate: (item: T) => boolean) => {
    setArray(prev => prev.filter(predicate));
  }, []);

  const update = useCallback((index: number, item: T) => {
    setArray(prev => prev.map((existingItem, i) => (i === index ? item : existingItem)));
  }, []);

  return {
    array,
    set: setArray,
    push,
    pop,
    shift,
    unshift,
    insert,
    remove,
    clear,
    filter,
    update,
  };
}

/**
 * Form validation hook
 */
export interface ValidationRule<T> {
  validate: (value: T) => boolean;
  message: string;
}

export function useValidation<T extends Record<string, unknown>>(
  initialValues: T,
  rules: Partial<Record<keyof T, ValidationRule<T[keyof T]>[]>>
): {
  values: T;
  errors: Partial<Record<keyof T, string[]>>;
  isValid: boolean;
  setValue: <K extends keyof T>(key: K, value: T[K]) => void;
  setValues: (values: Partial<T>) => void;
  validate: (key?: keyof T) => boolean;
  reset: () => void;
} {
  const [values, setValues] = useState<T>(initialValues);
  const [errors, setErrors] = useState<Partial<Record<keyof T, string[]>>>({});

  const validateField = useCallback(
    (key: keyof T): string[] => {
      const fieldRules = rules[key] ?? [];
      const fieldValue = values[key];
      const fieldErrors: string[] = [];

      for (const rule of fieldRules) {
        if (!rule.validate(fieldValue)) {
          fieldErrors.push(rule.message);
        }
      }

      return fieldErrors;
    },
    [values, rules]
  );

  const validate = useCallback(
    (key?: keyof T): boolean => {
      if (key) {
        const fieldErrors = validateField(key);
        setErrors(prev => ({ ...prev, [key]: fieldErrors }));
        return fieldErrors.length === 0;
      }

      const allErrors: Partial<Record<keyof T, string[]>> = {};
      let isFormValid = true;

      for (const fieldKey of Object.keys(values) as (keyof T)[]) {
        const fieldErrors = validateField(fieldKey);
        if (fieldErrors.length > 0) {
          allErrors[fieldKey] = fieldErrors;
          isFormValid = false;
        }
      }

      setErrors(allErrors);
      return isFormValid;
    },
    [values, validateField]
  );

  const setValue = useCallback(<K extends keyof T>(key: K, value: T[K]) => {
    setValues(prev => ({ ...prev, [key]: value }));
    // Clear errors for this field
    setErrors(prev => ({ ...prev, [key]: [] }));
  }, []);

  const setFormValues = useCallback((newValues: Partial<T>) => {
    setValues(prev => ({ ...prev, ...newValues }));
  }, []);

  const reset = useCallback(() => {
    setValues(initialValues);
    setErrors({});
  }, [initialValues]);

  const isValid = useMemo(() => {
    return Object.values(errors).every(fieldErrors => !fieldErrors || fieldErrors.length === 0);
  }, [errors]);

  return {
    values,
    errors,
    isValid,
    setValue,
    setValues: setFormValues,
    validate,
    reset,
  };
}

/**
 * Intersection observer hook for lazy loading and scroll effects
 */
export function useIntersectionObserver(
  options: IntersectionObserverInit = {}
): [React.RefObject<HTMLElement>, boolean] {
  const [isIntersecting, setIsIntersecting] = useState(false);
  const ref = useRef<HTMLElement>(null);

  useEffect(() => {
    const element = ref.current;
    if (!element) {
      return;
    }

    const observer = new IntersectionObserver(([entry]) => {
      if (entry) {
        setIsIntersecting(entry.isIntersecting);
      }
    }, options);

    observer.observe(element);

    return () => {
      observer.unobserve(element);
    };
  }, [options]);

  return [ref, isIntersecting];
}

/**
 * Window size hook for responsive design
 */
export function useWindowSize(): { width: number; height: number } {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 0,
    height: typeof window !== 'undefined' ? window.innerHeight : 0,
  });

  useEffect(() => {
    function handleResize() {
      setWindowSize({
        width: window.innerWidth,
        height: window.innerHeight,
      });
    }

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  return windowSize;
}
