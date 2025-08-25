'use client';

import {
  Clock,
  Target,
  TrendingUp,
  BookOpen,
  Code,
  Play,
  CheckCircle,
  AlertCircle,
  Zap,
  Award,
  BarChart3,
  Settings,
  Loader2,
  RefreshCw,
  Filter
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { missionService } from '@/lib/mission-service';
import {
  type Mission,
  type UnifiedProgress,
  type MissionAnalytics,
  type LearningTrack,
  type MissionStatus,
  // type MissionFrequency // Commented out unused type
} from '@/types/mission-system';

interface MissionDashboardProps {
  className?: string;
  onMissionStart?: (mission: Mission) => void;
  onViewProgress?: () => void;
  onConfigureMissions?: () => void;
}

export function MissionDashboard({
  className = '',
  onMissionStart,
  onViewProgress,
  onConfigureMissions
}: MissionDashboardProps) {
  const { user } = useAuth();
  const [activeMissions, setActiveMissions] = useState<Mission[]>([]);
  const [unifiedProgress, setUnifiedProgress] = useState<UnifiedProgress | null>(null);
  const [analytics, setAnalytics] = useState<MissionAnalytics | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTrack, setSelectedTrack] = useState<LearningTrack | 'all'>('all');
  const [startingMissionId, setStartingMissionId] = useState<string | null>(null);

  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (user?.uid) {
      loadDashboardData();
    }
  }, [user?.uid]);

  const loadDashboardData = async () => {
    if (!user?.uid) { return; }

    try {
      setIsLoading(true);
      setError(null);

      // Initialize mission service and seed templates
      await missionService.initialize();
      await missionService.seedUserTemplates(user.uid);

      // Load user progress
      const progressResult = await missionService.getUserProgress(user.uid);
      if (progressResult.success && progressResult.data) {
        setUnifiedProgress(progressResult.data);
      }

      // Load analytics for current month
      const endDate = new Date();
      const startDate = new Date(endDate.getFullYear(), endDate.getMonth(), 1);
      const analyticsResult = await missionService.generateAnalytics(user.uid, {
        startDate,
        endDate
      });
      if (analyticsResult.success && analyticsResult.data) {
        setAnalytics(analyticsResult.data);
      }

      // Load active missions from Firebase
      const activeMissionsResult = await missionService.getActiveMissions(user.uid);

      if (activeMissionsResult.success && activeMissionsResult.data) {
        setActiveMissions(activeMissionsResult.data);
      } else {
        console.error('Failed to load active missions:', activeMissionsResult.error);
        setActiveMissions([]);
      }

    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load dashboard data');
    } finally {
      setIsLoading(false);
    }
  };

  const handleStartMission = async (mission: Mission) => {
    setStartingMissionId(mission.id);
    try {
      if (onMissionStart) {
        await onMissionStart(mission);
      } else {
        // Default navigation to mission execution
        window.location.href = `/missions/${mission.id}`;
      }
    } catch (error) {
      console.error('Failed to start mission:', error);
    } finally {
      setStartingMissionId(null);
    }
  };

  const getStatusColor = (status: MissionStatus): string => {
    switch (status) {
      case 'completed': return 'text-green-600 bg-green-50 border-green-200';
      case 'in_progress': return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'failed': return 'text-red-600 bg-red-50 border-red-200';
      case 'skipped': return 'text-gray-600 bg-gray-50 border-gray-200';
      default: return 'text-yellow-600 bg-yellow-50 border-yellow-200';
    }
  };

  const getStatusIcon = (status: MissionStatus) => {
    switch (status) {
      case 'completed': return CheckCircle;
      case 'in_progress': return Play;
      case 'failed': return AlertCircle;
      default: return Clock;
    }
  };

  const getTrackIcon = (track: LearningTrack) => {
    return track === 'exam' ? BookOpen : Code;
  };

  const getTrackColor = (track: LearningTrack): string => {
    return track === 'exam' ? 'text-blue-600 bg-blue-50' : 'text-green-600 bg-green-50';
  };

  const filteredMissions = activeMissions.filter(mission =>
    selectedTrack === 'all' || mission.track === selectedTrack
  );

  if (!user) {
    return (
      <div className={`w-full max-w-6xl mx-auto ${className}`}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            Please log in to access your mission dashboard.
          </AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`w-full max-w-6xl mx-auto ${className}`}>
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading your mission dashboard...</h3>
          <p className="text-gray-600">Preparing your personalized learning missions and progress data.</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className={`w-full max-w-6xl mx-auto ${className}`}>
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription className="mb-4">{error}</AlertDescription>
          <Button
            variant="outline"
            size="sm"
            onClick={loadDashboardData}
            className="gap-2"
          >
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-6 ${className}`}>
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Mission Control Center</h1>
          <p className="text-gray-600">Track your adaptive learning missions across exam and tech tracks</p>
        </div>
        <div className="flex gap-3">
          <Button
            variant="outline"
            onClick={onViewProgress}
            className="gap-2"
          >
            <BarChart3 className="h-4 w-4" />
            Analytics
          </Button>
          <Button
            variant="outline"
            onClick={onConfigureMissions}
            className="gap-2"
          >
            <Settings className="h-4 w-4" />
            Configure
          </Button>
        </div>
      </div>

      {/* Progress Overview */}
      {unifiedProgress && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-blue-100 rounded-lg">
                  <Target className="h-6 w-6 text-blue-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-blue-800">Missions Completed</h3>
                  <div className="text-2xl font-bold text-blue-900">
                    {unifiedProgress.overallProgress.totalMissionsCompleted}
                  </div>
                  <p className="text-sm text-blue-600">Total across tracks</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-green-100 rounded-lg">
                  <TrendingUp className="h-6 w-6 text-green-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-green-800">Average Score</h3>
                  <div className="text-2xl font-bold text-green-900">
                    {unifiedProgress.overallProgress.averageScore}%
                  </div>
                  <p className="text-sm text-green-600">Across all missions</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-orange-50 to-red-50 border-orange-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-orange-100 rounded-lg">
                  <Zap className="h-6 w-6 text-orange-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-orange-800">Current Streak</h3>
                  <div className="text-2xl font-bold text-orange-900">
                    {unifiedProgress.overallProgress.currentStreak}
                  </div>
                  <p className="text-sm text-orange-600">Days consecutive</p>
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <div className="p-3 bg-purple-100 rounded-lg">
                  <Clock className="h-6 w-6 text-purple-600" />
                </div>
                <div>
                  <h3 className="font-semibold text-purple-800">Time Invested</h3>
                  <div className="text-2xl font-bold text-purple-900">
                    {Math.floor(unifiedProgress.overallProgress.totalTimeInvested / 60)}h
                  </div>
                  <p className="text-sm text-purple-600">Total learning time</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      {/* Mission Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="overview">Mission Overview</TabsTrigger>
          <TabsTrigger value="active">Active Missions</TabsTrigger>
          <TabsTrigger value="analytics">Performance Analytics</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-6">
          {/* Track Progress Cards */}
          {unifiedProgress && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Exam Track Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <BookOpen className="h-5 w-5 text-blue-600" />
                    <span>Exam Track Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Proficiency Level</span>
                      <Badge variant="secondary" className="bg-blue-100 text-blue-800">
                        {unifiedProgress.trackProgress.exam.proficiencyLevel}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Progress to Next Level</span>
                        <span className="text-sm font-medium">75%</span>
                      </div>
                      <Progress value={75} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {unifiedProgress.trackProgress.exam.missionsCompleted}
                        </div>
                        <div className="text-xs text-gray-600">Missions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-blue-600">
                          {unifiedProgress.trackProgress.exam.averageScore}%
                        </div>
                        <div className="text-xs text-gray-600">Avg Score</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Tech Track Progress */}
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center space-x-2">
                    <Code className="h-5 w-5 text-green-600" />
                    <span>Course/Tech Track Progress</span>
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium">Proficiency Level</span>
                      <Badge variant="secondary" className="bg-green-100 text-green-800">
                        {unifiedProgress.trackProgress.course_tech.proficiencyLevel}
                      </Badge>
                    </div>
                    <div className="space-y-2">
                      <div className="flex justify-between">
                        <span className="text-sm">Progress to Next Level</span>
                        <span className="text-sm font-medium">60%</span>
                      </div>
                      <Progress value={60} className="h-2" />
                    </div>
                    <div className="grid grid-cols-2 gap-4 pt-2">
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {unifiedProgress.trackProgress.course_tech.missionsCompleted}
                        </div>
                        <div className="text-xs text-gray-600">Missions</div>
                      </div>
                      <div className="text-center">
                        <div className="text-lg font-bold text-green-600">
                          {unifiedProgress.trackProgress.course_tech.averageScore}%
                        </div>
                        <div className="text-xs text-gray-600">Avg Score</div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Recent Achievements */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Award className="h-5 w-5 text-yellow-600" />
                <span>Recent Achievements</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
                  <div className="text-2xl mb-2">🎯</div>
                  <div className="font-medium text-gray-900">Consistency Master</div>
                  <div className="text-sm text-gray-600">7 days streak</div>
                </div>
                <div className="text-center p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="text-2xl mb-2">🧠</div>
                  <div className="font-medium text-gray-900">Problem Solver</div>
                  <div className="text-sm text-gray-600">50 coding challenges</div>
                </div>
                <div className="text-center p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="text-2xl mb-2">📚</div>
                  <div className="font-medium text-gray-900">Knowledge Builder</div>
                  <div className="text-sm text-gray-600">85% exam average</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="active" className="space-y-6">
          {/* Filter Bar */}
          <Card>
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Filter className="h-4 w-4 text-gray-500" />
                  <div className="flex space-x-2">
                    <Button
                      variant={selectedTrack === 'all' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTrack('all')}
                    >
                      All Tracks
                    </Button>
                    <Button
                      variant={selectedTrack === 'exam' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTrack('exam')}
                      className="gap-1"
                    >
                      <BookOpen className="h-3 w-3" />
                      Exam
                    </Button>
                    <Button
                      variant={selectedTrack === 'course_tech' ? 'default' : 'outline'}
                      size="sm"
                      onClick={() => setSelectedTrack('course_tech')}
                      className="gap-1"
                    >
                      <Code className="h-3 w-3" />
                      Tech
                    </Button>
                  </div>
                </div>
                <div className="text-sm text-gray-600">
                  {filteredMissions.length} active mission{filteredMissions.length !== 1 ? 's' : ''}
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Active Missions List */}
          <div className="space-y-4">
            {filteredMissions.map((mission) => {
              const StatusIcon = getStatusIcon(mission.status);
              const TrackIcon = getTrackIcon(mission.track);
              const isStarting = startingMissionId === mission.id;

              return (
                <Card key={mission.id} className="hover:shadow-md transition-shadow">
                  <CardContent className="p-6">
                    <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-start space-x-4">
                          <div className={`p-2 rounded-lg ${getTrackColor(mission.track)}`}>
                            <TrackIcon className="h-5 w-5" />
                          </div>

                          <div className="flex-1">
                            <div className="flex items-center space-x-3 mb-2">
                              <h3 className="font-semibold text-gray-900 text-lg">{mission.title}</h3>
                              <Badge className={`border ${getStatusColor(mission.status)}`}>
                                <StatusIcon className="h-3 w-3 mr-1" />
                                {mission.status.replace('_', ' ')}
                              </Badge>
                            </div>

                            <p className="text-gray-600 mb-3">{mission.description}</p>

                            <div className="flex flex-wrap items-center gap-3">
                              <div className="flex items-center space-x-1 text-sm text-gray-500">
                                <Clock className="h-3 w-3" />
                                <span>{mission.estimatedDuration} min</span>
                              </div>
                              <Badge variant="outline" className="text-xs">
                                {mission.difficulty}
                              </Badge>
                              <Badge variant="outline" className="text-xs">
                                {mission.frequency}
                              </Badge>
                            </div>

                            {mission.status === 'in_progress' && (
                              <div className="mt-3">
                                <div className="flex justify-between text-sm mb-1">
                                  <span>Progress</span>
                                  <span>{mission.progress.completionPercentage}%</span>
                                </div>
                                <Progress value={mission.progress.completionPercentage} className="h-2" />
                              </div>
                            )}
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center space-x-3">
                        <div className="text-right text-sm text-gray-500">
                          <div>Deadline</div>
                          <div className="font-medium">
                            {mission.deadline.toLocaleDateString()}
                          </div>
                        </div>
                        <Button
                          onClick={() => handleStartMission(mission)}
                          disabled={isStarting}
                          className="bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white"
                        >
                          {isStarting ? (
                            <>
                              <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                              Starting...
                            </>
                          ) : mission.status === 'in_progress' ? (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Continue
                            </>
                          ) : (
                            <>
                              <Play className="h-4 w-4 mr-2" />
                              Start Mission
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>

          {filteredMissions.length === 0 && (
            <Card>
              <CardContent className="p-12 text-center">
                <Target className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-gray-900 mb-2">No Active Missions</h3>
                <p className="text-gray-600 mb-4">
                  {selectedTrack === 'all'
                    ? 'You have no active missions at the moment.'
                    : `No active missions for ${selectedTrack === 'exam' ? 'exam' : 'tech'} track.`
                  }
                </p>
                <Button
                  onClick={onConfigureMissions}
                  className="gap-2"
                >
                  <Settings className="h-4 w-4" />
                  Configure Missions
                </Button>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="analytics" className="space-y-6">
          {analytics && (
            <>
              {/* Performance Metrics */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">
                        {analytics.overallMetrics.missionsCompleted}
                      </div>
                      <div className="text-sm text-gray-600">Missions Completed</div>
                      <div className="text-xs text-green-600 mt-1">
                        +{analytics.overallMetrics.missionsCompleted - analytics.overallMetrics.missionsSkipped} vs last month
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">
                        {analytics.overallMetrics.averageScore}%
                      </div>
                      <div className="text-sm text-gray-600">Average Score</div>
                      <div className="text-xs text-green-600 mt-1">
                        +5% vs last month
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-purple-600">
                        {Math.floor(analytics.overallMetrics.totalTimeSpent / 60)}h
                      </div>
                      <div className="text-sm text-gray-600">Time Invested</div>
                      <div className="text-xs text-green-600 mt-1">
                        +2h vs last month
                      </div>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardContent className="p-6">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-orange-600">
                        {analytics.overallMetrics.consistencyScore}%
                      </div>
                      <div className="text-sm text-gray-600">Consistency Score</div>
                      <div className="text-xs text-green-600 mt-1">
                        +8% vs last month
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Insights and Recommendations */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-green-800">Strengths</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.insights.strengths.map((strength, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span className="text-gray-700">{strength}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-orange-800">Recommendations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-2">
                      {analytics.insights.recommendations.map((recommendation, index) => (
                        <div key={index} className="flex items-center space-x-2">
                          <TrendingUp className="h-4 w-4 text-orange-600" />
                          <span className="text-gray-700">{recommendation}</span>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
