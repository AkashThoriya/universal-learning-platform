'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Brain, Sparkles, Target, CheckCircle2, Loader2, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';
import { Dialog, DialogContent, DialogTrigger, DialogTitle } from '@/components/ui/dialog';
import { VisuallyHidden } from '@radix-ui/react-visually-hidden';
import { journeyService } from '@/lib/services/journey-service';
import { useToast } from '@/hooks/use-toast';
import { llmService } from '@/lib/ai/llm-service';

// Thinking Steps
import { useAiThinking } from '@/hooks/use-ai-thinking';

// ... imports remain same ...

// Thinking Steps
const STEPS = [
  { id: 'analyze', label: 'Analyzing your Goal', icon: Brain, duration: 1500 },
  { id: 'structure', label: 'Structuring Milestones', icon: Target, duration: 1500 },
  { id: 'timeline', label: 'Drafting Timeline', icon: Loader2, duration: 1500 },
  { id: 'finalize', label: 'Finalizing Personal Plan', icon: CheckCircle2, duration: 1000 },
];

// Types
interface JourneyArchitectProps {
  userId: string;
  onJourneyCreated: () => void;
  trigger?: React.ReactNode;
}

interface GeneratedJourneyPlan {
  title: string;
  description: string;
  targetWeeks: number;
  priority: 'high' | 'low' | 'medium' | 'critical';
  track: string;
  milestones: {
    title: string;
    deadlineOffsetWeeks: number;
  }[];
}

export function JourneyArchitect({ userId, onJourneyCreated, trigger }: JourneyArchitectProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [goal, setGoal] = useState('');
  const [status, setStatus] = useState<'idle' | 'thinking' | 'review'>('idle');
  const [generatedPlan, setGeneratedPlan] = useState<GeneratedJourneyPlan | null>(null);
  const { toast } = useToast();

  const { 
    currentStepIndex, 
    start: startThinking, 
    reset: resetThinking 
  } = useAiThinking({
    steps: STEPS,
    autoStart: false
  });

  const startArchitect = async () => {
    if (!goal.trim()) return;
    setStatus('thinking');
    startThinking();

    try {
      // Parallel execution: Visuals run while API calls
      const response = await llmService.generateJourneyPlan(goal);
      
      if (response.success && response.data) {
        setGeneratedPlan(response.data);
        setStatus('review');
      } else {
        throw new Error(response.error || 'Failed to generate plan');
      }
    } catch (error) {
      resetThinking();
      setStatus('idle');
      toast({
        title: 'Architect Error',
        description: 'Failed to design your journey. Please try again.',
        variant: 'destructive'
      });
    }
  };

  const confirmJourney = async () => {
     // ... logic remains same ...
     if (!generatedPlan) return;
    
    try {
      const result = await journeyService.createJourney(userId, {
        title: generatedPlan.title,
        description: generatedPlan.description,
        targetCompletionDate: new Date(Date.now() + (generatedPlan.targetWeeks * 7 * 24 * 60 * 60 * 1000)),
        priority: generatedPlan.priority || 'medium',
        track: (generatedPlan.track as 'exam' | 'course_tech') || 'exam',
        customGoals: generatedPlan.milestones.map((m) => ({
          title: m.title,
          description: m.title,
          targetValue: 100,
          unit: 'percentage' as const,
          category: 'knowledge' as const,
          isSpecific: true,
          isMeasurable: true,
          isAchievable: true,
          isRelevant: true,
          isTimeBound: true,
          deadline: new Date(Date.now() + (m.deadlineOffsetWeeks * 7 * 24 * 60 * 60 * 1000)),
          linkedSubjects: [],
          linkedTopics: [],
          autoUpdateFrom: 'manual' as const,
        }))
      });

      if (result.success) {
        toast({
          title: 'Journey Launched!',
          description: 'Your AI-designed path is ready.',
        });
        setIsOpen(false);
        setStatus('idle');
        setGoal('');
        resetThinking();
        onJourneyCreated();
      }
    } catch (error) {
      toast({ title: 'Error', description: 'Failed to save journey.', variant: 'destructive' });
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => { setIsOpen(open); if(!open) { setStatus('idle'); resetThinking(); } }}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-700 hover:to-purple-700 text-white shadow-lg shadow-indigo-500/20">
            <Sparkles className="h-4 w-4" />
            AI Journey Architect
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] min-h-[400px] flex flex-col justify-center">
        <VisuallyHidden>
          <DialogTitle>AI Journey Architect</DialogTitle>
        </VisuallyHidden>
        <AnimatePresence mode="wait">
          {status === 'idle' && (
            <motion.div
              key="input"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="space-y-6"
            >
              <div className="text-center space-y-2">
                <div className="mx-auto w-12 h-12 bg-indigo-100 rounded-xl flex items-center justify-center mb-4">
                  <Brain className="w-6 h-6 text-indigo-600" />
                </div>
                <h3 className="text-2xl font-bold text-gray-900">What's your next goal?</h3>
                <p className="text-gray-500">Tell our AI what you want to achieve (e.g., "Master Python for Data Science in 3 months")</p>
              </div>
              
              <div className="flex gap-2">
                <Input 
                  value={goal} 
                  onChange={(e) => setGoal(e.target.value)}
                  placeholder="I want to learn..."
                  className="text-lg h-12"
                  onKeyDown={(e) => e.key === 'Enter' && startArchitect()}
                  autoFocus
                />
                <Button size="lg" onClick={startArchitect} disabled={!goal.trim()} className="bg-indigo-600 hover:bg-indigo-700">
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </div>
            </motion.div>
          )}

          {status === 'thinking' && (
            <motion.div
              key="thinking"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="space-y-6"
            >
               <div className="text-center space-y-2">
                <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-indigo-50 animate-pulse mb-4">
                  <Sparkles className="w-8 h-8 text-indigo-600" />
                </div>
                <h3 className="text-xl font-bold bg-clip-text text-transparent bg-gradient-to-r from-indigo-600 to-purple-600">
                  Architecting Your Path
                </h3>
              </div>
              
              <Card className="border-0 bg-gray-50/50">
                <CardContent className="p-6 space-y-4">
                  {STEPS.map((step, index) => {
                    const isCompleted = index < currentStepIndex;
                    const isCurrent = index === currentStepIndex;
                    
                    return (
                      <div key={step.id} className="flex items-center gap-3">
                        <div className={cn(
                          "w-6 h-6 rounded-full flex items-center justify-center transition-colors",
                          isCompleted ? "bg-green-100 text-green-600" : isCurrent ? "bg-indigo-100 text-indigo-600" : "bg-gray-100 text-gray-300"
                        )}>
                          {isCompleted ? <CheckCircle2 className="w-4 h-4" /> : <step.icon className="w-3 h-3" />}
                        </div>
                        <span className={cn(
                          "text-sm font-medium transition-colors",
                          isCurrent ? "text-indigo-900" : isCompleted ? "text-gray-500" : "text-gray-400"
                        )}>{step.label}</span>
                      </div>
                    )
                  })}
                </CardContent>
              </Card>
            </motion.div>
          )}

          {status === 'review' && generatedPlan && (
             <motion.div
              key="review"
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              className="space-y-6"
            >
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                   <h3 className="text-xl font-bold text-gray-900">{generatedPlan.title}</h3>
                   <span className="px-2 py-1 bg-indigo-100 text-indigo-700 text-xs rounded-full font-medium">
                     {generatedPlan.targetWeeks} Weeks
                   </span>
                </div>
                <p className="text-gray-600">{generatedPlan.description}</p>
              </div>

              <div className="space-y-3">
                <h4 className="text-sm font-semibold text-gray-900 uppercase tracking-wider">Milestones</h4>
                {generatedPlan.milestones.map((m: any, i: number) => (
                  <Card key={i} className="border-l-4 border-l-indigo-500">
                    <CardContent className="p-4 flex justify-between items-center">
                      <span className="font-medium text-gray-800">{m.title}</span>
                      <span className="text-xs text-gray-500">Week {m.deadlineOffsetWeeks}</span>
                    </CardContent>
                  </Card>
                ))}
              </div>

              <div className="flex gap-3 pt-4">
                <Button variant="outline" className="flex-1" onClick={() => setStatus('idle')}>
                  Back
                </Button>
                <Button className="flex-1 bg-indigo-600 hover:bg-indigo-700" onClick={confirmJourney}>
                  Start Journey
                </Button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </DialogContent>
    </Dialog>
  );
}
