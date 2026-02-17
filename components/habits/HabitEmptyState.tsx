'use client';

import { motion } from 'framer-motion';
import { Sparkles, Plus } from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';

interface HabitEmptyStateProps {
  onAddClick: () => void;
}

export function HabitEmptyState({ onAddClick }: HabitEmptyStateProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
      className="max-w-md mx-auto"
    >
      <Card className="border-dashed border-2 border-muted-foreground/20 bg-muted/5">
        <CardContent className="flex flex-col items-center justify-center p-8 text-center space-y-4">
          <div className="relative">
            <div className="absolute inset-0 bg-orange-100 dark:bg-orange-900/30 blur-xl rounded-full opacity-50" />
            <div className="relative flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/50 dark:to-amber-900/50 shadow-sm">
              <Sparkles className="h-8 w-8 text-orange-600 dark:text-orange-400" />
            </div>
          </div>
          
          <div className="space-y-2 max-w-[280px]">
            <h3 className="text-lg font-semibold text-foreground">
              Build Your First Habit
            </h3>
            <p className="text-sm text-muted-foreground">
              Small steps lead to big changes. Start with something simple today.
            </p>
          </div>

          <Button 
            onClick={onAddClick}
            className="mt-2 bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-md shadow-orange-500/20"
          >
            <Plus className="mr-2 h-4 w-4" />
            Create Custom Habit
          </Button>
        </CardContent>
      </Card>
    </motion.div>
  );
}
