'use client';

import { motion } from 'framer-motion';
import { Flame, Target, TrendingUp, ArrowRight } from 'lucide-react';
import Link from 'next/link';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';
import type { HabitStats } from '@/types/habit';

interface HabitDashboardWidgetProps {
  stats: HabitStats;
  loading?: boolean;
  className?: string;
}

function MiniProgressRing({
  progress,
  size = 20,
  strokeWidth = 2.5,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-muted/20"
      />
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        className="text-orange-500 transition-all duration-1000 ease-out"
      />
    </svg>
  );
}

export function HabitDashboardWidget({ stats, loading, className }: HabitDashboardWidgetProps) {
  if (loading) {
    return (
      <Card className={cn('animate-pulse', className)}>
        <CardContent className="p-4">
          <div className="h-24 bg-muted/50 rounded-xl" />
        </CardContent>
      </Card>
    );
  }

  const completionPercent =
    stats.totalHabits > 0
      ? Math.round((stats.completedToday / stats.totalHabits) * 100)
      : 0;

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
    >
      <Link href="/habits">
        <Card
          className={cn(
            'group hover:shadow-lg transition-all duration-300 cursor-pointer border hover:border-orange-300 dark:hover:border-orange-800 relative overflow-hidden',
            className
          )}
        >
          {/* Subtle gradient background on hover */}
          <div className="absolute inset-0 bg-gradient-to-br from-orange-50/0 via-orange-50/0 to-amber-50/0 group-hover:from-orange-50/50 group-hover:via-amber-50/30 group-hover:to-transparent dark:group-hover:from-orange-950/20 dark:group-hover:via-amber-950/10 transition-colors duration-500" />

          <CardHeader className="pb-2 pt-4 px-4 relative">
            <CardTitle className="text-sm font-semibold flex items-center justify-between">
              <span className="flex items-center gap-2">
                <div className="p-1.5 rounded-md bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
                  <Flame className="h-4 w-4" />
                </div>
                Habits
              </span>
              <ArrowRight className="h-4 w-4 text-muted-foreground group-hover:text-orange-500 group-hover:translate-x-0.5 transition-all" />
            </CardTitle>
          </CardHeader>

          <CardContent className="px-4 pb-4 space-y-4 relative">
            {/* Progress Section */}
            <div>
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Daily Goal</span>
                <span className="font-medium text-foreground flex items-center gap-1.5">
                  {completionPercent}%
                  <MiniProgressRing progress={completionPercent} />
                </span>
              </div>

              {/* Custom segmented progress bar */}
              <div className="h-1.5 w-full bg-muted/30 rounded-full overflow-hidden flex gap-0.5">
                {Array.from({ length: Math.max(stats.totalHabits, 1) }).map((_, i) => (
                  <div
                    key={i}
                    className={cn(
                      "h-full flex-1 rounded-full transition-all duration-500",
                      i < stats.completedToday
                        ? "bg-gradient-to-r from-orange-500 to-amber-500"
                        : "bg-muted"
                    )}
                  />
                ))}
              </div>
            </div>

            {/* Stats Row */}
            <div className="grid grid-cols-3 gap-2">
              <div className="rounded-lg bg-slate-50 dark:bg-slate-900/50 p-2 text-center group-hover:bg-white dark:group-hover:bg-slate-800 transition-colors border border-transparent group-hover:border-slate-100 dark:group-hover:border-slate-700">
                <div className="flex justify-center mb-1">
                  <Target className="h-3.5 w-3.5 text-blue-500" />
                </div>
                <p className="text-sm font-bold text-foreground">{stats.totalHabits}</p>
                <p className="text-[10px] text-muted-foreground">Active</p>
              </div>

              <div className="rounded-lg bg-orange-50/50 dark:bg-orange-900/20 p-2 text-center group-hover:bg-orange-50 dark:group-hover:bg-orange-900/30 transition-colors border border-transparent group-hover:border-orange-100 dark:group-hover:border-orange-800/50">
                <div className="flex justify-center mb-1">
                  <Flame className="h-3.5 w-3.5 text-orange-500" />
                </div>
                <p className="text-sm font-bold text-foreground">{stats.longestActiveStreak}</p>
                <p className="text-[10px] text-muted-foreground">Streak</p>
              </div>

              <div className="rounded-lg bg-emerald-50/50 dark:bg-emerald-900/20 p-2 text-center group-hover:bg-emerald-50 dark:group-hover:bg-emerald-900/30 transition-colors border border-transparent group-hover:border-emerald-100 dark:group-hover:border-emerald-800/50">
                <div className="flex justify-center mb-1">
                  <TrendingUp className="h-3.5 w-3.5 text-emerald-500" />
                </div>
                <p className="text-sm font-bold text-foreground">{stats.overallCompletionRate}%</p>
                <p className="text-[10px] text-muted-foreground">Rate</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </Link>
    </motion.div>
  );
}
