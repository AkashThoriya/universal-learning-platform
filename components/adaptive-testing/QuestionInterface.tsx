'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2,
  Circle,
  AlertTriangle,
  Brain,
  Target,
  Zap,
  Clock,
  ChevronLeft,
  ChevronRight,
  Flag,
  Bookmark,
  Timer,
  TrendingUp,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils';
import { AdaptiveQuestion } from '@/types/adaptive-testing';

interface QuestionInterfaceProps {
  question: AdaptiveQuestion;
  questionNumber: number;
  totalQuestions: number;
  timeRemaining?: number;
  onAnswer: (questionId: string, selectedOptionId: string, confidence: number, timeSpent: number) => void;
  onNext?: () => void;
  onPrevious?: () => void;
  onBookmark?: (questionId: string) => void;
  onFlag?: (questionId: string) => void;
  isBookmarked?: boolean;
  isFlagged?: boolean;
  showConfidenceSlider?: boolean;
  showTimer?: boolean;
  adaptiveMode?: boolean;
  className?: string;
}

export default function QuestionInterface({
  question,
  questionNumber,
  totalQuestions,
  timeRemaining,
  onAnswer,
  onNext,
  onPrevious,
  onBookmark,
  onFlag,
  isBookmarked = false,
  isFlagged = false,
  showConfidenceSlider = true,
  showTimer = true,
  adaptiveMode = true,
  className,
}: QuestionInterfaceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence, setConfidence] = useState<number[]>([75]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [questionStartTime] = useState(Date.now());

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      setTimeSpent(Date.now() - questionStartTime);
    }, 1000);

    return () => clearInterval(interval);
  }, [questionStartTime]);

  const handleOptionSelect = useCallback(
    (optionId: string) => {
      if (isAnswered) {
        return;
      }
      setSelectedOption(optionId);
    },
    [isAnswered]
  );

  const handleSubmitAnswer = useCallback(() => {
    if (!selectedOption || isAnswered) {
      return;
    }

    setIsAnswered(true);
    onAnswer(question.id, selectedOption, confidence[0] ?? 3, timeSpent);
  }, [selectedOption, isAnswered, question.id, confidence, timeSpent, onAnswer]);

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
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

  const getProgressPercentage = () => (questionNumber / totalQuestions) * 100;

  return (
    <TooltipProvider>
      <div className={cn('max-w-4xl mx-auto space-y-6', className)}>
        {/* Header with Progress and Timer */}
        <Card className="border-0 shadow-lg bg-gradient-to-r from-blue-50 to-purple-50">
          <CardHeader className="pb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-4">
                <Badge variant="outline" className="text-gray-600">
                  Question {questionNumber} of {totalQuestions}
                </Badge>
                {adaptiveMode && (
                  <Badge className={getDifficultyColor(String(question.difficulty))}>
                    <Brain className="h-3 w-3 mr-1" />
                    {String(question.difficulty)}
                  </Badge>
                )}
                <Badge variant="outline" className="text-blue-600">
                  <Target className="h-3 w-3 mr-1" />
                  {question.subject}
                </Badge>
              </div>
              <div className="flex items-center gap-3">
                {showTimer && (
                  <div className="flex items-center gap-2 text-gray-600">
                    <Clock className="h-4 w-4" />
                    <span className="font-mono">{formatTime(timeSpent)}</span>
                  </div>
                )}
                {timeRemaining && (
                  <div className="flex items-center gap-2 text-orange-600">
                    <Timer className="h-4 w-4" />
                    <span className="font-mono">{formatTime(timeRemaining)}</span>
                  </div>
                )}
              </div>
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <span>Progress</span>
                <span>{getProgressPercentage().toFixed(0)}%</span>
              </div>
              <Progress value={getProgressPercentage()} className="h-2" />
            </div>
          </CardHeader>
        </Card>

        {/* Question Card */}
        <motion.div
          key={question.id}
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -20 }}
          transition={{ duration: 0.3 }}
        >
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <CardTitle className="text-lg leading-relaxed">{question.question}</CardTitle>
                  {question.explanation && (
                    <CardDescription className="mt-2 text-base">{question.explanation}</CardDescription>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onBookmark?.(question.id)}
                        className={cn(isBookmarked && 'text-yellow-600 bg-yellow-50')}
                      >
                        <Bookmark className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isBookmarked ? 'Remove bookmark' : 'Bookmark question'}</p>
                    </TooltipContent>
                  </Tooltip>

                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onFlag?.(question.id)}
                        className={cn(isFlagged && 'text-red-600 bg-red-50')}
                      >
                        <Flag className="h-4 w-4" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isFlagged ? 'Remove flag' : 'Flag for review'}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Adaptive Insights */}
              {adaptiveMode && (
                <div className="mt-4 p-3 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center gap-2 mb-1">
                    <Zap className="h-4 w-4 text-purple-600" />
                    <span className="text-sm font-medium text-purple-800">Adaptive Insights</span>
                  </div>
                  <p className="text-purple-700 text-xs">
                    This question adapts to your ability level. Your performance here will help optimize future
                    questions.
                  </p>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4">
              {/* Answer Options */}
              <div className="space-y-3">
                {question.options?.map((option: string, index: number) => (
                  <motion.div
                    key={`option-${index}`}
                    whileHover={{ scale: 1.01 }}
                    whileTap={{ scale: 0.99 }}
                    className={cn(
                      'p-4 rounded-lg border-2 cursor-pointer transition-all duration-200',
                      selectedOption === `option-${index}`
                        ? 'border-blue-500 bg-blue-50 shadow-md'
                        : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50',
                      isAnswered && 'cursor-not-allowed opacity-75'
                    )}
                    onClick={() => handleOptionSelect(`option-${index}`)}
                  >
                    <div className="flex items-start gap-3">
                      <div className="flex-shrink-0 mt-0.5">
                        {selectedOption === `option-${index}` ? (
                          <CheckCircle2 className="h-5 w-5 text-blue-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-medium text-gray-800">
                            {String.fromCharCode(65 + index)}. {option}
                          </span>
                        </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>

              {/* Confidence Slider */}
              {showConfidenceSlider && selectedOption && !isAnswered && (
                <motion.div
                  initial={{ opacity: 0, height: 0 }}
                  animate={{ opacity: 1, height: 'auto' }}
                  className="space-y-3 p-4 bg-green-50 rounded-lg border border-green-200"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-medium text-green-800">How confident are you?</label>
                    <Badge variant="outline" className="text-green-700">
                      {confidence[0]}%
                    </Badge>
                  </div>
                  <Slider
                    value={confidence}
                    onValueChange={setConfidence}
                    max={100}
                    min={10}
                    step={5}
                    className="py-2"
                  />
                  <div className="flex justify-between text-xs text-green-600">
                    <span>Uncertain</span>
                    <span>Very Confident</span>
                  </div>
                </motion.div>
              )}

              <Separator />

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {onPrevious && questionNumber > 1 && (
                    <Button variant="outline" onClick={onPrevious} className="gap-2">
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!isAnswered && selectedOption && (
                    <Button
                      onClick={handleSubmitAnswer}
                      className="bg-gradient-to-r from-green-600 to-blue-600 hover:from-green-700 hover:to-blue-700 text-white px-8"
                      size="lg"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit Answer
                    </Button>
                  )}

                  {isAnswered && onNext && (
                    <Button
                      onClick={onNext}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8"
                      size="lg"
                    >
                      Next Question
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Question Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-500 pt-4 border-t">
                <div className="flex items-center gap-4">
                  <span>ID: {question.id.slice(-8)}</span>
                  {adaptiveMode && (
                    <span className="flex items-center gap-1">
                      <TrendingUp className="h-3 w-3" />
                      Adaptive
                    </span>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  {question.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-xs">
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Warning for unanswered questions */}
        {!selectedOption && questionNumber > 1 && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-3 bg-yellow-50 border border-yellow-200 rounded-lg"
          >
            <div className="flex items-center gap-2">
              <AlertTriangle className="h-4 w-4 text-yellow-600" />
              <span className="text-sm text-yellow-800">Please select an answer before proceeding.</span>
            </div>
          </motion.div>
        )}
      </div>
    </TooltipProvider>
  );
}
