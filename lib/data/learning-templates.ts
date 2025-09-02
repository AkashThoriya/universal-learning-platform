/**
 * @fileoverview Learning Goal Templates Data
 *
 * Static data definitions for pre-built learning goal templates
 * Used by the Universal Learning Platform for custom learning paths
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

/* eslint-disable no-magic-numbers */

import type { CustomGoal, MissionDifficulty } from '../../types/mission-system';

/**
 * Learning goal template interface (without user-specific fields)
 */
export type LearningGoalTemplate = Omit<CustomGoal, 'userId' | 'missions' | 'createdAt' | 'updatedAt' | 'isActive'>;

/**
 * Available learning goal categories (must match mission-system.ts)
 */
export const LEARNING_CATEGORIES = ['programming', 'devops', 'language', 'design', 'business', 'other'] as const;

export type LearningCategory = (typeof LEARNING_CATEGORIES)[number];

/**
 * Pre-built learning goal templates
 * These templates provide structure for popular learning goals
 */
export const LEARNING_GOAL_TEMPLATES: LearningGoalTemplate[] = [
  {
    id: 'docker_kubernetes_mastery',
    title: 'Master Docker & Kubernetes',
    description: 'Complete DevOps containerization mastery with hands-on projects and real-world scenarios',
    category: 'devops',
    estimatedDuration: 60,
    difficulty: 'intermediate' as MissionDifficulty,
    progress: {
      completedMissions: 0,
      totalMissions: 12,
      currentStreak: 0,
      estimatedCompletion: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000), // 60 days from now
    },
  },
  {
    id: 'english_mastery',
    title: 'Master English Speaking & Writing',
    description:
      'Comprehensive English language improvement program covering fluency, grammar, and professional communication',
    category: 'language',
    estimatedDuration: 90,
    difficulty: 'beginner' as MissionDifficulty,
    progress: {
      completedMissions: 0,
      totalMissions: 18,
      currentStreak: 0,
      estimatedCompletion: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000), // 90 days from now
    },
  },
  {
    id: 'cs_fundamentals',
    title: 'Master Computer Science Fundamentals',
    description: 'Core CS concepts including data structures, algorithms, system design, and practical implementation',
    category: 'programming',
    estimatedDuration: 120,
    difficulty: 'intermediate' as MissionDifficulty,
    progress: {
      completedMissions: 0,
      totalMissions: 24,
      currentStreak: 0,
      estimatedCompletion: new Date(Date.now() + 120 * 24 * 60 * 60 * 1000), // 120 days from now
    },
  },
  {
    id: 'react_frontend_mastery',
    title: 'Master React & Frontend Development',
    description: 'Modern React development with TypeScript, state management, testing, and performance optimization',
    category: 'programming',
    estimatedDuration: 75,
    difficulty: 'intermediate' as MissionDifficulty,
    progress: {
      completedMissions: 0,
      totalMissions: 15,
      currentStreak: 0,
      estimatedCompletion: new Date(Date.now() + 75 * 24 * 60 * 60 * 1000), // 75 days from now
    },
  },
  {
    id: 'aws_cloud_certification',
    title: 'AWS Cloud Practitioner to Solutions Architect',
    description: 'Complete AWS certification path with hands-on labs and real cloud project experience',
    category: 'devops',
    estimatedDuration: 100,
    difficulty: 'advanced' as MissionDifficulty,
    progress: {
      completedMissions: 0,
      totalMissions: 20,
      currentStreak: 0,
      estimatedCompletion: new Date(Date.now() + 100 * 24 * 60 * 60 * 1000), // 100 days from now
    },
  },
  {
    id: 'data_science_python',
    title: 'Data Science with Python',
    description: 'End-to-end data science workflow: pandas, numpy, scikit-learn, machine learning, and visualization',
    category: 'programming',
    estimatedDuration: 110,
    difficulty: 'intermediate' as MissionDifficulty,
    progress: {
      completedMissions: 0,
      totalMissions: 22,
      currentStreak: 0,
      estimatedCompletion: new Date(Date.now() + 110 * 24 * 60 * 60 * 1000), // 110 days from now
    },
  },
  {
    id: 'ui_ux_design_mastery',
    title: 'UI/UX Design Mastery',
    description: 'Complete design thinking process: user research, wireframing, prototyping, and design systems',
    category: 'design',
    estimatedDuration: 80,
    difficulty: 'beginner' as MissionDifficulty,
    progress: {
      completedMissions: 0,
      totalMissions: 16,
      currentStreak: 0,
      estimatedCompletion: new Date(Date.now() + 80 * 24 * 60 * 60 * 1000), // 80 days from now
    },
  },
  {
    id: 'digital_marketing_mastery',
    title: 'Digital Marketing & Growth Hacking',
    description:
      'Modern marketing strategies: SEO, content marketing, social media, analytics, and conversion optimization',
    category: 'business',
    estimatedDuration: 65,
    difficulty: 'beginner' as MissionDifficulty,
    progress: {
      completedMissions: 0,
      totalMissions: 13,
      currentStreak: 0,
      estimatedCompletion: new Date(Date.now() + 65 * 24 * 60 * 60 * 1000), // 65 days from now
    },
  },
  {
    id: 'python_programming_mastery',
    title: 'Master Python Programming',
    description: 'Complete Python mastery from basics to advanced concepts including web development and automation',
    category: 'programming',
    estimatedDuration: 85,
    difficulty: 'beginner' as MissionDifficulty,
    progress: {
      completedMissions: 0,
      totalMissions: 17,
      currentStreak: 0,
      estimatedCompletion: new Date(Date.now() + 85 * 24 * 60 * 60 * 1000), // 85 days from now
    },
  },
  {
    id: 'cybersecurity_fundamentals',
    title: 'Cybersecurity Fundamentals',
    description: 'Essential cybersecurity concepts: network security, ethical hacking, risk assessment, and compliance',
    category: 'other',
    estimatedDuration: 95,
    difficulty: 'intermediate' as MissionDifficulty,
    progress: {
      completedMissions: 0,
      totalMissions: 19,
      currentStreak: 0,
      estimatedCompletion: new Date(Date.now() + 95 * 24 * 60 * 60 * 1000), // 95 days from now
    },
  },
];

/**
 * Templates organized by category for easy filtering
 */
export const TEMPLATES_BY_CATEGORY = LEARNING_GOAL_TEMPLATES.reduce(
  (acc, template) => {
    const categoryTemplates = acc[template.category] ?? [];
    categoryTemplates.push(template);
    acc[template.category] = categoryTemplates;
    return acc;
  },
  {} as Record<string, LearningGoalTemplate[]>
);

/**
 * Templates organized by difficulty for easy filtering
 */
export const TEMPLATES_BY_DIFFICULTY = LEARNING_GOAL_TEMPLATES.reduce(
  (acc, template) => {
    if (!acc[template.difficulty]) {
      acc[template.difficulty] = [];
    }
    acc[template.difficulty].push(template);
    return acc;
  },
  {} as Record<MissionDifficulty, LearningGoalTemplate[]>
);

/**
 * Helper function to get template by ID
 */
export const getTemplateById = (id: string): LearningGoalTemplate | undefined => {
  return LEARNING_GOAL_TEMPLATES.find(template => template.id === id);
};

/**
 * Helper function to get available categories
 */
export const getAvailableCategories = (): string[] => {
  return Object.keys(TEMPLATES_BY_CATEGORY).sort();
};

/**
 * Helper function to search templates by query
 */
export const searchTemplates = (query: string): LearningGoalTemplate[] => {
  const lowercaseQuery = query.toLowerCase();
  return LEARNING_GOAL_TEMPLATES.filter(
    template =>
      template.title.toLowerCase().includes(lowercaseQuery) ||
      template.description.toLowerCase().includes(lowercaseQuery) ||
      template.category.toLowerCase().includes(lowercaseQuery)
  );
};

/**
 * Helper function to validate template structure
 */
export const validateTemplateStructure = (template: unknown): template is Partial<LearningGoalTemplate> => {
  if (typeof template !== 'object' || template === null) {
    return false;
  }

  const templateObj = template as Record<string, unknown>;
  const requiredFields = ['id', 'title', 'description', 'category', 'estimatedDuration', 'difficulty', 'progress'];
  return requiredFields.every(field => field in templateObj);
};
