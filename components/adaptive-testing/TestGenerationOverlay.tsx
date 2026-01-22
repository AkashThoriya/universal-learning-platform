'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Target, CheckCircle2, Loader2 } from 'lucide-react';
import { useEffect, useState } from 'react';

import { useAiThinking } from '@/hooks/use-ai-thinking';
import { Card, CardContent } from '@/components/ui/card';
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
  "Adaptive tests recalibrate difficulty after every question.",
  "Consistency is key to mastery.",
  "Take your time to understand the explanations.",
  "Focus on accuracy over speed for better adaptation.",
  "You can review your performance analytics after the test."
];

export function TestGenerationOverlay({ isVisible }: TestGenerationOverlayProps) {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);

  const { 
    currentStepIndex, 
    start, 
    reset 
  } = useAiThinking({
    steps: STEPS,
    autoStart: false
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
    if (!isVisible) return;
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
          className="fixed inset-0 z-50 flex items-center justify-center bg-white/80 backdrop-blur-md p-4"
        >
          <div className="max-w-md w-full space-y-8">
            <div className="text-center space-y-2">
              <motion.div
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ type: 'spring', damping: 20 }}
                className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg mb-4"
              >
                <Sparkles className="w-8 h-8" />
              </motion.div>
              <h2 className="text-2xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600">
                Designing Your Test
              </h2>
              <p className="text-gray-500">Our AI is crafting a personalized assessment just for you.</p>
            </div>

            <Card className="border-0 shadow-2xl bg-white/90 backdrop-blur">
              <CardContent className="p-6 space-y-6">
                <div className="space-y-4">
                  {STEPS.map((step, index) => {
                    // Logic: 
                    // - Completed: index < currentStepIndex
                    // - Current: index === currentStepIndex
                    // - Pending: index > currentStepIndex
                    
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    const isPending = index > currentStepIndex;
                    
                    // Special case for last step: If it's current, keep it "active" (spinning/pulsing) forever
                    const isLastStep = index === STEPS.length - 1;

                    return (
                      <div
                        key={step.id}
                        className={cn(
                          'flex items-center gap-4 transition-all duration-300',
                          isPending && 'opacity-40'
                        )}
                      >
                        <div className="relative">
                          <div
                            className={cn(
                              'w-8 h-8 rounded-full flex items-center justify-center transition-colors duration-300',
                              isCompleted
                                ? 'bg-green-100 text-green-600'
                                : isCurrent
                                ? 'bg-blue-100 text-blue-600'
                                : 'bg-gray-100 text-gray-400'
                            )}
                          >
                            {isCompleted ? (
                              <CheckCircle2 className="w-5 h-5" />
                            ) : (
                              <step.icon className={cn('w-4 h-4', isCurrent && (isLastStep ? 'animate-spin' : 'animate-pulse'))} />
                            )}
                          </div>
                          {index < STEPS.length - 1 && (
                            <div
                              className={cn(
                                'absolute top-8 left-4 w-0.5 h-6 -ml-[1px]',
                                isCompleted ? 'bg-green-200' : 'bg-gray-100'
                              )}
                            />
                          )}
                        </div>
                        <div className="flex-1">
                          <p
                            className={cn(
                              'text-sm font-medium transition-colors',
                              isCurrent ? 'text-blue-700' : isCompleted ? 'text-gray-600' : 'text-gray-400'
                            )}
                          >
                            {isLastStep && isCurrent ? 'Finalizing details...' : step.label}
                          </p>
                        </div>
                        {isCurrent && (
                          <motion.div
                            layoutId="active-step-indicator"
                            className="w-2 h-2 rounded-full bg-blue-500"
                            transition={{ type: 'spring', damping: 20 }}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>
                
                {/* Rotating Tips Section */}
                <div className="pt-4 border-t border-gray-100">
                    <div className="flex items-center gap-2 mb-2">
                        <span className="text-xs font-bold text-purple-600 px-2 py-0.5 bg-purple-50 rounded-full">Pro Tip</span>
                    </div>
                    <div className="h-10 relative overflow-hidden">
                        <AnimatePresence mode="wait">
                            <motion.p 
                                key={currentTipIndex}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                                exit={{ opacity: 0, y: -10 }}
                                className="text-sm text-gray-600 leading-snug absolute w-full"
                            >
                                {TIPS[currentTipIndex]}
                            </motion.p>
                        </AnimatePresence>
                    </div>
                </div>

              </CardContent>
            </Card>

            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
              className="text-center text-xs text-gray-400"
            >
              Powered by Gemini 2.5 Pro
            </motion.p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
