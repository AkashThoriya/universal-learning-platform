'use client';

import { motion } from 'framer-motion';
import { Plus, Sparkles } from 'lucide-react';

import { Card, CardContent } from '@/components/ui/card';
import type { HabitDocument } from '@/types/habit';

import { HabitCard } from './HabitCard';

interface HabitGridProps {
  habits: HabitDocument[];
  onToggle: (habitId: string) => void;
  onIncrement: (habitId: string, value: number) => void;
  onDelete?: (habitId: string) => void;
  onAddClick?: () => void;
}

const containerVariants = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.08 },
  },
};

const itemVariants = {
  hidden: { opacity: 0, y: 16, scale: 0.97 },
  show: { opacity: 1, y: 0, scale: 1, transition: { duration: 0.35 } },
};

export function HabitGrid({
  habits,
  onToggle,
  onIncrement,
  onDelete,
  onAddClick,
}: HabitGridProps) {
  const systemHabits = habits.filter((h) => h.type === 'SYSTEM');
  const customHabits = habits.filter((h) => h.type === 'CUSTOM');

  return (
    <div className="space-y-5">
      {/* System Habits Section */}
      {systemHabits.length > 0 && (
        <div>
          <div className="flex items-center gap-1.5 mb-3">
            <Sparkles className="h-3.5 w-3.5 text-blue-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Auto-tracked
            </h3>
            <div className="flex-1 h-px bg-border ml-2" />
          </div>
          <motion.div
            variants={containerVariants}
            initial="hidden"
            animate="show"
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3"
          >
            {systemHabits.map((habit) => (
              <motion.div key={habit.id} variants={itemVariants} className="h-full">
                <HabitCard
                  habit={habit}
                  onToggle={onToggle}
                  onIncrement={onIncrement}
                  {...(onDelete ? { onDelete } : {})}
                />
              </motion.div>
            ))}
          </motion.div>
        </div>
      )}

      {/* Custom Habits Section */}
      <div>
        {customHabits.length > 0 && (
          <div className="flex items-center gap-1.5 mb-3">
            <Plus className="h-3.5 w-3.5 text-purple-500" />
            <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
              Your Habits
            </h3>
            <div className="flex-1 h-px bg-border ml-2" />
          </div>
        )}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {customHabits.map((habit) => (
            <motion.div
              key={habit.id}
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="h-full"
            >
              <HabitCard
                habit={habit}
                onToggle={onToggle}
                onIncrement={onIncrement}
                {...(onDelete ? { onDelete } : {})}
              />
            </motion.div>
          ))}

          {/* Add Habit Card */}
          {onAddClick && (
            <motion.div
              initial={{ opacity: 0, y: 16, scale: 0.97 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              transition={{ duration: 0.35 }}
              className="h-full"
            >
              <button onClick={onAddClick} className="group w-full text-left h-full">
                <Card className="border-dashed border-2 border-muted-foreground/20 hover:border-orange-300/60 dark:hover:border-orange-700/50 transition-all duration-300 h-full min-h-[140px] hover:shadow-md hover:shadow-orange-100/50 dark:hover:shadow-orange-900/10">
                  <CardContent className="flex flex-col items-center justify-center h-full p-4 gap-2.5">
                    <motion.div
                      className="flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 group-hover:from-orange-200 group-hover:to-amber-200 dark:group-hover:from-orange-800/50 dark:group-hover:to-amber-800/50 transition-all duration-300"
                      whileHover={{ scale: 1.1, rotate: 90 }}
                      transition={{ type: 'spring', stiffness: 300 }}
                    >
                      <Plus className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                    </motion.div>
                    <span className="text-sm font-medium text-muted-foreground group-hover:text-orange-600 dark:group-hover:text-orange-400 transition-colors">
                      Add Custom Habit
                    </span>
                  </CardContent>
                </Card>
              </button>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
}
