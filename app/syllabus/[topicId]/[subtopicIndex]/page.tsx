'use client';

import PageTransition from '@/components/layout/PageTransition';
import { DetailPageHeader } from '@/components/layout/PageHeader';
import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import {
  Save,
  CheckCircle,
  TrendingUp,
  FileText,
  Lightbulb,
  Plus,
  Trash2,
  Brain,
} from 'lucide-react';
import { useParams, useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import Navigation from '@/components/Navigation';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getSyllabus, updateSubtopic } from '@/lib/firebase/firebase-utils';
import { Subtopic, SyllabusSubject } from '@/types/exam';
import { SubtopicDetailSkeleton } from '@/components/skeletons';

export default function SubtopicDetailPage() {
  const { user } = useAuth();
  const params = useParams();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const router = useRouter();

  const topicId = params.topicId as string;
  const subtopicIndex = parseInt(params.subtopicIndex as string, 10);
  const subjectId = searchParams.get('subject');

  const [subtopic, setSubtopic] = useState<Subtopic | null>(null);
  const [subject, setSubject] = useState<SyllabusSubject | null>(null);
  const [localNotes, setLocalNotes] = useState('');
  const [localContext, setLocalContext] = useState('');
  const [localCurrentAffairs, setLocalCurrentAffairs] = useState<Array<{ date: Timestamp; note: string }>>([]);
  const [newAffair, setNewAffair] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user || !topicId || !subjectId) return;

      try {
        const syllabusData = await getSyllabus(user.uid);
        const foundSubject = syllabusData.find(s => s.id === subjectId);
        
        if (foundSubject) {
          setSubject(foundSubject);
          const foundTopic = foundSubject.topics.find(t => t.id === topicId);
          
          if (foundTopic && foundTopic.subtopics && foundTopic.subtopics[subtopicIndex]) {
            const data = foundTopic.subtopics[subtopicIndex];
            setSubtopic(data);
            setLocalNotes(data.userNotes || '');
            setLocalContext(data.personalContext || '');
            setLocalCurrentAffairs(data.currentAffairs || []);
          }
        }
      } catch (error) {
        console.error('Error fetching subtopic:', error);
        toast({
          title: 'Error',
          description: 'Failed to load subtopic data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user, topicId, subjectId, subtopicIndex, toast]);

  const handleUpdate = async (updates: Partial<Subtopic>) => {
    if (!user || !subjectId || !subtopic) return;

    // Optimistic update
    setSubtopic(prev => prev ? { ...prev, ...updates } : null);

    try {
      await updateSubtopic(user.uid, subjectId, topicId, subtopic.id, updates);
    } catch (error) {
      console.error('Error updating subtopic:', error);
      toast({
        title: 'Error',
        description: 'Failed to update subtopic.',
        variant: 'destructive',
      });
      // Revert optimistic update ideally, but full reload is safer for now or just alert
    }
  };

  const handleSaveContent = async () => {
    if (!subtopic) return;
    setSaving(true);
    try {
      await handleUpdate({
        userNotes: localNotes,
        personalContext: localContext,
        currentAffairs: localCurrentAffairs
      });
      toast({
        title: 'Saved',
        description: 'Your notes have been saved.',
      });
    } finally {
      setSaving(false);
    }
  };

  const handleAddCurrentAffair = () => {
    if (!newAffair.trim()) return;
    const newAffairs = [...localCurrentAffairs, { date: Timestamp.now(), note: newAffair.trim() }];
    setLocalCurrentAffairs(newAffairs);
    setNewAffair('');
    // Auto-save for current affairs
    handleUpdate({ currentAffairs: newAffairs });
  };

  const handleDeleteCurrentAffair = (index: number) => {
    const newAffairs = localCurrentAffairs.filter((_, i) => i !== index);
    setLocalCurrentAffairs(newAffairs);
    handleUpdate({ currentAffairs: newAffairs });
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <BottomNav />
          <SubtopicDetailSkeleton />
        </div>
      </AuthGuard>
    );
  }

  if (!subtopic) {
    return (
      <AuthGuard>
        <div className="min-h-screen p-8 text-center">
          <h1 className="text-xl font-bold">Subtopic not found</h1>
          <Button onClick={() => router.back()} className="mt-4">Go Back</Button>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <PageTransition>
        <div className="min-h-screen bg-background pb-40 sm:pb-40">
          <Navigation />
          
          <main className="container max-w-5xl mx-auto p-4 space-y-6">
            {/* Header */}
            <DetailPageHeader
              title={subtopic.name}
              description={subject?.name || ''}
              backHref={`/syllabus/${topicId}?subject=${subjectId}`}
              backLabel="Back to Topic"
              actions={
                <div className="flex gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleUpdate({
                      practiceCount: (subtopic.practiceCount || 0) + 1,
                      lastPracticed: Timestamp.now(),
                      status: subtopic.status === 'not_started' ? 'in_progress' : subtopic.status
                    })}
                  >
                    <Brain className="h-4 w-4 mr-2" />
                    Practice
                  </Button>
                  <Button
                    variant={subtopic.status === 'completed' ? 'secondary' : 'default'}
                    size="sm"
                    onClick={() => {
                      const updates: Partial<Subtopic> = {
                        status: subtopic.status === 'completed' ? 'in_progress' : 'completed'
                      };
                      if (subtopic.status !== 'completed') {
                        updates.completedAt = Timestamp.now();
                      }
                      handleUpdate(updates);
                    }}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    {subtopic.status === 'completed' ? 'Mark In Progress' : 'Mark Complete'}
                  </Button>
                </div>
              }
            />

            {/* Main Content */}
            <Tabs defaultValue="notes" className="space-y-6">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="notes">Study Notes</TabsTrigger>
                <TabsTrigger value="context">Personal Context</TabsTrigger>
                <TabsTrigger value="actions">Current Affairs</TabsTrigger>
              </TabsList>

              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <FileText className="h-5 w-5" />
                      Study Notes
                    </CardTitle>
                    <CardDescription>
                      Capture key concepts, formulas, and important points.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MarkdownEditor
                      value={localNotes}
                      onChange={setLocalNotes}
                      placeholder="Start typing your notes here..."
                      minHeight="min-h-[400px]"
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleSaveContent} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Notes'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="context" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <Lightbulb className="h-5 w-5" />
                      Personal Context
                    </CardTitle>
                    <CardDescription>
                      Connect this topic to your life or bigger goals. Why does this matter?
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <MarkdownEditor
                      value={localContext}
                      onChange={setLocalContext}
                      placeholder="Why is this subtopic important? How does it relate to other topics?"
                      minHeight="min-h-[300px]"
                    />
                    <div className="flex justify-end">
                      <Button onClick={handleSaveContent} disabled={saving}>
                        <Save className="h-4 w-4 mr-2" />
                        {saving ? 'Saving...' : 'Save Context'}
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="actions" className="space-y-4">
                <Card>
                  <CardHeader>
                    <CardTitle className="flex items-center gap-2">
                      <TrendingUp className="h-5 w-5" />
                      Current Affairs & Updates
                    </CardTitle>
                    <CardDescription>
                      Link recent news and updates to this subtopic.
                    </CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="flex gap-2">
                      <Input
                        value={newAffair}
                        onChange={(e) => setNewAffair(e.target.value)}
                        placeholder="Add a new update..."
                        onKeyDown={(e) => e.key === 'Enter' && handleAddCurrentAffair()}
                      />
                      <Button onClick={handleAddCurrentAffair} size="icon">
                        <Plus className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="space-y-2 mt-4">
                      {localCurrentAffairs.length === 0 ? (
                        <div className="text-center py-8 text-muted-foreground">
                          <p>No current affairs linked yet.</p>
                        </div>
                      ) : (
                        localCurrentAffairs.map((affair, index) => (
                          <div key={index} className="flex items-start justify-between p-3 rounded-lg border bg-muted/50">
                            <div className="space-y-1">
                              <p className="text-sm">{affair.note}</p>
                              <p className="text-xs text-muted-foreground">
                                {format(affair.date.toDate(), 'MMM d, yyyy')}
                              </p>
                            </div>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => handleDeleteCurrentAffair(index)}
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        ))
                      )}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </main>
          <BottomNav />
        </div>
      </PageTransition>
    </AuthGuard>
  );
}
