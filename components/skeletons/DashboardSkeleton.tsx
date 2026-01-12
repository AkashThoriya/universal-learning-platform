import { Skeleton } from '@/components/ui/skeleton';
import { Card, CardContent } from '@/components/ui/card';

export function DashboardSkeleton() {
  return (
    <div className="space-y-6">
      {/* Welcome Header Skeleton */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <Skeleton className="h-8 w-64 rounded-md" />
        <Skeleton className="h-8 w-48 rounded-md" />
      </div>

      <Card className="border-0 shadow-sm bg-gradient-to-r from-blue-600 to-indigo-600 text-white overflow-hidden relative">
         <CardContent className="p-6 relative z-10">
            <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
               <div className="space-y-2">
                  <Skeleton className="h-8 w-64 bg-white/20" />
                  <Skeleton className="h-6 w-96 bg-white/20" />
               </div>
               <Skeleton className="h-24 w-24 rounded-full bg-white/20" />
            </div>
         </CardContent>
      </Card>

      {/* Stats Grid Skeleton */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {[...Array(4)].map((_, i) => (
          <Card key={i} className="border-0 shadow-sm">
            <CardContent className="p-6 flex items-center justify-between">
               <div>
                  <Skeleton className="h-4 w-24 mb-2" />
                  <Skeleton className="h-8 w-16" />
               </div>
               <Skeleton className="h-10 w-10 rounded-full" />
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content Areas Skeleton */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column (Recent Activity/Recommendations) */}
        <div className="lg:col-span-2 space-y-6">
           {/* Recommendation Card */}
           <Card>
              <CardContent className="p-6 space-y-4">
                 <Skeleton className="h-6 w-48" />
                 <Skeleton className="h-4 w-full" />
                 <div className="flex gap-4 pt-2">
                    <Skeleton className="h-10 w-32 rounded-md" />
                    <Skeleton className="h-10 w-32 rounded-md" />
                 </div>
              </CardContent>
           </Card>

           {/* Activity Chart Placeholder */}
           <Card>
              <CardContent className="p-6">
                 <div className="flex justify-between items-center mb-6">
                    <Skeleton className="h-6 w-32" />
                    <Skeleton className="h-8 w-24" />
                 </div>
                 <Skeleton className="h-64 w-full rounded-md" />
              </CardContent>
           </Card>
        </div>

        {/* Right Column (Achievements/Goals) */}
        <div className="space-y-6">
           <Card>
              <CardContent className="p-6 space-y-4">
                 <Skeleton className="h-6 w-40" />
                 <div className="space-y-3">
                    <div className="flex items-center gap-3">
                       <Skeleton className="h-10 w-10 rounded-md" />
                       <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                       </div>
                    </div>
                    <div className="flex items-center gap-3">
                       <Skeleton className="h-10 w-10 rounded-md" />
                       <div className="space-y-1">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-3 w-24" />
                       </div>
                    </div>
                 </div>
              </CardContent>
           </Card>
           
           <Card>
              <CardContent className="p-6 space-y-4">
                 <Skeleton className="h-6 w-32" />
                 <Skeleton className="h-40 w-full rounded-md" />
              </CardContent>
           </Card>
        </div>
      </div>
    </div>
  );
}
