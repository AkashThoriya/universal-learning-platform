'use client';

import { motion } from 'framer-motion';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/utils';

interface RecommendationCardSkeletonProps {
  index?: number;
  className?: string;
}

/**
 * Skeleton for recommendation cards.
 * Matches: Title/Desc/Badge, Subjects, Meta info, Reasons box, Action button.
 */
export function RecommendationCardSkeleton({ index = 0, className }: RecommendationCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.35 }}
    >
      <Card className={cn('border shadow-md overflow-hidden h-full', className)}>
        <CardContent className="p-5 flex flex-col h-full relative">
          {/* Shimmer effect */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent z-10"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.2 }}
          />

          <div className="space-y-4 relative z-0 flex-1 flex flex-col">
            {/* Header: Title/Desc and Priority Badge */}
            <div className="flex justify-between items-start gap-3">
              <div className="flex-1 space-y-2">
                <Skeleton className="h-5 w-3/4 rounded-md" />
                <Skeleton className="h-4 w-full rounded-md" />
                <Skeleton className="h-4 w-5/6 rounded-md" />
              </div>
              <Skeleton className="h-6 w-16 rounded-full shrink-0" />
            </div>

            {/* Subjects */}
            <div className="flex gap-2 flex-wrap">
              <Skeleton className="h-5 w-16 rounded-full" />
              <Skeleton className="h-5 w-20 rounded-full" />
              <Skeleton className="h-5 w-14 rounded-full" />
            </div>

            {/* Meta info row */}
            <div className="flex items-center gap-4">
              <Skeleton className="h-3 w-16 rounded-full" />
              <Skeleton className="h-3 w-20 rounded-full" />
              <Skeleton className="h-3 w-12 rounded-full" />
            </div>

            {/* Reasons box - matches "Why this test?" section */}
            <div className="mt-2 p-3 bg-gray-50 rounded-lg space-y-2 border border-gray-100">
              <Skeleton className="h-3 w-24 rounded-sm bg-gray-200" />
              <div className="space-y-1.5 pt-1">
                <Skeleton className="h-3 w-full rounded-sm bg-gray-200" />
                <Skeleton className="h-3 w-5/6 rounded-sm bg-gray-200" />
              </div>
            </div>

            {/* Action button (pushed to bottom) */}
            <div className="mt-auto pt-2">
              <Skeleton className="h-10 w-full rounded-lg" />
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface RecommendationCardSkeletonGridProps {
  count?: number;
  className?: string;
}

/**
 * Grid of recommendation card skeletons.
 * Default: 4 cards in 2-column layout.
 */
export function RecommendationCardSkeletonGrid({ count = 4, className }: RecommendationCardSkeletonGridProps) {
  return (
    <div className={cn('grid grid-cols-1 md:grid-cols-2 gap-4', className)}>
      {Array.from({ length: count }, (_, i) => (
        <RecommendationCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}
