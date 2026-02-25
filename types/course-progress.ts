/**
 * @fileoverview Course Progress Type Definitions
 *
 * Comprehensive type definitions for the Multi-Course Architecture.
 * Supports multiple simultaneous courses per user with isolated progress tracking.
 *
 * Features:
 * - Course entity definitions (goal, skill, custom types)
 * - User-course relationships with status tracking
 * - Course-scoped progress and statistics
 * - Per-topic mastery within a course
 * - Course-specific settings and preferences
 *
 * @author Universal Learning Platform Team
 * @version 1.0.0
 */

import { Timestamp } from 'firebase/firestore';
import { MissionDifficulty, LearningTrack } from './mission-system';

// =====================================================
// CORE COURSE TYPES
// =====================================================

/**
 * Course type classification
 */
export type CourseType = 'exam' | 'skill' | 'custom' | 'certification';

/**
 * Course status in user's library
 */
export type CourseStatus = 'active' | 'paused' | 'completed' | 'archived';

// =====================================================
// COURSE ENTITY
// =====================================================

/**
 * Core course entity representing a learning track
 * This is the master course definition (template)
 */
export interface Course {
  /** Unique course identifier */
  id: string;
  /** Display name of the course */
  name: string;
  /** Short description */
  description?: string;
  /** Course type classification */
  type: CourseType;
  /** Associated learning track */
  track: LearningTrack;
  /** Icon identifier (e.g., lucide icon name) */
  icon?: string;
  /** Primary color for UI theming (hex) */
  color?: string;
  /** Category for grouping (e.g., "Government Goals", "Tech Skills") */
  category?: string;
  /** Whether this is a predefined goal or custom course */
  isCustom: boolean;
  /** Estimated duration in months */
  estimatedDurationMonths?: number;
  /** Course metadata */
  metadata?: {
    totalTopics?: number;
    totalSubjects?: number;
    difficulty?: MissionDifficulty;
    passingScore?: number;
  };
  /** Creation timestamp */
  createdAt: Timestamp;
  /** Last update timestamp */
  updatedAt: Timestamp;
}

// =====================================================
// USER-COURSE RELATIONSHIP
// =====================================================

/**
 * User-course enrollment/subscription
 * Stored at: users/{userId}/courses/{courseId}
 */
export interface UserCourse {
  /** Reference to the course ID */
  courseId: string;
  /** Denormalized course name for quick display */
  courseName: string;
  /** Course type */
  courseType: CourseType;
  /** Current status of this course for the user */
  status: CourseStatus;
  /** Whether this is the user's primary/active course */
  isPrimary: boolean;
  /** Target date for completion (target date, goal deadline) */
  targetDate?: Timestamp;
  /** When user started this course */
  startedAt: Timestamp;
  /** Last time user accessed this course */
  lastAccessedAt: Timestamp;
  /** User-specific settings for this course */
  settings: CourseSettings;
  /** Denormalized icon for quick display */
  icon?: string;
  /** Denormalized color for UI theming */
  color?: string;
}

/**
 * Course-specific user settings
 */
export interface CourseSettings {
  /** Daily study goal in minutes */
  dailyGoalMinutes: number;
  /** Weekly study goal in hours */
  weeklyGoalHours: number;
  /** Whether notifications are enabled for this course */
  notificationsEnabled: boolean;
  /** Preferred mission difficulty */
  preferredDifficulty: MissionDifficulty;
  /** Reminder time preference (24-hour format, e.g., "09:00") */
  reminderTime?: string;
  /** Active days for study (0=Sunday, 6=Saturday) */
  activeDays: number[];
  /** Whether to use different schedule for weekends */
  useWeekendSchedule?: boolean | undefined;
  /** Study minutes for weekdays (Mon-Fri) */
  weekdayStudyMinutes?: number | undefined;
  /** Study minutes for weekends (Sat-Sun) */
  weekendStudyMinutes?: number | undefined;
}

// =====================================================
// COURSE PROGRESS TRACKING
// =====================================================

/**
 * Aggregated course progress
 * Stored at: users/{userId}/courses/{courseId}/progress/summary
 */
export interface CourseProgress {
  /** Course ID this progress belongs to */
  courseId: string;
  /** User ID */
  userId: string;
  /** Overall completion percentage (0-100) */
  overallProgress: number;
  /** Aggregated statistics */
  stats: CourseStats;
  /** Subject-level progress breakdown */
  subjectProgress: SubjectProgressItem[];
  /** Last calculated/updated timestamp */
  lastUpdated: Timestamp;
}

/**
 * Aggregated course statistics
 */
export interface CourseStats {
  /** Total study time in minutes */
  totalStudyTime: number;
  /** Number of completed missions */
  completedMissions: number;
  /** Average score across all assessments (0-100) */
  averageScore: number;
  /** Current consecutive study day streak */
  streak: number;
  /** Longest streak ever achieved */
  longestStreak: number;
  /** Weekly goal progress percentage (0-100) */
  weeklyGoalProgress: number;
  /** Total topics studied */
  topicsStudied: number;
  /** Total topics completed (mastery >= 80) */
  topicsCompleted: number;
  /** Number of mock tests taken */
  mockTestsTaken: number;
  /** Average mock test score */
  averageMockScore: number;
}

/**
 * Subject-level progress within a course
 */
export interface SubjectProgressItem {
  /** Subject ID */
  subjectId: string;
  /** Subject name (denormalized) */
  subjectName: string;
  /** Progress percentage (0-100) */
  progress: number;
  /** Number of topics in this subject */
  totalTopics: number;
  /** Number of completed topics */
  completedTopics: number;
  /** Average mastery score across topics */
  averageMastery: number;
}

// =====================================================
// TOPIC PROGRESS (PER-COURSE)
// =====================================================

/**
 * Topic-level progress within a course
 * Stored at: users/{userId}/courses/{courseId}/topicProgress/{topicId}
 */
export interface TopicProgress {
  /** Topic ID */
  topicId: string;
  /** Subject ID this topic belongs to */
  subjectId: string;
  /** Course ID */
  courseId: string;
  /** Topic name (denormalized) */
  topicName?: string;
  /** Subject name (denormalized) */
  subjectName?: string;
  /** Mastery score (0-100) */
  masteryScore: number;
  /** Number of times revised */
  revisionCount: number;
  /** Last revision timestamp */
  lastRevised?: Timestamp;
  /** Study time spent on this topic in minutes */
  studyTimeMinutes: number;
  /** User's personal notes */
  notes?: string;
  /** Current affairs/updates linked to this topic */
  currentAffairs?: CurrentAffairItem[];
  /** Whether user has marked this as complete */
  isCompleted: boolean;
  /** Whether user has bookmarked this topic */
  isBookmarked: boolean;
  /** Last updated timestamp */
  updatedAt: Timestamp;
}

/**
 * Current affair/news item linked to a topic
 */
export interface CurrentAffairItem {
  /** Unique identifier */
  id: string;
  /** Title of the current affair */
  title: string;
  /** Optional description */
  description?: string;
  /** Source URL if available */
  sourceUrl?: string;
  /** Date of the news/event */
  date: Timestamp;
  /** When user added this */
  addedAt: Timestamp;
}

// =====================================================
// COURSE CONTEXT TYPES
// =====================================================

/**
 * Course context value for React context
 */
export interface CourseContextValue {
  /** Currently active/selected course */
  activeCourse: UserCourse | null;
  /** Currently active course ID */
  activeCourseId: string | null;
  /** All user's enrolled courses */
  courses: UserCourse[];
  /** Progress for the active course */
  activeProgress: CourseProgress | null;
  /** Switch to a different course */
  switchCourse: (courseId: string) => Promise<void>;
  /** Refresh progress for current course */
  refreshProgress: () => Promise<void>;
  /** Add a new course */
  addCourse: (course: Omit<UserCourse, 'startedAt' | 'lastAccessedAt'>) => Promise<string>;
  /** Update course settings */
  updateCourseSettings: (courseId: string, settings: Partial<CourseSettings>) => Promise<void>;
  /** Archive a course */
  archiveCourse: (courseId: string) => Promise<void>;
  /** Loading state for initial load */
  isLoading: boolean;
  /** Loading state for course switching */
  isSwitching: boolean;
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * Course creation input (for adding new courses)
 */
export interface CreateCourseInput {
  /** Course ID (from predefined goals or generated for custom) */
  courseId: string;
  /** Course name */
  courseName: string;
  /** Course type */
  courseType: CourseType;
  /** Target date */
  targetDate?: Date;
  /** Initial settings */
  settings?: Partial<CourseSettings>;
  /** Icon */
  icon?: string;
  /** Color */
  color?: string;
}

/**
 * Default course settings
 */
export const DEFAULT_COURSE_SETTINGS: CourseSettings = {
  dailyGoalMinutes: 60,
  weeklyGoalHours: 10,
  notificationsEnabled: true,
  preferredDifficulty: 'intermediate',
  reminderTime: '09:00',
  activeDays: [1, 2, 3, 4, 5], // Monday to Friday
};

