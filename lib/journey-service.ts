/**
 * @fileoverview Journey Planning Service
 * Core service for managing user journeys with mission and progress integration
 */

import { v4 as uuidv4 } from 'uuid';

import { journeyFirebaseService } from '@/lib/firebase-services';
import { missionService } from '@/lib/mission-service';
import { progressService } from '@/lib/progress-service';
import {
  UserJourney,
  JourneyGoal,
  CreateJourneyRequest,
  UpdateJourneyProgressRequest,
  JourneyAnalytics,
  JourneyTemplate,
  WeeklyProgress,
  MilestoneAchievement,
} from '@/types/journey';
import { Result, createSuccess, createError } from '@/types/mission-system';

import { ExamData } from '@/data/exams-data';

/**
 * Journey Service
 * Orchestrates journey creation, progress tracking, and integration with existing systems
 */
export class JourneyService {
  private unsubscribeFunctions: Map<string, () => void> = new Map();

  /**
   * Create a new journey from a request
   */
  async createJourney(userId: string, request: CreateJourneyRequest): Promise<Result<UserJourney>> {
    try {
      const now = new Date();
      const journeyId = uuidv4();

      // Create custom goals with IDs
      const customGoals: JourneyGoal[] = request.customGoals.map(goal => ({
        ...goal,
        id: uuidv4(),
        currentValue: 0,
      }));

      // Initialize progress tracking
      const progressTracking = {
        overallCompletion: 0,
        goalCompletions: customGoals.reduce(
          (acc, goal) => {
            acc[goal.id] = 0;
            return acc;
          },
          {} as Record<string, number>
        ),
        weeklyProgress: [] as WeeklyProgress[],
        milestoneAchievements: [] as MilestoneAchievement[],
        linkedUnifiedProgress: '', // Will be set during linkage
        lastSyncedAt: now,
        autoSyncEnabled: true,
      };

      // Create journey object
      const journey: UserJourney = {
        id: journeyId,
        userId,
        title: request.title,
        description: request.description,
        examId: request.examId,
        customGoals,
        targetCompletionDate: request.targetCompletionDate,
        priority: request.priority,
        status: 'planning',
        track: request.track,
        linkedMissionTemplates: [],
        progressTracking,
        createdAt: now,
        updatedAt: now,
        createdFrom: 'manual',
      };

      // Save to Firebase
      const createResult = await journeyFirebaseService.createJourney(userId, journey);
      if (!createResult.success) {
        return createResult;
      }

      // Link with existing systems
      await this.linkJourneyToExistingSystems(journey);

      // Generate initial mission templates if exam-based
      if (journey.examId) {
        await this.generateInitialMissionTemplates(journey);
      }

      return createSuccess(journey);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create journey'));
    }
  }

  /**
   * Get journeys for a user with real-time updates
   */
  subscribeToUserJourneys(userId: string, callback: (journeys: UserJourney[]) => void): () => void {
    const unsubscribe = journeyFirebaseService.subscribeToUserJourneys(userId, callback);
    this.unsubscribeFunctions.set(userId, unsubscribe);
    return unsubscribe;
  }

  /**
   * Update journey progress
   */
  async updateJourneyProgress(updates: UpdateJourneyProgressRequest): Promise<Result<void>> {
    try {
      // Update in Firebase
      const updateResult = await journeyFirebaseService.updateJourneyProgress(updates.journeyId, updates);
      if (!updateResult.success) {
        return updateResult;
      }

      // Get updated journey
      const journeyResult = await journeyFirebaseService.getJourney(updates.journeyId);
      if (!journeyResult.success) {
        return journeyResult;
      }

      const journey = journeyResult.data;

      // Update overall completion based on goal completions
      await this.calculateOverallCompletion(journey);

      // Check for milestone achievements
      await this.checkMilestoneAchievements(journey);

      // Sync with existing progress system
      if (journey.progressTracking.autoSyncEnabled) {
        await this.syncWithProgressService(journey);
      }

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update journey progress'));
    }
  }

  /**
   * Generate mission templates based on journey goals and exam
   */
  async generateInitialMissionTemplates(journey: UserJourney): Promise<Result<void>> {
    try {
      if (!journey.examId) {
        return createSuccess(undefined);
      }

      const exam = ExamData.find(e => e.id === journey.examId);
      if (!exam) {
        return createError(new Error('Exam not found'));
      }

      const missionTemplates: string[] = [];

      // Generate missions based on journey goals
      for (const goal of journey.customGoals) {
        if (goal.category === 'knowledge' && goal.linkedSubjects.length > 0) {
          // Create subject-focused missions
          for (const subjectId of goal.linkedSubjects) {
            const subject = exam.subjects.find(s => s.id === subjectId);
            if (subject) {
              const missionResult = await missionService.createMissionTemplate({
                title: `Master ${subject.name}`,
                description: `Comprehensive study plan for ${subject.name}`,
                type: 'study',
                difficulty: 'medium',
                estimatedDuration: 60,
                subjects: [subjectId],
                track: journey.track,
                journeyId: journey.id,
              });

              if (missionResult.success) {
                missionTemplates.push(missionResult.data.id);
              }
            }
          }
        }

        if (goal.category === 'skill' && goal.unit === 'tests') {
          // Create practice test missions
          const missionResult = await missionService.createMissionTemplate({
            title: `Practice Tests - ${goal.title}`,
            description: `Practice sessions to improve ${goal.title}`,
            type: 'practice',
            difficulty: 'medium',
            estimatedDuration: 45,
            subjects: goal.linkedSubjects,
            track: journey.track,
            journeyId: journey.id,
          });

          if (missionResult.success) {
            missionTemplates.push(missionResult.data.id);
          }
        }
      }

      // Update journey with linked mission templates
      await journeyFirebaseService.updateJourney(journey.id, {
        linkedMissionTemplates: missionTemplates,
      });

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to generate mission templates'));
    }
  }

  /**
   * Get journey analytics
   */
  async getJourneyAnalytics(journeyId: string): Promise<Result<JourneyAnalytics>> {
    return journeyFirebaseService.getJourneyAnalytics(journeyId);
  }

  /**
   * Get journey templates for quick creation
   */
  async getJourneyTemplates(examId?: string): Promise<Result<JourneyTemplate[]>> {
    try {
      // For now, return static templates - in a real app this would query Firebase
      const templates: JourneyTemplate[] = [
        {
          id: 'template-1',
          title: '30-Day Sprint',
          description: 'Intensive 30-day preparation plan',
          examId,
          goals: [
            {
              title: 'Complete Core Topics',
              description: 'Master all fundamental concepts',
              targetValue: 100,
              unit: 'percentage',
              category: 'knowledge',
              isSpecific: true,
              isMeasurable: true,
              isAchievable: true,
              isRelevant: true,
              isTimeBound: true,
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              linkedSubjects: [],
              linkedTopics: [],
              autoUpdateFrom: 'missions',
            },
            {
              title: 'Practice Tests',
              description: 'Complete practice examinations',
              targetValue: 10,
              unit: 'tests',
              category: 'skill',
              isSpecific: true,
              isMeasurable: true,
              isAchievable: true,
              isRelevant: true,
              isTimeBound: true,
              deadline: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
              linkedSubjects: [],
              linkedTopics: [],
              autoUpdateFrom: 'tests',
            },
          ],
          track: 'certification',
          tags: ['intensive', 'short-term'],
          createdBy: 'system',
          createdAt: new Date(),
        },
        {
          id: 'template-2',
          title: '90-Day Comprehensive',
          description: 'Complete 3-month preparation program',
          examId,
          goals: [
            {
              title: 'Study Hours',
              description: 'Dedicated study time',
              targetValue: 120,
              unit: 'hours',
              category: 'consistency',
              isSpecific: true,
              isMeasurable: true,
              isAchievable: true,
              isRelevant: true,
              isTimeBound: true,
              deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              linkedSubjects: [],
              linkedTopics: [],
              autoUpdateFrom: 'mixed',
            },
            {
              title: 'Topic Mastery',
              description: 'Complete understanding of all topics',
              targetValue: 100,
              unit: 'percentage',
              category: 'knowledge',
              isSpecific: true,
              isMeasurable: true,
              isAchievable: true,
              isRelevant: true,
              isTimeBound: true,
              deadline: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
              linkedSubjects: [],
              linkedTopics: [],
              autoUpdateFrom: 'missions',
            },
          ],
          track: 'certification',
          tags: ['comprehensive', 'long-term'],
          createdBy: 'system',
          createdAt: new Date(),
        },
      ];

      return createSuccess(templates);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get journey templates'));
    }
  }

  /**
   * Create journey from template
   */
  async createJourneyFromTemplate(
    userId: string,
    templateId: string,
    customizations: {
      title?: string;
      targetCompletionDate?: Date;
      priority?: UserJourney['priority'];
      examId?: string;
    }
  ): Promise<Result<UserJourney>> {
    try {
      const templatesResult = await this.getJourneyTemplates(customizations.examId);
      if (!templatesResult.success) {
        return templatesResult;
      }

      const template = templatesResult.data.find(t => t.id === templateId);
      if (!template) {
        return createError(new Error('Template not found'));
      }

      const request: CreateJourneyRequest = {
        title: customizations.title || template.title,
        description: template.description,
        examId: customizations.examId || template.examId,
        customGoals: template.goals,
        targetCompletionDate: customizations.targetCompletionDate || new Date(Date.now() + 90 * 24 * 60 * 60 * 1000),
        priority: customizations.priority || 'medium',
        track: template.track,
      };

      const journey = await this.createJourney(userId, request);
      if (journey.success) {
        // Update creation source
        await journeyFirebaseService.updateJourney(journey.data.id, {
          createdFrom: 'recommendation',
        });
      }

      return journey;
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create journey from template'));
    }
  }

  /**
   * Update journey status
   */
  async updateJourneyStatus(journeyId: string, status: UserJourney['status']): Promise<Result<void>> {
    try {
      await journeyFirebaseService.updateJourney(journeyId, { status });

      // If activating, ensure integration with mission system
      if (status === 'active') {
        const journeyResult = await journeyFirebaseService.getJourney(journeyId);
        if (journeyResult.success) {
          await this.activateJourneyMissions(journeyResult.data);
        }
      }

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update journey status'));
    }
  }

  /**
   * Private Methods
   */

  /**
   * Link journey to existing systems (progress, missions)
   */
  private async linkJourneyToExistingSystems(journey: UserJourney): Promise<void> {
    try {
      // Link to progress service
      const progressResult = await progressService.linkJourney(journey.userId, journey.id);
      if (progressResult.success) {
        await journeyFirebaseService.updateJourney(journey.id, {
          'progressTracking.linkedUnifiedProgress': progressResult.data.progressId,
        });
      }
    } catch (error) {
      console.error('Error linking journey to existing systems:', error);
    }
  }

  /**
   * Calculate overall completion based on goal completions
   */
  private async calculateOverallCompletion(journey: UserJourney): Promise<void> {
    try {
      const goalCompletions = Object.values(journey.progressTracking.goalCompletions);
      const overallCompletion =
        goalCompletions.length > 0
          ? goalCompletions.reduce((sum, completion) => sum + completion, 0) / goalCompletions.length
          : 0;

      await journeyFirebaseService.updateJourney(journey.id, {
        'progressTracking.overallCompletion': Math.round(overallCompletion),
      });
    } catch (error) {
      console.error('Error calculating overall completion:', error);
    }
  }

  /**
   * Check for milestone achievements
   */
  private async checkMilestoneAchievements(journey: UserJourney): Promise<void> {
    try {
      const completedGoals = journey.customGoals.filter(
        goal => (journey.progressTracking.goalCompletions[goal.id] || 0) >= goal.targetValue
      );

      const existingMilestones = journey.progressTracking.milestoneAchievements;

      for (const goal of completedGoals) {
        const alreadyAchieved = existingMilestones.some(m => m.relatedGoals.includes(goal.id));

        if (!alreadyAchieved) {
          const milestone: MilestoneAchievement = {
            id: uuidv4(),
            title: `Goal Completed: ${goal.title}`,
            description: `You've successfully completed the goal "${goal.title}"!`,
            achievedAt: new Date(),
            relatedGoals: [goal.id],
            celebrationMessage: `🎉 Congratulations! You've mastered ${goal.title}. Keep up the excellent work!`,
          };

          await journeyFirebaseService.addMilestoneAchievement(journey.id, milestone);
        }
      }

      // Check for overall journey milestones
      const { overallCompletion } = journey.progressTracking;
      const milestoneThresholds = [25, 50, 75, 100];

      for (const threshold of milestoneThresholds) {
        if (overallCompletion >= threshold) {
          const milestoneExists = existingMilestones.some(m => m.title.includes(`${threshold}%`));

          if (!milestoneExists) {
            const milestone: MilestoneAchievement = {
              id: uuidv4(),
              title: `${threshold}% Journey Complete`,
              description: `You've completed ${threshold}% of your learning journey!`,
              achievedAt: new Date(),
              relatedGoals: journey.customGoals.map(g => g.id),
              celebrationMessage: this.getCelebrationMessage(threshold),
            };

            await journeyFirebaseService.addMilestoneAchievement(journey.id, milestone);
          }
        }
      }
    } catch (error) {
      console.error('Error checking milestone achievements:', error);
    }
  }

  /**
   * Sync journey progress with existing progress service
   */
  private async syncWithProgressService(journey: UserJourney): Promise<void> {
    try {
      const progressUpdate = {
        journeyId: journey.id,
        overallCompletion: journey.progressTracking.overallCompletion,
        goalCompletions: journey.progressTracking.goalCompletions,
        lastActivity: new Date(),
      };

      await progressService.updateJourneyProgress(journey.userId, progressUpdate);
    } catch (error) {
      console.error('Error syncing with progress service:', error);
    }
  }

  /**
   * Activate journey missions when journey becomes active
   */
  private async activateJourneyMissions(journey: UserJourney): Promise<void> {
    try {
      for (const templateId of journey.linkedMissionTemplates) {
        await missionService.activateMissionFromTemplate(journey.userId, templateId);
      }
    } catch (error) {
      console.error('Error activating journey missions:', error);
    }
  }

  /**
   * Get celebration message for milestone percentage
   */
  private getCelebrationMessage(percentage: number): string {
    switch (percentage) {
      case 25:
        return "🌱 Great start! You're building momentum and making real progress. Keep going!";
      case 50:
        return "⭐ Halfway there! Your dedication is paying off. You're doing amazing!";
      case 75:
        return "🚀 Outstanding progress! You're in the final stretch. Push through to the finish!";
      case 100:
        return "🏆 Journey Complete! You've achieved something incredible. Celebrate this amazing accomplishment!";
      default:
        return '🎯 Milestone achieved! Your consistent effort is leading to great results!';
    }
  }

  /**
   * Cleanup method to unsubscribe from all real-time listeners
   */
  cleanup(): void {
    this.unsubscribeFunctions.forEach(unsubscribe => unsubscribe());
    this.unsubscribeFunctions.clear();
  }
}

// Create and export singleton instance
export const journeyService = new JourneyService();
