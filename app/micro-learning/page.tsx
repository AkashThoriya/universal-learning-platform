'use client';

import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';

import { MicroLearningSession, SessionSummary, MicroLearningDashboard } from '@/components/micro-learning';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { logInfo, logError } from '@/lib/logger';
import { type SessionPerformance, type MicroLearningSession as MicroLearningSessionType } from '@/types/micro-learning';

type ViewState = 'dashboard' | 'session' | 'summary';

interface SessionConfig {
  userId: string;
  subjectId: string;
  topicId: string;
  learningTrack: 'exam' | 'course_tech';
  duration?: number | undefined;
}

function MicroLearningContent() {
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [sessionPerformance, setSessionPerformance] = useState<SessionPerformance | null>(null);
  const [completedSession, setCompletedSession] = useState<MicroLearningSessionType | null>(null);

  // Get authenticated user ID - ensure user is authenticated
  const userId = user?.uid;

  // Check for auto-start parameters from URL
  useEffect(() => {
    if (!userId) {
      logInfo('Micro-learning: No user available, skipping auto-start check');
      return;
    } // Don't process if user not authenticated

    const autoStart = searchParams.get('auto');
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const track = searchParams.get('track') as 'exam' | 'course_tech' | null;
    const duration = searchParams.get('duration');

    logInfo('Micro-learning: Checking URL parameters', {
      autoStart,
      subject,
      topic,
      track,
      duration,
      userId,
    });

    if (autoStart === 'true' && subject && topic && track) {
      const parsedDuration = duration ? parseInt(duration) : undefined;
      const config = {
        userId,
        subjectId: subject,
        topicId: topic,
        learningTrack: track,
        ...(parsedDuration !== undefined && { duration: parsedDuration }),
      };

      logInfo('Micro-learning: Auto-starting session', {
        config,
        userId,
      });

      setSessionConfig(config);
      setCurrentView('session');
    }
  }, [searchParams, userId]); // Add userId to dependency array

  // Show authentication required if no user
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="text-center space-y-4 max-w-md">
          <h2 className="text-2xl font-bold text-gray-900">Authentication Required</h2>
          <p className="text-gray-600">Please log in to access micro-learning sessions.</p>
          <Button onClick={() => (window.location.href = '/login')}>Go to Login</Button>
        </div>
      </div>
    );
  }

  const handleStartSession = (
    subjectId: string,
    topicId: string,
    track: 'exam' | 'course_tech',
    duration?: number | undefined
  ) => {
    if (!userId) {
      logInfo('Micro-learning: Cannot start session - no user ID available');
      return;
    } // Safety check

    const config = {
      userId,
      subjectId,
      topicId,
      learningTrack: track,
      ...(duration !== undefined && { duration }),
    };

    logInfo('Micro-learning: Starting session', {
      config,
      userId,
    });

    setSessionConfig(config);
    setCurrentView('session');
  };

  const handleSessionComplete = (performance: SessionPerformance) => {
    logInfo('Micro-learning: Session completed', {
      performance: {
        accuracy: performance.accuracy,
        timeSpent: performance.timeSpent,
        engagementScore: performance.engagementScore,
        conceptsLearned: performance.conceptsLearned.length,
        skillsDeveloped: performance.skillsDeveloped.length,
      },
      userId,
      sessionConfig: sessionConfig
        ? {
            subjectId: sessionConfig.subjectId,
            topicId: sessionConfig.topicId,
            track: sessionConfig.learningTrack,
          }
        : null,
    });

    setSessionPerformance(performance);

    // Transform sessionConfig to MicroLearningSession
    if (sessionConfig) {
      const session: MicroLearningSessionType = {
        id: `session_${Date.now()}`,
        userId: sessionConfig.userId,
        learningTrack: sessionConfig.learningTrack,
        subjectId: sessionConfig.subjectId,
        topicId: sessionConfig.topicId,
        sessionType: 'practice',
        duration: sessionConfig.duration ?? 15,
        difficulty: 'medium',
        personaOptimizations: {
          sessionLength: sessionConfig.duration ?? 15,
          breakReminders: true,
          contextSwitching: false,
          motivationalFraming: 'academic',
          complexityRamp: 'standard',
          learningTrackPreference: sessionConfig.learningTrack,
          notificationStyle: 'standard',
          uiDensity: 'comfortable',
        },
        content: [],
        validationMethod:
          sessionConfig.learningTrack === 'exam'
            ? {
                type: 'exam' as const,
                mockTestQuestions: 5,
                revisionTopics: [sessionConfig.topicId],
                targetExam: 'general',
              }
            : {
                type: 'course_tech' as const,
                assignmentTasks: [],
                projectComponents: [],
                skillsToValidate: [],
                completionCriteria: {
                  minimumScore: 70,
                  requiredTasks: [],
                  portfolioSubmission: false,
                  peerReview: false,
                },
              },
        createdAt: new Date(),
      };
      setCompletedSession(session);
    }

    setCurrentView('summary');
  };

  const handleSessionError = (error: Error) => {
    logError('Micro-learning: Session error occurred', {
      error: error.message,
      stack: error.stack,
      userId,
      sessionConfig: sessionConfig
        ? {
            subjectId: sessionConfig.subjectId,
            topicId: sessionConfig.topicId,
            track: sessionConfig.learningTrack,
          }
        : null,
      context: 'micro_learning_session_error',
    });

    // TODO: Replace with proper toast notification
    // console.warn(`Session error: ${error.message}`);
    setCurrentView('dashboard');
  };

  const handleContinueLearning = () => {
    setCurrentView('dashboard');
    setSessionConfig(null);
    setSessionPerformance(null);
    setCompletedSession(null);
  };

  const handleReturnToDashboard = () => {
    setCurrentView('dashboard');
    setSessionConfig(null);
    setSessionPerformance(null);
    setCompletedSession(null);
  };

  const handleBackToDashboard = () => {
    setCurrentView('dashboard');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4">
      <div className="max-w-7xl mx-auto">
        {/* Header with back button for non-dashboard views */}
        {currentView !== 'dashboard' && (
          <div className="mb-6">
            <Button
              variant="ghost"
              onClick={handleBackToDashboard}
              className="flex items-center space-x-2 text-gray-600 hover:text-gray-900"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Back to Dashboard</span>
            </Button>
          </div>
        )}

        {/* Main Content */}
        {currentView === 'dashboard' && userId && (
          <MicroLearningDashboard
            userId={userId}
            onStartSession={handleStartSession}
            onViewProgress={() => {
              logInfo('Micro-learning: View progress clicked', { userId });
            }}
          />
        )}

        {currentView === 'session' && sessionConfig && (
          <MicroLearningSession
            userId={sessionConfig.userId}
            subjectId={sessionConfig.subjectId}
            topicId={sessionConfig.topicId}
            learningTrack={sessionConfig.learningTrack}
            requestedDuration={sessionConfig.duration ?? 15}
            onComplete={handleSessionComplete}
            onError={handleSessionError}
          />
        )}

        {currentView === 'summary' && sessionPerformance && completedSession && (
          <SessionSummary
            performance={sessionPerformance}
            session={completedSession}
            onContinueLearning={handleContinueLearning}
            onReturnToDashboard={handleReturnToDashboard}
          />
        )}
      </div>
    </div>
  );
}

export default function MicroLearningPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
          <div className="animate-pulse text-center">
            <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4" />
            <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
          </div>
        </div>
      }
    >
      <MicroLearningContent />
    </Suspense>
  );
}
