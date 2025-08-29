/**
 * @fileoverview Compact Personal Info Step - Streamlined UX
 *
 * A more compact and user-friendly personal information and exam selection step
 * with better visual hierarchy and reduced cognitive load.
 *
 * @author Exam Strategy Engine Team
 * @version 2.0.0
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
  TrendingUp
} from 'lucide-react';
import React, { useState, useMemo } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
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
 * Popular exam categories for quick access
 */
const POPULAR_CATEGORIES = [
  { id: 'civil-services', name: 'Civil Services', icon: Users, count: 15 },
  { id: 'banking', name: 'Banking', icon: TrendingUp, count: 12 },
  { id: 'engineering', name: 'Engineering', icon: BookOpen, count: 8 },
  { id: 'medical', name: 'Medical', icon: Plus, count: 6 }
];

/**
 * Streamlined personal info and exam selection step
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

  // Group exams by category
  const examsByCategory = useMemo(() => {
    const grouped: { [key: string]: Exam[] } = {};
    filteredExams.forEach(exam => {
      const category = exam.category.toLowerCase().replace(/\s+/g, '-');
      if (!grouped[category]) grouped[category] = [];
      grouped[category].push(exam);
    });
    return grouped;
  }, [filteredExams]);

  // Get exams for active category or search results
  const displayExams = useMemo(() => {
    if (searchQuery) {
      return filteredExams.slice(0, 6);
    }
    if (activeCategory && examsByCategory[activeCategory]) {
      return examsByCategory[activeCategory].slice(0, 6);
    }
    return filteredExams.slice(0, 8);
  }, [searchQuery, activeCategory, filteredExams, examsByCategory]);

  // Handle custom exam selection
  const handleCustomExam = () => {
    onExamSelect('custom');
  };

  // Calculate min date (tomorrow)
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 1);
  const minDateString = minDate.toISOString().split('T')[0];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center space-x-2 text-blue-600 mb-2">
          <BookOpen className="h-5 w-5" />
          <span className="text-sm font-medium">Exam Setup</span>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">Let's set up your exam goals</h2>
        <p className="text-gray-600">Choose your target exam and set your timeline</p>
      </div>

      {/* Name Input */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <User className="h-5 w-5 text-blue-600" />
            <Label className="text-lg font-semibold">What should we call you?</Label>
          </div>
          <Input
            value={form.data.displayName}
            onChange={(e) => form.updateField('displayName', e.target.value)}
            placeholder="Enter your name"
            className="text-lg"
          />
        </CardContent>
      </Card>

      {/* Exam Selection */}
      <Card>
        <CardContent className="p-6">
          <div className="flex items-center space-x-2 mb-4">
            <BookOpen className="h-5 w-5 text-blue-600" />
            <Label className="text-lg font-semibold">Which exam are you preparing for?</Label>
          </div>

          {/* Search */}
          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search for your exam..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Popular Categories */}
          {!searchQuery && (
            <div className="mb-4">
              <Label className="text-sm font-medium mb-2 block">Popular Categories</Label>
              <div className="flex flex-wrap gap-2">
                {POPULAR_CATEGORIES.map((category) => {
                  const Icon = category.icon;
                  const isActive = activeCategory === category.id;
                  return (
                    <Button
                      key={category.id}
                      variant={isActive ? "default" : "outline"}
                      size="sm"
                      onClick={() => setActiveCategory(isActive ? null : category.id)}
                      className="flex items-center space-x-2"
                    >
                      <Icon className="h-4 w-4" />
                      <span>{category.name}</span>
                      <Badge variant="secondary" className="ml-1">
                        {category.count}
                      </Badge>
                    </Button>
                  );
                })}
              </div>
            </div>
          )}

          {/* Exam List */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
            {displayExams.map((exam) => {
              const isSelected = form.data.selectedExamId === exam.id;
              return (
                <Card
                  key={exam.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-md border-2 ${
                    isSelected
                      ? 'border-blue-500 bg-blue-50 shadow-lg'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => onExamSelect(exam.id)}
                >
                  <CardContent className="p-4">
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 mb-1">{exam.name}</h3>
                        <p className="text-sm text-gray-600 mb-2 line-clamp-2">{exam.description}</p>
                        <Badge variant="outline" className="text-xs">
                          {exam.category}
                        </Badge>
                      </div>
                      {isSelected && (
                        <CheckCircle className="h-5 w-5 text-blue-600 ml-2 flex-shrink-0" />
                      )}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {/* Custom Exam Option */}
          <div className="border-t pt-4">
            <Button
              variant="outline"
              onClick={handleCustomExam}
              className="w-full flex items-center justify-center space-x-2 border-dashed"
            >
              <Plus className="h-4 w-4" />
              <span>Create Custom Exam</span>
            </Button>
          </div>

          {/* Show more exams */}
          {!searchQuery && !activeCategory && filteredExams.length > 8 && (
            <div className="text-center mt-4">
              <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                View all {filteredExams.length} exams
              </Button>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Exam Date */}
      {form.data.selectedExamId && (
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Calendar className="h-5 w-5 text-blue-600" />
              <Label className="text-lg font-semibold">When is your exam?</Label>
            </div>
            <div className="space-y-4">
              <Input
                type="date"
                value={form.data.examDate}
                onChange={(e) => form.updateField('examDate', e.target.value)}
                min={minDateString}
                className="text-lg"
              />
              {form.data.examDate && (
                <div className="flex items-center space-x-2 text-sm text-gray-600">
                  <Clock className="h-4 w-4" />
                  <span>
                    {(() => {
                      const examDate = new Date(form.data.examDate);
                      const today = new Date();
                      const diffTime = examDate.getTime() - today.getTime();
                      const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
                      
                      if (diffDays < 30) {
                        return `${diffDays} days to prepare`;
                      } else if (diffDays < 365) {
                        const months = Math.floor(diffDays / 30);
                        return `${months} month${months > 1 ? 's' : ''} to prepare`;
                      } else {
                        const years = Math.floor(diffDays / 365);
                        const remainingMonths = Math.floor((diffDays % 365) / 30);
                        return `${years} year${years > 1 ? 's' : ''} ${remainingMonths > 0 ? `${remainingMonths} month${remainingMonths > 1 ? 's' : ''}` : ''} to prepare`;
                      }
                    })()}
                  </span>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Custom Exam Details */}
      {form.data.isCustomExam && (
        <Card className="border-purple-200 bg-purple-50/30">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-4">
              <Plus className="h-5 w-5 text-purple-600" />
              <Label className="text-lg font-semibold">Custom Exam Details</Label>
            </div>
            <div className="space-y-4">
              <div>
                <Label className="text-sm font-medium mb-2 block">Exam Name</Label>
                <Input
                  value={form.data.customExam?.name || ''}
                  onChange={(e) => form.updateField('customExam', {
                    ...form.data.customExam,
                    name: e.target.value
                  })}
                  placeholder="e.g., State PCS, Company Entrance Test"
                />
              </div>
              <div>
                <Label className="text-sm font-medium mb-2 block">Category</Label>
                <Input
                  value={form.data.customExam?.category || ''}
                  onChange={(e) => form.updateField('customExam', {
                    ...form.data.customExam,
                    category: e.target.value
                  })}
                  placeholder="e.g., State Services, Private Sector"
                />
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Selected Exam Summary */}
      {selectedExam && form.data.examDate && (
        <Card className="border-green-200 bg-gradient-to-r from-green-50 to-blue-50">
          <CardContent className="p-6">
            <div className="flex items-center space-x-2 mb-3">
              <CheckCircle className="h-5 w-5 text-green-600" />
              <Label className="text-lg font-semibold text-green-800">Perfect! You're ready for the next step</Label>
            </div>
            <p className="text-green-700">
              We'll create a personalized study plan for <strong>{selectedExam.name}</strong> with your exam date set for{' '}
              <strong>{new Date(form.data.examDate).toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}</strong>.
            </p>
          </CardContent>
        </Card>
      )}
    </div>
  );
}

// Export the original component name for compatibility
export const PersonalInfoStep = PersonalInfoStepCompact;
