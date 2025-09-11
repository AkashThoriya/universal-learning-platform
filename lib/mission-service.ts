/**
 * @fileoverview Mission System Service Layer
 *
 * Comprehensive service layer for Week 4-5 Adaptive Mission System.
 * Handles mission generation, scheduling, progress tracking, and achievements.
 *
 * Features:
 * - Persona-aware mission generation
 * - Adaptive difficulty adjustment
 * - Cross-track progress synchronization
 * - Achievement system management
 * - Analytics and insights generation
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { type UserPersonaType } from '@/types/exam';
import {
  type Mission,
  type MissionTemplate,
  type MissionCycleConfig as _MissionCycleConfig,
  type MissionGenerationRequest,
  type MissionGenerationResult,
  type MissionSchedulingRequest as _MissionSchedulingRequest,
  type MissionSchedulingResult as _MissionSchedulingResult,
  type UnifiedProgress,
  type Achievement as _Achievement,
  type UserAchievement as _UserAchievement,
  type MissionAnalytics,
  type MissionApiResponse,
  type PaginatedMissionResponse as _PaginatedMissionResponse,
  type MissionPaginationOptions as _MissionPaginationOptions,
  type LearningTrack,
  type MissionFrequency,
  type MissionDifficulty as _MissionDifficulty,
  type MissionStatus as _MissionStatus,
  type PersonaMissionOptimizations,
  type ExamMissionContent,
  type TechMissionContent,
  type MissionResults,
  type MissionProgress,
  type MissionContent,
} from '@/types/mission-system';

// =====================================================
// MISSION TEMPLATES SERVICE
// =====================================================

/**
 * Service for managing mission templates
 */
export class MissionTemplateService {
  private static instance: MissionTemplateService;

  static getInstance(): MissionTemplateService {
    if (!MissionTemplateService.instance) {
      MissionTemplateService.instance = new MissionTemplateService();
    }
    return MissionTemplateService.instance;
  }

  /**
   * Initialize default templates for a specific user
   */
  async initializeDefaultTemplates(): Promise<void> {
    // This method is now user-specific and called per user
    // Implementation moved to seedUserTemplates
  }

  /**
   * Seed default templates for a user if they don't have any
   */
  async seedUserTemplates(userId: string): Promise<void> {
    try {
      const { missionFirebaseService } = await import('@/lib/firebase-services');
      const existingTemplates = await missionFirebaseService.getTemplates(userId);

      if (existingTemplates.success && existingTemplates.data.length === 0) {
        const defaultTemplates = this.getDefaultTemplates();

        for (const template of defaultTemplates) {
          await missionFirebaseService.saveTemplate(userId, template);
        }
      }
    } catch (error) {
      console.error('Failed to seed user templates:', error);
    }
  }

  /**
   * Get default mission templates for both tracks
   */
  private getDefaultTemplates(): MissionTemplate[] {
    return [
      // Exam Track Templates
      {
        id: 'exam_daily_mock_questions',
        track: 'exam',
        frequency: 'daily',
        name: 'Daily Mock Questions',
        description: 'Quick daily practice with 10-15 questions from recent exam patterns',
        supportedDifficulties: ['beginner', 'intermediate', 'advanced'],
        estimatedDuration: 15,
        subjectAreas: ['general_studies', 'mathematics', 'reasoning', 'english'],
        supportedPersonas: ['student', 'working_professional', 'freelancer'],
        contentStructure: {
          type: 'mock_questions',
          config: {
            questionCount: 12,
            timeLimit: 15,
            questionTypes: ['multiple_choice', 'numerical'],
            subjectWeights: {
              general_studies: 0.4,
              mathematics: 0.3,
              reasoning: 0.2,
              english: 0.1,
            },
            focusTopics: [],
            includeExplanations: true,
            passingThreshold: 60,
          } as ExamMissionContent,
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 40,
          scoringMethod: 'percentage',
          weights: {
            accuracy: 0.7,
            speed: 0.3,
          },
          bonusPoints: {
            earlyCompletion: 5,
            perfectScore: 10,
          },
        },
        createdAt: new Date(),
      },
      {
        id: 'exam_weekly_revision_cycle',
        track: 'exam',
        frequency: 'weekly',
        name: 'Weekly Revision Cycle',
        description: 'Comprehensive weekly revision covering all topics studied in the past week',
        supportedDifficulties: ['intermediate', 'advanced'],
        estimatedDuration: 60,
        subjectAreas: ['all'],
        supportedPersonas: ['student', 'working_professional', 'freelancer'],
        contentStructure: {
          type: 'revision_cycle',
          config: {
            questionCount: 50,
            timeLimit: 60,
            questionTypes: ['multiple_choice', 'short_answer', 'numerical'],
            subjectWeights: {},
            focusTopics: [],
            includeExplanations: true,
            passingThreshold: 65,
          } as ExamMissionContent,
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 50,
          scoringMethod: 'percentage',
          weights: {
            accuracy: 0.6,
            speed: 0.2,
            efficiency: 0.2,
          },
          bonusPoints: {
            perfectScore: 15,
          },
        },
        createdAt: new Date(),
      },
      {
        id: 'exam_monthly_full_test',
        track: 'exam',
        frequency: 'monthly',
        name: 'Monthly Full Test',
        description: 'Complete mock exam simulation with real exam conditions',
        supportedDifficulties: ['intermediate', 'advanced', 'expert'],
        estimatedDuration: 120,
        subjectAreas: ['all'],
        supportedPersonas: ['student', 'working_professional', 'freelancer'],
        contentStructure: {
          type: 'full_test',
          config: {
            questionCount: 100,
            timeLimit: 120,
            questionTypes: ['multiple_choice', 'short_answer', 'essay'],
            subjectWeights: {},
            focusTopics: [],
            includeExplanations: true,
            passingThreshold: 70,
          } as ExamMissionContent,
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 60,
          scoringMethod: 'percentage',
          weights: {
            accuracy: 0.8,
            speed: 0.2,
          },
          bonusPoints: {
            perfectScore: 20,
          },
        },
        createdAt: new Date(),
      },
      // Tech Track Templates
      {
        id: 'tech_daily_coding_challenge',
        track: 'course_tech',
        frequency: 'daily',
        name: 'Daily Coding Challenge',
        description: 'Quick algorithm or data structure problem to keep coding skills sharp',
        supportedDifficulties: ['beginner', 'intermediate', 'advanced'],
        estimatedDuration: 20,
        subjectAreas: ['algorithms', 'data_structures', 'programming'],
        supportedPersonas: ['student', 'working_professional', 'freelancer'],
        contentStructure: {
          type: 'coding_challenge',
          config: {
            challengeType: 'algorithm',
            supportedLanguages: ['javascript', 'python', 'java', 'cpp'],
            complexity: 'simple',
            requiredSkills: ['problem_solving', 'algorithmic_thinking'],
            deliverables: ['code', 'tests'],
            timeLimit: 20,
            successCriteria: ['correct_output', 'efficient_solution'],
            allowedResources: true,
          } as TechMissionContent,
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 60,
          scoringMethod: 'rubric',
          weights: {
            accuracy: 0.4,
            efficiency: 0.3,
            quality: 0.3,
          },
          bonusPoints: {
            earlyCompletion: 10,
            innovation: 15,
          },
        },
        createdAt: new Date(),
      },
      {
        id: 'tech_weekly_assignment',
        track: 'course_tech',
        frequency: 'weekly',
        name: 'Weekly Assignment',
        description: 'More complex assignment involving multiple concepts and real-world application',
        supportedDifficulties: ['intermediate', 'advanced'],
        estimatedDuration: 90,
        subjectAreas: ['web_development', 'system_design', 'databases'],
        supportedPersonas: ['student', 'working_professional', 'freelancer'],
        contentStructure: {
          type: 'assignment',
          config: {
            challengeType: 'implementation',
            supportedLanguages: ['javascript', 'python', 'java'],
            complexity: 'moderate',
            requiredSkills: ['system_design', 'implementation', 'testing'],
            deliverables: ['code', 'documentation', 'tests'],
            timeLimit: 90,
            successCriteria: ['functional_requirements', 'code_quality', 'documentation'],
            allowedResources: true,
          } as TechMissionContent,
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 70,
          scoringMethod: 'rubric',
          weights: {
            accuracy: 0.3,
            quality: 0.4,
            creativity: 0.3,
          },
          bonusPoints: {
            innovation: 20,
          },
        },
        createdAt: new Date(),
      },
      {
        id: 'tech_monthly_project',
        track: 'course_tech',
        frequency: 'monthly',
        name: 'Monthly Project',
        description: 'Comprehensive project demonstrating mastery of multiple technologies',
        supportedDifficulties: ['advanced', 'expert'],
        estimatedDuration: 240,
        subjectAreas: ['full_stack', 'system_architecture', 'deployment'],
        supportedPersonas: ['working_professional', 'freelancer'],
        contentStructure: {
          type: 'project',
          config: {
            challengeType: 'system_design',
            supportedLanguages: ['javascript', 'python', 'java'],
            complexity: 'advanced',
            requiredSkills: ['architecture', 'implementation', 'deployment', 'testing'],
            deliverables: ['code', 'documentation', 'tests', 'deployment'],
            timeLimit: 240,
            successCriteria: ['functionality', 'scalability', 'maintainability'],
            allowedResources: true,
          } as TechMissionContent,
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 75,
          scoringMethod: 'rubric',
          weights: {
            accuracy: 0.25,
            quality: 0.35,
            creativity: 0.25,
            efficiency: 0.15,
          },
          bonusPoints: {
            innovation: 25,
          },
        },
        createdAt: new Date(),
      },
    ];
  }

  /**
   * Get templates for specific track and frequency
   */
  async getTemplatesForTrack(
    userId: string,
    track: LearningTrack,
    frequency?: MissionFrequency,
    persona?: UserPersonaType
  ): Promise<MissionTemplate[]> {
    try {
      const { missionFirebaseService } = await import('@/lib/firebase-services');
      const result = await missionFirebaseService.getTemplates(userId, track);

      if (!result.success) {
        throw new Error(result.error?.message ?? 'Failed to get templates');
      }

      let templates = result.data as MissionTemplate[];

      // Apply filters
      if (frequency) {
        templates = templates.filter(t => t.frequency === frequency);
      }

      if (persona) {
        templates = templates.filter(t => t.supportedPersonas.length === 0 || t.supportedPersonas.includes(persona));
      }

      return templates;
    } catch (error) {
      console.error('Failed to get templates for track:', error);
      return [];
    }
  }

  /**
   * Get template by ID
   */
  async getTemplate(userId: string, templateId: string): Promise<MissionTemplate | null> {
    try {
      const { missionFirebaseService } = await import('@/lib/firebase-services');
      const result = await missionFirebaseService.getTemplates(userId);

      if (!result.success) {
        return null;
      }

      const templates = result.data as MissionTemplate[];
      return templates.find(t => t.id === templateId) ?? null;
    } catch (error) {
      console.error('Failed to get template:', error);
      return null;
    }
  }

  /**
   * Add or update template
   */
  async saveTemplate(userId: string, template: MissionTemplate): Promise<MissionApiResponse<MissionTemplate>> {
    try {
      const { missionFirebaseService } = await import('@/lib/firebase-services');
      const result = await missionFirebaseService.saveTemplate(userId, template);

      if (result.success) {
        return {
          success: true,
          data: template,
          timestamp: new Date(),
        };
      }
      return {
        success: false,
        error: result.error?.message ?? 'Failed to save template',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save template',
        timestamp: new Date(),
      };
    }
  }
}

// =====================================================
// MISSION GENERATION SERVICE
// =====================================================

/**
 * Service for generating personalized missions
 */
export class MissionGenerationService {
  private static instance: MissionGenerationService;
  private templateService = MissionTemplateService.getInstance();

  static getInstance(): MissionGenerationService {
    if (!MissionGenerationService.instance) {
      MissionGenerationService.instance = new MissionGenerationService();
    }
    return MissionGenerationService.instance;
  }

  /**
   * Generate a personalized mission for a user
   */
  async generateMission(request: MissionGenerationRequest): Promise<MissionGenerationResult> {
    const startTime = Date.now();

    try {
      // Ensure user has templates seeded
      await this.templateService.seedUserTemplates(request.userId);

      // Get suitable templates from Firebase
      const templates = await this.templateService.getTemplatesForTrack(
        request.userId,
        request.track,
        request.frequency
      );

      if (templates.length === 0) {
        return {
          success: false,
          error: `No templates found for ${request.track} ${request.frequency} missions`,
          metadata: {
            templateUsed: '',
            difficultyAdjustments: [],
            personaOptimizations: [],
            generationTime: Date.now() - startTime,
          },
        };
      }

      // Select best template based on user history and preferences
      const selectedTemplate = await this.selectBestTemplate(templates, request);

      // Generate mission content
      const mission = await this.createMissionFromTemplate(selectedTemplate, request);

      // Save the generated mission to Firebase
      const { missionFirebaseService } = await import('@/lib/firebase-services');
      const saveResult = await missionFirebaseService.saveActiveMission(request.userId, mission);

      if (!saveResult.success) {
        throw new Error(saveResult.error?.message ?? 'Failed to save generated mission');
      }

      return {
        success: true,
        mission,
        metadata: {
          templateUsed: selectedTemplate.id,
          difficultyAdjustments: [],
          personaOptimizations: [],
          generationTime: Date.now() - startTime,
        },
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mission generation failed',
        metadata: {
          templateUsed: '',
          difficultyAdjustments: [],
          personaOptimizations: [],
          generationTime: Date.now() - startTime,
        },
      };
    }
  }

  /**
   * Select the best template for the user
   */
  private async selectBestTemplate(
    templates: MissionTemplate[],
    request: MissionGenerationRequest
  ): Promise<MissionTemplate> {
    // For now, use simple selection logic
    // In production, this would consider user performance history,
    // preference patterns, and adaptive difficulty algorithms

    const filteredTemplates = templates.filter(template => {
      if (request.difficulty && !template.supportedDifficulties.includes(request.difficulty)) {
        return false;
      }
      return true;
    });

    const selectedTemplate = filteredTemplates[0] ?? templates[0];

    if (!selectedTemplate) {
      throw new Error('No suitable templates available for mission generation');
    }

    return selectedTemplate;
  }

  /**
   * Create mission instance from template
   */
  private async createMissionFromTemplate(
    template: MissionTemplate,
    request: MissionGenerationRequest
  ): Promise<Mission> {
    const now = new Date();
    const missionId = `mission_${request.userId}_${Date.now()}`;

    // Calculate deadline based on frequency
    const deadline = this.calculateDeadline(template.frequency, request.schedulingOptions?.deadline);

    // Get persona optimizations (mock implementation)
    const personaOptimizations = this.getPersonaOptimizations('working_professional');

    // Generate mission content based on template
    const content = await this.generateMissionContent(template, request);

    const mission: Mission = {
      id: missionId,
      userId: request.userId,
      templateId: template.id,
      track: template.track,
      frequency: template.frequency,
      title: template.name,
      description: template.description,
      difficulty: request.difficulty ?? 'intermediate',
      estimatedDuration: request.durationOverride ?? template.estimatedDuration,
      content,
      status: 'not_started',
      scheduledAt: request.schedulingOptions?.preferredStartTime ?? now,
      deadline,
      progress: {
        completionPercentage: 0,
        currentStep: 0,
        totalSteps: this.calculateTotalSteps(content),
        timeSpent: 0,
        stepProgress: [],
        submissions: [],
        metrics: {
          accuracy: 0,
          speed: 0,
          consistency: 0,
          engagement: 0,
        },
      },
      personaOptimizations,
      createdAt: now,
      updatedAt: now,
    };

    return mission;
  }

  /**
   * Generate mission content based on template
   */
  private async generateMissionContent(
    template: MissionTemplate,
    _request: MissionGenerationRequest
  ): Promise<MissionContent> {
    // Mock content generation - in production this would:
    // 1. Query question/problem databases
    // 2. Apply difficulty filters
    // 3. Ensure topic diversity
    // 4. Apply persona-specific adaptations

    if (template.track === 'exam') {
      return {
        type: template.contentStructure.type,
        examContent: {
          questions: [], // Would be populated with actual questions
          timeLimit: template.estimatedDuration,
          passingScore: 60,
          instructions: `Complete this ${template.name} within ${template.estimatedDuration} minutes`,
        },
      };
    }
    return {
      type: template.contentStructure.type,
      techContent: {
        challenge: {
          id: `challenge_${Date.now()}`,
          title: template.name,
          problemStatement: template.description,
          type: 'algorithm',
          examples: [],
          constraints: [],
          starterCode: {},
          testCases: [],
          hints: [],
        },
        requirements: [],
        deliverables: [],
        resources: [],
      },
    };
  }

  /**
   * Calculate mission deadline
   */
  private calculateDeadline(frequency: MissionFrequency, customDeadline?: Date): Date {
    if (customDeadline) {
      return customDeadline;
    }

    const now = new Date();
    switch (frequency) {
      case 'daily':
        return new Date(now.getTime() + 24 * 60 * 60 * 1000); // 1 day
      case 'weekly':
        return new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000); // 1 week
      case 'monthly':
        return new Date(now.getTime() + 30 * 24 * 60 * 60 * 1000); // 1 month
      default:
        return new Date(now.getTime() + 24 * 60 * 60 * 1000);
    }
  }

  /**
   * Get persona-specific optimizations
   */
  private getPersonaOptimizations(persona: UserPersonaType): PersonaMissionOptimizations {
    const baseOptimizations: Record<UserPersonaType, PersonaMissionOptimizations> = {
      student: {
        persona: 'student',
        timeAdjustments: {
          preferredDuration: 30,
          maxDuration: 60,
          breakIntervals: [15, 30],
        },
        contentAdaptations: {
          explanationLevel: 'detailed',
          exampleComplexity: 'simple',
          contextType: 'academic',
        },
        motivationStrategies: {
          rewardTypes: ['points', 'badges', 'progress'],
          feedbackFrequency: 'step_by_step',
          challengePreference: 'increasing',
        },
        progressVisualization: {
          chartTypes: ['bar', 'line'],
          detailLevel: 'detailed',
          comparisons: ['self', 'peers'],
        },
      },
      working_professional: {
        persona: 'working_professional',
        timeAdjustments: {
          preferredDuration: 20,
          maxDuration: 30,
          breakIntervals: [10, 20],
        },
        contentAdaptations: {
          explanationLevel: 'brief',
          exampleComplexity: 'realistic',
          contextType: 'professional',
        },
        motivationStrategies: {
          rewardTypes: ['certificates', 'progress'],
          feedbackFrequency: 'end_of_mission',
          challengePreference: 'steady',
        },
        progressVisualization: {
          chartTypes: ['gauge', 'line'],
          detailLevel: 'summary',
          comparisons: ['self', 'benchmarks'],
        },
      },
      freelancer: {
        persona: 'freelancer',
        timeAdjustments: {
          preferredDuration: 25,
          maxDuration: 45,
          breakIntervals: [15, 25],
        },
        contentAdaptations: {
          explanationLevel: 'comprehensive',
          exampleComplexity: 'advanced',
          contextType: 'practical',
        },
        motivationStrategies: {
          rewardTypes: ['certificates', 'social'],
          feedbackFrequency: 'immediate',
          challengePreference: 'variable',
        },
        progressVisualization: {
          chartTypes: ['pie', 'heatmap'],
          detailLevel: 'comprehensive',
          comparisons: ['self', 'goals'],
        },
      },
    };

    return baseOptimizations[persona];
  }

  /**
   * Calculate total steps for mission content
   */
  private calculateTotalSteps(content: MissionContent): number {
    if (content.examContent) {
      return content.examContent.questions?.length ?? 10;
    } else if (content.techContent) {
      return content.techContent.deliverables?.length ?? 3;
    }
    return 1;
  }
}

// =====================================================
// MISSION PROGRESS SERVICE
// =====================================================

/**
 * Service for tracking mission progress and results
 */
export class MissionProgressService {
  private static instance: MissionProgressService;

  static getInstance(): MissionProgressService {
    if (!MissionProgressService.instance) {
      MissionProgressService.instance = new MissionProgressService();
    }
    return MissionProgressService.instance;
  }

  /**
   * Update mission progress
   */
  async updateProgress(
    _missionId: string,
    _progress: Partial<MissionProgress>
  ): Promise<MissionApiResponse<MissionProgress>> {
    try {
      // const { missionFirebaseService } = await import('@/lib/firebase-services');

      // Extract userId from mission ID or get it from context
      // For now, we'll need to pass userId as parameter or get it from mission
      // This is a design consideration for the mission ID structure

      // Temporary implementation - in production, include userId in method signature
      throw new Error('UpdateProgress requires userId parameter - method signature needs update');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update progress',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Update mission progress with userId
   */
  async updateProgressWithUser(
    userId: string,
    missionId: string,
    progress: Partial<MissionProgress>
  ): Promise<MissionApiResponse<MissionProgress>> {
    try {
      const { missionFirebaseService } = await import('@/lib/firebase-services');
      const result = await missionFirebaseService.updateMissionProgress(userId, missionId, progress);

      if (result.success) {
        return {
          success: true,
          data: progress as MissionProgress,
          timestamp: new Date(),
        };
      }
      return {
        success: false,
        error: (result.error instanceof Error ? result.error.message : result.error) ?? 'Failed to update progress',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update progress',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Complete mission and generate results
   */
  async completeMission(_missionId: string, _finalSubmissions: unknown[]): Promise<MissionApiResponse<MissionResults>> {
    try {
      // Extract userId from mission ID or get it from context
      // Temporary implementation - in production, include userId in method signature
      throw new Error('CompleteMission requires userId parameter - method signature needs update');
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete mission',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Complete mission with userId and generate results
   */
  async completeMissionWithUser(
    userId: string,
    missionId: string,
    finalSubmissions: unknown[]
  ): Promise<MissionApiResponse<MissionResults>> {
    try {
      // Calculate results based on submissions
      const results = await this.calculateMissionResults(missionId, finalSubmissions);

      const { missionFirebaseService } = await import('@/lib/firebase-services');
      const completeResult = await missionFirebaseService.completeMission(userId, missionId, results);

      if (completeResult.success) {
        return {
          success: true,
          data: results,
          timestamp: new Date(),
        };
      }
      return {
        success: false,
        error:
          (completeResult.error instanceof Error ? completeResult.error.message : completeResult.error) ||
          'Failed to complete mission',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete mission',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Calculate mission results
   */
  private async calculateMissionResults(_missionId: string, _submissions: unknown[]): Promise<MissionResults> {
    // Mock calculation - in production this would:
    // 1. Grade submissions against correct answers/criteria
    // 2. Calculate performance metrics
    // 3. Generate personalized feedback
    // 4. Identify strengths and improvement areas

    return {
      finalScore: 85,
      maxScore: 100,
      percentage: 85,
      passed: true,
      totalTime: 18, // minutes
      metrics: {
        accuracy: 85,
        speed: 92,
        efficiency: 78,
        consistency: 88,
      },
      strengths: ['Problem solving', 'Time management'],
      improvements: ['Algorithm optimization', 'Edge case handling'],
      breakdown: [
        {
          subject: 'Algorithms',
          topic: 'Sorting',
          score: 90,
          maxScore: 100,
          timeSpent: 8,
        },
        {
          subject: 'Data Structures',
          topic: 'Arrays',
          score: 80,
          maxScore: 100,
          timeSpent: 10,
        },
      ],
      achievements: ['Speed Demon', 'Problem Solver'],
      recommendations: ['Practice more complex algorithm problems', 'Focus on space complexity optimization'],
    };
  }
}

// =====================================================
// UNIFIED PROGRESS SERVICE
// =====================================================

/**
 * Service for managing unified progress across tracks
 */
export class UnifiedProgressService {
  private static instance: UnifiedProgressService;

  static getInstance(): UnifiedProgressService {
    if (!UnifiedProgressService.instance) {
      UnifiedProgressService.instance = new UnifiedProgressService();
    }
    return UnifiedProgressService.instance;
  }

  /**
   * Get unified progress for user
   */
  async getUserProgress(userId: string): Promise<MissionApiResponse<UnifiedProgress>> {
    try {
      // Mock implementation - in production would aggregate from database
      const progress: UnifiedProgress = {
        userId,
        overallProgress: {
          totalMissionsCompleted: 45,
          totalTimeInvested: 1200, // minutes
          averageScore: 82,
          currentStreak: 7,
          longestStreak: 15,
          consistencyRating: 88,
        },
        trackProgress: {
          exam: {
            track: 'exam',
            missionsCompleted: 25,
            averageScore: 78,
            timeInvested: 650,
            proficiencyLevel: 'intermediate',
            masteredSkills: ['Multiple Choice Questions', 'Time Management'],
            skillsInProgress: ['Essay Writing', 'Numerical Problems'],
            performanceTrend: 'improving',
            difficultyProgression: {
              current: 'intermediate',
              recommended: 'advanced',
              readyForAdvancement: true,
            },
            topicBreakdown: [
              {
                topic: 'General Studies',
                proficiency: 75,
                missionsCompleted: 12,
                averageScore: 76,
              },
              {
                topic: 'Mathematics',
                proficiency: 82,
                missionsCompleted: 8,
                averageScore: 84,
              },
              {
                topic: 'Reasoning',
                proficiency: 88,
                missionsCompleted: 5,
                averageScore: 89,
              },
            ],
          },
          course_tech: {
            track: 'course_tech',
            missionsCompleted: 20,
            averageScore: 87,
            timeInvested: 550,
            proficiencyLevel: 'intermediate',
            masteredSkills: ['JavaScript', 'Problem Solving', 'Testing'],
            skillsInProgress: ['System Design', 'Database Optimization'],
            performanceTrend: 'stable',
            difficultyProgression: {
              current: 'intermediate',
              recommended: 'intermediate',
              readyForAdvancement: false,
            },
            topicBreakdown: [
              {
                topic: 'Algorithms',
                proficiency: 85,
                missionsCompleted: 8,
                averageScore: 86,
              },
              {
                topic: 'Web Development',
                proficiency: 90,
                missionsCompleted: 7,
                averageScore: 92,
              },
              {
                topic: 'System Design',
                proficiency: 70,
                missionsCompleted: 5,
                averageScore: 72,
              },
            ],
          },
        },
        crossTrackInsights: {
          transferableSkills: ['Problem Solving', 'Time Management', 'Logical Thinking'],
          effectivePatterns: ['Morning study sessions', 'Short break intervals'],
          recommendedBalance: {
            exam: 60,
            course_tech: 40,
          },
        },
        periodSummaries: {
          weekly: [],
          monthly: [],
        },
        updatedAt: new Date(),
      };

      return {
        success: true,
        data: progress,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user progress',
        timestamp: new Date(),
      };
    }
  }

  /**
   * Update unified progress after mission completion
   */
  async updateProgress(
    userId: string,
    _missionResults: MissionResults,
    _track: LearningTrack
  ): Promise<MissionApiResponse<UnifiedProgress>> {
    try {
      // In production, this would:
      // 1. Update track-specific progress
      // 2. Recalculate overall metrics
      // 3. Update streaks and consistency
      // 4. Generate new insights

      const updatedProgress = await this.getUserProgress(userId);
      return updatedProgress;
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update progress',
        timestamp: new Date(),
      };
    }
  }
}

// =====================================================
// MISSION ANALYTICS SERVICE
// =====================================================

/**
 * Service for generating mission analytics and insights
 */
export class MissionAnalyticsService {
  private static instance: MissionAnalyticsService;

  static getInstance(): MissionAnalyticsService {
    if (!MissionAnalyticsService.instance) {
      MissionAnalyticsService.instance = new MissionAnalyticsService();
    }
    return MissionAnalyticsService.instance;
  }

  /**
   * Generate analytics for user's mission performance
   */
  async generateAnalytics(
    userId: string,
    period: { startDate: Date; endDate: Date }
  ): Promise<MissionApiResponse<MissionAnalytics>> {
    try {
      // Mock analytics generation
      const analytics: MissionAnalytics = {
        userId,
        period,
        overallMetrics: {
          missionsCompleted: 12,
          missionsSkipped: 2,
          averageScore: 84,
          totalTimeSpent: 420,
          consistencyScore: 89,
        },
        trackAnalytics: {
          exam: {
            track: 'exam',
            missionsCompleted: 7,
            averageScore: 82,
            timeInvested: 245,
            difficultyDistribution: {
              beginner: 1,
              intermediate: 5,
              advanced: 1,
              expert: 0,
            },
            subjectPerformance: [
              {
                subject: 'General Studies',
                averageScore: 78,
                missionsCompleted: 3,
                timeSpent: 90,
              },
              {
                subject: 'Mathematics',
                averageScore: 85,
                missionsCompleted: 2,
                timeSpent: 75,
              },
              {
                subject: 'Reasoning',
                averageScore: 88,
                missionsCompleted: 2,
                timeSpent: 80,
              },
            ],
            missionTypePerformance: [
              {
                type: 'Daily Mock Questions',
                averageScore: 80,
                completionRate: 95,
              },
              {
                type: 'Weekly Revision',
                averageScore: 85,
                completionRate: 100,
              },
            ],
          },
          course_tech: {
            track: 'course_tech',
            missionsCompleted: 5,
            averageScore: 87,
            timeInvested: 175,
            difficultyDistribution: {
              beginner: 1,
              intermediate: 3,
              advanced: 1,
              expert: 0,
            },
            subjectPerformance: [
              {
                subject: 'Algorithms',
                averageScore: 85,
                missionsCompleted: 2,
                timeSpent: 70,
              },
              {
                subject: 'Web Development',
                averageScore: 90,
                missionsCompleted: 2,
                timeSpent: 65,
              },
              {
                subject: 'System Design',
                averageScore: 85,
                missionsCompleted: 1,
                timeSpent: 40,
              },
            ],
            missionTypePerformance: [
              {
                type: 'Daily Coding Challenge',
                averageScore: 88,
                completionRate: 90,
              },
              {
                type: 'Weekly Assignment',
                averageScore: 86,
                completionRate: 100,
              },
            ],
          },
        },
        trends: {
          scoresTrend: [78, 80, 82, 85, 84, 87, 85],
          timeTrend: [25, 30, 28, 35, 32, 30, 28],
          difficultyTrend: [
            'intermediate',
            'intermediate',
            'advanced',
            'intermediate',
            'advanced',
            'intermediate',
            'intermediate',
          ],
        },
        insights: {
          strengths: ['Consistent performance', 'Good time management', 'Strong in reasoning'],
          improvements: ['Focus on general studies', 'Increase advanced difficulty missions'],
          recommendations: [
            'Try more advanced level missions',
            'Allocate more time to general studies',
            'Consider increasing daily mission frequency',
          ],
          predictedPerformance: 88,
        },
        generatedAt: new Date(),
      };

      return {
        success: true,
        data: analytics,
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate analytics',
        timestamp: new Date(),
      };
    }
  }
}

// =====================================================
// MAIN MISSION SERVICE
// =====================================================

/**
 * Main mission service that orchestrates all mission-related operations
 */
export class MissionService {
  private static instance: MissionService;

  private templateService = MissionTemplateService.getInstance();
  private generationService = MissionGenerationService.getInstance();
  private progressService = MissionProgressService.getInstance();
  private unifiedProgressService = UnifiedProgressService.getInstance();
  private analyticsService = MissionAnalyticsService.getInstance();

  static getInstance(): MissionService {
    if (!MissionService.instance) {
      MissionService.instance = new MissionService();
    }
    return MissionService.instance;
  }

  /**
   * Initialize the mission system
   */
  async initialize(): Promise<void> {
    await this.templateService.initializeDefaultTemplates();
  }

  /**
   * Seed default templates for a user
   */
  async seedUserTemplates(userId: string): Promise<void> {
    await this.templateService.seedUserTemplates(userId);
  }

  /**
   * Get active missions for a user
   */
  async getActiveMissions(userId: string): Promise<MissionApiResponse<Mission[]>> {
    try {
      const { missionFirebaseService } = await import('@/lib/firebase-services');
      const result = await missionFirebaseService.getActiveMissions(userId);

      if (result.success) {
        return {
          success: true,
          data: result.data as Mission[],
          timestamp: new Date(),
        };
      }
      return {
        success: false,
        error: result.error?.message ?? 'Failed to get active missions',
        timestamp: new Date(),
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get active missions',
        timestamp: new Date(),
      };
    }
  }

  // Expose all service methods with proper userId parameters
  async generateMission(request: MissionGenerationRequest): Promise<MissionGenerationResult> {
    return this.generationService.generateMission(request);
  }

  async updateMissionProgress(
    userId: string,
    missionId: string,
    progress: Partial<MissionProgress>
  ): Promise<MissionApiResponse<MissionProgress>> {
    return this.progressService.updateProgressWithUser(userId, missionId, progress);
  }

  async completeMission(
    userId: string,
    missionId: string,
    submissions: unknown[]
  ): Promise<MissionApiResponse<MissionResults>> {
    return this.progressService.completeMissionWithUser(userId, missionId, submissions);
  }

  async getUserProgress(userId: string): Promise<MissionApiResponse<UnifiedProgress>> {
    return this.unifiedProgressService.getUserProgress(userId);
  }

  async generateAnalytics(
    userId: string,
    period: { startDate: Date; endDate: Date }
  ): Promise<MissionApiResponse<MissionAnalytics>> {
    return this.analyticsService.generateAnalytics(userId, period);
  }

  async getTemplatesForTrack(
    userId: string,
    track: LearningTrack,
    frequency?: MissionFrequency,
    persona?: UserPersonaType
  ): Promise<MissionTemplate[]> {
    return this.templateService.getTemplatesForTrack(userId, track, frequency, persona);
  }

  /**
   * Adjust mission difficulty based on adaptive test results
   */
  async adjustMissionDifficultyFromTest(
    userId: string,
    testResults: import('@/types/adaptive-testing').TestPerformance,
    testMetadata: { subjects: string[]; track: LearningTrack }
  ): Promise<Result<void>> {
    try {
      // Get current user persona
      const persona = await this.getUserPersona(userId);
      if (!persona.success) {
        return persona;
      }

      const abilityEstimate = testResults.finalAbilityEstimate;
      const confidence = 1 - testResults.standardError; // Higher confidence = lower standard error

      // Calculate difficulty adjustment factor
      let difficultyAdjustment = 0;

      if (abilityEstimate > 0.5 && confidence > 0.8) {
        // High ability, high confidence -> increase difficulty
        difficultyAdjustment = 0.2;
      } else if (abilityEstimate < -0.5 && confidence > 0.8) {
        // Low ability, high confidence -> decrease difficulty
        difficultyAdjustment = -0.2;
      } else if (testResults.accuracy > 85) {
        // High accuracy -> slight increase
        difficultyAdjustment = 0.1;
      } else if (testResults.accuracy < 60) {
        // Low accuracy -> slight decrease
        difficultyAdjustment = -0.1;
      }

      // Update persona preferences based on test performance
      const updatedPersona = {
        ...persona.data,
        preferences: {
          ...persona.data.preferences,
          difficultyPreference: this.calculateNewDifficultyPreference(
            persona.data.preferences?.difficultyPreference || 'medium',
            difficultyAdjustment
          ),
          adaptiveTestingInfluence: confidence, // How much test results should influence missions
        },
        lastAdaptiveTestDate: new Date(),
        testPerformanceHistory: [
          ...((persona.data as any).testPerformanceHistory || []).slice(-4), // Keep last 5
          {
            date: new Date(),
            abilityEstimate,
            accuracy: testResults.accuracy,
            subjects: testMetadata.subjects,
            difficultyAdjustment,
          },
        ],
      };

      // Generate adaptive missions for weak subjects
      const weakSubjects = Object.entries(testResults.subjectPerformance)
        .filter(([_, perf]) => (perf as any).accuracy < 70)
        .map(([subjectId, _]) => subjectId);

      for (const subjectId of weakSubjects) {
        await this.generateTargetedMissionsForWeakness(
          userId,
          subjectId,
          testResults.subjectPerformance[subjectId] as any,
          testMetadata.track
        );
      }

      // Update user persona
      await this.updateUserPersona(userId, updatedPersona);

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to adjust mission difficulty from test'));
    }
  }

  /**
   * Generate targeted missions for areas identified as weak in adaptive testing
   */
  async generateTargetedMissionsForWeakness(
    userId: string,
    subjectId: string,
    subjectPerformance: any,
    track: LearningTrack
  ): Promise<Result<Mission[]>> {
    try {
      const missions: Mission[] = [];

      // Generate easier missions to build confidence
      const confidenceMission = await this.generateSpecificMission(
        userId,
        subjectId,
        'easy', // Start with easier difficulty
        {
          focus: 'confidence_building',
          targetAccuracy: 85, // Higher success rate for confidence
          estimatedTime: 15, // Shorter sessions
          adaptiveContext: {
            triggeredByTest: true,
            weakness: subjectPerformance.accuracy,
            recommendedApproach: 'gradual_progression',
          },
        },
        track
      );

      if (confidenceMission.success) {
        missions.push(confidenceMission.data);
      }

      // Generate practice missions at current level
      for (let i = 0; i < 3; i++) {
        const practiceMission = await this.generateSpecificMission(
          userId,
          subjectId,
          'medium',
          {
            focus: 'weakness_targeting',
            targetAccuracy: 75,
            estimatedTime: 20,
            adaptiveContext: {
              triggeredByTest: true,
              weakness: subjectPerformance.accuracy,
              sessionNumber: i + 1,
            },
          },
          track
        );

        if (practiceMission.success) {
          missions.push(practiceMission.data);
        }
      }

      // Schedule missions over next week
      missions.forEach((mission, index) => {
        mission.scheduledAt = new Date(Date.now() + (index + 1) * 24 * 60 * 60 * 1000);
        (mission as any).priority = 'high'; // High priority for weakness addressing
      });

      return createSuccess(missions);
    } catch (error) {
      return createError(
        error instanceof Error ? error : new Error('Failed to generate targeted missions for weakness')
      );
    }
  }

  /**
   * Create test-preparation missions before scheduled adaptive tests
   */
  async generateTestPreparationMissions(
    userId: string,
    upcomingTest: { subjects: string[]; scheduledDate: Date; track: LearningTrack }
  ): Promise<Result<Mission[]>> {
    try {
      const missions: Mission[] = [];
      const daysUntilTest = Math.ceil((upcomingTest.scheduledDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24));

      // Generate review missions for each subject
      for (const subjectId of upcomingTest.subjects) {
        // Quick review mission (day before test)
        const reviewMission = await this.generateSpecificMission(
          userId,
          subjectId,
          'medium',
          {
            focus: 'test_preparation',
            targetAccuracy: 80,
            estimatedTime: 25,
            adaptiveContext: {
              testPreparation: true,
              testDate: upcomingTest.scheduledDate,
              reviewType: 'comprehensive',
            },
          },
          upcomingTest.track
        );

        if (reviewMission.success) {
          reviewMission.data.scheduledAt = new Date(upcomingTest.scheduledDate.getTime() - 24 * 60 * 60 * 1000);
          (reviewMission.data as any).priority = 'high';
          (reviewMission.data as any).tags = [...((reviewMission.data as any).tags || []), 'test-prep', 'review'];
          missions.push(reviewMission.data);
        }

        // Practice missions (2-3 days before)
        if (daysUntilTest > 2) {
          const practiceMission = await this.generateSpecificMission(
            userId,
            subjectId,
            'hard',
            {
              focus: 'test_simulation',
              targetAccuracy: 75,
              estimatedTime: 30,
              adaptiveContext: {
                testPreparation: true,
                testDate: upcomingTest.scheduledDate,
                reviewType: 'challenging_practice',
              },
            },
            upcomingTest.track
          );

          if (practiceMission.success) {
            practiceMission.data.scheduledAt = new Date(upcomingTest.scheduledDate.getTime() - 3 * 24 * 60 * 60 * 1000);
            (practiceMission.data as any).priority = 'medium';
            (practiceMission.data as any).tags = [
              ...((practiceMission.data as any).tags || []),
              'test-prep',
              'practice',
            ];
            missions.push(practiceMission.data);
          }
        }
      }

      return createSuccess(missions);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to generate test preparation missions'));
    }
  }

  /**
   * Get missions that align with adaptive testing goals
   */
  async getTestAlignedMissions(
    userId: string,
    testSubjects: string[],
    targetDifficulty: MissionDifficulty,
    count = 5
  ): Promise<Result<Mission[]>> {
    try {
      // Get user's active missions
      const activeMissionsResult = await missionFirebaseService.getActiveMissions(userId);
      if (!activeMissionsResult.success) {
        return activeMissionsResult;
      }

      const activeMissions = activeMissionsResult.data as Mission[];

      // Filter missions that align with test subjects and difficulty
      const alignedMissions = activeMissions
        .filter((mission: Mission) => {
          // Check if mission subjects overlap with test subjects
          const missionSubjects = this.extractMissionSubjects(mission);
          const hasOverlap = missionSubjects.some(subject => testSubjects.includes(subject));

          // Check if difficulty is appropriate
          const difficultyMatch = this.isDifficultyCompatible(mission.difficulty, targetDifficulty);

          return hasOverlap && difficultyMatch;
        })
        .slice(0, count);

      return createSuccess(alignedMissions);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to get test aligned missions'));
    }
  }

  /**
   * Update mission recommendations based on test performance
   */
  async updateMissionRecommendations(
    userId: string,
    testResults: import('@/types/adaptive-testing').TestPerformance
  ): Promise<Result<string[]>> {
    try {
      const recommendations: string[] = [];

      // Analyze test performance patterns
      const overallAccuracy = testResults.accuracy;
      const responseTimePattern = testResults.averageResponseTime;

      // Generate specific recommendations
      if (overallAccuracy < 60) {
        recommendations.push('Focus on foundational concepts with easier missions');
        recommendations.push('Increase mission frequency to build consistency');
      } else if (overallAccuracy > 85) {
        recommendations.push('Consider advancing to more challenging missions');
        recommendations.push('Explore advanced topics in strong subjects');
      }

      if (responseTimePattern > 90000) {
        // More than 90 seconds average
        recommendations.push('Practice with time-limited missions to improve speed');
        recommendations.push('Focus on quick recall exercises');
      }

      // Subject-specific recommendations
      Object.entries(testResults.subjectPerformance).forEach(([subject, performance]) => {
        const subjectAccuracy = (performance as any).accuracy;
        if (subjectAccuracy < 65) {
          recommendations.push(`Prioritize ${subject} missions for the next week`);
          recommendations.push(`Start with beginner-level ${subject} concepts`);
        } else if (subjectAccuracy > 90) {
          recommendations.push(`Consider advanced ${subject} missions`);
        }
      });

      // Difficulty-specific recommendations
      Object.entries(testResults.difficultyPerformance).forEach(([difficulty, performance]) => {
        const difficultyAccuracy = (performance as any).accuracy;
        if (difficultyAccuracy < 50) {
          recommendations.push(`Spend more time on ${difficulty} level missions`);
        }
      });

      return createSuccess(recommendations);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to update mission recommendations'));
    }
  }

  // Private helper methods for adaptive testing integration

  private calculateNewDifficultyPreference(
    currentPreference: MissionDifficulty,
    adjustment: number
  ): MissionDifficulty {
    const difficultyLevels: MissionDifficulty[] = ['beginner', 'easy', 'medium', 'hard', 'expert'];
    const currentIndex = difficultyLevels.indexOf(currentPreference);

    let newIndex = currentIndex;

    if (adjustment > 0.15) {
      newIndex = Math.min(difficultyLevels.length - 1, currentIndex + 1);
    } else if (adjustment < -0.15) {
      newIndex = Math.max(0, currentIndex - 1);
    }

    return difficultyLevels[newIndex];
  }

  private async generateSpecificMission(
    userId: string,
    subjectId: string,
    difficulty: MissionDifficulty,
    context: any,
    track: LearningTrack
  ): Promise<Result<Mission>> {
    // This would use existing mission generation logic with adaptive context
    // For now, return a mock mission
    const mission: Mission = {
      id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      userId,
      templateId: 'adaptive_template',
      track,
      frequency: 'daily',
      title: `Adaptive ${difficulty} mission for ${subjectId}`,
      description: `Mission generated based on adaptive test results`,
      difficulty,
      estimatedDuration: context.estimatedTime || 20,
      content: {
        type: 'mock_questions',
        examContent: {
          questions: [],
          timeLimit: context.estimatedTime || 20,
          passingScore: context.targetAccuracy || 70,
          instructions: `Focus on ${subjectId} with ${context.focus} approach`,
        },
      },
      status: 'not_started',
      scheduledAt: new Date(),
      deadline: new Date(Date.now() + 24 * 60 * 60 * 1000),
      progress: {
        completionPercentage: 0,
        currentStep: 0,
        totalSteps: 1,
        timeSpent: 0,
        stepProgress: [],
        submissions: [],
        metrics: {
          accuracy: 0,
          speed: 0,
          consistency: 0,
          engagement: 0,
        },
      },
      personaOptimizations: {
        persona: 'student',
        timeAdjustments: {
          preferredDuration: context.estimatedTime || 20,
          maxDuration: (context.estimatedTime || 20) * 1.5,
          breakIntervals: [10],
        },
        contentAdaptations: {
          explanationLevel: 'detailed',
          exampleComplexity: 'realistic',
          contextType: 'academic',
        },
        motivationStrategies: {
          rewardTypes: ['progress', 'badges'],
          feedbackFrequency: 'step_by_step',
          challengePreference: 'steady',
        },
        progressVisualization: {
          chartTypes: ['bar', 'progress'],
          detailLevel: 'detailed',
          comparisons: ['self', 'goals'],
        },
      },
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    return createSuccess(mission);
  }

  private extractMissionSubjects(mission: Mission): string[] {
    // Extract subjects from mission content or metadata
    // This would depend on the mission structure
    return mission.content?.examContent?.questions.map(q => (q as any).subject).filter(Boolean) || [];
  }

  private isDifficultyCompatible(missionDifficulty: MissionDifficulty, targetDifficulty: MissionDifficulty): boolean {
    const difficultyOrder = ['beginner', 'easy', 'medium', 'hard', 'expert'];
    const missionIndex = difficultyOrder.indexOf(missionDifficulty);
    const targetIndex = difficultyOrder.indexOf(targetDifficulty);

    // Allow missions within ±1 difficulty level
    return Math.abs(missionIndex - targetIndex) <= 1;
  }

  private async getUserPersona(userId: string): Promise<Result<any>> {
    // This would integrate with the existing user persona system
    // For now, return a mock persona
    return createSuccess({
      id: userId,
      type: 'student',
      preferences: {
        difficultyPreference: 'medium' as MissionDifficulty,
      },
    });
  }

  private async updateUserPersona(userId: string, persona: any): Promise<Result<void>> {
    // This would update the user persona in Firebase
    // For now, just return success
    return createSuccess(undefined);
  }

  /**
   * Create a mission template for journey integration
   */
  async createMissionTemplate(templateData: {
    title: string;
    description: string;
    type: 'study' | 'practice' | 'review';
    difficulty: MissionDifficulty;
    estimatedDuration: number;
    subjects: string[];
    track: LearningTrack;
    journeyId?: string;
  }): Promise<Result<MissionTemplate>> {
    try {
      const template: MissionTemplate = {
        id: `template_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        track: templateData.track,
        frequency: 'weekly',
        title: templateData.title,
        description: templateData.description,
        difficulty: templateData.difficulty,
        estimatedDuration: templateData.estimatedDuration,
        aiGenerated: false,
        content: {
          type: templateData.type === 'practice' ? 'mock_questions' : 'study_plan',
          examContent: {
            questions: [],
            timeLimit: templateData.estimatedDuration,
            passingScore: 70,
            instructions: templateData.description,
          },
        },
        tags: [templateData.type, templateData.difficulty, ...(templateData.journeyId ? ['journey-linked'] : [])],
        metadata: {
          averageRating: 0,
          completionRate: 0,
          estimatedDuration: templateData.estimatedDuration,
          tags: [templateData.type, templateData.difficulty],
          subjects: templateData.subjects,
          journeyId: templateData.journeyId,
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return createSuccess(template);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create mission template'));
    }
  }

  /**
   * Activate a mission from a template for journey workflow
   */
  async activateMissionFromTemplate(userId: string, templateId: string): Promise<Result<Mission>> {
    try {
      // For now, create a mock mission based on template
      // In a real implementation, this would fetch the template and create an active mission
      const mission: Mission = {
        id: `mission_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
        userId,
        templateId,
        track: 'certification',
        frequency: 'weekly',
        title: 'Journey-Generated Mission',
        description: 'Mission activated from journey planning system',
        difficulty: 'medium',
        estimatedDuration: 30,
        content: {
          type: 'study_plan',
          examContent: {
            questions: [],
            timeLimit: 30,
            passingScore: 70,
            instructions: 'Complete this mission as part of your learning journey',
          },
        },
        status: 'not_started',
        scheduledAt: new Date(),
        deadline: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 1 week from now
        progress: {
          completionPercentage: 0,
          currentStep: 0,
          totalSteps: 1,
          timeSpent: 0,
          stepProgress: [],
          submissions: [],
          metrics: {
            accuracy: 0,
            speed: 0,
            consistency: 0,
            engagement: 0,
          },
        },
        personaOptimizations: {
          persona: 'student',
          timeAdjustments: {
            preferredDuration: 30,
            maxDuration: 45,
            breakIntervals: [15],
          },
          contentAdaptations: {
            explanationLevel: 'detailed',
            exampleComplexity: 'realistic',
            contextType: 'academic',
          },
          motivationStrategies: {
            rewardTypes: ['progress', 'badges'],
            feedbackFrequency: 'step_by_step',
            challengePreference: 'steady',
          },
          progressVisualization: {
            chartTypes: ['bar', 'progress'],
            detailLevel: 'detailed',
            comparisons: ['self', 'goals'],
          },
        },
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      return createSuccess(mission);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to activate mission from template'));
    }
  }
}

// Export the main service instance
export const missionService = MissionService.getInstance();
