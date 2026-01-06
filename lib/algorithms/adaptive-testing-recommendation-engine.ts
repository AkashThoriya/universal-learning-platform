/**
 * @fileoverview Intelligent Adaptive Testing Recommendation Engine
 *
 * This service provides AI-powered test recommendations based on:
 * - User's learning progress and weak areas
 * - Journey progression requirements
 * - Historical test performance
 * - Learning preferences and persona
 * - Subject-specific strengths and weaknesses
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { AdaptiveTest, TestRecommendation } from '@/types/adaptive-testing';
import { UserJourney } from '@/types/journey';
import { progressService } from '@/lib/services/progress-service';
import { createSuccess, createError, Result } from '@/lib/utils/types-utils';

// Define difficulty levels for recommendations
type DifficultyLevel = 'beginner' | 'intermediate' | 'advanced' | 'expert';

// Define a simplified progress interface for our needs
interface UnifiedProgress {
  overallProgress: {
    totalMissionsCompleted: number;
    totalTimeInvested: number;
    averageScore: number;
    currentStreak: number;
    longestStreak: number;
    consistencyRating: number;
  };
  trackProgress: Record<string, {
    averageAccuracy: number;
    timeInvested: number;
    subjectProgress: Array<{
      subject: string;
      accuracy: number;
    }>;
  }>;
}

interface RecommendationContext {
  userId: string;
  userProgress: UnifiedProgress;
  activeJourneys: UserJourney[];
  completedTests: AdaptiveTest[];
  weakAreas: string[];
  strongAreas: string[];
  preferredDifficulty: DifficultyLevel;
  learningGoals: string[];
  timeAvailable: number; // minutes
}

interface RecommendationWeights {
  weakAreaFocus: number;
  journeyAlignment: number;
  journeyProgression: number;
  difficultyProgression: number;
  varietyBonus: number;
  freshnessBonus: number;
}

export class AdaptiveTestingRecommendationEngine {
  private readonly DEFAULT_WEIGHTS: RecommendationWeights = {
    weakAreaFocus: 0.4, // 40% - Focus on weak areas
    journeyAlignment: 0.25, // 25% - Align with active journeys
    journeyProgression: 0.15, // 15% - Support journey progression
    difficultyProgression: 0.1, // 10% - Appropriate difficulty
    varietyBonus: 0.05, // 5% - Encourage subject variety
    freshnessBonus: 0.05, // 5% - Prefer less recently tested areas
  };

  /**
   * Generate intelligent test recommendations for a user
   */
  async generateRecommendations(
    userId: string,
    maxRecommendations = 5,
    customWeights?: Partial<RecommendationWeights>
  ): Promise<Result<TestRecommendation[], string>> {
    try {
      // Gather recommendation context
      const context = await this.buildRecommendationContext(userId);
      if (!context.success) {
        return createError(`Failed to build recommendation context: ${context.error}`);
      }

      // Try AI Generation First
      const { llmService } = await import('@/lib/ai/llm-service');
      
      if (llmService.isAvailable()) {
         // Construct Prompt Context
         const promptContext = {
           userId,
           weakAreas: context.data.weakAreas,
           strongAreas: context.data.strongAreas,
           recentActivity: context.data.userProgress.overallProgress,
           preferredDifficulty: context.data.preferredDifficulty
         };

         const aiResult = await llmService.generateTestRecommendations(promptContext);
         
         if (aiResult.success && aiResult.data && Array.isArray(aiResult.data)) {
           const aiRecommendations: TestRecommendation[] = aiResult.data.map((rec: any, index: number) => ({
             testId: `ai-rec-${Date.now()}-${index}`,
             title: rec.title,
             description: rec.description,
             reasons: [rec.reason],
             subjects: rec.subjects ?? [],
             difficulty: rec.difficulty ?? context.data.preferredDifficulty,
             questionCount: 15,
             estimatedDuration: 20,
             priority: rec.priority ?? 'medium',
             tags: ['ai-recommended', 'personalized'],
             missionAlignment: 1,
             estimatedAccuracy: 0.7, // Estimate
             aiGenerated: true, // Truly AI generated now
             createdFrom: 'recommendation',
             linkedMissions: [],
             confidence: 0.9,
             expectedBenefit: rec.expectedBenefit ?? 'Personalized test to strengthen your weakest areas',
             adaptiveConfig: {
               algorithmType: 'CAT',
               convergenceCriteria: { standardError: 0.3, minQuestions: 10, maxQuestions: 20 },
               difficultyRange: { min: 'beginner', max: 'advanced' },
             },
           }));
           
           return createSuccess(aiRecommendations);
         }
      }

      // Fallback to Heuristic Engine (Renamed to Adaptive Insights)
      const weights = { ...this.DEFAULT_WEIGHTS, ...customWeights };

      // Generate candidate tests
      const candidates = await this.generateCandidateTests(context.data);

      // Score and rank recommendations
      const scoredRecommendations = await this.scoreRecommendations(candidates, context.data, weights);

      // Select top recommendations
      const topRecommendations = scoredRecommendations
        .sort((a, b) => (b as any).score - (a as any).score)
        .slice(0, maxRecommendations);

      return createSuccess(topRecommendations);
    } catch (error) {
      return createError(
        `Recommendation generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Generate recommendations specifically for weak areas
   */
  async generateWeakAreaRecommendations(
    userId: string,
    maxRecommendations = 3
  ): Promise<Result<TestRecommendation[], string>> {
    const customWeights: Partial<RecommendationWeights> = {
      weakAreaFocus: 0.7,
      journeyAlignment: 0.15,
      journeyProgression: 0.1,
      difficultyProgression: 0.05,
    };

    return this.generateRecommendations(userId, maxRecommendations, customWeights);
  }

  /**
   * Generate recommendations aligned with active journeys
   */
  async generateJourneyAlignedRecommendations(
    userId: string,
    maxRecommendations = 3
  ): Promise<Result<TestRecommendation[], string>> {
    const customWeights: Partial<RecommendationWeights> = {
      weakAreaFocus: 0.2,
      journeyAlignment: 0.5,
      journeyProgression: 0.2,
      difficultyProgression: 0.1,
    };

    return this.generateRecommendations(userId, maxRecommendations, customWeights);
  }

  /**
   * Generate quick assessment recommendations (15-20 minutes)
   */
  async generateQuickAssessmentRecommendations(
    userId: string,
    maxRecommendations = 3
  ): Promise<Result<TestRecommendation[], string>> {
    try {
      const context = await this.buildRecommendationContext(userId);
      if (!context.success) {
        return createError(`Failed to build context: ${context.error}`);
      }

      // Focus on high-impact, quick tests
      const quickCandidates = await this.generateCandidateTests(context.data, {
        maxQuestions: 15,
        maxDuration: 20,
        focusAreas: context.data.weakAreas.slice(0, 3),
      });

      const weights: RecommendationWeights = {
        weakAreaFocus: 0.5,
        journeyAlignment: 0.2,
        journeyProgression: 0.1,
        difficultyProgression: 0.1,
        varietyBonus: 0.05,
        freshnessBonus: 0.05,
      };

      const scored = await this.scoreRecommendations(quickCandidates, context.data, weights);
      const top = scored.sort((a, b) => (b as any).score - (a as any).score).slice(0, maxRecommendations);

      return createSuccess(top);
    } catch (error) {
      return createError(
        `Quick assessment generation failed: ${error instanceof Error ? error.message : 'Unknown error'}`
      );
    }
  }

  /**
   * Build comprehensive context for recommendations
   */
  private async buildRecommendationContext(userId: string): Promise<Result<RecommendationContext, string>> {
    try {
      // Gather user data
      const progressResult = await progressService.getUserProgress(userId);
      
      if (!progressResult.success) {
        return createError(`Failed to get user progress: ${progressResult.error}`);
      }

      const rawProgress = progressResult.data;
      
      // Cast the progress to our simplified interface
      const userProgress: UnifiedProgress = {
        overallProgress: rawProgress.overallProgress,
        trackProgress: Object.fromEntries(
          Object.entries(rawProgress.trackProgress).map(([key, track]: [string, any]) => [
            key,
            {
              averageAccuracy: track.averageScore ?? 70,
              timeInvested: track.timeInvested ?? 0,
              subjectProgress: track.topicBreakdown?.map((topic: any) => ({
                subject: topic.topic,
                accuracy: topic.averageScore ?? topic.proficiency ?? 70,
              })) ?? [],
            },
          ])
        ),
      };
      
      // For now, use empty arrays until the journey and test services are fully implemented
      const activeJourneys: UserJourney[] = [];
      const completedTests: AdaptiveTest[] = [];

      // Analyze learning patterns
      const weakAreas = this.identifyWeakAreas(userProgress);
      const strongAreas = this.identifyStrongAreas(userProgress);
      const preferredDifficulty = this.inferPreferredDifficulty(userProgress, completedTests);
      const learningGoals = this.extractLearningGoals(activeJourneys);

      const context: RecommendationContext = {
        userId,
        userProgress,
        activeJourneys,
        completedTests,
        weakAreas,
        strongAreas,
        preferredDifficulty,
        learningGoals,
        timeAvailable: 30, // Default 30 minutes
      };

      return createSuccess(context);
    } catch (error) {
      return createError(`Context building failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  /**
   * Generate candidate tests based on context
   */
  private async generateCandidateTests(
    context: RecommendationContext,
    constraints?: {
      maxQuestions?: number;
      maxDuration?: number;
      focusAreas?: string[];
    }
  ): Promise<TestRecommendation[]> {
    const candidates: TestRecommendation[] = [];
    const maxQuestions = constraints?.maxQuestions ?? 25;
    const maxDuration = constraints?.maxDuration ?? 45;
      // Remove unused variable warning
      // const _focusAreas = constraints?.focusAreas || [...context.weakAreas, ...context.learningGoals];

    // Generate tests for weak areas
    for (const subject of context.weakAreas.slice(0, 3)) {
      candidates.push({
        testId: `weak-area-${subject}-${Date.now()}`,
        title: `Master ${subject}`,
        description: `Focused assessment to improve your ${subject} skills`,
        estimatedDuration: Math.min(maxDuration, 30),
        difficulty: this.getProgressiveDifficulty(context.preferredDifficulty),
        subjects: [subject],
        questionCount: Math.min(maxQuestions, 20),
        reasons: [`Identified weakness in ${subject}`, 'Targeted skill improvement'],
        expectedBenefit: 'Strengthen weak areas',
        priority: 'high',
        tags: ['weakness-focus', 'skill-building'],
        missionAlignment: this.calculateJourneyAlignment([subject], context.activeJourneys),
        estimatedAccuracy: this.estimateAccuracy(subject, context),
        aiGenerated: true,
        createdFrom: 'recommendation',
        linkedMissions: this.findRelatedJourneys([subject], context.activeJourneys),
        confidence: 0.8, // High confidence for weak area targeting
        adaptiveConfig: {
          algorithmType: 'CAT',
          convergenceCriteria: { standardError: 0.3, minQuestions: 8, maxQuestions },
          difficultyRange: { min: 'beginner', max: context.preferredDifficulty },
        },
      });
    }

    // Generate journey-aligned tests
    for (const journey of context.activeJourneys.slice(0, 2)) {
      const journeySubjects = this.extractJourneySubjects(journey);
      if (journeySubjects.length > 0) {
        candidates.push({
          testId: `journey-${journey.id}-${Date.now()}`,
          title: `${journey.title} Assessment`,
          description: `Test your progress on journey: ${journey.title}`,
          estimatedDuration: Math.min(maxDuration, 35),
          difficulty: this.inferJourneyDifficulty(journey) ?? context.preferredDifficulty,
          subjects: journeySubjects,
          questionCount: Math.min(maxQuestions, 18),
          reasons: [`Supports active journey: ${journey.title}`, 'Journey progress assessment'],
          expectedBenefit: 'Journey progress verification',
          priority: 'medium',
          tags: ['journey-prep', 'goal-aligned'],
          missionAlignment: 1.0,
          estimatedAccuracy: this.estimateAccuracy(journeySubjects[0] ?? '', context),
          aiGenerated: false,
          createdFrom: 'journey',
          linkedMissions: [journey.id],
          confidence: 0.9, // Very high confidence for journey-aligned tests
          adaptiveConfig: {
            algorithmType: 'HYBRID',
            convergenceCriteria: { standardError: 0.25, minQuestions: 10, maxQuestions },
            difficultyRange: { min: 'beginner', max: this.inferJourneyDifficulty(journey) ?? 'intermediate' },
          },
        });
      }
    }

    // Generate comprehensive review test
    if (context.weakAreas.length >= 2) {
      candidates.push({
        testId: `comprehensive-review-${Date.now()}`,
        title: 'Comprehensive Skills Assessment',
        description: 'Multi-subject assessment covering your key learning areas',
        estimatedDuration: maxDuration,
        difficulty: context.preferredDifficulty,
        subjects: context.weakAreas.slice(0, 4),
        questionCount: maxQuestions,
        reasons: ['Comprehensive skill evaluation', 'Multi-subject integration'],
        expectedBenefit: 'Overall progress assessment',
        priority: 'medium',
        tags: ['comprehensive', 'multi-subject'],
        missionAlignment: this.calculateJourneyAlignment(context.weakAreas, context.activeJourneys),
        estimatedAccuracy: this.estimateAccuracy('overall', context),
        aiGenerated: true,
        createdFrom: 'recommendation',
        linkedMissions: context.activeJourneys.map(j => j.id).slice(0, 3),
        confidence: 0.7, // Good confidence for comprehensive tests
        adaptiveConfig: {
          algorithmType: 'CAT',
          convergenceCriteria: { standardError: 0.35, minQuestions: 15, maxQuestions },
          difficultyRange: { min: 'beginner', max: 'advanced' },
        },
      });
    }

    // Generate strength reinforcement test
    if (context.strongAreas.length > 0) {
      candidates.push({
        testId: `strength-reinforcement-${Date.now()}`,
        title: `Advanced ${context.strongAreas[0]} Challenge`,
        description: `Challenge yourself with advanced ${context.strongAreas[0]} problems`,
        estimatedDuration: Math.min(maxDuration, 25),
        difficulty: this.getAdvancedDifficulty(context.preferredDifficulty),
        subjects: [context.strongAreas[0] ?? 'advanced'],
        questionCount: Math.min(maxQuestions, 15),
        reasons: [`Build on strength in ${context.strongAreas[0] ?? 'advanced topics'}`, 'Advanced skill development'],
        expectedBenefit: 'Strength reinforcement',
        priority: 'low',
        tags: ['strength-building', 'advanced'],
        missionAlignment: this.calculateJourneyAlignment([context.strongAreas[0] ?? ''], context.activeJourneys),
        estimatedAccuracy: this.estimateAccuracy(context.strongAreas[0] ?? '', context) + 10,
        aiGenerated: true,
        createdFrom: 'recommendation',
        linkedMissions: this.findRelatedJourneys([context.strongAreas[0] ?? ''], context.activeJourneys),
        confidence: 0.6, // Lower confidence for strength building
        adaptiveConfig: {
          algorithmType: 'CAT',
          convergenceCriteria: { standardError: 0.2, minQuestions: 8, maxQuestions },
          difficultyRange: { min: 'intermediate', max: 'expert' },
        },
      });
    }

    return candidates;
  }

  /**
   * Score recommendations based on user context and weights
   */
  private async scoreRecommendations(
    candidates: TestRecommendation[],
    context: RecommendationContext,
    weights: RecommendationWeights
  ): Promise<TestRecommendation[]> {
    return candidates.map(candidate => {
      let score = 0;

      // Weak area focus score
      const weakAreaScore = this.calculateWeakAreaScore(candidate, context);
      score += weakAreaScore * weights.weakAreaFocus;

      // Journey alignment score
      score += candidate.missionAlignment * weights.journeyAlignment;

      // Journey progression score
      const journeyScore = this.calculateJourneyScore(candidate, context);
      score += journeyScore * weights.journeyProgression;

      // Difficulty progression score
      const difficultyScore = this.calculateDifficultyScore(candidate, context);
      score += difficultyScore * weights.difficultyProgression;

      // Variety bonus
      const varietyBonus = this.calculateVarietyBonus(candidate, context);
      score += varietyBonus * weights.varietyBonus;

      // Freshness bonus
      const freshnessBonus = this.calculateFreshnessBonus(candidate, context);
      score += freshnessBonus * weights.freshnessBonus;

      return {
        ...candidate,
        score: Math.min(score, 1.0), // Cap at 1.0
        confidence: this.calculateConfidence(candidate, context),
      };
    });
  }

  // Helper methods for scoring
  private calculateWeakAreaScore(candidate: TestRecommendation, context: RecommendationContext): number {
    const weakAreaOverlap = candidate.subjects.filter(subject => context.weakAreas.includes(subject)).length;
    return weakAreaOverlap / Math.max(candidate.subjects.length, 1);
  }

  private calculateJourneyScore(candidate: TestRecommendation, context: RecommendationContext): number {
    if (context.activeJourneys.length === 0) {
      return 0.5; // Default score when no journeys
    }

    // Calculate how well the test aligns with journey goals
    let totalScore = 0;
    for (const journey of context.activeJourneys) {
      const journeySubjects = this.extractJourneySubjects(journey);
      const overlap = candidate.subjects.filter(subject => journeySubjects.includes(subject)).length;
      const alignmentScore = overlap / Math.max(candidate.subjects.length, 1);
      totalScore += alignmentScore;
    }

    return Math.min(totalScore / context.activeJourneys.length, 1.0);
  }

  private calculateDifficultyScore(candidate: TestRecommendation, context: RecommendationContext): number {
    const difficultyMap = { beginner: 1, intermediate: 2, advanced: 3, expert: 4 };
    const candidateDiff = difficultyMap[candidate.difficulty] || 2;
    const preferredDiff = difficultyMap[context.preferredDifficulty] || 2;

    const difference = Math.abs(candidateDiff - preferredDiff);
    return Math.max(0, 1 - difference / 3);
  }

  private calculateVarietyBonus(candidate: TestRecommendation, context: RecommendationContext): number {
    const recentSubjects = context.completedTests
      .slice(-5) // Last 5 tests
      .flatMap(test => test.linkedSubjects);

    const hasNewSubjects = candidate.subjects.some(subject => !recentSubjects.includes(subject));
    return hasNewSubjects ? 1.0 : 0.3;
  }

  private calculateFreshnessBonus(candidate: TestRecommendation, context: RecommendationContext): number {
    const recentSubjects = context.completedTests
      .slice(-3) // Last 3 tests
      .flatMap(test => test.linkedSubjects);

    const isRecentlyTested = candidate.subjects.some(subject => recentSubjects.includes(subject));
    return isRecentlyTested ? 0.2 : 1.0;
  }

  private calculateConfidence(candidate: TestRecommendation, context: RecommendationContext): number {
    // Base confidence on data quality and relevance
    let confidence = 0.7; // Base confidence

    if (context.completedTests.length >= 3) {
      confidence += 0.1;
    }
    if (context.activeJourneys.length > 0) {
      confidence += 0.1;
    }
    if (candidate.missionAlignment > 0.5) {
      confidence += 0.1;
    }

    return Math.min(confidence, 1.0);
  }

  // Helper methods for analysis
  private identifyWeakAreas(progress: UnifiedProgress): string[] {
    const weakAreas: string[] = [];

    // Analyze track progress for weak subjects
    Object.entries(progress.trackProgress).forEach(([_track, trackData]) => {
      if (trackData && typeof trackData === 'object' && 'averageAccuracy' in trackData && 'subjectProgress' in trackData) {
        if (trackData.averageAccuracy < 70) {
          trackData.subjectProgress.forEach((subject: { subject: string; accuracy: number }) => {
            if (subject.accuracy < 65) {
              weakAreas.push(subject.subject);
            }
          });
        }
      }
    });

    return [...new Set(weakAreas)].slice(0, 5);
  }

  private identifyStrongAreas(progress: UnifiedProgress): string[] {
    const strongAreas: string[] = [];

    Object.entries(progress.trackProgress).forEach(([_track, trackData]) => {
      if (trackData && typeof trackData === 'object' && 'subjectProgress' in trackData) {
        trackData.subjectProgress.forEach((subject: { subject: string; accuracy: number }) => {
          if (subject.accuracy >= 85) {
            strongAreas.push(subject.subject);
          }
        });
      }
    });

    return [...new Set(strongAreas)].slice(0, 3);
  }

  private inferPreferredDifficulty(progress: UnifiedProgress, tests: AdaptiveTest[]): DifficultyLevel {
    if (tests.length === 0) {
      return 'intermediate';
    }

    const avgAccuracy = progress.overallProgress.averageScore;

    if (avgAccuracy >= 85) {
      return 'advanced';
    }
    if (avgAccuracy >= 70) {
      return 'intermediate';
    }
    return 'beginner';
  }

  private extractLearningGoals(journeys: UserJourney[]): string[] {
    return journeys.flatMap(journey => this.extractJourneySubjects(journey)).slice(0, 5);
  }

  private extractJourneySubjects(journey: UserJourney): string[] {
    // Extract subjects from journey goals and linked subjects
    const subjects: string[] = [];
    
    // Extract from custom goals
    journey.customGoals.forEach(goal => {
      if (goal.linkedSubjects) {
        subjects.push(...goal.linkedSubjects);
      }
    });
    
    // If no subjects found, use journey track as default
    if (subjects.length === 0) {
      subjects.push(journey.track ?? 'General');
    }
    
    return [...new Set(subjects)]; // Remove duplicates
  }

  private calculateJourneyAlignment(subjects: string[], journeys: UserJourney[]): number {
    if (journeys.length === 0) {
      return 0;
    }

    const journeySubjects = journeys.flatMap(journey => this.extractJourneySubjects(journey));
    const overlap = subjects.filter(subject => journeySubjects.includes(subject)).length;

    return overlap / Math.max(subjects.length, 1);
  }

  private findRelatedJourneys(subjects: string[], journeys: UserJourney[]): string[] {
    return journeys
      .filter(journey => {
        const journeySubjects = this.extractJourneySubjects(journey);
        return subjects.some(subject => journeySubjects.includes(subject));
      })
      .map(journey => journey.id)
      .slice(0, 3);
  }

  private estimateAccuracy(subject: string, context: RecommendationContext): number {
    if (subject === 'overall') {
      return context.userProgress.overallProgress.averageScore;
    }

    // Find subject-specific accuracy
    let accuracy = 70; // Default
    Object.values(context.userProgress.trackProgress).forEach(track => {
      if (track && typeof track === 'object' && 'subjectProgress' in track) {
        const subjectData = track.subjectProgress.find((s: { subject: string; accuracy: number }) => s.subject === subject);
        if (subjectData) {
          accuracy = subjectData.accuracy;
        }
      }
    });

    return accuracy;
  }

  private getProgressiveDifficulty(current: DifficultyLevel): DifficultyLevel {
    const progression: Record<DifficultyLevel, DifficultyLevel> = { 
      beginner: 'intermediate', 
      intermediate: 'intermediate', 
      advanced: 'advanced',
      expert: 'expert'
    };
    return progression[current] ?? 'intermediate';
  }

  private getAdvancedDifficulty(current: DifficultyLevel): DifficultyLevel {
    const advancement: Record<DifficultyLevel, DifficultyLevel> = { 
      beginner: 'intermediate', 
      intermediate: 'advanced', 
      advanced: 'expert',
      expert: 'expert'
    };
    return advancement[current] ?? 'advanced';
  }

  /**
   * Infer journey difficulty based on goals and completion requirements
   */
  private inferJourneyDifficulty(journey: UserJourney): DifficultyLevel {
    // Base difficulty on journey priority and target completion date
    const daysToComplete = journey.targetCompletionDate 
      ? Math.ceil((journey.targetCompletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
      : 90;

    const goalsCount = journey.customGoals.length;

    if (journey.priority === 'high' && daysToComplete < 30) {
      return 'expert';
    }
    if (journey.priority === 'high' || (goalsCount > 5 && daysToComplete < 60)) {
      return 'advanced';
    }
    if (goalsCount > 3 || daysToComplete < 90) {
      return 'intermediate';
    }
    
    return 'beginner';
  }
}

// Export singleton instance
export const adaptiveTestingRecommendationEngine = new AdaptiveTestingRecommendationEngine();
