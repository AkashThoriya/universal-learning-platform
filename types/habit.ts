import { Timestamp } from 'firebase/firestore';

// ============================================
// Union Types
// ============================================

/** Habit origin: system-tracked from platform events, or user-created */
export type HabitType = 'SYSTEM' | 'CUSTOM';

/** Tracking frequency */
export type Frequency = 'DAILY' | 'WEEKLY';

/** How the habit's progress is measured */
export type MetricType = 'BOOLEAN' | 'COUNT' | 'DURATION';

/** Platform events that system habits can listen to */
export type HabitEventType = 'TOPIC_COMPLETED' | 'TEST_COMPLETED';

// ============================================
// Core Document — Firestore: users/{userId}/habits/{habitId}
// ============================================

export interface HabitDocument {
  /** Firestore document ID */
  id: string;
  /** Owner user ID */
  userId: string;
  /** null = global habit, string = course-scoped */
  courseId: string | null;

  // --- Configuration ---
  /** Display title */
  title: string;
  /** Optional description */
  description?: string;
  /** Lucide icon name for UI rendering */
  icon?: string;
  /** System (auto-tracked) or Custom (user-managed) */
  type: HabitType;
  /** Daily or Weekly tracking */
  frequency: Frequency;
  /** Boolean / Count / Duration measurement */
  metricType: MetricType;
  /** Target: 1 for BOOLEAN, N for COUNT, minutes for DURATION */
  targetValue: number;

  // --- Event Linking (System Habits only) ---
  /** Which platform event triggers this habit */
  linkedEventId?: HabitEventType;

  // --- Current State (denormalized for fast reads) ---
  /** Progress made today (or this week for WEEKLY) */
  currentValue: number;
  /** Whether target has been met for current period */
  isCompletedToday: boolean;
  /** Consecutive periods the target was met */
  currentStreak: number;
  /** All-time longest streak */
  longestStreak: number;
  /** When target was last met (null = never) */
  lastCompletedDate: Timestamp | null;

  // --- History (sparse map for heatmap) ---
  /** "YYYY-MM-DD" → value achieved that day */
  history: Record<string, number>;

  // --- Metadata ---
  /** Soft-delete / pause flag */
  isActive: boolean;
  /** Sort order in UI */
  order: number;
  /** Creation timestamp */
  createdAt: Timestamp;
  /** Last update timestamp */
  updatedAt: Timestamp;
}

// ============================================
// Event Payload — passed to HabitEngine.processEvent()
// ============================================

export interface HabitEvent {
  /** User who triggered the event */
  userId: string;
  /** Type of platform event */
  eventType: HabitEventType;
  /** Override value (default 1) */
  value?: number;
  /** Course context (if applicable) */
  courseId?: string | null;
}

// ============================================
// Aggregated Stats — for dashboard widget
// ============================================

export interface HabitStats {
  /** Total active habits */
  totalHabits: number;
  /** Habits completed in current period */
  completedToday: number;
  /** Longest active streak across all habits */
  longestActiveStreak: number;
  /** Overall completion rate 0-100 */
  overallCompletionRate: number;
}

// ============================================
// Form Data — for creating custom habits
// ============================================

export interface CreateHabitInput {
  title: string;
  description?: string;
  icon?: string;
  frequency: Frequency;
  metricType: MetricType;
  targetValue: number;
  courseId?: string | null;
}

// ============================================
// Wellness Check-In — replaces daily log mood tracking
// ============================================

export interface WellnessCheckIn {
  /** Overall mood 1 (bad) to 5 (great) */
  mood: 1 | 2 | 3 | 4 | 5;
  /** Energy level 1-10 */
  energy: number;
  /** Optional daily reflection note */
  note?: string;
}
