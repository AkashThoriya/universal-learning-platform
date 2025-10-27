'use client';

import { motion, AnimatePresence } from 'framer-motion';
import {
  Plus,
  Target,
  Clock,
  TrendingUp,
  CheckCircle2,
  Circle,
  Edit3,
  Trash2,
  Calendar,
  BarChart3,
  AlertCircle,
  Trophy,
  Flag,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils';
import { JourneyGoal, UserJourney } from '@/types/journey';

interface GoalManagementProps {
  journey: UserJourney;
  onUpdateGoal?: (goalId: string, updates: Partial<JourneyGoal>) => void;
  onAddGoal?: (goal: Omit<JourneyGoal, 'id' | 'currentValue'>) => void;
  onDeleteGoal?: (goalId: string) => void;
  className?: string;
}

interface GoalFormData {
  title: string;
  description: string;
  targetValue: number;
  unit: JourneyGoal['unit'];
  category: JourneyGoal['category'];
  deadline: string;
  linkedSubjects: string[];
  autoUpdateFrom: JourneyGoal['autoUpdateFrom'];
}

export default function GoalManagement({
  journey,
  onUpdateGoal,
  onAddGoal,
  onDeleteGoal,
  className,
}: GoalManagementProps) {
  const [showAddGoal, setShowAddGoal] = useState(false);
  const [editingGoal, setEditingGoal] = useState<JourneyGoal | null>(null);
  const [formData, setFormData] = useState<GoalFormData>({
    title: '',
    description: '',
    targetValue: 100,
    unit: 'percentage',
    category: 'knowledge',
    deadline: '',
    linkedSubjects: [],
    autoUpdateFrom: 'manual',
  });

  const resetForm = () => {
    setFormData({
      title: '',
      description: '',
      targetValue: 100,
      unit: 'percentage',
      category: 'knowledge',
      deadline: '',
      linkedSubjects: [],
      autoUpdateFrom: 'manual',
    });
  };

  const handleAddGoal = () => {
    if (!formData.title.trim()) {
      return;
    }

    const newGoal: Omit<JourneyGoal, 'id' | 'currentValue'> = {
      title: formData.title,
      description: formData.description,
      targetValue: formData.targetValue,
      unit: formData.unit,
      category: formData.category,
      deadline: new Date(formData.deadline),
      linkedSubjects: formData.linkedSubjects,
      linkedTopics: [],
      autoUpdateFrom: formData.autoUpdateFrom,
      isSpecific: true,
      isMeasurable: true,
      isAchievable: true,
      isRelevant: true,
      isTimeBound: !!formData.deadline,
    };

    onAddGoal?.(newGoal);
    setShowAddGoal(false);
    resetForm();
  };

  const handleEditGoal = (goal: JourneyGoal) => {
    setEditingGoal(goal);

    const formatDateForInput = (date: Date): string => {
      const isoString = date.toISOString();
      const parts = isoString.split('T');
      return parts[0] ?? '';
    };

    const deadlineValue =
      goal.deadline instanceof Date ? formatDateForInput(goal.deadline) : formatDateForInput(new Date());

    setFormData({
      title: goal.title,
      description: goal.description,
      targetValue: goal.targetValue,
      unit: goal.unit,
      category: goal.category,
      deadline: deadlineValue,
      linkedSubjects: goal.linkedSubjects,
      autoUpdateFrom: goal.autoUpdateFrom,
    });
  };

  const handleUpdateGoal = () => {
    if (!editingGoal || !formData.title.trim()) {
      return;
    }

    const updates: Partial<JourneyGoal> = {
      title: formData.title,
      description: formData.description,
      targetValue: formData.targetValue,
      unit: formData.unit,
      category: formData.category,
      deadline: new Date(formData.deadline),
      linkedSubjects: formData.linkedSubjects,
      autoUpdateFrom: formData.autoUpdateFrom,
      isTimeBound: !!formData.deadline,
    };

    onUpdateGoal?.(editingGoal.id, updates);
    setEditingGoal(null);
    resetForm();
  };

  const getGoalProgress = (goal: JourneyGoal) => {
    return Math.min((goal.currentValue / goal.targetValue) * 100, 100);
  };

  const isGoalCompleted = (goal: JourneyGoal) => {
    return goal.currentValue >= goal.targetValue;
  };

  const isGoalOverdue = (goal: JourneyGoal) => {
    return goal.deadline && new Date() > goal.deadline && !isGoalCompleted(goal);
  };

  const getCategoryIcon = (category: JourneyGoal['category']) => {
    switch (category) {
      case 'knowledge':
        return <Target className="h-4 w-4" />;
      case 'skill':
        return <TrendingUp className="h-4 w-4" />;
      case 'speed':
        return <Clock className="h-4 w-4" />;
      case 'accuracy':
        return <BarChart3 className="h-4 w-4" />;
      case 'consistency':
        return <Flag className="h-4 w-4" />;
      default:
        return <Target className="h-4 w-4" />;
    }
  };

  const getCategoryColor = (category: JourneyGoal['category']) => {
    switch (category) {
      case 'knowledge':
        return 'text-blue-600 bg-blue-100';
      case 'skill':
        return 'text-green-600 bg-green-100';
      case 'speed':
        return 'text-yellow-600 bg-yellow-100';
      case 'accuracy':
        return 'text-purple-600 bg-purple-100';
      case 'consistency':
        return 'text-orange-600 bg-orange-100';
      default:
        return 'text-gray-600 bg-gray-100';
    }
  };

  const getUnitDisplay = (value: number, unit: JourneyGoal['unit']) => {
    switch (unit) {
      case 'percentage':
        return `${value}%`;
      case 'hours':
        return `${value}h`;
      case 'topics':
        return `${value} topics`;
      case 'tests':
        return `${value} tests`;
      case 'projects':
        return `${value} projects`;
      default:
        return value.toString();
    }
  };

  const completedGoals = journey.customGoals.filter(isGoalCompleted);
  const overdueGoals = journey.customGoals.filter(isGoalOverdue);

  return (
    <div className={cn('space-y-6', className)}>
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">Goals Management</h3>
          <p className="text-sm text-gray-600">Track and manage your learning objectives for this journey</p>
        </div>
        <Dialog open={showAddGoal} onOpenChange={setShowAddGoal}>
          <DialogTrigger asChild>
            <Button onClick={() => resetForm()}>
              <Plus className="h-4 w-4 mr-2" />
              Add Goal
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>Add New Goal</DialogTitle>
              <DialogDescription>Create a new learning goal for your journey</DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <Label htmlFor="title">Goal Title</Label>
                <Input
                  id="title"
                  value={formData.title}
                  onChange={e => setFormData({ ...formData, title: e.target.value })}
                  placeholder="e.g., Complete all practice tests"
                />
              </div>
              <div>
                <Label htmlFor="description">Description</Label>
                <Textarea
                  id="description"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                  placeholder="Describe what this goal involves..."
                  rows={3}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="targetValue">Target Value</Label>
                  <Input
                    id="targetValue"
                    type="number"
                    value={formData.targetValue}
                    onChange={e => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                  />
                </div>
                <div>
                  <Label htmlFor="unit">Unit</Label>
                  <Select
                    value={formData.unit}
                    onValueChange={(value: JourneyGoal['unit']) => setFormData({ ...formData, unit: value })}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="percentage">Percentage</SelectItem>
                      <SelectItem value="hours">Hours</SelectItem>
                      <SelectItem value="topics">Topics</SelectItem>
                      <SelectItem value="tests">Tests</SelectItem>
                      <SelectItem value="projects">Projects</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <Label htmlFor="category">Category</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value: JourneyGoal['category']) => setFormData({ ...formData, category: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="knowledge">Knowledge</SelectItem>
                    <SelectItem value="skill">Skill</SelectItem>
                    <SelectItem value="speed">Speed</SelectItem>
                    <SelectItem value="accuracy">Accuracy</SelectItem>
                    <SelectItem value="consistency">Consistency</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <Label htmlFor="deadline">Deadline</Label>
                <Input
                  id="deadline"
                  type="date"
                  value={formData.deadline}
                  onChange={e => setFormData({ ...formData, deadline: e.target.value })}
                />
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setShowAddGoal(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddGoal}>Add Goal</Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* Goals Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Total Goals</p>
                <p className="text-2xl font-bold text-gray-900">{journey.customGoals.length}</p>
              </div>
              <Target className="h-8 w-8 text-blue-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Completed</p>
                <p className="text-2xl font-bold text-green-600">{completedGoals.length}</p>
              </div>
              <Trophy className="h-8 w-8 text-green-500" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-gray-600">Overdue</p>
                <p className="text-2xl font-bold text-red-600">{overdueGoals.length}</p>
              </div>
              <AlertCircle className="h-8 w-8 text-red-500" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        <AnimatePresence>
          {journey.customGoals.map((goal, index) => (
            <motion.div
              key={goal.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ delay: index * 0.1 }}
            >
              <Card
                className={cn(
                  'transition-all duration-200 hover:shadow-md',
                  isGoalCompleted(goal) && 'bg-green-50 border-green-200',
                  isGoalOverdue(goal) && 'bg-red-50 border-red-200'
                )}
              >
                <CardContent className="pt-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-start gap-3 flex-1 min-w-0">
                      <div className="mt-0.5">
                        {isGoalCompleted(goal) ? (
                          <CheckCircle2 className="h-5 w-5 text-green-600" />
                        ) : (
                          <Circle className="h-5 w-5 text-gray-400" />
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-2">
                          <h4
                            className={cn(
                              'font-medium truncate',
                              isGoalCompleted(goal) ? 'text-green-800 line-through' : 'text-gray-900'
                            )}
                          >
                            {goal.title}
                          </h4>
                          <Badge className={cn('text-xs', getCategoryColor(goal.category))}>
                            <div className="flex items-center gap-1">
                              {getCategoryIcon(goal.category)}
                              {goal.category}
                            </div>
                          </Badge>
                        </div>
                        {goal.description && <p className="text-sm text-gray-600 mb-3">{goal.description}</p>}

                        {/* Progress Bar */}
                        <div className="space-y-2">
                          <div className="flex items-center justify-between text-sm">
                            <span className="text-gray-600">Progress</span>
                            <span className="font-medium">
                              {getUnitDisplay(goal.currentValue, goal.unit)} /{' '}
                              {getUnitDisplay(goal.targetValue, goal.unit)}
                            </span>
                          </div>
                          <Progress
                            value={getGoalProgress(goal)}
                            className={cn('h-2', isGoalCompleted(goal) && 'bg-green-100')}
                          />
                        </div>

                        {/* Goal Metadata */}
                        <div className="flex items-center gap-4 mt-3 text-xs text-gray-500">
                          {goal.deadline && (
                            <div className="flex items-center gap-1">
                              <Calendar className="h-3 w-3" />
                              <span>Due: {goal.deadline.toLocaleDateString()}</span>
                            </div>
                          )}
                          {isGoalOverdue(goal) && <Badge className="bg-red-100 text-red-700 text-xs">Overdue</Badge>}
                          {goal.autoUpdateFrom !== 'manual' && (
                            <Badge variant="outline" className="text-xs">
                              Auto-sync: {goal.autoUpdateFrom}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Goal Actions */}
                    <div className="flex items-center gap-1 ml-4">
                      <Button variant="ghost" size="sm" onClick={() => handleEditGoal(goal)} className="h-8 w-8 p-0">
                        <Edit3 className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => onDeleteGoal?.(goal.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </AnimatePresence>

        {journey.customGoals.length === 0 && (
          <Card className="border-dashed">
            <CardContent className="pt-8 pb-8 text-center">
              <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h4 className="text-lg font-medium text-gray-900 mb-2">No Goals Yet</h4>
              <p className="text-gray-600 mb-4">
                Add your first learning goal to start tracking progress on this journey.
              </p>
              <Button onClick={() => setShowAddGoal(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Goal
              </Button>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Goal Dialog */}
      <Dialog open={!!editingGoal} onOpenChange={open => !open && setEditingGoal(null)}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Edit Goal</DialogTitle>
            <DialogDescription>Update your learning goal details</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-title">Goal Title</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={e => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Description</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={e => setFormData({ ...formData, description: e.target.value })}
                rows={3}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="edit-targetValue">Target Value</Label>
                <Input
                  id="edit-targetValue"
                  type="number"
                  value={formData.targetValue}
                  onChange={e => setFormData({ ...formData, targetValue: Number(e.target.value) })}
                />
              </div>
              <div>
                <Label htmlFor="edit-unit">Unit</Label>
                <Select
                  value={formData.unit}
                  onValueChange={(value: JourneyGoal['unit']) => setFormData({ ...formData, unit: value })}
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="percentage">Percentage</SelectItem>
                    <SelectItem value="hours">Hours</SelectItem>
                    <SelectItem value="topics">Topics</SelectItem>
                    <SelectItem value="tests">Tests</SelectItem>
                    <SelectItem value="projects">Projects</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-deadline">Deadline</Label>
              <Input
                id="edit-deadline"
                type="date"
                value={formData.deadline}
                onChange={e => setFormData({ ...formData, deadline: e.target.value })}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={() => setEditingGoal(null)}>
                Cancel
              </Button>
              <Button onClick={handleUpdateGoal}>Update Goal</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
