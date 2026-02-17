'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen,
  Brain,
  Star,
  Flame,
  Check,
  Plus,
  Minus,
  Lock,
  Sparkles,
  MoreVertical,
  Trash2,
  Pencil,
  type LucideIcon,
} from 'lucide-react';
import { useMemo, useState, useEffect, useRef } from 'react';
import confetti from 'canvas-confetti';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { cn } from '@/lib/utils/utils';
import type { HabitDocument } from '@/types/habit';

// Icon mapping for habits
const ICON_MAP: Record<string, LucideIcon> = {
  BookOpen,
  Brain,
  Star,
  Flame,
  Check,
  Sparkles,
};

interface HabitCardProps {
  habit: HabitDocument;
  onToggle: (habitId: string) => void;
  onIncrement: (habitId: string, value: number) => void;
  onDelete?: (habitId: string) => void;
  onEdit?: (habit: HabitDocument) => void;
}

/** Circular progress ring component */
function ProgressRing({
  progress,
  size = 44,
  strokeWidth = 3.5,
  isComplete,
}: {
  progress: number;
  size?: number;
  strokeWidth?: number;
  isComplete: boolean;
}) {
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;
  const offset = circumference - (progress / 100) * circumference;

  return (
    <svg width={size} height={size} className="transform -rotate-90">
      {/* Background ring */}
      <circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="currentColor"
        strokeWidth={strokeWidth}
        className="text-slate-200 dark:text-slate-700"
      />
      {/* Progress ring */}
      <motion.circle
        cx={size / 2}
        cy={size / 2}
        r={radius}
        fill="none"
        stroke="url(#progressGradient)"
        strokeWidth={strokeWidth}
        strokeLinecap="round"
        strokeDasharray={circumference}
        initial={{ strokeDashoffset: circumference }}
        animate={{ strokeDashoffset: offset }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
      />
      <defs>
        <linearGradient id="progressGradient" x1="0%" y1="0%" x2="100%" y2="0%">
          <stop offset="0%" stopColor={isComplete ? '#22c55e' : '#f59e0b'} />
          <stop offset="100%" stopColor={isComplete ? '#10b981' : '#f97316'} />
        </linearGradient>
      </defs>
    </svg>
  );
}

function SegmentedProgress({
  current,
  target,
  isComplete,
}: {
  current: number;
  target: number;
  isComplete: boolean;
}) {
  // Cap visual segments at 7 to avoid clutter
  const visualTarget = Math.min(target, 7);
  const segments = Array.from({ length: visualTarget });

  return (
    <div className="flex gap-1 h-1.5 w-full max-w-[80px]">
      {segments.map((_, i) => {
        const isActive = i < current;
        return (
          <motion.div
            key={i}
            initial={{ opacity: 0, scaleY: 0 }}
            animate={{ opacity: 1, scaleY: 1 }}
            transition={{ delay: i * 0.1 }}
            className={cn(
              "flex-1 rounded-full transition-colors duration-300",
              isActive
                ? (isComplete ? "bg-green-500" : "bg-orange-500")
                : "bg-slate-200 dark:bg-slate-700"
            )}
          />
        )
      })}
    </div>
  );
}

export function HabitCard({ habit, onToggle, onIncrement, onDelete, onEdit }: HabitCardProps) {
  const IconComponent = ICON_MAP[habit.icon ?? 'Star'] ?? Star;

  // Safety check: ensure targetValue is valid to prevent division by zero or NaN
  const target = Math.max(1, habit.targetValue || 1);
  const current = Math.max(0, habit.currentValue || 0);

  const progressPercent = useMemo(
    () => Math.min(100, Math.round((current / target) * 100)),
    [current, target]
  );

  const [deleteAlertOpen, setDeleteAlertOpen] = useState(false);
  const prevCompletedRef = useRef(habit.isCompletedToday);

  // Trigger confetti on completion
  useEffect(() => {
    if (!prevCompletedRef.current && habit.isCompletedToday) {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7 },
        colors: ['#22c55e', '#f97316', '#eab308'],
        disableForReducedMotion: true,
      });
    }
    prevCompletedRef.current = habit.isCompletedToday;
  }, [habit.isCompletedToday]);

  const streakMessage = useMemo(() => {
    if ((habit.currentStreak || 0) >= 30) return '🏆 Legendary!';
    if ((habit.currentStreak || 0) >= 14) return '⚡ Unstoppable!';
    if ((habit.currentStreak || 0) >= 7) return '🔥 On fire!';
    if ((habit.currentStreak || 0) >= 3) return '💪 Keep going!';
    return null;
  }, [habit.currentStreak]);

  return (
    <>
      <div className="h-full">
        <Card
          className={cn(
            'relative overflow-hidden transition-all duration-300 border group h-full flex flex-col', // h-full and flex-col for equal height
            habit.isCompletedToday
              ? 'border-green-300 bg-gradient-to-br from-green-50 via-emerald-50/50 to-teal-50/30 dark:border-green-800 dark:bg-gradient-to-br dark:from-green-950/40 dark:via-emerald-950/20 dark:to-teal-950/10 shadow-sm shadow-green-200/50 dark:shadow-green-900/20'
              : 'border-border hover:border-orange-200/60 dark:hover:border-orange-800/40 hover:shadow-md'
          )}
        >
          {/* Completion glow line */}
          <AnimatePresence>
            {habit.isCompletedToday && (
              <motion.div
                initial={{ scaleX: 0 }}
                animate={{ scaleX: 1 }}
                exit={{ scaleX: 0 }}
                className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-green-400 via-emerald-400 to-teal-400 origin-left"
              />
            )}
          </AnimatePresence>

          {/* Settings Menu (Custom Habits Only) */}
          {habit.type === 'CUSTOM' && (onDelete || onEdit) && (
            <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity z-20">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-6 w-6 rounded-full hover:bg-black/5 dark:hover:bg-white/10">
                    <MoreVertical className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-32">
                  <DropdownMenuItem onClick={() => onEdit?.(habit)}>
                    <Pencil className="mr-2 h-3.5 w-3.5" />
                    <span>Edit</span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50 dark:focus:bg-red-900/20"
                    onClick={() => setDeleteAlertOpen(true)}
                  >
                    <Trash2 className="mr-2 h-3.5 w-3.5" />
                    <span>Delete</span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          )}

          <CardContent className="p-4 flex-1 flex flex-col justify-between">
            {/* Header Row */}
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {/* Progress Visualization */}
                <div className="relative shrink-0 flex flex-col items-center justify-center gap-1">
                  {/* 
                    Use Segmented Bar for COUNT metric if target <= 7 (to be readable) 
                    Otherwise fallback to Ring
                 */}
                  {habit.metricType === 'COUNT' && habit.targetValue <= 7 ? (
                    <div className="flex items-center justify-center w-[44px] h-[44px] rounded-full bg-slate-100 dark:bg-slate-800/50">
                      <IconComponent
                        className={cn(
                          'h-5 w-5',
                          habit.isCompletedToday
                            ? 'text-green-600 dark:text-green-400'
                            : 'text-slate-500 dark:text-slate-400'
                        )}
                      />
                    </div>
                  ) : (
                    <div className="relative">
                      <ProgressRing
                        progress={progressPercent}
                        isComplete={habit.isCompletedToday}
                      />
                      <div className="absolute inset-0 flex items-center justify-center">
                        <IconComponent
                          className={cn(
                            'h-4 w-4',
                            habit.isCompletedToday
                              ? 'text-green-600 dark:text-green-400'
                              : 'text-slate-500 dark:text-slate-400'
                          )}
                        />
                      </div>
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <h3 className="font-semibold text-sm leading-tight truncate pr-6">
                    {habit.title}
                  </h3>
                  {habit.description && (
                    <p className="text-xs text-muted-foreground truncate mt-0.5 pr-4">
                      {habit.description}
                    </p>
                  )}

                  {/* Metric Display */}
                  <div className="mt-1.5">
                    {habit.metricType === 'COUNT' && habit.targetValue <= 7 ? (
                      <SegmentedProgress
                        current={habit.currentValue}
                        target={habit.targetValue}
                        isComplete={habit.isCompletedToday}
                      />
                    ) : (
                      <p className="text-[11px] text-muted-foreground">
                        {habit.currentValue} / {habit.targetValue}
                        {habit.metricType === 'DURATION' ? ' min' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Streak Badge (Only show if not Custom with Menu or if menu is hidden, simplified layout: absolute or push left? 
                Actually the menu is absolute top-right. The badge is in the flex flow. 
                They might overlap if title is long? No, Badge is in Header Row flex.
                Let's keep Badge as is.
             */}
              {habit.currentStreak > 0 && (
                <motion.div
                  initial={{ scale: 0 }}
                  animate={{ scale: 1 }}
                  transition={{ type: 'spring', stiffness: 500, damping: 25 }}
                  className={cn(
                    "transition-opacity duration-200",
                    habit.type === 'CUSTOM' && onDelete && "group-hover:opacity-0"
                  )}
                >
                  <Badge
                    variant="secondary"
                    className={cn(
                      'shrink-0 text-xs font-bold border-0 gap-0.5',
                      habit.currentStreak >= 7
                        ? 'bg-gradient-to-r from-orange-100 to-amber-100 text-orange-700 dark:from-orange-900/50 dark:to-amber-900/50 dark:text-orange-300'
                        : 'bg-orange-100 text-orange-700 dark:bg-orange-900/50 dark:text-orange-300'
                    )}
                  >
                    <motion.span
                      animate={habit.currentStreak >= 3 ? { scale: [1, 1.2, 1] } : {}}
                      transition={{ repeat: Infinity, duration: 2 }}
                    >
                      <Flame className="h-3 w-3 fill-orange-500" />
                    </motion.span>
                    {habit.currentStreak}d
                  </Badge>
                </motion.div>
              )}
            </div>

            {/* Action Row */}
            <div className="flex items-center justify-between mt-3">
              {/* ... (Keep existing Action Row logic) ... */}
              {habit.type === 'SYSTEM' ? (
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Badge variant="outline" className="text-[11px] text-muted-foreground gap-1 cursor-help hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
                        <Lock className="h-3 w-3" />
                        Auto-tracked
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent side="bottom" className="max-w-[220px] text-xs">
                      <p>
                        This habit tracks automatically based on your activity.
                        {habit.linkedEventId === 'TOPIC_COMPLETED' && ' Completing syllabus topics updates this.'}
                        {habit.linkedEventId === 'TEST_COMPLETED' && ' Finishing adaptive tests updates this.'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              ) : habit.metricType === 'BOOLEAN' ? (
                <Button
                  size="sm"
                  variant={habit.isCompletedToday ? 'default' : 'outline'}
                  className={cn(
                    'h-8 text-xs gap-1 transition-all w-full sm:w-auto',
                    habit.isCompletedToday
                      ? 'bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 shadow-sm shadow-green-300/30 dark:shadow-green-900/30'
                      : 'hover:bg-orange-50 hover:border-orange-300 hover:text-orange-700 dark:hover:bg-orange-950/30'
                  )}
                  onClick={() => onToggle(habit.id)}
                >
                  <Check className="h-3.5 w-3.5" />
                  {habit.isCompletedToday ? 'Done!' : 'Mark Done'}
                </Button>
              ) : (
                <div className="flex items-center gap-1.5 w-full">
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-full hover:bg-red-50 hover:border-red-200 hover:text-red-600 dark:hover:bg-red-950/30"
                    onClick={() => onIncrement(habit.id, -1)}
                    disabled={habit.currentValue === 0}
                  >
                    <Minus className="h-3.5 w-3.5" />
                  </Button>
                  <div className="flex-1 text-center text-xs font-medium text-muted-foreground">
                    {habit.currentValue} / {habit.targetValue}
                  </div>
                  <Button
                    size="icon"
                    variant="outline"
                    className="h-8 w-8 rounded-full hover:bg-green-50 hover:border-green-200 hover:text-green-600 dark:hover:bg-green-950/30"
                    onClick={() => onIncrement(habit.id, 1)}
                  >
                    <Plus className="h-3.5 w-3.5" />
                  </Button>
                </div>
              )}

              {/* Completion indicator / streak message */}
              <AnimatePresence mode="wait">
                {habit.isCompletedToday && (
                  <motion.div
                    key="complete"
                    initial={{ opacity: 0, x: 10 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -10 }}
                    className="flex items-center gap-1 text-xs font-medium text-green-600 dark:text-green-400 ml-auto pl-2"
                  >
                    {streakMessage ? (
                      <span>{streakMessage}</span>
                    ) : (
                      <>
                        <Check className="h-3.5 w-3.5" />
                        <span>Complete</span>
                      </>
                    )}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>
      </div>

      <AlertDialog open={deleteAlertOpen} onOpenChange={setDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this habit?</AlertDialogTitle>
            <AlertDialogDescription>
              This will permanently remove "{habit.title}" and all its history. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => onDelete?.(habit.id)}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
