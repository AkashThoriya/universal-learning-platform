'use client';

import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { 
  BookOpen, 
  Code, 
  Clock, 
  Target, 
  TrendingUp, 
  Star,
  Calendar,
  Brain,
  Home,
  ArrowRight,
  Loader2
} from 'lucide-react';
import { type SessionPerformance, type MicroLearningSession } from '@/types/micro-learning';

interface SessionSummaryProps {
  performance: SessionPerformance;
  session: MicroLearningSession;
  onContinueLearning?: () => void;
  onReturnToDashboard?: () => void;
  isLoading?: boolean;
  error?: string | null;
}

export function SessionSummary({ 
  performance, 
  session, 
  onContinueLearning, 
  onReturnToDashboard,
  isLoading = false,
  error = null
}: SessionSummaryProps) {
  const [isNavigating, setIsNavigating] = useState(false);

  const getPerformanceColor = (score: number): string => {
    if (score >= 80) return 'text-green-600';
    if (score >= 60) return 'text-yellow-600';
    return 'text-red-600';
  };

  const getPerformanceLevel = (score: number): string => {
    if (score >= 90) return 'Excellent';
    if (score >= 80) return 'Very Good';
    if (score >= 70) return 'Good';
    if (score >= 60) return 'Fair';
    return 'Needs Improvement';
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  };

  const handleContinueLearning = async () => {
    if (onContinueLearning) {
      setIsNavigating(true);
      try {
        await onContinueLearning();
      } catch (error) {
        console.error('Failed to continue learning:', error);
      } finally {
        setIsNavigating(false);
      }
    }
  };

  const handleReturnToDashboard = async () => {
    if (onReturnToDashboard) {
      setIsNavigating(true);
      try {
        await onReturnToDashboard();
      } catch (error) {
        console.error('Failed to return to dashboard:', error);
      } finally {
        setIsNavigating(false);
      }
    }
  };

  // Handle keyboard navigation
  React.useEffect(() => {
    const handleKeyPress = (event: KeyboardEvent) => {
      if (event.key === 'Enter' && event.ctrlKey) {
        handleContinueLearning();
      } else if (event.key === 'Escape') {
        handleReturnToDashboard();
      }
    };

    window.addEventListener('keydown', handleKeyPress);
    return () => window.removeEventListener('keydown', handleKeyPress);
  }, []);

  if (isLoading) {
    return (
      <div className="w-full max-w-4xl mx-auto flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto" />
          <h3 className="text-lg font-medium text-gray-900">Processing your session...</h3>
          <p className="text-gray-600">We're analyzing your performance and generating insights.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="w-full max-w-4xl mx-auto">
        <Card className="border-red-200 bg-red-50">
          <CardHeader>
            <CardTitle className="text-red-800 flex items-center space-x-2">
              <Target className="h-5 w-5" />
              <span>Session Analysis Error</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-red-700 mb-4">{error}</p>
            <div className="flex gap-3">
              <Button 
                variant="outline" 
                onClick={handleReturnToDashboard}
                className="border-red-300 text-red-700 hover:bg-red-100"
              >
                <Home className="h-4 w-4 mr-2" />
                Return to Dashboard
              </Button>
              <Button 
                onClick={() => window.location.reload()}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                Try Again
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  const isExamTrack = session.learningTrack === 'exam';
  const trackMetrics = performance.trackSpecificMetrics;

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* Header Section */}
      <Card className="bg-gradient-to-r from-green-50 to-emerald-50 border-green-200">
        <CardHeader className="text-center pb-4">
          <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-100 to-emerald-100 rounded-full flex items-center justify-center mb-4">
            <Star className="h-8 w-8 text-green-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-green-800">
            Session Complete! 🎉
          </CardTitle>
          <p className="text-green-700 mt-2">
            Well done! You've completed your {session.duration}-minute {isExamTrack ? 'exam prep' : 'tech learning'} session.
          </p>
        </CardHeader>
      </Card>

      {/* Performance Overview */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Target className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Accuracy</h3>
                <div className={`text-2xl font-bold ${getPerformanceColor(performance.accuracy)}`}>
                  {performance.accuracy}%
                </div>
                <p className="text-sm text-gray-500">
                  {getPerformanceLevel(performance.accuracy)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Brain className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Engagement</h3>
                <div className={`text-2xl font-bold ${getPerformanceColor(performance.engagementScore)}`}>
                  {performance.engagementScore}%
                </div>
                <p className="text-sm text-gray-500">
                  {getPerformanceLevel(performance.engagementScore)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-orange-100 rounded-lg">
                <Clock className="h-6 w-6 text-orange-600" />
              </div>
              <div>
                <h3 className="font-semibold text-gray-800">Time Spent</h3>
                <div className="text-2xl font-bold text-gray-800">
                  {formatTime(performance.timeSpent)}
                </div>
                <p className="text-sm text-gray-500">
                  Target: {session.duration}m
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Detailed Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Learning Progress */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-blue-600" />
              <span>Learning Progress</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Concepts Learned</span>
                <Badge variant="secondary">{performance.conceptsLearned.length}</Badge>
              </div>
              <div className="space-y-1">
                {performance.conceptsLearned.slice(0, 3).map((concept, index) => (
                  <div key={index} className="text-sm text-gray-600 bg-gray-50 px-2 py-1 rounded">
                    {concept}
                  </div>
                ))}
                {performance.conceptsLearned.length > 3 && (
                  <div className="text-sm text-gray-500 italic">
                    +{performance.conceptsLearned.length - 3} more concepts
                  </div>
                )}
              </div>
            </div>

            {performance.skillsDeveloped.length > 0 && (
              <div>
                <div className="flex justify-between items-center mb-2">
                  <span className="text-sm font-medium">Skills Developed</span>
                  <Badge variant="secondary">{performance.skillsDeveloped.length}</Badge>
                </div>
                <div className="space-y-1">
                  {performance.skillsDeveloped.map((skill, index) => (
                    <div key={index} className="text-sm text-gray-600 bg-blue-50 px-2 py-1 rounded">
                      {skill}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Track-Specific Metrics */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {isExamTrack ? (
                <BookOpen className="h-5 w-5 text-green-600" />
              ) : (
                <Code className="h-5 w-5 text-blue-600" />
              )}
              <span>{isExamTrack ? 'Exam Readiness' : 'Tech Progress'}</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {isExamTrack && 'examReadinessScore' in trackMetrics ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Exam Readiness</span>
                    <span className="text-sm font-medium">{trackMetrics.examReadinessScore}%</span>
                  </div>
                  <Progress value={trackMetrics.examReadinessScore} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Mock Test Score</span>
                    <span className="text-sm font-medium">{trackMetrics.mockTestScore}%</span>
                  </div>
                  <Progress value={trackMetrics.mockTestScore} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Problem Solving Speed</span>
                    <span className="text-sm font-medium">{trackMetrics.problemSolvingSpeed}%</span>
                  </div>
                  <Progress value={trackMetrics.problemSolvingSpeed} className="h-2" />
                </div>
              </>
            ) : 'projectProgressPercentage' in trackMetrics ? (
              <>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Project Progress</span>
                    <span className="text-sm font-medium">{trackMetrics.projectProgressPercentage}%</span>
                  </div>
                  <Progress value={trackMetrics.projectProgressPercentage} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Portfolio Quality</span>
                    <span className="text-sm font-medium">{trackMetrics.portfolioQuality}%</span>
                  </div>
                  <Progress value={trackMetrics.portfolioQuality} className="h-2" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-sm">Problem Solving</span>
                    <span className="text-sm font-medium">{trackMetrics.problemSolvingApproach}%</span>
                  </div>
                  <Progress value={trackMetrics.problemSolvingApproach} className="h-2" />
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>
      </div>

      {/* Areas for Improvement */}
      {performance.areasForImprovement.length > 0 && (
        <Card className="border-yellow-200 bg-yellow-50">
          <CardHeader>
            <CardTitle className="text-yellow-800">Areas for Improvement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {performance.areasForImprovement.map((area, index) => (
                <div key={index} className="flex items-center space-x-2">
                  <div className="w-2 h-2 bg-yellow-500 rounded-full"></div>
                  <span className="text-yellow-800">{area}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Action Buttons */}
      <div className="flex flex-col sm:flex-row gap-4 justify-center">
        {onContinueLearning && (
          <Button
            onClick={handleContinueLearning}
            disabled={isNavigating}
            size="lg"
            className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white transition-all duration-200 transform hover:scale-105"
          >
            {isNavigating ? (
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            ) : (
              <ArrowRight className="h-5 w-5 mr-2" />
            )}
            Continue Learning
          </Button>
        )}
        {onReturnToDashboard && (
          <Button
            onClick={handleReturnToDashboard}
            disabled={isNavigating}
            variant="outline"
            size="lg"
            className="transition-all duration-200 hover:bg-gray-50"
          >
            <Home className="h-5 w-5 mr-2" />
            Return to Dashboard
          </Button>
        )}
      </div>

      {/* Keyboard shortcuts hint */}
      <div className="text-center text-sm text-gray-500 mt-4">
        <p>Keyboard shortcuts: <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Ctrl+Enter</kbd> to continue learning, <kbd className="px-2 py-1 bg-gray-100 rounded text-xs">Esc</kbd> to return to dashboard</p>
      </div>
    </div>
  );
}
