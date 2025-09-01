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
  getPersonaById,
  getStudyTimeById,
  getExamCategoryById,
  getDefaultStudyHours,
  validateStudyHours,
} from './onboarding';

export type { PersonaOption, StudyTimePreference, ExamCategory } from './onboarding';

// ============================================================================
// BUSINESS DATA (Existing)
// ============================================================================

export { EXAMS_DATA } from '../exams-data';
export { SUBJECTS_DATA } from '../subjects-data';
