/**
 * @fileoverview Multi-step form hook for complex flows with state management
 *
 * Enterprise-grade hook for managing multi-step forms with navigation,
 * validation, persistence, and analytics. Follows React patterns used
 * in top product companies.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { useState, useCallback, useMemo } from 'react';

/**
 * Configuration for multi-step form behavior
 *
 * @interface MultiStepFormConfig
 */
interface MultiStepFormConfig {
  /** Total number of steps in the form */
  totalSteps: number;
  /** Whether to persist state in localStorage */
  persistState?: boolean;
  /** Key for localStorage persistence */
  storageKey?: string;
  /** Whether to allow backward navigation */
  allowBackward?: boolean;
  /** Whether to allow forward navigation without validation */
  allowSkipValidation?: boolean;
  /** Analytics callback for step changes */
  onStepChange?: (currentStep: number, previousStep: number) => void;
}

/**
 * Return type for the multi-step form hook
 *
 * @interface UseMultiStepFormReturn
 */
interface UseMultiStepFormReturn {
  /** Current step number (1-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Whether currently on the first step */
  isFirstStep: boolean;
  /** Whether currently on the last step */
  isLastStep: boolean;
  /** Progress as percentage (0-100) */
  progress: number;
  /** Navigate to next step */
  goToNext: () => void;
  /** Navigate to previous step */
  goToPrevious: () => void;
  /** Navigate to specific step */
  goToStep: (step: number) => void;
  /** Reset to first step */
  reset: () => void;
  /** Get step validation status */
  getStepStatus: (step: number) => 'completed' | 'current' | 'upcoming';
}

/**
 * Multi-step form management hook with enterprise features
 *
 * Provides state management, navigation, persistence, and analytics
 * for complex multi-step forms. Used throughout the application
 * for onboarding, data entry, and complex workflows.
 *
 * @param {MultiStepFormConfig} config - Configuration object
 * @returns {UseMultiStepFormReturn} Hook interface
 *
 * @example
 * ```typescript
 * function OnboardingForm() {
 *   const form = useMultiStepForm({
 *     totalSteps: 4,
 *     persistState: true,
 *     storageKey: 'onboarding-progress',
 *     onStepChange: (current, previous) => {
 *       analytics.track('onboarding_step_change', {
 *         current_step: current,
 *         previous_step: previous
 *       });
 *     }
 *   });
 *
 *   return (
 *     <div>
 *       <ProgressIndicator progress={form.progress} />
 *       {form.currentStep === 1 && <PersonalInfoStep />}
 *       {form.currentStep === 2 && <ExamSelectionStep />}
 *       <Navigation
 *         onNext={form.goToNext}
 *         onPrevious={form.goToPrevious}
 *         canGoBack={!form.isFirstStep}
 *         canGoNext={validateCurrentStep()}
 *       />
 *     </div>
 *   );
 * }
 * ```
 */
export const useMultiStepForm = (config: MultiStepFormConfig): UseMultiStepFormReturn => {
  const {
    totalSteps,
    persistState = false,
    storageKey = 'multi-step-form',
    allowBackward = true,
    allowSkipValidation = false,
    onStepChange
  } = config;

  // Initialize step from localStorage if persistence is enabled
  const getInitialStep = useCallback((): number => {
    if (persistState && typeof window !== 'undefined') {
      const saved = localStorage.getItem(storageKey);
      if (saved) {
        const parsedStep = parseInt(saved, 10);
        if (parsedStep >= 1 && parsedStep <= totalSteps) {
          return parsedStep;
        }
      }
    }
    return 1;
  }, [persistState, storageKey, totalSteps]);

  const [currentStep, setCurrentStep] = useState<number>(getInitialStep);

  // Persist step changes to localStorage
  const updateStep = useCallback((newStep: number, previousStep: number) => {
    if (persistState && typeof window !== 'undefined') {
      localStorage.setItem(storageKey, newStep.toString());
    }

    // Call analytics callback
    onStepChange?.(newStep, previousStep);

    setCurrentStep(newStep);
  }, [persistState, storageKey, onStepChange]);

  // Computed properties
  const isFirstStep = useMemo(() => currentStep === 1, [currentStep]);
  const isLastStep = useMemo(() => currentStep === totalSteps, [currentStep, totalSteps]);
  const progress = useMemo(() => ((currentStep - 1) / (totalSteps - 1)) * 100, [currentStep, totalSteps]);

  // Navigation functions
  const goToNext = useCallback(() => {
    if (currentStep < totalSteps) {
      const newStep = currentStep + 1;
      updateStep(newStep, currentStep);
    }
  }, [currentStep, totalSteps, updateStep]);

  const goToPrevious = useCallback(() => {
    if (allowBackward && currentStep > 1) {
      const newStep = currentStep - 1;
      updateStep(newStep, currentStep);
    }
  }, [allowBackward, currentStep, updateStep]);

  const goToStep = useCallback((step: number) => {
    // Validate step bounds
    if (step < 1 || step > totalSteps) {
      console.warn(`Invalid step: ${step}. Must be between 1 and ${totalSteps}`);
      return;
    }

    // Check if backward navigation is allowed
    if (step < currentStep && !allowBackward) {
      console.warn('Backward navigation is not allowed');
      return;
    }

    // Check if forward navigation without validation is allowed
    if (step > currentStep && !allowSkipValidation) {
      console.warn('Forward navigation without validation is not allowed');
      return;
    }

    updateStep(step, currentStep);
  }, [currentStep, totalSteps, allowBackward, allowSkipValidation, updateStep]);

  const reset = useCallback(() => {
    updateStep(1, currentStep);

    // Clear localStorage if persistence is enabled
    if (persistState && typeof window !== 'undefined') {
      localStorage.removeItem(storageKey);
    }
  }, [currentStep, persistState, storageKey, updateStep]);

  const getStepStatus = useCallback((step: number): 'completed' | 'current' | 'upcoming' => {
    if (step < currentStep) { return 'completed'; }
    if (step === currentStep) { return 'current'; }
    return 'upcoming';
  }, [currentStep]);

  return {
    currentStep,
    totalSteps: config.totalSteps,
    isFirstStep,
    isLastStep,
    progress,
    goToNext,
    goToPrevious,
    goToStep,
    reset,
    getStepStatus
  };
};

/**
 * Hook for managing form validation across multiple steps
 *
 * @interface UseFormValidationConfig
 */
interface UseFormValidationConfig<T = any> {
  /** Validation schema for each step */
  validationSchemas: Record<number, (data: T) => boolean | Promise<boolean>>;
  /** Form data to validate */
  formData: T;
}

/**
 * Form validation hook for multi-step forms
 *
 * @param {UseFormValidationConfig} config - Validation configuration
 * @returns {Object} Validation interface
 *
 * @example
 * ```typescript
 * const validation = useFormValidation({
 *   validationSchemas: {
 *     1: (data) => !!data.name && !!data.email,
 *     2: (data) => !!data.selectedExam,
 *     3: (data) => data.syllabus.length > 0
 *   },
 *   formData: onboardingData
 * });
 *
 * const canProceed = validation.isStepValid(currentStep);
 * ```
 */
export const useFormValidation = <T = any>(config: UseFormValidationConfig<T>) => {
  const { validationSchemas, formData } = config;

  const isStepValid = useCallback(async (step: number): Promise<boolean> => {
    const validator = validationSchemas[step];
    if (!validator) {
      console.warn(`No validation schema found for step ${step}`);
      return true;
    }

    try {
      const result = await validator(formData);
      return result;
    } catch (error) {
      console.error(`Validation error for step ${step}:`, error);
      return false;
    }
  }, [validationSchemas, formData]);

  const validateAllSteps = useCallback(async (): Promise<Record<number, boolean>> => {
    const results: Record<number, boolean> = {};

    for (const step of Object.keys(validationSchemas)) {
      const stepNumber = parseInt(step, 10);
      results[stepNumber] = await isStepValid(stepNumber);
    }

    return results;
  }, [validationSchemas, isStepValid]);

  return {
    isStepValid,
    validateAllSteps
  };
};
