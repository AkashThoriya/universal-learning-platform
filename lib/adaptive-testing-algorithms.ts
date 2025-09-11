/**
 * @fileoverview Adaptive Testing Algorithms
 * Implements Computer Adaptive Testing (CAT) algorithms with mission system integration
 */

import { AdaptiveQuestion, TestResponse, AbilityEstimate, AdaptiveMetrics } from '@/types/adaptive-testing';
import { MissionDifficulty } from '@/types/mission-system';

export class AdaptiveAlgorithm {
  private static readonly DIFFICULTY_SCORES = {
    beginner: 0.2,
    intermediate: 0.4,
    advanced: 0.6,
    expert: 0.8,
  };

  /**
   * Item Response Theory (IRT) implementation
   * Calculates probability of correct response given ability and question parameters
   */
  static calculateResponseProbability(
    abilityLevel: number,
    difficulty: number,
    discrimination = 1.0,
    guessing = 0.25
  ): number {
    const logit = discrimination * (abilityLevel - difficulty);
    const probability = guessing + (1 - guessing) / (1 + Math.exp(-logit));
    return Math.max(0.01, Math.min(0.99, probability)); // Prevent extreme values
  }

  /**
   * Maximum Likelihood Estimation for ability
   */
  static estimateAbility(responses: TestResponse[], questions: AdaptiveQuestion[]): number {
    if (responses.length === 0) {
      return 0;
    }

    // Newton-Raphson method for MLE
    let ability = 0;
    const maxIterations = 50;
    const tolerance = 0.001;

    for (let iteration = 0; iteration < maxIterations; iteration++) {
      let logLikelihoodDerivative = 0;
      let informationSum = 0;

      for (const response of responses) {
        const question = questions.find(q => q.id === response.questionId);
        if (!question) {
          continue;
        }

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
      if (!question) {
        continue;
      }

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
    if (availableQuestions.length === 0) {
      return null;
    }

    // Filter questions based on constraints
    const candidateQuestions = availableQuestions.filter(question => {
      // Avoid recently answered topics if specified
      if (constraints?.avoidRecentTopics?.includes(question.topic)) {
        const recentResponses = previousResponses.slice(-3);
        const recentTopics = recentResponses.map(r => {
          const q = availableQuestions.find(aq => aq.id === r.questionId);
          return q?.topic;
        });
        if (recentTopics.includes(question.topic)) {
          return false;
        }
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
    targetStandardError = 0.3
  ): boolean {
    // Always continue if below minimum questions
    if (responses.length < 5) {
      return true;
    }

    // Stop if reached maximum questions
    if (responses.length >= maxQuestions) {
      return false;
    }

    // Check standard error convergence
    const standardError = this.calculateStandardError(responses, questions, currentAbility);
    if (standardError <= targetStandardError) {
      return false;
    }

    // Check ability estimate stability
    if (responses.length >= 10) {
      const recentEstimates = responses.slice(-5).map((_, index) => {
        const partialResponses = responses.slice(0, responses.length - 4 + index);
        return this.estimateAbility(partialResponses, questions);
      });

      const estimateVariability = this.calculateVariability(recentEstimates);
      if (estimateVariability < 0.1) {
        return false; // Ability estimate is stable
      }
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
    const informationGained = responses.reduce((sum, response) => {
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
    if (responses.length === 0) {
      return 0;
    }

    const subjectResponses = responses.filter(response => {
      const question = questions.find(q => q.id === response.questionId);
      return question?.subject === subject;
    });

    return subjectResponses.length / responses.length;
  }

  private static calculateVariability(values: number[]): number {
    if (values.length < 2) {
      return 0;
    }

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

  /**
   * Difficulty progression algorithm
   * Ensures smooth difficulty progression based on user performance
   */
  static progressiveDifficultySelection(
    availableQuestions: AdaptiveQuestion[],
    currentAbility: number,
    previousResponses: TestResponse[],
    progressionRate = 0.1
  ): AdaptiveQuestion | null {
    if (previousResponses.length === 0) {
      // Start with beginner questions
      const beginnerQuestions = availableQuestions.filter(q => q.difficulty === 'beginner');
      return beginnerQuestions.length > 0 ? beginnerQuestions[0] : availableQuestions[0] || null;
    }

    // Calculate recent performance
    const recentResponses = previousResponses.slice(-3);
    const recentAccuracy = recentResponses.filter(r => r.isCorrect).length / recentResponses.length;

    // Determine target difficulty based on performance
    let targetDifficulty: MissionDifficulty;
    if (recentAccuracy >= 0.8) {
      // High accuracy - increase difficulty
      const currentDifficultyIndex = this.getDifficultyIndex(
        previousResponses[previousResponses.length - 1].questionDifficulty
      );
      const newIndex = Math.min(3, currentDifficultyIndex + 1);
      targetDifficulty = this.getDifficultyFromIndex(newIndex);
    } else if (recentAccuracy <= 0.4) {
      // Low accuracy - decrease difficulty
      const currentDifficultyIndex = this.getDifficultyIndex(
        previousResponses[previousResponses.length - 1].questionDifficulty
      );
      const newIndex = Math.max(0, currentDifficultyIndex - 1);
      targetDifficulty = this.getDifficultyFromIndex(newIndex);
    } else {
      // Maintain current difficulty
      targetDifficulty = previousResponses[previousResponses.length - 1].questionDifficulty;
    }

    // Filter questions by target difficulty
    const targetDifficultyQuestions = availableQuestions.filter(q => q.difficulty === targetDifficulty);

    if (targetDifficultyQuestions.length === 0) {
      return AdaptiveAlgorithm.selectNextQuestion(availableQuestions, currentAbility, previousResponses);
    }

    return AdaptiveAlgorithm.selectNextQuestion(targetDifficultyQuestions, currentAbility, previousResponses);
  }

  /**
   * Fatigue-aware question selection
   * Adjusts question difficulty based on user fatigue indicators
   */
  static fatigueAwareSelection(
    availableQuestions: AdaptiveQuestion[],
    currentAbility: number,
    previousResponses: TestResponse[],
    fatigueIndicators: number[]
  ): AdaptiveQuestion | null {
    // Calculate fatigue level based on response time trends
    const avgResponseTime = fatigueIndicators.reduce((sum, time) => sum + time, 0) / fatigueIndicators.length;
    const recentAvgTime = fatigueIndicators.slice(-3).reduce((sum, time) => sum + time, 0) / 3;

    const fatigueLevel = recentAvgTime / avgResponseTime; // > 1 indicates increasing response times (fatigue)

    let difficultyAdjustment = 0;
    if (fatigueLevel > 1.3) {
      // High fatigue - reduce difficulty
      difficultyAdjustment = -1;
    } else if (fatigueLevel > 1.1) {
      // Moderate fatigue - maintain easier questions
      difficultyAdjustment = 0;
    }

    // Apply difficulty adjustment
    const adjustedQuestions = this.adjustQuestionsByDifficulty(availableQuestions, difficultyAdjustment);

    return AdaptiveAlgorithm.selectNextQuestion(adjustedQuestions, currentAbility, previousResponses);
  }

  /**
   * Confidence-based adaptive selection
   * Uses user confidence ratings to improve question selection
   */
  static confidenceBasedSelection(
    availableQuestions: AdaptiveQuestion[],
    currentAbility: number,
    previousResponses: TestResponse[]
  ): AdaptiveQuestion | null {
    const responsesWithConfidence = previousResponses.filter(r => r.confidence !== undefined);

    if (responsesWithConfidence.length === 0) {
      return AdaptiveAlgorithm.selectNextQuestion(availableQuestions, currentAbility, previousResponses);
    }

    // Calculate confidence-accuracy correlation
    const overconfidencePattern = responsesWithConfidence.filter(r => !r.isCorrect && (r.confidence || 0) >= 4).length;
    const underconfidencePattern = responsesWithConfidence.filter(r => r.isCorrect && (r.confidence || 0) <= 2).length;

    // Adjust selection based on confidence patterns
    if (overconfidencePattern > underconfidencePattern) {
      // User is overconfident - select slightly harder questions
      const constraints = {
        difficultyConstraints: ['advanced', 'expert'] as MissionDifficulty[],
      };
      return AdaptiveAlgorithm.selectNextQuestion(availableQuestions, currentAbility, previousResponses, constraints);
    } else if (underconfidencePattern > overconfidencePattern) {
      // User is underconfident - select questions to build confidence
      const constraints = {
        difficultyConstraints: ['beginner', 'intermediate'] as MissionDifficulty[],
      };
      return AdaptiveAlgorithm.selectNextQuestion(availableQuestions, currentAbility, previousResponses, constraints);
    }

    return AdaptiveAlgorithm.selectNextQuestion(availableQuestions, currentAbility, previousResponses);
  }

  // Helper methods
  private static getDifficultyIndex(difficulty: MissionDifficulty): number {
    const difficultyMap = { beginner: 0, intermediate: 1, advanced: 2, expert: 3 };
    return difficultyMap[difficulty] || 1;
  }

  private static getDifficultyFromIndex(index: number): MissionDifficulty {
    const difficulties: MissionDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
    return difficulties[index] || 'intermediate';
  }

  private static adjustQuestionsByDifficulty(questions: AdaptiveQuestion[], adjustment: number): AdaptiveQuestion[] {
    if (adjustment === 0) {
      return questions;
    }

    const difficultyOrder: MissionDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];

    return questions.filter(question => {
      const currentIndex = this.getDifficultyIndex(question.difficulty);
      const targetIndex = Math.max(0, Math.min(3, currentIndex + adjustment));
      const targetDifficulty = difficultyOrder[targetIndex];
      return question.difficulty === targetDifficulty;
    });
  }
}

/**
 * Performance optimization utilities for adaptive algorithms
 */
export class AdaptiveAlgorithmOptimizer {
  /**
   * Optimize question bank for better adaptive testing performance
   */
  static optimizeQuestionBank(questions: AdaptiveQuestion[]): {
    optimizedQuestions: AdaptiveQuestion[];
    recommendations: string[];
  } {
    const recommendations: string[] = [];
    const optimizedQuestions = [...questions];

    // Check discrimination index distribution
    const lowDiscrimination = questions.filter(q => q.discriminationIndex < 0.5);
    if (lowDiscrimination.length > questions.length * 0.2) {
      recommendations.push('Consider removing or improving questions with low discrimination index');
    }

    // Check difficulty distribution
    const difficultyDistribution = this.calculateDifficultyDistribution(questions);
    const idealDistribution = { beginner: 0.2, intermediate: 0.3, advanced: 0.3, expert: 0.2 };

    Object.entries(idealDistribution).forEach(([difficulty, ideal]) => {
      const actual = difficultyDistribution[difficulty as MissionDifficulty] || 0;
      if (Math.abs(actual - ideal) > 0.1) {
        recommendations.push(
          `Adjust ${difficulty} question ratio: current ${(actual * 100).toFixed(1)}%, ideal ${(ideal * 100).toFixed(1)}%`
        );
      }
    });

    // Check subject coverage
    const subjects = [...new Set(questions.map(q => q.subject))];
    const subjectDistribution = subjects.map(subject => ({
      subject,
      count: questions.filter(q => q.subject === subject).length,
    }));

    const avgQuestionsPerSubject = questions.length / subjects.length;
    subjectDistribution.forEach(({ subject, count }) => {
      if (count < avgQuestionsPerSubject * 0.5) {
        recommendations.push(`Insufficient questions for subject: ${subject} (${count} questions)`);
      }
    });

    return {
      optimizedQuestions,
      recommendations,
    };
  }

  /**
   * Analyze test performance for algorithm improvements
   */
  static analyzeTestPerformance(
    responses: TestResponse[],
    questions: AdaptiveQuestion[]
  ): {
    efficiency: number;
    accuracy: number;
    recommendations: string[];
  } {
    const recommendations: string[] = [];

    // Calculate efficiency metrics
    const totalTime = responses.reduce((sum, r) => sum + r.responseTime, 0);
    const avgTimePerQuestion = totalTime / responses.length;
    const efficiency = Math.max(0, 1 - (avgTimePerQuestion - 60000) / 300000); // Optimal: 1 minute per question

    // Calculate accuracy
    const accuracy = responses.filter(r => r.isCorrect).length / responses.length;

    // Generate recommendations
    if (efficiency < 0.7) {
      recommendations.push('Consider optimizing question selection algorithm for better time efficiency');
    }

    if (accuracy < 0.6) {
      recommendations.push('Test may be too difficult - consider adjusting initial difficulty estimation');
    } else if (accuracy > 0.9) {
      recommendations.push('Test may be too easy - consider starting with higher difficulty questions');
    }

    const responseTimeVariability = this.calculateResponseTimeVariability(responses);
    if (responseTimeVariability > 0.5) {
      recommendations.push('High response time variability detected - consider fatigue management strategies');
    }

    return {
      efficiency,
      accuracy,
      recommendations,
    };
  }

  private static calculateDifficultyDistribution(questions: AdaptiveQuestion[]): Record<MissionDifficulty, number> {
    const distribution: Record<MissionDifficulty, number> = {
      beginner: 0,
      intermediate: 0,
      advanced: 0,
      expert: 0,
    };

    questions.forEach(question => {
      distribution[question.difficulty]++;
    });

    // Convert to proportions
    Object.keys(distribution).forEach(key => {
      distribution[key as MissionDifficulty] /= questions.length;
    });

    return distribution;
  }

  private static calculateResponseTimeVariability(responses: TestResponse[]): number {
    const times = responses.map(r => r.responseTime);
    const mean = times.reduce((sum, time) => sum + time, 0) / times.length;
    const variance = times.reduce((sum, time) => sum + Math.pow(time - mean, 2), 0) / times.length;
    const standardDeviation = Math.sqrt(variance);

    return standardDeviation / mean; // Coefficient of variation
  }
}
