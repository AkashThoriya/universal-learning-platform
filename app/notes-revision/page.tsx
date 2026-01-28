'use client';

import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';
import {
  BookOpen,
  FileText,
  ExternalLink,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Download,
  Calendar,
  Folder,
  FolderOpen,
} from 'lucide-react';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import Navigation from '@/components/Navigation';
import PageTransition from '@/components/layout/PageTransition';
import { FeaturePageHeader } from '@/components/layout/PageHeader';
import { SyllabusDashboardSkeleton } from '@/components/skeletons';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getSyllabus } from '@/lib/firebase/firebase-utils';
import { getTopicNotes, UploadedNote, formatFileSize } from '@/lib/firebase/storage-utils';
import { SyllabusSubject, SyllabusTopic } from '@/types/exam';
import { cn } from '@/lib/utils/utils';

// Interface for aggregated notes data
interface TopicNotes {
  topic: SyllabusTopic;
  notes: UploadedNote[];
}

interface SubjectNotes {
  subject: SyllabusSubject;
  topics: TopicNotes[];
  totalNotes: number;
}

export default function NotesRevisionPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [subjectNotes, setSubjectNotes] = useState<SubjectNotes[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [expandedTopics, setExpandedTopics] = useState<Set<string>>(new Set());
  const [totalNotesCount, setTotalNotesCount] = useState(0);

  // Fetch all syllabus data and notes
  const fetchData = useCallback(async () => {
    if (!user?.uid) return;

    setLoading(true);
    try {
      // Step 1: Fetch syllabus
      const syllabus = await getSyllabus(user.uid);

      if (!syllabus || syllabus.length === 0) {
        setSubjectNotes([]);
        setLoading(false);
        return;
      }

      // Step 2: Collect all topic IDs
      const topicFetches: { subject: SyllabusSubject; topic: SyllabusTopic }[] = [];
      syllabus.forEach(subject => {
        subject.topics.forEach(topic => {
          topicFetches.push({ subject, topic });
        });
      });

      // Step 3: Fetch notes for all topics in parallel
      const notesResults = await Promise.all(
        topicFetches.map(async ({ topic }) => {
          try {
            const notes = await getTopicNotes(user.uid, topic.id);
            return { topicId: topic.id, notes };
          } catch (error) {
            console.error(`Error fetching notes for topic ${topic.id}:`, error);
            return { topicId: topic.id, notes: [] };
          }
        })
      );

      // Create a map for quick lookup
      const notesMap = new Map<string, UploadedNote[]>();
      notesResults.forEach(({ topicId, notes }) => {
        notesMap.set(topicId, notes);
      });

      // Step 4: Build SubjectNotes structure
      let totalNotes = 0;
      const aggregated: SubjectNotes[] = syllabus
        .map(subject => {
          const topics: TopicNotes[] = subject.topics
            .map(topic => ({
              topic,
              notes: notesMap.get(topic.id) || [],
            }))
            .filter(t => t.notes.length > 0); // Only include topics with notes

          const subjectTotal = topics.reduce((acc, t) => acc + t.notes.length, 0);
          totalNotes += subjectTotal;

          return {
            subject,
            topics,
            totalNotes: subjectTotal,
          };
        })
        .filter(s => s.totalNotes > 0); // Only include subjects with notes

      setSubjectNotes(aggregated);
      setTotalNotesCount(totalNotes);

      // Auto-expand first subject if there are notes
      if (aggregated.length > 0 && aggregated[0]) {
        setExpandedSubjects(new Set([aggregated[0].subject.id]));
      }
    } catch (error) {
      console.error('Error fetching notes revision data:', error);
      toast({
        title: 'Error',
        description: 'Failed to load notes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.uid, toast]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Toggle subject expansion
  const toggleSubject = (subjectId: string) => {
    setExpandedSubjects(prev => {
      const next = new Set(prev);
      if (next.has(subjectId)) {
        next.delete(subjectId);
      } else {
        next.add(subjectId);
      }
      return next;
    });
  };

  // Toggle topic expansion
  const toggleTopic = (topicId: string) => {
    setExpandedTopics(prev => {
      const next = new Set(prev);
      if (next.has(topicId)) {
        next.delete(topicId);
      } else {
        next.add(topicId);
      }
      return next;
    });
  };

  // Format date
  const formatDate = (dateStr: string) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  };

  // Loading state
  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-slate-50">
          <Navigation />
          <BottomNav />
          <SyllabusDashboardSkeleton />
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
          <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-28 xl:pb-6 space-y-6">
            {/* Header */}
            <FeaturePageHeader
              title="Notes Revision"
              description={
                totalNotesCount > 0
                  ? `${totalNotesCount} notes across ${subjectNotes.length} subjects`
                  : 'Review your uploaded handwritten notes'
              }
              icon={<FileText className="h-5 w-5 text-blue-600" />}
              actions={
                <Button variant="outline" size="sm" asChild>
                  <Link href="/syllabus">
                    <ArrowLeft className="h-4 w-4 mr-2" />
                    Back to Syllabus
                  </Link>
                </Button>
              }
            />

            {/* Empty State */}
            {subjectNotes.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12">
                  <EmptyState
                    icon={FileText}
                    title="No notes uploaded yet"
                    description="Start uploading handwritten notes from your topic pages to see them here for quick revision."
                    action={
                      <Button asChild>
                        <Link href="/syllabus">
                          <BookOpen className="h-4 w-4 mr-2" />
                          Go to Syllabus
                        </Link>
                      </Button>
                    }
                  />
                </CardContent>
              </Card>
            )}

            {/* Notes organized by Subject/Topic */}
            {subjectNotes.map(subjectData => (
              <Card key={subjectData.subject.id} className="overflow-hidden">
                {/* Subject Header */}
                <CardHeader
                  className={cn(
                    'cursor-pointer transition-colors hover:bg-slate-50',
                    expandedSubjects.has(subjectData.subject.id) && 'bg-slate-50'
                  )}
                  onClick={() => toggleSubject(subjectData.subject.id)}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      {expandedSubjects.has(subjectData.subject.id) ? (
                        <FolderOpen className="h-5 w-5 text-blue-600" />
                      ) : (
                        <Folder className="h-5 w-5 text-slate-400" />
                      )}
                      <div>
                        <CardTitle className="text-lg">{subjectData.subject.name}</CardTitle>
                        <p className="text-sm text-muted-foreground">
                          {subjectData.topics.length} topic{subjectData.topics.length !== 1 ? 's' : ''} •{' '}
                          {subjectData.totalNotes} note{subjectData.totalNotes !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Badge variant="secondary">Tier {subjectData.subject.tier}</Badge>
                      {expandedSubjects.has(subjectData.subject.id) ? (
                        <ChevronDown className="h-5 w-5 text-muted-foreground" />
                      ) : (
                        <ChevronRight className="h-5 w-5 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </CardHeader>

                {/* Topics within Subject */}
                {expandedSubjects.has(subjectData.subject.id) && (
                  <CardContent className="pt-0 space-y-3">
                    {subjectData.topics.map(topicData => (
                      <div key={topicData.topic.id} className="border rounded-lg overflow-hidden">
                        {/* Topic Header */}
                        <div
                          className={cn(
                            'flex items-center justify-between p-3 cursor-pointer transition-colors hover:bg-slate-50',
                            expandedTopics.has(topicData.topic.id) && 'bg-slate-50 border-b'
                          )}
                          onClick={() => toggleTopic(topicData.topic.id)}
                        >
                          <div className="flex items-center gap-2">
                            {expandedTopics.has(topicData.topic.id) ? (
                              <ChevronDown className="h-4 w-4 text-muted-foreground" />
                            ) : (
                              <ChevronRight className="h-4 w-4 text-muted-foreground" />
                            )}
                            <span className="font-medium text-sm">{topicData.topic.name}</span>
                          </div>
                          <Badge variant="outline" className="text-xs">
                            {topicData.notes.length} note{topicData.notes.length !== 1 ? 's' : ''}
                          </Badge>
                        </div>

                        {/* Notes List */}
                        {expandedTopics.has(topicData.topic.id) && (
                          <div className="divide-y bg-white">
                            {topicData.notes.map(note => (
                              <div
                                key={note.id}
                                className="flex items-center justify-between p-3 hover:bg-slate-50 transition-colors"
                              >
                                <div className="flex items-center gap-3 min-w-0 flex-1">
                                  {note.fileType === 'image' ? (
                                    <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center flex-shrink-0">
                                      <FileText className="h-4 w-4 text-blue-600" />
                                    </div>
                                  ) : (
                                    <div className="h-8 w-8 rounded bg-red-100 flex items-center justify-center flex-shrink-0">
                                      <FileText className="h-4 w-4 text-red-600" />
                                    </div>
                                  )}
                                  <div className="min-w-0 flex-1">
                                    <p className="text-sm font-medium truncate">{note.fileName}</p>
                                    <div className="flex items-center gap-2 text-xs text-muted-foreground">
                                      <Calendar className="h-3 w-3" />
                                      <span>{formatDate(note.uploadedAt)}</span>
                                      <span>•</span>
                                      <span>{formatFileSize(note.fileSize)}</span>
                                    </div>
                                  </div>
                                </div>

                                <div className="flex items-center gap-1 flex-shrink-0">
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                    <a
                                      href={note.downloadUrl}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      title="Open in new tab"
                                    >
                                      <ExternalLink className="h-4 w-4" />
                                    </a>
                                  </Button>
                                  <Button variant="ghost" size="sm" className="h-8 w-8 p-0" asChild>
                                    <a href={note.downloadUrl} download={note.fileName} title="Download">
                                      <Download className="h-4 w-4" />
                                    </a>
                                  </Button>
                                </div>
                              </div>
                            ))}
                          </div>
                        )}
                      </div>
                    ))}
                  </CardContent>
                )}
              </Card>
            ))}
          </div>
        </PageTransition>
      </div>
    </AuthGuard>
  );
}
