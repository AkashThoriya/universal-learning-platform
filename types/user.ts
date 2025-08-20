import { Timestamp } from 'firebase/firestore';

export interface User {
  userId: string;
  email: string;
  displayName: string;
  examDate: Timestamp;
  createdAt: Timestamp;
  onboardingComplete: boolean;
  currentPhase: string;
  resources: {
    mockPlatform: string;
    quantBook: string;
    pkCourse: string;
  };
  settings: {
    dailyStudyGoalHrs: number;
    wakeTime: string;
    sleepTime: string;
  };
}

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

export interface Subject {
  subjectId: string;
  name: string;
  tier: number;
  topics: Topic[];
}

export interface Topic {
  id: string;
  name: string;
  bankingContext: string;
}

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