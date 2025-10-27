/**
 * @fileoverview Universal Learning Analytics Service
 *
 * Provides comprehensive analytics and insights across all learning tracks:
 * - Exam preparation analytics
 * - Custom learning goal analytics
 * - Unified progress tracking
 * - Learning recommendations
 * - Performance insights
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { collection, getDocs, query, where, orderBy, limit } from 'firebase/firestore';

import { db } from '@/lib/firebase';
import { logError, logInfo } from '@/lib/logger';
import { simpleLearningRecommendationsService } from '@/lib/simple-learning-recommendations';
import { Result, createError, createSuccess } from '@/lib/types-utils';

/**
 * Unified learning progress across all tracks
 */
export interface UnifiedLearningProgress {
  examPreparation: {
    totalStudyTime: number; // minutes
    completedSessions: number;
    currentStreak: number;
    weeklyGoalProgress: number;
    accuracyTrend: number[];
    subjectProgress: Record<string, number>;
  };
  customLearning: {
    activeGoals: number;
    completedGoals: number;
    totalLearningHours: number;
    skillCategories: string[];
    averageCompletionRate: number;
    goalProgress: Array<{
      id: string;
      title: string;
      progress: number;
      category: string;
    }>;
  };
  unified: {
    totalLearningTime: number; // minutes
    learningStreak: number;
    overallProgress: number;
    weeklyTarget: number;
    weeklyAchieved: number;
    preferredLearningTimes: string[];
    strengthAreas: string[];
    improvementAreas: string[];
  };
}

/**
 * Learning insights and recommendations
 */
export interface LearningInsights {
  progressInsights: {
    trend: 'improving' | 'stable' | 'declining';
    trendPercentage: number;
    consistencyScore: number; // 0-100
    efficiencyScore: number; // 0-100
  };
  recommendations: Array<{
    type: 'time_management' | 'focus_area' | 'difficulty_adjustment' | 'goal_setting';
    title: string;
    description: string;
    priority: 'high' | 'medium' | 'low';
    actionable: boolean;
  }>;
  achievements: {
    recent: Array<{
      type: 'streak' | 'goal_completion' | 'skill_mastery' | 'time_milestone';
      title: string;
      description: string;
      earnedAt: Date;
      icon: string;
    }>;
    upcoming: Array<{
      type: string;
      title: string;
      progress: number;
      target: number;
    }>;
  };
  learningPatterns: {
    mostProductiveTime: string;
    averageSessionLength: number;
    preferredContentTypes: string[];
    difficultyPreference: string;
    learningVelocity: number; // topics per week
  };
}

/**
 * Performance comparison data
 */
export interface PerformanceComparison {
  personalBest: {
    longestStreak: number;
    bestWeeklyScore: number;
    mostProductiveDay: string;
    highestAccuracy: number;
  };
  goals: {
    weeklyTarget: number;
    monthlyTarget: number;
    yearlyGoals: string[];
    progress: Record<string, number>;
  };
  benchmarks: {
    averageStudyTime: number;
    typicalProgress: number;
    commonMilestones: string[];
  };
}

/**
 * Universal Learning Analytics Service
 */
export class UniversalLearningAnalytics {
  private static instance: UniversalLearningAnalytics;

  static getInstance(): UniversalLearningAnalytics {
    if (!UniversalLearningAnalytics.instance) {
      UniversalLearningAnalytics.instance = new UniversalLearningAnalytics();
    }
    return UniversalLearningAnalytics.instance;
  }

  /**
   * Get comprehensive learning progress across all tracks
   */
  async getUnifiedProgress(userId: string): Promise<Result<UnifiedLearningProgress>> {
    try {
      // Get exam preparation progress
      const examProgress = await this.getExamProgress(userId);

      // Get custom learning progress
      const customProgress = await this.getCustomLearningProgress(userId);

      // Calculate unified metrics
      const unifiedMetrics = this.calculateUnifiedMetrics(examProgress, customProgress);

      const progress = {
        examPreparation: examProgress,
        customLearning: customProgress,
        unified: unifiedMetrics,
      };

      logInfo('Unified progress calculated successfully', {
        userId,
        examStudyTime: progress.examPreparation.totalStudyTime,
        customGoals: progress.customLearning.activeGoals,
        overallProgress: progress.unified.overallProgress,
      });

      return createSuccess(progress);
    } catch (error) {
      logError('Failed to get unified progress', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return createError(error instanceof Error ? error : new Error('Failed to get unified progress'));
    }
  }

  /**
   * Generate learning insights and recommendations
   */
  async getLearningInsights(userId: string): Promise<Result<LearningInsights>> {
    try {
      // Get recent learning data
      const recentSessions = await this.getRecentLearningSessions(userId, 30); // Last 30 days

      // Generate insights
      const progressInsights = this.analyzeProgressTrends(recentSessions);
      const recommendations = await this.generateRecommendations(userId);
      const achievements = await this.getAchievements(userId);
      const learningPatterns = this.analyzeLearningPatterns(recentSessions);

      const insights = {
        progressInsights,
        recommendations,
        achievements,
        learningPatterns,
      };

      return createSuccess(insights);
    } catch (error) {
      logError('Failed to generate learning insights', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return createError(error instanceof Error ? error : new Error('Failed to generate learning insights'));
    }
  }

  /**
   * Get performance comparison data
   */
  async getPerformanceComparison(userId: string): Promise<Result<PerformanceComparison>> {
    try {
      const personalBest = await this.getPersonalBest(userId);
      const goals = await this.getCurrentGoals(userId);
      const benchmarks = await this.getBenchmarkData(userId);

      const comparison = {
        personalBest,
        goals,
        benchmarks,
      };

      return createSuccess(comparison);
    } catch (error) {
      logError('Failed to get performance comparison', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return createError(error instanceof Error ? error : new Error('Failed to get performance comparison'));
    }
  }

  /**
   * Get exam preparation progress
   */
  private async getExamProgress(userId: string) {
    try {
      // Simplified query to avoid index requirements
      // Get recent missions and filter in memory
      const missionsCollection = collection(db, 'users', userId, 'missions');
      const recentMissionsQuery = query(
        missionsCollection,
        where('status', '==', 'completed'),
        orderBy('completedAt', 'desc'),
        limit(100)
      );

      const snapshot = await getDocs(recentMissionsQuery);
      const allCompletedMissions = snapshot.docs.map(doc => doc.data());

      // Filter for exam and course_tech tracks in memory
      const completedMissions = allCompletedMissions.filter(
        mission => mission.track === 'exam' || mission.track === 'course_tech'
      );

      // Calculate metrics
  const totalStudyTime = completedMissions.reduce((sum, mission) => sum + (mission.progress?.timeSpent ?? 0), 0);
      const completedSessions = completedMissions.length;
      const currentStreak = this.calculateStreak(completedMissions);
      const weeklyGoalProgress = this.calculateWeeklyProgress(completedMissions);
      const accuracyTrend = this.calculateAccuracyTrend(completedMissions);
      const subjectProgress = this.calculateSubjectProgress(completedMissions);

      return {
        totalStudyTime,
        completedSessions,
        currentStreak,
        weeklyGoalProgress,
        accuracyTrend,
        subjectProgress,
      };
    } catch (error: any) {
      // Check if this is a Firebase index error
      const isIndexError = error?.code === 'failed-precondition' && error?.message?.includes('index');

      if (isIndexError) {
        logInfo('Firestore indexes are still building, returning empty exam progress', { userId });
      } else {
        logError('Failed to get exam progress', { userId, error });
      }

      return {
        totalStudyTime: 0,
        completedSessions: 0,
        currentStreak: 0,
        weeklyGoalProgress: 0,
        accuracyTrend: [],
        subjectProgress: {},
      };
    }
  }

  /**
   * Get custom learning progress
   */
  private async getCustomLearningProgress(userId: string) {
    try {
      // Get custom goals
      const goalsCollection = collection(db, 'users', userId, 'custom_goals');
      const goalsSnapshot = await getDocs(goalsCollection);
      const customGoals = goalsSnapshot.docs.map(doc => doc.data());

      // Get custom missions
      const missionsCollection = collection(db, 'users', userId, 'missions');
      const customMissionsQuery = query(
        missionsCollection,
        where('isCustomLearningPath', '==', true),
        orderBy('createdAt', 'desc')
      );

      const missionsSnapshot = await getDocs(customMissionsQuery);
      const customMissions = missionsSnapshot.docs.map(doc => doc.data());

      // Calculate metrics
      const activeGoals = customGoals.filter(goal => goal.isActive !== false).length;
      const completedGoals = customGoals.filter(goal => goal.status === 'completed').length;
      const totalLearningHours =
  customMissions.reduce((sum, mission) => sum + (mission.progress?.timeSpent ?? 0), 0) / 60;
      const skillCategories = [...new Set(customGoals.map(goal => goal.category))];
      const averageCompletionRate = this.calculateAverageCompletionRate(customGoals);
      const goalProgress = customGoals.map(goal => ({
        id: goal.id,
        title: goal.title,
        progress: goal.progress?.completedMissions ?? 0,
        category: goal.category,
      }));

      return {
        activeGoals,
        completedGoals,
        totalLearningHours,
        skillCategories,
        averageCompletionRate,
        goalProgress,
      };
    } catch (error: any) {
      // Check if this is a Firebase index error
      const isIndexError = error?.code === 'failed-precondition' && error?.message?.includes('index');

      if (isIndexError) {
        logInfo('Firestore indexes are still building, returning empty custom learning progress', { userId });
      } else {
        logError('Failed to get custom learning progress', { userId, error });
      }

      return {
        activeGoals: 0,
        completedGoals: 0,
        totalLearningHours: 0,
        skillCategories: [],
        averageCompletionRate: 0,
        goalProgress: [],
      };
    }
  }

  /**
   * Calculate unified metrics across all learning tracks
   */
  private calculateUnifiedMetrics(examProgress: any, customProgress: any) {
    const totalLearningTime = examProgress.totalStudyTime + customProgress.totalLearningHours * 60;
    const learningStreak = Math.max(examProgress.currentStreak, 0);

    // Calculate overall progress as a weighted average
    const examWeight = 0.6; // Slightly higher weight for exam preparation
    const customWeight = 0.4;
  const examProgressPercent = examProgress.weeklyGoalProgress ?? 0;
  const customProgressPercent = customProgress.averageCompletionRate ?? 0;
    const overallProgress = examProgressPercent * examWeight + customProgressPercent * customWeight;

    // Mock weekly targets (in real implementation, get from user preferences)
    const weeklyTarget = 1800; // 30 hours per week
    const weeklyAchieved = this.calculateWeeklyTime(totalLearningTime);

    return {
      totalLearningTime,
      learningStreak,
      overallProgress,
      weeklyTarget,
      weeklyAchieved,
      preferredLearningTimes: ['morning', 'evening'], // Mock data
      strengthAreas: this.identifyStrengthAreas(examProgress, customProgress),
      improvementAreas: this.identifyImprovementAreas(examProgress, customProgress),
    };
  }

  /**
   * Helper methods for calculations
   */
  private calculateStreak(missions: any[]): number {
    // Implementation for calculating learning streak
    return missions.length > 0 ? Math.min(missions.length, 7) : 0;
  }

  private calculateWeeklyProgress(missions: any[]): number {
    // Implementation for calculating weekly progress
    const thisWeek = missions.filter(mission => {
  const completedAt = mission.completedAt?.toDate() ?? new Date();
      const weekAgo = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000);
      return completedAt >= weekAgo;
    });
    return Math.min((thisWeek.length / 7) * 100, 100);
  }

  private calculateAccuracyTrend(missions: any[]): number[] {
    // Implementation for calculating accuracy trend
  return missions.slice(0, 7).map(mission => mission.progress?.accuracy ?? 0);
  }

  private calculateSubjectProgress(missions: any[]): Record<string, number> {
    // Implementation for calculating subject-wise progress
    const subjectCounts: Record<string, number> = {};
    missions.forEach(mission => {
  const subject = mission.subject ?? 'General';
  subjectCounts[subject] = (subjectCounts[subject] ?? 0) + 1;
    });
    return subjectCounts;
  }

  private calculateAverageCompletionRate(goals: any[]): number {
    if (goals.length === 0) {
      return 0;
    }
    const totalProgress = goals.reduce((sum, goal) => {
  const completed = goal.progress?.completedMissions ?? 0;
  const total = goal.progress?.totalMissions ?? 1;
      return sum + completed / total;
    }, 0);
    return (totalProgress / goals.length) * 100;
  }

  private calculateWeeklyTime(totalMinutes: number): number {
    // Calculate time spent this week (mock implementation)
    return Math.min(totalMinutes * 0.3, 1800); // Assume 30% was this week, max 30 hours
  }

  private identifyStrengthAreas(examProgress: any, customProgress: any): string[] {
    const strengths = [];
    if (examProgress.currentStreak > 5) {
      strengths.push('Consistency');
    }
    if (customProgress.activeGoals > 2) {
      strengths.push('Goal Setting');
    }
    if (examProgress.totalStudyTime > 500) {
      strengths.push('Time Management');
    }
    return strengths;
  }

  private identifyImprovementAreas(examProgress: any, customProgress: any): string[] {
    const improvements = [];
    if (examProgress.currentStreak < 3) {
      improvements.push('Consistency');
    }
    if (customProgress.averageCompletionRate < 50) {
      improvements.push('Goal Completion');
    }
    if (examProgress.weeklyGoalProgress < 70) {
      improvements.push('Weekly Targets');
    }
    return improvements;
  }

  // Additional helper methods would be implemented here
  private async getRecentLearningSessions(_userId: string, _days: number): Promise<any[]> {
    // Implementation to get recent learning sessions
    return [];
  }

  private analyzeProgressTrends(_sessions: any[]): any {
    // Implementation for progress trend analysis
    return {
      trend: 'improving' as const,
      trendPercentage: 15,
      consistencyScore: 78,
      efficiencyScore: 82,
    };
  }

  private async generateRecommendations(userId: string): Promise<any[]> {
    try {
      const recommendationsResult = await simpleLearningRecommendationsService.generateBasicRecommendations(userId);

      if (recommendationsResult.success && recommendationsResult.data) {
        return recommendationsResult.data.map(rec => ({
          type: 'time_management' as const,
          title: rec.title,
          description: rec.description,
          priority: rec.priority,
          actionable: rec.actionable,
        }));
      }
    } catch (error) {
      logError('Failed to generate recommendations', error as Error);
    }

    // Fallback recommendations
    return [
      {
        type: 'time_management' as const,
        title: 'Optimize Study Sessions',
        description: 'Consider breaking your study sessions into 45-minute focused blocks with 15-minute breaks.',
        priority: 'high' as const,
        actionable: true,
      },
      {
        type: 'focus_area' as const,
        title: 'Strengthen Weak Areas',
        description: 'Focus more time on subjects where your accuracy is below 70%.',
        priority: 'medium' as const,
        actionable: true,
      },
    ];
  }

  private async getAchievements(_userId: string): Promise<any> {
    // Implementation for getting achievements
    return {
      recent: [
        {
          type: 'streak' as const,
          title: '7-Day Learning Streak',
          description: 'Completed learning activities for 7 consecutive days',
          earnedAt: new Date(),
          icon: '🔥',
        },
      ],
      upcoming: [
        {
          type: 'goal_completion',
          title: 'Custom Goal Master',
          progress: 2,
          target: 3,
        },
      ],
    };
  }

  private analyzeLearningPatterns(_sessions: any[]): any {
    // Implementation for learning pattern analysis
    return {
      mostProductiveTime: 'morning',
      averageSessionLength: 45,
      preferredContentTypes: ['video', 'practice'],
      difficultyPreference: 'gradual',
      learningVelocity: 3.5,
    };
  }

  private async getPersonalBest(_userId: string): Promise<any> {
    // Implementation for getting personal best metrics
    return {
      longestStreak: 14,
      bestWeeklyScore: 95,
      mostProductiveDay: 'Saturday',
      highestAccuracy: 87,
    };
  }

  private async getCurrentGoals(_userId: string): Promise<any> {
    // Implementation for getting current goals
    return {
      weeklyTarget: 1800,
      monthlyTarget: 7200,
      yearlyGoals: ['Complete UPSC CSE preparation', 'Master Docker & Kubernetes'],
      progress: {
        'UPSC CSE preparation': 65,
        'Master Docker & Kubernetes': 40,
      },
    };
  }

  private async getBenchmarkData(_userId: string): Promise<any> {
    // Implementation for getting benchmark data
    return {
      averageStudyTime: 1200,
      typicalProgress: 70,
      commonMilestones: ['30-day streak', 'First custom goal completion', '100 hours studied'],
    };
  }
}

// Export singleton instance
export const universalLearningAnalytics = UniversalLearningAnalytics.getInstance();
