'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Trophy,
  Medal,
  Star,
  Zap,
  Target,
  Calendar,
  BookOpen,
  Code,
  Brain,
  Timer,
  Flame,
  Award,
  Crown,
  Shield,
  Rocket,
  Gem,
  Users,
  TrendingUp,
  CheckCircle,
  Clock,
  ChevronRight,
  Sparkles,
  Gift,
  Lock
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import {
  type Achievement,
  type UserAchievement,
  type UnifiedProgress
} from '@/types/mission-system';
import { type UserPersonaType } from '@/types/exam';

type AchievementCategory = 'completion' | 'performance' | 'consistency' | 'skill' | 'social' | 'milestone';

interface AchievementSystemProps {
  userProgress?: UnifiedProgress;
  onAchievementClick?: (achievement: Achievement) => void;
  className?: string;
}

export function AchievementSystem({ 
  userProgress, 
  onAchievementClick,
  className = ''
}: AchievementSystemProps) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<Achievement[]>([]);
  const [userAchievements, setUserAchievements] = useState<UserAchievement[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<AchievementCategory>('completion');
  const [selectedAchievement, setSelectedAchievement] = useState<Achievement | null>(null);
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showNewAchievement, setShowNewAchievement] = useState(false);

  // Mock data for achievements
  useEffect(() => {
    const mockAchievements: Achievement[] = [
      {
        id: 'first_mission',
        name: 'First Steps',
        description: 'Complete your first mission',
        category: 'completion',
        track: 'both',
        rarity: 'common',
        points: 100,
        requirements: [
          {
            type: 'missions_completed',
            target: 1,
            conditions: {}
          }
        ],
        badge: {
          iconUrl: '/badges/first-mission.png',
          color: '#3B82F6'
        },
        personaVariations: {
          student: {},
          working_professional: {},
          freelancer: {}
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'streak_7',
        name: 'Week Warrior',
        description: 'Maintain a 7-day learning streak',
        category: 'consistency',
        track: 'both',
        rarity: 'rare',
        points: 250,
        requirements: [
          {
            type: 'streak',
            target: 7,
            conditions: { consecutive: true }
          }
        ],
        badge: {
          iconUrl: '/badges/streak-7.png',
          color: '#10B981'
        },
        personaVariations: {
          student: {},
          working_professional: {},
          freelancer: {}
        },
        isActive: true,
        createdAt: new Date()
      },
      {
        id: 'perfect_score',
        name: 'Perfectionist',
        description: 'Achieve a perfect score on any mission',
        category: 'performance',
        track: 'both',
        rarity: 'epic',
        points: 500,
        requirements: [
          {
            type: 'score_threshold',
            target: 100,
            conditions: {}
          }
        ],
        badge: {
          iconUrl: '/badges/perfect-score.png',
          color: '#8B5CF6'
        },
        personaVariations: {
          student: {},
          working_professional: {},
          freelancer: {}
        },
        isActive: true,
        createdAt: new Date()
      }
    ];

    const mockUserAchievements: UserAchievement[] = [
      {
        userId: user?.uid || '',
        achievementId: 'first_mission',
        progress: 1,
        target: 1,
        isUnlocked: true,
        unlockedAt: new Date(),
        isDisplayed: true,
        requirementProgress: [
          {
            requirementIndex: 0,
            currentValue: 1,
            targetValue: 1,
            isCompleted: true
          }
        ],
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];

    setAchievements(mockAchievements);
    setUserAchievements(mockUserAchievements);
    setIsLoading(false);
  }, [user?.uid]);

  const getAchievementIcon = (achievement: Achievement) => {
    // Use category to determine icon since 'icon' property doesn't exist
    const iconMap: Record<string, React.ComponentType<any>> = {
      completion: CheckCircle,
      performance: TrendingUp,
      consistency: Flame,
      skill: Brain,
      social: Users,
      milestone: Trophy
    };

    const IconComponent = iconMap[achievement.category] || Trophy;
    return IconComponent;
  };

  const getRarityColor = (rarity: Achievement['rarity']): string => {
    const colorMap = {
      common: 'text-gray-600 bg-gray-50 border-gray-200',
      uncommon: 'text-green-600 bg-green-50 border-green-200', 
      rare: 'text-blue-600 bg-blue-50 border-blue-200',
      epic: 'text-purple-600 bg-purple-50 border-purple-200',
      legendary: 'text-yellow-600 bg-yellow-50 border-yellow-200'
    };
    return colorMap[rarity];
  };

  const getRarityGradient = (rarity: Achievement['rarity']): string => {
    const gradientMap = {
      common: 'from-gray-400 to-gray-600',
      uncommon: 'from-green-400 to-green-600',
      rare: 'from-blue-400 to-blue-600',
      epic: 'from-purple-400 to-purple-600',
      legendary: 'from-yellow-400 to-yellow-600'
    };
    return gradientMap[rarity];
  };

  const getAchievementProgress = (achievementId: string): UserAchievement | undefined => {
    return userAchievements.find(progress => progress.achievementId === achievementId);
  };

  const isAchievementUnlocked = (achievementId: string): boolean => {
    const progress = getAchievementProgress(achievementId);
    return progress?.isUnlocked || false;
  };

  const getProgressPercentage = (achievementId: string): number => {
    const progress = getAchievementProgress(achievementId);
    if (!progress) return 0;
    return Math.min((progress.progress / progress.target) * 100, 100);
  };

  const getCategoryAchievements = (category: AchievementCategory): Achievement[] => {
    return achievements.filter(achievement => achievement.category === category);
  };

  const getCategoryStats = (category: AchievementCategory) => {
    const categoryAchievements = getCategoryAchievements(category);
    const unlockedCount = categoryAchievements.filter(a => isAchievementUnlocked(a.id)).length;
    return {
      total: categoryAchievements.length,
      unlocked: unlockedCount,
      percentage: categoryAchievements.length > 0 ? Math.round((unlockedCount / categoryAchievements.length) * 100) : 0
    };
  };

  const getTotalStats = () => {
    const unlocked = achievements.filter(a => isAchievementUnlocked(a.id)).length;
    const totalPoints = userAchievements.reduce((sum, progress) => 
      sum + (progress.isUnlocked ? achievements.find(a => a.id === progress.achievementId)?.points || 0 : 0), 0
    );
    
    return {
      total: achievements.length,
      unlocked,
      percentage: achievements.length > 0 ? Math.round((unlocked / achievements.length) * 100) : 0,
      points: totalPoints
    };
  };

  const categories: { id: AchievementCategory; label: string; icon: React.ComponentType<any>; description: string }[] = [
    { id: 'completion', label: 'Completion', icon: CheckCircle, description: 'Mission and task completion achievements' },
    { id: 'performance', label: 'Performance', icon: TrendingUp, description: 'High performance and accuracy achievements' },
    { id: 'consistency', label: 'Consistency', icon: Flame, description: 'Consistency and streak achievements' },
    { id: 'milestone', label: 'Milestones', icon: Trophy, description: 'Major milestone achievements' },
    { id: 'skill', label: 'Skills', icon: Brain, description: 'Skill mastery achievements' }
  ];

  const totalStats = getTotalStats();

  const AchievementCard = ({ achievement }: { achievement: Achievement }) => {
    const progress = getAchievementProgress(achievement.id);
    const isUnlocked = isAchievementUnlocked(achievement.id);
    const progressPercentage = getProgressPercentage(achievement.id);
    const IconComponent = getAchievementIcon(achievement);

    return (
      <Card 
        className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
          isUnlocked ? getRarityColor(achievement.rarity) : 'opacity-60 hover:opacity-80'
        }`}
        onClick={() => {
          setSelectedAchievement(achievement);
          if (onAchievementClick) onAchievementClick(achievement);
        }}
      >
        <CardContent className="p-4">
          <div className="flex items-start space-x-3">
            <div className={`p-2 rounded-lg ${
              isUnlocked 
                ? `bg-gradient-to-br ${getRarityGradient(achievement.rarity)} text-white`
                : 'bg-gray-200 text-gray-400'
            }`}>
              {isUnlocked ? (
                <IconComponent className="h-6 w-6" />
              ) : (
                <Lock className="h-6 w-6" />
              )}
            </div>
            
            <div className="flex-1 space-y-2">
              <div className="flex items-center justify-between">
                <h4 className={`font-semibold ${isUnlocked ? 'text-gray-900' : 'text-gray-500'}`}>
                  {achievement.name}
                </h4>
                <div className="flex items-center space-x-2">
                  <Badge variant="outline" className="text-xs">
                    {achievement.points} pts
                  </Badge>
                  <Badge variant="outline" className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                    {achievement.rarity}
                  </Badge>
                </div>
              </div>
              
              <p className={`text-sm ${isUnlocked ? 'text-gray-600' : 'text-gray-400'}`}>
                {achievement.description}
              </p>
              
              {!isUnlocked && progress && (
                <div className="space-y-1">
                  <div className="flex justify-between items-center">
                    <span className="text-xs text-gray-500">
                      {progress.progress} / {progress.target}
                    </span>
                    <span className="text-xs text-gray-500">
                      {Math.round(progressPercentage)}%
                    </span>
                  </div>
                  <Progress value={progressPercentage} className="h-1" />
                </div>
              )}
              
              {isUnlocked && progress?.unlockedAt && (
                <div className="flex items-center space-x-2 text-xs text-gray-500">
                  <CheckCircle className="h-3 w-3 text-green-600" />
                  <span>Unlocked {new Date(progress.unlockedAt).toLocaleDateString()}</span>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    );
  };

  if (isLoading) {
    return (
      <div className={`w-full space-y-6 ${className}`}>
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 rounded w-1/4"></div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="h-32 bg-gray-200 rounded"></div>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`w-full space-y-6 ${className}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-blue-500 to-blue-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Trophy className="h-8 w-8" />
              <div>
                <div className="text-2xl font-bold">{totalStats.unlocked}</div>
                <div className="text-blue-100 text-sm">Achievements</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-purple-500 to-purple-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Star className="h-8 w-8" />
              <div>
                <div className="text-2xl font-bold">{totalStats.points}</div>
                <div className="text-purple-100 text-sm">Total Points</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-green-500 to-green-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Target className="h-8 w-8" />
              <div>
                <div className="text-2xl font-bold">{totalStats.percentage}%</div>
                <div className="text-green-100 text-sm">Completion</div>
              </div>
            </div>
          </CardContent>
        </Card>
        
        <Card className="bg-gradient-to-br from-orange-500 to-orange-600 text-white">
          <CardContent className="p-4">
            <div className="flex items-center space-x-3">
              <Gem className="h-8 w-8" />
              <div>
                <div className="text-2xl font-bold">
                  {achievements.filter(a => a.rarity === 'legendary' && isAchievementUnlocked(a.id)).length}
                </div>
                <div className="text-orange-100 text-sm">Legendary</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Achievement Categories */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Award className="h-5 w-5" />
            <span>Achievement Collection</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={selectedCategory} onValueChange={(value) => setSelectedCategory(value as AchievementCategory)}>
            <TabsList className="grid w-full grid-cols-5">
              {categories.map((category) => {
                const stats = getCategoryStats(category.id);
                const IconComponent = category.icon;
                
                return (
                  <TabsTrigger key={category.id} value={category.id} className="flex flex-col items-center space-y-1 py-3">
                    <IconComponent className="h-4 w-4" />
                    <span className="text-xs">{category.label}</span>
                    <span className="text-xs text-gray-500">{stats.unlocked}/{stats.total}</span>
                  </TabsTrigger>
                );
              })}
            </TabsList>
            
            {categories.map((category) => {
              const categoryAchievements = getCategoryAchievements(category.id);
              const stats = getCategoryStats(category.id);
              
              return (
                <TabsContent key={category.id} value={category.id} className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-lg font-semibold">{category.label} Achievements</h3>
                      <p className="text-gray-600 text-sm">{category.description}</p>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-gray-900">{stats.unlocked}/{stats.total}</div>
                      <div className="text-sm text-gray-500">{stats.percentage}% Complete</div>
                    </div>
                  </div>
                  
                  <Progress value={stats.percentage} className="h-2" />
                  
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {categoryAchievements.map((achievement) => (
                      <AchievementCard key={achievement.id} achievement={achievement} />
                    ))}
                  </div>
                  
                  {categoryAchievements.length === 0 && (
                    <div className="text-center py-12 text-gray-500">
                      <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No achievements in this category yet.</p>
                    </div>
                  )}
                </TabsContent>
              );
            })}
          </Tabs>
        </CardContent>
      </Card>

      {/* Achievement Detail Dialog */}
      <Dialog open={!!selectedAchievement} onOpenChange={() => setSelectedAchievement(null)}>
        <DialogContent className="max-w-2xl">
          {selectedAchievement && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center space-x-3">
                  <div className={`p-3 rounded-lg bg-gradient-to-br ${getRarityGradient(selectedAchievement.rarity)} text-white`}>
                    {React.createElement(getAchievementIcon(selectedAchievement), { className: "h-6 w-6" })}
                  </div>
                  <div>
                    <h2 className="text-xl font-bold">{selectedAchievement.name}</h2>
                    <div className="flex items-center space-x-2 mt-1">
                      <Badge className={getRarityColor(selectedAchievement.rarity)}>
                        {selectedAchievement.rarity}
                      </Badge>
                      <Badge variant="outline">{selectedAchievement.points} points</Badge>
                    </div>
                  </div>
                </DialogTitle>
              </DialogHeader>
              
              <div className="space-y-4">
                <p className="text-gray-600">{selectedAchievement.description}</p>
                
                {selectedAchievement.requirements && (
                  <div>
                    <h4 className="font-semibold mb-2">Requirements</h4>
                    <ul className="space-y-1">
                      {selectedAchievement.requirements.map((req, index) => (
                        <li key={index} className="flex items-center space-x-2 text-sm">
                          <CheckCircle className="h-4 w-4 text-green-600" />
                          <span>{req.type}: {req.target}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
                
                {(() => {
                  const progress = getAchievementProgress(selectedAchievement.id);
                  const isUnlocked = isAchievementUnlocked(selectedAchievement.id);
                  const progressPercentage = getProgressPercentage(selectedAchievement.id);
                  
                  if (isUnlocked && progress?.unlockedAt) {
                    return (
                      <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center space-x-2 text-green-800">
                          <CheckCircle className="h-5 w-5" />
                          <span className="font-semibold">Achievement Unlocked!</span>
                        </div>
                        <p className="text-green-700 text-sm mt-1">
                          Unlocked on {new Date(progress.unlockedAt).toLocaleDateString()}
                        </p>
                      </div>
                    );
                  } else if (progress) {
                    return (
                      <div className="space-y-2">
                        <div className="flex justify-between items-center">
                          <span className="font-medium">Progress</span>
                          <span className="text-sm text-gray-600">
                            {progress.progress} / {progress.target}
                          </span>
                        </div>
                        <Progress value={progressPercentage} className="h-3" />
                        <p className="text-sm text-gray-600">
                          {Math.round(progressPercentage)}% complete
                        </p>
                      </div>
                    );
                  }
                  
                  return (
                    <div className="bg-gray-50 border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center space-x-2 text-gray-600">
                        <Lock className="h-5 w-5" />
                        <span className="font-semibold">Not Started</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-1">
                        Complete the requirements to unlock this achievement.
                      </p>
                    </div>
                  );
                })()}
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>

      {/* New Achievement Notification */}
      <Dialog open={showNewAchievement} onOpenChange={setShowNewAchievement}>
        <DialogContent className="max-w-md">
          <div className="text-center py-6">
            <div className="mb-6">
              <div className="mx-auto w-16 h-16 bg-gradient-to-br from-yellow-400 to-yellow-600 rounded-full flex items-center justify-center mb-4">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900 mb-2">Achievement Unlocked!</h2>
              <p className="text-gray-600">Congratulations on your progress!</p>
            </div>
            
            <div className="space-y-4">
              {newAchievements.map((achievement) => {
                const IconComponent = getAchievementIcon(achievement);
                return (
                  <div key={achievement.id} className={`p-4 rounded-lg border-2 ${getRarityColor(achievement.rarity)}`}>
                    <div className="flex items-center space-x-3">
                      <div className={`p-2 rounded-lg bg-gradient-to-br ${getRarityGradient(achievement.rarity)} text-white`}>
                        <IconComponent className="h-6 w-6" />
                      </div>
                      <div className="text-left">
                        <h3 className="font-semibold">{achievement.name}</h3>
                        <p className="text-sm text-gray-600">{achievement.description}</p>
                        <Badge className="mt-1" variant="outline">+{achievement.points} points</Badge>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
            
            <Button
              onClick={() => {
                setShowNewAchievement(false);
                setNewAchievements([]);
              }}
              className="w-full mt-6 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700"
            >
              <Gift className="h-4 w-4 mr-2" />
              Awesome!
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
