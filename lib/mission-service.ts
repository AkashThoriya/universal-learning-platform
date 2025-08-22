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

import {
  type Mission,
  type MissionTemplate,
  type MissionCycleConfig,
  type MissionGenerationRequest,
  type MissionGenerationResult,
  type MissionSchedulingRequest,
  type MissionSchedulingResult,
  type UnifiedProgress,
  type Achievement,
  type UserAchievement,
  type MissionAnalytics,
  type MissionApiResponse,
  type PaginatedMissionResponse,
  type MissionPaginationOptions,
  type LearningTrack,
  type MissionFrequency,
  type MissionDifficulty,
  type MissionStatus,
  type PersonaMissionOptimizations,
  type ExamMissionContent,
  type TechMissionContent,
  type MissionResults,
  type MissionProgress
} from '@/types/mission-system';
import { type UserPersonaType } from '@/types/exam';

// =====================================================
// MISSION TEMPLATES SERVICE
// =====================================================

/**
 * Service for managing mission templates
 */
export class MissionTemplateService {
  private static instance: MissionTemplateService;
  private templates: Map<string, MissionTemplate> = new Map();

  static getInstance(): MissionTemplateService {
    if (!MissionTemplateService.instance) {
      MissionTemplateService.instance = new MissionTemplateService();
    }
    return MissionTemplateService.instance;
  }

  /**
   * Initialize default mission templates
   */
  async initializeDefaultTemplates(): Promise<void> {
    const defaultTemplates = this.getDefaultTemplates();
    
    for (const template of defaultTemplates) {
      this.templates.set(template.id, template);
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
              english: 0.1
            },
            focusTopics: [],
            includeExplanations: true,
            passingThreshold: 60
          } as ExamMissionContent
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 40,
          scoringMethod: 'percentage',
          weights: {
            accuracy: 0.7,
            speed: 0.3
          },
          bonusPoints: {
            earlyCompletion: 5,
            perfectScore: 10
          }
        },
        createdAt: new Date()
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
            passingThreshold: 65
          } as ExamMissionContent
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 50,
          scoringMethod: 'percentage',
          weights: {
            accuracy: 0.6,
            speed: 0.2,
            efficiency: 0.2
          },
          bonusPoints: {
            perfectScore: 15
          }
        },
        createdAt: new Date()
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
            passingThreshold: 70
          } as ExamMissionContent
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 60,
          scoringMethod: 'percentage',
          weights: {
            accuracy: 0.8,
            speed: 0.2
          },
          bonusPoints: {
            perfectScore: 20
          }
        },
        createdAt: new Date()
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
            allowedResources: true
          } as TechMissionContent
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 60,
          scoringMethod: 'rubric',
          weights: {
            accuracy: 0.4,
            efficiency: 0.3,
            quality: 0.3
          },
          bonusPoints: {
            earlyCompletion: 10,
            innovation: 15
          }
        },
        createdAt: new Date()
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
            allowedResources: true
          } as TechMissionContent
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 70,
          scoringMethod: 'rubric',
          weights: {
            accuracy: 0.3,
            quality: 0.4,
            creativity: 0.3
          },
          bonusPoints: {
            innovation: 20
          }
        },
        createdAt: new Date()
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
            allowedResources: true
          } as TechMissionContent
        },
        scoring: {
          maxScore: 100,
          minCompletionScore: 75,
          scoringMethod: 'rubric',
          weights: {
            accuracy: 0.25,
            quality: 0.35,
            creativity: 0.25,
            efficiency: 0.15
          },
          bonusPoints: {
            innovation: 25
          }
        },
        createdAt: new Date()
      }
    ];
  }

  /**
   * Get templates for specific track and frequency
   */
  async getTemplatesForTrack(
    track: LearningTrack, 
    frequency?: MissionFrequency,
    persona?: UserPersonaType
  ): Promise<MissionTemplate[]> {
    const allTemplates = Array.from(this.templates.values());
    
    return allTemplates.filter(template => {
      const trackMatch = template.track === track;
      const frequencyMatch = !frequency || template.frequency === frequency;
      const personaMatch = !persona || template.supportedPersonas.length === 0 || 
                          template.supportedPersonas.includes(persona);
      
      return trackMatch && frequencyMatch && personaMatch;
    });
  }

  /**
   * Get template by ID
   */
  async getTemplate(templateId: string): Promise<MissionTemplate | null> {
    return this.templates.get(templateId) || null;
  }

  /**
   * Add or update template
   */
  async saveTemplate(template: MissionTemplate): Promise<MissionApiResponse<MissionTemplate>> {
    try {
      this.templates.set(template.id, template);
      
      return {
        success: true,
        data: template,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to save template',
        timestamp: new Date()
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
      // Get suitable templates
      const templates = await this.templateService.getTemplatesForTrack(
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
            generationTime: Date.now() - startTime
          }
        };
      }

      // Select best template based on user history and preferences
      const selectedTemplate = await this.selectBestTemplate(templates, request);

      // Generate mission content
      const mission = await this.createMissionFromTemplate(selectedTemplate, request);

      return {
        success: true,
        mission,
        metadata: {
          templateUsed: selectedTemplate.id,
          difficultyAdjustments: [],
          personaOptimizations: [],
          generationTime: Date.now() - startTime
        }
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Mission generation failed',
        metadata: {
          templateUsed: '',
          difficultyAdjustments: [],
          personaOptimizations: [],
          generationTime: Date.now() - startTime
        }
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

    return filteredTemplates[0] || templates[0];
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
      difficulty: request.difficulty || 'intermediate',
      estimatedDuration: request.durationOverride || template.estimatedDuration,
      content,
      status: 'not_started',
      scheduledAt: request.schedulingOptions?.preferredStartTime || now,
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
          engagement: 0
        }
      },
      personaOptimizations,
      createdAt: now,
      updatedAt: now
    };

    return mission;
  }

  /**
   * Generate mission content based on template
   */
  private async generateMissionContent(
    template: MissionTemplate, 
    request: MissionGenerationRequest
  ): Promise<any> {
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
          instructions: `Complete this ${template.name} within ${template.estimatedDuration} minutes`
        }
      };
    } else {
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
            hints: []
          },
          requirements: [],
          deliverables: [],
          resources: []
        }
      };
    }
  }

  /**
   * Calculate mission deadline
   */
  private calculateDeadline(frequency: MissionFrequency, customDeadline?: Date): Date {
    if (customDeadline) return customDeadline;

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
          breakIntervals: [15, 30]
        },
        contentAdaptations: {
          explanationLevel: 'detailed',
          exampleComplexity: 'simple',
          contextType: 'academic'
        },
        motivationStrategies: {
          rewardTypes: ['points', 'badges', 'progress'],
          feedbackFrequency: 'step_by_step',
          challengePreference: 'increasing'
        },
        progressVisualization: {
          chartTypes: ['bar', 'line'],
          detailLevel: 'detailed',
          comparisons: ['self', 'peers']
        }
      },
      working_professional: {
        persona: 'working_professional',
        timeAdjustments: {
          preferredDuration: 20,
          maxDuration: 30,
          breakIntervals: [10, 20]
        },
        contentAdaptations: {
          explanationLevel: 'brief',
          exampleComplexity: 'realistic',
          contextType: 'professional'
        },
        motivationStrategies: {
          rewardTypes: ['certificates', 'progress'],
          feedbackFrequency: 'end_of_mission',
          challengePreference: 'steady'
        },
        progressVisualization: {
          chartTypes: ['gauge', 'line'],
          detailLevel: 'summary',
          comparisons: ['self', 'benchmarks']
        }
      },
      freelancer: {
        persona: 'freelancer',
        timeAdjustments: {
          preferredDuration: 25,
          maxDuration: 45,
          breakIntervals: [15, 25]
        },
        contentAdaptations: {
          explanationLevel: 'comprehensive',
          exampleComplexity: 'advanced',
          contextType: 'practical'
        },
        motivationStrategies: {
          rewardTypes: ['certificates', 'social'],
          feedbackFrequency: 'immediate',
          challengePreference: 'variable'
        },
        progressVisualization: {
          chartTypes: ['pie', 'heatmap'],
          detailLevel: 'comprehensive',
          comparisons: ['self', 'goals']
        }
      }
    };

    return baseOptimizations[persona];
  }

  /**
   * Calculate total steps for mission content
   */
  private calculateTotalSteps(content: any): number {
    if (content.examContent) {
      return content.examContent.questions?.length || 10;
    } else if (content.techContent) {
      return content.techContent.deliverables?.length || 3;
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
    missionId: string, 
    progress: Partial<MissionProgress>
  ): Promise<MissionApiResponse<MissionProgress>> {
    try {
      // In production, this would update the database
      // For now, return mock success
      
      return {
        success: true,
        data: progress as MissionProgress,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to update progress',
        timestamp: new Date()
      };
    }
  }

  /**
   * Complete mission and generate results
   */
  async completeMission(
    missionId: string, 
    finalSubmissions: any[]
  ): Promise<MissionApiResponse<MissionResults>> {
    try {
      // Calculate results based on submissions
      const results = await this.calculateMissionResults(missionId, finalSubmissions);
      
      return {
        success: true,
        data: results,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to complete mission',
        timestamp: new Date()
      };
    }
  }

  /**
   * Calculate mission results
   */
  private async calculateMissionResults(
    missionId: string, 
    submissions: any[]
  ): Promise<MissionResults> {
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
        consistency: 88
      },
      strengths: ['Problem solving', 'Time management'],
      improvements: ['Algorithm optimization', 'Edge case handling'],
      breakdown: [
        {
          subject: 'Algorithms',
          topic: 'Sorting',
          score: 90,
          maxScore: 100,
          timeSpent: 8
        },
        {
          subject: 'Data Structures',
          topic: 'Arrays',
          score: 80,
          maxScore: 100,
          timeSpent: 10
        }
      ],
      achievements: ['Speed Demon', 'Problem Solver'],
      recommendations: [
        'Practice more complex algorithm problems',
        'Focus on space complexity optimization'
      ]
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
          consistencyRating: 88
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
              readyForAdvancement: true
            },
            topicBreakdown: [
              {
                topic: 'General Studies',
                proficiency: 75,
                missionsCompleted: 12,
                averageScore: 76
              },
              {
                topic: 'Mathematics',
                proficiency: 82,
                missionsCompleted: 8,
                averageScore: 84
              },
              {
                topic: 'Reasoning',
                proficiency: 88,
                missionsCompleted: 5,
                averageScore: 89
              }
            ]
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
              readyForAdvancement: false
            },
            topicBreakdown: [
              {
                topic: 'Algorithms',
                proficiency: 85,
                missionsCompleted: 8,
                averageScore: 86
              },
              {
                topic: 'Web Development',
                proficiency: 90,
                missionsCompleted: 7,
                averageScore: 92
              },
              {
                topic: 'System Design',
                proficiency: 70,
                missionsCompleted: 5,
                averageScore: 72
              }
            ]
          }
        },
        crossTrackInsights: {
          transferableSkills: ['Problem Solving', 'Time Management', 'Logical Thinking'],
          effectivePatterns: ['Morning study sessions', 'Short break intervals'],
          recommendedBalance: {
            exam: 60,
            course_tech: 40
          }
        },
        periodSummaries: {
          weekly: [],
          monthly: []
        },
        updatedAt: new Date()
      };

      return {
        success: true,
        data: progress,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to get user progress',
        timestamp: new Date()
      };
    }
  }

  /**
   * Update unified progress after mission completion
   */
  async updateProgress(
    userId: string, 
    missionResults: MissionResults, 
    track: LearningTrack
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
        timestamp: new Date()
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
          consistencyScore: 89
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
              expert: 0
            },
            subjectPerformance: [
              {
                subject: 'General Studies',
                averageScore: 78,
                missionsCompleted: 3,
                timeSpent: 90
              },
              {
                subject: 'Mathematics',
                averageScore: 85,
                missionsCompleted: 2,
                timeSpent: 75
              },
              {
                subject: 'Reasoning',
                averageScore: 88,
                missionsCompleted: 2,
                timeSpent: 80
              }
            ],
            missionTypePerformance: [
              {
                type: 'Daily Mock Questions',
                averageScore: 80,
                completionRate: 95
              },
              {
                type: 'Weekly Revision',
                averageScore: 85,
                completionRate: 100
              }
            ]
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
              expert: 0
            },
            subjectPerformance: [
              {
                subject: 'Algorithms',
                averageScore: 85,
                missionsCompleted: 2,
                timeSpent: 70
              },
              {
                subject: 'Web Development',
                averageScore: 90,
                missionsCompleted: 2,
                timeSpent: 65
              },
              {
                subject: 'System Design',
                averageScore: 85,
                missionsCompleted: 1,
                timeSpent: 40
              }
            ],
            missionTypePerformance: [
              {
                type: 'Daily Coding Challenge',
                averageScore: 88,
                completionRate: 90
              },
              {
                type: 'Weekly Assignment',
                averageScore: 86,
                completionRate: 100
              }
            ]
          }
        },
        trends: {
          scoresTrend: [78, 80, 82, 85, 84, 87, 85],
          timeTrend: [25, 30, 28, 35, 32, 30, 28],
          difficultyTrend: ['intermediate', 'intermediate', 'advanced', 'intermediate', 'advanced', 'intermediate', 'intermediate']
        },
        insights: {
          strengths: ['Consistent performance', 'Good time management', 'Strong in reasoning'],
          improvements: ['Focus on general studies', 'Increase advanced difficulty missions'],
          recommendations: [
            'Try more advanced level missions',
            'Allocate more time to general studies',
            'Consider increasing daily mission frequency'
          ],
          predictedPerformance: 88
        },
        generatedAt: new Date()
      };

      return {
        success: true,
        data: analytics,
        timestamp: new Date()
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate analytics',
        timestamp: new Date()
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

  // Expose all service methods
  async generateMission(request: MissionGenerationRequest): Promise<MissionGenerationResult> {
    return this.generationService.generateMission(request);
  }

  async updateMissionProgress(
    missionId: string, 
    progress: Partial<MissionProgress>
  ): Promise<MissionApiResponse<MissionProgress>> {
    return this.progressService.updateProgress(missionId, progress);
  }

  async completeMission(
    missionId: string, 
    submissions: any[]
  ): Promise<MissionApiResponse<MissionResults>> {
    return this.progressService.completeMission(missionId, submissions);
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
    track: LearningTrack, 
    frequency?: MissionFrequency,
    persona?: UserPersonaType
  ): Promise<MissionTemplate[]> {
    return this.templateService.getTemplatesForTrack(track, frequency, persona);
  }
}

// Export the main service instance
export const missionService = MissionService.getInstance();
