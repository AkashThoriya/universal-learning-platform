'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils/utils';

interface ReviewCardSkeletonProps {
  index?: number;
  className?: string;
}

/**
 * Skeleton for ReviewItem Card
 * Matches: Title/Subtitle/Badge header, stats row, due pill, action buttons
 */
export function ReviewCardSkeleton({ index = 0, className }: ReviewCardSkeletonProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05, duration: 0.3 }}
    >
      <Card className={cn('h-full border shadow-sm', className)}>
        <CardHeader className="pb-2 space-y-2">
          <div className="flex items-start justify-between gap-2">
            <div className="flex-1 space-y-2">
              {/* Title with icon placeholder */}
              <div className="flex items-center gap-2">
                <Skeleton className="h-4 w-4 rounded-sm" />
                <Skeleton className="h-5 w-3/4 rounded-md" />
              </div>
              {/* Subtitle */}
              <Skeleton className="h-3 w-1/2 rounded-md" />
            </div>
            {/* Warning badge placeholder */}
            <Skeleton className="h-5 w-16 rounded-full" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Stats: Revisions + Date */}
          <div className="flex gap-4">
            <Skeleton className="h-4 w-20 rounded-md" />
            <Skeleton className="h-4 w-24 rounded-md" />
          </div>

          {/* Due Date Pill */}
          <Skeleton className="h-6 w-32 rounded-full" />

          {/* Action Buttons */}
          <div className="flex gap-2 pt-2">
            <Skeleton className="h-9 flex-1 rounded-md" />
            <Skeleton className="h-9 flex-1 rounded-md" />
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ReviewPageSkeletonProps {
  className?: string;
}

/**
 * Full page skeleton for Review Page
 * Includes: Header, Search, Tabs, Grid of Cards
 */
export function ReviewPageSkeleton({ className }: ReviewPageSkeletonProps) {
  return (
    <div className={cn('container max-w-6xl mx-auto px-4 py-8 space-y-6', className)}>
      {/* Header Skeleton */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>
        <Skeleton className="h-8 w-24 rounded-full" />
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <Skeleton className="h-10 flex-1 rounded-md" />
      </div>

      {/* Filter Tabs */}
      <div className="w-full">
        <div className="grid grid-cols-4 gap-1 p-1 bg-muted/20 rounded-lg">
          <Skeleton className="h-8 rounded-md bg-white/50" />
          <Skeleton className="h-8 rounded-md bg-white/50" />
          <Skeleton className="h-8 rounded-md bg-white/50" />
          <Skeleton className="h-8 rounded-md bg-white/50" />
        </div>
      </div>

      {/* Card Grid */}
      <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 mt-6">
        {Array.from({ length: 9 }, (_, i) => (
          <ReviewCardSkeleton key={i} index={i} />
        ))}
      </div>
    </div>
  );
}
