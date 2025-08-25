/**
 * @fileoverview Onboarding Step Components - Part 2
 *
 * Syllabus Management and Preferences step components for the enhanced onboarding flow.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  BookOpen,
  Plus,
  Trash2,
  Settings,
  Bell,
  Target,
  AlertCircle,
  CheckCircle,
  Info,
  Edit3,
  Save,
  X
} from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { UseFormReturn } from '@/hooks/useForm';
import { SyllabusSubject } from '@/types/exam';

/**
 * Props for onboarding form data
 */
/*
interface OnboardingFormData {
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
}
*/

/**
 * Syllabus Management Step
 */
interface SyllabusManagementStepProps {
  form: UseFormReturn<any>;
  onUpdateSubjectTier: (subjectId: string, tier: 1 | 2 | 3) => void;
  onAddSubject: () => void;
  onRemoveSubject: (subjectId: string) => void;
}

export function SyllabusManagementStep({
  form,
  onUpdateSubjectTier,
  onAddSubject,
  onRemoveSubject
}: SyllabusManagementStepProps) {
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [tempSubjectName, setTempSubjectName] = useState('');

  const startEditing = (subjectId: string, currentName: string) => {
    setEditingSubject(subjectId);
    setTempSubjectName(currentName);
  };

  const saveSubjectName = (subjectId: string) => {
    if (tempSubjectName.trim()) {
      const updatedSyllabus = form.data.syllabus.map((subject: SyllabusSubject) =>
        subject.id === subjectId ? { ...subject, name: tempSubjectName.trim() } : subject
      );
      form.updateField('syllabus', updatedSyllabus);
    }
    setEditingSubject(null);
    setTempSubjectName('');
  };

  const cancelEditing = () => {
    setEditingSubject(null);
    setTempSubjectName('');
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const tierCounts = form.data.syllabus.reduce(
    (acc: Record<number, number>, subject: any) => {
      acc[subject.tier] = (acc[subject.tier] || 0) + 1;
      return acc;
    },
    {} as Record<number, number>
  );

  return (
    <CardContent className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-purple-600" />
          <CardTitle>Syllabus Management</CardTitle>
        </div>
        <CardDescription>
          Organize your subjects by priority tiers to optimize your study strategy.
        </CardDescription>
      </CardHeader>

      {/* Tier Legend */}
      <div className="bg-gradient-to-r from-purple-50 to-pink-50 p-4 rounded-lg">
        <h4 className="font-semibold mb-3">Priority Tiers</h4>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-red-500 rounded" />
            <div>
              <div className="font-medium text-sm">Tier 1 - High Priority</div>
              <div className="text-xs text-gray-600">Core topics, high weightage</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-yellow-500 rounded" />
            <div>
              <div className="font-medium text-sm">Tier 2 - Medium Priority</div>
              <div className="text-xs text-gray-600">Important but manageable</div>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <div className="w-4 h-4 bg-green-500 rounded" />
            <div>
              <div className="font-medium text-sm">Tier 3 - Low Priority</div>
              <div className="text-xs text-gray-600">Time permitting topics</div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-4">
        <div className="text-center p-3 bg-red-50 rounded-lg">
          <div className="text-2xl font-bold text-red-600">{tierCounts[1] || 0}</div>
          <div className="text-sm text-red-600">Tier 1</div>
        </div>
        <div className="text-center p-3 bg-yellow-50 rounded-lg">
          <div className="text-2xl font-bold text-yellow-600">{tierCounts[2] || 0}</div>
          <div className="text-sm text-yellow-600">Tier 2</div>
        </div>
        <div className="text-center p-3 bg-green-50 rounded-lg">
          <div className="text-2xl font-bold text-green-600">{tierCounts[3] || 0}</div>
          <div className="text-sm text-green-600">Tier 3</div>
        </div>
      </div>

      {/* Subjects List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Subjects ({form.data.syllabus.length})</h4>
          <Button
            variant="outline"
            size="sm"
            onClick={onAddSubject}
            className="flex items-center space-x-1"
          >
            <Plus className="h-4 w-4" />
            <span>Add Subject</span>
          </Button>
        </div>

        {form.data.syllabus.length === 0 ? (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              No subjects added yet. Click "Add Subject" to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-2">
            {form.data.syllabus.map((subject: SyllabusSubject) => (
              <div key={subject.id} className="flex items-center justify-between p-4 bg-white border rounded-lg hover:shadow-sm transition-shadow">
                <div className="flex-1">
                  {editingSubject === subject.id ? (
                    <div className="flex items-center space-x-2">
                      <Input
                        value={tempSubjectName}
                        onChange={(e) => setTempSubjectName(e.target.value)}
                        className="flex-1"
                        autoFocus
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') { saveSubjectName(subject.id); }
                          if (e.key === 'Escape') { cancelEditing(); }
                        }}
                      />
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => saveSubjectName(subject.id)}
                      >
                        <Save className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={cancelEditing}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-3">
                      <span className="font-medium">{subject.name}</span>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(subject.id, subject.name)}
                        className="p-1 h-auto"
                      >
                        <Edit3 className="h-3 w-3" />
                      </Button>
                      {subject.topics && (
                        <span className="text-sm text-gray-600">
                          ({subject.topics.length} topics)
                        </span>
                      )}
                    </div>
                  )}
                </div>

                <div className="flex items-center space-x-3">
                  {/* Tier Selection */}
                  <Select
                    value={subject.tier.toString()}
                    onValueChange={(value) => onUpdateSubjectTier(subject.id, parseInt(value) as 1 | 2 | 3)}
                  >
                    <SelectTrigger className="w-32">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="1">
                        <Badge className={getTierColor(1)}>Tier 1</Badge>
                      </SelectItem>
                      <SelectItem value="2">
                        <Badge className={getTierColor(2)}>Tier 2</Badge>
                      </SelectItem>
                      <SelectItem value="3">
                        <Badge className={getTierColor(3)}>Tier 3</Badge>
                      </SelectItem>
                    </SelectContent>
                  </Select>

                  {/* Remove Button */}
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() => onRemoveSubject(subject.id)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {form.errors.syllabus && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">
            {form.errors.syllabus.message}
          </AlertDescription>
        </Alert>
      )}

      {/* Strategy Tips */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <strong>Strategy Tip:</strong> Aim for 30% Tier 1, 50% Tier 2, and 20% Tier 3 subjects
          for optimal time allocation and maximum score potential.
        </AlertDescription>
      </Alert>
    </CardContent>
  );
}

/**
 * Study Preferences Step
 */
interface PreferencesStepProps {
  form: UseFormReturn<any>;
}

export function PreferencesStep({ form }: PreferencesStepProps) {
  const [customInterval, setCustomInterval] = useState('');

  const addRevisionInterval = () => {
    const days = parseInt(customInterval);
    if (days > 0 && !form.data.preferences.revisionIntervals.includes(days)) {
      const newIntervals = [...form.data.preferences.revisionIntervals, days].sort((a, b) => a - b);
      form.updateField('preferences', {
        ...form.data.preferences,
        revisionIntervals: newIntervals
      });
      setCustomInterval('');
    }
  };

  const removeRevisionInterval = (days: number) => {
    const newIntervals = form.data.preferences.revisionIntervals.filter((d: number) => d !== days);
    form.updateField('preferences', {
      ...form.data.preferences,
      revisionIntervals: newIntervals
    });
  };

  const studyGoalHours = Math.floor(form.data.preferences.dailyStudyGoalMinutes / 60);
  const studyGoalMinutes = form.data.preferences.dailyStudyGoalMinutes % 60;

  return (
    <CardContent className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-indigo-600" />
          <CardTitle>Study Preferences</CardTitle>
        </div>
        <CardDescription>
          Customize your study schedule and notification preferences for optimal learning.
        </CardDescription>
      </CardHeader>

      {/* Daily Study Goal */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Daily Study Goal</Label>
        <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-sm font-medium">
              {studyGoalHours}h {studyGoalMinutes}m per day
            </span>
            <Target className="h-5 w-5 text-indigo-600" />
          </div>

          <Slider
            value={[form.data.preferences.dailyStudyGoalMinutes]}
            onValueChange={([value]) => form.updateField('preferences', {
              ...form.data.preferences,
              dailyStudyGoalMinutes: value
            })}
            min={60}
            max={720}
            step={30}
            className="w-full"
          />

          <div className="flex justify-between text-xs text-gray-600 mt-2">
            <span>1h</span>
            <span>6h</span>
            <span>12h</span>
          </div>
        </div>
      </div>

      {/* Preferred Study Time */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preferred Study Time</Label>
        <Select
          value={form.data.preferences.preferredStudyTime}
          onValueChange={(value: 'morning' | 'afternoon' | 'evening' | 'night') =>
            form.updateField('preferences', {
              ...form.data.preferences,
              preferredStudyTime: value
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="morning">
              <div className="flex items-center space-x-2">
                <span>🌅</span>
                <span>Morning (6 AM - 12 PM)</span>
              </div>
            </SelectItem>
            <SelectItem value="afternoon">
              <div className="flex items-center space-x-2">
                <span>☀️</span>
                <span>Afternoon (12 PM - 6 PM)</span>
              </div>
            </SelectItem>
            <SelectItem value="evening">
              <div className="flex items-center space-x-2">
                <span>🌇</span>
                <span>Evening (6 PM - 10 PM)</span>
              </div>
            </SelectItem>
            <SelectItem value="night">
              <div className="flex items-center space-x-2">
                <span>🌙</span>
                <span>Night (10 PM - 2 AM)</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Tier Definitions */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Customize Tier Definitions</Label>

        {[1, 2, 3].map((tier) => (
          <div key={tier} className="space-y-2">
            <Label className="text-xs font-medium text-gray-600">
              Tier {tier} Definition
            </Label>
            <Input
              value={form.data.preferences.tierDefinitions[tier as keyof typeof form.data.preferences.tierDefinitions]}
              onChange={(e) => form.updateField('preferences', {
                ...form.data.preferences,
                tierDefinitions: {
                  ...form.data.preferences.tierDefinitions,
                  [tier]: e.target.value
                }
              })}
              placeholder={`Define what Tier ${tier} represents...`}
              className="text-sm"
            />
          </div>
        ))}
      </div>

      {/* Revision Intervals */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Spaced Repetition Intervals (days)</Label>

        <div className="flex flex-wrap gap-2">
          {form.data.preferences.revisionIntervals.map((days: number) => (
            <Badge
              key={days}
              variant="secondary"
              className="flex items-center space-x-1 px-2 py-1"
            >
              <span>{days}d</span>
              <button
                onClick={() => removeRevisionInterval(days)}
                className="ml-1 text-gray-500 hover:text-red-600"
              >
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex space-x-2">
          <Input
            type="number"
            placeholder="Add interval (days)"
            value={customInterval}
            onChange={(e) => setCustomInterval(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addRevisionInterval();
              }
            }}
            className="flex-1"
            min="1"
            max="365"
          />
          <Button onClick={addRevisionInterval} disabled={!customInterval}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Based on research: Review after 1, 3, 7, 16, and 35 days for optimal retention.
          </AlertDescription>
        </Alert>
      </div>

      {/* Notifications */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Notification Preferences</Label>

        <div className="space-y-3">
          {[
            {
              key: 'revisionReminders' as const,
              label: 'Revision Reminders',
              description: 'Get notified when topics are due for revision'
            },
            {
              key: 'dailyGoalReminders' as const,
              label: 'Daily Goal Reminders',
              description: 'Receive reminders about your daily study goals'
            },
            {
              key: 'healthCheckReminders' as const,
              label: 'Health Check Reminders',
              description: 'Get prompted to log your health and energy levels'
            }
          ].map((notification) => (
            <div key={notification.key} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div className="flex-1">
                <div className="flex items-center space-x-2">
                  <Bell className="h-4 w-4 text-gray-600" />
                  <span className="font-medium text-sm">{notification.label}</span>
                </div>
                <p className="text-xs text-gray-600 mt-1">{notification.description}</p>
              </div>
              <Switch
                checked={form.data.preferences.notifications[notification.key]}
                onCheckedChange={(checked) => form.updateField('preferences', {
                  ...form.data.preferences,
                  notifications: {
                    ...form.data.preferences.notifications,
                    [notification.key]: checked
                  }
                })}
              />
            </div>
          ))}
        </div>
      </div>

      {/* Summary */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Setup Complete!</strong> Your personalized strategy engine is ready.
          You can modify these settings anytime from your dashboard.
        </AlertDescription>
      </Alert>
    </CardContent>
  );
}
