/**
 * @fileoverview Micro-Learning System Type Definitions
 *
 * This file contains TypeScript interfaces for the dual-track micro-learning system
 * that supports both exam preparation and course/tech learning with persona-aware adaptations.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { UserPersona as _UserPersona } from './exam';

/**
 * Represents a micro-learning session that adapts to user persona and learning track
 *
 * @interface MicroLearningSession
 * @example
 * ```typescript
 * const session: MicroLearningSession = {
 *   id: 'session_123',
 *   userId: 'user_456',
 *   learningTrack: 'exam',
 *   subjectId: 'mathematics',
 *   topicId: 'calculus',
 *   sessionType: 'practice',
 *   duration: 15,
 *   difficulty: 'medium',
 *   personaOptimizations: {...},
 *   content: [...],
 *   validationMethod: {...}
 * };
 * ```
 */
export interface MicroLearningSession {
  /** Unique identifier for the session */
  id: string;
  /** User ID who owns this session */
  userId: string;
  /** Learning track type */
  learningTrack: 'exam' | 'course_tech';
  /** Subject being studied */
  subjectId: string;
  /** Specific topic within the subject */
  topicId: string;
  /** Type of learning session */
  sessionType: 'concept' | 'practice' | 'review' | 'assessment' | 'project' | 'assignment';
  /** Duration in minutes */
  duration: number;
  /** Difficulty level */
  difficulty: 'easy' | 'medium' | 'hard';
  /** Persona-specific optimizations */
  personaOptimizations: PersonaOptimizations;
  /** Session content array */
  content: MicroContent[];
  /** Validation method based on learning track */
  validationMethod: ExamValidation | CourseValidation;
  /** Session creation timestamp */
  createdAt: Date;
  /** Session completion timestamp */
  completedAt?: Date;
  /** Session performance metrics */
  performance?: SessionPerformance;
  /** Metadata for tracking and analytics */
  metadata?: SessionMetadata;
}

/**
 * Validation method for exam-focused learning sessions
 *
 * @interface ExamValidation
 */
export interface ExamValidation {
  /** Validation type identifier */
  type: 'exam';
  /** Number of mock test questions */
  mockTestQuestions: number;
  /** Topics for revision */
  revisionTopics: string[];
  /** Practice session score */
  practiceScore?: number;
  /** Target exam identifier */
  targetExam: string;
  /** Exam stage (prelims, mains, etc.) */
  examStage?: string;
}

/**
 * Validation method for course/tech learning sessions
 *
 * @interface CourseValidation
 */
export interface CourseValidation {
  /** Validation type identifier */
  type: 'course_tech';
  /** Assignment tasks to complete */
  assignmentTasks: AssignmentTask[];
  /** Project components to build */
  projectComponents: ProjectComponent[];
  /** Skills to validate through practice */
  skillsToValidate: string[];
  /** Completion criteria for the session */
  completionCriteria: CompletionCriteria;
}

/**
 * Individual assignment task within a course/tech session
 *
 * @interface AssignmentTask
 */
export interface AssignmentTask {
  /** Unique task identifier */
  id: string;
  /** Task title */
  title: string;
  /** Detailed task description */
  description: string;
  /** Estimated completion time in minutes */
  estimatedTime: number;
  /** Task difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  /** Skills required to complete the task */
  skillsRequired: string[];
  /** Optional code template or starter files */
  template?: string;
  /** Expected deliverables */
  deliverables: string[];
}

/**
 * Project component for hands-on learning in course/tech sessions
 *
 * @interface ProjectComponent
 */
export interface ProjectComponent {
  /** Unique component identifier */
  id: string;
  /** Type of component */
  componentType: 'frontend' | 'backend' | 'database' | 'deployment' | 'testing' | 'documentation';
  /** Component title */
  title: string;
  /** Detailed requirements */
  requirements: string[];
  /** Estimated hours to complete */
  estimatedHours: number;
  /** Dependencies on other components */
  dependencies?: string[];
  /** Technology stack involved */
  technologies: string[];
}

/**
 * Completion criteria for course/tech sessions
 *
 * @interface CompletionCriteria
 */
export interface CompletionCriteria {
  /** Minimum score required to pass */
  minimumScore: number;
  /** Required tasks that must be completed */
  requiredTasks: string[];
  /** Whether portfolio submission is required */
  portfolioSubmission: boolean;
  /** Whether peer review is required */
  peerReview: boolean;
  /** Code quality standards to meet */
  codeQualityStandards?: CodeQualityStandards;
}

/**
 * Code quality standards for technical assessments
 *
 * @interface CodeQualityStandards
 */
export interface CodeQualityStandards {
  /** Code style and formatting requirements */
  codeStyle: boolean;
  /** Documentation requirements */
  documentation: boolean;
  /** Testing requirements */
  testing: boolean;
  /** Performance benchmarks */
  performance?: PerformanceBenchmarks;
}

/**
 * Performance benchmarks for code assessments
 *
 * @interface PerformanceBenchmarks
 */
export interface PerformanceBenchmarks {
  /** Maximum execution time in milliseconds */
  maxExecutionTime?: number;
  /** Memory usage limits in MB */
  memoryLimit?: number;
  /** Code complexity metrics */
  complexityScore?: number;
}

/**
 * Persona-specific optimizations for micro-learning sessions
 *
 * @interface PersonaOptimizations
 */
export interface PersonaOptimizations {
  /** Adapted session length based on persona constraints */
  sessionLength: number;
  /** Whether to show break reminders */
  breakReminders: boolean;
  /** Whether to support context switching */
  contextSwitching: boolean;
  /** Motivational framing style */
  motivationalFraming: 'academic' | 'career' | 'personal' | 'skill_building';
  /** Learning complexity progression */
  complexityRamp: 'gentle' | 'standard' | 'accelerated';
  /** Preferred learning track */
  learningTrackPreference: 'exam' | 'course_tech' | 'mixed';
  /** Notification preferences */
  notificationStyle: 'minimal' | 'standard' | 'comprehensive';
  /** UI density preference */
  uiDensity: 'compact' | 'comfortable' | 'spacious';
}

/**
 * Individual content item within a micro-learning session
 *
 * @interface MicroContent
 */
export interface MicroContent {
  /** Unique content identifier */
  id: string;
  /** Type of content */
  type: 'concept' | 'example' | 'practice' | 'quiz' | 'code_snippet' | 'hands_on' | 'video' | 'interactive';
  /** Content body (HTML, markdown, or plain text) */
  content: string;
  /** Estimated time to consume in seconds */
  estimatedTime: number;
  /** Learning track this content belongs to */
  learningTrack: 'exam' | 'course_tech';
  /** Persona-specific adaptations */
  personaAdaptations: PersonaAdaptations;
  /** Content metadata */
  metadata?: ContentMetadata;
  /** Interactive elements */
  interactions?: ContentInteraction[];
}

/**
 * Persona-specific content adaptations
 *
 * @interface PersonaAdaptations
 */
export interface PersonaAdaptations {
  /** Adaptations for student persona */
  student?: ContentAdaptation;
  /** Adaptations for working professional persona */
  working_professional?: ContentAdaptation;
  /** Adaptations for freelancer persona */
  freelancer?: ContentAdaptation;
}

/**
 * Content adaptation for a specific persona
 *
 * @interface ContentAdaptation
 */
export interface ContentAdaptation {
  /** Persona-specific examples */
  examples: string[];
  /** Motivational message tailored to persona */
  motivation: string;
  /** Context of how this applies to their life/work */
  applicationContext: string;
  /** Validation method for this persona */
  validationMethod: 'quiz' | 'practice' | 'project' | 'assignment' | 'discussion';
  /** Additional resources relevant to this persona */
  additionalResources?: AdditionalResource[];
}

/**
 * Additional learning resources
 *
 * @interface AdditionalResource
 */
export interface AdditionalResource {
  /** Resource type */
  type: 'article' | 'video' | 'documentation' | 'tutorial' | 'tool';
  /** Resource title */
  title: string;
  /** Resource URL */
  url: string;
  /** Estimated time to consume */
  estimatedTime: number;
  /** Difficulty level */
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

/**
 * Content metadata for analytics and optimization
 *
 * @interface ContentMetadata
 */
export interface ContentMetadata {
  /** Content creation date */
  createdAt: Date;
  /** Content last updated date */
  updatedAt: Date;
  /** Content author */
  author: string;
  /** Content version */
  version: string;
  /** Content tags for categorization */
  tags: string[];
  /** Content difficulty rating */
  difficultyRating: number;
  /** User engagement metrics */
  engagementMetrics?: EngagementMetrics;
}

/**
 * Content engagement metrics
 *
 * @interface EngagementMetrics
 */
export interface EngagementMetrics {
  /** Average time spent on content */
  averageTimeSpent: number;
  /** Completion rate percentage */
  completionRate: number;
  /** User satisfaction rating */
  satisfactionRating: number;
  /** Number of times content was accessed */
  accessCount: number;
}

/**
 * Interactive elements within content
 *
 * @interface ContentInteraction
 */
export interface ContentInteraction {
  /** Interaction type */
  type: 'click' | 'hover' | 'input' | 'drag_drop' | 'multiple_choice' | 'code_editor';
  /** Interaction identifier */
  id: string;
  /** Interaction prompt or question */
  prompt: string;
  /** Expected response or correct answer */
  expectedResponse?: any;
  /** Feedback for correct/incorrect responses */
  feedback: {
    correct: string;
    incorrect: string;
    hint?: string;
  };
}

/**
 * Session performance tracking and analytics
 *
 * @interface SessionPerformance
 */
export interface SessionPerformance {
  /** Overall accuracy percentage */
  accuracy: number;
  /** Total time spent in seconds */
  timeSpent: number;
  /** Engagement score (0-100) */
  engagementScore: number;
  /** Concepts successfully learned */
  conceptsLearned: string[];
  /** Skills developed during session */
  skillsDeveloped: string[];
  /** Areas needing improvement */
  areasForImprovement: string[];
  /** Track-specific performance metrics */
  trackSpecificMetrics: ExamTrackMetrics | CourseTrackMetrics;
  /** Interaction analytics */
  interactionAnalytics?: InteractionAnalytics;
}

/**
 * Performance metrics specific to exam track sessions
 *
 * @interface ExamTrackMetrics
 */
export interface ExamTrackMetrics {
  /** Mock test score percentage */
  mockTestScore: number;
  /** Revision effectiveness rating */
  revisionEffectiveness: number;
  /** Exam readiness score */
  examReadinessScore: number;
  /** Topics identified as weak */
  weakTopics: string[];
  /** Speed of problem solving */
  problemSolvingSpeed: number;
  /** Accuracy trend over time */
  accuracyTrend: number[];
}

/**
 * Performance metrics specific to course/tech track sessions
 *
 * @interface CourseTrackMetrics
 */
export interface CourseTrackMetrics {
  /** Assignment completion rate percentage */
  assignmentCompletionRate: number;
  /** Project progress percentage */
  projectProgressPercentage: number;
  /** Skill mastery levels by skill */
  skillMasteryLevel: Record<string, number>;
  /** Portfolio quality score */
  portfolioQuality: number;
  /** Code quality metrics */
  codeQualityMetrics?: CodeQualityMetrics;
  /** Problem-solving approach rating */
  problemSolvingApproach: number;
}

/**
 * Code quality assessment metrics
 *
 * @interface CodeQualityMetrics
 */
export interface CodeQualityMetrics {
  /** Code style compliance percentage */
  styleCompliance: number;
  /** Documentation quality score */
  documentationQuality: number;
  /** Test coverage percentage */
  testCoverage: number;
  /** Performance efficiency rating */
  performanceEfficiency: number;
  /** Code maintainability score */
  maintainabilityScore: number;
}

/**
 * Interaction analytics for session optimization
 *
 * @interface InteractionAnalytics
 */
export interface InteractionAnalytics {
  /** Total number of interactions */
  totalInteractions: number;
  /** Average response time per interaction */
  averageResponseTime: number;
  /** Number of hint requests */
  hintRequests: number;
  /** Interaction success rate */
  successRate: number;
  /** Most challenging interaction types */
  challengingInteractions: string[];
}

/**
 * Session metadata for tracking and analytics
 *
 * @interface SessionMetadata
 */
export interface SessionMetadata {
  /** Device used for the session */
  device: 'desktop' | 'tablet' | 'mobile';
  /** Browser information */
  browser: string;
  /** Session location (if permitted) */
  location?: string;
  /** Learning environment */
  environment: 'home' | 'office' | 'library' | 'commute' | 'other';
  /** Interruption count during session */
  interruptionCount: number;
  /** Background noise level */
  noiseLevel?: 'quiet' | 'moderate' | 'noisy';
}

/**
 * Learning recommendation based on session performance
 *
 * @interface LearningRecommendation
 */
export interface LearningRecommendation {
  /** Recommendation type */
  type: 'next_session' | 'review_topic' | 'difficulty_adjustment' | 'learning_path' | 'break_suggestion';
  /** Recommendation title */
  title: string;
  /** Detailed recommendation description */
  description: string;
  /** Priority level */
  priority: 'low' | 'medium' | 'high' | 'urgent';
  /** Recommended action */
  action: RecommendedAction;
  /** Reasoning behind the recommendation */
  reasoning: string;
  /** Expected benefit */
  expectedBenefit: string;
}

/**
 * Recommended action for learning optimization
 *
 * @interface RecommendedAction
 */
export interface RecommendedAction {
  /** Action type */
  type: 'start_session' | 'review_content' | 'take_break' | 'adjust_difficulty' | 'change_track';
  /** Action parameters */
  parameters: Record<string, any>;
  /** Estimated time required */
  estimatedTime: number;
  /** Action urgency */
  urgency: 'immediate' | 'within_hour' | 'within_day' | 'within_week';
}
