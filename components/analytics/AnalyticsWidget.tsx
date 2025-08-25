'use client';

/**
 * @fileoverview Analytics Widget - Dashboard Integration
 *
 * Compact analytics widget for the main dashboard that provides
 * key performance insights and quick access to detailed analytics.
 *
 * Features:
 * - Real-time performance metrics summary
 * - Quick insights and recommendations
 * - Cross-track learning highlights
 * - Interactive charts and progress indicators
 * - Deep-link to full analytics dashboard
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  BarChart3,
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Clock,
  Award,
  ArrowRight,
  Activity,
  Zap
} from 'lucide-react';
import Link from 'next/link';
import React, { useState, useEffect } from 'react';
import {
  LineChart,
  Line,
  ResponsiveContainer,
  Tooltip
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { useAuth } from '@/contexts/AuthContext';
import { intelligentAnalyticsService, PerformanceAnalytics } from '@/lib/intelligent-analytics-service';
import { logger } from '@/lib/logger';

// UI Components

// Icons

// Chart Components

// ============================================================================
// ANALYTICS WIDGET COMPONENT
// ============================================================================

interface AnalyticsWidgetProps {
  className?: string;
}

const AnalyticsWidget: React.FC<AnalyticsWidgetProps> = ({ className }) => {
  const { user } = useAuth();
  const [analytics, setAnalytics] = useState<PerformanceAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // ============================================================================
  // DATA LOADING
  // ============================================================================

  useEffect(() => {
    if (!user?.uid) { return; }

    const loadAnalyticsSummary = async () => {
      try {
        setIsLoading(true);
        setError(null);

        const analyticsData = await intelligentAnalyticsService.getPerformanceAnalytics(user.uid);
        setAnalytics(analyticsData);

        logger.debug('Analytics widget loaded successfully', { userId: user.uid });
      } catch (error) {
        logger.error('Failed to load analytics widget', error as Error);
        setError('Failed to load analytics data');
      } finally {
        setIsLoading(false);
      }
    };

    loadAnalyticsSummary();
  }, [user?.uid]);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================

  const summaryMetrics = React.useMemo(() => {
    if (!analytics) { return null; }

    return {
      examPerformance: {
        current: analytics.examPerformance.averageScore,
        trend: analytics.examPerformance.scoreImprovement,
        predicted: analytics.predictions.examSuccessProbability
      },
      learningEfficiency: {
        current: Math.round((analytics.examPerformance.revisionEffectiveness + analytics.coursePerformance.codingEfficiency) / 2),
        crossTrackBenefits: analytics.crossTrackInsights.crossTrackBenefits.length
      },
      recentTrends: analytics.trends.daily.slice(-7).map(trend => ({
        date: trend.date.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        value: Math.round((trend.examScore + trend.courseProgress) / 2)
      }))
    };
  }, [analytics]);

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <Skeleton className="h-5 w-32 mb-2" />
              <Skeleton className="h-4 w-48" />
            </div>
            <Skeleton className="h-5 w-5" />
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
            <div className="space-y-2">
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-8 w-16" />
            </div>
          </div>
          <Skeleton className="h-24 w-full" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error || !analytics) {
    return (
      <Card className={className}>
        <CardContent className="flex flex-col items-center justify-center py-8">
          <BarChart3 className="h-8 w-8 text-muted-foreground mb-2" />
          <p className="text-sm text-muted-foreground text-center">
            {error || 'Analytics data not available yet'}
          </p>
          <p className="text-xs text-muted-foreground mt-1">
            Start studying to see your performance insights
          </p>
        </CardContent>
      </Card>
    );
  }

  // ============================================================================
  // MAIN WIDGET RENDER
  // ============================================================================

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-blue-600" />
              Performance Analytics
            </CardTitle>
            <CardDescription>
              Your learning insights across exam and course tracks
            </CardDescription>
          </div>
          <Link href="/analytics">
            <Button variant="ghost" size="sm">
              <BarChart3 className="h-4 w-4" />
            </Button>
          </Link>
        </div>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-blue-600" />
              <span className="text-sm font-medium">Exam Performance</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {summaryMetrics?.examPerformance.current.toFixed(1)}%
              </span>
              {summaryMetrics && summaryMetrics.examPerformance.trend > 0 ? (
                <div className="flex items-center text-green-600">
                  <TrendingUp className="h-4 w-4" />
                  <span className="text-xs">+{summaryMetrics.examPerformance.trend.toFixed(1)}%</span>
                </div>
              ) : (
                <div className="flex items-center text-red-600">
                  <TrendingDown className="h-4 w-4" />
                  <span className="text-xs">{summaryMetrics?.examPerformance.trend.toFixed(1)}%</span>
                </div>
              )}
            </div>
            <Progress
              value={summaryMetrics?.examPerformance.current || 0}
              className="h-2"
            />
          </div>

          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Zap className="h-4 w-4 text-orange-600" />
              <span className="text-sm font-medium">Learning Efficiency</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="text-2xl font-bold">
                {summaryMetrics?.learningEfficiency.current}%
              </span>
              <Badge variant="secondary" className="text-xs">
                {summaryMetrics?.learningEfficiency.crossTrackBenefits} insights
              </Badge>
            </div>
            <Progress
              value={summaryMetrics?.learningEfficiency.current || 0}
              className="h-2"
            />
          </div>
        </div>

        {/* Trend Chart */}
        {summaryMetrics?.recentTrends && summaryMetrics.recentTrends.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-purple-600" />
              <span className="text-sm font-medium">7-Day Performance Trend</span>
            </div>
            <div className="h-16">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={summaryMetrics.recentTrends}>
                  <Line
                    type="monotone"
                    dataKey="value"
                    stroke="#3b82f6"
                    strokeWidth={2}
                    dot={false}
                  />
                  <Tooltip
                    labelFormatter={(label) => `Date: ${label}`}
                    formatter={(value) => [`${value}%`, 'Performance']}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {/* Quick Insights */}
        <div className="space-y-2">
          <div className="flex items-center gap-2">
            <Brain className="h-4 w-4 text-green-600" />
            <span className="text-sm font-medium">Quick Insights</span>
          </div>

          <div className="space-y-2">
            {analytics.crossTrackInsights.learningTransfer.length > 0 && (
              <div className="p-3 bg-green-50 rounded-lg border border-green-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-green-800">
                      Cross-Track Learning Active
                    </p>
                    <p className="text-xs text-green-700">
                      {analytics.crossTrackInsights.learningTransfer.length} skills transferring between tracks
                    </p>
                  </div>
                  <Award className="h-4 w-4 text-green-600" />
                </div>
              </div>
            )}

            {analytics.examPerformance.weakAreas.length > 0 && (
              <div className="p-3 bg-orange-50 rounded-lg border border-orange-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-orange-800">
                      Focus Areas Identified
                    </p>
                    <p className="text-xs text-orange-700">
                      {analytics.examPerformance.weakAreas.length} areas need attention
                    </p>
                  </div>
                  <Target className="h-4 w-4 text-orange-600" />
                </div>
              </div>
            )}

            {analytics.predictions.examSuccessProbability > 80 && (
              <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-blue-800">
                      High Success Probability
                    </p>
                    <p className="text-xs text-blue-700">
                      {analytics.predictions.examSuccessProbability}% predicted exam success
                    </p>
                  </div>
                  <TrendingUp className="h-4 w-4 text-blue-600" />
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Action Button */}
        <Link href="/analytics">
          <Button className="w-full" variant="outline">
            <span>View Detailed Analytics</span>
            <ArrowRight className="h-4 w-4 ml-2" />
          </Button>
        </Link>
      </CardContent>
    </Card>
  );
};

export default AnalyticsWidget;
