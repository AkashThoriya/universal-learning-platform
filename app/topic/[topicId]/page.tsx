'use client';

import { format } from 'date-fns';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { Building2, BookOpen, Plus, Calendar, Save, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
import { useState, useEffect, useCallback } from 'react';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { DetailPageHeader } from '@/components/layout/PageHeader';
import PageTransition from '@/components/layout/PageTransition';
import Navigation from '@/components/Navigation';
import { TopicDetailSkeleton } from '@/components/skeletons/SyllabusSkeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { getSyllabus } from '@/lib/firebase/firebase-utils';
import { logInfo, logError } from '@/lib/utils/logger';
import { TopicProgress, SyllabusSubject, SyllabusTopic } from '@/types/exam';

// Constants
const MASTERY_THRESHOLD = 80;
const MEDIUM_MASTERY_THRESHOLD = 50;

// Helper function for mastery badge styling
const getMasteryBadgeClass = (score: number): string => {
  if (score >= MASTERY_THRESHOLD) {
    return 'bg-green-100 text-green-800';
  }
  if (score >= MEDIUM_MASTERY_THRESHOLD) {
    return 'bg-yellow-100 text-yellow-800';
  }
  return 'bg-red-100 text-red-800';
};

export default function TopicPage() {
  const { user } = useAuth();
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const topicId = params.topicId as string;
  const initialSubjectId = searchParams.get('subject');

  const [topic, setTopic] = useState<SyllabusTopic | null>(null);
  const [subject, setSubject] = useState<SyllabusSubject | null>(null);
  const [userProgress, setUserProgress] = useState<TopicProgress | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [userBankingContext, setUserBankingContext] = useState('');
  const [newCurrentAffair, setNewCurrentAffair] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  const loadData = useCallback(async () => {
    if (!user?.uid || !topicId) {
      return;
    }
    let isMounted = true;

    try {
      setLoading(true);

      // 1. Fetch Syllabus to find Topic details
      const syllabus = await getSyllabus(user.uid);
      let foundTopic: SyllabusTopic | undefined;
      let foundSubject: SyllabusSubject | undefined;

      // Optimized search if subjectId is known, otherwise linear search
      if (initialSubjectId) {
        foundSubject = syllabus.find(s => s.id === initialSubjectId);
        foundTopic = foundSubject?.topics.find(t => t.id === topicId);
      } else {
        for (const s of syllabus) {
          const t = s.topics.find(topic => topic.id === topicId);
          if (t) {
            foundSubject = s;
            foundTopic = t;
            break;
          }
        }
      }

      if (isMounted) {
        setTopic(foundTopic || null);
        setSubject(foundSubject || null);
      }

      if (!foundTopic) {
        logError('Topic not found in syllabus', { topicId });
        if (isMounted) {
          setLoading(false);
        }
        return;
      }

      // 2. Fetch User Progress
      const progressDoc = await getDoc(doc(db, 'users', user.uid, 'userProgress', topicId));
      if (isMounted) {
        if (progressDoc.exists()) {
          const data = progressDoc.data() as TopicProgress;
          setUserProgress(data);
          setUserNotes(data.userNotes ?? '');
          setUserBankingContext(data.userBankingContext ?? '');
        } else {
          // Create initial progress state (not saving to DB yet to avoid clutter)
          const initialProgress: TopicProgress = {
            id: topicId,
            topicId,
            subjectId: foundSubject?.id || '',
            masteryScore: 0,
            lastRevised: Timestamp.now(),
            nextRevision: Timestamp.now(),
            revisionCount: 0,
            totalStudyTime: 0,
            userNotes: '',
            personalContext: '',
            userBankingContext: '',
            tags: [],
            difficulty: 3,
            importance: 3,
            lastScoreImprovement: 0,
            currentAffairs: [],
          };
          setUserProgress(initialProgress);
        }
      }
    } catch (error) {
      logError('Error loading topic data', error as Error);
    } finally {
      if (isMounted) {
        setLoading(false);
      }
    }
    return () => {
      isMounted = false;
    };
  }, [user?.uid, topicId, initialSubjectId]);

  useEffect(() => {
    const cleanup = loadData();
    return () => {
      cleanup.then(c => c?.());
    };
  }, [loadData]);

  const handleSave = async () => {
    if (!user || !userProgress) {
      return;
    }

    setSaving(true);
    try {
      const updatedProgress = {
        ...userProgress,
        userNotes,
        userBankingContext,
        lastRevised: Timestamp.now(),
      };

      await setDoc(doc(db, 'users', user.uid, 'userProgress', topicId), updatedProgress);
      setUserProgress(updatedProgress);

      logInfo('Topic progress saved', { topicId });
    } catch (error) {
      logError('Error saving topic progress', error as Error);
    } finally {
      setSaving(false);
    }
  };

  const handleAddCurrentAffair = async () => {
    if (!user || !userProgress || !newCurrentAffair.trim()) {
      return;
    }

    const newAffair = {
      date: Timestamp.now(),
      note: newCurrentAffair.trim(),
    };

    const updatedProgress = {
      ...userProgress,
      currentAffairs: [...(userProgress.currentAffairs ?? []), newAffair],
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'userProgress', topicId), updatedProgress);
      setUserProgress(updatedProgress);
      setNewCurrentAffair('');
    } catch (error) {
      logError('Error adding current affair', error as Error);
    }
  };

  const handleMarkRevised = async () => {
    if (!user || !userProgress) {
      return;
    }

    const nextRevisionDate = new Date();
    nextRevisionDate.setDate(nextRevisionDate.getDate() + 7);

    const updatedProgress = {
      ...userProgress,
      lastRevised: Timestamp.now(),
      masteryScore: Math.min(userProgress.masteryScore + 10, 100),
      nextRevision: Timestamp.fromDate(nextRevisionDate),
      revisionCount: (userProgress.revisionCount || 0) + 1,
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'userProgress', topicId), updatedProgress);
      setUserProgress(updatedProgress);
    } catch (error) {
      logError('Error marking revised', error as Error);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <BottomNav />
          <PageTransition>
            <TopicDetailSkeleton />
          </PageTransition>
        </div>
      </AuthGuard>
    );
  }

  if (!topic || !subject) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
          <div className="text-center space-y-4 p-6 bg-white rounded-xl shadow-lg">
            <h1 className="text-2xl font-bold text-gray-800">Topic not found</h1>
            <p className="text-gray-600">The topic you are looking for does not exist.</p>
            <Link href="/subjects">
              <Button>Back to Subjects</Button>
            </Link>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <BottomNav />

        <PageTransition>
          <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-40 sm:pb-40 xl:pb-6 space-y-6">
            <DetailPageHeader
              title={topic.name}
              description={subject.name}
              backHref={`/subjects/${subject.id}`}
              backLabel={subject.name}
              actions={
                <div className="flex items-center gap-2">
                  {userProgress && (
                    <Badge className={getMasteryBadgeClass(userProgress.masteryScore)}>
                      Mastery: {userProgress.masteryScore}%
                    </Badge>
                  )}
                  {userProgress?.lastRevised && (
                    <Badge variant="secondary">
                      Last revised: {format(userProgress.lastRevised.toDate(), 'MMM dd')}
                    </Badge>
                  )}
                </div>
              }
            />

            {/* Banking Context - Dynamic from Syllabus Data */}
            <Card className="bg-gradient-to-r from-yellow-50 to-orange-50 border-yellow-200">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Building2 className="h-5 w-5 text-yellow-600" />
                  <span className="text-yellow-900">Banking Context</span>
                </CardTitle>
                <CardDescription className="text-yellow-700">Why this topic matters in banking IT</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="bg-white p-4 rounded-lg border border-yellow-200">
                  <p className="text-gray-700 leading-relaxed">
                    {topic.description || 'No specific context provided for this topic.'}
                  </p>
                </div>

                <div className="space-y-2">
                  <label htmlFor="banking-context-notes" className="text-sm font-medium text-yellow-900">
                    Your Personal Banking Context Notes
                  </label>
                  <Textarea
                    id="banking-context-notes"
                    value={userBankingContext}
                    onChange={e => setUserBankingContext(e.target.value)}
                    placeholder="Add your own insights about how this topic applies to banking scenarios..."
                    rows={3}
                    className="bg-white border-yellow-200 focus:border-yellow-400"
                  />
                </div>
              </CardContent>
            </Card>

            {/* Study Notes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <BookOpen className="h-5 w-5 text-blue-600" />
                  <span>Study Notes</span>
                </CardTitle>
                <CardDescription>Your personal notes and key points for this topic</CardDescription>
              </CardHeader>
              <CardContent>
                <Textarea
                  value={userNotes}
                  onChange={e => setUserNotes(e.target.value)}
                  placeholder="Add your study notes, important formulas, key concepts, practice questions..."
                  rows={8}
                  className="mb-4"
                />
                <div className="flex space-x-2">
                  <Button onClick={handleSave} disabled={saving}>
                    <Save className="h-4 w-4 mr-2" />
                    {saving ? 'Saving...' : 'Save Notes'}
                  </Button>
                  <Button onClick={handleMarkRevised} variant="outline">
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Mark as Revised
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Current Affairs */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Calendar className="h-5 w-5 text-green-600" />
                  <span>Current Affairs & Updates</span>
                </CardTitle>
                <CardDescription>Latest banking news and updates related to this topic</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex space-x-2">
                  <Input
                    value={newCurrentAffair}
                    onChange={e => setNewCurrentAffair(e.target.value)}
                    placeholder="Add a current affairs note..."
                    className="flex-1"
                  />
                  <Button onClick={handleAddCurrentAffair} disabled={!newCurrentAffair.trim()}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add
                  </Button>
                </div>

                {userProgress?.currentAffairs && userProgress.currentAffairs.length > 0 ? (
                  <div className="space-y-2">
                    {userProgress.currentAffairs
                      .sort((a, b) => (b.date?.toMillis?.() || 0) - (a.date?.toMillis?.() || 0))
                      .map((affair, index) => (
                        <div key={index} className="bg-gray-50 p-3 rounded-lg">
                          <div className="flex items-start justify-between">
                            <p className="text-gray-700 flex-1">{affair.note}</p>
                            <span className="text-xs text-gray-500 ml-2">
                              {format(affair.date.toDate(), 'MMM dd, yyyy')}
                            </span>
                          </div>
                        </div>
                      ))}
                  </div>
                ) : (
                  <p className="text-muted-foreground text-center py-4">
                    No current affairs notes yet. Add your first one above!
                  </p>
                )}
              </CardContent>
            </Card>

            {/* Micro-Learning for this Topic */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="text-blue-900">Quick Learning Sessions</CardTitle>
                <CardDescription className="text-blue-700">
                  Start focused learning sessions for this specific topic
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <p className="text-sm text-blue-700">Ready to study this topic?</p>
                  <div className="flex gap-3">
                    <Button onClick={() => router.push('/syllabus')} className="bg-blue-600 hover:bg-blue-700">
                      <BookOpen className="h-4 w-4 mr-2" />
                      View Full Syllabus
                    </Button>
                    <Button
                      onClick={() => router.push(`/test?topic=${topicId}`)}
                      variant="outline"
                      className="border-blue-300"
                    >
                      <CheckCircle className="h-4 w-4 mr-2" />
                      Take Test
                    </Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </PageTransition>
      </div>
    </AuthGuard>
  );
}
