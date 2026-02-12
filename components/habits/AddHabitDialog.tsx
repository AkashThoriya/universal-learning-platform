'use client';

import { motion } from 'framer-motion';
import {
  BookOpen,
  Brain,
  Star,
  Flame,
  Check,
  Sparkles,
  Info,
  type LucideIcon,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { cn } from '@/lib/utils/utils';
import type { CreateHabitInput, Frequency, MetricType } from '@/types/habit';

// Available icons for habits
const ICON_OPTIONS: { name: string; icon: LucideIcon; label: string }[] = [
  { name: 'Star', icon: Star, label: 'Star' },
  { name: 'BookOpen', icon: BookOpen, label: 'Study' },
  { name: 'Brain', icon: Brain, label: 'Think' },
  { name: 'Flame', icon: Flame, label: 'Fire' },
  { name: 'Check', icon: Check, label: 'Check' },
  { name: 'Sparkles', icon: Sparkles, label: 'Sparkle' },
];

interface AddHabitDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (input: CreateHabitInput) => Promise<void>;
}

export function AddHabitDialog({ open, onOpenChange, onSubmit }: AddHabitDialogProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [frequency, setFrequency] = useState<Frequency>('DAILY');
  const [metricType, setMetricType] = useState<MetricType>('BOOLEAN');
  const [targetValue, setTargetValue] = useState(1);
  const [selectedIcon, setSelectedIcon] = useState('Star');
  const [submitting, setSubmitting] = useState(false);

  const resetForm = () => {
    setTitle('');
    setDescription('');
    setFrequency('DAILY');
    setMetricType('BOOLEAN');
    setTargetValue(1);
    setSelectedIcon('Star');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setSubmitting(true);
    try {
      const input: CreateHabitInput = {
        title: title.trim(),
        frequency,
        metricType,
        targetValue: metricType === 'BOOLEAN' ? 1 : targetValue,
        icon: selectedIcon,
      };
      const trimmedDesc = description.trim();
      if (trimmedDesc) {
        input.description = trimmedDesc;
      }
      await onSubmit(input);
      resetForm();
      onOpenChange(false);
    } finally {
      setSubmitting(false);
    }
  };

  const SelectedIconComponent = ICON_OPTIONS.find((i) => i.name === selectedIcon)?.icon ?? Star;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[480px]">
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40">
                <Sparkles className="h-4 w-4 text-orange-600 dark:text-orange-400" />
              </div>
              Create Custom Habit
            </DialogTitle>
            <DialogDescription>
              Build a habit that matters to you. Pick an icon and set how you want to track it.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Live Preview Card */}
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
              <Card className="bg-gradient-to-r from-slate-50 to-slate-100/50 dark:from-slate-900/50 dark:to-slate-800/30 border-dashed">
                <CardContent className="p-3 flex items-center gap-3">
                  <div className="flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br from-orange-100 to-amber-100 dark:from-orange-900/40 dark:to-amber-900/40 shrink-0">
                    <SelectedIconComponent className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-sm truncate">
                      {title.trim() || 'Your Habit Title'}
                    </p>
                    <p className="text-xs text-muted-foreground truncate">
                      {description.trim() || 'Description'}
                    </p>
                  </div>
                  <Badge variant="outline" className="shrink-0 text-[10px]">
                    {frequency === 'DAILY' ? 'Daily' : 'Weekly'}
                  </Badge>
                </CardContent>
              </Card>
            </motion.div>

            {/* Icon Picker */}
            <div className="grid gap-2">
              <Label className="text-xs">Icon</Label>
              <div className="flex gap-2">
                {ICON_OPTIONS.map((opt) => {
                  const Icon = opt.icon;
                  return (
                    <button
                      key={opt.name}
                      type="button"
                      onClick={() => setSelectedIcon(opt.name)}
                      className={cn(
                        'flex flex-col items-center gap-1 p-2 rounded-lg transition-all duration-200 flex-1',
                        selectedIcon === opt.name
                          ? 'bg-orange-100 ring-2 ring-orange-400 dark:bg-orange-900/40 dark:ring-orange-700'
                          : 'bg-muted/50 hover:bg-muted'
                      )}
                    >
                      <Icon className={cn(
                        'h-4 w-4',
                        selectedIcon === opt.name
                          ? 'text-orange-600 dark:text-orange-400'
                          : 'text-muted-foreground'
                      )} />
                      <span className="text-[10px] text-muted-foreground">{opt.label}</span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Title */}
            <div className="grid gap-2">
              <Label htmlFor="habit-title" className="text-xs">Title</Label>
              <Input
                id="habit-title"
                placeholder="e.g., Read Editorial, Practice DSA"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                maxLength={50}
                required
                className="h-9"
              />
            </div>

            {/* Description */}
            <div className="grid gap-2">
              <Label htmlFor="habit-desc" className="text-xs">
                Description <span className="text-muted-foreground">(optional)</span>
              </Label>
              <Input
                id="habit-desc"
                placeholder="Brief note about this habit"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                maxLength={100}
                className="h-9"
              />
            </div>

            {/* Frequency & Metric in a row */}
            <div className="grid grid-cols-2 gap-3">
              <div className="grid gap-2">
                <Label className="text-xs">Frequency</Label>
                <Select value={frequency} onValueChange={(v) => setFrequency(v as Frequency)}>
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="DAILY">Daily</SelectItem>
                    <SelectItem value="WEEKLY">Weekly</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid gap-2">
                <div className="flex items-center gap-2">
                  <Label className="text-xs">Metric Type</Label>
                  <TooltipProvider>
                    <Tooltip delayDuration={300}>
                      <TooltipTrigger asChild>
                        <Info className="h-3.5 w-3.5 text-muted-foreground cursor-help" />
                      </TooltipTrigger>
                      <TooltipContent side="right" className="max-w-[200px] text-xs space-y-2 p-3">
                        <p><strong>Yes / No:</strong> Simple done or not done (e.g., "Wake up early")</p>
                        <p><strong>Counter:</strong> Track specific numbers (e.g., "Drink 8 glasses of water")</p>
                        <p><strong>Minutes:</strong> Track duration (e.g., "Read for 30 minutes")</p>
                      </TooltipContent>
                    </Tooltip>
                  </TooltipProvider>
                </div>
                <Select
                  value={metricType}
                  onValueChange={(v) => {
                    setMetricType(v as MetricType);
                    if (v === 'BOOLEAN') setTargetValue(1);
                  }}
                >
                  <SelectTrigger className="h-9">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="BOOLEAN">Yes / No</SelectItem>
                    <SelectItem value="COUNT">Counter</SelectItem>
                    <SelectItem value="DURATION">Minutes</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Target Value (only for COUNT / DURATION) */}
            {metricType !== 'BOOLEAN' && (
              <motion.div
                initial={{ opacity: 0, height: 0 }}
                animate={{ opacity: 1, height: 'auto' }}
                exit={{ opacity: 0, height: 0 }}
                className="grid gap-2"
              >
                <Label htmlFor="habit-target" className="text-xs">
                  Target {metricType === 'DURATION' ? '(minutes per day)' : '(count per day)'}
                </Label>
                <Input
                  id="habit-target"
                  type="number"
                  min={1}
                  max={999}
                  value={targetValue}
                  onChange={(e) => setTargetValue(Math.max(1, parseInt(e.target.value) || 1))}
                  className="h-9"
                />
              </motion.div>
            )}
          </div>

          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} size="sm">
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={!title.trim() || submitting}
              size="sm"
              className="bg-gradient-to-r from-orange-500 to-amber-500 hover:from-orange-600 hover:to-amber-600 text-white shadow-sm"
            >
              {submitting ? 'Creating...' : 'Create Habit'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
