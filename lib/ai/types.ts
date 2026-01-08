/**
 * @fileoverview Shared Types for AI/LLM Services
 */

import { MissionDifficulty } from '@/types/mission-system';

export interface LLMProvider {
  name: string;
  apiKey: string;
  baseUrl?: string;
  model?: string;
}

export interface QuestionGenerationRequest {
  subjects: string[];
  topics?: string[];
  difficulty: MissionDifficulty;
  questionCount: number;
  questionType: 'multiple_choice' | 'true_false' | 'short_answer' | 'essay';
  examContext?: string;
  learningObjectives?: string[];
  excludeTopics?: string[];
  syllabusContext?: string; // Additional context about the syllabus/chapter
}

export interface QuestionGenerationOptions {
  provider?: 'gemini' | 'openai' | 'anthropic';
  temperature?: number;
  maxTokens?: number;
  includeExplanations?: boolean;
  difficultyProgression?: boolean;
  adaptive?: boolean;
}

export interface LLMQuestionResponse {
  question: string;
  options?: string[];
  correctAnswer: string | number;
  explanation?: string;
  difficulty: MissionDifficulty;
  subject: string;
  topics: string[];
  estimatedTime: number;
  bloomsLevel: 'remember' | 'understand' | 'apply' | 'analyze' | 'evaluate' | 'create';
}

export interface LLMResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
  usage?: {
    promptTokens: number;
    completionTokens: number;
    totalTokens: number;
  };
  provider: string;
  model: string;
}
