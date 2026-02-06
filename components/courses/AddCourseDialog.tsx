'use client';

import { Timestamp } from 'firebase/firestore';
import { useState } from 'react';
import { Plus, Calendar, Target, Loader2 } from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useCourse, DEFAULT_COURSE_SETTINGS } from '@/contexts/CourseContext';
import { useToast } from '@/hooks/use-toast';
import { EXAMS_DATA } from '@/lib/data/exams-data';
import { CourseType } from '@/types/course-progress';

interface AddCourseDialogProps {
  trigger?: React.ReactNode;
  onSuccess?: (courseId: string) => void;
}

export function AddCourseDialog({ trigger, onSuccess }: AddCourseDialogProps) {
  const { addCourse, courses } = useCourse();
  const { toast } = useToast();
  
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Form state
  const [selectedExamId, setSelectedExamId] = useState<string>('');
  const [targetDate, setTargetDate] = useState<string>('');
  const [priority, setPriority] = useState<number>(2);

  // Get available exams that aren't already added
  const availableExams = EXAMS_DATA.filter(
    exam => !courses.some(course => course.courseId === exam.id)
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedExamId) {
      toast({
        title: 'Missing Selection',
        description: 'Please select an exam to add.',
        variant: 'destructive',
      });
      return;
    }

    setLoading(true);
    try {
      const selectedExam = EXAMS_DATA.find(e => e.id === selectedExamId);
      if (!selectedExam) throw new Error('Exam not found');

      const courseId = await addCourse({
        courseId: selectedExamId,
        courseName: selectedExam.name,
        courseType: (selectedExam.category || 'exam') as CourseType,
        status: 'active',
        isPrimary: courses.length === 0,
        settings: DEFAULT_COURSE_SETTINGS,
        ...(targetDate ? { targetDate: Timestamp.fromDate(new Date(targetDate)) } : {}),
      });

      toast({
        title: 'Course Added! 🎉',
        description: `${selectedExam.name} has been added to your courses.`,
      });

      // Reset form
      setSelectedExamId('');
      setTargetDate('');
      setPriority(2);
      setOpen(false);

      onSuccess?.(courseId);
    } catch (error) {
      console.error('Failed to add course:', error);
      toast({
        title: 'Failed to Add Course',
        description: 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  };

  const defaultTrigger = (
    <Button variant="outline" className="gap-2">
      <Plus className="h-4 w-4" />
      Add Course
    </Button>
  );

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || defaultTrigger}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Plus className="h-5 w-5 text-primary" />
            Add New Course
          </DialogTitle>
          <DialogDescription>
            Add another exam or certification to prepare for. You can switch between courses anytime.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 py-4">
          {/* Exam Selection */}
          <div className="space-y-2">
            <Label htmlFor="exam-select">Select Exam</Label>
            <Select value={selectedExamId} onValueChange={setSelectedExamId}>
              <SelectTrigger id="exam-select">
                <SelectValue placeholder="Choose an exam..." />
              </SelectTrigger>
              <SelectContent>
                {availableExams.length === 0 ? (
                  <div className="px-2 py-4 text-center text-sm text-muted-foreground">
                    All available exams have been added
                  </div>
                ) : (
                  availableExams.map((exam) => (
                    <SelectItem key={exam.id} value={exam.id}>
                      <div className="flex flex-col">
                        <span>{exam.name}</span>
                        <span className="text-xs text-muted-foreground">{exam.category}</span>
                      </div>
                    </SelectItem>
                  ))
                )}
              </SelectContent>
            </Select>
          </div>

          {/* Target Date */}
          <div className="space-y-2">
            <Label htmlFor="target-date" className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
              Target Exam Date (Optional)
            </Label>
            <Input
              id="target-date"
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              min={new Date().toISOString().split('T')[0]}
            />
          </div>

          {/* Priority */}
          <div className="space-y-2">
            <Label htmlFor="priority" className="flex items-center gap-2">
              <Target className="h-4 w-4 text-muted-foreground" />
              Priority Level
            </Label>
            <Select value={priority.toString()} onValueChange={(v) => setPriority(Number(v))}>
              <SelectTrigger id="priority">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">
                  <span className="flex items-center gap-2">
                    🔥 High Priority (Primary Focus)
                  </span>
                </SelectItem>
                <SelectItem value="2">
                  <span className="flex items-center gap-2">
                    ⭐ Medium Priority (Secondary)
                  </span>
                </SelectItem>
                <SelectItem value="3">
                  <span className="flex items-center gap-2">
                    📚 Low Priority (Long-term Goal)
                  </span>
                </SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => setOpen(false)}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading || !selectedExamId}>
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Course
                </>
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

export default AddCourseDialog;
