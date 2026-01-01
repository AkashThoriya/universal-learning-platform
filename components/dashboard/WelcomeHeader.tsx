'use client';

import { motion } from 'framer-motion';
import { Trophy } from 'lucide-react';

import { Alert } from '@/components/ui/alert';

import { Button } from '@/components/ui/button';


interface Achievement {
  id: string;
  title: string;
  description: string;
  icon: any;
  earnedAt: Date;
  rarity: 'common' | 'rare' | 'epic' | 'legendary';
}

interface WelcomeHeaderProps {
  user: any; // Using any to match existing usage in AdaptiveDashboard, ideally strictly typed
  motivationalMessage: string;
  recentAchievements: Achievement[];
  onDismissAchievement: () => void;
  onViewAllAchievements: () => void;
}

export function WelcomeHeader({
  user,
  motivationalMessage,
  recentAchievements,
  onDismissAchievement,
  onViewAllAchievements
}: WelcomeHeaderProps) {
  


  const getRarityBadgeColor = (rarity: Achievement['rarity']): string => {
    switch (rarity) {
      case 'common': return 'bg-gray-100 text-gray-800';
      case 'rare': return 'bg-blue-100 text-blue-800';
      case 'epic': return 'bg-purple-100 text-purple-800';
      case 'legendary': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center lg:text-left">
        <h1 className="text-3xl lg:text-4xl font-bold text-gray-900 mb-2">
           {`Welcome back, ${user?.displayName?.split(' ')[0] || 'Champion'}! 👋`}
        </h1>
        <p className="text-lg text-gray-600">{motivationalMessage}</p>
      </motion.div>

      {/* Celebration Alert for Achievements */}
      {recentAchievements.length > 0 && recentAchievements[0] && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: -20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ delay: 0.5, type: 'spring', damping: 15 }}
        >
          <Alert className="bg-gradient-to-r from-yellow-50 via-orange-50 to-yellow-50 border-2 border-yellow-300 shadow-lg relative overflow-hidden">
            {/* Animated background sparkles */}
            <div className="absolute inset-0 opacity-20">
              <div className="absolute top-2 left-4 text-yellow-400 animate-pulse">✨</div>
              <div className="absolute top-6 right-6 text-orange-400 animate-pulse delay-200">⭐</div>
              <div className="absolute bottom-3 left-8 text-yellow-500 animate-pulse delay-500">🎉</div>
              <div className="absolute bottom-2 right-12 text-orange-500 animate-pulse delay-700">🏆</div>
            </div>

            <div className="relative z-10">
              <div className="flex items-start space-x-3">
                <div className="flex-shrink-0 p-2 bg-gradient-to-br from-yellow-400 to-orange-500 rounded-full shadow-md">
                  <Trophy className="h-6 w-6 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                      🎉 Achievement Unlocked!
                    </h3>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="text-gray-600 hover:text-gray-800 hover:bg-white/50"
                      onClick={onDismissAchievement}
                    >
                      ✕
                    </Button>
                  </div>
                  <div className="flex items-center space-x-3 mb-2">
                    <div className="flex items-center space-x-2">
                      {(() => {
                        const IconComponent = recentAchievements[0].icon;
                        return <IconComponent className="h-5 w-5 text-orange-600" />;
                      })()}
                      <span className="font-semibold text-gray-900">{recentAchievements[0].title}</span>
                    </div>
                    <div
                      className={`px-2 py-1 rounded-full text-xs font-medium ${getRarityBadgeColor(recentAchievements[0].rarity)}`}
                    >
                      {recentAchievements[0].rarity}
                    </div>
                  </div>
                  <p className="text-sm text-gray-700 mb-3">{recentAchievements[0].description}</p>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-gray-500">
                      Earned {recentAchievements[0].earnedAt.toLocaleDateString()} at{' '}
                      {recentAchievements[0].earnedAt.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                    <Button
                      variant="outline"
                      size="sm"
                      className="bg-white/80 hover:bg-white border-orange-200 text-orange-700 hover:text-orange-800"
                      onClick={onViewAllAchievements}
                    >
                      View All Achievements
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          </Alert>
        </motion.div>
      )}
    </div>
  );
}
