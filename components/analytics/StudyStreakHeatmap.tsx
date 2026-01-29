'use client';

import { eachDayOfInterval, subDays, format, getDay, startOfWeek } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { motion } from 'framer-motion';
import { Flame, Trophy } from 'lucide-react';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
import { DailyLog } from '@/types/exam';

interface StudyStreakHeatmapProps {
  logs: DailyLog[];
  days?: number;
  className?: string;
}

export function StudyStreakHeatmap({ logs, days = 365, className }: StudyStreakHeatmapProps) {
  // 1. Process data into a map for fast lookup
  const activityMap = new Map<string, DailyLog>();

  logs.forEach(log => {
    if (log.date) {
      const dateStr = format(log.date instanceof Timestamp ? log.date.toDate() : new Date(log.date), 'yyyy-MM-dd');
      activityMap.set(dateStr, log);
    }
  });

  // 2. Generate calendar days
  const today = new Date();
  const startDate = subDays(today, days);
  // Align start date to Sunday for proper grid alignment
  const calendarStart = startOfWeek(startDate);

  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: today,
  });

  // 3. Calculate stats
  // Current Streak
  let currentStreak = 0;
  const tempDate = new Date();

  // Check today
  if (activityMap.has(format(tempDate, 'yyyy-MM-dd'))) {
    currentStreak++;
    tempDate.setDate(tempDate.getDate() - 1);

    // Check previous days
    while (activityMap.has(format(tempDate, 'yyyy-MM-dd'))) {
      currentStreak++;
      tempDate.setDate(tempDate.getDate() - 1);
    }
  } else {
    // Check if yesterday was active (streak might be intact but today not done yet)
    tempDate.setDate(tempDate.getDate() - 1);
    if (activityMap.has(format(tempDate, 'yyyy-MM-dd'))) {
      currentStreak++; // Yesterday counts
      tempDate.setDate(tempDate.getDate() - 1);
      while (activityMap.has(format(tempDate, 'yyyy-MM-dd'))) {
        currentStreak++;
        tempDate.setDate(tempDate.getDate() - 1);
      }
    }
  }

  // Longest Streak (Simple approximation for now, optimized for recent data)
  let longestStreak = 0;
  let tempStreak = 0;
  // Sort logs by date asc
  const sortedLogs = [...logs].sort((a, b) => {
    const da = a.date instanceof Timestamp ? a.date.toDate().getTime() : new Date(a.date).getTime();
    const db = b.date instanceof Timestamp ? b.date.toDate().getTime() : new Date(b.date).getTime();
    return da - db;
  });

  if (sortedLogs.length > 0) {
    tempStreak = 1;
    longestStreak = 1;
    for (let i = 1; i < sortedLogs.length; i++) {
      const prevLog = sortedLogs[i - 1];
      const currLog = sortedLogs[i];

      if (!prevLog || !currLog) {
        continue;
      }

      const prev = prevLog.date instanceof Timestamp ? prevLog.date.toDate() : new Date(prevLog.date);
      const curr = currLog.date instanceof Timestamp ? currLog.date.toDate() : new Date(currLog.date);

      const diffTime = Math.abs(curr.getTime() - prev.getTime());
      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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

  // Activity Level Helper
  const getActivityLevel = (minutes: number) => {
    if (minutes === 0) {
      return 0;
    }
    if (minutes < 30) {
      return 1;
    } // Light
    if (minutes < 60) {
      return 2;
    } // Medium
    if (minutes < 120) {
      return 3;
    } // High
    return 4; // Intense
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
  const weeks = [];
  let currentWeek = [];

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
                  const log = activityMap.get(dateStr);
                  const minutes = log?.goals?.actualMinutes || 0;
                  const level = log ? getActivityLevel(minutes) : 0;

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
                            {log ? (
                              <>
                                <p>{minutes} mins studied</p>
                                <p className="text-muted-foreground">{log.studiedTopics?.length || 0} topics</p>
                              </>
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
