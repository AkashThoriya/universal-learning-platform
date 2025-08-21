import { Timestamp } from 'firebase/firestore';

export interface Exam {
  id: string;                    // e.g., "upsc_cse_prelims"
  name: string;                  // e.g., "UPSC CSE - Prelims"
  description: string;
  category: string;              // e.g., "Civil Services", "Banking", "Engineering"
  stages: ExamStage[];
  defaultSyllabus: SyllabusSubject[];
}

export interface ExamStage {
  id: string;
  name: string;                  // e.g., "Prelims", "Mains", "Interview"
  sections: ExamSection[];
  totalMarks: number;
  duration: number;              // in minutes
}

export interface ExamSection {
  id: string;
  name: string;                  // e.g., "General Studies Paper I", "CSAT"
  maxMarks: number;
  maxTime: number;               // in minutes
  negativeMarking?: number;      // e.g., 0.33 for 1/3 negative marking
}

export interface SyllabusSubject {
  id: string;                    // e.g., "modern_history"
  name: string;                  // e.g., "Modern History"
  tier: 1 | 2 | 3;              // User-defined importance level
  topics: SyllabusTopic[];
  estimatedHours?: number;       // Estimated study time
}

export interface SyllabusTopic {
  id: string;                    // e.g., "british_rule"
  name: string;                  // e.g., "British Administration in India"
  subtopics?: string[];          // Optional subtopics
  estimatedHours?: number;       // Estimated study time for this topic
}

export interface User {
  userId: string;                // Firestore ID
  email: string;
  displayName: string;
  currentExam: {
    id: string;                  // References exams.id
    name: string;                // Cached exam name
    targetDate: Timestamp;
  };
  onboardingComplete: boolean;
  createdAt: Timestamp;
  settings: UserSettings;
  stats: UserStats;
}

export interface UserSettings {
  revisionIntervals: number[];   // e.g., [1, 3, 7, 16] - Spaced repetition intervals in days
  dailyStudyGoalMinutes: number;
  tierDefinition: {
    1: string;                   // e.g., "High Priority"
    2: string;                   // e.g., "Medium Priority" 
    3: string;                   // e.g., "Low Priority"
  };
  notifications: {
    revisionReminders: boolean;
    dailyGoalReminders: boolean;
    healthCheckReminders: boolean;
  };
  preferences: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };
}

export interface UserStats {
  totalStudyHours: number;
  currentStreak: number;
  longestStreak: number;
  totalMockTests: number;
  averageScore: number;
  topicsCompleted: number;
  totalTopics: number;
}

export interface TopicProgress {
  id: string;                    // Must match topic.id from syllabus
  topicId: string;               // Reference to syllabus topic
  subjectId: string;             // Reference to syllabus subject
  masteryScore: number;          // 0-100, calculated from mock test performance
  lastRevised: Timestamp;
  nextRevision: Timestamp;       // Calculated: lastRevised + revisionIntervals[revisionCount]
  revisionCount: number;
  totalStudyTime: number;        // in minutes
  userNotes: string;
  personalContext: string;       // User's answer to "Why is this important for my exam?"
  tags: string[];                // User-defined tags for organization
  difficulty: 1 | 2 | 3 | 4 | 5; // User-perceived difficulty
  importance: 1 | 2 | 3 | 4 | 5; // User-perceived importance
  lastScoreImprovement: number;  // Track improvement over time
}

export interface DailyLog {
  id: string;                    // Date format: "2025-08-20"
  date: Timestamp;
  health: HealthMetrics;
  studiedTopics: StudySession[];
  goals: {
    targetMinutes: number;
    actualMinutes: number;
    completed: boolean;
  };
  mood: 1 | 2 | 3 | 4 | 5;      // 1 = Very Bad, 5 = Excellent
  productivity: 1 | 2 | 3 | 4 | 5; // Self-assessed productivity
  note: string;
  challenges: string[];          // What made studying difficult today
  wins: string[];                // What went well today
}

export interface HealthMetrics {
  energy: number;                // 1-10 scale
  sleepHours: number;
  sleepQuality: number;          // 1-10 scale
  stressLevel: number;           // 1-10 scale
  physicalActivity: number;      // minutes of exercise
  screenTime: number;            // hours of screen time
}

export interface StudySession {
  topicId: string;               // References progress.id
  subjectId: string;
  minutes: number;
  method: 'reading' | 'notes' | 'practice' | 'revision' | 'mock_test';
  effectiveness: 1 | 2 | 3 | 4 | 5; // How effective was this session
  distractions: number;          // Number of times distracted
}

export interface MockTestLog {
  id: string;
  date: Timestamp;
  platform: string;             // e.g., "Vision IAS Test Series", "Self-Generated"
  testName: string;              // Name of the specific test
  stage: string;                 // References exam stage name
  type: 'full_length' | 'sectional' | 'topic_wise' | 'previous_year';
  scores: Record<string, number>; // Dynamic based on exam, e.g., { "GS Paper I": 98, "CSAT": 180 }
  maxScores: Record<string, number>; // Maximum possible scores for each section
  timeTaken: Record<string, number>; // Time taken for each section in minutes
  analysis: TestAnalysis;
  topicWisePerformance: TopicPerformance[];
  mentalState: {
    confidence: 1 | 2 | 3 | 4 | 5;
    anxiety: 1 | 2 | 3 | 4 | 5;
    focus: 1 | 2 | 3 | 4 | 5;
  };
  environment: {
    location: string;
    distractions: string[];
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
  feedback: string;              // User's reflection on the test
  actionItems: string[];         // What to work on based on this test
}

export interface TestAnalysis {
  conceptGaps: number;           // Questions wrong due to not knowing the concept
  carelessErrors: number;        // Questions wrong despite knowing the answer
  intelligentGuesses: number;    // Questions correct but user was unsure
  timePressures: number;         // Questions wrong due to time constraints
  totalQuestions: number;
  correctAnswers: number;
  wrongAnswers: number;
  unattempted: number;
  accuracy: number;              // Percentage accuracy
  speed: number;                 // Questions per minute
}

export interface TopicPerformance {
  topicId: string;
  topicName: string;
  questionsAsked: number;
  questionsCorrect: number;
  questionsWrong: number;
  accuracy: number;
  averageTime: number;           // Average time per question in seconds
  difficultyLevel: 'easy' | 'medium' | 'hard';
}

// Analytics and Insights Types
export interface PerformanceTrend {
  date: Timestamp;
  totalScore: number;
  sectionScores: Record<string, number>;
  accuracy: number;
  speed: number;
  rank?: number;
  percentile?: number;
}

export interface StudyInsight {
  type: 'strength' | 'weakness' | 'improvement' | 'warning' | 'recommendation';
  title: string;
  description: string;
  actionItems: string[];
  priority: 'low' | 'medium' | 'high' | 'critical';
  category: 'performance' | 'health' | 'strategy' | 'time_management';
  data?: any;                    // Supporting data for the insight
}

export interface RevisionItem {
  topicId: string;
  topicName: string;
  subjectName: string;
  tier: 1 | 2 | 3;
  masteryScore: number;
  daysSinceLastRevision: number;
  priority: 'overdue' | 'due_today' | 'due_soon' | 'scheduled';
  estimatedTime: number;         // in minutes
  lastRevised: Timestamp;
  nextRevision: Timestamp;
}

// Gamification Types
export interface Achievement {
  id: string;
  name: string;
  description: string;
  icon: string;
  category: 'consistency' | 'performance' | 'improvement' | 'milestone';
  unlockedAt?: Timestamp;
  progress: number;              // 0-100
  target: number;
  currentValue: number;
}

export interface StudyStreak {
  current: number;
  longest: number;
  lastStudyDate: Timestamp;
  streakStartDate: Timestamp;
  milestones: number[];          // Days where milestones were achieved
}

// Export all types for easy importing
export type {
  Exam,
  ExamStage,
  ExamSection,
  SyllabusSubject,
  SyllabusTopic,
  User,
  UserSettings,
  UserStats,
  TopicProgress,
  DailyLog,
  HealthMetrics,
  StudySession,
  MockTestLog,
  TestAnalysis,
  TopicPerformance,
  PerformanceTrend,
  StudyInsight,
  RevisionItem,
  Achievement,
  StudyStreak,
};