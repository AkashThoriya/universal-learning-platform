'use client';

import {
  BookOpen,
  Code,
  Clock,
  Play,
  TrendingUp,
  Brain,
  Calendar,
  Filter,
  Plus,
  Award,
  Loader2,
  AlertCircle,
  RefreshCw,
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';

interface SessionRecommendation {
  id: string;
  title: string;
  description: string;
  track: 'exam' | 'course_tech';
  duration: number;
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  priority: 'high' | 'medium' | 'low';
  estimatedCompletion: string;
  subjectId: string;
  topicId: string;
}

interface WeeklyProgress {
  sessionsCompleted: number;
  totalSessions: number;
  timeSpent: number; // minutes
  accuracyAverage: number;
}

interface MicroLearningDashboardProps {
  userId?: string;
  onStartSession?: (subjectId: string, topicId: string, track: 'exam' | 'course_tech', duration?: number) => void;
  onViewProgress?: () => void;
  className?: string;
}

export function MicroLearningDashboard({
  userId,
  onStartSession,
  onViewProgress,
  className = '',
}: MicroLearningDashboardProps) {
  const { user } = useAuth();
  const [trackFilter, setTrackFilter] = useState<'all' | 'exam' | 'course_tech'>('all');
  const [difficultyFilter, setDifficultyFilter] = useState<'all' | 'beginner' | 'intermediate' | 'advanced'>('all');
  const [recommendations, setRecommendations] = useState<SessionRecommendation[]>([]);
  const [weeklyProgress, setWeeklyProgress] = useState<WeeklyProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isStartingSession, setIsStartingSession] = useState<string | null>(null);

  const activeUserId = userId || user?.uid;

  const loadDashboardData = async () => {
    if (!activeUserId) {
      setError('User authentication required');
      setIsLoading(false);
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Load personalized recommendations from Firebase
      const { MicroLearningService } = await import('@/lib/micro-learning-service');
      const recommendations = await MicroLearningService.generatePersonalizedRecommendations(activeUserId);
      setRecommendations(recommendations as SessionRecommendation[]);

      // Load session history and calculate weekly progress
      const sessionHistory = await MicroLearningService.getSessionHistory(activeUserId, 50);

      // Calculate weekly progress from actual session data
      const weekStart = new Date();
      weekStart.setDate(weekStart.getDate() - weekStart.getDay());

      const thisWeekSessions = sessionHistory.filter(session => {
        const sessionDate = new Date(session.createdAt);
        return sessionDate >= weekStart;
      });

      const weeklyProgressData: WeeklyProgress = {
        sessionsCompleted: thisWeekSessions.length,
        totalSessions: 12, // User's weekly goal - get from preferences
        timeSpent: thisWeekSessions.reduce((total, session) => total + session.duration, 0),
        accuracyAverage:
          thisWeekSessions.length > 0
            ? thisWeekSessions.reduce((total, session) => total + (session.performance?.accuracy ?? 0), 0) /
              thisWeekSessions.length
            : 0,
      };

      setWeeklyProgress(weeklyProgressData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadDashboardData();
  }, [activeUserId]);

  const handleStartSession = async (recommendation: SessionRecommendation) => {
    if (!onStartSession) {
      return;
    }

    setIsStartingSession(recommendation.id);
    try {
      await onStartSession(
        recommendation.subjectId,
        recommendation.topicId,
        recommendation.track,
        recommendation.duration
      );
    } catch (error) {
      console.error('Failed to start session:', error);
    } finally {
      setIsStartingSession(null);
    }
  };

  const filteredRecommendations = recommendations.filter(rec => {
    const trackMatch = trackFilter === 'all' || rec.track === trackFilter;
    const difficultyMatch = difficultyFilter === 'all' || rec.difficulty === difficultyFilter;
    return trackMatch && difficultyMatch;
  });

  if (!activeUserId) {
    return (
      <div className={`w-full max-w-6xl mx-auto ${className}`}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to access your micro-learning dashboard.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`w-full max-w-6xl mx-auto ${className}`}>
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading your learning dashboard...</h3>
          <p className="text-gray-600">We're personalizing your recommendations based on your progress.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full max-w-6xl mx-auto ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="mb-4">{error}</AlertDescription>
          <Button variant="outline" size="sm" onClick={loadDashboardData} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'low':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-blue-100 text-blue-800';
      case 'intermediate':
        return 'bg-purple-100 text-purple-800';
      case 'advanced':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getTrackIcon = (track: string) => {
    return track === 'exam' ? BookOpen : Code;
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Micro-Learning Hub</h1>
          <p className="text-gray-600">Personalized bite-sized learning sessions</p>
        </div>
        <div className="flex gap-3">
          <Button variant="outline" onClick={onViewProgress} className="flex items-center space-x-2">
            <TrendingUp className="h-4 w-4" />
            <span>View Progress</span>
          </Button>
          <Button className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 flex items-center space-x-2">
            <Plus className="h-4 w-4" />
            <span>Create Custom Session</span>
          </Button>
        </div>
      </div>

      {/* Weekly Progress Overview */}
      {weeklyProgress && (
        <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-blue-800">
              <Calendar className="h-5 w-5" />
              <span>This Week's Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">{weeklyProgress.sessionsCompleted}</div>
                <div className="text-sm text-blue-600">Sessions Completed</div>
                <Progress
                  value={(weeklyProgress.sessionsCompleted / weeklyProgress.totalSessions) * 100}
                  className="mt-2 h-2"
                />
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">
                  {Math.floor(weeklyProgress.timeSpent / 60)}h {weeklyProgress.timeSpent % 60}m
                </div>
                <div className="text-sm text-blue-600">Time Invested</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">{weeklyProgress.accuracyAverage}%</div>
                <div className="text-sm text-blue-600">Avg. Accuracy</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-800">
                  {Math.round((weeklyProgress.sessionsCompleted / weeklyProgress.totalSessions) * 100)}%
                </div>
                <div className="text-sm text-blue-600">Weekly Goal</div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Filters */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Filter className="h-5 w-5" />
            <span>Recommended Sessions</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Track:</label>
              <Select
                value={trackFilter}
                onValueChange={(value: string) => setTrackFilter(value as 'all' | 'exam' | 'course_tech')}
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Tracks</SelectItem>
                  <SelectItem value="exam">Exam Prep</SelectItem>
                  <SelectItem value="course_tech">Tech Learning</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center space-x-2">
              <label className="text-sm font-medium text-gray-700">Difficulty:</label>
              <Select
                value={difficultyFilter}
                onValueChange={(value: string) =>
                  setDifficultyFilter(value as 'all' | 'beginner' | 'intermediate' | 'advanced')
                }
              >
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Levels</SelectItem>
                  <SelectItem value="beginner">Beginner</SelectItem>
                  <SelectItem value="intermediate">Intermediate</SelectItem>
                  <SelectItem value="advanced">Advanced</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Session Recommendations */}
          <div className="grid gap-4">
            {filteredRecommendations.map(session => {
              const TrackIcon = getTrackIcon(session.track);

              return (
                <Card key={session.id} className="hover:shadow-md transition-shadow duration-200">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start space-x-3">
                          <div
                            className={`p-2 rounded-lg ${session.track === 'exam' ? 'bg-blue-100' : 'bg-green-100'}`}
                          >
                            <TrackIcon
                              className={`h-5 w-5 ${session.track === 'exam' ? 'text-blue-600' : 'text-green-600'}`}
                            />
                          </div>
                          <div className="flex-1">
                            <h3 className="font-semibold text-gray-900 text-lg">{session.title}</h3>
                            <p className="text-gray-600 mt-1">{session.description}</p>

                            <div className="flex flex-wrap items-center gap-2 mt-3">
                              <Badge className={getPriorityColor(session.priority)}>{session.priority} priority</Badge>
                              <Badge variant="secondary" className={getDifficultyColor(session.difficulty)}>
                                {session.difficulty}
                              </Badge>
                              <Badge variant="outline" className="flex items-center space-x-1">
                                <Clock className="h-3 w-3" />
                                <span>{session.duration} min</span>
                              </Badge>
                            </div>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right text-sm text-gray-500">
                          <div>Est. completion</div>
                          <div className="font-medium">{session.estimatedCompletion}</div>
                        </div>
                        <Button
                          onClick={() => handleStartSession(session)}
                          disabled={isStartingSession === session.id}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white flex items-center space-x-2 transition-all duration-200"
                        >
                          {isStartingSession === session.id ? (
                            <Loader2 className="h-4 w-4 animate-spin" />
                          ) : (
                            <Play className="h-4 w-4" />
                          )}
                          <span>{isStartingSession === session.id ? 'Starting...' : 'Start Session'}</span>
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredRecommendations.length === 0 && (
            <div className="text-center py-8">
              <Brain className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sessions found</h3>
              <p className="text-gray-600">Try adjusting your filters or create a custom session.</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Achievement Section */}
      <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2 text-yellow-800">
            <Award className="h-5 w-5" />
            <span>Recent Achievements</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-white rounded-lg border border-yellow-200">
              <div className="text-2xl mb-2">🎯</div>
              <div className="font-medium text-gray-900">Consistency Master</div>
              <div className="text-sm text-gray-600">7 days learning streak</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-yellow-200">
              <div className="text-2xl mb-2">🚀</div>
              <div className="font-medium text-gray-900">Speed Learner</div>
              <div className="text-sm text-gray-600">Completed 10 sessions this week</div>
            </div>
            <div className="text-center p-4 bg-white rounded-lg border border-yellow-200">
              <div className="text-2xl mb-2">💡</div>
              <div className="font-medium text-gray-900">Knowledge Builder</div>
              <div className="text-sm text-gray-600">85% average accuracy</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
