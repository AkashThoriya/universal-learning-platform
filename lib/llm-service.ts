/**
 * @fileoverview LLM Service with Provider Abstraction
 *
 * Provides a unified interface for Large Language Model integrations
 * with support for multiple providers (Gemini, OpenAI, etc.) and
 * specialized question generation for adaptive testing.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { createError, createSuccess, Result } from '@/lib/types-utils';
import { AdaptiveQuestion } from '@/types/adaptive-testing';
import { MissionDifficulty } from '@/types/mission-system';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

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

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

class GeminiProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;

  constructor(config: LLMProvider) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl || 'https://generativelanguage.googleapis.com/v1beta';
    this.model = config.model || 'gemini-1.5-flash';
  }

  async generateQuestions(
    request: QuestionGenerationRequest,
    options: QuestionGenerationOptions = {}
  ): Promise<LLMResponse<LLMQuestionResponse[]>> {
    try {
      const prompt = this.buildQuestionPrompt(request, options);

      const response = await fetch(`${this.baseUrl}/models/${this.model}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                {
                  text: prompt,
                },
              ],
            },
          ],
          generationConfig: {
            temperature: options.temperature || 0.7,
            maxOutputTokens: options.maxTokens || 4096,
            candidateCount: 1,
          },
          safetySettings: [
            {
              category: 'HARM_CATEGORY_HARASSMENT',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
            {
              category: 'HARM_CATEGORY_HATE_SPEECH',
              threshold: 'BLOCK_MEDIUM_AND_ABOVE',
            },
          ],
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();

      if (!data.candidates?.[0]?.content) {
        throw new Error('Invalid response from Gemini API');
      }

      const generatedContent = data.candidates[0].content.parts[0].text;
      const questions = this.parseQuestionResponse(generatedContent, request);

      return {
        success: true,
        data: questions,
        provider: 'gemini',
        model: this.model,
        usage: data.usageMetadata
          ? {
              promptTokens: data.usageMetadata.promptTokenCount || 0,
              completionTokens: data.usageMetadata.candidatesTokenCount || 0,
              totalTokens: data.usageMetadata.totalTokenCount || 0,
            }
          : undefined,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred',
        provider: 'gemini',
        model: this.model,
      };
    }
  }

  private buildQuestionPrompt(request: QuestionGenerationRequest, options: QuestionGenerationOptions): string {
    const difficultyDescription = this.getDifficultyDescription(request.difficulty);
    const bloomsLevels = this.getBloomsLevels(request.difficulty);

    return `Generate ${request.questionCount} ${request.questionType.replace('_', ' ')} questions for ${request.subjects.join(', ')}.

REQUIREMENTS:
- Difficulty: ${request.difficulty} (${difficultyDescription})
- Cognitive Level: ${bloomsLevels.join(' or ')}
- Question Type: ${request.questionType}
- Subjects: ${request.subjects.join(', ')}
${request.topics ? `- Topics: ${request.topics.join(', ')}` : ''}
${request.examContext ? `- Exam Context: ${request.examContext}` : ''}
${request.learningObjectives ? `- Learning Objectives: ${request.learningObjectives.join(', ')}` : ''}
${options.includeExplanations ? '- Include detailed explanations for answers' : ''}

OUTPUT FORMAT (JSON):
[
  {
    "question": "Question text here",
    ${request.questionType === 'multiple_choice' ? '"options": ["A) Option 1", "B) Option 2", "C) Option 3", "D) Option 4"],' : ''}
    "correctAnswer": ${request.questionType === 'multiple_choice' ? '"A"' : '"Correct answer text"'},
    ${options.includeExplanations ? '"explanation": "Detailed explanation of why this is correct",' : ''}
    "difficulty": "${request.difficulty}",
    "subject": "Primary subject",
    "topics": ["topic1", "topic2"],
    "estimatedTime": 120,
    "bloomsLevel": "apply"
  }
]

Generate diverse, high-quality questions that test real understanding. Ensure questions are:
1. Clear and unambiguous
2. Academically rigorous
3. Properly aligned with the specified difficulty
4. Free from bias or controversial content
5. Practically relevant to the subject matter

Return ONLY the JSON array, no additional text.`;
  }

  private getDifficultyDescription(difficulty: MissionDifficulty): string {
    const descriptions = {
      beginner: 'Basic recall and understanding of fundamental concepts',
      intermediate: 'Application of concepts to familiar problems',
      advanced: 'Analysis and synthesis of complex scenarios',
      expert: 'Evaluation and creation of novel solutions',
    };
    return descriptions[difficulty];
  }

  private getBloomsLevels(difficulty: MissionDifficulty): string[] {
    const levels = {
      beginner: ['remember', 'understand'],
      intermediate: ['understand', 'apply'],
      advanced: ['apply', 'analyze'],
      expert: ['analyze', 'evaluate', 'create'],
    };
    return levels[difficulty];
  }

  private parseQuestionResponse(content: string, request: QuestionGenerationRequest): LLMQuestionResponse[] {
    try {
      // Clean the response to extract JSON
      const jsonMatch = content.match(/\[[\s\S]*\]/);
      if (!jsonMatch) {
        throw new Error('No JSON array found in response');
      }

      const questions = JSON.parse(jsonMatch[0]);

      return questions.map((q: any, index: number) => ({
        question: q.question || '',
        options: q.options || undefined,
        correctAnswer: q.correctAnswer || '',
        explanation: q.explanation || undefined,
        difficulty: q.difficulty || request.difficulty,
        subject: q.subject || request.subjects[0],
        topics: q.topics || [],
        estimatedTime: q.estimatedTime || 60,
        bloomsLevel: q.bloomsLevel || 'understand',
      }));
    } catch (error) {
      // Fallback: create basic questions if parsing fails
      console.warn('Failed to parse LLM response, using fallback:', error);
      return this.createFallbackQuestions(request);
    }
  }

  private createFallbackQuestions(request: QuestionGenerationRequest): LLMQuestionResponse[] {
    const questions: LLMQuestionResponse[] = [];

    for (let i = 0; i < Math.min(request.questionCount, 5); i++) {
      questions.push({
        question: `Generated ${request.difficulty} question ${i + 1} for ${request.subjects[0]}`,
        options:
          request.questionType === 'multiple_choice'
            ? ['A) Option 1', 'B) Option 2', 'C) Option 3', 'D) Option 4']
            : undefined,
        correctAnswer: request.questionType === 'multiple_choice' ? 'A' : 'Sample answer',
        explanation: 'This is a generated question for testing purposes.',
        difficulty: request.difficulty,
        subject: request.subjects[0],
        topics: request.topics || [request.subjects[0]],
        estimatedTime: 90,
        bloomsLevel: 'understand',
      });
    }

    return questions;
  }
}

// ============================================================================
// MAIN LLM SERVICE
// ============================================================================

export class LLMService {
  private static instance: LLMService;
  private providers: Map<string, GeminiProvider> = new Map();

  private constructor() {
    this.initializeProviders();
  }

  static getInstance(): LLMService {
    if (!LLMService.instance) {
      LLMService.instance = new LLMService();
    }
    return LLMService.instance;
  }

  private initializeProviders(): void {
    // Initialize Gemini provider
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY || process.env.GEMINI_API_KEY;
    if (geminiApiKey) {
      this.providers.set(
        'gemini',
        new GeminiProvider({
          name: 'gemini',
          apiKey: geminiApiKey,
        })
      );
    }

    // Future: Add other providers here
    // OpenAI, Anthropic, etc.
  }

  /**
   * Generate adaptive test questions using LLM
   */
  async generateAdaptiveQuestions(
    request: QuestionGenerationRequest,
    options: QuestionGenerationOptions = {}
  ): Promise<Result<AdaptiveQuestion[]>> {
    try {
      const providerName = options.provider || 'gemini';
      const provider = this.providers.get(providerName);

      if (!provider) {
        return createError(new Error(`LLM provider '${providerName}' not available. Check API key configuration.`));
      }

      const response = await provider.generateQuestions(request, options);

      if (!response.success || !response.data) {
        return createError(new Error(response.error || 'Failed to generate questions'));
      }

      // Convert LLM response to AdaptiveQuestion format
      const adaptiveQuestions: AdaptiveQuestion[] = response.data.map((llmQuestion, index) => ({
        id: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        question: llmQuestion.question,
        options: llmQuestion.options || [],
        correctAnswer: llmQuestion.correctAnswer,
        explanation: llmQuestion.explanation,
        difficulty: this.mapDifficultyToNumeric(llmQuestion.difficulty),
        subject: llmQuestion.subject,
        topics: llmQuestion.topics,
        timeLimit: llmQuestion.estimatedTime,
        discriminationIndex: this.calculateInitialDiscrimination(llmQuestion.difficulty),
        responseHistory: [],
        metaTags: [
          `difficulty:${llmQuestion.difficulty}`,
          `blooms:${llmQuestion.bloomsLevel}`,
          `subject:${llmQuestion.subject}`,
          ...llmQuestion.topics.map(topic => `topic:${topic}`),
        ],
        createdAt: new Date(),
        updatedAt: new Date(),
        createdBy: 'llm',
        validated: false, // LLM questions should be reviewed
        qualityScore: 0.8, // Initial score for LLM questions
      }));

      return createSuccess(adaptiveQuestions);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Unknown error in question generation'));
    }
  }

  /**
   * Check if LLM service is available
   */
  isAvailable(provider = 'gemini'): boolean {
    return this.providers.has(provider);
  }

  /**
   * Get available providers
   */
  getAvailableProviders(): string[] {
    return Array.from(this.providers.keys());
  }

  private mapDifficultyToNumeric(difficulty: MissionDifficulty): number {
    const mapping = {
      beginner: 1,
      intermediate: 2,
      advanced: 3,
      expert: 4,
    };
    return mapping[difficulty] || 2;
  }

  private calculateInitialDiscrimination(difficulty: MissionDifficulty): number {
    // Initial discrimination values based on difficulty
    const discrimination = {
      beginner: 1.0,
      intermediate: 1.2,
      advanced: 1.5,
      expert: 1.8,
    };
    return discrimination[difficulty] || 1.2;
  }
}

// Export singleton instance
export const llmService = LLMService.getInstance();
