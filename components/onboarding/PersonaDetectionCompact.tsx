/**
 * @fileoverview Smart Persona Detection Component - Streamlined UX
 *
 * A much more compact and intuitive persona detection step that uses
 * progressive disclosure and smart defaults to minimize cognitive load.
 *
 * @author Exam Strategy Engine Team
 * @version 2.0.0
 */

'use client';

import {
  User,
  GraduationCap,
  Briefcase,
  Code,
  Clock,
  Target,
  ChevronRight,
  Check
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { UseFormReturn } from '@/hooks/useForm';
import { UserPersonaType } from '@/types/exam';

/**
 * Simplified persona options with smart defaults
 */
const PERSONA_OPTIONS = [
  {
    id: 'student' as UserPersonaType,
    icon: GraduationCap,
    title: 'Student',
    description: 'Full-time study focus',
    defaultHours: 6,
    color: 'from-blue-500 to-cyan-500',
    bgColor: 'bg-blue-50',
    textColor: 'text-blue-700'
  },
  {
    id: 'working_professional' as UserPersonaType,
    icon: Briefcase,
    title: 'Working Professional',
    description: 'Balancing job and studies',
    defaultHours: 2,
    color: 'from-green-500 to-emerald-500',
    bgColor: 'bg-green-50',
    textColor: 'text-green-700'
  },
  {
    id: 'freelancer' as UserPersonaType,
    icon: Code,
    title: 'Freelancer',
    description: 'Flexible schedule',
    defaultHours: 4,
    color: 'from-purple-500 to-pink-500',
    bgColor: 'bg-purple-50',
    textColor: 'text-purple-700'
  }
];

/**
 * Study time preferences
 */
const STUDY_TIMES = [
  { id: 'morning', label: 'Morning', icon: '🌅', time: '6-10 AM' },
  { id: 'afternoon', label: 'Afternoon', icon: '☀️', time: '12-4 PM' },
  { id: 'evening', label: 'Evening', icon: '🌆', time: '5-9 PM' },
  { id: 'night', label: 'Night', icon: '🌙', time: '9 PM-12 AM' }
];

/**
 * Form data interface for the streamlined component
 */
interface PersonaFormData {
  userPersona: {
    type: UserPersonaType;
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
 * Streamlined persona detection step component
 */
export function PersonaDetectionStep({ form }: PersonaDetectionStepProps) {
  const [currentSubStep, setCurrentSubStep] = useState(1);
  const [selectedPersona, setSelectedPersona] = useState<UserPersonaType | null>(
    form.data.userPersona?.type || null
  );

  // Auto-advance when persona is selected
  useEffect(() => {
    if (selectedPersona && currentSubStep === 1) {
      const timer = setTimeout(() => {
        setCurrentSubStep(2);
      }, 800); // Small delay for smooth UX
      return () => clearTimeout(timer);
    }
    return undefined;
  }, [selectedPersona, currentSubStep]);

  // Handle persona selection
  const handlePersonaSelect = (personaType: UserPersonaType) => {
    setSelectedPersona(personaType);
    
    // Update form with selected persona
    form.updateField('userPersona', { type: personaType });
    
    // Set smart default study time based on persona
    const defaultHours = PERSONA_OPTIONS.find(p => p.id === personaType)?.defaultHours || 2;
    form.updateField('preferences', {
      ...form.data.preferences,
      dailyStudyGoalMinutes: defaultHours * 60
    });
  };

  // Handle study goal change
  const handleStudyGoalChange = (hours: number[]) => {
    form.updateField('preferences', {
      ...form.data.preferences,
      dailyStudyGoalMinutes: (hours[0] || 2) * 60
    });
  };

  // Handle study time preference change
  const handleStudyTimeChange = (timeSlot: string) => {
    form.updateField('preferences', {
      ...form.data.preferences,
      preferredStudyTime: timeSlot as 'morning' | 'afternoon' | 'evening' | 'night'
    });
  };

  const currentStudyHours = Math.round(form.data.preferences?.dailyStudyGoalMinutes / 60) || 2;
  const selectedTimeSlot = form.data.preferences?.preferredStudyTime;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
          <User className="h-5 w-5" />
          <span className="text-sm font-medium">Quick Setup</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Let's personalize your experience</h2>
        <p className="text-gray-600">We'll customize everything based on your lifestyle</p>
      </div>

      {/* Progress Dots */}
      <div className="flex justify-center space-x-2">
        {[1, 2, 3].map((step) => (
          <div
            key={step}
            className={`h-2 w-8 rounded-full transition-all duration-300 ${
              step <= currentSubStep
                ? 'bg-gradient-to-r from-blue-500 to-purple-500'
                : 'bg-gray-200'
            }`}
          />
        ))}
      </div>

      {/* Sub-Step 1: Persona Selection */}
      {currentSubStep >= 1 && (
        <Card className={`transition-all duration-500 ${currentSubStep > 1 ? 'border-green-200 bg-green-50/30' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              {currentSubStep > 1 && <Check className="h-5 w-5 text-green-600" />}
              <Label className="text-lg font-semibold">What describes you best?</Label>
            </div>
            
            {currentSubStep === 1 ? (
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                {PERSONA_OPTIONS.map((persona) => {
                  const Icon = persona.icon;
                  const isSelected = selectedPersona === persona.id;
                  
                  return (
                    <Card
                      key={persona.id}
                      className={`cursor-pointer transition-all duration-300 hover:shadow-md border-2 ${
                        isSelected
                          ? 'border-blue-500 shadow-lg transform scale-105'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handlePersonaSelect(persona.id)}
                    >
                      <CardContent className="p-4 text-center">
                        <div className={`w-12 h-12 rounded-full mx-auto mb-3 flex items-center justify-center ${persona.bgColor}`}>
                          <Icon className={`h-6 w-6 ${persona.textColor}`} />
                        </div>
                        <h3 className="font-semibold text-gray-900 mb-1">{persona.title}</h3>
                        <p className="text-sm text-gray-600 mb-2">{persona.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          ~{persona.defaultHours}h/day
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  {(() => {
                    const selectedOption = PERSONA_OPTIONS.find(p => p.id === selectedPersona);
                    if (!selectedOption) return null;
                    const Icon = selectedOption.icon;
                    return (
                      <>
                        <div className={`w-8 h-8 rounded-full flex items-center justify-center ${selectedOption.bgColor}`}>
                          <Icon className={`h-4 w-4 ${selectedOption.textColor}`} />
                        </div>
                        <span className="font-medium">{selectedOption.title}</span>
                      </>
                    );
                  })()}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSubStep(1)}
                  className="text-blue-600"
                >
                  Change
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sub-Step 2: Study Hours */}
      {currentSubStep >= 2 && (
        <Card className={`transition-all duration-500 ${currentSubStep > 2 ? 'border-green-200 bg-green-50/30' : ''}`}>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              {currentSubStep > 2 && <Check className="h-5 w-5 text-green-600" />}
              <Label className="text-lg font-semibold">How many hours can you study daily?</Label>
            </div>
            
            {currentSubStep === 2 ? (
              <div className="space-y-6">
                <div className="text-center">
                  <div className="text-3xl font-bold text-blue-600 mb-2">
                    {currentStudyHours} hour{currentStudyHours !== 1 ? 's' : ''}
                  </div>
                  <p className="text-gray-600">
                    Based on your profile, this is a realistic goal
                  </p>
                </div>
                
                <div className="px-4">
                  <Slider
                    value={[currentStudyHours]}
                    onValueChange={handleStudyGoalChange}
                    min={1}
                    max={12}
                    step={0.5}
                    className="w-full"
                  />
                  <div className="flex justify-between text-xs text-gray-500 mt-2">
                    <span>1h</span>
                    <span>6h</span>
                    <span>12h</span>
                  </div>
                </div>

                <div className="flex justify-center">
                  <Button
                    onClick={() => setCurrentSubStep(3)}
                    className="bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700"
                  >
                    Continue
                    <ChevronRight className="ml-2 h-4 w-4" />
                  </Button>
                </div>
              </div>
            ) : (
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <Clock className="h-5 w-5 text-blue-600" />
                  <span className="font-medium">{currentStudyHours} hours daily</span>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setCurrentSubStep(2)}
                  className="text-blue-600"
                >
                  Change
                </Button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Sub-Step 3: Preferred Study Time */}
      {currentSubStep >= 3 && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Target className="h-5 w-5 text-blue-600" />
              <Label className="text-lg font-semibold">When do you prefer to study?</Label>
            </div>
            
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              {STUDY_TIMES.map((timeSlot) => (
                <Card
                  key={timeSlot.id}
                  className={`cursor-pointer transition-all duration-300 hover:shadow-md border-2 ${
                    selectedTimeSlot === timeSlot.id
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => handleStudyTimeChange(timeSlot.id)}
                >
                  <CardContent className="p-4 text-center">
                    <div className="text-2xl mb-2">{timeSlot.icon}</div>
                    <h3 className="font-medium text-gray-900 mb-1">{timeSlot.label}</h3>
                    <p className="text-xs text-gray-600">{timeSlot.time}</p>
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Summary */}
      {currentSubStep >= 3 && selectedPersona && selectedTimeSlot && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-3">
              <Check className="h-5 w-5 text-green-600" />
              <Label className="text-lg font-semibold text-green-800">Perfect! You're all set</Label>
            </div>
            <p className="text-green-700 mb-4">
              We'll create a personalized study plan that fits your {selectedPersona.replace('_', ' ')} lifestyle
              with {currentStudyHours} hours of daily study in the {selectedTimeSlot}.
            </p>
            <div className="flex items-center justify-center">
              <Badge className="bg-green-600 text-white">
                ✨ Ready for next step
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
