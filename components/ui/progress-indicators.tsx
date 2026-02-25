/**
 * @fileoverview Enterprise-grade progress indicator components
 *
 * Reusable progress indicators for multi-step flows, loading states,
 * and goal tracking. Designed with accessibility and customization
 * in mind following design system standards.
 *
 * @author Universal Learning Platform Team
 * @version 1.0.0
 */

import { CheckCircle, Circle, Clock } from 'lucide-react';
import { Fragment, FC } from 'react';

import { cn } from '@/lib/utils/utils';

/**
 * Configuration for step progress indicator
 */
interface StepProgressIndicatorProps {
  /** Current step number (1-based) */
  currentStep: number;
  /** Total number of steps */
  totalSteps: number;
  /** Step labels (optional) */
  stepLabels?: string[];
  /** Custom step status function */
  getStepStatus?: (step: number, current: number) => 'completed' | 'current' | 'upcoming';
  /** Show step numbers */
  showStepNumbers?: boolean;
  /** Compact mode for smaller screens */
  compact?: boolean;
  /** Custom styling classes */
  className?: string;
}

/**
 * Multi-step progress indicator component
 *
 * Displays progress through a multi-step process with clear visual
 * indicators for completed, current, and upcoming steps.
 *
 * @param {StepProgressIndicatorProps} props - Component props
 * @returns {JSX.Element} Step progress indicator
 *
 * @example
 * ```typescript
 * <StepProgressIndicator
 *   currentStep={2}
 *   totalSteps={4}
 *   stepLabels={['Personal Info', 'Learning Path', 'Curriculum', 'Settings']}
 *   showStepNumbers={true}
 * />
 * ```
 */
export const StepProgressIndicator: FC<StepProgressIndicatorProps> = ({
  currentStep,
  totalSteps,
  stepLabels = [],
  getStepStatus,
  showStepNumbers = true,
  compact = false,
  className,
}) => {
  const defaultGetStepStatus = (step: number, current: number) => {
    if (step < current) {
      return 'completed';
    }
    if (step === current) {
      return 'current';
    }
    return 'upcoming';
  };

  const stepStatus = getStepStatus || defaultGetStepStatus;

  const getStepIcon = (step: number) => {
    const status = stepStatus(step, currentStep);

    switch (status) {
      case 'completed':
        return <CheckCircle className="h-6 w-6 text-green-600" />;
      case 'current':
        return <Clock className="h-6 w-6 text-blue-600" />;
      default:
        return <Circle className="h-6 w-6 text-gray-300" />;
    }
  };

  const getStepClasses = (step: number) => {
    const status = stepStatus(step, currentStep);
    const baseClasses = 'flex items-center justify-center rounded-full border-2 transition-colors';

    switch (status) {
      case 'completed':
        return cn(baseClasses, 'border-green-600 bg-green-50');
      case 'current':
        return cn(baseClasses, 'border-blue-600 bg-blue-50');
      default:
        return cn(baseClasses, 'border-gray-300 bg-gray-50');
    }
  };

  const getConnectorClasses = (step: number) => {
    const isCompleted = stepStatus(step, currentStep) === 'completed';
    return cn('flex-1 h-0.5 transition-colors', isCompleted ? 'bg-green-600' : 'bg-gray-300');
  };

  if (compact) {
    return (
      <div className={cn('flex items-center space-x-2', className)}>
        <div className="flex items-center space-x-1">
          {Array.from({ length: totalSteps }, (_, index) => {
            const step = index + 1;
            const status = stepStatus(step, currentStep);

            return (
              <div
                key={step}
                className={cn(
                  'h-2 w-8 rounded-full transition-colors',
                  status === 'completed' ? 'bg-green-600' : status === 'current' ? 'bg-blue-600' : 'bg-gray-300'
                )}
              />
            );
          })}
        </div>
        <span className="text-sm text-gray-600 font-medium">
          {currentStep} of {totalSteps}
        </span>
      </div>
    );
  }

  return (
    <div className={cn('w-full', className)} role="progressbar" aria-valuenow={currentStep} aria-valuemax={totalSteps}>
      <div className="flex items-center justify-between">
        {Array.from({ length: totalSteps }, (_, index) => {
          const step = index + 1;
          const isLast = step === totalSteps;
          const status = stepStatus(step, currentStep);
          const label = stepLabels[index] || `Step ${step}`;

          return (
            <Fragment key={step}>
              <div className="flex flex-col items-center space-y-2">
                <div className={getStepClasses(step)}>
                  {showStepNumbers && !['completed'].includes(status) ? (
                    <span
                      className={cn('text-sm font-semibold', status === 'current' ? 'text-blue-600' : 'text-gray-400')}
                    >
                      {step}
                    </span>
                  ) : (
                    getStepIcon(step)
                  )}
                </div>
                <div className="text-center">
                  <div
                    className={cn(
                      'text-sm font-medium',
                      status === 'completed'
                        ? 'text-green-600'
                        : status === 'current'
                          ? 'text-blue-600'
                          : 'text-gray-400'
                    )}
                  >
                    {label}
                  </div>
                </div>
              </div>

              {!isLast && <div className={getConnectorClasses(step)} />}
            </Fragment>
          );
        })}
      </div>
    </div>
  );
};

/**
 * Configuration for circular progress indicator
 */
interface CircularProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Size of the circle */
  size?: 'sm' | 'md' | 'lg' | 'xl';
  /** Show percentage text */
  showPercentage?: boolean;
  /** Custom text to display */
  customText?: string;
  /** Color theme */
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  /** Stroke width */
  strokeWidth?: number;
  /** Custom styling classes */
  className?: string;
}

/**
 * Circular progress indicator component
 *
 * Displays progress as a circular indicator with customizable
 * size, color, and text display options.
 *
 * @param {CircularProgressProps} props - Component props
 * @returns {JSX.Element} Circular progress indicator
 *
 * @example
 * ```typescript
 * <CircularProgress
 *   value={75}
 *   size="lg"
 *   color="green"
 *   showPercentage={true}
 * />
 * ```
 */
export const CircularProgress: FC<CircularProgressProps> = ({
  value,
  size = 'md',
  showPercentage = true,
  customText,
  color = 'blue',
  strokeWidth = 8,
  className,
}) => {
  const sizeConfig = {
    sm: { diameter: 60, fontSize: 'text-xs' },
    md: { diameter: 80, fontSize: 'text-sm' },
    lg: { diameter: 120, fontSize: 'text-base' },
    xl: { diameter: 160, fontSize: 'text-lg' },
  };

  const colorConfig = {
    blue: { stroke: '#3B82F6', text: 'text-blue-600' },
    green: { stroke: '#10B981', text: 'text-green-600' },
    yellow: { stroke: '#F59E0B', text: 'text-yellow-600' },
    red: { stroke: '#EF4444', text: 'text-red-600' },
    purple: { stroke: '#8B5CF6', text: 'text-purple-600' },
  };

  const config = sizeConfig[size];
  const colors = colorConfig[color];
  const radius = (config.diameter - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (value / 100) * circumference;

  const displayText = customText || (showPercentage ? `${Math.round(value)}%` : '');

  return (
    <div
      className={cn('relative inline-flex items-center justify-center', className)}
      style={{ width: config.diameter, height: config.diameter }}
    >
      <svg width={config.diameter} height={config.diameter} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          stroke="#E5E7EB"
          strokeWidth={strokeWidth}
          fill="none"
        />
        {/* Progress circle */}
        <circle
          cx={config.diameter / 2}
          cy={config.diameter / 2}
          r={radius}
          stroke={colors.stroke}
          strokeWidth={strokeWidth}
          fill="none"
          strokeLinecap="round"
          strokeDasharray={circumference}
          strokeDashoffset={offset}
          className="transition-all duration-500 ease-out"
        />
      </svg>

      {displayText && (
        <div
          className={cn(
            'absolute inset-0 flex items-center justify-center font-semibold',
            config.fontSize,
            colors.text
          )}
        >
          {displayText}
        </div>
      )}
    </div>
  );
};

/**
 * Configuration for linear progress bar
 */
interface LinearProgressProps {
  /** Progress value (0-100) */
  value: number;
  /** Show percentage text */
  showPercentage?: boolean;
  /** Progress bar height */
  height?: 'sm' | 'md' | 'lg';
  /** Color theme */
  color?: 'blue' | 'green' | 'yellow' | 'red' | 'purple';
  /** Animated progress */
  animated?: boolean;
  /** Custom styling classes */
  className?: string;
}

/**
 * Linear progress bar component
 *
 * Displays progress as a horizontal bar with customizable
 * styling and animation options.
 *
 * @param {LinearProgressProps} props - Component props
 * @returns {JSX.Element} Linear progress bar
 *
 * @example
 * ```typescript
 * <LinearProgress
 *   value={65}
 *   height="md"
 *   color="green"
 *   showPercentage={true}
 *   animated={true}
 * />
 * ```
 */
export const LinearProgress: FC<LinearProgressProps> = ({
  value,
  showPercentage = false,
  height = 'md',
  color = 'blue',
  animated = false,
  className,
}) => {
  const heightConfig = {
    sm: 'h-2',
    md: 'h-3',
    lg: 'h-4',
  };

  const colorConfig = {
    blue: 'bg-blue-600',
    green: 'bg-green-600',
    yellow: 'bg-yellow-600',
    red: 'bg-red-600',
    purple: 'bg-purple-600',
  };

  return (
    <div className={cn('w-full', className)}>
      {showPercentage && (
        <div className="flex justify-between text-sm text-gray-600 mb-1">
          <span>Progress</span>
          <span>{Math.round(value)}%</span>
        </div>
      )}

      <div className={cn('w-full bg-gray-200 rounded-full overflow-hidden', heightConfig[height])}>
        <div
          className={cn(
            'h-full rounded-full transition-all duration-500 ease-out',
            colorConfig[color],
            animated && 'animate-pulse'
          )}
          style={{ width: `${Math.min(100, Math.max(0, value))}%` }}
        />
      </div>
    </div>
  );
};
