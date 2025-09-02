/**
 * @fileoverview Custom Learning Goals Onboarding Step
 *
 * Allows users to set up their custom learning goals during onboarding
 * for the Universal Learning Platform functionality.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

'use client';

import { motion } from 'framer-motion';
import { Plus, Target, BookOpen, Trash2, Edit } from 'lucide-react';
import React, { useState } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { UseFormReturn } from '@/hooks/useForm';

/**
 * Custom Learning Goal structure for onboarding
 */
interface CustomLearningGoal {
  id: string;
  title: string;
  description: string;
  category: string;
  targetValue: number;
  unit: string;
  priority: 'high' | 'medium' | 'low';
}

/**
 * Available learning categories
 */
const LEARNING_CATEGORIES = [
  { value: 'technology', label: 'Technology & Programming' },
  { value: 'language', label: 'Languages' },
  { value: 'business', label: 'Business & Finance' },
  { value: 'creative', label: 'Creative Arts' },
  { value: 'health', label: 'Health & Fitness' },
  { value: 'science', label: 'Science & Research' },
  { value: 'personal', label: 'Personal Development' },
  { value: 'other', label: 'Other' },
];

/**
 * Common learning units
 */
const LEARNING_UNITS = [
  { value: 'hours', label: 'Hours' },
  { value: 'days', label: 'Days' },
  { value: 'weeks', label: 'Weeks' },
  { value: 'lessons', label: 'Lessons' },
  { value: 'projects', label: 'Projects' },
  { value: 'chapters', label: 'Chapters' },
  { value: 'exercises', label: 'Exercises' },
];

interface CustomLearningStepProps {
  form: UseFormReturn<any>;
}

/**
 * Custom Learning Goals Step Component
 */
export function CustomLearningStep({ form }: CustomLearningStepProps) {
  const [goals, setGoals] = useState<CustomLearningGoal[]>(
    form.data.customLearningGoals || []
  );
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [editingGoal, setEditingGoal] = useState<CustomLearningGoal | null>(null);

  // New goal form state
  const [newGoal, setNewGoal] = useState<{
    title: string;
    description: string;
    category: string;
    targetValue: number;
    unit: string;
    priority: 'high' | 'medium' | 'low';
  }>({
    title: '',
    description: '',
    category: '',
    targetValue: 0,
    unit: 'hours',
    priority: 'medium',
  });

  /**
   * Handle creating a new goal
   */
  const handleCreateGoal = () => {
    if (!newGoal.title.trim()) {
      return;
    }

    const goal: CustomLearningGoal = {
      id: `goal_${Date.now()}`,
      title: newGoal.title.trim(),
      description: newGoal.description.trim(),
      category: newGoal.category,
      targetValue: newGoal.targetValue,
      unit: newGoal.unit,
      priority: newGoal.priority,
    };

    const updatedGoals = [...goals, goal];
    setGoals(updatedGoals);
    
    // Update form data
    form.updateFields({ customLearningGoals: updatedGoals });

    // Reset form
    setNewGoal({
      title: '',
      description: '',
      category: '',
      targetValue: 0,
      unit: 'hours',
      priority: 'medium',
    });
    setIsCreateDialogOpen(false);
  };

  /**
   * Handle editing a goal
   */
  const handleEditGoal = (goal: CustomLearningGoal) => {
    setEditingGoal(goal);
    setNewGoal({
      title: goal.title,
      description: goal.description,
      category: goal.category,
      targetValue: goal.targetValue,
      unit: goal.unit,
      priority: goal.priority,
    });
    setIsCreateDialogOpen(true);
  };

  /**
   * Handle updating an existing goal
   */
  const handleUpdateGoal = () => {
    if (!editingGoal || !newGoal.title.trim()) {
      return;
    }

    const updatedGoals = goals.map((goal) =>
      goal.id === editingGoal.id
        ? {
            ...goal,
            title: newGoal.title.trim(),
            description: newGoal.description.trim(),
            category: newGoal.category,
            targetValue: newGoal.targetValue,
            unit: newGoal.unit,
            priority: newGoal.priority,
          }
        : goal
    );

    setGoals(updatedGoals);
    form.updateFields({ customLearningGoals: updatedGoals });

    // Reset form
    setNewGoal({
      title: '',
      description: '',
      category: '',
      targetValue: 0,
      unit: 'hours',
      priority: 'medium',
    });
    setEditingGoal(null);
    setIsCreateDialogOpen(false);
  };

  /**
   * Handle deleting a goal
   */
  const handleDeleteGoal = (goalId: string) => {
    const updatedGoals = goals.filter((goal) => goal.id !== goalId);
    setGoals(updatedGoals);
    form.updateFields({ customLearningGoals: updatedGoals });
  };

  /**
   * Get priority color
   */
  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -20 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      {/* Step Header */}
      <div className="text-center space-y-2">
        <div className="flex items-center justify-center mb-4">
          <div className="bg-blue-100 p-3 rounded-full">
            <Target className="h-8 w-8 text-blue-600" />
          </div>
        </div>
        <h2 className="text-2xl font-bold text-gray-900">
          Custom Learning Goals
        </h2>
        <p className="text-gray-600 max-w-2xl mx-auto">
          Set up your personal learning goals beyond exam preparation. Whether it's mastering a new technology,
          learning a language, or developing a skill, create goals that matter to you.
        </p>
      </div>

      {/* Goals List */}
      <div className="space-y-4">
        {goals.length > 0 ? (
          <div className="grid gap-4">
            {goals.map((goal) => (
              <Card key={goal.id} className="border-l-4 border-l-blue-500">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="space-y-1">
                      <CardTitle className="text-lg font-semibold">{goal.title}</CardTitle>
                      {goal.description && (
                        <p className="text-sm text-gray-600">{goal.description}</p>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${getPriorityColor(goal.priority)}`}>
                        {goal.priority}
                      </span>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditGoal(goal)}
                        className="h-8 w-8 p-0"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDeleteGoal(goal.id)}
                        className="h-8 w-8 p-0 text-red-600 hover:text-red-800"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 text-sm text-gray-600">
                    <div className="flex items-center gap-1">
                      <BookOpen className="h-4 w-4" />
                      <span className="capitalize">{goal.category.replace('_', ' ')}</span>
                    </div>
                    <div className="flex items-center gap-1">
                      <Target className="h-4 w-4" />
                      <span>{goal.targetValue} {goal.unit}</span>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <Card className="border-dashed border-2 border-gray-300">
            <CardContent className="flex flex-col items-center justify-center py-12 text-center">
              <BookOpen className="h-12 w-12 text-gray-400 mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No learning goals yet</h3>
              <p className="text-gray-600 mb-6 max-w-md">
                Create your first custom learning goal to get started with personalized learning beyond exam preparation.
              </p>
            </CardContent>
          </Card>
        )}

        {/* Add Goal Button */}
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="w-full"
          variant="outline"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Learning Goal
        </Button>
      </div>

      {/* Create/Edit Goal Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {editingGoal ? 'Edit Learning Goal' : 'Create Learning Goal'}
            </DialogTitle>
            <DialogDescription>
              Define what you want to learn and set a measurable target.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label htmlFor="title">Goal Title *</Label>
              <Input
                id="title"
                value={newGoal.title}
                onChange={(e) => setNewGoal({ ...newGoal, title: e.target.value })}
                placeholder="e.g., Master Docker & Kubernetes"
                className="mt-1"
              />
            </div>

            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={newGoal.description}
                onChange={(e) => setNewGoal({ ...newGoal, description: e.target.value })}
                placeholder="Describe what you want to achieve..."
                className="mt-1"
                rows={3}
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="category">Category</Label>
                <Select value={newGoal.category} onValueChange={(value) => setNewGoal({ ...newGoal, category: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {LEARNING_CATEGORIES.map((category) => (
                      <SelectItem key={category.value} value={category.value}>
                        {category.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="priority">Priority</Label>
                <Select value={newGoal.priority} onValueChange={(value) => setNewGoal({ ...newGoal, priority: value as any })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="medium">Medium</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetValue">Target Value</Label>
                <Input
                  id="targetValue"
                  type="number"
                  value={newGoal.targetValue}
                  onChange={(e) => setNewGoal({ ...newGoal, targetValue: parseInt(e.target.value) || 0 })}
                  placeholder="0"
                  className="mt-1"
                  min="1"
                />
              </div>

              <div>
                <Label htmlFor="unit">Unit</Label>
                <Select value={newGoal.unit} onValueChange={(value) => setNewGoal({ ...newGoal, unit: value })}>
                  <SelectTrigger className="mt-1">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {LEARNING_UNITS.map((unit) => (
                      <SelectItem key={unit.value} value={unit.value}>
                        {unit.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={editingGoal ? handleUpdateGoal : handleCreateGoal}
              disabled={!newGoal.title.trim() || !newGoal.category}
            >
              {editingGoal ? 'Update Goal' : 'Create Goal'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Optional Skip Message */}
      {goals.length === 0 && (
        <div className="text-center py-4">
          <p className="text-sm text-gray-500">
            You can skip this step and add learning goals later from your dashboard.
          </p>
        </div>
      )}
    </motion.div>
  );
}
