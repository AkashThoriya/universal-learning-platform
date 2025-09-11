/**
 * @fileoverview User Progress Service Layer
 *
 * Production-ready progress tracking system with Firebase integration.
 * Handles unified progress tracking across exam and tech learning tracks.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  type UnifiedProgress,
  type TrackProgress,
  type PeriodSummary,
  type Mission,
  type MissionResults,
  type MissionDifficulty,
} from '@/types/mission-system';

import { firebaseService } from './firebase-services';
import { Result, createSuccess, createError } from './types-utils';

/**
 * Progress service for tracking and aggregating user learning progress
 */
export class ProgressService {
  private static instance: ProgressService;

  static getInstance(): ProgressService {
    if (!ProgressService.instance) {
      ProgressService.instance = new ProgressService();
    }
    return ProgressService.instance;
  }

  /**
   * Get unified progress for a user
   */
  async getUserProgress(userId: string): Promise<Result<UnifiedProgress>> {
    try {
      // Get existing progress or create default
      const progressResult = await firebaseService.getDocument<UnifiedProgress>('userProgress', userId);

      if (progressResult.success && progressResult.data) {
        return createSuccess(progressResult.data);
      }

      // Create default progress if not exists
      const defaultProgress = this.createDefaultProgress(userId);
      const saveResult = await firebaseService.setDocument('userProgress', userId, defaultProgress);

      if (!saveResult.success) {
        return saveResult;
      }

      return createSuccess(defaultProgress);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get user progress'));
    }
  }

  /**
   * Update progress after mission completion
   */
  async updateProgressAfterMission(
    userId: string,
    mission: Mission,
    results: MissionResults
  ): Promise<Result<UnifiedProgress>> {
    try {
      const progressResult = await this.getUserProgress(userId);
      if (!progressResult.success) {
        return progressResult;
      }

      const progress = progressResult.data;

      // Update overall progress
      progress.overallProgress.totalMissionsCompleted += 1;
      progress.overallProgress.totalTimeInvested += results.totalTime;

      // Recalculate average score
      const totalScoreWeight = progress.overallProgress.totalMissionsCompleted;
      progress.overallProgress.averageScore =
        (progress.overallProgress.averageScore * (totalScoreWeight - 1) + results.percentage) / totalScoreWeight;

      // Update track-specific progress
      const trackProgress = mission.track === 'exam' ? progress.trackProgress.exam : progress.trackProgress.course_tech;

      trackProgress.missionsCompleted += 1;
      trackProgress.timeInvested += results.totalTime;

      // Recalculate track average score
      trackProgress.averageScore =
        (trackProgress.averageScore * (trackProgress.missionsCompleted - 1) + results.percentage) /
        trackProgress.missionsCompleted;

      // Update proficiency based on recent performance
      this.updateProficiencyLevel(trackProgress);

      // Update consistency rating
      this.updateConsistencyRating(progress);

      // Update streak if applicable
      this.updateStreak(progress);

      // Save updated progress
      progress.updatedAt = new Date();
      const saveResult = await firebaseService.setDocument('userProgress', userId, progress);

      if (!saveResult.success) {
        return saveResult;
      }

      return createSuccess(progress);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update progress'));
    }
  }

  /**
   * Get weekly summary for user
   */
  async getWeeklySummary(userId: string): Promise<Result<PeriodSummary | null>> {
    try {
      const progressResult = await this.getUserProgress(userId);
      if (!progressResult.success) {
        return progressResult;
      }

      const progress = progressResult.data;
      const weeklyData = progress.periodSummaries.weekly;

      if (!weeklyData || weeklyData.length === 0) {
        return createSuccess(null);
      }

      const firstWeekly = weeklyData[0];
      return createSuccess(firstWeekly ?? null);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get weekly summary'));
    }
  }

  /**
   * Get monthly summary for user
   */
  async getMonthlySummary(userId: string): Promise<Result<PeriodSummary | null>> {
    try {
      const progressResult = await this.getUserProgress(userId);
      if (!progressResult.success) {
        return progressResult;
      }

      const progress = progressResult.data;
      const monthlyData = progress.periodSummaries.monthly;

      if (!monthlyData || monthlyData.length === 0) {
        return createSuccess(null);
      }

      const firstMonthly = monthlyData[0];
      return createSuccess(firstMonthly ?? null);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get monthly summary'));
    }
  }

  /**
   * Update skill mastery for a track
   */
  async updateSkillMastery(
    userId: string,
    track: 'exam' | 'course_tech',
    skill: string,
    proficiency: number
  ): Promise<Result<void>> {
    try {
      const progressResult = await this.getUserProgress(userId);
      if (!progressResult.success) {
        return progressResult;
      }

      const progress = progressResult.data;
      const trackProgress = track === 'exam' ? progress.trackProgress.exam : progress.trackProgress.course_tech;

      // Add to mastered skills if proficiency is high enough
      if (proficiency >= 80 && !trackProgress.masteredSkills.includes(skill)) {
        trackProgress.masteredSkills.push(skill);

        // Remove from skills in progress
        trackProgress.skillsInProgress = trackProgress.skillsInProgress.filter(s => s !== skill);
      } else if (proficiency >= 40 && !trackProgress.skillsInProgress.includes(skill)) {
        trackProgress.skillsInProgress.push(skill);
      }

      // Save updated progress
      progress.updatedAt = new Date();
      const saveResult = await firebaseService.setDocument('userProgress', userId, progress);

      return saveResult;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update skill mastery'));
    }
  }

  /**
   * Create default progress for new user
   */
  private createDefaultProgress(userId: string): UnifiedProgress {
    const now = new Date();
    const weekStart = new Date(now);
    weekStart.setDate(now.getDate() - now.getDay());

    const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

    return {
      userId,
      overallProgress: {
        totalMissionsCompleted: 0,
        totalTimeInvested: 0,
        averageScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        consistencyRating: 0,
      },
      trackProgress: {
        exam: this.createDefaultTrackProgress('exam'),
        course_tech: this.createDefaultTrackProgress('course_tech'),
      },
      crossTrackInsights: {
        transferableSkills: [],
        effectivePatterns: [],
        recommendedBalance: {
          exam: 60,
          course_tech: 40,
        },
      },
      periodSummaries: {
        weekly: [
          {
            period: 'week',
            startDate: weekStart,
            endDate: new Date(),
            missionsCompleted: 0,
            averageScore: 0,
            timeInvested: 0,
            goalsAchieved: 0,
            goalsSet: 3,
            achievements: [],
            improvements: [],
            periodRating: 3,
          },
        ],
        monthly: [
          {
            period: 'month',
            startDate: monthStart,
            endDate: new Date(),
            missionsCompleted: 0,
            averageScore: 0,
            timeInvested: 0,
            goalsAchieved: 0,
            goalsSet: 5,
            achievements: [],
            improvements: [],
            periodRating: 3,
          },
        ],
      },
      updatedAt: now,
    };
  }

  /**
   * Create default track progress
   */
  private createDefaultTrackProgress(track: 'exam' | 'course_tech'): TrackProgress {
    return {
      track,
      missionsCompleted: 0,
      averageScore: 0,
      timeInvested: 0,
      proficiencyLevel: 'beginner',
      masteredSkills: [],
      skillsInProgress: [],
      performanceTrend: 'stable',
      difficultyProgression: {
        current: 'beginner',
        recommended: 'beginner',
        readyForAdvancement: false,
      },
      topicBreakdown: [],
    };
  }

  /**
   * Update proficiency level based on performance
   */
  private updateProficiencyLevel(trackProgress: TrackProgress): void {
    const { missionsCompleted, averageScore } = trackProgress;

    if (missionsCompleted >= 50 && averageScore >= 90) {
      trackProgress.proficiencyLevel = 'expert';
    } else if (missionsCompleted >= 25 && averageScore >= 80) {
      trackProgress.proficiencyLevel = 'advanced';
    } else if (missionsCompleted >= 10 && averageScore >= 70) {
      trackProgress.proficiencyLevel = 'intermediate';
    } else {
      trackProgress.proficiencyLevel = 'beginner';
    }

    // Update difficulty progression
    const currentLevel = trackProgress.proficiencyLevel;
    trackProgress.difficultyProgression.current = currentLevel as MissionDifficulty;

    if (averageScore >= 85 && missionsCompleted >= 5) {
      const levels: MissionDifficulty[] = ['beginner', 'intermediate', 'advanced', 'expert'];
      const currentIndex = levels.indexOf(currentLevel as MissionDifficulty);
      if (currentIndex >= 0 && currentIndex < levels.length - 1) {
        const nextLevel = levels[currentIndex + 1];
        if (nextLevel) {
          trackProgress.difficultyProgression.recommended = nextLevel;
          trackProgress.difficultyProgression.readyForAdvancement = true;
        }
      }
    }
  }

  /**
   * Update consistency rating
   */
  private updateConsistencyRating(progress: UnifiedProgress): void {
    const { totalMissionsCompleted, currentStreak } = progress.overallProgress;

    // Calculate consistency based on streak and total missions
    const streakScore = Math.min(currentStreak / 30, 1); // Max streak contribution
    const volumeScore = Math.min(totalMissionsCompleted / 100, 1); // Max volume contribution

    progress.overallProgress.consistencyRating = streakScore * 0.6 + volumeScore * 0.4;
  }

  /**
   * Update learning streak
   */
  private updateStreak(progress: UnifiedProgress): void {
    // This would typically check if user completed a mission today
    // For now, we'll increment streak on mission completion
    progress.overallProgress.currentStreak += 1;

    if (progress.overallProgress.currentStreak > progress.overallProgress.longestStreak) {
      progress.overallProgress.longestStreak = progress.overallProgress.currentStreak;
    }
  }

  /**
   * Update progress based on adaptive test results
   */
  async updateProgressFromAdaptiveTest(
    userId: string,
    testResults: import('@/types/adaptive-testing').TestPerformance,
    testMetadata: { subjects: string[]; track: import('@/types/mission-system').LearningTrack; algorithmType: string }
  ): Promise<Result<void>> {
    try {
      const progressResult = await this.getUserProgress(userId);
      if (!progressResult.success) {
        return progressResult;
      }

      const progress = progressResult.data;

      // Update track-specific progress
      const trackKey = testMetadata.track === 'exam' ? 'exam' : 'course_tech';
      if (progress.trackProgress[trackKey]) {
        // Calculate weighted average with existing progress
        const existingScore = progress.trackProgress[trackKey].averageScore;
        const testScore = testResults.accuracy;
        const testWeight = 0.3; // 30% weight for test results

        const newAverageScore = existingScore * (1 - testWeight) + testScore * testWeight;

        progress.trackProgress[trackKey] = {
          ...progress.trackProgress[trackKey],
          averageScore: newAverageScore,
          testsCompleted: (progress.trackProgress[trackKey] as any).testsCompleted + 1 || 1,
          lastTestDate: new Date(),
          adaptiveTestMetrics: {
            abilityEstimate: testResults.finalAbilityEstimate,
            confidenceInterval: testResults.abilityConfidenceInterval,
            standardError: testResults.standardError,
          },
        };
      }

      // Update subject-specific progress
      for (const [subjectId, subjectPerf] of Object.entries(testResults.subjectPerformance)) {
        if (!progress.subjectProgress) {
          progress.subjectProgress = {};
        }

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
        const testSubjectScore = (subjectPerf as any).accuracy;

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
      progress.overallProgress = {
        ...progress.overallProgress,
        totalTestsCompleted: (progress.overallProgress as any).totalTestsCompleted + 1 || 1,
        lastActivity: new Date(),
        adaptiveTestingLevel: this.calculateAdaptiveTestingLevel(testResults),
      };

      // Save updated progress
      progress.updatedAt = new Date();
      const updateResult = await firebaseService.setDocument('userProgress', userId, progress);
      return updateResult;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update progress from adaptive test'));
    }
  }

  /**
   * Get adaptive testing recommendations based on progress
   */
  async getAdaptiveTestRecommendations(
    userId: string
  ): Promise<Result<import('@/types/adaptive-testing').TestRecommendation[]>> {
    try {
      const progressResult = await this.getUserProgress(userId);
      if (!progressResult.success) {
        return progressResult;
      }

      const progress = progressResult.data;
      const recommendations: import('@/types/adaptive-testing').TestRecommendation[] = [];

      // Analyze weak areas for testing opportunities
      if (progress.subjectProgress) {
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
                'Adaptive testing can provide targeted improvement',
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
      }

      // Add general assessment if no specific weaknesses
      if (recommendations.length === 0) {
        const overallScore = progress.subjectProgress
          ? Object.values(progress.subjectProgress).reduce((sum, subj) => sum + subj.averageScore, 0) /
            Object.values(progress.subjectProgress).length
          : 0;

        recommendations.push({
          testId: `comprehensive_assessment_${Date.now()}`,
          title: 'Comprehensive Knowledge Assessment',
          description: 'Evaluate your overall progress and identify growth opportunities',
          confidence: 0.6,
          reasons: [
            `Overall performance: ${overallScore.toFixed(1)}%`,
            'Regular assessment maintains learning momentum',
            'Adaptive testing provides personalized insights',
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

  /**
   * Get comprehensive analytics including adaptive testing metrics
   */
  async getEnhancedAnalytics(userId: string): Promise<Result<any>> {
    try {
      const progressResult = await this.getUserProgress(userId);
      if (!progressResult.success) {
        return progressResult;
      }

      const progress = progressResult.data;

      // Calculate enhanced analytics
      const analytics = {
        overallProgress: progress.overallProgress,
        trackProgress: progress.trackProgress,
        adaptiveTestingInsights: {
          totalTestsCompleted: (progress.overallProgress as any).totalTestsCompleted || 0,
          adaptiveTestingLevel: (progress.overallProgress as any).adaptiveTestingLevel || 'Beginner',
          strongSubjects: progress.subjectProgress
            ? Object.entries(progress.subjectProgress)
                .filter(([_, subj]) => subj.averageScore > 85)
                .map(([subjectId, _]) => subjectId)
            : [],
          weakSubjects: progress.subjectProgress
            ? Object.entries(progress.subjectProgress)
                .filter(([_, subj]) => subj.averageScore < 70)
                .map(([subjectId, _]) => subjectId)
            : [],
          recommendedTestFrequency: this.calculateRecommendedTestFrequency(progress),
        },
        recommendations: await this.getAdaptiveTestRecommendations(userId),
      };

      return createSuccess(analytics);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get enhanced analytics'));
    }
  }

  /**
   * Update subject proficiency based on adaptive test results
   */
  async updateSubjectProficiency(
    userId: string,
    subjectId: string,
    abilityEstimate: number,
    confidence: number
  ): Promise<Result<void>> {
    try {
      const progressResult = await this.getUserProgress(userId);
      if (!progressResult.success) {
        return progressResult;
      }

      const progress = progressResult.data;

      if (!progress.subjectProgress) {
        progress.subjectProgress = {};
      }

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

      const subjectProgress = progress.subjectProgress[subjectId];

      // Update proficiency based on ability estimate
      const proficiencyScore = Math.max(0, Math.min(100, (abilityEstimate + 2) * 25)); // Map -2 to +2 ability to 0-100 score
      const weightedScore = subjectProgress.averageScore * 0.7 + proficiencyScore * 0.3; // 30% weight for new test

      subjectProgress.averageScore = weightedScore;
      subjectProgress.lastStudied = new Date();

      // Add adaptive testing metadata
      (subjectProgress as any).adaptiveMetrics = {
        abilityEstimate,
        confidence,
        lastTestDate: new Date(),
        proficiencyTrend: weightedScore > subjectProgress.averageScore ? 'improving' : 'stable',
      };

      // Save updated progress
      progress.updatedAt = new Date();
      const updateResult = await firebaseService.setDocument('userProgress', userId, progress);
      return updateResult;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update subject proficiency'));
    }
  }

  private calculateAdaptiveTestingLevel(testResults: import('@/types/adaptive-testing').TestPerformance): string {
    const ability = testResults.finalAbilityEstimate;
    const { accuracy } = testResults;

    if (ability > 0.8 && accuracy > 90) {
      return 'Expert';
    }
    if (ability > 0.5 && accuracy > 80) {
      return 'Advanced';
    }
    if (ability > 0.2 && accuracy > 70) {
      return 'Intermediate';
    }
    if (ability > -0.2 && accuracy > 60) {
      return 'Developing';
    }
    return 'Beginner';
  }

  private calculateRecommendedTestFrequency(progress: UnifiedProgress): number {
    // Calculate recommended test frequency in days based on user's learning pattern
    const overallScore = progress.trackProgress.exam.averageScore;
    const consistency = progress.overallProgress.consistencyRating;

    // More frequent testing for lower scores or lower consistency
    if (overallScore < 60 || consistency < 0.5) {
      return 2; // Every 2 days
    } else if (overallScore < 80 || consistency < 0.7) {
      return 3; // Every 3 days
    }
    return 5; // Every 5 days
  }

  /**
   * Link a journey to user progress
   */
  async linkJourney(userId: string, journeyId: string): Promise<Result<{ progressId: string }>> {
    try {
      const progressResult = await this.getUserProgress(userId);
      if (!progressResult.success) {
        return progressResult;
      }

      const progress = progressResult.data;

      // Initialize journey tracking if not exists
      if (!(progress as any).linkedJourneys) {
        (progress as any).linkedJourneys = [];
      }

      // Add journey ID if not already linked
      const linkedJourneys = (progress as any).linkedJourneys as string[];
      if (!linkedJourneys.includes(journeyId)) {
        linkedJourneys.push(journeyId);
      }

      // Initialize journey-specific progress tracking
      if (!(progress as any).journeyProgress) {
        (progress as any).journeyProgress = {};
      }

      (progress as any).journeyProgress[journeyId] = {
        linkedAt: new Date(),
        lastSync: new Date(),
        contributedHours: 0,
        contributedMissions: 0,
        goalContributions: {},
      };

      progress.updatedAt = new Date();

      const saveResult = await firebaseService.setDocument('userProgress', userId, progress);
      if (!saveResult.success) {
        return saveResult;
      }

      return createSuccess({ progressId: userId });
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to link journey'));
    }
  }

  /**
   * Update journey progress from progress service
   */
  async updateJourneyProgress(
    userId: string,
    update: {
      journeyId: string;
      overallCompletion: number;
      goalCompletions: Record<string, number>;
      lastActivity: Date;
    }
  ): Promise<Result<void>> {
    try {
      const progressResult = await this.getUserProgress(userId);
      if (!progressResult.success) {
        return progressResult;
      }

      const progress = progressResult.data;

      // Ensure journey progress tracking exists
      if (!(progress as any).journeyProgress) {
        (progress as any).journeyProgress = {};
      }

      if (!(progress as any).journeyProgress[update.journeyId]) {
        (progress as any).journeyProgress[update.journeyId] = {
          linkedAt: new Date(),
          lastSync: new Date(),
          contributedHours: 0,
          contributedMissions: 0,
          goalContributions: {},
        };
      }

      const journeyProgress = (progress as any).journeyProgress[update.journeyId];

      // Update journey-specific tracking
      journeyProgress.lastSync = update.lastActivity;
      journeyProgress.overallCompletion = update.overallCompletion;
      journeyProgress.goalCompletions = update.goalCompletions;

      // Update overall progress metrics based on journey contributions
      const journeyWeight = Math.min(0.3, update.overallCompletion / 100); // Max 30% influence from any single journey

      // Blend journey progress into overall progress
      const currentOverall = progress.overallProgress.overallCompletionPercentage || 0;
      progress.overallProgress.overallCompletionPercentage =
        currentOverall * (1 - journeyWeight) + update.overallCompletion * journeyWeight;

      progress.updatedAt = new Date();

      const saveResult = await firebaseService.setDocument('userProgress', userId, progress);
      return saveResult;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update journey progress'));
    }
  }
}

// Export singleton instance
export const progressService = ProgressService.getInstance();
