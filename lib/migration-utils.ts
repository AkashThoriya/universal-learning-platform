/**
 * @fileoverview Migration Utilities and Examples
 *
 * Utilities and examples for working with the standardized type system
 * and enhanced service layer. Follow these patterns for future development.
 *
 * @author Exam Strategy Engine Team
 * @version 2.0.0 (August 2025)
 */

import {
  userService,
  progressService,
  mockTestService,
  dailyLogService as _dailyLogService
} from '@/lib/firebase-services';
import { Result } from '@/lib/types-utils';
import { User, TopicProgress as _TopicProgress, MockTestLog, DailyLog as _DailyLog } from '@/types/exam';

// ============================================================================
// TYPE MIGRATION UTILITIES
// ============================================================================

/**
 * Type guard to check if data matches the new User interface
 */
export function isValidUser(data: any): data is User {
  return (
    data &&
    typeof data.userId === 'string' &&
    typeof data.email === 'string' &&
    typeof data.displayName === 'string' &&
    data.currentExam &&
    typeof data.currentExam.id === 'string' &&
    typeof data.onboardingComplete === 'boolean' &&
    data.createdAt &&
    data.settings &&
    data.stats
  );
}

/**
 * Migrate legacy user data to new User interface
 */
export function migrateLegacyUserData(legacyData: any): User {
  return {
    userId: legacyData.userId,
    email: legacyData.email,
    displayName: legacyData.displayName,
    currentExam: {
      id: legacyData.selectedExamId || 'unknown',
      name: legacyData.examName || 'Unknown Exam',
      targetDate: legacyData.examDate || legacyData.createdAt
    },
    onboardingComplete: legacyData.onboardingComplete || false,
    createdAt: legacyData.createdAt,
    settings: {
      revisionIntervals: [1, 3, 7, 16],
      dailyStudyGoalMinutes: (legacyData.settings?.dailyStudyGoalHrs || 8) * 60,
      tierDefinition: {
        1: 'High Priority',
        2: 'Medium Priority',
        3: 'Low Priority'
      },
      notifications: {
        revisionReminders: true,
        dailyGoalReminders: true,
        healthCheckReminders: true
      },
      preferences: {
        theme: 'system' as const,
        language: 'en',
        timezone: 'UTC'
      },
      userPersona: {
        type: 'student' as const
      }
    },
    stats: {
      totalStudyHours: legacyData.totalStudyHours || 0,
      currentStreak: legacyData.studyStreak || 0,
      longestStreak: legacyData.studyStreak || 0,
      totalMockTests: 0,
      averageScore: 0,
      topicsCompleted: 0,
      totalTopics: 0
    }
  };
}

// ============================================================================
// SERVICE LAYER USAGE EXAMPLES
// ============================================================================

/**
 * Example: Complete user management workflow
 */
export async function userManagementExample(userId: string) {
  try {
    // 1. Fetch user data with error handling
    const userResult = await userService.get(userId);
    if (!userResult.success) {
      console.error('Failed to fetch user:', userResult.error);
      return;
    }

    const user = userResult.data;
    if (!user) {
      console.log('User not found');
      return;
    }

    // 2. Update user settings
    const updateResult = await userService.update(userId, {
      settings: {
        ...user.settings,
        dailyStudyGoalMinutes: 480 // 8 hours
      }
    });

    if (!updateResult.success) {
      console.error('Failed to update user:', updateResult.error);
      return;
    }

    console.log('User updated successfully');

  } catch (error) {
    console.error('Unexpected error in user management:', error);
  }
}

/**
 * Example: Progress tracking workflow
 */
export async function progressTrackingExample(userId: string, topicId: string) {
  try {
    // 1. Get current progress
    const progressResult = await progressService.getTopic(userId, topicId);

    if (!progressResult.success) {
      console.error('Failed to fetch progress:', progressResult.error);
      return;
    }

    // 2. Update progress with new study session
    const updateResult = await progressService.updateTopic(userId, topicId, {
      masteryScore: 85,
      userNotes: 'Completed comprehensive review',
      personalContext: 'Key concepts for exam preparation',
      tags: ['important', 'revision-needed'],
      difficulty: 3,
      importance: 5
    });

    if (!updateResult.success) {
      console.error('Failed to update progress:', updateResult.error);
      return;
    }

    console.log('Progress updated successfully');

  } catch (error) {
    console.error('Unexpected error in progress tracking:', error);
  }
}

/**
 * Example: Mock test analysis workflow
 */
export async function mockTestAnalysisExample(userId: string) {
  try {
    // 1. Create new mock test entry
    const mockTestData: Partial<MockTestLog> = {
      platform: 'Vision IAS',
      testName: 'Prelims Test #5',
      stage: 'prelims',
      type: 'full_length',
      scores: { 'GS Paper I': 98, 'CSAT': 180 },
      maxScores: { 'GS Paper I': 200, 'CSAT': 200 },
      timeTaken: { 'GS Paper I': 110, 'CSAT': 115 },
      analysis: {
        conceptGaps: 10,
        carelessErrors: 5,
        intelligentGuesses: 8,
        timePressures: 2,
        totalQuestions: 100,
        correctAnswers: 75,
        wrongAnswers: 20,
        unattempted: 5,
        accuracy: 75.0,
        speed: 0.83
      },
      topicWisePerformance: [],
      mentalState: {
        confidence: 4,
        anxiety: 2,
        focus: 4
      },
      environment: {
        location: 'Study room',
        distractions: [],
        timeOfDay: 'morning'
      },
      feedback: 'Good performance overall',
      actionItems: ['Focus on current affairs', 'Practice more math']
    };

    const createResult = await mockTestService.create(userId, mockTestData);

    if (!createResult.success) {
      console.error('Failed to create mock test:', createResult.error);
      return;
    }

    console.log('Mock test created with ID:', createResult.data);

    // 2. Fetch recent mock tests for analysis
    const testsResult = await mockTestService.getTests(userId, 5);

    if (!testsResult.success) {
      console.error('Failed to fetch recent tests:', testsResult.error);
      return;
    }

    const recentTests = testsResult.data || [];
    const averageScore = recentTests.reduce((sum, test: any) => {
      const totalScore = (Object.values(test.scores) as number[]).reduce((s: number, score: number) => s + score, 0);
      const maxScore = (Object.values(test.maxScores) as number[]).reduce((s: number, score: number) => s + score, 0);
      return sum + (totalScore / maxScore) * 100;
    }, 0) / recentTests.length;

    console.log(`Average score across ${recentTests.length} tests: ${averageScore.toFixed(1)}%`);

  } catch (error) {
    console.error('Unexpected error in mock test analysis:', error);
  }
}

/**
 * Example: Error handling patterns
 */
export async function errorHandlingExample(userId: string) {
  // Pattern 1: Basic error handling
  const result = await userService.get(userId);
  if (!result.success) {
    // Handle specific error types
    if (result.error.message.includes('not found')) {
      console.log('User does not exist');
    } else {
      console.error('Database error:', result.error);
    }
    return;
  }

  // Pattern 2: Chained operations with error propagation
  const chainedResult = await userService.get(userId)
    .then(async (userResult) => {
      if (!userResult.success) { return userResult; }

      // Use the user data for next operation
      return progressService.getAllProgress(userId);
    });

  if (!chainedResult.success) {
    console.error('Chain failed:', chainedResult.error);
  }
}

// ============================================================================
// TESTING UTILITIES
// ============================================================================

/**
 * Mock service responses for testing
 */
export const mockServiceResponses = {
  successUser: (): Result<User> => ({
    success: true,
    data: {
      userId: 'test-user-id',
      email: 'test@example.com',
      displayName: 'Test User',
      currentExam: {
        id: 'upsc_cse_prelims',
        name: 'UPSC CSE - Prelims',
        targetDate: new Date() as any
      },
      onboardingComplete: true,
      createdAt: new Date() as any,
      settings: {
        revisionIntervals: [1, 3, 7, 16],
        dailyStudyGoalMinutes: 480,
        tierDefinition: { 1: 'High', 2: 'Medium', 3: 'Low' },
        notifications: {
          revisionReminders: true,
          dailyGoalReminders: true,
          healthCheckReminders: true
        },
        preferences: {
          theme: 'system' as const,
          language: 'en',
          timezone: 'UTC'
        },
        userPersona: {
          type: 'student' as const
        }
      },
      stats: {
        totalStudyHours: 120,
        currentStreak: 15,
        longestStreak: 28,
        totalMockTests: 10,
        averageScore: 75.5,
        topicsCompleted: 45,
        totalTopics: 60
      }
    }
  }),

  errorResponse: (message: string): Result<never> => ({
    success: false,
    error: new Error(message)
  })
};

export default {
  migrateLegacyUserData,
  isValidUser,
  userManagementExample,
  progressTrackingExample,
  mockTestAnalysisExample,
  errorHandlingExample,
  mockServiceResponses
};
