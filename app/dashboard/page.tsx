/**
 * @fileoverview Main Dashboard Page Component
 *
 * The central c  // State for data that hasn't been migrated to service layer yet
  const [mockTests, setMockTests] = useState<MockTestLog[]>([]);
  const [revisionQueue, setRevisionQueue] = useState<RevisionItem[]>([]);
  const [insights, setInsights] = useState<StudyInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDailyLogModal, setShowDailyLogModal] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastActivity, setLastActivity] = useState<Date>(new Date());center for exam preparation strategy. Displays real-time
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
 * @version 1.0.0
 */

'use client';

import { format, differenceInDays } from 'date-fns';
import { Calendar, Target, TrendingUp, Brain, Zap, Clock, BookOpen, Plus, AlertTriangle, CheckCircle, Timer } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';

import AnalyticsWidget from '@/components/analytics/AnalyticsWidget';
import AuthGuard from '@/components/AuthGuard';
import DailyLogModal from '@/components/DailyLogModal';
import { QuickSessionLauncher } from '@/components/micro-learning';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useAsyncData } from '@/hooks/enhanced-hooks';
import {
  userService,
  dailyLogService,
  revisionService,
  mockTestService,
  insightsService
} from '@/lib/firebase-enhanced';
import { MockTestLog, RevisionItem, StudyInsight } from '@/types/exam';


// Constants
const DAYS_UNTIL_EXAM = 14;
const DAYS_IN_WEEK = 7;
const DAYS_IN_YEAR = 365;
const MINUTES_IN_HOUR = 60;
const CHART_COLUMNS = 6;
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

// Type definitions for component data
interface DailyLogItem {
  date: { toDate: () => Date };
  health: {
    energy: number;
    sleepHours: number;
  };
  studiedTopics: Array<{
    minutes: number;
  }>;
}

/**
 * Main Dashboard Page Component
 *
 * Displays the strategic command center with:
 * - User statistics and exam countdown
 * - Spaced repetition revision queue
 * - Performance analytics and trends
 * - Health metrics correlation
 * - AI-powered study insights
 * - Quick action buttons for logging
 *
 * @returns {JSX.Element} The dashboard page
 *
 * @example
 * ```typescript
 * // This component is automatically rendered at /dashboard route
 * // It requires authentication and shows comprehensive study analytics
 * ```
 */
export default function DashboardPage() {
  const { user } = useAuth();

  // State for data that hasn't been migrated to service layer yet
  const [mockTests, setMockTests] = useState<MockTestLog[]>([]);
  const [revisionQueue, setRevisionQueue] = useState<RevisionItem[]>([]);
  const [insights, setInsights] = useState<StudyInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDailyLogModal, setShowDailyLogModal] = useState(false);

  // Enhanced data fetching using the new service layer
  const {
    data: userData
  } = useAsyncData(
    () => user
      ? userService.get(user.uid).then(result => result.success ? result.data : null)
      : Promise.resolve(null),
    [user?.uid],
    { immediate: !!user }
  );

  const {
    data: dailyLogs
  } = useAsyncData(
    () => user
      ? dailyLogService.getLogs(user.uid, DAYS_UNTIL_EXAM).then(result => result.success ? result.data : [])
      : Promise.resolve([]),
    [user?.uid],
    { immediate: !!user }
  );

  /**
   * Legacy data fetching for components not yet migrated to service layer
   */
  useEffect(() => {
    const fetchLegacyData = async () => {
      if (!user) { return; }

      try {
        // Fetch data using the new service layer
        const [mockTestsResult, revisionResult, insightsResult] = await Promise.all([
          mockTestService.getTests(user.uid, 10),
          revisionService.getQueue(user.uid),
          insightsService.generate(user.uid)
        ]);

        // Process results and set state
        if (mockTestsResult.success) { setMockTests(mockTestsResult.data ?? []); }
        if (revisionResult.success) { setRevisionQueue(revisionResult.data ?? []); }
        if (insightsResult.success) { setInsights(insightsResult.data ?? []); }
      } catch (error) {
        console.error('Error fetching legacy dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchLegacyData();

    // Set up real-time subscriptions for live data updates
    // TODO: Implement real-time subscriptions in the new service layer
    // let unsubscribeRevision: (() => void) | undefined;

    // if (user) {
    //   unsubscribeRevision = subscribeToRevisionQueue(user.uid, setRevisionQueue);
    // }

    // Cleanup subscriptions on component unmount
    return () => {
      // TODO: Add cleanup for real-time subscriptions
      // unsubscribeRevision?.();
    };
  }, [user]);

  if (loading || !userData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
          <Navigation />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6 max-w-md">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
                <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">Loading Dashboard</h3>
                  <p className="text-sm text-gray-600">Preparing your strategic learning environment...</p>
                  <div className="mt-4 space-y-2">
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full animate-pulse" style={{ width: '75%' }} />
                    </div>
                    <p className="text-xs text-gray-500">Loading analytics and progress data</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const daysUntilExam = differenceInDays(userData.currentExam.targetDate.toDate(), new Date());

  // Prepare chart data
  const chartData = mockTests
    .slice()
    .reverse()
    .map((test, index) => ({
      test: `Test ${index + 1}`,
      score: Object.values(test.scores).reduce((sum, score) => sum + score, 0),
      maxScore: Object.values(test.maxScores).reduce((sum, score) => sum + score, 0),
      date: format(test.date.toDate(), 'MMM dd')
    }));

  // Health correlation data
  const healthData = dailyLogs ? dailyLogs.slice(0, DAYS_IN_WEEK).reverse().map((log: DailyLogItem) => ({
    day: format(log.date.toDate(), 'EEE'),
    energy: log.health.energy,
    sleep: log.health.sleepHours,
    studyTime: log.studiedTopics.reduce(
      (sum: number, session: { minutes: number }) => sum + session.minutes,
      0
    ) / MINUTES_IN_HOUR
  })) : [];

  // Error analysis from latest test
  const latestTest = mockTests[0];
  const errorData = latestTest ? [
    { name: 'Concept Gaps', value: latestTest.analysis.conceptGaps, color: '#ef4444' },
    { name: 'Careless Errors', value: latestTest.analysis.carelessErrors, color: '#f97316' },
    { name: 'Time Pressure', value: latestTest.analysis.timePressures, color: '#eab308' },
    { name: 'Lucky Guesses', value: latestTest.analysis.intelligentGuesses, color: '#22c55e' }
  ].filter(item => item.value > 0) : [];

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'overdue': return 'bg-red-100 text-red-800 border-red-200';
      case 'due_today': return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'due_soon': return 'bg-blue-100 text-blue-800 border-blue-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'overdue': return <AlertTriangle className="h-4 w-4" />;
      case 'due_today': return <Timer className="h-4 w-4" />;
      case 'due_soon': return <Clock className="h-4 w-4" />;
      default: return <CheckCircle className="h-4 w-4" />;
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <Navigation />

        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
          {/* Header Section */}
          <div className="text-center space-y-4">
            <div className="inline-block">
              <Badge variant="secondary" className="px-4 py-2 text-sm animate-float">
                🎯 Strategic Command Center
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient">
              Welcome back, {userData.displayName ?? 'Strategist'}
            </h1>
            <p className="text-muted-foreground text-lg">
              Your strategic journey for <span className="font-semibold">{userData.currentExam.name}</span>
            </p>
          </div>

          {/* Key Metrics Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* Exam Countdown */}
            <Card className="glass border-0 hover:scale-105 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Exam Countdown</CardTitle>
                  <Calendar className="h-5 w-5 text-primary group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-gradient">{daysUntilExam}</div>
                  <p className="text-xs text-muted-foreground">days remaining</p>
                  <div className="w-full bg-muted rounded-full h-2">
                    <div
                      className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-500"
                      style={{
                        width: `${Math.max(0, Math.min(100, ((DAYS_IN_YEAR - daysUntilExam) / DAYS_IN_YEAR) * 100))}%`
                      }}
                     />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Study Streak */}
            <Card className="glass border-0 hover:scale-105 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Study Streak</CardTitle>
                  <Zap className="h-5 w-5 text-orange-500 group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-orange-600">{userData.studyStreak ?? 0}</div>
                  <p className="text-xs text-muted-foreground">consecutive days</p>
                  <div className="flex space-x-1">
                    {[...Array(DAYS_IN_WEEK)].map((_, i) => (
                      <div
                        key={i}
                        className={`w-3 h-3 rounded-full ${
                          i < (userData.studyStreak ?? 0) % DAYS_IN_WEEK
                            ? 'bg-orange-500'
                            : 'bg-muted'
                        } transition-colors duration-300`}
                       />
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Revision Queue */}
            <Card className="glass border-0 hover:scale-105 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Revision Due</CardTitle>
                  <Clock className="h-5 w-5 text-blue-500 group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  <div className="text-3xl font-bold text-blue-600">{revisionQueue.length}</div>
                  <p className="text-xs text-muted-foreground">topics pending</p>
                  {revisionQueue.length > 0 && (
                    <Badge variant="outline" className="text-xs">
                      Next: {revisionQueue[0]?.topicName}
                    </Badge>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Latest Score */}
            <Card className="glass border-0 hover:scale-105 transition-all duration-300 group">
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <CardTitle className="text-sm font-medium">Latest Score</CardTitle>
                  <Target className="h-5 w-5 text-green-500 group-hover:scale-110 transition-transform" />
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-2">
                  {latestTest ? (
                    <>
                      <div className="text-3xl font-bold text-green-600">
                        {Math.round((Object.values(latestTest.scores).reduce((sum, score) => sum + score, 0) /
                          Object.values(latestTest.maxScores).reduce((sum, score) => sum + score, 0)) * 100)}%
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {format(latestTest.date.toDate(), 'MMM dd')}
                      </p>
                    </>
                  ) : (
                    <>
                      <div className="text-3xl font-bold text-muted-foreground">--</div>
                      <p className="text-xs text-muted-foreground">No tests yet</p>
                    </>
                  )}
                </div>
              </CardContent>
            </Card>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Days Until Exam</CardTitle>
                <Calendar className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{daysUntilExam}</div>
                <p className="text-xs opacity-90">
                  {format(userData.currentExam.targetDate.toDate(), 'PPP')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Study Streak</CardTitle>
                <Target className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{userData.stats.currentStreak}</div>
                <p className="text-xs opacity-90">Days consistent</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Latest Score</CardTitle>
                <TrendingUp className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {mockTests.length > 0 && mockTests[0]?.scores && mockTests[0]?.maxScores
                    ? `${Math.round((Object.values(mockTests[0].scores).reduce((sum, score) => sum + score, 0) / Object.values(mockTests[0].maxScores).reduce((sum, score) => sum + score, 0)) * 100)}%`
                    : 'N/A'
                  }
                </div>
                <p className="text-xs opacity-90">
                  {mockTests.length > 0 ? 'Latest test score' : 'No tests yet'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Total Study Hours</CardTitle>
                <Zap className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{Math.round(userData.stats.totalStudyHours)}</div>
                <p className="text-xs opacity-90">Hours invested</p>
              </CardContent>
            </Card>
          </div>

          {/* Revision Queue - Most Important */}
          {revisionQueue.length > 0 && (
            <Card className="border-orange-200 bg-orange-50">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <Brain className="h-5 w-5 text-orange-600" />
                    <CardTitle className="text-orange-900">Revision Queue</CardTitle>
                  </div>
                  <Badge variant="secondary">{revisionQueue.length} topics due</Badge>
                </div>
                <CardDescription className="text-orange-700">
                  Topics that need your attention based on spaced repetition algorithm
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {revisionQueue.slice(0, CHART_COLUMNS).map(item => (
                    <div
                      key={item.topicId}
                      className={`p-3 rounded-lg border ${getPriorityColor(item.priority)}`}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(item.priority)}
                          <span className="font-medium text-sm">{item.topicName}</span>
                        </div>
                        <Badge variant="outline" className="text-xs">
                          Tier {item.tier}
                        </Badge>
                      </div>
                      <div className="flex items-center justify-between text-xs">
                        <span>{item.subjectName}</span>
                        <span>{item.masteryScore}% mastery</span>
                      </div>
                    </div>
                  ))}
                </div>
                {revisionQueue.length > CHART_COLUMNS && (
                  <div className="mt-4 text-center">
                    <Link href="/syllabus">
                      <Button variant="outline">
                        View All {revisionQueue.length} Topics
                      </Button>
                    </Link>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Analytics Row */}
          <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
            {/* Analytics Widget */}
            <AnalyticsWidget className="xl:col-span-1" />

            {/* Score Trend Chart */}
            <Card className="xl:col-span-2">
              <CardHeader>
                <CardTitle>Score Progression</CardTitle>
                <CardDescription>Your mock test performance over time</CardDescription>
              </CardHeader>
              <CardContent>
                {chartData.length > 0 ? (
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="test" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="score"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        dot={{ fill: '#3b82f6', strokeWidth: 2, r: 4 }}
                      />
                    </LineChart>
                  </ResponsiveContainer>
                ) : (
                  <div className="h-[300px] flex items-center justify-center text-muted-foreground">
                    No test data yet. Take your first mock test to see progress.
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Error Analysis */}
            {errorData.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle>Latest Test Analysis</CardTitle>
                  <CardDescription>Error breakdown from your most recent test</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={200}>
                    <PieChart>
                      <Pie
                        data={errorData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        dataKey="value"
                      >
                        {errorData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </PieChart>
                  </ResponsiveContainer>
                  <div className="mt-4 space-y-2">
                    {errorData.map((item, index) => (
                      <div key={index} className="flex items-center justify-between text-sm">
                        <div className="flex items-center space-x-2">
                          <div
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: item.color }}
                          />
                          <span>{item.name}</span>
                        </div>
                        <span className="font-medium">{item.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Health Correlation & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Health Correlation Chart */}
            {healthData.length > 0 && (
              <Card className="lg:col-span-2">
                <CardHeader>
                  <CardTitle>Health & Study Correlation</CardTitle>
                  <CardDescription>How your health affects study performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <ResponsiveContainer width="100%" height={250}>
                    <LineChart data={healthData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="day" />
                      <YAxis />
                      <Tooltip />
                      <Line
                        type="monotone"
                        dataKey="energy"
                        stroke="#22c55e"
                        strokeWidth={2}
                        name="Energy Level"
                      />
                      <Line
                        type="monotone"
                        dataKey="studyTime"
                        stroke="#3b82f6"
                        strokeWidth={2}
                        name="Study Hours"
                      />
                    </LineChart>
                  </ResponsiveContainer>
                </CardContent>
              </Card>
            )}

            {/* Quick Actions */}
            <Card className={healthData.length > 0 ? '' : 'lg:col-span-2'}>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Fast-track your preparation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  className="w-full justify-start"
                  variant="outline"
                  onClick={() => setShowDailyLogModal(true)}
                >
                  <Zap className="h-4 w-4 mr-2" />
                  Log Today's Progress
                </Button>
                <Link href="/log/mock">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    New Mock Test
                  </Button>
                </Link>
                <Link href="/subjects">
                  <Button className="w-full justify-start" variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Browse Syllabus
                  </Button>
                </Link>
                {revisionQueue.length > 0 && (
                  <Button className="w-full justify-start" variant="outline">
                    <Brain className="h-4 w-4 mr-2" />
                    Start Revision Session
                  </Button>
                )}
              </CardContent>
            </Card>

            {/* Micro-Learning Quick Launcher */}
            <QuickSessionLauncher
              userId={user?.uid ?? ''}
              onStartSession={(subjectId, topicId, track, duration) => {
                // Navigate to micro-learning session
                window.location.href = `/micro-learning?auto=true&subject=${subjectId}&topic=${topicId}&track=${track}&duration=${duration}`;
              }}
              className="lg:col-span-1"
            />
          </div>

          {/* Insights */}
          {insights.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Strategic Insights</CardTitle>
                <CardDescription>AI-powered recommendations based on your data</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {insights.slice(0, RECENT_ITEMS_LIMIT).map((insight: StudyInsight, index: number) => (
                    <div
                      key={index}
                      className={getInsightClasses(insight.type)}
                    >
                      <h4 className="font-semibold mb-2">{insight.title}</h4>
                      <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                      <div className="space-y-1">
                        {insight.actionItems.slice(0, 2).map((action: string, actionIndex: number) => (
                          <div key={actionIndex} className="flex items-center space-x-2 text-sm">
                            <CheckCircle className="h-3 w-3 text-green-600" />
                            <span>{action}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        <DailyLogModal
          isOpen={showDailyLogModal}
          onClose={() => setShowDailyLogModal(false)}
        />
      </div>
    </AuthGuard>
  );
}
