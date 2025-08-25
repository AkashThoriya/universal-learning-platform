'use client';

import {
  Target,
  Trophy,
  BarChart3,
  Settings,
  Play,
  Home,
  BookOpen,
  Code,
  Brain,
  Zap,
  Calendar,
  Users,
  Flame,
  Star,
  Award
} from 'lucide-react';
import React, { useState, useEffect } from 'react';

import AuthGuard from '@/components/AuthGuard';
import { AchievementSystem } from '@/components/missions/AchievementSystem';
import { MissionConfiguration } from '@/components/missions/MissionConfiguration';
import { MissionDashboard } from '@/components/missions/MissionDashboard';
import { MissionExecution } from '@/components/missions/MissionExecution';
import { ProgressVisualization } from '@/components/missions/ProgressVisualization';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  type Mission,
  type MissionResults,
  type Achievement
} from '@/types/mission-system';

type ViewMode = 'dashboard' | 'configuration' | 'execution' | 'achievements' | 'progress';

export default function MissionsPage() {
  const [currentView, setCurrentView] = useState<ViewMode>('dashboard');
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Simulate loading time
    const timer = setTimeout(() => setIsLoading(false), 1000);
    return () => clearTimeout(timer);
  }, []);

  const handleMissionStart = (mission: Mission) => {
    setActiveMission(mission);
    setCurrentView('execution');
  };

  const handleMissionComplete = (results: MissionResults) => {
    // Log mission completion for analytics
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info('Mission completed with results:', results);
    }
    setActiveMission(null);
    setCurrentView('dashboard');
    // TODO: Update user progress and achievements through service layer
  };

  const handleMissionPause = () => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info('Mission paused');
    }
    // TODO: Save mission state through service layer
  };

  const handleMissionExit = () => {
    setActiveMission(null);
    setCurrentView('dashboard');
  };

  const handleAchievementClick = (achievement: Achievement) => {
    if (process.env.NODE_ENV === 'development') {
      // eslint-disable-next-line no-console
      console.info('Achievement clicked:', achievement);
    }
    // TODO: Implement achievement detail view
  };

  const getPageTitle = (): string => {
    switch (currentView) {
      case 'configuration':
        return 'Mission Configuration';
      case 'execution':
        return activeMission ? `${activeMission.title} - Mission in Progress` : 'Mission Execution';
      case 'achievements':
        return 'Achievement Gallery';
      case 'progress':
        return 'Progress Analytics';
      default:
        return 'Mission Control Center';
    }
  };

  const getPageDescription = (): string => {
    switch (currentView) {
      case 'configuration':
        return 'Customize your adaptive mission settings and preferences';
      case 'execution':
        return 'Complete your mission objectives and unlock rewards';
      case 'achievements':
        return 'Track your accomplishments and unlock new badges';
      case 'progress':
        return 'Analyze your learning journey and performance trends';
      default:
        return 'Manage your dual-track missions and accelerate your learning';
    }
  };

  const NavButton = ({
    mode,
    icon: Icon,
    label,
    badge
  }: {
    mode: ViewMode;
    icon: React.ComponentType<React.SVGProps<SVGSVGElement>>;
    label: string;
    badge?: string
  }) => (
    <Button
      variant={currentView === mode ? 'default' : 'ghost'}
      onClick={() => setCurrentView(mode)}
      className={`relative transition-all duration-200 ${
        currentView === mode
          ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg'
          : 'hover:bg-gray-100'
      }`}
      disabled={mode === 'execution' && !activeMission}
    >
      <Icon className="h-4 w-4 mr-2" />
      {label}
      {badge && (
        <Badge
          variant="secondary"
          className="ml-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-orange-500 text-white"
        >
          {badge}
        </Badge>
      )}
    </Button>
  );

  if (isLoading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50 flex items-center justify-center">
          <div className="text-center space-y-6 max-w-md mx-auto">
            <div className="relative">
              <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
              <Card className="relative border-0 bg-white/80 backdrop-blur-sm shadow-xl">
                <CardContent className="p-8">
                  <div className="flex justify-center mb-6">
                    <div className="relative">
                      <div className="absolute inset-0 bg-blue-200 rounded-full animate-ping opacity-75" />
                      <div className="relative bg-gradient-to-r from-blue-500 to-indigo-600 rounded-full p-4">
                        <Target className="h-8 w-8 text-white animate-pulse" />
                      </div>
                    </div>
                  </div>

                  <h3 className="text-xl font-bold text-gray-900 mb-2">Initializing Mission System</h3>
                  <p className="text-gray-600 mb-6">Preparing your strategic learning environment...</p>

                  <div className="flex justify-center">
                    <div className="animate-spin rounded-full h-8 w-8 border-4 border-blue-600 border-t-transparent" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-gray-50 to-blue-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Header */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center space-x-3">
                <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                  <Target className="h-8 w-8" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-gray-900">{getPageTitle()}</h1>
                  <p className="text-gray-600 mt-1">{getPageDescription()}</p>
                </div>
              </div>

              {currentView !== 'execution' && (
                <div className="flex items-center space-x-3">
                  <Badge variant="outline" className="text-sm">
                    <Calendar className="h-3 w-3 mr-1" />
                    Week 4-5 Phase
                  </Badge>
                  <Badge variant="outline" className="text-sm">
                    <Users className="h-3 w-3 mr-1" />
                    Advanced Learner
                  </Badge>
                </div>
              )}
            </div>

            {/* Navigation */}
            {currentView !== 'execution' && (
              <div className="flex flex-wrap gap-2 mb-6">
                <NavButton mode="dashboard" icon={Target} label="Mission Hub" badge="3" />
                <NavButton mode="configuration" icon={Settings} label="Configure" />
                <NavButton mode="progress" icon={BarChart3} label="Analytics" />
                <NavButton mode="achievements" icon={Trophy} label="Achievements" badge="2" />
                {activeMission && (
                  <NavButton mode="execution" icon={Play} label="Active Mission" />
                )}
              </div>
            )}
          </div>

          {/* Content */}
          <div className="space-y-6">
            {currentView === 'dashboard' && (
              <MissionDashboard
                onMissionStart={handleMissionStart}
                className="animate-in fade-in-50 duration-500"
              />
            )}

            {currentView === 'configuration' && (
              <MissionConfiguration
                className="animate-in fade-in-50 duration-500"
              />
            )}

            {currentView === 'execution' && activeMission && (
              <div className="animate-in fade-in-50 duration-500">
                <div className="mb-6">
                  <Button
                    variant="outline"
                    onClick={() => setCurrentView('dashboard')}
                    className="mb-4"
                  >
                    <Home className="h-4 w-4 mr-2" />
                    Back to Dashboard
                  </Button>
                </div>
                <MissionExecution
                  mission={activeMission}
                  onComplete={handleMissionComplete}
                  onPause={handleMissionPause}
                  onExit={handleMissionExit}
                />
              </div>
            )}

            {currentView === 'achievements' && (
              <AchievementSystem
                onAchievementClick={handleAchievementClick}
                className="animate-in fade-in-50 duration-500"
              />
            )}

            {currentView === 'progress' && (
              <ProgressVisualization
                className="animate-in fade-in-50 duration-500"
              />
            )}
          </div>

          {/* Quick Stats Footer */}
          {currentView !== 'execution' && (
            <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
                <CardContent className="p-4 text-center">
                  <Target className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">45</div>
                  <div className="text-blue-100 text-sm">Missions Completed</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
                <CardContent className="p-4 text-center">
                  <Flame className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">12</div>
                  <div className="text-green-100 text-sm">Day Streak</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
                <CardContent className="p-4 text-center">
                  <Star className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">87.5%</div>
                  <div className="text-purple-100 text-sm">Average Score</div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
                <CardContent className="p-4 text-center">
                  <Award className="h-8 w-8 mx-auto mb-2" />
                  <div className="text-2xl font-bold">8</div>
                  <div className="text-orange-100 text-sm">Achievements</div>
                </CardContent>
              </Card>
            </div>
          )}

          {/* Feature Introduction */}
          {currentView === 'dashboard' && (
            <Card className="mt-12 bg-gradient-to-r from-indigo-50 to-purple-50 border-indigo-200">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <div className="p-3 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <Zap className="h-6 w-6" />
                  </div>
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">
                      Welcome to the Adaptive Mission System!
                    </h3>
                    <p className="text-gray-600 mb-4">
                      Your personalized dual-track learning system combines exam preparation and technical
                      skills development. Each mission is adapted to your learning style and current proficiency level.
                    </p>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <BookOpen className="h-5 w-5 text-blue-600" />
                        <span className="text-sm text-gray-700">
                          📚 Exam Track: Daily mock tests, weekly revision, monthly assessments
                        </span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Code className="h-5 w-5 text-green-600" />
                        <span className="text-sm text-gray-700">💻 Tech Track: Daily coding, weekly projects, monthly challenges</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Brain className="h-5 w-5 text-purple-600" />
                        <span className="text-sm text-gray-700">🧠 AI-powered adaptation to your learning persona</span>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Trophy className="h-5 w-5 text-orange-600" />
                        <span className="text-sm text-gray-700">🏆 Achievement system with progress tracking</span>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
