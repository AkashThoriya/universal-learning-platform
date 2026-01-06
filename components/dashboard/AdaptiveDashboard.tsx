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
  Map,
  CheckCircle2,
  LucideIcon,
} from 'lucide-react';

import { useEffect, useState } from 'react';

import LearningAnalyticsDashboard from '@/components/analytics/LearningAnalyticsDashboard';
import { WelcomeHeader } from '@/components/dashboard/WelcomeHeader';
import { StatsGrid } from '@/components/dashboard/StatsGrid';
import MobileScrollGrid from '@/components/layout/MobileScrollGrid';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { getExamById } from '@/lib/data/exams-data';
import { customLearningService } from '@/lib/firebase/firebase-services';
import { getUser, getSyllabus, getSyllabusForCourse, updateUser } from '@/lib/firebase/firebase-utils';
import { logError, logInfo, measurePerformance } from '@/lib/utils/logger';
import { progressService } from '@/lib/services/progress-service';
import { adaptiveTestingService } from '@/lib/services/adaptive-testing-service';
import { cn } from '@/lib/utils/utils';
import { useToast } from '@/hooks/use-toast';
import { Exam, SyllabusSubject, SelectedCourse } from '@/types/exam';

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
  // Journey planning stats
  activeJourneys: number;
  journeyCompletion: number;
  journeyMilestones: number;
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

// Helper function to generate today's study recommendations
const generateTodayRecommendations = (
  exam: Exam,
  syllabus: SyllabusSubject[],
  examDaysLeft?: number
): {
  currentTopic?: string;
  currentTopicId?: string;
  currentSubjectId?: string;
  nextAction?: string;
  studyGoal?: string;
  examDaysLeft?: number;
  subjectRecommendation?: string;
  todaysPlan?: string[];
} => {
  // Find the next topic to study (first incomplete topic)
  let currentTopic = '';
  let currentTopicId = '';
  let currentSubjectId = '';
  let nextAction = '';
  let subjectRecommendation = '';
  const todaysPlan: string[] = [];

  if (syllabus.length > 0) {
    // Find first subject with incomplete topics
    for (const subject of syllabus) {
      if (subject.topics && subject.topics.length > 0) {
        const incompleteTopic = subject.topics.find(_topic => {
          // Check if topic is not completed (this would depend on your progress tracking)
          return true; // For now, assume all topics need work
        });

        if (incompleteTopic) {
          currentTopic = `${subject.name} - ${incompleteTopic.name}`;
          currentTopicId = incompleteTopic.id;
          currentSubjectId = subject.id;
          subjectRecommendation = subject.name;
          todaysPlan.push(`📚 Study ${incompleteTopic.name}`);
          todaysPlan.push(`⏱️ Target: ${incompleteTopic.estimatedHours ?? 2} hours`);
          break;
        }
      }
    }
  }

  // Generate action based on day and exam timeline
  if (examDaysLeft !== undefined) {
    if (examDaysLeft <= 7) {
      nextAction = 'Take a practice test';
    } else if (examDaysLeft <= 30) {
      nextAction = 'Review and practice questions';
    } else {
      nextAction = 'Study new topics';
    }
  } else {
    nextAction = 'Continue your learning journey';
  }

  // Generate study goal
  let studyGoal = '';
  if (examDaysLeft !== undefined) {
    if (examDaysLeft <= 7) {
      studyGoal = 'Focus on revision and mock tests';
    } else if (examDaysLeft <= 30) {
      studyGoal = 'Complete topic review and practice';
    } else {
      studyGoal = 'Master fundamental concepts';
    }
  } else {
    studyGoal = 'Build strong foundations';
  }

  // Add general plan items
  if (todaysPlan.length === 0) {
    todaysPlan.push('📚 Choose a topic to study');
    todaysPlan.push('⏱️ Target: 2 hours focused study');
  }
  todaysPlan.push('🧪 Take practice test');
  todaysPlan.push('📝 Review weak areas');

  return {
    currentTopic: currentTopic || `Start with ${exam.name} basics`,
    ...(currentTopicId ? { currentTopicId } : {}),
    ...(currentSubjectId ? { currentSubjectId } : {}),
    nextAction,
    studyGoal,
    subjectRecommendation: subjectRecommendation || 'Choose a subject to begin',
    todaysPlan,
    ...(examDaysLeft !== undefined ? { examDaysLeft } : {}),
  };
};

export default function AdaptiveDashboard({ className }: AdaptiveDashboardProps) {
  const { user } = useAuth();
  const { toast } = useToast();




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
    activeJourneys: 0,
    journeyCompletion: 0,
    journeyMilestones: 0,
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
              activeJourneys: 0,
              journeyCompletion: 0,
              journeyMilestones: 0,
            });
            setRecentAchievements([]);

            setIsLoading(false);
            return;
          }

          // Fetch real user data including profile and exam info
          const [progressResult, activeJourneysResult, userProfile, userTests] = await Promise.all([
            progressService.getUserProgress(user.uid),
            // journeyService.getActiveJourneys(user.uid), // Using placeholder for now
            Promise.resolve({ success: true, data: [] }), // Placeholder for journeys
            getUser(user.uid),
            adaptiveTestingService.getUserTests(user.uid),
          ]);

          // Load selected exam information
          // Load selected exam information
          const currentExamId = userProfile?.selectedExamId || '';
          setActiveCourseId(currentExamId);

          // Populate available courses
          if (userProfile?.selectedCourses && userProfile.selectedCourses.length > 0) {
            setAvailableCourses(userProfile.selectedCourses);
          } else if (currentExamId) {
             // Fallback for legacy
             const exam = getExamById(currentExamId);
             if (exam) {
                setAvailableCourses([{
                   examId: currentExamId,
                   examName: exam.name,
                   targetDate: userProfile?.examDate || new Date(),
                   priority: 1
                } as any]);
             }
          }

          if (currentExamId) {
            const exam = getExamById(currentExamId);
            if (exam) {
              setSelectedExam(exam);

              // Calculate exam countdown
              const examDate = userProfile?.selectedCourses?.find(c => c.examId === currentExamId)?.targetDate || userProfile?.examDate;
              const examDaysLeft = examDate
                ? Math.max(0, Math.ceil((((examDate as any).toDate ? (examDate as any).toDate() : new Date(examDate as any)).getTime() - Date.now()) / (1000 * 60 * 60 * 24)))
                : undefined;

              // Generate today's recommendations
              try {
                // Try course-specific syllabus first, fall back to global
                let syllabus = await getSyllabusForCourse(user.uid, currentExamId);
                if (!syllabus || syllabus.length === 0) {
                   syllabus = await getSyllabus(user.uid);
                }
                
                const todayRecs = generateTodayRecommendations(exam, syllabus, examDaysLeft);
                setTodayRecommendations(todayRecs);
              } catch (error) {
                logError('Failed to load syllabus for recommendations', { error });
                setTodayRecommendations({
                  nextAction: 'Review your syllabus',
                  studyGoal: 'Plan your study schedule',
                  ...(examDaysLeft !== undefined && { examDaysLeft }),
                });
              }
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
            activeJourneys: 0,
            journeyCompletion: 0,
            journeyMilestones: 0,
          };

          if (progressResult.success && progressResult.data) {
            const progress = progressResult.data;
            realStats = {
              totalStudyTime: Math.round(progress.overallProgress.totalTimeInvested / 60), // Convert minutes to hours
              completedSessions: progress.overallProgress.totalMissionsCompleted,
              currentStreak: progress.overallProgress.currentStreak,
              weeklyGoalProgress: Math.min(progress.overallProgress.consistencyRating, 100),
              completedTopics:
                progress.trackProgress.exam.masteredSkills.length +
                progress.trackProgress.course_tech.masteredSkills.length,
              customGoalsActive: 0,
              customGoalsCompleted: 0,
              customLearningHours: Math.round(
                (progress.trackProgress.exam.timeInvested + progress.trackProgress.course_tech.timeInvested) / 60
              ),
              adaptiveTestsCompleted: userTests.filter(t => t.status === 'completed').length,
              adaptiveTestsAverage: userTests.filter(t => t.status === 'completed').length > 0
                ? userTests.filter(t => t.status === 'completed').reduce((sum, t) => sum + (t.performance?.accuracy || 0), 0) / userTests.filter(t => t.status === 'completed').length
                : 0,
              adaptiveTestsTotal: userTests.length,
              activeJourneys: (progress as any).linkedJourneys?.length ?? 0,
              journeyCompletion: Math.round(
                (progress as any).journeyProgress
                  ? Object.values((progress as any).journeyProgress).reduce(
                      (acc: number, jp: any) => acc + (jp.overallCompletion || 0),
                      0
                    ) / Object.keys((progress as any).journeyProgress).length
                  : 0
              ),
              journeyMilestones: (progress as any).journeyProgress
                ? Object.values((progress as any).journeyProgress).reduce(
                    (acc: number, jp: any) => acc + (jp.milestoneCount || 0),
                    0
                  )
                : 0,
            };
          }

          // Add active journeys count
          if (activeJourneysResult.success && activeJourneysResult.data) {
            realStats.activeJourneys = activeJourneysResult.data.length;
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

          // Load custom goals data for stats (display removed but stats still tracked)
          const customGoalsResult = await customLearningService.getUserCustomGoals(user.uid);
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
            activeJourneys: 0,
            journeyCompletion: 0,
            journeyMilestones: 0,
          };
          setStats(fallbackStats);
          setRecentAchievements([]);

        } finally {
          setIsLoading(false);
        }
      });
    };

    loadDashboardData();
  }, [timeOfDay, user?.uid]);

  const handleCourseSwitch = async (courseId: string) => {
    if (!user || switchingCourse || courseId === activeCourseId) return;
    
    try {
      setSwitchingCourse(true);
      
      // Update Firebase
      await updateUser(user.uid, { selectedExamId: courseId });
      
      // Update local state
      setActiveCourseId(courseId);
      
      // Load new exam data
      const exam = getExamById(courseId);
      if (exam) {
        setSelectedExam(exam);
        
        // Load syllabus for new course
        let syllabus = await getSyllabusForCourse(user.uid, courseId);
        if (!syllabus || syllabus.length === 0) {
          syllabus = await getSyllabus(user.uid);
        }
        
        // Find target date for the course
        const courseData = availableCourses.find(c => c.examId === courseId);
        const examDaysLeft = courseData?.targetDate
          ? Math.max(0, Math.ceil((
              ((courseData.targetDate as any).toDate 
                ? (courseData.targetDate as any).toDate() 
                : new Date(courseData.targetDate as any)
              ).getTime() - Date.now()
            ) / (1000 * 60 * 60 * 24)))
          : undefined;
        
        // Generate new recommendations
        const todayRecs = generateTodayRecommendations(exam, syllabus, examDaysLeft);
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
    return (
      <div className={cn('space-y-6', className)}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/3" />
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded-lg" />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg" />
            <div className="h-96 bg-gray-200 rounded-lg" />
          </div>
        </div>
      </div>
    );
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
                            {course.examName}
                         </SelectItem>
                      ))}
                   </SelectContent>
                </Select>
             </div>
           ) : (
             <div/> 
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
                  onClick={() => (window.location.href = `/syllabus/${todayRecommendations.currentTopicId}?subject=${todayRecommendations.currentSubjectId}`)}
                  className="bg-green-600 hover:bg-green-700 gap-2 w-full sm:w-auto"
                >
                  <PlayCircle className="h-4 w-4" />
                  Resume
                </Button>
              </CardContent>
            </Card>
          </motion.div>
        )}

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
              <h2 className="text-xl font-semibold text-indigo-900 mb-2">📚 Currently preparing for {selectedExam.name}</h2>
              <p className="text-indigo-700 mb-2 line-clamp-2">{selectedExam.description}</p>
              <Badge variant="outline" className="text-indigo-600 border-indigo-300">
                {selectedExam.category}
              </Badge>
            </div>
            {todayRecommendations.examDaysLeft !== undefined && (
              <div className="flex items-center md:flex-col md:items-end gap-2 md:gap-0 md:text-right shrink-0">
                <div className="text-2xl font-bold text-indigo-900 leading-tight">{todayRecommendations.examDaysLeft}</div>
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
                      onClick={() => (window.location.href = `/syllabus/${todayRecommendations.currentTopicId}?subject=${todayRecommendations.currentSubjectId}`)}
                    >
                      Log Progress
                    </Button>
                  )}
                </div>
                <p className="text-sm text-gray-900">{todayRecommendations.currentTopic}</p>
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
              onClick={() => (window.location.href = '/syllabus')}
              className="bg-white/60 hover:bg-white/80 flex-1 min-w-[120px] h-10"
            >
              <BookOpen className="h-4 w-4 mr-2" />
              View Syllabus
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/test')}
              className="bg-white/60 hover:bg-white/80 flex-1 min-w-[120px] h-10"
            >
              <Brain className="h-4 w-4 mr-2" />
              Take Test
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={() => (window.location.href = '/journey')}
              className="bg-white/60 hover:bg-white/80 flex-1 min-w-[120px] h-10"
            >
              <Map className="h-4 w-4 mr-2" />
              Plan Journey
            </Button>
          </div>
        </motion.div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full min-h-[80vh]">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
          <TabsTrigger value="analytics">Learning Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Original Dashboard Content */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Enhanced Stats / New User Welcome */}
          {stats.completedSessions === 0 ? (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
            >
              <Card className="border-blue-200 bg-gradient-to-r from-blue-50 via-indigo-50 to-purple-50">
                <CardHeader>
                  <CardTitle className="flex items-center gap-2 text-blue-900">
                    <Flame className="h-5 w-5 text-orange-500" />
                    🚀 Get Started with Your Learning Journey
                  </CardTitle>
                  <CardDescription className="text-blue-700">
                    Complete these steps to build your personalized study plan
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className={`flex items-center gap-3 p-3 rounded-lg ${selectedExam ? 'bg-green-50 border border-green-200' : 'bg-white border border-gray-200'}`}>
                    {selectedExam ? (
                      <CheckCircle2 className="h-5 w-5 text-green-600" />
                    ) : (
                      <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    )}
                    <span className={`font-medium ${selectedExam ? 'text-green-800' : 'text-gray-700'}`}>
                      Select a course
                    </span>
                    {selectedExam && <Badge variant="secondary" className="ml-auto">{selectedExam.name}</Badge>}
                  </div>
                  
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => window.location.href = '/syllabus'}
                  >
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    <span className="font-medium text-gray-700">Explore your syllabus</span>
                    <Button size="sm" variant="ghost" className="ml-auto text-blue-600">
                      Start
                    </Button>
                  </div>
                  
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => window.location.href = '/test'}
                  >
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    <span className="font-medium text-gray-700">Take your first practice test</span>
                    <Button size="sm" variant="ghost" className="ml-auto text-blue-600">
                      Start
                    </Button>
                  </div>
                  
                  <div 
                    className="flex items-center gap-3 p-3 rounded-lg bg-white border border-gray-200 cursor-pointer hover:bg-gray-50 transition-colors"
                    onClick={() => window.location.href = '/journey'}
                  >
                    <div className="h-5 w-5 rounded-full border-2 border-gray-300" />
                    <span className="font-medium text-gray-700">Create a learning journey</span>
                    <Button size="sm" variant="ghost" className="ml-auto text-blue-600">
                      Start
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ) : (
            <StatsGrid stats={stats} />
          )}

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
                  {stats.activeJourneys > 0 ? (
                    <div className="p-3 sm:p-4 rounded-lg bg-purple-50 border border-purple-200">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <h4 className="font-medium text-purple-900">Active Journeys</h4>
                          <p className="text-sm text-purple-700 mt-1">
                            You have {stats.activeJourneys} active journey{stats.activeJourneys > 1 ? 's' : ''} in
                            progress
                          </p>
                          <p className="text-xs text-purple-600 mt-2">Continue your personalized learning path</p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-purple-600 hover:bg-purple-700"
                          onClick={() => (window.location.href = '/journey')}
                        >
                          View Journeys
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="p-3 sm:p-4 rounded-lg bg-blue-50 border border-blue-200">
                      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-3">
                        <div>
                          <h4 className="font-medium text-blue-900">Plan Your Journey</h4>
                          <p className="text-sm text-blue-700 mt-1">Create a personalized learning path</p>
                          <p className="text-xs text-blue-600 mt-2">
                            Design journeys tailored to your learning goals and schedule
                          </p>
                        </div>
                        <Button
                          size="sm"
                          className="bg-blue-600 hover:bg-blue-700"
                          onClick={() => (window.location.href = '/journey')}
                        >
                          Create Journey
                        </Button>
                      </div>
                    </div>
                  )}

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
                          onClick={() => (window.location.href = '/test')}
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
                          onClick={() => (window.location.href = '/syllabus')}
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
                          onClick={() => (window.location.href = '/syllabus')}
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
                        onClick={() => (window.location.href = '/test')}
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
                    <span className="text-sm text-gray-600">Active Missions</span>
                    <Badge variant="outline" className="bg-blue-50">
                      {stats.activeJourneys}
                    </Badge>
                  </div>
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
                    <span className="text-sm text-gray-600">Active Journeys</span>
                    <Badge variant="outline" className="bg-emerald-50">
                      {stats.activeJourneys}
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Journey Progress</span>
                    <Badge variant="outline" className="bg-teal-50">
                      {stats.journeyCompletion}%
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
                      {Math.max(stats.currentStreak, 12)} days
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

        </TabsContent>

        {/* Analytics Tab - Learning Analytics Dashboard */}
        <TabsContent value="analytics" className="mt-6">
          <LearningAnalyticsDashboard />
        </TabsContent>
      </Tabs>
    </div>
  );
}
