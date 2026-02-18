'use client';

import { motion } from 'framer-motion';
import { Clock, CheckCircle, Flame, Target } from 'lucide-react';

import MobileScrollGrid from '@/components/layout/MobileScrollGrid';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/utils';

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

  const cardClass = 'min-w-[85vw] sm:min-w-[300px] md:min-w-0 snap-center transition-transform active:scale-[0.98]';

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
      <MobileScrollGrid className="md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className={cn('bg-white border-blue-100 shadow-sm hover:shadow-md hover:border-blue-200 transition-all group', cardClass)}>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-blue-50 text-blue-600 group-hover:bg-blue-600 group-hover:text-white transition-colors">
                <Clock className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2 py-1 rounded-full">
                This Week
              </span>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">{formatTime(stats.totalStudyTime)}</div>
              <p className="text-sm text-gray-500 font-medium">Total Study Time</p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn('bg-white border-green-100 shadow-sm hover:shadow-md hover:border-green-200 transition-all group', cardClass)}>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-green-50 text-green-600 group-hover:bg-green-600 group-hover:text-white transition-colors">
                <CheckCircle className="h-5 w-5" />
              </div>
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">{stats.completedSessions}</div>
              <p className="text-sm text-gray-500 font-medium">Completed Sessions</p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn('bg-white border-orange-100 shadow-sm hover:shadow-md hover:border-orange-200 transition-all group', cardClass)}>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-orange-50 text-orange-600 group-hover:bg-orange-600 group-hover:text-white transition-colors">
                <Flame className="h-5 w-5" />
              </div>
              {stats.currentStreak > 3 && (
                <span className="text-xs font-semibold text-orange-600 bg-orange-50 px-2 py-1 rounded-full flex items-center gap-1">
                  🔥 On Fire
                </span>
              )}
            </div>
            <div>
              <div className="text-2xl font-bold text-gray-900 tracking-tight">{stats.currentStreak} <span className="text-lg text-gray-400 font-normal">days</span></div>
              <p className="text-sm text-gray-500 font-medium">Current Streak</p>
            </div>
          </CardContent>
        </Card>

        <Card className={cn('bg-white border-purple-100 shadow-sm hover:shadow-md hover:border-purple-200 transition-all group', cardClass)}>
          <CardContent className="p-6 flex flex-col justify-between h-full">
            <div className="flex justify-between items-start mb-4">
              <div className="p-2.5 rounded-xl bg-purple-50 text-purple-600 group-hover:bg-purple-600 group-hover:text-white transition-colors">
                <Target className="h-5 w-5" />
              </div>
              <span className="text-xs font-semibold text-purple-600 bg-purple-50 px-2 py-1 rounded-full">
                {stats.weeklyGoalProgress}%
              </span>
            </div>
            <div>
              <Progress value={stats.weeklyGoalProgress} className="h-2 bg-purple-100 mb-2" indicatorClassName="bg-purple-600" />
              <p className="text-sm text-gray-500 font-medium">Weekly Goal</p>
            </div>
          </CardContent>
        </Card>
      </MobileScrollGrid>
    </motion.div>
  );
}
