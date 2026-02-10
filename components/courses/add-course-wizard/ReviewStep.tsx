'use client';

import { WizardData } from './WizardContainer';
import { Card, CardContent } from '@/components/ui/card';
import { Calendar, Clock, Target, Rocket } from 'lucide-react';
import { format } from 'date-fns';

interface ReviewStepProps {
  data: WizardData;
}

export function ReviewStep({ data }: ReviewStepProps) {

  // Calculate a projected finish based on simple math if no target date
  // Or just display the inputs.

  const estimatedWeeklyHours = data.dailyStudyHours * data.studyDays.length;

  // Mock velocity for preview
  const velocityMessage = estimatedWeeklyHours > 20
    ? "High Velocity 🚀"
    : estimatedWeeklyHours > 10
      ? "Steady Pace 🏃"
      : "Casual Learner 🚶";

  return (
    <div className="space-y-8 max-w-2xl mx-auto">
      <div className="text-center mb-6">
        <h2 className="text-2xl font-bold text-gray-900">Ready to Launch?</h2>
        <p className="text-muted-foreground mt-2">
          Review your strategy for <strong>{data.courseName}</strong>. You can adjust these settings later.
        </p>
      </div>

      <Card className="bg-gradient-to-br from-slate-50 to-white overflow-hidden border-slate-200 shadow-sm">
        <CardContent className="p-0">
          <div className="grid grid-cols-1 md:grid-cols-3 divide-y md:divide-y-0 md:divide-x divide-slate-100 border-b border-slate-100">
            {/* Hours */}
            <div className="p-6 text-center">
              <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Clock className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{data.dailyStudyHours} hrs</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Daily Goal</div>
            </div>

            {/* Days */}
            <div className="p-6 text-center">
              <div className="w-10 h-10 bg-indigo-50 text-indigo-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Calendar className="w-5 h-5" />
              </div>
              <div className="text-2xl font-bold text-gray-900">{data.studyDays.length} days</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Per Week</div>
            </div>

            {/* Pace */}
            <div className="p-6 text-center">
              <div className="w-10 h-10 bg-emerald-50 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                <Rocket className="w-5 h-5" />
              </div>
              <div className="text-lg font-bold text-gray-900 mt-1">{velocityMessage}</div>
              <div className="text-xs text-muted-foreground uppercase tracking-wider font-semibold mt-1">Est. Velocity</div>
            </div>
          </div>

          <div className="p-6 bg-slate-50/50">
            <div className="flex items-center justify-between p-4 bg-white rounded-lg border border-slate-200">
              <div className="flex items-center gap-3">
                <Target className="w-5 h-5 text-gray-400" />
                <div>
                  <div className="text-sm font-medium text-gray-900">Target Completion</div>
                  <div className="text-xs text-muted-foreground">Based on your exam date</div>
                </div>
              </div>
              <div className="text-right">
                <div className="text-lg font-bold text-gray-900">
                  {data.targetDate ? format(data.targetDate, 'MMM d, yyyy') : '6 Months (Default)'}
                </div>
                {data.targetDate && (
                  <div className="text-xs text-blue-600 font-medium">Fixed Deadline</div>
                )}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="text-center">
        <p className="text-sm text-muted-foreground">
          By clicking <strong>Launch Strategy</strong>, you'll activate this course and add its syllabus to your dashboard.
        </p>
      </div>
    </div>
  );
}
