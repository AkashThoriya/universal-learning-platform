'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Clock,
  Target,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  PieChart,
  Users,
  Lightbulb,
  Award,
  Flame,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart as RechartsPieChart,
  Cell,
  BarChart,
  Bar,
  Pie,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils/utils';
import { JourneyAnalytics as JourneyAnalyticsType, UserJourney } from '@/types/journey';

interface JourneyAnalyticsProps {
  journey: UserJourney;
  analytics?: JourneyAnalyticsType;
  className?: string;
}

interface ChartDataPoint {
  week: string;
  hours: number;
  goals: number;
  completion: number;
}

export default function JourneyAnalytics({ journey, analytics, className }: JourneyAnalyticsProps) {
  const [chartData, setChartData] = useState<ChartDataPoint[]>([]);

  useEffect(() => {
    // Generate chart data from weekly progress
    const data = journey.progressTracking.weeklyProgress.map((week, index) => ({
      week: `Week ${index + 1}`,
      hours: week.hoursStudied,
      goals: week.goalsAdvanced?.length ?? 0,
      completion: Math.min(100, (index + 1) * 15), // Mock progression
    }));
    setChartData(data);
  }, [journey]);

  const completedGoals = journey.customGoals.filter(goal => goal.currentValue >= goal.targetValue).length;
  const totalGoals = journey.customGoals.length;
  const overallProgress = journey.progressTracking.overallCompletion;

  // Mock analytics if not provided
  const analyticsData = analytics || {
    journeyId: journey.id,
    completionRate: overallProgress,
    averageWeeklyHours: chartData.reduce((acc, week) => acc + week.hours, 0) / Math.max(chartData.length, 1),
    goalCompletionVelocity: completedGoals / Math.max(chartData.length, 1),
    predictedCompletionDate: new Date(Date.now() + (100 - overallProgress) * 24 * 60 * 60 * 1000),
    riskFactors: overallProgress < 30 ? ['Behind schedule', 'Low engagement'] : [],
    recommendations: [
      'Increase daily study time by 30 minutes',
      'Focus on practice tests',
      'Review weak areas identified in assessments',
    ],
    comparisonWithSimilarUsers: {
      percentile: Math.min(95, Math.max(5, 40 + overallProgress / 2)),
      averageCompletionTime: 90,
    },
  };

  const riskLevel =
    analyticsData.riskFactors.length > 2 ? 'high' : analyticsData.riskFactors.length > 0 ? 'medium' : 'low';

  const goalCategoryData = journey.customGoals.reduce(
    (acc, goal) => {
      acc[goal.category] = (acc[goal.category] || 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  const pieData = Object.entries(goalCategoryData).map(([category, count]) => ({
    name: category,
    value: count,
    color:
      {
        knowledge: '#3B82F6',
        skill: '#10B981',
        speed: '#F59E0B',
        accuracy: '#8B5CF6',
        consistency: '#F97316',
      }[category] ?? '#6B7280',
  }));

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Journey Analytics</h3>
          <p className="text-sm text-gray-600">Insights and performance analysis for your learning journey</p>
        </div>
        <Badge
          className={cn(
            'text-sm',
            riskLevel === 'low' && 'bg-green-100 text-green-700',
            riskLevel === 'medium' && 'bg-yellow-100 text-yellow-700',
            riskLevel === 'high' && 'bg-red-100 text-red-700'
          )}
        >
          {riskLevel === 'low' && '🟢'}
          {riskLevel === 'medium' && '🟡'}
          {riskLevel === 'high' && '🔴'}
          {riskLevel} risk
        </Badge>
      </div>

      {/* Key Metrics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Completion Rate</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.completionRate}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                    <span className="text-sm text-green-600">On track</span>
                  </div>
                </div>
                <BarChart3 className="h-8 w-8 text-blue-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Weekly Hours</p>
                  <p className="text-2xl font-bold text-gray-900">{Math.round(analyticsData.averageWeeklyHours)}h</p>
                  <div className="flex items-center mt-2">
                    <Clock className="h-4 w-4 text-blue-500 mr-1" />
                    <span className="text-sm text-blue-600">Average</span>
                  </div>
                </div>
                <Clock className="h-8 w-8 text-green-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.3 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Goal Velocity</p>
                  <p className="text-2xl font-bold text-gray-900">{analyticsData.goalCompletionVelocity.toFixed(1)}</p>
                  <div className="flex items-center mt-2">
                    <Target className="h-4 w-4 text-purple-500 mr-1" />
                    <span className="text-sm text-purple-600">goals/week</span>
                  </div>
                </div>
                <Target className="h-8 w-8 text-purple-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.4 }}>
          <Card>
            <CardContent className="pt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600">Percentile</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {analyticsData.comparisonWithSimilarUsers?.percentile ?? 0}th
                  </p>
                  <div className="flex items-center mt-2">
                    <Users className="h-4 w-4 text-orange-500 mr-1" />
                    <span className="text-sm text-orange-600">vs peers</span>
                  </div>
                </div>
                <Users className="h-8 w-8 text-orange-500" />
              </div>
            </CardContent>
          </Card>
        </motion.div>
      </div>

      {/* Charts and Analytics */}
      <Tabs defaultValue="progress" className="space-y-4">
        <TabsList className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-4 p-1 bg-muted/50 rounded-xl">
          {' '}
          {/* Added bg and rounded */}
          <TabsTrigger value="progress" className="snap-start flex-1 min-w-[100px]">
            Progress
          </TabsTrigger>{' '}
          {/* Added snap-start */}
          <TabsTrigger value="goals" className="snap-start flex-1 min-w-[100px]">
            Goals
          </TabsTrigger>
          <TabsTrigger value="insights" className="snap-start flex-1 min-w-[100px]">
            Insights
          </TabsTrigger>
          <TabsTrigger value="comparison" className="snap-start flex-1 min-w-[100px]">
            Comparison
          </TabsTrigger>
        </TabsList>

        <TabsContent value="progress" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Progress Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5" />
                  Progress Over Time
                </CardTitle>
                <CardDescription>Your weekly learning progress and completion rate</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Area type="monotone" dataKey="completion" stroke="#3B82F6" fill="#3B82F6" fillOpacity={0.1} />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            {/* Study Hours Chart */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  Study Hours
                </CardTitle>
                <CardDescription>Weekly study time distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="week" />
                      <YAxis />
                      <Tooltip />
                      <Bar dataKey="hours" fill="#10B981" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Progress Summary */}
          <Card>
            <CardHeader>
              <CardTitle>Progress Summary</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Overall Progress</span>
                    <span className="text-sm font-medium">{overallProgress}%</span>
                  </div>
                  <Progress value={overallProgress} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Goals Completed</span>
                    <span className="text-sm font-medium">
                      {completedGoals}/{totalGoals}
                    </span>
                  </div>
                  <Progress value={totalGoals > 0 ? (completedGoals / totalGoals) * 100 : 0} />
                </div>
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-600">Time Remaining</span>
                    <span className="text-sm font-medium">
                      {Math.max(
                        0,
                        Math.ceil((journey.targetCompletionDate.getTime() - Date.now()) / (1000 * 60 * 60 * 24))
                      )}{' '}
                      days
                    </span>
                  </div>
                  <Progress
                    value={Math.min(
                      100,
                      100 -
                        ((journey.targetCompletionDate.getTime() - Date.now()) /
                          (journey.targetCompletionDate.getTime() - journey.createdAt.getTime())) *
                          100
                    )}
                  />
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="goals" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Goal Categories */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <PieChart className="h-5 w-5" />
                  Goal Categories
                </CardTitle>
                <CardDescription>Distribution of your learning goals by category</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="h-64">
                  <ResponsiveContainer width="100%" height="100%">
                    <RechartsPieChart>
                      <Pie
                        data={pieData}
                        cx="50%"
                        cy="50%"
                        innerRadius={40}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {pieData.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} />
                        ))}
                      </Pie>
                      <Tooltip />
                    </RechartsPieChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-4 space-y-2">
                  {pieData.map(entry => (
                    <div key={entry.name} className="flex items-center gap-2 text-sm">
                      <div className="w-3 h-3 rounded-full" style={{ backgroundColor: entry.color }} />
                      <span className="capitalize">{entry.name}</span>
                      <span className="text-gray-500">({entry.value})</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Goal Performance */}
            <Card>
              <CardHeader>
                <CardTitle>Goal Performance</CardTitle>
                <CardDescription>Individual goal progress and achievements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {journey.customGoals.slice(0, 5).map(goal => {
                  const progress = Math.min((goal.currentValue / goal.targetValue) * 100, 100);
                  const isCompleted = goal.currentValue >= goal.targetValue;

                  return (
                    <div key={goal.id} className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {isCompleted ? (
                            <CheckCircle className="h-4 w-4 text-green-500" />
                          ) : (
                            <div className="h-4 w-4 rounded-full border-2 border-gray-300" />
                          )}
                          <span className="text-sm font-medium break-words">{goal.title}</span>
                        </div>
                        <span className="text-sm text-gray-500">{Math.round(progress)}%</span>
                      </div>
                      <Progress value={progress} className="h-2" />
                    </div>
                  );
                })}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Risk Factors */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-orange-500" />
                  Risk Factors
                </CardTitle>
                <CardDescription>Areas that might need attention</CardDescription>
              </CardHeader>
              <CardContent>
                {analyticsData.riskFactors.length > 0 ? (
                  <div className="space-y-3">
                    {analyticsData.riskFactors.map((risk, index) => (
                      <div key={index} className="flex items-center gap-3 p-3 bg-orange-50 rounded-lg">
                        <AlertTriangle className="h-4 w-4 text-orange-500 flex-shrink-0" />
                        <span className="text-sm text-orange-800">{risk}</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="text-center py-8">
                    <CheckCircle className="h-12 w-12 text-green-500 mx-auto mb-4" />
                    <p className="text-green-700 font-medium">All Good! 🎉</p>
                    <p className="text-sm text-green-600 mt-1">No risk factors identified</p>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Recommendations */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lightbulb className="h-5 w-5 text-blue-500" />
                  Recommendations
                </CardTitle>
                <CardDescription>Suggestions to improve your progress</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {analyticsData.recommendations.map((recommendation, index) => (
                    <div key={index} className="flex items-start gap-3 p-3 bg-blue-50 rounded-lg">
                      <Lightbulb className="h-4 w-4 text-blue-500 flex-shrink-0 mt-0.5" />
                      <span className="text-sm text-blue-800">{recommendation}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Milestones */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-yellow-500" />
                Recent Milestones
              </CardTitle>
              <CardDescription>Your achievements and progress milestones</CardDescription>
            </CardHeader>
            <CardContent>
              {journey.progressTracking.milestoneAchievements.length > 0 ? (
                <div className="space-y-3">
                  {journey.progressTracking.milestoneAchievements.slice(0, 5).map(milestone => (
                    <div key={milestone.id} className="flex items-start gap-3 p-3 bg-yellow-50 rounded-lg">
                      <Award className="h-4 w-4 text-yellow-500 flex-shrink-0 mt-0.5" />
                      <div className="flex-1">
                        <p className="text-sm font-medium text-yellow-800">{milestone.title}</p>
                        <p className="text-xs text-yellow-600 mt-1">{milestone.description}</p>
                        <p className="text-xs text-yellow-500 mt-1">{milestone.achievedAt.toLocaleDateString()}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-8">
                  <Award className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500">No milestones yet</p>
                  <p className="text-sm text-gray-400 mt-1">Keep working towards your goals!</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="comparison" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                Peer Comparison
              </CardTitle>
              <CardDescription>See how you compare with other learners on similar journeys</CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-blue-50 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600 mb-2">
                    {analyticsData.comparisonWithSimilarUsers?.percentile ?? 0}th
                  </div>
                  <div className="text-sm text-blue-700">Percentile</div>
                  <div className="text-xs text-blue-600 mt-1">
                    Better than {analyticsData.comparisonWithSimilarUsers?.percentile ?? 0}% of learners
                  </div>
                </div>

                <div className="text-center p-4 bg-green-50 rounded-lg">
                  <div className="text-2xl font-bold text-green-600 mb-2">
                    {Math.round(analyticsData.averageWeeklyHours)}h
                  </div>
                  <div className="text-sm text-green-700">Weekly Hours</div>
                  <div className="text-xs text-green-600 mt-1">vs 12h average</div>
                </div>

                <div className="text-center p-4 bg-purple-50 rounded-lg">
                  <div className="text-2xl font-bold text-purple-600 mb-2">
                    {analyticsData.comparisonWithSimilarUsers?.averageCompletionTime ?? 90}d
                  </div>
                  <div className="text-sm text-purple-700">Est. Completion</div>
                  <div className="text-xs text-purple-600 mt-1">vs 120d average</div>
                </div>
              </div>

              <div className="space-y-4">
                <h4 className="font-medium text-gray-900">Performance Indicators</h4>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Flame className="h-4 w-4 text-orange-500" />
                      <span className="text-sm">Consistency</span>
                    </div>
                    <Badge
                      className={cn(
                        overallProgress > 70
                          ? 'bg-green-100 text-green-700'
                          : overallProgress > 40
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      )}
                    >
                      {overallProgress > 70 ? 'High' : overallProgress > 40 ? 'Medium' : 'Low'}
                    </Badge>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4 text-blue-500" />
                      <span className="text-sm">Learning Velocity</span>
                    </div>
                    <Badge
                      className={cn(
                        analyticsData.goalCompletionVelocity > 1
                          ? 'bg-green-100 text-green-700'
                          : analyticsData.goalCompletionVelocity > 0.5
                            ? 'bg-yellow-100 text-yellow-700'
                            : 'bg-red-100 text-red-700'
                      )}
                    >
                      {analyticsData.goalCompletionVelocity > 1
                        ? 'Fast'
                        : analyticsData.goalCompletionVelocity > 0.5
                          ? 'Steady'
                          : 'Slow'}
                    </Badge>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
