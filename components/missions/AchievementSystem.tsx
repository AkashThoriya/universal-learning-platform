'use client';

import {
  Trophy,
  Star,
  Award,
  Medal,
  Crown,
  Zap,
  Target,
  TrendingUp,
  CheckCircle,
  Lock,
  Flame,
  Calendar,
  BookOpen,
  Code,
  Users,
  Sparkles,
  Search,
  SortAsc,
  SortDesc,
  X,
  AlertCircle,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import React, { useState, useEffect, useCallback } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { achievementService } from '@/lib/achievement-service';
import { type Achievement, type UserAchievement } from '@/types/mission-system';

interface AchievementSystemProps {
  className?: string;
  onAchievementClick?: (achievement: Achievement) => void;
}

interface AchievementWithProgress extends Achievement {
  userAchievement?: UserAchievement;
  isUnlocked: boolean;
  progress: number;
  target: number;
  unlockedAt?: Date;
}

export function AchievementSystem({ className = '', onAchievementClick }: AchievementSystemProps) {
  const { user } = useAuth();
  const [achievements, setAchievements] = useState<AchievementWithProgress[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedTrack, setSelectedTrack] = useState<string>('all');
  const [selectedRarity, setSelectedRarity] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'name' | 'points' | 'progress' | 'date'>('points');
  const [sortDirection, setSortDirection] = useState<'asc' | 'desc'>('desc');
  const [searchTerm, setSearchTerm] = useState('');
  const [showOnlyUnlocked, setShowOnlyUnlocked] = useState(false);
  const [selectedAchievement, setSelectedAchievement] = useState<AchievementWithProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const categories = ['all', 'completion', 'performance', 'consistency', 'skill', 'milestone', 'social'];
  const tracks = ['all', 'both', 'exam', 'course_tech'];
  const rarities = ['all', 'common', 'uncommon', 'rare', 'epic', 'legendary'];

  const loadAchievements = useCallback(async () => {
    if (!user?.uid) {
      return;
    }

    try {
      setIsLoading(true);
      setError(null);

      // Initialize system achievements if needed
      await achievementService.initializeSystemAchievements();

      // Get all achievements and user progress
      const [achievementsResult, userAchievementsResult] = await Promise.all([
        achievementService.getAchievements(),
        achievementService.getUserAchievements(user.uid),
      ]);

      if (!achievementsResult.success) {
        throw new Error(achievementsResult.error?.message ?? 'Failed to load achievements');
      }

      if (!userAchievementsResult.success) {
        throw new Error(userAchievementsResult.error?.message ?? 'Failed to load user achievements');
      }

      const allAchievements = achievementsResult.data;
      const userAchievements = userAchievementsResult.data;

      // Combine achievements with user progress
      const achievementsWithProgress: AchievementWithProgress[] = allAchievements.map(achievement => {
        const userAchievement = userAchievements.find(ua => ua.achievementId === achievement.id);

        const result: AchievementWithProgress = {
          ...achievement,
          isUnlocked: userAchievement?.isUnlocked ?? false,
          progress: userAchievement?.progress ?? 0,
          target: userAchievement?.target ?? 100,
        };

        // Only set optional properties if they exist
        if (userAchievement) {
          result.userAchievement = userAchievement;
        }

        if (userAchievement?.unlockedAt) {
          result.unlockedAt = userAchievement.unlockedAt;
        }

        return result;
      });

      setAchievements(achievementsWithProgress);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load achievements');
    } finally {
      setIsLoading(false);
    }
  }, [user]);

  useEffect(() => {
    if (user?.uid) {
      loadAchievements();
    }
  }, [user?.uid, loadAchievements]);

  const getRarityColor = (rarity: Achievement['rarity']): string => {
    switch (rarity) {
      case 'common':
        return 'text-gray-600 bg-gray-50 border-gray-200';
      case 'uncommon':
        return 'text-green-600 bg-green-50 border-green-200';
      case 'rare':
        return 'text-blue-600 bg-blue-50 border-blue-200';
      case 'epic':
        return 'text-purple-600 bg-purple-50 border-purple-200';
      case 'legendary':
        return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      default:
        return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getRarityIcon = (rarity: Achievement['rarity']) => {
    switch (rarity) {
      case 'common':
        return Medal;
      case 'uncommon':
        return Award;
      case 'rare':
        return Trophy;
      case 'epic':
        return Crown;
      case 'legendary':
        return Star;
      default:
        return Medal;
    }
  };

  const getCategoryIcon = (category: Achievement['category']) => {
    switch (category) {
      case 'completion':
        return Target;
      case 'performance':
        return TrendingUp;
      case 'consistency':
        return Flame;
      case 'skill':
        return Zap;
      case 'milestone':
        return Trophy;
      case 'social':
        return Users;
      default:
        return Award;
    }
  };

  const getTrackIcon = (track: Achievement['track']) => {
    switch (track) {
      case 'exam':
        return BookOpen;
      case 'course_tech':
        return Code;
      default:
        return Target;
    }
  };

  const getAchievementIcon = (achievement: Achievement): string => {
    // Map achievement IDs to emojis
    const iconMap: Record<string, string> = {
      first_mission: '🎯',
      streak_7: '🔥',
      perfectionist: '⭐',
      time_investor: '⏰',
      excellence_achiever: '🏆',
    };

    return iconMap[achievement.id] ?? '🏅';
  };

  const filteredAndSortedAchievements = achievements
    .filter(achievement => {
      const matchesCategory = selectedCategory === 'all' || achievement.category === selectedCategory;
      const matchesTrack = selectedTrack === 'all' || achievement.track === selectedTrack;
      const matchesRarity = selectedRarity === 'all' || achievement.rarity === selectedRarity;
      const matchesSearch =
        achievement.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        achievement.description.toLowerCase().includes(searchTerm.toLowerCase());
      const matchesUnlocked = !showOnlyUnlocked || achievement.isUnlocked;

      return matchesCategory && matchesTrack && matchesRarity && matchesSearch && matchesUnlocked;
    })
    .sort((a, b) => {
      let comparison = 0;

      switch (sortBy) {
        case 'name':
          comparison = a.name.localeCompare(b.name);
          break;
        case 'points':
          comparison = a.points - b.points;
          break;
        case 'progress':
          comparison = a.progress - b.progress;
          break;
        case 'date':
          if (a.unlockedAt && b.unlockedAt) {
            comparison = a.unlockedAt.getTime() - b.unlockedAt.getTime();
          } else if (a.unlockedAt) {
            comparison = -1;
          } else if (b.unlockedAt) {
            comparison = 1;
          }
          break;
      }

      return sortDirection === 'asc' ? comparison : -comparison;
    });

  const totalPoints = achievements.filter(a => a.isUnlocked).reduce((sum, a) => sum + a.points, 0);

  const unlockedCount = achievements.filter(a => a.isUnlocked).length;
  const totalCount = achievements.length;

  const handleAchievementClick = (achievement: AchievementWithProgress) => {
    setSelectedAchievement(achievement);
    if (onAchievementClick) {
      onAchievementClick(achievement);
    }
  };

  if (!user) {
    return (
      <div className={`w-full max-w-6xl mx-auto ${className}`}>
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>Please log in to view your achievements.</AlertDescription>
        </Alert>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className={`w-full max-w-6xl mx-auto ${className}`}>
        <div className="text-center py-12">
          <Loader2 className="h-12 w-12 animate-spin text-blue-600 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">Loading achievements...</h3>
          <p className="text-gray-600">Fetching your progress and accomplishments.</p>
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
          <Button variant="outline" size="sm" onClick={loadAchievements} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        </Alert>
      </div>
    );
  }

  return (
    <div className={`w-full max-w-6xl mx-auto space-y-6 ${className}`}>
      {/* Header Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <Card className="bg-gradient-to-br from-yellow-50 to-orange-50 border-yellow-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-yellow-100 rounded-lg">
                <Trophy className="h-6 w-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="font-semibold text-yellow-800">Total Points</h3>
                <div className="text-2xl font-bold text-yellow-900">{totalPoints.toLocaleString()}</div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Award className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-blue-800">Achievements</h3>
                <div className="text-2xl font-bold text-blue-900">
                  {unlockedCount} / {totalCount}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-50 to-emerald-50 border-green-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="h-6 w-6 text-green-600" />
              </div>
              <div>
                <h3 className="font-semibold text-green-800">Completion</h3>
                <div className="text-2xl font-bold text-green-900">
                  {totalCount > 0 ? Math.round((unlockedCount / totalCount) * 100) : 0}%
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-purple-50 to-pink-50 border-purple-200">
          <CardContent className="p-6">
            <div className="flex items-center space-x-3">
              <div className="p-3 bg-purple-100 rounded-lg">
                <Star className="h-6 w-6 text-purple-600" />
              </div>
              <div>
                <h3 className="font-semibold text-purple-800">Rank</h3>
                <div className="text-2xl font-bold text-purple-900">
                  {totalPoints >= 1000 ? 'Gold' : totalPoints >= 500 ? 'Silver' : 'Bronze'}
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters and Search */}
      <Card>
        <CardContent className="p-6">
          <div className="space-y-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="text"
                    placeholder="Search achievements..."
                    className="pl-10"
                    value={searchTerm}
                    onChange={e => setSearchTerm(e.target.value)}
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Button
                  variant={showOnlyUnlocked ? 'default' : 'outline'}
                  onClick={() => setShowOnlyUnlocked(!showOnlyUnlocked)}
                  size="sm"
                >
                  {showOnlyUnlocked ? 'All' : 'Unlocked Only'}
                </Button>

                <Button
                  variant="outline"
                  onClick={() => setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc')}
                  size="sm"
                >
                  {sortDirection === 'asc' ? <SortAsc className="h-4 w-4" /> : <SortDesc className="h-4 w-4" />}
                </Button>
              </div>
            </div>

            <div className="flex flex-wrap gap-2">
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="w-40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {categories.map(category => (
                    <SelectItem key={category} value={category}>
                      {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedTrack} onValueChange={setSelectedTrack}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {tracks.map(track => (
                    <SelectItem key={track} value={track}>
                      {track === 'all'
                        ? 'All Tracks'
                        : track === 'both'
                          ? 'Both Tracks'
                          : track === 'exam'
                            ? 'Exam Track'
                            : 'Tech Track'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={selectedRarity} onValueChange={setSelectedRarity}>
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {rarities.map(rarity => (
                    <SelectItem key={rarity} value={rarity}>
                      {rarity === 'all' ? 'All Rarities' : rarity.charAt(0).toUpperCase() + rarity.slice(1)}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select
                value={sortBy}
                onValueChange={value => setSortBy(value as 'name' | 'points' | 'progress' | 'date')}
              >
                <SelectTrigger className="w-36">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="points">Sort by Points</SelectItem>
                  <SelectItem value="name">Sort by Name</SelectItem>
                  <SelectItem value="progress">Sort by Progress</SelectItem>
                  <SelectItem value="date">Sort by Date</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Achievements Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {filteredAndSortedAchievements.map(achievement => {
          const CategoryIcon = getCategoryIcon(achievement.category);
          const TrackIcon = getTrackIcon(achievement.track);
          const RarityIcon = getRarityIcon(achievement.rarity);
          const achievementIcon = getAchievementIcon(achievement);

          return (
            <Card
              key={achievement.id}
              className={`relative cursor-pointer transition-all duration-200 hover:shadow-lg ${
                achievement.isUnlocked
                  ? 'bg-gradient-to-br from-white to-gray-50 border-2 border-green-200'
                  : 'bg-gray-50 opacity-75'
              }`}
              onClick={() => handleAchievementClick(achievement)}
            >
              <CardHeader className="pb-3">
                <div className="flex items-start justify-between">
                  <div className="flex items-center space-x-3">
                    <div
                      className={`text-3xl p-3 rounded-lg ${
                        achievement.isUnlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : 'bg-gray-100'
                      }`}
                    >
                      {achievementIcon}
                    </div>
                    <div className="flex-1">
                      <CardTitle className="text-lg">{achievement.name}</CardTitle>
                      <div className="flex items-center space-x-2 mt-1">
                        <Badge className={`text-xs ${getRarityColor(achievement.rarity)}`}>
                          <RarityIcon className="h-3 w-3 mr-1" />
                          {achievement.rarity}
                        </Badge>
                        <Badge variant="outline" className="text-xs">
                          {achievement.points} pts
                        </Badge>
                      </div>
                    </div>
                  </div>

                  <div className="flex flex-col items-center space-y-1">
                    {achievement.isUnlocked ? (
                      <CheckCircle className="h-6 w-6 text-green-600" />
                    ) : (
                      <Lock className="h-6 w-6 text-gray-400" />
                    )}
                    <div className="flex space-x-1">
                      <CategoryIcon className="h-3 w-3 text-gray-500" />
                      <TrackIcon className="h-3 w-3 text-gray-500" />
                    </div>
                  </div>
                </div>
              </CardHeader>

              <CardContent>
                <p className="text-gray-600 text-sm mb-4">{achievement.description}</p>

                {!achievement.isUnlocked && (
                  <div className="space-y-2">
                    <div className="flex justify-between text-sm">
                      <span>Progress</span>
                      <span>
                        {achievement.progress} / {achievement.target}
                      </span>
                    </div>
                    <Progress value={(achievement.progress / achievement.target) * 100} className="h-2" />
                  </div>
                )}

                {achievement.isUnlocked && achievement.unlockedAt && (
                  <div className="flex items-center space-x-2 text-sm text-green-600">
                    <Calendar className="h-3 w-3" />
                    <span>Unlocked {achievement.unlockedAt.toLocaleDateString()}</span>
                  </div>
                )}
              </CardContent>

              {achievement.isUnlocked && (
                <div className="absolute top-2 right-2">
                  <div className="bg-green-100 rounded-full p-1">
                    <Sparkles className="h-4 w-4 text-green-600" />
                  </div>
                </div>
              )}
            </Card>
          );
        })}
      </div>

      {filteredAndSortedAchievements.length === 0 && (
        <Card>
          <CardContent className="p-12 text-center">
            <Trophy className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No achievements found</h3>
            <p className="text-gray-600">Try adjusting your filters or search terms to find achievements.</p>
          </CardContent>
        </Card>
      )}

      {/* Achievement Details Modal */}
      {selectedAchievement && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-md w-full p-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold">{selectedAchievement.name}</h3>
              <Button variant="ghost" size="sm" onClick={() => setSelectedAchievement(null)}>
                <X className="h-4 w-4" />
              </Button>
            </div>

            <div className="text-center mb-6">
              <div
                className={`text-6xl p-4 rounded-lg inline-block mb-4 ${
                  selectedAchievement.isUnlocked ? 'bg-gradient-to-br from-yellow-50 to-orange-50' : 'bg-gray-100'
                }`}
              >
                {getAchievementIcon(selectedAchievement)}
              </div>

              <div className="space-y-2">
                <Badge className={`${getRarityColor(selectedAchievement.rarity)}`}>{selectedAchievement.rarity}</Badge>
                <p className="text-gray-600">{selectedAchievement.description}</p>
                <div className="text-2xl font-bold text-blue-600">{selectedAchievement.points} Points</div>
              </div>
            </div>

            {selectedAchievement.isUnlocked ? (
              <div className="text-center">
                <div className="flex items-center justify-center space-x-2 text-green-600 mb-2">
                  <CheckCircle className="h-5 w-5" />
                  <span className="font-medium">Achievement Unlocked!</span>
                </div>
                {selectedAchievement.unlockedAt && (
                  <p className="text-sm text-gray-500">
                    Unlocked on {selectedAchievement.unlockedAt.toLocaleDateString()}
                  </p>
                )}
              </div>
            ) : (
              <div className="space-y-3">
                <div className="flex justify-between text-sm">
                  <span>Progress</span>
                  <span>
                    {selectedAchievement.progress} / {selectedAchievement.target}
                  </span>
                </div>
                <Progress value={(selectedAchievement.progress / selectedAchievement.target) * 100} className="h-3" />
                <p className="text-sm text-gray-600 text-center">
                  {selectedAchievement.target - selectedAchievement.progress} more to unlock
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
