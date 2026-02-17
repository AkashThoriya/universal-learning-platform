'use client';

import { motion } from 'framer-motion';
import { useMemo } from 'react';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';


interface HabitHeatmapProps {
  history: Record<string, number>;
  targetValue: number;
  colorTheme?: 'green' | 'orange' | 'blue';
}

export function HabitHeatmap({ history, targetValue }: HabitHeatmapProps) {
  // Generate last 365 days
  const days = useMemo(() => {
    const result = [];
    const today = new Date();
    for (let i = 364; i >= 0; i--) {
      const d = new Date();
      d.setDate(today.getDate() - i);
      result.push(d);
    }
    return result;
  }, []);

  // Determine color scale based on value
  const getColor = (value: number) => {
    if (value === 0) return 'bg-slate-100 dark:bg-slate-800/50';

    // Intensity based on % of target
    const ratio = Math.min(1, value / targetValue);

    if (ratio < 0.5) return 'bg-orange-200 dark:bg-orange-900/40';
    if (ratio < 1) return 'bg-orange-400 dark:bg-orange-600';
    return 'bg-orange-600 dark:bg-orange-500'; // Met target
  };

  const months = useMemo(() => {
    // Helper to group days into months for labels
    const monthLabels: { label: string; index: number }[] = [];
    let currentMonth = -1;
    days.forEach((day, index) => {
      if (day.getMonth() !== currentMonth) {
        monthLabels.push({
          label: day.toLocaleString('default', { month: 'short' }),
          index
        });
        currentMonth = day.getMonth();
      }
    });
    return monthLabels;
  }, [days]);

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold text-muted-foreground">Past Year Consistency</h3>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          <span>Less</span>
          <div className="flex gap-1">
            <div className="w-2.5 h-2.5 rounded-sm bg-slate-100 dark:bg-slate-800/50" />
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-200 dark:bg-orange-900/40" />
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-400 dark:bg-orange-600" />
            <div className="w-2.5 h-2.5 rounded-sm bg-orange-600 dark:bg-orange-500" />
          </div>
          <span>More</span>
        </div>
      </div>

      <div className="relative overflow-x-auto pb-4 scrollbar-hide">
        {/* Heatmap Container */}
        <div className="min-w-[800px]">
          {/* Month Labels */}
          <div className="flex mb-2 relative h-5 text-xs text-muted-foreground font-medium">
            {months.map((m) => (
              <div
                key={m.label + m.index}
                className="absolute transform -translate-x-1"
                style={{ left: `${(m.index / 365) * 100}%` }}
              >
                {m.label}
              </div>
            ))}
          </div>

          {/* Grid */}
          <div className="grid grid-rows-7 grid-flow-col gap-1 w-full">
            {days.map((day) => {
              const dateKey = day.toLocaleDateString('en-CA');
              const value = history[dateKey] ?? 0;
              const dateStr = day.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

              return (
                <TooltipProvider key={dateKey} delayDuration={50}>
                  <Tooltip>
                    <TooltipTrigger>
                      <motion.div
                        whileHover={{ scale: 1.2, zIndex: 10 }}
                        className={cn(
                          "w-3 h-3 rounded-sm transition-colors border border-transparent hover:border-black/20 dark:hover:border-white/20",
                          getColor(value)
                        )}
                      />
                    </TooltipTrigger>
                    <TooltipContent className="text-xs">
                      <div className="font-semibold">{dateStr}</div>
                      <div>{value} / {targetValue} completed</div>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
