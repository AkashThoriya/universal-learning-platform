'use client';

import { ArrowLeft } from 'lucide-react';
import { useSearchParams } from 'next/navigation';
import React, { useState, useEffect, Suspense } from 'react';

import { MicroLearningSession, SessionSummary, MicroLearningDashboard } from '@/components/micro-learning';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/AuthContext';
import { type SessionPerformance } from '@/types/micro-learning';

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
  const [completedSession, setCompletedSession] = useState<any>(null);

  // Get authenticated user ID - ensure user is authenticated
  const userId = user?.uid;

  // Check for auto-start parameters from URL
  useEffect(() => {
    if (!userId) { return; } // Don't process if user not authenticated

    const autoStart = searchParams.get('auto');
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const track = searchParams.get('track') as 'exam' | 'course_tech' | null;
    const duration = searchParams.get('duration');

    if (autoStart === 'true' && subject && topic && track) {
      const parsedDuration = duration ? parseInt(duration) : undefined;
      setSessionConfig({
        userId,
        subjectId: subject,
        topicId: topic,
        learningTrack: track,
        ...(parsedDuration !== undefined && { duration: parsedDuration })
      });
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
          <Button onClick={() => window.location.href = '/login'}>
            Go to Login
          </Button>
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
    if (!userId) { return; } // Safety check

    setSessionConfig({
      userId,
      subjectId,
      topicId,
      learningTrack: track,
      ...(duration !== undefined && { duration })
    });
    setCurrentView('session');
  };

  const handleSessionComplete = (performance: SessionPerformance) => {
    setSessionPerformance(performance);
    setCompletedSession(sessionConfig);
    setCurrentView('summary');
  };

  const handleSessionError = (error: Error) => {
    console.error('Session error:', error);
    // TODO: Replace with proper toast notification
    console.warn(`Session error: ${error.message}`);
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
            onViewProgress={() => console.log('View progress clicked')}
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
    <Suspense fallback={
      <div className="min-h-screen bg-gray-50 py-8 px-4 flex items-center justify-center">
        <div className="animate-pulse text-center">
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4" />
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto" />
        </div>
      </div>
    }>
      <MicroLearningContent />
    </Suspense>
  );
}
