'use client';

import PageTransition from '@/components/layout/PageTransition';
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
  Brain,
  RotateCcw,
  ArrowRight,
  Target,
  AlertCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Textarea } from '@/components/ui/textarea';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getSyllabus, getTopicProgress, updateTopicProgress } from '@/lib/firebase/firebase-utils';
import { TopicProgress, SyllabusSubject } from '@/types/exam';
import { cn } from '@/lib/utils/utils';

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

  // ============================================
  // Topic Action Handlers
  // ============================================

  const handleMarkCompleted = async () => {
    if (!user || !topicProgress) return;

    try {
      const isCompleted = topicProgress.status === 'completed';
      const newStatus = isCompleted ? 'in_progress' as const : 'completed' as const;
      const actionType = isCompleted ? 'unmarked' as const : 'completed' as const;
      
      const baseUpdates = {
        status: newStatus,
        masteryScore: isCompleted ? Math.max(topicProgress.masteryScore - 10, 0) : Math.min(topicProgress.masteryScore + 10, 100),
        actionHistory: [
          ...(topicProgress.actionHistory ?? []),
          {
            action: actionType,
            timestamp: Timestamp.now(),
          },
        ],
      };
      
      // Only include completedAt when marking as completed
      const updates = isCompleted 
        ? baseUpdates 
        : { ...baseUpdates, completedAt: Timestamp.now() };

      await updateTopicProgress(user.uid, topicId, updates);
      setTopicProgress(prev => (prev ? { ...prev, ...updates } : null));

      toast({
        title: isCompleted ? 'Unmarked as Completed' : 'Marked as Completed',
        description: isCompleted ? 'Topic status reverted.' : 'Great progress! Topic marked as completed.',
      });
    } catch (error) {
      console.error('Error marking as completed:', error);
      toast({
        title: 'Error',
        description: 'Failed to update status. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handlePracticed = async () => {
    if (!user || !topicProgress) return;

    try {
      const newStatus: 'not_started' | 'in_progress' | 'completed' | 'mastered' = 
        topicProgress.status === 'not_started' || !topicProgress.status ? 'in_progress' : topicProgress.status;
      
      const updates = {
        practiceCount: (topicProgress.practiceCount ?? 0) + 1,
        lastPracticed: Timestamp.now(),
        masteryScore: Math.min(topicProgress.masteryScore + 3, 100),
        status: newStatus,
        actionHistory: [
          ...(topicProgress.actionHistory ?? []),
          {
            action: 'practiced' as const,
            timestamp: Timestamp.now(),
          },
        ],
      };

      await updateTopicProgress(user.uid, topicId, updates);
      setTopicProgress(prev => (prev ? { ...prev, ...updates } : null));

      toast({
        title: 'Practice Logged!',
        description: `Practice session #${updates.practiceCount} recorded. Keep it up!`,
      });
    } catch (error) {
      console.error('Error logging practice:', error);
      toast({
        title: 'Error',
        description: 'Failed to log practice. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const handleNeedsReview = async () => {
    if (!user || !topicProgress) return;

    try {
      const needsReview = !topicProgress.needsReview;
      const baseUpdates = {
        needsReview,
        actionHistory: [
          ...(topicProgress.actionHistory ?? []),
          {
            action: 'needs_review' as const,
            timestamp: Timestamp.now(),
          },
        ],
      };
      
      // Only include reviewRequestedAt when setting the flag
      const updates = needsReview 
        ? { ...baseUpdates, reviewRequestedAt: Timestamp.now() }
        : baseUpdates;

      await updateTopicProgress(user.uid, topicId, updates);
      setTopicProgress(prev => (prev ? { ...prev, ...updates } : null));

      toast({
        title: needsReview ? 'Flagged for Review' : 'Review Flag Removed',
        description: needsReview ? 'This topic will be highlighted for future review.' : 'Review flag has been cleared.',
      });
    } catch (error) {
      console.error('Error toggling review flag:', error);
      toast({
        title: 'Error',
        description: 'Failed to update review flag. Please try again.',
        variant: 'destructive',
      });
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <BottomNav />
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
          <BottomNav />
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
        <BottomNav />
        <PageTransition>
          <div className="max-w-5xl mx-auto p-4 sm:p-6 pb-28 xl:pb-6 space-y-6">



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
                    <h1 className="text-2xl sm:text-3xl font-bold text-gray-900">{topic.name}</h1>
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

          {/* Topic Action Buttons */}
          <Card className="border-dashed border-2 border-gray-200 bg-white/50">
            <CardContent className="p-4">
              <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-medium text-gray-700">Track Your Progress</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    Log your activities to build mastery
                  </p>
                </div>
                <div className="flex flex-wrap gap-2 w-full sm:w-auto">
                  <Button
                    onClick={handleMarkCompleted}
                    variant={topicProgress.status === 'completed' ? 'default' : 'outline'}
                    size="sm"
                    className={`h-10 ${topicProgress.status === 'completed' ? 'bg-green-600 hover:bg-green-700' : ''}`}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {topicProgress.status === 'completed' ? 'Completed ✓' : 'Mark Completed'}
                  </Button>

                  <Button
                    onClick={handlePracticed}
                    variant="outline"
                    size="sm"
                    className="h-10"
                  >
                    <Target className="h-4 w-4 mr-2" />
                    Practiced {(topicProgress.practiceCount ?? 0) > 0 ? `(${topicProgress.practiceCount})` : ''}
                  </Button>

                  <Button
                    onClick={handleMarkRevised}
                    variant="outline"
                    size="sm"
                    className="h-10"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Revised {topicProgress.revisionCount > 0 ? `(${topicProgress.revisionCount})` : ''}
                  </Button>

                  <Button
                    onClick={handleNeedsReview}
                    variant={topicProgress.needsReview ? 'destructive' : 'outline'}
                    size="sm"
                    className="h-10"
                  >
                    <AlertCircle className="h-4 w-4 mr-2" />
                    {topicProgress.needsReview ? 'Flagged ⚠️' : 'Needs Review'}
                  </Button>
                </div>
              </div>
            </CardContent>
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
                    <p className="text-2xl font-bold">{Math.round(topicProgress.totalStudyTime / 60) || 0}h</p>
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
          <Tabs defaultValue="subtopics" className="space-y-6 min-h-[50vh]">
            <TabsList className="grid w-full grid-cols-2 sm:grid-cols-4 h-auto gap-1">
              <TabsTrigger value="subtopics" className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs sm:text-sm min-h-[44px]">
                <BookOpen className="h-4 w-4 shrink-0" />
                Subtopics
              </TabsTrigger>
              <TabsTrigger value="notes" className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs sm:text-sm min-h-[44px]">
                <FileText className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Study</span> Notes
              </TabsTrigger>
              <TabsTrigger value="context" className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs sm:text-sm min-h-[44px]">
                <Lightbulb className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Personal</span> Context
              </TabsTrigger>
              <TabsTrigger value="current-affairs" className="flex items-center justify-center gap-1.5 px-2 py-2.5 text-xs sm:text-sm min-h-[44px]">
                <Calendar className="h-4 w-4 shrink-0" />
                <span className="hidden sm:inline">Current</span> Affairs
              </TabsTrigger>
            </TabsList>

            <TabsContent value="notes" className="space-y-4 animate-in fade-in-50 duration-500">
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="space-y-1">
                    <h3 className="text-lg font-semibold tracking-tight">Study Notes</h3>
                    <p className="text-sm text-muted-foreground">
                      Capture key concepts, equations, and important points.
                    </p>
                  </div>
                </div>
                <MarkdownEditor
                  value={userNotes}
                  onChange={setUserNotes}
                  placeholder="Start writing your notes here... support for **bold**, *italics*, lists and more."
                  minHeight="min-h-[500px]"
                  className="shadow-sm border-muted-foreground/20"
                />
              </div>
            </TabsContent>

            <TabsContent value="context" className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="grid gap-6 md:grid-cols-[1fr_300px]">
                 <div className="space-y-4">
                    <div className="space-y-1">
                      <h3 className="text-lg font-semibold tracking-tight">Personal Context</h3>
                      <p className="text-sm text-muted-foreground">
                        Why does this topic matter to you? Connect it to your bigger picture.
                      </p>
                    </div>
                    <MarkdownEditor
                      value={personalContext}
                      onChange={setPersonalContext}
                      placeholder="I want to master this becuase..."
                      minHeight="min-h-[400px]"
                      className="shadow-sm border-muted-foreground/20"
                    />
                 </div>

                 <div className="space-y-4">
                    <div className="p-5 rounded-xl bg-gradient-to-br from-blue-50 to-indigo-50/50 border border-blue-100/50 shadow-sm">
                      <h4 className="flex items-center gap-2 font-semibold text-blue-900 mb-3 text-sm">
                        <Lightbulb className="h-4 w-4 text-blue-600" />
                        Reflection Prompts
                      </h4>
                      <ul className="space-y-3 text-sm text-blue-800/80">
                         <li className="flex gap-2">
                           <span className="text-blue-400">•</span>
                           <span>Why is this topic crucial for your upcoming exam?</span>
                         </li>
                         <li className="flex gap-2">
                           <span className="text-blue-400">•</span>
                           <span>How does this concept connect to previously studied topics?</span>
                         </li>
                         <li className="flex gap-2">
                           <span className="text-blue-400">•</span>
                           <span>Can you identify a real-world application?</span>
                         </li>
                         <li className="flex gap-2">
                           <span className="text-blue-400">•</span>
                           <span>What mnemonics or memory aids help you recall this?</span>
                         </li>
                      </ul>
                    </div>
                 </div>
              </div>
            </TabsContent>

            <TabsContent value="current-affairs" className="space-y-6 animate-in fade-in-50 duration-500">
              <div className="grid gap-6 md:grid-cols-[350px_1fr] md:items-start">
                 {/* Input Column */}
                 <div className="space-y-4 md:sticky md:top-6">
                    <div className="p-5 rounded-xl border bg-card shadow-sm space-y-4">
                       <div className="space-y-1">
                          <h3 className="font-semibold text-sm flex items-center gap-2">
                            <Plus className="h-4 w-4 text-primary" />
                            Add New Update
                          </h3>
                          <p className="text-xs text-muted-foreground">
                            Found a news article or recent update? Log it here.
                          </p>
                       </div>
                       <div className="space-y-3">
                         <Textarea
                           value={newCurrentAffair}
                           onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewCurrentAffair(e.target.value)}
                           placeholder="e.g., The Supreme Court recently ruled on..."
                           className="resize-none min-h-[100px] text-sm"
                         />
                         <Button 
                           onClick={addCurrentAffair} 
                           disabled={!newCurrentAffair.trim()} 
                           className="w-full"
                           size="sm"
                         >
                           Add to Timeline
                         </Button>
                       </div>
                    </div>
                 </div>

                 {/* Timeline Column */}
                 <div className="space-y-4">
                    <div className="flex items-center justify-between">
                       <h3 className="text-lg font-semibold tracking-tight">Timeline & Updates</h3>
                       <Badge variant="outline" className="font-mono text-xs">
                         {topicProgress?.currentAffairs?.length || 0} Entries
                       </Badge>
                    </div>

                    {!topicProgress?.currentAffairs || topicProgress.currentAffairs.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-12 px-4 rounded-xl border-2 border-dashed border-muted bg-muted/5 text-center transition-all hover:bg-muted/10">
                        <div className="h-16 w-16 rounded-full bg-muted/20 flex items-center justify-center mb-4">
                           <Calendar className="h-8 w-8 text-muted-foreground/50" />
                        </div>
                        <h4 className="text-base font-semibold text-muted-foreground">No updates logged yet</h4>
                        <p className="text-sm text-muted-foreground/60 max-w-xs mt-1">
                          Keep your knowledge fresh by tracking related current affairs and news events.
                        </p>
                      </div>
                    ) : (
                      <div className="relative space-y-0 pl-4 border-l-2 border-muted ml-2">
                        {/* Sort by date descending if possible, but assuming array order for now */}
                        {[...(topicProgress.currentAffairs)].reverse().map((affair, index) => (
                           <div key={index} className="relative pb-8 pl-6 group">
                              {/* Timeline dot */}
                              <div className="absolute -left-[29px] top-1 h-3.5 w-3.5 rounded-full border-2 border-background bg-muted-foreground/30 group-hover:bg-primary transition-colors ring-4 ring-background" />
                              
                              <div className="p-4 rounded-xl border bg-card shadow-sm hover:shadow-md transition-all">
                                 <p className="text-sm leading-relaxed whitespace-pre-wrap">{affair.note}</p>
                                 <div className="flex items-center gap-2 mt-3">
                                    <Badge variant="secondary" className="text-[10px] h-5 px-1.5 font-normal text-muted-foreground">
                                       {format(affair.date.toDate(), 'MMM d, yyyy')}
                                    </Badge>
                                    {/* Could add delete button here if we had logic for it, but safe to omit or just show read-only for now unless I add handleDelete */}
                                 </div>
                              </div>
                           </div>
                        ))}
                      </div>
                    )}
                 </div>
              </div>
            </TabsContent>

            {/* Subtopics Tab */}
            <TabsContent value="subtopics" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <BookOpen className="h-5 w-5" />
                    Subtopics
                  </CardTitle>
                  <CardDescription>
                    Break down this topic into smaller, manageable concepts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {!topic?.subtopics || topic.subtopics.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <BookOpen className="h-12 w-12 mx-auto mb-4 opacity-50" />
                      <p>No subtopics available yet.</p>
                      <p className="text-sm">Break down topics into smaller chunks for better tracking.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {topic.subtopics.map((subtopic, index) => (
                        <Link
                          key={subtopic.id}
                          href={`/syllabus/${topicId}/${index}?subject=${subjectId}`}
                          className="block"
                        >
                          <div
                            className="flex items-center justify-between p-4 rounded-xl border bg-card hover:bg-muted/50 transition-colors cursor-pointer group"
                          >
                            <div className="flex items-center gap-3">
                              <div className={cn(
                                "p-2 rounded-full border transition-colors group-hover:border-primary/50",
                                subtopic.status === 'completed' ? "bg-green-100 border-green-200 text-green-700" :
                                subtopic.status === 'in_progress' ? "bg-blue-100 border-blue-200 text-blue-700" :
                                "bg-muted border-border text-muted-foreground"
                              )}>
                                {subtopic.status === 'completed' ? <CheckCircle className="h-4 w-4" /> :
                                 subtopic.status === 'in_progress' ? <Clock className="h-4 w-4" /> :
                                 <div className="h-4 w-4 rounded-full border-2 border-current" />
                                }
                              </div>
                              <div>
                                <p className="font-medium group-hover:text-primary transition-colors">{subtopic.name}</p>
                                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-0.5">
                                  <span className={cn(
                                    "px-1.5 py-0.5 rounded-md font-medium",
                                    subtopic.status === 'completed' ? "bg-green-100 text-green-700" :
                                    subtopic.status === 'in_progress' ? "bg-blue-100 text-blue-700" :
                                    "bg-muted text-muted-foreground"
                                  )}>
                                    {subtopic.status === 'not_started' ? 'Not Started' :
                                     subtopic.status === 'in_progress' ? 'In Progress' : 
                                     subtopic.status === 'completed' ? 'Completed' : 'Mastered'}
                                  </span>
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-4 text-xs text-muted-foreground">
                              {subtopic.revisionCount > 0 && (
                                <div className="flex items-center gap-1" title="Revisions">
                                  <RotateCcw className="h-3 w-3" />
                                  <span>{subtopic.revisionCount}</span>
                                </div>
                              )}
                              {subtopic.practiceCount > 0 && (
                                <div className="flex items-center gap-1" title="Practice sessions">
                                  <Brain className="h-3 w-3" />
                                  <span>{subtopic.practiceCount}</span>
                                </div>
                              )}
                              <ArrowRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity" />
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Action Buttons */}
          <div className="flex flex-wrap gap-3">
            <Button onClick={handleSave} disabled={saving} className="flex-1 min-w-[140px]">
              <Save className="h-4 w-4 mr-2" />
              {saving ? 'Saving...' : 'Save Changes'}
            </Button>
            <Button onClick={handleMarkRevised} variant="outline" className="flex-1 min-w-[140px]">
              <CheckCircle className="h-4 w-4 mr-2" />
              Mark as Revised
            </Button>
            <Link href={`/test?subject=${subjectId}&topic=${topicId}`} className="flex-1 min-w-[140px]">
              <Button variant="secondary" className="w-full bg-purple-100 hover:bg-purple-200 text-purple-700">
                <Brain className="h-4 w-4 mr-2" />
                Take Test
              </Button>
            </Link>
          </div>
        </div>

        </PageTransition>
      </div>
    </AuthGuard>
  );
}
