/**
 * @fileoverview Persona Detection Onboarding Component
 *
 * Comprehensive persona detection step for the onboarding flow.
 * Captures user type, work schedule, and career context for adaptive learning.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

'use client';

import { User, Briefcase, Target, TrendingUp, Info, Plus, Minus } from 'lucide-react';
import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from '@/hooks/useForm';
import { PersonaAwareGoalSetting } from '@/lib/config/persona-aware-goals';
import { UserPersonaType, CareerMotivation, UserPersona } from '@/types/exam';

/**
 * Form data structure for persona detection step
 */
interface PersonaFormData {
  userPersona: {
    type: UserPersonaType;
    workSchedule?: {
      workingHours: { start: string; end: string };
      workingDays: ('monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday')[];
      commuteTime: number;
      flexibility: 'rigid' | 'flexible' | 'hybrid';
      lunchBreakDuration: number;
    };
    careerContext?: {
      currentRole: string;
      targetRole: string;
      industry: string;
      urgency: 'immediate' | 'short_term' | 'long_term';
      motivation: CareerMotivation[];
      skillGaps: string[];
    };
  };
  preferences: {
    dailyStudyGoalMinutes: number;
    preferredStudyTime: 'morning' | 'afternoon' | 'evening' | 'night';
  };
}

/**
 * Props for PersonaDetectionStep component
 */
interface PersonaDetectionStepProps {
  form: UseFormReturn<PersonaFormData>;
}

/**
 * Main persona detection step component
 */
export function PersonaDetectionStep({ form }: PersonaDetectionStepProps) {
  const [showAdvancedOptions, setShowAdvancedOptions] = useState(false);

  // Get current persona type from form
  const currentPersona = form.data.userPersona?.type;

  // Helper function to update nested persona fields
  const updatePersonaField = (field: string, value: unknown) => {
    const keys = field.split('.');
    const updatedPersona = { ...form.data.userPersona };

    if (keys.length === 2) {
      // userPersona.type
      if (keys[1] === 'type') {
        updatedPersona.type = value as UserPersonaType;
      }
    } else if (keys.length === 3) {
      // userPersona.workSchedule.field or userPersona.careerContext.field
      const section = keys[1] as 'workSchedule' | 'careerContext';
      const fieldName = keys[2];

      if (section === 'workSchedule') {
        const baseWorkSchedule = {
          workingHours: { start: '09:00', end: '17:00' },
          workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as (
            | 'monday'
            | 'tuesday'
            | 'wednesday'
            | 'thursday'
            | 'friday'
            | 'saturday'
            | 'sunday'
          )[],
          commuteTime: 60,
          flexibility: 'rigid' as const,
          lunchBreakDuration: 60,
          ...updatedPersona.workSchedule,
        };

        if (fieldName === 'workingHours') {
          baseWorkSchedule.workingHours = value as { start: string; end: string };
        } else if (fieldName === 'workingDays') {
          baseWorkSchedule.workingDays = value as (
            | 'monday'
            | 'tuesday'
            | 'wednesday'
            | 'thursday'
            | 'friday'
            | 'saturday'
            | 'sunday'
          )[];
        } else if (fieldName === 'commuteTime') {
          baseWorkSchedule.commuteTime = value as number;
        } else if (fieldName === 'flexibility') {
          baseWorkSchedule.flexibility = value as 'rigid' | 'flexible' | 'hybrid';
        } else if (fieldName === 'lunchBreakDuration') {
          baseWorkSchedule.lunchBreakDuration = value as number;
        }

        updatedPersona.workSchedule = baseWorkSchedule;
      } else if (section === 'careerContext') {
        const baseCareerContext = {
          currentRole: '',
          targetRole: '',
          industry: '',
          urgency: 'short_term' as const,
          motivation: [] as CareerMotivation[],
          skillGaps: [] as string[],
          ...updatedPersona.careerContext,
        };

        if (fieldName === 'currentRole') {
          baseCareerContext.currentRole = value as string;
        } else if (fieldName === 'targetRole') {
          baseCareerContext.targetRole = value as string;
        } else if (fieldName === 'industry') {
          baseCareerContext.industry = value as string;
        } else if (fieldName === 'urgency') {
          baseCareerContext.urgency = value as 'immediate' | 'short_term' | 'long_term';
        } else if (fieldName === 'motivation') {
          baseCareerContext.motivation = value as CareerMotivation[];
        } else if (fieldName === 'skillGaps') {
          baseCareerContext.skillGaps = value as string[];
        }

        updatedPersona.careerContext = baseCareerContext;
      }
    } else if (keys.length === 4) {
      // userPersona.workSchedule.workingHours.start/end - handled by specific components
    }

    form.updateField('userPersona', updatedPersona);
  };

  // Helper function to update preferences
  const updatePreferenceField = (field: string, value: unknown) => {
    const updatedPreferences = { ...form.data.preferences };
    const fieldName = field.split('.')[1];
    if (fieldName === 'dailyStudyGoalMinutes') {
      updatedPreferences.dailyStudyGoalMinutes = value as number;
    } else if (fieldName === 'preferredStudyTime') {
      updatedPreferences.preferredStudyTime = value as 'morning' | 'afternoon' | 'evening' | 'night';
    }
    form.updateField('preferences', updatedPreferences);
  };

  return (
    <Card className="w-full">
      <CardHeader>
        <div className="flex items-center space-x-2">
          <User className="h-6 w-6 text-blue-600" />
          <CardTitle>Let's understand your situation</CardTitle>
        </div>
        <CardDescription>This helps us create the perfect study plan for your lifestyle and goals</CardDescription>
      </CardHeader>

      <CardContent className="space-y-6">
        {/* Persona Selection */}
        <div className="space-y-4">
          <Label className="text-base font-semibold">What best describes you?</Label>
          <RadioGroup
            value={currentPersona}
            onValueChange={(value: UserPersonaType) => {
              updatePersonaField('userPersona.type', value);
              // Reset work schedule and career context when changing persona
              if (value !== 'working_professional') {
                const updatedPersona: { type: UserPersonaType; workSchedule?: unknown; careerContext?: unknown } = {
                  type: value,
                };
                // Don't set optional properties to undefined, just omit them
                form.updateField('userPersona', updatedPersona as UserPersona);
              }
              // Update recommended study goal
              const newPersona = { ...form.data.userPersona, type: value };
              const recommendedGoal = PersonaAwareGoalSetting.calculateRealisticStudyGoal(newPersona);
              updatePreferenceField('preferences.dailyStudyGoalMinutes', recommendedGoal);
            }}
            className="space-y-3"
          >
            {/* Student Option */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="student" id="student" />
              <div className="flex-1">
                <Label htmlFor="student" className="font-medium cursor-pointer">
                  Full-time Student
                </Label>
                <p className="text-sm text-muted-foreground mt-1">
                  I have flexible hours and study is my primary focus
                </p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Recommended: 6-8 hours/day
                  </Badge>
                </div>
              </div>
            </div>

            {/* Working Professional Option */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="working_professional" id="working_professional" />
              <div className="flex-1">
                <Label htmlFor="working_professional" className="font-medium cursor-pointer">
                  Working Professional
                </Label>
                <p className="text-sm text-muted-foreground mt-1">I have a full-time job and study in my spare time</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Recommended: 1-3 hours/day
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Career-focused
                  </Badge>
                </div>
              </div>
            </div>

            {/* Freelancer Option */}
            <div className="flex items-center space-x-3 p-4 border rounded-lg hover:bg-gray-50 transition-colors">
              <RadioGroupItem value="freelancer" id="freelancer" />
              <div className="flex-1">
                <Label htmlFor="freelancer" className="font-medium cursor-pointer">
                  Freelancer/Entrepreneur
                </Label>
                <p className="text-sm text-muted-foreground mt-1">I have flexible but unpredictable schedule</p>
                <div className="flex items-center space-x-2 mt-2">
                  <Badge variant="secondary" className="text-xs">
                    Recommended: 4-6 hours/day
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    Flexible schedule
                  </Badge>
                </div>
              </div>
            </div>
          </RadioGroup>
        </div>

        {/* Work Schedule Input for Working Professionals */}
        {currentPersona === 'working_professional' && <WorkScheduleInput form={form} />}

        {/* Career Context for Working Professionals */}
        {currentPersona === 'working_professional' && <CareerContextInput form={form} />}

        {/* Study Goal Recommendation */}
        {currentPersona && <StudyGoalRecommendation form={form} persona={form.data.userPersona} />}

        {/* Advanced Options Toggle */}
        <div className="border-t pt-4">
          <Button
            type="button"
            variant="ghost"
            onClick={() => setShowAdvancedOptions(!showAdvancedOptions)}
            className="w-full justify-between"
          >
            Advanced Options
            {showAdvancedOptions ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
          </Button>

          {showAdvancedOptions && (
            <div className="mt-4 space-y-4">
              <PreferredStudyTimeInput form={form} />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Work schedule input component for working professionals
 */
function WorkScheduleInput({ form }: PersonaDetectionStepProps) {
  const workDays: Array<{
    id: 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';
    label: string;
  }> = [
    { id: 'monday', label: 'Monday' },
    { id: 'tuesday', label: 'Tuesday' },
    { id: 'wednesday', label: 'Wednesday' },
    { id: 'thursday', label: 'Thursday' },
    { id: 'friday', label: 'Friday' },
    { id: 'saturday', label: 'Saturday' },
    { id: 'sunday', label: 'Sunday' },
  ];

  // Helper function to update work schedule fields
  const updateWorkSchedule = (field: string, value: unknown) => {
    const updatedPersona = { ...form.data.userPersona };
    const keys = field.split('.');

    // Initialize workSchedule if it doesn't exist
    if (!updatedPersona.workSchedule) {
      updatedPersona.workSchedule = {
        workingHours: { start: '09:00', end: '17:00' },
        workingDays: ['monday', 'tuesday', 'wednesday', 'thursday', 'friday'] as (
          | 'monday'
          | 'tuesday'
          | 'wednesday'
          | 'thursday'
          | 'friday'
          | 'saturday'
          | 'sunday'
        )[],
        commuteTime: 60,
        flexibility: 'rigid',
        lunchBreakDuration: 60,
      };
    }

    if (keys.length === 2) {
      // workSchedule.field
      const fieldName = keys[1];
      if (fieldName === 'commuteTime') {
        updatedPersona.workSchedule.commuteTime = value as number;
      } else if (fieldName === 'flexibility') {
        updatedPersona.workSchedule.flexibility = value as 'rigid' | 'flexible' | 'hybrid';
      } else if (fieldName === 'lunchBreakDuration') {
        updatedPersona.workSchedule.lunchBreakDuration = value as number;
      } else if (fieldName === 'workingDays') {
        updatedPersona.workSchedule.workingDays = value as (
          | 'monday'
          | 'tuesday'
          | 'wednesday'
          | 'thursday'
          | 'friday'
          | 'saturday'
          | 'sunday'
        )[];
      }
    } else if (keys.length === 3 && keys[1] === 'workingHours') {
      // workSchedule.workingHours.start/end
      const currentWorkingHours = updatedPersona.workSchedule.workingHours;
      if (currentWorkingHours) {
        updatedPersona.workSchedule = {
          ...updatedPersona.workSchedule,
          workingHours: {
            start: keys[2] === 'start' ? (value as string) : currentWorkingHours.start,
            end: keys[2] === 'end' ? (value as string) : currentWorkingHours.end,
          },
        };
      } else {
        updatedPersona.workSchedule = {
          ...updatedPersona.workSchedule,
          workingHours: {
            start: keys[2] === 'start' ? (value as string) : '09:00',
            end: keys[2] === 'end' ? (value as string) : '17:00',
          },
        };
      }
    }

    form.updateField('userPersona', updatedPersona);
  };

  return (
    <Card className="border-blue-200 bg-blue-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Briefcase className="h-5 w-5 text-blue-600" />
          <CardTitle className="text-lg">Work Schedule</CardTitle>
        </div>
        <CardDescription>Help us understand your work commitments to optimize your study plan</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Working Hours */}
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Work Start Time</Label>
            <Input
              type="time"
              value={form.data.userPersona?.workSchedule?.workingHours?.start || '09:00'}
              onChange={e => updateWorkSchedule('workSchedule.workingHours.start', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Work End Time</Label>
            <Input
              type="time"
              value={form.data.userPersona?.workSchedule?.workingHours?.end || '17:00'}
              onChange={e => updateWorkSchedule('workSchedule.workingHours.end', e.target.value)}
            />
          </div>
        </div>

        {/* Working Days */}
        <div className="space-y-2">
          <Label>Working Days</Label>
          <div className="grid grid-cols-3 gap-2">
            {workDays.map(day => (
              <div key={day.id} className="flex items-center space-x-2">
                <Checkbox
                  id={day.id}
                  checked={form.data.userPersona?.workSchedule?.workingDays?.includes(day.id) || false}
                  onCheckedChange={checked => {
                    const currentDays = form.data.userPersona?.workSchedule?.workingDays || [];
                    if (checked) {
                      updateWorkSchedule('workSchedule.workingDays', [...currentDays, day.id]);
                    } else {
                      updateWorkSchedule(
                        'workSchedule.workingDays',
                        currentDays.filter(d => d !== day.id)
                      );
                    }
                  }}
                />
                <Label htmlFor={day.id} className="text-sm">
                  {day.label}
                </Label>
              </div>
            ))}
          </div>
        </div>

        {/* Commute Time */}
        <div className="space-y-2">
          <Label>Daily Commute Time (both ways)</Label>
          <div className="flex items-center space-x-2">
            <Slider
              value={[form.data.userPersona?.workSchedule?.commuteTime || 60]}
              onValueChange={([value]) => updateWorkSchedule('workSchedule.commuteTime', value)}
              max={180}
              min={0}
              step={15}
              className="flex-1"
            />
            <span className="w-16 text-sm text-muted-foreground">
              {form.data.userPersona?.workSchedule?.commuteTime ?? 60} min
            </span>
          </div>
        </div>

        {/* Flexibility */}
        <div className="space-y-2">
          <Label>Work Schedule Flexibility</Label>
          <Select
            value={form.data.userPersona?.workSchedule?.flexibility || 'rigid'}
            onValueChange={(value: 'rigid' | 'flexible' | 'hybrid') =>
              updateWorkSchedule('workSchedule.flexibility', value)
            }
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="rigid">Rigid (Fixed hours, little flexibility)</SelectItem>
              <SelectItem value="flexible">Flexible (Can adjust hours as needed)</SelectItem>
              <SelectItem value="hybrid">Hybrid (Some flexibility, some fixed hours)</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Lunch Break */}
        <div className="space-y-2">
          <Label>Lunch Break Duration</Label>
          <Select
            value={String(form.data.userPersona?.workSchedule?.lunchBreakDuration || 60)}
            onValueChange={value => updateWorkSchedule('workSchedule.lunchBreakDuration', parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="30">30 minutes</SelectItem>
              <SelectItem value="45">45 minutes</SelectItem>
              <SelectItem value="60">1 hour</SelectItem>
              <SelectItem value="90">1.5 hours</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Career context input component for working professionals
 */
function CareerContextInput({ form }: PersonaDetectionStepProps) {
  const motivationOptions: { id: CareerMotivation; label: string; description: string }[] = [
    { id: 'promotion', label: 'Promotion', description: 'Advance to higher position' },
    { id: 'salary_increase', label: 'Salary Increase', description: 'Improve compensation' },
    { id: 'career_transition', label: 'Career Transition', description: 'Switch to new role/field' },
    { id: 'skill_relevance', label: 'Skill Relevance', description: 'Stay current with industry' },
    { id: 'job_security', label: 'Job Security', description: 'Strengthen position' },
    { id: 'industry_change', label: 'Industry Change', description: 'Move to different sector' },
  ];

  // Helper function to update career context fields
  const updateCareerContext = (field: string, value: unknown) => {
    const updatedPersona = { ...form.data.userPersona };

    // Initialize careerContext if it doesn't exist
    if (!updatedPersona.careerContext) {
      updatedPersona.careerContext = {
        currentRole: '',
        targetRole: '',
        industry: '',
        urgency: 'short_term',
        motivation: [],
        skillGaps: [],
      };
    }

    const keys = field.split('.');
    if (keys.length === 2) {
      // careerContext.field
      const fieldName = keys[1];
      if (fieldName === 'currentRole') {
        updatedPersona.careerContext.currentRole = value as string;
      } else if (fieldName === 'targetRole') {
        updatedPersona.careerContext.targetRole = value as string;
      } else if (fieldName === 'industry') {
        updatedPersona.careerContext.industry = value as string;
      } else if (fieldName === 'urgency') {
        updatedPersona.careerContext.urgency = value as 'immediate' | 'short_term' | 'long_term';
      } else if (fieldName === 'motivation') {
        updatedPersona.careerContext.motivation = value as CareerMotivation[];
      } else if (fieldName === 'skillGaps') {
        updatedPersona.careerContext.skillGaps = value as string[];
      }
    }

    form.updateField('userPersona', updatedPersona);
  };

  return (
    <Card className="border-green-200 bg-green-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <Target className="h-5 w-5 text-green-600" />
          <CardTitle className="text-lg">Career Goals</CardTitle>
        </div>
        <CardDescription>Understanding your career context helps us prioritize relevant learning</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current and Target Roles */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Current Role</Label>
            <Input
              placeholder="e.g., Software Engineer, Manager"
              value={form.data.userPersona?.careerContext?.currentRole || ''}
              onChange={e => updateCareerContext('careerContext.currentRole', e.target.value)}
            />
          </div>
          <div className="space-y-2">
            <Label>Target Role</Label>
            <Input
              placeholder="e.g., Senior Manager, Product Director"
              value={form.data.userPersona?.careerContext?.targetRole || ''}
              onChange={e => updateCareerContext('careerContext.targetRole', e.target.value)}
            />
          </div>
        </div>

        {/* Industry */}
        <div className="space-y-2">
          <Label>Industry</Label>
          <Input
            placeholder="e.g., Technology, Finance, Healthcare"
            value={form.data.userPersona?.careerContext?.industry || ''}
            onChange={e => updateCareerContext('careerContext.industry', e.target.value)}
          />
        </div>

        {/* Urgency */}
        <div className="space-y-2">
          <Label>Timeline for Career Goals</Label>
          <RadioGroup
            value={form.data.userPersona?.careerContext?.urgency || 'short_term'}
            onValueChange={(value: 'immediate' | 'short_term' | 'long_term') =>
              updateCareerContext('careerContext.urgency', value)
            }
            className="grid grid-cols-1 gap-2"
          >
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="immediate" id="immediate" />
              <Label htmlFor="immediate" className="flex-1">
                Immediate (Within 6 months)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="short_term" id="short_term" />
              <Label htmlFor="short_term" className="flex-1">
                Short-term (6-18 months)
              </Label>
            </div>
            <div className="flex items-center space-x-2">
              <RadioGroupItem value="long_term" id="long_term" />
              <Label htmlFor="long_term" className="flex-1">
                Long-term (18+ months)
              </Label>
            </div>
          </RadioGroup>
        </div>

        {/* Career Motivations */}
        <div className="space-y-2">
          <Label>What's driving your learning? (Select all that apply)</Label>
          <div className="grid grid-cols-1 gap-2">
            {motivationOptions.map(motivation => (
              <div key={motivation.id} className="flex items-center space-x-2">
                <Checkbox
                  id={motivation.id}
                  checked={form.data.userPersona?.careerContext?.motivation?.includes(motivation.id) || false}
                  onCheckedChange={checked => {
                    const currentMotivations = form.data.userPersona?.careerContext?.motivation || [];
                    if (checked) {
                      updateCareerContext('careerContext.motivation', [...currentMotivations, motivation.id]);
                    } else {
                      updateCareerContext(
                        'careerContext.motivation',
                        currentMotivations.filter(m => m !== motivation.id)
                      );
                    }
                  }}
                />
                <div className="flex-1">
                  <Label htmlFor={motivation.id} className="font-medium cursor-pointer">
                    {motivation.label}
                  </Label>
                  <p className="text-sm text-muted-foreground">{motivation.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Skill Gaps */}
        <div className="space-y-2">
          <Label>Key Skill Gaps (optional)</Label>
          <Textarea
            placeholder="e.g., Leadership skills, Technical expertise, Communication, Data analysis..."
            value={form.data.userPersona?.careerContext?.skillGaps?.join(', ') || ''}
            onChange={e => {
              const skills = e.target.value
                .split(',')
                .map(s => s.trim())
                .filter(s => s.length > 0);
              updateCareerContext('careerContext.skillGaps', skills);
            }}
            className="min-h-[80px]"
          />
          <p className="text-xs text-muted-foreground">Separate multiple skills with commas</p>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Study goal recommendation component
 */
function StudyGoalRecommendation({ form, persona }: { form: UseFormReturn<PersonaFormData>; persona: unknown }) {
  const recommendations = PersonaAwareGoalSetting.getStudyTimeRecommendations(persona as UserPersona);

  // Helper function to update preferences
  const updatePreference = (field: string, value: unknown) => {
    const updatedPreferences = { ...form.data.preferences };
    const fieldName = field.split('.')[1];
    if (fieldName === 'dailyStudyGoalMinutes') {
      updatedPreferences.dailyStudyGoalMinutes = value as number;
    } else if (fieldName === 'preferredStudyTime') {
      updatedPreferences.preferredStudyTime = value as 'morning' | 'afternoon' | 'evening' | 'night';
    }
    form.updateField('preferences', updatedPreferences);
  };

  return (
    <Card className="border-orange-200 bg-orange-50/50">
      <CardHeader className="pb-4">
        <div className="flex items-center space-x-2">
          <TrendingUp className="h-5 w-5 text-orange-600" />
          <CardTitle className="text-lg">Personalized Study Goal</CardTitle>
        </div>
        <CardDescription>Based on your lifestyle, here's what we recommend</CardDescription>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Current Goal - Text Display */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <Label>Your Daily Study Goal</Label>
            <span className="text-xl font-bold text-orange-600">
              {Math.floor(form.data.preferences?.dailyStudyGoalMinutes / 60)}h{' '}
              {form.data.preferences?.dailyStudyGoalMinutes % 60}m
            </span>
          </div>
          
          <div className="bg-white rounded-lg p-3 border space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Recommended:</span>
              <span className="font-medium text-green-600">
                {Math.floor(recommendations.recommendedGoal / 60)}h {recommendations.recommendedGoal % 60}m/day
              </span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-500">Range:</span>
              <span className="text-muted-foreground">
                {Math.floor(recommendations.minGoal / 60)}h–{Math.floor(recommendations.maxGoal / 60)}h
              </span>
            </div>
          </div>
          
          <p className="text-xs text-muted-foreground">
            💡 This is set based on your profile. You'll fine-tune it in the next step.
          </p>
        </div>

        {/* Tips */}
        <Alert>
          <Info className="h-4 w-4" />
          <AlertDescription>
            <div className="space-y-1">
              <p className="font-medium">Tips for your lifestyle:</p>
              <ul className="list-disc pl-4 space-y-1">
                {recommendations.tips.map((tip, index) => (
                  <li key={index} className="text-sm">
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </AlertDescription>
        </Alert>

        {/* Time Slots */}
        <div className="space-y-2">
          <Label className="text-sm font-medium">Recommended Study Times:</Label>
          <div className="flex flex-wrap gap-2">
            {recommendations.timeSlots.map((slot, index) => (
              <Badge key={index} variant="secondary" className="text-xs">
                {slot}
              </Badge>
            ))}
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Preferred study time input component
 */
function PreferredStudyTimeInput({ form }: PersonaDetectionStepProps) {
  // Helper function to update preferences
  const updatePreference = (field: string, value: unknown) => {
    const updatedPreferences = { ...form.data.preferences };
    const fieldName = field.split('.')[1];
    if (fieldName === 'dailyStudyGoalMinutes') {
      updatedPreferences.dailyStudyGoalMinutes = value as number;
    } else if (fieldName === 'preferredStudyTime') {
      updatedPreferences.preferredStudyTime = value as 'morning' | 'afternoon' | 'evening' | 'night';
    }
    form.updateField('preferences', updatedPreferences);
  };

  return (
    <div className="space-y-2">
      <Label>Preferred Study Time</Label>
      <Select
        value={form.data.preferences?.preferredStudyTime || 'morning'}
        onValueChange={(value: 'morning' | 'afternoon' | 'evening' | 'night') =>
          updatePreference('preferences.preferredStudyTime', value)
        }
      >
        <SelectTrigger>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="morning">Morning (6 AM - 12 PM)</SelectItem>
          <SelectItem value="afternoon">Afternoon (12 PM - 6 PM)</SelectItem>
          <SelectItem value="evening">Evening (6 PM - 10 PM)</SelectItem>
          <SelectItem value="night">Night (10 PM - 12 AM)</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}
