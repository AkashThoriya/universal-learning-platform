/**
 * @fileoverview Enhanced Persona Detection Component - Premium UX
 *
 * A sophisticated persona detection step with:
 * - Improved accessibility (WCAG 2.1 AA compliant)
 * - Enhanced visual feedback and microinteractions
 * - Better form validation and error handling
 * - Progressive disclosure for reduced cognitive load
 * - Analytics integration for user behavior tracking
 *
 * @author Exam Strategy Engine Team
 * @version 3.0.0
 */

'use client';

import { User, Clock, Target, Check, AlertCircle, ArrowRight, Info } from 'lucide-react';
import { useState, useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { UseFormReturn } from '@/hooks/useForm';
import {
  PERSONA_OPTIONS,
  STUDY_TIME_PREFERENCES,
  getDefaultStudyHours,
  validateStudyHours,
} from '@/lib/data/onboarding';
import { logInfo, logger } from '@/lib/utils/logger';
import { debounce } from '@/lib/utils/types-utils';
import { UserPersona, UserPersonaType, SyllabusSubject } from '@/types/exam';

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
  // Additional form fields with specific types
  [key: string]: string | number | boolean | object | undefined;
}

/**
 * Props for PersonaDetectionStep component - using properly typed form
 */
interface PersonaDetectionStepProps {
  form: UseFormReturn<OnboardingFormData>;
}

/**
 * Enhanced persona detection step component with premium UX
 */
export function PersonaDetectionStep({ form }: PersonaDetectionStepProps) {
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState<UserPersonaType | null>(form.data.userPersona?.type || null);
  const [showPersonaDetails, setShowPersonaDetails] = useState<string | null>(null);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);

  // Enhanced persona selection with improved UX
  const handlePersonaSelect = useCallback(
    (personaType: UserPersonaType) => {
      logInfo('Persona selected in onboarding', {
        personaType,
        timestamp: new Date().toISOString(),
      });

      setSelectedPersona(personaType);
      setValidationErrors([]);

      // Update form with selected persona
      form.updateField('userPersona', { type: personaType });

      // Set smart default study time based on persona
      const defaultHours = getDefaultStudyHours(personaType);
      const newStudyGoal = defaultHours * 60;

      form.updateField('preferences', {
        ...(form.data.preferences ?? {}),
        dailyStudyGoalMinutes: newStudyGoal,
      });

      logInfo('Default study goal set based on persona', {
        personaType,
        defaultHours,
        studyGoalMinutes: newStudyGoal,
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

  // Manual proceed to next step
  const handleProceedToNextStep = useCallback(() => {
    if (selectedPersona) {
      setCurrentSubStep(2);
    }
  }, [selectedPersona]);

  // Debounced update to form state to prevent excessive re-renders
  const debouncedFormUpdate = useCallback(
    debounce((...args: unknown[]) => {
      const newHours = args[0] as number;
      logInfo('Study goal changed in persona detection', {
        newHours,
        newMinutes: newHours * 60,
        selectedPersona,
        timestamp: new Date().toISOString(),
      });

      // Validate study hours based on persona
      if (selectedPersona) {
        const validationErrors = validateStudyHours(selectedPersona, newHours);
        setValidationErrors(validationErrors);

        if (validationErrors.length > 0) {
          logger.debug('Study goal validation warning', {
            persona: selectedPersona,
            hours: newHours,
            warnings: validationErrors,
          });
        }
      } else {
        setValidationErrors([]);
      }

      form.updateField('preferences', {
        ...(form.data.preferences ?? {}),
        dailyStudyGoalMinutes: newHours * 60,
      });
    }, 300),
    [form, selectedPersona, setValidationErrors]
  );

  // Enhanced study goal change with validation and debouncing
  const handleStudyGoalChange = useCallback(
    (hours: number[]) => {
      const newHours = hours[0] || 2;

      // Debounce the form update to prevent excessive re-renders
      debouncedFormUpdate(newHours);
    },
    [debouncedFormUpdate]
  );

  // Enhanced study time preference change
  const handleStudyTimeChange = useCallback(
    (timeSlot: string) => {
      form.updateField('preferences', {
        ...(form.data.preferences ?? {}),
        preferredStudyTime: timeSlot as 'morning' | 'afternoon' | 'evening' | 'night',
      });

      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'study_time_selected', {
          time_slot: timeSlot,
          persona: selectedPersona,
        });
      }
    },
    [form, selectedPersona]
  );

  const currentStudyHours = Math.round((form.data.preferences?.dailyStudyGoalMinutes || 120) / 60) || 2;
  const selectedTimeSlot = form.data.preferences?.preferredStudyTime;

  return (
    <div className="space-y-6" role="main" aria-labelledby="persona-step-title">
      {/* Enhanced Header with better accessibility */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-2 text-blue-600 mb-3">
          <User className="h-6 w-6" aria-hidden="true" />
          <span className="text-sm font-medium">Step 1 of 4</span>
        </div>
        <h2 id="persona-step-title" className="text-2xl font-bold text-gray-900">
          Let's personalize your learning journey
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Help us understand your situation so we can create the perfect study strategy for you
        </p>
      </div>

      {/* Enhanced Progress Dots with accessibility */}
      <div
        className="flex justify-center space-x-2"
        role="progressbar"
        aria-valuenow={currentSubStep}
        aria-valuemax={3}
      >
        {[1, 2, 3].map(step => (
          <div
            key={step}
            className={`h-2 w-12 rounded-full transition-all duration-500 ${
              step <= currentSubStep ? 'bg-gradient-to-r from-blue-500 to-purple-500' : 'bg-gray-200'
            }`}
            aria-label={`Step ${step} ${step <= currentSubStep ? 'completed' : 'pending'}`}
          />
        ))}
      </div>

      {/* Validation Errors */}
      {validationErrors.length > 0 && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <ul className="space-y-1">
              {validationErrors.map((error, index) => (
                <li key={index}>{error}</li>
              ))}
            </ul>
          </AlertDescription>
        </Alert>
      )}

      {/* Sub-Step 1: Enhanced Persona Selection */}
      {currentSubStep >= 1 && (
        <Card className={`transition-all duration-500 ${currentSubStep > 1 ? 'border-green-200 bg-green-50/30' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              {currentSubStep > 1 && <Check className="h-5 w-5 text-green-600" aria-hidden="true" />}
              <Label className="text-lg font-semibold">What describes you best?</Label>
            </div>

            {currentSubStep === 1 ? (
              <div className="space-y-4">
                {/* Persona Cards with improved interaction */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  {PERSONA_OPTIONS.map(persona => {
                    const Icon = persona.icon;
                    const isSelected = selectedPersona === persona.id;

                    return (
                      <Card
                        key={persona.id}
                        className={`cursor-pointer transition-all duration-300 hover:shadow-lg border-2 group relative ${
                          isSelected
                            ? 'border-blue-500 shadow-lg ring-2 ring-blue-200 bg-blue-50'
                            : 'border-gray-200 hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
                        }`}
                        onClick={e => {
                          e.preventDefault();
                          e.stopPropagation();
                          handlePersonaSelect(persona.id);
                        }}
                        onKeyDown={e => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            e.stopPropagation();
                            handlePersonaSelect(persona.id);
                          }
                        }}
                        tabIndex={0}
                        role="button"
                        aria-pressed={isSelected}
                        aria-describedby={`persona-${persona.id}-desc`}
                        aria-label={`Select ${persona.title} persona`}
                      >
                        <CardContent className="p-6 text-center relative">
                          {/* Selection indicator */}
                          {isSelected && (
                            <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 animate-in zoom-in-50">
                              <Check className="h-4 w-4" />
                            </div>
                          )}

                          <div
                            className={`w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center transition-all duration-300 ${
                              isSelected
                                ? `${persona.bgColor} ring-4 ring-blue-200`
                                : `${persona.bgColor}`
                            }`}
                          >
                            <Icon
                              className={`h-8 w-8 ${persona.textColor} transition-transform duration-300`}
                              aria-hidden="true"
                            />
                          </div>

                          <h3
                            className={`font-semibold mb-2 transition-colors ${
                              isSelected ? 'text-blue-700' : 'text-gray-900'
                            }`}
                          >
                            {persona.title}
                          </h3>

                          <p
                            id={`persona-${persona.id}-desc`}
                            className={`text-sm mb-3 transition-colors ${
                              isSelected ? 'text-blue-600' : 'text-gray-600'
                            }`}
                          >
                            {persona.description}
                          </p>

                          <div className="space-y-2">
                            <Badge
                              variant={isSelected ? 'default' : 'secondary'}
                              className={`text-xs ${isSelected ? 'bg-blue-600 text-white' : ''}`}
                            >
                              ~{persona.defaultHours}h/day recommended
                            </Badge>

                            <div>
                              <Button
                                variant="ghost"
                                size="sm"
                                className={`text-xs transition-colors ${
                                  isSelected
                                    ? 'text-blue-700 hover:text-blue-800 hover:bg-blue-100'
                                    : 'text-blue-600 hover:text-blue-800'
                                }`}
                                onClick={e => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setShowPersonaDetails(showPersonaDetails === persona.id ? null : persona.id);
                                }}
                                onKeyDown={e => {
                                  if (e.key === 'Enter' || e.key === ' ') {
                                    e.stopPropagation();
                                    e.preventDefault();
                                    setShowPersonaDetails(showPersonaDetails === persona.id ? null : persona.id);
                                  }
                                }}
                              >
                                <Info className="h-3 w-3 mr-1" />
                                {showPersonaDetails === persona.id ? 'Hide details' : 'Learn more'}
                              </Button>
                            </div>
                          </div>
                        </CardContent>
                      </Card>
                    );
                  })}
                </div>

                {/* Continue button - only show when persona is selected */}
                {selectedPersona && (
                  <div className="flex justify-center mt-8 pt-6 border-t border-gray-100 animate-in slide-in-from-bottom duration-500">
                    <Button
                      onClick={handleProceedToNextStep}
                      size="lg"
                      className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 text-white font-semibold px-8 py-4 text-base shadow-lg hover:shadow-xl transition-all duration-300 hover:-translate-y-0.5 min-w-[280px] rounded-xl"
                    >
                      <span>Continue with {PERSONA_OPTIONS.find(p => p.id === selectedPersona)?.title}</span>
                      <ArrowRight className="ml-3 h-5 w-5" />
                    </Button>
                  </div>
                )}

                {/* Persona Details Expandable Section */}
                {showPersonaDetails && (
                  <Card className="border-blue-200 bg-blue-50/50 mt-4">
                    <CardContent className="p-4">
                      {(() => {
                        const persona = PERSONA_OPTIONS.find(p => p.id === showPersonaDetails);
                        if (!persona) {
                          return null;
                        }

                        return (
                          <div className="space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-semibold flex items-center space-x-2">
                                <persona.icon className="h-5 w-5" />
                                <span>{persona.title} - Detailed Overview</span>
                              </h4>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={e => {
                                  e.stopPropagation();
                                  e.preventDefault();
                                  setShowPersonaDetails(null);
                                }}
                                className="hover:bg-blue-100"
                                aria-label="Close details"
                              >
                                ×
                              </Button>
                            </div>
                            <p className="text-sm text-gray-700">{persona.longDescription}</p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                              <div>
                                <h5 className="font-medium text-green-700 mb-1">✓ Advantages:</h5>
                                <ul className="list-disc list-inside space-y-1 text-green-600">
                                  {persona.benefits.map((benefit, index) => (
                                    <li key={index}>{benefit}</li>
                                  ))}
                                </ul>
                              </div>
                              <div>
                                <h5 className="font-medium text-amber-700 mb-1">⚠ Considerations:</h5>
                                <ul className="list-disc list-inside space-y-1 text-amber-600">
                                  {persona.challenges.map((challenge, index) => (
                                    <li key={index}>{challenge}</li>
                                  ))}
                                </ul>
                              </div>
                            </div>
                          </div>
                        );
                      })()}
                    </CardContent>
                  </Card>
                )}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const selectedOption = PERSONA_OPTIONS.find(p => p.id === selectedPersona);
                    if (!selectedOption) {
                      return null;
                    }
                    const Icon = selectedOption.icon;
                    return (
                      <>
                        <div
                          className={`w-10 h-10 rounded-full flex items-center justify-center ${selectedOption.bgColor}`}
                        >
                          <Icon className={`h-5 w-5 ${selectedOption.textColor}`} />
                        </div>
                        <div>
                          <span className="font-medium">{selectedOption.title}</span>
                          <p className="text-sm text-gray-600">{selectedOption.description}</p>
                        </div>
                      </>
                    );
                  })()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSubStep(1)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Change
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sub-Step 2: Enhanced Study Hours */}
      {currentSubStep >= 2 && (
        <Card className={`transition-all duration-500 ${currentSubStep > 2 ? 'border-green-200 bg-green-50/30' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              {currentSubStep > 2 && <Check className="h-5 w-5 text-green-600" aria-hidden="true" />}
              <Label className="text-lg font-semibold">How many hours can you realistically study daily?</Label>
            </div>

            {currentSubStep === 2 ? (
              <div className="space-y-6">
                <div className="text-center space-y-3">
                  <div className="text-4xl font-bold text-blue-600 mb-2">
                    {currentStudyHours} hour{currentStudyHours !== 1 ? 's' : ''}
                  </div>
                  <p className="text-gray-600 max-w-md mx-auto">
                    {selectedPersona === 'student' &&
                      'As a student, you have flexibility for comprehensive study sessions'}
                    {selectedPersona === 'working_professional' &&
                      'As a working professional, focus on quality over quantity'}
                    {selectedPersona === 'freelancer' && 'As a freelancer, adapt your schedule around client work'}
                  </p>
                </div>

                <div className="px-4 space-y-4">
                  <div className="relative">
                    <Slider
                      value={[currentStudyHours]}
                      onValueChange={handleStudyGoalChange}
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
                  </div>

                  {/* Study hours recommendations - improved click handling */}
                  <div className="grid grid-cols-3 gap-3 text-xs">
                    <button
                      type="button"
                      className={`p-3 rounded-lg text-center transition-all duration-300 hover:-translate-y-0.5 border-2 ${
                        currentStudyHours <= 2
                          ? 'bg-yellow-100 text-yellow-800 border-yellow-300 ring-2 ring-yellow-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStudyGoalChange([1.5])}
                    >
                      <div className="font-medium">1-2h</div>
                      <div>Maintenance</div>
                    </button>
                    <button
                      type="button"
                      className={`p-3 rounded-lg text-center transition-all duration-300 hover:-translate-y-0.5 border-2 ${
                        currentStudyHours > 2 && currentStudyHours <= 6
                          ? 'bg-green-100 text-green-800 border-green-300 ring-2 ring-green-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStudyGoalChange([4])}
                    >
                      <div className="font-medium">3-6h</div>
                      <div>Optimal</div>
                    </button>
                    <button
                      type="button"
                      className={`p-3 rounded-lg text-center transition-all duration-300 hover:-translate-y-0.5 border-2 ${
                        currentStudyHours > 6
                          ? 'bg-blue-100 text-blue-800 border-blue-300 ring-2 ring-blue-200'
                          : 'bg-gray-100 text-gray-600 hover:bg-gray-200 border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleStudyGoalChange([8])}
                    >
                      <div className="font-medium">7-12h</div>
                      <div>Intensive</div>
                    </button>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => setCurrentSubStep(3)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 px-6"
                  >
                    Continue
                    <ArrowRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" aria-hidden="true" />
                  <div>
                    <span className="font-medium">{currentStudyHours} hours daily</span>
                    <p className="text-sm text-gray-600">
                      {currentStudyHours <= 2 && 'Focused, efficient sessions'}
                      {currentStudyHours > 2 && currentStudyHours <= 6 && 'Balanced, sustainable approach'}
                      {currentStudyHours > 6 && 'Intensive preparation mode'}
                    </p>
                  </div>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSubStep(2)}
                  className="text-blue-600 hover:text-blue-800"
                >
                  Change
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sub-Step 3: Enhanced Preferred Study Time */}
      {currentSubStep >= 3 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <Label className="text-lg font-semibold">When do you study most effectively?</Label>
            </div>

            <div className="space-y-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {STUDY_TIME_PREFERENCES.map(timeSlot => (
                  <Card
                    key={timeSlot.id}
                    className={`cursor-pointer transition-all duration-300 hover:shadow-md border-2 group ${
                      selectedTimeSlot === timeSlot.id
                        ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-blue-300 hover:shadow-lg hover:-translate-y-0.5'
                    }`}
                    onClick={e => {
                      e.preventDefault();
                      e.stopPropagation();
                      handleStudyTimeChange(timeSlot.id);
                    }}
                    onKeyDown={e => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        e.stopPropagation();
                        handleStudyTimeChange(timeSlot.id);
                      }
                    }}
                    tabIndex={0}
                    role="button"
                    aria-pressed={selectedTimeSlot === timeSlot.id}
                    aria-label={`Select ${timeSlot.label} study time`}
                  >
                    <CardContent className="p-4 text-center relative">
                      {/* Selection indicator */}
                      {selectedTimeSlot === timeSlot.id && (
                        <div className="absolute -top-2 -right-2 bg-blue-500 text-white rounded-full p-1 animate-in zoom-in-50">
                          <Check className="h-3 w-3" />
                        </div>
                      )}

                      <div className="text-2xl mb-2">{timeSlot.icon}</div>
                      <h3
                        className={`font-medium mb-1 transition-colors ${
                          selectedTimeSlot === timeSlot.id ? 'text-blue-700' : 'text-gray-900'
                        }`}
                      >
                        {timeSlot.label}
                      </h3>
                      <p
                        className={`text-xs mb-2 transition-colors ${
                          selectedTimeSlot === timeSlot.id ? 'text-blue-600' : 'text-gray-600'
                        }`}
                      >
                        {timeSlot.time}
                      </p>
                      <p
                        className={`text-xs transition-colors ${
                          selectedTimeSlot === timeSlot.id ? 'text-blue-500' : 'text-gray-500'
                        }`}
                      >
                        {timeSlot.description}
                      </p>
                    </CardContent>
                  </Card>
                ))}
              </div>

              {/* Time slot benefits */}
              {selectedTimeSlot && (
                <Card className="border-blue-200 bg-blue-50/50">
                  <CardContent className="p-4">
                    {(() => {
                      const timeSlot = STUDY_TIME_PREFERENCES.find(t => t.id === selectedTimeSlot);
                      if (!timeSlot) {
                        return null;
                      }

                      return (
                        <div>
                          <h4 className="font-medium text-blue-800 mb-2">
                            Why {timeSlot.label.toLowerCase()} works well:
                          </h4>
                          <ul className="list-disc list-inside space-y-1 text-sm text-blue-700">
                            {timeSlot.benefits.map((benefit, index) => (
                              <li key={index}>{benefit}</li>
                            ))}
                          </ul>
                        </div>
                      );
                    })()}
                  </CardContent>
                </Card>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Summary */}
      {currentSubStep >= 3 && selectedPersona && selectedTimeSlot && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3 mb-4">
              <div className="bg-green-100 p-2 rounded-full">
                <Check className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 mb-2">
                  Perfect! Your personalized profile is ready
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-1">Profile Type</h4>
                    <p className="text-gray-700 capitalize">{selectedPersona.replace('_', ' ')}</p>
                  </div>
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-1">Daily Goal</h4>
                    <p className="text-gray-700">{currentStudyHours} hours of focused study</p>
                  </div>
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-1">Best Time</h4>
                    <p className="text-gray-700 capitalize">{selectedTimeSlot} sessions</p>
                  </div>
                </div>
                <p className="text-green-700 mt-3">
                  We'll create a customized study strategy that maximizes your {currentStudyHours}-hour daily sessions
                  during {selectedTimeSlot} time, perfectly suited for your {selectedPersona.replace('_', ' ')}{' '}
                  lifestyle.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center pt-4 border-t border-green-200">
              <Badge className="bg-green-600 text-white px-4 py-2">✨ Ready for the next step</Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
