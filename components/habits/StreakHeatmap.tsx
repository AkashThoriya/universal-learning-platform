'use client';

import { eachDayOfInterval, subDays, format, getDay, startOfWeek, startOfMonth, isSameMonth } from 'date-fns';
import { motion } from 'framer-motion';
import { useState, useEffect } from 'react';

import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';

interface StreakHeatmapProps {
  /** Sparse history map: "YYYY-MM-DD" → value */
  history: Record<string, number>;
  /** Target value per day (for computing intensity) */
  targetValue?: number;
  /** Number of days to show (default 90) */
  days?: number;
  className?: string;
}

export function StreakHeatmap({
  history,
  targetValue = 3,
  days = 90,
  className,
}: StreakHeatmapProps) {
  const [daysToShow, setDaysToShow] = useState(days);

  useEffect(() => {
    const handleResize = () => {
      // Show more days on larger screens (approx 10 months total: 5 months back + 5 months forward)
      if (window.innerWidth >= 1024) {
        setDaysToShow(150); // Desktop: ~10 months
      } else if (window.innerWidth >= 768) {
        setDaysToShow(90);  // Tablet: ~6 months
      } else {
        setDaysToShow(60);  // Mobile: ~4 months (NO SCROLLBAR)
      }
    };

    // Initial check
    handleResize();

    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []); // Empty dependency array to run only on mount

  const today = new Date();
  // Range: Start from `daysToShow` ago, End at `daysToShow` in future
  const startDate = subDays(today, daysToShow);
  const endDate = new Date(today);
  endDate.setDate(today.getDate() + daysToShow); // Add future days

  const calendarStart = startOfWeek(startDate);
  // We need to ensure we cover the full range including future
  // But we want the grid to be responsive.
  // Let's just generate the interval.
  const calendarDays = eachDayOfInterval({
    start: calendarStart,
    end: endDate,
  });

  const getActivityLevel = (value: number) => {
    if (value === 0) return 0;
    const ratio = value / targetValue;
    if (ratio < 0.33) return 1;
    if (ratio < 0.66) return 2;
    if (ratio < 1) return 3;
    return 4;
  };

  const getCellColor = (level: number) => {
    switch (level) {
      case 0: return 'bg-slate-100 dark:bg-slate-800/60';
      case 1: return 'bg-emerald-200 dark:bg-emerald-900/60';
      case 2: return 'bg-emerald-400 dark:bg-emerald-700/80';
      case 3: return 'bg-emerald-500 dark:bg-emerald-500';
      case 4: return 'bg-emerald-600 dark:bg-emerald-400';
      default: return 'bg-slate-100';
    }
  };

  // Group by weeks
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

  // Calculate month labels
  const monthLabels: { label: string; weekIndex: number }[] = [];
  let lastMonth = -1;
  weeks.forEach((week, weekIndex) => {
    const firstDay = week[0];
    if (!firstDay) return;
    const monthStart = startOfMonth(firstDay);
    if (isSameMonth(firstDay, monthStart) && firstDay.getMonth() !== lastMonth) {
      lastMonth = firstDay.getMonth();
      monthLabels.push({ label: format(firstDay, 'MMM'), weekIndex });
    }
  });

  // Total activity count
  const totalActiveDays = Object.values(history).filter((v) => v > 0).length;

  return (
    <div className={cn('space-y-2', className)}>
      {/* Stat line */}
      <div className="flex items-center justify-between text-[11px] text-muted-foreground">
        <span>
          <span className="font-semibold text-foreground">{totalActiveDays}</span> active days in the last {daysToShow} days
        </span>
      </div>

      <div className="flex overflow-x-auto pb-1 scrollbar-hide">
        <div className="flex flex-col">
          {/* Month labels */}
          <div className="flex gap-[3px] mb-1" style={{ paddingLeft: '0px' }}>
            {weeks.map((_, weekIndex) => {
              const label = monthLabels.find((m) => m.weekIndex === weekIndex);
              return (
                <div
                  key={weekIndex}
                  className="w-[12px] text-[9px] text-muted-foreground text-center leading-none"
                >
                  {label ? label.label : ''}
                </div>
              );
            })}
          </div>

          {/* Heatmap grid */}
          <div className="flex gap-[3px]">
            {weeks.map((week, weekIndex) => (
              <div key={weekIndex} className="flex flex-col gap-[3px]">
                {week.map((day, dayIndex) => {
                  const dateStr = format(day, 'yyyy-MM-dd');
                  const value = history[dateStr] ?? 0;
                  const level = getActivityLevel(value);
                  const isToday = dateStr === format(today, 'yyyy-MM-dd');

                  return (
                    <TooltipProvider key={dateStr} delayDuration={100}>
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <motion.div
                            initial={{ opacity: 0, scale: 0.5 }}
                            animate={{ opacity: 1, scale: 1 }}
                            transition={{ delay: (weekIndex * 7 + dayIndex) * 0.002 }}
                            className={cn(
                              'w-[12px] h-[12px] rounded-[2px] transition-all duration-200 cursor-pointer',
                              'hover:ring-2 hover:ring-offset-1 hover:ring-emerald-400/50 hover:scale-125',
                              getCellColor(level),
                              isToday && 'ring-1 ring-orange-400 ring-offset-1'
                            )}
                          />
                        </TooltipTrigger>
                        <TooltipContent side="top" className="py-1.5 px-2.5">
                          <div className="text-xs space-y-0.5">
                            <p className="font-semibold">{format(day, 'EEE, MMM do')}</p>
                            {value > 0 ? (
                              <p className="text-emerald-600 dark:text-emerald-400">
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
      </div>

      {/* Legend */}
      <div className="flex items-center justify-end gap-1.5 text-[11px] text-muted-foreground">
        <span>Less</span>
        <div className="flex gap-[3px]">
          {[0, 1, 2, 3, 4].map((level) => (
            <div
              key={level}
              className={cn('w-[12px] h-[12px] rounded-[2px]', getCellColor(level))}
            />
          ))}
        </div>
        <span>More</span>
      </div>
    </div>
  );
}
