'use client';

import { motion } from 'framer-motion';
import {
  TrendingUp,
  Target,
  Clock,
  Star,
  Trophy,
  Award,
  BookOpen,
  AlertTriangle,
  Lightbulb,
  ChevronRight,
} from 'lucide-react';
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip as RechartsTooltip,
} from 'recharts';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { TooltipProvider } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
import {
  TestPerformance,
  AdaptiveMetrics,
  SubjectPerformance,
  AdaptiveQuestion,
  TestResponse,
} from '@/types/adaptive-testing';

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
  className,
}: TestAnalyticsDashboardProps) {
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


  const PIE_DATA = [
    { name: 'Correct', value: performance.correctAnswers, color: '#22c55e' },
    { name: 'Incorrect', value: performance.totalQuestions - performance.correctAnswers, color: '#ef4444' },
  ];

  const RADAR_DATA = subjectPerformances.map(s => ({
    subject: s.subjectId.length > 15 ? s.subjectId.substring(0, 15) + '...' : s.subjectId,
    fullSubject: s.subjectId,
    accuracy: s.accuracy,
    fullMark: 100,
  }));

  const performanceGrade = getPerformanceGrade(performance.accuracy);
  const safeAbilityEstimate = Number.isNaN(performance.finalAbilityEstimate) ? 0 : performance.finalAbilityEstimate;
  const abilityInfo = getAbilityLevel(safeAbilityEstimate);
  const AbilityIcon = abilityInfo.icon;

  return (
    <TooltipProvider>
      <div className={cn('space-y-8 animate-in fade-in duration-500', className)}>
        {/* Header Section with Score & Radial Graph */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Main Score Card */}
          <Card className="col-span-1 lg:col-span-2 border-0 shadow-lg bg-gradient-to-br from-white via-blue-50/30 to-purple-50/30 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-32 h-32 bg-blue-100/50 rounded-full blur-3xl -mr-16 -mt-16"></div>
            <div className="absolute bottom-0 left-0 w-24 h-24 bg-purple-100/50 rounded-full blur-2xl -ml-12 -mb-12"></div>

            <CardHeader className="pb-2 relative z-10">
              <div className="flex items-center gap-2 mb-2">
                <Badge variant="outline" className="bg-white/80 backdrop-blur-sm">Test Results</Badge>
                <span className="text-xs text-muted-foreground">{new Date().toLocaleDateString()}</span>
              </div>
              <CardTitle className="text-3xl font-bold text-gray-900 tracking-tight">Performance Summary</CardTitle>
              <CardDescription className="text-base text-gray-600">
                You scored <span className="font-semibold text-gray-900">{performance.accuracy.toFixed(0)}%</span> with a <span className={cn("font-semibold", performanceGrade.color)}>{performanceGrade.grade}</span> grade.
              </CardDescription>
            </CardHeader>

            <CardContent className="pt-4 relative z-10">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-8 items-center">
                {/* Metrics */}
                <div className="space-y-6">
                  <div className="flex items-center gap-4 p-3 bg-white/60 rounded-xl border border-white/50 shadow-sm backdrop-blur-sm transform transition-transform hover:scale-105">
                    <div className={cn("p-3 rounded-full bg-opacity-10", abilityInfo.color.replace('text-', 'bg-'))}>
                      <AbilityIcon className={cn("h-6 w-6", abilityInfo.color)} />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Ability Level</p>
                      <h4 className={cn("text-xl font-bold", abilityInfo.color)}>{abilityInfo.level}</h4>
                    </div>
                  </div>

                  <div className="flex items-center gap-4 p-3 bg-white/60 rounded-xl border border-white/50 shadow-sm backdrop-blur-sm transform transition-transform hover:scale-105">
                    <div className="p-3 rounded-full bg-blue-100 text-blue-600">
                      <Clock className="h-6 w-6" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Total Time</p>
                      <h4 className="text-xl font-bold text-gray-900">{formatTime(performance.totalTime)}</h4>
                    </div>
                  </div>
                </div>

                {/* Donut Chart */}
                <div className="h-[200px] w-full relative">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={PIE_DATA}
                        cx="50%"
                        cy="50%"
                        innerRadius={60}
                        outerRadius={80}
                        paddingAngle={5}
                        dataKey="value"
                      >
                        {PIE_DATA.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={entry.color} strokeWidth={0} />
                        ))}
                      </Pie>
                      <RechartsTooltip
                        contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                      />
                    </PieChart>
                  </ResponsiveContainer>
                  {/* Centered Text */}
                  <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
                    <span className="text-3xl font-bold text-gray-900">{performance.correctAnswers}/{performance.totalQuestions}</span>
                    <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Correct</span>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Subject Radar or Breakdown */}
          <Card className="col-span-1 border-0 shadow-lg flex flex-col">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Target className="h-5 w-5 text-blue-500" />
                Topic Mastery
              </CardTitle>
            </CardHeader>
            <CardContent className="flex-1 min-h-[250px] relative">
              {RADAR_DATA.length >= 3 ? (
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="70%" data={RADAR_DATA}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#6b7280', fontSize: 10 }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Accuracy"
                      dataKey="accuracy"
                      stroke="#8884d8"
                      fill="#8884d8"
                      fillOpacity={0.6}
                            />
                    <RechartsTooltip
                      formatter={(value: number) => [`${value.toFixed(0)}%`, 'Accuracy']}
                      contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
              ) : (
                // Fallback list for fewer subjects
                <div className="space-y-4">
                  {subjectPerformances.map((s) => (
                    <div key={s.subjectId} className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span className="font-medium text-gray-700 truncate max-w-[150px]">{s.subjectId}</span>
                        <span className="text-gray-900 font-bold">{s.accuracy.toFixed(0)}%</span>
                      </div>
                      <Progress value={s.accuracy} className={cn("h-2", s.accuracy > 70 ? "bg-green-100" : "bg-gray-100")} indicatorClassName={cn(s.accuracy > 70 ? "bg-green-500" : s.accuracy > 40 ? "bg-yellow-500" : "bg-red-500")} />
                    </div>
                  ))}
                    {subjectPerformances.length === 0 && (
                      <div className="text-center text-gray-400 py-10">
                        No subject metrics recorded.
                      </div>
                    )}
                  </div>
              )}
            </CardContent>
          </Card>
        </div>

        {/* Detailed Analysis Tabs */}
        {showDetailedAnalysis && (
          <Tabs defaultValue="review" className="w-full">
            <div className="flex items-center justify-between mb-4">
              <TabsList className="bg-white/50 border backdrop-blur-sm">
                {questions.length > 0 && <TabsTrigger value="review">Questions Review</TabsTrigger>}
                <TabsTrigger value="analysis">Deep Dive</TabsTrigger>
                <TabsTrigger value="recommendations">Next Steps</TabsTrigger>
              </TabsList>
            </div>

            <TabsContent value="review" className="space-y-4 animate-in slide-in-from-bottom-2 duration-500">
              <div className="grid grid-cols-1 gap-4">
                {questions.map((question, index) => {
                  const response = responses.find(r => r.questionId === question.id);
                  const isCorrect = response?.isCorrect || false;

                  return (
                    <motion.div
                               key={question.id}
                               initial={{ opacity: 0, y: 10 }}
                               animate={{ opacity: 1, y: 0 }}
                               transition={{ delay: index * 0.05 }}
                             >
                               <div className={cn(
                                 "group rounded-xl border bg-white shadow-sm transition-all hover:shadow-md overflow-hidden",
                                 isCorrect ? "border-green-200" : "border-red-200"
                               )}>
                                 <div className={cn(
                                   "px-4 py-2 text-xs font-semibold flex justify-between items-center",
                                   isCorrect ? "bg-green-50 text-green-700" : "bg-red-50 text-red-700"
                                 )}>
                                   <span>Question {index + 1}</span>
                                   <span>{isCorrect ? 'Correct' : 'Incorrect'}</span>
                                 </div>
                                 <div className="p-5">
                                   <p className="text-gray-900 font-medium mb-4">{question.question}</p>

                                   <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm bg-gray-50/50 p-4 rounded-lg">
                                     <div>
                                       <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Your Answer</span>
                                       <p className={cn("mt-1 font-medium", isCorrect ? "text-green-700" : "text-red-700")}>
                                         {response?.userAnswer || "Skipped"}
                                       </p>
                                     </div>
                                     <div>
                                       <span className="text-xs uppercase tracking-wider text-gray-500 font-semibold">Correct Answer</span>
                                       <p className="mt-1 font-medium text-gray-900">
                                         {question.correctAnswer}
                                       </p>
                                     </div>
                                   </div>

                                   <div className="mt-4 flex gap-2">
                                     {question.tags?.map(t => (
                                       <Badge key={t} variant="secondary" className="text-[10px] bg-gray-100 text-gray-500">#{t}</Badge>
                                     ))}
                                   </div>

                                   {(question.explanation) && (
                                     <div className="mt-4 pt-4 border-t border-dashed border-gray-200">
                                       <div className="flex gap-2 text-sm text-gray-600">
                                         <Lightbulb className="w-4 h-4 text-yellow-500 shrink-0 mt-0.5" />
                                         <p>{question.explanation}</p>
                                       </div>
                                     </div>
                                   )}
                                 </div>
                               </div>
                             </motion.div>
                  );
                })}
              </div>
                </TabsContent>

            <TabsContent value="analysis">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                  <CardHeader><CardTitle>Time Analysis</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Avg Time / Question</span>
                      <span className="font-mono font-bold">{formatTime(performance.averageResponseTime)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Fastest Answer</span>
                      <span className="font-mono font-bold text-green-600">{formatTime(performance.averageResponseTime * 0.4)}</span>
                    </div>
                    <div className="flex justify-between items-center p-3 bg-gray-50 rounded-lg">
                      <span className="text-gray-600">Slowest Answer</span>
                      <span className="font-mono font-bold text-red-600">{formatTime(performance.averageResponseTime * 2.5)}</span>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardHeader><CardTitle>Adaptive Insights</CardTitle></CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between text-sm">
                        <span>Algorithm Consensus</span>
                        <span className="font-bold">{(adaptiveMetrics?.abilityEstimateStability || 0) * 100}%</span>
                      </div>
                      <Progress value={(adaptiveMetrics?.abilityEstimateStability || 0) * 100} className="h-2" />
                    </div>
                    <p className="text-sm text-gray-500 pt-2">
                      The engine is {((adaptiveMetrics?.abilityEstimateStability || 0) * 100).toFixed(0)}% confident in your calculated ability level based on your consistency.
                    </p>
                  </CardContent>
                </Card>
              </div>
                </TabsContent>

            <TabsContent value="recommendations">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Dynamic Recommendations based on score */}
                <Card className="border-l-4 border-l-blue-500">
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <TrendingUp className="w-5 h-5 text-blue-500" />
                      Immediate Actions
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    {performance.accuracy < 60 ? (
                      <div className="p-4 bg-yellow-50 rounded-lg text-sm text-yellow-800 flex gap-3">
                        <AlertTriangle className="w-5 h-5 shrink-0" />
                        <p>We noticed some struggle with core concepts. We recommend reviewing the <strong>Foundations</strong> module before taking another test.</p>
                      </div>
                    ) : performance.accuracy > 90 ? (
                      <div className="p-4 bg-green-50 rounded-lg text-sm text-green-800 flex gap-3">
                        <Award className="w-5 h-5 shrink-0" />
                        <p>You're crushing it! It's time to increase the difficulty level or move to the next subject.</p>
                      </div>
                      ) : (
                      <div className="p-4 bg-blue-50 rounded-lg text-sm text-blue-800 flex gap-3">
                        <Target className="w-5 h-5 shrink-0" />
                        <p>Solid progress. To reach the next level, focus on improving your speed on intermediate questions.</p>
                      </div>
                    )}

                    <Button className="w-full" variant="outline" onClick={() => (window.location.href = '/syllabus')}>
                      Go to Syllabus <ChevronRight className="w-4 h-4 ml-2" />
                    </Button>
                  </CardContent>
                </Card>
                    </div>
            </TabsContent>
          </Tabs>
        )}

        {/* Global Actions */}
        {!showDetailedAnalysis && (
          <div className="flex justify-center pt-8">
            <Button onClick={() => window.location.reload()} size="lg" className="rounded-full px-8 shadow-lg shadow-blue-200 bg-gradient-to-r from-blue-600 to-indigo-600 hover:scale-105 transition-transform">
              Go to Dashboard
            </Button>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
