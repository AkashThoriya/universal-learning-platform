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

import { AdaptiveTestCard, QuestionInterface, TestAnalyticsDashboard, TestConfigModal, TestConfig } from '@/components/adaptive-testing';
import { TestGenerationOverlay } from '@/components/adaptive-testing/TestGenerationOverlay';
import BottomNav from '@/components/BottomNav';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { adaptiveTestingService } from '@/lib/services/adaptive-testing-service';
import { AdaptiveTest, TestSession, AdaptiveQuestion } from '@/types/adaptive-testing';
import PageTransition from '@/components/layout/PageTransition';
import MobileScrollGrid from '@/components/layout/MobileScrollGrid';
import { ScrollableTabsList } from '@/components/layout/ScrollableTabsList';
import { cn } from '@/lib/utils/utils';

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
  const [isGenerating, setIsGenerating] = useState(false);
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
  const [showConfigModal, setShowConfigModal] = useState(false);

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

  // Handle test generation from modal config
  const handleGenerateFromConfig = async (config: TestConfig) => {
    if (!user?.uid) {
      toast({
        title: 'Error',
        description: 'Please log in to generate a test.',
        variant: 'destructive',
      });
      return;
    }

    setShowConfigModal(false);
    setIsGenerating(true);

    const minAnimationTime = new Promise(resolve => setTimeout(resolve, 6000));

    try {
      const [testResult] = await Promise.all([
        adaptiveTestingService.createAdaptiveTest(user.uid, {
          title: `${config.subjects[0]} Test - ${config.difficulty}`,
          description: config.topics.length > 0 
            ? `Testing: ${config.topics.join(', ')}` 
            : `Comprehensive ${config.subjects[0]} test`,
          subjects: config.subjects,
          ...(config.topics.length > 0 && { topics: config.topics }),
          difficulty: config.difficulty,
          questionCount: config.questionCount,
          questionType: 'multiple_choice',
          ...(config.syllabusContext && { syllabusContext: config.syllabusContext }),
        }),
        minAnimationTime
      ]);

      if (!testResult.success || !testResult.data) {
        throw new Error('Failed to create test');
      }
      
      await loadTestsAndStats();
      setIsGenerating(false);
      handleStartTest(testResult.data.id);
    } catch (error) {
      console.error('Error generating test from config:', error);
      setIsGenerating(false);
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Failed to generate test. Please try again.',
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

    // Start Generation Visuals
    setIsGenerating(true);

    // This promise wrapper ensures the animation plays for at least 6s (sum of step durations)
    // so the user sees the "Magic" fully, even if the API is fast.
    const minAnimationTime = new Promise(resolve => setTimeout(resolve, 8000));
    
    try {
      // Run generation in parallel with animation
      const [recommendations] = await Promise.all([
        adaptiveTestingService.generateTestRecommendations(user.uid),
        minAnimationTime
      ]);

      if (recommendations.success && recommendations.data && recommendations.data.length > 0) {
        // Just take the first recommendation for "Smart Test" flow
        const newTest = await adaptiveTestingService.createTestFromRecommendation(user.uid, recommendations.data[0]!);
        if (newTest.success && newTest.data) {
          await loadTestsAndStats();
          // Hide overlay then start
          setIsGenerating(false);
          handleStartTest(newTest.data.id);
        }
      } else {
        setIsGenerating(false);
        toast({
          title: 'Info',
          description: 'No new test recommendations available at this time.',
          variant: 'default',
        });
      }
    } catch (error) {
      console.error('Error generating recommended test:', error);
      setIsGenerating(false);
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

  const cardClass = "min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center";

  // Show active test interface
  if (activeTest && activeTest.currentQuestion) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <BottomNav />
        <div className="container mx-auto px-4 py-8 pb-20 xl:pb-8">
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
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50">
        <Navigation />
        <BottomNav />
        <div className="container mx-auto px-4 py-8 pb-20 xl:pb-8">
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
              questions={showResults.test.questions || []}
              responses={showResults.test.responses || []}
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
      <Navigation />
      <BottomNav />
      
      {/* Test Generation Overlay */}
      <TestGenerationOverlay isVisible={isGenerating} />

      {/* Test Configuration Modal */}
      <TestConfigModal
        open={showConfigModal}
        onOpenChange={setShowConfigModal}
        onGenerate={handleGenerateFromConfig}
        isGenerating={isGenerating}
      />

      <div className="container mx-auto px-4 py-8 pb-20 xl:pb-8">
        <PageTransition className="max-w-7xl mx-auto space-y-8">
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
              <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold text-gray-800">Adaptive Testing</h1>
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
            >
              <MobileScrollGrid className="md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card className={cn("border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white", cardClass)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-blue-100 text-sm">Total Tests</p>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.totalTests}</p>
                      </div>
                      <Target className="h-8 w-8 text-blue-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn("border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white", cardClass)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-green-100 text-sm">Average Score</p>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.averageAccuracy.toFixed(1)}%</p>
                      </div>
                      <Star className="h-8 w-8 text-green-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn("border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white", cardClass)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-purple-100 text-sm">Questions Answered</p>
                        <p className="text-2xl sm:text-3xl font-bold">{stats.totalQuestions}</p>
                      </div>
                      <BookOpen className="h-8 w-8 text-purple-200" />
                    </div>
                  </CardContent>
                </Card>

                <Card className={cn("border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white", cardClass)}>
                  <CardContent className="p-6">
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-orange-100 text-sm">Time Saved</p>
                        <p className="text-2xl sm:text-3xl font-bold">{formatTime(stats.timeSaved)}</p>
                      </div>
                      <Clock className="h-8 w-8 text-orange-200" />
                    </div>
                  </CardContent>
                </Card>
              </MobileScrollGrid>
            </motion.div>
          )}

          {/* Main Content */}
          <Tabs defaultValue="tests" className="space-y-6 min-h-[60vh]">
            <ScrollableTabsList>
              <TabsList className="flex w-full md:grid md:grid-cols-3">
                <TabsTrigger value="tests" className="flex-shrink-0 snap-start">My Tests</TabsTrigger>
                <TabsTrigger value="analytics" className="flex-shrink-0 snap-start">Analytics</TabsTrigger>
                <TabsTrigger value="recommendations" className="flex-shrink-0 snap-start">Recommendations</TabsTrigger>
              </TabsList>
            </ScrollableTabsList>

            <TabsContent value="tests" className="space-y-6">
              {/* Controls */}
              <Card className="border-0 shadow-md">
                <CardContent className="p-6">
                  <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
                    <div className="flex flex-col md:flex-row gap-4 flex-1 w-full">
                      <div className="relative flex-1 max-w-md w-full">
                        <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                        <Input
                          placeholder="Search tests, subjects, or topics..."
                          value={searchQuery}
                          onChange={e => setSearchQuery(e.target.value)}
                          className="pl-10 w-full"
                        />
                      </div>
                      <div className="flex gap-2 w-full md:w-auto">
                        <Select value={filterStatus} onValueChange={setFilterStatus}>
                          <SelectTrigger className="w-full md:w-40 flex-1 md:flex-none">
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
                          <SelectTrigger className="w-full md:w-40 flex-1 md:flex-none">
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
                    </div>
                    <div className="flex gap-2 w-full md:w-auto">
                      <Button variant="outline" onClick={loadTestsAndStats} className="flex-1 md:flex-none">
                        <RefreshCw className="h-4 w-4 mr-2" />
                        Refresh
                      </Button>
                      <Button
                        onClick={generateRecommendedTest}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 flex-1 md:flex-none"
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
                <EmptyState
                  icon={Brain}
                  title="No tests found"
                  description={
                    searchQuery || filterStatus !== 'all' || filterSubject !== 'all'
                      ? 'Try adjusting your search or filters'
                      : 'Create your first adaptive test to get started'
                  }
                  action={
                    <Button
                      onClick={() => setShowConfigModal(true)}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                    >
                      <Plus className="h-4 w-4 mr-2" />
                      Generate Smart Test
                    </Button>
                  }
                />
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
                  {stats.completedTests > 0 ? (
                    <div className="space-y-6">
                      {/* Performance Summary */}
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-blue-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-blue-600 font-medium">Completed Tests</p>
                          <p className="text-2xl font-bold text-blue-900">{stats.completedTests}</p>
                        </div>
                        <div className="bg-green-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-green-600 font-medium">Average Accuracy</p>
                          <p className="text-2xl font-bold text-green-900">{stats.averageAccuracy.toFixed(1)}%</p>
                        </div>
                        <div className="bg-purple-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-purple-600 font-medium">Total Questions</p>
                          <p className="text-2xl font-bold text-purple-900">{stats.totalQuestions}</p>
                        </div>
                        <div className="bg-orange-50 rounded-lg p-4 text-center">
                          <p className="text-sm text-orange-600 font-medium">Time Invested</p>
                          <p className="text-2xl font-bold text-orange-900">{formatTime(stats.timeSpent)}</p>
                        </div>
                      </div>

                      {/* Recent Test History */}
                      <div>
                        <h4 className="font-semibold text-gray-900 mb-3">Recent Test History</h4>
                        <div className="space-y-3">
                          {tests
                            .filter(t => t.status === 'completed')
                            .slice(0, 5)
                            .map((test, index) => (
                              <div 
                                key={test.id} 
                                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 transition-colors cursor-pointer"
                                onClick={() => handleViewResults(test.id)}
                              >
                                <div className="flex items-center gap-3">
                                  <div className="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-bold">
                                    {index + 1}
                                  </div>
                                  <div>
                                    <p className="font-medium text-gray-900">{test.title}</p>
                                    <p className="text-xs text-gray-500">
                                      {test.performance?.totalQuestions || 0} questions • {formatTime(test.performance?.totalTime || 0)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p className={`font-bold ${(test.performance?.accuracy || 0) >= 70 ? 'text-green-600' : 'text-orange-600'}`}>
                                    {test.performance?.accuracy.toFixed(0) || 0}%
                                  </p>
                                  <p className="text-xs text-gray-500">Score</p>
                                </div>
                              </div>
                            ))}
                        </div>
                        {tests.filter(t => t.status === 'completed').length === 0 && (
                          <p className="text-center text-gray-500 py-4">No completed tests yet</p>
                        )}
                      </div>

                      {/* Performance Tip */}
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                        <div className="flex items-start gap-3">
                          <TrendingUp className="h-5 w-5 text-blue-600 mt-0.5" />
                          <div>
                            <h5 className="font-medium text-blue-900">Performance Tip</h5>
                            <p className="text-sm text-blue-700 mt-1">
                              {stats.averageAccuracy >= 80 
                                ? "Excellent work! Consider challenging yourself with harder topics."
                                : stats.averageAccuracy >= 60
                                ? "Good progress! Focus on weak areas identified in test reviews."
                                : "Keep practicing! Review explanations after each test to improve."}
                            </p>
                          </div>
                        </div>
                      </div>
                    </div>
                  ) : (
                    <EmptyState
                      icon={TrendingUp}
                      title="No analytics yet"
                      description="Complete some tests to see your performance analytics"
                      className="border-0 bg-transparent"
                    />
                  )}
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
                  <EmptyState
                    icon={Zap}
                    title="No recommendations yet"
                    description="Complete your profile setup to get personalized recommendations"
                    className="border-0 bg-transparent"
                    action={
                      <Button
                        onClick={() => setShowConfigModal(true)}
                        className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                      >
                        <Zap className="h-4 w-4 mr-2" />
                        Generate Smart Test
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </PageTransition>
      </div>
    </div>
  );
}
