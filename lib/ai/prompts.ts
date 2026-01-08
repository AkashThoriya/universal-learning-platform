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
   * Uses strict JSON-only instructions to ensure parseable output.
   */
  generateQuestions: (request: QuestionGenerationRequest): string => {
    const difficultyDescription = getDifficultyDescription(request.difficulty);
    const bloomsLevels = getBloomsLevels(request.difficulty);
    
    // Build topic context if available
    const topicsContext = request.topics?.length 
      ? `- Specific Topics to Cover: ${request.topics.join(', ')}` 
      : '';
    const syllabusContext = request.syllabusContext 
      ? `- Syllabus/Chapter Context: ${request.syllabusContext}` 
      : '';

    return `IMPORTANT: You MUST respond with ONLY valid JSON. No markdown code fences, no comments, no explanations before or after. Start your response with [ and end with ].

You are an expert Socratic Tutor and Exam Creator. Create high-quality, pedagogically rigorous assessment questions.

TASK: Generate exactly ${request.questionCount} ${request.questionType.replace('_', ' ')} questions.

SUBJECT CONTEXT:
- Subject(s): ${request.subjects.join(', ')}
${topicsContext}
${syllabusContext}
- Difficulty Level: ${request.difficulty.toUpperCase()} (${difficultyDescription})
- Target Cognitive Level (Bloom's): ${bloomsLevels.join(' or ')}
${request.examContext ? `- Exam Type: ${request.examContext}` : ''}
${request.learningObjectives?.length ? `- Learning Objectives: ${request.learningObjectives.join(', ')}` : ''}

STRICT CONSTRAINTS:
1. NO "All of the above" or "None of the above" options
2. NO ambiguous answers - exactly one correct answer
3. NO negative phrasing (e.g., "Which is NOT...")
4. Distractors must be plausible, based on common misconceptions
5. Questions must be relevant to the specified topics

REQUIRED JSON SCHEMA - Each object must have ALL these fields:
{
  "question": "Clear, precise question text",
  "options": ["Option A text", "Option B text", "Option C text", "Option D text"],
  "correctAnswer": "A",
  "explanation": "Detailed explanation of why the answer is correct",
  "difficulty": "${request.difficulty}",
  "subject": "${request.subjects[0]}",
  "topics": ["topic1", "topic2"],
  "estimatedTime": 90,
  "bloomsLevel": "${bloomsLevels[0]}"
}

OUTPUT: Return a JSON array with exactly ${request.questionCount} question objects. Start with [ and end with ]. No other text.`;
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
