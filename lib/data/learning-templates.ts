/**
 * @fileoverview Learning Template Service
 */

import type { MissionDifficulty } from '@/types/mission-system';

export interface LearningGoalTemplate {
  id: string;
  title: string;
  description: string;
  category: 'programming' | 'language' | 'devops' | 'business' | 'design' | 'other';
  difficulty: MissionDifficulty;
  estimatedDuration: number;
  requirements: string[];
  outcomes: string[];
}

// Basic template data
export const LEARNING_GOAL_TEMPLATES: LearningGoalTemplate[] = [
  {
    id: 'basic-programming',
    title: 'Basic Programming Concepts',
    description: 'Learn fundamental programming concepts',
    category: 'programming',
    difficulty: 'beginner',
    estimatedDuration: 30,
    requirements: ['Basic computer literacy'],
    outcomes: ['Understanding of variables, loops, and functions']
  }
];

export const TEMPLATES_BY_CATEGORY: Record<string, LearningGoalTemplate[]> = {
  programming: LEARNING_GOAL_TEMPLATES.filter(t => t.category === 'programming'),
};

export const TEMPLATES_BY_DIFFICULTY: Record<string, LearningGoalTemplate[]> = {
  beginner: LEARNING_GOAL_TEMPLATES.filter(t => t.difficulty === 'beginner'),
};

export class LearningTemplateService {
  static getAllTemplates(): LearningGoalTemplate[] {
    return LEARNING_GOAL_TEMPLATES;
  }

  static getTemplateById(id: string): LearningGoalTemplate | null {
    return LEARNING_GOAL_TEMPLATES.find(t => t.id === id) ?? null;
  }
}

export const getTemplateById = (id: string) => LEARNING_GOAL_TEMPLATES.find(t => t.id === id) ?? null;
export const getAvailableCategories = () => Object.keys(TEMPLATES_BY_CATEGORY);
export const searchTemplates = (query: string) => LEARNING_GOAL_TEMPLATES.filter(t => t.title.includes(query));
export const validateTemplateStructure = (template: LearningGoalTemplate) => !!template.id;

export default LearningTemplateService;
