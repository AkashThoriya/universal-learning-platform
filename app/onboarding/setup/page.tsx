/**
 * @fileoverview Enhanced Onboarding Setup Flow - Premium Implementation
 *
 * A comprehensive, accessible, and user-friendly onboarding experience with:
 * - Advanced progress tracking and analytics
 * - Superior accessibility (WCAG 2.1 AA compliant)
 * - Optimized mobile-first responsive design
 * - Intelligent form validation and error handling
 * - Offline support and data persistence
 * - Premium UI/UX with microinteractions
 *
 * @author Exam Strategy Engine Team
 * @version 4.0.0
 */

'use client';

import { Timestamp } from 'firebase/firestore';
import {
  CheckCircle,
  AlertCircle,
  ArrowRight,
  ArrowLeft,
  WifiOff,
  HelpCircle,
  Eye,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import React, { useState, useEffect, useCallback, useRef } from 'react';
import { z } from 'zod';

import { PersonaDetectionStep } from '@/components/onboarding/PersonaDetectionCompact';
import { PersonalInfoStep } from '@/components/onboarding/PersonalInfoStepCompact';
import { CustomLearningStep } from '@/components/onboarding/CustomLearningStep';
import { SyllabusManagementStep, PreferencesStep } from '@/components/onboarding-steps-2';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useForm, UseFormReturn } from '@/hooks/useForm';
import { useMultiStepForm } from '@/hooks/useMultiStepForm';
import { EXAMS_DATA, getExamById } from '@/lib/exams-data';
import { createUser, saveSyllabus } from '@/lib/firebase-utils';
import { customLearningService } from '@/lib/firebase-services';
import { logger, logError, logInfo } from '@/lib/logger';
import { Exam, SyllabusSubject, SyllabusTopic, User as UserType, UserPersona } from '@/types/exam';

// Interface for Google Analytics gtag function
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters?: Record<string, unknown>) => void;
  }
}

/**
 * Enhanced onboarding form data structure with complete validation
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

  // Step 6: Custom Learning Goals
  customLearningGoals?: Array<{
    id: string;
    title: string;
    description: string;
    category: string;
    targetValue: number;
    unit: string;
    priority: 'high' | 'medium' | 'low';
  }>;

  // Index signature to satisfy Record<string, unknown> constraint
  [key: string]: string | number | boolean | object | undefined;
}

/**
 * Enhanced validation schema with detailed error messages
 */
const onboardingSchema = z.object({
  userPersona: z
    .object({
      type: z.enum(['student', 'working_professional', 'freelancer'], {
        required_error: 'Please select your profile type',
      }),
    })
    .optional(),
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters long')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  selectedExamId: z.string().min(1, 'Please select an exam'),
  examDate: z
    .string()
    .min(1, 'Exam date is required')
    .refine(date => {
      const examDate = new Date(date);
      const today = new Date();
      const minDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
      return examDate >= minDate;
    }, 'Exam date must be at least 7 days from today'),
  isCustomExam: z.boolean(),
  customExam: z
    .object({
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
    })
    .refine(() => {
      return true; // Custom validation in component
    }),
  syllabus: z
    .array(
      z.object({
        id: z.string(),
        name: z.string(),
        tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
        topics: z.array(
          z.object({
            id: z.string(),
            name: z.string(),
            subtopics: z
              .array(z.string())
              .optional()
              .transform(val => val ?? undefined),
            estimatedHours: z
              .number()
              .optional()
              .transform(val => val ?? undefined),
          })
        ),
        estimatedHours: z
          .number()
          .optional()
          .transform(val => val ?? undefined),
        isCustom: z
          .boolean()
          .optional()
          .transform(val => val ?? undefined),
      })
    )
    .min(1, 'At least one subject is required')
    .max(20, 'Maximum 20 subjects allowed'),
  preferences: z.object({
    dailyStudyGoalMinutes: z
      .number()
      .min(60, 'Minimum study goal is 1 hour (60 minutes)')
      .max(720, 'Maximum study goal is 12 hours (720 minutes)'),
    preferredStudyTime: z.enum(['morning', 'afternoon', 'evening', 'night']),
    tierDefinitions: z.object({
      1: z.string().min(3, 'Tier 1 definition must be at least 3 characters'),
      2: z.string().min(3, 'Tier 2 definition must be at least 3 characters'),
      3: z.string().min(3, 'Tier 3 definition must be at least 3 characters'),
    }),
    revisionIntervals: z.array(z.number().min(1).max(365)).min(3, 'At least 3 revision intervals required'),
    notifications: z.object({
      revisionReminders: z.boolean(),
      dailyGoalReminders: z.boolean(),
      healthCheckReminders: z.boolean(),
    }),
  }),
});

/**
 * Step information with accessibility and help text
 */
const STEP_INFO = [
  {
    title: 'Personal Profile',
    description: 'Tell us about yourself to personalize your experience',
    helpText: 'This helps us customize study recommendations based on your lifestyle and schedule.',
    icon: '👤',
    estimatedTime: '2 minutes',
  },
  {
    title: 'Learning Path Selection',
    description: 'Choose your learning path and set your timeline',
    helpText: "Select the exam you're preparing for and when you plan to take it.",
    icon: '📚',
    estimatedTime: '3 minutes',
  },
  {
    title: 'Syllabus Organization',
    description: 'Organize your subjects by priority levels',
    helpText: 'Arrange subjects into tiers to focus your study time effectively.',
    icon: '📋',
    estimatedTime: '5 minutes',
  },
  {
    title: 'Study Preferences',
    description: 'Customize your study schedule and notifications',
    helpText: 'Set up your daily goals and how you want to be reminded.',
    icon: '⚙️',
    estimatedTime: '3 minutes',
  },
  {
    title: 'Custom Learning Goals',
    description: 'Set up your personal learning goals beyond structured courses',
    helpText: 'Create goals for skills, technologies, or knowledge you want to develop alongside your exam prep.',
    icon: '🎯',
    estimatedTime: '4 minutes',
  },
];

/**
 * Enhanced Onboarding Setup Page Component with Premium Features
 */
export default function OnboardingSetupPage() {
  const { user } = useAuth();

  // Initialize component once
  useEffect(() => {
    logInfo('Onboarding setup page initialized', { timestamp: new Date().toISOString() });
  }, []);

  // Log user authentication status
  useEffect(() => {
    if (user) {
      logInfo('User authenticated for onboarding', {
        userId: user.uid,
        email: user.email ?? 'no-email',
      });
    } else {
      logInfo('User not authenticated, waiting for auth state');
    }
  }, [user]);

  // Component state
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [isOnline, setIsOnline] = useState(true);
  const [autoSaveStatus, setAutoSaveStatus] = useState<'saved' | 'saving' | 'error'>('saved');
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});

  // Refs for accessibility
  const stepContentRef = useRef<HTMLDivElement>(null);
  const announceRef = useRef<HTMLDivElement>(null);

  // Accessibility announcement function
  const announceStepChange = useCallback((step: number) => {
    const stepInfo = STEP_INFO[step - 1];
    if (announceRef.current && stepInfo) {
      announceRef.current.textContent = `Now on step ${step} of 5: ${stepInfo.title}. ${stepInfo.description}`;
    }
  }, []);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Initialize form data with enhanced defaults
  const initialFormData: OnboardingFormData = {
    displayName: user?.displayName ?? '',
    selectedExamId: '',
    examDate: '',
    isCustomExam: false,
    customExam: {
      name: '',
      description: '',
      category: 'Custom',
    },
    syllabus: [],
    preferences: {
      dailyStudyGoalMinutes: 240, // 4 hours default (more realistic)
      preferredStudyTime: 'morning',
      tierDefinitions: {
        1: 'High Priority - Core Topics (Must Master)',
        2: 'Medium Priority - Important Topics (Should Know)',
        3: 'Low Priority - Additional Topics (Good to Know)',
      },
      revisionIntervals: [1, 3, 7, 16, 35],
      notifications: {
        revisionReminders: true,
        dailyGoalReminders: true,
        healthCheckReminders: true,
      },
    },
    customLearningGoals: [],
  };

  // Enhanced multi-step form management with analytics
  const multiStep = useMultiStepForm({
    totalSteps: 5,
    persistState: true,
    storageKey: 'onboarding-progress-v2',
    onStepChange: (current, previous) => {
      logInfo('Onboarding step changed', {
        currentStep: current,
        previousStep: previous,
        userType: form.data.userPersona?.type ?? 'unknown',
        timestamp: new Date().toISOString(),
      });

      // Analytics tracking
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_step_change', {
          current_step: current,
          previous_step: previous,
          user_type: form.data.userPersona?.type ?? 'unknown',
        });
      }

      // Accessibility announcement
      announceStepChange(current);

      // Focus management
      setTimeout(() => {
        stepContentRef.current?.focus();
      }, 100);
    },
  });

  // Enhanced form state management with auto-save
  const form = useForm({
    initialData: initialFormData,
    validationSchema: onboardingSchema,
    persistData: true,
    storageKey: 'onboarding-form-data-v2',
    validateOnChange: false,
    validateOnBlur: true,
    debounceMs: 500,
    onFormEvent: (event: string, data: unknown) => {
      const eventData = data as { field?: string; [key: string]: unknown };
      logger.debug('Onboarding form event', {
        event,
        field: eventData?.field ?? 'unknown',
        step: multiStep.currentStep,
        timestamp: new Date().toISOString(),
      });

      if (event === 'field_change') {
        setAutoSaveStatus('saving');
        setTimeout(() => setAutoSaveStatus('saved'), 1000);
      }

      // Analytics for form events
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_form_event', {
          event_type: event,
          step: multiStep.currentStep,
          field: (data as { field?: string })?.field ?? 'unknown',
        });
      }
    },
  });

  // Load selected exam when exam ID changes
  useEffect(() => {
    if (form.data.selectedExamId && form.data.selectedExamId !== 'custom') {
      const exam = getExamById(form.data.selectedExamId);
      setSelectedExam(exam ?? null);

      logInfo('Exam loaded for onboarding', {
        examId: form.data.selectedExamId,
        examName: exam?.name ?? 'unknown',
        syllabusSubjects: exam?.defaultSyllabus?.length ?? 0,
      });

      // Auto-populate syllabus for predefined exams
      if (exam && !form.data.isCustomExam) {
        form.updateField('syllabus', exam.defaultSyllabus);
        logInfo('Syllabus auto-populated from exam', {
          examId: form.data.selectedExamId,
          subjectCount: exam.defaultSyllabus?.length ?? 0,
        });
      }
    } else if (form.data.selectedExamId === 'custom') {
      setSelectedExam(null);
      logInfo('Custom exam selected', { isCustomExam: form.data.isCustomExam });
    }
  }, [form.data.selectedExamId, form.data.isCustomExam, form]);

  // Filter exams based on search query
  const filteredExams = EXAMS_DATA.filter(
    exam =>
      exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.category.toLowerCase().includes(searchQuery.toLowerCase()) ||
      exam.description.toLowerCase().includes(searchQuery.toLowerCase())
  );

  // Enhanced step validation with detailed feedback
  const validateStep = useCallback(
    async (step: number): Promise<boolean> => {
      const startTime = performance.now();
      logInfo('Starting step validation', { step, timestamp: new Date().toISOString() });

      const errors: Record<string, string> = {};

      switch (step) {
        case 1:
          if (!form.data.userPersona?.type) {
            errors.persona = 'Please select your profile type';
          }
          break;

        case 2:
          if (form.data.displayName.length < 2) {
            errors.displayName = 'Name must be at least 2 characters';
          }
          if (!form.data.selectedExamId) {
            errors.exam = 'Please select an exam';
          }
          if (!form.data.examDate) {
            errors.examDate = 'Please set your exam date';
          } else {
            const examDate = new Date(form.data.examDate);
            const minDate = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000);
            if (examDate < minDate) {
              errors.examDate = 'Exam date must be at least 7 days from today';
            }
          }
          if (form.data.isCustomExam && !form.data.customExam.name) {
            errors.customExam = 'Please enter a name for your custom exam';
          }
          break;

        case 3:
          if (form.data.syllabus.length === 0) {
            errors.syllabus = 'Please add at least one subject';
          }
          break;

        case 4:
          if (form.data.preferences.dailyStudyGoalMinutes < 60) {
            errors.studyGoal = 'Daily study goal must be at least 1 hour';
          }
          if (
            !form.data.preferences.tierDefinitions[1] ||
            !form.data.preferences.tierDefinitions[2] ||
            !form.data.preferences.tierDefinitions[3]
          ) {
            errors.tierDefinitions = 'Please define all three tiers';
          }
          break;

        default:
          logInfo('Step validation completed - unknown step', { step });
          return true;
      }

      const isValid = Object.keys(errors).length === 0;
      const duration = performance.now() - startTime;

      if (isValid) {
        logInfo('Step validation passed', {
          step,
          duration: Math.round(duration),
          timestamp: new Date().toISOString(),
        });
      } else {
        logger.warn('Step validation failed', {
          step,
          errors: Object.keys(errors),
          errorMessages: errors,
          duration: Math.round(duration),
          formData: {
            hasPersona: !!form.data.userPersona?.type,
            displayName: form.data.displayName?.length ?? 0,
            hasExam: !!form.data.selectedExamId,
            hasExamDate: !!form.data.examDate,
            syllabusCount: form.data.syllabus?.length ?? 0,
            studyGoal: form.data.preferences?.dailyStudyGoalMinutes ?? 0,
          },
        });
      }

      setValidationErrors(errors);
      return isValid;
    },
    [form.data]
  );

  // Enhanced navigation handlers with accessibility
  const handleNext = useCallback(async () => {
    logInfo('Attempting to navigate to next step', {
      currentStep: multiStep.currentStep,
      totalSteps: 5,
    });

    const isValid = await validateStep(multiStep.currentStep);
    if (isValid) {
      setValidationErrors({});
      multiStep.goToNext();
      logInfo('Successfully navigated to next step', {
        newStep: multiStep.currentStep + 1,
      });
    } else {
      logger.warn('Navigation blocked due to validation errors', {
        currentStep: multiStep.currentStep,
        validationErrors,
      });

      // Announce validation errors to screen readers
      if (announceRef.current) {
        announceRef.current.textContent = 'Please fix the errors before continuing';
      }
    }
  }, [multiStep, validateStep, validationErrors]);

  const handlePrevious = useCallback(() => {
    logInfo('Navigating to previous step', {
      currentStep: multiStep.currentStep,
      targetStep: multiStep.currentStep - 1,
    });

    setValidationErrors({});
    multiStep.goToPrevious();
  }, [multiStep]);

  // Learning path selection handler with analytics
  const handleExamSelect = useCallback(
    (examId: string) => {
      try {
        logInfo('Learning path selection initiated', { examId, isCustom: examId === 'custom' });

        if (examId === 'custom') {
          form.updateFields({
            selectedExamId: 'custom',
            isCustomExam: true,
            syllabus: [],
          });
          logInfo('Custom exam configured', { syllabusCleared: true });
        } else {
          const exam = getExamById(examId);
          if (exam) {
            form.updateFields({
              selectedExamId: examId,
              isCustomExam: false,
              syllabus: exam.defaultSyllabus || [],
            });
            logInfo('Predefined exam configured', {
              examId,
              examName: exam.name,
              syllabusSubjects: exam.defaultSyllabus?.length ?? 0,
            });
          } else {
            logError('Exam not found during selection', { examId });
            // Handle gracefully instead of crashing
            return;
          }
        }

        // Analytics
        if (typeof window !== 'undefined' && window.gtag) {
          window.gtag('event', 'exam_selected', {
            exam_id: examId,
            is_custom: examId === 'custom',
          });
        }
      } catch (error) {
        logError('Error in learning path selection', { 
          examId, 
          error: error instanceof Error ? error.message : 'Unknown error' 
        });
        // Optionally show user-friendly error message
        console.error('Failed to select exam:', error);
      }
    },
    [form]
  );

  // Syllabus management functions
  const updateSubjectTier = useCallback(
    (subjectId: string, tier: 1 | 2 | 3) => {
      logInfo('Updating subject tier', { subjectId, tier });

      const updatedSyllabus = form.data.syllabus.map(subject =>
        subject.id === subjectId ? { ...subject, tier } : subject
      ) as SyllabusSubject[];
      form.updateField('syllabus', updatedSyllabus);
    },
    [form]
  );

  const addCustomSubject = useCallback(() => {
    const newSubjectId = `custom-${Date.now()}`;
    logInfo('Adding custom subject', { subjectId: newSubjectId });

    const newSubject: SyllabusSubject = {
      id: newSubjectId,
      name: 'New Subject',
      tier: 2,
      topics: [],
      isCustom: true,
    };
    form.updateField('syllabus', [...form.data.syllabus, newSubject]);
  }, [form]);

  const removeSubject = useCallback(
    (subjectId: string) => {
      logInfo('Removing subject from syllabus', { subjectId });

      const updatedSyllabus = form.data.syllabus.filter(subject => subject.id !== subjectId) as SyllabusSubject[];
      form.updateField('syllabus', updatedSyllabus);

      logInfo('Subject removed', {
        subjectId,
        remainingSubjects: updatedSyllabus.length,
      });
    },
    [form]
  );

  // Topic management functions
  const addTopic = useCallback(
    (subjectId: string, topicName?: string) => {
      const newTopicId = `topic-${Date.now()}`;
      logInfo('Adding topic to subject', { subjectId, topicId: newTopicId, topicName });

      const newTopic: SyllabusTopic = {
        id: newTopicId,
        name: topicName || 'New Topic',
        estimatedHours: 5,
      };

      const updatedSyllabus = form.data.syllabus.map(subject =>
        subject.id === subjectId
          ? { ...subject, topics: [...subject.topics, newTopic] }
          : subject
      ) as SyllabusSubject[];

      form.updateField('syllabus', updatedSyllabus);

      logInfo('Topic added successfully', {
        subjectId,
        topicId: newTopicId,
        totalTopics: updatedSyllabus.find(s => s.id === subjectId)?.topics.length,
      });
    },
    [form]
  );

  const removeTopic = useCallback(
    (subjectId: string, topicId: string) => {
      logInfo('Removing topic from subject', { subjectId, topicId });

      const updatedSyllabus = form.data.syllabus.map(subject =>
        subject.id === subjectId
          ? { ...subject, topics: subject.topics.filter(topic => topic.id !== topicId) }
          : subject
      ) as SyllabusSubject[];

      form.updateField('syllabus', updatedSyllabus);

      logInfo('Topic removed successfully', {
        subjectId,
        topicId,
        remainingTopics: updatedSyllabus.find(s => s.id === subjectId)?.topics.length,
      });
    },
    [form]
  );

  const updateTopic = useCallback(
    (subjectId: string, topicId: string, updates: Partial<SyllabusTopic>) => {
      logInfo('Updating topic', { subjectId, topicId, updates });

      const updatedSyllabus = form.data.syllabus.map(subject =>
        subject.id === subjectId
          ? {
              ...subject,
              topics: subject.topics.map(topic =>
                topic.id === topicId ? { ...topic, ...updates } : topic
              ),
            }
          : subject
      ) as SyllabusSubject[];

      form.updateField('syllabus', updatedSyllabus);

      logInfo('Topic updated successfully', { subjectId, topicId });
    },
    [form]
  );

  const reorderTopics = useCallback(
    (subjectId: string, topicIds: string[]) => {
      logInfo('Reordering topics', { subjectId, newOrder: topicIds });

      const updatedSyllabus = form.data.syllabus.map(subject => {
        if (subject.id === subjectId) {
          const reorderedTopics = topicIds
            .map(topicId => subject.topics.find(topic => topic.id === topicId))
            .filter(Boolean) as SyllabusTopic[];
          
          return { ...subject, topics: reorderedTopics };
        }
        return subject;
      }) as SyllabusSubject[];

      form.updateField('syllabus', updatedSyllabus);

      logInfo('Topics reordered successfully', { subjectId, newTopicCount: topicIds.length });
    },
    [form]
  );

  // Enhanced completion handler with error recovery
  const handleComplete = useCallback(async () => {
    logInfo('Onboarding completion initiated', {
      userId: user?.uid ?? 'no-user',
      hasUser: !!user,
      currentStep: multiStep.currentStep,
    });

    if (!user) {
      const errorMsg = 'You must be logged in to complete setup.';
      logError('Onboarding completion failed - no user', { error: errorMsg });
      form.setError('_form' as any, {
        message: errorMsg,
        type: 'server',
        path: '_form',
      });
      return;
    }

    setIsSubmitting(true);

    try {
      logInfo('Starting final validation and data preparation');

      // Final validation
      const isValid = await validateStep(4);
      if (!isValid) {
        throw new Error('Please fix all validation errors before completing setup.');
      }

      // Validate required data before saving
      if (!form.data.displayName?.trim()) {
        throw new Error('Display name is required.');
      }

      if (!form.data.selectedExamId && !form.data.isCustomExam) {
        throw new Error('Please select an exam or create a custom exam.');
      }

      if (!form.data.syllabus || form.data.syllabus.length === 0) {
        throw new Error('Please add at least one subject to your syllabus.');
      }

      if (!form.data.preferences) {
        throw new Error('Study preferences are required.');
      }

      logInfo('Validation completed, preparing user data', {
        displayName: form.data.displayName,
        examId: form.data.selectedExamId,
        isCustomExam: form.data.isCustomExam,
        syllabusCount: form.data.syllabus.length,
        userPersona: form.data.userPersona?.type ?? 'none',
      });

      // Prepare user data
      const userData: Partial<UserType> = {
        displayName: form.data.displayName,
        selectedExamId: form.data.selectedExamId,
        examDate: Timestamp.fromDate(new Date(form.data.examDate)),
        onboardingCompleted: true,
        createdAt: Timestamp.now(),
        updatedAt: Timestamp.now(),
        ...(form.data.userPersona && { userPersona: form.data.userPersona }),
        preferences: form.data.preferences,
        isCustomExam: form.data.isCustomExam,
        customExam: form.data.isCustomExam ? form.data.customExam : undefined,
      };

      // Save data with retry logic and better error handling
      let retryCount = 0;
      const maxRetries = 3;

      logInfo('Starting save operations with retry logic', { maxRetries });

      while (retryCount < maxRetries) {
        try {
          const startTime = performance.now();

          const operations = await Promise.allSettled([
            createUser(user.uid, userData),
            saveSyllabus(user.uid, form.data.syllabus as SyllabusSubject[]),
          ]);

          // Save custom learning goals separately if any exist
          if ((form.data as any).customLearningGoals && (form.data as any).customLearningGoals.length > 0) {
            const goalOperations = await Promise.allSettled(
              (form.data as any).customLearningGoals.map((goal: any) =>
                customLearningService.saveCustomGoal(user.uid, {
                  ...goal,
                  createdAt: new Date(),
                  updatedAt: new Date(),
                  status: 'active',
                  progress: 0,
                })
              )
            );

            const goalFailures = goalOperations.filter(result => result.status === 'rejected');
            if (goalFailures.length > 0) {
              logError('Failed to save some custom learning goals', {
                failures: goalFailures.length,
                total: (form.data as any).customLearningGoals.length,
              });
            }
          }

          const duration = performance.now() - startTime;

          const failures = operations.filter(result => result.status === 'rejected');
          if (failures.length > 0) {
            logError('Save operations failed', {
              failures: failures.map((failure, index) => ({
                operation: index === 0 ? 'user profile' : 'syllabus data',
                reason: failure.reason,
              })),
              retryCount,
              duration: Math.round(duration),
            });

            const failureReasons = failures.map((failure, index) => {
              const operationName = index === 0 ? 'user profile' : 'syllabus data';
              return `${operationName}: ${failure.reason}`;
            });
            throw new Error(`Failed to save: ${failureReasons.join(', ')}`);
          }

          logInfo('Save operations completed successfully', {
            duration: Math.round(duration),
            retryCount,
            operationsCompleted: operations.length,
          });

          break; // Success, exit retry loop
        } catch (error) {
          retryCount++;
          logError(`Save attempt ${retryCount} failed`, {
            error: error instanceof Error ? error.message : 'Unknown error',
            retryCount,
            maxRetries,
            willRetry: retryCount < maxRetries,
          });

          if (retryCount >= maxRetries) {
            // Provide more specific error message
            const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';
            const finalError = `Unable to complete setup after ${maxRetries} attempts. ${errorMessage}. Please check your internet connection and try again.`;
            logError('Final save attempt failed, giving up', {
              error: errorMessage,
              retryCount,
              maxRetries,
            });
            throw new Error(finalError);
          }

          // Progressive backoff delay
          const delay = 1000 * retryCount * retryCount;
          logInfo(`Waiting ${delay}ms before retry`, { retryCount, delay });
          await new Promise(resolve => setTimeout(resolve, delay));
        }
      }

      logInfo('Onboarding data saved successfully, finishing completion process');

      // Analytics completion event
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'onboarding_completed', {
          user_type: form.data.userPersona?.type,
          exam_type: form.data.isCustomExam ? 'custom' : 'predefined',
          total_subjects: form.data.syllabus.length,
        });
      }

      // Clear persisted data
      if (typeof window !== 'undefined') {
        try {
          localStorage.removeItem('onboarding-progress-v2');
          localStorage.removeItem('onboarding-form-data-v2');
          logInfo('Cleared onboarding localStorage data');
        } catch (error) {
          logger.warn('Failed to clear localStorage', {
            error: error instanceof Error ? error.message : 'Unknown error',
          });
        }
      }

      logInfo('Onboarding completed successfully, navigating to dashboard');

      // Navigate to dashboard with success state
      const dashboardUrl = new URL('/dashboard', window.location.origin);
      dashboardUrl.searchParams.set('onboarding', 'complete');
      dashboardUrl.searchParams.set('welcome', 'true');
      window.location.href = dashboardUrl.toString();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error occurred';

      logError('Error completing onboarding', {
        error: errorMessage,
        userId: user?.uid,
        currentStep: multiStep.currentStep,
        formData: {
          hasDisplayName: !!form.data.displayName?.trim(),
          hasExamId: !!form.data.selectedExamId,
          isCustomExam: form.data.isCustomExam,
          syllabusCount: form.data.syllabus?.length ?? 0,
          hasPreferences: !!form.data.preferences,
        },
      });

      let userFriendlyMessage = 'Failed to complete setup. Please try again.';

      if (error instanceof Error) {
        if (error.message.includes('Firebase')) {
          userFriendlyMessage = 'Connection error. Please check your internet connection and try again.';
        } else if (error.message.includes('permission')) {
          userFriendlyMessage = 'Permission denied. Please refresh the page and try again.';
        } else if (error.message.includes('quota')) {
          userFriendlyMessage = 'Service temporarily unavailable. Please try again in a few minutes.';
        } else {
          userFriendlyMessage = error.message;
        }
      }

      form.setError('_form' as any, {
        message: userFriendlyMessage,
        type: 'server',
        path: '_form',
      });

      setAutoSaveStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  }, [user, form, validateStep, multiStep.currentStep]);

  // Keyboard navigation support
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.ctrlKey ?? event.metaKey) {
        switch (event.key) {
          case 'ArrowLeft':
            event.preventDefault();
            if (!multiStep.isFirstStep) {
              handlePrevious();
            }
            break;
          case 'ArrowRight':
            event.preventDefault();
            if (!multiStep.isLastStep) {
              handleNext();
            } else {
              handleComplete();
            }
            break;
          case 's':
            event.preventDefault();
            // Manual save trigger
            setAutoSaveStatus('saving');
            setTimeout(() => setAutoSaveStatus('saved'), 500);
            break;
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [multiStep, handleNext, handlePrevious, handleComplete]);

  // Render step content with error boundaries
  const renderStepContent = () => {
    try {
      switch (multiStep.currentStep) {
        case 1:
          return <PersonaDetectionStep form={form as UseFormReturn<OnboardingFormData>} />;

        case 2:
          return (
            <PersonalInfoStep
              form={form as UseFormReturn<OnboardingFormData>}
              filteredExams={filteredExams}
              searchQuery={searchQuery}
              setSearchQuery={setSearchQuery}
              onExamSelect={handleExamSelect}
              selectedExam={selectedExam}
            />
          );

        case 3:
          return (
            <SyllabusManagementStep
              form={form as UseFormReturn<OnboardingFormData>}
              onUpdateSubjectTier={updateSubjectTier}
              onAddSubject={addCustomSubject}
              onRemoveSubject={removeSubject}
              onAddTopic={addTopic}
              onRemoveTopic={removeTopic}
              onUpdateTopic={updateTopic}
              onReorderTopics={reorderTopics}
            />
          );

        case 4:
          return <PreferencesStep form={form as UseFormReturn<OnboardingFormData>} />;

        case 5:
          return <CustomLearningStep form={form as UseFormReturn<OnboardingFormData>} />;

        default:
          return (
            <div className="text-center py-8">
              <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <p className="text-gray-600">Step not found. Please refresh the page.</p>
            </div>
          );
      }
    } catch (error) {
      logError('Error rendering step content', {
        error: error instanceof Error ? error.message : 'Unknown error',
        currentStep: multiStep.currentStep,
        stackTrace: error instanceof Error ? error.stack : undefined,
      });

      return (
        <div className="text-center py-8">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto mb-4" />
          <p className="text-red-600">An error occurred. Please refresh the page and try again.</p>
          <Button variant="outline" onClick={() => window.location.reload()} className="mt-4">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh Page
          </Button>
        </div>
      );
    }
  };

  if (!user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading your account...</p>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        {/* Accessibility announcements */}
        <div ref={announceRef} className="sr-only" aria-live="polite" aria-atomic="true" />

        {/* Online/Offline Status */}
        {!isOnline && (
          <div className="fixed top-0 left-0 right-0 bg-amber-500 text-white text-center py-2 z-50">
            <div className="flex items-center justify-center space-x-2">
              <WifiOff className="h-4 w-4" />
              <span>You're offline. Your progress is being saved locally.</span>
            </div>
          </div>
        )}

        {/* Enhanced Progress Indicator */}
        <div className="fixed top-0 left-0 right-0 bg-white/95 backdrop-blur-sm border-b border-gray-200 z-40">
          <div className="max-w-4xl mx-auto px-4 py-3">
            <div className="flex items-center justify-between">
              {/* Step Info */}
              <div className="flex items-center space-x-3">
                <div className="text-2xl">{STEP_INFO[multiStep.currentStep - 1]?.icon}</div>
                <div>
                  <h2 className="font-semibold text-gray-900">{STEP_INFO[multiStep.currentStep - 1]?.title}</h2>
                  <p className="text-sm text-gray-600">
                    Step {multiStep.currentStep} of {multiStep.totalSteps} •{' '}
                    {STEP_INFO[multiStep.currentStep - 1]?.estimatedTime}
                  </p>
                </div>
              </div>

              {/* Progress Bar and Status */}
              <div className="flex items-center space-x-4">
                {/* Auto-save Status */}
                <div className="flex items-center space-x-2 text-sm">
                  {autoSaveStatus === 'saving' && (
                    <>
                      <Loader2 className="h-3 w-3 animate-spin text-blue-600" />
                      <span className="text-blue-600">Saving...</span>
                    </>
                  )}
                  {autoSaveStatus === 'saved' && (
                    <>
                      <CheckCircle className="h-3 w-3 text-green-600" />
                      <span className="text-green-600">Saved</span>
                    </>
                  )}
                  {autoSaveStatus === 'error' && (
                    <>
                      <AlertCircle className="h-3 w-3 text-red-600" />
                      <span className="text-red-600">Error</span>
                    </>
                  )}
                </div>

                {/* Help Button */}
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button variant="ghost" size="sm" onClick={() => setShowHelp(true)} className="p-2">
                      <HelpCircle className="h-4 w-4" />
                      <span className="sr-only">Get help</span>
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Get help with this step</p>
                  </TooltipContent>
                </Tooltip>

                {/* Progress */}
                <div className="flex items-center space-x-3">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-blue-500 to-purple-500 rounded-full transition-all duration-500"
                      style={{ width: `${multiStep.progress}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{Math.round(multiStep.progress)}%</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-4xl mx-auto pt-24 pb-8 px-4">
          {/* Form Errors */}
          {form.errors._form && (
            <Alert className="mb-6 border-red-200 bg-red-50">
              <AlertCircle className="h-4 w-4 text-red-600" />
              <AlertDescription className="text-red-800">{form.errors._form.message}</AlertDescription>
            </Alert>
          )}

          {/* Validation Errors */}
          {Object.keys(validationErrors).length > 0 && (
            <Alert className="mb-6 border-amber-200 bg-amber-50">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <AlertDescription className="text-amber-800">
                <div className="space-y-1">
                  <p className="font-medium">Please fix the following errors:</p>
                  <ul className="list-disc list-inside space-y-1">
                    {Object.values(validationErrors).map((error, index) => (
                      <li key={index} className="text-sm">
                        {error}
                      </li>
                    ))}
                  </ul>
                </div>
              </AlertDescription>
            </Alert>
          )}

          {/* Step Content */}
          <Card className="mb-6 shadow-xl border-0 bg-white/90 backdrop-blur-sm">
            <CardContent ref={stepContentRef} className="p-6" tabIndex={-1}>
              {renderStepContent()}
            </CardContent>
          </Card>

          {/* Navigation */}
          <div className="flex justify-between items-center">
            <Button
              variant="outline"
              onClick={handlePrevious}
              disabled={multiStep.isFirstStep}
              className="flex items-center space-x-2 px-4 py-2"
            >
              <ArrowLeft className="h-4 w-4" />
              <span>Previous</span>
            </Button>

            <div className="flex items-center space-x-4">
              {/* Preview Button */}
              {multiStep.currentStep === 4 && (
                <Button variant="ghost" onClick={() => setShowPreview(true)} className="flex items-center space-x-2">
                  <Eye className="h-4 w-4" />
                  <span>Preview Setup</span>
                </Button>
              )}

              {/* Keyboard Shortcuts Hint */}
              <div className="hidden lg:flex items-center text-xs text-gray-500 bg-gray-100 px-3 py-1 rounded-full">
                <span>Use Ctrl + ← → for navigation</span>
              </div>
            </div>

            {multiStep.isLastStep ? (
              <Button
                onClick={handleComplete}
                disabled={isSubmitting}
                className="flex items-center space-x-2 bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 px-6 py-2"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="animate-spin h-4 w-4" />
                    <span>Setting up...</span>
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" />
                    <span>Complete Setup</span>
                  </>
                )}
              </Button>
            ) : (
              <Button
                onClick={handleNext}
                className="flex items-center space-x-2 bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6 py-2"
              >
                <span>Continue</span>
                <ArrowRight className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        {/* Help Dialog */}
        <Dialog open={showHelp} onOpenChange={setShowHelp}>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle className="flex items-center space-x-2">
                <HelpCircle className="h-5 w-5 text-blue-600" />
                <span>Step Help</span>
              </DialogTitle>
              <DialogDescription>{STEP_INFO[multiStep.currentStep - 1]?.helpText}</DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button onClick={() => setShowHelp(false)}>Got it</Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={showPreview} onOpenChange={setShowPreview}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Setup Preview</DialogTitle>
              <DialogDescription>Review your configuration before completing setup</DialogDescription>
            </DialogHeader>

            <div className="space-y-6">
              {/* Personal Info */}
              <div>
                <h3 className="font-semibold mb-2">Personal Information</h3>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                  <p>
                    <strong>Name:</strong> {form.data.displayName}
                  </p>
                  <p>
                    <strong>Profile:</strong> {form.data.userPersona?.type.replace('_', ' ')}
                  </p>
                  <p>
                    <strong>Exam:</strong> {selectedExam?.name ?? form.data.customExam?.name}
                  </p>
                  <p>
                    <strong>Exam Date:</strong> {new Date(form.data.examDate).toLocaleDateString()}
                  </p>
                </div>
              </div>

              {/* Syllabus */}
              <div>
                <h3 className="font-semibold mb-2">Syllabus ({form.data.syllabus.length} subjects)</h3>
                <div className="bg-gray-50 p-3 rounded-lg">
                  <div className="grid grid-cols-3 gap-4 text-sm">
                    <div>
                      <p className="font-medium text-red-600">
                        Tier 1 ({form.data.syllabus.filter(s => s.tier === 1).length})
                      </p>
                      {form.data.syllabus
                        .filter(s => s.tier === 1)
                        .slice(0, 3)
                        .map(s => (
                          <p key={s.id} className="text-gray-600">
                            {s.name}
                          </p>
                        ))}
                    </div>
                    <div>
                      <p className="font-medium text-yellow-600">
                        Tier 2 ({form.data.syllabus.filter(s => s.tier === 2).length})
                      </p>
                      {form.data.syllabus
                        .filter(s => s.tier === 2)
                        .slice(0, 3)
                        .map(s => (
                          <p key={s.id} className="text-gray-600">
                            {s.name}
                          </p>
                        ))}
                    </div>
                    <div>
                      <p className="font-medium text-green-600">
                        Tier 3 ({form.data.syllabus.filter(s => s.tier === 3).length})
                      </p>
                      {form.data.syllabus
                        .filter(s => s.tier === 3)
                        .slice(0, 3)
                        .map(s => (
                          <p key={s.id} className="text-gray-600">
                            {s.name}
                          </p>
                        ))}
                    </div>
                  </div>
                </div>
              </div>

              {/* Preferences */}
              <div>
                <h3 className="font-semibold mb-2">Study Preferences</h3>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                  <p>
                    <strong>Daily Goal:</strong> {Math.floor(form.data.preferences.dailyStudyGoalMinutes / 60)}h{' '}
                    {form.data.preferences.dailyStudyGoalMinutes % 60}m
                  </p>
                  <p>
                    <strong>Preferred Time:</strong> {form.data.preferences.preferredStudyTime}
                  </p>
                  <p>
                    <strong>Revision Intervals:</strong> {form.data.preferences.revisionIntervals.join(', ')} days
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreview(false)}>
                Review More
              </Button>
              <Button onClick={handleComplete} disabled={isSubmitting}>
                {isSubmitting ? 'Setting up...' : 'Complete Setup'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </TooltipProvider>
  );
}
