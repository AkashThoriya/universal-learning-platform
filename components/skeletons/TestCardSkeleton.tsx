'use client';

import { motion } from 'framer-motion';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/utils';

interface TestCardSkeletonProps {
  index?: number;
  className?: string;
}

/**
 * Skeleton for AdaptiveTestCard
 * Matches: Gradient header with title/description/status, stats row, content with badges/actions
 */
export function TestCardSkeleton({ index = 0, className }: TestCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Card className={cn('border-0 shadow-lg overflow-hidden bg-white h-full', className)}>
        {/* Gradient Header - matches AdaptiveTestCard */}
        <div className="bg-gradient-to-r from-gray-300 via-gray-400 to-gray-300 p-6 relative overflow-hidden">
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/30 to-transparent z-10"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.15 }}
          />
          <div className="relative z-10 space-y-3">
            {/* Title and status badge row */}
            <div className="flex items-start justify-between">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-6 w-3/4 rounded-lg bg-white/50" />
                <Skeleton className="h-4 w-full rounded-md bg-white/40" />
              </div>
              <Skeleton className="h-6 w-20 rounded-full bg-white/50 ml-3" />
            </div>
            {/* Stats row: questions, duration, algorithm */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-4 w-24 rounded-full bg-white/40" />
              <Skeleton className="h-4 w-20 rounded-full bg-white/40" />
              <Skeleton className="h-4 w-16 rounded-full bg-white/40" />
            </div>
          </div>
        </div>

        {/* Content area */}
        <CardContent className="p-6 relative space-y-4">
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/50 to-transparent z-10"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.15 + 0.3 }}
          />
          <div className="relative z-10 space-y-4">
            {/* Difficulty and algorithm badges */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <div className="flex gap-1">
                  <Skeleton className="h-6 w-16 rounded-full" />
                  <Skeleton className="h-6 w-16 rounded-full" />
                </div>
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-20 rounded-md" />
                <Skeleton className="h-6 w-20 rounded-full" />
              </div>
            </div>

            {/* Subjects/tags */}
            <div className="space-y-2">
              <Skeleton className="h-4 w-16 rounded-md" />
              <div className="flex gap-2 flex-wrap">
                <Skeleton className="h-6 w-14 rounded-full" />
                <Skeleton className="h-6 w-18 rounded-full" />
                <Skeleton className="h-6 w-12 rounded-full" />
              </div>
            </div>

            {/* Action button */}
            <Skeleton className="h-10 w-full rounded-lg mt-2" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface TestCardSkeletonGridProps {
  count?: number;
  className?: string;
}

/**
 * Grid of test card skeletons.
 * Default: 6 cards in responsive grid (1 col mobile, 2 tablet, 3 desktop).
 */
export function TestCardSkeletonGrid({ count = 6, className }: TestCardSkeletonGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6', className)}>
      {Array.from({ length: count }, (_, i) => (
        <TestCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}
