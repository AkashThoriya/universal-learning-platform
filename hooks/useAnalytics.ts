/**
 * @fileoverview Analytics Tracking Hooks - Enterprise Implementation
 *
 * Custom React hooks for seamless analytics tracking across the application.
 * Provides automatic event tracking, performance monitoring, and user
 * behavior analysis with minimal integration overhead.
 *
 * Features:
 * - Automatic event tracking with context awareness
 * - Performance monitoring and timing analysis
 * - Cross-track learning pattern detection
 * - Real-time analytics data synchronization
 * - Error tracking and recovery analytics
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { useEffect, useCallback, useRef } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import {
  intelligentAnalyticsService,
  AnalyticsEventType,
  AnalyticsEventData,
  AnalyticsMetadata,
} from '@/lib/analytics/intelligent-analytics-service';
import { logger } from '@/lib/utils/logger';

// ============================================================================
// ANALYTICS TRACKING HOOK
// ============================================================================

/**
 * Main analytics tracking hook
 * Provides methods to track events and monitor performance
 */
export const useAnalytics = () => {
  const { user } = useAuth();
  const sessionStartTime = useRef<number>(Date.now());
  const pageStartTime = useRef<number>(Date.now());

  // Track event with automatic context
  const trackEvent = useCallback(
    async (
      eventType: AnalyticsEventType,
      category: 'exam' | 'course_tech' | 'cross_track',
      data: AnalyticsEventData,
      customMetadata?: unknown
    ) => {
      if (!user?.uid) {
        logger.warn('Cannot track event: User not authenticated');
        return;
      }

      try {
        await intelligentAnalyticsService.trackEvent(
          user.uid,
          eventType,
          category,
          {
            ...data,
            sessionDuration: Date.now() - sessionStartTime.current,
            pageTime: Date.now() - pageStartTime.current,
          },
          customMetadata as Partial<AnalyticsMetadata> | undefined
        );
      } catch (error) {
        logger.error('Failed to track analytics event', error as Error);
      }
    },
    [user?.uid]
  );

  // Track exam events
  const trackExamEvent = useCallback(
    (
      eventType: Extract<
        AnalyticsEventType,
        'mock_test_started' | 'mock_test_completed' | 'question_answered' | 'revision_session_started'
      >,
      data: AnalyticsEventData
    ) => {
      return trackEvent(eventType, 'exam', data);
    },
    [trackEvent]
  );

  // Track course events
  const trackCourseEvent = useCallback(
    (
      eventType: Extract<
        AnalyticsEventType,
        'assignment_started' | 'project_created' | 'skill_practice_session' | 'code_execution'
      >,
      data: AnalyticsEventData
    ) => {
      return trackEvent(eventType, 'course_tech', data);
    },
    [trackEvent]
  );

  // Track cross-track events
  const trackCrossTrackEvent = useCallback(
    (
      eventType: Extract<AnalyticsEventType, 'track_switched' | 'cross_skill_applied' | 'learning_transfer_identified'>,
      data: AnalyticsEventData
    ) => {
      return trackEvent(eventType, 'cross_track', data);
    },
    [trackEvent]
  );

  // Reset page timing on component mount
  useEffect(() => {
    pageStartTime.current = Date.now();
  }, []);

  return {
    trackEvent,
    trackExamEvent,
    trackCourseEvent,
    trackCrossTrackEvent,
  };
};

// ============================================================================
// EXAM ANALYTICS HOOK
// ============================================================================

/**
 * Specialized hook for exam-related analytics
 */
export const useExamAnalytics = () => {
  const { trackExamEvent } = useAnalytics();

  const trackMockTestStart = useCallback(
    (testData: {
      testId: string;
      subjectId: string;
      difficulty: 'easy' | 'medium' | 'hard';
      totalQuestions: number;
    }) => {
      return trackExamEvent('mock_test_started', {
        ...testData,
        startTime: Date.now(),
      });
    },
    [trackExamEvent]
  );

  const trackMockTestComplete = useCallback(
    (testData: {
      testId: string;
      score: number;
      accuracy: number;
      timeSpent: number;
      totalQuestions: number;
      correctAnswers: number;
      skippedQuestions: number;
    }) => {
      return trackExamEvent('mock_test_completed', {
        ...testData,
        completionTime: Date.now(),
      });
    },
    [trackExamEvent]
  );

  const trackQuestionAnswer = useCallback(
    (questionData: {
      questionId: string;
      isCorrect: boolean;
      timeSpent: number;
      difficulty: 'easy' | 'medium' | 'hard';
      topicId: string;
      attempts: number;
      hintsUsed: number;
    }) => {
      return trackExamEvent('question_answered', questionData);
    },
    [trackExamEvent]
  );

  const trackRevisionSession = useCallback(
    (revisionData: { topicId: string; duration: number; questionsReviewed: number; improvementScore: number }) => {
      return trackExamEvent('revision_session_started', revisionData);
    },
    [trackExamEvent]
  );

  return {
    trackMockTestStart,
    trackMockTestComplete,
    trackQuestionAnswer,
    trackRevisionSession,
  };
};

// ============================================================================
// COURSE ANALYTICS HOOK
// ============================================================================

/**
 * Specialized hook for course/tech-related analytics
 */
export const useCourseAnalytics = () => {
  const { trackCourseEvent } = useAnalytics();

  const trackAssignmentStart = useCallback(
    (assignmentData: {
      assignmentId: string;
      courseId: string;
      difficulty: 'easy' | 'medium' | 'hard';
      estimatedDuration: number;
    }) => {
      return trackCourseEvent('assignment_started', {
        ...assignmentData,
        startTime: Date.now(),
      });
    },
    [trackCourseEvent]
  );

  const trackProjectCreation = useCallback(
    (projectData: {
      projectId: string;
      projectType: string;
      technologies: string[];
      complexity: 'simple' | 'moderate' | 'complex';
    }) => {
      return trackCourseEvent('project_created', {
        ...projectData,
        creationTime: Date.now(),
      });
    },
    [trackCourseEvent]
  );

  const trackSkillPractice = useCallback(
    (practiceData: {
      skillId: string;
      practiceType: 'tutorial' | 'exercise' | 'challenge';
      duration: number;
      completionRate: number;
    }) => {
      return trackCourseEvent('skill_practice_session', practiceData);
    },
    [trackCourseEvent]
  );

  const trackCodeExecution = useCallback(
    (codeData: {
      language: string;
      executionTime: number;
      linesOfCode: number;
      successful: boolean;
      errors?: string[];
    }) => {
      return trackCourseEvent('code_execution', codeData);
    },
    [trackCourseEvent]
  );

  return {
    trackAssignmentStart,
    trackProjectCreation,
    trackSkillPractice,
    trackCodeExecution,
  };
};

// ============================================================================
// CROSS-TRACK ANALYTICS HOOK
// ============================================================================

/**
 * Specialized hook for cross-track learning analytics
 */
export const useCrossTrackAnalytics = () => {
  const { trackCrossTrackEvent } = useAnalytics();

  const trackTrackSwitch = useCallback(
    (switchData: {
      fromTrack: 'exam' | 'course_tech';
      toTrack: 'exam' | 'course_tech';
      context: string;
      sessionDuration: number;
    }) => {
      return trackCrossTrackEvent('track_switched', switchData);
    },
    [trackCrossTrackEvent]
  );

  const trackSkillApplication = useCallback(
    (applicationData: {
      sourceSkill: string;
      sourceTrack: 'exam' | 'course_tech';
      targetContext: string;
      targetTrack: 'exam' | 'course_tech';
      effectivenessRating: number;
    }) => {
      return trackCrossTrackEvent('cross_skill_applied', applicationData);
    },
    [trackCrossTrackEvent]
  );

  const trackLearningTransfer = useCallback(
    (transferData: {
      transferredFrom: 'exam' | 'course_tech';
      transferredTo: 'exam' | 'course_tech';
      skillsApplied: string[];
      context: string;
      successRate: number;
    }) => {
      return trackCrossTrackEvent('learning_transfer_identified', transferData);
    },
    [trackCrossTrackEvent]
  );

  return {
    trackTrackSwitch,
    trackSkillApplication,
    trackLearningTransfer,
  };
};

// ============================================================================
// PERFORMANCE MONITORING HOOK
// ============================================================================

/**
 * Hook for performance monitoring and timing analytics
 */
export const usePerformanceAnalytics = () => {
  const { trackEvent } = useAnalytics();
  const performanceEntries = useRef<Map<string, number>>(new Map());

  const startTiming = useCallback((operationId: string) => {
    performanceEntries.current.set(operationId, performance.now());
  }, []);

  const endTiming = useCallback(
    (operationId: string, category: 'exam' | 'course_tech' | 'cross_track', metadata?: unknown) => {
      const startTime = performanceEntries.current.get(operationId);
      if (!startTime) {
        logger.warn('No start time found for operation', { operationId });
        return;
      }

      const duration = performance.now() - startTime;
      performanceEntries.current.delete(operationId);

      // Track performance event
      trackEvent('performance_measured' as AnalyticsEventType, category, {
        operationId,
        duration,
        timestamp: Date.now(),
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
      });

      return duration;
    },
    [trackEvent]
  );

  const measureFunction = useCallback(
    async <T>(
      operationId: string,
      category: 'exam' | 'course_tech' | 'cross_track',
      fn: () => Promise<T>,
      metadata?: unknown
    ): Promise<T> => {
      startTiming(operationId);
      try {
        const result = await fn();
        endTiming(operationId, category, {
          success: true,
          ...(metadata && typeof metadata === 'object' ? metadata : {}),
        });
        return result;
      } catch (error) {
        endTiming(operationId, category, {
          success: false,
          error: (error as Error).message,
          ...(metadata && typeof metadata === 'object' ? metadata : {}),
        });
        throw error;
      }
    },
    [startTiming, endTiming]
  );

  return {
    startTiming,
    endTiming,
    measureFunction,
  };
};

// ============================================================================
// ERROR ANALYTICS HOOK
// ============================================================================

/**
 * Hook for tracking errors and recovery analytics
 */
export const useErrorAnalytics = () => {
  const { trackEvent } = useAnalytics();

  const trackError = useCallback(
    (errorData: {
      errorType: string;
      errorMessage: string;
      stackTrace?: string;
      component: string;
      userAction: string;
      recoverable: boolean;
    }) => {
      return trackEvent('error_occurred' as AnalyticsEventType, 'cross_track', {
        ...errorData,
        timestamp: Date.now(),
        userAgent: navigator.userAgent,
        url: window.location.href,
      });
    },
    [trackEvent]
  );

  const trackRecovery = useCallback(
    (recoveryData: { errorType: string; recoveryMethod: string; recoveryTime: number; successful: boolean }) => {
      return trackEvent('error_recovery' as AnalyticsEventType, 'cross_track', {
        ...recoveryData,
        timestamp: Date.now(),
      });
    },
    [trackEvent]
  );

  return {
    trackError,
    trackRecovery,
  };
};

// ============================================================================
// SESSION ANALYTICS HOOK
// ============================================================================

/**
 * Hook for session-level analytics and user engagement
 */
export const useSessionAnalytics = () => {
  const { trackEvent } = useAnalytics();
  const sessionData = useRef({
    startTime: Date.now(),
    pageViews: 0,
    interactions: 0,
    features: new Set<string>(),
  });

  const trackPageView = useCallback(
    (pageName: string, metadata?: unknown) => {
      sessionData.current.pageViews++;
      return trackEvent('page_viewed' as AnalyticsEventType, 'cross_track', {
        pageName,
        pageViewCount: sessionData.current.pageViews,
        sessionDuration: Date.now() - sessionData.current.startTime,
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
      });
    },
    [trackEvent]
  );

  const trackInteraction = useCallback(
    (interactionType: string, metadata?: unknown) => {
      sessionData.current.interactions++;
      return trackEvent('user_interaction' as AnalyticsEventType, 'cross_track', {
        interactionType,
        interactionCount: sessionData.current.interactions,
        sessionDuration: Date.now() - sessionData.current.startTime,
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
      });
    },
    [trackEvent]
  );

  const trackFeatureUsage = useCallback(
    (featureName: string, metadata?: unknown) => {
      sessionData.current.features.add(featureName);
      return trackEvent('feature_used' as AnalyticsEventType, 'cross_track', {
        featureName,
        uniqueFeaturesUsed: sessionData.current.features.size,
        sessionDuration: Date.now() - sessionData.current.startTime,
        ...(metadata && typeof metadata === 'object' ? metadata : {}),
      });
    },
    [trackEvent]
  );

  // Track session end on unmount
  useEffect(() => {
    return () => {
      trackEvent('session_ended' as AnalyticsEventType, 'cross_track', {
        sessionDuration: Date.now() - sessionData.current.startTime,
        totalPageViews: sessionData.current.pageViews,
        totalInteractions: sessionData.current.interactions,
        uniqueFeatures: Array.from(sessionData.current.features),
      });
    };
  }, [trackEvent]);

  return {
    trackPageView,
    trackInteraction,
    trackFeatureUsage,
  };
};

export default {
  useAnalytics,
  useExamAnalytics,
  useCourseAnalytics,
  useCrossTrackAnalytics,
  usePerformanceAnalytics,
  useErrorAnalytics,
  useSessionAnalytics,
};
