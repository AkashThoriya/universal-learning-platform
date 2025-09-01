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
  getPersonaById,
  getStudyTimeById,
  getDefaultStudyHours,
  validateStudyHours,
} from './onboarding';

export type { PersonaOption, StudyTimePreference } from './onboarding';

// ============================================================================
// BUSINESS DATA (Existing)
// ============================================================================

export { EXAMS_DATA } from '../exams-data';
export { SUBJECTS_DATA } from '../subjects-data';
