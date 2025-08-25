'use client';

import { Loader2, Target, Brain, TrendingUp } from 'lucide-react';
import React from 'react';

import { Card, CardContent } from '@/components/ui/card';

interface LoadingSpinnerProps {
  size?: 'sm' | 'md' | 'lg';
  className?: string;
}

interface LoadingStateProps {
  title?: string;
  description?: string;
  type?: 'page' | 'component' | 'inline';
  showProgress?: boolean;
  progress?: number;
  className?: string;
}

interface SkeletonProps {
  className?: string;
  rows?: number;
  showAvatar?: boolean;
}

/**
 * Simple loading spinner component
 */
export function LoadingSpinner({ size = 'md', className = '' }: LoadingSpinnerProps) {
  const sizeClasses = {
    sm: 'h-4 w-4',
    md: 'h-8 w-8',
    lg: 'h-12 w-12'
  };

  return (
    <Loader2 className={`animate-spin text-blue-600 ${sizeClasses[size]} ${className}`} />
  );
}

/**
 * Full loading state with customizable content
 */
export function LoadingState({
  title = 'Loading...',
  description = 'Please wait while we prepare your content',
  type = 'component',
  showProgress = false,
  progress = 0,
  className = ''
}: LoadingStateProps) {
  if (type === 'inline') {
    return (
      <div className={`flex items-center space-x-2 ${className}`}>
        <LoadingSpinner size="sm" />
        <span className="text-sm text-gray-600">{title}</span>
      </div>
    );
  }

  if (type === 'page') {
    return (
      <div className={`min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900 flex items-center justify-center p-4 ${className}`}>
        <div className="text-center space-y-6 max-w-md mx-auto">
          <div className="relative">
            <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
            <Card className="relative border-0 bg-white/80 backdrop-blur-sm shadow-xl">
              <CardContent className="p-8">
                <div className="flex justify-center mb-6">
                  <div className="relative">
                    <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-75" />
                    <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-4">
                      <Target className="h-8 w-8 text-white" />
                    </div>
                  </div>
                </div>

                <h3 className="text-xl font-bold text-gray-900 mb-2">{title}</h3>
                <p className="text-gray-600 mb-6">{description}</p>

                {showProgress && (
                  <div className="space-y-2">
                    <div className="w-full bg-gray-200 rounded-full h-2">
                      <div
                        className="bg-gradient-to-r from-blue-500 to-indigo-600 h-2 rounded-full transition-all duration-300 ease-out"
                        style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                       />
                    </div>
                    <p className="text-sm text-gray-500">{Math.round(progress)}% complete</p>
                  </div>
                )}

                <div className="flex justify-center">
                  <LoadingSpinner size="lg" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    );
  }

  // Component type (default)
  return (
    <div className={`flex flex-col items-center justify-center p-8 space-y-4 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-75" />
        <div className="relative bg-blue-600 rounded-full p-3">
          <LoadingSpinner size="lg" className="text-white" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="font-medium text-gray-900">{title}</h3>
        <p className="text-sm text-gray-600">{description}</p>

        {showProgress && (
          <div className="w-48 mx-auto space-y-1">
            <div className="w-full bg-gray-200 rounded-full h-1.5">
              <div
                className="bg-blue-600 h-1.5 rounded-full transition-all duration-300"
                style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
               />
            </div>
            <p className="text-xs text-gray-500">{Math.round(progress)}%</p>
          </div>
        )}
      </div>
    </div>
  );
}

/**
 * Skeleton loading for content placeholders
 */
export function Skeleton({ className = '', rows = 3, showAvatar = false }: SkeletonProps) {
  return (
    <div className={`animate-pulse space-y-4 ${className}`}>
      {showAvatar && (
        <div className="flex items-center space-x-4">
          <div className="rounded-full bg-gray-200 h-12 w-12" />
          <div className="space-y-2 flex-1">
            <div className="h-4 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/6" />
          </div>
        </div>
      )}

      <div className="space-y-3">
        {Array.from({ length: rows }, (_, i) => (
          <div key={i} className="space-y-2">
            <div className="h-4 bg-gray-200 rounded" />
            <div className="h-4 bg-gray-200 rounded w-5/6" />
          </div>
        ))}
      </div>
    </div>
  );
}

/**
 * Card skeleton for dashboard cards
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`${className}`}>
      <CardContent className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="flex items-center space-x-3">
            <div className="rounded-lg bg-gray-200 h-10 w-10" />
            <div className="space-y-2 flex-1">
              <div className="h-4 bg-gray-200 rounded w-1/3" />
              <div className="h-3 bg-gray-200 rounded w-1/4" />
            </div>
          </div>
          <div className="space-y-2">
            <div className="h-6 bg-gray-200 rounded w-1/4" />
            <div className="h-3 bg-gray-200 rounded w-1/2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard loading state with multiple skeletons
 */
export function DashboardLoading() {
  return (
    <LoadingState
      type="page"
      title="Loading Dashboard"
      description="Preparing your strategic learning center..."
      showProgress={false}
    />
  );
}

/**
 * Mission system loading state
 */
export function MissionLoading() {
  return (
    <LoadingState
      type="page"
      title="Initializing Mission System"
      description="Setting up your personalized learning missions..."
      showProgress={false}
    />
  );
}

/**
 * Micro-learning loading state
 */
export function MicroLearningLoading() {
  return (
    <LoadingState
      type="page"
      title="Preparing Learning Session"
      description="Customizing content for your learning style..."
      showProgress={false}
    />
  );
}

/**
 * Data loading component for specific features
 */
export function DataLoading({
  feature,
  className = ''
}: {
  feature: string;
  className?: string;
}) {
  const getFeatureIcon = (feature: string) => {
    switch (feature.toLowerCase()) {
      case 'mission':
      case 'missions':
        return Target;
      case 'analytics':
      case 'progress':
        return TrendingUp;
      case 'learning':
      case 'micro-learning':
        return Brain;
      default:
        return Target;
    }
  };

  const Icon = getFeatureIcon(feature);

  return (
    <div className={`flex flex-col items-center justify-center py-12 space-y-4 ${className}`}>
      <div className="relative">
        <div className="absolute inset-0 bg-blue-100 rounded-full animate-ping opacity-50" />
        <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-4">
          <Icon className="h-8 w-8 text-white" />
        </div>
      </div>

      <div className="text-center space-y-2">
        <h3 className="text-lg font-medium text-gray-900">Loading {feature}</h3>
        <p className="text-gray-600">Preparing your personalized content...</p>
        <LoadingSpinner size="md" />
      </div>
    </div>
  );
}

export default LoadingState;
