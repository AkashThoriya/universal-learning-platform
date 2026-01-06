'use client';

import { motion } from 'framer-motion';
import {
  CheckCircle2,
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
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Separator } from '@/components/ui/separator';
import { Slider } from '@/components/ui/slider';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { cn } from '@/lib/utils/utils';
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
          <Card className="border-0 shadow-xl overflow-hidden">
            <CardHeader className="p-6 sm:p-8 bg-white">
              <div className="flex items-start justify-between">
                <div className="flex-1 prose prose-lg max-w-none text-gray-900">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {question.question}
                  </ReactMarkdown>
                  
                  {question.explanation && isAnswered && (
                     <motion.div 
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-100"
                     >
                        <h4 className="flex items-center gap-2 text-blue-900 font-semibold mb-2">
                            <Zap className="h-4 w-4 fill-blue-500 text-blue-500" />
                            Explanation
                        </h4>
                        <div className="prose prose-sm prose-blue max-w-none">
                            <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                {question.explanation}
                            </ReactMarkdown>
                        </div>
                     </motion.div>
                  )}
                </div>
                <div className="flex items-center gap-2 ml-4">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        onClick={() => onBookmark?.(question.id)}
                        className={cn('h-11 w-11 p-0 rounded-full hover:bg-gray-100', isBookmarked && 'text-yellow-600 bg-yellow-50')}
                      >
                        <Bookmark className="h-5 w-5" />
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
                        onClick={() => onFlag?.(question.id)}
                        className={cn('h-11 w-11 p-0 rounded-full hover:bg-gray-100', isFlagged && 'text-red-600 bg-red-50')}
                      >
                        <Flag className="h-5 w-5" />
                      </Button>
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>{isFlagged ? 'Remove flag' : 'Flag for review'}</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
              </div>

              {/* Adaptive Insights */}
              {adaptiveMode && !isAnswered && (
                <div className="mt-6 flex items-center gap-2 text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full w-fit">
                    <TrendingUp className="h-3 w-3" />
                    <span>Adaptive Question: Difficulty calibrating to your level</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-6 p-6 sm:p-8 pt-0">
              {/* Answer Options */}
              <div className="space-y-3">
                {question.options?.map((option: string, index: number) => (
                  <motion.div
                    key={`option-${index}`}
                    whileHover={!isAnswered ? { scale: 1.005 } : {}}
                    whileTap={!isAnswered ? { scale: 0.995 } : {}}
                    className={cn(
                      'group relative p-4 rounded-xl border-2 cursor-pointer transition-all duration-200',
                      selectedOption === `option-${index}`
                        ? 'border-blue-500 bg-blue-50/50 shadow-md ring-1 ring-blue-200'
                        : 'border-gray-100 hover:border-gray-200 hover:bg-gray-50 hover:shadow-sm',
                      isAnswered && 'cursor-not-allowed opacity-75'
                    )}
                    onClick={() => handleOptionSelect(`option-${index}`)}
                  >
                    <div className="flex items-start gap-4 z-10 relative"> 
                      <div className="flex-shrink-0 mt-0.5 transition-transform duration-200 group-hover:scale-110">
                        {selectedOption === `option-${index}` ? (
                          <div className="h-6 w-6 rounded-full bg-blue-600 flex items-center justify-center">
                              <CheckCircle2 className="h-4 w-4 text-white" />
                          </div>
                        ) : (
                          <div className="h-6 w-6 rounded-full border-2 border-gray-300 group-hover:border-blue-400 group-hover:bg-blue-50" />
                        )}
                      </div>
                      <div className="flex-1">
                          <span className={cn(
                            "text-base leading-relaxed transition-colors block",
                            selectedOption === `option-${index}` ? "font-semibold text-blue-900" : "font-medium text-gray-700"
                          )}>
                             <ReactMarkdown components={{ p: 'span' }} remarkPlugins={[remarkGfm]}>
                                 {option}
                             </ReactMarkdown>
                          </span>
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
                  className="space-y-4 p-5 bg-gradient-to-r from-green-50 to-emerald-50 rounded-xl border border-green-100"
                >
                  <div className="flex items-center justify-between">
                    <label className="text-sm font-semibold text-green-900">How confident are you?</label>
                    <Badge variant="outline" className="text-green-700 bg-white border-green-200 shadow-sm">
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
                  <div className="flex justify-between text-xs font-medium text-green-700">
                    <span>Uncertain</span>
                    <span>Very Confident</span>
                  </div>
                </motion.div>
              )}

              <Separator className="bg-gray-100" />

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-2">
                <div className="flex items-center gap-2">
                  {onPrevious && questionNumber > 1 && (
                    <Button variant="ghost" onClick={onPrevious} className="gap-2 text-gray-500 hover:text-gray-900">
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!isAnswered && selectedOption && (
                    <Button
                      onClick={handleSubmitAnswer}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-8 shadow-lg shadow-green-200"
                      size="lg"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit Answer
                    </Button>
                  )}

                  {isAnswered && onNext && (
                    <Button
                      onClick={onNext}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-8 shadow-lg shadow-blue-200"
                      size="lg"
                    >
                      Next Question
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Question Metadata */}
              <div className="flex items-center justify-between text-xs text-gray-400 pt-4">
                <div className="flex items-center gap-4">
                  <span>ID: {question.id.slice(-8)}</span>
                </div>
                <div className="flex items-center gap-2">
                  {question.tags?.map(tag => (
                    <Badge key={tag} variant="secondary" className="text-[10px] px-2 py-0 h-5 bg-gray-100 text-gray-500 hover:bg-gray-200 border-0">
                      #{tag}
                    </Badge>
                  ))}
                </div>
              </div>
            </CardContent>
          </Card>
        </motion.div>

        {/* Warning for unanswered questions */}
        {!selectedOption && !isAnswered && (
             <p className="text-center text-xs text-gray-400 animate-pulse">
                Select the best answer to proceed
             </p>
        )}
      </div>
    </TooltipProvider>
  );
}
