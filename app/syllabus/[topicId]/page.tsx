'use client';

import PageTransition from '@/components/layout/PageTransition';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import Navigation from '@/components/Navigation';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import {
  getSyllabus,
  getTopicProgress,
  updateTopicProgress,
  toggleQuestionSolved,
} from '@/lib/firebase/firebase-utils';
import { TopicProgress, SyllabusSubject } from '@/types/exam';
import { TopicDetailSkeleton } from '@/components/skeletons';
import { Timestamp } from 'firebase/firestore';

// Redesign Components
import { TopicDetailLayout } from '@/components/topic-detail/TopicDetailLayout';
import { TopicHero } from '@/components/topic-detail/TopicHero';
import { TopicStatsRail } from '@/components/topic-detail/TopicStatsRail';
import { TopicContentTabs } from '@/components/topic-detail/TopicContentTabs';
import confetti from 'canvas-confetti';

export default function TopicDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();

  const topicId = params.topicId as string;
  const subjectId = searchParams.get('subject');

  const [topicProgress, setTopicProgress] = useState<TopicProgress | null>(null);
  const [syllabus, setSyllabus] = useState<SyllabusSubject[]>([]);
  const [userNotes, setUserNotes] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Find the topic and subject data
  const subject = syllabus.find(s => s.id === subjectId);
  const topic = subject?.topics.find(t => t.id === topicId);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !topicId) return;

      try {
        const [progressData, syllabusData] = await Promise.all([
          getTopicProgress(user.uid, topicId),
          getSyllabus(user.uid),
        ]);

        setSyllabus(syllabusData);

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

          await updateTopicProgress(user.uid, topicId, initialProgress);
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
  }, [user, topicId, subjectId, toast]);

  // ============================================
  // Action Handlers
  // ============================================

  const handleSaveNotes = async () => {
    if (!user || !topicProgress) return;
    setSaving(true);
    try {
      const updates = {
        userNotes,
        lastRevised: Timestamp.now(),
      };
      await updateTopicProgress(user.uid, topicId, updates);
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

  const handleMarkCompleted = async () => {
    if (!user || !topicProgress) return;
    try {
      const isCompleted = topicProgress.status === 'completed';
      const newStatus = isCompleted ? 'in_progress' : 'completed';
      const scoreChange = isCompleted ? -10 : 10;

      const updates = {
        status: newStatus as 'completed' | 'in_progress',
        masteryScore: Math.min(Math.max((topicProgress.masteryScore || 0) + scoreChange, 0), 100),
        // Use null to clear the timestamp in Firestore (requires casting as type expects Timestamp | undefined)
        completedAt: isCompleted ? (null as unknown as Timestamp) : Timestamp.now(),
      };

      await updateTopicProgress(user.uid, topicId, updates);
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
      }
    } catch (error) {
      console.error('Error toggling completion:', error);
      toast({ title: 'Error', variant: 'destructive', description: 'Failed to update status.' });
    }
  };

  const handleNeedsReview = async () => {
    if (!user || !topicProgress) return;
    try {
      const needsReview = !topicProgress.needsReview;
      const updates = {
        needsReview,
        reviewRequestedAt: needsReview ? Timestamp.now() : (null as unknown as Timestamp),
      };

      await updateTopicProgress(user.uid, topicId, updates);
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
      if (!user || !topicProgress) return;

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
        await toggleQuestionSolved(user.uid, topicId, slug);
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
            }
            rail={
              <TopicStatsRail
                progress={topicProgress}
                onMarkCompleted={handleMarkCompleted}
                onNeedsReview={handleNeedsReview}
              />
            }
          />
        </PageTransition>
      </div>
    </AuthGuard>
  );
}
