'use client';

import { motion } from 'framer-motion';
import {
  Calendar,
  Target,
  TrendingUp,
  Flag,
  MoreVertical,
  PlayCircle,
  PauseCircle,
  Settings,
  Trash2,
  Award,
  Star,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Progress } from '@/components/ui/progress';
import { cn } from '@/lib/utils/utils';
import { UserJourney } from '@/types/journey';

interface JourneyCardProps {
  journey: UserJourney;
  onStart?: (journey: UserJourney) => void;
  onPause?: (journey: UserJourney) => void;
  onEdit?: (journey: UserJourney) => void;
  onDelete?: (journey: UserJourney) => void;
  onViewDetails?: (journey: UserJourney) => void;
  className?: string;
}

export default function JourneyCard({
  journey,
  onStart,
  onPause,
  onEdit,
  onDelete,
  onViewDetails,
  className,
}: JourneyCardProps) {
  const [isHovered, setIsHovered] = useState(false);

  const statusColors = {
    planning: 'bg-gray-100 text-gray-700 border-gray-200',
    active: 'bg-green-100 text-green-700 border-green-200',
    completed: 'bg-blue-100 text-blue-700 border-blue-200',
    paused: 'bg-yellow-100 text-yellow-700 border-yellow-200',
    cancelled: 'bg-red-100 text-red-700 border-red-200',
  };

  const getStatusIcon = () => {
    switch (journey.status) {
      case 'active':
        return <PlayCircle className="h-4 w-4 text-green-600" />;
      case 'paused':
        return <PauseCircle className="h-4 w-4 text-yellow-600" />;
      case 'completed':
        return <Award className="h-4 w-4 text-blue-600" />;
      default:
        return <Flag className="h-4 w-4 text-gray-600" />;
    }
  };

  const getDaysRemaining = () => {
    const now = new Date();
    const target = new Date(journey.targetCompletionDate);
    const diffTime = target.getTime() - now.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    return diffDays;
  };

  const getCompletedGoals = () => {
    return journey.customGoals.filter(goal => goal.currentValue >= goal.targetValue).length;
  };

  const daysRemaining = getDaysRemaining();
  const completedGoals = getCompletedGoals();
  const totalGoals = journey.customGoals.length;
  const overallProgress = journey.progressTracking.overallCompletion;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      onHoverStart={() => setIsHovered(true)}
      onHoverEnd={() => setIsHovered(false)}
    >
      <Card
        className={cn(
          'relative transition-all duration-300 hover:shadow-lg cursor-pointer group',
          journey.status === 'active' && 'ring-2 ring-green-200',
          className
        )}
        onClick={() => onViewDetails?.(journey)}
      >
        {/* Priority Indicator */}
        <div
          className={cn(
            'absolute top-4 right-4 w-2 h-2 rounded-full',
            journey.priority === 'critical' && 'bg-red-500',
            journey.priority === 'high' && 'bg-orange-500',
            journey.priority === 'medium' && 'bg-yellow-500',
            journey.priority === 'low' && 'bg-gray-400'
          )}
        />

        <CardHeader className="pb-4">
          <div className="flex items-start justify-between">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2 mb-2">
                {getStatusIcon()}
                <Badge className={cn('text-xs', statusColors[journey.status])}>{journey.status}</Badge>
                <Badge variant="outline" className="text-xs">
                  {journey.track}
                </Badge>
              </div>
              <CardTitle className="text-lg font-semibold text-gray-900 group-hover:text-green-600 transition-colors truncate">
                {journey.title}
              </CardTitle>
              <CardDescription className="text-sm text-gray-600 line-clamp-2 mt-1">
                {journey.description}
              </CardDescription>
            </div>

            <DropdownMenu>
              <DropdownMenuTrigger asChild onClick={e => e.stopPropagation()}>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {journey.status === 'planning' && onStart && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onStart(journey);
                    }}
                  >
                    <PlayCircle className="h-4 w-4 mr-2" />
                    Start Journey
                  </DropdownMenuItem>
                )}
                {journey.status === 'active' && onPause && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onPause(journey);
                    }}
                  >
                    <PauseCircle className="h-4 w-4 mr-2" />
                    Pause Journey
                  </DropdownMenuItem>
                )}
                {onEdit && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onEdit(journey);
                    }}
                  >
                    <Settings className="h-4 w-4 mr-2" />
                    Edit Journey
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator />
                {onDelete && (
                  <DropdownMenuItem
                    onClick={e => {
                      e.stopPropagation();
                      onDelete(journey);
                    }}
                    className="text-red-600 focus:text-red-600"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Journey
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Progress Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between text-sm">
              <span className="text-gray-600">Overall Progress</span>
              <span className="font-medium text-gray-900">{overallProgress}%</span>
            </div>
            <Progress value={overallProgress} className="h-2" />
          </div>

          {/* Goals Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Target className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Goals</span>
            </div>
            <div className="flex items-center gap-1">
              <span className="text-sm font-medium text-gray-900">{completedGoals}</span>
              <span className="text-sm text-gray-500">/ {totalGoals}</span>
              {completedGoals === totalGoals && totalGoals > 0 && <Star className="h-4 w-4 text-yellow-500 ml-1" />}
            </div>
          </div>

          {/* Timeline Section */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">Timeline</span>
            </div>
            <div className="text-right">
              {daysRemaining > 0 ? (
                <span className="text-sm font-medium text-gray-900">{daysRemaining} days left</span>
              ) : daysRemaining === 0 ? (
                <Badge className="bg-orange-100 text-orange-700">Due Today</Badge>
              ) : (
                <Badge className="bg-red-100 text-red-700">{Math.abs(daysRemaining)} days overdue</Badge>
              )}
            </div>
          </div>

          {/* Recent Activity */}
          {journey.progressTracking.weeklyProgress.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">This Week</span>
              </div>
              <div className="text-right">
                <span className="text-sm font-medium text-gray-900">
                  {journey.progressTracking.weeklyProgress[journey.progressTracking.weeklyProgress.length - 1]
                    ?.hoursStudied ?? 0}
                  h studied
                </span>
              </div>
            </div>
          )}

          {/* Milestones */}
          {journey.progressTracking.milestoneAchievements.length > 0 && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Award className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">Milestones</span>
              </div>
              <Badge variant="outline" className="text-xs">
                {journey.progressTracking.milestoneAchievements.length} achieved
              </Badge>
            </div>
          )}

          {/* Action Buttons - Only visible on hover for non-active status */}
          <motion.div
            className="flex gap-2 pt-2"
            initial={{ opacity: 0, height: 0 }}
            animate={{
              opacity: isHovered || journey.status === 'planning' ? 1 : 0,
              height: isHovered || journey.status === 'planning' ? 'auto' : 0,
            }}
            transition={{ duration: 0.2 }}
          >
            {journey.status === 'planning' && onStart && (
              <Button
                size="sm"
                className="flex-1"
                onClick={e => {
                  e.stopPropagation();
                  onStart(journey);
                }}
              >
                <PlayCircle className="h-4 w-4 mr-2" />
                Start Journey
              </Button>
            )}
            {journey.status === 'active' && (
              <Button
                size="sm"
                variant="outline"
                className="flex-1"
                onClick={e => {
                  e.stopPropagation();
                  onViewDetails?.(journey);
                }}
              >
                Continue Learning
              </Button>
            )}
          </motion.div>
        </CardContent>

        {/* Hover Effect Overlay */}
        <motion.div
          className="absolute inset-0 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg opacity-0 pointer-events-none"
          animate={{ opacity: isHovered ? 0.1 : 0 }}
          transition={{ duration: 0.2 }}
        />
      </Card>
    </motion.div>
  );
}
