# Adaptive Testing System - Complete Implementation Guide

> **Integration-First Approach**: This system integrates seamlessly with our existing Mission System, Progress Service, Firebase infrastructure, and Journey Planning to provide intelligent, personalized assessments.

## 🎯 System Overview & Architecture Integration

### Current System Integration Points

Our Adaptive Testing System builds upon the existing architecture:

**🔗 Mission System Integration** (`lib/mission-service.ts` - 1357 lines)

- Leverages existing mission generation for test question creation
- Uses persona-aware difficulty adjustment mechanisms
- Integrates with mission completion tracking for adaptive responses

**🔗 Progress Service Integration** (`lib/progress-service.ts` - 359 lines)

- Extends UnifiedProgress with adaptive test metrics
- Syncs with existing TrackProgress system for cross-system analytics
- Maintains consistency with mission-based progress tracking

**🔗 Firebase Services Integration** (`lib/firebase-services.ts` - 1500 lines)

- Extends existing Firebase collections with test data
- Leverages existing real-time subscriptions and performance monitoring
- Uses established error handling and retry mechanisms

**🔗 Dashboard Integration** (`app/dashboard/page.tsx`)

- Adds adaptive testing widgets to existing AdaptiveDashboard component
- Maintains consistency with current Navigation and AuthGuard patterns
- Integrates with existing analytics and progress displays

### 🔄 New Components We'll Build

1. **Adaptive Testing Service** (`lib/adaptive-testing-service.ts`) - Core testing engine
2. **Test Types & Models** (`types/adaptive-testing.ts`) - Type definitions extending existing systems
3. **Test Components** (`components/adaptive-testing/`) - UI components for test delivery
4. **Test Analytics** (`components/analytics/TestAnalytics.tsx`) - Integration with existing analytics
5. **Test Dashboard** (`app/test/page.tsx`) - Main testing interface

## Note: We will use GEMINI APIs to generate questions and validate answers based on selected topics/subjects. In future we might switch to different LLM, so integrate in such a way that we don't need to change much code.

## Phase 1: Foundation & Algorithm Core (Days 1-2)

### Day 1 - Morning (3 hours): Adaptive Testing Types & Algorithm Foundation

#### Hour 1 (9:00-10:00 AM): Core Type Definitions

**File**: `types/adaptive-testing.ts`

```typescript
/**
 * @fileoverview Adaptive Testing System Types
 * Integrates with existing Mission System, Progress Service, and Journey Planning
 */

import { LearningTrack, MissionDifficulty, UnifiedProgress, SubjectData } from './mission-system';
import { UserJourney } from './journey';

export interface AdaptiveTest {
  id: string;
  userId: string;
  title: string;
  description: string;

  // Integration with existing systems
  linkedJourneyId?: string; // Links to Journey Planning system
  linkedSubjects: string[]; // Subject IDs from exam data
  track: LearningTrack; // Consistent with mission system

  // Test configuration
  totalQuestions: number;
  estimatedDuration: number; // minutes
  difficultyRange: {
    min: MissionDifficulty;
    max: MissionDifficulty;
  };

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
  createdFrom: 'manual' | 'journey' | 'mission' | 'recommendation';
}

export interface AdaptiveQuestion {
  id: string;
  content: string;
  type: 'multiple_choice' | 'true_false' | 'numerical' | 'text_input';
  options?: QuestionOption[];
  correctAnswers: string[]; // Support multiple correct answers
  explanation: string;

  // Adaptive properties
  difficulty: MissionDifficulty;
  discriminationIndex: number; // How well question differentiates ability levels
  guessingParameter: number; // Probability of correct guess

  // Content classification
  subject: string;
  topic: string;
  subtopic?: string;
  bloomsLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';

  // Performance data
  timesAsked: number;
  averageResponseTime: number;
  successRate: number;

  // Integration markers
  linkedMissionId?: string; // Links to mission system
  tags: string[];
}

export interface QuestionOption {
  id: string;
  content: string;
  isCorrect: boolean;
  feedback?: string;
}

export interface TestResponse {
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

export interface TestJourneyIntegration {
  testId: string;
  journeyId: string;
  goalAlignments: Array<{
    goalId: string;
    contributionWeight: number;
    impactMetrics: string[];
  }>;
}

// API Request/Response types
export interface CreateAdaptiveTestRequest {
  title: string;
  description: string;
  subjects: string[];
  track: LearningTrack;
  targetQuestions: number;
  linkedJourneyId?: string;
  algorithmType: AdaptiveTest['algorithmType'];
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
  estimatedBenefit: {
    abilityImprovement: number;
    weaknessAddressing: string[];
    journeyAlignment: number;
  };
  optimalTiming: {
    recommendedDate: Date;
    dependsOn: string[]; // Prerequisites
  };
}
```

#### Hour 2 (10:00-11:00 AM): Adaptive Algorithm Implementation

**File**: `lib/adaptive-testing-algorithms.ts`

```typescript
/**
 * @fileoverview Adaptive Testing Algorithms
 * Implements Computer Adaptive Testing (CAT) algorithms with mission system integration
 */

import {
  AdaptiveQuestion,
  TestResponse,
  AbilityEstimate,
  AdaptiveMetrics,
  MissionDifficulty,
} from '@/types/adaptive-testing';

export class AdaptiveAlgorithm {
  private static readonly DIFFICULTY_SCORES = {
    beginner: 0.2,
    easy: 0.4,
    medium: 0.6,
    hard: 0.8,
    expert: 1.0,
  };

  /**
   * Item Response Theory (IRT) implementation
   * Calculates probability of correct response given ability and question parameters
   */
  static calculateResponseProbability(
    abilityLevel: number,
    difficulty: number,
    discrimination: number = 1.0,
    guessing: number = 0.25
  ): number {
    const logit = discrimination * (abilityLevel - difficulty);
    const probability = guessing + (1 - guessing) / (1 + Math.exp(-logit));
    return Math.max(0.01, Math.min(0.99, probability)); // Prevent extreme values
  }

  /**
   * Maximum Likelihood Estimation for ability
   */
  static estimateAbility(responses: TestResponse[], questions: AdaptiveQuestion[]): number {
    if (responses.length === 0) return 0;

    // Newton-Raphson method for MLE
    let ability = 0;
    const maxIterations = 50;
    const tolerance = 0.001;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let logLikelihoodDerivative = 0;
      let informationSum = 0;

      for (const response of responses) {
        const question = questions.find(q => q.id === response.questionId);
        if (!question) continue;

        const difficulty = this.DIFFICULTY_SCORES[question.difficulty];
        const discrimination = question.discriminationIndex;
        const guessing = question.guessingParameter;

        const probability = this.calculateResponseProbability(ability, difficulty, discrimination, guessing);

        // First derivative (score function)
        const scoreTerm =
          (discrimination * (1 - guessing) * Math.exp(-discrimination * (ability - difficulty))) /
          Math.pow(1 + Math.exp(-discrimination * (ability - difficulty)), 2);

        if (response.isCorrect) {
          logLikelihoodDerivative += scoreTerm / probability;
        } else {
          logLikelihoodDerivative -= scoreTerm / (1 - probability);
        }

        // Information (negative second derivative)
        const information = Math.pow(scoreTerm, 2) / (probability * (1 - probability));
        informationSum += information;
      }

      // Newton-Raphson update
      const abilityUpdate = logLikelihoodDerivative / informationSum;
      ability += abilityUpdate;

      // Check convergence
      if (Math.abs(abilityUpdate) < tolerance) {
        break;
      }
    }

    return ability;
  }

  /**
   * Calculate standard error of ability estimate
   */
  static calculateStandardError(responses: TestResponse[], questions: AdaptiveQuestion[], ability: number): number {
    let informationSum = 0;

    for (const response of responses) {
      const question = questions.find(q => q.id === response.questionId);
      if (!question) continue;

      const difficulty = this.DIFFICULTY_SCORES[question.difficulty];
      const discrimination = question.discriminationIndex;
      const guessing = question.guessingParameter;

      const probability = this.calculateResponseProbability(ability, difficulty, discrimination, guessing);

      const scoreTerm =
        (discrimination * (1 - guessing) * Math.exp(-discrimination * (ability - difficulty))) /
        Math.pow(1 + Math.exp(-discrimination * (ability - difficulty)), 2);

      const information = Math.pow(scoreTerm, 2) / (probability * (1 - probability));
      informationSum += information;
    }

    return informationSum > 0 ? 1 / Math.sqrt(informationSum) : 1.0;
  }

  /**
   * Select next optimal question using maximum information criterion
   */
  static selectNextQuestion(
    availableQuestions: AdaptiveQuestion[],
    currentAbility: number,
    previousResponses: TestResponse[],
    constraints?: {
      subjectDistribution?: Record<string, number>;
      difficultyConstraints?: MissionDifficulty[];
      avoidRecentTopics?: string[];
    }
  ): AdaptiveQuestion | null {
    if (availableQuestions.length === 0) return null;

    // Filter questions based on constraints
    let candidateQuestions = availableQuestions.filter(question => {
      // Avoid recently answered topics if specified
      if (constraints?.avoidRecentTopics?.includes(question.topic)) {
        const recentResponses = previousResponses.slice(-3);
        const recentTopics = recentResponses.map(r => {
          const q = availableQuestions.find(aq => aq.id === r.questionId);
          return q?.topic;
        });
        if (recentTopics.includes(question.topic)) return false;
      }

      // Difficulty constraints
      if (constraints?.difficultyConstraints && !constraints.difficultyConstraints.includes(question.difficulty)) {
        return false;
      }

      return true;
    });

    // Calculate information value for each candidate question
    const questionScores = candidateQuestions.map(question => {
      const difficulty = this.DIFFICULTY_SCORES[question.difficulty];
      const discrimination = question.discriminationIndex;
      const guessing = question.guessingParameter;

      const probability = this.calculateResponseProbability(currentAbility, difficulty, discrimination, guessing);

      // Information = discrimination^2 * P(1-P) / (guessing + (1-guessing) * P)^2
      const information = Math.pow(discrimination, 2) * probability * (1 - probability);

      // Apply subject distribution weighting if specified
      let subjectWeight = 1.0;
      if (constraints?.subjectDistribution) {
        const desiredProportion = constraints.subjectDistribution[question.subject] || 0;
        const currentProportion = this.calculateCurrentSubjectProportion(
          question.subject,
          previousResponses,
          availableQuestions
        );

        // Favor questions from underrepresented subjects
        subjectWeight = desiredProportion > currentProportion ? 1.5 : 0.8;
      }

      return {
        question,
        score: information * subjectWeight,
        information,
        subjectWeight,
      };
    });

    // Select question with highest information value
    questionScores.sort((a, b) => b.score - a.score);

    return questionScores.length > 0 ? questionScores[0].question : null;
  }

  /**
   * Determine if test should continue based on convergence criteria
   */
  static shouldContinueTesting(
    responses: TestResponse[],
    questions: AdaptiveQuestion[],
    currentAbility: number,
    maxQuestions: number,
    targetStandardError: number = 0.3
  ): boolean {
    // Always continue if below minimum questions
    if (responses.length < 5) return true;

    // Stop if reached maximum questions
    if (responses.length >= maxQuestions) return false;

    // Check standard error convergence
    const standardError = this.calculateStandardError(responses, questions, currentAbility);
    if (standardError <= targetStandardError) return false;

    // Check ability estimate stability
    if (responses.length >= 10) {
      const recentEstimates = responses.slice(-5).map((_, index) => {
        const partialResponses = responses.slice(0, responses.length - 4 + index);
        return this.estimateAbility(partialResponses, questions);
      });

      const estimateVariability = this.calculateVariability(recentEstimates);
      if (estimateVariability < 0.1) return false; // Ability estimate is stable
    }

    return true;
  }

  /**
   * Generate adaptive metrics for test performance analysis
   */
  static generateAdaptiveMetrics(
    responses: TestResponse[],
    questions: AdaptiveQuestion[],
    finalAbility: number,
    algorithmType: 'CAT' | 'MAP' | 'HYBRID'
  ): AdaptiveMetrics {
    const convergenceHistory: AbilityEstimate[] = responses.map((_, index) => {
      const partialResponses = responses.slice(0, index + 1);
      const ability = this.estimateAbility(partialResponses, questions);
      const standardError = this.calculateStandardError(partialResponses, questions, ability);

      return {
        timestamp: responses[index].timestamp,
        estimate: ability,
        standardError,
        questionNumber: index + 1,
      };
    });

    // Calculate efficiency metrics
    const theoreticalOptimal = this.calculateTheoreticalOptimalQuestions(finalAbility);
    const algorithmEfficiency = Math.min(1.0, theoreticalOptimal / responses.length);

    // Question utilization - how well questions were selected
    const informationGained = responses.reduce((sum, response, index) => {
      return sum + (response.informationGained || 0);
    }, 0);
    const maxPossibleInformation = responses.length * 2.0; // Theoretical maximum
    const questionUtilization = informationGained / maxPossibleInformation;

    // Ability estimate stability
    const finalEstimates = convergenceHistory.slice(-3);
    const abilityEstimateStability =
      finalEstimates.length > 1 ? 1 - this.calculateVariability(finalEstimates.map(e => e.estimate)) : 0;

    return {
      algorithmEfficiency,
      questionUtilization,
      abilityEstimateStability,
      convergenceHistory,
      progressImpact: {
        missionDifficultyAdjustment: this.calculateMissionDifficultyImpact(finalAbility),
        journeyGoalUpdate: this.calculateJourneyGoalImpact(responses, questions),
        trackProgressContribution: this.calculateTrackProgressContribution(responses),
      },
    };
  }

  // Helper methods
  private static calculateCurrentSubjectProportion(
    subject: string,
    responses: TestResponse[],
    questions: AdaptiveQuestion[]
  ): number {
    if (responses.length === 0) return 0;

    const subjectResponses = responses.filter(response => {
      const question = questions.find(q => q.id === response.questionId);
      return question?.subject === subject;
    });

    return subjectResponses.length / responses.length;
  }

  private static calculateVariability(values: number[]): number {
    if (values.length < 2) return 0;

    const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
    const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;

    return Math.sqrt(variance);
  }

  private static calculateTheoreticalOptimalQuestions(finalAbility: number): number {
    // Simplified calculation based on IRT theory
    // In practice, this would use more sophisticated models
    return Math.max(5, Math.min(30, 15 - Math.abs(finalAbility) * 5));
  }

  private static calculateMissionDifficultyImpact(finalAbility: number): number {
    // Map ability estimate to mission difficulty adjustment
    // This integrates with existing mission system difficulty scaling
    return Math.max(-0.2, Math.min(0.2, finalAbility * 0.1));
  }

  private static calculateJourneyGoalImpact(responses: TestResponse[], questions: AdaptiveQuestion[]): number {
    // Calculate how test results should impact journey goal progress
    const accuracy = responses.filter(r => r.isCorrect).length / responses.length;
    return Math.max(0, Math.min(1, accuracy * 1.2 - 0.1));
  }

  private static calculateTrackProgressContribution(responses: TestResponse[]): number {
    // Calculate contribution to existing track progress system
    const responseQuality = responses.reduce((sum, response) => {
      const timeBonus = response.responseTime < 30000 ? 0.1 : 0; // Under 30 seconds
      return sum + (response.isCorrect ? 1 : 0) + timeBonus;
    }, 0);

    return responseQuality / (responses.length * 1.1); // Normalize with time bonus
  }
}

/**
 * Specialized algorithms for different testing scenarios
 */
export class SpecializedAdaptiveAlgorithms {
  /**
   * Mission-aligned adaptive testing
   * Optimizes question selection based on mission system integration
   */
  static missionAlignedSelection(
    availableQuestions: AdaptiveQuestion[],
    currentAbility: number,
    missionHistory: any[], // From existing mission service
    targetDifficulties: MissionDifficulty[]
  ): AdaptiveQuestion | null {
    // Favor questions that align with recent mission difficulties
    const missionAlignedQuestions = availableQuestions.filter(question =>
      targetDifficulties.includes(question.difficulty)
    );

    if (missionAlignedQuestions.length === 0) {
      return AdaptiveAlgorithm.selectNextQuestion(availableQuestions, currentAbility, []);
    }

    return AdaptiveAlgorithm.selectNextQuestion(missionAlignedQuestions, currentAbility, []);
  }

  /**
   * Journey-focused adaptive testing
   * Prioritizes questions aligned with journey goals
   */
  static journeyFocusedSelection(
    availableQuestions: AdaptiveQuestion[],
    currentAbility: number,
    journeyGoals: any[], // From journey planning system
    previousResponses: TestResponse[]
  ): AdaptiveQuestion | null {
    // Extract subjects from journey goals
    const journeySubjects = journeyGoals.flatMap(goal => goal.linkedSubjects || []);

    const journeyAlignedQuestions = availableQuestions.filter(question => journeySubjects.includes(question.subject));

    const subjectDistribution: Record<string, number> = {};
    journeySubjects.forEach(subject => {
      subjectDistribution[subject] = 1 / journeySubjects.length;
    });

    return AdaptiveAlgorithm.selectNextQuestion(
      journeyAlignedQuestions.length > 0 ? journeyAlignedQuestions : availableQuestions,
      currentAbility,
      previousResponses,
      { subjectDistribution }
    );
  }
}
```

#### Hour 3 (11:00-12:00 PM): Firebase Integration & Service Foundation

**File**: Update `lib/firebase-services.ts` with adaptive testing collections

```typescript
// Add to existing firebase-services.ts after journey collections

// Adaptive Testing collections
const ADAPTIVE_TESTING_COLLECTIONS = {
  ADAPTIVE_TESTS: 'adaptiveTests',
  TEST_SESSIONS: 'testSessions',
  QUESTION_BANKS: 'questionBanks',
  TEST_RESPONSES: 'testResponses',
  ADAPTIVE_ANALYTICS: 'adaptiveAnalytics',
} as const;

// Adaptive Testing service methods (add to existing firebaseService)
export const adaptiveTestingFirebaseService = {
  // Create a new adaptive test
  async createAdaptiveTest(userId: string, test: AdaptiveTest): Promise<Result<AdaptiveTest>> {
    try {
      const testRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.ADAPTIVE_TESTS, test.id);
      await setDoc(testRef, {
        ...test,
        createdAt: Timestamp.fromDate(test.createdAt),
        updatedAt: Timestamp.fromDate(test.updatedAt),
        completedAt: test.completedAt ? Timestamp.fromDate(test.completedAt) : null,
      });

      // Link to user's progress if applicable
      if (test.linkedJourneyId) {
        await this.linkTestToJourney(test.id, test.linkedJourneyId);
      }

      return createSuccess(test);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create adaptive test'));
    }
  },

  // Start a test session
  async startTestSession(sessionData: TestSession): Promise<Result<TestSession>> {
    try {
      const sessionRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.TEST_SESSIONS, sessionData.id);
      await setDoc(sessionRef, {
        ...sessionData,
        startedAt: Timestamp.fromDate(sessionData.startedAt),
        lastActivity: Timestamp.fromDate(sessionData.lastActivity),
      });

      return createSuccess(sessionData);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to start test session'));
    }
  },

  // Submit a test response
  async submitTestResponse(response: TestResponse): Promise<Result<void>> {
    try {
      const responseRef = doc(db, ADAPTIVE_TESTING_COLLECTIONS.TEST_RESPONSES, `${response.questionId}_${Date.now()}`);

      await setDoc(responseRef, {
        ...response,
        timestamp: Timestamp.fromDate(response.timestamp),
      });

      // Update test session with real-time data
      await this.updateTestSession(response);

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to submit test response'));
    }
  },

  // Get user's adaptive tests with real-time updates
  subscribeToUserTests(userId: string, callback: (tests: AdaptiveTest[]) => void): () => void {
    const q = query(
      collection(db, ADAPTIVE_TESTING_COLLECTIONS.ADAPTIVE_TESTS),
      where('userId', '==', userId),
      orderBy('createdAt', 'desc')
    );

    return onSnapshot(q, snapshot => {
      const tests = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
        createdAt: doc.data().createdAt?.toDate() || new Date(),
        updatedAt: doc.data().updatedAt?.toDate() || new Date(),
        completedAt: doc.data().completedAt?.toDate() || null,
      })) as AdaptiveTest[];

      callback(tests);
    });
  },

  // Get question bank for test generation
  async getQuestionBank(
    subjects: string[],
    difficulties: MissionDifficulty[],
    limit: number = 100
  ): Promise<Result<AdaptiveQuestion[]>> {
    try {
      const questionsRef = collection(db, 'questionBankItems');
      const q = query(
        questionsRef,
        where('subject', 'in', subjects.slice(0, 10)), // Firestore limit
        where('difficulty', 'in', difficulties),
        where('calibrationStatus', '==', 'calibrated'),
        orderBy('discriminationIndex', 'desc'),
        limit(limit)
      );

      const snapshot = await getDocs(q);
      const questions = snapshot.docs.map(doc => ({
        ...doc.data(),
        id: doc.id,
      })) as AdaptiveQuestion[];

      return createSuccess(questions);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get question bank'));
    }
  },

  // Update test session during test
  async updateTestSession(response: TestResponse): Promise<Result<void>> {
    try {
      // This would update the session with latest response data
      // Implementation details would include real-time ability estimation
      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update test session'));
    }
  },

  // Link test to journey planning system
  async linkTestToJourney(testId: string, journeyId: string): Promise<Result<void>> {
    try {
      const linkRef = doc(db, 'testJourneyLinks', `${testId}_${journeyId}`);
      await setDoc(linkRef, {
        testId,
        journeyId,
        linkedAt: Timestamp.now(),
        status: 'active',
      });

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to link test to journey'));
    }
  },

  // Analytics and reporting
  async getTestAnalytics(userId: string, dateRange?: { start: Date; end: Date }): Promise<Result<any>> {
    try {
      // Implementation for comprehensive test analytics
      // Would aggregate data from multiple collections
      return createSuccess({});
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get test analytics'));
    }
  },
};
```

### Day 1 - Afternoon (3 hours): Core Testing Service

#### Hour 4 (1:00-2:00 PM): Adaptive Testing Service Foundation

**File**: `lib/adaptive-testing-service.ts`

```typescript
/**
 * @fileoverview Adaptive Testing Service
 * Integrates with existing Mission System, Progress Service, and Journey Planning
 */

import {
  AdaptiveTest,
  AdaptiveQuestion,
  TestSession,
  TestResponse,
  CreateAdaptiveTestRequest,
  StartTestSessionRequest,
  SubmitResponseRequest,
  TestPerformance,
  AdaptiveMetrics,
} from '@/types/adaptive-testing';
import { Result, createSuccess, createError } from '@/lib/types-utils';
import { adaptiveTestingFirebaseService } from '@/lib/firebase-services';
import { AdaptiveAlgorithm, SpecializedAdaptiveAlgorithms } from '@/lib/adaptive-testing-algorithms';
import { MissionService } from '@/lib/mission-service';
import { ProgressService } from '@/lib/progress-service';
import { journeyService } from '@/lib/journey-service';
import { EXAMS_DATA, getSubjectsByExamId } from '@/lib/exams-data';

export class AdaptiveTestingService {
  private static instance: AdaptiveTestingService;
  private activeSessions: Map<string, TestSession> = new Map();

  static getInstance(): AdaptiveTestingService {
    if (!AdaptiveTestingService.instance) {
      AdaptiveTestingService.instance = new AdaptiveTestingService();
    }
    return AdaptiveTestingService.instance;
  }

  /**
   * Create adaptive test from journey alignment
   */
  async createTestFromJourney(
    userId: string,
    journeyId: string,
    testConfig: Partial<CreateAdaptiveTestRequest>
  ): Promise<Result<AdaptiveTest>> {
    try {
      // Get journey details to align test
      const journeyResult = await this.getJourneyDetails(journeyId);
      if (!journeyResult.success) {
        return createError(new Error('Journey not found'));
      }

      const journey = journeyResult.data;

      // Generate test aligned with journey goals
      const test: AdaptiveTest = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title: testConfig.title || `${journey.title} - Adaptive Assessment`,
        description: testConfig.description || `Adaptive test for ${journey.title} journey`,
        linkedJourneyId: journeyId,
        linkedSubjects: journey.customGoals.flatMap(goal => goal.linkedSubjects),
        track: journey.track,
        totalQuestions: testConfig.targetQuestions || 20,
        estimatedDuration: (testConfig.targetQuestions || 20) * 2, // 2 minutes per question
        difficultyRange: {
          min: 'easy',
          max: 'hard',
        },
        algorithmType: testConfig.algorithmType || 'CAT',
        convergenceThreshold: 0.3,
        initialDifficulty: 'medium',
        status: 'draft',
        currentQuestion: 0,
        questions: [],
        responses: [],
        performance: this.initializePerformance(),
        adaptiveMetrics: this.initializeMetrics(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdFrom: 'journey',
      };

      // Generate question bank for this test
      const questionsResult = await this.generateQuestionBank(test);
      if (!questionsResult.success) {
        return questionsResult;
      }

      test.questions = questionsResult.data;

      // Save to Firebase
      return await adaptiveTestingFirebaseService.createAdaptiveTest(userId, test);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create test from journey'));
    }
  }

  /**
   * Start an adaptive test session
   */
  async startTestSession(userId: string, request: StartTestSessionRequest): Promise<Result<TestSession>> {
    try {
      // Get test details
      const testResult = await this.getTestById(request.testId);
      if (!testResult.success) {
        return createError(new Error('Test not found'));
      }

      const test = testResult.data;

      // Validate user permissions
      if (test.userId !== userId) {
        return createError(new Error('Unauthorized access to test'));
      }

      // Create session
      const session: TestSession = {
        id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        testId: request.testId,
        userId,
        startedAt: new Date(),
        lastActivity: new Date(),
        currentQuestionIndex: 0,
        timeRemaining: (request.estimatedDuration || test.estimatedDuration) * 60 * 1000,
        isPaused: false,
        pauseReasons: [],
        currentAbilityEstimate: 0,
        currentStandardError: 1,
        sessionMetrics: {
          questionsAnswered: 0,
          averageResponseTime: 0,
          peakPerformanceTime: new Date(),
          fatigueIndicators: [],
        },
      };

      // Select first question
      const firstQuestion = this.selectFirstQuestion(test);
      if (firstQuestion) {
        session.nextQuestionPreview = firstQuestion;
      }

      // Store session
      this.activeSessions.set(session.id, session);

      // Save to Firebase
      const result = await adaptiveTestingFirebaseService.startTestSession(session);

      return result;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to start test session'));
    }
  }

  /**
   * Submit response and get next question
   */
  async submitResponse(
    userId: string,
    request: SubmitResponseRequest
  ): Promise<Result<{ nextQuestion?: AdaptiveQuestion; testCompleted: boolean; performance?: TestPerformance }>> {
    try {
      const session = this.activeSessions.get(request.sessionId);
      if (!session || session.userId !== userId) {
        return createError(new Error('Invalid session'));
      }

      const testResult = await this.getTestById(session.testId);
      if (!testResult.success) {
        return createError(new Error('Test not found'));
      }

      const test = testResult.data;
      const question = test.questions.find(q => q.id === request.questionId);
      if (!question) {
        return createError(new Error('Question not found'));
      }

      // Evaluate response
      const isCorrect = this.evaluateResponse(question, request.answer);

      // Create response record
      const response: TestResponse = {
        questionId: request.questionId,
        userAnswer: request.answer,
        isCorrect,
        responseTime: request.responseTime,
        confidence: request.confidence,
        timestamp: new Date(),
        estimatedAbility: session.currentAbilityEstimate,
        questionDifficulty: question.difficulty,
        informationGained: 0, // Will be calculated
      };

      // Update test responses
      test.responses.push(response);

      // Update ability estimate using adaptive algorithm
      const newAbility = AdaptiveAlgorithm.estimateAbility(test.responses, test.questions);
      const standardError = AdaptiveAlgorithm.calculateStandardError(test.responses, test.questions, newAbility);

      // Calculate information gained from this response
      response.informationGained = Math.abs(newAbility - session.currentAbilityEstimate);

      // Update session
      session.currentAbilityEstimate = newAbility;
      session.currentStandardError = standardError;
      session.lastActivity = new Date();
      session.sessionMetrics.questionsAnswered++;
      session.currentQuestionIndex++;

      // Update fatigue indicators
      this.updateFatigueIndicators(session, request.responseTime);

      // Determine if test should continue
      const shouldContinue = AdaptiveAlgorithm.shouldContinueTesting(
        test.responses,
        test.questions,
        newAbility,
        test.totalQuestions,
        test.convergenceThreshold
      );

      let nextQuestion: AdaptiveQuestion | undefined;
      let testCompleted = false;

      if (shouldContinue) {
        // Select next question using adaptive algorithm
        const availableQuestions = test.questions.filter(q => !test.responses.some(r => r.questionId === q.id));

        if (test.linkedJourneyId) {
          // Use journey-focused selection if linked to journey
          const journeyResult = await this.getJourneyDetails(test.linkedJourneyId);
          if (journeyResult.success) {
            nextQuestion =
              SpecializedAdaptiveAlgorithms.journeyFocusedSelection(
                availableQuestions,
                newAbility,
                journeyResult.data.customGoals,
                test.responses
              ) || undefined;
          }
        }

        // Fallback to standard adaptive selection
        if (!nextQuestion) {
          nextQuestion =
            AdaptiveAlgorithm.selectNextQuestion(availableQuestions, newAbility, test.responses) || undefined;
        }

        session.nextQuestionPreview = nextQuestion;
      } else {
        // Test completed
        testCompleted = true;
        test.status = 'completed';
        test.completedAt = new Date();

        // Calculate final performance
        test.performance = this.calculateTestPerformance(test.responses, test.questions);
        test.adaptiveMetrics = AdaptiveAlgorithm.generateAdaptiveMetrics(
          test.responses,
          test.questions,
          newAbility,
          test.algorithmType
        );

        // Update integrated systems
        await this.updateIntegratedSystems(test, userId);
      }

      // Save response to Firebase
      await adaptiveTestingFirebaseService.submitTestResponse(response);

      return createSuccess({
        nextQuestion,
        testCompleted,
        performance: testCompleted ? test.performance : undefined,
      });
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to submit response'));
    }
  }

  /**
   * Generate recommendations for next tests
   */
  async generateTestRecommendations(userId: string): Promise<Result<TestRecommendation[]>> {
    try {
      // Get user's journey and progress data
      const progressResult = await this.getUserProgressData(userId);
      if (!progressResult.success) {
        return createError(new Error('Could not load user progress'));
      }

      const { journeys, missions, progress } = progressResult.data;

      const recommendations: TestRecommendation[] = [];

      // Analyze each active journey for test opportunities
      for (const journey of journeys.filter(j => j.status === 'active')) {
        // Find goals that need assessment
        const assessableGoals = journey.customGoals.filter(
          goal => goal.currentValue < goal.targetValue * 0.8 // Less than 80% complete
        );

        if (assessableGoals.length > 0) {
          const testId = `adaptive_${journey.id}_${Date.now()}`;

          recommendations.push({
            testId,
            title: `${journey.title} - Progress Assessment`,
            description: `Evaluate your progress in ${assessableGoals.length} key areas`,
            confidence: 0.85,
            reasons: [
              `${assessableGoals.length} goals need progress validation`,
              'Adaptive testing will optimize your study plan',
              'Current progress suggests readiness for assessment',
            ],
            estimatedBenefit: {
              abilityImprovement: 0.15,
              weaknessAddressing: assessableGoals.map(g => g.title),
              journeyAlignment: 0.9,
            },
            optimalTiming: {
              recommendedDate: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // In 2 days
              dependsOn: ['Complete current missions', 'Review weak topics'],
            },
          });
        }
      }

      // Add general skill assessment recommendations
      if (recommendations.length === 0) {
        recommendations.push({
          testId: `general_assessment_${Date.now()}`,
          title: 'General Skill Assessment',
          description: 'Comprehensive evaluation of your current abilities',
          confidence: 0.7,
          reasons: ['Regular assessment helps track progress', 'Identify new learning opportunities'],
          estimatedBenefit: {
            abilityImprovement: 0.1,
            weaknessAddressing: ['Overall skill evaluation'],
            journeyAlignment: 0.5,
          },
          optimalTiming: {
            recommendedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // In 1 week
            dependsOn: [],
          },
        });
      }

      return createSuccess(recommendations);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to generate test recommendations'));
    }
  }

  // Private helper methods

  private async getTestById(testId: string): Promise<Result<AdaptiveTest>> {
    // Implementation to fetch test from Firebase
    // This would use the Firebase service
    return createError(new Error('Not implemented'));
  }

  private async getJourneyDetails(journeyId: string): Promise<Result<any>> {
    // Integration with journey service
    try {
      // This would call the journey service to get journey details
      return createError(new Error('Journey service integration not implemented'));
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get journey details'));
    }
  }

  private async generateQuestionBank(test: AdaptiveTest): Promise<Result<AdaptiveQuestion[]>> {
    try {
      const difficulties: MissionDifficulty[] = ['easy', 'medium', 'hard'];
      const result = await adaptiveTestingFirebaseService.getQuestionBank(
        test.linkedSubjects,
        difficulties,
        test.totalQuestions * 3 // Get 3x questions for selection flexibility
      );

      return result;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to generate question bank'));
    }
  }

  private selectFirstQuestion(test: AdaptiveTest): AdaptiveQuestion | null {
    // Start with medium difficulty question from first subject
    const mediumQuestions = test.questions.filter(q => q.difficulty === 'medium');
    return mediumQuestions.length > 0 ? mediumQuestions[0] : test.questions[0] || null;
  }

  private evaluateResponse(question: AdaptiveQuestion, userAnswer: string | string[]): boolean {
    const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
    const correctAnswers = question.correctAnswers;

    // Check if all correct answers are provided and no incorrect ones
    return (
      correctAnswers.length === userAnswers.length && correctAnswers.every(correct => userAnswers.includes(correct))
    );
  }

  private updateFatigueIndicators(session: TestSession, responseTime: number): void {
    // Track response time pattern to detect fatigue
    session.sessionMetrics.fatigueIndicators.push(responseTime);

    // Keep only last 5 response times
    if (session.sessionMetrics.fatigueIndicators.length > 5) {
      session.sessionMetrics.fatigueIndicators.shift();
    }

    // Update average response time
    const times = session.sessionMetrics.fatigueIndicators;
    session.sessionMetrics.averageResponseTime = times.reduce((a, b) => a + b, 0) / times.length;
  }

  private calculateTestPerformance(responses: TestResponse[], questions: AdaptiveQuestion[]): TestPerformance {
    const correctAnswers = responses.filter(r => r.isCorrect).length;
    const totalTime = responses.reduce((sum, r) => sum + r.responseTime, 0);
    const averageResponseTime = totalTime / responses.length;

    // Calculate subject-wise performance
    const subjectPerformance: Record<string, any> = {};
    const subjects = [...new Set(questions.map(q => q.subject))];

    subjects.forEach(subject => {
      const subjectQuestions = questions.filter(q => q.subject === subject);
      const subjectResponses = responses.filter(r => subjectQuestions.some(q => q.id === r.questionId));

      if (subjectResponses.length > 0) {
        const subjectCorrect = subjectResponses.filter(r => r.isCorrect).length;
        subjectPerformance[subject] = {
          subjectId: subject,
          questionsAnswered: subjectResponses.length,
          correctAnswers: subjectCorrect,
          accuracy: (subjectCorrect / subjectResponses.length) * 100,
          averageTime: subjectResponses.reduce((sum, r) => sum + r.responseTime, 0) / subjectResponses.length,
          abilityEstimate: 0, // Would be calculated using IRT
        };
      }
    });

    // Calculate difficulty-wise performance
    const difficultyPerformance: Record<string, any> = {};
    const difficulties = ['easy', 'medium', 'hard', 'expert'];

    difficulties.forEach(difficulty => {
      const difficultyQuestions = questions.filter(q => q.difficulty === difficulty);
      const difficultyResponses = responses.filter(r => difficultyQuestions.some(q => q.id === r.questionId));

      if (difficultyResponses.length > 0) {
        const difficultyCorrect = difficultyResponses.filter(r => r.isCorrect).length;
        difficultyPerformance[difficulty] = {
          difficulty: difficulty as MissionDifficulty,
          questionsAnswered: difficultyResponses.length,
          correctAnswers: difficultyCorrect,
          accuracy: (difficultyCorrect / difficultyResponses.length) * 100,
          averageTime: difficultyResponses.reduce((sum, r) => sum + r.responseTime, 0) / difficultyResponses.length,
        };
      }
    });

    // Calculate Bloom's taxonomy performance
    const bloomsPerformance: Record<string, number> = {};
    const bloomsLevels = ['remember', 'understand', 'apply', 'analyze', 'evaluate', 'create'];

    bloomsLevels.forEach(level => {
      const levelQuestions = questions.filter(q => q.bloomsLevel === level);
      const levelResponses = responses.filter(r => levelQuestions.some(q => q.id === r.questionId));

      if (levelResponses.length > 0) {
        const levelCorrect = levelResponses.filter(r => r.isCorrect).length;
        bloomsPerformance[level] = (levelCorrect / levelResponses.length) * 100;
      }
    });

    const finalAbilityEstimate = AdaptiveAlgorithm.estimateAbility(responses, questions);
    const standardError = AdaptiveAlgorithm.calculateStandardError(responses, questions, finalAbilityEstimate);

    return {
      totalQuestions: responses.length,
      correctAnswers,
      accuracy: (correctAnswers / responses.length) * 100,
      averageResponseTime,
      totalTime,
      subjectPerformance,
      difficultyPerformance,
      bloomsPerformance,
      finalAbilityEstimate,
      abilityConfidenceInterval: [
        finalAbilityEstimate - 1.96 * standardError,
        finalAbilityEstimate + 1.96 * standardError,
      ],
      standardError,
    };
  }

  private async updateIntegratedSystems(test: AdaptiveTest, userId: string): Promise<void> {
    try {
      // Update mission system based on test results
      const missionService = MissionService.getInstance();
      if (test.performance && test.adaptiveMetrics) {
        // Adjust mission difficulty based on ability estimate
        const difficultyAdjustment = test.adaptiveMetrics.progressImpact.missionDifficultyAdjustment;
        // This would call mission service to adjust difficulty
      }

      // Update journey progress if linked
      if (test.linkedJourneyId) {
        await this.updateJourneyProgress(test);
      }

      // Update progress service
      const progressService = ProgressService.getInstance();
      await this.updateTrackProgress(test, userId);
    } catch (error) {
      console.error('Failed to update integrated systems:', error);
    }
  }

  private async updateJourneyProgress(test: AdaptiveTest): Promise<void> {
    // Integration with journey service to update progress based on test results
    if (test.linkedJourneyId && test.performance && test.adaptiveMetrics) {
      const goalUpdate = test.adaptiveMetrics.progressImpact.journeyGoalUpdate;
      // This would call journey service to update goal progress
    }
  }

  private async updateTrackProgress(test: AdaptiveTest, userId: string): Promise<void> {
    // Integration with progress service to update track progress
    if (test.performance && test.adaptiveMetrics) {
      const trackContribution = test.adaptiveMetrics.progressImpact.trackProgressContribution;
      // This would call progress service to update UnifiedProgress
    }
  }

  private async getUserProgressData(userId: string): Promise<Result<any>> {
    // This would gather data from journey service, mission service, and progress service
    return createError(new Error('User progress data integration not implemented'));
  }

  private initializePerformance(): TestPerformance {
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageResponseTime: 0,
      totalTime: 0,
      subjectPerformance: {},
      difficultyPerformance: {},
      bloomsPerformance: {},
      finalAbilityEstimate: 0,
      abilityConfidenceInterval: [0, 0],
      standardError: 1,
    };
  }

  private initializeMetrics(): AdaptiveMetrics {
    return {
      algorithmEfficiency: 0,
      questionUtilization: 0,
      abilityEstimateStability: 0,
      convergenceHistory: [],
      progressImpact: {
        missionDifficultyAdjustment: 0,
        journeyGoalUpdate: 0,
        trackProgressContribution: 0,
      },
    };
  }
}

// Export singleton instance
export const adaptiveTestingService = AdaptiveTestingService.getInstance();
```

#### Hour 5 (2:00-3:00 PM): Progress Service Integration

**File**: Update `lib/progress-service.ts` with adaptive testing integration

```typescript
// Add to existing ProgressService class after line 200

/**
 * Update progress based on adaptive test results
 */
async updateProgressFromAdaptiveTest(
  userId: string,
  testResults: TestPerformance,
  testMetadata: { subjects: string[]; track: LearningTrack }
): Promise<Result<void>> {
  try {
    const progressResult = await this.getUserProgress(userId);
    if (!progressResult.success) {
      return progressResult;
    }

    const progress = progressResult.data;

    // Update track-specific progress
    const trackKey = testMetadata.track;
    if (progress.trackProgress[trackKey]) {
      // Calculate weighted average with existing progress
      const existingScore = progress.trackProgress[trackKey].averageScore;
      const testScore = testResults.accuracy;
      const testWeight = 0.3; // 30% weight for test results

      const newAverageScore = (existingScore * (1 - testWeight)) + (testScore * testWeight);

      progress.trackProgress[trackKey] = {
        ...progress.trackProgress[trackKey],
        averageScore: newAverageScore,
        testsCompleted: (progress.trackProgress[trackKey].testsCompleted || 0) + 1,
        lastTestDate: new Date(),
        adaptiveTestMetrics: {
          abilityEstimate: testResults.finalAbilityEstimate,
          confidenceInterval: testResults.abilityConfidenceInterval,
          standardError: testResults.standardError,
        }
      };
    }

    // Update subject-specific progress
    for (const [subjectId, subjectPerf] of Object.entries(testResults.subjectPerformance)) {
      if (!progress.subjectProgress[subjectId]) {
        progress.subjectProgress[subjectId] = {
          subjectId,
          completion: 0,
          timeSpent: 0,
          averageScore: 0,
          lastStudied: new Date(),
          topicsCompleted: [],
          weakAreas: [],
          strongAreas: [],
        };
      }

      const currentSubjectProgress = progress.subjectProgress[subjectId];
      const testSubjectScore = subjectPerf.accuracy;

      // Update subject scores with exponential moving average
      const alpha = 0.4; // Learning rate
      currentSubjectProgress.averageScore =
        (1 - alpha) * currentSubjectProgress.averageScore + alpha * testSubjectScore;

      // Update weak/strong areas based on test performance
      if (testSubjectScore < 70) {
        if (!currentSubjectProgress.weakAreas.includes(subjectId)) {
          currentSubjectProgress.weakAreas.push(subjectId);
        }
      } else if (testSubjectScore > 85) {
        if (!currentSubjectProgress.strongAreas.includes(subjectId)) {
          currentSubjectProgress.strongAreas.push(subjectId);
        }
        // Remove from weak areas if performance improved
        currentSubjectProgress.weakAreas = currentSubjectProgress.weakAreas.filter(id => id !== subjectId);
      }

      currentSubjectProgress.lastStudied = new Date();
    }

    // Update overall metrics
    progress.overallMetrics = {
      ...progress.overallMetrics,
      totalTestsCompleted: (progress.overallMetrics.totalTestsCompleted || 0) + 1,
      lastActivity: new Date(),
      adaptiveTestingLevel: this.calculateAdaptiveTestingLevel(testResults),
    };

    // Save updated progress
    const updateResult = await this.updateUserProgress(userId, progress);
    return updateResult;

  } catch (error) {
    return createError(error instanceof Error ? error : new Error('Failed to update progress from adaptive test'));
  }
}

/**
 * Get adaptive testing recommendations based on progress
 */
async getAdaptiveTestRecommendations(userId: string): Promise<Result<TestRecommendation[]>> {
  try {
    const progressResult = await this.getUserProgress(userId);
    if (!progressResult.success) {
      return progressResult;
    }

    const progress = progressResult.data;
    const recommendations: TestRecommendation[] = [];

    // Analyze weak areas for testing opportunities
    for (const [subjectId, subjectProgress] of Object.entries(progress.subjectProgress)) {
      if (subjectProgress.averageScore < 75 && subjectProgress.weakAreas.length > 0) {
        recommendations.push({
          testId: `weakness_test_${subjectId}`,
          title: `${subjectId} Weakness Assessment`,
          description: `Targeted adaptive test for improving weak areas in ${subjectId}`,
          confidence: 0.8,
          reasons: [
            `Current score: ${subjectProgress.averageScore.toFixed(1)}% (below 75%)`,
            `${subjectProgress.weakAreas.length} weak areas identified`,
            'Adaptive testing can provide targeted improvement'
          ],
          estimatedBenefit: {
            abilityImprovement: 0.2,
            weaknessAddressing: subjectProgress.weakAreas,
            journeyAlignment: 0.7,
          },
          optimalTiming: {
            recommendedDate: new Date(Date.now() + 3 * 24 * 60 * 60 * 1000), // 3 days
            dependsOn: [`Review ${subjectId} materials`, 'Complete pending missions'],
          },
        });
      }
    }

    // Add general assessment if no specific weaknesses
    if (recommendations.length === 0) {
      const overallScore = Object.values(progress.subjectProgress)
        .reduce((sum, subj) => sum + subj.averageScore, 0) /
        Object.values(progress.subjectProgress).length;

      recommendations.push({
        testId: `comprehensive_assessment_${Date.now()}`,
        title: 'Comprehensive Knowledge Assessment',
        description: 'Evaluate your overall progress and identify growth opportunities',
        confidence: 0.6,
        reasons: [
          `Overall performance: ${overallScore.toFixed(1)}%`,
          'Regular assessment maintains learning momentum',
          'Adaptive testing provides personalized insights'
        ],
        estimatedBenefit: {
          abilityImprovement: 0.1,
          weaknessAddressing: ['General knowledge gaps'],
          journeyAlignment: 0.5,
        },
        optimalTiming: {
          recommendedDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week
          dependsOn: [],
        },
      });
    }

    return createSuccess(recommendations);

  } catch (error) {
    return createError(error instanceof Error ? error : new Error('Failed to get adaptive test recommendations'));
  }
}

private calculateAdaptiveTestingLevel(testResults: TestPerformance): string {
  const ability = testResults.finalAbilityEstimate;
  const accuracy = testResults.accuracy;

  if (ability > 0.8 && accuracy > 90) return 'Expert';
  if (ability > 0.5 && accuracy > 80) return 'Advanced';
  if (ability > 0.2 && accuracy > 70) return 'Intermediate';
  if (ability > -0.2 && accuracy > 60) return 'Developing';
  return 'Beginner';
}
```

#### Hour 6 (3:00-4:00 PM): Mission Service Integration

**File**: Update `lib/mission-service.ts` with adaptive testing integration

```typescript
// Add to existing MissionService class after line 800

/**
 * Adjust mission difficulty based on adaptive test results
 */
async adjustMissionDifficultyFromTest(
  userId: string,
  testResults: TestPerformance,
  testMetadata: { subjects: string[]; track: LearningTrack }
): Promise<Result<void>> {
  try {
    // Get current user persona and mission history
    const persona = await this.getUserPersona(userId);
    if (!persona.success) {
      return persona;
    }

    const abilityEstimate = testResults.finalAbilityEstimate;
    const confidence = 1 - testResults.standardError; // Higher confidence = lower standard error

    // Calculate difficulty adjustment factor
    let difficultyAdjustment = 0;

    if (abilityEstimate > 0.5 && confidence > 0.8) {
      // High ability, high confidence -> increase difficulty
      difficultyAdjustment = 0.2;
    } else if (abilityEstimate < -0.5 && confidence > 0.8) {
      // Low ability, high confidence -> decrease difficulty
      difficultyAdjustment = -0.2;
    } else if (testResults.accuracy > 85) {
      // High accuracy -> slight increase
      difficultyAdjustment = 0.1;
    } else if (testResults.accuracy < 60) {
      // Low accuracy -> slight decrease
      difficultyAdjustment = -0.1;
    }

    // Update persona preferences based on test performance
    const updatedPersona = {
      ...persona.data,
      preferences: {
        ...persona.data.preferences,
        difficultyPreference: this.calculateNewDifficultyPreference(
          persona.data.preferences.difficultyPreference,
          difficultyAdjustment
        ),
        adaptiveTestingInfluence: confidence, // How much test results should influence missions
      },
      lastAdaptiveTestDate: new Date(),
      testPerformanceHistory: [
        ...(persona.data.testPerformanceHistory || []).slice(-4), // Keep last 5
        {
          date: new Date(),
          abilityEstimate,
          accuracy: testResults.accuracy,
          subjects: testMetadata.subjects,
          difficultyAdjustment,
        }
      ]
    };

    // Generate adaptive missions for weak subjects
    const weakSubjects = Object.entries(testResults.subjectPerformance)
      .filter(([_, perf]) => perf.accuracy < 70)
      .map(([subjectId, _]) => subjectId);

    for (const subjectId of weakSubjects) {
      await this.generateTargetedMissionsForWeakness(
        userId,
        subjectId,
        testResults.subjectPerformance[subjectId],
        testMetadata.track
      );
    }

    // Update user persona
    await this.updateUserPersona(userId, updatedPersona);

    return createSuccess(undefined);

  } catch (error) {
    return createError(error instanceof Error ? error : new Error('Failed to adjust mission difficulty from test'));
  }
}

/**
 * Generate targeted missions for areas identified as weak in adaptive testing
 */
async generateTargetedMissionsForWeakness(
  userId: string,
  subjectId: string,
  subjectPerformance: SubjectPerformance,
  track: LearningTrack
): Promise<Result<Mission[]>> {
  try {
    const missions: Mission[] = [];

    // Generate easier missions to build confidence
    const confidenceMission = await this.generateSpecificMission(
      userId,
      subjectId,
      'easy', // Start with easier difficulty
      {
        focus: 'confidence_building',
        targetAccuracy: 85, // Higher success rate for confidence
        estimatedTime: 15, // Shorter sessions
        adaptiveContext: {
          triggeredByTest: true,
          weakness: subjectPerformance.accuracy,
          recommendedApproach: 'gradual_progression'
        }
      },
      track
    );

    if (confidenceMission.success) {
      missions.push(confidenceMission.data);
    }

    // Generate practice missions at current level
    for (let i = 0; i < 3; i++) {
      const practiceMission = await this.generateSpecificMission(
        userId,
        subjectId,
        'medium',
        {
          focus: 'weakness_targeting',
          targetAccuracy: 75,
          estimatedTime: 20,
          adaptiveContext: {
            triggeredByTest: true,
            weakness: subjectPerformance.accuracy,
            sessionNumber: i + 1
          }
        },
        track
      );

      if (practiceMission.success) {
        missions.push(practiceMission.data);
      }
    }

    // Schedule missions over next week
    missions.forEach((mission, index) => {
      mission.scheduledFor = new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000);
      mission.priority = 'high'; // High priority for weakness addressing
    });

    return createSuccess(missions);

  } catch (error) {
    return createError(error instanceof Error ? error : new Error('Failed to generate targeted missions for weakness'));
  }
}

/**
 * Create test-preparation missions before scheduled adaptive tests
 */
async generateTestPreparationMissions(
  userId: string,
  upcomingTest: { subjects: string[]; scheduledDate: Date; track: LearningTrack }
): Promise<Result<Mission[]>> {
  try {
    const missions: Mission[] = [];
    const daysUntilTest = Math.ceil((upcomingTest.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

    // Generate review missions for each subject
    for (const subjectId of upcomingTest.subjects) {
      // Quick review mission (day before test)
      const reviewMission = await this.generateSpecificMission(
        userId,
        subjectId,
        'medium',
        {
          focus: 'test_preparation',
          targetAccuracy: 80,
          estimatedTime: 25,
          adaptiveContext: {
            testPreparation: true,
            testDate: upcomingTest.scheduledDate,
            reviewType: 'comprehensive'
          }
        },
        upcomingTest.track
      );

      if (reviewMission.success) {
        reviewMission.data.scheduledFor = new Date(upcomingTest.scheduledDate.getTime() - 24 * 60 * 60 * 1000);
        reviewMission.data.priority = 'high';
        reviewMission.data.tags = [...(reviewMission.data.tags || []), 'test-prep', 'review'];
        missions.push(reviewMission.data);
      }

      // Practice missions (2-3 days before)
      if (daysUntilTest > 2) {
        const practiceMission = await this.generateSpecificMission(
          userId,
          subjectId,
          'hard',
          {
            focus: 'test_simulation',
            targetAccuracy: 75,
            estimatedTime: 30,
            adaptiveContext: {
              testPreparation: true,
              testDate: upcomingTest.scheduledDate,
              reviewType: 'challenging_practice'
            }
          },
          upcomingTest.track
        );

        if (practiceMission.success) {
          practiceMission.data.scheduledFor = new Date(upcomingTest.scheduledDate.getTime() - 3 * 24 * 60 * 60 * 1000);
          practiceMission.data.priority = 'medium';
          practiceMission.data.tags = [...(practiceMission.data.tags || []), 'test-prep', 'practice'];
          missions.push(practiceMission.data);
        }
      }
    }

    return createSuccess(missions);

  } catch (error) {
    return createError(error instanceof Error ? error : new Error('Failed to generate test preparation missions'));
  }
}

private calculateNewDifficultyPreference(
  currentPreference: MissionDifficulty,
  adjustment: number
): MissionDifficulty {
  const difficultyLevels: MissionDifficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];
  const currentIndex = difficultyLevels.indexOf(currentPreference);

  let newIndex = currentIndex;

  if (adjustment > 0.15) {
    newIndex = Math.min(difficultyLevels.length - 1, currentIndex + 1);
  } else if (adjustment < -0.15) {
    newIndex = Math.max(0, currentIndex - 1);
  }

  return difficultyLevels[newIndex];
}

private async generateSpecificMission(
  userId: string,
  subjectId: string,
  difficulty: MissionDifficulty,
  context: any,
  track: LearningTrack
): Promise<Result<Mission>> {
  // This would use existing mission generation logic with adaptive context
  // Implementation details would integrate with current generateDailyMission method
  return createError(new Error('Specific mission generation integration pending'));
}
```

### Day 2 - Complete UI Foundation (6 hours)

#### Hour 7-9 (9:00 AM-12:00 PM): Test Delivery Interface

**File**: `app/test/page.tsx`

```typescript
'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import {
  Play,
  Pause,
  Clock,
  Brain,
  Target,
  TrendingUp,
  BarChart3,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { AdaptiveTest, TestSession } from '@/types/adaptive-testing';
import { adaptiveTestingService } from '@/lib/adaptive-testing-service';
import { adaptiveTestingFirebaseService } from '@/lib/firebase-services';

export default function AdaptiveTestPage() {
  const { user } = useAuth();
  const router = useRouter();
  const searchParams = useSearchParams();
  const testId = searchParams.get('testId');
  const sessionId = searchParams.get('sessionId');

  const [tests, setTests] = useState<AdaptiveTest[]>([]);
  const [activeSession, setActiveSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<'overview' | 'active_test' | 'results'>('overview');

  useEffect(() => {
    if (!user) return;

    // Subscribe to user's adaptive tests
    const unsubscribe = adaptiveTestingFirebaseService.subscribeToUserTests(
      user.uid,
      (userTests) => {
        setTests(userTests);
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    // Handle direct test/session access via URL
    if (testId && sessionId) {
      setView('active_test');
      // Load session data
    } else if (testId) {
      // Show test details or start test
    }
  }, [testId, sessionId]);

  const handleStartTest = async (test: AdaptiveTest) => {
    if (!user) return;

    setLoading(true);
    try {
      const sessionResult = await adaptiveTestingService.startTestSession(user.uid, {
        testId: test.id,
        estimatedDuration: test.estimatedDuration,
        allowPause: true,
      });

      if (sessionResult.success) {
        setActiveSession(sessionResult.data);
        setView('active_test');

        // Update URL without page reload
        const newUrl = `/test?testId=${test.id}&sessionId=${sessionResult.data.id}`;
        window.history.pushState(null, '', newUrl);
      }
    } catch (error) {
      console.error('Failed to start test:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner': return 'bg-green-100 text-green-800';
      case 'easy': return 'bg-blue-100 text-blue-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'hard': return 'bg-orange-100 text-orange-800';
      case 'expert': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  if (view === 'active_test' && activeSession) {
    return <ActiveTestInterface session={activeSession} onComplete={() => setView('results')} />;
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />

        <div className="max-w-7xl mx-auto p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 mb-2">
                Adaptive Testing
              </h1>
              <p className="text-gray-600">
                AI-powered assessments that adapt to your knowledge level in real-time
              </p>
            </div>

            <Button
              onClick={() => router.push('/test/create')}
              className="bg-blue-600 hover:bg-blue-700"
            >
              <Brain className="h-4 w-4 mr-2" />
              Create Test
            </Button>
          </div>

          {/* Test Overview Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Available Tests</CardTitle>
                <Target className="h-4 w-4 text-blue-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tests.filter(t => t.status === 'active' || t.status === 'draft').length}
                </div>
                <p className="text-xs text-gray-600">
                  {tests.filter(t => t.status === 'completed').length} completed
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Average Performance</CardTitle>
                <TrendingUp className="h-4 w-4 text-green-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(
                    tests
                      .filter(t => t.status === 'completed')
                      .reduce((acc, t) => acc + t.performance.accuracy, 0) /
                    Math.max(tests.filter(t => t.status === 'completed').length, 1)
                  )}%
                </div>
                <p className="text-xs text-gray-600">Across completed tests</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Questions</CardTitle>
                <BarChart3 className="h-4 w-4 text-purple-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {tests.reduce((acc, t) => acc + t.performance.totalQuestions, 0)}
                </div>
                <p className="text-xs text-gray-600">Questions answered</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Study Time Saved</CardTitle>
                <Clock className="h-4 w-4 text-orange-600" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {Math.round(tests.length * 2.5)}h
                </div>
                <p className="text-xs text-gray-600">Via adaptive algorithms</p>
              </CardContent>
            </Card>
          </div>

          {/* Test List */}
          <div className="space-y-6">
            <h2 className="text-xl font-semibold text-gray-900">Your Tests</h2>

            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {[...Array(4)].map((_, i) => (
                  <Card key={i} className="animate-pulse">
                    <CardHeader>
                      <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                      <div className="h-3 bg-gray-200 rounded w-1/2"></div>
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-3">
                        <div className="h-3 bg-gray-200 rounded"></div>
                        <div className="h-3 bg-gray-200 rounded w-2/3"></div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : tests.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {tests.map((test) => (
                  <Card key={test.id} className="hover:shadow-lg transition-shadow">
                    <CardHeader>
                      <div className="flex items-start justify-between">
                        <div>
                          <CardTitle className="text-lg">{test.title}</CardTitle>
                          <p className="text-sm text-gray-600 mt-1">
                            {test.description}
                          </p>
                        </div>

                        <Badge
                          variant="outline"
                          className={`${
                            test.status === 'completed' ? 'border-green-500 text-green-700' :
                            test.status === 'active' ? 'border-blue-500 text-blue-700' :
                            'border-gray-500 text-gray-700'
                          }`}
                        >
                          {test.status}
                        </Badge>
                      </div>
                    </CardHeader>

                    <CardContent>
                      <div className="space-y-4">
                        {/* Test Configuration */}
                        <div className="grid grid-cols-2 gap-4 text-sm">
                          <div>
                            <span className="text-gray-500">Questions:</span>
                            <span className="ml-2 font-medium">{test.totalQuestions}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Duration:</span>
                            <span className="ml-2 font-medium">{formatDuration(test.estimatedDuration)}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Algorithm:</span>
                            <span className="ml-2 font-medium">{test.algorithmType}</span>
                          </div>
                          <div>
                            <span className="text-gray-500">Track:</span>
                            <span className="ml-2 font-medium">{test.track}</span>
                          </div>
                        </div>

                        {/* Difficulty Range */}
                        <div>
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-gray-600">Difficulty Range</span>
                          </div>
                          <div className="flex gap-2">
                            <Badge className={getDifficultyColor(test.difficultyRange.min)}>
                              {test.difficultyRange.min}
                            </Badge>
                            <span className="text-gray-400">to</span>
                            <Badge className={getDifficultyColor(test.difficultyRange.max)}>
                              {test.difficultyRange.max}
                            </Badge>
                          </div>
                        </div>

                        {/* Subjects */}
                        <div>
                          <span className="text-sm text-gray-600 block mb-2">Subjects</span>
                          <div className="flex flex-wrap gap-1">
                            {test.linkedSubjects.slice(0, 3).map((subject) => (
                              <Badge key={subject} variant="secondary" className="text-xs">
                                {subject}
                              </Badge>
                            ))}
                            {test.linkedSubjects.length > 3 && (
                              <Badge variant="secondary" className="text-xs">
                                +{test.linkedSubjects.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>

                        {/* Performance (if completed) */}
                        {test.status === 'completed' && test.performance && (
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Performance</span>
                              <span className="text-lg font-bold text-green-600">
                                {test.performance.accuracy.toFixed(1)}%
                              </span>
                            </div>
                            <Progress value={test.performance.accuracy} className="h-2" />
                            <div className="flex justify-between text-xs text-gray-500 mt-1">
                              <span>{test.performance.correctAnswers}/{test.performance.totalQuestions} correct</span>
                              <span>{formatDuration(Math.round(test.performance.totalTime / 60000))}</span>
                            </div>
                          </div>
                        )}

                        {/* Progress (if in progress) */}
                        {test.status === 'active' && test.currentQuestion > 0 && (
                          <div className="pt-3 border-t">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm font-medium text-gray-700">Progress</span>
                              <span className="text-sm text-blue-600">
                                {test.currentQuestion}/{test.totalQuestions}
                              </span>
                            </div>
                            <Progress value={(test.currentQuestion / test.totalQuestions) * 100} className="h-2" />
                          </div>
                        )}

                        {/* Action Button */}
                        <div className="pt-2">
                          {test.status === 'draft' || test.status === 'active' ? (
                            <Button
                              onClick={() => handleStartTest(test)}
                              disabled={loading}
                              className="w-full bg-blue-600 hover:bg-blue-700"
                            >
                              <Play className="h-4 w-4 mr-2" />
                              {test.currentQuestion > 0 ? 'Continue Test' : 'Start Test'}
                            </Button>
                          ) : test.status === 'completed' ? (
                            <div className="flex gap-2">
                              <Button
                                variant="outline"
                                onClick={() => router.push(`/test/${test.id}/results`)}
                                className="flex-1"
                              >
                                <BarChart3 className="h-4 w-4 mr-2" />
                                View Results
                              </Button>
                              <Button
                                onClick={() => handleStartTest(test)}
                                className="flex-1 bg-green-600 hover:bg-green-700"
                              >
                                Retake Test
                              </Button>
                            </div>
                          ) : (
                            <Button variant="outline" className="w-full" disabled>
                              Test Unavailable
                            </Button>
                          )}
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="text-center py-12">
                <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">
                  No Adaptive Tests Yet
                </h3>
                <p className="text-gray-600 mb-6">
                  Create your first adaptive test to get AI-powered, personalized assessments.
                </p>
                <Button onClick={() => router.push('/test/create')}>
                  <Brain className="h-4 w-4 mr-2" />
                  Create Your First Test
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}

// Active Test Interface Component
function ActiveTestInterface({
  session,
  onComplete
}: {
  session: TestSession;
  onComplete: () => void;
}) {
  const { user } = useAuth();
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null);
  const [selectedAnswer, setSelectedAnswer] = useState<string>('');
  const [timeRemaining, setTimeRemaining] = useState(session.timeRemaining);
  const [loading, setLoading] = useState(false);
  const [confidence, setConfidence] = useState<number>(3);

  useEffect(() => {
    // Load current question
    if (session.nextQuestionPreview) {
      setCurrentQuestion(session.nextQuestionPreview);
    }

    // Start timer
    const timer = setInterval(() => {
      setTimeRemaining(prev => {
        if (prev <= 1000) {
          clearInterval(timer);
          handleTimeUp();
          return 0;
        }
        return prev - 1000;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleTimeUp = () => {
    // Auto-submit current answer or skip
    if (currentQuestion) {
      handleSubmitAnswer(true); // Mark as time-based submission
    }
  };

  const handleSubmitAnswer = async (isTimeUp: boolean = false) => {
    if (!user || !currentQuestion || !selectedAnswer) return;

    setLoading(true);
    try {
      const responseTime = session.sessionMetrics.averageResponseTime || 30000; // Default 30s

      const result = await adaptiveTestingService.submitResponse(user.uid, {
        sessionId: session.id,
        questionId: currentQuestion.id,
        answer: selectedAnswer,
        responseTime,
        confidence: isTimeUp ? undefined : confidence,
      });

      if (result.success) {
        if (result.data.testCompleted) {
          onComplete();
        } else if (result.data.nextQuestion) {
          setCurrentQuestion(result.data.nextQuestion);
          setSelectedAnswer('');
          setConfidence(3);
        }
      }
    } catch (error) {
      console.error('Failed to submit answer:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatTime = (milliseconds: number) => {
    const minutes = Math.floor(milliseconds / 60000);
    const seconds = Math.floor((milliseconds % 60000) / 1000);
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  if (!currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading question...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="max-w-4xl mx-auto p-6">
        {/* Test Header */}
        <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2">
                <Brain className="h-5 w-5 text-blue-600" />
                <span className="font-medium">Adaptive Test</span>
              </div>

              <div className="flex items-center gap-2 text-sm text-gray-600">
                <Target className="h-4 w-4" />
                Question {session.currentQuestionIndex + 1}
              </div>
            </div>

            <div className="flex items-center gap-4">
              <div className="flex items-center gap-2 text-sm">
                <Clock className="h-4 w-4 text-orange-600" />
                <span className={`font-medium ${timeRemaining < 60000 ? 'text-red-600' : 'text-gray-900'}`}>
                  {formatTime(timeRemaining)}
                </span>
              </div>

              <Button variant="outline" size="sm">
                <Pause className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>

        {/* Question Card */}
        <Card className="mb-6">
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="text-lg">Question {session.currentQuestionIndex + 1}</CardTitle>
              <div className="flex gap-2">
                <Badge className={getDifficultyColor(currentQuestion.difficulty)}>
                  {currentQuestion.difficulty}
                </Badge>
                <Badge variant="outline">
                  {currentQuestion.subject}
                </Badge>
              </div>
            </div>
          </CardHeader>

          <CardContent>
            <div className="space-y-6">
              {/* Question Content */}
              <div className="text-lg leading-relaxed">
                {currentQuestion.content}
              </div>

              {/* Answer Options */}
              {currentQuestion.type === 'multiple_choice' && currentQuestion.options && (
                <div className="space-y-3">
                  {currentQuestion.options.map((option) => (
                    <label
                      key={option.id}
                      className={`flex items-center p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedAnswer === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option.id}
                        checked={selectedAnswer === option.id}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        className="sr-only"
                      />
                      <div className={`w-5 h-5 rounded-full border-2 mr-3 flex items-center justify-center ${
                        selectedAnswer === option.id
                          ? 'border-blue-500 bg-blue-500'
                          : 'border-gray-300'
                      }`}>
                        {selectedAnswer === option.id && (
                          <div className="w-2 h-2 rounded-full bg-white"></div>
                        )}
                      </div>
                      <span className="text-gray-900">{option.content}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* True/False */}
              {currentQuestion.type === 'true_false' && (
                <div className="flex gap-4">
                  {[
                    { id: 'true', label: 'True' },
                    { id: 'false', label: 'False' }
                  ].map((option) => (
                    <label
                      key={option.id}
                      className={`flex-1 flex items-center justify-center p-4 border rounded-lg cursor-pointer transition-all ${
                        selectedAnswer === option.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <input
                        type="radio"
                        name="answer"
                        value={option.id}
                        checked={selectedAnswer === option.id}
                        onChange={(e) => setSelectedAnswer(e.target.value)}
                        className="sr-only"
                      />
                      <span className="font-medium">{option.label}</span>
                    </label>
                  ))}
                </div>
              )}

              {/* Confidence Level */}
              <div className="pt-4 border-t">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  How confident are you in your answer?
                </label>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((level) => (
                    <button
                      key={level}
                      onClick={() => setConfidence(level)}
                      className={`flex-1 py-2 px-3 text-sm rounded-md border transition-all ${
                        confidence === level
                          ? 'border-blue-500 bg-blue-50 text-blue-700'
                          : 'border-gray-200 text-gray-600 hover:border-gray-300'
                      }`}
                    >
                      {level === 1 ? 'Very Low' :
                       level === 2 ? 'Low' :
                       level === 3 ? 'Medium' :
                       level === 4 ? 'High' : 'Very High'}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Submit Button */}
        <div className="flex justify-center">
          <Button
            onClick={() => handleSubmitAnswer()}
            disabled={!selectedAnswer || loading}
            size="lg"
            className="bg-blue-600 hover:bg-blue-700 px-8"
          >
            {loading ? 'Submitting...' : 'Submit Answer'}
          </Button>
        </div>
      </div>
    </div>
  );
}

function getDifficultyColor(difficulty: string) {
  switch (difficulty) {
    case 'beginner': return 'bg-green-100 text-green-800';
    case 'easy': return 'bg-blue-100 text-blue-800';
    case 'medium': return 'bg-yellow-100 text-yellow-800';
    case 'hard': return 'bg-orange-100 text-orange-800';
    case 'expert': return 'bg-red-100 text-red-800';
    default: return 'bg-gray-100 text-gray-800';
  }
}
```

---

## Days 3-7: Complete System Integration & Advanced Features

### 🎯 System Integration Philosophy

Our Adaptive Testing System follows a **seamless integration approach** where every component works harmoniously with existing systems:

#### 🔄 Data Flow Integration Strategy

**Mission System ↔ Adaptive Testing**

- When users complete adaptive tests, results automatically adjust their mission difficulty preferences
- Poor performance in specific subjects triggers targeted mission generation for those areas
- Mission completion data feeds back to improve test question selection and difficulty estimation

**Journey Planning ↔ Adaptive Testing**

- Journey goals automatically generate suggested adaptive tests to measure progress
- Test results update journey goal completion percentages in real-time
- Journey deadlines influence test scheduling recommendations and urgency levels

**Progress Service ↔ Adaptive Testing**

- Test results become part of the unified progress tracking system
- Subject-wise performance from tests enhances the existing progress analytics
- Weekly progress reports include adaptive testing insights alongside mission data

#### 🎨 UI/UX Design Principles

**1. Contextual Testing Experience**

```
Current Dashboard → Test Recommendation → Seamless Test Taking → Instant Results → Updated Progress
```

**2. Progressive Disclosure Interface**

- **Level 1**: Simple "Quick Test" buttons on dashboard for immediate engagement
- **Level 2**: Detailed test configuration for power users who want customization
- **Level 3**: Advanced analytics and historical performance for deep insights

**3. Confidence-Building Design**

- Tests start with easier questions to build user confidence
- Progress indicators show not just completion, but ability improvement
- Positive reinforcement messages based on performance trends, not just raw scores

---

### Day 3-4: Smart Test Generation & Recommendation Engine

#### 🧠 Intelligent Test Creation Process

**Contextual Awareness**
The system analyzes user's current journey goals, recent mission performance, and subject weaknesses to suggest perfectly timed tests. For example:

- If user struggles with "Organic Chemistry" in recent missions → System suggests targeted chemistry adaptive test
- If journey goal is "Complete 80% Physics syllabus by December" → System calculates optimal test intervals to measure progress

**Adaptive Question Bank Management**
Instead of static question pools, our system maintains dynamic question difficulty based on:

- Real user response patterns from your actual users
- Integration with your existing exam syllabus from `exams-data.ts`
- Mission performance correlation (questions that align with successful mission topics)

**Smart Scheduling Integration**

- Tests appear as dashboard recommendations when users are most likely to perform well (based on their mission completion patterns)
- Integration with journey timelines to ensure tests align with study phases
- Respects user's existing mission schedules to avoid cognitive overload

#### 🎯 UI/UX for Test Recommendations

**Dashboard Integration Design**

```
┌─ Existing Mission Cards ─┐  ┌─ NEW: Smart Test Card ─┐
│ Today's Missions        │  │ 📊 Recommended Test    │
│ ✅ Physics Problem Set  │  │ Physics Concepts       │
│ 🔄 Chemistry Lab       │  │ ⏱️ 15 mins • 🎯 Medium │
│                         │  │ "Perfect time to test   │
└─────────────────────────┘  │ your recent progress!"  │
                             └─────────────────────────┘
```

**One-Click Test Experience**

- Click recommendation → Instant test start (no configuration needed)
- System pre-selects optimal settings based on user context
- Emergency pause/resume for real-world interruptions

---

### Day 5: Real-Time Adaptive Testing Interface

#### 🔄 During-Test Experience Design

**Confidence-Aware Question Progression**
The interface adapts not just based on correct/wrong answers, but on user confidence and response patterns:

**Visual Feedback System**

- Questions get progressively more challenging, but UI celebrates each step
- Real-time ability meter shows improvement, not just completion percentage
- Subtle animations reinforce positive learning momentum

**Smart Pacing Algorithm**

- Detects when users are rushing (very fast responses) → Shows encouraging slow-down message
- Identifies fatigue patterns (slower responses over time) → Suggests breaks or shorter tests
- Balances challenge with achievability to maintain engagement

#### 🎨 Adaptive UI Components

**Dynamic Question Interface**

```
┌─────────────────────────────────────────┐
│ Question 8 of ~15 | Your Level: Rising ⬆️ │
├─────────────────────────────────────────┤
│ [Question content adapts to user level] │
│                                         │
│ 🟢 Confidence: ●●●○○ (Optional)        │
│                                         │
│ ⏱️ Take your time - Quality over Speed   │
└─────────────────────────────────────────┘
```

**Intelligent Difficulty Indicators**

- Never show raw "difficulty" to users (demotivating)
- Show progress as "mastery level" or "learning growth"
- Use encouraging language: "Building expertise..." instead of "Hard question"

---

### Day 6: Advanced Analytics & Insights Integration

#### 📊 Analytics Integration Strategy

**Unified Progress Dashboard Enhancement**
Your existing dashboard gets enhanced with adaptive testing insights seamlessly integrated:

**Subject Mastery Visualization**

```
Physics Progress (Enhanced with Adaptive Testing):
├─ Mission Completion: 78% ✅
├─ Test Performance: 82% 📈 (NEW)
├─ Predicted Exam Score: 87% 🎯 (NEW)
└─ Recommended Focus: Mechanics 🔧
```

**Cross-System Learning Insights**

- Mission performance vs. Test performance correlation analysis
- Journey goal progress acceleration through testing
- Weak area identification that spans both missions and tests

#### 🎯 Personalized Learning Recommendations

**Intelligent Next Steps**
The system provides contextual recommendations that bridge all three systems:

1. **Mission Recommendations**: "Based on your test results, try Advanced Physics missions"
2. **Journey Adjustments**: "Your chemistry progress is ahead of schedule - consider advancing your journey goal"
3. **Study Strategy**: "Your morning test performance is 23% better - schedule important tests before noon"

**Predictive Analytics UI**

- Journey completion probability updates in real-time based on test performance
- Mission difficulty auto-adjusts based on demonstrated ability in tests
- Early warning system for journey goals at risk

---

### Day 7: Perfect Integration & User Experience

#### 🔄 Seamless System Orchestration

**Invisible Integration Approach**
Users shouldn't feel like they're using three separate systems. The integration should feel like one intelligent learning companion:

**Natural Learning Flow**

```
Morning: Dashboard shows personalized daily plan
├─ 2 Physics Missions (Medium difficulty based on last test)
├─ 1 Quick Chemistry Test (15 mins - measures recent progress)
└─ Journey Check-in (automated based on test+mission results)

Evening: Progress celebration
├─ Mission achievements update journey goals automatically
├─ Test results enhance tomorrow's mission recommendations
└─ All progress flows into unified weekly analytics
```

**Contextual Help & Guidance**

- First-time test takers get guided onboarding that explains how tests enhance their journey
- Advanced users get power-user features like custom test creation
- System learns user preferences for test frequency and timing

#### 🎨 Premium User Experience Features

**Smart Notifications**

- "Great job on today's missions! Ready for a quick test to lock in your learning?"
- "Your Physics journey goal needs attention - here's a targeted 10-minute test"
- "You've been crushing Chemistry - time for a challenge test?"

**Gamification Integration**

- Test completion contributes to existing mission streaks
- Journey milestones unlock advanced test features
- Cross-system achievements: "Mission Master + Test Champion = Learning Legend"

**Accessibility & Inclusivity**

- Tests adapt to different learning styles (visual, analytical, practical)
- Multiple input methods for different question types
- Time accommodations based on individual patterns

---

## 🎯 Implementation Priorities & Best Practices

### Phase 1: Core Integration (Week 1)

1. **Data Model Integration** - Extend existing Firebase collections cleanly
2. **Service Layer Enhancement** - Add adaptive testing methods to existing services
3. **Basic UI Components** - Simple test cards on dashboard

### Phase 2: Smart Features (Week 2)

1. **Recommendation Engine** - Context-aware test suggestions
2. **Adaptive Interface** - Real-time question difficulty adjustment
3. **Progress Integration** - Seamless cross-system analytics

### Phase 3: Advanced UX (Week 3)

1. **Predictive Analytics** - Journey success probability
2. **Intelligent Automation** - Auto-scheduling and smart notifications
3. **Performance Optimization** - Sub-second response times

### 🔧 Technical Integration Guidelines

**Database Strategy**

- Extend existing collections rather than creating parallel systems
- Maintain referential integrity between journeys, missions, and tests
- Use Firebase real-time listeners for instant UI updates

**API Design Philosophy**

- All new endpoints follow existing patterns in your codebase
- Reuse existing authentication and error handling
- Maintain consistency with current mission/progress API structure

**UI Component Strategy**

- Build on existing design system (shadcn/ui components)
- Follow current color scheme and typography
- Responsive design matching current mobile-first approach

This approach ensures that Adaptive Testing feels like a natural evolution of your existing system rather than a bolted-on feature, providing maximum value while maintaining the elegant simplicity your users expect.
