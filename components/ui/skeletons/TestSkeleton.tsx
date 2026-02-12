import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/loading-states';

export function TestSkeleton() {
  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-pulse">
      {/* Header Skeleton */}
      <Card className="border-0 shadow-sm bg-white overflow-hidden">
        <CardHeader className="pb-3 pt-4 px-5">
          <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 mb-3">
            <div className="flex items-center gap-2">
              <Skeleton width="w-20" height="h-7" rounded="rounded-md" />
              <Skeleton width="w-24" height="h-7" rounded="rounded-md" />
            </div>
            <div className="flex items-center gap-4">
              <Skeleton width="w-16" height="h-7" rounded="rounded-full" />
              <Skeleton width="w-16" height="h-7" rounded="rounded-full" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="flex justify-between">
              <Skeleton width="w-12" height="h-3" />
              <Skeleton width="w-8" height="h-3" />
            </div>
            <Skeleton width="w-full" height="h-2" rounded="rounded-full" />
          </div>
        </CardHeader>
      </Card>

      {/* Question Card Skeleton */}
      <Card className="border-0 shadow-xl overflow-hidden bg-white">
        <CardHeader className="p-5 sm:p-6 bg-white pb-2 space-y-4">
          <div className="space-y-2">
            <Skeleton width="w-full" height="h-4" />
            <Skeleton width="w-11/12" height="h-4" />
            <Skeleton width="w-4/5" height="h-4" />
          </div>

          {/* Code Snippet Placeholder */}
          <div className="my-4">
            <Skeleton width="w-full" height="h-32" rounded="rounded-lg" className="bg-slate-800 opacity-10" />
          </div>
        </CardHeader>

        <CardContent className="space-y-4 p-5 sm:p-6 pt-0">
          {/* Options */}
          <div className="space-y-3">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="p-4 rounded-xl border border-gray-100 flex items-center gap-4">
                <Skeleton width="w-6" height="h-6" rounded="rounded-full" />
                <Skeleton width="w-3/4" height="h-4" />
              </div>
            ))}
          </div>

          {/* Footer Actions */}
          <div className="pt-4 flex justify-between items-center">
             <Skeleton width="w-20" height="h-9" rounded="rounded-md" />
             <Skeleton width="w-24" height="h-10" rounded="rounded-md" />
          </div>
        </CardContent>
      </Card>
      
      {/* Loading Message */}
      <div className="text-center text-sm text-gray-400 mt-8">
        Generating your adaptive test...
      </div>
    </div>
  );
}
