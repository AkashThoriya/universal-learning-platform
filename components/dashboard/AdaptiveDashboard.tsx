'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  Target,
  TrendingUp,
  PlayCircle,
  Zap,
  Trophy,
  Flame,
  Star,
  Calendar,
  Award,
  Brain,

  LucideIcon,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { CourseOverviewCard } from '@/components/dashboard/CourseOverviewCard';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import MobileScrollGrid from '@/components/layout/MobileScrollGrid';
import { DashboardSkeleton } from '@/components/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/contexts/CourseContext';
import { useToast } from '@/hooks/use-toast';
import { getExamById } from '@/lib/data/exams-data';
import { customLearningService } from '@/lib/firebase/firebase-services';
import { getUser, getSyllabus, updateUser, getAllProgress } from '@/lib/firebase/firebase-utils';
import { adaptiveTestingService } from '@/lib/services/adaptive-testing-service';
import { progressService } from '@/lib/services/progress-service';
import { generateTodayRecommendations } from '@/lib/utils/dashboard-utils';
import { logError, logInfo, measurePerformance } from '@/lib/utils/logger';
import { cn } from '@/lib/utils/utils';
import { Exam, SelectedCourse } from '@/types/exam';

interface DashboardStats {
  totalStudyTime: number;
  completedSessions: number;
  currentStreak: number;
  weeklyGoalProgress: number;
  completedTopics: number;
  // Custom learning stats
  customGoalsActive: number;
  customGoalsCompleted: number;
  customLearningHours: number;
  // Adaptive testing stats
  adaptiveTestsCompleted: number;
  adaptiveTestsAverage: number;
  adaptiveTestsTotal: number;

}

interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: LucideIcon;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface AdaptiveDashboardProps {
  className?: string;
}



export default function AdaptiveDashboard({ className }: AdaptiveDashboardProps) {
  const { user } = useAuth();
  const { activeCourseId: contextCourseId } = useCourse();

  const { toast } = useToast();
  const router = useRouter();

  logInfo('AdaptiveDashboard component initialized', {
    userId: user?.uid ?? 'no-user',
    timestamp: new Date().toISOString(),
  });

  const [stats, setStats] = useState<DashboardStats>({
    totalStudyTime: 0,
    completedSessions: 0,
    currentStreak: 0,
    weeklyGoalProgress: 0,
    completedTopics: 0,
    customGoalsActive: 0,
    customGoalsCompleted: 0,
    customLearningHours: 0,
    adaptiveTestsCompleted: 0,
    adaptiveTestsAverage: 0,
    adaptiveTestsTotal: 0,

  });
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [todayRecommendations, setTodayRecommendations] = useState<{
    currentTopic?: string;
    currentTopicId?: string;
    currentSubjectId?: string;
    nextAction?: string;
    studyGoal?: string;
    examDaysLeft?: number;
    subjectRecommendation?: string;
    todaysPlan?: string[];
    allTopicsComplete?: boolean;
  }>({});

  const [availableCourses, setAvailableCourses] = useState<SelectedCourse[]>([]);
  const [switchingCourse, setSwitchingCourse] = useState(false);
  const [activeCourseId, setActiveCourseId] = useState<string>('');

  useEffect(() => {
    const currentHour = new Date().getHours();
    const MORNING_START = 6;
    const AFTERNOON_START = 12;
    const EVENING_START = 18;

    if (currentHour < MORNING_START) {
      setTimeOfDay('night');
    } else if (currentHour < AFTERNOON_START) {
      setTimeOfDay('morning');
    } else if (currentHour < EVENING_START) {
      setTimeOfDay('afternoon');
    } else {
      setTimeOfDay('evening');
    }
  }, []);

  useEffect(() => {
    const loadDashboardData = async () => {
      await measurePerformance('loadDashboardData', async () => {
        logInfo('Loading dashboard data', {
          userId: user?.uid ?? 'no-user',
          timeOfDay,
        });

        try {
          if (!user?.uid) {
            // No user, use empty stats
            setStats({
              totalStudyTime: 0,
              completedSessions: 0,
              currentStreak: 0,
              weeklyGoalProgress: 0,
              completedTopics: 0,
              customGoalsActive: 0,
              customGoalsCompleted: 0,
              customLearningHours: 0,
              adaptiveTestsCompleted: 0,
              adaptiveTestsAverage: 0,
              adaptiveTestsTotal: 0,

            });
            setRecentAchievements([]);

            setIsLoading(false);
            return;
          }

          // Fetch real user data including profile and exam info
          // OPTIMIZED: Fetch all independent data in parallel to reduce latency
          const [progressResult, userProfile, userTests, syllabus, customGoalsResult, topicProgress] =
            await Promise.all([
              progressService.getUserProgress(user.uid, contextCourseId ?? undefined),
              getUser(user.uid),
              adaptiveTestingService.getUserTests(user.uid, contextCourseId ?? undefined),
              getSyllabus(user.uid, contextCourseId ?? undefined).catch(() => []), // Fetch syllabus with courseId
              customLearningService.getUserCustomGoals(user.uid), // Fetch custom goals in parallel
              getAllProgress(user.uid, contextCourseId ?? undefined).catch(() => []), // Fetch topic progress for recommendations
            ]);

          // Load selected exam information
          const currentExamId = userProfile?.currentExam?.id || '';
          setActiveCourseId(currentExamId);

          // Populate available courses
          if (currentExamId && userProfile?.currentExam) {
            const exam = getExamById(currentExamId);
            setAvailableCourses([
              {
                examId: currentExamId,
                examName: userProfile.currentExam.name || (exam?.name ?? 'Unknown Exam'),
                targetDate: userProfile.currentExam.targetDate,
                priority: 1,
                isPrimary: true,
              } as any,
            ]);
          }

          if (currentExamId) {
            const exam = getExamById(currentExamId);
            if (exam) {
              setSelectedExam(exam);

              // Calculate exam countdown
              const examDate = userProfile?.currentExam?.targetDate;
              const examDaysLeft = examDate
                ? Math.max(
                  0,
                  Math.ceil(
                    (((examDate as any).toDate ? (examDate as any).toDate() : new Date(examDate as any)).getTime() -
                      Date.now()) /
                    (1000 * 60 * 60 * 24)
                  )
                )
                : undefined;

              // Use pre-fetched syllabus and topic progress from Promise.all (faster load)
              const todayRecs = generateTodayRecommendations(exam, syllabus, topicProgress, examDaysLeft);
              setTodayRecommendations(todayRecs);
            }
          }

          // Process progress data
          let realStats: DashboardStats = {
            totalStudyTime: 0,
            completedSessions: 0,
            currentStreak: 0,
            weeklyGoalProgress: 0,
            completedTopics: 0,
            customGoalsActive: 0,
            customGoalsCompleted: 0,
            customLearningHours: 0,
            adaptiveTestsCompleted: 0,
            adaptiveTestsAverage: 0,
            adaptiveTestsTotal: 0,

          };

          if (progressResult.success && progressResult.data) {
            const progress = progressResult.data;

            // Recalculate metrics from topicProgress to ensure consistency with Strategy page
            // (Fixes issue where Strategy shows data but Dashboard shows 0)
            const topicInfoMap = new Map<string, { estimatedHours: number, isCustom: boolean }>();
            (syllabus || []).forEach(subject => {
              if (subject.topics) {
                subject.topics.forEach(topic => {
                  topicInfoMap.set(topic.id, {
                    estimatedHours: topic.estimatedHours || 1,
                    isCustom: subject.isCustom || false
                  });
                });
              }
            });

            let calculatedStudyMinutes = 0;
            let calculatedCustomMinutes = 0;
            let calculatedCompletedTopics = 0;

            (topicProgress || []).forEach(p => {
              const info = topicInfoMap.get(p.topicId);
              let duration = p.totalStudyTime || 0;

              // Fallback Logic: If completed/mastered but 0 time logged, use estimated hours
              if (duration === 0 && (p.status === 'completed' || p.status === 'mastered')) {
                duration = (info?.estimatedHours || 1) * 60;
              }

              calculatedStudyMinutes += duration;

              if (p.status === 'completed' || p.status === 'mastered') {
                calculatedCompletedTopics++;
              }

              if (info?.isCustom) {
                calculatedCustomMinutes += duration;
              }
            });

            realStats = {
              totalStudyTime: Math.round(calculatedStudyMinutes / 60), // Use calculated time
              completedSessions: progress.overallProgress.totalMissionsCompleted,
              currentStreak: progress.overallProgress.currentStreak,
              weeklyGoalProgress: Math.min(progress.overallProgress.consistencyRating, 100),
              completedTopics: calculatedCompletedTopics, // Use calculated count
              customGoalsActive: 0,
              customGoalsCompleted: 0,
              customLearningHours: Math.round(calculatedCustomMinutes / 60), // Use calculated custom time
              adaptiveTestsCompleted: userTests.filter(t => t.status === 'completed').length,
              adaptiveTestsAverage:
                userTests.filter(t => t.status === 'completed').length > 0
                  ? userTests
                    .filter(t => t.status === 'completed')
                    .reduce((sum, t) => sum + (t.performance?.accuracy || 0), 0) /
                  userTests.filter(t => t.status === 'completed').length
                  : 0,
              adaptiveTestsTotal: userTests.length,

            };
          }



          // Setup achievements based on real data
          const recentAchievements: Achievement[] = [];

          // Only show achievements if user has meaningful progress
          // Week Warrior: requires 7+ consecutive days
          if (realStats.currentStreak >= 7) {
            recentAchievements.push({
              id: 'week_warrior',
              title: 'Week Warrior',
              description: 'Maintained a 7-day learning streak',
              icon: Flame,
              earnedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
              rarity: 'rare',
            });
          }

          // First Steps: only if user has completed at least 3 sessions (not just 1)
          if (realStats.completedSessions >= 3 && realStats.completedSessions <= 5) {
            recentAchievements.push({
              id: 'first_steps',
              title: 'Getting Started',
              description: 'Completed your first 3 study sessions',
              icon: Award,
              earnedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
              rarity: 'common',
            });
          }

          // Study Champion: for users with 10+ completed sessions
          if (realStats.completedSessions >= 10) {
            recentAchievements.push({
              id: 'study_champion',
              title: 'Study Champion',
              description: 'Completed 10 study sessions',
              icon: Trophy,
              earnedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
              rarity: 'epic',
            });
          }

          // Only show the most recent achievement to avoid spam
          const finalAchievements = recentAchievements.slice(-1);

          // Use pre-fetched custom goals data from Promise.all (faster load)
          if (customGoalsResult.success) {
            // Update stats with real custom learning data
            const activeGoals = customGoalsResult.data.filter((goal: any) => goal.isActive).length;
            const completedGoals = customGoalsResult.data.filter(
              (goal: any) => goal.progress.completedMissions === goal.progress.totalMissions
            ).length;

            realStats = {
              ...realStats,
              customGoalsActive: activeGoals,
              customGoalsCompleted: completedGoals,
            };
          }

          setStats(realStats);
          setRecentAchievements(finalAchievements);

          logInfo('Dashboard data loaded successfully', {
            userId: user?.uid ?? 'no-user',
            stats: realStats,
            achievementCount: recentAchievements.length,
            timeOfDay,
          });
        } catch (error) {
          logError('Error loading dashboard data', {
            userId: user?.uid ?? 'no-user',
            error: error instanceof Error ? error.message : 'Unknown error',
          });

          // Fallback to empty data on error
          const fallbackStats: DashboardStats = {
            totalStudyTime: 0,
            completedSessions: 0,
            currentStreak: 0,
            weeklyGoalProgress: 0,
            completedTopics: 0,
            customGoalsActive: 0,
            customGoalsCompleted: 0,
            customLearningHours: 0,
            adaptiveTestsCompleted: 0,
            adaptiveTestsAverage: 0,
            adaptiveTestsTotal: 0,

          };
          setStats(fallbackStats);
          setRecentAchievements([]);
        } finally {
          setIsLoading(false);
        }
      });
    };

    loadDashboardData();
  }, [timeOfDay, user?.uid, contextCourseId]);

  const handleCourseSwitch = async (courseId: string) => {
    if (!user || switchingCourse || courseId === activeCourseId) {
      return;
    }

    try {
      setSwitchingCourse(true);

      // Update Firebase - use new schema field
      await updateUser(user.uid, { primaryCourseId: courseId });

      // Update local state
      setActiveCourseId(courseId);

      // Load new exam data
      const exam = getExamById(courseId);
      if (exam) {
        setSelectedExam(exam);

        // Load syllabus and topic progress for new course
        const [syllabus, topicProgress] = await Promise.all([
          getSyllabus(user.uid, courseId),
          getAllProgress(user.uid, courseId).catch(() => []),
        ]);

        // Find target date for the course
        const courseData = availableCourses.find(c => c.examId === courseId);
        const examDaysLeft = courseData?.targetDate
          ? Math.max(
            0,
            Math.ceil(
              (((courseData.targetDate as any).toDate
                ? (courseData.targetDate as any).toDate()
                : new Date(courseData.targetDate as any)
              ).getTime() -
                Date.now()) /
              (1000 * 60 * 60 * 24)
            )
          )
          : undefined;

        // Generate new recommendations
        const todayRecs = generateTodayRecommendations(exam, syllabus, topicProgress, examDaysLeft);
        setTodayRecommendations(todayRecs);

        toast({
          title: 'Course Switched',
          description: `Now focusing on ${exam.name}`,
        });
      }
    } catch (error) {
      console.error('Failed to switch course', error);
      toast({
        title: 'Error',
        description: 'Failed to switch course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSwitchingCourse(false);
    }
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  const getRarityColor = (rarity: Achievement['rarity']): string => {
    switch (rarity) {
      case 'common':
        return 'text-gray-600';
      case 'rare':
        return 'text-blue-600';
      case 'epic':
        return 'text-purple-600';
      case 'legendary':
        return 'text-yellow-600';
      default:
        return 'text-gray-600';
    }
  };

  const getRarityBadgeColor = (rarity: Achievement['rarity']): string => {
    switch (rarity) {
      case 'common':
        return 'bg-gray-100 text-gray-800';
      case 'rare':
        return 'bg-blue-100 text-blue-800';
      case 'epic':
        return 'bg-purple-100 text-purple-800';
      case 'legendary':
        return 'bg-yellow-100 text-yellow-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (isLoading) {
    return <DashboardSkeleton />;
  }

  return (
    <div className={cn('space-y-6', className)}>
      {/* Personalized Welcome Header */}
      {/* Personalized Welcome Header & Achievements */}
      {/* Header with Course Switcher */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        {availableCourses.length > 1 ? (
          <div className="w-full md:w-auto flex items-center gap-2 bg-white/50 backdrop-blur-sm p-1 rounded-lg border border-white/20">
            <span className="text-sm font-medium text-gray-600 pl-2">Current Focus:</span>
            <Select value={activeCourseId} onValueChange={handleCourseSwitch} disabled={switchingCourse}>
              <SelectTrigger className="w-[200px] h-8 bg-white border-0 shadow-sm">
                <SelectValue placeholder="Select Course" />
              </SelectTrigger>
              <SelectContent>
                {availableCourses.map(course => (
                  <SelectItem key={course.examId} value={course.examId}>
                    {course.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        ) : (
          <div />
        )}
        {/* Placeholder for future header items */}
      </div>

      <WelcomeHeader
        user={user}
        timeOfDay={timeOfDay}
        recentAchievements={recentAchievements}
        onDismissAchievement={() => setRecentAchievements(prev => prev.slice(1))}
        onViewAllAchievements={() => {
          /* TODO: Navigate to achievements page */
        }}
      />

      {/* Continue Where Left Off Card */}
      {todayRecommendations?.currentTopic && todayRecommendations?.currentTopicId && (
        <motion.div
          initial={{ opacity: 0, y: -10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.2 }}
          className="mb-4"
        >
          <Card className="border-0 shadow-lg bg-gradient-to-r from-green-50 via-emerald-50 to-teal-50 border-l-4 border-l-green-500">
            <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
              <div className="flex-1">
                <div className="flex items-center gap-2 mb-1">
                  <div className="p-1.5 bg-green-100 rounded-full">
                    <PlayCircle className="h-4 w-4 text-green-600" />
                  </div>
                  <span className="text-sm font-semibold text-green-700">Continue where you left off</span>
                </div>
                <h3 className="text-base sm:text-lg font-semibold text-gray-900">
                  {todayRecommendations.currentTopic}
                </h3>
                <p className="text-sm text-gray-600 mt-0.5">
                  {todayRecommendations.subjectRecommendation} • Ready to continue
                </p>
              </div>
              <Button
                onClick={() =>
                  router.push(`/syllabus/${todayRecommendations.currentTopicId}?subject=${todayRecommendations.currentSubjectId}`)
                }
                className="bg-green-600 hover:bg-green-700 gap-2 w-full sm:w-auto"
              >
                <PlayCircle className="h-4 w-4" />
                Resume
              </Button>
            </CardContent>
          </Card>
        </motion.div>
      )}

      {/* Habits Quick Action */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.25 }}
        className="mb-4"
      >
        <Card className="border-0 shadow-lg bg-gradient-to-r from-orange-50 via-amber-50 to-yellow-50 border-l-4 border-l-orange-500">
          <CardContent className="p-4 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <div className="p-1.5 bg-orange-100 rounded-full">
                  <Flame className="h-4 w-4 text-orange-600" />
                </div>
                <span className="text-sm font-semibold text-orange-700">Build Consistency</span>
              </div>
              <h3 className="text-base sm:text-lg font-semibold text-gray-900">Track Your Habits</h3>
              <p className="text-sm text-gray-600 mt-0.5">
                Auto-tracked study habits and custom goals — keep your streak alive
              </p>
            </div>
            <Button
              onClick={() => router.push('/habits')}
              className="bg-orange-600 hover:bg-orange-700 gap-2 w-full sm:w-auto"
            >
              <Flame className="h-4 w-4" />
              View Habits
            </Button>
          </CardContent>
        </Card>
      </motion.div>

      {/* Selected Exam and Today's Recommendations */}
      {selectedExam && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.3 }}
          className="bg-gradient-to-r from-indigo-50 via-blue-50 to-cyan-50 border border-indigo-200 rounded-lg p-4 sm:p-6"
        >
          <div className="flex flex-col md:flex-row md:items-start justify-between mb-4 gap-4">
            <div className="flex-1 min-w-0">
              <h2 className="text-xl font-semibold text-indigo-900 mb-2">
                📚 Currently preparing for {selectedExam.name}
              </h2>
              <p className="text-indigo-700 mb-2 line-clamp-2">{selectedExam.description}</p>
              <Badge variant="outline" className="text-indigo-600 border-indigo-300">
                {selectedExam.category}
              </Badge>
            </div>
            {todayRecommendations.examDaysLeft !== undefined && (
              <div className="flex items-center md:flex-col md:items-end gap-2 md:gap-0 md:text-right shrink-0">
                <div className="text-2xl font-bold text-indigo-900 leading-tight">
                  {todayRecommendations.examDaysLeft}
                </div>
                <div className="text-sm text-indigo-600 leading-tight">days left</div>
              </div>
            )}
          </div>

          <MobileScrollGrid className="mt-4 gap-4">
            <Card className="border-0 bg-white/60 backdrop-blur-sm min-w-[260px]">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between gap-2 mb-2">
                  <div className="flex items-center gap-2">
                    <Target className="h-4 w-4 text-blue-600" />
                    <span className="text-sm font-medium text-gray-700">Today's Focus</span>
                  </div>
                  {todayRecommendations.currentTopicId && todayRecommendations.currentSubjectId && (
                    <Button
                      size="sm"
                      variant="outline"
                      className="h-8 text-xs bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100"
                      onClick={() =>
                        router.push(`/syllabus/${todayRecommendations.currentTopicId}?subject=${todayRecommendations.currentSubjectId}`)
                      }
                    >
                      Log Progress
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-900">
                  {todayRecommendations.currentTopic ||
                    (todayRecommendations.allTopicsComplete
                      ? '🎉 All topics mastered! Take a mock test.'
                      : 'Choose a topic from syllabus')}
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/60 backdrop-blur-sm min-w-[260px]">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <Zap className="h-4 w-4 text-yellow-600" />
                  <span className="text-sm font-medium text-gray-700">Next Action</span>
                </div>
                <p className="text-sm text-gray-900">{todayRecommendations.nextAction}</p>
              </CardContent>
            </Card>

            <Card className="border-0 bg-white/60 backdrop-blur-sm min-w-[260px]">
              <CardContent className="pt-4">
                <div className="flex items-center gap-2 mb-2">
                  <TrendingUp className="h-4 w-4 text-green-600" />
                  <span className="text-sm font-medium text-gray-700">Study Goal</span>
                </div>
                <p className="text-sm text-gray-900">{todayRecommendations.studyGoal}</p>
              </CardContent>
            </Card>
          </MobileScrollGrid>

          <div className="flex flex-wrap gap-3 mt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/syllabus')}
              className="bg-white/60 hover:bg-white/80 flex-1 min-w-[120px] h-10"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View Syllabus
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => router.push('/test')}
              className="bg-white/60 hover:bg-white/80 flex-1 min-w-[120px] h-10"
            >
              <Brain className="h-4 w-4 mr-2" />
              Take Test
            </Button>

          </div>
        </motion.div>
      )}

      {/* Dashboard Content */}
      <div className="space-y-6">
        {/* Stats Grid - always shown */}
        <StatsGrid stats={stats} />

        {/* Main Content Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Today's Focus & Achievements */}
          <div className="lg:col-span-2 space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Star className="h-5 w-5 text-yellow-500" />
                  Today's Focus
                </CardTitle>
                <CardDescription>Personalized recommendations based on your progress</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* Dynamic content based on user's actual progress */}


                {/* Study recommendations based on actual data */}
                {stats.completedTopics > 0 ? (
                  <div className="p-3 sm:p-4 rounded-lg bg-green-50 border border-green-200">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h4 className="font-medium text-green-900">Keep Momentum</h4>
                        <p className="text-sm text-green-700 mt-1">
                          You've mastered {stats.completedTopics} topic{stats.completedTopics > 1 ? 's' : ''}!
                        </p>
                        <p className="text-xs text-green-600 mt-2">Take an adaptive test to assess your knowledge</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-green-600 hover:bg-green-700"
                        onClick={() => router.push('/test')}
                      >
                        Take Test
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="p-3 sm:p-4 rounded-lg bg-orange-50 border border-orange-200">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                      <div>
                        <h4 className="font-medium text-orange-900">Start Learning</h4>
                        <p className="text-sm text-orange-700 mt-1">Begin with your syllabus and topics</p>
                        <p className="text-xs text-orange-600 mt-2">Perfect for building your study foundation</p>
                      </div>
                      <Button
                        size="sm"
                        className="bg-orange-600 hover:bg-orange-700"
                          onClick={() => router.push('/syllabus')}
                      >
                        View Syllabus
                      </Button>
                    </div>
                  </div>
                )}

                {/* Today's Study Plan - NEW SECTION */}
                {selectedExam && todayRecommendations.todaysPlan && (
                  <div className="p-3 sm:p-4 rounded-lg bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200">
                    <div className="flex flex-col sm:flex-row sm:items-start justify-between mb-3 gap-3">
                      <div>
                        <h4 className="font-semibold text-blue-900 flex items-center gap-2">
                          <Calendar className="h-4 w-4" />
                          Today's Study Plan - {selectedExam.name}
                        </h4>
                        <p className="text-sm text-blue-700 mt-1">
                          {todayRecommendations.subjectRecommendation &&
                            `Focus on: ${todayRecommendations.subjectRecommendation}`}
                        </p>
                        {todayRecommendations.examDaysLeft && (
                          <p className="text-xs text-blue-600 mt-1">
                            📅 {todayRecommendations.examDaysLeft} days until exam
                          </p>
                        )}
                      </div>
                      <Button
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700"
                        onClick={() => router.push('/syllabus')}
                      >
                        Start Now
                      </Button>
                    </div>
                    <div className="space-y-2">
                      {todayRecommendations.todaysPlan.map((item, index) => (
                        <div key={index} className="flex items-center gap-2 text-sm text-blue-800">
                          <div className="w-2 h-2 rounded-full bg-blue-400" />
                          {item}
                        </div>
                      ))}
                    </div>
                    {todayRecommendations.studyGoal && (
                      <div className="mt-3 pt-3 border-t border-blue-200">
                        <p className="text-xs text-blue-600 font-medium">🎯 Goal: {todayRecommendations.studyGoal}</p>
                      </div>
                    )}
                  </div>
                )}

                <div className="p-4 rounded-lg bg-indigo-50 border border-indigo-200">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-medium text-indigo-900 flex items-center gap-2">
                        <Brain className="h-4 w-4" />
                        Adaptive Testing
                      </h4>
                      <p className="text-sm text-indigo-700 mt-1">
                        {stats.adaptiveTestsCompleted > 0
                          ? 'Continue your personalized assessment journey'
                          : 'Try AI-powered tests that adapt to your knowledge level'}
                      </p>
                      <p className="text-xs text-indigo-600 mt-2">
                        {stats.adaptiveTestsCompleted > 0
                          ? `${stats.adaptiveTestsCompleted} tests completed${stats.adaptiveTestsAverage > 0 ? ` • Average: ${stats.adaptiveTestsAverage.toFixed(1)}%` : ''}`
                          : 'Smart questions that adjust difficulty in real-time'}
                      </p>
                    </div>
                    <Button
                      size="sm"
                      className="bg-indigo-600 hover:bg-indigo-700"
                      onClick={() => router.push('/test')}
                    >
                      {stats.adaptiveTestsCompleted > 0 ? 'Continue' : 'Try Now'}
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Achievements */}
            {recentAchievements.length > 0 && (
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Trophy className="h-5 w-5 text-yellow-500" />
                    Recent Achievements
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {recentAchievements.map(achievement => {
                      const IconComponent = achievement.icon;
                      return (
                        <div
                          key={achievement.id}
                          className="flex items-center space-x-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors"
                        >
                          <div className={`p-2 rounded-full bg-white ${getRarityColor(achievement.rarity)}`}>
                            <IconComponent className="h-4 w-4" />
                          </div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="font-medium text-gray-900">{achievement.title}</p>
                              <Badge className={`text-xs ${getRarityBadgeColor(achievement.rarity)}`}>
                                {achievement.rarity}
                              </Badge>
                            </div>
                            <p className="text-sm text-gray-600">{achievement.description}</p>
                            <p className="text-xs text-gray-500 mt-1">{achievement.earnedAt.toLocaleDateString()}</p>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </CardContent>
              </Card>
            )}
          </div>

          {/* Quick Stats & Insights */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Quick Stats
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Topics Mastered</span>
                  <Badge variant="outline" className="bg-green-50">
                    {stats.completedTopics}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Custom Goals Active</span>
                  <Badge variant="outline" className="bg-purple-50">
                    {stats.customGoalsActive}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Adaptive Tests</span>
                  <Badge variant="outline" className="bg-indigo-50">
                    {stats.adaptiveTestsCompleted}
                  </Badge>
                </div>

                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">This Week</span>
                  <Badge variant="outline" className="bg-orange-50">
                    {formatTime(stats.totalStudyTime)}
                  </Badge>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-600">Best Streak</span>
                  <Badge variant="outline" className="bg-orange-50">
                    {stats.currentStreak} days
                  </Badge>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5" />
                  Study Schedule
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="text-sm">
                  <p className="font-medium text-gray-900">Study Progress</p>
                  <div className="mt-2 space-y-2">
                    {stats.currentStreak > 0 ? (
                      <div className="flex items-center justify-between p-2 bg-orange-50 rounded">
                        <span className="text-orange-700">Current Streak</span>
                        <Badge className="bg-orange-100 text-orange-700">{stats.currentStreak} days</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-700">Start Your Streak</span>
                        <Badge variant="outline">0 days</Badge>
                      </div>
                    )}
                    {stats.totalStudyTime > 0 ? (
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="text-blue-700">Weekly Study Time</span>
                        <Badge className="bg-blue-100 text-blue-700">{formatTime(stats.totalStudyTime)}</Badge>
                      </div>
                    ) : (
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-700">No study time yet</span>
                        <Badge variant="outline">Start today</Badge>
                      </div>
                    )}
                    {stats.customGoalsActive > 0 && (
                      <div className="flex items-center justify-between p-2 bg-purple-50 rounded">
                        <span className="text-purple-700">Active Goals</span>
                        <Badge className="bg-purple-100 text-purple-700">{stats.customGoalsActive}</Badge>
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>

        <div className="mt-8">
          <CourseOverviewCard
            onContinue={() => {
              if (todayRecommendations?.currentTopicId && todayRecommendations?.currentSubjectId) {
                router.push(`/syllabus/${todayRecommendations.currentTopicId}?subject=${todayRecommendations.currentSubjectId}`);
              } else {
                router.push('/syllabus');
              }
            }}
          />
        </div>

      </div>
    </div>
  );
}
