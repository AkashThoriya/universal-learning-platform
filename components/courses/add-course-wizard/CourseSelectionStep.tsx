'use client';

import { useState } from 'react';
import { Search } from 'lucide-react';
import { EXAMS_DATA } from '@/lib/data/exams-data';
import { useCourse } from '@/contexts/CourseContext';
import { WizardData } from './WizardContainer';
import { cn } from '@/lib/utils/utils';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';

interface CourseSelectionStepProps {
  data: WizardData;
  onSelect: (exam: typeof EXAMS_DATA[0]) => void;
}

export function CourseSelectionStep({ data, onSelect }: CourseSelectionStepProps) {
  const { courses } = useCourse();
  const [searchQuery, setSearchQuery] = useState('');

  // Filter out already added courses AND match search query
  const availableExams = EXAMS_DATA.filter(exam => {
    const notAdded = !courses.some(course => course.courseId === exam.id);
    const matchesSearch = exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (exam.category || '').toLowerCase().includes(searchQuery.toLowerCase());
    return notAdded && matchesSearch;
  });

  return (
    <div className="space-y-6">
      <div className="text-center max-w-2xl mx-auto mb-6">
        <h2 className="text-2xl font-bold text-gray-900">What are you preparing for?</h2>
        <p className="text-muted-foreground mt-2">
          Select your target exam or skill track. We'll tailor the strategy to match its syllabus and difficulty.
        </p>
      </div>

      {/* Search Bar - Matching BasicInfoStep Style */}
      <div className="relative max-w-md mx-auto mb-6">
        <div className="relative">
          <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
          <Input
            placeholder="Search exams, skills, or categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10"
          />
        </div>
      </div>

      {/* Scrollable Grid */}
      <div className="h-[400px] overflow-y-auto p-1 pr-2 custom-scrollbar">
        {availableExams.length === 0 ? (
          <div className="text-center p-12 bg-slate-50 rounded-xl border border-dashed border-slate-300 h-full flex flex-col items-center justify-center">
            <div className="w-12 h-12 bg-slate-100 rounded-full flex items-center justify-center mb-3 text-slate-400 mx-auto">
              <Search className="w-6 h-6" />
            </div>
            <p className="text-muted-foreground">
              {searchQuery ? `No exams found matching "${searchQuery}"` : "All available exams are already in your library."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3 pb-4">
            {availableExams.map((exam) => {
              const isSelected = data.selectedExamId === exam.id;

              return (
                <Card
                  key={exam.id}
                  className={cn(
                    "cursor-pointer transition-all duration-200 hover:shadow-md relative",
                    isSelected
                      ? "ring-2 ring-blue-500 bg-blue-50"
                      : "hover:bg-gray-50"
                  )}
                  onClick={() => onSelect(exam)}
                >
                  <CardContent className="p-4">
                    <h3 className="font-semibold text-gray-900 mb-1 pr-6">{exam.name}</h3>
                    <p className="text-sm text-gray-600 mb-2 line-clamp-2">{exam.description || `Comprehensive prep for ${exam.name}`}</p>
                    <div className="flex items-center justify-between text-xs text-gray-500">
                      <span>{exam.category || 'Exam'}</span>
                      <span>{exam.defaultSyllabus ? exam.defaultSyllabus.length : 0} subjects</span>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
