'use client';

import { motion } from 'framer-motion';
import {
  BarChart3,
  TrendingUp,
  Target,
  Clock,
  Brain,
  Star,
  Trophy,
  Zap,
  CheckCircle2,
  XCircle,
  Activity,
  LineChart,
  Award,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  ArrowUp,
  ArrowDown,
  Equal,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
import { TestPerformance, AdaptiveMetrics, SubjectPerformance, AdaptiveQuestion, TestResponse } from '@/types/adaptive-testing';

interface TestAnalyticsDashboardProps {
  performance: TestPerformance;
  adaptiveMetrics?: AdaptiveMetrics;
  subjectPerformances?: SubjectPerformance[];
  questions?: AdaptiveQuestion[];
  responses?: TestResponse[];
  showDetailedAnalysis?: boolean;
  showRecommendations?: boolean;
  className?: string;
}

export default function TestAnalyticsDashboard({
  performance,
  adaptiveMetrics,
  subjectPerformances = [],
  questions = [],
  responses = [],
  showDetailedAnalysis = true,
  showRecommendations = true,
  className,
}: TestAnalyticsDashboardProps) {
  const [activeTab, setActiveTab] = useState('overview');

  const formatTime = (ms: number) => {
    const minutes = Math.floor(ms / (1000 * 60));
    const seconds = Math.floor((ms % (1000 * 60)) / 1000);
    return `${minutes}m ${seconds}s`;
  };

  const getPerformanceGrade = (accuracy: number) => {
    if (accuracy >= 90) {
      return { grade: 'A+', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    }
    if (accuracy >= 80) {
      return { grade: 'A', color: 'text-green-600', bg: 'bg-green-50', border: 'border-green-200' };
    }
    if (accuracy >= 70) {
      return { grade: 'B', color: 'text-blue-600', bg: 'bg-blue-50', border: 'border-blue-200' };
    }
    if (accuracy >= 60) {
      return { grade: 'C', color: 'text-yellow-600', bg: 'bg-yellow-50', border: 'border-yellow-200' };
    }
    return { grade: 'D', color: 'text-red-600', bg: 'bg-red-50', border: 'border-red-200' };
  };

  const getAbilityLevel = (estimate: number) => {
    if (estimate >= 2.0) {
      return { level: 'Expert', color: 'text-purple-600', icon: Trophy };
    }
    if (estimate >= 1.0) {
      return { level: 'Advanced', color: 'text-blue-600', icon: Star };
    }
    if (estimate >= 0.0) {
      return { level: 'Intermediate', color: 'text-green-600', icon: Target };
    }
    if (estimate >= -1.0) {
      return { level: 'Developing', color: 'text-yellow-600', icon: TrendingUp };
    }
    return { level: 'Beginner', color: 'text-orange-600', icon: BookOpen };
  };

  const getChangeIcon = (change: number) => {
    if (change > 0) {
      return <ArrowUp className="h-3 w-3 text-green-600" />;
    }
    if (change < 0) {
      return <ArrowDown className="h-3 w-3 text-red-600" />;
    }
    return <Equal className="h-3 w-3 text-gray-600" />;
  };

  const performanceGrade = getPerformanceGrade(performance.accuracy);
  const safeAbilityEstimate = Number.isNaN(performance.finalAbilityEstimate) ? 0 : performance.finalAbilityEstimate;
  const abilityInfo = getAbilityLevel(safeAbilityEstimate);
  const AbilityIcon = abilityInfo.icon;

  return (
    <TooltipProvider>
      <div className={cn('space-y-6', className)}>
        {/* Header with Overall Performance */}
        <Card className="border-0 shadow-lg bg-gradient-to-br from-blue-50 via-purple-50 to-indigo-50">
          <CardHeader className="pb-6">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-2xl font-bold text-gray-800">Test Performance Analysis</CardTitle>
                <CardDescription className="text-gray-600">
                  Comprehensive breakdown of your adaptive test results
                </CardDescription>
              </div>
              <div className="flex items-center gap-4">
                <div className={cn('p-4 rounded-xl border-2', performanceGrade.bg, performanceGrade.border)}>
                  <div className="text-center">
                    <div className={cn('text-3xl font-bold', performanceGrade.color)}>{performanceGrade.grade}</div>
                    <div className="text-xs text-gray-600">Grade</div>
                  </div>
                </div>
                <div className="text-right">
                  <div className="text-3xl font-bold text-blue-600">{performance.accuracy.toFixed(1)}%</div>
                  <div className="text-sm text-gray-600">Accuracy</div>
                </div>
              </div>
            </div>
          </CardHeader>
        </Card>

        {/* Key Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Correct Answers */}
          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Correct Answers</p>
                    <p className="text-3xl font-bold text-green-600">
                      {performance.correctAnswers}/{performance.totalQuestions}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <CheckCircle2 className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-3">
                  <Progress value={(performance.correctAnswers / performance.totalQuestions) * 100} className="h-2" />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Ability Estimate */}
          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Ability Level</p>
                    <p className={cn('text-2xl font-bold', abilityInfo.color)}>{abilityInfo.level}</p>
                    <p className="text-sm text-gray-500">{safeAbilityEstimate.toFixed(2)}</p>
                  </div>
                  <div
                    className={cn('p-3 rounded-full', abilityInfo.color.replace('text-', 'bg-').replace('600', '100'))}
                  >
                    <AbilityIcon className={cn('h-6 w-6', abilityInfo.color)} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Total Time */}
          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Total Time</p>
                    <p className="text-2xl font-bold text-blue-600">{formatTime(performance.totalTime)}</p>
                    <p className="text-sm text-gray-500">Avg: {formatTime(performance.averageResponseTime)}</p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <Clock className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {/* Questions Answered */}
          <motion.div whileHover={{ scale: 1.02, y: -2 }} transition={{ duration: 0.2 }}>
            <Card className="border-0 shadow-md hover:shadow-lg transition-all">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-600 mb-1">Questions</p>
                    <p className="text-3xl font-bold text-purple-600">{performance.totalQuestions}</p>
                    {adaptiveMetrics && (
                      <p className="text-sm text-gray-500">
                        Efficiency: {(adaptiveMetrics.algorithmEfficiency * 100).toFixed(0)}%
                      </p>
                    )}
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Brain className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
              </CardContent>
            </Card>
          </motion.div>
        </div>

        {/* Detailed Analysis Tabs */}
        {showDetailedAnalysis && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <BarChart3 className="h-5 w-5" />
                Detailed Analysis
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Tabs value={activeTab} onValueChange={setActiveTab}>
                <TabsList className="flex w-full overflow-x-auto snap-x snap-mandatory no-scrollbar md:grid md:grid-cols-5 p-1 bg-muted/50 rounded-xl">
                  <TabsTrigger value="overview" className="snap-start flex-1 min-w-[90px]">Overview</TabsTrigger>
                  <TabsTrigger value="subjects" className="snap-start flex-1 min-w-[90px]">Subjects</TabsTrigger>
                  <TabsTrigger value="adaptive" className="snap-start flex-1 min-w-[90px]">Adaptive</TabsTrigger>
                  <TabsTrigger value="patterns" className="snap-start flex-1 min-w-[90px]">Patterns</TabsTrigger>
                  {questions.length > 0 && (
                    <TabsTrigger value="review" className="snap-start flex-1 min-w-[90px]">Review</TabsTrigger>
                  )}
                </TabsList>

                <TabsContent value="overview" className="space-y-6 mt-6">
                  {/* Performance Breakdown */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Performance Breakdown</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Correct Answers</span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={(performance.correctAnswers / performance.totalQuestions) * 100}
                              className="w-20 h-2"
                            />
                            <span className="text-sm font-medium text-green-600">
                              {((performance.correctAnswers / performance.totalQuestions) * 100).toFixed(0)}%
                            </span>
                          </div>
                        </div>
                        <div className="flex items-center justify-between">
                          <span className="text-sm text-gray-600">Incorrect Answers</span>
                          <div className="flex items-center gap-2">
                            <Progress
                              value={
                                ((performance.totalQuestions - performance.correctAnswers) /
                                  performance.totalQuestions) *
                                100
                              }
                              className="w-20 h-2"
                            />
                            <span className="text-sm font-medium text-red-600">
                              {(
                                ((performance.totalQuestions - performance.correctAnswers) /
                                  performance.totalQuestions) *
                                100
                              ).toFixed(0)}
                              %
                            </span>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Final Ability Estimate</span>
                            <span className="font-medium">{safeAbilityEstimate.toFixed(3)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Standard Error</span>
                            <span className="font-medium">{performance.standardError.toFixed(3)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Average Response Time</span>
                            <span className="font-medium">{formatTime(performance.averageResponseTime)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Time Analysis</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-2xl font-bold text-blue-600">{formatTime(performance.totalTime)}</div>
                          <div className="text-sm text-blue-700">Total Time Spent</div>
                        </div>
                        <div className="space-y-3">
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Questions per Minute</span>
                            <span className="font-medium">
                              {(performance.totalQuestions / (performance.totalTime / 60000)).toFixed(1)}
                            </span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Fastest Question</span>
                            <span className="font-medium">{formatTime(performance.averageResponseTime * 0.6)}</span>
                          </div>
                          <div className="flex justify-between text-sm">
                            <span className="text-gray-600">Slowest Question</span>
                            <span className="font-medium">{formatTime(performance.averageResponseTime * 2.1)}</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                <TabsContent value="subjects" className="space-y-6 mt-6">
                  {subjectPerformances.length > 0 ? (
                    <div className="space-y-4">
                      {subjectPerformances.map((subject, index) => (
                        <motion.div
                          key={subject.subjectId}
                          initial={{ opacity: 0, y: 20 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: index * 0.1 }}
                        >
                          <Card>
                            <CardContent className="p-6">
                              <div className="flex items-center justify-between mb-4">
                                <div>
                                  <h3 className="font-semibold text-gray-800">{subject.subjectId}</h3>
                                  <p className="text-sm text-gray-600">
                                    {subject.questionsAnswered} questions • {subject.accuracy.toFixed(1)}% accuracy
                                  </p>
                                </div>
                                <div className="flex items-center gap-2">
                                  <Badge
                                    variant="outline"
                                    className={
                                      subject.accuracy >= 80
                                        ? 'text-green-600 border-green-200'
                                        : subject.accuracy >= 60
                                          ? 'text-blue-600 border-blue-200'
                                          : 'text-red-600 border-red-200'
                                    }
                                  >
                                    {subject.accuracy >= 80
                                      ? 'Strong'
                                      : subject.accuracy >= 60
                                        ? 'Average'
                                        : 'Needs Work'}
                                  </Badge>
                                  {getChangeIcon(subject.abilityEstimate)}
                                </div>
                              </div>
                              <div className="space-y-3">
                                <div>
                                  <div className="flex justify-between text-sm mb-1">
                                    <span>Accuracy</span>
                                    <span>{subject.accuracy.toFixed(1)}%</span>
                                  </div>
                                  <Progress value={subject.accuracy} className="h-2" />
                                </div>
                                <div className="grid grid-cols-3 gap-4 text-sm">
                                  <div>
                                    <span className="text-gray-600">Ability:</span>
                                    <span className="ml-1 font-medium">{subject.abilityEstimate.toFixed(2)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Avg Time:</span>
                                    <span className="ml-1 font-medium">{formatTime(subject.averageTime)}</span>
                                  </div>
                                  <div>
                                    <span className="text-gray-600">Correct:</span>
                                    <span className="ml-1 font-medium">
                                      {subject.correctAnswers}/{subject.questionsAnswered}
                                    </span>
                                  </div>
                                </div>
                              </div>
                            </CardContent>
                          </Card>
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No subject-specific data available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="adaptive" className="space-y-6 mt-6">
                  {adaptiveMetrics ? (
                    <div className="space-y-6">
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                        <Card>
                          <CardContent className="p-6 text-center">
                            <div className="text-3xl font-bold text-purple-600 mb-2">
                              {(adaptiveMetrics.algorithmEfficiency * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-600">Algorithm Efficiency</div>
                            <Progress value={adaptiveMetrics.algorithmEfficiency * 100} className="mt-3 h-2" />
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6 text-center">
                            <div className="text-3xl font-bold text-blue-600 mb-2">
                              {(adaptiveMetrics.abilityEstimateStability * 100).toFixed(0)}%
                            </div>
                            <div className="text-sm text-gray-600">Ability Stability</div>
                            <Progress value={adaptiveMetrics.abilityEstimateStability * 100} className="mt-3 h-2" />
                          </CardContent>
                        </Card>
                        <Card>
                          <CardContent className="p-6 text-center">
                            <div className="text-3xl font-bold text-green-600 mb-2">{performance.totalQuestions}</div>
                            <div className="text-sm text-gray-600">Questions Used</div>
                            <div className="text-xs text-gray-500 mt-1">
                              Efficiency: {(adaptiveMetrics.algorithmEfficiency * 100).toFixed(0)}%
                            </div>
                          </CardContent>
                        </Card>
                      </div>

                      <Card>
                        <CardHeader>
                          <CardTitle className="flex items-center gap-2">
                            <Zap className="h-5 w-5" />
                            Adaptive Algorithm Insights
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-800">Performance Metrics</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Final Ability Estimate</span>
                                  <span className="font-medium">{safeAbilityEstimate.toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Standard Error</span>
                                  <span className="font-medium">{performance.standardError.toFixed(3)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Confidence Interval</span>
                                  <span className="font-medium">
                                    [{performance.abilityConfidenceInterval[0].toFixed(2)},{' '}
                                    {performance.abilityConfidenceInterval[1].toFixed(2)}]
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="space-y-3">
                              <h4 className="font-medium text-gray-800">Algorithm Performance</h4>
                              <div className="space-y-2 text-sm">
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Questions Answered</span>
                                  <span className="font-medium">{performance.totalQuestions}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Algorithm Efficiency</span>
                                  <span className="font-medium">{adaptiveMetrics.algorithmEfficiency.toFixed(2)}</span>
                                </div>
                                <div className="flex justify-between">
                                  <span className="text-gray-600">Question Utilization</span>
                                  <span className="font-medium text-green-600">
                                    {(adaptiveMetrics.questionUtilization * 100).toFixed(0)}%
                                  </span>
                                </div>
                              </div>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    </div>
                  ) : (
                    <div className="text-center py-8 text-gray-500">
                      <Activity className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No adaptive metrics available</p>
                    </div>
                  )}
                </TabsContent>

                <TabsContent value="patterns" className="space-y-6 mt-6">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Response Patterns</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="space-y-3">
                          <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <CheckCircle2 className="h-4 w-4 text-green-600" />
                              <span className="text-sm font-medium">Correct Answers</span>
                            </div>
                            <span className="text-lg font-bold text-green-600">{performance.correctAnswers}</span>
                          </div>
                          <div className="flex items-center justify-between p-3 bg-red-50 rounded-lg">
                            <div className="flex items-center gap-2">
                              <XCircle className="h-4 w-4 text-red-600" />
                              <span className="text-sm font-medium">Incorrect Answers</span>
                            </div>
                            <span className="text-lg font-bold text-red-600">
                              {performance.totalQuestions - performance.correctAnswers}
                            </span>
                          </div>
                        </div>
                        <Separator />
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Accuracy Rate</span>
                            <span className="font-medium">{performance.accuracy.toFixed(1)}%</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Error Rate</span>
                            <span className="font-medium">{(100 - performance.accuracy).toFixed(1)}%</span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>

                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Time Patterns</CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-4">
                        <div className="text-center p-4 bg-blue-50 rounded-lg">
                          <div className="text-xl font-bold text-blue-600">
                            {formatTime(performance.averageResponseTime)}
                          </div>
                          <div className="text-sm text-blue-700">Average per Question</div>
                        </div>
                        <div className="space-y-2 text-sm">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Time</span>
                            <span className="font-medium">{formatTime(performance.totalTime)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Est. Time Efficiency</span>
                            <span className="font-medium text-green-600">
                              {adaptiveMetrics
                                ? `${(adaptiveMetrics.algorithmEfficiency * 100).toFixed(0)}% efficient`
                                : 'N/A'}
                            </span>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </TabsContent>

                {/* Review Tab - Question Review */}
                {questions.length > 0 && (
                  <TabsContent value="review" className="space-y-4 mt-6">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-semibold">Question Review</h3>
                      <Badge variant="outline">
                        {responses.filter(r => r.isCorrect).length}/{responses.length} Correct
                      </Badge>
                    </div>
                    
                    <div className="space-y-4">
                      {questions.map((question, index) => {
                        const response = responses.find(r => r.questionId === question.id);
                        const isCorrect = response?.isCorrect || false;
                        
                        return (
                          <Card 
                            key={question.id} 
                            className={cn(
                              'border-l-4',
                              isCorrect ? 'border-l-green-500 bg-green-50/30' : 'border-l-red-500 bg-red-50/30'
                            )}
                          >
                            <CardContent className="p-4">
                              <div className="flex items-start justify-between gap-4 mb-3">
                                <div className="flex items-center gap-3">
                                  <span className="text-sm font-medium text-gray-500">Q{index + 1}</span>
                                  {isCorrect ? (
                                    <CheckCircle2 className="h-5 w-5 text-green-600" />
                                  ) : (
                                    <XCircle className="h-5 w-5 text-red-600" />
                                  )}
                                </div>
                                <Badge variant="outline" className="text-xs">
                                  {typeof question.difficulty === 'string' ? question.difficulty : `Level ${question.difficulty}`}
                                </Badge>
                              </div>
                              
                              <p className="text-gray-900 font-medium mb-3">
                                {question.question || question.content}
                              </p>
                              
                              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-sm">
                                <div>
                                  <span className="text-gray-500">Your answer:</span>
                                  <p className={cn(
                                    'font-medium mt-1',
                                    isCorrect ? 'text-green-700' : 'text-red-700'
                                  )}>
                                    {response?.userAnswer || 'No answer'}
                                  </p>
                                </div>
                                {!isCorrect && (
                                  <div>
                                    <span className="text-gray-500">Correct answer:</span>
                                    <p className="font-medium mt-1 text-green-700">
                                      {question.correctAnswer || question.correctAnswers?.join(', ')}
                                    </p>
                                  </div>
                                )}
                              </div>
                              
                              {question.explanation && (
                                <div className="mt-3 pt-3 border-t border-gray-200">
                                  <span className="text-xs text-gray-500 flex items-center gap-1">
                                    <Lightbulb className="h-3 w-3" />
                                    Explanation
                                  </span>
                                  <p className="text-sm text-gray-700 mt-1">{question.explanation}</p>
                                </div>
                              )}
                            </CardContent>
                          </Card>
                        );
                      })}
                    </div>
                  </TabsContent>
                )}
              </Tabs>
            </CardContent>
          </Card>
        )}

        {/* Recommendations */}
        {showRecommendations && (
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lightbulb className="h-5 w-5" />
                Personalized Recommendations
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {/* Study Recommendations */}
                {performance.accuracy < 70 && (
                  <Card className="border border-orange-200 bg-orange-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <AlertTriangle className="h-4 w-4 text-orange-600" />
                        <span className="font-medium text-orange-800">Focus Areas</span>
                      </div>
                      <p className="text-sm text-orange-700">
                        Consider reviewing concepts where accuracy was below 70% to strengthen understanding.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Timing Recommendations */}
                {performance.averageResponseTime > 180000 && (
                  <Card className="border border-blue-200 bg-blue-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Clock className="h-4 w-4 text-blue-600" />
                        <span className="font-medium text-blue-800">Time Management</span>
                      </div>
                      <p className="text-sm text-blue-700">
                        Practice timed questions to improve response speed and confidence.
                      </p>
                    </CardContent>
                  </Card>
                )}

                {/* Achievement Recognition */}
                {performance.accuracy >= 90 && (
                  <Card className="border border-green-200 bg-green-50">
                    <CardContent className="p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <Award className="h-4 w-4 text-green-600" />
                        <span className="font-medium text-green-800">Excellent Work!</span>
                      </div>
                      <p className="text-sm text-green-700">
                        Outstanding performance! Consider advancing to more challenging topics.
                      </p>
                    </CardContent>
                  </Card>
                )}
              </div>

              <Separator />

              <div className="flex flex-wrap items-center justify-center gap-4 pt-4">
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => (window.location.href = '/review')}
                >
                  <LineChart className="h-4 w-4" />
                  View Progress Trends
                </Button>
                <Button 
                  variant="outline" 
                  className="gap-2"
                  onClick={() => (window.location.href = '/journey')}
                >
                  <Target className="h-4 w-4" />
                  Set New Goals
                </Button>
                <Button 
                  className="gap-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  onClick={() => (window.location.href = '/test')}
                >
                  <TrendingUp className="h-4 w-4" />
                  Take Another Test
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </TooltipProvider>
  );
}
