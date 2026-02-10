'use client';

import { useState, useRef, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import {
  BookOpen, Calendar, Target,
  ArrowLeft, CheckCircle, Loader2, HelpCircle, ArrowRight
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useToast } from '@/hooks/use-toast';
import { useCourse, DEFAULT_COURSE_SETTINGS } from '@/contexts/CourseContext';
import { useAuth } from '@/contexts/AuthContext';
import { CourseType } from '@/types/course-progress';
import { Timestamp } from 'firebase/firestore';

// Steps
import { CourseSelectionStep } from './CourseSelectionStep';
import { StrategyStep } from './StrategyStep';
import { ReviewStep } from './ReviewStep';

export type WizardData = {
  selectedExamId: string;
  courseName: string;
  courseType: CourseType;
  startDate: Date;
  targetDate?: Date | undefined;
  dailyStudyHours: number;
  studyDays: number[]; // 0-6
};

const INITIAL_DATA: WizardData = {
  selectedExamId: '',
  courseName: '',
  courseType: 'exam',
  startDate: new Date(),
  dailyStudyHours: 2,
  studyDays: [1, 2, 3, 4, 5], // Mon-Fri
};

const STEPS = [
  {
    id: 1,
    title: 'Select Course',
    description: 'Choose your exam or skill track',
    icon: <BookOpen className="w-5 h-5 text-blue-600" />,
    helpText: 'Select the exam you are preparing for. This determines your syllabus.'
  },
  {
    id: 2,
    title: 'Strategy & Pace',
    description: 'Set your timeline and availability',
    icon: <Calendar className="w-5 h-5 text-blue-600" />,
    helpText: 'We need to know when you start and when you finish to build a plan.'
  },
  {
    id: 3,
    title: 'Review & Launch',
    description: 'Verify your plan and launch',
    icon: <Target className="w-5 h-5 text-blue-600" />,
    helpText: 'Double check everything before generating your personalized strategy.'
  },
];

export function WizardContainer() {
  const router = useRouter();
  const { toast } = useToast();
  const { addCourse } = useCourse();
  const { user } = useAuth();

  const [currentStep, setCurrentStep] = useState(1);
  const [data, setData] = useState<WizardData>(INITIAL_DATA);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);

  const stepContentRef = useRef<HTMLDivElement>(null);
  const pageTopRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    // Scroll to top when step changes
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [currentStep]);

  const updateData = (updates: Partial<WizardData>) => {
    setData(prev => ({ ...prev, ...updates }));
  };

  const handleNext = async () => {
    if (currentStep < STEPS.length) {
      setIsNavigating(true);
      // Simulate small delay for smooth feel
      await new Promise(resolve => setTimeout(resolve, 300));
      setCurrentStep(prev => prev + 1);
      setIsNavigating(false);
    } else {
      handleSubmit();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    try {
      if (!data.selectedExamId) throw new Error('No exam selected');
      if (!user) throw new Error('User not authenticated');

      // 1. Create the Course Document
      await addCourse({
        courseId: data.selectedExamId,
        courseName: data.courseName,
        courseType: data.courseType,
        status: 'active',
        isPrimary: true,
        settings: {
          ...DEFAULT_COURSE_SETTINGS,
          dailyGoalMinutes: data.dailyStudyHours * 60,
          weeklyGoalHours: data.dailyStudyHours * data.studyDays.length,
          activeDays: data.studyDays,
        },
        ...(data.targetDate ? { targetDate: Timestamp.fromDate(data.targetDate) } : {}),
      });

      // 2. Initialize Syllabus for the new course
      const { getExamById } = await import('@/lib/data/exams-data');
      const { saveSyllabusForCourse } = await import('@/lib/firebase/firebase-utils');

      const exam = getExamById(data.selectedExamId);
      if (exam && exam.defaultSyllabus) {
        await saveSyllabusForCourse(user.uid, data.selectedExamId, exam.defaultSyllabus);
      }

      toast({
        title: 'Course Launched! 🚀',
        description: 'Your strategy is ready. Let\'s get started.',
      });

      router.push('/syllabus');
    } catch (error) {
      console.error('Failed to create course:', error);
      toast({
        title: 'Error',
        description: 'Failed to create course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const currentStepInfo = STEPS[currentStep - 1];
  if (!currentStepInfo) return null;

  const progress = ((currentStep) / (STEPS.length)) * 100;

  return (
    <TooltipProvider>
      <div className="max-w-4xl mx-auto pb-20 pt-4">
        <div ref={pageTopRef} />

        {/* Integrated Header & Stepper - Matches Onboarding Style */}
        <div className="bg-white/95 backdrop-blur-sm border border-slate-200 rounded-xl shadow-sm mb-6 px-6 py-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            {/* Step Info */}
            <div className="flex items-center space-x-4">
              <div className="p-2 bg-blue-50 rounded-lg">
                {currentStepInfo.icon}
              </div>
              <div>
                <h1 className="text-lg font-bold text-gray-900">{currentStepInfo.title}</h1>
                <p className="text-sm text-muted-foreground hidden sm:block">
                  Step {currentStep} of {STEPS.length} • {currentStepInfo.description}
                </p>
                <p className="text-sm text-muted-foreground sm:hidden">
                  Step {currentStep} of {STEPS.length}
                </p>
              </div>
            </div>

            {/* Progress Bar & Actions */}
            <div className="flex items-center space-x-4 flex-1 md:flex-none justify-end">
              {/* Help Button */}
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8 text-slate-400 hover:text-slate-600">
                    <HelpCircle className="w-4 h-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>{currentStepInfo.helpText}</p>
                </TooltipContent>
              </Tooltip>

              {/* Progress Bar */}
              <div className="flex items-center space-x-3 min-w-[120px]">
                <div className="w-24 h-2 bg-gray-100 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full transition-all duration-500"
                    style={{ width: `${progress}%` }}
                  />
                </div>
                <span className="text-sm font-medium text-gray-700">{Math.round(progress)}%</span>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-xl border-0 bg-white/90 backdrop-blur-sm overflow-hidden min-h-[500px]">
          <CardContent ref={stepContentRef} className="p-0">
            <div className="p-6 md:p-8">
              <AnimatePresence mode="wait">
                <motion.div
                  key={currentStep}
                  initial={{ opacity: 0, x: 20 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: -20 }}
                  transition={{ duration: 0.3, ease: "easeInOut" }}
                  className="h-full"
                >
                  {currentStep === 1 && (
                    <CourseSelectionStep
                      data={data}
                      onSelect={(exam) => {
                        updateData({
                          selectedExamId: exam.id,
                          courseName: exam.name,
                          courseType: (exam.category || 'exam') as CourseType
                        });
                      }}
                    />
                  )}
                  {currentStep === 2 && (
                    <StrategyStep
                      data={data}
                      onChange={updateData}
                    />
                  )}
                  {currentStep === 3 && (
                    <ReviewStep
                      data={data}
                    />
                  )}
                </motion.div>
              </AnimatePresence>
            </div>
          </CardContent>
        </Card>

        {/* Navigation Footer */}
        <div className="flex justify-between items-center mt-6 px-2">
          <Button
            variant="ghost"
            onClick={handleBack}
            disabled={currentStep === 1 || isSubmitting}
            className={`
              text-slate-500 hover:text-slate-900 hover:bg-slate-100
              ${currentStep === 1 ? 'invisible' : 'visible'}
            `}
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back
          </Button>

          <Button
            onClick={handleNext}
            disabled={isSubmitting || (currentStep === 1 && !data.selectedExamId) || isNavigating}
            className={`
              min-w-[140px] px-6 py-2 shadow-lg hover:shadow-xl transition-all duration-300
              bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white rounded-full
            `}
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Launching...
              </>
            ) : isNavigating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : currentStep === STEPS.length ? (
              <>
                <CheckCircle className="w-4 h-4 mr-2" />
                Launch Strategy
              </>
            ) : (
              <>
                Continue
                <ArrowRight className="w-4 h-4 ml-2" />
              </>
            )}
          </Button>
        </div>
      </div>
    </TooltipProvider>
  );
}
