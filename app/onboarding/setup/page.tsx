/**
 * @fileoverview Onboarding Setup Flow - Streamlined Implementation
 *
 * A complete, user-friendly onboarding experience with intuitive navigation,
 * clear progress indication, and optimized UI/UX for exam preparation setup.
 *
 * @author Exam Strategy Engine Team
 * @version 3.0.0
 */

'use client';

import { Timestamp } from 'firebase/firestore';
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback } from 'react';
import { z } from 'zod';

import { PersonaDetectionStep } from '@/components/onboarding/PersonaDetectionCompact';
import { PersonalInfoStep } from '@/components/onboarding/PersonalInfoStepCompact';
import { SyllabusManagementStep, PreferencesStep } from '@/components/onboarding-steps-2';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useForm } from '@/hooks/useForm';
import { useMultiStepForm } from '@/hooks/useMultiStepForm';
import { EXAMS_DATA, getExamById } from '@/lib/exams-data';
import { createUser, saveSyllabus } from '@/lib/firebase-utils';
import { Exam, SyllabusSubject, User as UserType, UserPersona } from '@/types/exam';

/**
 * Onboarding form data structure
 */
interface OnboardingFormData {
  // Step 1: Persona Detection
  userPersona?: UserPersona;

  // Step 2: Personal Information
  displayName: string;
  selectedExamId: string;
  examDate: string;
  isCustomExam: boolean;

  // Step 3: Custom Exam Details (if applicable)
  customExam: {
    name?: string;
    description?: string;
    category?: string;
  };

  // Step 4: Syllabus Configuration
  syllabus: SyllabusSubject[];

  // Step 5: Study Preferences
  preferences: {
    dailyStudyGoalMinutes: number;
    preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
    tierDefinitions: {
      1: string;
      2: string;
      3: string;
    };
    revisionIntervals: number[];
    notifications: {
      revisionReminders: boolean;
      dailyGoalReminders: boolean;
      healthCheckReminders: boolean;
    };
  };
}

/**
 * Validation schema for onboarding form
 */
const onboardingSchema = z.object({
  userPersona: z.any().optional(),
  displayName: z.string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters'),
  selectedExamId: z.string().min(1, 'Please select an exam'),
  examDate: z.string()
    .min(1, 'Exam date is required')
    .refine((date) => {
      const examDate = new Date(date);
      const today = new Date();
      return examDate > today;
    }, 'Exam date must be in the future'),
  isCustomExam: z.boolean(),
  customExam: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional()
  }).refine((_data) => {
    return true; // We'll handle this in step validation
  }),
  syllabus: z.array(z.any()).min(1, 'At least one subject is required'),
  preferences: z.object({
    dailyStudyGoalMinutes: z.number()
      .min(60, 'Minimum study goal is 1 hour')
      .max(720, 'Maximum study goal is 12 hours'),
    preferredStudyTime: z.enum(['morning', 'afternoon', 'evening', 'night']),
    tierDefinitions: z.object({
      1: z.string().min(1, 'Tier 1 definition is required'),
      2: z.string().min(1, 'Tier 2 definition is required'),
      3: z.string().min(1, 'Tier 3 definition is required')
    }),
    revisionIntervals: z.array(z.number()).min(3, 'At least 3 revision intervals required'),
    notifications: z.object({
      revisionReminders: z.boolean(),
      dailyGoalReminders: z.boolean(),
      healthCheckReminders: z.boolean()
    })
  })
});

/**
 * Enhanced Onboarding Setup Page Component
 */
export default function OnboardingSetupPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Initialize form data with sensible defaults
  const initialFormData: OnboardingFormData = {
    userPersona: {
      type: 'student'
    },
    displayName: user?.displayName || '',
    selectedExamId: '',
    examDate: '',
    isCustomExam: false,
    customExam: {
      name: '',
      description: '',
      category: 'Custom'
    },
    syllabus: [],
    preferences: {
      dailyStudyGoalMinutes: 480, // 8 hours
      preferredStudyTime: 'morning',
      tierDefinitions: {
        1: 'High Priority - Core Topics',
        2: 'Medium Priority - Important Topics',
        3: 'Low Priority - Additional Topics'
      },
      revisionIntervals: [1, 3, 7, 16, 35],
      notifications: {
        revisionReminders: true,
        dailyGoalReminders: true,
        healthCheckReminders: true
      }
    }
  };

  // Multi-step form management
  const multiStep = useMultiStepForm({
    totalSteps: 4, // Updated to 4 steps (persona + exam + syllabus + preferences)
    persistState: true,
    storageKey: 'onboarding-progress',
    onStepChange: (current, previous) => {
      console.log(`Onboarding step changed: ${previous} → ${current}`);
    }
  });

  // Form state management
  const form = useForm({
    initialData: initialFormData,
    validationSchema: onboardingSchema,
    persistData: true,
    storageKey: 'onboarding-form-data',
    validateOnChange: false,
    validateOnBlur: true,
    onFormEvent: (event: string, data: any) => {
      console.log(`Form event: ${event}`, data);
    }
  });

  // State for UI interactions
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load selected exam when exam ID changes
  useEffect(() => {
    if (form.data.selectedExamId && form.data.selectedExamId !== 'custom') {
      const exam = getExamById(form.data.selectedExamId);
      setSelectedExam(exam || null);

      // Auto-populate syllabus for predefined exams
      if (exam && !form.data.isCustomExam) {
        form.updateField('syllabus', exam.defaultSyllabus);
      }
    } else {
      setSelectedExam(null);
    }
  }, [form.data.selectedExamId, form.data.isCustomExam]);

  // Filter exams based on search query
  const filteredExams = EXAMS_DATA.filter(exam =>
    exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Step validation functions
  const validateStep = useCallback(async (step: number): Promise<boolean> => {
    switch (step) {
      case 1:
        return !!(form.data.userPersona?.type);

      case 2:
        return !!(form.data.displayName.length >= 2 &&
                 form.data.selectedExamId &&
                 form.data.examDate &&
                 new Date(form.data.examDate) > new Date());

      case 3:
        return form.data.syllabus.length > 0;

      case 4:
        return form.data.preferences.dailyStudyGoalMinutes >= 60 &&
               form.data.preferences.tierDefinitions[1].length > 0 &&
               form.data.preferences.tierDefinitions[2].length > 0 &&
               form.data.preferences.tierDefinitions[3].length > 0;

      default:
        return true;
    }
  }, [form.data]);

  // Navigation handlers
  const handleNext = useCallback(async () => {
    const isValid = await validateStep(multiStep.currentStep);
    if (isValid) {
      multiStep.goToNext();
    } else {
      await form.validate();
    }
  }, [multiStep, validateStep, form]);

  const handlePrevious = useCallback(() => {
    multiStep.goToPrevious();
  }, [multiStep]);

  // Exam selection handler
  const handleExamSelect = useCallback((examId: string) => {
    if (examId === 'custom') {
      form.updateFields({
        selectedExamId: 'custom',
        isCustomExam: true,
        syllabus: []
      });
    } else {
      const exam = getExamById(examId);
      if (exam) {
        form.updateFields({
          selectedExamId: examId,
          isCustomExam: false,
          syllabus: exam.defaultSyllabus
        });
      }
    }
  }, [form]);

  // Syllabus management functions
  const updateSubjectTier = useCallback((subjectId: string, tier: 1 | 2 | 3) => {
    const updatedSyllabus = form.data.syllabus.map((subject: SyllabusSubject) =>
      subject.id === subjectId ? { ...subject, tier } : subject
    );
    form.updateField('syllabus', updatedSyllabus);
  }, [form]);

  const addCustomSubject = useCallback(() => {
    // This will be handled by a modal or inline input in the component
    // For now, we'll add a placeholder subject that can be edited
    const newSubject: SyllabusSubject = {
      id: `custom-${Date.now()}`,
      name: 'New Subject',
      tier: 2,
      topics: [],
      isCustom: true
    };
    form.updateField('syllabus', [...form.data.syllabus, newSubject]);
  }, [form]);

  const removeSubject = useCallback((subjectId: string) => {
    const updatedSyllabus = form.data.syllabus.filter(
      (subject: SyllabusSubject) => subject.id !== subjectId
    );
    form.updateField('syllabus', updatedSyllabus);
  }, [form]);

  // Complete onboarding handler
  const handleComplete = useCallback(async () => {
    if (!user) {
      form.setError('_form' as any, {
        message: 'You must be logged in to complete setup.',
        type: 'server',
        path: '_form'
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Final validation
      await form.validate();
      if (Object.keys(form.errors).length > 0) {
        throw new Error('Please fix the errors in the form before proceeding.');
      }

      // Prepare user data
      const userData: Partial<UserType> = {
        displayName: form.data.displayName,
        selectedExamId: form.data.selectedExamId,
        examDate: Timestamp.fromDate(new Date(form.data.examDate)),
        onboardingCompleted: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        userPersona: form.data.userPersona,
        preferences: form.data.preferences,
        isCustomExam: form.data.isCustomExam,
        customExam: form.data.isCustomExam ? form.data.customExam : undefined
      };

      // Save data concurrently for better performance
      const operations = await Promise.allSettled([
        createUser(user.uid, userData),
        saveSyllabus(user.uid, form.data.syllabus)
      ]);

      // Check for failures
      const failures = operations.filter((result) => result.status === 'rejected');
      if (failures.length > 0) {
        throw new Error('Failed to complete setup. Some data may not have been saved properly.');
      }

      // Clear persisted data
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('onboarding-progress');
          localStorage.removeItem('onboarding-form-data');
        } catch (error) {
          console.warn('Failed to clear localStorage:', error);
        }
      }

      // Navigate to dashboard
      const dashboardUrl = new URL('/dashboard', window.location.origin);
      dashboardUrl.searchParams.set('onboarding', 'complete');
      window.location.href = dashboardUrl.toString();

    } catch (error) {
      console.error('Error completing onboarding:', error);

      let errorMessage = 'Failed to complete setup. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('Firebase')) {
          errorMessage = 'Connection error. Please check your internet connection and try again.';
        } else if (error.message.includes('permission')) {
          errorMessage = 'Permission denied. Please refresh the page and try again.';
        } else if (error.message.includes('quota')) {
          errorMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
        } else {
          errorMessage = error.message;
        }
      }

      form.setError('_form' as any, {
        message: errorMessage,
        type: 'server',
        path: '_form'
      });
    } finally {
      setIsSubmitting(false);
    }
  }, [user, form, router]);

  // Render step content
  const renderStepContent = () => {
    switch (multiStep.currentStep) {
      case 1:
        return <PersonaDetectionStep form={form as any} />;

      case 2:
        return (
          <PersonalInfoStep
            form={form}
            filteredExams={filteredExams}
            searchQuery={searchQuery}
            setSearchQuery={setSearchQuery}
            onExamSelect={handleExamSelect}
            selectedExam={selectedExam}
          />
        );

      case 3:
        return <SyllabusManagementStep
          form={form}
          onUpdateSubjectTier={updateSubjectTier}
          onAddSubject={addCustomSubject}
          onRemoveSubject={removeSubject}
        />;

      case 4:
        return <PreferencesStep form={form} />;

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
      {/* Responsive Progress Indicator */}
      
      {/* Mobile: Bottom floating pill */}
      <div className="md:hidden fixed bottom-4 left-1/2 transform -translate-x-1/2 z-50">
        <div className="bg-white/95 backdrop-blur-sm rounded-full px-4 py-2 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-4 h-4 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
              <span className="text-xs font-bold text-white">{multiStep.currentStep}</span>
            </div>
            <div className="w-20 h-1 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${((multiStep.currentStep - 1) / (multiStep.totalSteps - 1)) * 100}%` }}
              />
            </div>
            <span className="text-xs font-medium text-gray-700">{multiStep.currentStep}/{multiStep.totalSteps}</span>
          </div>
        </div>
      </div>

      {/* Desktop: Top right floating pill */}
      <div className="hidden md:block fixed top-4 right-4 z-50">
        <div className="bg-white/95 backdrop-blur-sm rounded-full px-5 py-3 shadow-lg border border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <div className="w-6 h-6 rounded-full bg-gradient-to-r from-purple-500 to-blue-500 flex items-center justify-center">
                <span className="text-xs font-bold text-white">{multiStep.currentStep}</span>
              </div>
              <span className="text-sm font-medium text-gray-700">Step {multiStep.currentStep} of {multiStep.totalSteps}</span>
            </div>
            <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
              <div 
                className="h-full bg-gradient-to-r from-purple-500 to-blue-500 rounded-full transition-all duration-500"
                style={{ width: `${((multiStep.currentStep - 1) / (multiStep.totalSteps - 1)) * 100}%` }}
              />
            </div>
            <span className="text-sm text-gray-500">{Math.round(((multiStep.currentStep - 1) / (multiStep.totalSteps - 1)) * 100)}%</span>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto py-6 px-4 pb-20 md:pb-8">
        {/* Header - More Compact */}
        <div className="text-center mb-6">
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900 mb-3">
            <span className="bg-gradient-to-r from-purple-600 to-blue-600 bg-clip-text text-transparent">
              Welcome to Your
            </span>
            <br />
            Strategic Learning Journey
          </h1>
          <p className="text-gray-600 max-w-xl mx-auto text-sm md:text-base">
            Let's personalize your exam preparation
          </p>
        </div>

        {/* Form Errors */}
        {form.errors._form && (
          <Alert className="mb-6 border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {form.errors._form.message}
            </AlertDescription>
          </Alert>
        )}

        {/* Step Content - Optimized for viewport */}
        <Card className="mb-6 shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <div className="p-4 md:p-6">
            {renderStepContent()}
          </div>
        </Card>

        {/* Navigation - Mobile Optimized */}
        <div className="flex justify-between items-center">
          <Button
            variant="outline"
            onClick={handlePrevious}
            disabled={multiStep.isFirstStep}
            className="flex items-center space-x-2 px-3 md:px-4 py-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span className="hidden sm:inline">Previous</span>
          </Button>

          <div className="hidden lg:flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
            <span>Use ← → keys</span>
          </div>

          {multiStep.isLastStep ? (
            <Button
              onClick={handleComplete}
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-3 md:px-4 py-2"
            >
              {isSubmitting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  <span className="hidden sm:inline">Setting up...</span>
                  <span className="sm:hidden">Setup...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span className="hidden sm:inline">Complete Setup</span>
                  <span className="sm:hidden">Complete</span>
                </>
              )}
            </Button>
          ) : (
            <Button
              onClick={handleNext}
              className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-3 md:px-4 py-2"
            >
              <span className="hidden sm:inline">Continue</span>
              <span className="sm:hidden">Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
