/**
 * Application-wide constants
 * This file contains all magic numbers and reusable constants
 */

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  PWA_INSTALL_TIMEOUT: 30000,
  NOTIFICATION_TIMEOUT: 3000,
  DEBOUNCE_DELAY: 800,
  MICRO_LEARNING_DELAY: 600,
  TASK_TIMEOUT: 30000,
} as const;

// Progress thresholds (percentages)
export const PROGRESS_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 85,
  AVERAGE: 80,
  POOR: 70,
  OPACITY_HIGH: 0.8,
  OPACITY_MEDIUM: 0.6,
  SCALE_FACTOR: 1.5,
} as const;

// Age and time limits
export const AGE_LIMITS = {
  MAX_AGE_YEARS: 365,
  ROTATION_DEGREES: 180,
} as const;

// Date constants (in milliseconds)
export const DATE_CONSTANTS = {
  MILLISECONDS_PER_DAY: 86400000,
} as const;

// Animation and UI constants
export const UI_CONSTANTS = {
  ACHIEVEMENT_DELAY: 500,
} as const;
