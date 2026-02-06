'use client';

import { ChevronDown, BookOpen, Plus, Check } from 'lucide-react';
import { useState } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { useCourse } from '@/contexts/CourseContext';
import { cn } from '@/lib/utils/utils';

interface CourseSwitcherProps {
  className?: string;
  variant?: 'default' | 'compact';
  showAddCourse?: boolean;
  onAddCourseClick?: () => void;
}

export function CourseSwitcher({
  className,
  variant = 'default',
  showAddCourse = true,
  onAddCourseClick,
}: CourseSwitcherProps) {
  const { 
    courses, 
    activeCourseId, 
    activeCourse, 
    switchCourse, 
    isLoading 
  } = useCourse();
  
  const [open, setOpen] = useState(false);
  const [switching, setSwitching] = useState(false);

  const handleCourseSelect = async (courseId: string) => {
    if (courseId === activeCourseId || switching) return;
    
    setSwitching(true);
    try {
      await switchCourse(courseId);
      setOpen(false);
    } finally {
      setSwitching(false);
    }
  };

  // Don't render if no courses or still loading
  if (isLoading || courses.length === 0) {
    return null;
  }

  // Compact variant for mobile bottom nav
  if (variant === 'compact') {
    return (
      <DropdownMenu open={open} onOpenChange={setOpen} modal={false}>
        <DropdownMenuTrigger asChild>
          <Button 
            variant="ghost" 
            size="sm"
            className={cn(
              'h-8 gap-1.5 px-2 text-xs font-medium',
              'bg-primary/5 hover:bg-primary/10',
              className
            )}
            disabled={switching}
          >
            <BookOpen className="h-3.5 w-3.5" />
            <span className="max-w-[100px] truncate">
              {activeCourse?.courseName || 'Select Course'}
            </span>
            <ChevronDown className="h-3 w-3 opacity-50" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="center" className="w-56">
          {courses.map((course) => (
            <DropdownMenuItem
              key={course.courseId}
              onClick={() => handleCourseSelect(course.courseId)}
              className="flex items-center justify-between"
            >
              <span className="truncate">{course.courseName}</span>
              {course.courseId === activeCourseId && (
                <Check className="h-4 w-4 text-primary" />
              )}
            </DropdownMenuItem>
          ))}
          {showAddCourse && (
            <>
              <DropdownMenuSeparator />
              <DropdownMenuItem onClick={onAddCourseClick}>
                <Plus className="h-4 w-4 mr-2" />
                Add New Course
              </DropdownMenuItem>
            </>
          )}
        </DropdownMenuContent>
      </DropdownMenu>
    );
  }

  // Default variant for desktop navigation
  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button 
          variant="outline" 
          className={cn(
            'justify-between gap-2 min-w-[180px] max-w-[240px]',
            'bg-white/50 backdrop-blur-sm border-border/50',
            'hover:bg-white/80 hover:border-primary/30',
            className
          )}
          disabled={switching}
        >
          <div className="flex items-center gap-2 min-w-0">
            <BookOpen className="h-4 w-4 text-primary shrink-0" />
            <span className="truncate font-medium">
              {activeCourse?.courseName || 'Select Course'}
            </span>
          </div>
          <ChevronDown className={cn(
            'h-4 w-4 shrink-0 opacity-50 transition-transform',
            open && 'rotate-180'
          )} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent 
        align="start" 
        className="w-[240px]"
        sideOffset={4}
      >
        <div className="px-2 py-1.5 text-xs font-medium text-muted-foreground">
          Your Courses
        </div>
        {courses.map((course) => (
          <DropdownMenuItem
            key={course.courseId}
            onClick={() => handleCourseSelect(course.courseId)}
            className={cn(
              'flex items-center justify-between cursor-pointer',
              course.courseId === activeCourseId && 'bg-primary/5'
            )}
          >
            <div className="flex flex-col gap-0.5 min-w-0">
              <span className="font-medium truncate">{course.courseName}</span>
              {course.targetDate && (
                <span className="text-xs text-muted-foreground">
                  Target: {new Date((course.targetDate as any).toDate?.() || course.targetDate).toLocaleDateString()}
                </span>
              )}
            </div>
            {course.courseId === activeCourseId && (
              <Check className="h-4 w-4 text-primary shrink-0" />
            )}
          </DropdownMenuItem>
        ))}
        {showAddCourse && (
          <>
            <DropdownMenuSeparator />
            <DropdownMenuItem 
              onClick={onAddCourseClick}
              className="text-primary cursor-pointer"
            >
              <Plus className="h-4 w-4 mr-2" />
              Add New Course
            </DropdownMenuItem>
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

export default CourseSwitcher;
