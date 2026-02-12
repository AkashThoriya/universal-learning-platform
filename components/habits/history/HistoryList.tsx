'use client';

import { useEffect, useState, useCallback } from 'react';
import { format } from 'date-fns';
import { Calendar, CheckCircle2, Circle, Clock, MoreHorizontal, Plus } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Skeleton } from '@/components/ui/skeleton';
import { useToast } from '@/hooks/use-toast';
import { habitHistoryService, type HabitLogDocument } from '@/lib/services/habit-history';
import type { QueryDocumentSnapshot, DocumentData } from 'firebase/firestore';

interface HistoryListProps {
    userId: string;
    habitId: string;
}

export function HistoryList({ userId, habitId }: HistoryListProps) {
    const [logs, setLogs] = useState<HabitLogDocument[]>([]);
    const [loading, setLoading] = useState(true);
    const [loadingMore, setLoadingMore] = useState(false);
    const [lastDoc, setLastDoc] = useState<QueryDocumentSnapshot<DocumentData> | null>(null);
    const [hasMore, setHasMore] = useState(true);
    const { toast } = useToast();

    const fetchLogs = useCallback(async (isInitial = false) => {
        try {
            if (isInitial) setLoading(true);
            else setLoadingMore(true);

            const result = await habitHistoryService.getHistoryLogs(
                userId,
                habitId,
                20,
                isInitial ? undefined : (lastDoc ?? undefined)
            );

            if (result.success) {
                if (isInitial) {
                    setLogs(result.data.logs);
                } else {
                    setLogs(prev => [...prev, ...result.data.logs]);
                }

                setLastDoc(result.data.lastDoc);
                setHasMore(!!result.data.lastDoc && result.data.logs.length === 20);
            } else {
                toast({
                    variant: "destructive",
                    title: "Error fetching history",
                    description: result.error?.message
                });
            }
        } catch (err) {
            console.error(err);
        } finally {
            setLoading(false);
            setLoadingMore(false);
        }
    }, [userId, habitId, lastDoc, toast]);

    // Initial fetch
    useEffect(() => {
        fetchLogs(true);
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [userId, habitId]); // Only reset on ID change

    // Group logs by Month
    const groupedLogs = logs.reduce((acc, log) => {
        // Parse YYYY-MM-DD safely
        const [y, m, d] = log.date.split('-').map(Number);
        const dateObj = new Date(y || 2000, (m || 1) - 1, d || 1);
        const monthKey = format(dateObj, 'MMMM yyyy');
        if (!acc[monthKey]) acc[monthKey] = [];
        acc[monthKey].push(log);
        return acc;
    }, {} as Record<string, HabitLogDocument[]>);

    if (loading) {
        return (
            <div className="space-y-4">
                {[1, 2, 3].map(i => (
                    <Skeleton key={i} className="h-20 w-full rounded-xl" />
                ))}
            </div>
        );
    }

    if (logs.length === 0) {
        return (
            <div className="text-center py-12 bg-white/50 dark:bg-slate-900/50 rounded-xl border border-dashed border-slate-300 dark:border-slate-700">
                <div className="p-3 bg-slate-100 dark:bg-slate-800 rounded-full inline-block mb-3">
                    <Clock className="h-6 w-6 text-slate-400" />
                </div>
                <h3 className="text-sm font-semibold text-slate-900 dark:text-slate-100">No History Yet</h3>
                <p className="text-xs text-slate-500 mt-1">Start tracking to build your streak!</p>
            </div>
        );
    }

    return (
        <div className="space-y-6">
            {Object.entries(groupedLogs).map(([month, monthLogs]) => (
                <div key={month} className="space-y-3">
                    <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider pl-1 sticky top-16 bg-slate-50/90 dark:bg-slate-950/90 backdrop-blur-sm py-2 z-10 w-fit rounded pr-2">
                        {month}
                    </h4>

                    <div className="space-y-2">
                        {monthLogs.map((log) => (
                            <motion.div
                                key={log.id}
                                initial={{ opacity: 0, y: 10 }}
                                animate={{ opacity: 1, y: 0 }}
                            >
                                <Card className="p-4 flex items-center justify-between hover:bg-slate-50 dark:hover:bg-slate-900/50 transition-colors border-0 shadow-sm ring-1 ring-slate-200 dark:ring-slate-800">
                                    <div className="flex items-center gap-4">
                                        <div className={
                                            `p-2.5 rounded-full 
                         ${log.value > 0
                                                ? 'bg-green-100 text-green-600 dark:bg-green-950/30 dark:text-green-400'
                                                : 'bg-orange-100 text-orange-600 dark:bg-orange-950/30 dark:text-orange-400'
                                            }`
                                        }>
                                            {log.value > 0 ? <CheckCircle2 className="h-4 w-4" /> : <Circle className="h-4 w-4" />}
                                        </div>
                                        <div>
                                            <p className="font-medium text-sm text-slate-900 dark:text-slate-100">
                                                {log.action === 'SYSTEM_EVENT' ? 'Auto-tracked Event' :
                                                    log.action === 'TOGGLED' ? (log.value > 0 ? 'Completed' : 'Unchecked') :
                                                        log.action === 'INCREMENTED' ? 'Progress Updated' : 'Activity Logged'}
                                            </p>
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                                <Calendar className="h-3 w-3" />
                                                {(() => {
                                                    const [y, m, d] = log.date.split('-').map(Number);
                                                    return format(new Date(y || 2000, (m || 1) - 1, d || 1), 'EEE, MMM d');
                                                })()}
                                                <span className="text-slate-300 dark:text-slate-700">•</span>
                                                <span>{format(log.createdAt.toDate(), 'h:mm a')}</span>
                                            </div>
                                        </div>
                                    </div>

                                    <div className="flex items-center gap-3">
                                        <Badge variant={log.value > 0 ? 'default' : 'secondary'} className={log.value > 0 ? 'bg-green-600 hover:bg-green-700' : ''}>
                                            {log.value > 0 ? '+' : ''}{log.value}
                                        </Badge>
                                    </div>
                                </Card>
                            </motion.div>
                        ))}
                    </div>
                </div>
            ))}

            {/* Load More Button */}
            <div className="py-4 text-center">
                {hasMore ? (
                    <Button
                        variant="outline"
                        onClick={() => fetchLogs()}
                        disabled={loadingMore}
                        className="w-full md:w-auto min-w-[200px]"
                    >
                        {loadingMore ? (
                            <>
                                <span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Loading...
                            </>
                        ) : (
                            'Load More History'
                        )}
                    </Button>
                ) : (
                    logs.length > 0 && (
                        <div className="text-xs text-muted-foreground flex items-center justify-center gap-2 opacity-50">
                            <div className="h-px w-8 bg-border" />
                            End of History
                            <div className="h-px w-8 bg-border" />
                        </div>
                    )
                )}
            </div>
        </div>
    );
}
