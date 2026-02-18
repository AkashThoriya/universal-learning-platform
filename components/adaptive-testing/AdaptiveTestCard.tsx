'use client';

import { motion } from 'framer-motion';
import {
  Play,
  Pause,
  BarChart3,
  Clock,
  Target,
  Brain,
  TrendingUp,
  CheckCircle2,
  AlertCircle,
  ChevronRight,
  Zap,
  Star,
  Trophy,
  type LucideIcon,
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
import { AdaptiveTest } from '@/types/adaptive-testing';

interface AdaptiveTestCardProps {
  test: AdaptiveTest;
  onStartTest?: (testId: string) => void;
  onViewResults?: (testId: string) => void;
  onRetakeTest?: (testId: string) => void;
  className?: string;
  showDetailedMetrics?: boolean;
}

export default function AdaptiveTestCard({
  test,
  onStartTest,
  onViewResults,
  onRetakeTest,
  className,
  showDetailedMetrics = false,
}: AdaptiveTestCardProps) {
  const getStatusIcon = (): LucideIcon => {
    switch (test.status) {
      case 'completed':
        return CheckCircle2;
      case 'active':
        return Play;
      case 'paused':
        return Pause;
      case 'draft':
        return Target;
      default:
        return AlertCircle;
    }
  };

  const getStatusColor = () => {
    switch (test.status) {
      case 'completed':
        return 'text-green-600 border-green-200 bg-green-50';
      case 'active':
        return 'text-blue-600 border-blue-200 bg-blue-50';
      case 'paused':
        return 'text-orange-600 border-orange-200 bg-orange-50';
      case 'draft':
        return 'text-gray-600 border-gray-200 bg-gray-50';
      default:
        return 'text-red-600 border-red-200 bg-red-50';
    }
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'intermediate':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'advanced':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'expert':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getAlgorithmColor = () => {
    switch (test.algorithmType) {
      case 'CAT':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'MAP':
        return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'HYBRID':
        return 'bg-gradient-to-r from-purple-100 to-indigo-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const formatDuration = (minutes: number) => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  };

  const getProgressPercentage = () => {
    if (test.status === 'completed') {
      return 100;
    }
    if (test.currentQuestion > 0) {
      return (test.currentQuestion / test.totalQuestions) * 100;
    }
    return 0;
  };

  const StatusIcon = getStatusIcon();

  return (
    <TooltipProvider>
      <motion.div
        whileTap={{ scale: 0.98 }}
        className={cn('group active:scale-[0.98] transition-transform h-full', className)}
      >
        <Card className="h-full flex flex-col hover:shadow-xl transition-all duration-300 border-0 shadow-md overflow-hidden">
          {/* Header with clean design and colored accent border */}
          <div className={cn('absolute left-0 top-0 bottom-0 w-1.5', getStatusColor().replace('bg-', 'bg-').replace('text-', '').replace('border-', 'bg-'))} />

          <CardHeader className="pb-3 pl-6">
            <div className="flex items-start justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={cn('capitalize font-medium px-2 py-0.5 h-6', getStatusColor())}>
                    <StatusIcon className="h-3 w-3 mr-1.5" />
                    {test.status}
                  </Badge>
                  <span className="text-xs text-slate-400 font-medium px-2 py-0.5 bg-slate-100 rounded-full">
                    {test.algorithmType}
                  </span>
                </div>
                <CardTitle className="text-lg font-bold text-slate-900 leading-tight group-hover:text-blue-600 transition-colors">
                  {test.title}
                </CardTitle>
              </div>
            </div>
            <CardDescription className="line-clamp-2 text-slate-500 text-sm mt-1">
              {test.description}
            </CardDescription>
          </CardHeader>

          <CardContent className="flex-1 flex flex-col pt-0 pb-6 px-6 space-y-6">
            {/* Metrics Row */}
            <div className="flex items-center gap-6 text-sm">
              <div className="flex items-center gap-1.5 text-slate-600">
                <Target className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{test.totalQuestions} Qs</span>
              </div>
              <div className="flex items-center gap-1.5 text-slate-600">
                <Clock className="h-4 w-4 text-slate-400" />
                <span className="font-medium">{formatDuration(test.estimatedDuration)}</span>
              </div>
            </div>
            {/* Configuration Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium text-gray-600">Difficulty Range</label>
                <div className="flex gap-1 mt-1">
                  <Badge className={getDifficultyColor(test.difficultyRange.min)}>{test.difficultyRange.min}</Badge>
                  <span className="text-gray-400 text-sm self-center">to</span>
                  <Badge className={getDifficultyColor(test.difficultyRange.max)}>{test.difficultyRange.max}</Badge>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">Algorithm</label>
                <div className="mt-1">
                  <Tooltip>
                    <TooltipTrigger>
                      <Badge className={getAlgorithmColor()}>
                        {test.algorithmType}
                        <Zap className="h-3 w-3 ml-1" />
                      </Badge>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>
                        {test.algorithmType === 'CAT' && 'Computer Adaptive Testing - Real-time difficulty adjustment'}
                        {test.algorithmType === 'MAP' && 'Maximum A Posteriori - Bayesian ability estimation'}
                        {test.algorithmType === 'HYBRID' && 'Hybrid approach combining multiple algorithms'}
                      </p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>
            </div>

            {/* Subjects */}
            <div>
              <label className="text-sm font-medium text-gray-600 block mb-2">Subjects</label>
              <div className="flex flex-wrap gap-2">
                {test.linkedSubjects.slice(0, 4).map(subject => (
                  <Badge key={subject} variant="secondary" className="text-xs">
                    {subject}
                  </Badge>
                ))}
                {test.linkedSubjects.length > 4 && (
                  <Badge variant="secondary" className="text-xs">
                    +{test.linkedSubjects.length - 4} more
                  </Badge>
                )}
              </div>
            </div>

            {/* Progress Section */}
            {(test.status === 'active' || test.status === 'completed') && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-600">Progress</label>
                  <span className="text-sm font-medium text-gray-900">
                    {test.currentQuestion}/{test.totalQuestions}
                  </span>
                </div>
                <Progress value={getProgressPercentage()} className="h-2" />
              </div>
            )}

            {/* Performance Metrics (if completed) */}
            {test.status === 'completed' && test.performance && showDetailedMetrics && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                className="border-t pt-4 space-y-3"
              >
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-gray-600">Performance</label>
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    <span className="text-lg font-bold text-green-600">{test.performance.accuracy.toFixed(1)}%</span>
                  </div>
                </div>

                <div className="grid grid-cols-3 gap-3 text-center">
                  <div className="bg-blue-50 rounded-lg p-2">
                    <div className="text-xs text-blue-600 font-medium">Correct</div>
                    <div className="text-sm font-bold text-blue-800">
                      {test.performance.correctAnswers}/{test.performance.totalQuestions}
                    </div>
                  </div>
                  <div className="bg-green-50 rounded-lg p-2">
                    <div className="text-xs text-green-600 font-medium">Ability</div>
                    <div className="text-sm font-bold text-green-800">
                      {Number.isNaN(test.performance.finalAbilityEstimate)
                        ? '0.00'
                        : test.performance.finalAbilityEstimate.toFixed(2)}
                    </div>
                  </div>
                  <div className="bg-orange-50 rounded-lg p-2">
                    <div className="text-xs text-orange-600 font-medium">Time</div>
                    <div className="text-sm font-bold text-orange-800">
                      {formatDuration(Math.round(test.performance.totalTime / 60000))}
                    </div>
                  </div>
                </div>

                {/* Adaptive Insights */}
                {test.adaptiveMetrics && (
                  <div className="bg-purple-50 rounded-lg p-3">
                    <div className="flex items-center gap-2 mb-2">
                      <Brain className="h-4 w-4 text-purple-600" />
                      <span className="text-sm font-medium text-purple-800">Adaptive Insights</span>
                    </div>
                    <div className="grid grid-cols-2 gap-2 text-xs">
                      <div>
                        <span className="text-purple-600">Efficiency:</span>
                        <span className="ml-1 font-medium">
                          {Number.isNaN(test.adaptiveMetrics.algorithmEfficiency)
                            ? '0'
                            : (test.adaptiveMetrics.algorithmEfficiency * 100).toFixed(0)}
                          %
                        </span>
                      </div>
                      <div>
                        <span className="text-purple-600">Stability:</span>
                        <span className="ml-1 font-medium">
                          {Number.isNaN(test.adaptiveMetrics.abilityEstimateStability)
                            ? '0'
                            : (test.adaptiveMetrics.abilityEstimateStability * 100).toFixed(0)}
                          %
                        </span>
                      </div>
                    </div>
                  </div>
                )}
              </motion.div>
            )}

            {/* Achievement Badges */}
            {test.status === 'completed' && test.performance && test.performance.accuracy > 90 && (
              <div className="flex items-center gap-2 p-2 bg-yellow-50 rounded-lg">
                <Trophy className="h-4 w-4 text-yellow-600" />
                <span className="text-sm font-medium text-yellow-800">Excellent Performance!</span>
              </div>
            )}

            {/* Action Buttons */}
            <div className="pt-2 space-y-2 mt-auto">
              {test.status === 'draft' || (test.status === 'active' && test.currentQuestion === 0) ? (
                <Button
                  onClick={() => onStartTest?.(test.id)}
                  className="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Start Test
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : test.status === 'active' ? (
                <Button
                  onClick={() => onStartTest?.(test.id)}
                  className="w-full bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Continue Test
                  <ChevronRight className="h-4 w-4 ml-2" />
                </Button>
              ) : test.status === 'completed' ? (
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => onViewResults?.(test.id)} className="flex-1" size="lg">
                    <BarChart3 className="h-4 w-4 mr-2" />
                    View Results
                  </Button>
                  <Button
                    onClick={() => onRetakeTest?.(test.id)}
                    className="flex-1 bg-gradient-to-r from-green-600 to-teal-600 hover:from-green-700 hover:to-teal-700 text-white"
                    size="lg"
                  >
                    <TrendingUp className="h-4 w-4 mr-2" />
                    Retake
                  </Button>
                </div>
              ) : test.status === 'paused' ? (
                <Button
                  onClick={() => onStartTest?.(test.id)}
                  variant="outline"
                  className="w-full border-orange-200 text-orange-700 hover:bg-orange-50"
                  size="lg"
                >
                  <Play className="h-4 w-4 mr-2" />
                  Resume Test
                </Button>
              ) : (
                <Button variant="outline" className="w-full" disabled size="lg">
                  <AlertCircle className="h-4 w-4 mr-2" />
                  Test Unavailable
                </Button>
              )}


            </div>

            {/* Metadata */}
            <div className="flex justify-between items-center text-xs text-gray-500 pt-2 border-t">
              <span>Created {test.createdAt.toLocaleDateString()}</span>
              <span>

                {test.createdFrom === 'mission' && '🚀 Mission'}
                {test.createdFrom === 'recommendation' && '💡 Recommended'}
                {test.createdFrom === 'manual' && '✋ Manual'}
              </span>
            </div>
          </CardContent>
        </Card>
      </motion.div>
    </TooltipProvider>
  );
}
