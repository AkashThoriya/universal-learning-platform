# 🔧 Static Data Migration Implementation Guide

## 📋 **Implementation Files**

This document shows the exact file structure and code for implementing the static data organization recommendations.

---

## 📁 **File 1: lib/data/onboarding.ts**

```typescript
/**
 * @fileoverview Onboarding Flow Static Data
 * 
 * Centralized data for all onboarding-related components including
 * persona options, study preferences, exam categories, and workflow steps.
 * 
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { GraduationCap, Briefcase, Code, Users, TrendingUp, BookOpen, Plus } from 'lucide-react';
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
    id: 'student',
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
    id: 'working_professional',
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
    id: 'freelancer',
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
 * Used in: PersonaDetectionCompact.tsx, PersonaDetection.tsx
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
    id: 'civil-services',
    name: 'Civil Services',
    icon: Users,
    count: 15,
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'UPSC, State PCS, and other administrative services',
  },
  {
    id: 'banking',
    name: 'Banking',
    icon: TrendingUp,
    count: 12,
    color: 'bg-green-50 text-green-700 border-green-200',
    description: 'Bank PO, Clerk, and financial service exams',
  },
  {
    id: 'engineering',
    name: 'Engineering',
    icon: BookOpen,
    count: 8,
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'JEE, GATE, and technical competitive exams',
  },
  {
    id: 'medical',
    name: 'Medical',
    icon: Plus,
    count: 6,
    color: 'bg-red-50 text-red-700 border-red-200',
    description: 'NEET, AIIMS, and medical entrance exams',
  },
] as const;

// ============================================================================
// WORKFLOW STEPS
// ============================================================================

export interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  icon: string;
}

/**
 * Onboarding workflow step definitions
 * Used in: app/onboarding/setup/page.tsx
 */
export const ONBOARDING_STEPS: readonly OnboardingStep[] = [
  {
    id: 'personal-info',
    title: 'Personal Information',
    description: 'Tell us about yourself and your exam goals',
    estimatedTime: '2 minutes',
    icon: '👤',
  },
  {
    id: 'exam-selection',
    title: 'Exam Selection',
    description: 'Choose your target exam or create a custom one',
    estimatedTime: '3 minutes',
    icon: '🎯',
  },
  {
    id: 'custom-exam',
    title: 'Custom Exam Setup',
    description: 'Configure your personalized exam structure',
    estimatedTime: '5 minutes',
    icon: '⚙️',
  },
  {
    id: 'study-preferences',
    title: 'Study Preferences',
    description: 'Set your learning style and schedule preferences',
    estimatedTime: '3 minutes',
    icon: '📚',
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
 * Standardized weekday definitions
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
 * Simplified weekday format for forms
 * Used in: PersonaDetection.tsx work schedule
 */
export const WORK_DAYS: readonly Array<{ id: string; label: string }> = [
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
```

---

## 📁 **File 2: lib/data/ui-content.ts**

```typescript
/**
 * @fileoverview UI Content and Marketing Data
 * 
 * Centralized content for marketing pages, feature descriptions,
 * and user-facing text across the application.
 * 
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { Target, TrendingUp, Shield, Wifi, Download, Zap, FileText, BarChart } from 'lucide-react';

// ============================================================================
// LOGIN PAGE CONTENT
// ============================================================================

export interface FeatureHighlight {
  icon: typeof Target;
  title: string;
  description: string;
  color: string;
}

/**
 * Feature highlights for login page
 * Used in: app/login/page.tsx
 */
export const LOGIN_FEATURES: readonly FeatureHighlight[] = [
  {
    icon: Target,
    title: 'Strategic Planning',
    description: 'Tier-based prioritization with spaced repetition',
    color: 'blue',
  },
  {
    icon: TrendingUp,
    title: 'Progress Analytics',
    description: 'AI-powered insights and performance correlation',
    color: 'green',
  },
  {
    icon: Shield,
    title: 'Contextual Mastery',
    description: 'Personal context creation for deeper understanding',
    color: 'purple',
  },
] as const;

// ============================================================================
// PWA CONTENT
// ============================================================================

export interface PWABenefit {
  icon: string;
  title: string;
  description: string;
}

/**
 * PWA installation benefits
 * Used in: PWAInstallBanner.tsx
 */
export const PWA_BENEFITS: readonly PWABenefit[] = [
  {
    icon: '⚡',
    title: 'Faster Loading',
    description: 'Lightning-fast performance with offline caching',
  },
  {
    icon: '📱',
    title: 'Native Experience',
    description: 'App-like experience on your device',
  },
  {
    icon: '🔔',
    title: 'Smart Notifications',
    description: 'Study reminders and progress updates',
  },
] as const;

export interface OfflineFeature {
  icon: typeof Wifi;
  title: string;
  description: string;
  available: boolean;
}

/**
 * Offline capabilities description
 * Used in: app/offline/page.tsx
 */
export const OFFLINE_FEATURES: readonly OfflineFeature[] = [
  {
    icon: Wifi,
    title: 'Offline Study',
    description: 'Continue your study sessions without internet connection',
    available: true,
  },
  {
    icon: Download,
    title: 'Content Sync',
    description: 'Download content for offline access automatically',
    available: true,
  },
  {
    icon: Zap,
    title: 'Background Sync',
    description: 'Sync your progress when connection is restored',
    available: true,
  },
  {
    icon: FileText,
    title: 'Offline Notes',
    description: 'Take notes and save them locally',
    available: false,
  },
  {
    icon: BarChart,
    title: 'Offline Analytics',
    description: 'View cached performance data',
    available: false,
  },
] as const;

// ============================================================================
// PROFILE PAGE CONTENT
// ============================================================================

export interface ProfileTab {
  id: string;
  label: string;
  icon: typeof Target;
  description: string;
}

/**
 * Profile page tab configuration
 * Used in: app/profile/page.tsx
 */
export const PROFILE_TABS: readonly ProfileTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Target,
    description: 'General account information and statistics',
  },
  {
    id: 'preferences',
    label: 'Preferences',
    icon: Shield,
    description: 'Study preferences and notification settings',
  },
  {
    id: 'progress',
    label: 'Progress',
    icon: TrendingUp,
    description: 'Detailed progress tracking and analytics',
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: Target,
    description: 'Unlocked achievements and badges',
  },
] as const;

// ============================================================================
// APP MESSAGING
// ============================================================================

export const APP_MESSAGES = {
  loading: {
    default: 'Loading...',
    dashboard: 'Loading your dashboard...',
    analytics: 'Analyzing your performance...',
    content: 'Preparing your content...',
  },
  errors: {
    generic: 'Something went wrong. Please try again.',
    network: 'Network error. Please check your connection.',
    authentication: 'Authentication failed. Please sign in again.',
    notFound: 'The requested content was not found.',
  },
  success: {
    saved: 'Changes saved successfully!',
    completed: 'Task completed successfully!',
    synced: 'Data synchronized successfully!',
  },
} as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get feature by color theme
 */
export const getFeaturesByColor = (color: string): FeatureHighlight[] => {
  return LOGIN_FEATURES.filter(feature => feature.color === color);
};

/**
 * Get profile tab by ID
 */
export const getProfileTabById = (id: string): ProfileTab | undefined => {
  return PROFILE_TABS.find(tab => tab.id === id);
};

/**
 * Get available offline features
 */
export const getAvailableOfflineFeatures = (): OfflineFeature[] => {
  return OFFLINE_FEATURES.filter(feature => feature.available);
};
```

---

## 📁 **File 3: lib/constants/ui.ts**

```typescript
/**
 * @fileoverview UI Constants and Design Tokens
 * 
 * Centralized UI constants including breakpoints, animations,
 * spacing, and design system values.
 * 
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

// ============================================================================
// BREAKPOINTS
// ============================================================================

export const BREAKPOINTS = {
  mobile: 768,
  tablet: 1024,
  desktop: 1280,
  wide: 1536,
} as const;

// ============================================================================
// ANIMATION CONSTANTS
// ============================================================================

export const ANIMATION_DURATIONS = {
  instant: 0,
  fast: 200,
  medium: 300,
  slow: 500,
  slower: 800,
} as const;

export const ANIMATION_EASINGS = {
  easeInOut: 'ease-in-out',
  easeOut: 'ease-out',
  easeIn: 'ease-in',
  bounceOut: 'cubic-bezier(0.34, 1.56, 0.64, 1)',
} as const;

// ============================================================================
// SPACING SCALE
// ============================================================================

export const SPACING = {
  xs: 4,
  sm: 8,
  md: 16,
  lg: 24,
  xl: 32,
  xxl: 48,
  xxxl: 64,
} as const;

// ============================================================================
// COMPONENT SIZES
// ============================================================================

export const ICON_SIZES = {
  small: 16,
  medium: 24,
  large: 32,
  xlarge: 48,
} as const;

export const BUTTON_HEIGHTS = {
  small: 32,
  medium: 40,
  large: 48,
} as const;

// ============================================================================
// GRID CONFIGURATIONS
// ============================================================================

export const GRID_COLUMNS = {
  mobile: 2,
  tablet: 3,
  desktop: 4,
  wide: 6,
} as const;

// ============================================================================
// Z-INDEX SCALE
// ============================================================================

export const Z_INDEX = {
  dropdown: 1000,
  sticky: 1020,
  fixed: 1030,
  modal: 1040,
  popover: 1050,
  tooltip: 1060,
  toast: 1070,
} as const;

// ============================================================================
// OPACITY LEVELS
// ============================================================================

export const OPACITY = {
  disabled: 0.5,
  medium: 0.6,
  high: 0.8,
  translucent: 0.9,
} as const;

// ============================================================================
// BORDER RADIUS
// ============================================================================

export const BORDER_RADIUS = {
  none: 0,
  small: 4,
  medium: 8,
  large: 12,
  xlarge: 16,
  round: 9999,
} as const;

// ============================================================================
// SHADOW LEVELS
// ============================================================================

export const SHADOWS = {
  small: '0 1px 3px rgba(0, 0, 0, 0.12)',
  medium: '0 4px 8px rgba(0, 0, 0, 0.12)',
  large: '0 8px 16px rgba(0, 0, 0, 0.12)',
  xlarge: '0 16px 32px rgba(0, 0, 0, 0.12)',
} as const;
```

---

## 📁 **File 4: lib/data/index.ts (Re-export Hub)**

```typescript
/**
 * @fileoverview Central Data Export Hub
 * 
 * Single import point for all static data across the application.
 * Provides organized access to onboarding, UI content, and business data.
 * 
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

// ============================================================================
// ONBOARDING DATA
// ============================================================================

export {
  PERSONA_OPTIONS,
  STUDY_TIME_PREFERENCES,
  POPULAR_EXAM_CATEGORIES,
  ONBOARDING_STEPS,
  WEEKDAY_OPTIONS,
  WORK_DAYS,
  getPersonaById,
  getStudyTimeById,
  getExamCategoryById,
} from './onboarding';

export type {
  PersonaOption,
  StudyTimePreference,
  ExamCategory,
  OnboardingStep,
  WeekdayOption,
} from './onboarding';

// ============================================================================
// UI CONTENT
// ============================================================================

export {
  LOGIN_FEATURES,
  PWA_BENEFITS,
  OFFLINE_FEATURES,
  PROFILE_TABS,
  APP_MESSAGES,
  getFeaturesByColor,
  getProfileTabById,
  getAvailableOfflineFeatures,
} from './ui-content';

export type {
  FeatureHighlight,
  PWABenefit,
  OfflineFeature,
  ProfileTab,
} from './ui-content';

// ============================================================================
// BUSINESS DATA (Existing)
// ============================================================================

export {
  EXAMS_DATA,
  getExamById,
  getExamsByCategory,
  getAllCategories,
  searchExams,
} from '../exams-data';

export {
  SUBJECTS_DATA,
} from '../subjects-data';

// ============================================================================
// UTILITY TYPES
// ============================================================================

export type StaticDataKey = 
  | 'personas'
  | 'studyTimes'
  | 'examCategories'
  | 'onboardingSteps'
  | 'weekdays'
  | 'features'
  | 'pwaBenefits'
  | 'offlineFeatures'
  | 'profileTabs';
```

---

## 🔄 **Migration Script Example**

```typescript
// scripts/migrate-static-data.ts

/**
 * Migration script to update component imports
 * Run: npx tsx scripts/migrate-static-data.ts
 */

import fs from 'fs';
import path from 'path';

const MIGRATION_MAP = {
  // Old pattern -> New import
  'const PERSONA_OPTIONS = [': "import { PERSONA_OPTIONS } from '@/lib/data/onboarding';",
  'const STUDY_TIMES = [': "import { STUDY_TIME_PREFERENCES } from '@/lib/data/onboarding';",
  'const POPULAR_CATEGORIES = [': "import { POPULAR_EXAM_CATEGORIES } from '@/lib/data/onboarding';",
  'const features = [': "import { LOGIN_FEATURES } from '@/lib/data/ui-content';",
  'const WEEKDAYS = [': "import { WEEKDAY_OPTIONS } from '@/lib/data/onboarding';",
};

function migrateFile(filePath: string) {
  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  Object.entries(MIGRATION_MAP).forEach(([oldPattern, newImport]) => {
    if (content.includes(oldPattern)) {
      // Add new import at the top
      const importIndex = content.indexOf('import');
      if (importIndex !== -1) {
        content = content.slice(0, importIndex) + newImport + '\n' + content.slice(importIndex);
      }
      
      // Remove old definition (simplified - you'd want more sophisticated parsing)
      const start = content.indexOf(oldPattern);
      const end = content.indexOf('];', start) + 2;
      content = content.slice(0, start) + content.slice(end);
      
      modified = true;
    }
  });

  if (modified) {
    fs.writeFileSync(filePath, content);
    console.log(`✅ Migrated: ${filePath}`);
  }
}

// Run migration on target files
const targetFiles = [
  'components/onboarding/PersonaDetectionCompact.tsx',
  'components/onboarding/PersonalInfoStepCompact.tsx',
  'app/login/page.tsx',
  // Add more files as needed
];

targetFiles.forEach(migrateFile);
console.log('🎉 Migration complete!');
```

---

## ✅ **Validation & Testing**

```typescript
// lib/data/__tests__/onboarding.test.ts

import { 
  PERSONA_OPTIONS, 
  STUDY_TIME_PREFERENCES,
  getPersonaById,
  getStudyTimeById 
} from '../onboarding';

describe('Onboarding Data', () => {
  test('all personas have required fields', () => {
    PERSONA_OPTIONS.forEach(persona => {
      expect(persona.id).toBeTruthy();
      expect(persona.title).toBeTruthy();
      expect(persona.description).toBeTruthy();
      expect(persona.defaultHours).toBeGreaterThan(0);
      expect(persona.benefits).toHaveLength.toBeGreaterThan(0);
      expect(persona.challenges).toHaveLength.toBeGreaterThan(0);
    });
  });

  test('persona lookup works correctly', () => {
    const student = getPersonaById('student');
    expect(student?.title).toBe('Student');
    
    const invalid = getPersonaById('invalid' as any);
    expect(invalid).toBeUndefined();
  });

  test('study times cover full day', () => {
    const times = STUDY_TIME_PREFERENCES.map(t => t.id);
    expect(times).toContain('morning');
    expect(times).toContain('afternoon');
    expect(times).toContain('evening');
    expect(times).toContain('night');
  });
});
```

This implementation provides a complete, type-safe, and maintainable solution for organizing static data across your application.
