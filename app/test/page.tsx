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
  ArrowRight,
  Play,
  Calendar,
} from 'lucide-react';
import { useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useMemo, Suspense, useCallback } from 'react';

import { AdaptiveTestCard, TestConfigModal, TestConfig } from '@/components/adaptive-testing';
import { TestGenerationOverlay } from '@/components/adaptive-testing/TestGenerationOverlay';
import BottomNav from '@/components/BottomNav';
import MobileScrollGrid from '@/components/layout/MobileScrollGrid';
import { FeaturePageHeader } from '@/components/layout/PageHeader';
import PageTransition from '@/components/layout/PageTransition';
import { ScrollableTabsList } from '@/components/layout/ScrollableTabsList';
import Navigation from '@/components/Navigation';
import {
  StatCardSkeletonGrid,
  TestCardSkeletonGrid,
  RecommendationCardSkeletonGrid,
  TestPageSkeleton,
} from '@/components/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/contexts/CourseContext';
import { useToast } from '@/hooks/use-toast';
import { adaptiveTestingService } from '@/lib/services/adaptive-testing-service';
import { logInfo, logError } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/utils';
import { AdaptiveTest } from '@/types/adaptive-testing';

interface TestOverviewStats {
  totalTests: number;
  completedTests: number;
  averageAccuracy: number;
  totalQuestions: number;
  timeSpent: number;
  timeSaved: number;
}

function AdaptiveTestingPageContent() {
  const { user } = useAuth();
  const { activeCourseId } = useCourse();
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
  const [showConfigModal, setShowConfigModal] = useState(false);
  const [preSelectedSubject, setPreSelectedSubject] = useState<string | undefined>(undefined);
  const [preSelectedTopic, setPreSelectedTopic] = useState<string | undefined>(undefined);
  const [preSelectedQuestionCount, setPreSelectedQuestionCount] = useState<number | undefined>(undefined);
  const [recommendations, setRecommendations] = useState<any[]>([]); // TestRecommendation[]
  const [loadingRecommendations, setLoadingRecommendations] = useState(false);

  // Month filter - default to current month in format "YYYY-MM"
  const getCurrentMonth = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}`;
  };
  const [filterMonth, setFilterMonth] = useState<string>(getCurrentMonth());

  // Pagination state
  const ITEMS_PER_PAGE = 6;
  const [testsPage, setTestsPage] = useState(1);
  const [recommendationsPage, setRecommendationsPage] = useState(1);

  const searchParams = useSearchParams();
  const router = useRouter();

  // Handle URL params for "Take Test" from syllabus

  // Handle URL params for "Take Test" from syllabus
  useEffect(() => {
    const subject = searchParams.get('subject');
    const topic = searchParams.get('topic');

    if (subject || topic) {
      logInfo('[TestPage] URL Params detected', { subject, topic });
      setPreSelectedSubject(subject || undefined);
      setPreSelectedTopic(topic || undefined);
      setShowConfigModal(true);

      // Clean up URL params
      router.replace('/test', { scroll: false });
    }
  }, [searchParams, router]);

  // Data Fetching Functions
  const loadTestsAndStats = useCallback(async () => {
    if (!user?.uid) {
      return;
    }

    try {
      const testsResult = await adaptiveTestingService.getUserTests(user.uid, activeCourseId ?? undefined);
      setTests(testsResult);

      // Calculate stats
      const completedTests = testsResult.filter(test => test.status === 'completed');
      const totalQuestions = completedTests.reduce((sum, test) => sum + test.totalQuestions, 0);
      const totalAccuracy = completedTests.reduce((sum, test) => sum + (test.performance?.accuracy || 0), 0);
      const totalTime = completedTests.reduce((sum, test) => sum + (test.performance?.totalTime || 0), 0);

      setStats({
        totalTests: testsResult.length,
        completedTests: completedTests.length,
        averageAccuracy: completedTests.length > 0 ? totalAccuracy / completedTests.length : 0,
        totalQuestions,
        timeSpent: totalTime,
        timeSaved: totalQuestions * 120000 - totalTime,
      });
    } catch (error) {
      logError('Error loading tests', error as Error);
      toast({
        title: 'Error',
        description: 'Failed to load your tests.',
        variant: 'destructive',
      });
    }
  }, [user?.uid, toast]);

  const loadRecommendations = useCallback(async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setLoadingRecommendations(true);
      const recsResult = await adaptiveTestingService.generateTestRecommendations(user.uid, activeCourseId ?? undefined);

      if (recsResult.success && recsResult.data) {
        setRecommendations(recsResult.data);
      } else {
        logError('Error loading recommendations', recsResult.error || new Error('Unknown error'));
      }
    } catch (error) {
      logError('Error loading recommendations', error as Error);
    } finally {
      setLoadingRecommendations(false);
    }
  }, [user?.uid]);

  // Load initial data
  useEffect(() => {
    const loadAllData = async () => {
      if (!user?.uid) {
        return;
      }
      setLoading(true);

      // Parallel fetch
      await Promise.allSettled([loadTestsAndStats(), loadRecommendations()]);

      setLoading(false);
    };

    loadAllData();
  }, [user?.uid, loadTestsAndStats, loadRecommendations]);

  // Navigation Handlers
  const handleStartTest = (testId: string) => {
    router.push(`/test/${testId}`);
  };

  const handleViewResults = (testId: string) => {
    router.push(`/test/${testId}`);
  };

  const handleRetakeTest = (testId: string) => {
    // Retake logic will be handled by detail page
    router.push(`/test/${testId}`);
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
          description:
            config.topics.length > 0
              ? `Testing: ${config.topics.join(', ')}`
              : `Comprehensive ${config.subjects[0]} test`,
          subjects: config.subjects,
          ...(config.topics.length > 0 && { topics: config.topics }),
          difficulty: config.difficulty,
          questionCount: config.questionCount,
          questionType: 'multiple_choice',
          ...(config.syllabusContext && { syllabusContext: config.syllabusContext }),
        }),
        minAnimationTime,
      ]);

      if (!testResult.success || !testResult.data) {
        logError('[TestPage] Failed to create test', testResult.error);
        throw new Error('Failed to create test');
      }

      logInfo('[TestPage] Test created successfully', { testId: testResult.data.id });
      // Reload everything
      router.refresh();
      setIsGenerating(false);
      handleStartTest(testResult.data.id);
    } catch (error) {
      logError('[TestPage] Error generating test', error as Error);
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
        adaptiveTestingService.generateTestRecommendations(user.uid, activeCourseId ?? undefined),
        minAnimationTime,
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

    // Month filter - check if test's createdAt matches selected month
    const matchesMonth =
      filterMonth === 'all' ||
      (() => {
        if (!test.createdAt) {
          return false;
        }
        const testDate = test.createdAt instanceof Date ? test.createdAt : new Date(test.createdAt);
        const testMonth = `${testDate.getFullYear()}-${String(testDate.getMonth() + 1).padStart(2, '0')}`;
        return testMonth === filterMonth;
      })();

    return matchesSearch && matchesStatus && matchesSubject && matchesMonth;
  });

  // Get unique subjects for filter
  const allSubjects = Array.from(new Set(tests.flatMap(test => test.linkedSubjects)));

  // Generate available months (from earliest test to current month, no future months)
  const availableMonths = useMemo(() => {
    const months: { value: string; label: string }[] = [];
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Find earliest test date
    let earliestDate = currentDate;
    tests.forEach(test => {
      if (test.createdAt) {
        const testDate = test.createdAt instanceof Date ? test.createdAt : new Date(test.createdAt);
        if (testDate < earliestDate) {
          earliestDate = testDate;
        }
      }
    });

    // Generate months from earliest to current (reverse order - newest first)
    const startYear = earliestDate.getFullYear();
    const startMonth = earliestDate.getMonth();

    for (let year = currentYear; year >= startYear; year--) {
      const endM = year === currentYear ? currentMonth : 11;
      const startM = year === startYear ? startMonth : 0;

      for (let month = endM; month >= startM; month--) {
        const value = `${year}-${String(month + 1).padStart(2, '0')}`;
        const label = new Date(year, month).toLocaleDateString('en-US', { month: 'long', year: 'numeric' });
        months.push({ value, label });
      }
    }

    return months;
  }, [tests]);

  const formatTime = (ms: number) => {
    const hours = Math.floor(ms / (1000 * 60 * 60));
    const minutes = Math.floor((ms % (1000 * 60 * 60)) / (1000 * 60));
    return hours > 0 ? `${hours}h ${minutes}m` : `${minutes}m`;
  };

  // Pagination calculations for Tests
  const totalTestPages = Math.ceil(filteredTests.length / ITEMS_PER_PAGE);
  const pagedTests = useMemo(() => {
    const start = (testsPage - 1) * ITEMS_PER_PAGE;
    return filteredTests.slice(start, start + ITEMS_PER_PAGE);
  }, [filteredTests, testsPage]);

  // Pagination calculations for Recommendations
  const totalRecommendationPages = Math.ceil(recommendations.length / ITEMS_PER_PAGE);
  const pagedRecommendations = useMemo(() => {
    const start = (recommendationsPage - 1) * ITEMS_PER_PAGE;
    return recommendations.slice(start, start + ITEMS_PER_PAGE);
  }, [recommendations, recommendationsPage]);

  // Reset page when filters change
  useEffect(() => {
    setTestsPage(1);
  }, [searchQuery, filterStatus, filterSubject, filterMonth]);

  const cardClass = 'min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center';

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <BottomNav />
        <PageTransition>
          <TestPageSkeleton />
        </PageTransition>
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
        onOpenChange={open => {
          setShowConfigModal(open);
          if (!open) {
            // Clear pre-selected values when modal closes
            setPreSelectedSubject(undefined);
            setPreSelectedTopic(undefined);
            setPreSelectedQuestionCount(undefined);
          }
        }}
        onGenerate={handleGenerateFromConfig}
        isGenerating={isGenerating}
        {...(preSelectedSubject !== undefined && { preSelectedSubject })}
        {...(preSelectedTopic !== undefined && { preSelectedTopic })}
        {...(preSelectedQuestionCount !== undefined && { preSelectedQuestionCount })}
      />

      <div className="container mx-auto px-4 py-8 pb-40 sm:pb-40 xl:pb-8">
        <PageTransition className="max-w-6xl mx-auto space-y-8">
          {/* Header */}
          <FeaturePageHeader
            title="Adaptive Testing"
            description="Personalized assessments that adapt to your knowledge level in real-time"
            icon={<Brain className="h-5 w-5 text-purple-600" />}
            actions={
              <Button
                onClick={() => setShowConfigModal(true)}
                className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
              >
                <Plus className="h-4 w-4 mr-2" />
                New Test
              </Button>
            }
          />

          {/* Active Session Banner */}
          {!loading && tests.filter(t => t.status === 'active').length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              className="relative overflow-hidden"
            >
              <Card className="border-0 bg-gradient-to-r from-amber-500 via-orange-500 to-red-500 text-white shadow-lg shadow-orange-200">
                <CardContent className="p-5">
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center">
                        <Play className="h-6 w-6 fill-current" />
                      </div>
                      <div>
                        <h3 className="font-bold text-lg">Continue Your Assessment</h3>
                        <p className="text-sm text-white/90">
                          {tests.filter(t => t.status === 'active')[0]?.title} —{' '}
                          {Math.round(
                            ((tests.filter(t => t.status === 'active')[0]?.currentQuestion || 0) /
                              (tests.filter(t => t.status === 'active')[0]?.totalQuestions || 1)) *
                              100
                          )}
                          % complete
                        </p>
                      </div>
                    </div>
                    <Button
                      onClick={() => router.push(`/test/${tests.filter(t => t.status === 'active')[0]?.id}`)}
                      className="bg-white text-orange-600 hover:bg-white/90 font-semibold shadow-md"
                    >
                      Resume Now
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {/* Stats Overview */}
          {loading ? (
            <StatCardSkeletonGrid count={4} />
          ) : (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
              <MobileScrollGrid className="md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card
                  className={cn('border-0 shadow-lg bg-gradient-to-br from-blue-500 to-blue-600 text-white', cardClass)}
                >
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

                <Card
                  className={cn(
                    'border-0 shadow-lg bg-gradient-to-br from-green-500 to-green-600 text-white',
                    cardClass
                  )}
                >
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

                <Card
                  className={cn(
                    'border-0 shadow-lg bg-gradient-to-br from-purple-500 to-purple-600 text-white',
                    cardClass
                  )}
                >
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

                <Card
                  className={cn(
                    'border-0 shadow-lg bg-gradient-to-br from-orange-500 to-orange-600 text-white',
                    cardClass
                  )}
                >
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

          {/* Quick Test Presets */}
          {!loading && (
            <div className="space-y-3">
              <h3 className="text-sm font-semibold text-gray-600 uppercase tracking-wider">Quick Start</h3>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <Card
                  className="border-0 shadow-md bg-gradient-to-br from-emerald-50 to-teal-50 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => {
                    setPreSelectedQuestionCount(3);
                    setShowConfigModal(true);
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Zap className="h-5 w-5 text-emerald-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-emerald-900">Quick Warmup</p>
                        <p className="text-xs text-emerald-600">3 questions • ~6 min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-0 shadow-md bg-gradient-to-br from-blue-50 to-indigo-50 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => {
                    setPreSelectedQuestionCount(7);
                    setShowConfigModal(true);
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Target className="h-5 w-5 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-blue-900">Focused Practice</p>
                        <p className="text-xs text-blue-600">7 questions • ~14 min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card
                  className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-pink-50 hover:shadow-lg transition-all cursor-pointer group"
                  onClick={() => {
                    setPreSelectedQuestionCount(15);
                    setShowConfigModal(true);
                  }}
                >
                  <CardContent className="p-5">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-purple-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        <Award className="h-5 w-5 text-purple-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-purple-900">Full Assessment</p>
                        <p className="text-xs text-purple-600">15 questions • ~30 min</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>
            </div>
          )}

          {/* Main Content */}
          <Tabs defaultValue="analytics" className="space-y-6 min-h-[60vh]">
            <ScrollableTabsList>
              <TabsList className="flex w-full md:grid md:grid-cols-3">
                <TabsTrigger value="analytics" className="flex-shrink-0 snap-start">
                  Analytics
                </TabsTrigger>
                <TabsTrigger value="tests" className="flex-shrink-0 snap-start">
                  My Tests
                </TabsTrigger>
                <TabsTrigger value="recommendations" className="flex-shrink-0 snap-start">
                  Recommendations
                </TabsTrigger>
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
                      <Select value={filterMonth} onValueChange={setFilterMonth}>
                        <SelectTrigger className="w-full md:w-48 flex-1 md:flex-none">
                          <Calendar className="h-4 w-4 mr-2 text-gray-500" />
                          <SelectValue placeholder="Month" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Time</SelectItem>
                          {availableMonths.map(month => (
                            <SelectItem key={month.value} value={month.value}>
                              {month.label}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
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
                <TestCardSkeletonGrid count={6} />
              ) : filteredTests.length > 0 ? (
                <>
                  <motion.div
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
                  >
                    {pagedTests.map((test, index) => (
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
                        />
                      </motion.div>
                    ))}
                  </motion.div>

                  {/* Pagination Controls */}
                  {totalTestPages > 1 && (
                    <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t">
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={testsPage === 1}
                        onClick={() => setTestsPage(p => Math.max(1, p - 1))}
                      >
                        ← Previous
                      </Button>
                      <span className="text-sm text-gray-600">
                        Page {testsPage} of {totalTestPages}
                        <span className="text-gray-400 ml-2">({filteredTests.length} tests)</span>
                      </span>
                      <Button
                        variant="outline"
                        size="sm"
                        disabled={testsPage === totalTestPages}
                        onClick={() => setTestsPage(p => Math.min(totalTestPages, p + 1))}
                      >
                        Next →
                      </Button>
                    </div>
                  )}
                </>
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
                                      {test.performance?.totalQuestions || 0} questions •{' '}
                                      {formatTime(test.performance?.totalTime || 0)}
                                    </p>
                                  </div>
                                </div>
                                <div className="text-right">
                                  <p
                                    className={`font-bold ${(test.performance?.accuracy || 0) >= 70 ? 'text-green-600' : 'text-orange-600'}`}
                                  >
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
                                ? 'Excellent work! Consider challenging yourself with harder topics.'
                                : stats.averageAccuracy >= 60
                                  ? 'Good progress! Focus on weak areas identified in test reviews.'
                                  : 'Keep practicing! Review explanations after each test to improve.'}
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

            <TabsContent value="recommendations" className="space-y-6">
              {/* How It Works Explanation */}
              <Card className="border-0 shadow-md bg-gradient-to-br from-purple-50 to-blue-50">
                <CardHeader className="pb-3">
                  <CardTitle className="flex items-center gap-2 text-lg">
                    <Brain className="h-5 w-5 text-purple-600" />
                    How Smart Recommendations Work
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4 text-sm">
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                        <Target className="h-4 w-4 text-red-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">60% Weak Area Focus</p>
                        <p className="text-gray-600 text-xs">Prioritizes topics where you need improvement</p>
                      </div>
                    </div>
                  <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="h-4 w-4 text-blue-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">20% Difficulty Match</p>
                        <p className="text-gray-600 text-xs">Matches your current skill level</p>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center flex-shrink-0">
                        <BarChart3 className="h-4 w-4 text-green-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">10% Variety</p>
                        <p className="text-gray-600 text-xs">Encourages diverse topic coverage</p>
                      </div>
                    </div>
                  <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-orange-100 flex items-center justify-center flex-shrink-0">
                        <Zap className="h-4 w-4 text-orange-600" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-900">10% Freshness</p>
                        <p className="text-gray-600 text-xs">Revisits topics you haven't seen lately</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Recommendations List */}
              <Card className="border-0 shadow-lg">
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Award className="h-5 w-5 text-yellow-600" />
                        Your Personalized Tests
                      </CardTitle>
                      <CardDescription>AI-powered recommendations tailored to your learning journey</CardDescription>
                    </div>
                    <Button variant="outline" size="sm" onClick={loadRecommendations} disabled={loadingRecommendations}>
                      {loadingRecommendations ? 'Refreshing...' : 'Refresh'}
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  {loadingRecommendations ? (
                    <RecommendationCardSkeletonGrid count={4} />
                  ) : recommendations.length > 0 ? (
                    <>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pagedRecommendations.map((rec, index) => (
                          <motion.div
                            key={rec.testId || index}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: index * 0.1 }}
                          >
                            <Card className="border hover:shadow-md transition-shadow h-full">
                              <CardContent className="p-5 flex flex-col h-full">
                                <div className="flex items-start justify-between gap-3 mb-3">
                                  <div className="flex-1">
                                    <h3 className="font-semibold text-gray-900">{rec.title}</h3>
                                    <p className="text-sm text-gray-600 line-clamp-2">{rec.description}</p>
                                  </div>
                                  <Badge
                                    variant={
                                      rec.priority === 'high'
                                        ? 'destructive'
                                        : rec.priority === 'medium'
                                          ? 'default'
                                          : 'secondary'
                                    }
                                    className="flex-shrink-0"
                                  >
                                    {rec.priority}
                                  </Badge>
                                </div>

                                <div className="flex flex-wrap gap-1 mb-3">
                                  {rec.subjects?.slice(0, 3).map((subject: string) => (
                                    <Badge key={subject} variant="outline" className="text-xs">
                                      {subject}
                                    </Badge>
                                  ))}
                                </div>

                                <div className="flex items-center gap-4 text-xs text-gray-500 mb-4">
                                  <span className="flex items-center gap-1">
                                    <Clock className="h-3 w-3" />~{rec.estimatedDuration || 20} min
                                  </span>
                                  <span className="flex items-center gap-1">
                                    <Target className="h-3 w-3" />
                                    {rec.questionCount || 15} questions
                                  </span>
                                  {rec.confidence && (
                                    <span className="flex items-center gap-1">
                                      <TrendingUp className="h-3 w-3" />
                                      {Math.round(rec.confidence * 100)}% match
                                    </span>
                                  )}
                                </div>

                                {rec.reasons && rec.reasons.length > 0 && (
                                  <div className="bg-gray-50 rounded-lg p-3 mb-4 text-xs">
                                    <p className="font-medium text-gray-700 mb-1">Why this test?</p>
                                    <ul className="text-gray-600 space-y-0.5">
                                      {rec.reasons.slice(0, 2).map((reason: string, i: number) => (
                                        <li key={i}>• {reason}</li>
                                      ))}
                                    </ul>
                                  </div>
                                )}

                                <div className="mt-auto">
                                  <Button
                                    className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                                    onClick={async () => {
                                      if (!user?.uid) {
                                        return;
                                      }
                                      setIsGenerating(true);
                                      try {
                                        const result = await adaptiveTestingService.createTestFromRecommendation(
                                          user.uid,
                                          rec
                                        );
                                        if (result.success && result.data) {
                                          router.push(`/test/${result.data.id}`);
                                        }
                                      } catch (error) {
                                        console.error('Failed to create test:', error);
                                        toast({
                                          title: 'Error',
                                          description: 'Failed to create test',
                                          variant: 'destructive',
                                        });
                                      } finally {
                                        setIsGenerating(false);
                                      }
                                    }}
                                  >
                                    <Play className="h-4 w-4 mr-2" />
                                    Start This Test
                                  </Button>
                                </div>
                              </CardContent>
                            </Card>
                          </motion.div>
                        ))}
                      </div>

                      {/* Pagination Controls */}
                      {totalRecommendationPages > 1 && (
                        <div className="flex items-center justify-center gap-4 mt-6 pt-4 border-t">
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={recommendationsPage === 1}
                            onClick={() => setRecommendationsPage(p => Math.max(1, p - 1))}
                          >
                            ← Previous
                          </Button>
                          <span className="text-sm text-gray-600">
                            Page {recommendationsPage} of {totalRecommendationPages}
                            <span className="text-gray-400 ml-2">({recommendations.length} recommendations)</span>
                          </span>
                          <Button
                            variant="outline"
                            size="sm"
                            disabled={recommendationsPage === totalRecommendationPages}
                            onClick={() => setRecommendationsPage(p => Math.min(totalRecommendationPages, p + 1))}
                          >
                            Next →
                          </Button>
                        </div>
                      )}
                    </>
                  ) : (
                    <EmptyState
                      icon={Zap}
                      title="No recommendations yet"
                      description="Complete some tests to get personalized recommendations tailored to your weak areas"
                      className="border-0 bg-transparent"
                      action={
                        <Button
                          onClick={() => setShowConfigModal(true)}
                          className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                        >
                          <Zap className="h-4 w-4 mr-2" />
                          Create Your First Test
                        </Button>
                      }
                    />
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </PageTransition>
      </div>
    </div>
  );
}
export default function AdaptiveTestingPage() {
  return (
    <Suspense fallback={<TestPageSkeleton />}>
      {' '}
      <AdaptiveTestingPageContent />{' '}
    </Suspense>
  );
}
