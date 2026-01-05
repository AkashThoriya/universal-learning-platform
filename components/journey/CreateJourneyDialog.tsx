'use client';

import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Loader2, Plus } from 'lucide-react';

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
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { journeyService } from '@/lib/services/journey-service';
import { CreateJourneyRequest } from '@/types/journey';

const createJourneySchema = z.object({
  title: z.string().min(3, 'Title must be at least 3 characters'),
  description: z.string().min(10, 'Description must be at least 10 characters'),
  targetCompletionDate: z.string().refine((val) => {
    const date = new Date(val);
    return date > new Date();
  }, 'Completion date must be in the future'),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
});

type CreateJourneyFormValues = z.infer<typeof createJourneySchema>;

interface CreateJourneyDialogProps {
  userId: string;
  onJourneyCreated: () => void;
  trigger?: React.ReactNode;
}

export function CreateJourneyDialog({ userId, onJourneyCreated, trigger }: CreateJourneyDialogProps) {
  const [open, setOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const { toast } = useToast();

  const form = useForm<CreateJourneyFormValues>({
    resolver: zodResolver(createJourneySchema),
    defaultValues: {
      title: '',
      description: '',
      targetCompletionDate: '',
      priority: 'medium',
    },
  });

  const onSubmit = async (data: CreateJourneyFormValues) => {
    setIsSubmitting(true);
    try {
      const request: CreateJourneyRequest = {
        title: data.title,
        description: data.description,
        targetCompletionDate: new Date(data.targetCompletionDate),
        priority: data.priority,
        track: 'certification', // Default track for custom journeys
        customGoals: [], // Empty goals for now, user can add later
      };

      const result = await journeyService.createJourney(userId, request);

      if (result.success) {
        toast({
          title: 'Journey Created',
          description: 'Your new learning journey has been started successfully.',
        });
        setOpen(false);
        form.reset();
        onJourneyCreated();
      } else {
        throw new Error(result.error?.message || 'Failed to create journey');
      }
    } catch (error) {
      toast({
        title: 'Error',
        description: error instanceof Error ? error.message : 'Something went wrong',
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger || (
          <Button className="flex items-center gap-2">
            <Plus className="h-4 w-4" />
            New Journey
          </Button>
        )}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Create New Journey</DialogTitle>
          <DialogDescription>
            Start a new learning path. Plan your goals and set a timeline.
          </DialogDescription>
        </DialogHeader>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="title"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Journey Title</FormLabel>
                  <FormControl>
                    <Input placeholder="e.g., Mastering React Native" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea 
                      placeholder="What are your goals for this journey?" 
                      className="resize-none" 
                      {...field} 
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="grid grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="targetCompletionDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target Date</FormLabel>
                    <FormControl>
                      <Input type="date" min={new Date().toISOString().split('T')[0]} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="priority"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Priority</FormLabel>
                    <Select onValueChange={field.onChange} defaultValue={field.value}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select priority" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="low">Low</SelectItem>
                        <SelectItem value="medium">Medium</SelectItem>
                        <SelectItem value="high">High</SelectItem>
                        <SelectItem value="critical">Critical</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <DialogFooter className="pt-4">
              <Button type="button" variant="outline" onClick={() => setOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Create Journey
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
