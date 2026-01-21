import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { 
  CheckCircle, 
  AlertCircle, 
  Clock, 
  Calendar, 
  RotateCw, 
  TrendingUp 
} from 'lucide-react';
import { TopicProgress } from '@/types/exam';
import { cn } from '@/lib/utils/utils';
import { format } from 'date-fns';

interface TopicStatsRailProps {
  progress: TopicProgress | null;
  onMarkCompleted: () => void;
  onNeedsReview: () => void;
  onAddLog?: () => void;
}

export function TopicStatsRail({ 
  progress, 
  onMarkCompleted, 
  onNeedsReview 
}: TopicStatsRailProps) {
  const isCompleted = progress?.status === 'completed';
  const needsReview = progress?.needsReview || false;
  const revisions = progress?.revisionCount || 0;
  const studyTimeHours = Math.round((progress?.totalStudyTime || 0) / 60);

  return (
    <div className="space-y-6 sticky top-24">
      {/* Primary Action Card */}
      <Card className="border-indigo-100 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-indigo-500 to-purple-500" />
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900">Topic Status</h3>
            <p className="text-sm text-slate-500">Track your journey to mastery</p>
          </div>
          
          <Button 
            className={cn(
              "w-full h-12 text-base font-medium transition-all shadow-sm group",
              isCompleted 
                ? "bg-green-600 hover:bg-green-700 text-white" 
                : "bg-slate-900 hover:bg-slate-800 text-white"
            )}
            onClick={onMarkCompleted}
          >
            {isCompleted ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                Completed
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 mr-2 group-hover:border-white transition-colors" />
                Mark as Complete
              </>
            )}
          </Button>

          <Button
            variant="outline"
            className={cn(
              "w-full border-dashed",
              needsReview ? "border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100" : "text-slate-600"
            )}
            onClick={onNeedsReview}
          >
            {needsReview ? (
              <>
                <AlertCircle className="mr-2 h-4 w-4 fill-amber-300" />
                Flagged for Review
              </>
            ) : (
              <>
                <AlertCircle className="mr-2 h-4 w-4" />
                Flag for Future Review
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 gap-3">
        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <RotateCw className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wider">Revisions</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{revisions}</div>
        </div>

        <div className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm">
          <div className="flex items-center gap-2 text-slate-500 mb-1">
            <Clock className="h-3.5 w-3.5" />
            <span className="text-xs font-medium uppercase tracking-wider">Hours</span>
          </div>
          <div className="text-xl font-bold text-slate-900">{studyTimeHours}h</div>
        </div>

        <div className="col-span-2 bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-center justify-between">
           <div>
            <div className="flex items-center gap-2 text-slate-500 mb-1">
              <Calendar className="h-3.5 w-3.5" />
              <span className="text-xs font-medium uppercase tracking-wider">Last Revised</span>
            </div>
            <div className="text-sm font-semibold text-slate-900">
              {progress?.lastRevised ? format(progress.lastRevised.toDate(), 'MMM d, yyyy') : 'Never'}
            </div>
           </div>
           {progress?.lastRevised && (
             <Badge variant="secondary" className="bg-slate-100 text-slate-600 font-normal">
               {/* Could add days ago logic here */}
             </Badge>
           )}
        </div>
      </div>

      {/* Motivation / Tip */}
      <div className="bg-gradient-to-br from-blue-50 to-indigo-50 border border-indigo-100 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="p-2 bg-white rounded-lg shadow-sm h-fit">
            <TrendingUp className="h-4 w-4 text-indigo-600" />
          </div>
          <div>
            <p className="text-xs font-bold text-indigo-900 uppercase tracking-wide mb-1">Pro Tip</p>
            <p className="text-sm text-indigo-800 leading-relaxed">
              Consistent small revisions beat marathon cramming. Try to review this topic again in 3 days.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
