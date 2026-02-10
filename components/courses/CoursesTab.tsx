'use client';

import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { BookOpen, Plus, Trash2, Crown, Clock, Target, Loader2 } from 'lucide-react';
import { useState } from 'react';


import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { useCourse } from '@/contexts/CourseContext';
import { useToast } from '@/hooks/use-toast';
import { cn } from '@/lib/utils/utils';

export function CoursesTab() {
  const { 
    courses, 
    activeCourseId, 
    switchCourse, 
    archiveCourse, 
    isLoading 
  } = useCourse();
  const { toast } = useToast();
  
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [switching, setSwitching] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);

  const handleSetPrimary = async (courseId: string) => {
    if (courseId === activeCourseId || switching) return;
    
    setSwitching(courseId);
    try {
      await switchCourse(courseId);
      toast({
        title: 'Primary Course Updated',
        description: 'Your active course has been switched.',
      });
    } catch (error) {
      console.error('Failed to switch course:', error);
      toast({
        title: 'Error',
        description: 'Failed to switch course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSwitching(null);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (!archiveCourse) return;
    
    setDeleting(true);
    try {
      await archiveCourse(courseId);
      toast({
        title: 'Course Archived',
        description: 'The course has been archived and can be restored later.',
      });
      setDeleteConfirmId(null);
    } catch (error) {
      console.error('Failed to archive course:', error);
      toast({
        title: 'Error',
        description: 'Failed to archive course. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setDeleting(false);
    }
  };

  const formatDate = (date: Timestamp | Date | undefined) => {
    if (!date) return 'Not set';
    try {
      const d = (date as any).toDate ? (date as any).toDate() : new Date(date as any);
      return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'Invalid date';
    }
  };

  const getDaysUntil = (date: Timestamp | Date | undefined): number | null => {
    if (!date) return null;
    try {
      const d = (date as any).toDate ? (date as any).toDate() : new Date(date as any);
      const diff = d.getTime() - Date.now();
      return Math.ceil(diff / (1000 * 60 * 60 * 24));
    } catch {
      return null;
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-12">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <Card className="border-none shadow-md overflow-hidden bg-white/50 backdrop-blur-sm">
        <CardHeader className="bg-gradient-to-r from-blue-600/5 to-indigo-600/5 pb-6">
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-gray-800">
                <BookOpen className="h-6 w-6 text-blue-600" />
                <span>My Courses</span>
              </CardTitle>
              <CardDescription className="text-gray-500 mt-1">
                Manage your exam preparations. Switch between courses anytime.
              </CardDescription>
            </div>
            <Link href="/courses/add">
              <Button size="sm" className="gap-2 bg-blue-600 hover:bg-blue-700 shadow-sm transition-all hover:shadow-md">
                <Plus className="h-4 w-4" />
                Add Course
              </Button>
            </Link>
          </div>
        </CardHeader>
        <CardContent className="p-6">
          {courses.length === 0 ? (
            <div className="text-center py-12 px-4 rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/50 flex flex-col items-center">
              <div className="bg-white p-4 rounded-full shadow-sm mb-4">
                <BookOpen className="h-8 w-8 text-blue-400" />
              </div>
              <h3 className="font-semibold text-gray-900 mb-1 text-lg">No courses yet</h3>
              <p className="text-gray-500 mb-6 max-w-sm">
                Start your journey by adding your first exam or course to track progress and get personalized plans.
              </p>
              <Link href="/courses/add">
                <Button size="default" className="gap-2 px-6">
                  <Plus className="h-4 w-4" />
                  Add Your First Course
                </Button>
              </Link>
            </div>
          ) : (
              <div className="grid grid-cols-1 gap-4">
              {courses.map((course) => {
                const isPrimary = course.courseId === activeCourseId;
                const daysLeft = getDaysUntil(course.targetDate);
                
                return (
                  <div 
                    key={course.courseId} 
                    className={cn(
                      'group relative rounded-xl border transition-all duration-200 overflow-hidden',
                      isPrimary
                        ? 'bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200 shadow-md ring-1 ring-blue-100'
                        : 'bg-white border-gray-100 hover:border-gray-200 hover:shadow-sm'
                    )}
                  >
                    {isPrimary && (
                      <div className="absolute top-0 right-0 p-3">
                        <Badge variant="default" className="bg-blue-600 hover:bg-blue-700 text-white gap-1.5 px-3 py-1 shadow-sm">
                          <Crown className="h-3.5 w-3.5" />
                          Active Focus
                        </Badge>
                      </div>
                    )}

                    <div className="p-5 flex flex-col md:flex-row md:items-center gap-5">
                      {/* Icon Container */}
                      <div className={cn(
                        "h-14 w-14 rounded-2xl flex items-center justify-center shrink-0 shadow-sm text-2xl font-bold",
                        isPrimary ? "bg-white text-blue-600 shadow-blue-100" : "bg-gray-100 text-gray-500"
                      )}>
                        {course.courseName.charAt(0).toUpperCase()}
                      </div>

                      {/* Content */}
                      <div className="flex-1 min-w-0 space-y-2">
                        <div>
                          <h4 className={cn(
                            "font-bold text-lg truncate",
                            isPrimary ? "text-blue-900" : "text-gray-900"
                          )}>
                            {course.courseName}
                          </h4>
                          <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                            <span className="capitalize">{course.courseType}</span>
                            <span className="h-1 w-1 rounded-full bg-gray-300" />
                            <span>Student</span>
                          </p>
                        </div>

                        <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-sm">
                          <div className="flex items-center gap-2 text-gray-600 bg-white/60 px-2 py-1 rounded-md border border-transparent hover:border-gray-200 transition-colors">
                            <Target className="h-4 w-4 text-blue-500" />
                            <span className="font-medium text-gray-900">Target:</span>
                            <span>{formatDate(course.targetDate)}</span>
                          </div>

                          {daysLeft !== null && daysLeft > 0 && (
                            <div className="flex items-center gap-2 text-gray-600 bg-white/60 px-2 py-1 rounded-md border border-transparent hover:border-gray-200 transition-colors">
                              <Clock className="h-4 w-4 text-orange-500" />
                              <span className="font-medium text-gray-900">{daysLeft}</span>
                              <span>days remaining</span>
                            </div>
                          )}
                        </div>
                      </div>
                      
                      {/* Actions */}
                      <div className={cn(
                        "flex items-center gap-3 md:border-l md:pl-6 md:my-1 transition-opacity",
                        "border-gray-200/50"
                      )}>
                        {!isPrimary ? (
                          <>
                            <Button
                              variant="outline"
                              onClick={() => handleSetPrimary(course.courseId)}
                              disabled={switching === course.courseId}
                              className="flex-1 md:flex-none border-blue-200 text-blue-700 hover:bg-blue-50 hover:text-blue-800 hover:border-blue-300"
                            >
                              {switching === course.courseId ? (
                                <>
                                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                                  Switching...
                                </>
                              ) : (
                                'Set Active'
                              )}
                            </Button>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="text-gray-400 hover:text-red-600 hover:bg-red-50"
                              onClick={() => setDeleteConfirmId(course.courseId)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </>
                        ) : (
                          <div className="hidden md:flex flex-col items-end gap-1 opacity-60">
                            <span className="text-xs font-medium text-green-600 flex items-center gap-1">
                              <span className="relative flex h-2 w-2">
                                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-75"></span>
                                <span className="relative inline-flex rounded-full h-2 w-2 bg-green-500"></span>
                              </span>
                              Currently Active
                            </span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Delete Confirmation Dialog */}
      <Dialog open={!!deleteConfirmId} onOpenChange={(open) => !open && setDeleteConfirmId(null)}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-red-600">
              <Trash2 className="h-5 w-5" />
              Archive Course?
            </DialogTitle>
            <DialogDescription className="pt-2">
              This will archive the course from your active list. Your progress data will be preserved and you can restore it later from settings.
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0 mt-4">
            <Button variant="outline" onClick={() => setDeleteConfirmId(null)}>
              Cancel
            </Button>
            <Button 
              variant="destructive" 
              onClick={() => deleteConfirmId && handleDelete(deleteConfirmId)}
              disabled={deleting}
              className="bg-red-600 hover:bg-red-700"
            >
              {deleting ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Archiving...
                </>
              ) : (
                'Archive Course'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CoursesTab;
