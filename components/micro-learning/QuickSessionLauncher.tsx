'use client';

import { BookOpen, Code, Clock, Play, Zap, Target, Loader2, AlertCircle, User } from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

interface QuickSessionConfig {
  title: string;
  description: string;
  subjectId: string;
  topicId: string;
  track: 'exam' | 'course_tech';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
}

interface QuickSessionLauncherProps {
  userId?: string;
  sessions?: QuickSessionConfig[];
  onStartSession?: (subjectId: string, topicId: string, track: 'exam' | 'course_tech', duration?: number) => void;
  className?: string;
  autoLoadPersonalized?: boolean;
}

const defaultSessions: QuickSessionConfig[] = [
  {
    title: 'Quick Algorithms Review',
    description: 'Fast-paced review of sorting and searching algorithms',
    subjectId: 'computer-science',
    topicId: 'algorithms',
    track: 'exam',
    duration: 10,
    difficulty: 'intermediate',
  },
  {
    title: 'React Components Deep Dive',
    description: 'Master functional and class components',
    subjectId: 'web-development',
    topicId: 'react-components',
    track: 'course_tech',
    duration: 15,
    difficulty: 'intermediate',
  },
  {
    title: 'Data Structures Basics',
    description: 'Arrays, linked lists, and stacks fundamentals',
    subjectId: 'computer-science',
    topicId: 'data-structures',
    track: 'exam',
    duration: 12,
    difficulty: 'beginner',
  },
];

export function QuickSessionLauncher({
  userId,
  sessions,
  onStartSession,
  className = '',
  autoLoadPersonalized = true,
}: QuickSessionLauncherProps) {
  const { user } = useAuth();
  const [displaySessions, setDisplaySessions] = useState<QuickSessionConfig[]>(sessions || defaultSessions);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [startingSessionIndex, setStartingSessionIndex] = useState<number | null>(null);

  const activeUserId = userId || user?.uid;

  const loadPersonalizedSessions = useCallback(async () => {
    if (!activeUserId) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load personalized recommendations from Firebase
      const { simpleLearningRecommendationsService } = await import('@/lib/algorithms/simple-learning-recommendations');
      const recommendationsResult = await simpleLearningRecommendationsService.generateBasicRecommendations(activeUserId);

      // Convert recommendations to quick session format if successful
      if (recommendationsResult.success && recommendationsResult.data) {
        const personalizedSessions = recommendationsResult.data.map((rec, index) => ({
          id: rec.id,
          title: rec.title,
          description: rec.description,
          duration: 15 + (index * 5), // Default durations: 15, 20, 25 minutes
          difficulty: (rec.priority === 'high' ? 'beginner' : rec.priority === 'medium' ? 'intermediate' : 'advanced') as 'beginner' | 'intermediate' | 'advanced',
          track: 'exam' as const,
          subjectId: 'general',
          topicId: rec.category,
          icon: '📚',
          color: 'blue',
        }));
        
        setDisplaySessions(personalizedSessions.length > 0 ? personalizedSessions : defaultSessions);
      } else {
        setDisplaySessions(defaultSessions);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load personalized sessions');
      setDisplaySessions(defaultSessions);
    } finally {
      setIsLoading(false);
    }
  }, [activeUserId]);

  useEffect(() => {
    if (autoLoadPersonalized && activeUserId && !sessions) {
      loadPersonalizedSessions();
    }
  }, [activeUserId, autoLoadPersonalized, sessions, loadPersonalizedSessions]);

  const handleStartSession = async (session: QuickSessionConfig, index: number) => {
    if (!onStartSession || !activeUserId) {
      return;
    }

    setStartingSessionIndex(index);
    try {
      await onStartSession(session.subjectId, session.topicId, session.track, session.duration);
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setStartingSessionIndex(null);
    }
  };

  const getTrackIcon = (track: string) => {
    return track === 'exam' ? BookOpen : Code;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800';
      case 'intermediate':
        return 'bg-yellow-100 text-yellow-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (!activeUserId) {
    return (
      <Card className={`bg-gradient-to-br from-gray-50 to-gray-100 border-gray-200 ${className}`}>
        <CardContent className="p-6 text-center">
          <User className="h-8 w-8 text-gray-400 mx-auto mb-3" />
          <h3 className="font-medium text-gray-900 mb-2">Login Required</h3>
          <p className="text-sm text-gray-600">Please log in to access personalized quick sessions.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={`bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 ${className}`}>
      <CardContent className="p-6">
        <div className="flex items-center space-x-2 mb-4">
          <div className="p-2 bg-blue-100 rounded-lg">
            <Zap className="h-5 w-5 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900">Quick Learning Sessions</h3>
            <p className="text-sm text-gray-600">Start learning in under 15 minutes</p>
          </div>
          {isLoading && <Loader2 className="h-4 w-4 animate-spin text-blue-600 ml-auto" />}
        </div>

        {error && (
          <Alert className="mb-4" variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription className="text-sm">
              {error}
              <Button variant="ghost" size="sm" onClick={loadPersonalizedSessions} className="ml-2 h-6 px-2">
                Retry
              </Button>
            </AlertDescription>
          </Alert>
        )}

        <div className="space-y-3">
          {displaySessions.map((session, index) => {
            const TrackIcon = getTrackIcon(session.track);
            const isStarting = startingSessionIndex === index;

            return (
              <div
                key={index}
                className="flex items-center justify-between p-3 bg-white rounded-lg border border-gray-200 hover:border-blue-300 transition-all duration-200"
              >
                <div className="flex items-center space-x-3 flex-1">
                  <div className={`p-1.5 rounded ${session.track === 'exam' ? 'bg-blue-100' : 'bg-green-100'}`}>
                    <TrackIcon className={`h-4 w-4 ${session.track === 'exam' ? 'text-blue-600' : 'text-green-600'}`} />
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4 className="font-medium text-gray-900 text-sm truncate">{session.title}</h4>
                    <p className="text-xs text-gray-600 truncate">{session.description}</p>

                    <div className="flex items-center space-x-2 mt-1">
                      <Badge variant="secondary" className={`text-xs ${getDifficultyColor(session.difficulty)}`}>
                        {session.difficulty}
                      </Badge>
                      <div className="flex items-center space-x-1 text-xs text-gray-500">
                        <Clock className="h-3 w-3" />
                        <span>{session.duration}m</span>
                      </div>
                    </div>
                  </div>
                </div>

                <Button
                  size="sm"
                  onClick={() => handleStartSession(session, index)}
                  disabled={isStarting || isLoading}
                  className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white ml-3 flex-shrink-0 transition-all duration-200"
                >
                  {isStarting ? <Loader2 className="h-3 w-3 animate-spin" /> : <Play className="h-3 w-3" />}
                </Button>
              </div>
            );
          })}
        </div>

        <div className="mt-4 pt-3 border-t border-blue-200">
          <Button
            variant="outline"
            className="w-full text-blue-700 border-blue-300 hover:bg-blue-100 transition-colors duration-200"
            onClick={() => {
              // Navigate to journey planning
              window.location.href = '/journey';
            }}
          >
            <Target className="h-4 w-4 mr-2" />
            View All Sessions
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
