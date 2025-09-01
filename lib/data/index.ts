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
// BUSINESS DATA (Existing)
// ============================================================================

export { EXAMS_DATA } from '../exams-data';
export { SUBJECTS_DATA } from '../subjects-data';
