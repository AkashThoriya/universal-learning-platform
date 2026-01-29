'use client';

import { motion } from 'framer-motion';

import { Card, CardContent } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/utils';

interface StatCardSkeletonProps {
  index?: number;
  className?: string;
}

/**
 * Skeleton for stat/metric cards (e.g., Total Tests, Accuracy, etc.)
 * Matches actual layout: horizontal flex with label/value on left, icon on right
 */
export function StatCardSkeleton({ index = 0, className }: StatCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.1, duration: 0.3 }}
    >
      <Card className={cn('border-0 shadow-lg overflow-hidden bg-gradient-to-br from-gray-200 to-gray-300', className)}>
        <CardContent className="p-6 relative">
          {/* Shimmer overlay */}
          <motion.div
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent z-10"
            animate={{ x: ['-100%', '100%'] }}
            transition={{ duration: 1.5, repeat: Infinity, ease: 'linear', delay: index * 0.2 }}
          />
          {/* Horizontal layout matching actual stat cards */}
          <div className="flex items-center justify-between relative">
            <div className="space-y-2">
              <Skeleton className="h-4 w-20 rounded-md bg-white/50" />
              <Skeleton className="h-8 w-16 rounded-lg bg-white/60" />
            </div>
            {/* Icon placeholder */}
            <Skeleton className="h-8 w-8 rounded-lg bg-white/40" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface StatCardSkeletonGridProps {
  count?: number;
  className?: string;
}

/**
 * Grid of stat card skeletons.
 * Default: 4 cards in 2x2 on mobile, 4 columns on desktop.
 */
export function StatCardSkeletonGrid({ count = 4, className }: StatCardSkeletonGridProps) {
  return (
    <div className={cn('grid grid-cols-2 md:grid-cols-4 gap-4 md:gap-6', className)}>
      {Array.from({ length: count }, (_, i) => (
        <StatCardSkeleton key={i} index={i} />
      ))}
    </div>
  );
}
