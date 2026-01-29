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

import { PROMPTS } from '@/lib/ai/prompts';
import {
  LLMProvider,
  QuestionGenerationRequest,
  QuestionGenerationOptions,
  LLMResponse,
  LLMQuestionResponse,
} from '@/lib/ai/types';
import { logInfo, logError, logWarning } from '@/lib/utils/logger';
import { createError, createSuccess, Result } from '@/lib/utils/types-utils';
import { AdaptiveQuestion } from '@/types/adaptive-testing';
import { MissionDifficulty } from '@/types/mission-system';

// ============================================================================
// PROVIDER IMPLEMENTATIONS
// ============================================================================

class GeminiProvider {
  private apiKey: string;
  private baseUrl: string;
  private model: string;
  private maxRetries = 3;

  constructor(config: LLMProvider) {
    this.apiKey = config.apiKey;
    this.baseUrl = config.baseUrl ?? 'https://generativelanguage.googleapis.com/v1beta';
    this.model = config.model ?? 'gemini-2.5-flash';
  }

  async generateQuestions(
    request: QuestionGenerationRequest,
    options: QuestionGenerationOptions = {}
  ): Promise<LLMResponse<LLMQuestionResponse[]>> {
    let attempts = 0;
    while (attempts < this.maxRetries) {
      try {
        const prompt = PROMPTS.generateQuestions(request);

        // User requested gemini-2.5-flash for faster responses.
        const targetModel = 'gemini-2.5-flash';

        const response = await fetch(`${this.baseUrl}/models/${targetModel}:generateContent?key=${this.apiKey}`, {
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
              temperature: options.temperature ?? 0.7,
              maxOutputTokens: options.maxTokens ?? 8192, // Increased for CoT
              candidateCount: 1,
              responseMimeType: 'application/json', // Force JSON mode
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
          if (response.status === 429 || response.status >= 500) {
            throw new Error(`Transient API error: ${response.status}`);
          }
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
          model: targetModel,
          usage: {
            promptTokens: data.usageMetadata?.promptTokenCount ?? 0,
            completionTokens: data.usageMetadata?.candidatesTokenCount ?? 0,
            totalTokens: data.usageMetadata?.totalTokenCount ?? 0,
          },
        };
      } catch (error) {
        attempts++;
        if (attempts >= this.maxRetries) {
          return {
            success: false,
            error: error instanceof Error ? error.message : 'Unknown error occurred after retries',
            provider: 'gemini',
            model: this.model,
          };
        }
        // Exponential backoff
        await new Promise(resolve => setTimeout(resolve, Math.pow(2, attempts) * 1000));
      }
    }
    return { success: false, error: 'Max retries exceeded', provider: 'gemini', model: this.model };
  }

  /**
   * Parse LLM response with multiple fallback strategies for robust JSON extraction.
   * Returns valid questions even if some fail validation.
   */
  private parseQuestionResponse(content: string, request: QuestionGenerationRequest): LLMQuestionResponse[] {
    const strategies = [
      // Strategy 1: Direct parse (best case - LLM returned pure JSON)
      () => JSON.parse(content.trim()),

      // Strategy 2: Remove markdown code fences
      () => {
        const cleaned = content
          .replace(/```(?:json)?\s*\n?/gi, '')
          .replace(/\n?\s*```/g, '')
          .trim();
        return JSON.parse(cleaned);
      },

      // Strategy 3: Extract JSON array from surrounding text
      () => {
        const match = content.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!match) {
          throw new Error('No JSON array found in response');
        }
        return JSON.parse(match[0]);
      },

      // Strategy 4: Fix common JSON issues and retry
      () => {
        const fixed = content
          // Remove markdown
          .replace(/```(?:json)?\s*\n?/gi, '')
          .replace(/\n?\s*```/g, '')
          // Fix trailing commas
          .replace(/,(\s*[}\]])/g, '$1')
          // Fix unquoted keys (simple cases)
          .replace(/([{,]\s*)([a-zA-Z_]\w*)(\s*:)/g, '$1"$2"$3')
          // Remove comments (// style)
          .replace(/\/\/[^\n]*/g, '')
          .trim();

        const match = fixed.match(/\[\s*\{[\s\S]*\}\s*\]/);
        if (!match) {
          throw new Error('No JSON array after cleanup');
        }
        return JSON.parse(match[0]);
      },
    ];

    let lastError: Error | null = null;

    for (let i = 0; i < strategies.length; i++) {
      try {
        const strategy = strategies[i];
        if (!strategy) {
          continue;
        }
        const rawData = strategy();
        const validated = this.validateAndNormalizeQuestions(rawData, request);

        if (validated.length > 0) {
          logInfo(`[LLM] Successfully parsed ${validated.length} questions using strategy ${i + 1}`);
          return validated;
        }
      } catch (error) {
        lastError = error instanceof Error ? error : new Error(String(error));
        logWarning(`[LLM] Parse strategy ${i + 1} failed: ${lastError.message}`);
      }
    }

    logError('[LLM] All JSON parsing strategies failed', { rawContent: content.substring(0, 500) });
    throw new Error(`Failed to parse LLM response: ${lastError?.message || 'Unknown error'}`);
  }

  /**
   * Validate and normalize questions, filtering out invalid ones.
   */
  private validateAndNormalizeQuestions(data: unknown, request: QuestionGenerationRequest): LLMQuestionResponse[] {
    if (!Array.isArray(data)) {
      throw new Error('Response is not an array');
    }

    return data
      .filter((q: any) => {
        // Required fields validation
        if (!q.question || typeof q.question !== 'string') {
          return false;
        }
        if (q.correctAnswer === undefined || q.correctAnswer === null) {
          return false;
        }
        return true;
      })
      .map((q: any) => ({
        question: String(q.question).trim(),
        options: Array.isArray(q.options) ? q.options.map((o: any) => String(o)) : undefined,
        correctAnswer: q.correctAnswer,
        explanation: q.explanation ? String(q.explanation) : '',
        difficulty: q.difficulty ?? request.difficulty,
        subject: q.subject ?? request.subjects[0] ?? 'General',
        topics: Array.isArray(q.topics) ? q.topics : [],
        estimatedTime: typeof q.estimatedTime === 'number' ? q.estimatedTime : 60,
        bloomsLevel: q.bloomsLevel ?? 'understand',
      }));
  }

  async generateTestRecommendations(context: any): Promise<LLMResponse<any>> {
    try {
      const prompt = PROMPTS.generateTestRecommendations(context);

      const targetModel = 'gemini-2.5-flash';

      const response = await fetch(`${this.baseUrl}/models/${targetModel}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      return {
        success: true,
        data: JSON.parse(content),
        provider: 'gemini',
        model: targetModel,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate recommendations',
        provider: 'gemini',
        model: this.model,
      };
    }
  }

  async generateJourneyPlan(goal: string): Promise<LLMResponse<any>> {
    try {
      const prompt = PROMPTS.generateJourneyPlan(goal);

      const targetModel = 'gemini-2.5-flash';

      const response = await fetch(`${this.baseUrl}/models/${targetModel}:generateContent?key=${this.apiKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          contents: [{ parts: [{ text: prompt }] }],
          generationConfig: { responseMimeType: 'application/json' },
        }),
      });

      if (!response.ok) {
        throw new Error(`Gemini API error: ${response.status}`);
      }
      const data = await response.json();
      const content = data.candidates[0].content.parts[0].text;
      return {
        success: true,
        data: JSON.parse(content),
        provider: 'gemini',
        model: targetModel,
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Failed to generate plan',
        provider: 'gemini',
        model: this.model,
      };
    }
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

  async generateTestRecommendations(context: any, options: { provider?: string } = {}): Promise<LLMResponse<any>> {
    const providerName = options.provider ?? 'gemini';
    const provider = this.providers.get(providerName);

    if (!provider) {
      return {
        success: false,
        error: `LLM provider '${providerName}' not available. Check API key configuration.`,
        provider: providerName,
        model: 'unknown',
      };
    }
    // Delegate the call to the provider's method
    return provider.generateTestRecommendations(context);
  }

  /**
   * Generate a journey plan using AI
   */
  async generateJourneyPlan(goal: string, options: { provider?: string } = {}): Promise<LLMResponse<any>> {
    const providerName = options.provider ?? 'gemini';
    const provider = this.providers.get(providerName);

    if (!provider) {
      return {
        success: false,
        error: `LLM provider '${providerName}' not available. Check API key configuration.`,
        provider: providerName,
        model: 'unknown',
      };
    }
    return provider.generateJourneyPlan(goal);
  }

  private initializeProviders(): void {
    // Initialize Gemini provider
    const geminiApiKey = process.env.NEXT_PUBLIC_GEMINI_API_KEY ?? process.env.GEMINI_API_KEY;
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
      const providerName = options.provider ?? 'gemini';
      const provider = this.providers.get(providerName);

      if (!provider) {
        return createError(new Error(`LLM provider '${providerName}' not available. Check API key configuration.`));
      }

      const response = await provider.generateQuestions(request, options);

      if (!response.success || !response.data) {
        return createError(new Error(response.error ?? 'Failed to generate questions'));
      }

      // Convert LLM response to AdaptiveQuestion format
      const adaptiveQuestions: AdaptiveQuestion[] = response.data.map((llmQuestion, index) => ({
        id: `${Date.now()}_${index}_${Math.random().toString(36).substr(2, 9)}`,
        question: llmQuestion.question,
        options: llmQuestion.options ?? [],
        correctAnswer: llmQuestion.correctAnswer,
        explanation: llmQuestion.explanation ?? 'No explanation provided',
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
    return mapping[difficulty] ?? 2;
  }

  private calculateInitialDiscrimination(difficulty: MissionDifficulty): number {
    // Initial discrimination values based on difficulty
    const discrimination = {
      beginner: 1.0,
      intermediate: 1.2,
      advanced: 1.5,
      expert: 1.8,
    };
    return discrimination[difficulty] ?? 1.2;
  }
}

// Export singleton instance
export const llmService = LLMService.getInstance();
