import { useState, useEffect, useCallback } from 'react';

export type AiThinkingStep = {
  id: string;
  label: string;
  duration?: number; // Optional override for specific step duration
};

interface UseAiThinkingProps {
  steps: AiThinkingStep[];
  onComplete?: () => void;
  defaultStepDuration?: number;
  autoStart?: boolean;
}

interface UseAiThinkingReturn {
  currentStepIndex: number;
  currentStep: AiThinkingStep | undefined;
  isCompleted: boolean;
  start: () => void;
  reset: () => void;
  progress: number; // 0 to 1 based on steps completed
}

export function useAiThinking({
  steps,
  onComplete,
  defaultStepDuration = 1500,
  autoStart = false,
}: UseAiThinkingProps): UseAiThinkingReturn {
  const [currentStepIndex, setCurrentStepIndex] = useState(0);
  const [isActive, setIsActive] = useState(autoStart);
  const [isCompleted, setIsCompleted] = useState(false);

  // Start the process
  const start = useCallback(() => {
    setCurrentStepIndex(0);
    setIsCompleted(false);
    setIsActive(true);
  }, []);

  // Reset the process
  const reset = useCallback(() => {
    setCurrentStepIndex(0);
    setIsCompleted(false);
    setIsActive(false);
  }, []);

  useEffect(() => {
    if (!isActive || isCompleted) return;

    // Check if we are done
    if (currentStepIndex >= steps.length) {
      setIsActive(false);
      setIsCompleted(true);
      if (onComplete) {
        onComplete();
      }
      return;
    }

    const currentStep = steps[currentStepIndex];
    const duration = currentStep.duration ?? defaultStepDuration;

    const timer = setTimeout(() => {
      setCurrentStepIndex((prev) => prev + 1);
    }, duration);

    return () => clearTimeout(timer);
  }, [isActive, isCompleted, currentStepIndex, steps, defaultStepDuration, onComplete]);

  return {
    currentStepIndex: Math.min(currentStepIndex, steps.length - 1), // Clamp for display
    currentStep: steps[Math.min(currentStepIndex, steps.length - 1)],
    isCompleted,
    start,
    reset,
    progress: Math.min((currentStepIndex / steps.length) * 100, 100),
  };
}
