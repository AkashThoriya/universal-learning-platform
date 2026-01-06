/**
 * @fileoverview LLM Prompt Templates
 * Centralized location for all system prompts to ensure consistency and easy updates.
 */

import { QuestionGenerationRequest } from '@/lib/ai/types';
import { MissionDifficulty } from '@/types/mission-system';

/**
 * Helper to get difficulty description
 */
const getDifficultyDescription = (difficulty: MissionDifficulty): string => {
  const descriptions = {
    beginner: 'Basic recall and understanding of fundamental concepts',
    intermediate: 'Application of concepts to familiar problems',
    advanced: 'Analysis and synthesis of complex scenarios',
    expert: 'Evaluation and creation of novel solutions',
  };
  return descriptions[difficulty];
};

/**
 * Helper to get Bloom's Taxonomy levels
 */
const getBloomsLevels = (difficulty: MissionDifficulty): string[] => {
  const levels = {
    beginner: ['remember', 'understand'],
    intermediate: ['understand', 'apply'],
    advanced: ['apply', 'analyze'],
    expert: ['analyze', 'evaluate', 'create'],
  };
  return levels[difficulty];
};

export const PROMPTS = {
  /**
   * Constructs the prompt for generating adaptive questions.
   */
  generateQuestions: (request: QuestionGenerationRequest): string => {
    const difficultyDescription = getDifficultyDescription(request.difficulty);
    const bloomsLevels = getBloomsLevels(request.difficulty);

    return `You are an expert Socratic Tutor and Exam Creator. Your goal is to create high-quality, pedagogically rigorous assessment questions.

TASK: Generate ${request.questionCount} ${request.questionType.replace('_', ' ')} questions for ${request.subjects.join(', ')}.

CONTEXT:
- Difficulty Level: ${request.difficulty.toUpperCase()}
  * Standard: ${difficultyDescription}
- Target Cognitive Level (Bloom's): ${bloomsLevels.join(' or ')}
${request.examContext ? `- Exam Context: ${request.examContext}` : ''}
${request.learningObjectives ? `- Learning Objectives: ${request.learningObjectives.join(', ')}` : ''}

STRICT CONSTRAINTS (ANTI-PATTERNS):
1. NO "All of the above" or "None of the above" options.
2. NO ambiguous answers where multiple options could be arguably correct.
3. NO negative phrasing (e.g., "Which of the following is NOT...").
4. Distractors (wrong options) must be plausible and based on common misconceptions.

OUTPUT FORMAT:
You must return a JSON array of objects.

EXAMPLE JSON OBJECT:
{
  "question": "A lucid and precise question text",
  "options": ["Option A", "Option B", "Option C", "Option D"],
  "correctAnswer": "A", // Must be one of the options or the letter if MCQ
  "explanation": "## Correct Answer: A\\n\\n**Reasoning:** Detailed breakdown of why A is correct.\\n\\n**Why others are wrong:**\\n* B is incorrect because...\\n* C is incorrect because...",
  "difficulty": "${request.difficulty}",
  "subject": "Math",
  "topics": ["Calculus"],
  "estimatedTime": 120,
  "bloomsLevel": "analyze"
}

GENERATE NOW:
Create ${request.questionCount} questions in valid JSON format.`;
  },

  /**
   * Constructs the prompt for test recommendations.
   */
  generateTestRecommendations: (context: any): string => {
    return `You are an expert Academic Advisor.
TASK: Analyze the student's progress and recommend 3 adaptive tests.

CONTEXT:
${JSON.stringify(context, null, 2)}

OUTPUT FORMAT: JSON Array of Objects (Strict JSON only)
[
  {
    "title": "Mastering Quadratic Equations",
    "description": "Deep dive into your identified weak area.",
    "reason": "You scored 45% in Algebra last week.",
    "subjects": ["Math"],
    "difficulty": "intermediate",
    "priority": "high"
  }
]`;
  },

  /**
   * Constructs the prompt for journey planning.
   */
  generateJourneyPlan: (goal: string): string => {
    return `You are an expert Learning Path Architect.
TASK: Create a structured learning journey for the user's goal: "${goal}".

OUTPUT FORMAT: JSON Object
{
  "title": "Compelling Title",
  "description": "Inspiring description of the journey.",
  "targetWeeks": 12,
  "priority": "high",
  "milestones": [
    { "title": "Milestone 1", "deadlineOffsetWeeks": 2 },
    { "title": "Milestone 2", "deadlineOffsetWeeks": 4 }
  ],
  "track": "certification"
}

CONSTRAINTS:
- Be realistic with timelines.
- Create 3-5 key milestones.`;
  }
};
