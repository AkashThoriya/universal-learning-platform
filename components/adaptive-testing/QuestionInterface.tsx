'use client';

import { AnimatePresence, motion } from 'framer-motion';
import {
  CheckCircle2,
  Brain,
  Clock,
  ChevronRight,
  Flag,
  Bookmark,
  XCircle,
} from 'lucide-react';
import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
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
  showTimer?: boolean;
  timeLimit?: number | undefined; // seconds
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
  onAnswer,
  onNext,
  onBookmark,
  onFlag,
  isBookmarked = false,
  isFlagged = false,
  showTimer = true,
  timeLimit, 
  adaptiveMode = true,
  className,
  result,
}: QuestionInterfaceProps) {
  const [selectedOption, setSelectedOption] = useState<string | null>(null);
  const [confidence] = useState<number[]>([75]);
  const [timeSpent, setTimeSpent] = useState(0);
  const [isAnswered, setIsAnswered] = useState(false);
  const [isTimeExpired, setIsTimeExpired] = useState(false);
  const [questionStartTime] = useState(Date.now());
  const [remainingTime, setRemainingTime] = useState(timeLimit ? timeLimit * 1000 : 0);

  // Timer effect
  useEffect(() => {
    const interval = setInterval(() => {
      const elapsed = Date.now() - questionStartTime;
      setTimeSpent(elapsed);

      if (timeLimit) {
        const remaining = (timeLimit * 1000) - elapsed;
        setRemainingTime(Math.max(0, remaining));

        if (remaining <= 0 && !isAnswered && !isTimeExpired) {
          setIsTimeExpired(true);
          handleAutoSubmit();
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [questionStartTime, timeLimit, isAnswered, isTimeExpired]);

  const handleAutoSubmit = useCallback(() => {
    if (isAnswered) return;

    setIsAnswered(true);
    // Submit with null answer or special flag if supported, currently submitting empty/timeout
    // We'll mark it as a timeout/incorrect
    onAnswer(question.id, 'TIME_EXPIRED', 1, timeLimit ? timeLimit * 1000 : timeSpent);
  }, [isAnswered, question.id, timeLimit, timeSpent, onAnswer]);

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
    const totalSeconds = Math.ceil(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  const getDifficultyColor = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return 'bg-green-100 text-green-700 border-green-200';
      case 'intermediate':
        return 'bg-blue-100 text-blue-700 border-blue-200';
      case 'advanced':
        return 'bg-orange-100 text-orange-700 border-orange-200';
      case 'expert':
        return 'bg-red-100 text-red-700 border-red-200';
      default:
        return 'bg-gray-100 text-gray-700 border-gray-200';
    }
  };

  const getProgressPercentage = () => (questionNumber / totalQuestions) * 100;

  return (
    <TooltipProvider>
      <div className={cn('max-w-4xl mx-auto space-y-8', className)}>
        {/* Progress Header */}
        <div className="flex flex-col gap-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-700 font-bold shadow-sm ring-2 ring-white">
                {questionNumber}
              </div>
              <div className="flex flex-col">
                <span className="text-xs text-muted-foreground uppercase tracking-wider font-semibold">Question</span>
                <span className="text-sm font-medium text-gray-900">of {totalQuestions}</span>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {adaptiveMode && (
                <Badge variant="outline" className={cn(getDifficultyColor(String(question.difficulty)), 'px-3 py-1')}>
                  <Brain className="h-3.5 w-3.5 mr-1.5" />
                  {String(question.difficulty)}
                </Badge>
              )}
              {showTimer && (
                <div
                  className={cn(
                    'flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium transition-colors border shadow-sm',
                    timeLimit
                      ? (remainingTime < 10000 ? 'bg-red-50 text-red-700 border-red-200 animate-pulse' : 'bg-blue-50 text-blue-700 border-blue-200')
                      : (timeSpent > 120000 ? 'bg-orange-50 text-orange-700 border-orange-200 animate-pulse' : 'bg-white text-gray-600 border-gray-200')
                  )}
                >
                  <Clock className="h-4 w-4" />
                  <span className="font-mono tabular-nums">
                    {timeLimit ? formatTime(remainingTime) : formatTime(timeSpent)}
                  </span>
                </div>
              )}
            </div>
          </div>

          <div className="h-2 w-full bg-gray-100 rounded-full overflow-hidden">
            <motion.div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500"
              initial={{ width: 0 }}
              animate={{ width: `${getProgressPercentage()}%` }}
              transition={{ duration: 0.5, ease: 'easeOut' }}
            />
          </div>
        </div>

        {/* Question Card */}
        <motion.div
          key={question.id} // Key ensures remount animation on new question
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="space-y-8"
        >
          {/* Question Text */}
          <div className="prose prose-lg max-w-none text-gray-900">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{question.question}</ReactMarkdown>
          </div>

          {question.codeSnippet && (
            <pre className="p-4 rounded-xl bg-slate-900 border border-slate-800 text-slate-50 overflow-x-auto shadow-inner text-sm font-mono leading-relaxed">
              <code>{question.codeSnippet}</code>
            </pre>
          )}

          {/* Answer Options Grid */}
          <div className="grid grid-cols-1 gap-4">
                {question.options?.map((option: string, index: number) => {
                  const optionId = `option-${index}`;
                  const isSelected = selectedOption === optionId;

                  // Determine visual state
                  let state: 'idle' | 'selected' | 'correct' | 'incorrect' = 'idle';
                  let isDisabled = false;

                  if (isAnswered) {
                    isDisabled = true;
                      if (result) {
                        const isOptionCorrect =
                          option === result.correctAnswer ||
                          index + 1 === result.correctAnswer ||
                          optionId === result.correctAnswer;

                          if (isOptionCorrect) state = 'correct';
                          else if (isSelected) state = 'incorrect';
                          else state = 'idle'; // Other incorrect options fade out
                        }
                    } else {
                      if (isSelected) state = 'selected';
                    }

                  return (
                      <motion.button
                        key={optionId}
                        onClick={() => handleOptionSelect(optionId)}
                        disabled={isDisabled}
                        whileHover={!isDisabled ? { scale: 1.01, backgroundColor: 'rgba(59, 130, 246, 0.04)' } : {}}
                        whileTap={!isDisabled ? { scale: 0.99 } : {}}
                        className={cn(
                              'relative w-full text-left p-5 rounded-2xl border-2 transition-all duration-200 group flex items-start gap-4',
                              state === 'idle' && 'bg-white border-gray-100 hover:border-blue-200 shadow-sm hover:shadow-md',
                              state === 'selected' && 'bg-blue-50/50 border-blue-500 shadow-md ring-1 ring-blue-500',
                              state === 'correct' && 'bg-green-50/50 border-green-500 shadow-md ring-1 ring-green-500',
                              state === 'incorrect' && 'bg-red-50/50 border-red-500 shadow-md ring-1 ring-red-500',
                              isAnswered && state === 'idle' && 'opacity-60 bg-gray-50 border-gray-100 grayscale-[0.5]'
                            )}
                      >
                        {/* Option Key Indicator (1, 2, 3...) */}
                        <div className={cn(
                          "flex-shrink-0 w-8 h-8 rounded-lg flex items-center justify-center font-bold text-sm transition-colors duration-200",
                          state === 'idle' && "bg-gray-100 text-gray-500 group-hover:bg-blue-100 group-hover:text-blue-600",
                          state === 'selected' && "bg-blue-600 text-white",
                          state === 'correct' && "bg-green-600 text-white",
                          state === 'incorrect' && "bg-red-600 text-white"
                        )}>
                          {state === 'correct' ? <CheckCircle2 className="w-5 h-5" /> :
                            state === 'incorrect' ? <XCircle className="w-5 h-5" /> :
                              index + 1}
                        </div>

                        {/* Option Content */}
                        <div className="flex-1 pt-1">
                          <span className={cn(
                            "text-base leading-relaxed transition-colors",
                            state === 'selected' ? "font-semibold text-blue-900" :
                              state === 'correct' ? "font-semibold text-green-900" :
                                state === 'incorrect' ? "font-medium text-red-900" :
                                  "font-medium text-gray-700 group-hover:text-gray-900"
                          )}>
                            <ReactMarkdown components={{ p: 'span' }}>{option}</ReactMarkdown>
                          </span>
                        </div>

                        {/* Keyboard Badge hint on hover */}
                        {!isAnswered && (
                          <div className="absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Badge variant="secondary" className="text-[10px] h-5 bg-gray-100 text-gray-500">Key {index + 1}</Badge>
                          </div>
                        )}
                      </motion.button>
                    );
                })}
          </div>
        </motion.div>

        {/* Action Bar (Sticky Bottom) */}
        <div className="sticky bottom-4 left-0 right-0 z-20">
          <motion.div
            initial={false}
            animate={{ y: result ? 0 : 0 }}
            className="bg-white/90 backdrop-blur-md border shadow-lg rounded-2xl p-4 flex items-center justify-between gap-4 max-w-4xl mx-auto"
          >
            <div className="flex items-center gap-2">
              {/* Tools */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onBookmark?.(question.id)} className={cn(isBookmarked && "text-yellow-500 bg-yellow-50")}>
                    <Bookmark className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Bookmark</TooltipContent>
              </Tooltip>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" onClick={() => onFlag?.(question.id)} className={cn(isFlagged && "text-red-500 bg-red-50")}>
                    <Flag className="w-5 h-5" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>Report Issue</TooltipContent>
              </Tooltip>
            </div>

            <div className="flex items-center gap-3">
              {!isAnswered ? (
                <Button
                  size="lg"
                  className="w-full sm:w-auto min-w-[140px] bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 shadow-lg text-lg h-12 rounded-xl"
                  disabled={!selectedOption}
                  onClick={handleSubmitAnswer}
                >
                  Submit <span className="text-white/60 text-xs ml-2 font-normal">(Enter)</span>
                </Button>
              ) : (
                <Button
                    size="lg"
                    className="w-full sm:w-auto min-w-[140px] bg-gray-900 hover:bg-black text-white shadow-lg text-lg h-12 rounded-xl"
                    onClick={onNext}
                  >
                  Next Question <ChevronRight className="w-5 h-5 ml-2" />
                </Button>
              )}
            </div>
          </motion.div>
        </div>

        {/* Result Feedback Overlay */}
        <AnimatePresence>
          {isAnswered && result && (
            <motion.div
              initial={{ opacity: 0, y: 20, height: 0 }}
              animate={{ opacity: 1, y: 0, height: 'auto' }}
              exit={{ opacity: 0, y: 20, height: 0 }}
              transition={{ type: "spring", stiffness: 300, damping: 30 }}
              className="overflow-hidden"
            >
              <div className={cn(
                "rounded-2xl border-l-4 p-6 shadow-sm",
                result.isCorrect ? "bg-green-50/50 border-green-500" : "bg-red-50/50 border-red-500"
              )}>
                <h4 className={cn(
                  "flex items-center gap-2 font-bold mb-3 text-lg",
                  result.isCorrect ? "text-green-800" : "text-red-800"
                )}>
                  {result.isCorrect ? (
                    <><CheckCircle2 className="w-6 h-6" /> Correct!</>
                  ) : (
                    <><XCircle className="w-6 h-6" /> Incorrect</>
                  )}
                </h4>

                {(result.explanation || question.explanation) && (
                  <div className="mt-4 pt-4 border-t border-black/5">
                    <div className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2">
                      <Brain className="w-4 h-4 text-gray-500" />
                      Explanation
                    </div>
                    <div className="prose prose-sm max-w-none text-gray-700 leading-relaxed">
                      <ReactMarkdown
                        remarkPlugins={[remarkGfm]}
                        components={{
                          code: ({ node, inline, className, children, ...props }: any) => {

                            return !inline ? (
                              <pre className="bg-slate-900 text-slate-50 p-3 rounded-lg overflow-x-auto my-2 text-xs">
                                <code className={className} {...props}>
                                  {children}
                                </code>
                              </pre>
                            ) : (
                              <code className="bg-gray-100 text-gray-800 px-1.5 py-0.5 rounded text-xs font-mono border border-gray-200" {...props}>
                                {children}
                              </code>
                            )
                          }
                        }}
                      >
                        {result.explanation || question.explanation || ''}
                      </ReactMarkdown>
                    </div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </TooltipProvider>
  );
}

