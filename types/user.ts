import { Timestamp } from 'firebase/firestore';

/**
 * @fileoverview User Type Definitions
 * 
 * This file re-exports the canonical User type from exam.ts and provides
 * legacy type definitions for backward compatibility during migration.
 * 
 * @author Exam Strategy Engine Team
 * @version 2.0.0
 */

/**
 * Re-export the comprehensive User type from exam.ts as the standard
 * This ensures all code uses the same User interface
 */
export type {
  User,
  UserSettings,
  UserStats,
  UserPersona,
  UserPersonaType,
  TopicProgress,
  DailyLog as EnhancedDailyLog,
  MockTestLog,
  StudyInsight,
  RevisionItem,
  SelectedCourse,
} from './exam';

// ============================================
// LEGACY TYPES - Marked for removal
// These are kept only for backward compatibility
// during migration. Do not use in new code.
// ============================================

/**
 * @deprecated Use UserDiagnostic only for migration purposes.
 * New code should use the adaptive testing system instead.
 */
export interface UserDiagnostic {
  diagnosticId: string;
  date: Timestamp;
  type: 'initial_prelims' | 'pk_probe' | 'weekly_check';
  results: {
    quantScore: number;
    reasoningScore: number;
    englishScore: number;
    pkScore: number;
    totalScore: number;
  };
  analysis: {
    conceptGapCount: number;
    carelessErrorCount: number;
    timePressureCount: number;
    weakestSection: string;
  };
}

/**
 * @deprecated Use SyllabusSubject from exam.ts instead.
 */
export interface Subject {
  subjectId: string;
  name: string;
  tier: number;
  topics: Topic[];
}

/**
 * @deprecated Use SyllabusTopic from exam.ts instead.
 */
export interface Topic {
  id: string;
  name: string;
  bankingContext: string;
}

/**
 * @deprecated Use TopicProgress from exam.ts instead.
 */
export interface UserProgress {
  progressId: string;
  topicId: string;
  masteryScore: number;
  lastRevised: Timestamp;
  userNotes: string;
  userBankingContext: string;
  currentAffairs: Array<{
    date: Timestamp;
    note: string;
  }>;
}

/**
 * @deprecated Use MockTestLog from exam.ts instead.
 */
export interface MockTest {
  testId: string;
  date: Timestamp;
  platform: string;
  type: 'full_prelims' | 'sectional' | 'pk_only';
  scores: {
    quant: number;
    reasoning: number;
    english: number;
    pk: number;
    total: number;
  };
  timeTaken: {
    quant: number;
    reasoning: number;
    english: number;
    pk: number;
  };
  analysis: {
    conceptGaps: number;
    carelessErrors: number;
    intelligentGuesses: number;
    timePressures: number;
  };
  feedback: string;
}

/**
 * @deprecated Use DailyLog from exam.ts instead.
 */
export interface DailyLog {
  logId: string;
  date: Timestamp;
  energyLevel: number;
  sleepHours: number;
  sleepQuality: number;
  tasksCompleted: Array<{
    task: string;
    timeSpent: number;
  }>;
  bufferUsed: boolean;
  note: string;
}
