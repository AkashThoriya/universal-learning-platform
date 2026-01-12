'use client';


import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

/**
 * Skeleton for Syllabus Dashboard Page
 * Includes: Title, Stats Grid, Filter Card, Subject/Topic Cards
 */
export function SyllabusDashboardSkeleton() {
  return (
    <div className="max-w-6xl mx-auto p-4 sm:p-6 space-y-8">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48 rounded-lg" />
          <Skeleton className="h-4 w-96 max-w-full rounded-md" />
        </div>
        <div className="flex gap-2">
           <Skeleton className="h-9 w-24 rounded-md" />
           <Skeleton className="h-9 w-24 rounded-md" />
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-4 sm:p-6 flex items-center gap-3">
              <Skeleton className="h-10 w-10 rounded-xl" />
              <div className="space-y-2 flex-1">
                <Skeleton className="h-6 w-12 rounded-lg" />
                <Skeleton className="h-3 w-20 rounded-md" />
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* View Toggle */}
      <div className="flex justify-center">
         <Skeleton className="h-9 w-64 rounded-lg" />
      </div>

      {/* Filter Card */}
      <Card>
         <CardContent className="p-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
            <div className="space-y-2"><Skeleton className="h-4 w-20" /><Skeleton className="h-10 w-full" /></div>
         </CardContent>
      </Card>

      {/* Content Grid (Subjects) */}
      <div className="space-y-4">
         {Array.from({ length: 3 }).map((_, i) => (
            <Card key={i} className="border shadow-sm">
               <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <div className="flex items-center gap-4">
                     <Skeleton className="h-5 w-5 rounded-md" />
                     <div className="space-y-1">
                        <Skeleton className="h-6 w-48 rounded-md" />
                        <div className="flex gap-2">
                           <Skeleton className="h-5 w-16 rounded-full" />
                           <Skeleton className="h-5 w-16 rounded-full" />
                        </div>
                     </div>
                  </div>
                  <Skeleton className="h-8 w-24 rounded-full" />
               </CardHeader>
               <CardContent>
                  <div className="space-y-2 pt-2">
                    <div className="flex justify-between items-center"><Skeleton className="h-4 w-24" /><Skeleton className="h-4 w-12" /></div>
                    <Skeleton className="h-2 w-full rounded-full" />
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 pt-4">
                       <Skeleton className="h-16 rounded-lg" />
                       <Skeleton className="h-16 rounded-lg" />
                       <Skeleton className="h-16 rounded-lg" />
                       <Skeleton className="h-16 rounded-lg" />
                    </div>
                  </div>
               </CardContent>
            </Card>
         ))}
      </div>
    </div>
  );
}

/**
 * Skeleton for Topic Detail Page
 * Includes: Banner, Action Buttons, Stats, Tabs
 */
export function TopicDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
       {/* Header */}
       <div className="space-y-2 mb-6">
         <Skeleton className="h-4 w-24 rounded-md" />
       </div>

       {/* Banner Card */}
       <Card className="border-0 shadow-sm bg-muted/20">
         <CardHeader>
            <div className="flex justify-between items-start">
               <div className="space-y-3">
                  <div className="flex gap-3 items-center">
                     <Skeleton className="h-8 w-8 rounded-md" />
                     <Skeleton className="h-8 w-64 rounded-lg" />
                  </div>
                  <div className="flex gap-2">
                     <Skeleton className="h-6 w-24 rounded-full" />
                     <Skeleton className="h-6 w-16 rounded-full" />
                  </div>
               </div>
               <div className="text-right space-y-2">
                  <Skeleton className="h-8 w-20 rounded-lg ml-auto" />
                  <Skeleton className="h-4 w-24 rounded-md" />
               </div>
            </div>
            <div className="mt-6 space-y-2">
                <div className="flex justify-between">
                   <Skeleton className="h-4 w-16" />
                   <Skeleton className="h-4 w-12" />
                </div>
                <Skeleton className="h-3 w-full rounded-full" />
            </div>
         </CardHeader>
       </Card>

       {/* Action Buttons */}
       <Card className="bg-white/50 border-dashed">
          <CardContent className="p-4 flex flex-col sm:flex-row justify-between items-center gap-4">
             <div className="space-y-2 w-full sm:w-auto">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
             </div>
             <div className="flex gap-2 w-full sm:w-auto">
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
                <Skeleton className="h-10 w-24 rounded-md" />
             </div>
          </CardContent>
       </Card>

       {/* Stats Grid */}
       <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
             <Card key={i}><CardContent className="pt-6 flex gap-3">
                <Skeleton className="h-10 w-10 rounded-lg" />
                <div className="space-y-1">
                   <Skeleton className="h-6 w-16" />
                   <Skeleton className="h-3 w-24" />
                </div>
             </CardContent></Card>
          ))}
       </div>

       {/* Tabs */}
       <div className="space-y-6">
          <div className="grid grid-cols-4 gap-1">
             <Skeleton className="h-10 rounded-md" />
             <Skeleton className="h-10 rounded-md" />
             <Skeleton className="h-10 rounded-md" />
             <Skeleton className="h-10 rounded-md" />
          </div>

          <Card>
             <CardHeader>
                <Skeleton className="h-6 w-32 mb-2" />
                <Skeleton className="h-4 w-64" />
             </CardHeader>
             <CardContent className="space-y-3">
                {Array.from({ length: 3 }).map((_, i) => (
                   <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
             </CardContent>
          </Card>
       </div>
    </div>
  );
}

/**
 * Skeleton for Subtopic Detail Page
 * Includes: Header, Tabs, Content Card
 */
export function SubtopicDetailSkeleton() {
  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      {/* Header Skeleton */}
       <div className="space-y-4 mb-8">
         <Skeleton className="h-4 w-24 rounded-md" />
         <div className="flex justify-between items-start">
            <div className="space-y-2">
               <Skeleton className="h-8 w-64 rounded-lg" />
               <Skeleton className="h-4 w-48 rounded-md" />
            </div>
            <div className="flex gap-2">
               <Skeleton className="h-9 w-24 rounded-md" />
               <Skeleton className="h-9 w-24 rounded-md" />
            </div>
         </div>
       </div>

       {/* Tabs */}
       <div className="space-y-6">
          <div className="grid grid-cols-3 gap-1 max-w-md">
             <Skeleton className="h-10 rounded-md" />
             <Skeleton className="h-10 rounded-md" />
             <Skeleton className="h-10 rounded-md" />
          </div>

          <Card>
             <CardHeader className="space-y-2">
                <Skeleton className="h-6 w-48" />
                <Skeleton className="h-4 w-96 max-w-full" />
             </CardHeader>
             <CardContent className="space-y-4">
                <Skeleton className="h-64 w-full rounded-xl" />
                <div className="flex justify-end">
                   <Skeleton className="h-9 w-32 rounded-md" />
                </div>
             </CardContent>
          </Card>
       </div>
    </div>
  );
}
