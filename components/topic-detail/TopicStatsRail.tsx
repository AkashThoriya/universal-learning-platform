import { format } from 'date-fns';
import { CheckCircle, AlertCircle, Clock, Calendar, RotateCw, TrendingUp } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';
import { TopicProgress } from '@/types/exam';

interface TopicStatsRailProps {
  progress: TopicProgress | null;
  onMarkCompleted: () => void;
  onMarkMastered: () => void;
  onNeedsReview: () => void;
  onAddLog?: () => void;
}

export function TopicStatsRail({ progress, onMarkCompleted, onMarkMastered, onNeedsReview }: TopicStatsRailProps) {
  const isCompleted = progress?.status === 'completed';
  const isMastered = progress?.status === 'mastered' || (progress?.masteryScore || 0) >= 100;
  const needsReview = progress?.needsReview || false;
  const revisions = progress?.revisionCount || 0;
  const studyTimeHours = Math.round((progress?.totalStudyTime || 0) / 60);

  return (
    <div className="space-y-6 sticky top-24">
      {/* Primary Action Card */}
      <Card className="border-blue-100 shadow-sm overflow-hidden">
        <div className="h-2 bg-gradient-to-r from-blue-500 to-blue-600" />
        <CardContent className="p-5 space-y-4">
          <div className="space-y-1">
            <h3 className="font-semibold text-slate-900">Topic Status</h3>
            <p className="text-sm text-slate-500">Track your journey to mastery</p>
          </div>

          <Button
            className={cn(
              'w-full h-12 text-base font-medium transition-all shadow-sm group',
              isCompleted || isMastered ? 'bg-green-600 hover:bg-green-700 text-white' : 'bg-slate-900 hover:bg-slate-800 text-white'
            )}
            onClick={onMarkCompleted}
            disabled={isMastered}
          >
            {isCompleted || isMastered ? (
              <>
                <CheckCircle className="mr-2 h-5 w-5" />
                {isMastered ? 'Mastered' : 'Completed'}
              </>
            ) : (
              <>
                <div className="w-5 h-5 rounded-full border-2 border-white/30 mr-2 group-hover:border-white transition-colors" />
                Mark as Complete
              </>
            )}
          </Button>

          {!isMastered && (
             <Button
              variant="outline"
              className="w-full h-10 border-blue-200 text-blue-700 hover:bg-blue-50"
              onClick={onMarkMastered}
            >
              <CheckCircle className="mr-2 h-4 w-4" />
              I know this (100% Mastery)
            </Button>
          )}

          <Button
            variant="outline"
            className={cn(
              'w-full border-dashed',
              needsReview ? 'border-amber-400 bg-amber-50 text-amber-700 hover:bg-amber-100' : 'text-slate-600'
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
      <div className="bg-slate-50 border border-slate-100 rounded-xl p-4">
        <div className="flex gap-3">
          <div className="flex items-center gap-2 mb-1">
             <div className="p-2 bg-white rounded-lg shadow-sm h-fit border border-slate-100">
               <TrendingUp className="h-4 w-4 text-slate-600" />
             </div>
          </div>
          <div>
             <p className="text-xs font-bold text-slate-500 uppercase tracking-wide">Mastery Level</p>
             <p className="text-sm text-slate-700 leading-relaxed mt-2">
              Mastery reflects your confidence and retention. It increases with practice and spaced repetition. 
              <span className="block mt-1 text-xs text-slate-500">
                 Linked to your review schedule.
              </span>
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
