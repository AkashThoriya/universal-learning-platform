/**
 * @fileoverview Adaptive Testing System Types
 * Integrates with existing Mission System, Progress Service, and Journey Planning
 */

import { LearningTrack, MissionDifficulty } from './mission-system';

export interface AdaptiveTest {
  id: string;
  userId: string;
  title: string;
  description: string;

  // Integration with existing systems
  courseId?: string; // Optional course ID for multi-course support
  linkedSubjects: string[]; // Subject IDs from exam data
  linkedTopics?: string[]; // Topic IDs for more granular targeting
  track: LearningTrack; // Consistent with mission system

  // Test configuration
  totalQuestions: number;
  estimatedDuration: number; // minutes
  difficultyRange: {
    min: MissionDifficulty;
    max: MissionDifficulty;
  };

  // LLM integration properties
  examContext?: string; // Context for question generation
  learningObjectives?: string[]; // Learning objectives for the test

  // Adaptive algorithm settings
  algorithmType: 'CAT' | 'MAP' | 'HYBRID'; // Computer Adaptive Testing types
  convergenceThreshold: number; // When to stop adapting
  initialDifficulty: MissionDifficulty;

  // Test state
  status: 'draft' | 'active' | 'completed' | 'paused' | 'archived';
  currentQuestion: number;
  questions: AdaptiveQuestion[];
  responses: TestResponse[];

  // Performance tracking
  performance: TestPerformance;
  adaptiveMetrics: AdaptiveMetrics;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  completedAt?: Date;
  createdFrom: 'manual' | 'mission' | 'recommendation';
}

export interface AdaptiveQuestion {
  id: string;
  question: string; // Main question text (matches LLM service)
  content?: string; // Backward compatibility
  type?: 'multiple_choice' | 'true_false' | 'numerical' | 'text_input';
  options?: string[]; // Simplified options format for LLM compatibility
  correctAnswer: string | number; // Single correct answer (matches LLM service)
  correctAnswers?: string[]; // Support multiple correct answers (backward compatibility)
  explanation?: string;

  // Adaptive properties
  difficulty: number | MissionDifficulty; // Support both numeric and string difficulty
  discriminationIndex: number; // How well question differentiates ability levels
  guessingParameter?: number; // Probability of correct guess

  // Content classification
  subject: string;
  topics: string[]; // Array of topics (matches LLM service)
  topic?: string; // Backward compatibility
  subtopic?: string;
  bloomsLevel?: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

  // Performance data
  timesAsked?: number;
  timeLimit?: number; // Time limit for question (matches LLM service)
  averageResponseTime?: number;
  successRate?: number;
  responseHistory?: TestResponse[]; // Response history for this question

  // Metadata
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: string; // Who created the question (e.g., 'llm', 'manual')
  validated?: boolean; // Whether the question has been reviewed
  qualityScore?: number; // Quality score for the question
  metaTags?: string[]; // Metadata tags for filtering and search

  // Integration markers
  linkedMissionId?: string; // Links to mission system
  tags?: string[]; // Backward compatibility
}

export interface QuestionOption {
  id: string;
  content: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface TestResponse {
  userId: string; // Required for security rules - identifies the response owner
  testId: string; // Required for querying responses by test
  questionId: string;
  userAnswer: string | string[];
  isCorrect: boolean;
  responseTime: number; // milliseconds
  confidence?: number; // 1-5 scale, optional
  timestamp: Date;

  // Adaptive algorithm data
  estimatedAbility: number; // User ability estimate at time of response
  questionDifficulty: MissionDifficulty;
  informationGained: number; // How much this response improved ability estimate
}

export interface TestPerformance {
  totalQuestions: number;
  correctAnswers: number;
  accuracy: number; // 0-100
  averageResponseTime: number;
  totalTime: number;

  // Detailed analytics
  subjectPerformance: Record<string, SubjectPerformance>;
  difficultyPerformance: Record<MissionDifficulty, DifficultyPerformance>;
  bloomsPerformance: Record<string, number>;

  // Adaptive insights
  finalAbilityEstimate: number;
  abilityConfidenceInterval: [number, number];
  standardError: number;
}

export interface SubjectPerformance {
  subjectId: string;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
  abilityEstimate: number;
}

export interface DifficultyPerformance {
  difficulty: MissionDifficulty;
  questionsAnswered: number;
  correctAnswers: number;
  accuracy: number;
  averageTime: number;
}

export interface AdaptiveMetrics {
  algorithmEfficiency: number; // How quickly algorithm converged
  questionUtilization: number; // Percentage of optimal questions used
  abilityEstimateStability: number; // How stable the final estimate is
  convergenceHistory: AbilityEstimate[];

  // Integration with existing progress system
  progressImpact: {
    missionDifficultyAdjustment: number;
    journeyGoalUpdate: number;
    trackProgressContribution: number;
  };
}

export interface AbilityEstimate {
  timestamp: Date;
  estimate: number;
  standardError: number;
  questionNumber: number;
}

// Question Bank Management
export interface QuestionBank {
  id: string;
  name: string;
  description: string;
  subjects: string[];
  totalQuestions: number;
  difficultyDistribution: Record<MissionDifficulty, number>;

  // Quality metrics
  averageDiscrimination: number;
  calibrationStatus: 'uncalibrated' | 'calibrating' | 'calibrated';
  lastCalibrated: Date;

  // Integration
  linkedExamIds: string[]; // From existing exam data
  createdFrom: 'syllabus' | 'manual' | 'ai_generated';
}

// Test Session Management
export interface TestSession {
  id: string;
  testId: string;
  userId: string;
  startedAt: Date;
  lastActivity: Date;

  // Session state
  currentQuestionIndex: number;
  timeRemaining: number; // milliseconds
  isPaused: boolean;
  pauseReasons: string[];

  // Real-time adaptation data
  currentAbilityEstimate: number;
  currentStandardError: number;
  nextQuestionPreview?: AdaptiveQuestion;

  // Performance tracking
  sessionMetrics: {
    questionsAnswered: number;
    averageResponseTime: number;
    peakPerformanceTime: Date;
    fatigueIndicators: number[];
  };
}

// Integration interfaces
export interface TestMissionLink {
  testId: string;
  missionId: string;
  linkType: 'prerequisite' | 'follow_up' | 'parallel';
  adaptiveData: {
    difficultyTransfer: number;
    abilityCorrelation: number;
  };
}



// API Request/Response types
export interface CreateAdaptiveTestRequest {
  courseId?: string;
  title: string;
  description: string;
  subjects: string[];
  topics?: string[];
  track?: LearningTrack;
  difficulty?: MissionDifficulty;
  targetQuestions?: number;
  questionCount?: number;
  questionType?: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';

  algorithmType?: AdaptiveTest['algorithmType'];
  difficultyRange?: {
    min: MissionDifficulty;
    max: MissionDifficulty;
  };
  syllabusContext?: string;
}

export interface StartTestSessionRequest {
  testId: string;
  estimatedDuration?: number;
  allowPause?: boolean;
}

export interface SubmitResponseRequest {
  sessionId: string;
  questionId: string;
  answer: string | string[];
  responseTime: number;
  confidence?: number;
}

export interface TestAnalyticsRequest {
  testIds?: string[];
  dateRange?: {
    start: Date;
    end: Date;
  };
  subjects?: string[];
  track?: LearningTrack;
}

export interface TestRecommendation {
  testId: string;
  title: string;
  description: string;
  confidence: number; // 0-1
  reasons: string[];

  // Test configuration
  subjects: string[]; // Test subjects
  questionCount: number; // Number of questions
  estimatedDuration: number; // Duration in minutes
  tags: string[]; // Test tags
  priority: 'low' | 'medium' | 'high' | 'critical';
  difficulty: MissionDifficulty;

  // Adaptive configuration
  adaptiveConfig: {
    algorithmType: 'CAT' | 'MAP' | 'HYBRID';
    convergenceCriteria: {
      standardError: number;
      minQuestions: number;
      maxQuestions: number;
    };
    difficultyRange: {
      min: MissionDifficulty;
      max: MissionDifficulty;
    };
  };

  // Integration properties
  expectedBenefit: string;
  estimatedAccuracy: number;
  aiGenerated: boolean;
  createdFrom: 'recommendation' | 'manual';
  linkedMissions: string[];

  optimalTiming?: {
    recommendedDate: Date;
    dependsOn: string[]; // Prerequisites
  };
}

// Enhanced Progress Types for Adaptive Testing Integration
export interface AdaptiveTestProgressUpdate {
  userId: string;
  testResults: TestPerformance;
  testMetadata: {
    subjects: string[];
    track: LearningTrack;
    algorithmType: AdaptiveTest['algorithmType'];
  };
}

export interface AdaptiveTestingLevel {
  level: 'Beginner' | 'Developing' | 'Intermediate' | 'Advanced' | 'Expert';
  abilityRange: [number, number];
  description: string;
  characteristics: string[];
}

// Mission System Integration Types
export interface MissionDifficultyAdjustment {
  userId: string;
  testResults: TestPerformance;
  currentPersona: any; // From existing user persona types
  adjustmentFactors: {
    abilityEstimate: number;
    confidence: number;
    subjectSpecificAdjustments: Record<string, number>;
  };
}

export interface TestPreparationMission {
  testId: string;
  missionType: 'review' | 'practice' | 'weakness_targeting';
  scheduledDate: Date;
  estimatedDuration: number;
  targetSubjects: string[];
  difficulty: MissionDifficulty;
}

// Analytics and Insights Types
export interface TestAnalyticsData {
  userId: string;
  period: {
    startDate: Date;
    endDate: Date;
  };
  overallMetrics: {
    testsCompleted: number;
    averageAccuracy: number;
    averageAbilityEstimate: number;
    totalTimeSpent: number;
    improvementTrend: 'improving' | 'stable' | 'declining';
  };
  subjectAnalytics: Array<{
    subject: string;
    testsCompleted: number;
    averageAccuracy: number;
    abilityEstimate: number;
    improvementRate: number;
    recommendedFocus: boolean;
  }>;
  adaptiveInsights: {
    optimalTestFrequency: number; // days
    bestPerformanceTimeOfDay: 'morning' | 'afternoon' | 'evening';
    strongSubjects: string[];
    weakSubjects: string[];
    nextRecommendedTest: TestRecommendation;
  };
}

// Real-time Test Delivery Types
export interface TestDeliveryState {
  sessionId: string;
  currentQuestion: AdaptiveQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining: number;
  confidenceRequired: boolean;
  showProgress: boolean;
  adaptationFeedback?: {
    difficultyChanged: boolean;
    newDifficulty?: MissionDifficulty;
    reasonForChange?: string;
  };
}

export interface TestSubmissionResult {
  isCorrect: boolean;
  explanation: string;
  nextQuestion?: AdaptiveQuestion;
  testCompleted: boolean;
  performance?: TestPerformance;
  adaptiveMetrics?: AdaptiveMetrics;
  encouragementMessage?: string;
}

// AI Question Generation Types (for future LLM integration)
export interface QuestionGenerationRequest {
  subject: string;
  topic: string;
  difficulty: MissionDifficulty;
  bloomsLevel: AdaptiveQuestion['bloomsLevel'];
  questionType: AdaptiveQuestion['type'];
  context?: string;
  excludeTopics?: string[];
}

export interface GeneratedQuestion extends Omit<
  AdaptiveQuestion,
  'id' | 'timesAsked' | 'averageResponseTime' | 'successRate'
> {
  generationMetadata: {
    model: string;
    prompt: string;
    confidence: number;
    needsReview: boolean;
  };
}

// Gamification Integration Types
export interface TestAchievement {
  id: string;
  testId: string;
  userId: string;
  achievementType: 'accuracy' | 'speed' | 'consistency' | 'improvement' | 'mastery';
  title: string;
  description: string;
  earnedAt: Date;
  points: number;
  badge: {
    icon: string;
    color: string;
    rarity: 'common' | 'rare' | 'epic' | 'legendary';
  };
}

export interface TestStreakData {
  userId: string;
  currentStreak: number;
  longestStreak: number;
  lastTestDate: Date;
  streakType: 'daily_tests' | 'passing_tests' | 'improvement_tests';
  milestones: Array<{
    streakLength: number;
    achievedAt: Date;
    reward: string;
  }>;
}

// Error Handling and Validation Types
export interface TestValidationError {
  type: 'configuration' | 'question_bank' | 'user_permission' | 'system';
  field?: string;
  message: string;
  code: string;
  suggestions?: string[];
}

export interface TestSystemHealth {
  status: 'healthy' | 'degraded' | 'down';
  lastChecked: Date;
  metrics: {
    questionBankSize: number;
    avgResponseTime: number;
    errorRate: number;
    activeTests: number;
  };
  issues?: Array<{
    component: string;
    severity: 'low' | 'medium' | 'high' | 'critical';
    description: string;
  }>;
}
