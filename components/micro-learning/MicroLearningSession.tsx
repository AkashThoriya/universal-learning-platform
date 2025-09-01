'use client';

import {
  Clock,
  Play,
  Pause,
  Check,
  ArrowRight,
  ArrowLeft,
  BookOpen,
  Code,
  Target,
  User,
  Lightbulb,
  Trophy,
  AlertTriangle,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { MicroLearningService } from '@/lib/micro-learning-service';
import { type MicroLearningSession, type SessionPerformance } from '@/types/micro-learning';

interface MicroLearningSessionProps {
  userId: string;
  subjectId: string;
  topicId: string;
  learningTrack?: 'exam' | 'course_tech';
  requestedDuration?: number;
  onComplete?: (performance: SessionPerformance) => void;
  onError?: (error: Error) => void;
}

export function MicroLearningSession({
  userId,
  subjectId,
  topicId,
  learningTrack = 'exam',
  requestedDuration,
  onComplete,
  onError,
}: MicroLearningSessionProps) {
  const [session, setSession] = useState<MicroLearningSession | null>(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [answers] = useState<Record<string, { correct: boolean; value: string | number }>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [timeSpent, setTimeSpent] = useState(0);

  useEffect(() => {
    loadSession();
  }, [userId, subjectId, topicId, learningTrack]);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isPlaying && startTime) {
      interval = setInterval(() => {
        setTimeSpent(Math.floor((Date.now() - startTime.getTime()) / 1000));
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isPlaying, startTime]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      // Don't handle keyboard events if user is typing in an input
      if (event.target instanceof HTMLInputElement || event.target instanceof HTMLTextAreaElement) {
        return;
      }

      switch (event.key) {
        case ' ': // Spacebar for play/pause
          event.preventDefault();
          if (session && startTime) {
            isPlaying ? pauseSession() : startSession();
          } else if (session && !startTime) {
            startSession();
          }
          break;
        case 'ArrowLeft':
          event.preventDefault();
          previousContent();
          break;
        case 'ArrowRight':
          event.preventDefault();
          nextContent();
          break;
        case 'Enter':
          event.preventDefault();
          if (session && !startTime) {
            startSession();
          } else {
            nextContent();
          }
          break;
        case 'Escape':
          event.preventDefault();
          if (isPlaying) {
            pauseSession();
          }
          break;
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [session, isPlaying, startTime, currentContentIndex]);

  const loadSession = async () => {
    try {
      setLoading(true);
      setError(null);

      const newSession = await MicroLearningService.generateSession(
        userId,
        subjectId,
        topicId,
        learningTrack,
        requestedDuration
      );

      setSession(newSession);
      setLoading(false);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
      setError(errorMessage);
      setLoading(false);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    }
  };

  const startSession = () => {
    setIsPlaying(true);
    if (!startTime) {
      setStartTime(new Date());
    }
  };

  const pauseSession = () => {
    setIsPlaying(false);
  };

  const nextContent = () => {
    if (session && currentContentIndex < session.content.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);
    } else {
      completeSession();
    }
  };

  const previousContent = () => {
    if (currentContentIndex > 0) {
      setCurrentContentIndex(currentContentIndex - 1);
    }
  };

  const completeSession = () => {
    if (session && startTime) {
      const endTime = new Date();
      const totalTimeSpent = Math.floor((endTime.getTime() - startTime.getTime()) / 1000);

      const performance: SessionPerformance = {
        accuracy: calculateAccuracy(),
        timeSpent: totalTimeSpent,
        engagementScore: calculateEngagementScore(),
        conceptsLearned: session.content.map(c => c.id),
        skillsDeveloped: session.learningTrack === 'course_tech' ? [topicId] : [],
        areasForImprovement: identifyAreasForImprovement(),
        trackSpecificMetrics:
          session.learningTrack === 'exam'
            ? {
                mockTestScore: 85,
                revisionEffectiveness: 90,
                examReadinessScore: 80,
                weakTopics: [],
                problemSolvingSpeed: 75,
                accuracyTrend: [80, 85, 85, 90],
              }
            : {
                assignmentCompletionRate: 100,
                projectProgressPercentage: 25,
                skillMasteryLevel: { [topicId]: 75 },
                portfolioQuality: 80,
                problemSolvingApproach: 85,
              },
      };

      onComplete?.(performance);
    }
  };

  const calculateAccuracy = (): number => {
    // Calculate based on quiz answers and interactions
    const totalQuestions = Object.keys(answers).length;
    if (totalQuestions === 0) {
      return 100;
    } // No questions means perfect conceptual understanding

    const correctAnswers = Object.values(answers).filter(answer => answer.correct).length;
    return Math.round((correctAnswers / totalQuestions) * 100);
  };

  const calculateEngagementScore = (): number => {
    // Calculate based on interaction patterns and time spent
    if (!session || !startTime) {
      return 0;
    }

    const expectedTime = session.duration * 60; // Convert to seconds
    const actualTime = timeSpent;
    const timeRatio = Math.min(actualTime / expectedTime, 2); // Cap at 2x expected time

    // Higher engagement if close to expected time
    const timeScore = Math.max(0, 100 - Math.abs(timeRatio - 1) * 50);

    // Interaction score based on content engagement
    const interactionScore = Math.min((currentContentIndex / session.content.length) * 100, 100);

    return Math.round((timeScore + interactionScore) / 2);
  };

  const identifyAreasForImprovement = (): string[] => {
    const areas: string[] = [];

    if (calculateAccuracy() < 70) {
      areas.push('Content comprehension');
    }

    if (timeSpent > (session?.duration ?? 15) * 60 * 1.5) {
      areas.push('Learning pace');
    }

    return areas;
  };

  const getTrackIcon = () => {
    return learningTrack === 'exam' ? BookOpen : Code;
  };

  const getPersonaIcon = () => {
    if (!session) {
      return User;
    }

    switch (session.personaOptimizations.motivationalFraming) {
      case 'academic':
        return BookOpen;
      case 'career':
        return Target;
      case 'skill_building':
        return Code;
      default:
        return User;
    }
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <div className="animate-pulse space-y-6">
            <div className="flex items-center justify-center mb-6">
              <div className="w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
                <div className="w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
              </div>
            </div>
            <div className="text-center space-y-3">
              <div className="h-6 bg-gray-200 rounded w-2/3 mx-auto" />
              <div className="h-4 bg-gray-200 rounded w-1/2 mx-auto" />
            </div>
            <div className="space-y-3">
              <div className="h-4 bg-gray-200 rounded w-full" />
              <div className="h-4 bg-gray-200 rounded w-3/4" />
              <div className="h-4 bg-gray-200 rounded w-1/2" />
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card className="w-full max-w-4xl mx-auto border-red-200">
        <CardContent className="p-8">
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center">
              <AlertTriangle className="h-8 w-8 text-red-600" />
            </div>
            <div className="space-y-2">
              <h3 className="text-lg font-semibold text-red-900">Unable to Load Session</h3>
              <p className="text-red-700 max-w-md mx-auto">{error}</p>
            </div>
            <div className="flex justify-center space-x-3">
              <Button onClick={loadSession} className="bg-red-600 hover:bg-red-700 text-white">
                Try Again
              </Button>
              <Button
                variant="outline"
                onClick={() => window.history.back()}
                className="border-red-300 text-red-700 hover:bg-red-50"
              >
                Go Back
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!session) {
    return (
      <Card className="w-full max-w-4xl mx-auto">
        <CardContent className="p-8">
          <Alert>
            <AlertDescription>No session data available. Please try refreshing the page.</AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  const currentContent = session.content[currentContentIndex];
  const progress = ((currentContentIndex + 1) / session.content.length) * 100;
  const TrackIcon = getTrackIcon();
  const PersonaIcon = getPersonaIcon();

  return (
    <Card className="w-full max-w-4xl mx-auto shadow-lg">
      <CardHeader className="bg-gradient-to-r from-blue-50 to-indigo-50 border-b">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className="flex items-center space-x-2">
              <TrackIcon className="h-6 w-6 text-blue-600" />
              <CardTitle className="text-lg font-semibold text-gray-800">
                {session.duration} min {learningTrack === 'exam' ? 'Exam Prep' : 'Tech Learning'} Session
              </CardTitle>
            </div>
            <div className="flex items-center space-x-2">
              <PersonaIcon className="h-4 w-4 text-gray-500" />
              <Badge variant="secondary" className="text-xs">
                {session.personaOptimizations.motivationalFraming}
              </Badge>
            </div>
          </div>
          <div className="flex items-center space-x-4">
            <div className="text-sm text-gray-600 flex items-center space-x-1">
              <Clock className="h-4 w-4" />
              <span>{formatTime(timeSpent)}</span>
            </div>
            <div className="text-sm text-gray-500">
              {currentContentIndex + 1} of {session.content.length}
            </div>
          </div>
        </div>

        <div className="space-y-2">
          <Progress value={progress} className="w-full h-2" />
          <div className="flex justify-between text-xs text-gray-500">
            <span>Progress: {Math.round(progress)}%</span>
            <span>Difficulty: {session.difficulty}</span>
          </div>
        </div>
      </CardHeader>

      <CardContent className="p-8">
        {!isPlaying && startTime === null ? (
          <div className="text-center space-y-6">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-100 to-indigo-100 rounded-full flex items-center justify-center">
              <Play className="h-8 w-8 text-blue-600" />
            </div>

            <div className="space-y-2">
              <h3 className="text-xl font-semibold text-gray-800">Ready to start learning?</h3>
              <p className="text-gray-600 max-w-md mx-auto">
                This session is optimized for your {session.personaOptimizations.motivationalFraming} learning style and
                will adapt to your pace and preferences.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-lg mx-auto">
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Clock className="h-5 w-5 mx-auto mb-1 text-blue-600" />
                <div className="text-sm font-medium">{session.duration} minutes</div>
                <div className="text-xs text-gray-500">Estimated time</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Lightbulb className="h-5 w-5 mx-auto mb-1 text-yellow-600" />
                <div className="text-sm font-medium">{session.content.length} concepts</div>
                <div className="text-xs text-gray-500">Learning units</div>
              </div>
              <div className="text-center p-3 bg-gray-50 rounded-lg">
                <Trophy className="h-5 w-5 mx-auto mb-1 text-green-600" />
                <div className="text-sm font-medium">{session.difficulty}</div>
                <div className="text-xs text-gray-500">Difficulty level</div>
              </div>
            </div>

            <Button
              onClick={startSession}
              className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-8 py-3 rounded-lg font-medium transition-all duration-200 transform hover:scale-105"
              size="lg"
            >
              <Play className="h-5 w-5 mr-2" />
              Start Learning Session
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <Badge variant="outline" className="capitalize">
                  {currentContent?.type.replace('_', ' ')}
                </Badge>
                <h3 className="text-lg font-semibold text-gray-800">Learning Content</h3>
              </div>
              <Button
                variant="outline"
                size="sm"
                onClick={isPlaying ? pauseSession : startSession}
                className="flex items-center space-x-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    <span>Pause</span>
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    <span>Resume</span>
                  </>
                )}
              </Button>
            </div>

            <div className="bg-white border rounded-lg p-6 min-h-[200px]">
              {learningTrack === 'course_tech' && currentContent?.type === 'code_snippet' ? (
                <div className="bg-gray-900 text-gray-100 p-4 rounded-lg font-mono text-sm overflow-x-auto">
                  <pre>{currentContent.content}</pre>
                </div>
              ) : (
                <div className="prose max-w-none text-gray-700 leading-relaxed">
                  <div dangerouslySetInnerHTML={{ __html: currentContent?.content ?? '' }} />
                </div>
              )}
            </div>

            {session.personaOptimizations.breakReminders && isPlaying && timeSpent > 600 && (
              <Alert className="border-yellow-200 bg-yellow-50">
                <Lightbulb className="h-4 w-4 text-yellow-600" />
                <AlertDescription className="text-yellow-800">
                  You've been learning for {formatTime(timeSpent)}. Consider taking a short break to maintain focus!
                </AlertDescription>
              </Alert>
            )}

            <div className="flex justify-between items-center pt-4">
              <Button
                variant="outline"
                onClick={previousContent}
                disabled={currentContentIndex === 0}
                className="flex items-center space-x-2"
              >
                <ArrowLeft className="h-4 w-4" />
                <span>Previous</span>
              </Button>

              <div className="text-sm text-gray-500">
                Estimated time: {Math.round((currentContent?.estimatedTime ?? 0) / 60)} min
              </div>

              <Button
                onClick={nextContent}
                className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center space-x-2"
              >
                {currentContentIndex === session.content.length - 1 ? (
                  <>
                    <Check className="h-4 w-4" />
                    <span>Complete Session</span>
                  </>
                ) : (
                  <>
                    <span>Next</span>
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
