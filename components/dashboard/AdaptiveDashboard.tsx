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
  LucideIcon,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import FloatingActionButton from '@/components/ui/FloatingActionButton';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';
import { cn } from '@/lib/utils';

interface DashboardStats {
  totalStudyTime: number;
  completedSessions: number;
  currentStreak: number;
  weeklyGoalProgress: number;
  activeMissions: number;
  completedTopics: number;
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

export default function AdaptiveDashboard({ className }: AdaptiveDashboardProps) {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudyTime: 0,
    completedSessions: 0,
    currentStreak: 0,
    weeklyGoalProgress: 0,
    activeMissions: 0,
    completedTopics: 0,
  });
  const [recentAchievements, setRecentAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [motivationalMessage, setMotivationalMessage] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');

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
      try {
        // Mock data - replace with actual Firebase calls
        const mockStats: DashboardStats = {
          totalStudyTime: 165,
          completedSessions: 52,
          currentStreak: 8,
          weeklyGoalProgress: 78,
          activeMissions: 4,
          completedTopics: 18,
        };

        const mockAchievements: Achievement[] = [
          {
            id: '1',
            title: 'Week Warrior',
            description: 'Completed 7 consecutive days of study',
            icon: Flame,
            earnedAt: new Date(Date.now() - 2 * 60 * 60 * 1000),
            rarity: 'rare',
          },
          {
            id: '2',
            title: 'First Steps',
            description: 'Completed your first study session',
            icon: Award,
            earnedAt: new Date(Date.now() - 24 * 60 * 60 * 1000),
            rarity: 'common',
          },
        ];

        setStats(mockStats);
        setRecentAchievements(mockAchievements);
        setMotivationalMessage(getMotivationalMessage(timeOfDay, mockStats.currentStreak));
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [timeOfDay]);

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
    .slice(0, 4);

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
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.5 }}
        >
          <Alert className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
            <Trophy className="h-4 w-4 text-yellow-600" />
            <AlertDescription>
              <div className="flex items-center justify-between">
                <div>
                  <strong>New Achievement Unlocked!</strong> {recentAchievements[0].title} 🎉
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => {
                    // TODO: Implement achievement details modal
                    // For now, do nothing instead of console.log
                  }}
                >
                  View All
                </Button>
              </div>
            </AlertDescription>
          </Alert>
        </motion.div>
      )}

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
                <span className="text-sm text-gray-600">This Week</span>
                <Badge variant="outline" className="bg-purple-50">
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
    </div>
  );
}
