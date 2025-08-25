/**
 * @fileoverview Achievement System Service Layer
 *
 * Production-ready achievement management system with Firebase integration.
 * Handles achievement definitions, user achievement tracking, and progress updates.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { type UserPersonaType } from '@/types/exam';
import {
  type Achievement,
  type UserAchievement,
  type MissionResults,
  type UnifiedProgress
} from '@/types/mission-system';

import { firebaseService } from './firebase-services';
import { Result, createSuccess, createError } from './types-utils';

type AchievementCategory = Achievement['category'];

/**
 * Achievement service for managing user achievements and progress
 */
export class AchievementService {
  private static instance: AchievementService;

  static getInstance(): AchievementService {
    if (!AchievementService.instance) {
      AchievementService.instance = new AchievementService();
    }
    return AchievementService.instance;
  }

  /**
   * Get all available achievements
   */
  async getAchievements(category?: AchievementCategory): Promise<Result<Achievement[]>> {
    try {
      const queryOptions: any = {
        where: [{ field: 'isActive', operator: '==', value: true }],
        orderBy: [
          { field: 'category', direction: 'asc' as const },
          { field: 'points', direction: 'asc' as const }
        ]
      };

      if (category) {
        queryOptions.where.push({ field: 'category', operator: '==', value: category });
      }

      const result = await firebaseService.queryCollection<Achievement>('achievements', queryOptions);
      return result;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get achievements'));
    }
  }

  /**
   * Get user's achievements
   */
  async getUserAchievements(userId: string): Promise<Result<UserAchievement[]>> {
    try {
      const result = await firebaseService.queryCollection<UserAchievement>(
        `users/${userId}/achievements`,
        {
          orderBy: [{ field: 'unlockedAt', direction: 'desc' as const }]
        }
      );
      return result;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get user achievements'));
    }
  }

  /**
   * Check and unlock achievements after mission completion
   */
  async checkMissionAchievements(
    userId: string,
    missionResults: MissionResults,
    userProgress: UnifiedProgress
  ): Promise<Result<UserAchievement[]>> {
    try {
      const achievementsResult = await this.getAchievements();
      if (!achievementsResult.success) { return achievementsResult; }

      const allAchievements = achievementsResult.data;
      const userAchievementsResult = await this.getUserAchievements(userId);
      if (!userAchievementsResult.success) { return userAchievementsResult; }

      const unlockedAchievementIds = userAchievementsResult.data
        .filter(ua => ua.isUnlocked)
        .map(ua => ua.achievementId);

      const newlyUnlocked: UserAchievement[] = [];

      for (const achievement of allAchievements) {
        if (unlockedAchievementIds.includes(achievement.id)) { continue; }

        const isUnlocked = this.checkAchievementRequirements(
          achievement,
          userProgress,
          missionResults
        );

        if (isUnlocked) {
          const userAchievement: UserAchievement = {
            userId,
            achievementId: achievement.id,
            progress: 100,
            target: 100,
            isUnlocked: true,
            unlockedAt: new Date(),
            isDisplayed: false,
            requirementProgress: achievement.requirements.map((req, index) => ({
              requirementIndex: index,
              currentValue: req.target,
              targetValue: req.target,
              isCompleted: true
            })),
            createdAt: new Date(),
            updatedAt: new Date()
          };

          const saveResult = await firebaseService.setDocument(
            `users/${userId}/achievements`,
            achievement.id,
            userAchievement
          );

          if (saveResult.success) {
            newlyUnlocked.push(userAchievement);
          }
        }
      }

      return createSuccess(newlyUnlocked);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to check achievements'));
    }
  }

  /**
   * Mark new achievements as viewed
   */
  async markAchievementsAsViewed(userId: string, achievementIds: string[]): Promise<Result<void>> {
    try {
      for (const achievementId of achievementIds) {
        const updateResult = await firebaseService.updateDocument(
          `users/${userId}/achievements`,
          achievementId,
          { isDisplayed: true }
        );

        if (!updateResult.success) {
          return updateResult;
        }
      }

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update achievements'));
    }
  }

  /**
   * Get achievement progress for display
   */
  async getAchievementProgress(
    userId: string,
    achievementId: string
  ): Promise<Result<{ achievement: Achievement; userAchievement: UserAchievement | null }>> {
    try {
      // Get achievement definition
      const achievementResult = await firebaseService.getDocument<Achievement>('achievements', achievementId);
      if (!achievementResult.success) {
        return createError(new Error('Achievement not found'));
      }

      const achievement = achievementResult.data;
      if (!achievement) {
        return createError(new Error('Achievement not found'));
      }

      // Get user's progress on this achievement
      const userAchievementResult = await firebaseService.getDocument<UserAchievement>(
        `users/${userId}/achievements`,
        achievementId
      );

      const userAchievement = userAchievementResult.success ? userAchievementResult.data : null;

      return createSuccess({ achievement, userAchievement });
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get achievement progress'));
    }
  }

  /**
   * Check if achievement requirements are met
   */
  private checkAchievementRequirements(
    achievement: Achievement,
    userProgress: UnifiedProgress,
    missionResults?: MissionResults
  ): boolean {
    for (const requirement of achievement.requirements) {
      switch (requirement.type) {
        case 'missions_completed':
          if (userProgress.overallProgress.totalMissionsCompleted < requirement.target) {
            return false;
          }
          break;

        case 'streak':
          if (userProgress.overallProgress.currentStreak < requirement.target) {
            return false;
          }
          break;

        case 'score_threshold':
          if (userProgress.overallProgress.averageScore < requirement.target) {
            return false;
          }
          break;

        case 'time_spent':
          if (userProgress.overallProgress.totalTimeInvested < requirement.target) {
            return false;
          }
          break;

        case 'skill_mastery':
          // Check if user has mastered required skills
          const requiredSkills = requirement.conditions?.subjects || [];
          const examSkills = userProgress.trackProgress.exam.masteredSkills;
          const techSkills = userProgress.trackProgress.course_tech.masteredSkills;
          const allMasteredSkills = [...examSkills, ...techSkills];

          const hasMasteredSkills = requiredSkills.every(skill =>
            allMasteredSkills.includes(skill)
          );

          if (!hasMasteredSkills) {
            return false;
          }
          break;

        case 'custom':
          // For perfect score achievements
          if (requirement.customValidator === 'perfect_score') {
            if (!missionResults || missionResults.percentage < 100) {
              return false;
            }
          }
          break;

        default:
          // Unknown requirement type, consider not met
          return false;
      }
    }

    return true;
  }

  /**
   * Initialize default achievements for the system
   */
  async initializeSystemAchievements(): Promise<Result<void>> {
    try {
      const defaultAchievements = this.getDefaultAchievements();

      for (const achievement of defaultAchievements) {
        const saveResult = await firebaseService.setDocument(
          'achievements',
          achievement.id,
          achievement
        );

        if (!saveResult.success) {
          return saveResult;
        }
      }

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to initialize achievements'));
    }
  }

  /**
   * Get default achievement definitions
   */
  private getDefaultAchievements(): Achievement[] {
    const defaultPersonaVariations: Record<UserPersonaType, {
      name?: string;
      description?: string;
      requirements?: Partial<any>[];
    }> = {
      student: {},
      working_professional: {},
      freelancer: {}
    };

    return [
      {
        id: 'first_mission',
        name: 'First Steps',
        description: 'Complete your first mission',
        category: 'completion',
        track: 'both',
        rarity: 'common',
        points: 100,
        requirements: [
          {
            type: 'missions_completed',
            target: 1,
            conditions: {}
          }
        ],
        badge: {
          iconUrl: '/badges/first-mission.png',
          color: '#3B82F6'
        },
        personaVariations: {
          student: {
            description: 'Complete your first academic mission'
          },
          working_professional: {
            description: 'Complete your first professional development mission'
          },
          freelancer: {
            description: 'Complete your first skill-building mission'
          }
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        category: 'consistency',
        track: 'both',
        rarity: 'common',
        points: 250,
        requirements: [
          {
            type: 'streak',
            target: 7,
            conditions: {}
          }
        ],
        badge: {
          iconUrl: '/badges/week-warrior.png',
          color: '#F59E0B'
        },
        personaVariations: defaultPersonaVariations,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'perfectionist',
        name: 'Perfectionist',
        description: 'Achieve 100% score on any mission',
        category: 'performance',
        track: 'both',
        rarity: 'uncommon',
        points: 300,
        requirements: [
          {
            type: 'custom',
            target: 1,
            conditions: {},
            customValidator: 'perfect_score'
          }
        ],
        badge: {
          iconUrl: '/badges/perfectionist.png',
          color: '#10B981'
        },
        personaVariations: defaultPersonaVariations,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'time_investor',
        name: 'Time Investor',
        description: 'Invest 100 hours in learning',
        category: 'milestone',
        track: 'both',
        rarity: 'epic',
        points: 1000,
        requirements: [
          {
            type: 'time_spent',
            target: 6000, // 100 hours in minutes
            conditions: {}
          }
        ],
        badge: {
          iconUrl: '/badges/time-investor.png',
          color: '#8B5CF6'
        },
        personaVariations: defaultPersonaVariations,
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'excellence_achiever',
        name: 'Excellence Achiever',
        description: 'Maintain 90%+ average score across 20+ missions',
        category: 'performance',
        track: 'both',
        rarity: 'legendary',
        points: 1500,
        requirements: [
          {
            type: 'missions_completed',
            target: 20,
            conditions: {}
          },
          {
            type: 'score_threshold',
            target: 90,
            conditions: {}
          }
        ],
        badge: {
          iconUrl: '/badges/excellence-achiever.png',
          color: '#F59E0B'
        },
        personaVariations: defaultPersonaVariations,
        isActive: true,
        createdAt: new Date()
      }
    ];
  }
}

// Export singleton instance
export const achievementService = AchievementService.getInstance();
