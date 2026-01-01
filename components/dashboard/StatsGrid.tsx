'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle, Flame, Target } from 'lucide-react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

interface DashboardStats {
  totalStudyTime: number;
  completedSessions: number;
  currentStreak: number;
  weeklyGoalProgress: number;
}

interface StatsGridProps {
  stats: DashboardStats;
}

export function StatsGrid({ stats }: StatsGridProps) {
  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const remainingMinutes = minutes % 60;
    return hours > 0 ? `${hours}h ${remainingMinutes}m` : `${remainingMinutes}m`;
  };

  return (
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
  );
}
