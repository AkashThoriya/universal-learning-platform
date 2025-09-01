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
import {
  User,
  Settings,
  BookOpen,
  Calendar,
  Target,
  Bell,
  Save,
  RefreshCw,
  AlertCircle,
  Trash2,
  Plus,
  Moon,
  Sun,
  Smartphone,
  ArrowLeft,
  ChevronRight,
  Palette,
  Lock,
  UserCheck,
  Activity,
  Loader2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import React, { useState, useEffect, useCallback, useMemo } from 'react';
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
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { useForm } from '@/hooks/useForm';
import { EXAMS_DATA, getExamById } from '@/lib/exams-data';
import { getUser, updateUser, getSyllabus, saveSyllabus } from '@/lib/firebase-utils';
import { Exam, SyllabusSubject, User as UserType, UserPersona, UserPersonaType } from '@/types/exam';

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
  examDate: string;
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
  syllabus: z.array(z.any()).min(0, 'Syllabus configuration is required'),
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
    revisionIntervals: z.array(z.number().min(1).max(365)).min(3, 'At least 3 intervals required'),
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
 * Profile tab configuration
 */
const PROFILE_TABS = [
  {
    id: 'personal',
    label: 'Personal Info',
    icon: User,
    description: 'Basic information and persona',
  },
  {
    id: 'exam',
    label: 'Exam Setup',
    icon: BookOpen,
    description: 'Target exam and timeline',
  },
  {
    id: 'syllabus',
    label: 'Syllabus',
    icon: Target,
    description: 'Subject organization and priorities',
  },
  {
    id: 'preferences',
    label: 'Study Preferences',
    icon: Settings,
    description: 'Goals and scheduling',
  },
  {
    id: 'notifications',
    label: 'Notifications',
    icon: Bell,
    description: 'Alerts and reminders',
  },
  {
    id: 'system',
    label: 'System Settings',
    icon: Palette,
    description: 'Theme and language',
  },
];

/**
 * Enhanced User Profile Management Page
 */
export default function ProfilePage() {
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
          if (fetchedUser.selectedExamId && fetchedUser.selectedExamId !== 'custom') {
            const exam = getExamById(fetchedUser.selectedExamId);
            setSelectedExam(exam || null);
          }

          // Initialize form with user data
          const formData: ProfileFormData = {
            displayName: fetchedUser.displayName || '',
            email: fetchedUser.email || '',
            userPersona: fetchedUser.userPersona ?? undefined,
            selectedExamId: fetchedUser.selectedExamId || '',
            examDate: fetchedUser.examDate ? fetchedUser.examDate.toDate().toISOString().split('T')[0] || '' : '',
            isCustomExam: fetchedUser.isCustomExam ?? false,
            customExam: {
              name: fetchedUser.customExam?.name || '',
              description: fetchedUser.customExam?.description || '',
              category: fetchedUser.customExam?.category || '',
            },
            syllabus: userSyllabus ?? [],
            preferences: {
              dailyStudyGoalMinutes: fetchedUser.preferences?.dailyStudyGoalMinutes ?? 240,
              preferredStudyTime: fetchedUser.preferences?.preferredStudyTime ?? 'morning',
              tierDefinitions: fetchedUser.preferences?.tierDefinitions || {
                1: 'High Priority - Core Topics',
                2: 'Medium Priority - Important Topics',
                3: 'Low Priority - Additional Topics',
              },
              revisionIntervals: fetchedUser.preferences?.revisionIntervals || [1, 3, 7, 16, 35],
              notifications: fetchedUser.preferences?.notifications || {
                revisionReminders: true,
                dailyGoalReminders: true,
                healthCheckReminders: true,
              },
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
  }, [user]);

  // Initialize form with enhanced configuration
  const form = useForm<ProfileFormData>({
    initialData: {
      displayName: '',
      email: '',
      userPersona: undefined,
      selectedExamId: '',
      examDate: '',
      isCustomExam: false,
      customExam: { name: '', description: '', category: '' },
      syllabus: [],
      preferences: {
        dailyStudyGoalMinutes: 240,
        preferredStudyTime: 'morning' as const,
        tierDefinitions: {
          1: 'High Priority - Core Topics',
          2: 'Medium Priority - Important Topics',
          3: 'Low Priority - Additional Topics',
        },
        revisionIntervals: [1, 3, 7, 16, 35],
        notifications: {
          revisionReminders: true,
          dailyGoalReminders: true,
          healthCheckReminders: true,
        },
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

  // Exam selection handler
  const handleExamSelect = useCallback(
    (examId: string) => {
      if (examId === 'custom') {
        form.updateField('selectedExamId', 'custom');
        form.updateField('isCustomExam', true);
        form.updateField('syllabus', []);
        setSelectedExam(null);
      } else {
        const exam = getExamById(examId);
        if (exam) {
          form.updateField('selectedExamId', examId);
          form.updateField('isCustomExam', false);
          form.updateField('syllabus', exam.defaultSyllabus);
          setSelectedExam(exam);
        }
      }
      setHasUnsavedChanges(true);
    },
    [form]
  );

  // Syllabus management functions
  const updateSubjectTier = useCallback(
    (subjectId: string, tier: 1 | 2 | 3) => {
      const updatedSyllabus = form.data.syllabus.map((subject: SyllabusSubject) =>
        subject.id === subjectId ? { ...subject, tier } : subject
      );
      form.updateField('syllabus', updatedSyllabus);
      setHasUnsavedChanges(true);
    },
    [form]
  );

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

      // Prepare update data
      const updateData: Partial<UserType> = {
        displayName: form.data.displayName,
        selectedExamId: form.data.selectedExamId,
        examDate: Timestamp.fromDate(new Date(form.data.examDate)),
        isCustomExam: form.data.isCustomExam,
        customExam: form.data.isCustomExam ? form.data.customExam : undefined,
        preferences: form.data.preferences,
        updatedAt: Timestamp.now(),
      };

      // Add userPersona only if it exists
      if (form.data.userPersona) {
        updateData.userPersona = form.data.userPersona;
      }

      // Save user data and syllabus
      await Promise.all([updateUser(user.uid, updateData), saveSyllabus(user.uid, form.data.syllabus)]);

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
  const filteredExams = useMemo(() => {
    return EXAMS_DATA.slice(0, 20); // Show top 20 exams for performance
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-100">
        <div className="text-center space-y-4">
          <Loader2 className="animate-spin h-12 w-12 text-blue-600 mx-auto" />
          <p className="text-gray-600">Loading your profile...</p>
        </div>
      </div>
    );
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
                  <p className="text-sm text-gray-600">Manage your personal information and study preferences</p>
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
                      <Loader2 className="animate-spin h-4 w-4 mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content */}
        <div className="max-w-7xl mx-auto px-4 py-8">
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
          <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
            {/* Tab Navigation */}
            <div className="bg-white/90 backdrop-blur-sm rounded-lg p-2 border border-gray-200">
              <TabsList className="grid w-full grid-cols-6 gap-1">
                {PROFILE_TABS.map(tab => {
                  const Icon = tab.icon;
                  return (
                    <TabsTrigger
                      key={tab.id}
                      value={tab.id}
                      className="flex items-center space-x-2 p-3 data-[state=active]:bg-blue-600 data-[state=active]:text-white"
                    >
                      <Icon className="h-4 w-4" />
                      <span className="hidden sm:inline">{tab.label}</span>
                    </TabsTrigger>
                  );
                })}
              </TabsList>
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

                    {/* Email (read-only) */}
                    <div className="space-y-2">
                      <Label htmlFor="email">Email Address</Label>
                      <div className="relative">
                        <Input id="email" value={userData.email} readOnly className="bg-gray-50 cursor-not-allowed" />
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

                    {/* User Persona */}
                    <div className="space-y-4">
                      <Label>Profile Type</Label>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                        {(['student', 'working_professional', 'freelancer'] as UserPersonaType[]).map(type => (
                          <Card
                            key={type}
                            className={`cursor-pointer transition-all duration-200 border-2 ${
                              form.data.userPersona?.type === type
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() =>
                              form.updateField('userPersona', {
                                ...form.data.userPersona,
                                type,
                              })
                            }
                          >
                            <CardContent className="p-4 text-center">
                              <div className="mb-2">
                                {type === 'student' && <User className="h-8 w-8 mx-auto text-blue-600" />}
                                {type === 'working_professional' && (
                                  <UserCheck className="h-8 w-8 mx-auto text-green-600" />
                                )}
                                {type === 'freelancer' && <Activity className="h-8 w-8 mx-auto text-purple-600" />}
                              </div>
                              <h3 className="font-medium capitalize">{type.replace('_', ' ')}</h3>
                              <p className="text-sm text-gray-600 mt-1">
                                {type === 'student' && 'Full-time student with flexible schedule'}
                                {type === 'working_professional' && 'Working professional with limited time'}
                                {type === 'freelancer' && 'Flexible schedule with project commitments'}
                              </p>
                            </CardContent>
                          </Card>
                        ))}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Exam Setup Tab */}
              <TabsContent value="exam" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      <span>Exam Configuration</span>
                    </CardTitle>
                    <CardDescription>Your target exam and timeline details</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Current Exam Display */}
                    {selectedExam && (
                      <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-blue-900">{selectedExam.name}</h3>
                            <p className="text-sm text-blue-700 mt-1">{selectedExam.description}</p>
                            <div className="flex items-center space-x-2 mt-2">
                              <Badge variant="outline">{selectedExam.category}</Badge>
                              {selectedExam.stages && (
                                <Badge variant="secondary">{selectedExam.stages.length} stages</Badge>
                              )}
                            </div>
                          </div>
                          <Button variant="outline" size="sm" onClick={() => handleExamSelect('custom')}>
                            Change Exam
                          </Button>
                        </div>
                      </div>
                    )}

                    {/* Exam Selection */}
                    <div className="space-y-4">
                      <Label>Target Exam *</Label>
                      <Select value={form.data.selectedExamId} onValueChange={handleExamSelect}>
                        <SelectTrigger>
                          <SelectValue placeholder="Select your target exam" />
                        </SelectTrigger>
                        <SelectContent>
                          {filteredExams.map(exam => (
                            <SelectItem key={exam.id} value={exam.id}>
                              <div className="flex items-center justify-between w-full">
                                <span>{exam.name}</span>
                                <Badge variant="outline" className="ml-2">
                                  {exam.category}
                                </Badge>
                              </div>
                            </SelectItem>
                          ))}
                          <SelectItem value="custom">
                            <div className="flex items-center space-x-2">
                              <Plus className="h-4 w-4" />
                              <span>Create Custom Exam</span>
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Custom Exam Details */}
                    {form.data.isCustomExam && (
                      <Card className="border-purple-200 bg-purple-50">
                        <CardHeader>
                          <CardTitle className="text-purple-800">Custom Exam Details</CardTitle>
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
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Syllabus Tab */}
              <TabsContent value="syllabus" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Target className="h-5 w-5 text-blue-600" />
                      <span>Syllabus Organization</span>
                    </CardTitle>
                    <CardDescription>
                      Organize your subjects by priority levels for effective study planning
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    {form.data.syllabus.length === 0 ? (
                      <div className="text-center py-8">
                        <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                        <h3 className="font-medium text-gray-900 mb-2">No subjects added yet</h3>
                        <p className="text-gray-600 mb-4">Start by selecting an exam or adding custom subjects</p>
                        <Button onClick={addCustomSubject}>
                          <Plus className="h-4 w-4 mr-2" />
                          Add Subject
                        </Button>
                      </div>
                    ) : (
                      <div className="space-y-6">
                        {/* Tier Definitions */}
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          {[1, 2, 3].map(tier => (
                            <div key={tier} className="space-y-2">
                              <Label htmlFor={`tier-${tier}`}>
                                Tier {tier} Definition
                                <span className="text-red-500 ml-1">*</span>
                              </Label>
                              <Input
                                id={`tier-${tier}`}
                                value={form.data.preferences.tierDefinitions[tier as 1 | 2 | 3]}
                                onChange={e =>
                                  form.updateField('preferences', {
                                    ...form.data.preferences,
                                    tierDefinitions: {
                                      ...form.data.preferences.tierDefinitions,
                                      [tier]: e.target.value,
                                    },
                                  })
                                }
                                placeholder={`Define Tier ${tier}...`}
                                className={
                                  tier === 1
                                    ? 'border-red-300 focus:border-red-500'
                                    : tier === 2
                                      ? 'border-yellow-300 focus:border-yellow-500'
                                      : 'border-green-300 focus:border-green-500'
                                }
                              />
                            </div>
                          ))}
                        </div>

                        {/* Subjects by Tier */}
                        <div className="space-y-6">
                          {[1, 2, 3].map(tier => {
                            const tierSubjects = form.data.syllabus.filter(subject => subject.tier === tier);
                            const tierColor =
                              tier === 1
                                ? 'border-red-200 bg-red-50'
                                : tier === 2
                                  ? 'border-yellow-200 bg-yellow-50'
                                  : 'border-green-200 bg-green-50';

                            return (
                              <div key={tier} className={`p-4 rounded-lg border ${tierColor}`}>
                                <div className="flex items-center justify-between mb-4">
                                  <h3 className="font-semibold text-gray-900">
                                    Tier {tier} ({tierSubjects.length} subjects)
                                  </h3>
                                  <Badge
                                    variant={tier === 1 ? 'destructive' : tier === 2 ? 'default' : 'secondary'}
                                    className="capitalize"
                                  >
                                    {form.data.preferences.tierDefinitions[tier as 1 | 2 | 3]}
                                  </Badge>
                                </div>

                                {tierSubjects.length === 0 ? (
                                  <p className="text-gray-600 text-sm">No subjects in this tier</p>
                                ) : (
                                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                                    {tierSubjects.map(subject => (
                                      <Card key={subject.id} className="bg-white">
                                        <CardContent className="p-3">
                                          <div className="flex items-start justify-between">
                                            <div className="flex-1">
                                              {subject.isCustom ? (
                                                <Input
                                                  value={subject.name}
                                                  onChange={e => updateSubjectName(subject.id, e.target.value)}
                                                  className="font-medium text-sm border-none p-0 h-auto bg-transparent"
                                                />
                                              ) : (
                                                <h4 className="font-medium text-sm">{subject.name}</h4>
                                              )}
                                              {subject.topics && (
                                                <p className="text-xs text-gray-600 mt-1">
                                                  {subject.topics.length} topics
                                                </p>
                                              )}
                                            </div>

                                            <div className="flex items-center space-x-1 ml-2">
                                              {/* Tier Selection */}
                                              <Select
                                                value={subject.tier.toString()}
                                                onValueChange={value =>
                                                  updateSubjectTier(subject.id, parseInt(value) as 1 | 2 | 3)
                                                }
                                              >
                                                <SelectTrigger className="w-16 h-6 text-xs">
                                                  <SelectValue />
                                                </SelectTrigger>
                                                <SelectContent>
                                                  <SelectItem value="1">T1</SelectItem>
                                                  <SelectItem value="2">T2</SelectItem>
                                                  <SelectItem value="3">T3</SelectItem>
                                                </SelectContent>
                                              </Select>

                                              {/* Remove Subject */}
                                              {subject.isCustom && (
                                                <Button
                                                  variant="ghost"
                                                  size="sm"
                                                  onClick={() => removeSubject(subject.id)}
                                                  className="h-6 w-6 p-0 text-red-600 hover:text-red-700"
                                                >
                                                  <Trash2 className="h-3 w-3" />
                                                </Button>
                                              )}
                                            </div>
                                          </div>
                                        </CardContent>
                                      </Card>
                                    ))}
                                  </div>
                                )}
                              </div>
                            );
                          })}
                        </div>

                        {/* Add Custom Subject */}
                        <div className="flex justify-center">
                          <Button variant="outline" onClick={addCustomSubject}>
                            <Plus className="h-4 w-4 mr-2" />
                            Add Custom Subject
                          </Button>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Study Preferences Tab */}
              <TabsContent value="preferences" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Settings className="h-5 w-5 text-blue-600" />
                      <span>Study Preferences</span>
                    </CardTitle>
                    <CardDescription>Configure your daily goals and study schedule</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Daily Study Goal */}
                    <div className="space-y-2">
                      <Label htmlFor="daily-goal">Daily Study Goal (Minutes) *</Label>
                      <div className="flex items-center space-x-4">
                        <Input
                          id="daily-goal"
                          type="number"
                          min="60"
                          max="720"
                          step="30"
                          value={form.data.preferences.dailyStudyGoalMinutes}
                          onChange={e =>
                            form.updateField('preferences', {
                              ...form.data.preferences,
                              dailyStudyGoalMinutes: parseInt(e.target.value) || 240,
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

                    {/* Preferred Study Time */}
                    <div className="space-y-2">
                      <Label>Preferred Study Time</Label>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {(['morning', 'afternoon', 'evening', 'night'] as const).map(time => (
                          <Card
                            key={time}
                            className={`cursor-pointer transition-all duration-200 border-2 ${
                              form.data.preferences.preferredStudyTime === time
                                ? 'border-blue-500 bg-blue-50'
                                : 'border-gray-200 hover:border-gray-300'
                            }`}
                            onClick={() =>
                              form.updateField('preferences', {
                                ...form.data.preferences,
                                preferredStudyTime: time,
                              })
                            }
                          >
                            <CardContent className="p-3 text-center">
                              <div className="mb-2">
                                {time === 'morning' && <Sun className="h-6 w-6 mx-auto text-yellow-500" />}
                                {time === 'afternoon' && <Sun className="h-6 w-6 mx-auto text-orange-500" />}
                                {time === 'evening' && <Moon className="h-6 w-6 mx-auto text-purple-500" />}
                                {time === 'night' && <Moon className="h-6 w-6 mx-auto text-blue-500" />}
                              </div>
                              <h4 className="font-medium text-sm capitalize">{time}</h4>
                              <p className="text-xs text-gray-600 mt-1">
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

                    {/* Revision Intervals */}
                    <div className="space-y-2">
                      <Label>Spaced Repetition Intervals (Days)</Label>
                      <div className="flex items-center space-x-2">
                        {form.data.preferences.revisionIntervals.map((interval, index) => (
                          <div key={index} className="flex items-center space-x-1">
                            <Input
                              type="number"
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
                              className="w-16 text-center"
                            />
                            {index < form.data.preferences.revisionIntervals.length - 1 && (
                              <ChevronRight className="h-4 w-4 text-gray-400" />
                            )}
                          </div>
                        ))}
                      </div>
                      <p className="text-sm text-gray-600">
                        Topics will be scheduled for revision after these intervals
                      </p>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* Notifications Tab */}
              <TabsContent value="notifications" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Bell className="h-5 w-5 text-blue-600" />
                      <span>Notification Settings</span>
                    </CardTitle>
                    <CardDescription>Choose when and how you want to be reminded</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Notification Types */}
                    <div className="space-y-4">
                      {[
                        {
                          key: 'revisionReminders',
                          label: 'Revision Reminders',
                          description: 'Get notified when topics are due for revision',
                          icon: RefreshCw,
                        },
                        {
                          key: 'dailyGoalReminders',
                          label: 'Daily Goal Reminders',
                          description: 'Remind me about my daily study goals',
                          icon: Target,
                        },
                        {
                          key: 'healthCheckReminders',
                          label: 'Health Check Reminders',
                          description: 'Remind me to log my daily health metrics',
                          icon: Activity,
                        },
                      ].map(notification => {
                        const Icon = notification.icon;
                        return (
                          <div
                            key={notification.key}
                            className="flex items-center justify-between p-4 border rounded-lg"
                          >
                            <div className="flex items-start space-x-3">
                              <Icon className="h-5 w-5 text-blue-600 mt-1" />
                              <div>
                                <h3 className="font-medium">{notification.label}</h3>
                                <p className="text-sm text-gray-600">{notification.description}</p>
                              </div>
                            </div>
                            <Switch
                              checked={
                                form.data.preferences.notifications[
                                  notification.key as keyof typeof form.data.preferences.notifications
                                ]
                              }
                              onCheckedChange={checked =>
                                form.updateField('preferences', {
                                  ...form.data.preferences,
                                  notifications: {
                                    ...form.data.preferences.notifications,
                                    [notification.key]: checked,
                                  },
                                })
                              }
                            />
                          </div>
                        );
                      })}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              {/* System Settings Tab */}
              <TabsContent value="system" className="space-y-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center space-x-2">
                      <Palette className="h-5 w-5 text-blue-600" />
                      <span>System Settings</span>
                    </CardTitle>
                    <CardDescription>Customize your app experience and preferences</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {/* Theme Selection */}
                    <div className="space-y-3">
                      <Label>Theme</Label>
                      <div className="grid grid-cols-3 gap-3">
                        {[
                          { value: 'light', label: 'Light', icon: Sun },
                          { value: 'dark', label: 'Dark', icon: Moon },
                          { value: 'system', label: 'System', icon: Smartphone },
                        ].map(theme => {
                          const Icon = theme.icon;
                          return (
                            <Card
                              key={theme.value}
                              className={`cursor-pointer transition-all duration-200 border-2 ${
                                form.data.settings.theme === theme.value
                                  ? 'border-blue-500 bg-blue-50'
                                  : 'border-gray-200 hover:border-gray-300'
                              }`}
                              onClick={() =>
                                form.updateField('settings', {
                                  ...form.data.settings,
                                  theme: theme.value as 'light' | 'dark' | 'system',
                                })
                              }
                            >
                              <CardContent className="p-3 text-center">
                                <Icon className="h-6 w-6 mx-auto mb-2 text-gray-600" />
                                <h4 className="font-medium text-sm">{theme.label}</h4>
                              </CardContent>
                            </Card>
                          );
                        })}
                      </div>
                    </div>

                    {/* Language */}
                    <div className="space-y-2">
                      <Label htmlFor="language">Language</Label>
                      <Select
                        value={form.data.settings.language}
                        onValueChange={value =>
                          form.updateField('settings', {
                            ...form.data.settings,
                            language: value,
                          })
                        }
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="en">English</SelectItem>
                          <SelectItem value="hi">Hindi</SelectItem>
                          <SelectItem value="es">Spanish</SelectItem>
                          <SelectItem value="fr">French</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Timezone */}
                    <div className="space-y-2">
                      <Label htmlFor="timezone">Timezone</Label>
                      <Input
                        id="timezone"
                        value={form.data.settings.timezone}
                        onChange={e =>
                          form.updateField('settings', {
                            ...form.data.settings,
                            timezone: e.target.value,
                          })
                        }
                        placeholder="Your timezone"
                        readOnly
                        className="bg-gray-50"
                      />
                      <p className="text-sm text-gray-600">Timezone is automatically detected from your browser</p>
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
                    <strong>Exam:</strong> {selectedExam?.name ?? form.data.customExam?.name}
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
          <div className="fixed bottom-4 right-4 bg-amber-50 border border-amber-200 rounded-lg p-4 shadow-lg">
            <div className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-amber-600" />
              <span className="text-amber-800">You have unsaved changes</span>
              <Button size="sm" onClick={handleSave} disabled={saving}>
                Save Now
              </Button>
            </div>
          </div>
        )}
      </div>
    </TooltipProvider>
  );
}
