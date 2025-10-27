'use client';

import { motion } from 'framer-motion';
import {
  Brain,
  Target,
  TrendingUp,
  Clock,
  Star,
  Plus,
  Search,
  BookOpen,
  Zap,
  Award,
  BarChart3,
  RefreshCw,
} from 'lucide-react';
import { useState, useEffect } from 'react';

import { AdaptiveTestCard, QuestionInterface, TestAnalyticsDashboard } from '@/components/adaptive-testing';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { adaptiveTestingService } from '@/lib/adaptive-testing-service';
import { AdaptiveTest, TestSession, AdaptiveQuestion } from '@/types/adaptive-testing';

interface TestOverviewStats {
  totalTests: number;
  completedTests: number;
  averageAccuracy: number;
  totalQuestions: number;
  timeSpent: number;
  timeSaved: number;
}

export default function AdaptiveTestingPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [tests, setTests] = useState<AdaptiveTest[]>([]);
  const [stats, setStats] = useState<TestOverviewStats>({
    totalTests: 0,
    completedTests: 0,
    averageAccuracy: 0,
    totalQuestions: 0,
    timeSpent: 0,
    timeSaved: 0,
  });
  const [searchQuery, setSearchQuery] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterSubject, setFilterSubject] = useState<string>('all');
  const [activeTest, setActiveTest] = useState<{
    test: AdaptiveTest;
    session: TestSession;
    currentQuestion: AdaptiveQuestion | null;
  } | null>(null);
  const [showResults, setShowResults] = useState<{
    test: AdaptiveTest;
    performance: any;
  } | null>(null);

  // Load tests and stats on mount
  useEffect(() => {
    loadTestsAndStats();
  }, []);

  const loadTestsAndStats = async () => {
    try {
      setLoading(true);

      // Load user's tests
      const userTests = await adaptiveTestingService.getUserTests();
      setTests(userTests);

      // Calculate stats
      const completedTests = userTests.filter(test => test.status === 'completed');
      const totalQuestions = completedTests.reduce((sum, test) => sum + test.totalQuestions, 0);
      const totalAccuracy = completedTests.reduce((sum, test) => sum + (test.performance?.accuracy || 0), 0);
      const totalTime = completedTests.reduce((sum, test) => sum + (test.performance?.totalTime || 0), 0);

      setStats({
        totalTests: userTests.length,
        completedTests: completedTests.length,
        averageAccuracy: completedTests.length > 0 ? totalAccuracy / completedTests.length : 0,
        totalQuestions,
        timeSpent: totalTime,
        timeSaved: totalQuestions * 120000 - totalTime, // Assuming 2min per question saved
      });
    } catch (error) {
      console.error('Error loading tests:', error);
      toast({
        title: 'Error',
        description: 'Failed to load your tests. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const handleStartTest = async (testId: string) => {
    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      const result = await adaptiveTestingService.startTestSession(user.uid, { testId });
      if (result.success && result.data) {
        setActiveTest({
          test: tests.find(t => t.id === testId)!,
          session: result.data,
          currentQuestion: null, // Will be set by the first question request
        });
      } else {
        throw new Error('Failed to start test');
      }
    } catch (error) {
      console.error('Error starting test:', error);
      toast({
        title: 'Error',
        description: 'Failed to start the test. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleAnswerSubmit = async (
    questionId: string,
    selectedOptionId: string,
    confidence: number,
    timeSpent: number
  ) => {
    if (!activeTest) {
      return;
    }

    try {
      if (!user?.uid) {
        throw new Error('User not authenticated');
      }
      const result = await adaptiveTestingService.submitResponse(user.uid, {
        sessionId: activeTest.session.id,
        questionId,
        answer: selectedOptionId,
        responseTime: timeSpent,
        confidence,
      });

      if (result.success && result.data) {
        if (result.data.testCompleted) {
          // Test completed
          setShowResults({
            test: activeTest.test,
            performance: result.data.performance,
          });
          setActiveTest(null);
          await loadTestsAndStats(); // Refresh the test list
        } else if (result.data.nextQuestion) {
          // Continue with next question
          setActiveTest({
            ...activeTest,
            currentQuestion: result.data.nextQuestion,
          });
        }
      } else {
        throw new Error('Failed to submit answer');
      }
    } catch (error) {
      console.error('Error submitting answer:', error);
      toast({
        title: 'Error',
        description: 'Failed to submit answer. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleViewResults = (testId: string) => {
    const test = tests.find(t => t.id === testId);
    if (test?.performance) {
      setShowResults({
        test,
        performance: test.performance,
      });
    }
  };

  const handleRetakeTest = async (testId: string) => {
    if (!user) {
      toast({
        title: 'Error',
        description: 'Please log in to retake a test.',
        variant: 'destructive',
      });
      return;
    }

    try {
      // Create a new test based on the existing one
      const originalTest = tests.find(t => t.id === testId);
      if (!originalTest) {
        return;
      }

      const newTest = await adaptiveTestingService.createTestFromTemplate(user.uid, originalTest);
      if (newTest.success && newTest.data) {
        await loadTestsAndStats();
        handleStartTest(newTest.data.id);
      }
    } catch (error) {
      console.error('Error retaking test:', error);
      toast({
        title: 'Error',
        description: 'Failed to create retake test. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const generateRecommendedTest = async () => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'Please log in to generate test recommendations.',
        variant: 'destructive',
      });
      return;
    }

    try {
      const recommendations = await adaptiveTestingService.generateTestRecommendations(user.uid);
      if (recommendations.success && recommendations.data && recommendations.data.length > 0) {
        const newTest = await adaptiveTestingService.createTestFromRecommendation(user.uid, recommendations.data[0]!);
        if (newTest.success && newTest.data) {
          await loadTestsAndStats();
          handleStartTest(newTest.data.id);
        }
      } else {
        toast({
          title: 'Info',
          description: 'No test recommendations available at this time.',
        });
      }
    } catch (error) {
      console.error('Error generating recommended test:', error);
      toast({
        title: 'Error',
        description: 'Failed to generate recommended test. Please try again.',
        variant: 'destructive',
      });
    }
  };

  // Filter tests based on search and filters
  const filteredTests = tests.filter(test => {
    const matchesSearch =
      test.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      test.linkedSubjects.some(subject => subject.toLowerCase().includes(searchQuery.toLowerCase()));

    const matchesStatus = filterStatus === 'all' || test.status === filterStatus;

    const matchesSubject = filterSubject === 'all' || test.linkedSubjects.includes(filterSubject);

    return matchesSearch && matchesStatus && matchesSubject;
  });

  // Get unique subjects for filter
  const allSubjects = Array.from(new Set(tests.flatMap(test => test.linkedSubjects)));

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Show active test interface
  if (activeTest && activeTest.currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="container mx-auto px-4">
          <QuestionInterface
            question={activeTest.currentQuestion}
            questionNumber={activeTest.session.currentQuestionIndex + 1}
            totalQuestions={activeTest.test.totalQuestions}
            onAnswer={handleAnswerSubmit}
            showConfidenceSlider
            showTimer
            adaptiveMode
          />
        </div>
      </div>
    );
  }

  // Show results dashboard
  if (showResults) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 py-8">
        <div className="container mx-auto px-4">
          <div className="max-w-6xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-gray-800">Test Results</h1>
                <p className="text-gray-600 mt-1">{showResults.test.title}</p>
              </div>
              <Button onClick={() => setShowResults(null)} variant="outline">
                Back to Tests
              </Button>
            </div>

            <TestAnalyticsDashboard
              performance={showResults.performance}
              adaptiveMetrics={showResults.test.adaptiveMetrics}
              showDetailedAnalysis
              showRecommendations
            />
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-7xl mx-auto space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <motion.div
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex items-center justify-center gap-3"
            >
              <div className="p-3 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl text-white">
                <Brain className="h-8 w-8" />
              </div>
              <h1 className="text-4xl font-bold text-gray-800">Adaptive Testing</h1>
            </motion.div>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              Experience personalized assessments that adapt to your knowledge level in real-time, providing efficient
              and accurate evaluation of your skills.
            </p>
          </div>

          {/* Stats Overview */}
          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
              {[...Array(4)].map((_, i) => (
                <Card key={i}>
                  <CardContent className="p-6">
                    <Skeleton className="h-4 w-20 mb-2" />
                    <Skeleton className="h-8 w-16 mb-1" />
                    <Skeleton className="h-3 w-24" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
            >
              <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Total Tests</p>
                      <p className="text-3xl font-bold">{stats.totalTests}</p>
                    </div>
                    <Target className="h-8 w-8 text-blue-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Average Score</p>
                      <p className="text-3xl font-bold">{stats.averageAccuracy.toFixed(1)}%</p>
                    </div>
                    <Star className="h-8 w-8 text-green-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Questions Answered</p>
                      <p className="text-3xl font-bold">{stats.totalQuestions}</p>
                    </div>
                    <BookOpen className="h-8 w-8 text-purple-200" />
                  </div>
                </CardContent>
              </Card>

              <Card className="border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Time Saved</p>
                      <p className="text-3xl font-bold">{formatTime(stats.timeSaved)}</p>
                    </div>
                    <Clock className="h-8 w-8 text-orange-200" />
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Main Content */}
          <Tabs defaultValue="tests" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="tests">My Tests</TabsTrigger>
              <TabsTrigger value="analytics">Analytics</TabsTrigger>
              <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
            </TabsList>

            <TabsContent value="tests" className="space-y-6">
              {/* Controls */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-4 flex-1">
                      <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search tests, subjects, or topics..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="pl-10"
                        />
                      </div>
                      <Select value={filterStatus} onValueChange={setFilterStatus}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Status" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Status</SelectItem>
                          <SelectItem value="draft">Draft</SelectItem>
                          <SelectItem value="active">Active</SelectItem>
                          <SelectItem value="completed">Completed</SelectItem>
                          <SelectItem value="paused">Paused</SelectItem>
                        </SelectContent>
                      </Select>
                      <Select value={filterSubject} onValueChange={setFilterSubject}>
                        <SelectTrigger className="w-40">
                          <SelectValue placeholder="Subject" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Subjects</SelectItem>
                          {allSubjects.map(subject => (
                            <SelectItem key={subject} value={subject}>
                              {subject}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="flex gap-2">
                      <Button variant="outline" onClick={loadTestsAndStats}>
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                      <Button
                        onClick={generateRecommendedTest}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Smart Test
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tests Grid */}
              {loading ? (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {[...Array(6)].map((_, i) => (
                    <Card key={i}>
                      <CardHeader>
                        <Skeleton className="h-6 w-3/4" />
                        <Skeleton className="h-4 w-full" />
                      </CardHeader>
                      <CardContent>
                        <Skeleton className="h-32 w-full" />
                      </CardContent>
                    </Card>
                  ))}
                </div>
              ) : filteredTests.length > 0 ? (
                <motion.div
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                >
                  {filteredTests.map((test, index) => (
                    <motion.div
                      key={test.id}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.1 }}
                    >
                      <AdaptiveTestCard
                        test={test}
                        onStartTest={handleStartTest}
                        onViewResults={handleViewResults}
                        onRetakeTest={handleRetakeTest}
                        showDetailedMetrics
                      />
                    </motion.div>
                  ))}
                </motion.div>
              ) : (
                <Card className="border-dashed border-2 border-gray-300">
                  <CardContent className="p-12 text-center">
                    <Brain className="h-16 w-16 mx-auto text-gray-400 mb-4" />
                    <h3 className="text-xl font-semibold text-gray-600 mb-2">No tests found</h3>
                    <p className="text-gray-500 mb-6">
                      {searchQuery || filterStatus !== 'all' || filterSubject !== 'all'
                        ? 'Try adjusting your search or filters'
                        : 'Create your first adaptive test to get started'}
                    </p>
                    <Button
                      onClick={generateRecommendedTest}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Smart Test
                    </Button>
                  </CardContent>
                </Card>
              )}
            </TabsContent>

            <TabsContent value="analytics">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BarChart3 className="h-5 w-5" />
                    Performance Analytics
                  </CardTitle>
                  <CardDescription>Comprehensive analysis of your adaptive testing performance</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <TrendingUp className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p>Complete some tests to see your analytics</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations">
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Award className="h-5 w-5" />
                    Smart Recommendations
                  </CardTitle>
                  <CardDescription>AI-powered test recommendations based on your learning journey</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-gray-500">
                    <Zap className="h-16 w-16 mx-auto mb-4 opacity-50" />
                    <p className="mb-4">Complete your profile setup to get personalized recommendations</p>
                    <Button
                      onClick={generateRecommendedTest}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Zap className="h-4 w-4 mr-2" />
                      Generate Smart Test
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </div>
  );
}
