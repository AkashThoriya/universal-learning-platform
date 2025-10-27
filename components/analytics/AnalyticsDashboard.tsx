'use client';

/**
 * @fileoverview Analytics Dashboard - Enterprise UI/UX Implementation
 *
 * Comprehensive analytics dashboard providing real-time insights across
 * exam and course learning tracks with interactive visualizations,
 * performance metrics, and adaptive recommendations.
 *
 * Features:
 * - Real-time performance tracking with live updates
 * - Interactive charts and data visualizations
 * - Cross-track learning insights and recommendations
 * - Weak area identification with improvement suggestions
 * - Predictive analytics and success forecasting
 * - Responsive design optimized for all devices
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  TrendingUp,
  TrendingDown,
  Target,
  Brain,
  Code,
  Lightbulb,
  AlertTriangle,
  Clock,
  BarChart3,
  PieChart,
  RefreshCw,
  Download,
  Share,
  Zap,
  Activity,
} from 'lucide-react';
import React, { useState, useEffect, useMemo } from 'react';
import {
  LineChart,
  Line,
  PieChart as RechartsPieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from 'recharts';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Skeleton } from '@/components/ui/skeleton';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import {
  intelligentAnalyticsService,
  PerformanceAnalytics,
  WeakArea,
  AdaptiveRecommendation,
} from '@/lib/intelligent-analytics-service';
import { logger } from '@/lib/logger';

// UI Components

// Icons

// Chart Components (using recharts for enterprise-grade visualizations)

// ============================================================================
// ANALYTICS DASHBOARD INTERFACE
// ============================================================================

interface AnalyticsDashboardProps {
  className?: string;
}

interface DashboardState {
  analytics: PerformanceAnalytics | null;
  weakAreas: WeakArea[];
  recommendations: AdaptiveRecommendation[];
  isLoading: boolean;
  error: string | null;
  lastUpdated: Date | null;
  selectedTimeRange: '7d' | '30d' | '90d' | '1y';
  selectedMetric: 'performance' | 'efficiency' | 'progress' | 'predictions';
}

// ============================================================================
// MAIN ANALYTICS DASHBOARD COMPONENT
// ============================================================================

const AnalyticsDashboard: React.FC<AnalyticsDashboardProps> = ({ className }) => {
  const { user } = useAuth();
  const [state, setState] = useState<DashboardState>({
    analytics: null,
    weakAreas: [],
    recommendations: [],
    isLoading: true,
    error: null,
    lastUpdated: null,
    selectedTimeRange: '30d',
    selectedMetric: 'performance',
  });

  // ============================================================================
  // DATA LOADING & REAL-TIME UPDATES
  // ============================================================================

  useEffect(() => {
    if (!user?.uid) {
      return;
    }

    let unsubscribe: (() => void) | null = null;

    const loadAnalytics = async () => {
      try {
        setState(prev => ({ ...prev, isLoading: true, error: null }));

        // Load initial analytics data
        const [analytics, weakAreas, recommendations] = await Promise.all([
          intelligentAnalyticsService.getPerformanceAnalytics(user.uid),
          intelligentAnalyticsService.identifyWeakAreas(user.uid),
          intelligentAnalyticsService.getImprovementRecommendations(user.uid, []),
        ]);

        setState(prev => ({
          ...prev,
          analytics,
          weakAreas,
          recommendations,
          isLoading: false,
          lastUpdated: new Date(),
        }));

        // Subscribe to real-time updates
        unsubscribe = intelligentAnalyticsService.subscribeToPerformanceUpdates(user.uid, updatedAnalytics => {
          setState(prev => ({
            ...prev,
            analytics: updatedAnalytics,
            lastUpdated: new Date(),
          }));
        });

        logger.info('Analytics dashboard loaded successfully', { userId: user.uid });
      } catch (error) {
        logger.error('Failed to load analytics dashboard', error as Error);
        setState(prev => ({
          ...prev,
          isLoading: false,
          error: 'Failed to load analytics data. Please try again.',
        }));
      }
    };

    loadAnalytics();

    return () => {
      if (unsubscribe) {
        unsubscribe();
      }
    };
  }, [user?.uid]);

  // ============================================================================
  // COMPUTED VALUES & CHART DATA
  // ============================================================================

  const chartData = useMemo(() => {
    if (!state.analytics) {
      return null;
    }

    const { trends } = state.analytics;
    const timeRangeData =
      state.selectedTimeRange === '7d'
        ? trends.daily.slice(-7)
        : state.selectedTimeRange === '30d'
          ? trends.daily.slice(-30)
          : state.selectedTimeRange === '90d'
            ? trends.weekly.slice(-12)
            : trends.monthly.slice(-12);

    return {
      performance: timeRangeData.map(trend => ({
        date: trend.date.toDate().toLocaleDateString(),
        examScore: trend.examScore,
        courseProgress: trend.courseProgress,
        efficiency: trend.efficiency,
      })),
      distribution: [
        { name: 'Exam Studies', value: state.analytics.examPerformance?.totalMockTests ?? 0, color: '#3b82f6' },
        { name: 'Course Work', value: state.analytics.coursePerformance?.totalAssignments ?? 0, color: '#10b981' },
        {
          name: 'Cross-Track',
          value: state.analytics.crossTrackInsights?.learningTransfer?.length ?? 0,
          color: '#f59e0b',
        },
      ],
    };
  }, [state.analytics, state.selectedTimeRange]);

  const performanceMetrics = useMemo(() => {
    if (!state.analytics) {
      return null;
    }

    const { examPerformance, coursePerformance, predictions } = state.analytics;

    return {
      examSuccess: {
        current: examPerformance?.averageScore ?? 0,
        trend: examPerformance?.scoreImprovement ?? 0,
        predicted: predictions?.examSuccessProbability ?? 0,
      },
      courseSuccess: {
        current: coursePerformance?.completionRate ?? 0,
        trend: (coursePerformance?.projectSuccessRate ?? 0) - (coursePerformance?.completionRate ?? 0),
        predicted: coursePerformance?.projectSuccessRate ?? 0,
      },
      efficiency: {
        current: Math.round(
          ((examPerformance?.revisionEffectiveness ?? 0) + (coursePerformance?.codingEfficiency ?? 0)) / 2
        ),
        trend: 5.2, // Calculate from historical data
        predicted: 85,
      },
    };
  }, [state.analytics]);

  // ============================================================================
  // EVENT HANDLERS
  // ============================================================================

  const handleRefreshData = async () => {
    if (!user?.uid) {
      logger.info('Analytics refresh: No user available');
      return;
    }

    logger.info('Analytics refresh: Starting data refresh', { userId: user.uid });
    setState(prev => ({ ...prev, isLoading: true }));

    try {
      const analytics = await intelligentAnalyticsService.getPerformanceAnalytics(user.uid);
      setState(prev => ({
        ...prev,
        analytics,
        isLoading: false,
        lastUpdated: new Date(),
      }));
      logger.info('Analytics refresh: Data refreshed successfully', {
        userId: user.uid,
        dataPoints: analytics ? Object.keys(analytics).length : 0,
      });
    } catch (error) {
      logger.error('Analytics refresh: Failed to refresh data', {
        error: error instanceof Error ? error.message : String(error),
        userId: user.uid,
        stack: error instanceof Error ? error.stack : undefined,
      });
      setState(prev => ({ ...prev, isLoading: false }));
    }
  };

  const handleTimeRangeChange = (range: '7d' | '30d' | '90d' | '1y') => {
    setState(prev => ({ ...prev, selectedTimeRange: range }));
  };

  const handleMetricChange = (metric: 'performance' | 'efficiency' | 'progress' | 'predictions') => {
    setState(prev => ({ ...prev, selectedMetric: metric }));
  };

  // ============================================================================
  // LOADING & ERROR STATES
  // ============================================================================

  if (state.isLoading && !state.analytics) {
    return (
      <div className={`space-y-6 ${className}`}>
        <div className="flex items-center justify-between">
          <div>
            <Skeleton className="h-8 w-64 mb-2" />
            <Skeleton className="h-4 w-96" />
          </div>
          <Skeleton className="h-10 w-32" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i}>
              <CardHeader className="pb-2">
                <Skeleton className="h-4 w-24" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-8 w-16 mb-2" />
                <Skeleton className="h-4 w-32" />
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardHeader>
            <Skeleton className="h-6 w-48" />
          </CardHeader>
          <CardContent>
            <Skeleton className="h-64 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  if (state.error) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Analytics Error</AlertTitle>
          <AlertDescription>
            {state.error}
            <Button variant="outline" size="sm" className="mt-2" onClick={handleRefreshData}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Try Again
            </Button>
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  // Check if analytics is empty or has no meaningful data
  const hasNoData =
    !state.analytics ||
    (state.analytics.examPerformance.totalMockTests === 0 &&
      state.analytics.coursePerformance.totalAssignments === 0 &&
      state.analytics.trends.daily.length === 0);

  if (hasNoData) {
    return (
      <div className={`space-y-6 ${className}`}>
        <Card>
          <CardContent className="flex flex-col items-center justify-center py-12">
            <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No Analytics Data Yet</h3>
            <p className="text-muted-foreground text-center max-w-md mb-6">
              Start studying and taking mock tests to see your performance analytics here. You need to complete at least
              a few study sessions to generate meaningful insights.
            </p>
            <div className="flex gap-3">
                            <Button onClick={() => (window.location.href = '/journey')} className="bg-blue-600 hover:bg-blue-700">
                View Journey
              </Button>
              <Button onClick={() => (window.location.href = '/dashboard')} variant="outline">
                Go to Dashboard
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // ============================================================================
  // MAIN DASHBOARD RENDER
  // ============================================================================

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Header Section */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Analytics Dashboard</h1>
          <p className="text-muted-foreground">Comprehensive insights across your exam and course learning journey</p>
        </div>

        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefreshData} disabled={state.isLoading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${state.isLoading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>

          <Button variant="outline" size="sm">
            <Download className="h-4 w-4 mr-2" />
            Export
          </Button>

          <Button variant="outline" size="sm">
            <Share className="h-4 w-4 mr-2" />
            Share
          </Button>
        </div>
      </div>

      {/* Time Range Selector */}
      <div className="flex items-center gap-2">
        <span className="text-sm font-medium">Time Range:</span>
        {(['7d', '30d', '90d', '1y'] as const).map(range => (
          <Button
            key={range}
            variant={state.selectedTimeRange === range ? 'default' : 'outline'}
            size="sm"
            onClick={() => handleTimeRangeChange(range)}
          >
            {range === '7d' ? '7 Days' : range === '30d' ? '30 Days' : range === '90d' ? '90 Days' : '1 Year'}
          </Button>
        ))}
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <PerformanceMetricCard
          title="Exam Performance"
          value={performanceMetrics?.examSuccess.current || 0}
          unit="%"
          trend={performanceMetrics?.examSuccess.trend || 0}
          predicted={performanceMetrics?.examSuccess.predicted || 0}
          icon={<Target className="h-4 w-4" />}
          color="blue"
        />

        <PerformanceMetricCard
          title="Course Progress"
          value={performanceMetrics?.courseSuccess.current || 0}
          unit="%"
          trend={performanceMetrics?.courseSuccess.trend || 0}
          predicted={performanceMetrics?.courseSuccess.predicted || 0}
          icon={<Code className="h-4 w-4" />}
          color="green"
        />

        <PerformanceMetricCard
          title="Learning Efficiency"
          value={performanceMetrics?.efficiency.current || 0}
          unit="%"
          trend={performanceMetrics?.efficiency.trend || 0}
          predicted={performanceMetrics?.efficiency.predicted || 0}
          icon={<Zap className="h-4 w-4" />}
          color="orange"
        />

        <PerformanceMetricCard
          title="Cross-Track Benefits"
          value={state.analytics?.crossTrackInsights.crossTrackBenefits.length || 0}
          unit=" insights"
          trend={2.3}
          predicted={8}
          icon={<Brain className="h-4 w-4" />}
          color="purple"
        />
      </div>

      {/* Main Analytics Tabs */}
      <Tabs
        value={state.selectedMetric}
        onValueChange={value => handleMetricChange(value as 'performance' | 'efficiency' | 'progress' | 'predictions')}
      >
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="efficiency">Efficiency</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="predictions">Predictions</TabsTrigger>
        </TabsList>

        {/* Performance Tab */}
        <TabsContent value="performance" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Performance Trend Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Activity className="h-5 w-5" />
                  Performance Trends
                </CardTitle>
                <CardDescription>Track your progress across exam and course learning</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={chartData?.performance || []}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="examScore" stroke="#3b82f6" strokeWidth={2} />
                    <Line type="monotone" dataKey="courseProgress" stroke="#10b981" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Learning Distribution */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Learning Distribution
                </CardTitle>
                <CardDescription>Time allocation across different learning activities</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <RechartsPieChart>
                    <Pie
                      data={chartData?.distribution || []}
                      cx="50%"
                      cy="50%"
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {chartData?.distribution?.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip />
                    <Legend />
                  </RechartsPieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Other tabs would be implemented similarly */}
        <TabsContent value="efficiency">
          {state.analytics && <EfficiencyAnalytics analytics={state.analytics} />}
        </TabsContent>

        <TabsContent value="progress">
          {state.analytics && <ProgressAnalytics analytics={state.analytics} />}
        </TabsContent>

        <TabsContent value="predictions">
          {state.analytics && <PredictiveAnalytics analytics={state.analytics} />}
        </TabsContent>
      </Tabs>

      {/* Weak Areas & Recommendations */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <WeakAreasSection weakAreas={state.weakAreas} />
        <RecommendationsSection recommendations={state.recommendations} />
      </div>

      {/* Cross-Track Insights */}
      {state.analytics && <CrossTrackInsights insights={state.analytics.crossTrackInsights} />}

      {/* Last Updated Timestamp */}
      {state.lastUpdated && (
        <div className="flex items-center justify-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4 mr-2" />
          Last updated: {state.lastUpdated.toLocaleString()}
        </div>
      )}
    </div>
  );
};

// ============================================================================
// PERFORMANCE METRIC CARD COMPONENT
// ============================================================================

interface PerformanceMetricCardProps {
  title: string;
  value: number;
  unit: string;
  trend: number;
  predicted: number;
  icon: React.ReactNode;
  color: 'blue' | 'green' | 'orange' | 'purple';
}

const PerformanceMetricCard: React.FC<PerformanceMetricCardProps> = ({
  title,
  value,
  unit,
  trend,
  predicted,
  icon,
  color,
}) => {
  const colorClasses = {
    blue: 'text-blue-600 bg-blue-50 border-blue-200',
    green: 'text-green-600 bg-green-50 border-green-200',
    orange: 'text-orange-600 bg-orange-50 border-orange-200',
    purple: 'text-purple-600 bg-purple-50 border-purple-200',
  };

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <div className={`p-2 rounded-full ${colorClasses[color]}`}>{icon}</div>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold">
          {value.toFixed(1)}
          {unit}
        </div>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {trend > 0 ? (
            <TrendingUp className="h-4 w-4 text-green-500" />
          ) : (
            <TrendingDown className="h-4 w-4 text-red-500" />
          )}
          <span>{Math.abs(trend).toFixed(1)}% from last period</span>
        </div>
        <div className="mt-2">
          <div className="flex items-center justify-between text-xs">
            <span>Predicted: {predicted}%</span>
            <span>{Math.round((value / predicted) * 100)}%</span>
          </div>
          <Progress value={(value / predicted) * 100} className="mt-1" />
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// SPECIALIZED ANALYTICS COMPONENTS
// ============================================================================

interface AnalyticsComponentProps {
  analytics: PerformanceAnalytics;
}

const EfficiencyAnalytics: React.FC<AnalyticsComponentProps> = ({ analytics }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Learning Efficiency Analysis</CardTitle>
        <CardDescription>Optimize your study methods for maximum effectiveness</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div className="text-center p-4 bg-blue-50 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">{analytics.examPerformance.revisionEffectiveness}%</div>
              <div className="text-sm text-blue-700">Revision Effectiveness</div>
            </div>
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <div className="text-2xl font-bold text-green-600">{analytics.coursePerformance.codingEfficiency}%</div>
              <div className="text-sm text-green-700">Coding Efficiency</div>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const ProgressAnalytics: React.FC<AnalyticsComponentProps> = ({ analytics }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Progress Tracking</CardTitle>
        <CardDescription>Monitor your advancement across all learning tracks</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Exam Preparation</span>
              <span>{analytics.examPerformance.averageScore}%</span>
            </div>
            <Progress value={analytics.examPerformance.averageScore} />
          </div>
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>Course Completion</span>
              <span>{analytics.coursePerformance.completionRate}%</span>
            </div>
            <Progress value={analytics.coursePerformance.completionRate} />
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

const PredictiveAnalytics: React.FC<AnalyticsComponentProps> = ({ analytics }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Success Predictions</CardTitle>
        <CardDescription>AI-powered forecasts for your learning outcomes</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="p-4 bg-gradient-to-r from-blue-50 to-green-50 rounded-lg">
            <div className="text-lg font-semibold">Exam Success Probability</div>
            <div className="text-3xl font-bold text-blue-600">{analytics.predictions.examSuccessProbability}%</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// WEAK AREAS & RECOMMENDATIONS COMPONENTS
// ============================================================================

interface WeakAreasSectionProps {
  weakAreas: WeakArea[];
}

const WeakAreasSection: React.FC<WeakAreasSectionProps> = ({ weakAreas }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <AlertTriangle className="h-5 w-5 text-orange-500" />
          Areas for Improvement
        </CardTitle>
        <CardDescription>Focus on these areas to maximize your learning progress</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {weakAreas.slice(0, 5).map((area, _index) => (
            <div key={area.topicId} className="flex items-center justify-between p-3 bg-orange-50 rounded-lg">
              <div>
                <div className="font-medium">{area.topicName}</div>
                <div className="text-sm text-muted-foreground">{area.subjectName}</div>
              </div>
              <div className="text-right">
                <div className="font-semibold text-orange-600">{area.weaknessScore}% weak</div>
                <Badge variant={area.trendDirection === 'improving' ? 'default' : 'destructive'}>
                  {area.trendDirection}
                </Badge>
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

interface RecommendationsSectionProps {
  recommendations: AdaptiveRecommendation[];
}

const RecommendationsSection: React.FC<RecommendationsSectionProps> = ({ recommendations }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Lightbulb className="h-5 w-5 text-yellow-500" />
          AI Recommendations
        </CardTitle>
        <CardDescription>Personalized suggestions to enhance your learning</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {recommendations.slice(0, 3).map((recommendation, _index) => (
            <div key={recommendation.id} className="p-3 bg-yellow-50 rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="font-medium">{recommendation.recommendation}</div>
                  <div className="text-sm text-muted-foreground mt-1">{recommendation.reasoning}</div>
                </div>
                <Badge variant={recommendation.priority === 'high' ? 'destructive' : 'secondary'}>
                  {recommendation.priority}
                </Badge>
              </div>
              <div className="mt-2 text-sm text-green-600">Expected impact: {recommendation.expectedImpact}</div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
};

// ============================================================================
// CROSS-TRACK INSIGHTS COMPONENT
// ============================================================================

interface CrossTrackInsightsProps {
  insights: PerformanceAnalytics['crossTrackInsights'];
}

const CrossTrackInsights: React.FC<CrossTrackInsightsProps> = ({ insights }) => {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Brain className="h-5 w-5 text-purple-500" />
          Cross-Track Learning Insights
        </CardTitle>
        <CardDescription>Discover how your exam and course learning complement each other</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Learning Transfer */}
          <div>
            <h4 className="font-semibold mb-3">Learning Transfer</h4>
            <div className="space-y-2">
              {insights.learningTransfer.slice(0, 3).map((transfer, index) => (
                <div key={index} className="flex items-center justify-between p-2 bg-purple-50 rounded">
                  <span className="text-sm">{transfer.transferredSkill}</span>
                  <Badge variant="outline">{transfer.effectivenessScore}% effective</Badge>
                </div>
              ))}
            </div>
          </div>

          {/* Skill Synergies */}
          <div>
            <h4 className="font-semibold mb-3">Skill Synergies</h4>
            <div className="space-y-2">
              {insights.skillSynergy.slice(0, 3).map((synergy, index) => (
                <div key={index} className="p-2 bg-blue-50 rounded">
                  <div className="text-sm font-medium">
                    {synergy.examSkill} ↔ {synergy.techSkill}
                  </div>
                  <div className="text-xs text-muted-foreground">Synergy: {synergy.synergyStrength}%</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default AnalyticsDashboard;
