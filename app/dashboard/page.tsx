'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { doc, getDoc, collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import AuthGuard from '@/components/AuthGuard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { Calendar, Target, TrendingUp, Brain, Zap, Clock, BookOpen, Plus } from 'lucide-react';
import { User, MockTest } from '@/types/user';
import { format, differenceInDays } from 'date-fns';
import Link from 'next/link';
import DailyLogModal from '@/components/DailyLogModal';
import Navigation from '@/components/Navigation';

export default function DashboardPage() {
  const { user } = useAuth();
  const [userData, setUserData] = useState<User | null>(null);
  const [mockTests, setMockTests] = useState<MockTest[]>([]);
  const [loading, setLoading] = useState(true);
  const [showDailyLog, setShowDailyLog] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        // Fetch user data
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserData({ userId: user.uid, ...userDoc.data() } as User);
        }

        // Fetch recent mock tests
        const mockTestsQuery = query(
          collection(db, 'users', user.uid, 'mockTests'),
          orderBy('date', 'desc'),
          limit(10)
        );
        const mockTestsSnapshot = await getDocs(mockTestsQuery);
        const mockTestsData = mockTestsSnapshot.docs.map(doc => ({
          testId: doc.id,
          ...doc.data()
        })) as MockTest[];
        setMockTests(mockTestsData);
      } catch (error) {
        console.error('Error fetching dashboard data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  if (loading || !userData) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AuthGuard>
    );
  }

  const daysUntilExam = differenceInDays(userData.examDate.toDate(), new Date());
  const chartData = mockTests
    .slice()
    .reverse()
    .map((test, index) => ({
      test: `Test ${index + 1}`,
      score: test.scores.total,
      date: format(test.date.toDate(), 'MMM dd'),
    }));

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">
              Welcome back, {userData.displayName}
            </h1>
            <p className="text-muted-foreground">Command center for your IBPS SO IT Officer preparation</p>
          </div>

          {/* Key Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card className="bg-gradient-to-br from-red-500 to-red-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Days to Battle</CardTitle>
                <Calendar className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">{daysUntilExam}</div>
                <p className="text-xs opacity-90">
                  {format(userData.examDate.toDate(), 'PPP')}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Current Phase</CardTitle>
                <Target className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-xl font-bold capitalize">
                  {userData.currentPhase.replace('_', ' ')}
                </div>
                <p className="text-xs opacity-90">Strategic roadmap active</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Latest Score</CardTitle>
                <TrendingUp className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">
                  {mockTests.length > 0 ? mockTests[0].scores.total : 'N/A'}
                </div>
                <p className="text-xs opacity-90">
                  {mockTests.length > 0 ? 'Out of 200' : 'No tests yet'}
                </p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Study Streak</CardTitle>
                <Zap className="h-4 w-4 opacity-90" />
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold">7</div>
                <p className="text-xs opacity-90">Days consistent</p>
              </CardContent>
            </Card>
          </div>

          {/* Today's Battle Plan */}
          <Card>
            <CardHeader>
              <div className="flex items-center space-x-2">
                <Clock className="h-5 w-5 text-blue-600" />
                <CardTitle>Today's Battle Plan</CardTitle>
              </div>
              <CardDescription>Your strategic focus for today</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Morning Session (6:00 - 10:00)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Data Interpretation</span>
                      <Badge variant="secondary">Weak Area</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Mock Test Analysis</span>
                      <Badge variant="outline">30 min</Badge>
                    </div>
                  </div>
                </div>
                <div className="space-y-3">
                  <h4 className="font-semibold text-gray-900">Evening Session (18:00 - 21:00)</h4>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span>DBMS - Normalization</span>
                      <Badge variant="secondary">PK Focus</Badge>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <span>Current Affairs Update</span>
                      <Badge variant="outline">15 min</Badge>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Progress Chart & Quick Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Card className="lg:col-span-2">
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
                      <YAxis domain={[0, 200]} />
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
                  Log Today's Energy
                </Button>
                <Link href="/test-logger">
                  <Button className="w-full justify-start" variant="outline">
                    <Plus className="h-4 w-4 mr-2" />
                    New Mock Test
                  </Button>
                </Link>
                <Link href="/subjects">
                  <Button className="w-full justify-start" variant="outline">
                    <BookOpen className="h-4 w-4 mr-2" />
                    Study Topics
                  </Button>
                </Link>
                <Link href="/subjects">
                  <Button className="w-full justify-start" variant="outline">
                    <Brain className="h-4 w-4 mr-2" />
                    Revise Weak Areas
                  </Button>
                </Link>
              </CardContent>
            </Card>
          </div>
        </div>

        <DailyLogModal 
          isOpen={showDailyLog}
          onClose={() => setShowDailyLog(false)}
        />
      </div>
    </AuthGuard>
  );
}