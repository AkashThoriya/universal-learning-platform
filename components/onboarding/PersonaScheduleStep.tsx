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

import { User, Clock, Calendar, AlertCircle, CheckCircle, Sparkles } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { UseFormReturn } from '@/hooks/useForm';
import { PERSONA_OPTIONS, getDefaultStudyHours } from '@/lib/data/onboarding';
import { Exam, UserPersona, UserPersonaType, OnboardingFormData } from '@/types/exam';

// Interface for Google Analytics gtag function
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters?: Record<string, unknown>) => void;
  }
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
 * Persona selection & schedule configuration step - Step 2 of onboarding
 */
export function PersonaScheduleStep({ form, selectedExam }: PersonaScheduleStepProps) {
  const [weekdayHours, setWeekdayHours] = useState(
    Math.floor((form.data.preferences?.dailyStudyGoalMinutes ?? 240) / 60)
  );
  const [weekendHours, setWeekendHours] = useState(
    Math.floor((form.data.preferences?.dailyStudyGoalMinutes ?? 240) / 60)
  );
  const [useWeekendSchedule, setUseWeekendSchedule] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});



  // Helper function to calculate average daily hours from weekend schedule




  // Update form with specialized schedule
  const updateFormWithSchedule = useCallback(() => {
    const avgMinutes = ((weekdayHours * 5 + weekendHours * 2) / 7) * 60;
    
    // Only update if weekend schedule is explicitly enabled
    if (useWeekendSchedule) {
      form.updateField('preferences', {
        ...(form.data.preferences ?? {}),
        dailyStudyGoalMinutes: Math.round(avgMinutes),
        useWeekendSchedule: true,
        weekdayStudyMinutes: weekdayHours * 60,
        weekendStudyMinutes: weekendHours * 60,
      });
    }
  }, [form, weekdayHours, weekendHours, useWeekendSchedule]);

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
        label: selectedPersona.title,
      } as UserPersona);

      // Set default study hours based on persona
      const defaultHours = getDefaultStudyHours(personaType);
      const defaultMinutes = defaultHours * 60;

      // Update local state for weekend schedule
      setWeekdayHours(defaultHours);
      setWeekendHours(Math.min(defaultHours + 2, 8)); // Add 2h for weekends, max 8h
      setUseWeekendSchedule(false); // Reset to uniform schedule

      form.updateField('preferences', {
        ...(form.data.preferences ?? {}),
        dailyStudyGoalMinutes: defaultMinutes,
        preferredStudyTime: 'morning', // Reset to default
        tierDefinitions: {
          1: 'High Priority - Core Concepts',
          2: 'Medium Priority - Standard Topics',
          3: 'Low Priority - Supplementary Material',
        },
        revisionIntervals: [1, 3, 7, 14, 30],
        notifications: {
          revisionReminders: true,
          dailyGoalReminders: true,
          healthCheckReminders: true,
        },
      });

      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'persona_selected', {
          persona: personaType,
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
      if (!error && value && typeof window !== 'undefined' && window.gtag) {
        const examDate = new Date(value);
        const today = new Date();
        const diffTime = Math.abs(examDate.getTime() - today.getTime());
        const daysToExam = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

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
        <CardContent className="p-4">
          <div className="flex items-center space-x-2 mb-3">
            <User className="h-4 w-4 text-blue-600" aria-hidden="true" />
            <Label className="text-base font-semibold">Which describes you best?</Label>
          </div>
          <p className="text-sm text-gray-600 mb-4">This helps us recommend realistic study goals and schedules.</p>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {PERSONA_OPTIONS.map(persona => (
              <Card
                key={persona.id}
                className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                  form.data.userPersona?.type === persona.id ? 'ring-2 ring-blue-500 bg-blue-50' : 'hover:bg-gray-50'
                }`}
                onClick={() => handlePersonaSelect(persona.id)}
              >
                <CardContent className="p-4 text-center">
                  <div
                    className={`w-12 h-12 mx-auto mb-3 rounded-full bg-gradient-to-r ${persona.color} flex items-center justify-center`}
                  >
                    <persona.icon className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-1 text-sm">{persona.title}</h3>
                  <p className="text-xs text-gray-600 mb-2">{persona.description}</p>
                  <div className="text-xs text-gray-500">
                    <div>Default: {persona.defaultHours}h/day</div>
                    {form.data.userPersona?.type === persona.id && (
                      <Badge variant="default" className="mt-1 text-xs py-0 px-1">
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
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Clock className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <Label className="text-base font-semibold">How many hours can you realistically study?</Label>
            </div>

            {/* Schedule Type Selection */}
            <div className="space-y-3 mb-4">
              <div className="flex flex-col sm:flex-row gap-2">
                <Button
                  type="button"
                  variant={!useWeekendSchedule ? 'default' : 'outline'}
                  onClick={() => {
                    setUseWeekendSchedule(false);
                    // Reset to uniform daily schedule
                    const currentHours = Math.floor((form.data.preferences?.dailyStudyGoalMinutes || 240) / 60);
                    setWeekdayHours(currentHours);
                    setWeekendHours(currentHours);
                    // Update form to clear weekend schedule data
                    const {
                      useWeekendSchedule: _,
                      weekdayStudyMinutes: __,
                      weekendStudyMinutes: ___,
                      ...cleanPrefs
                    } = form.data.preferences || {};
                    form.updateField('preferences', {
                      ...cleanPrefs,
                      useWeekendSchedule: false,
                    });
                  }}
                  className="flex-1 text-sm"
                  size="sm"
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
                  className="flex-1 text-sm"
                  size="sm"
                >
                  Different weekday/weekend hours
                </Button>
              </div>
            </div>

            {!useWeekendSchedule ? (
              /* Simple daily schedule */
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                <div className="text-center mb-3">
                  <div className="text-2xl font-bold text-blue-600">
                    {Math.floor((form.data.preferences?.dailyStudyGoalMinutes ?? 240) / 60)}h{' '}
                    {(form.data.preferences?.dailyStudyGoalMinutes ?? 240) % 60}m
                  </div>
                  <div className="text-sm text-blue-600 mt-1">Daily Study Goal</div>
                </div>

                <Slider
                  value={[Math.floor((form.data.preferences?.dailyStudyGoalMinutes || 240) / 60)]}
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

                <p className="text-sm text-blue-600 mt-3">
                  {(() => {
                    const hours = Math.floor((form.data.preferences?.dailyStudyGoalMinutes || 240) / 60);
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
              <div className="space-y-4">
                {/* Weekday Hours */}
                <div className="bg-gradient-to-r from-blue-50 to-indigo-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Monday - Friday</h4>
                  <div className="text-center mb-3">
                    <div className="text-xl font-bold text-blue-600">{weekdayHours}h</div>
                    <div className="text-xs text-blue-600 mt-1">Weekday Study Goal</div>
                  </div>

                  <Slider
                    value={[weekdayHours]}
                    onValueChange={([hours]) => {
                      if (hours !== undefined) {
                        setWeekdayHours(hours);
                        // Update form with new average and weekend schedule data
                        const avgMinutes = ((hours * 5 + weekendHours * 2) / 7) * 60;
                        form.updateField('preferences', {
                          ...(form.data.preferences ?? {}),
                          dailyStudyGoalMinutes: Math.round(avgMinutes),
                          useWeekendSchedule: true,
                          weekdayStudyMinutes: hours * 60,
                          weekendStudyMinutes: weekendHours * 60,
                        });
                      }
                    }}
                    min={0.5}
                    max={8}
                    step={0.5}
                    className="w-full"
                    aria-label="Weekday study hours"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>30m</span>
                    <span>4h</span>
                    <span>8h</span>
                  </div>
                </div>

                {/* Weekend Hours */}
                <div className="bg-gradient-to-r from-green-50 to-emerald-50 rounded-lg p-4">
                  <h4 className="font-semibold text-gray-900 mb-2 text-sm">Saturday - Sunday</h4>
                  <div className="text-center mb-3">
                    <div className="text-xl font-bold text-green-600">{weekendHours}h</div>
                    <div className="text-xs text-green-600 mt-1">Weekend Study Goal</div>
                  </div>

                  <Slider
                    value={[weekendHours]}
                    onValueChange={([hours]) => {
                      if (hours !== undefined) {
                        setWeekendHours(hours);
                        // Update form with new average and weekend schedule data
                        const avgMinutes = ((weekdayHours * 5 + hours * 2) / 7) * 60;
                        form.updateField('preferences', {
                          ...(form.data.preferences ?? {}),
                          dailyStudyGoalMinutes: Math.round(avgMinutes),
                          useWeekendSchedule: true,
                          weekdayStudyMinutes: weekdayHours * 60,
                          weekendStudyMinutes: hours * 60,
                        });
                      }
                    }}
                    min={0}
                    max={12}
                    step={0.5}
                    className="w-full"
                    aria-label="Weekend study hours"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-1">
                    <span>0h</span>
                    <span>6h</span>
                    <span>12h</span>
                  </div>
                </div>

                {/* Weekly Summary */}
                <div className="bg-gradient-to-r from-purple-50 to-pink-50 rounded-lg p-3">
                  <div className="text-center">
                    <div className="text-base font-semibold text-purple-600">
                      Weekly Total: {(weekdayHours * 5 + weekendHours * 2).toFixed(1)}h
                    </div>
                    <div className="text-xs text-purple-600 mt-1">
                      Average: {((weekdayHours * 5 + weekendHours * 2) / 7).toFixed(1)}h per day
                    </div>
                  </div>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Preparation Start Date - BEFORE target date */}
      {form.data.userPersona?.type && form.data.preferences?.dailyStudyGoalMinutes && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-4 w-4 text-green-600" aria-hidden="true" />
              <Label className="text-base font-semibold">When did you start preparing?</Label>
            </div>
            <div className="space-y-3">
              <Input
                type="date"
                value={(form.data as any).preparationStartDate || new Date().toISOString().split('T')[0]}
                onChange={e => form.updateField('preparationStartDate' as any, e.target.value)}
                max={new Date().toISOString().split('T')[0]}
                className="max-w-xs"
              />
              <p className="text-sm text-gray-500">
                Default is today. If you've already been studying, pick an earlier date for accurate velocity tracking.
              </p>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Target Date Prediction */}
      {form.data.userPersona?.type && form.data.preferences?.dailyStudyGoalMinutes && (
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center space-x-2 mb-3">
              <Calendar className="h-4 w-4 text-blue-600" aria-hidden="true" />
              <Label className="text-base font-semibold">Target Completion Date</Label>
            </div>

            {/* Smart Prediction Section */}
            {selectedExam?.totalEstimatedHours && (
              <div className="space-y-4">
                {(() => {
                  const dailyMinutes = form.data.preferences?.dailyStudyGoalMinutes ?? 240;
                  const dailyHours = dailyMinutes / 60;
                  const totalHours = selectedExam.totalEstimatedHours;
                  const daysNeeded = Math.ceil((totalHours / dailyHours) * 1.2); // 20% buffer
                  
                  const predictedDate = new Date();
                  predictedDate.setDate(predictedDate.getDate() + daysNeeded);
                  const predictedDateString = predictedDate.toISOString().split('T')[0];
                  
                  // Calculate what hours/day would be needed for user's chosen date
                  const userChosenDate = form.data.examDate ? new Date(form.data.examDate) : null;
                  const userDaysAvailable = userChosenDate 
                    ? Math.ceil((userChosenDate.getTime() - new Date().getTime()) / (24 * 60 * 60 * 1000))
                    : null;
                  const requiredHoursPerDay = userDaysAvailable && userDaysAvailable > 0
                    ? Math.ceil((totalHours / userDaysAvailable) * 10) / 10
                    : null;
                  const isAggressive = requiredHoursPerDay && requiredHoursPerDay > dailyHours;
                  
                  return (
                    <>
                      {/* AI Suggested Date */}
                      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg p-4 border border-blue-200">
                        <div className="flex items-center gap-2 mb-2">
                          <Sparkles className="h-4 w-4 text-blue-600" />
                          <span className="font-medium text-blue-800">AI Predicted Finish Date</span>
                        </div>
                        <div className="text-2xl font-bold text-blue-700 mb-2">
                          {predictedDate.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                        </div>
                        <div className="text-sm text-blue-600 mb-3">
                          Based on {dailyHours}h/day × {totalHours} hours of content (with 20% buffer)
                        </div>
                        <Button
                          size="sm"
                          onClick={() => {
                            if (predictedDateString) {
                              handleDateChange(predictedDateString);
                            }
                          }}
                          className="bg-blue-600 hover:bg-blue-700 text-white"
                        >
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Accept This Date
                        </Button>
                      </div>

                      {/* Or Manual Selection */}
                      <div className="border-t pt-4">
                        <div className="text-sm font-medium text-gray-700 mb-2">Or set a custom target date:</div>
                        <Input
                          type="date"
                          value={form.data.examDate}
                          onChange={e => handleDateChange(e.target.value)}
                          min={minDateString}
                          max={maxDateString}
                          className={`max-w-xs ${validationErrors.examDate ? 'border-red-300 focus:border-red-500' : ''}`}
                        />
                        {validationErrors.examDate && (
                          <div className="flex items-center gap-1 text-red-600 text-sm mt-1">
                            <AlertCircle className="h-4 w-4" />
                            <span>{validationErrors.examDate}</span>
                          </div>
                        )}
                      </div>

                      {/* If user picks earlier date, show required hours */}
                      {userChosenDate && !validationErrors.examDate && isAggressive && (
                        <div className="bg-gradient-to-r from-amber-50 to-orange-50 border border-amber-200 rounded-lg p-4">
                          <div className="flex items-center gap-2 mb-2">
                            <AlertCircle className="h-4 w-4 text-amber-600" />
                            <span className="font-medium text-amber-800">Ambitious Timeline!</span>
                          </div>
                          <p className="text-sm text-amber-700 mb-3">
                            To finish by <strong>{userChosenDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}</strong>, 
                            you'll need to study <strong className="text-lg">{requiredHoursPerDay}h/day</strong> instead of {dailyHours}h/day.
                          </p>
                          <Button
                            size="sm"
                            variant="outline"
                            className="border-amber-400 text-amber-700 hover:bg-amber-100"
                            onClick={() => {
                              const newMinutes = Math.min(Math.round((requiredHoursPerDay || dailyHours) * 60), 720);
                              form.updateField('preferences', {
                                ...(form.data.preferences ?? {}),
                                dailyStudyGoalMinutes: newMinutes,
                              });
                            }}
                          >
                            Update to {requiredHoursPerDay}h/day
                          </Button>
                        </div>
                      )}

                      {/* Success state for matching or realistic date */}
                      {userChosenDate && !validationErrors.examDate && !isAggressive && form.data.examDate && (
                        <div className="bg-gradient-to-r from-green-50 to-emerald-50 border border-green-200 rounded-lg p-4">
                          <div className="flex items-center gap-2">
                            <CheckCircle className="h-4 w-4 text-green-600" />
                            <span className="font-medium text-green-800">Target is achievable!</span>
                          </div>
                          <p className="text-sm text-green-700 mt-1">
                            With {dailyHours}h/day, you have comfortable buffer to complete by {userChosenDate.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}.
                          </p>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
            )}

            {/* Fallback for custom exams without totalEstimatedHours */}
            {!selectedExam?.totalEstimatedHours && (
              <div className="space-y-3">
                <Input
                  type="date"
                  value={form.data.examDate}
                  onChange={e => handleDateChange(e.target.value)}
                  min={minDateString}
                  max={maxDateString}
                  className={validationErrors.examDate ? 'border-red-300' : ''}
                />
                <p className="text-sm text-gray-500">Select your target completion date</p>
              </div>
            )}
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
