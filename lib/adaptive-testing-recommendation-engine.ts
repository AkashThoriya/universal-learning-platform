/**
 * @fileoverview Intelligent Adaptive Testing Recommendation Engine
 *
 * This service provides AI-powered test recommendations based on:
 * - User's learning progress and weak areas
 * - Mission completion patterns
 * - Journey progression requirements
 * - Historical test performance
 * - Learning preferences and persona
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { AdaptiveTest, TestRecommendation, TestMissionLink, TestJourneyIntegration } from '@/types/adaptive-testing';
import { MissionDifficulty } from '@/types/mission-system';
import { UnifiedProgress, LearningTrack } from '@/types/user';

import { adaptiveTestingService } from './adaptive-testing-service';
import { missionFirebaseService, adaptiveTestingFirebaseService } from './firebase-services';
import { progressService } from './progress-service';
import { createSuccess, createError, Result } from './types-utils';

interface RecommendationContext {
  userId: string;
  userProgress: UnifiedProgress;
  activeMissions: any[];
  completedTests: AdaptiveTest[];
  weakAreas: string[];
  strongAreas: string[];
  preferredDifficulty: MissionDifficulty;
  learningGoals: string[];
  timeAvailable: number; // minutes
}

interface RecommendationWeights {
  weakAreaFocus: number;
  missionAlignment: number;
  journeyProgression: number;
  difficultyProgression: number;
  varietyBonus: number;
  freshnessBonus: number;
}

export class AdaptiveTestingRecommendationEngine {
  private readonly DEFAULT_WEIGHTS: RecommendationWeights = {
    weakAreaFocus: 0.4, // 40% - Focus on weak areas
    missionAlignment: 0.25, // 25% - Align with active missions
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

      const weights = { ...this.DEFAULT_WEIGHTS, ...customWeights };

      // Generate candidate tests
      const candidates = await this.generateCandidateTests(context.data);

      // Score and rank recommendations
      const scoredRecommendations = await this.scoreRecommendations(candidates, context.data, weights);

      // Select top recommendations
      const topRecommendations = scoredRecommendations.sort((a, b) => b.score - a.score).slice(0, maxRecommendations);

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
      missionAlignment: 0.15,
      journeyProgression: 0.1,
      difficultyProgression: 0.05,
    };

    return this.generateRecommendations(userId, maxRecommendations, customWeights);
  }

  /**
   * Generate recommendations aligned with active missions
   */
  async generateMissionAlignedRecommendations(
    userId: string,
    maxRecommendations = 3
  ): Promise<Result<TestRecommendation[], string>> {
    const customWeights: Partial<RecommendationWeights> = {
      weakAreaFocus: 0.2,
      missionAlignment: 0.5,
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
        missionAlignment: 0.2,
        journeyProgression: 0.1,
        difficultyProgression: 0.1,
        varietyBonus: 0.05,
        freshnessBonus: 0.05,
      };

      const scored = await this.scoreRecommendations(quickCandidates, context.data, weights);
      const top = scored.sort((a, b) => b.score - a.score).slice(0, maxRecommendations);

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
      const [progressResult, missionsResult, testsResult] = await Promise.all([
        progressService.getUserProgress(userId),
        missionFirebaseService.getActiveMissions(userId),
        adaptiveTestingFirebaseService.getUserTests(userId),
      ]);

      if (!progressResult.success) {
        return createError(`Failed to get user progress: ${progressResult.error}`);
      }

      const userProgress = progressResult.data;
      const activeMissions = missionsResult.success ? missionsResult.data : [];
      const allTests = testsResult.success ? testsResult.data : [];
      const completedTests = allTests.filter(test => test.status === 'completed');

      // Analyze learning patterns
      const weakAreas = this.identifyWeakAreas(userProgress);
      const strongAreas = this.identifyStrongAreas(userProgress);
      const preferredDifficulty = this.inferPreferredDifficulty(userProgress, completedTests);
      const learningGoals = this.extractLearningGoals(activeMissions);

      const context: RecommendationContext = {
        userId,
        userProgress,
        activeMissions,
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
    const maxQuestions = constraints?.maxQuestions || 25;
    const maxDuration = constraints?.maxDuration || 45;
    const focusAreas = constraints?.focusAreas || [...context.weakAreas, ...context.learningGoals];

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
        missionAlignment: this.calculateMissionAlignment([subject], context.activeMissions),
        estimatedAccuracy: this.estimateAccuracy(subject, context),
        aiGenerated: true,
        createdFrom: 'recommendation',
        linkedMissions: this.findRelatedMissions([subject], context.activeMissions),
        adaptiveConfig: {
          algorithmType: 'CAT',
          convergenceCriteria: { standardError: 0.3, minQuestions: 8, maxQuestions },
          difficultyRange: { min: 'beginner', max: context.preferredDifficulty },
        },
      });
    }

    // Generate mission-aligned tests
    for (const mission of context.activeMissions.slice(0, 2)) {
      const missionSubjects = this.extractMissionSubjects(mission);
      if (missionSubjects.length > 0) {
        candidates.push({
          testId: `mission-${mission.id}-${Date.now()}`,
          title: `${mission.title} Assessment`,
          description: `Test your readiness for mission: ${mission.title}`,
          estimatedDuration: Math.min(maxDuration, 35),
          difficulty: mission.difficultyLevel || context.preferredDifficulty,
          subjects: missionSubjects,
          questionCount: Math.min(maxQuestions, 18),
          reasons: [`Supports active mission: ${mission.title}`, 'Mission preparation'],
          expectedBenefit: 'Mission readiness verification',
          priority: 'medium',
          tags: ['mission-prep', 'goal-aligned'],
          missionAlignment: 1.0,
          estimatedAccuracy: this.estimateAccuracy(missionSubjects[0], context),
          aiGenerated: true,
          createdFrom: 'mission',
          linkedMissions: [mission.id],
          adaptiveConfig: {
            algorithmType: 'HYBRID',
            convergenceCriteria: { standardError: 0.25, minQuestions: 10, maxQuestions },
            difficultyRange: { min: 'beginner', max: mission.difficultyLevel || 'intermediate' },
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
        missionAlignment: this.calculateMissionAlignment(context.weakAreas, context.activeMissions),
        estimatedAccuracy: this.estimateAccuracy('overall', context),
        aiGenerated: true,
        createdFrom: 'recommendation',
        linkedMissions: context.activeMissions.map(m => m.id).slice(0, 3),
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
        subjects: [context.strongAreas[0]],
        questionCount: Math.min(maxQuestions, 15),
        reasons: [`Build on strength in ${context.strongAreas[0]}`, 'Advanced skill development'],
        expectedBenefit: 'Strength reinforcement',
        priority: 'low',
        tags: ['strength-building', 'advanced'],
        missionAlignment: this.calculateMissionAlignment([context.strongAreas[0]], context.activeMissions),
        estimatedAccuracy: this.estimateAccuracy(context.strongAreas[0], context) + 10,
        aiGenerated: true,
        createdFrom: 'recommendation',
        linkedMissions: this.findRelatedMissions([context.strongAreas[0]], context.activeMissions),
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

      // Mission alignment score
      score += candidate.missionAlignment * weights.missionAlignment;

      // Journey progression score (placeholder - would integrate with journey system)
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
    // Placeholder - would integrate with actual journey system
    return 0.5;
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
    if (context.activeMissions.length > 0) {
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
    Object.entries(progress.trackProgress).forEach(([track, trackData]) => {
      if (trackData.averageAccuracy < 70) {
        trackData.subjectProgress.forEach(subject => {
          if (subject.accuracy < 65) {
            weakAreas.push(subject.subject);
          }
        });
      }
    });

    return [...new Set(weakAreas)].slice(0, 5);
  }

  private identifyStrongAreas(progress: UnifiedProgress): string[] {
    const strongAreas: string[] = [];

    Object.entries(progress.trackProgress).forEach(([track, trackData]) => {
      trackData.subjectProgress.forEach(subject => {
        if (subject.accuracy >= 85) {
          strongAreas.push(subject.subject);
        }
      });
    });

    return [...new Set(strongAreas)].slice(0, 3);
  }

  private inferPreferredDifficulty(progress: UnifiedProgress, tests: AdaptiveTest[]): MissionDifficulty {
    if (tests.length === 0) {
      return 'intermediate';
    }

    const avgAccuracy = progress.overallProgress.averageAccuracy;

    if (avgAccuracy >= 85) {
      return 'advanced';
    }
    if (avgAccuracy >= 70) {
      return 'intermediate';
    }
    return 'beginner';
  }

  private extractLearningGoals(missions: any[]): string[] {
    return missions.flatMap(mission => this.extractMissionSubjects(mission)).slice(0, 5);
  }

  private extractMissionSubjects(mission: any): string[] {
    // Extract subjects from mission - placeholder implementation
    return mission.subjects || [mission.category || 'General'];
  }

  private calculateMissionAlignment(subjects: string[], missions: any[]): number {
    if (missions.length === 0) {
      return 0;
    }

    const missionSubjects = missions.flatMap(mission => this.extractMissionSubjects(mission));
    const overlap = subjects.filter(subject => missionSubjects.includes(subject)).length;

    return overlap / Math.max(subjects.length, 1);
  }

  private findRelatedMissions(subjects: string[], missions: any[]): string[] {
    return missions
      .filter(mission => {
        const missionSubjects = this.extractMissionSubjects(mission);
        return subjects.some(subject => missionSubjects.includes(subject));
      })
      .map(mission => mission.id)
      .slice(0, 3);
  }

  private estimateAccuracy(subject: string, context: RecommendationContext): number {
    if (subject === 'overall') {
      return context.userProgress.overallProgress.averageAccuracy;
    }

    // Find subject-specific accuracy
    let accuracy = 70; // Default
    Object.values(context.userProgress.trackProgress).forEach(track => {
      const subjectData = track.subjectProgress.find(s => s.subject === subject);
      if (subjectData) {
        accuracy = subjectData.accuracy;
      }
    });

    return accuracy;
  }

  private getProgressiveDifficulty(current: MissionDifficulty): MissionDifficulty {
    const progression = { beginner: 'intermediate', intermediate: 'intermediate', advanced: 'advanced' };
    return progression[current] || 'intermediate';
  }

  private getAdvancedDifficulty(current: MissionDifficulty): MissionDifficulty {
    const advancement = { beginner: 'intermediate', intermediate: 'advanced', advanced: 'expert' };
    return advancement[current] || 'advanced';
  }
}

// Export singleton instance
export const adaptiveTestingRecommendationEngine = new AdaptiveTestingRecommendationEngine();
