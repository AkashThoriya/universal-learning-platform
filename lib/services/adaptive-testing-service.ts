/**
 * @fileoverview Adaptive Testing Service
 * Integrates with existing Mission System, Progress Service, and Journey Planning
 */

import { AdaptiveAlgorithm, SpecializedAdaptiveAlgorithms } from '@/lib/algorithms/adaptive-testing-algorithms';
import { adaptiveTestingRecommendationEngine } from '@/lib/algorithms/adaptive-testing-recommendation-engine';
import { adaptiveTestingFirebaseService } from '@/lib/firebase/firebase-services';
import { Result, createSuccess, createError } from '@/lib/utils/types-utils';
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
  TestRecommendation,
  TestAnalyticsData,
} from '@/types/adaptive-testing';
import { LearningTrack, MissionDifficulty } from '@/types/mission-system';

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
        title: testConfig.title ?? `${journey.title} - Adaptive Assessment`,
        description: testConfig.description ?? `Adaptive test for ${journey.title} journey`,
        ...(journeyId && { linkedJourneyId: journeyId }),
        linkedSubjects: journey.customGoals?.flatMap((goal: any) => goal.linkedSubjects) ?? [],
        track: journey.track ?? 'exam',
        totalQuestions: testConfig.targetQuestions ?? 20,
        estimatedDuration: (testConfig.targetQuestions ?? 20) * 2, // 2 minutes per question
        difficultyRange: {
          min: 'beginner',
          max: 'expert',
        },
        algorithmType: testConfig.algorithmType ?? 'CAT',
        convergenceThreshold: 0.3,
        initialDifficulty: 'intermediate',
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
      test.status = 'active';

      // Save to Firebase
      return await adaptiveTestingFirebaseService.createAdaptiveTest(userId, test);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create test from journey'));
    }
  }

  /**
   * Create adaptive test from manual configuration
   */
  async createAdaptiveTest(userId: string, request: CreateAdaptiveTestRequest): Promise<Result<AdaptiveTest>> {
    console.log('[AdaptiveTestingService] createAdaptiveTest called:', { userId, request });
    try {
      const test: AdaptiveTest = {
        id: `test_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        title: request.title,
        description: request.description,
        linkedJourneyId: request.linkedJourneyId ?? `journey_${Date.now()}`,
        linkedSubjects: request.subjects,
        ...(request.topics && { linkedTopics: request.topics }),
        track: request.track ?? ('exam' as const),
        totalQuestions: request.questionCount ?? request.targetQuestions ?? 5,
        estimatedDuration: (request.questionCount ?? request.targetQuestions ?? 5) * 2, // 2 minutes per question
        difficultyRange: request.difficultyRange ?? {
          min: 'beginner',
          max: 'expert',
        },
        algorithmType: request.algorithmType ?? 'HYBRID',
        convergenceThreshold: 0.3,
        initialDifficulty: 'intermediate',
        status: 'draft',
        currentQuestion: 0,
        questions: [],
        responses: [],
        performance: this.initializePerformance(),
        adaptiveMetrics: this.initializeMetrics(),
        createdAt: new Date(),
        updatedAt: new Date(),
        createdFrom: 'manual',
      };

      // Generate question bank for this test
      console.log('[AdaptiveTestingService] Generating question bank...');
      const questionsResult = await this.generateQuestionBank(test);
      if (!questionsResult.success) {
        console.error('[AdaptiveTestingService] Question bank generation failed:', questionsResult.error);
        return questionsResult;
      }

      console.log('[AdaptiveTestingService] Question bank generated with', questionsResult.data.length, 'questions');
      test.questions = questionsResult.data;
      test.status = 'active';

      // Save to Firebase
      console.log('[AdaptiveTestingService] Saving to Firebase...');
      const result = await adaptiveTestingFirebaseService.createAdaptiveTest(userId, test);
      if (result.success) {
        console.log('[AdaptiveTestingService] Test saved successfully');
      } else {
        console.error('[AdaptiveTestingService] Failed to save test:', result.error);
      }
      return result;
    } catch (error) {
      console.error('[AdaptiveTestingService] Unexpected error creating test:', error);
      return createError(error instanceof Error ? error : new Error('Failed to create adaptive test'));
    }
  }

  /**
   * Get a specific test by ID
   */
  async getTest(testId: string): Promise<Result<AdaptiveTest | null>> {
    return adaptiveTestingFirebaseService.getAdaptiveTest(testId);
  }

  /**
   * Start an adaptive test session
   */
  async startTestSession(userId: string, request: StartTestSessionRequest): Promise<Result<TestSession>> {
    try {
      // Get test details
      const testResult = await adaptiveTestingFirebaseService.getAdaptiveTest(request.testId);
      if (!testResult.success || !testResult.data) {
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
        currentQuestionIndex: test.currentQuestion,
        timeRemaining: (request.estimatedDuration ?? test.estimatedDuration) * 60 * 1000,
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
  ): Promise<
    Result<{
      nextQuestion?: AdaptiveQuestion;
      testCompleted: boolean;
      performance?: TestPerformance;
      isCorrect: boolean;
      correctAnswer: string | number;
      explanation?: string;
    }>
  > {
    try {
      const session = this.activeSessions.get(request.sessionId);
      if (session?.userId !== userId) {
        return createError(new Error('Invalid session'));
      }

      const testResult = await adaptiveTestingFirebaseService.getAdaptiveTest(session.testId);
      if (!testResult.success || !testResult.data) {
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
        userId,
        testId: test.id,
        questionId: request.questionId,
        userAnswer: request.answer,
        isCorrect,
        responseTime: request.responseTime,
        ...(request.confidence !== undefined && { confidence: request.confidence }),
        timestamp: new Date(),
        estimatedAbility: session.currentAbilityEstimate,
        questionDifficulty: this.mapNumericToMissionDifficulty(question.difficulty),
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

      let nextQuestion: AdaptiveQuestion | null = null;
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
                journeyResult.data.customGoals ?? [],
                test.responses
              ) ?? null;
          }
        }

        // Fallback to standard adaptive selection
        nextQuestion ??= AdaptiveAlgorithm.selectNextQuestion(availableQuestions, newAbility, test.responses) ?? null;

        if (nextQuestion) {
          session.nextQuestionPreview = nextQuestion;
        }
      } else {
        // Test completed
        testCompleted = true;
        test.status = 'completed';
        test.completedAt = new Date();
        test.currentQuestion = test.responses.length;

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

        // Complete the test in Firebase
        await adaptiveTestingFirebaseService.completeTest(test.id, test.performance, test.adaptiveMetrics);
      }

      // Save response to Firebase
      await adaptiveTestingFirebaseService.submitTestResponse(response);

      // Update test progress
      await adaptiveTestingFirebaseService.updateTest(test.id, {
        currentQuestion: test.currentQuestion,
        responses: test.responses,
        status: test.status,
        updatedAt: new Date(),
      });

      return createSuccess({
        ...(nextQuestion && { nextQuestion }),
        testCompleted,
        ...(testCompleted && test.performance && { performance: test.performance }),
        isCorrect,
        correctAnswer: question.correctAnswer,
        ...(question.explanation ? { explanation: question.explanation } : {}),
      });
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to submit response'));
    }
  }

  /**
   * Generate personalized test recommendations using AI engine
   */
  async generateTestRecommendations(userId: string, maxRecommendations = 5): Promise<Result<TestRecommendation[]>> {
    try {
      const result = await adaptiveTestingRecommendationEngine.generateRecommendations(userId, maxRecommendations);
      if (result.success) {
        return result;
      }
      return createError(new Error(result.error));
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to generate test recommendations'));
    }
  }

  /**
   * Generate quick test recommendations for immediate use
   */
  async generateQuickRecommendations(userId: string): Promise<Result<TestRecommendation[]>> {
    try {
      const result = await adaptiveTestingRecommendationEngine.generateQuickAssessmentRecommendations(userId, 3);
      if (result.success) {
        return result;
      }
      return createError(new Error(result.error));
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to generate quick recommendations'));
    }
  }

  /**
   * Generate recommendations focused on weak areas
   */
  async generateWeakAreaRecommendations(userId: string): Promise<Result<TestRecommendation[]>> {
    try {
      const result = await adaptiveTestingRecommendationEngine.generateWeakAreaRecommendations(userId, 3);
      if (result.success) {
        return result;
      }
      return createError(new Error(result.error));
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to generate weak area recommendations'));
    }
  }

  /**
   * Generate recommendations aligned with active journeys
   */
  async generateJourneyAlignedRecommendations(userId: string): Promise<Result<TestRecommendation[]>> {
    try {
      const result = await adaptiveTestingRecommendationEngine.generateJourneyAlignedRecommendations(userId, 3);
      if (result.success) {
        return result;
      }
      return createError(new Error(result.error));
    } catch (error) {
      return createError(
        error instanceof Error ? error : new Error('Failed to generate mission-aligned recommendations')
      );
    }
  }

  /**
   * Create a test from a recommendation
   */
  async createTestFromRecommendation(
    userId: string,
    recommendation: TestRecommendation
  ): Promise<Result<AdaptiveTest>> {
    try {
      const testConfig: CreateAdaptiveTestRequest = {
        title: recommendation.title,
        description: recommendation.description,
        subjects: recommendation.subjects,
        track: 'exam', // Default track
        targetQuestions: recommendation.questionCount ?? 20,
        algorithmType: recommendation.adaptiveConfig?.algorithmType ?? 'CAT',
        difficultyRange: recommendation.adaptiveConfig?.difficultyRange ?? { min: 'beginner', max: 'intermediate' },
      };

      const result = await this.createAdaptiveTest(userId, testConfig);
      return result;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create test from recommendation'));
    }
  }

  /**
   * Create a test from a template (for retakes)
   */
  async createTestFromTemplate(userId: string, originalTest: AdaptiveTest): Promise<Result<AdaptiveTest>> {
    try {
      const testConfig: CreateAdaptiveTestRequest = {
        title: `${originalTest.title} (Retake)`,
        description: originalTest.description,
        subjects: originalTest.linkedSubjects,
        track: originalTest.track,
        targetQuestions: originalTest.totalQuestions,
        algorithmType: originalTest.algorithmType,
        difficultyRange: originalTest.difficultyRange,
      };

      const result = await this.createAdaptiveTest(userId, testConfig);
      return result;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create test from template'));
    }
  }

  /**
   * Get user's tests
   */
  async getUserTests(userId?: string): Promise<AdaptiveTest[]> {
    try {
      if (!userId) {
        return [];
      }

      const result = await adaptiveTestingFirebaseService.getUserTests(userId);
      return result.success ? (result.data ?? []) : [];
    } catch (error) {
      console.error('Error getting user tests:', error);
      return [];
    }
  }

  /**
   * Get comprehensive test analytics
   */
  async getTestAnalytics(userId: string, dateRange?: { start: Date; end: Date }): Promise<Result<TestAnalyticsData>> {
    try {
      return await adaptiveTestingFirebaseService.getTestAnalytics(userId, dateRange);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get test analytics'));
    }
  }

  /**
   * Pause an active test session
   */
  async pauseTestSession(sessionId: string, reason: string): Promise<Result<void>> {
    try {
      const session = this.activeSessions.get(sessionId);
      if (!session) {
        return createError(new Error('Session not found'));
      }

      session.isPaused = true;
      session.pauseReasons.push(reason);
      session.lastActivity = new Date();

      // Update in Firebase
      const sessionResult = await adaptiveTestingFirebaseService.getTestSession(sessionId);
      if (sessionResult.success && sessionResult.data) {
        await adaptiveTestingFirebaseService.updateTest(sessionResult.data.testId, {
          status: 'paused',
          updatedAt: new Date(),
        });
      }

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to pause test session'));
    }
  }

  /**
   * Resume a paused test session
   */
  async resumeTestSession(sessionId: string): Promise<Result<TestSession>> {
    try {
      // First check memory
      let session = this.activeSessions.get(sessionId);

      if (!session) {
        // Try to fetch from Firebase
        const sessionResult = await adaptiveTestingFirebaseService.getTestSession(sessionId);
        if (sessionResult.success && sessionResult.data) {
          session = sessionResult.data;
          this.activeSessions.set(session.id, session);
        } else {
          return createError(new Error('Session not found'));
        }
      }

      session.isPaused = false;
      session.lastActivity = new Date();

      // Update in Firebase
      await adaptiveTestingFirebaseService.updateTest(session.testId, {
        status: 'active',
        updatedAt: new Date(),
      });

      return createSuccess(session);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to resume test session'));
    }
  }

  /**
   * Recover an active session for a specific test
   */
  async recoverActiveSession(userId: string, testId: string): Promise<Result<TestSession | null>> {
    try {
      const result = await adaptiveTestingFirebaseService.getActiveSession(userId, testId);
      if (result.success && result.data) {
        // Re-hydrate memory
        this.activeSessions.set(result.data.id, result.data);
        // Ensure status is active in memory? It is matched by query 'active'.
        return createSuccess(result.data);
      }
      return createSuccess(null);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to recover active session'));
    }
  }

  // Private helper methods

  private async getJourneyDetails(journeyId: string): Promise<Result<any>> {
    // Integration with journey service
    try {
      // This would call the journey service to get journey details
      // For now, return a mock implementation
      return createSuccess({
        id: journeyId,
        title: 'Sample Journey',
        track: 'exam' as LearningTrack,
        customGoals: [
          {
            linkedSubjects: ['Mathematics', 'Physics', 'Chemistry'],
            title: 'Science Mastery',
          },
        ],
      });
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get journey details'));
    }
  }

  private async generateQuestionBank(test: AdaptiveTest): Promise<Result<AdaptiveQuestion[]>> {
    try {
      const difficulties: MissionDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

      // First try to get questions from Firebase (System bank + User's private bank)
      const firebaseResult = await adaptiveTestingFirebaseService.getQuestionBank(
        test.userId,
        test.linkedSubjects,
        difficulties,
        test.totalQuestions * 3 // Get 3x questions for selection flexibility
      );

      if (firebaseResult.success && firebaseResult.data.length >= test.totalQuestions) {
        return firebaseResult;
      }

      // If insufficient questions in Firebase, generate using LLM
      const { llmService } = await import('@/lib/ai/llm-service');

      if (llmService.isAvailable()) {
        const questionsNeeded = test.totalQuestions * 2; // Generate 2x for selection flexibility
        const primaryDifficulty = this.determinePrimaryDifficulty(test);

        const llmResult = await llmService.generateAdaptiveQuestions(
          {
            subjects: test.linkedSubjects,
            topics: test.linkedTopics ?? [],
            difficulty: primaryDifficulty,
            questionCount: questionsNeeded,
            questionType: 'multiple_choice',
            examContext: test.examContext ?? '',
            learningObjectives: test.learningObjectives ?? [],
          },
          {
            provider: 'gemini',
            temperature: 0.7,
            includeExplanations: true,
            difficultyProgression: true,
            adaptive: true,
          }
        );

        if (llmResult.success && llmResult.data) {
          // Tag questions with user ID to ensure ownership/privacy
          const taggedQuestions = llmResult.data.map(q => ({
            ...q,
            createdBy: test.userId,
          }));

          // Save generated questions to Firebase for future use
          await this.saveGeneratedQuestions(taggedQuestions);

          // Combine with any existing Firebase questions
          const allQuestions = [...(firebaseResult.data ?? []), ...taggedQuestions];
          return createSuccess(allQuestions);
        }
        console.warn('LLM question generation failed:', llmResult.error);
      }

      // No fallback: Return Firebase questions if available, otherwise error
      console.error('Question generation failed: No LLM or Firebase questions available.');
      if (firebaseResult.success && firebaseResult.data && firebaseResult.data.length > 0) {
        return firebaseResult;
      }
      return createError(new Error('Unable to generate questions. Please try again later or contact support.'));
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to generate question bank'));
    }
  }

  private determinePrimaryDifficulty(test: AdaptiveTest): MissionDifficulty {
    // Determine the most appropriate difficulty level for LLM question generation
    // based on test configuration and target user ability
    const { initialDifficulty, difficultyRange } = test;

    // If initial difficulty is set, use it as primary
    if (initialDifficulty) {
      return initialDifficulty;
    }

    // Otherwise, choose the middle of the difficulty range
    const difficulties: MissionDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    const minIndex = difficulties.indexOf(difficultyRange.min);
    const maxIndex = difficulties.indexOf(difficultyRange.max);
    const midIndex = Math.floor((minIndex + maxIndex) / 2);

    return difficulties[midIndex] ?? 'intermediate';
  }

  private async saveGeneratedQuestions(questions: AdaptiveQuestion[]): Promise<void> {
    try {
      // Save generated questions to Firebase for future reuse
      // This helps build up a question bank over time
      const saveResult = await adaptiveTestingFirebaseService.saveQuestions(questions);
      if (!saveResult.success) {
        console.warn('Failed to save questions:', saveResult.error);
      }
    } catch (error) {
      // Don't fail the test if saving questions fails
      console.warn('Failed to save generated questions to Firebase:', error);
    }
  }

  private selectFirstQuestion(test: AdaptiveTest): AdaptiveQuestion | null {
    // Start with intermediate difficulty question from first subject
    const intermediateQuestions = test.questions.filter(q => q.difficulty === 'intermediate');
    const firstIntermediate = intermediateQuestions.length > 0 ? intermediateQuestions[0] : undefined;
    const firstQuestion = test.questions.length > 0 ? test.questions[0] : undefined;

    return firstIntermediate ?? firstQuestion ?? null;
  }

  private evaluateResponse(question: AdaptiveQuestion, userAnswer: string | string[]): boolean {
    const userAnswers = Array.isArray(userAnswer) ? userAnswer : [userAnswer];
    const { correctAnswers } = question;

    // Ensure correctAnswers is defined
    if (!correctAnswers) {
      return false;
    }

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
    const difficulties = ['beginner', 'intermediate', 'advanced', 'expert'];

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
      // Update progress service with test results
      if (test.performance && test.adaptiveMetrics) {
        // Update progress service with adaptive test results
        const { progressService } = await import('@/lib/services/progress-service');
        const progressResult = await progressService.updateProgressFromAdaptiveTest(userId, test.performance, {
          subjects: test.linkedSubjects,
          track: test.track,
          algorithmType: test.algorithmType,
        });
        if (!progressResult.success) {
          console.warn('Failed to update progress from adaptive test:', progressResult.error);
        }
      }

      // Mission system integration removed - now handled through journey planning
      // Update mission system based on test results
      // if (test.performance && test.adaptiveMetrics) {
      //   const { missionService } = await import('@/lib/mission-service');
      //   const testMetadata = {
      //     subjects: test.linkedSubjects,
      //     track: test.track,
      //   };
      //   const missionResult = await missionService.adjustMissionDifficultyFromTest(
      //     userId,
      //     test.performance,
      //     testMetadata
      //   );
      //   if (!missionResult.success) {
      //     console.warn('Failed to adjust mission difficulty from test:', missionResult.error);
      //   }
      // }

      // Update journey progress if linked
      if (test.linkedJourneyId) {
        await this.updateJourneyProgress(test);
      }
    } catch (error) {
      console.error('Failed to update integrated systems:', error);
    }
  }

  private async updateJourneyProgress(test: AdaptiveTest): Promise<void> {
    // Integration with journey service to update progress based on test results
    if (test.linkedJourneyId && test.performance && test.adaptiveMetrics) {
      const goalUpdate = test.adaptiveMetrics.progressImpact.journeyGoalUpdate;
      // This would call journey service to update goal progress
      console.info(`Journey ${test.linkedJourneyId} progress updated by ${goalUpdate}`);
    }
  }

  private initializePerformance(): TestPerformance {
    return {
      totalQuestions: 0,
      correctAnswers: 0,
      accuracy: 0,
      averageResponseTime: 0,
      totalTime: 0,
      subjectPerformance: {},
      difficultyPerformance: {
        beginner: { difficulty: 'beginner', questionsAnswered: 0, correctAnswers: 0, accuracy: 0, averageTime: 0 },
        intermediate: {
          difficulty: 'intermediate',
          questionsAnswered: 0,
          correctAnswers: 0,
          accuracy: 0,
          averageTime: 0,
        },
        advanced: { difficulty: 'advanced', questionsAnswered: 0, correctAnswers: 0, accuracy: 0, averageTime: 0 },
        expert: { difficulty: 'expert', questionsAnswered: 0, correctAnswers: 0, accuracy: 0, averageTime: 0 },
      },
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

  private mapNumericToMissionDifficulty(difficulty: number | MissionDifficulty): MissionDifficulty {
    if (typeof difficulty === 'string') {
      return difficulty;
    }

    // Map numeric difficulty to MissionDifficulty
    if (difficulty <= 1) {
      return 'beginner';
    }
    if (difficulty <= 2) {
      return 'intermediate';
    }
    if (difficulty <= 3) {
      return 'advanced';
    }
    return 'expert';
  }
}

// Export singleton instance
export const adaptiveTestingService = AdaptiveTestingService.getInstance();
