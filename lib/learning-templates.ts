/**
 * @fileoverview Learning Template Service
 *
 * Service layer for managing learning goal templates.
 * Provides methods to retrieve, filter, and create custom goals from templates.
 * Follows the established service pattern in the codebase.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import type { CustomGoal, MissionDifficulty } from '../types/mission-system';

import {
  LEARNING_GOAL_TEMPLATES,
  TEMPLATES_BY_CATEGORY,
  TEMPLATES_BY_DIFFICULTY,
  getTemplateById,
  getAvailableCategories,
  searchTemplates,
  validateTemplateStructure,
  type LearningGoalTemplate,
} from './data/learning-templates';
import { Result, createSuccess, createError } from './types-utils';

/**
 * Service class for managing learning goal templates
 * Provides methods to retrieve, filter, and create custom goals from templates
 */
export class LearningTemplateService {
  /**
   * Get all available templates
   */
  static getAllTemplates(): LearningGoalTemplate[] {
    return LEARNING_GOAL_TEMPLATES;
  }

  /**
   * Get templates filtered by category
   * @param category - The category to filter by, or 'all' for all templates
   */
  static getTemplatesByCategory(category?: string): LearningGoalTemplate[] {
    if (!category || category === 'all') {
      return LEARNING_GOAL_TEMPLATES;
    }
    return TEMPLATES_BY_CATEGORY[category] ?? [];
  }

  /**
   * Get a specific template by its ID
   * @param id - The template ID to retrieve
   */
  static getTemplateById(id: string): LearningGoalTemplate | undefined {
    return getTemplateById(id);
  }

  /**
   * Get templates by difficulty level
   * @param difficulty - The difficulty level to filter by
   */
  static getTemplatesByDifficulty(difficulty: MissionDifficulty): LearningGoalTemplate[] {
    return TEMPLATES_BY_DIFFICULTY[difficulty] || [];
  }

  /**
   * Get available categories
   */
  static getAvailableCategories(): string[] {
    return getAvailableCategories();
  }

  /**
   * Search templates by title, description, or category
   * @param query - The search query
   */
  static searchTemplates(query: string): LearningGoalTemplate[] {
    return searchTemplates(query);
  }

  /**
   * Get recommended templates based on user persona
   * @param persona - The user persona type
   */
  static getRecommendedTemplates(persona: 'student' | 'working_professional' | 'freelancer'): LearningGoalTemplate[] {
    switch (persona) {
      case 'student':
        // Students might prefer CS fundamentals, programming languages
        return this.getTemplatesByCategory('programming').concat(this.getTemplatesByCategory('language'));
      case 'working_professional':
        // Working professionals might prefer career advancement skills
        return this.getTemplatesByCategory('devops')
          .concat(this.getTemplatesByCategory('business'))
          .concat(this.getTemplatesByCategory('programming'));
      case 'freelancer':
        // Freelancers might prefer diverse skills for client work
        return this.getTemplatesByCategory('design')
          .concat(this.getTemplatesByCategory('programming'))
          .concat(this.getTemplatesByCategory('business'));
      default:
        return this.getAllTemplates();
    }
  }

  /**
   * Create a custom goal from a template
   * @param userId - The user ID to assign the goal to
   * @param templateId - The template ID to use
   * @param customizations - Optional customizations to apply
   */
  static async createCustomGoalFromTemplate(
    userId: string,
    templateId: string,
    customizations?: Partial<CustomGoal>
  ): Promise<Result<CustomGoal>> {
    try {
      const template = this.getTemplateById(templateId);
      if (!template) {
        return createError(new Error(`Template with ID ${templateId} does not exist`));
      }

      const customGoal: CustomGoal = {
        ...template,
        userId,
        createdAt: new Date(),
        updatedAt: new Date(),
        missions: [],
        isActive: true,
        ...customizations,
      };

      return createSuccess(customGoal);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to create custom goal from template'));
    }
  }

  /**
   * Validate template data structure
   * @param template - The template to validate
   */
  static validateTemplate(template: unknown): template is Partial<CustomGoal> {
    return validateTemplateStructure(template);
  }

  /**
   * Get templates suitable for a specific duration (in days)
   * @param maxDuration - Maximum duration in days
   * @param minDuration - Minimum duration in days (optional)
   */
  static getTemplatesByDuration(maxDuration: number, minDuration = 0): LearningGoalTemplate[] {
    return LEARNING_GOAL_TEMPLATES.filter(
      template => template.estimatedDuration >= minDuration && template.estimatedDuration <= maxDuration
    );
  }

  /**
   * Get template statistics
   */
  static getTemplateStats(): {
    totalTemplates: number;
    categoriesCount: number;
    averageDuration: number;
    difficultyDistribution: Record<MissionDifficulty, number>;
  } {
    const difficultyDistribution = LEARNING_GOAL_TEMPLATES.reduce(
      (acc, template) => {
        acc[template.difficulty] = (acc[template.difficulty] || 0) + 1;
        return acc;
      },
      {} as Record<MissionDifficulty, number>
    );

    const averageDuration =
      LEARNING_GOAL_TEMPLATES.reduce((sum, template) => sum + template.estimatedDuration, 0) /
      LEARNING_GOAL_TEMPLATES.length;

    return {
      totalTemplates: LEARNING_GOAL_TEMPLATES.length,
      categoriesCount: this.getAvailableCategories().length,
      averageDuration: Math.round(averageDuration),
      difficultyDistribution,
    };
  }
}

// Export the templates data for direct access if needed
export { LEARNING_GOAL_TEMPLATES, type LearningGoalTemplate };
