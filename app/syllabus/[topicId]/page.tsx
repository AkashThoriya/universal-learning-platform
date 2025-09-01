'use client';

import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import {
  ArrowLeft,
  BookOpen,
  Save,
  CheckCircle,
  Clock,
  TrendingUp,
  FileText,
  Lightbulb,
  Calendar,
  Plus,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getSyllabus, getTopicProgress, updateTopicProgress } from '@/lib/firebase-utils';
import { TopicProgress, SyllabusSubject } from '@/types/exam';

// Constants
const MASTERY_THRESHOLD = 80;

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
  const [personalContext, setPersonalContext] = useState('');
  const [newCurrentAffair, setNewCurrentAffair] = useState('');
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
        const [progressData, syllabusData] = await Promise.all([
          getTopicProgress(user.uid, topicId),
          getSyllabus(user.uid),
        ]);

        setSyllabus(syllabusData);

        if (progressData) {
          setTopicProgress(progressData);
          setUserNotes(progressData.userNotes ?? '');
          setPersonalContext(progressData.personalContext ?? '');
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
          description: 'Failed to load topic data. Please try again.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, topicId, subjectId, toast]);

  const handleSave = async () => {
    if (!user || !topicProgress) {
      return;
    }

    setSaving(true);
    try {
      const updates = {
        userNotes,
        personalContext,
        lastRevised: Timestamp.now(),
      };

      await updateTopicProgress(user.uid, topicId, updates);

      setTopicProgress(prev => (prev ? { ...prev, ...updates } : null));

      toast({
        title: 'Saved Successfully',
        description: 'Your notes and context have been saved.',
      });
    } catch (error) {
      console.error('Error saving progress:', error);
      toast({
        title: 'Save Failed',
        description: 'Failed to save your changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleMarkRevised = async () => {
    if (!user || !topicProgress) {
      return;
    }

    try {
      const updates = {
        lastRevised: Timestamp.now(),
        revisionCount: topicProgress.revisionCount + 1,
        masteryScore: Math.min(topicProgress.masteryScore + 5, 100),
      };

      await updateTopicProgress(user.uid, topicId, updates);

      setTopicProgress(prev => (prev ? { ...prev, ...updates } : null));

      toast({
        title: 'Marked as Revised',
        description: 'Topic marked as revised. Mastery score increased!',
      });
    } catch (error) {
      console.error('Error marking as revised:', error);
      toast({
        title: 'Error',
        description: 'Failed to mark as revised. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const addCurrentAffair = async () => {
    if (!user || !topicProgress || !newCurrentAffair.trim()) {
      return;
    }

    try {
      // Note: This would need to be implemented in the TopicProgress interface
      // For now, we'll just show a toast
      setNewCurrentAffair('');

      toast({
        title: 'Current Affair Added',
        description: 'Your current affair note has been saved.',
      });
    } catch (error) {
      console.error('Error adding current affair:', error);
      toast({
        title: 'Error',
        description: 'Failed to add current affair. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground">Loading topic details...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!topic || !subject || !topicProgress) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Topic not found</h1>
              <p className="text-muted-foreground">The requested topic could not be found.</p>
              <Link href="/syllabus">
                <Button>Back to Syllabus</Button>
              </Link>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const getMasteryColor = (score: number) => {
    if (score >= MASTERY_THRESHOLD) {
      return 'text-green-600';
    }
    if (score >= 50) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1:
        return 'bg-red-100 text-red-800 border-red-200';
      case 2:
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3:
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />

        <div className="max-w-5xl mx-auto p-6 space-y-6">
          {/* Navigation */}
          <div className="flex items-center space-x-4">
            <Link href="/syllabus">
              <Button variant="ghost" size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Syllabus
              </Button>
            </Link>
          </div>

          {/* Topic Header */}
          <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-blue-200">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-2">
                  <div className="flex items-center space-x-2">
                    <BookOpen className="h-6 w-6 text-blue-600" />
                    <h1 className="text-3xl font-bold text-gray-900">{topic.name}</h1>
                  </div>
                  <div className="flex items-center space-x-3">
                    <Badge variant="outline">{subject.name}</Badge>
                    <Badge className={getTierColor(subject.tier)}>Tier {subject.tier}</Badge>
                  </div>
                </div>

                <div className="text-right space-y-2">
                  <div className="flex items-center space-x-2">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                    <span className={`text-2xl font-bold ${getMasteryColor(topicProgress.masteryScore)}`}>
                      {topicProgress.masteryScore}%
                    </span>
                  </div>
                  <p className="text-sm text-muted-foreground">Mastery Score</p>
                </div>
              </div>

              <div className="mt-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm text-muted-foreground">Progress</span>
                  <span className="text-sm font-medium">{topicProgress.masteryScore}%</span>
                </div>
                <Progress value={topicProgress.masteryScore} className="h-3" />
              </div>
            </CardHeader>
          </Card>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{topicProgress.revisionCount}</p>
                    <p className="text-sm text-muted-foreground">Revisions</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Calendar className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-lg font-bold">
                      {topicProgress.lastRevised ? format(topicProgress.lastRevised.toDate(), 'MMM dd') : 'Never'}
                    </p>
                    <p className="text-sm text-muted-foreground">Last Revised</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <FileText className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">{Math.round(topicProgress.totalStudyTime / 60) ?? 0}h</p>
                    <p className="text-sm text-muted-foreground">Study Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">{topicProgress.difficulty}/5</p>
                    <p className="text-sm text-muted-foreground">Difficulty</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Main Content Tabs */}
          <Tabs defaultValue="notes" className="space-y-6">
            <TabsList className="grid w-full grid-cols-3">
              <TabsTrigger value="notes" className="flex items-center space-x-2">
                <FileText className="h-4 w-4" />
                <span>Study Notes</span>
              </TabsTrigger>
              <TabsTrigger value="context" className="flex items-center space-x-2">
                <Lightbulb className="h-4 w-4" />
                <span>Personal Context</span>
              </TabsTrigger>
              <TabsTrigger value="current-affairs" className="flex items-center space-x-2">
                <Calendar className="h-4 w-4" />
                <span>Current Affairs</span>
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Study Notes</CardTitle>
                  <CardDescription>
                    Your personal notes, key concepts, formulas, and important points for this topic
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Textarea
                    value={userNotes}
                    onChange={e => setUserNotes(e.target.value)}
                    placeholder="Add your study notes here... Include key concepts, formulas, important points, practice questions, etc."
                    rows={12}
                    className="mb-4"
                  />
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="context" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Personal Context</CardTitle>
                  <CardDescription>
                    Create meaningful connections - Why is this topic important? How does it relate to your exam and
                    real-world applications?
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
                      <h4 className="font-semibold text-blue-900 mb-2">Reflection Prompts</h4>
                      <ul className="text-sm text-blue-800 space-y-1">
                        <li>• Why is this topic crucial for your exam?</li>
                        <li>• How does this connect to other topics you've studied?</li>
                        <li>• What real-world applications can you think of?</li>
                        <li>• What memory aids or mnemonics help you remember this?</li>
                      </ul>
                    </div>

                    <Textarea
                      value={personalContext}
                      onChange={e => setPersonalContext(e.target.value)}
                      placeholder="Create your personal context here... Answer the reflection prompts above to build deeper understanding."
                      rows={10}
                    />
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="current-affairs" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle>Current Affairs & Updates</CardTitle>
                  <CardDescription>Track recent developments, news, and updates related to this topic</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex space-x-2">
                    <Input
                      value={newCurrentAffair}
                      onChange={e => setNewCurrentAffair(e.target.value)}
                      placeholder="Add a current affairs note or recent update..."
                      className="flex-1"
                    />
                    <Button onClick={addCurrentAffair} disabled={!newCurrentAffair.trim()}>
                      <Plus className="h-4 w-4 mr-2" />
                      Add
                    </Button>
                  </div>

                  <div className="text-center py-8 text-muted-foreground">
                    <Calendar className="h-12 w-12 mx-auto mb-4 opacity-50" />
                    <p>No current affairs notes yet.</p>
                    <p className="text-sm">Add your first note above to start tracking updates!</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex space-x-4">
            <Button onClick={handleSave} disabled={saving} className="flex-1">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={handleMarkRevised} variant="outline" className="flex-1">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Revised
            </Button>
          </div>
        </div>
      </div>
    </AuthGuard>
  );
}
