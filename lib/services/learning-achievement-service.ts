/**
 * @fileoverview Learning Achievement Service
 *
 * Tracks and manages learning achievements across goal preparation and custom learning goals.
 * Provides gamification and motivation features for the Universal Learning Platform.
 *
 * @author Universal Learning Platform Team
 * @version 1.0.0
 */

import { collection, addDoc, getDocs, query, orderBy, Timestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase/firebase';
import { logError, logInfo } from '@/lib/utils/logger';

// Achievement types and categories
export type AchievementType =
  | 'streak'
  | 'goal_completion'
  | 'skill_mastery'
  | 'time_milestone'
  | 'consistency'
  | 'progress'
  | 'special';

export type AchievementRarity = 'common' | 'rare' | 'epic' | 'legendary';

// Achievement interface
export interface LearningAchievement {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  points: number;
  earnedAt: Date;
  category: 'exam_prep' | 'custom_learning' | 'universal';
  metadata?: Record<string, any>;
}

// Achievement definition for unlocking
export interface AchievementDefinition {
  id: string;
  type: AchievementType;
  title: string;
  description: string;
  icon: string;
  rarity: AchievementRarity;
  points: number;
  category: 'exam_prep' | 'custom_learning' | 'universal';
  criteria: {
    metric: string;
    operator: 'gte' | 'lte' | 'eq' | 'gt' | 'lt';
    value: number | string;
    timeframe?: 'daily' | 'weekly' | 'monthly' | 'all_time';
  }[];
}

// User progress for achievement tracking
export interface UserAchievementProgress {
  userId: string;
  totalPoints: number;
  achievementCount: number;
  currentStreak: number;
  longestStreak: number;
  lastActivityDate: Date;
  categoryProgress: Record<
    string,
    {
      points: number;
      count: number;
      lastEarned: Date;
    }
  >;
}

/**
 * Learning Achievement Service
 */
class LearningAchievementService {
  private static instance: LearningAchievementService;
  private achievementDefinitions: AchievementDefinition[] = [];

  public static getInstance(): LearningAchievementService {
    if (!LearningAchievementService.instance) {
      LearningAchievementService.instance = new LearningAchievementService();
    }
    return LearningAchievementService.instance;
  }

  constructor() {
    this.initializeAchievementDefinitions();
  }

  /**
   * Initialize predefined achievement definitions
   */
  private initializeAchievementDefinitions() {
    this.achievementDefinitions = [
      // Streak Achievements
      {
        id: 'first_steps',
        type: 'streak',
        title: 'First Steps',
        description: 'Complete your first learning session',
        icon: '👣',
        rarity: 'common',
        points: 10,
        category: 'universal',
        criteria: [{ metric: 'sessions_completed', operator: 'gte', value: 1 }],
      },
      {
        id: 'week_warrior',
        type: 'streak',
        title: 'Week Warrior',
        description: 'Learn for 7 consecutive days',
        icon: '🔥',
        rarity: 'rare',
        points: 50,
        category: 'universal',
        criteria: [{ metric: 'learning_streak', operator: 'gte', value: 7 }],
      },
      {
        id: 'month_master',
        type: 'streak',
        title: 'Month Master',
        description: 'Maintain a 30-day learning streak',
        icon: '🏆',
        rarity: 'epic',
        points: 200,
        category: 'universal',
        criteria: [{ metric: 'learning_streak', operator: 'gte', value: 30 }],
      },

      // Goal Completion Achievements
      {
        id: 'goal_getter',
        type: 'goal_completion',
        title: 'Goal Getter',
        description: 'Complete your first custom learning goal',
        icon: '🎯',
        rarity: 'common',
        points: 25,
        category: 'custom_learning',
        criteria: [{ metric: 'goals_completed', operator: 'gte', value: 1 }],
      },
      {
        id: 'goal_crusher',
        type: 'goal_completion',
        title: 'Goal Crusher',
        description: 'Complete 5 custom learning goals',
        icon: '💪',
        rarity: 'rare',
        points: 100,
        category: 'custom_learning',
        criteria: [{ metric: 'goals_completed', operator: 'gte', value: 5 }],
      },

      // Time Milestone Achievements
      {
        id: 'hour_hero',
        type: 'time_milestone',
        title: 'Hour Hero',
        description: 'Complete 10 hours of learning',
        icon: '⏰',
        rarity: 'common',
        points: 30,
        category: 'universal',
        criteria: [
          { metric: 'total_learning_time', operator: 'gte', value: 600 }, // 10 hours in minutes
        ],
      },
      {
        id: 'time_titan',
        type: 'time_milestone',
        title: 'Time Titan',
        description: 'Complete 100 hours of learning',
        icon: '⚡',
        rarity: 'epic',
        points: 250,
        category: 'universal',
        criteria: [
          { metric: 'total_learning_time', operator: 'gte', value: 6000 }, // 100 hours in minutes
        ],
      },

      // Consistency Achievements
      {
        id: 'consistency_champion',
        type: 'consistency',
        title: 'Consistency Champion',
        description: 'Maintain 90% weekly learning consistency',
        icon: '📈',
        rarity: 'rare',
        points: 75,
        category: 'universal',
        criteria: [{ metric: 'weekly_consistency', operator: 'gte', value: 90 }],
      },

      // Goal Preparation Achievements
      {
        id: 'exam_explorer',
        type: 'progress',
        title: 'Exam Explorer',
        description: 'Complete your first exam practice session',
        icon: '📚',
        rarity: 'common',
        points: 15,
        category: 'exam_prep',
        criteria: [{ metric: 'exam_sessions_completed', operator: 'gte', value: 1 }],
      },
      {
        id: 'practice_perfectionist',
        type: 'progress',
        title: 'Practice Perfectionist',
        description: 'Achieve 90% accuracy in practice tests',
        icon: '🎯',
        rarity: 'epic',
        points: 150,
        category: 'exam_prep',
        criteria: [{ metric: 'practice_accuracy', operator: 'gte', value: 90 }],
      },

      // Special Achievements
      {
        id: 'early_bird',
        type: 'special',
        title: 'Early Bird',
        description: 'Complete a learning session before 8 AM',
        icon: '🌅',
        rarity: 'rare',
        points: 40,
        category: 'universal',
        criteria: [{ metric: 'early_session_completed', operator: 'eq', value: 1 }],
      },
      {
        id: 'night_owl',
        type: 'special',
        title: 'Night Owl',
        description: 'Complete a learning session after 10 PM',
        icon: '🦉',
        rarity: 'rare',
        points: 40,
        category: 'universal',
        criteria: [{ metric: 'late_session_completed', operator: 'eq', value: 1 }],
      },
    ];
  }

  /**
   * Get user's earned achievements
   */
  async getUserAchievements(userId: string): Promise<{
    success: boolean;
    data?: LearningAchievement[];
    error?: Error;
  }> {
    try {
      logInfo('Fetching user achievements', { userId });

      const achievementsCollection = collection(db, 'users', userId, 'achievements');
      const achievementsQuery = query(achievementsCollection, orderBy('earnedAt', 'desc'));

      const snapshot = await getDocs(achievementsQuery);
      const achievements: LearningAchievement[] = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          type: data.type,
          title: data.title,
          description: data.description,
          icon: data.icon,
          rarity: data.rarity,
          points: data.points,
          earnedAt: data.earnedAt.toDate(),
          category: data.category,
          metadata: data.metadata ?? {},
        };
      });

      return {
        success: true,
        data: achievements,
      };
    } catch (error) {
      logError('Failed to fetch user achievements', error as Error);
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Check for new achievements based on user activity
   */
  async checkForNewAchievements(
    userId: string,
    userMetrics: Record<string, any>
  ): Promise<{
    success: boolean;
    data?: LearningAchievement[];
    error?: Error;
  }> {
    try {
      logInfo('Checking for new achievements', { userId, metricsCount: Object.keys(userMetrics).length });

      const earnedAchievements = await this.getUserAchievements(userId);
      if (!earnedAchievements.success || !earnedAchievements.data) {
        return { success: false, error: new Error('Failed to fetch existing achievements') };
      }

      const earnedIds = new Set(earnedAchievements.data.map(a => a.id));
      const newAchievements: LearningAchievement[] = [];

      // Check each achievement definition
      for (const definition of this.achievementDefinitions) {
        if (earnedIds.has(definition.id)) {
          continue; // Already earned
        }

        // Check if criteria are met
        const criteriaEt = definition.criteria.every(criterion => {
          const metricValue = userMetrics[criterion.metric];
          if (metricValue === undefined) {
            return false;
          }

          switch (criterion.operator) {
            case 'gte':
              return metricValue >= criterion.value;
            case 'lte':
              return metricValue <= criterion.value;
            case 'gt':
              return metricValue > criterion.value;
            case 'lt':
              return metricValue < criterion.value;
            case 'eq':
              return metricValue === criterion.value;
            default:
              return false;
          }
        });

        if (criteriaEt) {
          // Award the achievement
          const achievement: LearningAchievement = {
            id: definition.id,
            type: definition.type,
            title: definition.title,
            description: definition.description,
            icon: definition.icon,
            rarity: definition.rarity,
            points: definition.points,
            earnedAt: new Date(),
            category: definition.category,
            metadata: { triggeredBy: userMetrics },
          };

          await this.awardAchievement(userId, achievement);
          newAchievements.push(achievement);
        }
      }

      logInfo('New achievements awarded', { userId, count: newAchievements.length });

      return {
        success: true,
        data: newAchievements,
      };
    } catch (error) {
      logError('Failed to check for new achievements', error as Error);
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Award an achievement to a user
   */
  private async awardAchievement(userId: string, achievement: LearningAchievement): Promise<void> {
    try {
      const achievementsCollection = collection(db, 'users', userId, 'achievements');

      await addDoc(achievementsCollection, {
        type: achievement.type,
        title: achievement.title,
        description: achievement.description,
        icon: achievement.icon,
        rarity: achievement.rarity,
        points: achievement.points,
        earnedAt: Timestamp.fromDate(achievement.earnedAt),
        category: achievement.category,
        metadata: achievement.metadata ?? {},
      });

      logInfo('Achievement awarded', {
        userId,
        achievementId: achievement.id,
        title: achievement.title,
        points: achievement.points,
      });
    } catch (error) {
      logError('Failed to award achievement', error as Error);
      throw error;
    }
  }

  /**
   * Get user's achievement progress summary
   */
  async getUserAchievementProgress(userId: string): Promise<{
    success: boolean;
    data?: UserAchievementProgress;
    error?: Error;
  }> {
    try {
      const achievementsResult = await this.getUserAchievements(userId);
      if (!achievementsResult.success || !achievementsResult.data) {
        return { success: false, error: new Error('Failed to fetch user achievements') };
      }

      const achievements = achievementsResult.data;
      const totalPoints = achievements.reduce((sum, a) => sum + a.points, 0);
      const achievementCount = achievements.length;

      // Calculate category progress
      const categoryProgress: Record<string, any> = {};
      for (const achievement of achievements) {
        categoryProgress[achievement.category] ??= {
          points: 0,
          count: 0,
          lastEarned: achievement.earnedAt,
        };
        categoryProgress[achievement.category].points += achievement.points;
        categoryProgress[achievement.category].count += 1;

        if (achievement.earnedAt > categoryProgress[achievement.category].lastEarned) {
          categoryProgress[achievement.category].lastEarned = achievement.earnedAt;
        }
      }

      const progress: UserAchievementProgress = {
        userId,
        totalPoints,
        achievementCount,
        currentStreak: 0, // Would need additional calculation based on recent activity
        longestStreak: 0, // Would need historical data analysis
        lastActivityDate: achievements.length > 0 ? (achievements[0]?.earnedAt ?? new Date()) : new Date(),
        categoryProgress,
      };

      return {
        success: true,
        data: progress,
      };
    } catch (error) {
      logError('Failed to get user achievement progress', error as Error);
      return {
        success: false,
        error: error as Error,
      };
    }
  }

  /**
   * Get upcoming achievements (achievements user is close to earning)
   */
  async getUpcomingAchievements(
    userId: string,
    userMetrics: Record<string, any>
  ): Promise<{
    success: boolean;
    data?: Array<{
      definition: AchievementDefinition;
      progress: number;
      target: number;
      progressPercentage: number;
    }>;
    error?: Error;
  }> {
    try {
      const earnedAchievements = await this.getUserAchievements(userId);
      if (!earnedAchievements.success || !earnedAchievements.data) {
        return { success: false, error: new Error('Failed to fetch existing achievements') };
      }

      const earnedIds = new Set(earnedAchievements.data.map(a => a.id));
      const upcoming = [];

      for (const definition of this.achievementDefinitions) {
        if (earnedIds.has(definition.id)) {
          continue; // Already earned
        }

        // For simple achievements, check progress towards the main criterion
        const mainCriterion = definition.criteria[0];
        if (mainCriterion && userMetrics[mainCriterion.metric] !== undefined) {
          const progress = userMetrics[mainCriterion.metric];
          const target = mainCriterion.value as number;
          const progressPercentage = Math.min((progress / target) * 100, 100);

          // Only include if user has made some progress (>10%) but hasn't achieved it yet
          if (progressPercentage > 10 && progressPercentage < 100) {
            upcoming.push({
              definition,
              progress,
              target,
              progressPercentage,
            });
          }
        }
      }

      // Sort by progress percentage (closest to completion first)
      upcoming.sort((a, b) => b.progressPercentage - a.progressPercentage);

      return {
        success: true,
        data: upcoming.slice(0, 5), // Return top 5 upcoming achievements
      };
    } catch (error) {
      logError('Failed to get upcoming achievements', error as Error);
      return {
        success: false,
        error: error as Error,
      };
    }
  }
}

/**
 * Singleton instance of the Learning Achievement Service
 */
export const learningAchievementService = LearningAchievementService.getInstance();
