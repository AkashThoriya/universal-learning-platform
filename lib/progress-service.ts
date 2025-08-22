/**
 * @fileoverview User Progress Service Layer
 * 
 * Production-ready progress tracking system with Firebase integration.
 * Handles unified progress tracking across exam and tech learning tracks.
 * 
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { firebaseService } from './firebase-enhanced';
import { Result, createSuccess, createError } from './types-utils';
import {
  type UnifiedProgress,
  type TrackProgress,
  type PeriodSummary,
  type Mission,
  type MissionResults
} from '@/types/mission-system';

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
      if (!progressResult.success) return progressResult;

      const progress = progressResult.data;

      // Update overall progress
      progress.overallProgress.totalMissionsCompleted += 1;
      progress.overallProgress.totalTimeInvested += results.totalTime;
      
      // Recalculate average score
      const totalScoreWeight = progress.overallProgress.totalMissionsCompleted;
      progress.overallProgress.averageScore = 
        ((progress.overallProgress.averageScore * (totalScoreWeight - 1)) + results.percentage) / totalScoreWeight;

      // Update track-specific progress
      const trackProgress = mission.track === 'exam' 
        ? progress.trackProgress.exam 
        : progress.trackProgress.course_tech;

      trackProgress.missionsCompleted += 1;
      trackProgress.timeInvested += results.totalTime;
      
      // Recalculate track average score
      trackProgress.averageScore = 
        ((trackProgress.averageScore * (trackProgress.missionsCompleted - 1)) + results.percentage) / trackProgress.missionsCompleted;

      // Update proficiency based on recent performance
      this.updateProficiencyLevel(trackProgress);

      // Update consistency rating
      this.updateConsistencyRating(progress);

      // Update streak if applicable
      this.updateStreak(progress);

      // Save updated progress
      progress.updatedAt = new Date();
      const saveResult = await firebaseService.setDocument('userProgress', userId, progress);
      
      if (!saveResult.success) return saveResult;

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
      if (!progressResult.success) return progressResult;

      const progress = progressResult.data;
      const weeklyData = progress.periodSummaries.weekly;
      
      return createSuccess(weeklyData.length > 0 ? weeklyData[0] : null);
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
      if (!progressResult.success) return progressResult;

      const progress = progressResult.data;
      const monthlyData = progress.periodSummaries.monthly;
      
      return createSuccess(monthlyData.length > 0 ? monthlyData[0] : null);
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
      if (!progressResult.success) return progressResult;

      const progress = progressResult.data;
      const trackProgress = track === 'exam' 
        ? progress.trackProgress.exam 
        : progress.trackProgress.course_tech;

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
        consistencyRating: 0
      },
      trackProgress: {
        exam: this.createDefaultTrackProgress('exam'),
        course_tech: this.createDefaultTrackProgress('course_tech')
      },
      crossTrackInsights: {
        transferableSkills: [],
        effectivePatterns: [],
        recommendedBalance: {
          exam: 60,
          course_tech: 40
        }
      },
      periodSummaries: {
        weekly: [{
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
          periodRating: 3
        }],
        monthly: [{
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
          periodRating: 3
        }]
      },
      updatedAt: now
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
        readyForAdvancement: false
      },
      topicBreakdown: []
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
    trackProgress.difficultyProgression.current = currentLevel as any;
    
    if (averageScore >= 85 && missionsCompleted >= 5) {
      const levels = ['beginner', 'intermediate', 'advanced', 'expert'];
      const currentIndex = levels.indexOf(currentLevel);
      if (currentIndex < levels.length - 1) {
        trackProgress.difficultyProgression.recommended = levels[currentIndex + 1] as any;
        trackProgress.difficultyProgression.readyForAdvancement = true;
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
    
    progress.overallProgress.consistencyRating = (streakScore * 0.6) + (volumeScore * 0.4);
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
}

// Export singleton instance
export const progressService = ProgressService.getInstance();
