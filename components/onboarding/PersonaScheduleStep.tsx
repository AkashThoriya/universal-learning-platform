/**
 * @fileoverview Persona & Schedule Setup Step
 *
 * Second step combining:
 * - Persona detection (student/professional/freelancer)
 * - Daily study hours capacity
 * - Smart date calculation with AI recommendations
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

'use client';

import { User, Clock, Calendar, AlertCircle, CheckCircle } from 'lucide-react';
import React, { useState, useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { UseFormReturn } from '@/hooks/useForm';
import { PERSONA_OPTIONS, getDefaultStudyHours } from '@/lib/data/onboarding';
import { Exam, UserPersona, UserPersonaType, SyllabusSubject } from '@/types/exam';

// Interface for Google Analytics gtag function
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters?: Record<string, unknown>) => void;
  }
}

/**
 * Form data interface for onboarding
 */
interface OnboardingFormData {
  userPersona?: UserPersona;
  displayName: string;
  selectedExamId: string;
  examDate: string;
  isCustomExam: boolean;
  customExam: {
    name?: string;
    description?: string;
    category?: string;
  };
  syllabus: SyllabusSubject[];
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
  [key: string]: string | number | boolean | object | undefined;
}

/**
 * Props for persona schedule step
 */
interface PersonaScheduleStepProps {
  form: UseFormReturn<OnboardingFormData>;
  selectedExam: Exam | null;
}

/**
 * Date validation helper
 */
const validateExamDate = (date: string): string | null => {
  if (!date) {
    return 'Please select your target completion date';
  }

  const examDate = new Date(date);
  const today = new Date();
  const minDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now

  if (examDate < minDate) {
    return 'Target date must be at least 7 days from today';
  }

  const maxDate = new Date(today.getTime() + 2 * 365 * 24 * 60 * 60 * 1000); // 2 years from now
  if (examDate > maxDate) {
    return 'Please select a more realistic target date (within 2 years)';
  }

  return null;
};

/**
 * Calculate recommended completion date based on total hours and daily study time
 */
const calculateRecommendedDate = (totalHours: number, dailyStudyMinutes: number): Date => {
  const dailyStudyHours = dailyStudyMinutes / 60;
  const daysNeeded = Math.ceil(totalHours / dailyStudyHours);

  // Add buffer time (20% extra) for realistic planning
  const daysWithBuffer = Math.ceil(daysNeeded * 1.2);

  const today = new Date();
  const recommendedDate = new Date(today.getTime() + daysWithBuffer * 24 * 60 * 60 * 1000);

  return recommendedDate;
};

/**
 * Calculate recommended completion date with weekend schedule support
 */
const calculateRecommendedDateWithWeekends = (
  totalHours: number,
  weekdayMinutes: number,
  weekendMinutes: number
): Date => {
  const weekdayHours = weekdayMinutes / 60;
  const weekendHours = weekendMinutes / 60;

  // Calculate hours per week (5 weekdays + 2 weekend days)
  const hoursPerWeek = weekdayHours * 5 + weekendHours * 2;

  // Calculate weeks needed
  const weeksNeeded = Math.ceil(totalHours / hoursPerWeek);

  // Add buffer time (20% extra)
  const weeksWithBuffer = Math.ceil(weeksNeeded * 1.2);

  const today = new Date();
  const recommendedDate = new Date(today.getTime() + weeksWithBuffer * 7 * 24 * 60 * 60 * 1000);

  return recommendedDate;
};

/**
 * Check if target date is realistic based on study schedule
 */
const checkTargetDateRealism = (
  targetDate: string,
  totalHours: number,
  useWeekendSchedule: boolean,
  weekdayMinutes?: number,
  weekendMinutes?: number,
  dailyMinutes?: number
): { isRealistic: boolean; daysShort?: number; recommendation: string } => {
  const target = new Date(targetDate);
  const today = new Date();
  const daysAvailable = Math.ceil((target.getTime() - today.getTime()) / (24 * 60 * 60 * 1000));

  let hoursNeeded;
  if (useWeekendSchedule && weekdayMinutes && weekendMinutes) {
    const weeksAvailable = Math.floor(daysAvailable / 7);
    const extraDays = daysAvailable % 7;

    // Calculate available study hours
    const weekdayHours = weekdayMinutes / 60;
    const weekendHours = weekendMinutes / 60;
    const totalAvailableHours = weeksAvailable * (weekdayHours * 5 + weekendHours * 2) + extraDays * weekdayHours;

    hoursNeeded = totalHours / totalAvailableHours;
  } else if (dailyMinutes) {
    const dailyHours = dailyMinutes / 60;
    const totalAvailableHours = daysAvailable * dailyHours;
    hoursNeeded = totalHours / totalAvailableHours;
  } else {
    return { isRealistic: false, recommendation: 'Please set your study schedule first.' };
  }

  if (hoursNeeded <= 0.8) {
    // 80% or less of available time needed
    return {
      isRealistic: true,
      recommendation: 'Perfect! Your target date is very achievable with some buffer time for breaks and revision.',
    };
  } else if (hoursNeeded <= 1.0) {
    // Exactly the available time needed
    return {
      isRealistic: true,
      recommendation:
        'Your target is achievable, but it will require consistent daily effort. Consider adding a few weeks buffer.',
    };
  }
  // More time needed than available
  const shortfallDays = Math.ceil((hoursNeeded - 1) * daysAvailable);
  return {
    isRealistic: false,
    daysShort: shortfallDays,
    recommendation: `Your target date is quite ambitious. Consider extending by ${shortfallDays} days or increasing your daily study hours.`,
  };
};

/**
 * Persona & Schedule setup step component - Step 2 of onboarding
 */
export function PersonaScheduleStep({ form, selectedExam }: PersonaScheduleStepProps) {
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [useWeekendSchedule, setUseWeekendSchedule] = useState(false);
  const [weekdayHours, setWeekdayHours] = useState(4);
  const [weekendHours, setWeekendHours] = useState(6);

  // Helper function to calculate average daily hours from weekend schedule
  const calculateAverageDailyHours = useCallback(() => {
    if (!useWeekendSchedule) {
      return Math.floor((form.data.preferences?.dailyStudyGoalMinutes ?? 240) / 60);
    }
    return (weekdayHours * 5 + weekendHours * 2) / 7;
  }, [useWeekendSchedule, weekdayHours, weekendHours, form.data.preferences?.dailyStudyGoalMinutes]);

  // Helper function to update form data when weekend schedule changes
  const updateFormWithSchedule = useCallback(() => {
    if (useWeekendSchedule) {
      const avgDailyMinutes = calculateAverageDailyHours() * 60;
      form.updateField('preferences', {
        ...(form.data.preferences ?? {}),
        dailyStudyGoalMinutes: Math.round(avgDailyMinutes),
      });
    }
  }, [useWeekendSchedule, calculateAverageDailyHours, form]);

  // Enhanced persona selection
  const handlePersonaSelect = useCallback(
    (personaType: UserPersonaType) => {
      const selectedPersona = PERSONA_OPTIONS.find(p => p.id === personaType);
      if (!selectedPersona) {
        return;
      }

      // Update persona
      form.updateField('userPersona', {
        type: personaType,
      } as UserPersona);

      // Set default study hours based on persona
      const defaultHours = getDefaultStudyHours(personaType);
      const defaultMinutes = defaultHours * 60;

      // Update local state for weekend schedule
      setWeekdayHours(defaultHours);
      setWeekendHours(Math.min(defaultHours + 2, 8)); // Add 2h for weekends, max 8h

      form.updateField('preferences', {
        ...(form.data.preferences ?? {}),
        dailyStudyGoalMinutes: defaultMinutes,
      });

      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'persona_selected', {
          persona_type: personaType,
          default_hours: defaultHours,
        });
      }
    },
    [form]
  );

  // Enhanced exam date validation
  const handleDateChange = useCallback(
    (value: string) => {
      form.updateField('examDate', value);

      const error = validateExamDate(value);
      setValidationErrors(prev => ({
        ...prev,
        examDate: error ?? '',
      }));

      // Analytics
      if (typeof window !== 'undefined' && window.gtag && value) {
        const examDate = new Date(value);
        const today = new Date();
        const daysToExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));

        window.gtag('event', 'target_date_selected', {
          days_to_completion: daysToExam,
          exam_id: form.data.selectedExamId,
        });
      }
    },
    [form]
  );

  // Calculate min/max dates
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 7);
  const minDateString = minDate.toISOString().split('T')[0];

  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <div className="space-y-6" role="main" aria-labelledby="persona-schedule-title">
      {/* Enhanced Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-2 text-blue-600 mb-3">
          <User className="h-6 w-6" aria-hidden="true" />
          <span className="text-sm font-medium">Step 2 of 4</span>
        </div>
        <h2 id="persona-schedule-title" className="text-2xl font-bold text-gray-900">
          Let's understand your learning style
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Tell us about your situation so we can create a personalized study schedule that fits your lifestyle.
        </p>
      </div>

      {/* Persona Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <Label className="text-lg font-semibold">Which describes you best?</Label>
          </div>
          <p className="text-sm text-gray-600 mb-6">This helps us recommend realistic study goals and schedules.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {PERSONA_OPTIONS.map(persona => (
              <Card
                key={persona.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  form.data.userPersona?.type === persona.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handlePersonaSelect(persona.id)}
              >
                <CardContent className="p-6 text-center">
                  <div
                    className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-r ${persona.color} flex items-center justify-center`}
                  >
                    <persona.icon className="h-8 w-8 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{persona.title}</h3>
                  <p className="text-sm text-gray-600 mb-3">{persona.description}</p>
                  <div className="text-xs text-gray-500 space-y-1">
                    <div>Default: {persona.defaultHours}h/day</div>
                    {form.data.userPersona?.type === persona.id && (
                      <Badge variant="default" className="mt-2">
                        <CheckCircle className="h-3 w-3 mr-1" />
                        Selected
                      </Badge>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Study Hours Configuration */}
      {form.data.userPersona?.type && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Clock className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <Label className="text-lg font-semibold">How many hours can you realistically study?</Label>
            </div>

            {/* Schedule Type Selection */}
            <div className="space-y-4 mb-6">
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  type="button"
                  variant={!useWeekendSchedule ? 'default' : 'outline'}
                  onClick={() => {
                    setUseWeekendSchedule(false);
                    // Reset to uniform daily schedule
                    const currentHours = Math.floor((form.data.preferences?.dailyStudyGoalMinutes ?? 240) / 60);
                    setWeekdayHours(currentHours);
                    setWeekendHours(currentHours);
                  }}
                  className="flex-1"
                >
                  Same hours daily
                </Button>
                <Button
                  type="button"
                  variant={useWeekendSchedule ? 'default' : 'outline'}
                  onClick={() => {
                    setUseWeekendSchedule(true);
                    updateFormWithSchedule();
                  }}
                  className="flex-1"
                >
                  Different weekday/weekend hours
                </Button>
              </div>
            </div>

            {!useWeekendSchedule ? (
              /* Simple daily schedule */
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                <div className="text-center mb-4">
                  <div className="text-3xl font-bold text-blue-600">
                    {Math.floor((form.data.preferences?.dailyStudyGoalMinutes ?? 240) / 60)}h{' '}
                    {(form.data.preferences?.dailyStudyGoalMinutes ?? 240) % 60}m
                  </div>
                  <div className="text-sm text-blue-600 mt-1">Daily Study Goal</div>
                </div>

                <Slider
                  value={[Math.floor((form.data.preferences?.dailyStudyGoalMinutes ?? 240) / 60)]}
                  onValueChange={([hours]) => {
                    if (hours !== undefined) {
                      const totalMinutes = hours * 60;
                      form.updateField('preferences', {
                        ...(form.data.preferences ?? {}),
                        dailyStudyGoalMinutes: totalMinutes,
                      });
                      setWeekdayHours(hours);
                      setWeekendHours(hours);
                    }
                  }}
                  min={1}
                  max={12}
                  step={0.5}
                  className="w-full"
                  aria-label="Daily study hours"
                />
                <div className="flex justify-between text-xs text-gray-500 mt-2">
                  <span>1h</span>
                  <span>6h</span>
                  <span>12h</span>
                </div>

                <p className="text-sm text-blue-600 mt-4">
                  {(() => {
                    const hours = Math.floor((form.data.preferences?.dailyStudyGoalMinutes ?? 240) / 60);
                    if (hours <= 2) {
                      return 'Light study routine - perfect for busy schedules';
                    }
                    if (hours <= 4) {
                      return 'Balanced approach - ideal for working professionals';
                    }
                    if (hours <= 6) {
                      return 'Intensive preparation - great for dedicated students';
                    }
                    return 'Maximum effort - for accelerated learning';
                  })()}
                </p>
              </div>
            ) : (
              /* Weekend schedule */
              <div className="space-y-6">
                {/* Weekday Hours */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Monday - Friday</h4>
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-blue-600">{weekdayHours}h</div>
                    <div className="text-sm text-blue-600 mt-1">Weekday Study Goal</div>
                  </div>

                  <Slider
                    value={[weekdayHours]}
                    onValueChange={([hours]) => {
                      if (hours !== undefined) {
                        setWeekdayHours(hours);
                        // Update form with new average
                        const avgMinutes = ((hours * 5 + weekendHours * 2) / 7) * 60;
                        form.updateField('preferences', {
                          ...(form.data.preferences ?? {}),
                          dailyStudyGoalMinutes: Math.round(avgMinutes),
                        });
                      }
                    }}
                    min={0.5}
                    max={8}
                    step={0.5}
                    className="w-full"
                    aria-label="Weekday study hours"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>30m</span>
                    <span>4h</span>
                    <span>8h</span>
                  </div>
                </div>

                {/* Weekend Hours */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-6">
                  <h4 className="font-semibold text-gray-900 mb-3">Saturday - Sunday</h4>
                  <div className="text-center mb-4">
                    <div className="text-2xl font-bold text-green-600">{weekendHours}h</div>
                    <div className="text-sm text-green-600 mt-1">Weekend Study Goal</div>
                  </div>

                  <Slider
                    value={[weekendHours]}
                    onValueChange={([hours]) => {
                      if (hours !== undefined) {
                        setWeekendHours(hours);
                        // Update form with new average
                        const avgMinutes = ((weekdayHours * 5 + hours * 2) / 7) * 60;
                        form.updateField('preferences', {
                          ...(form.data.preferences ?? {}),
                          dailyStudyGoalMinutes: Math.round(avgMinutes),
                        });
                      }
                    }}
                    min={0}
                    max={12}
                    step={0.5}
                    className="w-full"
                    aria-label="Weekend study hours"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>0h</span>
                    <span>6h</span>
                    <span>12h</span>
                  </div>
                </div>

                {/* Weekly Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-4">
                  <div className="text-center">
                    <div className="text-lg font-semibold text-purple-600">
                      Weekly Total: {(weekdayHours * 5 + weekendHours * 2).toFixed(1)}h
                    </div>
                    <div className="text-sm text-purple-600 mt-1">
                      Average: {((weekdayHours * 5 + weekendHours * 2) / 7).toFixed(1)}h per day
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Target Date Selection */}
      {form.data.userPersona?.type && form.data.preferences?.dailyStudyGoalMinutes && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <Label className="text-lg font-semibold">When is your target completion date?</Label>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  type="date"
                  value={form.data.examDate}
                  onChange={e => handleDateChange(e.target.value)}
                  min={minDateString}
                  max={maxDateString}
                  className={`${validationErrors.examDate ? 'border-red-300 focus:border-red-500' : ''}`}
                  aria-describedby="date-error date-help"
                />
                <div id="date-help" className="text-sm text-gray-500">
                  Select your ideal completion date (at least 7 days from today)
                </div>
                {validationErrors.examDate && (
                  <div id="date-error" className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{validationErrors.examDate}</span>
                  </div>
                )}
              </div>

              {/* AI Analysis of Target Date */}
              {selectedExam?.totalEstimatedHours && form.data.examDate && !validationErrors.examDate && (
                <div className="space-y-4">
                  {(() => {
                    const targetAnalysis = useWeekendSchedule
                      ? checkTargetDateRealism(
                          form.data.examDate,
                          selectedExam.totalEstimatedHours,
                          true,
                          weekdayHours * 60,
                          weekendHours * 60
                        )
                      : checkTargetDateRealism(
                          form.data.examDate,
                          selectedExam.totalEstimatedHours,
                          false,
                          undefined,
                          undefined,
                          form.data.preferences?.dailyStudyGoalMinutes
                        );

                    const recommendedDate = useWeekendSchedule
                      ? calculateRecommendedDateWithWeekends(
                          selectedExam.totalEstimatedHours,
                          weekdayHours * 60,
                          weekendHours * 60
                        )
                      : calculateRecommendedDate(
                          selectedExam.totalEstimatedHours,
                          form.data.preferences?.dailyStudyGoalMinutes ?? 240
                        );

                    return (
                      <div
                        className={`border rounded-lg p-4 ${
                          targetAnalysis.isRealistic
                            ? 'bg-gradient-to-r from-green-50 to-emerald-50 border-green-200'
                            : 'bg-gradient-to-r from-orange-50 to-red-50 border-orange-200'
                        }`}
                      >
                        <div className="flex items-center space-x-2 mb-3">
                          {targetAnalysis.isRealistic ? (
                            <CheckCircle className="h-5 w-5 text-green-600" />
                          ) : (
                            <AlertCircle className="h-5 w-5 text-orange-600" />
                          )}
                          <span
                            className={`font-medium ${
                              targetAnalysis.isRealistic ? 'text-green-800' : 'text-orange-800'
                            }`}
                          >
                            {targetAnalysis.isRealistic ? 'Target Achievable!' : 'Target Analysis'}
                          </span>
                        </div>

                        <p
                          className={`text-sm mb-3 ${
                            targetAnalysis.isRealistic ? 'text-green-700' : 'text-orange-700'
                          }`}
                        >
                          {targetAnalysis.recommendation}
                        </p>

                        <div className="bg-white rounded-lg p-3 border border-gray-200 space-y-2">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Content to cover:</span>
                            <span className="font-medium">{selectedExam.totalEstimatedHours} hours</span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">Your schedule:</span>
                            <span className="font-medium">
                              {useWeekendSchedule
                                ? `${weekdayHours}h weekdays, ${weekendHours}h weekends`
                                : `${Math.floor((form.data.preferences?.dailyStudyGoalMinutes ?? 240) / 60)}h daily`}
                            </span>
                          </div>
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-gray-600">AI suggests:</span>
                            <span className="font-medium">
                              {recommendedDate.toLocaleDateString('en-US', {
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric',
                              })}
                            </span>
                          </div>
                        </div>

                        {!targetAnalysis.isRealistic && (
                          <div className="mt-3 flex gap-2">
                            <Button
                              size="sm"
                              variant="outline"
                              className="text-orange-700 border-orange-300 hover:bg-orange-50"
                              onClick={() => {
                                const dateString = recommendedDate.toISOString().split('T')[0];
                                if (dateString) {
                                  handleDateChange(dateString);
                                }
                              }}
                            >
                              Use AI Suggestion
                            </Button>
                          </div>
                        )}
                      </div>
                    );
                  })()}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Progress Summary */}
      {form.data.userPersona?.type &&
        form.data.preferences?.dailyStudyGoalMinutes &&
        form.data.examDate &&
        !validationErrors.examDate && (
          <Card className="border-green-200 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50">
            <CardContent className="p-6">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <CheckCircle className="h-4 w-4 text-green-600" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-900 mb-1">Perfect! Your personalized schedule is ready</h3>
                  <div className="text-sm text-gray-600 space-y-1">
                    <div>
                      <strong>Profile:</strong> {PERSONA_OPTIONS.find(p => p.id === form.data.userPersona?.type)?.title}
                    </div>
                    <div>
                      <strong>Schedule:</strong>{' '}
                      {useWeekendSchedule
                        ? `${weekdayHours}h weekdays, ${weekendHours}h weekends`
                        : `${Math.floor((form.data.preferences?.dailyStudyGoalMinutes ?? 0) / 60)}h daily`}
                    </div>
                    <div>
                      <strong>Target Date:</strong>{' '}
                      {new Date(form.data.examDate).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric',
                      })}
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        )}

      {/* Validation Summary */}
      {(!form.data.userPersona?.type || !form.data.preferences?.dailyStudyGoalMinutes || validationErrors.examDate) && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-1">
              {!form.data.userPersona?.type && <div>• Please select your profile type</div>}
              {!form.data.preferences?.dailyStudyGoalMinutes && <div>• Please set your study hours</div>}
              {!form.data.examDate && <div>• Please select your target completion date</div>}
              {validationErrors.examDate && <div>• {validationErrors.examDate}</div>}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
