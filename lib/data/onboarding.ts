/**
 * @fileoverview Onboarding Flow Static Data
 *
 * Centralized data for all onboarding-related components including
 * persona options, study preferences, exam categories, and workflow steps.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { GraduationCap, Briefcase, Code } from 'lucide-react';

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
    icon: GraduationCap,
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
