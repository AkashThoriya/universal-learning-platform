'use client';

import {
  TrendingUp,
  TrendingDown,
  Minus,
  Calendar,
  Target,
  BookOpen,
  Code,
  Brain,
  Zap,
  Activity,
  Timer,
  CheckCircle,
  AlertCircle,
  Star,
  Flame,
  Trophy,
} from 'lucide-react';
import React, { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, /* TabsContent, */ TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { type UnifiedProgress, type TrackProgress, type PeriodSummary, type Mission } from '@/types/mission-system';

interface ProgressVisualizationProps {
  userProgress?: UnifiedProgress;
  recentMissions?: Mission[];
  className?: string;
}

export function ProgressVisualization({
  userProgress,
  // recentMissions = [], // Commented out unused parameter
  className = '',
}: ProgressVisualizationProps) {
  const { user } = useAuth();
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month'>('week');
  const [_selectedTrack, _setSelectedTrack] = useState<'both' | 'exam' | 'course_tech'>('both'); // Prefixed with _ to indicate unused

  // Mock data for demonstration
  const mockProgress: UnifiedProgress = userProgress || {
    userId: user?.uid || '',
    overallProgress: {
      totalMissionsCompleted: 45,
      totalTimeInvested: 2340, // minutes
      averageScore: 87.5,
      currentStreak: 12,
      longestStreak: 18,
      consistencyRating: 0.85,
    },
    trackProgress: {
      exam: {
        track: 'exam',
        missionsCompleted: 28,
        averageScore: 89.2,
        timeInvested: 1400,
        proficiencyLevel: 'intermediate',
        masteredSkills: ['Problem Solving', 'Time Management', 'Multiple Choice Strategy'],
        skillsInProgress: ['Essay Writing', 'Complex Problem Analysis'],
        performanceTrend: 'improving',
        difficultyProgression: {
          current: 'intermediate',
          recommended: 'advanced',
          readyForAdvancement: true,
        },
        topicBreakdown: [
          { topic: 'Mathematics', proficiency: 92, missionsCompleted: 8, averageScore: 92.1 },
          { topic: 'Science', proficiency: 88, missionsCompleted: 7, averageScore: 88.3 },
          { topic: 'English', proficiency: 85, missionsCompleted: 6, averageScore: 85.7 },
          { topic: 'History', proficiency: 91, missionsCompleted: 7, averageScore: 91.2 },
        ],
      },
      course_tech: {
        track: 'course_tech',
        missionsCompleted: 17,
        averageScore: 84.8,
        timeInvested: 940,
        proficiencyLevel: 'intermediate',
        masteredSkills: ['JavaScript', 'React Basics', 'Problem Decomposition'],
        skillsInProgress: ['Advanced React', 'System Design', 'Algorithm Optimization'],
        performanceTrend: 'stable',
        difficultyProgression: {
          current: 'intermediate',
          recommended: 'intermediate',
          readyForAdvancement: false,
        },
        topicBreakdown: [
          { topic: 'Frontend Development', proficiency: 88, missionsCompleted: 6, averageScore: 87.5 },
          { topic: 'Algorithms', proficiency: 82, missionsCompleted: 5, averageScore: 82.4 },
          { topic: 'System Design', proficiency: 78, missionsCompleted: 3, averageScore: 78.1 },
          { topic: 'Data Structures', proficiency: 86, missionsCompleted: 3, averageScore: 86.0 },
        ],
      },
    },
    crossTrackInsights: {
      transferableSkills: ['Problem Solving', 'Time Management', 'Analytical Thinking'],
      effectivePatterns: ['Morning study sessions', 'Break complex problems down', 'Regular review'],
      recommendedBalance: {
        exam: 60,
        course_tech: 40,
      },
    },
    periodSummaries: {
      weekly: [
        {
          period: 'week',
          startDate: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          missionsCompleted: 8,
          averageScore: 88.5,
          timeInvested: 420,
          goalsAchieved: 3,
          goalsSet: 4,
          achievements: ['Week Warrior', 'Consistent Performer'],
          improvements: ['Focus on weak areas', 'Increase tech track engagement'],
          periodRating: 4,
        },
      ],
      monthly: [
        {
          period: 'month',
          startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(),
          missionsCompleted: 32,
          averageScore: 87.2,
          timeInvested: 1680,
          goalsAchieved: 12,
          goalsSet: 15,
          achievements: ['Monthly Master', 'Balanced Learner', 'Streak Champion'],
          improvements: ['Advanced problem solving', 'System design concepts'],
          periodRating: 4,
        },
      ],
    },
    updatedAt: new Date(),
  };

  const getTrendIcon = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return <TrendingUp className="h-4 w-4 text-green-600" />;
      case 'declining':
        return <TrendingDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-gray-600" />;
    }
  };

  const getTrendColor = (trend: 'improving' | 'stable' | 'declining') => {
    switch (trend) {
      case 'improving':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'declining':
        return 'text-red-600 bg-red-50 border-red-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getTrackIcon = (track: 'exam' | 'course_tech') => {
    return track === 'exam' ? BookOpen : Code;
  };

  const getTrackColor = (track: 'exam' | 'course_tech') => {
    return track === 'exam' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50';
  };

  const getProficiencyColor = (level: string) => {
    const colorMap = {
      beginner: 'text-orange-600 bg-orange-50 border-orange-200',
      intermediate: 'text-blue-600 bg-blue-50 border-blue-200',
      advanced: 'text-purple-600 bg-purple-50 border-purple-200',
      expert: 'text-yellow-600 bg-yellow-50 border-yellow-200',
    };
    return colorMap[level as keyof typeof colorMap] || colorMap.beginner;
  };

  const formatTime = (minutes: number): string => {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  };

  const getSelectedPeriodData = (): PeriodSummary | null => {
    if (selectedPeriod === 'week') {
      return mockProgress.periodSummaries.weekly[0] || null;
    }
    return mockProgress.periodSummaries.monthly[0] || null;
  };

  const periodData = getSelectedPeriodData();

  const OverallStatsCard = () => (
    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
      <CardContent className="p-6">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <CheckCircle className="h-8 w-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{mockProgress.overallProgress.totalMissionsCompleted}</div>
            <div className="text-indigo-100 text-sm">Missions</div>
          </div>
          <div className="text-center">
            <Timer className="h-8 w-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{formatTime(mockProgress.overallProgress.totalTimeInvested)}</div>
            <div className="text-indigo-100 text-sm">Time Invested</div>
          </div>
          <div className="text-center">
            <Target className="h-8 w-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{mockProgress.overallProgress.averageScore.toFixed(1)}%</div>
            <div className="text-indigo-100 text-sm">Avg Score</div>
          </div>
          <div className="text-center">
            <Flame className="h-8 w-8 mx-auto mb-2" />
            <div className="text-2xl font-bold">{mockProgress.overallProgress.currentStreak}</div>
            <div className="text-indigo-100 text-sm">Day Streak</div>
          </div>
        </div>
      </CardContent>
    </Card>
  );

  const TrackProgressCard = ({
    trackData,
    trackType,
  }: {
    trackData: TrackProgress;
    trackType: 'exam' | 'course_tech';
  }) => {
    const TrackIcon = getTrackIcon(trackType);

    return (
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="flex items-center space-x-3">
            <div className={`p-2 rounded-lg ${getTrackColor(trackType)}`}>
              <TrackIcon className="h-5 w-5" />
            </div>
            <div>
              <span className="capitalize">{trackType.replace('_', ' ')} Track</span>
              <div className="flex items-center space-x-2 mt-1">
                <Badge className={getProficiencyColor(trackData.proficiencyLevel)}>{trackData.proficiencyLevel}</Badge>
                <div className="flex items-center space-x-1">
                  {getTrendIcon(trackData.performanceTrend)}
                  <span className={`text-sm ${getTrendColor(trackData.performanceTrend).split(' ')[0]}`}>
                    {trackData.performanceTrend}
                  </span>
                </div>
              </div>
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-xl font-bold text-gray-900">{trackData.missionsCompleted}</div>
              <div className="text-gray-600 text-sm">Missions</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{trackData.averageScore.toFixed(1)}%</div>
              <div className="text-gray-600 text-sm">Avg Score</div>
            </div>
            <div>
              <div className="text-xl font-bold text-gray-900">{formatTime(trackData.timeInvested)}</div>
              <div className="text-gray-600 text-sm">Time</div>
            </div>
          </div>

          <div className="space-y-3">
            <h4 className="font-medium text-gray-900">Topic Performance</h4>
            {trackData.topicBreakdown.map((topic, index) => (
              <div key={index} className="space-y-2">
                <div className="flex justify-between items-center">
                  <span className="text-sm font-medium text-gray-700">{topic.topic}</span>
                  <span className="text-sm text-gray-600">{topic.proficiency}%</span>
                </div>
                <Progress value={topic.proficiency} className="h-2" />
              </div>
            ))}
          </div>

          <div className="space-y-2">
            <h4 className="font-medium text-gray-900">Mastered Skills</h4>
            <div className="flex flex-wrap gap-1">
              {trackData.masteredSkills.map((skill, index) => (
                <Badge key={index} variant="secondary" className="text-xs">
                  {skill}
                </Badge>
              ))}
            </div>
          </div>

          {trackData.difficultyProgression.readyForAdvancement && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-3">
              <div className="flex items-center space-x-2 text-green-800">
                <CheckCircle className="h-4 w-4" />
                <span className="font-medium text-sm">Ready for advancement!</span>
              </div>
              <p className="text-green-700 text-xs mt-1">
                You're ready to move to {trackData.difficultyProgression.recommended} level.
              </p>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const PeriodSummaryCard = () => {
    if (!periodData) {
      return null;
    }

    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            <div className="flex items-center space-x-2">
              <Calendar className="h-5 w-5" />
              <span>This {selectedPeriod}</span>
            </div>
            <div className="flex items-center space-x-1">
              {[...Array(5)].map((_, i) => (
                <Star
                  key={i}
                  className={`h-4 w-4 ${i < periodData.periodRating ? 'text-yellow-400 fill-current' : 'text-gray-300'}`}
                />
              ))}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{periodData.missionsCompleted}</div>
              <div className="text-gray-600 text-sm">Missions</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{periodData.averageScore.toFixed(1)}%</div>
              <div className="text-gray-600 text-sm">Avg Score</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">{formatTime(periodData.timeInvested)}</div>
              <div className="text-gray-600 text-sm">Time</div>
            </div>
            <div className="text-center">
              <div className="text-lg font-bold text-gray-900">
                {periodData.goalsAchieved}/{periodData.goalsSet}
              </div>
              <div className="text-gray-600 text-sm">Goals</div>
            </div>
          </div>

          {periodData.achievements.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Achievements</h4>
              <div className="flex flex-wrap gap-1">
                {periodData.achievements.map((achievement, index) => (
                  <Badge key={index} className="bg-yellow-100 text-yellow-800 border-yellow-200">
                    <Trophy className="h-3 w-3 mr-1" />
                    {achievement}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {periodData.improvements.length > 0 && (
            <div>
              <h4 className="font-medium text-gray-900 mb-2">Areas for Improvement</h4>
              <ul className="space-y-1">
                {periodData.improvements.map((improvement, index) => (
                  <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                    <AlertCircle className="h-3 w-3 text-orange-500" />
                    <span>{improvement}</span>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </CardContent>
      </Card>
    );
  };

  const InsightsCard = () => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Brain className="h-5 w-5" />
          <span>Learning Insights</span>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <h4 className="font-medium text-gray-900 mb-2">Transferable Skills</h4>
          <div className="flex flex-wrap gap-1">
            {mockProgress.crossTrackInsights.transferableSkills.map((skill, index) => (
              <Badge key={index} variant="outline" className="text-xs">
                <Zap className="h-3 w-3 mr-1" />
                {skill}
              </Badge>
            ))}
          </div>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-2">Effective Patterns</h4>
          <ul className="space-y-1">
            {mockProgress.crossTrackInsights.effectivePatterns.map((pattern, index) => (
              <li key={index} className="flex items-center space-x-2 text-sm text-gray-600">
                <CheckCircle className="h-3 w-3 text-green-500" />
                <span>{pattern}</span>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4 className="font-medium text-gray-900 mb-3">Recommended Balance</h4>
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Exam Track</span>
              <span className="text-sm font-medium">{mockProgress.crossTrackInsights.recommendedBalance.exam}%</span>
            </div>
            <Progress value={mockProgress.crossTrackInsights.recommendedBalance.exam} className="h-2" />
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Tech Track</span>
              <span className="text-sm font-medium">
                {mockProgress.crossTrackInsights.recommendedBalance.course_tech}%
              </span>
            </div>
            <Progress value={mockProgress.crossTrackInsights.recommendedBalance.course_tech} className="h-2" />
          </div>
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Overall Progress Stats */}
      <OverallStatsCard />

      {/* Period Selection */}
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-semibold text-gray-900">Progress Overview</h2>
        <Tabs value={selectedPeriod} onValueChange={value => setSelectedPeriod(value as 'week' | 'month')}>
          <TabsList>
            <TabsTrigger value="week">This Week</TabsTrigger>
            <TabsTrigger value="month">This Month</TabsTrigger>
          </TabsList>
        </Tabs>
      </div>

      {/* Period Summary */}
      <PeriodSummaryCard />

      {/* Track Progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <TrackProgressCard trackData={mockProgress.trackProgress.exam} trackType="exam" />
        <TrackProgressCard trackData={mockProgress.trackProgress.course_tech} trackType="course_tech" />
      </div>

      {/* Learning Insights */}
      <InsightsCard />

      {/* Consistency Rating */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Activity className="h-5 w-5" />
            <span>Consistency Rating</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-gray-700">Overall Consistency</span>
                <span className="text-lg font-bold text-gray-900">
                  {Math.round(mockProgress.overallProgress.consistencyRating * 100)}%
                </span>
              </div>
              <Progress value={mockProgress.overallProgress.consistencyRating * 100} className="h-3" />
              <p className="text-xs text-gray-600 mt-2">
                Based on regular study habits, mission completion rate, and streak maintenance
              </p>
            </div>
            <div className="text-center">
              <div className="text-3xl mb-2">
                {mockProgress.overallProgress.consistencyRating >= 0.8
                  ? '🔥'
                  : mockProgress.overallProgress.consistencyRating >= 0.6
                    ? '⚡'
                    : '💫'}
              </div>
              <div className="text-sm text-gray-600">
                {mockProgress.overallProgress.consistencyRating >= 0.8
                  ? 'Excellent'
                  : mockProgress.overallProgress.consistencyRating >= 0.6
                    ? 'Good'
                    : 'Improving'}
              </div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
