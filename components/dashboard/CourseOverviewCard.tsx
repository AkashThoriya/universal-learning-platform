'use client';

import { BookOpen, Calendar, Plus, Target } from 'lucide-react';


import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { CourseSwitcher } from '@/components/courses/CourseSwitcher';
import { useCourse } from '@/contexts/CourseContext';
import Link from 'next/link';

interface CourseOverviewCardProps {
  className?: string;
  onContinue?: () => void;
}

export function CourseOverviewCard({ onContinue }: CourseOverviewCardProps) {
  const { activeCourse, isLoading, activeProgress } = useCourse();

  if (isLoading) {
    return null;
  }

  // If no course is selected, show empty state or prompt
  if (!activeCourse) {
    return (
      <Card className="bg-gradient-to-r from-blue-600 to-indigo-600 text-white border-0 shadow-lg overflow-hidden relative">
        <div className="absolute top-0 right-0 -mt-10 -mr-10 h-32 w-32 rounded-full bg-white/10 blur-2xl" />
        <CardContent className="p-6 relative z-10 flex items-center justify-between">
          <div>
            <h3 className="text-lg font-bold mb-1">No Course Selected</h3>
            <p className="text-blue-100 text-sm">Select a course to start tracking your progress</p>
          </div>
          <div className="flex bg-white/20 rounded-lg p-1">
            <CourseSwitcher />
          </div>
        </CardContent>
      </Card>
    );
  }

  const progressValue = activeProgress?.overallProgress || 0;

  return (
    <Card className="bg-white dark:bg-gray-800 border-l-4 border-l-blue-600 shadow-sm overflow-hidden hover:shadow-md transition-shadow">
      <CardContent className="p-0">
        <div className="flex flex-col md:flex-row md:items-center">
          {/* Main Course Info Section */}
          <div className="p-5 flex-1 md:border-r border-gray-100 dark:border-gray-700">
            <div className="flex items-start justify-between mb-4">
              <div>
                <p className="text-xs font-semibold text-blue-600 dark:text-blue-400 uppercase tracking-wider mb-1">
                  Active Course
                </p>
                <div className="flex items-center gap-2">
                  <h3 className="text-xl font-bold text-gray-900 dark:text-white">
                    {activeCourse.courseName}
                  </h3>
                  {/* Role removed as it's not in schema yet */}


                </div>
              </div>
              <div className="flex-shrink-0">
                <CourseSwitcher showAddCourse={true} variant="compact" className="bg-gray-100 dark:bg-gray-700 hover:bg-gray-200" />
              </div>
            </div>

            <div className="flex items-center gap-6 text-sm text-gray-600 dark:text-gray-400">
              <div className="flex items-center gap-1.5">
                <Target className="h-4 w-4 text-gray-400" />
                <span>Goal: <span className="font-medium text-gray-900 dark:text-gray-200">2026 Attempt</span></span>
              </div>
              <div className="flex items-center gap-1.5">
                <Calendar className="h-4 w-4 text-gray-400" />
                <span>Target: <span className="font-medium text-gray-900 dark:text-gray-200">
                  {activeCourse.targetDate ? activeCourse.targetDate.toDate().toLocaleDateString() : 'Not set'}
                </span></span>
              </div>
            </div>
          </div>

          {/* Quick Stats / Action Section */}
          <div className="p-5 md:w-80 bg-gray-50 dark:bg-gray-800/50 flex flex-col justify-center">
            <div className="flex justify-between items-end mb-2">
              <span className="text-sm font-medium text-gray-600 dark:text-gray-300">Overall Progress</span>
              <span className="text-lg font-bold text-blue-600">{Math.round(progressValue)}%</span>
            </div>
            <Progress value={progressValue} className="h-2 mb-4" />

            <div className="flex gap-2">
              <Link href="/courses/add" className="w-full">
                  <Button variant="outline" size="sm" className="w-full text-xs font-medium">
                    <Plus className="h-3.5 w-3.5 mr-1.5" />
                    Add Course
                  </Button>
              </Link>
              <Button
                variant="default"
                size="sm"
                className="w-full text-xs font-medium bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                onClick={onContinue}
                disabled={!onContinue}
              >
                <BookOpen className="h-3.5 w-3.5 mr-1.5" />
                Continue
              </Button>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
