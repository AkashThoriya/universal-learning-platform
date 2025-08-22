'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { MicroLearningSession, SessionSummary, MicroLearningDashboard } from '@/components/micro-learning';
import { type SessionPerformance } from '@/types/micro-learning';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useSearchParams } from 'next/navigation';

type ViewState = 'dashboard' | 'session' | 'summary';

interface SessionConfig {
  userId: string;
  subjectId: string;
  topicId: string;
  learningTrack: 'exam' | 'course_tech';
  duration?: number;
}

function MicroLearningContent() {
  const searchParams = useSearchParams();
  const [currentView, setCurrentView] = useState<ViewState>('dashboard');
  const [sessionConfig, setSessionConfig] = useState<SessionConfig | null>(null);
  const [sessionPerformance, setSessionPerformance] = useState<SessionPerformance | null>(null);
  const [completedSession, setCompletedSession] = useState<any>(null);

  // Mock user ID - in a real app, this would come from authentication
  const userId = 'user-123';

  // Check for auto-start parameters from URL
  useEffect(() => {
    const autoStart = searchParams.get('auto');
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');
    const track = searchParams.get('track') as 'exam' | 'course_tech' | null;
    const duration = searchParams.get('duration');

    if (autoStart === 'true' && subject && topic && track) {
      setSessionConfig({
        userId,
        subjectId: subject,
        topicId: topic,
        learningTrack: track,
        duration: duration ? parseInt(duration) : undefined
      });
      setCurrentView('session');
    }
  }, [searchParams]);

  const handleStartSession = (
    subjectId: string, 
    topicId: string, 
    track: 'exam' | 'course_tech', 
    duration?: number
  ) => {
    setSessionConfig({
      userId,
      subjectId,
      topicId,
      learningTrack: track,
      duration
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
    // In a real app, you'd show a proper error notification
    alert(`Session error: ${error.message}`);
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
        {currentView === 'dashboard' && (
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
            requestedDuration={sessionConfig.duration}
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
          <div className="h-8 w-48 bg-gray-200 rounded mx-auto mb-4"></div>
          <div className="h-4 w-32 bg-gray-200 rounded mx-auto"></div>
        </div>
      </div>
    }>
      <MicroLearningContent />
    </Suspense>
  );
}
