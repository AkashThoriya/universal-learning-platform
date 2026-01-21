'use client';

import { FeaturePageHeader } from '@/components/layout/PageHeader';
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
import { ReviewPageSkeleton } from '@/components/skeletons';

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
import { getSyllabus, updateTopicProgress, getAllProgress, getUser } from '@/lib/firebase/firebase-utils';
import { SyllabusSubject, TopicProgress, User as UserProfile } from '@/types/exam';
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
        // Use Promise.all for parallel fetching - OPTIMIZED: Single batch query instead of N+1
        const [syllabusData, profileData, allProgress] = await Promise.all([
          getSyllabus(user.uid),
          getUser(user.uid),
          getAllProgress(user.uid) // Single collection query instead of N individual reads
        ]);
        
        setSyllabus(syllabusData);
        setUserProfile(profileData);
        
        // Build progress map from batch result
        const progressMap = new Map<string, TopicProgress>();
        allProgress.forEach((progress) => {
          if (progress.topicId) {
            progressMap.set(progress.topicId, progress);
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
          if (effectiveProgress.lastRevised && effectiveProgress.lastRevised.toDate() < startDate) {
            effectiveProgress.lastRevised = undefined as any; 
            effectiveProgress.nextRevision = undefined as any;
            effectiveProgress.revisionCount = 0;
            effectiveProgress.status = 'not_started';
          }
          
          // If flag was set before start date, ignore it (unless it was just refreshed? No, timestamp checks handle it)
          if (effectiveProgress.reviewRequestedAt && effectiveProgress.reviewRequestedAt.toDate() < startDate) {
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
      // Calculate next revision date based on spaced repetition
      // Use user preferences if available, otherwise default to 7 days
      const revisionIntervals = userProfile?.preferences?.revisionIntervals || [7, 14, 30];
      const currentRevisionCount = item.revisionCount || 0;
      
      // Get the interval based on revision count (cycles through intervals)
      const intervalIndex = Math.min(currentRevisionCount, revisionIntervals.length - 1);
      const daysUntilNextRevision = revisionIntervals[intervalIndex] || 7;
      
      const nextRevisionDate = new Date();
      nextRevisionDate.setDate(nextRevisionDate.getDate() + daysUntilNextRevision);
      
      if (item.type === 'topic') {
        await updateTopicProgress(user.uid, item.id, {
          needsReview: false,
          lastRevised: Timestamp.now(),
          nextRevision: Timestamp.fromDate(nextRevisionDate),
          revisionCount: currentRevisionCount + 1,
        });
        
        setTopicProgressMap(prev => {
          const newMap = new Map(prev);
          const existing = newMap.get(item.id);
          if (existing) {
            newMap.set(item.id, { 
              ...existing, 
              needsReview: false, 
              lastRevised: Timestamp.now(),
              nextRevision: Timestamp.fromDate(nextRevisionDate),
              revisionCount: currentRevisionCount + 1,
            });
          }
          return newMap;
        });
      }
      // For subtopics, would need to update syllabus - simplified for now
      
      toast({ 
        title: 'Marked as Reviewed', 
        description: `${item.name} scheduled for next revision in ${daysUntilNextRevision} days.` 
      });
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
          <ReviewPageSkeleton />
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
        <div className="container max-w-6xl mx-auto px-4 py-8 pb-40 lg:pb-8 space-y-6">
          {/* Header */}
          <FeaturePageHeader
            title="Concept Review"
            description="Topics flagged for review or due for revision"
            icon={<AlertTriangle className="h-5 w-5 text-amber-500" />}
            actions={
              <Badge variant="outline" className="text-base px-4 py-2">
                {reviewItems.length} items
              </Badge>
            }
          />

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
                      ? 'You have no topics flagged for review. Great work!'
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
