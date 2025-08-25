/**
 * @fileoverview Main Dashboard Page Component - Refactored with Database Abstraction Layer
 *
 * The central command center for exam preparation strategy. Displays real-time
 * analytics, revision queue, performance trends, AI-generated insights, and
 * quick action buttons for daily activities.
 *
 * Features:
 * - Real-time revision queue with spaced repetition
 * - Performance analytics with interactive charts
 * - Health-performance correlation insights
 * - Study streak tracking and gamification
 * - Quick access to daily logging and mock tests
 * - AI-powered study recommendations
 *
 * @author Exam Strategy Engine Team
 * @version 2.0.0 - Refactored with Database Abstraction Layer
 */

'use client';

import { format } from 'date-fns';
import { Target, Brain, Zap, Clock, BookOpen, Plus, AlertTriangle, Timer } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import AnalyticsWidget from '@/components/analytics/AnalyticsWidget';
import AuthGuard from '@/components/AuthGuard';
import DailyLogModal from '@/components/DailyLogModal';
import { QuickSessionLauncher } from '@/components/micro-learning';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';

// Use new database abstraction layer
import {
  enhancedDatabaseService,
  RepositoryFactory,
  UserRepository,
  ProgressRepository,
  MissionRepository,
  AnalyticsRepository
} from '@/lib/database';
import { RealtimeSubscription } from '@/lib/database/interfaces';
import {
  User,
  Progress,
  Mission,
  AnalyticsEvent
} from '@/lib/database/repositories';

// Constants
const RECENT_ITEMS_LIMIT = 3;

// Helper functions
const getInsightClasses = (type: string) => {
  const baseClasses = 'p-4 rounded-lg border-l-4';
  switch (type) {
    case 'warning':
      return `${baseClasses} border-yellow-400 bg-yellow-50`;
    case 'recommendation':
      return `${baseClasses} border-blue-400 bg-blue-50`;
    default:
      return `${baseClasses} border-green-400 bg-green-50`;
  }
};

// Type definitions for dashboard data
interface DashboardData {
  user: User | null;
  progress: Progress[];
  activeMissions: Mission[];
  recentAnalytics: AnalyticsEvent[];
  studyStreak: number;
  totalStudyTime: number;
  completionRate: number;
}

interface StudyInsight {
  id: string;
  type: 'warning' | 'recommendation' | 'success';
  title: string;
  description: string;
  createdAt: Date;
}

/**
 * Main Dashboard Page Component
 *
 * Displays the strategic command center with:
 * - User statistics and exam countdown
 * - Active missions and progress tracking
 * - Performance analytics and trends
 * - AI-powered study insights
 * - Quick action buttons for logging
 *
 * @returns {JSX.Element} The dashboard page
 */
export default function DashboardPage() {
  const { user } = useAuth();

  // Repository instances
  const [repositories, setRepositories] = useState<{
    userRepo: UserRepository;
    progressRepo: ProgressRepository;
    missionRepo: MissionRepository;
    analyticsRepo: AnalyticsRepository;
  } | null>(null);

  // Dashboard state
  const [dashboardData, setDashboardData] = useState<DashboardData>({
    user: null,
    progress: [],
    activeMissions: [],
    recentAnalytics: [],
    studyStreak: 0,
    totalStudyTime: 0,
    completionRate: 0
  });

  const [insights, setInsights] = useState<StudyInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDailyLogModal, setShowDailyLogModal] = useState(false);

  // Real-time subscriptions
  const [, setSubscriptions] = useState<RealtimeSubscription[]>([]);

  /**
   * Initialize repository instances
   */
  useEffect(() => {
    const factory = new RepositoryFactory(enhancedDatabaseService.getProvider());

    setRepositories({
      userRepo: factory.createUserRepository(),
      progressRepo: factory.createProgressRepository(),
      missionRepo: factory.createMissionRepository(),
      analyticsRepo: factory.createAnalyticsRepository()
    });
  }, []);

  /**
   * Fetch dashboard data with proper error handling
   */
  const fetchDashboardData = useCallback(async () => {
    if (!user || !repositories) { return; }

    setLoading(true);
    setError(null);

    try {
      // Fetch all dashboard data in parallel
      const [
        userResult,
        progressResult,
        missionsResult,
        analyticsResult
      ] = await Promise.all([
        repositories.userRepo.findById(user.uid),
        repositories.progressRepo.findByUser(user.uid),
        repositories.missionRepo.findActiveMissions(user.uid),
        repositories.analyticsRepo.findByUser(user.uid, 100)
      ]);

      // Handle user data
      if (!userResult.success) {
        throw new Error(userResult.error || 'Failed to fetch user data');
      }

      // Handle progress data
      if (!progressResult.success) {
        console.warn('Failed to fetch progress data:', progressResult.error);
      }

      // Handle missions data
      if (!missionsResult.success) {
        console.warn('Failed to fetch missions data:', missionsResult.error);
      }

      // Handle analytics data
      if (!analyticsResult.success) {
        console.warn('Failed to fetch analytics data:', analyticsResult.error);
      }

      // Calculate derived metrics
      const progress = progressResult.data || [];
      const studyStreak = calculateStudyStreak(analyticsResult.data || []);
      const totalStudyTime = calculateTotalStudyTime(progress);
      const completionRate = calculateCompletionRate(progress);

      setDashboardData({
        user: userResult.data || null,
        progress,
        activeMissions: missionsResult.data || [],
        recentAnalytics: analyticsResult.data || [],
        studyStreak,
        totalStudyTime,
        completionRate
      });

      // Generate AI insights based on data
      generateInsights(progress, missionsResult.data || [], analyticsResult.data || []);

    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to fetch dashboard data';
      setError(message);
      console.error('Dashboard data fetch error:', error);
    } finally {
      setLoading(false);
    }
  }, [user, repositories]);

  /**
   * Set up real-time subscriptions for live updates
   */
  useEffect(() => {
    if (!user || !repositories) { return; }

    const newSubscriptions: RealtimeSubscription[] = [];

    // Subscribe to user progress updates
    const progressSubscription = repositories.progressRepo.subscribe(
      (updatedProgress) => {
        setDashboardData(prev => ({
          ...prev,
          progress: updatedProgress,
          totalStudyTime: calculateTotalStudyTime(updatedProgress),
          completionRate: calculateCompletionRate(updatedProgress)
        }));
      },
      { where: [{ field: 'userId', operator: 'eq', value: user.uid }] }
    );

    // Subscribe to active missions updates
    const missionsSubscription = repositories.missionRepo.subscribe(
      (updatedMissions) => {
        setDashboardData(prev => ({
          ...prev,
          activeMissions: updatedMissions
        }));
      },
      {
        where: [
          { field: 'userId', operator: 'eq', value: user.uid },
          { field: 'status', operator: 'eq', value: 'active' }
        ]
      }
    );

    newSubscriptions.push(progressSubscription, missionsSubscription);
    setSubscriptions(newSubscriptions);

    // Cleanup subscriptions on unmount
    return () => {
      newSubscriptions.forEach(sub => sub.unsubscribe());
    };
  }, [user, repositories]);

  /**
   * Initial data fetch
   */
  useEffect(() => {
    fetchDashboardData();
  }, [fetchDashboardData]);

  /**
   * Calculate study streak from analytics events
   */
  const calculateStudyStreak = (analytics: AnalyticsEvent[]): number => {
    const studyEvents = analytics.filter(event =>
      event.eventType === 'study_session_completed'
    );

    if (studyEvents.length === 0) { return 0; }

    let streak = 0;
    const currentDate = new Date();
    currentDate.setHours(0, 0, 0, 0);

    while (true) {
      const dayEvents = studyEvents.filter(event => {
        const eventDate = new Date(event.timestamp);
        eventDate.setHours(0, 0, 0, 0);
        return eventDate.getTime() === currentDate.getTime();
      });

      if (dayEvents.length === 0) { break; }

      streak++;
      currentDate.setDate(currentDate.getDate() - 1);
    }

    return streak;
  };

  /**
   * Calculate total study time from progress data
   */
  const calculateTotalStudyTime = (progress: Progress[]): number => {
    return progress.reduce((total, item) => total + item.totalTimeSpent, 0);
  };

  /**
   * Calculate overall completion rate
   */
  const calculateCompletionRate = (progress: Progress[]): number => {
    if (progress.length === 0) { return 0; }

    const totalCompletion = progress.reduce((sum, item) => sum + item.completionPercentage, 0);
    return Math.round(totalCompletion / progress.length);
  };

  /**
   * Generate AI-powered insights based on user data
   */
  const generateInsights = (
    progress: Progress[],
    missions: Mission[],
    analytics: AnalyticsEvent[]
  ) => {
    const newInsights: StudyInsight[] = [];

    // Analyze study consistency
    const recentStudyEvents = analytics.filter(event =>
      event.eventType === 'study_session_completed' &&
      new Date(event.timestamp) > new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
    );

    if (recentStudyEvents.length < 3) {
      newInsights.push({
        id: 'consistency-warning',
        type: 'warning',
        title: 'Low Study Consistency',
        description: 'You have less than 3 study sessions this week. Try to maintain daily consistency for better retention.',
        createdAt: new Date()
      });
    }

    // Analyze mission progress
    const overdueMissions = missions.filter(mission =>
      new Date(mission.targetDate) < new Date() && mission.status === 'active'
    );

    if (overdueMissions.length > 0) {
      newInsights.push({
        id: 'overdue-missions',
        type: 'warning',
        title: `${overdueMissions.length} Overdue Mission(s)`,
        description: 'Some of your missions have passed their target dates. Consider adjusting timelines or breaking them into smaller tasks.',
        createdAt: new Date()
      });
    }

    // Analyze subject balance
    const subjectProgress = progress.reduce((acc, item) => {
      acc[item.subjectId] = (acc[item.subjectId] || 0) + item.completionPercentage;
      return acc;
    }, {} as Record<string, number>);

    const subjects = Object.keys(subjectProgress);
    if (subjects.length > 1) {
      const avgCompletion = Object.values(subjectProgress).reduce((a, b) => a + b, 0) / subjects.length;
      const imbalanced = subjects.filter(subject => {
        const subjectValue = subjectProgress[subject];
        return subjectValue !== undefined && Math.abs(subjectValue - avgCompletion) > 20;
      });

      if (imbalanced.length > 0) {
        newInsights.push({
          id: 'subject-imbalance',
          type: 'recommendation',
          title: 'Subject Imbalance Detected',
          description: 'Some subjects are lagging behind others. Consider allocating more time to weaker areas.',
          createdAt: new Date()
        });
      }
    }

    // Positive reinforcement for good performance
    if (dashboardData.studyStreak >= 7) {
      newInsights.push({
        id: 'streak-achievement',
        type: 'success',
        title: 'Amazing Study Streak!',
        description: `You've maintained a ${dashboardData.studyStreak}-day study streak. Keep up the excellent work!`,
        createdAt: new Date()
      });
    }

    setInsights(newInsights);
  };

  /**
   * Record analytics event for user interaction
   */
  const recordAnalyticsEvent = async (eventType: string, eventData: Record<string, any>) => {
    if (!user || !repositories) { return; }

    try {
      await repositories.analyticsRepo.recordEvent(
        user.uid,
        eventType,
        eventData,
        `session-${Date.now()}`
      );
    } catch (error) {
      console.error('Failed to record analytics event:', error);
    }
  };

  /**
   * Handle daily log modal actions
   */
  const handleDailyLogOpen = () => {
    setShowDailyLogModal(true);
    recordAnalyticsEvent('daily_log_opened', { timestamp: new Date() });
  };

  const handleDailyLogClose = () => {
    setShowDailyLogModal(false);
    // Refresh dashboard data after logging
    fetchDashboardData();
  };

  // Loading state
  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center">
              <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4" />
              <p className="text-gray-600">Loading your dashboard...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  // Error state
  if (error) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <div className="flex items-center justify-center min-h-[calc(100vh-4rem)]">
            <div className="text-center">
              <AlertTriangle className="h-16 w-16 text-red-600 mx-auto mb-4" />
              <h2 className="text-xl font-semibold text-gray-900 mb-2">Failed to Load Dashboard</h2>
              <p className="text-gray-600 mb-4">{error}</p>
              <Button onClick={fetchDashboardData}>Try Again</Button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const { user: userData, activeMissions, studyStreak, totalStudyTime, completionRate } = dashboardData;

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />

        <main className="container mx-auto px-4 py-8">
          {/* Welcome Header */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-gray-900 mb-2">
              Welcome back, {userData?.name || 'Student'}! 👋
            </h1>
            <p className="text-gray-600">
              Ready to tackle your study goals? Let's make today count!
            </p>
          </div>

          {/* Quick Stats Row */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {/* Study Streak */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Study Streak</p>
                    <p className="text-2xl font-bold text-orange-600">{studyStreak} days</p>
                  </div>
                  <Zap className="h-8 w-8 text-orange-600" />
                </div>
              </CardContent>
            </Card>

            {/* Total Study Time */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Study Time</p>
                    <p className="text-2xl font-bold text-blue-600">
                      {Math.round(totalStudyTime / 60)}h
                    </p>
                  </div>
                  <Clock className="h-8 w-8 text-blue-600" />
                </div>
              </CardContent>
            </Card>

            {/* Overall Progress */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Overall Progress</p>
                    <p className="text-2xl font-bold text-green-600">{completionRate}%</p>
                  </div>
                  <Target className="h-8 w-8 text-green-600" />
                </div>
              </CardContent>
            </Card>

            {/* Active Missions */}
            <Card>
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Active Missions</p>
                    <p className="text-2xl font-bold text-purple-600">{activeMissions.length}</p>
                  </div>
                  <BookOpen className="h-8 w-8 text-purple-600" />
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 mb-8">
            {/* Active Missions */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Target className="h-5 w-5" />
                  Active Missions
                </CardTitle>
                <CardDescription>
                  Your current study missions and their progress
                </CardDescription>
              </CardHeader>
              <CardContent>
                {activeMissions.length === 0 ? (
                  <div className="text-center py-8">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <p className="text-gray-600 mb-4">No active missions yet</p>
                    <Link href="/missions">
                      <Button>Create Your First Mission</Button>
                    </Link>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {activeMissions.slice(0, RECENT_ITEMS_LIMIT).map((mission) => (
                      <div key={mission.id} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
                        <div className="flex items-center justify-between mb-2">
                          <h3 className="font-semibold">{mission.title}</h3>
                          <Badge variant={new Date(mission.targetDate) < new Date() ? 'destructive' : 'default'}>
                            {format(new Date(mission.targetDate), 'MMM dd')}
                          </Badge>
                        </div>
                        <p className="text-sm text-gray-600 mb-3">{mission.description}</p>

                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span>Progress</span>
                            <span>{mission.progress}%</span>
                          </div>
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div
                              className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                              style={{ width: `${mission.progress}%` }}
                             />
                          </div>
                        </div>
                      </div>
                    ))}

                    {activeMissions.length > RECENT_ITEMS_LIMIT && (
                      <div className="text-center pt-4">
                        <Link href="/missions">
                          <Button variant="outline">View All Missions</Button>
                        </Link>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Zap className="h-5 w-5" />
                  Quick Actions
                </CardTitle>
                <CardDescription>
                  Log your daily progress and activities
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Button
                  onClick={handleDailyLogOpen}
                  className="w-full"
                  size="lg"
                >
                  <Plus className="h-4 w-4 mr-2" />
                  Daily Log
                </Button>

                <Link href="/log/mock">
                  <Button variant="outline" className="w-full" size="lg">
                    <Timer className="h-4 w-4 mr-2" />
                    Mock Test
                  </Button>
                </Link>

                <Link href="/micro-learning">
                  <Button variant="outline" className="w-full" size="lg">
                    <Brain className="h-4 w-4 mr-2" />
                    Quick Session
                  </Button>
                </Link>

                <Link href="/syllabus">
                  <Button variant="outline" className="w-full" size="lg">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study Topics
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>

          {/* AI Insights */}
          {insights.length > 0 && (
            <Card className="mb-8">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Brain className="h-5 w-5" />
                  AI Study Insights
                </CardTitle>
                <CardDescription>
                  Personalized recommendations based on your study patterns
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.map((insight) => (
                    <div key={insight.id} className={getInsightClasses(insight.type)}>
                      <h4 className="font-semibold mb-2">{insight.title}</h4>
                      <p className="text-sm">{insight.description}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Analytics Widget */}
          <AnalyticsWidget />

          {/* Micro Learning Quick Launcher */}
          <div className="mt-8">
            <QuickSessionLauncher />
          </div>
        </main>

        {/* Daily Log Modal */}
        <DailyLogModal
          isOpen={showDailyLogModal}
          onClose={handleDailyLogClose}
        />
      </div>
    </AuthGuard>
  );
}
