'use client';

import { motion } from 'framer-motion';
import { Flame, Sparkles, Plus, Trophy, BookOpen, Brain } from 'lucide-react';
import { useEffect, useState } from 'react';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { AddHabitDialog } from '@/components/habits/AddHabitDialog';
import { HabitGrid } from '@/components/habits/HabitGrid';
import { StreakHeatmap } from '@/components/habits/StreakHeatmap';
import { WellnessCheckIn } from '@/components/habits/WellnessCheckIn';
import PageContainer from '@/components/layout/PageContainer';
import PageTransition from '@/components/layout/PageTransition';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/contexts/CourseContext';
import { useHabits } from '@/hooks/useHabits';
import { MOTIVATIONAL_QUOTES } from '@/lib/constants/quotes';
import { db } from '@/lib/firebase/firebase';
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { useToast } from '@/hooks/use-toast';

export default function HabitsPage() {
  const { user } = useAuth();
  const { activeCourseId } = useCourse();
  const { toast } = useToast();
  const {
    habits,
    stats,
    loading,
    error,
    toggleHabit,
    incrementHabit,
    createHabit,
    deleteHabit,
    initializeDefaults,
  } = useHabits(user?.uid, activeCourseId);

  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [initialized, setInitialized] = useState(false);

  // Initialize default system habits on first visit
  useEffect(() => {
    if (user?.uid && !loading && habits.length === 0 && !initialized) {
      setInitialized(true);
      initializeDefaults();
    }
  }, [user?.uid, loading, habits.length, initialized, initializeDefaults]);

  // Merge all habit histories for the overall heatmap
  const mergedHistory: Record<string, number> = {};
  habits.forEach((habit) => {
    Object.entries(habit.history ?? {}).forEach(([dateKey, value]) => {
      mergedHistory[dateKey] = (mergedHistory[dateKey] ?? 0) + value;
    });
  });

  const completionPercent =
    stats.totalHabits > 0
      ? Math.round((stats.completedToday / stats.totalHabits) * 100)
      : 0;

  const handleWellnessSubmit = async (mood: number, energy: number) => {
    if (!user?.uid) return;

    try {
      await addDoc(collection(db, `users/${user.uid}/wellness_logs`), {
        mood,
        energy,
        date: new Date().toLocaleDateString('en-CA'),
        createdAt: serverTimestamp(),
      });

      toast({
        title: "Check-in Complete",
        description: "Your wellness log has been saved.",
        variant: "default",
      });
    } catch (err) {
      console.error('Error saving wellness log:', err);
      toast({
        title: "Error",
        description: "Could not save your check-in. Please try again.",
        variant: "destructive",
      });
    }
  };

  const getMotivationalMessage = (percent: number) => {
    if (percent === 100) return "All done! You're crushing it! 🎉";
    if (percent >= 75) return "Almost there! Keep pushing! 💪";
    if (percent >= 50) return "Halfway done! Use that momentum! 🚀";
    if (percent > 0) return "Great start! Keep it going! 🔥";
    return "Let's build some momentum today! ⭐";
  };

  const [quote, setQuote] = useState<{ text: string; author: string; link?: string }>({
    text: "Consistency is what transforms average into excellence.",
    author: "Unknown"
  });

  useEffect(() => {
    setQuote(MOTIVATIONAL_QUOTES[Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length)] ?? MOTIVATIONAL_QUOTES[0]!);
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-orange-50/50 via-amber-50/30 to-background dark:from-slate-950 dark:via-slate-900 dark:to-slate-950">
        <Navigation />
        <BottomNav />
        <PageContainer>
          <PageTransition>
            <div className="space-y-8 pb-20">
              {/* Page Header */}
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
                    <div className="p-2 rounded-xl bg-orange-100 dark:bg-orange-900/40 text-orange-600 dark:text-orange-400">
                      <Flame className="h-6 w-6" />
                    </div>
                    Consistency Engine
                  </h1>
                  <p className="text-sm text-muted-foreground mt-1 ml-1">
                    Build momentum with daily habits and streaks
                  </p>
                </div>
                <Button
                  size="sm"
                  onClick={() => setAddDialogOpen(true)}
                  className="gap-1.5 shadow-sm bg-primary hover:bg-primary/90 text-primary-foreground"
                >
                  <Plus className="h-4 w-4" />
                  <span className="hidden sm:inline">Add Habit</span>
                </Button>
              </div>

              {/* Today's Summary - Glassmorphism Card */}
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5 }}
              >
                <Card className="border-0 shadow-xl overflow-hidden relative">
                  <div className="absolute inset-0 bg-gradient-to-r from-orange-500 to-amber-500 opacity-95 dark:opacity-90" />
                  {/* Decorative circles */}
                  <div className="absolute top-0 right-0 -mt-10 -mr-10 w-40 h-40 rounded-full bg-white/10 blur-3xl" />
                  <div className="absolute bottom-0 left-0 -mb-10 -ml-10 w-40 h-40 rounded-full bg-black/5 blur-3xl" />

                  <CardContent className="p-6 relative z-10 text-white">
                    <div className="flex items-center justify-between">
                      <div className="space-y-4 flex-1">
                        <div>
                          <p className="text-orange-100 text-xs font-semibold uppercase tracking-wider mb-1">Today's Progress</p>
                          <div className="flex items-baseline gap-2">
                            <span className="text-4xl font-bold">{stats.completedToday}</span>
                            <span className="text-xl text-orange-200 font-medium">/ {stats.totalHabits}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          <Badge className="bg-white/20 hover:bg-white/30 text-white border-0 backdrop-blur-sm gap-1.5 px-3 py-1.5">
                            <Flame className="h-3.5 w-3.5 fill-white" />
                            <span className="font-semibold">{stats.longestActiveStreak} Day Streak</span>
                          </Badge>
                          <Badge className="bg-black/20 hover:bg-black/30 text-white border-0 backdrop-blur-sm gap-1.5 px-3 py-1.5">
                            <Trophy className="h-3.5 w-3.5" />
                            <span className="font-semibold">{stats.overallCompletionRate}% Rate</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-orange-50 font-medium pt-1">
                          {getMotivationalMessage(completionPercent)}
                        </p>
                      </div>

                      {/* Circular Progress */}
                      <div className="relative w-24 h-24 shrink-0 hidden sm:block">
                        <svg className="w-full h-full transform -rotate-90">
                          <circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            className="text-black/10"
                          />
                          <motion.circle
                            cx="48"
                            cy="48"
                            r="40"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="8"
                            strokeLinecap="round"
                            strokeDasharray={2 * Math.PI * 40}
                            initial={{ strokeDashoffset: 2 * Math.PI * 40 }}
                            animate={{ strokeDashoffset: 2 * Math.PI * 40 * (1 - completionPercent / 100) }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            className="text-white drop-shadow-lg"
                          />
                        </svg>
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-lg font-bold">{completionPercent}%</span>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
                {/* Main Content Area */}
                <div className="lg:col-span-2 space-y-8">
                  {/* Habit Grid */}
                  <div className="space-y-4">
                    <div className="flex items-center justify-between">
                      <h2 className="text-lg font-semibold flex items-center gap-2">
                        <Sparkles className="h-5 w-5 text-amber-500" />
                        Your Habits
                      </h2>
                    </div>

                    {/* Top-Notch Auto-tracking Info Card */}
                    <div className="relative overflow-hidden rounded-xl border border-blue-100/50 dark:border-blue-900/30 bg-gradient-to-br from-blue-50/80 via-indigo-50/50 to-white/30 dark:from-blue-950/30 dark:via-indigo-950/20 dark:to-slate-900/10 backdrop-blur-sm shadow-sm">
                      <div className="absolute top-0 right-0 p-3 opacity-10">
                        <Sparkles className="h-24 w-24 text-blue-600 dark:text-blue-400" />
                      </div>

                      <div className="relative p-5 flex flex-col sm:flex-row gap-5 items-start sm:items-center">
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2 mb-2">
                            <div className="p-1.5 rounded-lg bg-blue-100 dark:bg-blue-900/60 text-blue-600 dark:text-blue-400">
                              <Sparkles className="h-4 w-4" />
                            </div>
                            <h3 className="font-semibold text-sm text-blue-950 dark:text-blue-100">
                              Auto-Tracking Active
                            </h3>
                          </div>
                          <p className="text-xs text-blue-800/80 dark:text-blue-200/70 leading-relaxed max-w-lg">
                            Your consistency engine is connected to the learning platform. Activities are automatically logged as habits.
                          </p>
                        </div>

                        <div className="flex gap-3 w-full sm:w-auto">
                          <div className="flex-1 sm:flex-none flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-white/5 border border-blue-100 dark:border-blue-900/30 shadow-sm">
                            <div className="p-1 rounded-md bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 dark:text-indigo-400">
                              <BookOpen className="h-3.5 w-3.5" />
                            </div>
                            <div className="text-[10px] font-medium">
                              <span className="block text-blue-900 dark:text-blue-100">Study Topics</span>
                              <span className="text-muted-foreground">Auto-updates</span>
                            </div>
                          </div>

                          <div className="flex-1 sm:flex-none flex items-center gap-2 px-3 py-2 rounded-lg bg-white/60 dark:bg-white/5 border border-blue-100 dark:border-blue-900/30 shadow-sm">
                            <div className="p-1 rounded-md bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400">
                              <Brain className="h-3.5 w-3.5" />
                            </div>
                            <div className="text-[10px] font-medium">
                              <span className="block text-blue-900 dark:text-blue-100">Take Tests</span>
                              <span className="text-muted-foreground">Auto-updates</span>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {error && (
                      <div className="text-sm text-red-600 bg-red-50 dark:bg-red-900/20 p-3 rounded-lg border border-red-200 dark:border-red-900/50">
                        {error}
                      </div>
                    )}

                    {loading ? (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                        {[1, 2, 3, 4].map((i) => (
                          <Card key={i} className="animate-pulse border-0 bg-muted/20">
                            <CardContent className="p-4 h-32" />
                          </Card>
                        ))}
                      </div>
                    ) : (
                      <HabitGrid
                        habits={habits}
                        onToggle={toggleHabit}
                        onIncrement={incrementHabit}
                        onDelete={deleteHabit}
                        onAddClick={() => setAddDialogOpen(true)}
                      />
                    )}
                  </div>

                  {/* Activity Heatmap */}
                  {Object.keys(mergedHistory).length > 0 && (
                    <motion.div
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: 0.2 }}
                    >
                      <Card className="overflow-hidden border-muted/60">
                        <CardHeader className="pb-4 border-b border-border/50 bg-muted/20">
                          <CardTitle className="text-sm font-semibold flex items-center gap-2">
                            <div className="p-1 rounded bg-green-100 dark:bg-green-900/40 text-green-600 dark:text-green-400">
                              <Flame className="h-3.5 w-3.5" />
                            </div>
                            Consistency Map
                          </CardTitle>
                        </CardHeader>
                        <CardContent className="pt-6 pb-6">
                          <StreakHeatmap
                            history={mergedHistory}
                            targetValue={stats.totalHabits}
                          />
                        </CardContent>
                      </Card>
                    </motion.div>
                  )}
                </div>

                {/* Sidebar - Reordered to top on mobile */}
                <div className="space-y-6 order-first lg:order-none">
                  {/* Wellness Check-in */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.3 }}
                  >
                    <WellnessCheckIn onSubmit={handleWellnessSubmit} />
                  </motion.div>

                  {/* Motivational Quote Card */}
                  <motion.div
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: 0.4 }}
                  >
                    <Card className="bg-gradient-to-br from-indigo-500 to-purple-600 text-white border-0 shadow-lg">
                      <CardContent className="p-6 relative overflow-hidden">
                        <div className="absolute top-0 right-0 p-4 opacity-10">
                          <Sparkles className="h-24 w-24" />
                        </div>
                        <div className="relative z-10 flex flex-col items-center text-center">
                          <p className="italic text-lg font-medium leading-relaxed mb-4">
                            {quote.text}
                          </p>
                          <div className="w-8 h-1 bg-white/30 rounded-full mb-3" />
                          {quote.link ? (
                            <a
                              href={quote.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-sm font-semibold opacity-80 uppercase tracking-widest text-[10px] hover:opacity-100 hover:text-white transition-opacity border-b border-white/30 hover:border-white pb-0.5"
                            >
                              {quote.author} ↗
                            </a>
                          ) : (
                            <p className="text-sm font-semibold opacity-80 uppercase tracking-widest text-[10px]">
                              {quote.author}
                            </p>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  </motion.div>
                </div>
              </div>
            </div>
          </PageTransition>
        </PageContainer>

        {/* Add Habit Dialog */}
        <AddHabitDialog
          open={addDialogOpen}
          onOpenChange={setAddDialogOpen}
          onSubmit={createHabit}
        />
      </div>
    </AuthGuard>
  );
}
