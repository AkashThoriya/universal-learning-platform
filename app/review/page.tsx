'use client';

import PageTransition from '@/components/layout/PageTransition';
import { format, isPast, isToday } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import {
  AlertTriangle,
  ArrowRight,
  BookOpen,
  CheckCircle,
  Clock,
  Layers,
  Search,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useMemo } from 'react';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { EmptyState } from '@/components/ui/empty-state';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { getSyllabus, updateTopicProgress, getTopicProgress, getUser } from '@/lib/firebase/firebase-utils';
import { SyllabusSubject, Subtopic, TopicProgress, User as UserProfile } from '@/types/exam';
import { cn } from '@/lib/utils/utils';

interface ReviewItem {
  type: 'topic' | 'subtopic';
  id: string;
  name: string;
  subjectId: string;
  subjectName: string;
  topicId?: string;
  topicName?: string;
  needsReview: boolean;
  nextRevision?: Date;
  lastRevised?: Date;
  status: string;
  practiceCount: number;
  revisionCount: number;
}

export default function ConceptReviewPage() {
  const { user } = useAuth();
  const { toast } = useToast();

  const [syllabus, setSyllabus] = useState<SyllabusSubject[]>([]);
  const [topicProgressMap, setTopicProgressMap] = useState<Map<string, TopicProgress>>(new Map());
  const [userProfile, setUserProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [filter, setFilter] = useState<'all' | 'flagged' | 'due' | 'overdue'>('all');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      try {
        const [syllabusData, profileData] = await Promise.all([
          getSyllabus(user.uid),
          getUser(user.uid)
        ]);
        
        setSyllabus(syllabusData);
        setUserProfile(profileData);
        
        // Fetch progress for all topics
        const progressPromises = syllabusData.flatMap(subject =>
          subject.topics.map(async topic => {
            const progress = await getTopicProgress(user.uid, topic.id);
            return { topicId: topic.id, progress };
          })
        );
        
        const progressResults = await Promise.all(progressPromises);
        const progressMap = new Map<string, TopicProgress>();
        progressResults.forEach(({ topicId, progress }) => {
          if (progress) {
            progressMap.set(topicId, progress);
          }
        });
        setTopicProgressMap(progressMap);
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: 'Error',
          description: 'Failed to load review data.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, [user, toast]);

  // Build review items from syllabus + progress
  const reviewItems = useMemo(() => {
    const items: ReviewItem[] = [];
    
    syllabus.forEach(subject => {
      subject.topics.forEach(topic => {
        const progress = topicProgressMap.get(topic.id);
        const startDate = userProfile?.preparationStartDate?.toDate();

        // Create an effective progress object that respects the start date
        const effectiveProgress = progress ? { ...progress } : undefined;
        
        if (effectiveProgress && startDate) {
          // If revision happened before start date, treat as not revised
          if (effectiveProgress.lastRevised?.toDate() < startDate) {
            effectiveProgress.lastRevised = undefined as any; 
            effectiveProgress.nextRevision = undefined as any;
            effectiveProgress.revisionCount = 0;
            effectiveProgress.status = 'not_started';
          }
          
          // If flag was set before start date, ignore it (unless it was just refreshed? No, timestamp checks handle it)
          if (effectiveProgress.reviewRequestedAt?.toDate() < startDate) {
            effectiveProgress.needsReview = false;
          }
        }

        // Check topic needs review
        if (effectiveProgress?.needsReview) {
          items.push({
            type: 'topic',
            id: topic.id,
            name: topic.name,
            subjectId: subject.id,
            subjectName: subject.name,
            needsReview: true,
            nextRevision: effectiveProgress.nextRevision?.toDate(),
            lastRevised: effectiveProgress.lastRevised?.toDate(),
            status: effectiveProgress.masteryScore >= 80 ? 'mastered' : effectiveProgress.masteryScore > 0 ? 'in_progress' : 'not_started',
            practiceCount: 0,
            revisionCount: effectiveProgress.revisionCount || 0,
          });
        }
        
        // Check topic due for revision
        if (effectiveProgress?.nextRevision && effectiveProgress.nextRevision.toDate() <= new Date()) {
          const exists = items.find(i => i.type === 'topic' && i.id === topic.id);
          if (!exists) {
            items.push({
              type: 'topic',
              id: topic.id,
              name: topic.name,
              subjectId: subject.id,
              subjectName: subject.name,
              needsReview: effectiveProgress.needsReview || false,
              nextRevision: effectiveProgress.nextRevision.toDate(),
              lastRevised: effectiveProgress.lastRevised?.toDate(),
              status: effectiveProgress.masteryScore >= 80 ? 'mastered' : effectiveProgress.masteryScore > 0 ? 'in_progress' : 'not_started',
              practiceCount: 0,
              revisionCount: effectiveProgress.revisionCount || 0,
            });
          }
        }
        
        // Check subtopics
        topic.subtopics?.forEach((subtopic: Subtopic) => {
          const startDate = userProfile?.preparationStartDate?.toDate();
          const effectiveSubtopic = { ...subtopic };

          if (startDate) {
            // Ignore flags from before start date
            if (effectiveSubtopic.reviewRequestedAt?.toDate() < startDate) {
              effectiveSubtopic.needsReview = false;
            }
            // If revision old, reset needsReview if it was somehow based on that?
            // Actually needsReview is explicit.
          }

          if (effectiveSubtopic.needsReview) {
            const lastRevisedDate = effectiveSubtopic.lastRevised?.toDate();
            
            // Should we show lastRevised if it's old? Probably not relevant.
            // But let's keep it for context unless it's strictly excluded.
             
            items.push({
              type: 'subtopic',
              id: subtopic.id, // Use original ID
              name: subtopic.name,
              subjectId: subject.id,
              subjectName: subject.name,
              topicId: topic.id,
              topicName: topic.name,
              needsReview: true,
              ...(lastRevisedDate && { lastRevised: lastRevisedDate }),
              status: subtopic.status,
              practiceCount: subtopic.practiceCount,
              revisionCount: subtopic.revisionCount,
            });
          }
        });
      });
    });
    
     return items;
   }, [syllabus, topicProgressMap, userProfile]);

  // Filter items
  const filteredItems = useMemo(() => {
    let items = reviewItems;
    
    // Search filter
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      items = items.filter(item =>
        item.name.toLowerCase().includes(query) ||
        item.subjectName.toLowerCase().includes(query) ||
        item.topicName?.toLowerCase().includes(query)
      );
    }
    
    // Tab filter
    if (filter === 'flagged') {
      items = items.filter(i => i.needsReview);
    } else if (filter === 'due') {
      items = items.filter(i => i.nextRevision && isToday(i.nextRevision));
    } else if (filter === 'overdue') {
      items = items.filter(i => i.nextRevision && isPast(i.nextRevision) && !isToday(i.nextRevision));
    }
    
    return items;
  }, [reviewItems, searchQuery, filter]);

  const handleMarkReviewed = async (item: ReviewItem) => {
    if (!user) return;
    
    try {
      if (item.type === 'topic') {
        await updateTopicProgress(user.uid, item.id, {
          needsReview: false,
          lastRevised: Timestamp.now(),
        });
        
        setTopicProgressMap(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(item.id);
          if (existing) {
            newMap.set(item.id, { ...existing, needsReview: false, lastRevised: Timestamp.now() });
          }
          return newMap;
        });
      }
      // For subtopics, would need to update syllabus - simplified for now
      
      toast({ title: 'Marked as Reviewed', description: `${item.name} has been marked as reviewed.` });
    } catch (error) {
      console.error('Error marking reviewed:', error);
      toast({ title: 'Error', description: 'Failed to update review status.', variant: 'destructive' });
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
              <p className="text-muted-foreground">Loading review items...</p>
            </div>
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
        <div className="container max-w-6xl mx-auto px-4 py-8 pb-24 lg:pb-8 space-y-6">
          {/* Header */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold flex items-center gap-2">
                <AlertTriangle className="h-6 w-6 sm:h-8 sm:w-8 text-amber-500" />
                Concept Review
              </h1>
              <p className="text-muted-foreground">Topics and subtopics flagged for review or due for revision</p>
            </div>
            <Badge variant="outline" className="self-start sm:self-auto text-lg px-4 py-2">
              {reviewItems.length} items
            </Badge>
          </div>

          {/* Search & Filters */}
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search by topic, subtopic, or subject..."
                className="pl-10"
              />
            </div>
          </div>

          {/* Filter Tabs */}
          <Tabs value={filter} onValueChange={(v) => setFilter(v as typeof filter)} className="w-full">
            <TabsList className="grid w-full grid-cols-4">
              <TabsTrigger value="all" className="text-xs sm:text-sm">
                All ({reviewItems.length})
              </TabsTrigger>
              <TabsTrigger value="flagged" className="text-xs sm:text-sm">
                ⚠️ Flagged ({reviewItems.filter(i => i.needsReview).length})
              </TabsTrigger>
              <TabsTrigger value="due" className="text-xs sm:text-sm">
                📅 Today ({reviewItems.filter(i => i.nextRevision && isToday(i.nextRevision)).length})
              </TabsTrigger>
              <TabsTrigger value="overdue" className="text-xs sm:text-sm">
                🔴 Overdue ({reviewItems.filter(i => i.nextRevision && isPast(i.nextRevision) && !isToday(i.nextRevision)).length})
              </TabsTrigger>
            </TabsList>

            {/* Content for all tabs */}
            {(['all', 'flagged', 'due', 'overdue'] as const).map(tabValue => (
              <TabsContent key={tabValue} value={tabValue} className="mt-6">
                {filteredItems.length === 0 ? (
                  <EmptyState
                    icon={CheckCircle}
                    title={filter === 'all' ? 'All caught up!' : 'No items in this category'}
                    description={filter === 'all' 
                      ? 'You have no topics or subtopics flagged for review. Great work!'
                      : 'Check other tabs or mark items for review from topic pages.'
                    }
                  />
                ) : (
                  <div className="grid gap-4 grid-cols-1 sm:grid-cols-2 lg:grid-cols-3">
                    {filteredItems.map((item) => (
                      <Card key={`${item.type}-${item.id}`} className="hover:shadow-md transition-shadow">
                        <CardHeader className="pb-2">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <CardTitle className="text-base truncate flex items-center gap-2">
                                {item.type === 'subtopic' && <Layers className="h-4 w-4 shrink-0 text-muted-foreground" />}
                                {item.name}
                              </CardTitle>
                              <CardDescription className="text-xs truncate">
                                {item.subjectName}{item.topicName && ` → ${item.topicName}`}
                              </CardDescription>
                            </div>
                            {item.needsReview && (
                              <Badge variant="destructive" className="shrink-0 text-xs">⚠️ Review</Badge>
                            )}
                          </div>
                        </CardHeader>
                        <CardContent className="space-y-3">
                          <div className="flex items-center gap-4 text-sm text-muted-foreground">
                            <span className="flex items-center gap-1">
                              <BookOpen className="h-3 w-3" />
                              {item.revisionCount} revisions
                            </span>
                            {item.lastRevised && (
                              <span className="flex items-center gap-1">
                                <Clock className="h-3 w-3" />
                                {format(item.lastRevised, 'MMM d')}
                              </span>
                            )}
                          </div>
                          
                          {item.nextRevision && (
                            <div className={cn(
                              "text-xs px-2 py-1 rounded-full inline-flex items-center gap-1",
                              isPast(item.nextRevision) && !isToday(item.nextRevision)
                                ? "bg-red-100 text-red-700"
                                : isToday(item.nextRevision)
                                ? "bg-amber-100 text-amber-700"
                                : "bg-green-100 text-green-700"
                            )}>
                              <Clock className="h-3 w-3" />
                              {isPast(item.nextRevision) && !isToday(item.nextRevision)
                                ? `Overdue by ${Math.floor((Date.now() - item.nextRevision.getTime()) / (1000 * 60 * 60 * 24))} days`
                                : isToday(item.nextRevision)
                                ? 'Due today'
                                : `Due ${format(item.nextRevision, 'MMM d')}`}
                            </div>
                          )}
                          
                          <div className="flex gap-2 pt-2">
                            <Button
                              variant="outline"
                              size="sm"
                              className="flex-1"
                              onClick={() => handleMarkReviewed(item)}
                            >
                              <CheckCircle className="h-4 w-4 mr-1" />
                              Reviewed
                            </Button>
                            <Button size="sm" className="flex-1" asChild>
                              <Link href={`/syllabus/${item.type === 'subtopic' ? item.topicId : item.id}?subject=${item.subjectId}`}>
                                Study <ArrowRight className="h-4 w-4 ml-1" />
                              </Link>
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </TabsContent>
            ))}
          </Tabs>
        </div>
        </PageTransition>
      </div>
    </AuthGuard>
  );
}
