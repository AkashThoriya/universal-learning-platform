export const TEST_PLATFORMS = [
  { value: 'testbook', label: 'Testbook' },
  { value: 'oliveboard', label: 'Oliveboard' },
  { value: 'adda247', label: 'Adda247' },
  { value: 'gradeup', label: 'Gradeup' },
  { value: 'other', label: 'Other' },
] as const;

export const TEST_TYPES = [
  { value: 'full_prelims', label: 'Full Prelims (200 questions)' },
  { value: 'sectional', label: 'Sectional Test' },
  { value: 'pk_only', label: 'Professional Knowledge Only' },
] as const;

export const EXAM_SECTIONS = [
  { id: 'quant', label: 'Quantitative Aptitude', maxScore: 50 },
  { id: 'reasoning', label: 'Reasoning', maxScore: 50 },
  { id: 'english', label: 'English', maxScore: 50 },
  { id: 'pk', label: 'Professional Knowledge', maxScore: 50 },
] as const;

export const SCORING = {
  MAX_TOTAL_SCORE: 200,
  SECTION_MAX_SCORE: 50,
} as const;

export const ERROR_CATEGORIES = [
  { id: 'concepts', label: 'Concept Gaps', color: 'text-red-700' },
  { id: 'careless', label: 'Careless Errors', color: 'text-orange-700' },
  { id: 'guesses', label: 'Lucky Guesses', color: 'text-blue-700' },
  { id: 'timePressure', label: 'Time Pressure', color: 'text-purple-700' },
] as const;
