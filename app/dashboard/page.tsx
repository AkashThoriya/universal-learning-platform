'use client';

import { 
  BarChart3, 
  BookOpen, 
  Target, 
  TrendingUp, 
  Clock,
  CheckCircle,
  Zap,
  Trophy,
  Activity,
  BookMarked,
  Flame,
  Star
} from 'lucide-react';
import { useEffect, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/contexts/AuthContext';

interface QuickAction {
  title: string;
  description: string;
  icon: React.ComponentType<any>;
  href: string;
  color: string;
  badge?: string;
}

interface DashboardStats {
  totalStudyTime: number;
  completedSessions: number;
  currentStreak: number;
  weeklyGoalProgress: number;
  activeMissions: number;
  completedTopics: number;
}

interface RecentActivity {
  id: string;
  type: 'session' | 'mission' | 'achievement';
  title: string;
  timestamp: Date;
  details: string;
}

export default function Dashboard() {
  const { user } = useAuth();
  const [stats, setStats] = useState<DashboardStats>({
    totalStudyTime: 0,
    completedSessions: 0,
    currentStreak: 0,
    weeklyGoalProgress: 0,
    activeMissions: 0,
    completedTopics: 0
  });
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading dashboard data
    const loadDashboardData = async () => {
      try {
        // Mock data - replace with actual Firebase calls
        const mockStats: DashboardStats = {
          totalStudyTime: 125,
          completedSessions: 47,
          currentStreak: 7,
          weeklyGoalProgress: 68,
          activeMissions: 3,
          completedTopics: 12
        };

        const mockActivity: RecentActivity[] = [
          {
            id: '1',
            type: 'session',
            title: 'Banking Awareness - Current Affairs',
            timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000),
            details: 'Completed 15-minute session'
          },
          {
            id: '2',
            type: 'achievement',
            title: 'Week Warrior Achievement',
            timestamp: new Date(Date.now() - 4 * 60 * 60 * 1000),
            details: '7-day study streak completed'
          },
          {
            id: '3',
            type: 'mission',
            title: 'Quantitative Aptitude Mission',
            timestamp: new Date(Date.now() - 6 * 60 * 60 * 1000),
            details: 'Progress: 80% complete'
          }
        ];

        setStats(mockStats);
        setRecentActivity(mockActivity);
      } catch (error) {
        console.error('Error loading dashboard data:', error);
      } finally {
        setIsLoading(false);
      }
    };

    loadDashboardData();
  }, [user]);

  const quickActions: QuickAction[] = [
    {
      title: 'Start Quick Session',
      description: 'Begin a 15-minute focused study session',
      icon: Zap,
      href: '/micro-learning?auto=true',
      color: 'from-yellow-500 to-orange-500',
      badge: 'Popular'
    },
    {
      title: 'View Analytics',
      description: 'Check your performance insights',
      icon: BarChart3,
      href: '/analytics',
      color: 'from-blue-500 to-indigo-500',
      badge: 'New'
    },
    {
      title: 'Browse Topics',
      description: 'Explore study materials and syllabus',
      icon: BookOpen,
      href: '/syllabus',
      color: 'from-green-500 to-emerald-500'
    },
    {
      title: 'Daily Missions',
      description: 'Complete today\'s learning goals',
      icon: Target,
      href: '/missions',
      color: 'from-purple-500 to-pink-500',
      badge: '3'
    }
  ];

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  const getActivityIcon = (type: string) => {
    switch (type) {
      case 'session': return BookMarked;
      case 'mission': return Target;
      case 'achievement': return Trophy;
      default: return Activity;
    }
  };

  const getActivityColor = (type: string) => {
    switch (type) {
      case 'session': return 'text-blue-600';
      case 'mission': return 'text-purple-600';
      case 'achievement': return 'text-yellow-600';
      default: return 'text-gray-600';
    }
  };

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <div className="max-w-7xl mx-auto p-6">
            <div className="space-y-6">
              <div className="animate-pulse space-y-4">
                <div className="h-8 bg-gray-200 rounded w-1/3"></div>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                  {[...Array(4)].map((_, i) => (
                    <div key={i} className="h-32 bg-gray-200 rounded-lg"></div>
                  ))}
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                  <div className="lg:col-span-2 h-96 bg-gray-200 rounded-lg"></div>
                  <div className="h-96 bg-gray-200 rounded-lg"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Welcome Header */}
          <div className="text-center lg:text-left">
            <h1 className="text-3xl lg:text-4xl font-bold text-gray-900">
              Welcome back, {user?.displayName?.split(' ')[0] || 'Strategist'}! 👋
            </h1>
            <p className="text-muted-foreground mt-2">
              Ready to continue your exam preparation journey? Let's make today count.
            </p>
          </div>

          {/* Stats Overview */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Study Time</CardTitle>
                <Clock className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{formatTime(stats.totalStudyTime)}</div>
                <p className="text-xs opacity-80 mt-1">This week</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Sessions</CardTitle>
                <CheckCircle className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.completedSessions}</div>
                <p className="text-xs opacity-80 mt-1">Completed</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Streak</CardTitle>
                <Flame className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.currentStreak} days</div>
                <p className="text-xs opacity-80 mt-1">Keep it up!</p>
              </CardContent>
            </Card>

            <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
              <CardHeader className="flex flex-row items-center justify-between pb-2">
                <CardTitle className="text-sm font-medium opacity-90">Weekly Goal</CardTitle>
                <Target className="h-4 w-4 opacity-80" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{stats.weeklyGoalProgress}%</div>
                <Progress value={stats.weeklyGoalProgress} className="mt-2 bg-white/20" />
              </CardContent>
            </Card>
          </div>

          {/* Quick Actions */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">Quick Actions</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {quickActions.map((action, index) => {
                const IconComponent = action.icon;
                return (
                  <Card key={index} className="group hover:shadow-lg transition-all duration-200 cursor-pointer">
                    <CardHeader className="pb-3">
                      <div className="flex items-center justify-between">
                        <div className={`p-2 rounded-lg bg-gradient-to-r ${action.color} text-white`}>
                          <IconComponent className="h-5 w-5" />
                        </div>
                        {action.badge && (
                          <Badge variant="secondary" className="text-xs">
                            {action.badge}
                          </Badge>
                        )}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <h3 className="font-semibold text-gray-900 group-hover:text-blue-600 transition-colors">
                        {action.title}
                      </h3>
                      <p className="text-sm text-muted-foreground mt-1">
                        {action.description}
                      </p>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="w-full mt-3 group-hover:bg-blue-50 group-hover:border-blue-200"
                        onClick={() => window.location.href = action.href}
                      >
                        Get Started
                      </Button>
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          </div>

          {/* Main Content Grid */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Recent Activity */}
            <div className="lg:col-span-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Activity className="h-5 w-5" />
                    Recent Activity
                  </CardTitle>
                  <CardDescription>
                    Your latest study sessions and achievements
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {recentActivity.length > 0 ? (
                    <div className="space-y-4">
                      {recentActivity.map((activity) => {
                        const IconComponent = getActivityIcon(activity.type);
                        return (
                          <div key={activity.id} className="flex items-start gap-3 p-3 rounded-lg bg-gray-50 hover:bg-gray-100 transition-colors">
                            <div className={`p-2 rounded-full bg-white ${getActivityColor(activity.type)}`}>
                              <IconComponent className="h-4 w-4" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <p className="font-medium text-gray-900">{activity.title}</p>
                              <p className="text-sm text-muted-foreground">{activity.details}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {activity.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <Activity className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
                      <p className="text-muted-foreground">No recent activity</p>
                      <Button variant="outline" size="sm" className="mt-2">
                        Start Your First Session
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>

            {/* Today's Focus */}
            <div className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Star className="h-5 w-5" />
                    Today's Focus
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="p-3 rounded-lg bg-blue-50 border border-blue-200">
                    <h4 className="font-medium text-blue-900">Recommended Topic</h4>
                    <p className="text-sm text-blue-700 mt-1">Banking Awareness - Current Affairs</p>
                    <Button size="sm" className="mt-2 bg-blue-600 hover:bg-blue-700">
                      Start Session
                    </Button>
                  </div>
                  <div className="p-3 rounded-lg bg-purple-50 border border-purple-200">
                    <h4 className="font-medium text-purple-900">Active Mission</h4>
                    <p className="text-sm text-purple-700 mt-1">Complete 3 Quantitative sessions</p>
                    <div className="mt-2">
                      <Progress value={67} className="bg-purple-200" />
                      <p className="text-xs text-purple-600 mt-1">2 of 3 completed</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <TrendingUp className="h-5 w-5" />
                    Quick Stats
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Active Missions</span>
                    <Badge variant="outline">{stats.activeMissions}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">Topics Mastered</span>
                    <Badge variant="outline">{stats.completedTopics}</Badge>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-muted-foreground">This Week</span>
                    <Badge variant="outline">{formatTime(stats.totalStudyTime)}</Badge>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* Motivational Alert */}
          <Alert className="bg-gradient-to-r from-green-50 to-blue-50 border-green-200">
            <Trophy className="h-4 w-4 text-green-600" />
            <AlertDescription>
              <strong>Great progress!</strong> You're on a {stats.currentStreak}-day streak. 
              Keep up the momentum and reach your weekly goal of 10 hours!
            </AlertDescription>
          </Alert>
        </div>
      </div>
    </AuthGuard>
  );
}
