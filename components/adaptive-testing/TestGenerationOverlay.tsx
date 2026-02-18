'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Target, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { Card, CardContent } from '@/components/ui/card';
import { useAiThinking } from '@/hooks/use-ai-thinking';
import { cn } from '@/lib/utils/utils';

type GenerationStep = {
  id: string;
  label: string;
  icon: React.ElementType;
  duration: number; // Duration in ms to simulate this step
};

const STEPS: GenerationStep[] = [
  { id: 'analyze', label: 'Analyzing your Weak Areas', icon: Brain, duration: 1500 },
  { id: 'curate', label: 'Curating Topic List', icon: Target, duration: 1200 },
  { id: 'draft', label: 'Drafting Questions', icon: Sparkles, duration: 2500 },
  { id: 'calibrate', label: 'Calibrating Difficulty', icon: Loader2, duration: 1500 },
  { id: 'finalize', label: 'Finalizing Test', icon: Loader2, duration: 1000 },
];

interface TestGenerationOverlayProps {
  isVisible: boolean;
  onComplete?: () => void;
}

const TIPS = [
  'Adaptive tests recalibrate difficulty after every question.',
  'Consistency is key to mastery.',
  'Take your time to understand the explanations.',
  'Focus on accuracy over speed for better adaptation.',
  'You can review your performance analytics after the test.',
];

export function TestGenerationOverlay({ isVisible }: TestGenerationOverlayProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const { currentStepIndex, start, reset } = useAiThinking({
    steps: STEPS,
    autoStart: false,
  });

  // Handle visibility changes
  useEffect(() => {
    if (isVisible) {
      start();
      setCurrentTipIndex(0);
    } else {
      reset();
    }
  }, [isVisible, start, reset]);

  // Rotate tips
  useEffect(() => {
    if (!isVisible) {
      return;
    }
    const interval = setInterval(() => {
      setCurrentTipIndex(prev => (prev + 1) % TIPS.length);
    }, 3000);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[60] flex items-center justify-center bg-white/90 backdrop-blur-xl p-4"
        >
          <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none">
            <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-blue-100/50 rounded-full blur-[100px] animate-pulse"></div>
            <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-100/50 rounded-full blur-[100px] animate-pulse delay-1000"></div>
          </div>

          <div className="max-w-md w-full space-y-8 relative z-10">
            <div className="text-center space-y-4">
              <motion.div
                initial={{ scale: 0.8, opacity: 0, rotate: -10 }}
                animate={{ scale: 1, opacity: 1, rotate: 0 }}
                transition={{ type: 'spring', damping: 15 }}
                className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-blue-600 to-purple-600 text-white shadow-xl shadow-purple-200 mb-2"
              >
                <Sparkles className="w-10 h-10 animate-pulse" />
              </motion.div>
              <div>
                <h2 className="text-3xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-purple-600 to-indigo-600 pb-1">
                  Constructing Test
                </h2>
                <p className="text-gray-500 font-medium">Personalizing your assessment...</p>
              </div>
            </div>

            <Card className="border-0 shadow-2xl bg-white/80 backdrop-blur-lg overflow-hidden ring-1 ring-black/5">
              <CardContent className="p-8 space-y-8">
                <div className="space-y-5 relative">
                  {/* Vertical Line */}
                  <div className="absolute left-4 top-2 bottom-4 w-0.5 bg-gray-100" />

                  {STEPS.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isPending = index > currentStepIndex;
                    const isLastStep = index === STEPS.length - 1;

                    return (
                      <div
                        key={step.id}
                        className={cn('flex items-center gap-4 relative z-10 transition-all duration-500', isPending && 'opacity-30 blur-[0.5px] scale-95 origin-left')}
                      >
                        <div
                          className={cn(
                            'w-8 h-8 rounded-full flex items-center justify-center transition-all duration-500 border-2',
                            isCompleted
                              ? 'bg-green-500 border-green-500 text-white scale-100 shadow-lg shadow-green-200'
                              : isCurrent
                                ? 'bg-white border-blue-500 text-blue-600 scale-110 shadow-lg shadow-blue-100'
                                : 'bg-gray-50 border-gray-200 text-gray-300 scale-90'
                          )}
                        >
                          {isCompleted ? (
                            <CheckCircle2 className="w-5 h-5" />
                          ) : (
                            <step.icon
                                className={cn('w-4 h-4', isCurrent && 'animate-pulse')}
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              'text-sm font-semibold transition-colors duration-300',
                              isCurrent ? 'text-gray-900 translate-x-1' : isCompleted ? 'text-gray-500' : 'text-gray-300'
                            )}
                          >
                            {isLastStep && isCurrent ? 'Finalizing details...' : step.label}
                          </p>
                        </div>
                        {isCurrent && (
                          <motion.div 
                            layoutId="spinner"
                            className="w-4 h-4 rounded-full border-2 border-blue-500 border-t-transparent animate-spin"
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                {/* Rotating Tips Section */}
                <div className="pt-6 border-t border-gray-100">
                  <div className="bg-blue-50/50 rounded-xl p-4 border border-blue-100/50">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="bg-blue-100 p-1 rounded text-blue-600">
                        <Brain className="w-3 h-3" />
                      </div>
                      <span className="text-xs font-bold text-blue-600 uppercase tracking-wide">
                        Pro Tip
                      </span>
                    </div>
                    <div className="h-10 relative overflow-hidden flex items-center">
                      <AnimatePresence mode="wait">
                        <motion.p
                          key={currentTipIndex}
                          initial={{ opacity: 0, x: 20 }}
                          animate={{ opacity: 1, x: 0 }}
                          exit={{ opacity: 0, x: -20 }}
                          transition={{ duration: 0.3 }}
                          className="text-sm text-gray-600 font-medium leading-relaxed"
                        >
                          "{TIPS[currentTipIndex]}"
                        </motion.p>
                      </AnimatePresence>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
