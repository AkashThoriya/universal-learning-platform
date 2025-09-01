/**
 * @fileoverview Dual-Track Micro-Learning Service
 *
 * Generates personalized micro-learning sessions that adapt to user persona,
 * learning track (exam vs course/tech), and individual constraints.
 * Implements intelligent content adaptation and scheduling optimization.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { UserPersona, CareerContext } from '@/types/exam';
import {
  MicroLearningSession,
  PersonaOptimizations,
  MicroContent,
  PersonaAdaptations,
  ExamValidation,
  CourseValidation,
  LearningRecommendation,
  SessionPerformance,
} from '@/types/micro-learning';

import { PersonaAwareGoalSetting as _PersonaAwareGoalSetting } from './persona-aware-goals';

/**
 * Base content structure from external sources
 */
interface BaseContentItem {
  topic: string;
  body?: string;
  content?: string;
  estimatedTime?: number;
  difficulty?: number;
  tags?: string[];
  examType?: string;
  hasCode?: boolean;
  isExample?: boolean;
}

/**
 * Service for managing dual-track micro-learning sessions
 */
export class MicroLearningService {
  /**
   * Generate a personalized micro-learning session
   */
  static async generateSession(
    userId: string,
    subjectId: string,
    topicId: string,
    learningTrack: 'exam' | 'course_tech' = 'exam',
    requestedDuration?: number
  ): Promise<MicroLearningSession> {
    try {
      // Get user persona data from Firebase
      const persona = await this.getUserPersona(userId);

      // Calculate persona-specific optimizations
      const optimizations = this.calculatePersonaOptimizations(persona, requestedDuration);

      // Get base content for the topic
      const baseContent = await this.getTopicContent(topicId, learningTrack);

      // Adapt content for persona
      const adaptedContent = this.adaptContentForPersona(baseContent, persona, learningTrack);

      // Generate appropriate validation method
      const validationMethod = await this.generateValidationMethod(learningTrack, subjectId, topicId, persona);

      // Calculate optimal difficulty based on user history
      const difficulty = await this.calculateOptimalDifficulty(userId, topicId);

      const session: MicroLearningSession = {
        id: this.generateSessionId(),
        userId,
        learningTrack,
        subjectId,
        topicId,
        sessionType: this.selectOptimalSessionType(persona, learningTrack, topicId),
        duration: optimizations.sessionLength,
        difficulty,
        personaOptimizations: optimizations,
        content: adaptedContent,
        validationMethod,
        createdAt: new Date(),
        metadata: {
          device: 'desktop',
          browser: 'unknown',
          environment: 'home',
          interruptionCount: 0,
        },
      };

      // Save session to Firebase
      const { microLearningFirebaseService } = await import('@/lib/firebase-services');
      const saveResult = await microLearningFirebaseService.saveSession(userId, session);

      if (!saveResult.success) {
        const errorMessage =
          saveResult.error instanceof Error ? saveResult.error.message : saveResult.error ?? 'Failed to save session';
        throw new Error(errorMessage);
      }

      return session;
    } catch (error) {
      throw new Error(`Failed to generate session: ${error}`);
    }
  }

  /**
   * Get session history for a user
   */
  static async getSessionHistory(userId: string, limit = 20): Promise<MicroLearningSession[]> {
    try {
      const { microLearningFirebaseService } = await import('@/lib/firebase-services');
      const result = await microLearningFirebaseService.getSessionHistory(userId, limit);

      if (!result.success) {
        const errorMessage =
          result.error instanceof Error ? result.error.message : result.error ?? 'Failed to get session history';
        throw new Error(errorMessage);
      }

      return result.data as MicroLearningSession[];
    } catch (error) {
      throw new Error(`Failed to get session history: ${error}`);
    }
  }

  /**
   * Generate personalized recommendations
   */
  static async generatePersonalizedRecommendations(userId: string): Promise<unknown[]> {
    try {
      // Get user's learning history and preferences
      const sessionHistory = await this.getSessionHistory(userId, 50);
      const { microLearningFirebaseService } = await import('@/lib/firebase-services');
      // const _preferencesResult = await microLearningFirebaseService.getUserPreferences(userId);

      // Get existing recommendations to check if they're still valid
      const existingResult = await microLearningFirebaseService.getRecommendations(userId);

      if (existingResult.success && existingResult.data.length > 0) {
        return existingResult.data;
      }

      // Generate new recommendations based on user data
      const recommendations = await this.generateRecommendationsFromHistory(userId, sessionHistory);

      // Save recommendations to Firebase
      await microLearningFirebaseService.saveRecommendations(userId, recommendations);

      return recommendations;
    } catch (error) {
      throw new Error(`Failed to generate recommendations: ${error}`);
    }
  }

  /**
   * Update session progress
   */
  static async updateSessionProgress(userId: string, sessionId: string, progress: unknown): Promise<void> {
    try {
      const { microLearningFirebaseService } = await import('@/lib/firebase-services');
      const result = await microLearningFirebaseService.updateSessionProgress(userId, sessionId, progress);

      if (!result.success) {
        const errorMessage =
          result.error instanceof Error ? result.error.message : result.error ?? 'Failed to update session progress';
        throw new Error(errorMessage);
      }
    } catch (error) {
      throw new Error(`Failed to update session progress: ${error}`);
    }
  }

  /**
   * Calculate persona-specific optimizations
   */
  private static calculatePersonaOptimizations(persona: UserPersona, requestedDuration?: number): PersonaOptimizations {
    switch (persona.type) {
      case 'student':
        return {
          sessionLength: requestedDuration ?? 15,
          breakReminders: false,
          contextSwitching: false,
          motivationalFraming: 'academic',
          complexityRamp: 'standard',
          learningTrackPreference: 'exam',
          notificationStyle: 'standard',
          uiDensity: 'comfortable',
        };

      case 'working_professional':
        const { workSchedule } = persona;
        const hasLimitedTime = workSchedule ? workSchedule.flexibility === 'rigid' : true;

        return {
          sessionLength: requestedDuration || (hasLimitedTime ? 7 : 12),
          breakReminders: true,
          contextSwitching: true,
          motivationalFraming: 'career',
          complexityRamp: hasLimitedTime ? 'accelerated' : 'standard',
          learningTrackPreference: 'mixed',
          notificationStyle: 'minimal',
          uiDensity: 'compact',
        };

      case 'freelancer':
        return {
          sessionLength: requestedDuration ?? 10,
          breakReminders: true,
          contextSwitching: true,
          motivationalFraming: 'skill_building',
          complexityRamp: 'accelerated',
          learningTrackPreference: 'course_tech',
          notificationStyle: 'comprehensive',
          uiDensity: 'comfortable',
        };

      default:
        return {
          sessionLength: requestedDuration ?? 10,
          breakReminders: false,
          contextSwitching: false,
          motivationalFraming: 'personal',
          complexityRamp: 'standard',
          learningTrackPreference: 'mixed',
          notificationStyle: 'standard',
          uiDensity: 'comfortable',
        };
    }
  }

  /**
   * Adapt content based on persona and learning track
   */
  private static adaptContentForPersona(
    baseContent: BaseContentItem[],
    persona: UserPersona,
    learningTrack: 'exam' | 'course_tech'
  ): MicroContent[] {
    return baseContent.map((content, index) => ({
      id: `content_${index}_${Date.now()}`,
      type: this.selectContentType(content, learningTrack),
      content: content.body ?? (content.content ?? ''),
      estimatedTime: content.estimatedTime ?? 120,
      learningTrack,
      personaAdaptations: this.generatePersonaAdaptations(content, persona, learningTrack),
      metadata: {
        createdAt: new Date(),
        updatedAt: new Date(),
        author: 'system',
        version: '1.0.0',
        tags: content.tags ?? [],
        difficultyRating: content.difficulty ?? 5,
      },
    }));
  }

  /**
   * Generate persona-specific content adaptations
   */
  private static generatePersonaAdaptations(
    content: BaseContentItem,
    persona: UserPersona,
    learningTrack: 'exam' | 'course_tech'
  ): PersonaAdaptations {
    const adaptations: PersonaAdaptations = {};

    // Student adaptations - academic focus
    adaptations.student = {
      examples: this.generateAcademicExamples(content.topic, learningTrack),
      motivation:
        learningTrack === 'exam'
          ? `Master this concept for exam success!`
          : `Build strong foundations for your academic journey!`,
      applicationContext:
        learningTrack === 'exam'
          ? `This appears frequently in ${content.examType ?? 'competitive'} exams`
          : `This knowledge will help you excel in your coursework and projects`,
      validationMethod: learningTrack === 'exam' ? 'quiz' : 'assignment',
      additionalResources: this.generateStudentResources(content.topic, learningTrack),
    };

    // Professional adaptations - career focus
    adaptations.working_professional = {
      examples: this.generateProfessionalExamples(content.topic, persona.careerContext, learningTrack),
      motivation:
        learningTrack === 'exam'
          ? `Advance your career with this certification!`
          : `Enhance your professional skills and stay competitive!`,
      applicationContext:
        learningTrack === 'exam'
          ? `This certification opens doors to ${persona.careerContext?.targetRole ?? 'leadership roles'}`
          : `This skill directly applies to ${persona.careerContext?.targetRole ?? 'your work'} and increases your market value`,
      validationMethod: learningTrack === 'exam' ? 'practice' : 'project',
      additionalResources: this.generateProfessionalResources(content.topic, learningTrack),
    };

    // Freelancer adaptations - business/skill focus
    adaptations.freelancer = {
      examples: this.generateFreelancerExamples(content.topic, learningTrack),
      motivation:
        learningTrack === 'exam'
          ? `Expand your credentials and client trust!`
          : `Add valuable skills to your service portfolio!`,
      applicationContext:
        learningTrack === 'exam'
          ? `This certification helps you charge premium rates and attract better clients`
          : `This skill allows you to take on higher-value projects and expand your offerings`,
      validationMethod: learningTrack === 'exam' ? 'practice' : 'project',
      additionalResources: this.generateFreelancerResources(content.topic, learningTrack),
    };

    return adaptations;
  }

  /**
   * Generate validation method based on learning track
   */
  private static async generateValidationMethod(
    learningTrack: 'exam' | 'course_tech',
    subjectId: string,
    topicId: string,
    persona: UserPersona
  ): Promise<ExamValidation | CourseValidation> {
    if (learningTrack === 'exam') {
      return {
        type: 'exam',
        mockTestQuestions: persona.type === 'student' ? 10 : 5,
        revisionTopics: [topicId],
        targetExam: subjectId,
        examStage: 'prelims',
      };
    }
    return {
      type: 'course_tech',
      assignmentTasks: await this.generateAssignmentTasks(topicId, persona),
      projectComponents: await this.generateProjectComponents(topicId, persona),
      skillsToValidate: [topicId],
      completionCriteria: {
        minimumScore: 70,
        requiredTasks: ['basic_implementation'],
        portfolioSubmission: persona.type === 'freelancer',
        peerReview: persona.type === 'student',
        codeQualityStandards: {
          codeStyle: true,
          documentation: persona.type !== 'student',
          testing: persona.type === 'working_professional',
        },
      },
    };
  }

  /**
   * Smart session scheduling based on persona
   */
  static async suggestOptimalSessionTime(userId: string): Promise<Date[]> {
    try {
      const persona = await this.getUserPersona(userId);
      const now = new Date();
      const suggestions: Date[] = [];

      switch (persona.type) {
        case 'student':
          suggestions.push(
            new Date(now.getTime() + 2 * 60 * 60 * 1000),
            this.getNextDayTime(8, 0),
            this.getNextDayTime(14, 0),
            this.getNextDayTime(19, 0)
          );
          break;

        case 'working_professional':
          suggestions.push(
            this.getNextDayTime(7, 0),
            this.getNextDayTime(12, 30),
            this.getNextDayTime(18, 30),
            this.getNextWeekendTime(9, 0)
          );
          break;

        case 'freelancer':
          suggestions.push(
            new Date(now.getTime() + 30 * 60 * 1000),
            new Date(now.getTime() + 3 * 60 * 60 * 1000),
            this.getNextDayTime(10, 0),
            this.getNextDayTime(15, 0),
            this.getNextDayTime(20, 0)
          );
          break;
      }

      return suggestions;
    } catch (error) {
      throw new Error(`Failed to suggest session times: ${error}`);
    }
  }

  /**
   * Generate learning recommendations based on session performance
   */
  static generateLearningRecommendations(
    sessionPerformance: SessionPerformance,
    persona: UserPersona
  ): LearningRecommendation[] {
    const recommendations: LearningRecommendation[] = [];

    // Performance-based recommendations
    if (sessionPerformance.accuracy < 70) {
      recommendations.push({
        type: 'review_topic',
        title: 'Review Previous Content',
        description: 'Your accuracy was below 70%. Consider reviewing the previous topics before moving forward.',
        priority: 'high',
        action: {
          type: 'review_content',
          parameters: {
            topics: sessionPerformance.areasForImprovement,
            difficulty: 'easy',
          },
          estimatedTime: 15,
          urgency: 'immediate',
        },
        reasoning: 'Strong foundations are crucial for advanced learning',
        expectedBenefit: 'Improved understanding and confidence',
      });
    }

    // Persona-specific recommendations
    if (persona.type === 'working_professional' && sessionPerformance.timeSpent > 900) {
      recommendations.push({
        type: 'break_suggestion',
        title: 'Take a Short Break',
        description: 'You have been studying for over 15 minutes. A short break can improve focus.',
        priority: 'medium',
        action: {
          type: 'take_break',
          parameters: {
            duration: 5,
          },
          estimatedTime: 5,
          urgency: 'within_hour',
        },
        reasoning: 'Working professionals benefit from regular breaks to maintain productivity',
        expectedBenefit: 'Improved focus and retention',
      });
    }

    return recommendations;
  }

  // Utility methods
  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private static getNextDayTime(hours: number, minutes: number): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    return tomorrow;
  }

  private static getNextWeekendTime(hours: number, minutes: number): Date {
    const date = new Date();
    const daysUntilWeekend = 6 - date.getDay();
    date.setDate(date.getDate() + daysUntilWeekend);
    date.setHours(hours, minutes, 0, 0);
    return date;
  }

  private static selectOptimalSessionType(
    persona: UserPersona,
    learningTrack: 'exam' | 'course_tech',
    _topicId: string
  ): MicroLearningSession['sessionType'] {
    if (learningTrack === 'exam') {
      return persona.type === 'student' ? 'concept' : 'practice';
    }
    return persona.type === 'freelancer' ? 'project' : 'assignment';
  }

  private static selectContentType(content: BaseContentItem, learningTrack: 'exam' | 'course_tech'): MicroContent['type'] {
    if (learningTrack === 'course_tech') {
      return content.hasCode ? 'code_snippet' : 'hands_on';
    }
    return content.isExample ? 'example' : 'concept';
  }

  // Placeholder methods for future implementation
  private static async getUserPersona(userId: string): Promise<UserPersona> {
    try {
      // Get user data from Firebase instead of mock
      const { userService } = await import('@/lib/firebase-services');
      const result = await userService.get(userId);

      if (result.success && result.data) {
        return result.data.persona ?? this.getDefaultPersona();
      }

      return this.getDefaultPersona();
    } catch (error) {
      console.error('Failed to get user persona:', error);
      return this.getDefaultPersona();
    }
  }

  private static getDefaultPersona(): UserPersona {
    return {
      type: 'working_professional',
      workSchedule: {
        workingHours: { start: '09:00', end: '18:00' },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'],
        commuteTime: 60,
        flexibility: 'flexible',
        lunchBreakDuration: 60,
      },
      careerContext: {
        currentRole: 'Software Engineer',
        targetRole: 'Senior Software Engineer',
        industry: 'Technology',
        urgency: 'short_term',
        motivation: ['promotion', 'skill_relevance'],
        skillGaps: ['advanced algorithms', 'system design'],
      },
    };
  }

  private static async generateRecommendationsFromHistory(
    _userId: string,
    _sessionHistory: MicroLearningSession[]
  ): Promise<unknown[]> {
    // Analyze user's learning patterns and generate recommendations
    // For now, return mock recommendations - replace with actual recommendation algorithm
    const mockRecommendations = [
      {
        id: '1',
        title: 'Advanced Data Structures',
        description: 'Deep dive into trees, graphs, and hash tables for competitive programming',
        track: 'exam' as const,
        duration: 15,
        difficulty: 'advanced' as const,
        priority: 'high' as const,
        estimatedCompletion: '15 min',
        subjectId: 'computer-science',
        topicId: 'data-structures',
      },
      {
        id: '2',
        title: 'React Hooks Mastery',
        description: 'Master useState, useEffect, and custom hooks with practical examples',
        track: 'course_tech' as const,
        duration: 20,
        difficulty: 'intermediate' as const,
        priority: 'high' as const,
        estimatedCompletion: '20 min',
        subjectId: 'web-development',
        topicId: 'react-hooks',
      },
      {
        id: '3',
        title: 'Algorithm Optimization',
        description: 'Learn to optimize time and space complexity of common algorithms',
        track: 'exam' as const,
        duration: 25,
        difficulty: 'advanced' as const,
        priority: 'medium' as const,
        estimatedCompletion: '25 min',
        subjectId: 'computer-science',
        topicId: 'algorithms',
      },
      {
        id: '4',
        title: 'Database Design Fundamentals',
        description: 'Master normalization, indexing, and query optimization',
        track: 'course_tech' as const,
        duration: 18,
        difficulty: 'intermediate' as const,
        priority: 'medium' as const,
        estimatedCompletion: '18 min',
        subjectId: 'databases',
        topicId: 'design-principles',
      },
    ];

    return mockRecommendations;
  }

  private static async getTopicContent(topicId: string, learningTrack: 'exam' | 'course_tech'): Promise<BaseContentItem[]> {
    // Mock implementation - replace with actual content fetching
    return [
      {
        topic: topicId,
        body: `Introduction to ${topicId}`,
        estimatedTime: 180,
        difficulty: 5,
        tags: [topicId, learningTrack],
        ...(learningTrack === 'exam' && { examType: 'competitive' }),
        hasCode: learningTrack === 'course_tech',
      },
      {
        topic: topicId,
        body: `Advanced concepts in ${topicId}`,
        estimatedTime: 240,
        difficulty: 7,
        tags: [topicId, 'advanced', learningTrack],
        isExample: true,
      },
    ];
  }

  private static async calculateOptimalDifficulty(
    _userId: string,
    _topicId: string
  ): Promise<'easy' | 'medium' | 'hard'> {
    // Mock implementation - replace with actual difficulty calculation
    return 'medium';
  }

  private static generateAcademicExamples(topic: string, learningTrack: 'exam' | 'course_tech'): string[] {
    return learningTrack === 'exam'
      ? [`${topic} question from previous year papers`, `Common ${topic} problems in competitive exams`]
      : [`${topic} in academic research`, `${topic} applications in coursework`];
  }

  private static generateProfessionalExamples(
    topic: string,
    careerContext: CareerContext | undefined,
    learningTrack: 'exam' | 'course_tech'
  ): string[] {
    const role = careerContext?.currentRole ?? 'professional';
    return learningTrack === 'exam'
      ? [`How ${topic} certification benefits ${role}`, `Industry applications of ${topic}`]
      : [`${topic} in ${role} daily work`, `${topic} for career advancement`];
  }

  private static generateFreelancerExamples(topic: string, learningTrack: 'exam' | 'course_tech'): string[] {
    return learningTrack === 'exam'
      ? [`${topic} certification for client credibility`, `${topic} for premium project rates`]
      : [`${topic} for client projects`, `${topic} skills marketplace demand`];
  }

  private static generateStudentResources(topic: string, _learningTrack: 'exam' | 'course_tech') {
    return [
      {
        type: 'article' as const,
        title: `${topic} Study Guide`,
        url: `#/study-guide/${topic}`,
        estimatedTime: 15,
        difficulty: 'beginner' as const,
      },
    ];
  }

  private static generateProfessionalResources(topic: string, _learningTrack: 'exam' | 'course_tech') {
    return [
      {
        type: 'documentation' as const,
        title: `${topic} Professional Guide`,
        url: `#/professional-guide/${topic}`,
        estimatedTime: 20,
        difficulty: 'intermediate' as const,
      },
    ];
  }

  private static generateFreelancerResources(topic: string, _learningTrack: 'exam' | 'course_tech') {
    return [
      {
        type: 'tutorial' as const,
        title: `${topic} Business Applications`,
        url: `#/business-guide/${topic}`,
        estimatedTime: 25,
        difficulty: 'advanced' as const,
      },
    ];
  }

  private static async generateAssignmentTasks(topicId: string, persona: UserPersona) {
    return [
      {
        id: `task_${topicId}_1`,
        title: `Basic ${topicId} Implementation`,
        description: `Implement basic functionality for ${topicId}`,
        estimatedTime: persona.type === 'working_professional' ? 30 : 45,
        difficulty: 'beginner' as const,
        skillsRequired: [topicId],
        template: `// TODO: Implement ${topicId}`,
        deliverables: ['Working code', 'Documentation'],
      },
    ];
  }

  private static async generateProjectComponents(topicId: string, persona: UserPersona) {
    return [
      {
        id: `component_${topicId}_1`,
        componentType: 'frontend' as const,
        title: `${topicId} User Interface`,
        requirements: [`Create UI for ${topicId}`, 'Responsive design', 'User-friendly interface'],
        estimatedHours: persona.type === 'working_professional' ? 2 : 3,
        technologies: ['HTML', 'CSS', 'JavaScript'],
      },
    ];
  }
}
