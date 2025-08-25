/**
 * @fileoverview Onboarding Step Components
 *
 * Individual step components for the enhanced onboarding flow.
 * Each component follows enterprise patterns with proper type safety,
 * accessibility, and UX best practices.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  User,
  Search,
  Calendar,
  Plus,
  AlertCircle,
  CheckCircle,
  Info
} from 'lucide-react';
import React, { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from '@/hooks/useForm';
import { Exam, SyllabusSubject as _SyllabusSubject } from '@/types/exam';

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
 * Personal Information & Exam Selection Step
 */
interface PersonalInfoStepProps {
  form: UseFormReturn<any>;
  filteredExams: Exam[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onExamSelect: (examId: string) => void;
  selectedExam: Exam | null;
}

export function PersonalInfoStep({
  form,
  filteredExams,
  searchQuery,
  setSearchQuery,
  onExamSelect,
  selectedExam
}: PersonalInfoStepProps) {
  const [showAllExams, setShowAllExams] = useState(false);
  const displayedExams = showAllExams ? filteredExams : filteredExams.slice(0, 6);

  return (
    <CardContent className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center space-x-2">
          <User className="h-6 w-6 text-blue-600" />
          <CardTitle>Personal Information & Exam Selection</CardTitle>
        </div>
        <CardDescription>
          Tell us about yourself and choose your target exam to create a personalized strategy.
        </CardDescription>
      </CardHeader>

      {/* Display Name */}
      <div className="space-y-2">
        <Label htmlFor="displayName" className="text-sm font-medium">
          Your Name *
        </Label>
        <Input
          id="displayName"
          value={form.data.displayName}
          onChange={(e) => form.updateField('displayName', e.target.value)}
          onBlur={() => form.markFieldTouched('displayName')}
          placeholder="Enter your full name"
          className={form.errors.displayName ? 'border-red-500' : ''}
          aria-describedby={form.errors.displayName ? 'displayName-error' : undefined}
        />
        {form.errors.displayName && (
          <p id="displayName-error" className="text-sm text-red-600 flex items-center space-x-1">
            <AlertCircle className="h-4 w-4" />
            <span>{form.errors.displayName.message}</span>
          </p>
        )}
      </div>

      {/* Exam Search */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Target Exam *</Label>

        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search for your exam..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>

        {/* Exam Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {displayedExams.map((exam) => (
            <Card
              key={exam.id}
              className={`cursor-pointer transition-all duration-200 hover:shadow-md ${
                form.data.selectedExamId === exam.id
                  ? 'ring-2 ring-blue-500 bg-blue-50'
                  : 'hover:bg-gray-50'
              }`}
              onClick={() => onExamSelect(exam.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <h3 className="font-semibold text-sm">{exam.name}</h3>
                    <p className="text-xs text-gray-600 mt-1">{exam.description}</p>
                    <Badge variant="secondary" className="mt-2 text-xs">
                      {exam.category}
                    </Badge>
                  </div>
                  {form.data.selectedExamId === exam.id && (
                    <CheckCircle className="h-5 w-5 text-blue-600 flex-shrink-0" />
                  )}
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Custom Exam Option */}
          <Card
            className={`cursor-pointer transition-all duration-200 hover:shadow-md border-dashed ${
              form.data.isCustomExam
                ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
                : 'border-gray-300 hover:bg-gray-50'
            }`}
            onClick={() => onExamSelect('custom')}
          >
            <CardContent className="p-4 flex items-center justify-center min-h-[100px]">
              <div className="text-center">
                <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                <p className="text-sm font-medium">Create Custom Exam</p>
                <p className="text-xs text-gray-600">For competitive exams not listed</p>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Show More Button */}
        {!showAllExams && filteredExams.length > 6 && (
          <Button
            variant="outline"
            onClick={() => setShowAllExams(true)}
            className="w-full"
          >
            Show {filteredExams.length - 6} more exams
          </Button>
        )}

        {form.errors.selectedExamId && (
          <Alert className="border-red-200 bg-red-50">
            <AlertCircle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              {form.errors.selectedExamId.message}
            </AlertDescription>
          </Alert>
        )}
      </div>

      {/* Exam Date */}
      {form.data.selectedExamId && (
        <div className="space-y-2">
          <Label htmlFor="examDate" className="text-sm font-medium">
            Target Exam Date *
          </Label>
          <div className="relative">
            <Calendar className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              id="examDate"
              type="date"
              value={form.data.examDate}
              onChange={(e) => form.updateField('examDate', e.target.value)}
              onBlur={() => form.markFieldTouched('examDate')}
              className={`pl-10 ${form.errors.examDate ? 'border-red-500' : ''}`}
              min={new Date(Date.now() + 86400000).toISOString().split('T')[0]}
              aria-describedby={form.errors.examDate ? 'examDate-error' : undefined}
            />
          </div>
          {form.errors.examDate && (
            <p id="examDate-error" className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{form.errors.examDate.message}</span>
            </p>
          )}
        </div>
      )}

      {/* Selected Exam Summary */}
      {selectedExam && !form.data.isCustomExam && (
        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800">
            <strong>{selectedExam.name}</strong> - {selectedExam.description}
            <br />
            <span className="text-sm">
              Syllabus: {selectedExam.defaultSyllabus.length} subjects •
              Estimated study time: {selectedExam.defaultSyllabus.reduce((sum, s) => sum + (s.estimatedHours || 0), 0)} hours
            </span>
          </AlertDescription>
        </Alert>
      )}
    </CardContent>
  );
}

/**
 * Custom Exam Details Step
 */
interface CustomExamStepProps {
  form: UseFormReturn<any>;
}

export function CustomExamStep({ form }: CustomExamStepProps) {
  return (
    <CardContent className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center space-x-2">
          <Plus className="h-6 w-6 text-green-600" />
          <CardTitle>Custom Exam Details</CardTitle>
        </div>
        <CardDescription>
          Provide details about your custom exam to create a tailored study strategy.
        </CardDescription>
      </CardHeader>

      <div className="space-y-4">
        {/* Exam Name */}
        <div className="space-y-2">
          <Label htmlFor="customExamName" className="text-sm font-medium">
            Exam Name *
          </Label>
          <Input
            id="customExamName"
            value={form.data.customExam.name}
            onChange={(e) => form.updateField('customExam', {
              ...form.data.customExam,
              name: e.target.value
            })}
            onBlur={() => form.markFieldTouched('customExam')}
            placeholder="e.g., State Public Service Commission"
            className={form.errors['customExam.name'] ? 'border-red-500' : ''}
          />
          {form.errors['customExam.name'] && (
            <p className="text-sm text-red-600 flex items-center space-x-1">
              <AlertCircle className="h-4 w-4" />
              <span>{form.errors['customExam.name'].message}</span>
            </p>
          )}
        </div>

        {/* Category */}
        <div className="space-y-2">
          <Label htmlFor="customExamCategory" className="text-sm font-medium">
            Category
          </Label>
          <Select
            value={form.data.customExam.category}
            onValueChange={(value) => form.updateField('customExam', {
              ...form.data.customExam,
              category: value
            })}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select exam category" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="Government">Government Jobs</SelectItem>
              <SelectItem value="Engineering">Engineering Entrance</SelectItem>
              <SelectItem value="Medical">Medical Entrance</SelectItem>
              <SelectItem value="Management">Management Entrance</SelectItem>
              <SelectItem value="Banking">Banking & Finance</SelectItem>
              <SelectItem value="Teaching">Teaching & Education</SelectItem>
              <SelectItem value="Legal">Legal & Judicial</SelectItem>
              <SelectItem value="Defense">Defense & Police</SelectItem>
              <SelectItem value="Research">Research & Fellowship</SelectItem>
              <SelectItem value="Other">Other</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* Description */}
        <div className="space-y-2">
          <Label htmlFor="customExamDescription" className="text-sm font-medium">
            Description
          </Label>
          <Textarea
            id="customExamDescription"
            value={form.data.customExam.description}
            onChange={(e) => form.updateField('customExam', {
              ...form.data.customExam,
              description: e.target.value
            })}
            placeholder="Brief description of the exam pattern, difficulty level, and selection process..."
            rows={4}
          />
        </div>
      </div>

      <Alert className="border-amber-200 bg-amber-50">
        <Info className="h-4 w-4 text-amber-600" />
        <AlertDescription className="text-amber-800">
          <strong>Note:</strong> You'll be able to add and customize subjects in the next step.
          Our system will help you structure your syllabus effectively.
        </AlertDescription>
      </Alert>
    </CardContent>
  );
}

/**
 * Exam Review Step (for predefined exams)
 */
interface ExamReviewStepProps {
  form: UseFormReturn<any>;
  selectedExam: Exam | null;
}

export function ExamReviewStep({ form, selectedExam }: ExamReviewStepProps) {
  if (!selectedExam) { return null; }

  const totalHours = selectedExam.defaultSyllabus.reduce((sum, subject) => sum + (subject.estimatedHours || 0), 0);
  const daysUntilExam = form.data.examDate ?
    Math.max(0, Math.ceil((new Date(form.data.examDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0;

  return (
    <CardContent className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center space-x-2">
          <CheckCircle className="h-6 w-6 text-green-600" />
          <CardTitle>Exam Overview</CardTitle>
        </div>
        <CardDescription>
          Review your selected exam details and preparation timeline.
        </CardDescription>
      </CardHeader>

      {/* Exam Summary */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 p-6 rounded-lg">
        <h3 className="text-xl font-bold text-blue-900 mb-2">{selectedExam.name}</h3>
        <p className="text-blue-700 mb-4">{selectedExam.description}</p>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{selectedExam.defaultSyllabus.length}</div>
            <div className="text-sm text-blue-600">Subjects</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{totalHours}h</div>
            <div className="text-sm text-blue-600">Est. Study Time</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">{daysUntilExam}</div>
            <div className="text-sm text-blue-600">Days Left</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">
              {daysUntilExam > 0 ? Math.round(totalHours / daysUntilExam * 10) / 10 : 0}h
            </div>
            <div className="text-sm text-blue-600">Daily Goal</div>
          </div>
        </div>
      </div>

      {/* Timeline Alert */}
      {daysUntilExam > 0 && (
        <Alert className={daysUntilExam < 30 ? 'border-red-200 bg-red-50' : 'border-green-200 bg-green-50'}>
          {daysUntilExam < 30 ? (
            <AlertCircle className="h-4 w-4 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 text-green-600" />
          )}
          <AlertDescription className={daysUntilExam < 30 ? 'text-red-800' : 'text-green-800'}>
            {daysUntilExam < 30 ? (
              <>
                <strong>Intensive preparation needed!</strong> With only {daysUntilExam} days left,
                you'll need approximately {Math.round(totalHours / daysUntilExam * 10) / 10} hours of focused study daily.
              </>
            ) : (
              <>
                <strong>Good preparation time!</strong> With {daysUntilExam} days available,
                {Math.round(totalHours / daysUntilExam * 10) / 10} hours daily will give you comprehensive coverage.
              </>
            )}
          </AlertDescription>
        </Alert>
      )}

      {/* Subject Preview */}
      <div className="space-y-3">
        <h4 className="font-semibold">Included Subjects</h4>
        <div className="grid gap-2">
          {selectedExam.defaultSyllabus.map((subject) => (
            <div key={subject.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
              <div>
                <span className="font-medium">{subject.name}</span>
                <span className="text-sm text-gray-600 ml-2">({subject.topics.length} topics)</span>
              </div>
              <div className="text-right">
                <Badge variant={subject.tier === 1 ? 'destructive' : subject.tier === 2 ? 'default' : 'secondary'}>
                  Tier {subject.tier}
                </Badge>
                <div className="text-sm text-gray-600">{subject.estimatedHours || 0}h</div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          You can customize subject priorities and add/remove topics in the next step.
        </AlertDescription>
      </Alert>
    </CardContent>
  );
}
