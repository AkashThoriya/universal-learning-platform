/**
 * @fileoverview Comprehensive User Profile Management Page
 *
 * A complete profile page that allows users to view and edit all personal information,
 * exam details, study preferences, and settings that were configured during onboarding.
 * Features advanced form validation, real-time updates, and premium UI/UX.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

'use client';

import { Timestamp } from 'firebase/firestore';
import PageTransition from '@/components/layout/PageTransition';
import { FeaturePageHeader } from '@/components/layout/PageHeader';
import { ProfileSkeleton } from '@/components/skeletons';
import MobileScrollGrid from '@/components/layout/MobileScrollGrid';
import { ScrollableTabsList } from '@/components/layout/ScrollableTabsList';
import {
  User,
  BookOpen,
  Calendar,
  Target,
  Save,
  AlertCircle,
  Trash2,
  Plus,
  ArrowLeft,
  ChevronRight,
  Lock,
  UserCheck,
  Activity,
  Briefcase,
  Loader2,
  Zap,
  Sun,
  Moon,
} from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';

import { useState, useEffect, useCallback, useMemo, useRef, Suspense } from 'react';
import { z } from 'zod';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import BottomNav from '@/components/BottomNav';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useForm } from '@/hooks/useForm';
import { AGE_LIMITS } from '@/lib/config/constants';
import { DEFAULT_PREFERENCES } from '@/lib/config/defaults';
import { PROFILE_TABS } from '@/lib/data/ui-content';
import { getExamById } from '@/lib/data/exams-data';
import { getUser, updateUser, getSyllabus, saveSyllabus } from '@/lib/firebase/firebase-utils';
import { Exam, SyllabusSubject, User as UserType, UserPersona, UserPersonaType, SelectedCourse } from '@/types/exam';

/**
 * Profile form data structure with complete validation
 */
interface ProfileFormData {
  // Personal Information
  displayName: string;
  email: string;
  userPersona: UserPersona | undefined;

  // Exam Configuration
  selectedExamId: string;
  selectedCourses: SelectedCourse[];
  examDate: string;
  preparationStartDate: string;
  isCustomExam: boolean;
  customExam: {
    name: string;
    description: string;
    category: string;
  };

  // Syllabus Configuration
  syllabus: SyllabusSubject[];

  // Study Preferences
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

  // System Settings
  settings: {
    theme: 'light' | 'dark' | 'system';
    language: string;
    timezone: string;
  };

  // Index signature to satisfy Record<string, unknown> constraint
  [key: string]: unknown;
}

/**
 * Enhanced validation schema for profile data
 */
const profileSchema = z.object({
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),
  email: z.string().email('Please enter a valid email address'),
  selectedExamId: z.string().min(1, 'Please select an exam'),
  selectedCourses: z.array(z.object({
    examId: z.string(),
    examName: z.string(),
    targetDate: z.any(), // Accept Timestamp or Date
    priority: z.number(),
    isCustom: z.boolean().optional(),
    customExam: z.object({
      name: z.string().optional(),
      description: z.string().optional(),
      category: z.string().optional(),
    }).optional(),
  })).optional(),
  examDate: z
    .string()
    .min(1, 'Exam date is required')
    .refine(date => {
      const examDate = new Date(date);
      const today = new Date();
      const minDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000);
      return examDate >= minDate;
    }, 'Exam date must be at least 7 days from today'),
  isCustomExam: z.boolean(),
  customExam: z.object({
    name: z.string().optional(),
    description: z.string().optional(),
    category: z.string().optional(),
  }),
  syllabus: z.array(
    z.object({
      id: z.string(),
      name: z.string(),
      tier: z.union([z.literal(1), z.literal(2), z.literal(3)]),
      topics: z.array(z.object({
        id: z.string(),
        name: z.string(),
        subtopics: z.array(z.object({
          id: z.string(),
          name: z.string(),
          order: z.number().optional(),
          status: z.enum(['not_started', 'in_progress', 'completed', 'mastered']).optional(),
          needsReview: z.boolean().optional(),
          practiceCount: z.number().optional(),
          revisionCount: z.number().optional(),
          lastRevised: z.any().optional(),
        })).optional(),
        estimatedHours: z.number().optional(),
        description: z.string().optional(),
      })),
      estimatedHours: z.number().optional(),
      isCustom: z.boolean().optional(),
    })
  ).min(0, 'Syllabus configuration is required'),
  userPersona: z
    .object({
      type: z.enum(['student', 'working_professional', 'freelancer']),
    })
    .optional(),
  preferences: z.object({
    dailyStudyGoalMinutes: z
      .number()
      .min(60, 'Minimum study goal is 1 hour')
      .max(720, 'Maximum study goal is 12 hours'),
    preferredStudyTime: z.enum(['morning', 'afternoon', 'evening', 'night']),
    tierDefinitions: z.object({
      1: z.string().min(3, 'Tier 1 definition required'),
      2: z.string().min(3, 'Tier 2 definition required'),
      3: z.string().min(3, 'Tier 3 definition required'),
    }),
    revisionIntervals: z.array(z.number().min(1).max(AGE_LIMITS.MAX_AGE_YEARS)).min(3, 'At least 3 intervals required'),
    notifications: z.object({
      revisionReminders: z.boolean(),
      dailyGoalReminders: z.boolean(),
      healthCheckReminders: z.boolean(),
    }),
  }),
  settings: z.object({
    theme: z.enum(['light', 'dark', 'system']),
    language: z.string(),
    timezone: z.string(),
  }),
});

/**
 * Enhanced User Profile Management Page
 */
function ProfileContent() {
  const { user } = useAuth();
  const router = useRouter();
  const { toast } = useToast();

  // Component state
  const [userData, setUserData] = useState<UserType | null>(null);
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState('personal');
  const [showPreviewDialog, setShowPreviewDialog] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const prepDateInputRef = useRef<HTMLInputElement>(null);
  const searchParams = useSearchParams();

  // Initialize form with enhanced configuration
  const form = useForm<ProfileFormData>({
    initialData: {
      displayName: '',
      email: '',
      userPersona: undefined,
      selectedExamId: '',
      selectedCourses: [],
      examDate: '',
      preparationStartDate: '',
      isCustomExam: false,
      customExam: { name: '', description: '', category: '' },
      syllabus: [],
      preferences: {
        dailyStudyGoalMinutes: DEFAULT_PREFERENCES.DAILY_STUDY_GOAL_MINUTES,
        preferredStudyTime: DEFAULT_PREFERENCES.PREFERRED_STUDY_TIME,
        tierDefinitions: { ...DEFAULT_PREFERENCES.TIER_DEFINITIONS } as any,
        revisionIntervals: [...DEFAULT_PREFERENCES.REVISION_INTERVALS],
        notifications: { ...DEFAULT_PREFERENCES.NOTIFICATIONS },
      },
      settings: {
        theme: 'system' as const,
        language: 'en',
        timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
      },
    },
    persistData: false,
    validateOnChange: true,
    validateOnBlur: true,
    onFormEvent: (event: string) => {
      if (event === 'field_change') {
        setHasUnsavedChanges(true);
      }
    },
  });

  // Load user data on component mount
  useEffect(() => {
    const loadUserData = async () => {
      if (!user) {
        return;
      }

      try {
        setLoading(true);
        const [fetchedUser, userSyllabus] = await Promise.all([getUser(user.uid), getSyllabus(user.uid)]);

        if (fetchedUser) {
          setUserData(fetchedUser);

          // Load selected exam
          if (fetchedUser.currentExam?.id && fetchedUser.currentExam.id !== 'custom') {
            const exam = getExamById(fetchedUser.currentExam.id);
            setSelectedExam(exam ?? null);
          }

          // Initialize form with user data
          // Construct course list from cached currentExam
          const courses: any[] = [];
          if (fetchedUser.currentExam?.id) {

             courses.push({
                examId: fetchedUser.currentExam.id,
                name: fetchedUser.currentExam.name || fetchedUser.currentExam.id,
                targetDate: fetchedUser.currentExam.targetDate,
                isPrimary: true,
                isCustom: false,
             });
          }

            const formData: ProfileFormData = {
             displayName: fetchedUser.displayName ?? user.displayName ?? '',
             email: fetchedUser.email ?? user.email ?? '',
             userPersona: fetchedUser.persona ?? undefined,
             selectedExamId: fetchedUser.currentExam?.id ?? '',
             selectedCourses: courses,
             examDate: fetchedUser.currentExam?.targetDate ? (fetchedUser.currentExam.targetDate.toDate().toISOString().split('T')[0] ?? '') : '',
            preparationStartDate: fetchedUser.preparationStartDate ? (fetchedUser.preparationStartDate.toDate().toISOString().split('T')[0] ?? '') : '',
            isCustomExam: false, // Legacy support removed
            customExam: { name: '', description: '', category: '' },
            syllabus: userSyllabus ?? [],
            preferences: {
              dailyStudyGoalMinutes: fetchedUser.preferences?.dailyStudyGoalMinutes ?? DEFAULT_PREFERENCES.DAILY_STUDY_GOAL_MINUTES,
              preferredStudyTime: fetchedUser.preferences?.preferredStudyTime ?? DEFAULT_PREFERENCES.PREFERRED_STUDY_TIME,
              tierDefinitions: { ...DEFAULT_PREFERENCES.TIER_DEFINITIONS } as any,
              revisionIntervals: fetchedUser.preferences?.revisionIntervals ?? [...DEFAULT_PREFERENCES.REVISION_INTERVALS],
              notifications: fetchedUser.preferences?.notifications ?? { ...DEFAULT_PREFERENCES.NOTIFICATIONS },
            },
            settings: {
              theme: 'system',
              language: 'en',
              timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
            },
          };

          form.setData(formData);
        }
      } catch (error) {
        console.error('Error loading user data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load profile data. Please refresh the page.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadUserData();
  }, [user, form.setData, toast]);

  // Handle deep-link URL params (e.g., ?tab=exam&focus=prepDate)
  useEffect(() => {
    const tabParam = searchParams.get('tab');
    const focusParam = searchParams.get('focus');
    
    if (tabParam && ['personal', 'exam', 'syllabus', 'preferences'].includes(tabParam)) {
      setActiveTab(tabParam);
      
      // Focus the prep date input after tab switch with a delay for rendering
      if (focusParam === 'prepDate' && tabParam === 'exam') {
        setTimeout(() => {
          prepDateInputRef.current?.focus();
          prepDateInputRef.current?.scrollIntoView({ behavior: 'smooth', block: 'center' });
        }, 300);
      }
    }
  }, [searchParams]);


  // Syllabus management functions
  const addCustomSubject = useCallback(() => {
    const newSubject: SyllabusSubject = {
      id: `custom-${Date.now()}`,
      name: 'New Subject',
      tier: 2,
      topics: [],
      isCustom: true,
    };
    form.updateField('syllabus', [...form.data.syllabus, newSubject]);
    setHasUnsavedChanges(true);
  }, [form]);

  const removeSubject = useCallback(
    (subjectId: string) => {
      const updatedSyllabus = form.data.syllabus.filter((subject: SyllabusSubject) => subject.id !== subjectId);
      form.updateField('syllabus', updatedSyllabus);
      setHasUnsavedChanges(true);
    },
    [form]
  );

  const updateSubjectName = useCallback(
    (subjectId: string, name: string) => {
      const updatedSyllabus = form.data.syllabus.map((subject: SyllabusSubject) =>
        subject.id === subjectId ? { ...subject, name } : subject
      );
      form.updateField('syllabus', updatedSyllabus);
      setHasUnsavedChanges(true);
    },
    [form]
  );

  // Multi-course handlers
  const handleSetPrimaryCourse = useCallback(async (courseId: string) => {
    if (!form.data.selectedCourses) return;
    
    // Update local state
    const updatedCourses = form.data.selectedCourses.map(c => ({
      ...c,
      priority: c.examId === courseId ? 1 : 2
    }));
    
    // Find new primary course
    const newPrimary = updatedCourses.find(c => c.examId === courseId);
    if (newPrimary) {
      form.updateField('selectedCourses', updatedCourses);
      form.updateField('selectedExamId', newPrimary.examId);
      form.updateField('isCustomExam', !!newPrimary.isCustom);
      if (newPrimary.targetDate) {
         try {
             // Handle Timestamp vs Date string safely
             let dateObj: Date;
             // @ts-ignore - Handle Firebase Timestamp safely
             if (typeof newPrimary.targetDate.toDate === 'function') {
                 // @ts-ignore
                 dateObj = newPrimary.targetDate.toDate();
             } else {
                 // @ts-ignore
                 dateObj = new Date(newPrimary.targetDate);
             }
              form.updateField('examDate', dateObj.toISOString().split('T')[0] || '');
         } catch (e) {
             console.error("Date parsing error", e);
         }
      }
      
      // Also update selectedExam object for UI
      if (!newPrimary.isCustom) {
         const exam = getExamById(newPrimary.examId);
         setSelectedExam(exam || null);
      } else {
         setSelectedExam(null);
      }
      
      setHasUnsavedChanges(true);
      toast({
        title: "Primary Course Updated",
        description: `Set ${newPrimary.name} as your primary course. Save changes to apply.`
      });
    }
  }, [form, toast]);

  const handleRemoveCourse = useCallback((courseId: string) => {
    if (!form.data.selectedCourses) return;
    
    const courseToRemove = form.data.selectedCourses.find(c => c.examId === courseId);
    if (courseToRemove?.isPrimary) {
      toast({
         title: "Cannot Remove Primary Course",
         description: "Please set another course as primary before removing this one.",
         variant: "destructive"
      });
      return;
    }
    
    const updatedCourses = form.data.selectedCourses.filter(c => c.examId !== courseId);
    form.updateField('selectedCourses', updatedCourses);
    setHasUnsavedChanges(true);
    toast({
        title: "Course Removed",
        description: "Course removed from your list. Save changes to confirm."
    });
  }, [form, toast]);

  // Save profile changes
  const handleSave = useCallback(async () => {
    if (!user || !userData) {
      return;
    }

    try {
      setSaving(true);

      // Validate form data
      const validation = profileSchema.safeParse(form.data);
      if (!validation.success) {
        const errors: Record<string, string> = {};
        validation.error.errors.forEach(error => {
          const path = error.path.join('.');
          errors[path] = error.message;
        });
        setValidationErrors(errors);
        toast({
          title: 'Validation Error',
          description: 'Please fix the errors before saving.',
          variant: 'destructive',
        });
        return;
      }

      // Prepare update data with new schema
      const examName = form.data.isCustomExam 
        ? (form.data.customExam?.name || 'Custom Course')
        : (selectedExam?.name || 'Unknown Course');
        
      const updateData: Partial<UserType> = {
        displayName: form.data.displayName,
        // Use new currentExam structure
        currentExam: {
          id: form.data.selectedExamId,
          name: examName,
          targetDate: Timestamp.fromDate(new Date(form.data.examDate)),
        },
        primaryCourseId: form.data.selectedExamId,
        ...(form.data.preparationStartDate ? { preparationStartDate: Timestamp.fromDate(new Date(form.data.preparationStartDate)) } : {}),
        preferences: {
          ...form.data.preferences,
          theme: form.data.settings.theme
        },
        updatedAt: Timestamp.now(),
      };

      // Add userPersona only if it exists
      if (form.data.userPersona) {
        updateData.persona = form.data.userPersona;
      }

      // CRITICAL: Save sequentially to prevent partial data state
      // If updateUser succeeds but saveSyllabus fails (or vice versa), we'd have inconsistent data
      await updateUser(user.uid, updateData);
      
      // saveSyllabus now auto-resolves courseId and saves to course-specific storage
      await saveSyllabus(user.uid, form.data.syllabus);

      setHasUnsavedChanges(false);
      setValidationErrors({});

      toast({
        title: 'Profile Updated',
        description: 'Your profile has been successfully updated.',
      });

      // Refresh user data
      const updatedUser = await getUser(user.uid);
      if (updatedUser) {
        setUserData(updatedUser);
      }
    } catch (error) {
      console.error('Error saving profile:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save your profile. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [user, userData, form.data, toast]);

  // Calculate profile completion percentage
  const profileCompletionPercentage = useMemo(() => {
    let completed = 0;
    let total = 0;

    // Personal info (25%)
    total += 25;
    if (form.data.displayName && form.data.userPersona?.type) {
      completed += 25;
    }

    // Exam setup (25%)
    total += 25;
    if (form.data.selectedExamId && form.data.examDate) {
      completed += 25;
    }

    // Syllabus (25%)
    total += 25;
    if (form.data.syllabus.length > 0) {
      completed += 25;
    }

    // Preferences (25%)
    total += 25;
    if (
      form.data.preferences.dailyStudyGoalMinutes &&
      form.data.preferences.tierDefinitions[1] &&
      form.data.preferences.tierDefinitions[2] &&
      form.data.preferences.tierDefinitions[3]
    ) {
      completed += 25;
    }

    return Math.round((completed / total) * 100);
  }, [form.data]);

  // Filtered exams for display



  if (loading) {
    return <ProfileSkeleton />;
  }

  if (!user || !userData) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <AlertCircle className="h-12 w-12 text-red-400 mx-auto" />
          <p className="text-red-600">Failed to load profile data. Please try again.</p>
          <Button onClick={() => router.push('/dashboard')} variant="outline">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Dashboard
          </Button>
        </div>
      </div>
    );
  }

  return (
    <TooltipProvider>
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">

        {/* Header */}
        <div className="bg-white/90 backdrop-blur-sm border-b border-gray-200 sticky top-0 z-40">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <Button variant="ghost" onClick={() => router.push('/dashboard')} className="p-2">
                  <ArrowLeft className="h-5 w-5" />
                </Button>
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">Profile Settings</h1>
                  <p className="text-sm text-gray-600 hidden md:block">Manage your personal information and study preferences</p>
                </div>
              </div>

              <div className="flex items-center space-x-4">
                {/* Profile Completion */}
                <div className="flex items-center space-x-2">
                  <div className="w-24 h-2 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full transition-all duration-500"
                      style={{ width: `${profileCompletionPercentage}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium text-gray-700">{profileCompletionPercentage}% Complete</span>
                </div>

                {/* Save Status */}
                {hasUnsavedChanges && (
                  <Badge variant="outline" className="text-amber-600 border-amber-300">
                    Unsaved Changes
                  </Badge>
                )}

                {/* Save Button */}
                <Button onClick={handleSave} disabled={saving || !hasUnsavedChanges}>
                  {saving ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Saving...</span>
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 md:mr-2" />
                      <span className="hidden md:inline">Save Changes</span>
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <PageTransition>
          <div className="max-w-6xl mx-auto px-4 py-8">
            {/* Header */}
            <FeaturePageHeader
              title="Profile Settings"
              description="Manage your account, exam configuration, and study preferences"
              icon={<User className="h-5 w-5 text-indigo-600" />}
              className="mb-6"
            />

            {/* Validation Errors */}
            {Object.keys(validationErrors).length > 0 && (
              <Alert className="mb-6 border-red-200 bg-red-50">
                <AlertCircle className="h-4 w-4 text-red-600" />
                <AlertDescription className="text-red-800">
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

            {/* Profile Form */}
            <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6 min-h-[60vh]">
              {/* Tab Navigation */}
              <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 border border-gray-200">
                <ScrollableTabsList>
                  <TabsList className="flex w-full md:grid md:grid-cols-4 gap-1">
                    {PROFILE_TABS.map(tab => {
                      const Icon = tab.icon;
                      return (
                        <TabsTrigger
                          key={tab.id}
                          value={tab.id}
                          className="flex-shrink-0 snap-start min-w-fit md:min-w-0 flex items-center space-x-2 p-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                        >
                          <Icon className="h-4 w-4" />
                          <span className="hidden sm:inline">{tab.label}</span>
                        </TabsTrigger>
                      );
                    })}
                  </TabsList>
                </ScrollableTabsList>
              </div>

            {/* Tab Content */}
            <div className="space-y-6">
              {/* Personal Information Tab */}
              <TabsContent value="personal" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <User className="h-5 w-5 text-blue-600" />
                      <span>Personal Information</span>
                    </CardTitle>
                    <CardDescription>Basic information about you and your learning profile</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Display Name */}
                    <div className="space-y-2">
                      <Label htmlFor="display-name">Full Name *</Label>
                      <Input
                        id="display-name"
                        value={form.data.displayName}
                        onChange={e => form.updateField('displayName', e.target.value)}
                        placeholder="Enter your full name"
                        className={validationErrors.displayName ? 'border-red-300' : ''}
                      />
                      {validationErrors.displayName && (
                        <p className="text-sm text-red-600">{validationErrors.displayName}</p>
                      )}
                    </div>

                    {/* Email (read-only from Auth) */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Input id="email" value={user?.email || ''} readOnly className="bg-gray-50 cursor-not-allowed" />
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <div className="absolute right-3 top-1/2 transform -translate-y-1/2">
                              <Lock className="h-4 w-4 text-gray-400" />
                            </div>
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Email cannot be changed from this page</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                    </div>
                    </CardContent>
                  </Card>

                    {/* User Persona */}
                      <div className="space-y-4">
                        <Label className="text-base font-semibold">Profile Type</Label>
                        <MobileScrollGrid className="gap-4">
                          {(['student', 'working_professional', 'freelancer'] as UserPersonaType[]).map(type => {
                            const isSelected = form.data.userPersona?.type === type;
                            return (
                            <Card
                              key={type}
                              className={`cursor-pointer transition-all duration-200 min-w-[280px] relative overflow-hidden ${
                                isSelected
                                  ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-md'
                                  : 'border-muted hover:border-primary/50 hover:shadow-md'
                              }`}
                              onClick={() =>
                                form.updateField('userPersona', {
                                  ...form.data.userPersona,
                                  type,
                                })
                              }
                            >
                              <CardContent className="p-5 text-center relative z-10">
                                {isSelected && (
                                   <div className="absolute top-3 right-3 text-primary">
                                      <UserCheck className="h-5 w-5" />
                                   </div>
                                )}
                                <div className={`mb-3 inline-flex p-3 rounded-full ${isSelected ? 'bg-background' : 'bg-muted/50'}`}>
                                  {type === 'student' && <User className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />}
                                  {type === 'working_professional' && (
                                    <Briefcase className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />
                                  )}
                                  {type === 'freelancer' && <Activity className={`h-6 w-6 ${isSelected ? 'text-primary' : 'text-muted-foreground'}`} />}
                                </div>
                                <h3 className="font-semibold capitalize text-foreground">{type.replace('_', ' ')}</h3>
                                <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                  {type === 'student' && 'Full-time student with flexible schedule'}
                                  {type === 'working_professional' && 'Working professional with limited time'}
                                  {type === 'freelancer' && 'Flexible schedule with project commitments'}
                                </p>
                              </CardContent>
                            </Card>
                          )})}
                        </MobileScrollGrid>
                      </div>
              </TabsContent>

              {/* Exam Setup Tab */}
              <TabsContent value="exam" className="space-y-6">
                {/* Course Management Card */}
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span>Course Management</span>
                    </CardTitle>
                    <CardDescription>Manage your active courses and learning paths</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {/* Course List */}
                    <div className="space-y-4">
                       <div className="flex justify-between items-center">
                          <Label className="text-base font-semibold">My Courses</Label>
                       </div>
                       
                       {form.data.selectedCourses && form.data.selectedCourses.length > 0 ? (
                          <div className="grid gap-4">
                             {form.data.selectedCourses.sort((a, b) => (a.isPrimary === b.isPrimary) ? 0 : a.isPrimary ? -1 : 1).map((course) => (
                                <div key={course.examId} className={`p-4 rounded-lg border flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 ${course.isPrimary ? 'bg-blue-50 border-blue-200' : 'bg-white border-gray-200'}`}>
                                   <div>
                                      <div className="flex items-center space-x-2">
                                         <h4 className="font-semibold text-gray-900">{course.name}</h4>
                                         {course.isPrimary && <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">Primary</Badge>}
                                         {course.isCustom && <Badge variant="outline">Custom</Badge>}
                                      </div>
                                      <p className="text-sm text-gray-500 mt-1">Target: {course.targetDate && ((course.targetDate as any).toDate ? (course.targetDate as any).toDate().toLocaleDateString() : new Date(course.targetDate as any).toLocaleDateString())}</p>
                                   </div>
                                   <div className="flex items-center space-x-2 w-full sm:w-auto">
                                      {!course.isPrimary && (
                                         <>
                                            <Button size="sm" variant="ghost" onClick={() => handleSetPrimaryCourse(course.examId)}>Set Primary</Button>
                                            <Button size="sm" variant="ghost" className="text-red-600 hover:text-red-700 hover:bg-red-50" onClick={() => handleRemoveCourse(course.examId)}><Trash2 className="h-4 w-4"/></Button>
                                         </>
                                      )}
                                      {course.isPrimary && (
                                         <Button size="sm" variant="ghost" disabled className="text-gray-400">Current Primary</Button>
                                      )}
                                   </div>
                                </div>
                             ))}
                          </div>
                       ) : (
                          <div className="text-center py-8 text-gray-500">No courses found.</div>
                       )}
                    </div>
                  </CardContent>
                </Card>

                    {/* Current Primary Exam Details (Only show if isCustomExam is true for editing) */}
                    {form.data.isCustomExam && (
                      <Card className="border-purple-200 bg-purple-50">
                        <CardHeader>
                          <CardTitle className="text-purple-800 text-base">Custom Exam Settings</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                          <div className="space-y-2">
                            <Label htmlFor="custom-exam-name">Exam Name *</Label>
                            <Input
                              id="custom-exam-name"
                              value={form.data.customExam?.name || ''}
                              onChange={e =>
                                form.updateField('customExam', {
                                  ...form.data.customExam,
                                  name: e.target.value,
                                })
                              }
                              placeholder="e.g., State PCS, Company Test"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label htmlFor="custom-exam-category">Category</Label>
                            <Input
                              id="custom-exam-category"
                              value={form.data.customExam?.category || ''}
                              onChange={e =>
                                form.updateField('customExam', {
                                  ...form.data.customExam,
                                  category: e.target.value,
                                })
                              }
                              placeholder="e.g., State Services, Private Sector"
                            />
                          </div>

                          <div className="space-y-2">
                            <Label htmlFor="custom-exam-description">Description</Label>
                            <Textarea
                              id="custom-exam-description"
                              value={form.data.customExam?.description || ''}
                              onChange={e =>
                                form.updateField('customExam', {
                                  ...form.data.customExam,
                                  description: e.target.value,
                                })
                              }
                              placeholder="Brief description of your exam"
                              rows={3}
                            />
                          </div>
                        </CardContent>
                      </Card>
                    )}

                    {/* Exam Date */}
                    <Card>
                        <CardHeader>
                            <CardTitle className="flex items-center space-x-2">
                                <Calendar className="h-5 w-5 text-blue-600" />
                                <span>Exam Schedule</span>
                            </CardTitle>
                             <CardDescription>Set the target date for your primary exam</CardDescription>
                        </CardHeader>
                        <CardContent>
                            <div className="space-y-2">
                              <Label htmlFor="exam-date">Exam Date *</Label>
                              <Input
                                id="exam-date"
                                type="date"
                                value={form.data.examDate}
                                onChange={e => form.updateField('examDate', e.target.value)}
                                min={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
                                className={validationErrors.examDate ? 'border-red-300' : ''}
                              />
                              {validationErrors.examDate && <p className="text-sm text-red-600">{validationErrors.examDate}</p>}
                              {form.data.examDate && !validationErrors.examDate && (
                                <div className="flex items-center space-x-2 text-sm bg-blue-50 p-3 rounded-lg">
                                  <Calendar className="h-4 w-4 text-blue-600" />
                                  <span className="text-blue-800">
                                    {(() => {
                                      const examDate = new Date(form.data.examDate);
                                      const today = new Date();
                                      const diffDays = Math.ceil(
                                        (examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)
                                      );
                                      return `${diffDays} days to prepare`;
                                    })()}
                                  </span>
                                </div>
                              )}
                            </div>

                            {/* Preparation Start Date */}
                            <div className="space-y-2 pt-4 border-t">
                              <Label htmlFor="prep-start-date">When did you start preparing?</Label>
                              <Input
                                ref={prepDateInputRef}
                                id="prep-start-date"
                                type="date"
                                value={form.data.preparationStartDate}
                                onChange={e => form.updateField('preparationStartDate', e.target.value)}
                                max={new Date().toISOString().split('T')[0]}
                              />
                              <p className="text-xs text-muted-foreground">
                                Used to calculate your study velocity and pace for Strategy Insights
                              </p>
                            </div>
                        </CardContent>
                    </Card>
              </TabsContent>

              {/* Syllabus Tab */}
              <TabsContent value="syllabus" className="space-y-6">
                 {/* Header Section */}
                 <div className="flex flex-col space-y-2">
                    <h3 className="text-lg font-semibold flex items-center gap-2">
                      <Target className="h-5 w-5 text-primary" />
                      Syllabus
                    </h3>
                    <p className="text-muted-foreground text-sm">
                      Manage your subjects for this course
                    </p>
                 </div>

                    {form.data.syllabus.length === 0 ? (
                      <div className="text-center py-12 border-2 border-dashed rounded-xl bg-muted/10">
                        <div className="bg-muted rounded-full p-4 w-20 h-20 mx-auto mb-4 flex items-center justify-center">
                           <BookOpen className="h-10 w-10 text-muted-foreground" />
                        </div>
                        <h3 className="font-semibold text-foreground mb-2 text-lg">No subjects added yet</h3>
                        <p className="text-muted-foreground mb-6">Start by selecting an exam or adding custom subjects</p>
                        <Button onClick={addCustomSubject} size="lg">
                          <Plus className="h-5 w-5 mr-2" />
                          Add Subject
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Subjects Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                          {form.data.syllabus.map(subject => (
                            <Card key={subject.id} className="bg-background shadow-sm hover:shadow-md transition-shadow border ring-1 ring-black/5">
                              <CardContent className="p-4">
                                <div className="flex items-start justify-between gap-3">
                                  <div className="flex-1 min-w-0">
                                    {subject.isCustom ? (
                                      <Input
                                        value={subject.name}
                                        onChange={e => updateSubjectName(subject.id, e.target.value)}
                                        className="font-semibold text-sm border-transparent hover:border-input p-0 h-auto bg-transparent focus:ring-0 px-1 -ml-1 truncate"
                                      />
                                    ) : (
                                      <h4 className="font-semibold text-sm truncate pr-2" title={subject.name}>{subject.name}</h4>
                                    )}
                                    {subject.topics && (
                                      <p className="text-xs text-muted-foreground mt-1 flex items-center">
                                        <BookOpen className="h-3 w-3 mr-1" />
                                        {subject.topics.length} topics
                                      </p>
                                    )}
                                  </div>

                                  <div className="flex items-center flex-shrink-0">
                                    {/* Remove Subject */}
                                    {subject.isCustom && (
                                      <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeSubject(subject.id)}
                                        className="h-7 w-7 p-0 ml-1 text-muted-foreground hover:text-red-600"
                                      >
                                        <Trash2 className="h-3.5 w-3.5" />
                                      </Button>
                                    )}
                                  </div>
                                </div>
                              </CardContent>
                            </Card>
                          ))}
                        </div>

                        {/* Add Custom Subject */}
                        <div className="flex justify-center pt-4">
                          <Button variant="outline" size="lg" onClick={addCustomSubject} className="border-dashed">
                            <Plus className="h-4 w-4 mr-2" />
                            Add Custom Subject
                          </Button>
                        </div>
                      </div>
                    )}
              </TabsContent>

              {/* Study Preferences Tab */}
              <TabsContent value="preferences" className="space-y-8">
                {/* Daily Study Goal Card */}
                <Card>
                   <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span>Daily Goals</span>
                    </CardTitle>
                    <CardDescription>Set your commitment level</CardDescription>
                   </CardHeader>
                   <CardContent>
                    <div className="space-y-2">
                       <Label htmlFor="daily-goal">Daily Study Goal (Minutes) *</Label>
                       <div className="flex items-center space-x-4">
                         <Input
                           id="daily-goal"
                           type="number"
                           inputMode="numeric"
                           min="60"
                           max="720"
                           step="30"
                           value={form.data.preferences.dailyStudyGoalMinutes}
                           onChange={e =>
                             form.updateField('preferences', {
                               ...form.data.preferences,
                               dailyStudyGoalMinutes: parseInt(e.target.value) ?? 240,
                             })
                           }
                           className={validationErrors['preferences.dailyStudyGoalMinutes'] ? 'border-red-300' : ''}
                         />
                         <div className="text-sm text-gray-600">
                           {Math.floor(form.data.preferences.dailyStudyGoalMinutes / 60)}h{' '}
                           {form.data.preferences.dailyStudyGoalMinutes % 60}m
                         </div>
                       </div>
                       {validationErrors['preferences.dailyStudyGoalMinutes'] && (
                         <p className="text-sm text-red-600">{validationErrors['preferences.dailyStudyGoalMinutes']}</p>
                       )}
                    </div>
                   </CardContent>
                </Card>

                    {/* Preferred Study Time - Grid Section */}
                    <div className="space-y-4">
                      <Label className="text-base font-semibold">Preferred Study Time</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        {(['morning', 'afternoon', 'evening', 'night'] as const).map(time => (
                          <Card
                            key={time}
                            className={`cursor-pointer transition-all duration-200 border relative overflow-hidden ${
                              form.data.preferences.preferredStudyTime === time
                                ? 'border-primary ring-2 ring-primary bg-primary/5 shadow-md'
                                : 'border-muted hover:border-primary/50 hover:shadow-sm'
                            }`}
                            onClick={() =>
                              form.updateField('preferences', {
                                ...form.data.preferences,
                                preferredStudyTime: time,
                              })
                            }
                          >
                            <CardContent className="p-4 text-center">
                              <div className="mb-3">
                                {time === 'morning' && <Sun className="h-7 w-7 mx-auto text-yellow-500" />}
                                {time === 'afternoon' && <Sun className="h-7 w-7 mx-auto text-orange-500" />}
                                {time === 'evening' && <Moon className="h-7 w-7 mx-auto text-purple-500" />}
                                {time === 'night' && <Moon className="h-7 w-7 mx-auto text-blue-500" />}
                              </div>
                              <h4 className="font-semibold text-sm capitalize">{time}</h4>
                              <p className="text-xs text-muted-foreground mt-1">
                                {time === 'morning' && '6:00 - 12:00'}
                                {time === 'afternoon' && '12:00 - 18:00'}
                                {time === 'evening' && '18:00 - 22:00'}
                                {time === 'night' && '22:00 - 6:00'}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>

                    {/* Learning Science / Revision Intervals */}
                    <Card>
                       <CardHeader>
                          <CardTitle className="flex items-center space-x-2">
                             <Zap className="h-5 w-5 text-yellow-500" />
                             <span>Spaced Repetition</span>
                          </CardTitle>
                          <CardDescription>Optimize your memory retention schedule</CardDescription>
                       </CardHeader>
                       <CardContent>
                        <div className="space-y-4">
                          <Label>Revision Intervals (Days)</Label>
                          <div className="flex items-center space-x-3 overflow-x-auto pb-2 pt-4">
                            {form.data.preferences.revisionIntervals.map((interval, index) => (
                              <div key={index} className="flex items-center space-x-2 flex-shrink-0">
                                <div className="relative">
                                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 bg-muted text-[10px] px-1.5 py-0.5 rounded-full border whitespace-nowrap">R{index+1}</span>
                                    <Input
                                      type="number"
                                      inputMode="numeric"
                                      min="1"
                                      max="365"
                                      value={interval}
                                      onChange={e => {
                                        const newIntervals = [...form.data.preferences.revisionIntervals];
                                        newIntervals[index] = parseInt(e.target.value) || 1;
                                        form.updateField('preferences', {
                                          ...form.data.preferences,
                                          revisionIntervals: newIntervals,
                                        });
                                      }}
                                      className="w-16 text-center font-mono"
                                    />
                                </div>
                                {index < form.data.preferences.revisionIntervals.length - 1 && (
                                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                                )}
                              </div>
                            ))}
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Topics will be scheduled for revision after these intervals (Day 1, Day 3, etc.)
                          </p>
                        </div>
                       </CardContent>
                    </Card>
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Preview Dialog */}
        <Dialog open={showPreviewDialog} onOpenChange={setShowPreviewDialog}>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Profile Preview</DialogTitle>
              <DialogDescription>Review your complete profile configuration</DialogDescription>
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
                    <strong>Email:</strong> {userData.email}
                  </p>
                  <p>
                    <strong>Profile:</strong> {form.data.userPersona?.type.replace('_', ' ')}
                  </p>
                </div>
              </div>

              {/* Exam Info */}
              <div>
                <h3 className="font-semibold mb-2">Exam Configuration</h3>
                <div className="bg-gray-50 p-3 rounded-lg space-y-1">
                  <p>
                    <strong>Exam:</strong> {selectedExam?.name || form.data.customExam?.name}
                  </p>
                  <p>
                    <strong>Date:</strong> {new Date(form.data.examDate).toLocaleDateString()}
                  </p>
                  <p>
                    <strong>Days to prepare:</strong>{' '}
                    {Math.ceil((new Date(form.data.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))}
                  </p>
                </div>
              </div>

              {/* Study Preferences */}
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
                    <strong>Subjects:</strong> {form.data.syllabus.length} subjects organized in tiers
                  </p>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button variant="outline" onClick={() => setShowPreviewDialog(false)}>
                Close Preview
              </Button>
              <Button onClick={handleSave} disabled={saving}>
                {saving ? 'Saving...' : 'Save Profile'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Unsaved Changes Warning */}
        {hasUnsavedChanges && (
          <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800">You have unsaved changes</span>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                Save Now
              </Button>
            </div>
          </div>
        )}
      </PageTransition>
      </div>
      <BottomNav />
    </TooltipProvider>
  );
}

export default function ProfilePage() {
  return (
    <Suspense 
      fallback={
        <div className="flex items-center justify-center min-h-screen bg-gray-50">
          <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
        </div>
      }
    >
      <ProfileContent />
    </Suspense>
  );
}
