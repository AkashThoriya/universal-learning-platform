/**
 * @fileoverview Enterprise Form Management Hook
 *
 * Comprehensive form state management with validation, error handling,
 * persistence, and submission management following enterprise patterns.
 *
 * @author Universal Learning Platform Team
 * @version 1.0.0
 */

import { useState, useCallback, useEffect, useRef } from 'react';
import { z } from 'zod';

import { logInfo, logger } from '@/lib/utils/logger';

/**
 * Field error structure
 */
export interface FieldError {
  message: string;
  type: 'required' | 'validation' | 'server' | 'custom';
  path: string;
}

/**
 * Form event types for analytics
 */
export type FormEvent =
  | 'field_change'
  | 'field_blur'
  | 'field_focus'
  | 'validation_error'
  | 'validation_success'
  | 'form_submit'
  | 'form_reset'
  | 'data_persist'
  | 'data_restore';

/**
 * Form configuration options
 */
export interface UseFormConfig<T> {
  initialData: T;
  validationSchema?: z.ZodSchema<T>;
  persistData?: boolean;
  storageKey?: string;
  validateOnChange?: boolean;
  validateOnBlur?: boolean;
  debounceMs?: number;
  onFormEvent?: (event: FormEvent, data: unknown) => void;
}

/**
 * Form hook return type
 */
export interface UseFormReturn<T> {
  data: T;
  errors: Record<string, FieldError>;
  isValid: boolean;
  isDirty: boolean;
  isSubmitting: boolean;
  touchedFields: Set<string>;

  // Field operations
  updateField: <K extends keyof T>(field: K, value: T[K]) => void;
  updateFields: (updates: Partial<T>) => void;
  setError: (field: keyof T, error: FieldError) => void;
  clearError: (field: keyof T) => void;
  clearAllErrors: () => void;

  // Form operations
  validate: () => Promise<boolean>;
  validateField: (field: keyof T) => Promise<boolean>;
  reset: () => void;
  setData: (data: T) => void;

  // State management
  setSubmitting: (submitting: boolean) => void;
  markFieldTouched: (field: keyof T) => void;
  isFieldTouched: (field: keyof T) => boolean;
}

/**
 * Enterprise Form Management Hook
 *
 * Provides comprehensive form state management with validation,
 * error handling, persistence, and analytics tracking.
 *
 * @param config Form configuration options
 * @returns Form state and management functions
 */
export function useForm<T extends Record<string, unknown>>(config: UseFormConfig<T>): UseFormReturn<T> {
  const {
    initialData,
    validationSchema,
    persistData = false,
    storageKey = 'form-data',
    validateOnChange = false,
    validateOnBlur = true,
    debounceMs = 300,
    onFormEvent,
  } = config;

  // State management
  const [data, setDataState] = useState<T>(() => {
    if (persistData && typeof window !== 'undefined') {
      try {
        const saved = localStorage.getItem(storageKey);
        if (saved) {
          const parsed = JSON.parse(saved);
          logInfo('Form data restored from localStorage', {
            storageKey,
            restoredFields: Object.keys(parsed),
          });
          onFormEvent?.('data_restore', parsed);
          return { ...initialData, ...parsed };
        }
      } catch (error) {
        logger.warn('Failed to restore form data', {
          storageKey,
          error: error instanceof Error ? error.message : 'Unknown error',
        });
      }
    }
    return initialData;
  });

  const [errors, setErrors] = useState<Record<string, FieldError>>({});
  const [isSubmitting, setSubmitting] = useState(false);
  const [touchedFields, setTouchedFields] = useState<Set<string>>(new Set());

  // Derived state
  const isValid = Object.keys(errors).length === 0;
  const isDirty = JSON.stringify(data) !== JSON.stringify(initialData);

  // Refs for debouncing
  const debounceRef = useRef<Record<string, NodeJS.Timeout>>({});

  // Log form initialization once
  useEffect(() => {
    logInfo('useForm hook initialized', {
      storageKey,
      persistData,
      validateOnChange,
      validateOnBlur,
      hasValidationSchema: !!validationSchema,
      debounceMs,
    });
  }, [storageKey, persistData, validateOnChange, validateOnBlur, validationSchema, debounceMs]);

  // Persist data to localStorage when it changes
  useEffect(() => {
    if (persistData && typeof window !== 'undefined') {
      try {
        localStorage.setItem(storageKey, JSON.stringify(data));
        onFormEvent?.('data_persist', data);
      } catch (_error) {
        // console.warn('Failed to persist form data:', error);
      }
    }
  }, [data, persistData, storageKey, onFormEvent]);

  // Field validation function
  const validateField = useCallback(
    async (field: keyof T): Promise<boolean> => {
      if (!validationSchema) {
        return true;
      }

      try {
        // Validate the entire object, but only report errors for this field
        await validationSchema.parseAsync(data);

        // Clear any existing error for this field
        setErrors(prev => {
          const newErrors = { ...prev };
          delete newErrors[field as string];
          return newErrors;
        });

        onFormEvent?.('validation_success', { field, value: data[field] });
        return true;
      } catch (error) {
        if (error instanceof z.ZodError) {
          const fieldError = error.errors.find(e => e.path.includes(field as string));
          if (fieldError) {
            const errorObj: FieldError = {
              message: fieldError.message,
              type: 'validation',
              path: fieldError.path.join('.'),
            };

            setErrors(prev => ({
              ...prev,
              [field as string]: errorObj,
            }));

            onFormEvent?.('validation_error', { field, error: errorObj });
            return false;
          }
        }
        return true; // If no error for this specific field, consider it valid
      }
    },
    [data, validationSchema, onFormEvent]
  );

  // Full form validation
  const validate = useCallback(async (): Promise<boolean> => {
    if (!validationSchema) {
      return true;
    }

    try {
      await validationSchema.parseAsync(data);
      setErrors({});
      onFormEvent?.('validation_success', data);
      return true;
    } catch (error) {
      if (error instanceof z.ZodError) {
        const newErrors: Record<string, FieldError> = {};

        error.errors.forEach(err => {
          const field = err.path.join('.');
          newErrors[field] = {
            message: err.message,
            type: 'validation',
            path: field,
          };
        });

        setErrors(newErrors);
        onFormEvent?.('validation_error', { errors: newErrors });
      }
      return false;
    }
  }, [data, validationSchema, onFormEvent]);

  // Update single field
  const updateField = useCallback(
    <K extends keyof T>(field: K, value: T[K]) => {
      setDataState(prev => ({ ...prev, [field]: value }));
      onFormEvent?.('field_change', { field, value });

      // Debounced validation for change events
      if (validateOnChange) {
        if (debounceRef.current[field as string]) {
          clearTimeout(debounceRef.current[field as string]);
        }

        debounceRef.current[field as string] = setTimeout(() => {
          validateField(field);
        }, debounceMs);
      }
    },
    [validateOnChange, debounceMs, validateField, onFormEvent]
  );

  // Update multiple fields
  const updateFields = useCallback(
    (updates: Partial<T>) => {
      setDataState(prev => ({ ...prev, ...updates }));

      Object.entries(updates).forEach(([field, value]) => {
        onFormEvent?.('field_change', { field, value });
      });

      if (validateOnChange) {
        // Validate all updated fields
        Object.keys(updates).forEach(field => {
          if (debounceRef.current[field]) {
            clearTimeout(debounceRef.current[field]);
          }

          debounceRef.current[field] = setTimeout(() => {
            validateField(field as keyof T);
          }, debounceMs);
        });
      }
    },
    [validateOnChange, debounceMs, validateField, onFormEvent]
  );

  // Error management
  const setError = useCallback((field: keyof T, error: FieldError) => {
    setErrors(prev => ({ ...prev, [field as string]: error }));
  }, []);

  const clearError = useCallback((field: keyof T) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      delete newErrors[field as string];
      return newErrors;
    });
  }, []);

  const clearAllErrors = useCallback(() => {
    setErrors({});
  }, []);

  // Field touch management
  const markFieldTouched = useCallback(
    (field: keyof T) => {
      setTouchedFields(prev => new Set([...prev, field as string]));
      onFormEvent?.('field_blur', { field });

      if (validateOnBlur) {
        validateField(field);
      }
    },
    [validateOnBlur, validateField, onFormEvent]
  );

  const isFieldTouched = useCallback(
    (field: keyof T) => {
      return touchedFields.has(field as string);
    },
    [touchedFields]
  );

  // Form operations
  const reset = useCallback(() => {
    setDataState(initialData);
    setErrors({});
    setTouchedFields(new Set());
    setSubmitting(false);

    // Clear persisted data
    if (persistData && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }

    onFormEvent?.('form_reset', initialData);
  }, [initialData, persistData, storageKey, onFormEvent]);

  const setData = useCallback((newData: T) => {
    setDataState(newData);
    setErrors({});
    setTouchedFields(new Set());
  }, []);

  // Cleanup debounce timers on unmount
  useEffect(() => {
    return () => {
      Object.values(debounceRef.current).forEach(timer => {
        if (timer) {
          clearTimeout(timer);
        }
      });
    };
  }, []);

  return {
    data,
    errors,
    isValid,
    isDirty,
    isSubmitting,
    touchedFields,

    updateField,
    updateFields,
    setError,
    clearError,
    clearAllErrors,

    validate,
    validateField,
    reset,
    setData,

    setSubmitting,
    markFieldTouched,
    isFieldTouched,
  };
}
