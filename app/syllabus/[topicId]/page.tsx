'use client';

import confetti from 'canvas-confetti';
import { Timestamp } from 'firebase/firestore';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import PageTransition from '@/components/layout/PageTransition';
import Navigation from '@/components/Navigation';
import { TopicDetailSkeleton } from '@/components/skeletons';
import { TopicContentTabs } from '@/components/topic-detail/TopicContentTabs';
import { InterviewQuestionsSection } from '@/components/topic-detail/InterviewQuestionsSection';
import { TopicDetailLayout } from '@/components/topic-detail/TopicDetailLayout';
import { TopicHero } from '@/components/topic-detail/TopicHero';
import { TopicStatsRail } from '@/components/topic-detail/TopicStatsRail';
import { Button } from '@/components/ui/button';

import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/contexts/CourseContext';
import { useToast } from '@/hooks/use-toast';
import {
  getSyllabus,
  getTopicProgress,
  updateTopicProgress,
  toggleQuestionSolved,
  getUser,
} from '@/lib/firebase/firebase-utils';
import { TopicProgress, SyllabusSubject } from '@/types/exam';

// Redesign Components

export default function TopicDetailPage() {
  const { user } = useAuth();
  const { activeCourseId } = useCourse();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const topicId = params.topicId as string;
  const subjectId = searchParams.get('subject');

  const [topicProgress, setTopicProgress] = useState<TopicProgress | null>(null);
  const [syllabus, setSyllabus] = useState<SyllabusSubject[]>([]);
  const [userProfile, setUserProfile] = useState<any | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Find the topic and subject data
  const subject = syllabus.find(s => s.id === subjectId);
  const topic = subject?.topics.find(t => t.id === topicId);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !topicId) {
        return;
      }

      try {
        const [progressData, syllabusData, userData] = await Promise.all([
          getTopicProgress(user.uid, topicId, activeCourseId ?? undefined),
          getSyllabus(user.uid, activeCourseId ?? undefined),
          getUser(user.uid),
        ]);

        setSyllabus(syllabusData);
        if (userData) setUserProfile(userData);

        if (progressData) {
          setTopicProgress(progressData);
          setUserNotes(progressData.userNotes ?? '');
        } else {
          // Create initial progress if it doesn't exist
          const initialProgress: Partial<TopicProgress> = {
            topicId,
            subjectId: subjectId ?? '',
            masteryScore: 0,
            lastRevised: Timestamp.now(),
            nextRevision: Timestamp.now(),
            revisionCount: 0,
            totalStudyTime: 0,
            userNotes: '',
            personalContext: '',
            tags: [],
            difficulty: 3,
            importance: 3,
            lastScoreImprovement: 0,
          };

          await updateTopicProgress(user.uid, topicId, initialProgress, activeCourseId ?? undefined);
          setTopicProgress(initialProgress as TopicProgress);
        }
      } catch (error) {
        console.error('Error fetching topic data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load topic data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, topicId, subjectId, activeCourseId, toast]);

  // ============================================
  // Action Handlers
  // ============================================

  const handleSaveNotes = async () => {
    if (!user || !topicProgress) {
      return;
    }
    setSaving(true);
    try {
      const updates = {
        userNotes,
        lastRevised: Timestamp.now(),
      };
      await updateTopicProgress(user.uid, topicId, updates, activeCourseId ?? undefined);
      setTopicProgress(prev => (prev ? { ...prev, ...updates } : null));

      toast({
        title: 'Notes Saved',
        description: 'Your study notes have been updated.',
      });
    } catch (error) {
      console.error('Error saving notes:', error);
      toast({
        title: 'Save Failed',
        description: 'Could not save notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const getNextRevisionDate = (currentCount: number) => {
    const revisionIntervals = userProfile?.preferences?.revisionIntervals || [7, 14, 30];
    const intervalIndex = Math.min(currentCount, revisionIntervals.length - 1);
    const daysUntilNext = revisionIntervals[intervalIndex] || 7;
    const nextDate = new Date();
    nextDate.setDate(nextDate.getDate() + daysUntilNext);
    return { date: nextDate, days: daysUntilNext };
  };

  const handleMarkCompleted = async () => {
    if (!user || !topicProgress) {
      return;
    }
    try {
      const isCompleted = topicProgress.status === 'completed';
      const newStatus = isCompleted ? 'in_progress' : 'completed';
      const scoreChange = isCompleted ? -10 : 10;

      const updates: Partial<TopicProgress> = {
        status: newStatus as 'not_started' | 'in_progress' | 'completed' | 'mastered',
        masteryScore: Math.min(Math.max((topicProgress.masteryScore || 0) + scoreChange, 0), 100),
        // Use null to clear the timestamp in Firestore (requires casting as type expects Timestamp | undefined)
        completedAt: isCompleted ? (null as unknown as Timestamp) : Timestamp.now(),
      };

      // Spaced Repetition Logic for Completion
      if (!isCompleted) {
         // If marking as completed for the first time (or re-completing), schedule next revision
         const { date: nextDate } = getNextRevisionDate(topicProgress.revisionCount || 0);
         updates.nextRevision = Timestamp.fromDate(nextDate);
         updates.lastRevised = Timestamp.now();
         updates.revisionCount = (topicProgress.revisionCount || 0) + 1;
      }

      await updateTopicProgress(user.uid, topicId, updates, activeCourseId ?? undefined);
      setTopicProgress(prev => (prev ? { ...prev, ...updates } : null));

      toast({
        title: isCompleted ? 'Marked In-Progress' : 'Topic Completed! 🎉',
        description: isCompleted ? 'Status reverted to in-progress.' : 'Great job! Mastery score updated.',
      });

      // Trigger confetti if marking as complete
      if (newStatus === 'completed') {
        confetti({
          particleCount: 150,
          spread: 70,
          origin: { y: 0.6 },
        });

        // Fire habit event for topic completion
        import('@/lib/services/habit-engine').then(async ({ habitEngine }) => {
          await habitEngine.processEvent({
            userId: user.uid,
            eventType: 'TOPIC_COMPLETED',
            courseId: activeCourseId,
          });
          toast({
            title: "Habit Progress Updated! 📈",
            description: "Your daily consistency goal is closer!",
            className: "bg-gradient-to-r from-green-50 to-emerald-50 border-emerald-200 text-emerald-800"
          });
        }).catch(console.warn);
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to update status.' });
    }
  };

  const handleMarkMastered = async () => {
    if (!user || !topicProgress) return;
    try {
      // Logic for "I know this" - set mastery to 100% and schedule next revision
      const { date: nextDate, days } = getNextRevisionDate(topicProgress.revisionCount || 0);
      
      const updates = {
        status: 'mastered' as const,
        masteryScore: 100,
        completedAt: Timestamp.now(),
        lastRevised: Timestamp.now(),
        nextRevision: Timestamp.fromDate(nextDate),
        revisionCount: (topicProgress.revisionCount || 0) + 1,
        needsReview: false,
      };

      await updateTopicProgress(user.uid, topicId, updates, activeCourseId ?? undefined);
      setTopicProgress(prev => (prev ? { ...prev, ...updates } : null));

      toast({
        title: 'Mastered! 🎓',
        description: `Marked as mastered! Next review in ${days} days.`,
      });

      confetti({
        particleCount: 200,
        spread: 90,
        origin: { y: 0.6 },
        colors: ['#10b981', '#34d399', '#f59e0b']
      });

      // Fire habit event for mastery
      import('@/lib/services/habit-engine').then(async ({ habitEngine }) => {
        await habitEngine.processEvent({
          userId: user.uid,
          eventType: 'TOPIC_COMPLETED',
          courseId: activeCourseId,
        });
        toast({
          title: "Habit Progress Updated! 📈",
          description: "Mastery counts towards your daily goal!",
          className: "bg-gradient-to-r from-green-50 to-emerald-50 border-emerald-200 text-emerald-800"
        });
      }).catch(console.warn);

    } catch (error) {
      console.error('Error marking mastered:', error);
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to update mastery.' });
    }
  };

  const handleNeedsReview = async () => {
    if (!user || !topicProgress) {
      return;
    }
    try {
      const needsReview = !topicProgress.needsReview;
      const updates = {
        needsReview,
        reviewRequestedAt: needsReview ? Timestamp.now() : (null as unknown as Timestamp),
      };

      await updateTopicProgress(user.uid, topicId, updates, activeCourseId ?? undefined);
      setTopicProgress(prev => (prev ? { ...prev, ...updates } : null));

      toast({
        title: needsReview ? 'Flagged for Review 🚩' : 'Review Flag Cleared',
        description: needsReview ? 'Topic marked for future review.' : 'You can move on now!',
      });
    } catch (error) {
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to update review flag.' });
    }
  };

  const handleToggleQuestion = useCallback(
    async (slug: string, _link?: string, name?: string) => {
      if (!user || !topicProgress) {
        return;
      }

      const isSolved = topicProgress.solvedQuestions?.includes(slug);

      // Optimistic Update
      const newSolved = isSolved
        ? (topicProgress.solvedQuestions || []).filter(s => s !== slug)
        : [...(topicProgress.solvedQuestions || []), slug];

      const newPracticeCount = isSolved ? topicProgress.practiceCount || 0 : (topicProgress.practiceCount || 0) + 1;

      setTopicProgress(prev =>
        prev
          ? {
              ...prev,
              solvedQuestions: newSolved,
              practiceCount: newPracticeCount,
            }
          : null
      );

      try {
        await toggleQuestionSolved(user.uid, topicId, slug, activeCourseId ?? undefined);
        if (!isSolved) {
          toast({ title: 'Problem Solved! 🚀', description: `Marked "${name || 'Problem'}" as solved.` });
          // Trigger confetti if marking as solved
          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
          });
        }
      } catch (error) {
        // Revert on failure
        setTopicProgress(prev =>
          prev
            ? {
                ...prev,
                solvedQuestions: topicProgress.solvedQuestions || [],
                practiceCount: topicProgress.practiceCount || 0,
              }
            : null
        );
        toast({ title: 'Error', variant: 'destructive', description: 'Failed to save progress.' });
      }
    },
    [user, topicProgress, topicId, toast]
  );

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50">
          <Navigation />
          <BottomNav />
          <TopicDetailSkeleton />
        </div>
      </AuthGuard>
    );
  }

  if (!topic || !subject) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50 flex flex-col">
          <Navigation />
          <BottomNav />
          <div className="flex-1 flex flex-col items-center justify-center p-6 text-center space-y-4">
            <h1 className="text-2xl font-bold text-slate-900">Topic Not Found</h1>
            <p className="text-slate-500">The requested topic could not be loaded.</p>
            <Link href="/syllabus">
              <Button>Back to Syllabus</Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-slate-50">
        <Navigation />
        <BottomNav />

        <PageTransition>
          <TopicDetailLayout
            hero={<TopicHero topic={topic} subject={subject} progress={topicProgress} />}
            content={
              <div className="space-y-8">
                <TopicContentTabs
                  topic={topic}
                  progress={topicProgress}
                  userNotes={userNotes}
                  saving={saving}
                  userId={user?.uid ?? ''}
                  onNotesChange={setUserNotes}
                  onSaveNotes={handleSaveNotes}
                  onToggleQuestion={handleToggleQuestion}
                />

                <InterviewQuestionsSection questions={topic.interviewQuestions || []} />
              </div>
            }
            rail={
              <TopicStatsRail
                progress={topicProgress}
                onMarkCompleted={handleMarkCompleted}
                onMarkMastered={handleMarkMastered}
                onNeedsReview={handleNeedsReview}
              />
            }
          />
        </PageTransition>
      </div>
    </AuthGuard>
  );
}
