'use client';

import { eachDayOfInterval, subDays, format, getDay, startOfWeek } from 'date-fns';
import { motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';

interface StudyStreakHeatmapProps {
  /** Sparse history map: "YYYY-MM-DD" → activity value (e.g. topics completed) */
  habitHistory: Record<string, number>;
  /** Target value per day — used to compute activity intensity levels */
  targetValue?: number;
  /** Number of days to show (default 365) */
  days?: number;
  /** Current streak count (pre-computed by habit engine) */
  currentStreak?: number;
  /** Longest streak count (pre-computed by habit engine) */
  longestStreak?: number;
  className?: string;
}

export function StudyStreakHeatmap({
  habitHistory,
  targetValue = 3,
  days = 365,
  currentStreak: externalStreak,
  longestStreak: externalLongest,
  className,
}: StudyStreakHeatmapProps) {
  // 1. Build activity map from habit history
  const activityMap = new Map<string, number>();
  Object.entries(habitHistory).forEach(([dateStr, value]) => {
    activityMap.set(dateStr, value);
  });

  // 2. Generate calendar days
  const today = new Date();
  const startDate = subDays(today, days);
  const calendarStart = startOfWeek(startDate);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: today,
  });

  // 3. Calculate streaks (only if not provided externally)
  let currentStreak = externalStreak ?? 0;
  let longestStreak = externalLongest ?? 0;

  if (externalStreak === undefined) {
    const tempDate = new Date();
    if (activityMap.has(format(tempDate, 'yyyy-MM-dd'))) {
      currentStreak++;
      tempDate.setDate(tempDate.getDate() - 1);
      while (activityMap.has(format(tempDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        tempDate.setDate(tempDate.getDate() - 1);
      }
    } else {
      tempDate.setDate(tempDate.getDate() - 1);
      if (activityMap.has(format(tempDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        tempDate.setDate(tempDate.getDate() - 1);
        while (activityMap.has(format(tempDate, 'yyyy-MM-dd'))) {
          currentStreak++;
          tempDate.setDate(tempDate.getDate() - 1);
        }
      }
    }
  }

  if (externalLongest === undefined) {
    let tempStreak = 0;
    const sortedDates = Object.keys(habitHistory).sort();
    if (sortedDates.length > 0) {
      tempStreak = 1;
      longestStreak = 1;
      for (let i = 1; i < sortedDates.length; i++) {
        const prev = new Date(sortedDates[i - 1]!);
        const curr = new Date(sortedDates[i]!);
        const diffDays = Math.round((curr.getTime() - prev.getTime()) / (1000 * 60 * 60 * 24));
        if (diffDays === 1) {
          tempStreak++;
        } else if (diffDays > 1) {
          tempStreak = 1;
        }
        if (tempStreak > longestStreak) {
          longestStreak = tempStreak;
        }
      }
    }
  }

  // Activity Level Helper — normalize against target
  const getActivityLevel = (value: number) => {
    if (value === 0) return 0;
    const ratio = value / targetValue;
    if (ratio < 0.33) return 1;
    if (ratio < 0.66) return 2;
    if (ratio < 1) return 3;
    return 4; // Met or exceeded target
  };

  const getCellColor = (level: number) => {
    switch (level) {
      case 0:
        return 'bg-gray-100 dark:bg-gray-800';
      case 1:
        return 'bg-green-200';
      case 2:
        return 'bg-green-400';
      case 3:
        return 'bg-green-600';
      case 4:
        return 'bg-green-800';
      default:
        return 'bg-gray-100';
    }
  };

  // Group days by weeks for CSS Grid
  const weeks: Date[][] = [];
  let currentWeek: Date[] = [];

  for (const day of calendarDays) {
    if (getDay(day) === 0 && currentWeek.length > 0) {
      weeks.push(currentWeek);
      currentWeek = [];
    }
    currentWeek.push(day);
  }
  if (currentWeek.length > 0) {
    weeks.push(currentWeek);
  }

  return (
    <Card className={cn('border-none shadow-none bg-transparent', className)}>
      <CardHeader className="px-0 pt-0 pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Flame className="h-5 w-5 text-orange-500" />
            Study Streak
          </CardTitle>
          <div className="flex gap-4 text-sm">
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs uppercase tracking-wider">Current Streak</span>
              <span className="font-bold flex items-center text-orange-600">
                <Flame className="h-3 w-3 mr-1 fill-orange-600" />
                {currentStreak} Days
              </span>
            </div>
            <div className="flex flex-col items-end">
              <span className="text-muted-foreground text-xs uppercase tracking-wider">Longest Streak</span>
              <span className="font-bold flex items-center text-blue-600">
                <Trophy className="h-3 w-3 mr-1" />
                {longestStreak} Days
              </span>
            </div>
          </div>
        </div>
      </CardHeader>

      <CardContent className="px-0">
        <div className="flex overflow-x-auto pb-2 scrollbar-hide">
          <div className="flex gap-1 min-w-full">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-1">
                {week.map((day, dayIndex) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const value = activityMap.get(dateStr) ?? 0;
                  const level = getActivityLevel(value);

                  return (
                    <TooltipProvider key={dateStr}>
                      <Tooltip>
                        <TooltipTrigger>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (weekIndex * 7 + dayIndex) * 0.002 }}
                            className={cn(
                              'w-3 h-3 rounded-sm transition-colors hover:ring-1 hover:ring-offset-1 hover:ring-gray-400',
                              getCellColor(level)
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent>
                          <div className="text-xs">
                            <p className="font-semibold">{format(day, 'MMM do, yyyy')}</p>
                            {value > 0 ? (
                              <p>
                                {value} / {targetValue} completed
                              </p>
                            ) : (
                              <p className="text-muted-foreground">No activity</p>
                            )}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </TooltipProvider>
                  );
                })}
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 mt-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-3 h-3 rounded-sm bg-gray-100 dark:bg-gray-800" />
            <div className="w-3 h-3 rounded-sm bg-green-200" />
            <div className="w-3 h-3 rounded-sm bg-green-400" />
            <div className="w-3 h-3 rounded-sm bg-green-600" />
            <div className="w-3 h-3 rounded-sm bg-green-800" />
          </div>
          <span>More</span>
        </div>
      </CardContent>
    </Card>
  );
}
