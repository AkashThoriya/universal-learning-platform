/**
 * @fileoverview Main Dashboard Page Component
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
 * @version 1.0.0
 */

'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { 
  getUser, 
  getRevisionQueue, 
  getMockTests, 
  getRecentDailyLogs,
  generateStudyInsights,
  subscribeToRevisionQueue,
  subscribeToUserStats
} from '@/lib/firebase-utils';
import AuthGuard from '@/components/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from 'recharts';
import { Calendar, Target, TrendingUp, Brain, Zap, Clock, BookOpen, Plus, AlertTriangle, CheckCircle, Timer } from 'lucide-react';
import { User, MockTestLog, RevisionItem, StudyInsight, DailyLog } from '@/types/exam';
import { format, differenceInDays } from 'date-fns';
import Link from 'next/link';
import DailyLogModal from '@/components/DailyLogModal';
import Navigation from '@/components/Navigation';

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
  const [userData, setUserData] = useState<User | null>(null);
  const [mockTests, setMockTests] = useState<MockTestLog[]>([]);
  const [revisionQueue, setRevisionQueue] = useState<RevisionItem[]>([]);
  const [dailyLogs, setDailyLogs] = useState<DailyLog[]>([]);
  const [insights, setInsights] = useState<StudyInsight[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDailyLog, setShowDailyLog] = useState(false);

  /**
   * Fetches all dashboard data in parallel and sets up real-time subscriptions
   * Loads user data, mock tests, revision queue, daily logs, and AI insights
   */
  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch all dashboard data in parallel for better performance
        const [userDoc, mockTestsData, revisionData, dailyLogsData, insightsData] = await Promise.all([
          getUser(user.uid),
          getMockTests(user.uid, 10),
          getRevisionQueue(user.uid),
          getRecentDailyLogs(user.uid, 14),
          generateStudyInsights(user.uid)
        ]);

        setUserData(userDoc);
        setMockTests(mockTestsData);
        setRevisionQueue(revisionData);
        setDailyLogs(dailyLogsData);
        setInsights(insightsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Set up real-time subscriptions for live data updates
    let unsubscribeRevision: (() => void) | undefined;
    let unsubscribeUser: (() => void) | undefined;

    if (user) {
      unsubscribeRevision = subscribeToRevisionQueue(user.uid, setRevisionQueue);
      unsubscribeUser = subscribeToUserStats(user.uid, setUserData);
    }

    // Cleanup subscriptions on component unmount
    return () => {
      unsubscribeRevision?.();
      unsubscribeUser?.();
    };
  }, [user]);

  if (loading || !userData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading your strategic dashboard...</p>
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
      date: format(test.date.toDate(), 'MMM dd'),
    }));

  // Health correlation data
  const healthData = dailyLogs.slice(0, 7).reverse().map((log, index) => ({
    day: format(log.date.toDate(), 'EEE'),
    energy: log.health.energy,
    sleep: log.health.sleepHours,
    studyTime: log.studiedTopics.reduce((sum, session) => sum + session.minutes, 0) / 60
  }));

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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome back, {userData.displayName || 'Strategist'}
            </h1>
            <p className="text-muted-foreground">Strategic command center for {userData.currentExam.name}</p>
          </div>

          {/* Key Metrics */}
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
                  {mockTests.length > 0 
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
                  {revisionQueue.slice(0, 6).map(item => (
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
                {revisionQueue.length > 6 && (
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
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Health Correlation Chart */}
            {healthData.length > 0 && (
              <Card>
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
            <Card>
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
                <CardDescription>Fast-track your preparation</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button 
                  className="w-full justify-start" 
                  variant="outline"
                  onClick={() => setShowDailyLog(true)}
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
                  {insights.slice(0, 3).map((insight, index) => (
                    <div
                      key={index}
                      className={`p-4 rounded-lg border-l-4 ${
                        insight.type === 'warning' 
                          ? 'border-yellow-400 bg-yellow-50' 
                          : insight.type === 'recommendation'
                          ? 'border-blue-400 bg-blue-50'
                          : 'border-green-400 bg-green-50'
                      }`}
                    >
                      <h4 className="font-semibold mb-2">{insight.title}</h4>
                      <p className="text-sm text-gray-700 mb-3">{insight.description}</p>
                      <div className="space-y-1">
                        {insight.actionItems.slice(0, 2).map((action, actionIndex) => (
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
          isOpen={showDailyLog}
          onClose={() => setShowDailyLog(false)}
        />
      </div>
    </AuthGuard>
  );
}