/**
 * @fileoverview Mission System Type Definitions
 *
 * Comprehensive type definitions for the Week 4-5 Adaptive Mission System.
 * Supports both exam and course/tech tracks with persona-aware adaptations.
 *
 * Features:
 * - Dual-track mission support (exam + course/tech)
 * - User-configurable mission cycles and duration
 * - Unified progress tracking across learning tracks
 * - Persona-aware achievement system
 * - Adaptive difficulty and content generation
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { UserPersona as _UserPersona, UserPersonaType } from './exam';
import { User as _User } from './user';

// =====================================================
// CORE MISSION TYPES
// =====================================================

/**
 * Mission frequency and scheduling options
 */
export type MissionFrequency = 'daily' | 'weekly' | 'monthly' | 'custom';

/**
 * Mission difficulty levels with persona awareness
 */
export type MissionDifficulty = 'beginner' | 'intermediate' | 'advanced' | 'expert';

/**
 * Mission status tracking
 */
export type MissionStatus = 'not_started' | 'in_progress' | 'completed' | 'failed' | 'skipped';

/**
 * Learning track types - supports both traditional exams and custom learning paths
 */
export type LearningTrack = 'exam' | 'course_tech' | 'custom_skill' | 'language' | 'certification';

// =====================================================
// MISSION CONFIGURATION
// =====================================================

/**
 * User-configurable mission cycle settings
 */
export interface MissionCycleConfig {
  /** Unique identifier for the cycle configuration */
  id: string;
  /** User ID this configuration belongs to */
  userId: string;
  /** Learning track this configuration applies to */
  track: LearningTrack;
  /** How frequently missions are generated */
  frequency: MissionFrequency;
  /** Custom frequency in days (for custom frequency only) */
  customFrequencyDays?: number;
  /** Duration settings for different mission types */
  durationSettings: {
    daily: number; // minutes
    weekly: number; // minutes
    monthly: number; // minutes
  };
  /** Difficulty preference */
  preferredDifficulty: MissionDifficulty;
  /** Whether to enable adaptive difficulty */
  adaptiveDifficulty: boolean;
  /** Active days of the week (0-6, Sunday = 0) */
  activeDays: number[];
  /** Preferred time for daily missions (24-hour format) */
  preferredTime: string; // "HH:MM"
  /** Whether notifications are enabled */
  notificationsEnabled: boolean;
  /** Auto-start next mission when current is completed */
  autoStartNext: boolean;
  /** Maximum missions per day */
  maxMissionsPerDay: number;
  /** Created timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
}

/**
 * Mission template for generating specific missions
 */
export interface MissionTemplate {
  /** Unique template identifier */
  id: string;
  /** Learning track this template belongs to */
  track: LearningTrack;
  /** Mission frequency this template is designed for */
  frequency: MissionFrequency;
  /** Template name */
  name: string;
  /** Template description */
  description: string;
  /** Supported difficulty levels */
  supportedDifficulties: MissionDifficulty[];
  /** Estimated duration in minutes */
  estimatedDuration: number;
  /** Subject areas this template covers */
  subjectAreas: string[];
  /** Required persona types (empty = all personas) */
  supportedPersonas: UserPersonaType[];
  /** Template content structure */
  contentStructure: MissionContentStructure;
  /** Scoring and validation rules */
  scoring: MissionScoringRules;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Mission content structure for different track types
 */
export interface MissionContentStructure {
  /** Content type identifier */
  type: 'mock_questions' | 'revision_cycle' | 'full_test' | 'coding_challenge' | 'assignment' | 'project';
  /** Content configuration */
  config: ExamMissionContent | TechMissionContent;
}

/**
 * Exam track mission content configuration
 */
export interface ExamMissionContent {
  /** Number of questions/problems */
  questionCount: number;
  /** Time limit in minutes */
  timeLimit: number;
  /** Question types to include */
  questionTypes: ('multiple_choice' | 'short_answer' | 'essay' | 'numerical' | 'true_false')[];
  /** Subject weightings */
  subjectWeights: Record<string, number>;
  /** Topics to focus on */
  focusTopics: string[];
  /** Whether to include explanations */
  includeExplanations: boolean;
  /** Passing threshold percentage */
  passingThreshold: number;
}

/**
 * Course/Tech track mission content configuration
 */
export interface TechMissionContent {
  /** Challenge type */
  challengeType: 'algorithm' | 'system_design' | 'debugging' | 'implementation' | 'review';
  /** Programming languages supported */
  supportedLanguages: string[];
  /** Complexity level */
  complexity: 'simple' | 'moderate' | 'complex' | 'advanced';
  /** Required skills/concepts */
  requiredSkills: string[];
  /** Deliverables expected */
  deliverables: ('code' | 'documentation' | 'tests' | 'deployment' | 'presentation')[];
  /** Time limit in minutes */
  timeLimit: number;
  /** Success criteria */
  successCriteria: string[];
  /** Resources and hints allowed */
  allowedResources: boolean;
}

/**
 * Mission scoring and validation rules
 */
export interface MissionScoringRules {
  /** Maximum possible score */
  maxScore: number;
  /** Minimum score for completion */
  minCompletionScore: number;
  /** Score calculation method */
  scoringMethod: 'percentage' | 'points' | 'rubric' | 'peer_review';
  /** Weight factors for different aspects */
  weights: {
    accuracy?: number;
    speed?: number;
    quality?: number;
    creativity?: number;
    efficiency?: number;
  };
  /** Bonus scoring opportunities */
  bonusPoints: {
    earlyCompletion?: number;
    perfectScore?: number;
    innovation?: number;
  };
}

// =====================================================
// CUSTOM LEARNING SYSTEM
// =====================================================

/**
 * Validation criteria for custom content modules
 */
export interface ValidationCriteria {
  /** Type of validation required */
  type: 'completion' | 'quiz_score' | 'time_spent' | 'project_submission';
  /** Minimum score required (for quiz_score type) */
  minimumScore?: number;
  /** Minimum time required in minutes (for time_spent type) */
  minimumTime?: number;
  /** Whether submission is required (for project_submission type) */
  requiredSubmission?: boolean;
}

/**
 * Learning resource for custom content
 */
export interface LearningResource {
  /** Unique resource identifier */
  id: string;
  /** Type of resource */
  type: 'documentation' | 'tool' | 'book' | 'course' | 'practice_env';
  /** Resource title */
  title: string;
  /** Resource description */
  description: string;
  /** Resource URL */
  url: string;
  /** Whether this is a premium resource */
  isPremium: boolean;
  /** User rating (1-5 stars) */
  rating?: number;
  /** Resource tags for categorization */
  tags: string[];
}

/**
 * Custom content module for learning paths
 */
export interface CustomContentModule {
  /** Unique module identifier */
  id: string;
  /** Type of content module */
  type: 'video' | 'article' | 'practice' | 'project' | 'quiz';
  /** Module title */
  title: string;
  /** Module description */
  description: string;
  /** External URL for content (YouTube, documentation, etc.) */
  url?: string;
  /** Embedded content for platform-hosted materials */
  content?: string;
  /** Estimated time to complete in minutes */
  estimatedTime: number;
  /** Difficulty level using existing mission difficulty type */
  difficulty: MissionDifficulty;
  /** Validation criteria for completion */
  validationCriteria?: ValidationCriteria;
  /** Additional learning resources */
  resources?: LearningResource[];
}

/**
 * Custom learning goal
 */
export interface CustomGoal {
  /** Unique goal identifier */
  id: string;
  /** User ID who owns this goal */
  userId: string;
  /** Goal title (e.g., "Master Docker & Kubernetes") */
  title: string;
  /** Detailed description of the goal */
  description: string;
  /** Learning category */
  category: 'programming' | 'devops' | 'language' | 'design' | 'business' | 'other';
  /** Estimated duration in days */
  estimatedDuration: number;
  /** Goal difficulty level */
  difficulty: MissionDifficulty;
  /** Creation timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
  /** Associated mission IDs */
  missions: string[];
  /** Goal progress tracking */
  progress: {
    /** Number of completed missions */
    completedMissions: number;
    /** Total number of missions for this goal */
    totalMissions: number;
    /** Current streak in days */
    currentStreak: number;
    /** Estimated completion date */
    estimatedCompletion: Date;
  };
  /** Whether the goal is currently active */
  isActive: boolean;
}

// =====================================================
// ACTIVE MISSIONS
// =====================================================

/**
 * Generated mission instance
 */
export interface Mission {
  /** Unique mission identifier */
  id: string;
  /** User ID this mission is assigned to */
  userId: string;
  /** Template this mission was generated from */
  templateId: string;
  /** Learning track */
  track: LearningTrack;
  /** Mission frequency type */
  frequency: MissionFrequency;
  /** Mission title */
  title: string;
  /** Mission description */
  description: string;
  /** Mission difficulty */
  difficulty: MissionDifficulty;
  /** Estimated duration in minutes */
  estimatedDuration: number;
  /** Mission content */
  content: MissionContent;
  /** Current status */
  status: MissionStatus;
  /** Scheduled start time */
  scheduledAt: Date;
  /** Actual start time */
  startedAt?: Date;
  /** Completion time */
  completedAt?: Date;
  /** Deadline for completion */
  deadline: Date;
  /** User's progress on this mission */
  progress: MissionProgress;
  /** Mission results and scoring */
  results?: MissionResults;
  /** Persona optimizations applied */
  personaOptimizations: PersonaMissionOptimizations;
  /** Created timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;

  // Custom Learning Path Fields (backward compatible)
  /** Indicates if this is a custom learning path mission */
  isCustomLearningPath?: boolean;
  /** Associated custom goal ID */
  customGoal?: string;
  /** Custom content modules for learning paths */
  customContent?: CustomContentModule[];
}

/**
 * Mission content data
 */
export interface MissionContent {
  /** Content type */
  type: MissionContentStructure['type'];
  /** Exam track content */
  examContent?: {
    questions: ExamQuestion[];
    timeLimit: number;
    passingScore: number;
    instructions: string;
  };
  /** Tech track content */
  techContent?: {
    challenge: TechChallenge;
    requirements: string[];
    deliverables: string[];
    resources: TechResource[];
  };
}

/**
 * Exam question structure
 */
export interface ExamQuestion {
  /** Question identifier */
  id: string;
  /** Question text */
  question: string;
  /** Question type */
  type: ExamMissionContent['questionTypes'][0];
  /** Answer options (for multiple choice) */
  options?: string[];
  /** Correct answer(s) */
  correctAnswer: string | string[];
  /** Explanation of the answer */
  explanation: string;
  /** Subject area */
  subject: string;
  /** Topic within subject */
  topic: string;
  /** Difficulty level */
  difficulty: MissionDifficulty;
  /** Points for correct answer */
  points: number;
}

/**
 * Tech challenge structure
 */
export interface TechChallenge {
  /** Challenge identifier */
  id: string;
  /** Challenge title */
  title: string;
  /** Problem statement */
  problemStatement: string;
  /** Challenge type */
  type: TechMissionContent['challengeType'];
  /** Input/output examples */
  examples: {
    input: string;
    output: string;
    explanation?: string;
  }[];
  /** Constraints and limitations */
  constraints: string[];
  /** Starter code templates */
  starterCode: Record<string, string>; // language -> code
  /** Test cases */
  testCases: {
    input: string;
    expectedOutput: string;
    isHidden: boolean;
  }[];
  /** Solution template/hints */
  hints: string[];
}

/**
 * Tech learning resources
 */
export interface TechResource {
  /** Resource type */
  type: 'documentation' | 'tutorial' | 'video' | 'example' | 'tool';
  /** Resource title */
  title: string;
  /** Resource URL or content */
  url?: string;
  /** Resource description */
  description: string;
  /** Whether resource is required or optional */
  required: boolean;
}

// =====================================================
// PROGRESS TRACKING
// =====================================================

/**
 * Mission progress tracking
 */
export interface MissionProgress {
  /** Overall completion percentage */
  completionPercentage: number;
  /** Current step/question index */
  currentStep: number;
  /** Total steps/questions */
  totalSteps: number;
  /** Time spent so far (minutes) */
  timeSpent: number;
  /** Step-by-step progress */
  stepProgress: StepProgress[];
  /** User's answers/submissions */
  submissions: MissionSubmission[];
  /** Real-time metrics */
  metrics: {
    accuracy: number;
    speed: number; // questions/problems per minute
    consistency: number;
    engagement: number;
  };
}

/**
 * Individual step progress
 */
export interface StepProgress {
  /** Step identifier */
  stepId: string;
  /** Step status */
  status: 'not_started' | 'in_progress' | 'completed' | 'skipped';
  /** Time spent on this step */
  timeSpent: number;
  /** Number of attempts */
  attempts: number;
  /** Whether step was completed correctly */
  isCorrect?: boolean;
  /** Score achieved for this step */
  score?: number;
  /** Started timestamp */
  startedAt?: Date;
  /** Completed timestamp */
  completedAt?: Date;
}

/**
 * User submission for mission steps
 */
export interface MissionSubmission {
  /** Submission identifier */
  id: string;
  /** Step this submission belongs to */
  stepId: string;
  /** Submission type */
  type: 'answer' | 'code' | 'file' | 'text';
  /** Submission content */
  content: string | Record<string, any>;
  /** Submission timestamp */
  submittedAt: Date;
  /** Whether this is the final submission for the step */
  isFinal: boolean;
  /** Auto-grading results */
  gradingResults?: {
    isCorrect: boolean;
    score: number;
    feedback: string;
    detailedResults?: Record<string, any>;
  };
}

/**
 * Mission completion results
 */
export interface MissionResults {
  /** Final score achieved */
  finalScore: number;
  /** Maximum possible score */
  maxScore: number;
  /** Percentage score */
  percentage: number;
  /** Whether mission was passed */
  passed: boolean;
  /** Total time taken */
  totalTime: number;
  /** Detailed performance metrics */
  metrics: {
    accuracy: number;
    speed: number;
    efficiency: number;
    consistency: number;
  };
  /** Areas of strength */
  strengths: string[];
  /** Areas for improvement */
  improvements: string[];
  /** Detailed breakdown by subject/topic */
  breakdown: {
    subject: string;
    topic: string;
    score: number;
    maxScore: number;
    timeSpent: number;
  }[];
  /** Achievements earned */
  achievements: string[];
  /** Next recommended actions */
  recommendations: string[];
}

// =====================================================
// PERSONA OPTIMIZATIONS
// =====================================================

/**
 * Persona-specific mission optimizations
 */
export interface PersonaMissionOptimizations {
  /** Target persona */
  persona: UserPersonaType;
  /** Time constraints adjustments */
  timeAdjustments: {
    /** Preferred mission duration */
    preferredDuration: number;
    /** Maximum acceptable duration */
    maxDuration: number;
    /** Break suggestions */
    breakIntervals: number[];
  };
  /** Content adaptations */
  contentAdaptations: {
    /** Explanation verbosity level */
    explanationLevel: 'brief' | 'detailed' | 'comprehensive';
    /** Example complexity */
    exampleComplexity: 'simple' | 'realistic' | 'advanced';
    /** Real-world context preference */
    contextType: 'academic' | 'professional' | 'practical';
  };
  /** Motivation strategies */
  motivationStrategies: {
    /** Preferred reward types */
    rewardTypes: ('points' | 'badges' | 'certificates' | 'progress' | 'social')[];
    /** Feedback frequency */
    feedbackFrequency: 'immediate' | 'step_by_step' | 'end_of_mission';
    /** Challenge level preference */
    challengePreference: 'steady' | 'increasing' | 'variable';
  };
  /** Progress visualization preferences */
  progressVisualization: {
    /** Chart types preferred */
    chartTypes: ('bar' | 'line' | 'pie' | 'gauge' | 'heatmap')[];
    /** Detail level */
    detailLevel: 'summary' | 'detailed' | 'comprehensive';
    /** Comparison preferences */
    comparisons: ('self' | 'peers' | 'benchmarks' | 'goals')[];
  };
}

// =====================================================
// UNIFIED PROGRESS SYSTEM
// =====================================================

/**
 * Cross-track progress aggregation
 */
export interface UnifiedProgress {
  /** User identifier */
  userId: string;
  /** Overall progress across all tracks */
  overallProgress: {
    /** Total missions completed */
    totalMissionsCompleted: number;
    /** Total time invested (minutes) */
    totalTimeInvested: number;
    /** Average score across all missions */
    averageScore: number;
    /** Current learning streak (days) */
    currentStreak: number;
    /** Longest learning streak */
    longestStreak: number;
    /** Overall consistency rating */
    consistencyRating: number;
  };
  /** Track-specific progress */
  trackProgress: {
    exam: TrackProgress;
    course_tech: TrackProgress;
  };
  /** Cross-track insights */
  crossTrackInsights: {
    /** Skills that transfer between tracks */
    transferableSkills: string[];
    /** Learning patterns that work across tracks */
    effectivePatterns: string[];
    /** Recommended track balance */
    recommendedBalance: {
      exam: number; // percentage
      course_tech: number; // percentage
    };
  };
  /** Weekly/monthly summaries */
  periodSummaries: {
    weekly: PeriodSummary[];
    monthly: PeriodSummary[];
  };
  /** Last updated timestamp */
  updatedAt: Date;
}

/**
 * Progress for a specific learning track
 */
export interface TrackProgress {
  /** Learning track */
  track: LearningTrack;
  /** Missions completed in this track */
  missionsCompleted: number;
  /** Average score in this track */
  averageScore: number;
  /** Time invested in this track (minutes) */
  timeInvested: number;
  /** Current proficiency level */
  proficiencyLevel: 'beginner' | 'intermediate' | 'advanced' | 'expert';
  /** Skills mastered */
  masteredSkills: string[];
  /** Skills in progress */
  skillsInProgress: string[];
  /** Recent performance trend */
  performanceTrend: 'improving' | 'stable' | 'declining';
  /** Difficulty progression */
  difficultyProgression: {
    current: MissionDifficulty;
    recommended: MissionDifficulty;
    readyForAdvancement: boolean;
  };
  /** Subject/topic breakdown */
  topicBreakdown: {
    topic: string;
    proficiency: number; // 0-100
    missionsCompleted: number;
    averageScore: number;
  }[];
}

/**
 * Period-based progress summary
 */
export interface PeriodSummary {
  /** Period type */
  period: 'week' | 'month';
  /** Period start date */
  startDate: Date;
  /** Period end date */
  endDate: Date;
  /** Missions completed in period */
  missionsCompleted: number;
  /** Average score in period */
  averageScore: number;
  /** Time invested in period */
  timeInvested: number;
  /** Goals achieved */
  goalsAchieved: number;
  /** Goals set */
  goalsSet: number;
  /** Key achievements */
  achievements: string[];
  /** Areas of improvement identified */
  improvements: string[];
  /** Overall period rating */
  periodRating: number; // 1-5 stars
}

// =====================================================
// ACHIEVEMENT SYSTEM
// =====================================================

/**
 * Achievement definition
 */
export interface Achievement {
  /** Unique achievement identifier */
  id: string;
  /** Achievement name */
  name: string;
  /** Achievement description */
  description: string;
  /** Achievement category */
  category: 'completion' | 'performance' | 'consistency' | 'skill' | 'social' | 'milestone';
  /** Learning track this achievement belongs to */
  track: LearningTrack | 'both';
  /** Difficulty/rarity level */
  rarity: 'common' | 'uncommon' | 'rare' | 'epic' | 'legendary';
  /** Points awarded for this achievement */
  points: number;
  /** Requirements to unlock this achievement */
  requirements: AchievementRequirement[];
  /** Badge/icon information */
  badge: {
    iconUrl: string;
    color: string;
    animation?: 'glow' | 'pulse' | 'rotate' | 'bounce';
  };
  /** Persona-specific variations */
  personaVariations: Record<
    UserPersonaType,
    {
      name?: string;
      description?: string;
      requirements?: Partial<AchievementRequirement>[];
    }
  >;
  /** Whether achievement is currently active */
  isActive: boolean;
  /** Created timestamp */
  createdAt: Date;
}

/**
 * Achievement requirement definition
 */
export interface AchievementRequirement {
  /** Requirement type */
  type: 'missions_completed' | 'score_threshold' | 'streak' | 'time_spent' | 'skill_mastery' | 'custom';
  /** Target value to achieve */
  target: number;
  /** Specific conditions */
  conditions?: {
    track?: LearningTrack;
    difficulty?: MissionDifficulty;
    timeframe?: number; // days
    subjects?: string[];
    consecutive?: boolean;
  };
  /** Custom validation function (for custom type) */
  customValidator?: string; // Function name or expression
}

/**
 * User achievement progress and status
 */
export interface UserAchievement {
  /** User identifier */
  userId: string;
  /** Achievement identifier */
  achievementId: string;
  /** Current progress toward achievement */
  progress: number;
  /** Target value for completion */
  target: number;
  /** Whether achievement is unlocked */
  isUnlocked: boolean;
  /** When achievement was unlocked */
  unlockedAt?: Date;
  /** Whether achievement is currently displayed to user */
  isDisplayed: boolean;
  /** Progress tracking for each requirement */
  requirementProgress: {
    requirementIndex: number;
    currentValue: number;
    targetValue: number;
    isCompleted: boolean;
  }[];
  /** Created timestamp */
  createdAt: Date;
  /** Last updated timestamp */
  updatedAt: Date;
}

/**
 * Achievement notification
 */
export interface AchievementNotification {
  /** Notification identifier */
  id: string;
  /** User identifier */
  userId: string;
  /** Achievement that was unlocked */
  achievement: Achievement;
  /** When achievement was unlocked */
  unlockedAt: Date;
  /** Whether notification has been seen */
  isSeen: boolean;
  /** Whether notification has been dismissed */
  isDismissed: boolean;
  /** Notification display priority */
  priority: 'low' | 'medium' | 'high' | 'critical';
  /** Created timestamp */
  createdAt: Date;
}

// =====================================================
// MISSION GENERATION & SCHEDULING
// =====================================================

/**
 * Mission generation request
 */
export interface MissionGenerationRequest {
  /** User identifier */
  userId: string;
  /** Learning track to generate for */
  track: LearningTrack;
  /** Mission frequency */
  frequency: MissionFrequency;
  /** Preferred difficulty (optional - will use adaptive if not specified) */
  difficulty?: MissionDifficulty;
  /** Specific subjects to focus on */
  subjectFilters?: string[];
  /** Custom duration override */
  durationOverride?: number;
  /** Force regeneration even if mission exists */
  forceRegeneration?: boolean;
  /** Scheduling preferences */
  schedulingOptions?: {
    preferredStartTime?: Date;
    deadline?: Date;
    allowWeekends?: boolean;
  };
}

/**
 * Mission generation result
 */
export interface MissionGenerationResult {
  /** Whether generation was successful */
  success: boolean;
  /** Generated mission (if successful) */
  mission?: Mission;
  /** Error message (if failed) */
  error?: string;
  /** Generation metadata */
  metadata: {
    templateUsed: string;
    difficultyAdjustments: string[];
    personaOptimizations: string[];
    generationTime: number; // milliseconds
  };
}

/**
 * Bulk mission scheduling request
 */
export interface MissionSchedulingRequest {
  /** User identifier */
  userId: string;
  /** Scheduling period */
  period: {
    startDate: Date;
    endDate: Date;
  };
  /** Track-specific scheduling preferences */
  trackPreferences: {
    exam?: {
      frequency: MissionFrequency;
      preferredDays: number[];
      timeSlots: string[];
    };
    course_tech?: {
      frequency: MissionFrequency;
      preferredDays: number[];
      timeSlots: string[];
    };
  };
  /** Whether to override existing missions */
  overrideExisting?: boolean;
}

/**
 * Mission scheduling result
 */
export interface MissionSchedulingResult {
  /** Whether scheduling was successful */
  success: boolean;
  /** Number of missions scheduled */
  missionsScheduled: number;
  /** Scheduled missions details */
  missions: Mission[];
  /** Any conflicts or issues encountered */
  conflicts: string[];
  /** Scheduling summary */
  summary: {
    totalDays: number;
    examMissions: number;
    techMissions: number;
    averageWorkload: number; // minutes per day
  };
}

// =====================================================
// ANALYTICS & INSIGHTS
// =====================================================

/**
 * Mission analytics data
 */
export interface MissionAnalytics {
  /** User identifier */
  userId: string;
  /** Analytics period */
  period: {
    startDate: Date;
    endDate: Date;
  };
  /** Overall performance metrics */
  overallMetrics: {
    missionsCompleted: number;
    missionsSkipped: number;
    averageScore: number;
    totalTimeSpent: number;
    consistencyScore: number;
  };
  /** Track-specific analytics */
  trackAnalytics: {
    exam: TrackAnalytics;
    course_tech: TrackAnalytics;
  };
  /** Performance trends */
  trends: {
    scoresTrend: number[]; // daily average scores
    timeTrend: number[]; // daily time spent
    difficultyTrend: string[]; // difficulty levels over time
  };
  /** Insights and recommendations */
  insights: {
    strengths: string[];
    improvements: string[];
    recommendations: string[];
    predictedPerformance: number; // next period prediction
  };
  /** Generated timestamp */
  generatedAt: Date;
}

/**
 * Track-specific analytics
 */
export interface TrackAnalytics {
  /** Learning track */
  track: LearningTrack;
  /** Missions completed */
  missionsCompleted: number;
  /** Average score */
  averageScore: number;
  /** Time invested */
  timeInvested: number;
  /** Difficulty distribution */
  difficultyDistribution: Record<MissionDifficulty, number>;
  /** Subject performance */
  subjectPerformance: {
    subject: string;
    averageScore: number;
    missionsCompleted: number;
    timeSpent: number;
  }[];
  /** Mission type performance */
  missionTypePerformance: {
    type: string;
    averageScore: number;
    completionRate: number;
  }[];
}

// =====================================================
// UTILITY TYPES
// =====================================================

/**
 * API response wrapper for mission system operations
 */
export interface MissionApiResponse<T = any> {
  /** Whether operation was successful */
  success: boolean;
  /** Response data */
  data?: T;
  /** Error message if failed */
  error?: string;
  /** Additional metadata */
  metadata?: Record<string, any>;
  /** Response timestamp */
  timestamp: Date;
}

/**
 * Pagination options for mission queries
 */
export interface MissionPaginationOptions {
  /** Current page (0-based) */
  page: number;
  /** Items per page */
  limit: number;
  /** Sort field */
  sortBy?: string;
  /** Sort direction */
  sortOrder?: 'asc' | 'desc';
  /** Filters to apply */
  filters?: Record<string, any>;
}

/**
 * Paginated response for mission queries
 */
export interface PaginatedMissionResponse<T> {
  /** Response data */
  data: T[];
  /** Current page */
  page: number;
  /** Items per page */
  limit: number;
  /** Total items available */
  total: number;
  /** Total pages available */
  totalPages: number;
  /** Whether there are more pages */
  hasMore: boolean;
}

export default {
  // Export all types for easy importing
};
