/**
 * @fileoverview Learning Analytics Dashboard Component
 *
 * Comprehensive analytics dashboard for the Universal Learning Platform
 * showing insights across exam preparation and custom learning goals.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  Brain,
  CheckCircle,
  Clock,
  Flame,
  Lightbulb,
  Target,
  TrendingUp,
  Trophy,
  Users,
  Zap,
} from 'lucide-react';
import { useEffect, useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import {
  universalLearningAnalytics,
  type UnifiedLearningProgress,
  type LearningInsights,
  type PerformanceComparison,
} from '@/lib/analytics/universal-learning-analytics';

interface LearningAnalyticsDashboardProps {
  className?: string;
}

/**
 * Learning Analytics Dashboard Component
 */
export default function LearningAnalyticsDashboard({ className }: LearningAnalyticsDashboardProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [unifiedProgress, setUnifiedProgress] = useState<UnifiedLearningProgress | null>(null);
  const [insights, setInsights] = useState<LearningInsights | null>(null);
  const [comparison, setComparison] = useState<PerformanceComparison | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const loadAnalyticsData = async () => {
      if (!user?.uid) {
        return;
      }

      try {
        setLoading(true);
        setError(null);

        // Load all analytics data in parallel
        const [progressResult, insightsResult, comparisonResult] = await Promise.all([
          universalLearningAnalytics.getUnifiedProgress(user.uid),
          universalLearningAnalytics.getLearningInsights(user.uid),
          universalLearningAnalytics.getPerformanceComparison(user.uid),
        ]);

        if (progressResult.success) {
          setUnifiedProgress(progressResult.data);
        }

        if (insightsResult.success) {
          setInsights(insightsResult.data);
        }

        if (comparisonResult.success) {
          setComparison(comparisonResult.data);
        }

        // Check for any errors
        const errors = [progressResult, insightsResult, comparisonResult]
          .filter(result => !result.success)
          .map(result => result.error?.message)
          .filter(Boolean);

        if (errors.length > 0) {
          setError(`Some data could not be loaded: ${errors.join(', ')}`);
        }
      } catch (err) {
        setError('Failed to load analytics data');
        console.error('Analytics loading error:', err);
      } finally {
        setLoading(false);
      }
    };

    loadAnalyticsData();
  }, [user]);

  if (!user) {
    return (
      <Card className="w-full">
        <CardContent className="text-center py-8">
          <p className="text-gray-600">Please log in to view your learning analytics.</p>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return (
      <Card className="w-full min-h-[600px] flex items-center justify-center">
        <CardContent className="text-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
          <p className="text-gray-600">Loading your learning analytics...</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Error Alert */}
      {error && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertDescription className="text-amber-800">{error}</AlertDescription>
        </Alert>
      )}

      {/* Page Header */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
        className="text-center space-y-2"
      >
        <h1 className="text-3xl font-bold text-gray-900 flex items-center justify-center gap-2">
          <BarChart3 className="h-8 w-8 text-blue-600" />
          Learning Analytics
        </h1>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Comprehensive insights across your exam preparation and custom learning goals
        </p>
      </motion.div>

      {/* Main Analytics Tabs */}
      <Tabs defaultValue="overview" className="w-full">
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="progress">Progress</TabsTrigger>
          <TabsTrigger value="insights">Insights</TabsTrigger>
          <TabsTrigger value="comparison">Performance</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          {unifiedProgress && <OverviewSection progress={unifiedProgress} />}
          {insights && <QuickInsightsSection insights={insights} />}
        </TabsContent>

        {/* Progress Tab */}
        <TabsContent value="progress" className="space-y-6">
          {unifiedProgress && <DetailedProgressSection progress={unifiedProgress} />}
        </TabsContent>

        {/* Insights Tab */}
        <TabsContent value="insights" className="space-y-6">
          {insights && <LearningInsightsSection insights={insights} />}
        </TabsContent>

        {/* Performance Tab */}
        <TabsContent value="comparison" className="space-y-6">
          {comparison && <PerformanceComparisonSection comparison={comparison} />}
        </TabsContent>
      </Tabs>
    </div>
  );
}

/**
 * Overview Section Component
 */
function OverviewSection({ progress }: { progress: UnifiedLearningProgress }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
    >
      {/* Total Learning Time */}
      <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            <Clock className="h-4 w-4" />
            Total Learning Time
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            {Math.floor(progress.unified.totalLearningTime / 60)}h {progress.unified.totalLearningTime % 60}m
          </div>
          <p className="text-xs opacity-80 mt-1">Across all tracks</p>
        </CardContent>
      </Card>

      {/* Learning Streak */}
      <Card className="bg-gradient-to-br from-orange-500 to-red-500 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            <Flame className="h-4 w-4" />
            Learning Streak
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress.unified.learningStreak} days</div>
          <p className="text-xs opacity-80 mt-1">Keep it going! 🔥</p>
        </CardContent>
      </Card>

      {/* Overall Progress */}
      <Card className="bg-gradient-to-br from-green-500 to-emerald-500 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            <Target className="h-4 w-4" />
            Overall Progress
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{Math.round(progress.unified.overallProgress)}%</div>
          <Progress value={progress.unified.overallProgress} className="mt-2 bg-white/20" />
        </CardContent>
      </Card>

      {/* Active Goals */}
      <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
        <CardHeader className="pb-3">
          <CardTitle className="text-sm font-medium opacity-90 flex items-center gap-2">
            <Zap className="h-4 w-4" />
            Active Goals
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">{progress.customLearning.activeGoals}</div>
          <p className="text-xs opacity-80 mt-1">Custom learning paths</p>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Quick Insights Section Component
 */
function QuickInsightsSection({ insights }: { insights: LearningInsights }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.2 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold flex items-center gap-2">
        <Lightbulb className="h-5 w-5 text-yellow-500" />
        Quick Insights
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Progress Trends */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <TrendingUp className="h-5 w-5 text-green-500" />
              Progress Trends
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Trend</span>
              <Badge variant={insights.progressInsights.trend === 'improving' ? 'default' : 'secondary'}>
                {insights.progressInsights.trend} {insights.progressInsights.trendPercentage > 0 ? '+' : ''}
                {insights.progressInsights.trendPercentage}%
              </Badge>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Consistency</span>
              <span className="font-medium">{insights.progressInsights.consistencyScore}%</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Efficiency</span>
              <span className="font-medium">{insights.progressInsights.efficiencyScore}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Learning Patterns */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Brain className="h-5 w-5 text-purple-500" />
              Learning Patterns
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Best Time</span>
              <span className="font-medium capitalize">{insights.learningPatterns.mostProductiveTime}</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Avg Session</span>
              <span className="font-medium">{insights.learningPatterns.averageSessionLength} min</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Learning Velocity</span>
              <span className="font-medium">{insights.learningPatterns.learningVelocity} topics/week</span>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Personalized Recommendations</CardTitle>
          <CardDescription>Action items to improve your learning efficiency</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {insights.recommendations.slice(0, 3).map((rec, index) => (
              <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                <div
                  className={`p-1 rounded-full ${
                    rec.priority === 'high'
                      ? 'bg-red-100 text-red-600'
                      : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-green-100 text-green-600'
                  }`}
                >
                  <Lightbulb className="h-4 w-4" />
                </div>
                <div className="flex-1">
                  <h4 className="font-medium text-sm">{rec.title}</h4>
                  <p className="text-xs text-gray-600 mt-1">{rec.description}</p>
                </div>
                {rec.actionable && (
                  <Button size="sm" variant="outline">
                    Apply
                  </Button>
                )}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Detailed Progress Section Component
 */
function DetailedProgressSection({ progress }: { progress: UnifiedLearningProgress }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold">Detailed Progress Analysis</h2>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Exam Preparation Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-blue-500" />
              Exam Preparation
            </CardTitle>
            <CardDescription>Traditional exam preparation metrics</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Study Time</span>
                <span>
                  {Math.floor(progress.examPreparation.totalStudyTime / 60)}h{' '}
                  {progress.examPreparation.totalStudyTime % 60}m
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Completed Sessions</span>
                <span>{progress.examPreparation.completedSessions}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Current Streak</span>
                <span>{progress.examPreparation.currentStreak} days</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Weekly Goal</span>
                <span>{Math.round(progress.examPreparation.weeklyGoalProgress)}%</span>
              </div>
              <Progress value={progress.examPreparation.weeklyGoalProgress} className="mt-2" />
            </div>
          </CardContent>
        </Card>

        {/* Custom Learning Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-purple-500" />
              Custom Learning
            </CardTitle>
            <CardDescription>Personal skill development progress</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Active Goals</span>
                <span>{progress.customLearning.activeGoals}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Completed Goals</span>
                <span>{progress.customLearning.completedGoals}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Learning Hours</span>
                <span>{Math.round(progress.customLearning.totalLearningHours)}h</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Avg Completion</span>
                <span>{Math.round(progress.customLearning.averageCompletionRate)}%</span>
              </div>
              <Progress value={progress.customLearning.averageCompletionRate} className="mt-2" />
            </div>

            {/* Skill Categories */}
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Skill Categories</h4>
              <div className="flex flex-wrap gap-1">
                {progress.customLearning.skillCategories.map((category, index) => (
                  <Badge key={index} variant="secondary" className="text-xs">
                    {category}
                  </Badge>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Weekly Progress */}
      <Card>
        <CardHeader>
          <CardTitle>Weekly Learning Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Weekly Target</span>
              <span className="font-medium">{Math.floor(progress.unified.weeklyTarget / 60)}h</span>
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600">Achieved</span>
              <span className="font-medium">{Math.floor(progress.unified.weeklyAchieved / 60)}h</span>
            </div>
            <Progress
              value={(progress.unified.weeklyAchieved / progress.unified.weeklyTarget) * 100}
              className="mt-2"
            />
            <div className="flex flex-wrap gap-2 mt-4">
              {progress.unified.strengthAreas.map((area, index) => (
                <Badge key={index} variant="default" className="text-xs">
                  💪 {area}
                </Badge>
              ))}
              {progress.unified.improvementAreas.map((area, index) => (
                <Badge key={index} variant="outline" className="text-xs">
                  📈 {area}
                </Badge>
              ))}
            </div>
          </div>
        </CardContent>
      </Card>
    </motion.div>
  );
}

/**
 * Learning Insights Section Component
 */
function LearningInsightsSection({ insights }: { insights: LearningInsights }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold">Learning Insights & Recommendations</h2>

      {/* All Recommendations */}
      <Card>
        <CardHeader>
          <CardTitle>Personalized Recommendations</CardTitle>
          <CardDescription>AI-powered suggestions to optimize your learning</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {insights.recommendations.map((rec, index) => (
              <div key={index} className="flex items-start gap-4 p-4 border rounded-lg">
                <div
                  className={`p-2 rounded-full ${
                    rec.priority === 'high'
                      ? 'bg-red-100 text-red-600'
                      : rec.priority === 'medium'
                        ? 'bg-yellow-100 text-yellow-600'
                        : 'bg-green-100 text-green-600'
                  }`}
                >
                  <Lightbulb className="h-5 w-5" />
                </div>
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <h4 className="font-medium">{rec.title}</h4>
                    <Badge
                      variant={
                        rec.priority === 'high' ? 'destructive' : rec.priority === 'medium' ? 'default' : 'secondary'
                      }
                    >
                      {rec.priority}
                    </Badge>
                  </div>
                  <p className="text-sm text-gray-600">{rec.description}</p>
                </div>
                {rec.actionable && <Button variant="outline">Apply</Button>}
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Achievements */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Recent Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-yellow-500" />
              Recent Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.achievements.recent.map((achievement, index) => (
                <div key={index} className="flex items-center gap-3 p-3 bg-yellow-50 rounded-lg">
                  <span className="text-2xl">{achievement.icon}</span>
                  <div>
                    <h4 className="font-medium text-sm">{achievement.title}</h4>
                    <p className="text-xs text-gray-600">{achievement.description}</p>
                    <p className="text-xs text-gray-500">{achievement.earnedAt.toLocaleDateString()}</p>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Upcoming Achievements */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Upcoming Achievements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {insights.achievements.upcoming.map((achievement, index) => (
                <div key={index} className="space-y-2">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium text-sm">{achievement.title}</h4>
                    <span className="text-xs text-gray-500">
                      {achievement.progress}/{achievement.target}
                    </span>
                  </div>
                  <Progress value={(achievement.progress / achievement.target) * 100} />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}

/**
 * Performance Comparison Section Component
 */
function PerformanceComparisonSection({ comparison }: { comparison: PerformanceComparison }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5, delay: 0.1 }}
      className="space-y-6"
    >
      <h2 className="text-xl font-semibold">Performance Comparison</h2>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Personal Best */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-gold-500" />
              Personal Best
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Longest Streak</span>
              <span className="font-medium">{comparison.personalBest.longestStreak} days</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Best Weekly Score</span>
              <span className="font-medium">{comparison.personalBest.bestWeeklyScore}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Most Productive Day</span>
              <span className="font-medium">{comparison.personalBest.mostProductiveDay}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Highest Accuracy</span>
              <span className="font-medium">{comparison.personalBest.highestAccuracy}%</span>
            </div>
          </CardContent>
        </Card>

        {/* Current Goals */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Target className="h-5 w-5 text-blue-500" />
              Current Goals
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Weekly Target</span>
              <span className="font-medium">{Math.floor(comparison.goals.weeklyTarget / 60)}h</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Monthly Target</span>
              <span className="font-medium">{Math.floor(comparison.goals.monthlyTarget / 60)}h</span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Yearly Goals</h4>
              {comparison.goals.yearlyGoals.map((goal, index) => (
                <div key={index} className="space-y-1">
                  <div className="flex justify-between text-xs">
                    <span>{goal}</span>
                    <span>{comparison.goals.progress[goal] || 0}%</span>
                  </div>
                  <Progress value={comparison.goals.progress[goal] || 0} className="h-2" />
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Benchmarks */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5 text-green-500" />
              Benchmarks
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Avg Study Time</span>
              <span className="font-medium">{Math.floor(comparison.benchmarks.averageStudyTime / 60)}h/week</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm text-gray-600">Typical Progress</span>
              <span className="font-medium">{comparison.benchmarks.typicalProgress}%</span>
            </div>
            <div className="space-y-2">
              <h4 className="text-sm font-medium">Common Milestones</h4>
              <div className="space-y-1">
                {comparison.benchmarks.commonMilestones.map((milestone, index) => (
                  <div key={index} className="text-xs text-gray-600 flex items-center gap-1">
                    <CheckCircle className="h-3 w-3 text-green-500" />
                    {milestone}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </motion.div>
  );
}
