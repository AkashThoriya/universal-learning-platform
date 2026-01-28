'use client';

import { motion } from 'framer-motion';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton for the test-taking interface (/test/[testId])
 * Mimics: Header with progress, Question card, Answer options
 */
export function TestDetailSkeleton() {
  return (
    <div className="min-h-screen bg-gray-50 pb-20">
      {/* Header Skeleton */}
      <div className="bg-white border-b sticky top-0 z-40 px-4 py-4">
        <div className="container mx-auto max-w-4xl space-y-4">
          <div className="flex items-center gap-4">
            <Skeleton className="h-10 w-10 rounded-full" /> {/* Back button */}
            <div className="flex-1">
              <Skeleton className="h-6 w-1/3 mb-1" />
              <Skeleton className="h-4 w-1/4" />
            </div>
            <Skeleton className="h-10 w-32 rounded-full" /> {/* Timer */}
          </div>
          <Skeleton className="h-2 w-full rounded-full" /> {/* Progress bar */}
        </div>
      </div>

      <div className="container mx-auto max-w-4xl px-4 py-8 space-y-6">
        {/* Question Card Skeleton */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.5 }}>
          <Card className="border-0 shadow-sm overflow-hidden bg-white">
            <CardHeader className="bg-gray-50/50 pb-6 border-b">
              <div className="flex justify-between items-center mb-4">
                <Skeleton className="h-6 w-24 rounded-full" /> {/* Question x of y */}
                <div className="flex gap-2">
                  <Skeleton className="h-6 w-20 rounded-full" /> {/* Difficulty */}
                  <Skeleton className="h-6 w-20 rounded-full" /> {/* Subject */}
                </div>
              </div>
              <Skeleton className="h-24 w-full rounded-lg" /> {/* Question text */}
            </CardHeader>
            <CardContent className="p-6 md:p-8 space-y-4 relative">
              {/* Shimmer effect */}
              <motion.div
                className="absolute inset-0 bg-gradient-to-r from-transparent via-gray-50/50 to-transparent z-10 pointer-events-none"
                animate={{ x: ['-100%', '100%'] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              />

              {/* Answer Options */}
              {[...Array(4)].map((_, i) => (
                <div key={i} className="flex gap-3 items-center p-4 rounded-xl border border-gray-100 bg-white">
                  <Skeleton className="h-6 w-6 rounded-full shrink-0" />
                  <Skeleton className="h-5 w-3/4 rounded-md" />
                </div>
              ))}
            </CardContent>
          </Card>
        </motion.div>

        {/* Footer Actions Skeleton */}
        <div className="flex justify-between items-center pt-4">
          <Skeleton className="h-10 w-28 rounded-lg" />
          <Skeleton className="h-10 w-32 rounded-lg" />
        </div>
      </div>
    </div>
  );
}
