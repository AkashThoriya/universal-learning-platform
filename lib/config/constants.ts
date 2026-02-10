/**
 * Application-wide constants
 * This file contains all magic numbers and reusable constants
 */
// ... (keep existing imports if any, though none seen)

// Time constants (in milliseconds)
export const TIME_CONSTANTS = {
  PWA_INSTALL_TIMEOUT: 30000,
  NOTIFICATION_TIMEOUT: 3000,
  DEBOUNCE_DELAY: 800,
  MICRO_LEARNING_DELAY: 600,
  TASK_TIMEOUT: 30000,
  MISSION_TIMEOUT: 30000,
  TOAST_DELAY: 3000,
  SESSION_DELAY: 500,
  MICRO_SESSION_DELAY: 600,
  PERFORMANCE_DELAY: 5000,
} as const;

// ... (keep existing constants)

// Progress thresholds (percentages)
export const PROGRESS_THRESHOLDS = {
  EXCELLENT: 90,
  GOOD: 85,
  AVERAGE: 80,
  POOR: 70,
  LOW_ACCURACY: 70,
  MASTERY_THRESHOLD: 80,
  OPACITY_HIGH: 0.8,
  OPACITY_MEDIUM: 0.6,
  OPACITY_LOW: 0.4,
  SCALE_FACTOR: 1.5,
  BRIGHTNESS_HIGH: 0.95,
  BRIGHTNESS_MEDIUM: 0.9,
  BRIGHTNESS_LOW: 0.6,
  QUALITY_THRESHOLD: 95,
} as const;

// Age and time limits
export const AGE_LIMITS = {
  MAX_AGE_YEARS: 365,
  MAX_AGE_DAYS: 35,
  ROTATION_DEGREES: 180,
  STUDY_TIME_MINUTES: 240,
} as const;

// Date constants (in milliseconds)
export const DATE_CONSTANTS = {
  MILLISECONDS_PER_DAY: 86400000,
  DAYS_IN_WEEK: 7,
  DAYS_IN_MONTH: 30,
  HOURS_PER_DAY: 24,
  MINUTES_PER_HOUR: 60,
} as const;

// Animation and UI constants
export const UI_CONSTANTS = {
  ACHIEVEMENT_DELAY: 500,
  TRANSITION_DELAY: 10000,
  MAX_RETRY_COUNT: 5,
  CHART_ANIMATION_SPEED: 1.5,
  SESSION_OFFSET: -5,
  SCROLL_OFFSET: -7,
  MEMORY_ITEM_SIZE: 45,
} as const;

// Calculation constants
export const CALC_CONSTANTS = {
  COLOR_MAX_VALUE: 255,
  LUMINANCE_RED: 0.2126,
  LUMINANCE_GREEN: 0.7152,
  LUMINANCE_BLUE: 0.0722,
  GAMMA_THRESHOLD: 0.03928,
  GAMMA_DIVISOR: 12.92,
  GAMMA_OFFSET: 0.055,
  GAMMA_MULTIPLIER: 1.055,
  GAMMA_POWER: 2.4,
  CONTRAST_OFFSET: 0.05,
  EMAIL_MAX_LENGTH: 254,
  TOKEN_MAX_SIZE: 768,
} as const;

// Performance and scoring
export const PERFORMANCE_CONSTANTS = {
  MIN_SCORE: 0.1,
  MAX_VELOCITY: 0.95,
  DECAY_RATE: -0.05,
  STABILITY_FACTOR: 0.9,
  CONFIDENCE_THRESHOLD: 0.85,
  LEARNING_RATE: 0.7,
  ADAPTATION_RATE: 0.3,
  WEEKLY_DECAY: 22,
  MONTHLY_DECAY: 14,
  MEMORY_STRENGTH: 0.5,
  PATTERN_WEIGHT: 1.2,
  SESSION_WEIGHT: 1.5,
} as const;

// Preferred Study Times
export const PREFERRED_STUDY_TIMES = [
  { value: 'early_morning', label: 'Early Morning (4 AM - 7 AM)', icon: '🌅' },
  { value: 'morning', label: 'Morning (7 AM - 12 PM)', icon: '☀️' },
  { value: 'afternoon', label: 'Afternoon (12 PM - 5 PM)', icon: '🌤️' },
  { value: 'evening', label: 'Evening (5 PM - 9 PM)', icon: '🌇' },
  { value: 'night', label: 'Night (9 PM - 12 AM)', icon: '🌙' },
  { value: 'late_night', label: 'Late Night (12 AM - 4 AM)', icon: '🦉' },
] as const;
