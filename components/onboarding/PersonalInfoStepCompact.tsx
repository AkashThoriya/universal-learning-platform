/**
 * @fileoverview Enhanced Personal Info Step - Premium UX Implementation
 *
 * A sophisticated personal information and exam selection component with:
 * - Advanced search and filtering capabilities
 * - Intelligent exam recommendations
 * - Enhanced accessibility and validation
 * - Real-time form feedback
 * - Mobile-optimized interface
 *
 * @author Exam Strategy Engine Team
 * @version 3.0.0
 */

import {
  User,
  Search,
  Calendar,
  BookOpen,
  Plus,
  CheckCircle,
  Clock,
  Users,
  TrendingUp,
  AlertCircle,
  Star,
  X,
  Info
} from 'lucide-react';
import React, { useState, useMemo, useCallback } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip';
import { UseFormReturn } from '@/hooks/useForm';
import { Exam } from '@/types/exam';

/**
 * Props for personal info step
 */
interface PersonalInfoStepProps {
  form: UseFormReturn<any>;
  filteredExams: Exam[];
  searchQuery: string;
  setSearchQuery: (query: string) => void;
  onExamSelect: (examId: string) => void;
  selectedExam: Exam | null;
}

/**
 * Enhanced popular exam categories with metadata
 */
const POPULAR_CATEGORIES = [
  { 
    id: 'civil-services', 
    name: 'Civil Services', 
    icon: Users, 
    count: 15, 
    color: 'bg-blue-50 text-blue-700 border-blue-200',
    description: 'UPSC, State PCS, and other administrative services'
  },
  { 
    id: 'banking', 
    name: 'Banking', 
    icon: TrendingUp, 
    count: 12, 
    color: 'bg-green-50 text-green-700 border-green-200',
    description: 'Bank PO, Clerk, and financial service exams'
  },
  { 
    id: 'engineering', 
    name: 'Engineering', 
    icon: BookOpen, 
    count: 8, 
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    description: 'JEE, GATE, and technical competitive exams'
  },
  { 
    id: 'medical', 
    name: 'Medical', 
    icon: Plus, 
    count: 6, 
    color: 'bg-red-50 text-red-700 border-red-200',
    description: 'NEET, AIIMS, and medical entrance exams'
  }
];

/**
 * Form validation helper
 */
const validateName = (name: string): string | null => {
  if (!name || name.length < 2) return 'Name must be at least 2 characters long';
  if (name.length > 50) return 'Name must be less than 50 characters';
  if (!/^[a-zA-Z\s]+$/.test(name)) return 'Name can only contain letters and spaces';
  return null;
};

const validateExamDate = (date: string): string | null => {
  if (!date) return 'Please select your exam date';
  
  const examDate = new Date(date);
  const today = new Date();
  const minDate = new Date(today.getTime() + 7 * 24 * 60 * 60 * 1000); // 7 days from now
  
  if (examDate < minDate) {
    return 'Exam date must be at least 7 days from today';
  }
  
  const maxDate = new Date(today.getTime() + 2 * 365 * 24 * 60 * 60 * 1000); // 2 years from now
  if (examDate > maxDate) {
    return 'Please select a more realistic exam date (within 2 years)';
  }
  
  return null;
};

/**
 * Enhanced personal info step component
 */
export function PersonalInfoStepCompact({
  form,
  filteredExams,
  searchQuery,
  setSearchQuery,
  onExamSelect,
  selectedExam
}: PersonalInfoStepProps) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [showAllExams, setShowAllExams] = useState(false);
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({});
  const [showExamDetails] = useState<string | null>(null);

  // Enhanced name validation with real-time feedback
  const handleNameChange = useCallback((value: string) => {
    form.updateField('displayName', value);
    
    const error = validateName(value);
    setValidationErrors(prev => ({
      ...prev,
      displayName: error || ''
    }));

    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'name_input', {
        length: value.length,
        has_error: !!error
      });
    }
  }, [form]);

  // Enhanced exam date validation
  const handleDateChange = useCallback((value: string) => {
    form.updateField('examDate', value);
    
    const error = validateExamDate(value);
    setValidationErrors(prev => ({
      ...prev,
      examDate: error || ''
    }));

    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag && value) {
      const examDate = new Date(value);
      const today = new Date();
      const daysToExam = Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      (window as any).gtag('event', 'exam_date_selected', {
        days_to_exam: daysToExam,
        exam_id: form.data.selectedExamId
      });
    }
  }, [form]);

  // Group exams by category with enhanced filtering
  const examsByCategory = useMemo(() => {
    const grouped: { [key: string]: Exam[] } = {};
    filteredExams.forEach(exam => {
      const category = exam.category.toLowerCase().replace(/\s+/g, '-');
      if (!grouped[category]) grouped[category] = [];
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
    onExamSelect('custom');
    
    // Analytics
    if (typeof window !== 'undefined' && (window as any).gtag) {
      (window as any).gtag('event', 'custom_exam_selected', {
        source: 'manual_selection'
      });
    }
  }, [onExamSelect]);

  // Calculate min date (7 days from now)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 7);
  const minDateString = minDate.toISOString().split('T')[0];

  // Calculate max date (2 years from now)
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 2);
  const maxDateString = maxDate.toISOString().split('T')[0];

  return (
    <div className="space-y-6" role="main" aria-labelledby="personal-info-title">
      {/* Enhanced Header */}
      <div className="text-center space-y-3">
        <div className="flex items-center justify-center space-x-2 text-blue-600 mb-3">
          <BookOpen className="h-6 w-6" aria-hidden="true" />
          <span className="text-sm font-medium">Step 2 of 4</span>
        </div>
        <h2 id="personal-info-title" className="text-2xl font-bold text-gray-900">
          Set up your exam goals
        </h2>
        <p className="text-gray-600 max-w-lg mx-auto">
          Tell us about yourself and choose your target exam to create a personalized study plan
        </p>
      </div>

      {/* Enhanced Name Input with Validation */}
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
              onChange={(e) => handleNameChange(e.target.value)}
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

      {/* Enhanced Exam Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center space-x-2">
              <BookOpen className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <Label className="text-lg font-semibold">Which exam are you preparing for?</Label>
            </div>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button variant="ghost" size="sm">
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Choose the exam you're targeting. We'll customize everything accordingly.</p>
              </TooltipContent>
            </Tooltip>
          </div>

          {/* Enhanced Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" aria-hidden="true" />
            <Input
              placeholder="Search for your exam (e.g., UPSC, JEE, NEET)..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
              aria-label="Search exams"
            />
            {searchQuery && (
              <Button
                variant="ghost"
                size="sm"
                className="absolute right-2 top-2 p-1 h-auto"
                onClick={() => setSearchQuery('')}
                aria-label="Clear search"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>

          {/* Enhanced Popular Categories */}
          {!searchQuery && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-3">
                <Label className="text-sm font-medium">Popular Categories</Label>
                <Badge variant="outline" className="text-xs">
                  {filteredExams.length} total exams
                </Badge>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                {POPULAR_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  const examCount = examsByCategory[category.id]?.length || 0;
                  
                  return (
                    <Card
                      key={category.id}
                      className={`cursor-pointer transition-all duration-200 hover:shadow-md border ${
                        isActive 
                          ? `${category.color} shadow-md transform scale-105` 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => setActiveCategory(isActive ? null : category.id)}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isActive}
                    >
                      <CardContent className="p-4 text-center">
                        <Icon className="h-6 w-6 mx-auto mb-2" />
                        <h3 className="font-medium text-sm mb-1">{category.name}</h3>
                        <p className="text-xs text-gray-600 mb-2 line-clamp-2">{category.description}</p>
                        <Badge variant="secondary" className="text-xs">
                          {examCount} exams
                        </Badge>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
              
              {activeCategory && (
                <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    Showing {displayExams.length} exams in {POPULAR_CATEGORIES.find(c => c.id === activeCategory)?.name}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Enhanced Exam List */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <Label className="text-sm font-medium">
                {searchQuery ? `Search Results (${filteredExams.length})` : 
                 activeCategory ? `${POPULAR_CATEGORIES.find(c => c.id === activeCategory)?.name} Exams` :
                 'Available Exams'}
              </Label>
              {displayExams.length < filteredExams.length && (
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setShowAllExams(!showAllExams)}
                  className="text-blue-600"
                >
                  {showAllExams ? 'Show Less' : `Show All (${filteredExams.length})`}
                </Button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {displayExams.map((exam) => {
                const isSelected = form.data.selectedExamId === exam.id;
                return (
                  <Card
                    key={exam.id}
                    className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 group ${
                      isSelected
                        ? 'border-blue-500 bg-blue-50 shadow-lg ring-2 ring-blue-200'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => onExamSelect(exam.id)}
                    role="button"
                    tabIndex={0}
                    aria-pressed={isSelected}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className="font-semibold text-gray-900">{exam.name}</h3>
                            {exam.category === 'Popular' && (
                              <Star className="h-4 w-4 text-yellow-500" fill="currentColor" />
                            )}
                          </div>
                          <p className="text-sm text-gray-600 mb-3 line-clamp-2">{exam.description}</p>
                          <div className="flex items-center space-x-2">
                            <Badge variant="outline" className="text-xs">
                              {exam.category}
                            </Badge>
                            {exam.defaultSyllabus && (
                              <Badge variant="secondary" className="text-xs">
                                {exam.defaultSyllabus.length} subjects
                              </Badge>
                            )}
                          </div>
                        </div>
                        {isSelected && (
                          <CheckCircle className="h-6 w-6 text-blue-600 ml-2 flex-shrink-0" />
                        )}
                      </div>
                      
                      {/* Show more details on hover/selection */}
                      {(isSelected || showExamDetails === exam.id) && exam.stages && (
                        <div className="mt-3 pt-3 border-t border-gray-200">
                          <p className="text-xs text-gray-600 mb-1">Exam Structure:</p>
                          <div className="flex flex-wrap gap-1">
                            {exam.stages.slice(0, 3).map((stage, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {stage.name}
                              </Badge>
                            ))}
                            {exam.stages.length > 3 && (
                              <Badge variant="outline" className="text-xs">
                                +{exam.stages.length - 3} more
                              </Badge>
                            )}
                          </div>
                        </div>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>

            {/* Custom Exam Option */}
            <div className="border-t pt-4">
              <Card
                className="cursor-pointer border-dashed border-2 border-gray-300 hover:border-blue-400 hover:bg-blue-50/50 transition-all duration-200"
                onClick={handleCustomExam}
                role="button"
                tabIndex={0}
              >
                <CardContent className="p-6 text-center">
                  <Plus className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                  <h3 className="font-medium text-gray-700 mb-2">Create Custom Exam</h3>
                  <p className="text-sm text-gray-600 mb-3">
                    Don't see your exam? Create a custom one with your own syllabus
                  </p>
                  <Badge variant="outline">Fully Customizable</Badge>
                </CardContent>
              </Card>
            </div>

            {/* No results state */}
            {searchQuery && displayExams.length === 0 && (
              <div className="text-center py-8">
                <Search className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="font-medium text-gray-900 mb-2">No exams found</h3>
                <p className="text-gray-600 mb-4">
                  We couldn't find any exams matching "{searchQuery}"
                </p>
                <Button onClick={handleCustomExam} variant="outline">
                  Create Custom Exam Instead
                </Button>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Enhanced Exam Date */}
      {form.data.selectedExamId && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" aria-hidden="true" />
              <Label htmlFor="exam-date" className="text-lg font-semibold">
                When is your exam?
              </Label>
            </div>
            <div className="space-y-4">
              <div className="space-y-2">
                <Input
                  id="exam-date"
                  type="date"
                  value={form.data.examDate}
                  onChange={(e) => handleDateChange(e.target.value)}
                  min={minDateString}
                  max={maxDateString}
                  className={`text-lg ${validationErrors.examDate ? 'border-red-300 focus:border-red-500' : ''}`}
                  aria-describedby="date-error date-help"
                />
                <div id="date-help" className="text-sm text-gray-500">
                  Select a date at least 7 days from today
                </div>
                {validationErrors.examDate && (
                  <div id="date-error" className="flex items-center space-x-1 text-red-600 text-sm">
                    <AlertCircle className="h-4 w-4" />
                    <span>{validationErrors.examDate}</span>
                  </div>
                )}
              </div>
              
              {form.data.examDate && !validationErrors.examDate && (
                <div className="flex items-center space-x-2 text-sm bg-blue-50 p-3 rounded-lg">
                  <Clock className="h-4 w-4 text-blue-600" />
                  <span className="text-blue-800">
                    {(() => {
                      const examDate = new Date(form.data.examDate);
                      const today = new Date();
                      const diffTime = examDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays < 30) {
                        return `${diffDays} days to prepare - Intensive mode recommended`;
                      } else if (diffDays < 180) {
                        const months = Math.floor(diffDays / 30);
                        return `${months} month${months > 1 ? 's' : ''} to prepare - Perfect timeline`;
                      } else {
                        const months = Math.floor(diffDays / 30);
                        return `${months} months to prepare - Comprehensive preparation possible`;
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Custom Exam Details */}
      {form.data.isCustomExam && (
        <Card className="border-purple-200 bg-gradient-to-r from-purple-50 to-pink-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Plus className="h-5 w-5 text-purple-600" aria-hidden="true" />
              <Label className="text-lg font-semibold text-purple-800">
                Custom Exam Details
              </Label>
            </div>
            <div className="space-y-4">
              <div>
                <Label htmlFor="custom-exam-name" className="text-sm font-medium mb-2 block">
                  Exam Name *
                </Label>
                <Input
                  id="custom-exam-name"
                  value={form.data.customExam?.name || ''}
                  onChange={(e) => form.updateField('customExam', {
                    ...form.data.customExam,
                    name: e.target.value
                  })}
                  placeholder="e.g., State PCS, Company Entrance Test, Professional Certification"
                  className="bg-white"
                  required
                />
              </div>
              <div>
                <Label htmlFor="custom-exam-category" className="text-sm font-medium mb-2 block">
                  Category
                </Label>
                <Input
                  id="custom-exam-category"
                  value={form.data.customExam?.category || ''}
                  onChange={(e) => form.updateField('customExam', {
                    ...form.data.customExam,
                    category: e.target.value
                  })}
                  placeholder="e.g., State Services, Private Sector, Certification"
                  className="bg-white"
                />
              </div>
              <div>
                <Label htmlFor="custom-exam-description" className="text-sm font-medium mb-2 block">
                  Description (Optional)
                </Label>
                <Input
                  id="custom-exam-description"
                  value={form.data.customExam?.description || ''}
                  onChange={(e) => form.updateField('customExam', {
                    ...form.data.customExam,
                    description: e.target.value
                  })}
                  placeholder="Brief description of the exam"
                  className="bg-white"
                />
              </div>
            </div>
            
            <Alert className="mt-4 border-purple-200 bg-purple-50">
              <Info className="h-4 w-4 text-purple-600" />
              <AlertDescription className="text-purple-800">
                You'll be able to create a custom syllabus in the next step. We'll help you organize 
                subjects based on your specific exam requirements.
              </AlertDescription>
            </Alert>
          </CardContent>
        </Card>
      )}

      {/* Enhanced Success Summary */}
      {selectedExam && form.data.examDate && !validationErrors.examDate && form.data.displayName && !validationErrors.displayName && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 via-blue-50 to-purple-50">
          <CardContent className="p-6">
            <div className="flex items-start space-x-3">
              <div className="bg-green-100 p-2 rounded-full">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-green-800 mb-3">
                  Excellent! Your exam setup is complete
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-1">Candidate</h4>
                    <p className="text-gray-700">{form.data.displayName}</p>
                  </div>
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-1">Target Exam</h4>
                    <p className="text-gray-700">
                      {selectedExam?.name || form.data.customExam?.name}
                    </p>
                    {(selectedExam?.category || form.data.customExam?.category) && (
                      <Badge variant="outline" className="mt-1 text-xs">
                        {selectedExam?.category || form.data.customExam?.category}
                      </Badge>
                    )}
                  </div>
                  <div className="bg-white/70 p-3 rounded-lg">
                    <h4 className="font-medium text-gray-800 mb-1">Exam Date</h4>
                    <p className="text-gray-700">
                      {new Date(form.data.examDate).toLocaleDateString('en-US', { 
                        year: 'numeric', 
                        month: 'long', 
                        day: 'numeric' 
                      })}
                    </p>
                    <p className="text-sm text-gray-600">
                      {(() => {
                        const examDate = new Date(form.data.examDate);
                        const today = new Date();
                        const diffTime = examDate.getTime() - today.getTime();
                        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                        return `${diffDays} days away`;
                      })()}
                    </p>
                  </div>
                </div>
                
                <p className="text-green-700">
                  Perfect! We'll now create a personalized study strategy for {selectedExam?.name || form.data.customExam?.name} 
                  with your exam scheduled for{' '}
                  <strong>
                    {new Date(form.data.examDate).toLocaleDateString('en-US', { 
                      year: 'numeric', 
                      month: 'long', 
                      day: 'numeric' 
                    })}
                  </strong>.
                  {selectedExam?.defaultSyllabus && (
                    <span> We'll start with {selectedExam.defaultSyllabus.length} core subjects that you can customize.</span>
                  )}
                </p>
              </div>
            </div>
            
            <div className="flex items-center justify-center pt-4 border-t border-green-200 mt-4">
              <Badge className="bg-green-600 text-white px-4 py-2">
                ✨ Ready to organize your syllabus
              </Badge>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Validation Summary */}
      {(validationErrors.displayName || validationErrors.examDate || (!form.data.selectedExamId)) && (
        <Alert className="border-amber-200 bg-amber-50">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800">
            <div className="space-y-1">
              <p className="font-medium">Please complete the following:</p>
              <ul className="list-disc list-inside space-y-1 text-sm">
                {validationErrors.displayName && <li>Enter a valid name</li>}
                {!form.data.selectedExamId && <li>Select your target exam</li>}
                {validationErrors.examDate && <li>Set a valid exam date</li>}
                {form.data.isCustomExam && !form.data.customExam?.name && <li>Enter custom exam name</li>}
              </ul>
            </div>
          </AlertDescription>
        </Alert>
      )}
    </div>
  );
}

// Export the original component name for compatibility
export const PersonalInfoStep = PersonalInfoStepCompact;
