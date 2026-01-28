'use client';

import { useMemo } from 'react';
import { TrendingUp, Calendar, Target, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { User, SyllabusSubject } from '@/types/exam';
import Link from 'next/link';

interface StrategyInsightsProps {
  user: User;
  syllabus: SyllabusSubject[];
  completedTopicsCount: number;
}

export default function StrategyInsights({ user, syllabus, completedTopicsCount }: StrategyInsightsProps) {
  // Calculate Date Metrics
  const metrics = useMemo(() => {
    const today = new Date();

    const startDate = user.preparationStartDate?.toDate();

    // Robustly resolve exam date from various possible locations in the User object
    let targetDate: Date | undefined;
    if (user.currentExam?.targetDate) {
      targetDate = user.currentExam.targetDate.toDate();
    }

    const examDate = targetDate;

    // Safely handle total topics calculation
    const totalTopics = syllabus.reduce((acc, subject) => acc + (subject.topics?.length || 0), 0);
    const remainingTopics = totalTopics - completedTopicsCount;

    if (!startDate || !examDate) return null;

    // Time calculations
    const daysElapsed = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
    const daysRemaining = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
    const totalDays = daysElapsed + daysRemaining;

    // Velocity (Topics per Day)
    const currentVelocity = completedTopicsCount / daysElapsed; // Topics/Day
    const requiredVelocity = remainingTopics / Math.max(1, daysRemaining); // Topics/Day

    // Projected Finish
    const daysToFinishAtCurrentPace = currentVelocity > 0 ? Math.ceil(remainingTopics / currentVelocity) : 999;
    const projectedFinishDate = new Date(today.getTime() + daysToFinishAtCurrentPace * 24 * 60 * 60 * 1000);

    // Status Logic
    let status: 'on_track' | 'at_risk' | 'critical' | 'ahead' = 'on_track';

    if (daysRemaining <= 0 && remainingTopics > 0) {
      status = 'critical';
    } else if (projectedFinishDate > examDate) {
      // If projection is way past exam date
      const delayDays = Math.ceil((projectedFinishDate.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24));
      status = delayDays > 14 ? 'critical' : 'at_risk';
    } else if (projectedFinishDate < new Date(examDate.getTime() - 14 * 24 * 60 * 60 * 1000)) {
      status = 'ahead'; // Finishing 2 weeks early
    }

    return {
      startDate,
      examDate,
      totalTopics,
      daysElapsed,
      daysRemaining,
      currentVelocity,
      requiredVelocity,
      projectedFinishDate,
      status,
      percentageTimeElapsed: Math.min(100, (daysElapsed / totalDays) * 100),
      percentageContentCompleted: Math.min(100, (completedTopicsCount / totalTopics) * 100),
    };
  }, [user, syllabus, completedTopicsCount]);

  if (!user.preparationStartDate) {
    return (
      <Card className="mb-6 border-l-4 border-l-blue-500 bg-gradient-to-br from-blue-50 to-white shadow-md overflow-hidden">
        <CardContent className="p-6">
          <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="p-3 bg-blue-100 rounded-xl shrink-0">
                <Calendar className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-900 text-lg">Unlock Your Strategy Intelligence</h3>
                <p className="text-muted-foreground mt-1">
                  Set your <strong className="text-blue-600">Preparation Start Date</strong> to activate velocity
                  tracking, pace analysis, and projected finish dates.
                </p>
              </div>
            </div>
            <Link href="/profile?tab=exam&focus=prepDate">
              <Button className="bg-blue-600 hover:bg-blue-700 text-white whitespace-nowrap">
                <TrendingUp className="h-4 w-4 mr-2" />
                Configure Now
              </Button>
            </Link>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!metrics) return null;

  // Formatting helpers
  const formatDate = (date: Date) =>
    date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  const formatVelocity = (v: number) => (v * 7).toFixed(1); // Convert to Weekly Velocity for readability

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Primary Insight Card */}
      <Card className="lg:col-span-2 shadow-md border-blue-100 bg-gradient-to-br from-white to-blue-50/30">
        <CardHeader className="pb-2">
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="text-xl flex items-center gap-2">
                <TrendingUp className="h-5 w-5 text-blue-600" />
                Strategy Command Center
              </CardTitle>
              <CardDescription>Real-time analysis of your preparation pace</CardDescription>
            </div>
            <StatusBadge status={metrics.status} />
          </div>
        </CardHeader>
        <CardContent className="space-y-6">
          {/* Timeline Visual */}
          <div className="relative pt-6 pb-2">
            <div className="flex justify-between text-sm font-medium text-muted-foreground mb-2">
              <span className="flex items-center gap-1">
                <Calendar className="h-3 w-3" /> Start: {formatDate(metrics.startDate)}
              </span>
              <span className="flex items-center gap-1">
                <Target className="h-3 w-3" /> Exam: {formatDate(metrics.examDate)}
              </span>
            </div>

            {/* Dual Progress Bar: Time vs Content */}
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-blue-600 font-medium">Content Completion</span>
                  <span className="text-blue-600">{metrics.percentageContentCompleted.toFixed(0)}%</span>
                </div>
                <Progress
                  value={metrics.percentageContentCompleted}
                  className="h-2 bg-blue-100"
                  indicatorClassName="bg-blue-600"
                />
              </div>
              <div className="space-y-1">
                <div className="flex justify-between text-xs">
                  <span className="text-gray-500">Time Elapsed</span>
                  <span className="text-gray-500">{metrics.percentageTimeElapsed.toFixed(0)}%</span>
                </div>
                <Progress
                  value={metrics.percentageTimeElapsed}
                  className="h-1.5 bg-gray-100"
                  indicatorClassName="bg-gray-400"
                />
              </div>
            </div>
          </div>

          {/* Velocity Comparison */}
          <div className="grid grid-cols-2 gap-4 bg-white/60 rounded-xl p-4 border border-blue-50">
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Current Velocity</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span className="text-2xl font-bold text-gray-900">{formatVelocity(metrics.currentVelocity)}</span>
                <span className="text-xs text-gray-500">topics / week</span>
              </div>
            </div>
            <div>
              <p className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Required Pace</p>
              <div className="flex items-baseline gap-1 mt-1">
                <span
                  className={`text-2xl font-bold ${metrics.currentVelocity >= metrics.requiredVelocity ? 'text-emerald-600' : 'text-amber-600'}`}
                >
                  {formatVelocity(metrics.requiredVelocity)}
                </span>
                <span className="text-xs text-gray-500">topics / week</span>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Projection Card */}
      <Card
        className={`shadow-md border-l-4 ${metrics.status === 'on_track' || metrics.status === 'ahead' ? 'border-l-emerald-500' : 'border-l-amber-500'}`}
      >
        <CardHeader>
          <CardTitle className="text-base text-gray-600">Projected Finish</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="mb-6">
            <div className="text-3xl font-bold text-gray-900 mb-1">{formatDate(metrics.projectedFinishDate)}</div>
            <p className="text-sm text-muted-foreground">
              at your current pace of {formatVelocity(metrics.currentVelocity)} topics/week
            </p>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-gray-100 rounded-lg">
                <Clock className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{metrics.daysRemaining} Days Left</p>
                <p className="text-xs text-gray-500">until exam day</p>
              </div>
            </div>
            <div className="flex items-center gap-3 text-sm">
              <div className="p-2 bg-gray-100 rounded-lg">
                <CheckCircle2 className="h-4 w-4 text-gray-600" />
              </div>
              <div>
                <p className="font-medium text-gray-900">{metrics.totalTopics - completedTopicsCount} Topics</p>
                <p className="text-xs text-gray-500">remaining to cover</p>
              </div>
            </div>
          </div>

          {metrics.status === 'critical' && (
            <div className="mt-6 p-3 bg-rose-50 text-rose-700 text-xs rounded-lg border border-rose-100 flex gap-2">
              <AlertTriangle className="h-4 w-4 shrink-0" />
              <p>You are falling behind. Consider increasing study hours or prioritizing high-yield topics.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatusBadge({ status }: { status: string }) {
  const styles = {
    on_track: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    ahead: 'bg-emerald-100 text-emerald-700 border-emerald-200 hover:bg-emerald-100',
    at_risk: 'bg-amber-100 text-amber-700 border-amber-200 hover:bg-amber-100',
    critical: 'bg-rose-100 text-rose-700 border-rose-200 hover:bg-rose-100',
  };

  const labels = {
    on_track: 'On Track',
    ahead: 'Ahead of Schedule',
    at_risk: 'At Risk',
    critical: 'Critical Delay',
  };

  return (
    <Badge variant="outline" className={`${styles[status as keyof typeof styles]} px-3 py-1`}>
      {labels[status as keyof typeof labels]}
    </Badge>
  );
}
