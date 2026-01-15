/**
 * @fileoverview Basic Information Step - Name & Course Selection
 *
 * First step of the onboarding flow focusing on:
 * - User's name
 * - Learning path/course selection
 * - Clean, focused UX without redundancy
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

'use client';

import { Search, BookOpen, User, Plus, AlertCircle, X, Star } from 'lucide-react';
import { useState, useMemo, useCallback, useEffect } from 'react';
import { Timestamp } from 'firebase/firestore';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from '@/hooks/useForm';
import { POPULAR_EXAM_CATEGORIES } from '@/lib/data/onboarding';
import { Exam, OnboardingFormData } from '@/types/exam';

// Interface for Google Analytics gtag function
declare global {
  interface Window {
    gtag?: (command: string, action: string, parameters?: Record<string, unknown>) => void;
  }
}

/**
 * Props for basic info step
 */
interface BasicInfoStepProps {
  form: UseFormReturn<OnboardingFormData>;
  filteredExams: Exam[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onExamSelect: (examId: string) => void;
  selectedExam: Exam | null;
}

/**
 * Form validation helper
 */
const validateName = (name: string): string | null => {
  if (!name || name.length < 2) {
    return 'Name must be at least 2 characters long';
  }
  if (name.length > 50) {
    return 'Name must be less than 50 characters';
  }
  if (!/^[a-zA-Z\s]+$/.test(name)) {
    return 'Name can only contain letters and spaces';
  }
  return null;
};

/**
 * Basic information step component - Step 1 of onboarding
 */
export function BasicInfoStep({
  form,
  filteredExams,
  searchQuery,
  setSearchQuery,
  onExamSelect,
  selectedExam,
}: BasicInfoStepProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>('computer-science');
  const [showAllExams, setShowAllExams] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [isMultiSelectMode, setIsMultiSelectMode] = useState(false);

  // Sync isMultiSelectMode with selectedCourses length
  useEffect(() => {
    if (form.data.selectedCourses && form.data.selectedCourses.length > 1) {
      setIsMultiSelectMode(true);
    }
  }, [form.data.selectedCourses]);

  // Handle course toggle
  const toggleCourse = useCallback((exam: Exam) => {
    const currentCourses = form.data.selectedCourses || [];
    const isSelected = currentCourses.some(c => c.examId === exam.id);

    let newCourses;

    if (isSelected) {
      newCourses = currentCourses.filter(c => c.examId !== exam.id);
    } else {
      if (currentCourses.length >= 5) {
        // Optional: Add toast notification for max limit
        return;
      }
      const newCourse = {
        examId: exam.id,
        examName: exam.name,
        targetDate: Timestamp.now(), // Placeholder, updated in next step
        priority: currentCourses.length + 1,
        isCustom: false,
      };
      newCourses = [...currentCourses, newCourse];
    }

    form.updateField('selectedCourses', newCourses);
    
    // Sync legacy selectedExamId for backward compat (use primary/first course)
    if (newCourses.length > 0) {
      form.updateField('selectedExamId', newCourses[0]?.examId ?? '');
      // Sync form.data.isCustomExam (if primary is custom, though this handler is for predefined)
      form.updateField('isCustomExam', false);
    } else {
      form.updateField('selectedExamId', '');
    }

  }, [form]);

  // Override standard select for multi-mode support
  const handleExamClick = useCallback((examId: string) => {
    const exam = filteredExams.find(e => e.id === examId);
    if (!exam) return;

    if (isMultiSelectMode) {
      toggleCourse(exam);
    } else {
      // Standard single-select behavior
      const newCourse = {
        examId: exam.id,
        examName: exam.name,
        targetDate: Timestamp.now(),
        priority: 1,
        isCustom: false,
      };
      form.updateField('selectedCourses', [newCourse]);
      onExamSelect(examId); // Calls parent handler which sets selectedExamId
    }
  }, [isMultiSelectMode, filteredExams, form, onExamSelect, toggleCourse]);

  // Remove course handler
  const removeCourse = useCallback((examId: string, e: React.MouseEvent) => {
    e.stopPropagation(); // Prevent card click
    const currentCourses = form.data.selectedCourses || [];
    const newCourses = currentCourses.filter(c => c.examId !== examId);
    form.updateField('selectedCourses', newCourses);
     
    if (newCourses.length > 0) {
      form.updateField('selectedExamId', newCourses[0]?.examId ?? '');
    } else {
      form.updateField('selectedExamId', '');
    }
  }, [form]);


  // Category color mapping
  const getCategoryClasses = useCallback((categoryId: string, isActive: boolean) => {
    if (!isActive) {
      return '';
    }

    switch (categoryId) {
      case 'computer-science':
        return 'bg-purple-50 text-purple-700 border-purple-200';
      case 'civil-services':
        return 'bg-blue-50 text-blue-700 border-blue-200';
      case 'banking':
        return 'bg-green-50 text-green-700 border-green-200';
      case 'engineering':
        return 'bg-orange-50 text-orange-700 border-orange-200';
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200';
    }
  }, []);

  // Enhanced name validation with real-time feedback
  const handleNameChange = useCallback(
    (value: string) => {
      form.updateField('displayName', value);

      const error = validateName(value);
      setValidationErrors(prev => ({
        ...prev,
        displayName: error ?? '',
      }));

      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'name_input', {
          length: value.length,
          has_error: !!error,
        });
      }
    },
    [form]
  );

  // Group exams by category with enhanced filtering
  const examsByCategory = useMemo(() => {
    const grouped: { [key: string]: Exam[] } = {};
    filteredExams.forEach(exam => {
      const category = exam.category.toLowerCase().replace(/\s+/g, '-');
      if (!grouped[category]) {
        grouped[category] = [];
      }
      grouped[category].push(exam);
    });
    return grouped;
  }, [filteredExams]);

  // Get exams for display with enhanced logic
  const displayExams = useMemo(() => {
    if (searchQuery) {
      return showAllExams ? filteredExams : filteredExams.slice(0, 8);
    }
    if (activeCategory && examsByCategory[activeCategory]) {
      return showAllExams ? examsByCategory[activeCategory] : examsByCategory[activeCategory].slice(0, 8);
    }
    return showAllExams ? filteredExams : filteredExams.slice(0, 12);
  }, [searchQuery, activeCategory, filteredExams, examsByCategory, showAllExams]);

  // Enhanced custom exam handler
  const handleCustomExam = useCallback(() => {
    try {
      // For custom exams in multi-select, we might need more complex logic
      // For now, custom acts as single select or primary replacement
      if (isMultiSelectMode) {
         // TODO: Add logic for custom course in multi-select (future enhancement)
         // Current constraint: Custom course replaces selection or adds as primary
         onExamSelect('custom');
      } else {
         onExamSelect('custom');
      }

      // Analytics
      if (typeof window !== 'undefined' && window.gtag) {
        window.gtag('event', 'custom_exam_selected', {
          event_category: 'onboarding',
          event_label: 'custom_exam',
        });
      }
    } catch (error) {
      console.error('Error selecting custom exam:', error);
    }
  }, [onExamSelect, isMultiSelectMode]);

  return (
    <div className="space-y-6" role="main" aria-labelledby="basic-info-title">
      {/* Enhanced Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-2 text-blue-600 mb-3">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
          <span className="text-sm font-medium">Step 1 of 4</span>
        </div>
        <h2 id="basic-info-title" className="text-2xl font-bold text-gray-900">
          Welcome! Let's get started
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Tell us your name and choose what you want to learn. We'll create a personalized study plan for you.
        </p>
      </div>

      {/* Name Input */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-blue-600" aria-hidden="true" />
            <Label htmlFor="display-name" className="text-lg font-semibold">
              What should we call you?
            </Label>
          </div>
          <div className="space-y-2">
            <Input
              id="display-name"
              value={form.data.displayName}
              onChange={e => handleNameChange(e.target.value)}
              placeholder="Enter your full name"
              className={`text-lg ${validationErrors.displayName ? 'border-red-300 focus:border-red-500' : ''}`}
              aria-describedby="name-error name-help"
              autoComplete="name"
            />
            <div id="name-help" className="text-sm text-gray-500">
              This will be used throughout your learning dashboard
            </div>
            {validationErrors.displayName && (
              <div id="name-error" className="flex items-center space-x-1 text-red-600 text-sm">
                <AlertCircle className="h-4 w-4" />
                <span>{validationErrors.displayName}</span>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Learning Path Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center space-x-2">
                <BookOpen className="h-5 w-5 text-blue-600" aria-hidden="true" />
                <Label className="text-lg font-semibold">What do you want to learn?</Label>
              </div>
              
              {/* Progressive Complexity Toggle */}
              {form.data.selectedExamId && !form.data.isCustomExam && (
                <Button 
                  variant="ghost" 
                  size="sm" 
                  className="text-blue-600 hover:text-blue-700 text-xs sm:text-sm"
                  onClick={() => setIsMultiSelectMode(!isMultiSelectMode)}
                >
                  {isMultiSelectMode ? 'Done selecting' : 'Selecting 1 course... Add another?'}
                </Button>
              )}
            </div>
            
            <p className="text-sm text-gray-600 mb-4">
              Choose your learning path. We'll provide a pre-structured curriculum that you can fully customize later.
            </p>

            {/* Selected Courses Chips (Multi-Select Mode) */}
            {form.data.selectedCourses && form.data.selectedCourses.length > 0 && (
              <div className="flex flex-wrap gap-2 mb-4 animate-in fade-in slide-in-from-top-2 duration-300">
                {form.data.selectedCourses.map((course, index) => (
                  <Badge 
                    key={course.examId} 
                    variant={index === 0 ? "default" : "secondary"}
                    className="pl-2 pr-1 py-1 text-sm flex items-center gap-1"
                  >
                    {course.examName}
                    {index === 0 && <Star className="h-3 w-3 fill-current text-yellow-300 ml-1" />}
                    {isMultiSelectMode && (
                      <button 
                        onClick={(e) => removeCourse(course.examId, e)}
                        className="hover:bg-black/10 rounded-full p-0.5 ml-1 transition-colors"
                      >
                        <X className="h-3 w-3" />
                      </button>
                    )}
                  </Badge>
                ))}
              </div>
            )}
          </div>

          {/* Enhanced Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
            <Input
              placeholder="Search for your learning path (e.g., UPSC, JEE, DevOps, SQL, Data Structures)..."
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search exams"
            />
            {searchQuery && (
              <Button variant="ghost" size="sm" className="absolute right-2 top-2" onClick={() => setSearchQuery('')}>
                Clear
              </Button>
            )}
          </div>

          {/* Popular Categories */}
          {!searchQuery && (
            <div className="mb-6">
              <Label className="text-sm font-medium mb-3 block">Popular Categories</Label>
              <div className="flex flex-wrap gap-2 -mx-1 px-1">
                {POPULAR_EXAM_CATEGORIES.filter(category => (examsByCategory[category.id]?.length || 0) > 0).map(category => (
                  <Button
                    key={category.id}
                    variant="outline"
                    size="sm"
                    onClick={() => setActiveCategory(category.id)}
                    className={`${getCategoryClasses(category.id, activeCategory === category.id)}`}
                  >
                    <category.icon className="h-4 w-4 mr-2" />
                    {category.name}
                    <span className="ml-1 text-xs">({category.count})</span>
                  </Button>
                ))}
              </div>

              {activeCategory && (
                <div className="mt-2 text-sm text-gray-600">
                  {POPULAR_EXAM_CATEGORIES.find(cat => cat.id === activeCategory)?.description}
                </div>
              )}
            </div>
          )}

          {/* Exam List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {searchQuery ? `Search Results (${filteredExams.length})` : 'Available Courses'}
              </Label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayExams.map(exam => {
                const isSelected = form.data.selectedCourses?.some(c => c.examId === exam.id);
                
                return (
                  <Card
                    key={exam.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md relative ${
                      isSelected 
                        ? 'ring-2 ring-blue-500 bg-blue-50' 
                        : 'hover:bg-gray-50'
                    }`}
                    onClick={() => handleExamClick(exam.id)}
                  >
                    {/* Multi-select Checkbox */}
                    {isMultiSelectMode && (
                      <div className="absolute top-3 right-3">
                         <Checkbox 
                           checked={isSelected} 
                           onCheckedChange={() => handleExamClick(exam.id)}
                           className="data-[state=checked]:bg-blue-600 data-[state=checked]:border-blue-600"
                         />
                      </div>
                    )}

                    <CardContent className="p-4">
                      <h3 className="font-semibold text-gray-900 mb-1 pr-6">{exam.name}</h3>
                      <p className="text-sm text-gray-600 mb-2 line-clamp-2">{exam.description}</p>
                      <div className="flex items-center justify-between text-xs text-gray-500">
                        <span>{exam.category}</span>
                        <span>{exam.defaultSyllabus.length} subjects</span>
                      </div>
                    </CardContent>
                  </Card>
                );
              })}

              {/* Custom Exam Option */}
              <Card
                className={`cursor-pointer transition-all duration-200 hover:shadow-md border-dashed ${
                  form.data.isCustomExam
                    ? 'ring-2 ring-blue-500 bg-blue-50 border-blue-300'
                    : 'border-gray-300 hover:bg-gray-50'
                }`}
                onClick={handleCustomExam}
              >
                <CardContent className="p-4 flex items-center justify-center min-h-[100px]">
                  <div className="text-center">
                    <Plus className="h-8 w-8 text-gray-400 mx-auto mb-2" />
                    <p className="font-medium text-gray-700">Create Custom Course</p>
                    <p className="text-sm text-gray-500">Build your own learning path</p>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Show More Button */}
            {!showAllExams && displayExams.length < filteredExams.length && (
              <Button variant="outline" onClick={() => setShowAllExams(true)} className="w-full">
                Show {filteredExams.length - displayExams.length} more courses
              </Button>
            )}

            {/* No Results */}
            {searchQuery && displayExams.length === 0 && (
              <div className="text-center py-8">
                <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 mb-2">No courses found for "{searchQuery}"</p>
                <p className="text-sm text-gray-500">Try different keywords or create a custom course</p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Custom Exam Details */}
      {form.data.isCustomExam && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Plus className="h-5 w-5 text-purple-600" aria-hidden="true" />
              <Label className="text-lg font-semibold text-purple-900">Custom Course Details</Label>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-name" className="text-sm font-medium">
                  Course Name *
                </Label>
                <Input
                  id="custom-name"
                  value={form.data.customExam?.name || ''}
                  onChange={e =>
                    form.updateField('customExam', {
                      ...(form.data.customExam || {}),
                      name: e.target.value,
                    })
                  }
                  placeholder="e.g., Advanced React Development"
                  className="mt-1"
                />
              </div>
              <div>
                <Label htmlFor="custom-description" className="text-sm font-medium">
                  Description
                </Label>
                <Textarea
                  id="custom-description"
                  value={form.data.customExam?.description || ''}
                  onChange={e =>
                    form.updateField('customExam', {
                      ...(form.data.customExam || {}),
                      description: e.target.value,
                    })
                  }
                  placeholder="Brief description of what you want to learn..."
                  className="mt-1"
                  rows={3}
                />
              </div>
            </div>

            <Alert className="mt-4 border-purple-200 bg-purple-50">
              <AlertCircle className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                You'll be able to add subjects and topics in the next steps. Our system will help you structure your
                learning path effectively.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Progress Summary */}
      {(selectedExam || (form.data.selectedCourses && form.data.selectedCourses.length > 0)) && form.data.displayName && !validationErrors.displayName && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="flex-shrink-0 w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                <User className="h-4 w-4 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-900 mb-1">Great start, {form.data.displayName}!</h3>
                <p className="text-sm text-gray-600 mb-2">
                  You've selected{' '}
                  <span className="font-medium">
                    {form.data.isCustomExam 
                      ? form.data.customExam?.name 
                      : form.data.selectedCourses && form.data.selectedCourses.length > 0
                        ? `${form.data.selectedCourses.length} course${form.data.selectedCourses.length > 1 ? 's' : ''}`
                        : selectedExam?.name
                    }
                  </span>
                  . Next, we'll understand your learning style and create a personalized schedule.
                </p>
                {!form.data.isCustomExam && selectedExam && (
                  <div className="text-xs text-gray-500">
                    {selectedExam.defaultSyllabus.length} subjects • Fully customizable
                  </div>
                )}
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Summary */}
      {(validationErrors.displayName || (!form.data.selectedExamId && (!form.data.selectedCourses || form.data.selectedCourses.length === 0))) && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-1">
              {validationErrors.displayName && <div>• {validationErrors.displayName}</div>}
              {(!form.data.selectedExamId && (!form.data.selectedCourses || form.data.selectedCourses.length === 0)) && <div>• Please select a learning path</div>}
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}
