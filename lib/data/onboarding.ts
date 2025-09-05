/**
 * @fileoverview Onboarding Flow Static Data
 *
 * Centralized data for all onboarding-related components including
 * persona options, study preferences, exam categories, and workflow steps.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { GraduationCap, Briefcase, Code, Users, TrendingUp, BookOpen } from 'lucide-react';

import type { UserPersonaType } from '@/types/exam';

// ============================================================================
// PERSONA DEFINITIONS
// ============================================================================

export interface PersonaOption {
  id: UserPersonaType;
  icon: typeof GraduationCap;
  title: string;
  description: string;
  longDescription: string;
  defaultHours: number;
  color: string;
  bgColor: string;
  textColor: string;
  benefits: string[];
  challenges: string[];
}

/**
 * User persona options with comprehensive metadata
 * Used in: PersonaDetectionCompact.tsx, PersonaDetection.tsx
 */
export const PERSONA_OPTIONS: readonly PersonaOption[] = [
  {
    id: 'student' as UserPersonaType,
    icon: BookOpen,
    title: 'Student',
    description: 'Full-time study focus with flexible schedule',
    longDescription: 'Dedicated time for comprehensive preparation with access to structured learning resources',
    defaultHours: 6,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700',
    benefits: ['Flexible schedule', 'Comprehensive coverage', 'Detailed study plans'],
    challenges: ['Time management', 'Self-discipline', 'Motivation consistency'],
  },
  {
    id: 'working_professional' as UserPersonaType,
    icon: Briefcase,
    title: 'Working Professional',
    description: 'Balancing career responsibilities with exam prep',
    longDescription: 'Strategic preparation optimized for limited time with focus on high-impact topics',
    defaultHours: 2,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700',
    benefits: ['Practical application', 'Efficient learning', 'Real-world context'],
    challenges: ['Limited time', 'Work-study balance', 'Energy management'],
  },
  {
    id: 'freelancer' as UserPersonaType,
    icon: Code,
    title: 'Freelancer',
    description: 'Variable schedule with project-based availability',
    longDescription: 'Adaptive study plans that work around client commitments and irregular schedules',
    defaultHours: 4,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700',
    benefits: ['Schedule flexibility', 'Self-directed learning', 'Adaptive planning'],
    challenges: ['Irregular schedule', 'Client priorities', 'Income stability'],
  },
] as const;

// ============================================================================
// STUDY TIME PREFERENCES
// ============================================================================

export interface StudyTimePreference {
  id: string;
  label: string;
  icon: string;
  time: string;
  description: string;
  benefits: string[];
}

/**
 * Study time preferences with detailed metadata
 * Used in: PersonaDetectionCompact.tsx
 */
export const STUDY_TIME_PREFERENCES: readonly StudyTimePreference[] = [
  {
    id: 'morning',
    label: 'Morning',
    icon: '🌅',
    time: '6-10 AM',
    description: 'Fresh mind, fewer distractions',
    benefits: ['Peak cognitive performance', 'Consistent routine', 'Peaceful environment'],
  },
  {
    id: 'afternoon',
    label: 'Afternoon',
    icon: '☀️',
    time: '12-4 PM',
    description: 'Post-lunch focused sessions',
    benefits: ['Good for review sessions', 'Natural break from work', 'Moderate energy levels'],
  },
  {
    id: 'evening',
    label: 'Evening',
    icon: '🌆',
    time: '5-9 PM',
    description: 'After work relaxed learning',
    benefits: ['Unwinding activity', 'Family time balance', 'Reflection on daily learning'],
  },
  {
    id: 'night',
    label: 'Night',
    icon: '🌙',
    time: '9 PM-12 AM',
    description: 'Deep focus in quiet hours',
    benefits: ['Complete silence', 'Deep concentration', 'No interruptions'],
  },
] as const;

// ============================================================================
// EXAM CATEGORIES
// ============================================================================

export interface ExamCategory {
  id: string;
  name: string;
  icon: typeof Users;
  count: number;
  color: string;
  description: string;
}

/**
 * Popular exam categories for onboarding
 * Used in: PersonalInfoStepCompact.tsx
 */
export const POPULAR_EXAM_CATEGORIES: readonly ExamCategory[] = [
  {
    id: 'computer-science',
    name: 'Computer Science',
    icon: Code,
    count: 3,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'DevOps, DSA, SQL, and programming courses',
  },
  {
    id: 'civil-services',
    name: 'Civil Services',
    icon: Users,
    count: 15,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'UPSC, State PCS, and administrative services',
  },
  {
    id: 'banking',
    name: 'Banking',
    icon: TrendingUp,
    count: 12,
    color: 'bg-green-50 text-green-700 border-green-200',
    description: 'Bank PO, Clerk, and financial services',
  },
  {
    id: 'engineering',
    name: 'Engineering',
    icon: BookOpen,
    count: 8,
    color: 'bg-orange-50 text-orange-700 border-orange-200',
    description: 'JEE, GATE, and technical competitions',
  },
] as const;

// ============================================================================
// WEEKDAY DEFINITIONS
// ============================================================================

export interface WeekdayOption {
  value: number;
  label: string;
  short: string;
}

/**
 * Standardized weekday definitions (full week)
 * Used in: MissionConfiguration.tsx, PersonaDetection.tsx
 */
export const WEEKDAY_OPTIONS: readonly WeekdayOption[] = [
  { value: 0, label: 'Sunday', short: 'Sun' },
  { value: 1, label: 'Monday', short: 'Mon' },
  { value: 2, label: 'Tuesday', short: 'Tue' },
  { value: 3, label: 'Wednesday', short: 'Wed' },
  { value: 4, label: 'Thursday', short: 'Thu' },
  { value: 5, label: 'Friday', short: 'Fri' },
  { value: 6, label: 'Saturday', short: 'Sat' },
] as const;

/**
 * Work days for onboarding (simplified format)
 * Used in: PersonaDetection.tsx
 */
export const WORK_DAYS: readonly { id: string; label: string }[] = [
  { id: 'monday', label: 'Monday' },
  { id: 'tuesday', label: 'Tuesday' },
  { id: 'wednesday', label: 'Wednesday' },
  { id: 'thursday', label: 'Thursday' },
  { id: 'friday', label: 'Friday' },
  { id: 'saturday', label: 'Saturday' },
  { id: 'sunday', label: 'Sunday' },
] as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get persona by ID with type safety
 */
export const getPersonaById = (id: UserPersonaType): PersonaOption | undefined => {
  return PERSONA_OPTIONS.find(persona => persona.id === id);
};

/**
 * Get study time preference by ID
 */
export const getStudyTimeById = (id: string): StudyTimePreference | undefined => {
  return STUDY_TIME_PREFERENCES.find(time => time.id === id);
};

/**
 * Get exam category by ID
 */
export const getExamCategoryById = (id: string): ExamCategory | undefined => {
  return POPULAR_EXAM_CATEGORIES.find(category => category.id === id);
};

/**
 * Get weekday by value
 */
export const getWeekdayByValue = (value: number): WeekdayOption | undefined => {
  return WEEKDAY_OPTIONS.find(day => day.value === value);
};

/**
 * Get work day by ID
 */
export const getWorkDayById = (id: string): { id: string; label: string } | undefined => {
  return WORK_DAYS.find(day => day.id === id);
};

/**
 * Get default study hours for a persona
 */
export const getDefaultStudyHours = (personaId: UserPersonaType): number => {
  const persona = getPersonaById(personaId);
  return persona?.defaultHours ?? 2;
};

/**
 * Validate study hours for a specific persona
 */
export const validateStudyHours = (personaId: UserPersonaType, hours: number): string[] => {
  const errors: string[] = [];

  if (personaId === 'working_professional' && hours > 4) {
    errors.push('Consider a more realistic goal for working professionals (2-4 hours)');
  } else if (personaId === 'student' && hours < 4) {
    errors.push('Students typically benefit from 4+ hours of daily study');
  }

  return errors;
};
