'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  BookOpen,
  Target,
  TrendingUp,
  Clock,
  CheckCircle,
  Zap,
  Trophy,
  Flame,
  Star,
  Calendar,
  Award,
  PlayCircle,
  Users,
  Sparkles,
  Plus,
  Brain,
  Map,
  LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import LearningAnalyticsDashboard from '@/components/analytics/LearningAnalyticsDashboard';
import { Alert } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { customLearningService, missionFirebaseService } from '@/lib/firebase-services';
import { logError, logInfo, measurePerformance } from '@/lib/logger';
import { progressService } from '@/lib/progress-service';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalStudyTime: number;
  completedSessions: number;
  currentStreak: number;
  weeklyGoalProgress: number;
  activeMissions: number;
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

interface QuickAction {
  title: string;
  description: string;
  icon: LucideIcon;
  href: string;
  color: string;
  badge?: string;
  priority: 'high' | 'medium' | 'low';
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

// Custom Goal Card Component
interface CustomGoalCardProps {
  goal: {
    id: string;
    title: string;
    description?: string;
    category: string;
    progress: number;
    targetValue: number;
    createdAt: Date;
    dueDate?: Date;
    status: 'active' | 'completed' | 'paused';
  };
}

function CustomGoalCard({ goal }: CustomGoalCardProps) {
  const progressPercentage = Math.min((goal.progress / goal.targetValue) * 100, 100);

  return (
    <Card className="hover:shadow-lg transition-all duration-300">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold text-gray-900">{goal.title}</CardTitle>
          <Badge variant={goal.status === 'completed' ? 'default' : 'secondary'} className="text-xs">
            {goal.status}
          </Badge>
        </div>
        {goal.description && <CardDescription className="text-sm text-gray-600">{goal.description}</CardDescription>}
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          <div className="flex justify-between items-center text-sm">
            <span className="text-gray-600">Progress</span>
            <span className="font-medium">
              {goal.progress} / {goal.targetValue}
            </span>
          </div>
          <Progress value={progressPercentage} className="h-2" />
          <div className="flex justify-between items-center text-xs text-gray-500">
            <span>Category: {goal.category}</span>
            <span>{progressPercentage.toFixed(0)}%</span>
          </div>
          {goal.dueDate && <div className="text-xs text-gray-500">Due: {goal.dueDate.toLocaleDateString()}</div>}
        </div>
      </CardContent>
    </Card>
  );
}

export default function AdaptiveDashboard({ className }: AdaptiveDashboardProps) {
  const { user } = useAuth();

  logInfo('AdaptiveDashboard component initialized', {
    userId: user?.uid ?? 'no-user',
    timestamp: new Date().toISOString(),
  });

  const [stats, setStats] = useState<DashboardStats>({
    totalStudyTime: 0,
    completedSessions: 0,
    currentStreak: 0,
    weeklyGoalProgress: 0,
    activeMissions: 0,
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
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [customGoals, setCustomGoals] = useState<any[]>([]);

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
              activeMissions: 0,
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
            setMotivationalMessage(getMotivationalMessage(timeOfDay, 0));
            setIsLoading(false);
            return;
          }

          // Fetch real user data
          const [progressResult, activeMissionsResult] = await Promise.all([
            progressService.getUserProgress(user.uid),
            missionFirebaseService.getActiveMissions(user.uid),
          ]);

          // Process progress data
          let realStats: DashboardStats = {
            totalStudyTime: 0,
            completedSessions: 0,
            currentStreak: 0,
            weeklyGoalProgress: 0,
            activeMissions: 0,
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
              activeMissions: 0,
              completedTopics:
                progress.trackProgress.exam.masteredSkills.length +
                progress.trackProgress.course_tech.masteredSkills.length,
              customGoalsActive: 0,
              customGoalsCompleted: 0,
              customLearningHours: Math.round(
                (progress.trackProgress.exam.timeInvested + progress.trackProgress.course_tech.timeInvested) / 60
              ),
              adaptiveTestsCompleted: (progress.overallProgress as any).adaptiveTestingLevel || 0,
              adaptiveTestsAverage: 0, // Will be loaded from adaptive testing service
              adaptiveTestsTotal: 0, // Will be loaded from adaptive testing service
              activeJourneys: (progress as any).linkedJourneys?.length || 0,
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

          // Add active missions count
          if (activeMissionsResult.success && activeMissionsResult.data) {
            realStats.activeMissions = activeMissionsResult.data.length;
          }

          // Setup achievements based on real data
          const mockAchievements: Achievement[] = [];

          // Only show achievements if user has meaningful progress
          // Week Warrior: requires 7+ consecutive days
          if (realStats.currentStreak >= 7) {
            mockAchievements.push({
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
            mockAchievements.push({
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
            mockAchievements.push({
              id: 'study_champion',
              title: 'Study Champion',
              description: 'Completed 10 study sessions',
              icon: Trophy,
              earnedAt: new Date(Date.now() - 12 * 60 * 60 * 1000),
              rarity: 'epic',
            });
          }

          // Only show the most recent achievement to avoid spam
          const recentAchievements = mockAchievements.slice(-1);

          // Load custom goals if user is authenticated
          const customGoalsResult = await customLearningService.getUserCustomGoals(user.uid);
          if (customGoalsResult.success) {
            setCustomGoals(customGoalsResult.data);

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
          setRecentAchievements(recentAchievements);
          setMotivationalMessage(getMotivationalMessage(timeOfDay, realStats.currentStreak));

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
            activeMissions: 0,
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
          setMotivationalMessage(getMotivationalMessage(timeOfDay, 0));
        } finally {
          setIsLoading(false);
        }
      });
    };

    loadDashboardData();
  }, [timeOfDay, user?.uid]);

  const getMotivationalMessage = (timeOfDay: string, streak: number): string => {
    const messages = {
      morning: [
        `Good morning! Ready to make day ${streak + 1} count? ☀️`,
        'Morning champion! Your brain is fresh and ready to learn! 🧠',
        'Rise and shine! Another day of progress awaits! 🌅',
      ],
      afternoon: [
        `Afternoon power session time! You're on a ${streak}-day streak! 🔥`,
        'Perfect time for a focused study session! 📚',
        "Afternoon energy boost - let's keep the momentum going! ⚡",
      ],
      evening: [
        `Evening reflection time! You've maintained a ${streak}-day streak! 🌟`,
        'Wind down with some light review - every bit counts! 🌙',
        'Evening learning session - the best way to end your day! 🌆',
      ],
      night: [
        'Night owl studying? Make sure to get enough rest too! 🦉',
        "Late-night sessions can be productive - just don't overdo it! 🌃",
        'Burning the midnight oil? Remember, consistency beats intensity! 💡',
      ],
    };

    const timeMessages = messages[timeOfDay as keyof typeof messages] ?? messages.morning;
    return timeMessages[Math.floor(Math.random() * timeMessages.length)] ?? 'Ready to continue your learning journey!';
  };

  const quickActions: QuickAction[] = [
    {
      title: 'Continue Learning',
      description: 'Resume your last study session',
      icon: PlayCircle,
      href: '/micro-learning?resume=true',
      color: 'from-green-500 to-emerald-500',
      badge: 'Continue',
      priority: 'high',
    },
    {
      title: 'Quick Session',
      description: 'Start a 15-minute focused session',
      icon: Zap,
      href: '/micro-learning?auto=true',
      color: 'from-yellow-500 to-orange-500',
      badge: 'Popular',
      priority: 'high',
    },
    {
      title: 'View Analytics',
      description: 'Check your performance insights',
      icon: BarChart3,
      href: '/analytics',
      color: 'from-blue-500 to-indigo-500',
      badge: 'New',
      priority: 'medium',
    },
    {
      title: 'Daily Missions',
      description: "Complete today's learning goals",
      icon: Target,
      href: '/missions',
      color: 'from-purple-500 to-pink-500',
      badge: stats.activeMissions.toString(),
      priority: 'high',
    },
    {
      title: 'Adaptive Testing',
      description: 'Take personalized assessments',
      icon: Brain,
      href: '/test',
      color: 'from-indigo-500 to-purple-500',
      badge: stats.adaptiveTestsCompleted > 0 ? 'Available' : 'New',
      priority: 'high',
    },
    {
      title: 'Journey Planning',
      description: 'Plan your learning path',
      icon: Map,
      href: '/journey',
      color: 'from-emerald-500 to-teal-500',
      badge: stats.activeJourneys > 0 ? `${stats.activeJourneys} Active` : 'Create',
      priority: 'high',
    },
    {
      title: 'Study Materials',
      description: 'Browse topics and syllabus',
      icon: BookOpen,
      href: '/syllabus',
      color: 'from-indigo-500 to-purple-500',
      priority: 'medium',
    },
    {
      title: 'Join Study Group',
      description: 'Connect with fellow learners',
      icon: Users,
      href: '/community',
      color: 'from-pink-500 to-rose-500',
      badge: 'Beta',
      priority: 'low',
    },
  ];

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

  const prioritizedActions = quickActions
    .sort((a, b) => {
      const priorityWeight = { high: 3, medium: 2, low: 1 };
      return priorityWeight[b.priority] - priorityWeight[a.priority];
    })
    .slice(0, 6); // Show more actions to include adaptive testing

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
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center lg:text-left">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
          Welcome back, {user?.displayName?.split(' ')[0] ?? 'Champion'}! 👋
        </h1>
        <p className="text-lg text-gray-600">{motivationalMessage}</p>
      </motion.div>

      {/* Celebration Alert for Achievements */}
      {recentAchievements.length > 0 && recentAchievements[0] && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', damping: 15 }}
        >
          <Alert className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border-2 border-yellow-300 shadow-lg relative overflow-hidden">
            {/* Animated background sparkles */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 left-4 text-yellow-400 animate-pulse">✨</div>
              <div className="absolute top-6 right-6 text-orange-400 animate-pulse delay-200">⭐</div>
              <div className="absolute bottom-3 left-8 text-yellow-500 animate-pulse delay-500">🎉</div>
              <div className="absolute bottom-2 right-12 text-orange-500 animate-pulse delay-700">🏆</div>
            </div>

            <div className="relative z-10">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-md">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      🎉 Achievement Unlocked!
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-800 hover:bg-white/50"
                      onClick={() => setRecentAchievements([])}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const IconComponent = recentAchievements[0].icon;
                        return <IconComponent className="h-5 w-5 text-orange-600" />;
                      })()}
                      <span className="font-semibold text-gray-900">{recentAchievements[0].title}</span>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${
                        recentAchievements[0].rarity === 'legendary'
                          ? 'bg-purple-100 text-purple-800'
                          : recentAchievements[0].rarity === 'epic'
                            ? 'bg-red-100 text-red-800'
                            : recentAchievements[0].rarity === 'rare'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-gray-100 text-gray-800'
                      }`}
                    >
                      {recentAchievements[0].rarity}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{recentAchievements[0].description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Earned {recentAchievements[0].earnedAt.toLocaleDateString()} at{' '}
                      {recentAchievements[0].earnedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/80 hover:bg-white border-orange-200 text-orange-700 hover:text-orange-800"
                      onClick={() => {
                        // TODO: Navigate to achievements page or show modal
                        setRecentAchievements([]);
                      }}
                    >
                      View All Achievements
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Alert>
        </motion.div>
      )}

      {/* Main Dashboard Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">Dashboard Overview</TabsTrigger>
          <TabsTrigger value="analytics">Learning Analytics</TabsTrigger>
        </TabsList>

        {/* Overview Tab - Original Dashboard Content */}
        <TabsContent value="overview" className="space-y-6 mt-6">
          {/* Enhanced Stats Overview */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          >
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Study Time</CardTitle>
                <Clock className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTime(stats.totalStudyTime)}</div>
                <p className="text-xs opacity-80 mt-1">This week</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Sessions</CardTitle>
                <CheckCircle className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedSessions}</div>
                <p className="text-xs opacity-80 mt-1">Completed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Streak</CardTitle>
                <Flame className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.currentStreak} days</div>
                <p className="text-xs opacity-80 mt-1">Keep it burning! 🔥</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white overflow-hidden relative">
              <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 rounded-full -mr-10 -mt-10" />
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Weekly Goal</CardTitle>
                <Target className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weeklyGoalProgress}%</div>
                <Progress value={stats.weeklyGoalProgress} className="mt-2 bg-white/20" />
              </CardContent>
            </Card>
          </motion.div>

          {/* Custom Learning Goals */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
            className="mb-8"
          >
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <Target className="h-5 w-5 mr-2 text-blue-500" />
              Custom Learning Goals
            </h2>
            {customGoals.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {customGoals.map(goal => (
                  <CustomGoalCard key={goal.id} goal={goal} />
                ))}
              </div>
            ) : (
              <Card>
                <CardContent className="text-center py-8">
                  <div className="text-gray-500 mb-4">
                    <BookOpen className="h-12 w-12 mx-auto mb-2" />
                    <p>No custom learning goals yet</p>
                    <p className="text-sm">Create your first goal to start learning something new!</p>
                  </div>
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Learning Goal
                  </Button>
                </CardContent>
              </Card>
            )}
          </motion.div>

          {/* Priority Actions */}
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4 flex items-center">
              <Sparkles className="h-5 w-5 mr-2 text-yellow-500" />
              Recommended Actions
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {prioritizedActions.map((action, index) => {
                const IconComponent = action.icon;
                const ANIMATION_DELAY_INCREMENT = 0.1;
                return (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: ANIMATION_DELAY_INCREMENT * index }}
                  >
                    <Card className="group hover:shadow-lg transition-all duration-300 cursor-pointer hover:scale-105">
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} text-white`}>
                            <IconComponent className="h-5 w-5" />
                          </div>
                          {action.badge && (
                            <Badge variant={action.priority === 'high' ? 'default' : 'secondary'} className="text-xs">
                              {action.badge}
                            </Badge>
                          )}
                        </div>
                      </CardHeader>
                      <CardContent>
                        <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                          {action.title}
                        </h3>
                        <p className="text-sm text-gray-600 mt-1">{action.description}</p>
                        <Button
                          variant="outline"
                          size="sm"
                          className="w-full mt-3 group-hover:bg-blue-50 group-hover:border-blue-200"
                          onClick={() => (window.location.href = action.href)}
                        >
                          {action.priority === 'high' ? 'Start Now' : 'Explore'}
                        </Button>
                      </CardContent>
                    </Card>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

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
                  <div className="p-4 rounded-lg bg-blue-50 border border-blue-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-blue-900">Recommended Topic</h4>
                        <p className="text-sm text-blue-700 mt-1">Quantitative Aptitude - Number Series</p>
                        <p className="text-xs text-blue-600 mt-2">
                          Based on your recent performance, this topic needs attention
                        </p>
                      </div>
                      <Button size="sm" className="bg-blue-600 hover:bg-blue-700">
                        Start Session
                      </Button>
                    </div>
                  </div>

                  <div className="p-4 rounded-lg bg-purple-50 border border-purple-200">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-purple-900">Active Mission</h4>
                        <p className="text-sm text-purple-700 mt-1">Complete 5 Reasoning sessions this week</p>
                        <div className="mt-2">
                          <Progress value={80} className="bg-purple-200" />
                          <p className="text-xs text-purple-600 mt-1">4 of 5 completed</p>
                        </div>
                      </div>
                    </div>
                  </div>

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
                            ? `${stats.adaptiveTestsCompleted} tests completed • Average: ${stats.adaptiveTestsAverage.toFixed(1)}%`
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
                      {stats.activeMissions}
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
                    <p className="font-medium text-gray-900">Today's Schedule</p>
                    <div className="mt-2 space-y-2">
                      <div className="flex items-center justify-between p-2 bg-green-50 rounded">
                        <span className="text-green-700">Morning Session</span>
                        <Badge className="bg-green-100 text-green-700">✓ Done</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-blue-50 rounded">
                        <span className="text-blue-700">Afternoon Review</span>
                        <Badge className="bg-blue-100 text-blue-700">Next</Badge>
                      </div>
                      <div className="flex items-center justify-between p-2 bg-gray-50 rounded">
                        <span className="text-gray-600">Evening Practice</span>
                        <Badge variant="outline">Pending</Badge>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Mobile FAB for quick actions */}
          <div className="lg:hidden">
            <FloatingActionButton />
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
