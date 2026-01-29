/**
 * @fileoverview Central Data Export Hub
 *
 * Re-exports all static data for easy importing
 */

// ============================================================================
// ONBOARDING DATA
// ============================================================================

export {
  PERSONA_OPTIONS,
  STUDY_TIME_PREFERENCES,
  POPULAR_EXAM_CATEGORIES,
  WEEKDAY_OPTIONS,
  WORK_DAYS,
  getPersonaById,
  getStudyTimeById,
  getExamCategoryById,
  getWeekdayByValue,
  getWorkDayById,
  getDefaultStudyHours,
  validateStudyHours,
} from './onboarding';

export type { PersonaOption, StudyTimePreference, ExamCategory, WeekdayOption } from './onboarding';

// ============================================================================
// UI CONTENT
// ============================================================================

export {
  LOGIN_FEATURES,
  PWA_BENEFITS,
  OFFLINE_FEATURES,
  PROFILE_TABS,
  getFeaturesByColor,
  getProfileTabById,
  getAvailableOfflineFeatures,
  getUnavailableOfflineFeatures,
} from './ui-content';

export type { FeatureHighlight, PWABenefit, OfflineFeature, ProfileTab } from './ui-content';

// ============================================================================
// LEARNING TEMPLATES
// ============================================================================

export {
  LEARNING_GOAL_TEMPLATES,
  TEMPLATES_BY_CATEGORY,
  TEMPLATES_BY_DIFFICULTY,
  getTemplateById,
  getAvailableCategories,
  searchTemplates,
  validateTemplateStructure,
} from './learning-templates';

export type { LearningGoalTemplate } from './learning-templates';

// ============================================================================
// BUSINESS DATA (Existing)
// ============================================================================

export { EXAMS_DATA } from './exams-data';
