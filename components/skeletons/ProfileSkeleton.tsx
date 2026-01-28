'use client';

import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

export function ProfileSkeleton() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Top Bar Skeleton */}
      <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-4">
              <Skeleton className="h-9 w-9 rounded-md" /> {/* Back Button */}
              <div>
                <Skeleton className="h-8 w-48 rounded-md mb-1" />
                <Skeleton className="h-4 w-64 rounded-md hidden md:block" />
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <div className="flex items-center space-x-2">
                <Skeleton className="h-2 w-24 rounded-full" />
                <Skeleton className="h-4 w-16 rounded-md" />
              </div>
              <Skeleton className="h-9 w-32 rounded-md" /> {/* Save Button */}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content Skeleton */}
      <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
        {/* Page Header */}
        <div className="flex items-start gap-4 mb-6">
          <Skeleton className="h-10 w-10 rounded-lg" />
          <div className="space-y-2">
            <Skeleton className="h-8 w-48 rounded-md" />
            <Skeleton className="h-4 w-96 max-w-full rounded-md" />
          </div>
        </div>

        {/* Tabs Skeleton */}
        <div className="space-y-6">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 border border-gray-200">
            <div className="flex gap-2 overflow-hidden">
              <Skeleton className="h-10 w-32 rounded-md flex-shrink-0" />
              <Skeleton className="h-10 w-32 rounded-md flex-shrink-0" />
              <Skeleton className="h-10 w-32 rounded-md flex-shrink-0" />
              <Skeleton className="h-10 w-32 rounded-md flex-shrink-0" />
            </div>
          </div>

          {/* Tab Content (Form Card) */}
          <Card>
            <CardHeader className="space-y-2">
              <div className="flex items-center gap-2">
                <Skeleton className="h-5 w-5 rounded-full" />
                <Skeleton className="h-6 w-48 rounded-md" />
              </div>
              <Skeleton className="h-4 w-72 rounded-md" />
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Simulate Form Fields */}
              <div className="space-y-2">
                <Skeleton className="h-4 w-24 rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>
              <div className="space-y-2">
                <Skeleton className="h-4 w-32 rounded-md" />
                <Skeleton className="h-10 w-full rounded-md" />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
                <div className="space-y-2">
                  <Skeleton className="h-4 w-28 rounded-md" />
                  <Skeleton className="h-10 w-full rounded-md" />
                </div>
              </div>

              <div className="space-y-2">
                <Skeleton className="h-4 w-40 rounded-md" />
                <Skeleton className="h-32 w-full rounded-md" />
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
