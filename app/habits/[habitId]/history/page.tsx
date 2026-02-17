'use client';

import { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { useAuth } from '@/contexts/AuthContext';
import { HabitHeatmap } from '@/components/habits/history/HabitHeatmap';
import { HistoryLayout } from '@/components/habits/history/HistoryLayout';
import { HistoryList } from '@/components/habits/history/HistoryList';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { habitHistoryService } from '@/lib/services/habit-history';

import type { HabitDocument } from '@/types/habit';
import { Flame, Trophy, Target } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { RefreshCw } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

export default function HabitHistoryPage() {
    const params = useParams();
    const habitId = Array.isArray(params?.habitId) ? params.habitId[0] : params?.habitId as string;

    const { user } = useAuth();
    const { toast } = useToast();

    const [habit, setHabit] = useState<HabitDocument | null>(null);
    const [loading, setLoading] = useState(true);

    const [isBackfilling, setIsBackfilling] = useState(false);

    useEffect(() => {
        async function fetchHabit() {
            if (!user?.uid || !habitId) return;

            try {
                const docRef = doc(db, `users/${user.uid}/habits/${habitId}`);
                const docSnap = await getDoc(docRef);

                if (docSnap.exists()) {
                    const matchedHabit = { id: docSnap.id, ...docSnap.data() } as HabitDocument;
                    setHabit(matchedHabit);


                }
            } catch (error) {
                console.error('Failed to fetch habit details', error);
            } finally {
                setLoading(false);
            }
        }

        fetchHabit();
    }, [user?.uid, habitId]);

    const handleBackfill = async () => {
        if (!user?.uid || !habit) return;
        setIsBackfilling(true);
        try {
            const result = await habitHistoryService.backfillHistory(user.uid, habit);
            if (result.success) {
                toast({
                    title: "History Synced",
                    description: `Successfully restored ${result.data} entries from archive.`,
                });
                // Force reload list?
                window.location.reload();
            }
        } catch (e) {
            toast({
                variant: "destructive",
                title: "Sync Failed",
                description: "Could not restore history logs."
            });
        } finally {
            setIsBackfilling(false);
        }
    };

    if (loading) {
        return <div className="min-h-screen bg-slate-50 flex items-center justify-center">Loading...</div>; // TODO: Better skeleton
    }

    if (!habit) {
        return <div className="p-8 text-center">Habit not found</div>;
    }

    return (
        <HistoryLayout habit={habit}>
            {/* Overview Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <Card className="border-0 shadow-sm bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-950/20 dark:to-amber-950/10">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2.5 bg-orange-100 dark:bg-orange-900/40 rounded-xl text-orange-600 dark:text-orange-400">
                            <Flame className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Current Streak</p>
                            <p className="text-2xl font-bold">{habit.currentStreak} <span className="text-sm font-normal text-muted-foreground">Days</span></p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2.5 bg-blue-100 dark:bg-blue-900/40 rounded-xl text-blue-600 dark:text-blue-400">
                            <Target className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Total Completed</p>
                            <p className="text-2xl font-bold">{Object.values(habit.history).filter(v => v >= habit.targetValue).length}</p>
                        </div>
                    </CardContent>
                </Card>

                <Card className="border-0 shadow-sm">
                    <CardContent className="p-4 flex items-center gap-4">
                        <div className="p-2.5 bg-purple-100 dark:bg-purple-900/40 rounded-xl text-purple-600 dark:text-purple-400">
                            <Trophy className="h-6 w-6" />
                        </div>
                        <div>
                            <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">Best Streak</p>
                            <p className="text-2xl font-bold">{habit.longestStreak} <span className="text-sm font-normal text-muted-foreground">Days</span></p>
                        </div>
                    </CardContent>
                </Card>
            </div>

            {/* Heatmap Section */}
            <Card>
                <CardHeader>
                    <div className="flex items-center justify-between">
                        <CardTitle className="text-base font-semibold">Consistency Graph</CardTitle>
                        <Button variant="outline" size="sm" onClick={handleBackfill} disabled={isBackfilling} className="h-7 text-xs gap-1.5">
                            <RefreshCw className={`h-3 w-3 ${isBackfilling ? 'animate-spin' : ''}`} />
                            Sync Logs
                        </Button>
                    </div>
                </CardHeader>
                <CardContent>
                    <HabitHeatmap
                        history={habit.history}
                        targetValue={habit.targetValue}
                    />
                </CardContent>
            </Card>

            {/* Detailed List Section */}
            <div className="space-y-4">
                <h2 className="text-lg font-semibold px-1">Detailed Logs</h2>
                {user?.uid && habitId && <HistoryList userId={user.uid} habitId={habitId} />}
            </div>

        </HistoryLayout>
    );
}
