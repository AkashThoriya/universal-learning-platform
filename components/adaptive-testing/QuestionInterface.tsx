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
// import { Separator } from '@/components/ui/separator'; <-- Remove or comment out
// import { Slider } from '@/components/ui/slider';
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
  // showConfidenceSlider?: boolean;
  showTimer?: boolean;
  adaptiveMode?: boolean;
  className?: string;
  result?: {
    isCorrect: boolean;
    correctAnswer: string | number;
    explanation?: string;
  } | null;
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
  // showConfidenceSlider = true,
  showTimer = true,
  adaptiveMode = true,
  className,
  result,
}: QuestionInterfaceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence] = useState<number[]>([75]);
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

  // Keyboard shortcuts: 1-4 for options, Enter for submit
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Ignore if user is typing in an input
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }

      // Option selection with 1-4 keys
      if (!isAnswered && question.options) {
        const num = parseInt(e.key);
        if (num >= 1 && num <= question.options.length) {
          handleOptionSelect(`option-${num - 1}`);
        }
      }

      // Submit with Enter key
      if (e.key === 'Enter' && selectedOption && !isAnswered) {
        e.preventDefault();
        handleSubmitAnswer();
      }

      // Next question with Enter or Space after answering
      if ((e.key === 'Enter' || e.key === ' ') && isAnswered && onNext) {
        e.preventDefault();
        onNext();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isAnswered, question.options, selectedOption, handleOptionSelect, handleSubmitAnswer, onNext]);

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
        <Card className="border-0 shadow-md bg-gradient-to-r from-blue-50 via-white to-purple-50 overflow-hidden">
          <CardHeader className="pb-3 pt-4 px-5 relative">
            {/* Animated background gradient */}
            <motion.div
              className="absolute inset-0 bg-gradient-to-r from-blue-100/50 via-transparent to-purple-100/50"
              animate={{
                backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
              }}
              transition={{ duration: 10, repeat: Infinity, ease: 'linear' }}
            />

            <div className="relative z-10">
              <div className="flex flex-wrap items-center justify-between gap-y-2 gap-x-3 mb-3">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="outline" className="text-gray-700 bg-white/80 backdrop-blur-sm font-semibold h-7">
                    Q{questionNumber}/{totalQuestions}
                  </Badge>
                  {adaptiveMode && (
                    <Badge className={cn(getDifficultyColor(String(question.difficulty)), 'shadow-sm h-7')}>
                      <Brain className="h-3 w-3 mr-1" />
                      {String(question.difficulty)}
                    </Badge>
                  )}
                  <Badge variant="outline" className="text-blue-700 bg-blue-50/80 border-blue-200 h-7 max-w-[120px]">
                    <Target className="h-3 w-3 mr-1 shrink-0" />
                    <span className="truncate">{question.subject}</span>
                  </Badge>
                </div>
                <div className="flex items-center gap-2 sm:gap-4">
                  {showTimer && (
                    <motion.div
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition-colors border',
                        timeSpent > 120000
                          ? 'bg-orange-100 text-orange-700 border-orange-200'
                          : 'bg-white text-gray-700 border-gray-200'
                      )}
                      animate={timeSpent > 120000 ? { scale: [1, 1.02, 1] } : {}}
                      transition={{ duration: 1, repeat: Infinity }}
                    >
                      <Clock className="h-3.5 w-3.5" />
                      <span className="font-mono">{formatTime(timeSpent)}</span>
                    </motion.div>
                  )}
                  {timeRemaining && (
                    <motion.div
                      className={cn(
                        'flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-semibold border',
                        timeRemaining < 60000
                          ? 'bg-red-100 text-red-700 border-red-200'
                          : 'bg-orange-50 text-orange-700 border-orange-200'
                      )}
                      animate={timeRemaining < 60000 ? { scale: [1, 1.05, 1] } : {}}
                      transition={{ duration: 0.5, repeat: Infinity }}
                    >
                      <Timer className="h-3.5 w-3.5" />
                      <span className="font-mono">{formatTime(timeRemaining)}</span>
                    </motion.div>
                  )}
                </div>
              </div>

              {/* Progress section with step indicators */}
              <div className="space-y-2">
                <div className="flex items-center justify-between text-xs">
                  <span className="font-medium text-gray-500">Progress</span>
                  <span className="text-gray-600 font-mono">{getProgressPercentage().toFixed(0)}%</span>
                </div>

                {/* Animated progress bar */}
                <div className="relative">
                  <Progress value={getProgressPercentage()} className="h-2" />
                  <motion.div
                    className="absolute top-0 left-0 h-2 bg-gradient-to-r from-blue-500 to-purple-500 rounded-full opacity-30"
                    style={{ width: `${getProgressPercentage()}%` }}
                    animate={{ opacity: [0.2, 0.4, 0.2] }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                </div>

                {/* Step indicators (for up to 15 questions) */}
                {totalQuestions <= 15 && (
                  <div className="flex justify-center gap-1 pt-0.5">
                    {Array.from({ length: totalQuestions }, (_, i) => (
                      <motion.div
                        key={i}
                        className={cn(
                          'h-1.5 rounded-full transition-all duration-300',
                          i + 1 === questionNumber
                            ? 'w-4 bg-gradient-to-r from-blue-500 to-purple-500'
                            : i + 1 < questionNumber
                              ? 'w-1.5 bg-green-500'
                              : 'w-1.5 bg-gray-200'
                        )}
                        initial={{ scale: 0.8, opacity: 0.5 }}
                        animate={{
                          scale: i + 1 === questionNumber ? 1 : 1,
                          opacity: 1,
                        }}
                        transition={{ duration: 0.3 }}
                      />
                    ))}
                  </div>
                )}
              </div>
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
          <Card className="border-0 shadow-xl overflow-hidden bg-white">
            <CardHeader className="p-5 sm:p-6 bg-white pb-2">
              <div className="flex items-start justify-between">
                <div className="flex-1 prose prose-lg max-w-none text-gray-900 pr-4">
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.question}</ReactMarkdown>

                  {/* Use a simple pre block for code snippets to avoid heavy dependencies */}
                  {question.codeSnippet && (
                    <div className="my-4 relative group">
                      <div className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity z-10">
                        <Badge variant="outline" className="text-xs text-slate-400 border-slate-600 bg-slate-800">
                          Code
                        </Badge>
                      </div>
                      <pre
                        className="p-4 rounded-lg bg-slate-900 border border-slate-700 overflow-x-auto text-sm font-mono text-slate-50 leading-relaxed shadow-inner touch-pan-x"
                        style={{ tabSize: 2 }}
                      >
                        <code>{question.codeSnippet}</code>
                      </pre>
                    </div>
                  )}

                  {/* Hint / Stuck Button */}
                  {adaptiveMode && !isAnswered && (
                    <div className="mt-4">
                      <Tooltip>
                        <TooltipTrigger asChild>
                          <Button
                            variant="ghost"
                            size="sm"
                            className="text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50 h-8 px-2 gap-1.5"
                          >
                            <span className="text-lg">💡</span>
                            Stuck?
                          </Button>
                        </TooltipTrigger>
                        <TooltipContent side="bottom" className="max-w-xs">
                          <p className="font-semibold mb-1">Hint:</p>
                          <p className="text-xs text-gray-500">Focus on these concepts:</p>
                          <div className="flex flex-wrap gap-1 mt-1">
                            {question.topics?.map(t => (
                              <Badge key={t} variant="secondary" className="text-[10px] h-4 px-1">{t}</Badge>
                            ))}
                          </div>
                        </TooltipContent>
                      </Tooltip>
                    </div>
                  )}

                  {/* Explanation showing below options now */}
                </div>
                <div className="flex items-center gap-1 ml-2 shrink-0">
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <Button
                        variant="ghost"
                        onClick={() => onBookmark?.(question.id)}
                        className={cn(
                          'h-8 w-8 p-0 rounded-full hover:bg-gray-100',
                          isBookmarked && 'text-yellow-600 bg-yellow-50'
                        )}
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
                        onClick={() => onFlag?.(question.id)}
                        className={cn(
                          'h-8 w-8 p-0 rounded-full hover:bg-gray-100',
                          isFlagged && 'text-red-600 bg-red-50'
                        )}
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
              {adaptiveMode && !isAnswered && (
                <div className="mt-4 flex items-center gap-2 text-xs font-medium text-purple-600 bg-purple-50 px-3 py-1.5 rounded-full w-fit">
                  <TrendingUp className="h-3 w-3" />
                  <span>Adaptive Question</span>
                </div>
              )}
            </CardHeader>

            <CardContent className="space-y-4 p-5 sm:p-6 pt-0">
              {/* Answer Options */}
              <div className="flex flex-col gap-3">
                {question.options?.map((option: string, index: number) => {
                  const optionId = `option-${index}`;
                  const isSelected = selectedOption === optionId;

                  // Determine status for styling
                  let status: 'default' | 'selected' | 'correct' | 'incorrect' = 'default';

                  if (result) {
                    const isOptionCorrect =
                      option === result.correctAnswer ||
                      index + 1 === result.correctAnswer ||
                      optionId === result.correctAnswer;

                    if (isOptionCorrect) {
                      status = 'correct';
                    } else if (isSelected) {
                      status = 'incorrect';
                    }
                  } else if (isSelected) {
                    status = 'selected';
                  }

                  return (
                    <motion.div
                      key={optionId}
                      initial={{ opacity: 0, y: 10 }}
                      animate={{
                        opacity: 1,
                        y: 0,
                        scale: status === 'correct' ? [1, 1.01, 1] : 1,
                        x: status === 'incorrect' ? [0, -2, 2, 0] : 0,
                      }}
                      transition={{
                        duration: 0.2,
                        delay: index * 0.03,
                      }}
                      whileHover={
                        !isAnswered
                          ? {
                              scale: 1.002,
                              backgroundColor: 'rgba(59, 130, 246, 0.02)',
                              borderColor: 'rgba(59, 130, 246, 0.3)',
                              transition: { duration: 0.2 },
                            }
                          : {}
                      }
                      whileTap={!isAnswered ? { scale: 0.995 } : {}}
                      className={cn(
                        'group relative p-4 rounded-xl border transition-all duration-200 cursor-pointer flex items-center', // Flex Items Center for vertical alignment
                        status === 'selected' && 'border-blue-500 bg-blue-50/50 shadow-sm ring-1 ring-blue-200',
                        status === 'correct' && 'border-green-500 bg-green-50/50 shadow-sm ring-1 ring-green-200',
                        status === 'incorrect' && 'border-red-400 bg-red-50/50 shadow-sm ring-1 ring-red-200',
                        status === 'default' && 'border-gray-200 bg-white hover:border-blue-300',
                        isAnswered && status === 'default' && 'opacity-50 grayscale-[0.5] cursor-not-allowed'
                      )}
                      onClick={() => handleOptionSelect(optionId)}
                    >
                      {/* Selection glow effect using direct border instead of absolute div for cleaner look */}

                      <div className="flex items-center gap-4 w-full">
                        {/* Option indicator */}
                        <div className="flex-shrink-0">
                          <motion.div
                            animate={status === 'correct' ? { scale: [1, 1.1, 1] } : {}}
                            transition={{ duration: 0.3 }}
                          >
                            {status === 'correct' ? (
                              <div className="h-6 w-6 rounded-full bg-green-500 flex items-center justify-center shadow-sm">
                                <CheckCircle2 className="h-3.5 w-3.5 text-white" />
                              </div>
                            ) : status === 'incorrect' ? (
                              <div className="h-6 w-6 rounded-full border-2 border-red-400 bg-red-50 flex items-center justify-center">
                                <div className="h-2 w-2 rounded-full bg-red-400" />
                              </div>
                            ) : status === 'selected' ? (
                              <div className="h-6 w-6 rounded-full bg-blue-500 flex items-center justify-center shadow-sm">
                                <div className="h-2.5 w-2.5 rounded-full bg-white" />
                              </div>
                            ) : (
                              <div className="h-6 w-6 rounded-full border border-gray-300 bg-white flex items-center justify-center group-hover:border-blue-400 group-hover:bg-blue-50 transition-all duration-200">
                                <span className="text-[10px] font-bold text-gray-400 group-hover:text-blue-500 transition-colors">
                                  {index + 1}
                                </span>
                              </div>
                            )}
                          </motion.div>
                        </div>

                        {/* Option Text */}
                        <div className="flex-1">
                          <span
                            className={cn(
                              'text-sm sm:text-base leading-relaxed block',
                              status === 'selected'
                                ? 'font-semibold text-blue-900'
                                : status === 'correct'
                                  ? 'font-semibold text-green-900'
                                  : status === 'incorrect'
                                    ? 'font-medium text-red-800'
                                    : 'font-medium text-gray-700 group-hover:text-gray-900'
                            )}
                          >
                            <ReactMarkdown components={{ p: 'span' }} remarkPlugins={[remarkGfm]}>
                              {option}
                            </ReactMarkdown>
                          </span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* Explanation Section - Moved here to prevent layout shift */}
              {(result?.explanation || question.explanation) && isAnswered && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className={cn(
                    'mt-6 p-4 rounded-xl border-l-4 shadow-sm',
                    result?.isCorrect === false ? 'bg-red-50/50 border-red-400' : 'bg-blue-50/50 border-blue-400'
                  )}
                >
                  <h4
                    className={cn(
                      'flex items-center gap-2 font-bold mb-2 text-sm',
                      result?.isCorrect === false ? 'text-red-900' : 'text-blue-900'
                    )}
                  >
                    <Zap
                      className={cn(
                        'h-4 w-4',
                        result?.isCorrect === false ? 'fill-red-500 text-red-500' : 'fill-blue-500 text-blue-500'
                      )}
                    />
                    {result?.isCorrect === false ? 'Correction' : 'Explanation'}
                  </h4>
                  <div
                    className={cn(
                      'prose prose-sm max-w-none text-gray-700',
                      result?.isCorrect === false ? 'prose-red' : 'prose-blue'
                    )}
                  >
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>
                      {result?.explanation || question.explanation}
                    </ReactMarkdown>
                  </div>
                </motion.div>
              )}

              {/* Removed Confidence Slider */}

              {/* Warning for unanswered questions */}
              {!selectedOption && !isAnswered && <div className="h-4" />}

              {/* Sticky Action Buttons Footer */}
              <div className="sticky bottom-0 -mx-5 -mb-5 sm:-mx-6 sm:-mb-6 p-4 bg-white/95 backdrop-blur-md border-t border-gray-100 z-20 flex items-center justify-between mt-2 rounded-b-xl shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]">
                <div className="flex items-center gap-2">
                  {onPrevious && questionNumber > 1 && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={onPrevious}
                      className="gap-2 text-gray-500 hover:text-gray-900 h-9"
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Prev
                    </Button>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  {!isAnswered && selectedOption && (
                    <Button
                      onClick={handleSubmitAnswer}
                      className="bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white px-6 h-10 shadow-md shadow-green-200"
                    >
                      <CheckCircle2 className="h-4 w-4 mr-2" />
                      Submit
                    </Button>
                  )}

                  {isAnswered && onNext && (
                    <Button
                      onClick={onNext}
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white px-6 h-10 shadow-md shadow-blue-200"
                    >
                      Next
                      <ChevronRight className="h-4 w-4 ml-2" />
                    </Button>
                  )}
                </div>
              </div>

              {/* Spacer to prevent content from being hidden behind sticky footer */}
              {/* <div className="h-4" /> */}

              {/* Question Metadata moved to top of footer or separate? Kept hidden for now or minimal */}
            </CardContent>
          </Card>
        </motion.div>

        {/* Question Metadata */}
        <div className="flex items-center justify-between text-xs text-gray-400 pt-4">
          <div className="flex items-center gap-4">
            <span>ID: {question.id.slice(-8)}</span>
          </div>
          <div className="flex items-center gap-2">
            {question.tags?.map(tag => (
              <Badge
                key={tag}
                variant="secondary"
                className="text-[10px] px-2 py-0 h-5 bg-gray-100 text-gray-500 hover:bg-gray-200 border-0"
              >
                #{tag}
              </Badge>
            ))}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
