import { Timestamp } from 'firebase/firestore';

/**
 * @fileoverview Core type definitions for the Exam Strategy Engine
 *
 * This file contains all TypeScript interfaces and types used throughout the application.
 * It defines the data models for exams, users, progress tracking, and all related entities.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

/**
 * Represents a competitive exam with all its stages, sections, and default syllabus
 *
 * @interface Exam
 * @example
 * ```typescript
 * const upscExam: Exam = {
 *   id: 'upsc_cse_prelims',
 *   name: 'UPSC CSE - Prelims',
 *   description: 'Union Public Service Commission Civil Services Examination',
 *   category: 'Civil Services',
 *   stages: [...],
 *   defaultSyllabus: [...]
 * };
 * ```
 */
export interface Exam {
  /** Unique identifier for the exam (e.g., "upsc_cse_prelims") */
  id: string;
  /** Human-readable exam name (e.g., "UPSC CSE - Prelims") */
  name: string;
  /** Detailed description of the exam */
  description: string;
  /** Category classification (e.g., "Civil Services", "Banking", "Engineering") */
  category: string;
  /** Array of exam stages (prelims, mains, interview, etc.) */
  stages: ExamStage[];
  /** Default syllabus structure for this exam */
  defaultSyllabus: SyllabusSubject[];
}

/**
 * Represents a single stage within an exam (e.g., Prelims, Mains, Interview)
 *
 * @interface ExamStage
 * @example
 * ```typescript
 * const prelimsStage: ExamStage = {
 *   id: 'prelims',
 *   name: 'Preliminary Examination',
 *   sections: [...],
 *   totalMarks: 400,
 *   duration: 240
 * };
 * ```
 */
export interface ExamStage {
  /** Unique identifier for the stage */
  id: string;
  /** Human-readable stage name (e.g., "Prelims", "Mains", "Interview") */
  name: string;
  /** Array of sections within this stage */
  sections: ExamSection[];
  /** Total marks for this stage */
  totalMarks: number;
  /** Total duration for this stage in minutes */
  duration: number;
}

/**
 * Represents a section within an exam stage (e.g., General Studies Paper I, CSAT)
 *
 * @interface ExamSection
 * @example
 * ```typescript
 * const gsSection: ExamSection = {
 *   id: 'gs_paper_1',
 *   name: 'General Studies Paper I',
 *   maxMarks: 200,
 *   maxTime: 120,
 *   negativeMarking: 0.33
 * };
 * ```
 */
export interface ExamSection {
  /** Unique identifier for the section */
  id: string;
  /** Human-readable section name (e.g., "General Studies Paper I", "CSAT") */
  name: string;
  /** Maximum marks for this section */
  maxMarks: number;
  /** Maximum time allocated for this section in minutes */
  maxTime: number;
  /** Negative marking ratio (e.g., 0.33 for 1/3 negative marking), optional */
  negativeMarking?: number;
}

/**
 * Represents a subject within the syllabus with topics and tier priority
 *
 * @interface SyllabusSubject
 * @example
 * ```typescript
 * const historySubject: SyllabusSubject = {
 *   id: 'modern_history',
 *   name: 'Modern History',
 *   tier: 1,
 *   topics: [...],
 *   estimatedHours: 120
 * };
 * ```
 */
export interface SyllabusSubject {
  /** Unique identifier for the subject (e.g., "modern_history") */
  id: string;
  /** Human-readable subject name (e.g., "Modern History") */
  name: string;
  /** User-defined importance level (1=High, 2=Medium, 3=Low) */
  tier: 1 | 2 | 3;
  /** Array of topics within this subject */
  topics: SyllabusTopic[];
  /** Estimated study time for this subject in hours (optional) */
  estimatedHours?: number;
  /** Whether this is a custom subject added by the user (optional) */
  isCustom?: boolean;
}

/**
 * Represents an individual topic within a subject
 *
 * @interface SyllabusTopic
 * @example
 * ```typescript
 * const topic: SyllabusTopic = {
 *   id: 'british_rule',
 *   name: 'British Administration in India',
 *   subtopics: ['East India Company', 'Crown Rule'],
 *   estimatedHours: 15
 * };
 * ```
 */
export interface SyllabusTopic {
  /** Unique identifier for the topic (e.g., "british_rule") */
  id: string;
  /** Human-readable topic name (e.g., "British Administration in India") */
  name: string;
  /** Array of subtopic names (optional) */
  subtopics?: string[];
  /** Estimated study time for this topic in hours (optional) */
  estimatedHours?: number;
}

/**
 * Represents a user in the system with their profile, settings, and current exam
 *
 * @interface User
 * @example
 * ```typescript
 * const user: User = {
 *   userId: 'user123',
 *   email: 'student@example.com',
 *   displayName: 'John Doe',
 *   currentExam: { id: 'upsc_cse_prelims', name: 'UPSC CSE', targetDate: timestamp },
 *   onboardingComplete: true,
 *   createdAt: timestamp,
 *   settings: {...},
 *   stats: {...}
 * };
 * ```
 */
export interface User {
  /** Firestore document ID for the user */
  userId: string;
  /** User's email address */
  email: string;
  /** User's display name */
  displayName: string;
  /** Information about the user's current exam preparation */
  currentExam: {
    /** References the exam ID from the exams collection */
    id: string;
    /** Cached exam name for quick display */
    name: string;
    /** Target exam date */
    targetDate: Timestamp;
  };
  /** Selected exam ID during onboarding */
  selectedExamId?: string;
  /** Target exam date during onboarding */
  examDate?: Timestamp;
  /** Whether the user has completed the onboarding process */
  onboardingComplete?: boolean;
  /** Whether onboarding has been completed (legacy field) */
  onboardingCompleted?: boolean;
  /** Whether this is a custom exam */
  isCustomExam?: boolean;
  /** Custom exam details if applicable */
  customExam?: {
    name?: string | undefined;
    description?: string | undefined;
    category?: string | undefined;
  } | undefined;
  /** User persona information */
  userPersona?: UserPersona;
  /** User preferences for studying */
  preferences?: {
    dailyStudyGoalMinutes: number;
    preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
    tierDefinitions: {
      1: string;
      2: string;
      3: string;
    };
    revisionIntervals: number[];
    notifications: {
      revisionReminders: boolean;
      dailyGoalReminders: boolean;
      healthCheckReminders: boolean;
    };
  };
  /** Timestamp when the user account was created */
  createdAt?: Timestamp;
  /** Timestamp when the user account was last updated */
  updatedAt?: Timestamp;
  /** User's personalized settings and preferences */
  settings?: UserSettings;
  /** User's study statistics and achievements */
  stats?: UserStats;
}

/**
 * User persona types for adaptive learning experience
 *
 * @type UserPersonaType
 */
export type UserPersonaType = 'student' | 'working_professional' | 'freelancer';

/**
 * Career motivation types for working professionals
 *
 * @type CareerMotivation
 */
export type CareerMotivation =
  | 'promotion'
  | 'salary_increase'
  | 'career_transition'
  | 'skill_relevance'
  | 'job_security'
  | 'industry_change';

/**
 * Work schedule configuration for working professionals
 *
 * @interface WorkSchedule
 */
export interface WorkSchedule {
  /** Working hours start and end times (24-hour format, e.g., "09:00") */
  workingHours: {
    start: string;
    end: string;
  };
  /** Days of the week when user works */
  workingDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
  /** Daily commute time in minutes (both ways combined) */
  commuteTime: number;
  /** Work schedule flexibility */
  flexibility: 'rigid' | 'flexible' | 'hybrid';
  /** Lunch break duration in minutes */
  lunchBreakDuration: number;
}

/**
 * Career context for working professionals
 *
 * @interface CareerContext
 */
export interface CareerContext {
  /** Current job role/position */
  currentRole: string;
  /** Target role/position to achieve */
  targetRole: string;
  /** Industry sector */
  industry: string;
  /** Timeline urgency for career goals */
  urgency: 'immediate' | 'short_term' | 'long_term'; // <6 months, 6-18 months, >18 months
  /** Career motivations driving the learning */
  motivation: CareerMotivation[];
  /** Identified skill gaps to address */
  skillGaps: string[];
}

/**
 * User persona configuration for adaptive learning
 *
 * @interface UserPersona
 */
export interface UserPersona {
  /** Type of user persona */
  type: UserPersonaType;
  /** Work schedule (required for working professionals) */
  workSchedule?: WorkSchedule;
  /** Career context (required for working professionals) */
  careerContext?: CareerContext;
}

/**
 * User's personalized settings for study preferences and system behavior
 *
 * @interface UserSettings
 * @example
 * ```typescript
 * const settings: UserSettings = {
 *   revisionIntervals: [1, 3, 7, 16],
 *   dailyStudyGoalMinutes: 480,
 *   tierDefinition: {
 *     1: "High Priority",
 *     2: "Medium Priority",
 *     3: "Low Priority"
 *   },
 *   notifications: {...},
 *   preferences: {...},
 *   userPersona: {
 *     type: 'working_professional',
 *     workSchedule: {...},
 *     careerContext: {...}
 *   }
 * };
 * ```
 */
export interface UserSettings {
  /** Spaced repetition intervals in days (e.g., [1, 3, 7, 16]) */
  revisionIntervals: number[];
  /** Daily study goal in minutes */
  dailyStudyGoalMinutes: number;
  /** User-defined names for tier levels */
  tierDefinition: {
    /** High priority tier name */
    1: string;
    /** Medium priority tier name */
    2: string;
    /** Low priority tier name */
    3: string;
  };
  /** Notification preferences */
  notifications: {
    /** Enable revision reminder notifications */
    revisionReminders: boolean;
    /** Enable daily goal reminder notifications */
    dailyGoalReminders: boolean;
    /** Enable health check reminder notifications */
    healthCheckReminders: boolean;
  };
  /** User interface and display preferences */
  preferences: {
    /** UI theme preference */
    theme: 'light' | 'dark' | 'system';
    /** Preferred language */
    language: string;
    /** User's timezone */
    timezone: string;
  };
  /** User persona for adaptive learning experience */
  userPersona: UserPersona;
}

/**
 * User's cumulative study statistics and achievements
 *
 * @interface UserStats
 * @example
 * ```typescript
 * const stats: UserStats = {
 *   totalStudyHours: 450.5,
 *   currentStreak: 15,
 *   longestStreak: 28,
 *   totalMockTests: 25,
 *   averageScore: 75.5,
 *   topicsCompleted: 120,
 *   totalTopics: 200
 * };
 * ```
 */
export interface UserStats {
  /** Total hours spent studying */
  totalStudyHours: number;
  /** Current consecutive days study streak */
  currentStreak: number;
  /** Longest consecutive days study streak achieved */
  longestStreak: number;
  /** Total number of mock tests taken */
  totalMockTests: number;
  /** Average score across all mock tests */
  averageScore: number;
  /** Number of topics marked as completed */
  topicsCompleted: number;
  /** Total number of topics in syllabus */
  totalTopics: number;
}

/**
 * Progress tracking for individual topics with spaced repetition and mastery scoring
 *
 * @interface TopicProgress
 * @example
 * ```typescript
 * const progress: TopicProgress = {
 *   id: 'progress_123',
 *   topicId: 'british_rule',
 *   subjectId: 'modern_history',
 *   masteryScore: 75,
 *   lastRevised: timestamp,
 *   nextRevision: futureTimestamp,
 *   revisionCount: 3,
 *   totalStudyTime: 180,
 *   userNotes: 'Key points about administration...',
 *   personalContext: 'Important for understanding colonial impact...',
 *   tags: ['governance', 'colonial'],
 *   difficulty: 3
 * };
 * ```
 */
export interface TopicProgress {
  /** Unique identifier for this progress record */
  id: string;
  /** Reference to the topic ID from syllabus */
  topicId: string;
  /** Reference to the subject ID from syllabus */
  subjectId: string;
  /** Mastery score from 0-100, calculated from mock test performance and study time */
  masteryScore: number;
  /** Timestamp of last revision session */
  lastRevised: Timestamp;
  /** Calculated next revision date based on spaced repetition algorithm */
  nextRevision: Timestamp;
  /** Number of revision sessions completed */
  revisionCount: number;
  /** Total time spent studying this topic in minutes */
  totalStudyTime: number;
  /** User's personal notes for this topic */
  userNotes: string;
  /** User's answer to "Why is this important for my exam?" */
  personalContext: string;
  /** Legacy field for banking context - kept for backward compatibility */
  userBankingContext?: string;
  /** User-defined tags for organization and filtering */
  tags: string[];
  /** User-perceived difficulty level from 1 (very easy) to 5 (very hard) */
  difficulty: 1 | 2 | 3 | 4 | 5;
  /** User-perceived importance level from 1 (low) to 5 (critical) */
  importance: 1 | 2 | 3 | 4 | 5;
  /** Track score improvement over time compared to previous attempts */
  lastScoreImprovement: number;
  /** Current affairs notes related to this topic */
  currentAffairs?: Array<{
    date: Timestamp;
    note: string;
  }>;
}

/**
 * Daily log entry capturing study activities, health metrics, and reflection
 *
 * @interface DailyLog
 * @example
 * ```typescript
 * const dailyLog: DailyLog = {
 *   id: '2025-08-20',
 *   date: timestamp,
 *   health: { energy: 8, sleepHours: 7, sleepQuality: 8, stressLevel: 3, physicalActivity: 30, screenTime: 8 },
 *   studiedTopics: [...],
 *   goals: { targetMinutes: 480, actualMinutes: 450, completed: true },
 *   mood: 4,
 *   productivity: 4,
 *   note: 'Good study session today...',
 *   challenges: ['Distractions from noise'],
 *   wins: ['Completed all planned topics']
 * };
 * ```
 */
export interface DailyLog {
  /** Unique identifier in date format (e.g., "2025-08-20") */
  id: string;
  /** Date of the log entry */
  date: Timestamp;
  /** Health and wellness metrics for the day */
  health: HealthMetrics;
  /** Array of study sessions for different topics */
  studiedTopics: StudySession[];
  /** Daily study goals and achievement status */
  goals: {
    /** Target study time in minutes */
    targetMinutes: number;
    /** Actual study time achieved in minutes */
    actualMinutes: number;
    /** Whether the daily goal was completed */
    completed: boolean;
  };
  /** Overall mood on a scale of 1 (very bad) to 5 (excellent) */
  mood: 1 | 2 | 3 | 4 | 5;
  /** Self-assessed productivity on a scale of 1 (very low) to 5 (very high) */
  productivity: 1 | 2 | 3 | 4 | 5;
  /** Personal note or reflection for the day */
  note: string;
  /** Array of challenges faced during studying */
  challenges: string[];
  /** Array of positive achievements or wins for the day */
  wins: string[];
}

/**
 * Health and wellness metrics tracked daily
 *
 * @interface HealthMetrics
 * @example
 * ```typescript
 * const health: HealthMetrics = {
 *   energy: 8,
 *   sleepHours: 7.5,
 *   sleepQuality: 8,
 *   stressLevel: 3,
 *   physicalActivity: 45,
 *   screenTime: 9
 * };
 * ```
 */
export interface HealthMetrics {
  /** Energy level on a scale of 1 (extremely tired) to 10 (very energetic) */
  energy: number;
  /** Hours of sleep the previous night */
  sleepHours: number;
  /** Quality of sleep on a scale of 1 (very poor) to 10 (excellent) */
  sleepQuality: number;
  /** Stress level on a scale of 1 (no stress) to 10 (extremely stressed) */
  stressLevel: number;
  /** Minutes of physical exercise or activity */
  physicalActivity: number;
  /** Hours of screen time (excluding study) */
  screenTime: number;
}

/**
 * Individual study session for a specific topic
 *
 * @interface StudySession
 * @example
 * ```typescript
 * const session: StudySession = {
 *   topicId: 'british_rule',
 *   subjectId: 'modern_history',
 *   minutes: 60,
 *   method: 'reading',
 *   effectiveness: 4,
 *   distractions: 2
 * };
 * ```
 */
export interface StudySession {
  /** Reference to the topic ID from progress collection */
  topicId: string;
  /** Reference to the subject ID from syllabus */
  subjectId: string;
  /** Duration of study session in minutes */
  minutes: number;
  /** Study method used during the session */
  method: 'reading' | 'notes' | 'practice' | 'revision' | 'mock_test';
  /** Self-assessed effectiveness on a scale of 1 (not effective) to 5 (very effective) */
  effectiveness: 1 | 2 | 3 | 4 | 5;
  /** Number of times distracted during the session */
  distractions: number;
}

/**
 * Comprehensive mock test log with detailed analysis and performance tracking
 *
 * @interface MockTestLog
 * @example
 * ```typescript
 * const mockTest: MockTestLog = {
 *   id: 'mock_123',
 *   date: timestamp,
 *   platform: 'Vision IAS Test Series',
 *   testName: 'Prelims Test #5',
 *   stage: 'prelims',
 *   type: 'full_length',
 *   scores: { 'GS Paper I': 98, 'CSAT': 180 },
 *   maxScores: { 'GS Paper I': 200, 'CSAT': 200 },
 *   timeTaken: { 'GS Paper I': 110, 'CSAT': 115 },
 *   analysis: {...},
 *   topicWisePerformance: [...],
 *   mentalState: { confidence: 4, anxiety: 2, focus: 4 },
 *   environment: { location: 'Study room', distractions: [], timeOfDay: 'morning' },
 *   feedback: 'Good performance overall...',
 *   actionItems: ['Focus on current affairs', 'Practice more math']
 * };
 * ```
 */
export interface MockTestLog {
  /** Unique identifier for the mock test log */
  id: string;
  /** Date when the test was taken */
  date: Timestamp;
  /** Name of the test platform or provider (e.g., "Vision IAS Test Series", "Self-Generated") */
  platform: string;
  /** Name of the specific test */
  testName: string;
  /** Exam stage this test belongs to (references exam stage name) */
  stage: string;
  /** Type classification of the test */
  type: 'full_length' | 'sectional' | 'topic_wise' | 'previous_year';
  /** Scores achieved in each section (dynamic based on exam structure) */
  scores: Record<string, number>;
  /** Maximum possible scores for each section */
  maxScores: Record<string, number>;
  /** Time taken for each section in minutes */
  timeTaken: Record<string, number>;
  /** Detailed analysis of test performance */
  analysis: TestAnalysis;
  /** Topic-wise breakdown of performance */
  topicWisePerformance: TopicPerformance[];
  /** Mental state during the test */
  mentalState: {
    /** Confidence level on a scale of 1 (very low) to 5 (very high) */
    confidence: 1 | 2 | 3 | 4 | 5;
    /** Anxiety level on a scale of 1 (very low) to 5 (very high) */
    anxiety: 1 | 2 | 3 | 4 | 5;
    /** Focus level on a scale of 1 (very low) to 5 (very high) */
    focus: 1 | 2 | 3 | 4 | 5;
  };
  /** Test environment factors */
  environment: {
    /** Location where the test was taken */
    location: string;
    /** Array of distractions encountered during the test */
    distractions: string[];
    /** Time of day when the test was taken */
    timeOfDay: 'morning' | 'afternoon' | 'evening' | 'night';
  };
  /** User's reflection and feedback on the test */
  feedback: string;
  /** Specific action items to work on based on test results */
  actionItems: string[];
}

/**
 * Detailed analysis of test performance across different error categories
 *
 * @interface TestAnalysis
 * @example
 * ```typescript
 * const analysis: TestAnalysis = {
 *   conceptGaps: 15,
 *   carelessErrors: 8,
 *   intelligentGuesses: 12,
 *   timePressures: 5,
 *   totalQuestions: 100,
 *   correctAnswers: 72,
 *   wrongAnswers: 23,
 *   unattempted: 5,
 *   accuracy: 72.0,
 *   speed: 0.83
 * };
 * ```
 */
export interface TestAnalysis {
  /** Number of questions answered incorrectly due to knowledge gaps */
  conceptGaps: number;
  /** Number of questions answered incorrectly despite knowing the concept */
  carelessErrors: number;
  /** Number of questions answered correctly but user was unsure */
  intelligentGuesses: number;
  /** Number of questions answered incorrectly due to time constraints */
  timePressures: number;
  /** Total number of questions in the test */
  totalQuestions: number;
  /** Number of correct answers */
  correctAnswers: number;
  /** Number of wrong answers */
  wrongAnswers: number;
  /** Number of unattempted questions */
  unattempted: number;
  /** Percentage accuracy (correct answers / attempted questions * 100) */
  accuracy: number;
  /** Questions answered per minute */
  speed: number;
}

/**
 * Performance analysis for individual topics within a test
 *
 * @interface TopicPerformance
 * @example
 * ```typescript
 * const topicPerf: TopicPerformance = {
 *   topicId: 'british_rule',
 *   topicName: 'British Administration in India',
 *   questionsAsked: 5,
 *   questionsCorrect: 4,
 *   questionsWrong: 1,
 *   accuracy: 80.0,
 *   averageTime: 75,
 *   difficultyLevel: 'medium'
 * };
 * ```
 */
export interface TopicPerformance {
  /** Reference to the topic ID from syllabus */
  topicId: string;
  /** Human-readable topic name */
  topicName: string;
  /** Total number of questions asked from this topic */
  questionsAsked: number;
  /** Number of questions answered correctly */
  questionsCorrect: number;
  /** Number of questions answered incorrectly */
  questionsWrong: number;
  /** Percentage accuracy for this topic */
  accuracy: number;
  /** Average time spent per question in seconds */
  averageTime: number;
  /** Perceived difficulty level of questions from this topic */
  difficultyLevel: 'easy' | 'medium' | 'hard';
}

// Analytics and Insights Types

/**
 * Performance trend data for tracking progress over time
 *
 * @interface PerformanceTrend
 * @example
 * ```typescript
 * const trend: PerformanceTrend = {
 *   date: timestamp,
 *   totalScore: 278,
 *   sectionScores: { 'GS Paper I': 98, 'CSAT': 180 },
 *   accuracy: 72.5,
 *   speed: 0.85,
 *   rank: 145,
 *   percentile: 88.5
 * };
 * ```
 */
export interface PerformanceTrend {
  /** Date of the performance data point */
  date: Timestamp;
  /** Total score achieved across all sections */
  totalScore: number;
  /** Scores for individual sections */
  sectionScores: Record<string, number>;
  /** Overall accuracy percentage */
  accuracy: number;
  /** Questions answered per minute */
  speed: number;
  /** Rank achieved (if available) */
  rank?: number;
  /** Percentile scored (if available) */
  percentile?: number;
}

/**
 * AI-generated study insights and recommendations based on performance patterns
 *
 * @interface StudyInsight
 * @example
 * ```typescript
 * const insight: StudyInsight = {
 *   type: 'weakness',
 *   title: 'Consistent errors in Current Affairs',
 *   description: 'Your performance in current affairs has declined over the last 3 tests...',
 *   actionItems: ['Subscribe to daily current affairs', 'Practice monthly current affairs MCQs'],
 *   priority: 'high',
 *   category: 'performance',
 *   data: { topicAccuracy: 45, averageAccuracy: 72 }
 * };
 * ```
 */
export interface StudyInsight {
  /** Type of insight being provided */
  type: 'strength' | 'weakness' | 'improvement' | 'warning' | 'recommendation';
  /** Brief title describing the insight */
  title: string;
  /** Detailed description of the insight */
  description: string;
  /** Specific action items the user should take */
  actionItems: string[];
  /** Priority level for addressing this insight */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Category classification of the insight */
  category: 'performance' | 'health' | 'strategy' | 'time_management';
  /** Supporting data for the insight (optional) */
  data?: any;
}

/**
 * Item in the spaced repetition revision queue
 *
 * @interface RevisionItem
 * @example
 * ```typescript
 * const revisionItem: RevisionItem = {
 *   topicId: 'british_rule',
 *   topicName: 'British Administration in India',
 *   subjectName: 'Modern History',
 *   tier: 1,
 *   masteryScore: 75,
 *   daysSinceLastRevision: 8,
 *   priority: 'overdue',
 *   estimatedTime: 45,
 *   lastRevised: pastTimestamp,
 *   nextRevision: currentTimestamp
 * };
 * ```
 */
export interface RevisionItem {
  /** Reference to the topic ID from syllabus */
  topicId: string;
  /** Human-readable topic name */
  topicName: string;
  /** Name of the subject this topic belongs to */
  subjectName: string;
  /** Priority tier of the topic (1=High, 2=Medium, 3=Low) */
  tier: 1 | 2 | 3;
  /** Current mastery score for the topic (0-100) */
  masteryScore: number;
  /** Number of days since last revision */
  daysSinceLastRevision: number;
  /** Priority status for revision scheduling */
  priority: 'overdue' | 'due_today' | 'due_soon' | 'scheduled';
  /** Estimated time needed for revision in minutes */
  estimatedTime: number;
  /** Timestamp of last revision session */
  lastRevised: Timestamp;
  /** Calculated next revision date */
  nextRevision: Timestamp;
}

// Gamification Types

/**
 * Achievement system for gamifying the study process
 *
 * @interface Achievement
 * @example
 * ```typescript
 * const achievement: Achievement = {
 *   id: 'week_warrior',
 *   name: 'Week Warrior',
 *   description: 'Study for 7 consecutive days',
 *   icon: '🔥',
 *   category: 'consistency',
 *   unlockedAt: timestamp,
 *   progress: 100,
 *   target: 7,
 *   currentValue: 7
 * };
 * ```
 */
export interface Achievement {
  /** Unique identifier for the achievement */
  id: string;
  /** Display name of the achievement */
  name: string;
  /** Description of what needs to be accomplished */
  description: string;
  /** Icon or emoji representing the achievement */
  icon: string;
  /** Category classification of the achievement */
  category: 'consistency' | 'performance' | 'improvement' | 'milestone';
  /** Timestamp when the achievement was unlocked (if achieved) */
  unlockedAt?: Timestamp;
  /** Current progress percentage (0-100) */
  progress: number;
  /** Target value needed to unlock the achievement */
  target: number;
  /** Current value towards the target */
  currentValue: number;
}

/**
 * Study streak tracking for motivation and consistency
 *
 * @interface StudyStreak
 * @example
 * ```typescript
 * const streak: StudyStreak = {
 *   current: 15,
 *   longest: 28,
 *   lastStudyDate: timestamp,
 *   streakStartDate: streakStartTimestamp,
 *   milestones: [7, 14, 21, 28]
 * };
 * ```
 */
export interface StudyStreak {
  /** Current consecutive days of studying */
  current: number;
  /** Longest consecutive study streak achieved */
  longest: number;
  /** Date of the last study session */
  lastStudyDate: Timestamp;
  /** Date when the current streak started */
  streakStartDate: Timestamp;
  /** Array of milestone days achieved (e.g., [7, 14, 21, 28]) */
  milestones: number[];
}
