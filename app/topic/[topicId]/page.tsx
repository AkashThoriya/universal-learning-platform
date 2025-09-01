'use client';

import { format } from 'date-fns';
import { doc, getDoc, setDoc, Timestamp } from 'firebase/firestore';
import { ArrowLeft, Building2, BookOpen, Plus, Calendar, Save, CheckCircle } from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import AuthGuard from '@/components/AuthGuard';
import { QuickSessionLauncher } from '@/components/micro-learning';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase';
import { logInfo, logError } from '@/lib/logger';
import { SUBJECTS_DATA } from '@/lib/subjects-data';
import { TopicProgress } from '@/types/exam';

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
  const searchParams = useSearchParams();
  const topicId = params.topicId as string;
  const subjectId = searchParams.get('subject');

  const [userProgress, setUserProgress] = useState<TopicProgress | null>(null);
  const [userNotes, setUserNotes] = useState('');
  const [userBankingContext, setUserBankingContext] = useState('');
  const [newCurrentAffair, setNewCurrentAffair] = useState('');
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  // Find the topic and subject data
  const subject = SUBJECTS_DATA.find(s => s.subjectId === subjectId);
  const topic = subject?.topics.find(t => t.id === topicId);

  useEffect(() => {
    const fetchProgress = async () => {
      if (!user || !topicId) {
        logInfo('Topic page: No user or topicId available, skipping fetch', {
          hasUser: !!user,
          topicId,
        });
        return;
      }

      logInfo('Topic page: Starting progress fetch', {
        userId: user.uid,
        topicId,
        subjectId,
      });

      try {
        const progressDoc = await getDoc(doc(db, 'users', user.uid, 'userProgress', topicId));
        if (progressDoc.exists()) {
          const data = progressDoc.data() as TopicProgress;
          setUserProgress(data);
          setUserNotes(data.userNotes ?? '');
          setUserBankingContext(data.userBankingContext ?? '');

          logInfo('Topic page: Existing progress loaded', {
            userId: user.uid,
            topicId,
            masteryScore: data.masteryScore,
            revisionCount: data.revisionCount,
          });
        } else {
          // Create initial progress document
          const initialProgress: TopicProgress = {
            id: topicId,
            topicId,
            subjectId: '', // Will be populated when syllabus data is available
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

          logInfo('Topic page: Created initial progress document', {
            userId: user.uid,
            topicId,
          });
        }
      } catch (error) {
        logError('Error fetching topic progress', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId: user.uid,
          topicId,
          context: 'topic_page_fetch_progress',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchProgress();
  }, [user, topicId, subjectId]);

  const handleSave = async () => {
    if (!user || !userProgress) {
      logInfo('Topic page: Cannot save - missing user or progress', {
        hasUser: !!user,
        hasProgress: !!userProgress,
        topicId,
      });
      return;
    }

    logInfo('Topic page: Starting save operation', {
      userId: user.uid,
      topicId,
      notesLength: userNotes.length,
      contextLength: userBankingContext.length,
    });

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

      logInfo('Topic page: Progress saved successfully', {
        userId: user.uid,
        topicId,
        dataSize: JSON.stringify(updatedProgress).length,
      });
    } catch (error) {
      logError('Error saving topic progress', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: user.uid,
        topicId,
        context: 'topic_page_save_progress',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCurrentAffair = async () => {
    if (!user || !userProgress || !newCurrentAffair.trim()) {
      logInfo('Topic page: Cannot add current affair - missing requirements', {
        hasUser: !!user,
        hasProgress: !!userProgress,
        hasContent: !!newCurrentAffair.trim(),
        topicId,
      });
      return;
    }

    logInfo('Topic page: Adding current affair', {
      userId: user.uid,
      topicId,
      contentLength: newCurrentAffair.trim().length,
    });

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

      logInfo('Topic page: Current affair added successfully', {
        userId: user.uid,
        topicId,
        totalAffairs: updatedProgress.currentAffairs.length,
      });
    } catch (error) {
      logError('Error adding current affair', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        userId: user.uid,
        topicId,
        context: 'topic_page_add_current_affair',
      });
    }
  };

  const handleMarkRevised = async () => {
    if (!user || !userProgress) {
      return;
    }

    const updatedProgress = {
      ...userProgress,
      lastRevised: Timestamp.now(),
      masteryScore: Math.min(userProgress.masteryScore + 10, 100),
    };

    try {
      await setDoc(doc(db, 'users', user.uid, 'userProgress', topicId), updatedProgress);
      setUserProgress(updatedProgress);
    } catch (error) {
      console.error('Error marking as revised:', error);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
        </div>
      </AuthGuard>
    );
  }

  if (!topic || !subject) {
    return (
      <AuthGuard>
        <div className="min-h-screen flex items-center justify-center">
          <div className="text-center space-y-4">
            <h1 className="text-2xl font-bold">Topic not found</h1>
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

        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="flex items-center space-x-4">
            <Link href={`/subjects/${subjectId}`}>
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to {subject.name}
              </Button>
            </Link>
          </div>

          {/* Topic Header */}
          <div className="text-center space-y-4">
            <div className="space-y-2">
              <h1 className="text-4xl font-bold text-gray-900">{topic.name}</h1>
              <div className="flex items-center justify-center space-x-3">
                <Badge variant="outline">{subject.name}</Badge>
                {userProgress && (
                  <Badge className={getMasteryBadgeClass(userProgress.masteryScore)}>
                    Mastery: {userProgress.masteryScore}%
                  </Badge>
                )}
                {userProgress?.lastRevised && (
                  <Badge variant="secondary">Last revised: {format(userProgress.lastRevised.toDate(), 'MMM dd')}</Badge>
                )}
              </div>
            </div>
          </div>

          {/* Banking Context */}
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
                <p className="text-gray-700 leading-relaxed">{topic.bankingContext}</p>
              </div>

              <div className="space-y-2">
                <label htmlFor="banking-context-notes" className="text-sm font-medium text-yellow-900">Your Personal Banking Context Notes</label>
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
                    .sort((a, b) => b.date.toMillis() - a.date.toMillis())
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
              <QuickSessionLauncher
                userId={user?.uid ?? ''}
                sessions={[
                  {
                    title: `${topic?.name} - Quick Review`,
                    description: `15-minute focused session on ${topic?.name} concepts`,
                    subjectId: subjectId ?? '',
                    topicId,
                    track: 'exam' as const,
                    duration: 15,
                    difficulty: 'intermediate' as const,
                  },
                  {
                    title: `${topic?.name} - Practical Application`,
                    description: `Apply ${topic?.name} in real banking scenarios`,
                    subjectId: subjectId ?? '',
                    topicId,
                    track: 'course_tech' as const,
                    duration: 20,
                    difficulty: 'advanced' as const,
                  },
                ]}
                onStartSession={(subjectId, topicId, track, duration) => {
                  window.location.href = `/micro-learning?auto=true&subject=${subjectId}&topic=${topicId}&track=${track}&duration=${duration}`;
                }}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </AuthGuard>
  );
}
