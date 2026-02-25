'use client';

import {
  BookOpen,
  ChevronRight,
  Search,
  Filter,
  Clock,
  Target,
  TrendingUp,
  Plus,
  Edit3,
  Trash2,
  Save,
  X,
  Settings,
  ChevronDown,
  GripVertical,
  Eye,
  EyeOff,
  Layers,
  MoreHorizontal,
  ArrowUpDown,
  Timer,
  Info,
  FileText,
  Check,
  MessageSquareText,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback, useMemo } from 'react';
import { isToday, isPast } from 'date-fns';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { FeaturePageHeader } from '@/components/layout/PageHeader';
import PageTransition from '@/components/layout/PageTransition';
import Navigation from '@/components/Navigation';
import { SyllabusDashboardSkeleton } from '@/components/skeletons';
import StrategyInsights from '@/components/syllabus/StrategyInsights';
import { Alert, AlertDescription } from '@/components/ui/alert';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';

import { Separator } from '@/components/ui/separator';

import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/contexts/CourseContext';
import { useToast } from '@/hooks/use-toast';
import { getSyllabus, getAllProgress, saveSyllabusForCourse, getUser } from '@/lib/firebase/firebase-utils';
import { logInfo, logError } from '@/lib/utils/logger';
import { SyllabusSubject, TopicProgress, SyllabusTopic } from '@/types/exam';

import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { TopicResourcesSection } from '@/components/topic-detail/TopicResourcesSection';
import { getExamById } from '@/lib/data/exams-data';

// Constants
const MASTERY_THRESHOLD = 80;
const MEDIUM_MASTERY_THRESHOLD = 50;

export default function SyllabusPage() {
  const { user } = useAuth();
  const { activeCourseId } = useCourse();
  const { toast } = useToast();
  const [syllabus, setSyllabus] = useState<SyllabusSubject[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null); // Using any temporarily to avoid Import hell, but ideally User type
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [masteryFilter, setMasteryFilter] = useState<string>('all');
  const [hideMastered, setHideMastered] = useState(true);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // Enhanced edit state management
  const [editMode, setEditMode] = useState(false);
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [tempSubjectName, setTempSubjectName] = useState('');
  const [tempTopicName, setTempTopicName] = useState('');
  const [tempTopicHours, setTempTopicHours] = useState<number>(5);
  const [tempTopicDescription, setTempTopicDescription] = useState('');
  const [saving, setSaving] = useState(false);
  const [showTopicDetails, setShowTopicDetails] = useState<Set<string>>(new Set());
  const [bulkEditMode, setBulkEditMode] = useState(false);
  const [selectedTopics, setSelectedTopics] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        logInfo('Syllabus page: No user available, skipping data fetch');
        return;
      }

      logInfo('Syllabus page: Starting data fetch', { userId: user.uid });

      try {
        // OPTIMIZED: Fetch all data in parallel to reduce latency (~300-500ms savings)
        const [userProfile, syllabusData, progressData] = await Promise.all([
          getUser(user.uid),
          getSyllabus(user.uid, activeCourseId ?? undefined),
          getAllProgress(user.uid, activeCourseId ?? undefined),
        ]);

        logInfo('Syllabus page: Data fetched successfully', {
          syllabusCount: syllabusData.length,
          progressCount: progressData.length,
          userId: user.uid,
        });

        setSyllabus(syllabusData);
        setProgress(progressData);
        if (userProfile) {
          setUserProfile(userProfile);
        }
      } catch (error) {
        logError('Error fetching syllabus data', {
          error: error instanceof Error ? error.message : String(error),
          stack: error instanceof Error ? error.stack : undefined,
          userId: user.uid,
          context: 'syllabus_page_data_fetch',
        });
      } finally {
        setLoading(false);
        logInfo('Syllabus page: Data fetch completed', { userId: user.uid });
      }
    };

    fetchData();
  }, [user, activeCourseId]);

  // Fetch Goal Resources for the active course
  const [examResources, setExamResources] = useState<string[]>([]);
  useEffect(() => {
    if (activeCourseId) {
      const exam = getExamById(activeCourseId);
      setExamResources(exam?.resources || []);
    } else {
      setExamResources([]);
    }
  }, [activeCourseId]);

  // Save syllabus changes to Firebase
  const saveSyllabusChanges = useCallback(async () => {
    if (!user) {
      return;
    }

    setSaving(true);

    try {
      if (activeCourseId) {
        await saveSyllabusForCourse(user.uid, activeCourseId, syllabus);
      } else {
        // Fallback or error if no course selected, but UI should prevent this
        logError('Cannot save syllabus, no active course', { userId: user.uid });
        return;
      }
      logInfo('Syllabus updated successfully', {
        userId: user.uid,
        subjectCount: syllabus.length,
      });

      toast({
        title: 'Syllabus Updated',
        description: 'Your syllabus changes have been saved successfully.',
      });
    } catch (error) {
      logError('Error updating syllabus', {
        error: error instanceof Error ? error.message : String(error),
        userId: user.uid,
      });

      toast({
        title: 'Error',
        description: 'Failed to save syllabus changes. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setSaving(false);
    }
  }, [user, syllabus, toast]);

  // Subject management functions

  const addCustomSubject = useCallback(() => {
    const newSubjectId = `custom-${Date.now()}`;
    const newSubject: SyllabusSubject = {
      id: newSubjectId,
      name: 'New Subject',
      tier: 2,
      topics: [],
      isCustom: true,
    };
    setSyllabus(prev => [...prev, newSubject]);
    setExpandedSubjects(prev => new Set([...prev, newSubjectId]));
    setEditingSubject(newSubjectId);
    setTempSubjectName('New Subject');
  }, []);

  const removeSubject = useCallback((subjectId: string) => {
    setSyllabus(prev => prev.filter(subject => subject.id !== subjectId));
  }, []);

  // Enhanced topic management functions
  const addTopic = useCallback(
    (subjectId: string, topicData?: Partial<SyllabusTopic>) => {
      const newTopicId = `topic-${Date.now()}`;
      const newTopic: SyllabusTopic = {
        id: newTopicId,
        name: topicData?.name ?? 'New Topic',
        estimatedHours: topicData?.estimatedHours ?? 5,
        ...(topicData?.description && { description: topicData.description }),
        subtopics: topicData?.subtopics ?? [],
      };

      setSyllabus(prev =>
        prev.map(subject =>
          subject.id === subjectId ? { ...subject, topics: [...subject.topics, newTopic] } : subject
        )
      );

      // Auto-expand the subject and start editing the new topic
      setExpandedSubjects(prev => new Set([...prev, subjectId]));
      setEditingTopic(newTopicId);
      setTempTopicName(newTopic.name);
      setTempTopicHours(newTopic.estimatedHours ?? 5);
      setTempTopicDescription(newTopic.description ?? '');

      toast({
        title: 'Topic Added',
        description: `New topic "${newTopic.name}" has been added.`,
      });
    },
    [toast]
  );

  const removeTopic = useCallback(
    (subjectId: string, topicId: string) => {
      setSyllabus(prev =>
        prev.map(subject =>
          subject.id === subjectId
            ? { ...subject, topics: subject.topics.filter(topic => topic.id !== topicId) }
            : subject
        )
      );

      toast({
        title: 'Topic Removed',
        description: 'Topic has been successfully removed.',
      });
    },
    [toast]
  );

  const updateTopic = useCallback((subjectId: string, topicId: string, updates: Partial<SyllabusTopic>) => {
    setSyllabus(prev =>
      prev.map(subject =>
        subject.id === subjectId
          ? {
              ...subject,
              topics: subject.topics.map(topic => (topic.id === topicId ? { ...topic, ...updates } : topic)),
            }
          : subject
      )
    );
  }, []);

  const duplicateTopic = useCallback(
    (subjectId: string, topicId: string) => {
      const subject = syllabus.find(s => s.id === subjectId);
      const topic = subject?.topics.find(t => t.id === topicId);

      if (topic) {
        const duplicatedTopic = {
          ...topic,
          id: `topic-${Date.now()}`,
          name: `${topic.name} (Copy)`,
        };

        addTopic(subjectId, duplicatedTopic);

        toast({
          title: 'Topic Duplicated',
          description: `"${topic.name}" has been duplicated.`,
        });
      }
    },
    [syllabus, addTopic, toast]
  );

  // Enhanced edit state management
  const startEditingSubject = useCallback((subjectId: string, currentName: string) => {
    setEditingSubject(subjectId);
    setTempSubjectName(currentName);
  }, []);

  const saveSubjectName = useCallback(
    (subjectId: string) => {
      if (tempSubjectName.trim()) {
        setSyllabus(prev =>
          prev.map(subject => (subject.id === subjectId ? { ...subject, name: tempSubjectName.trim() } : subject))
        );

        toast({
          title: 'Subject Updated',
          description: `Subject name updated to "${tempSubjectName.trim()}".`,
        });
      }
      setEditingSubject(null);
      setTempSubjectName('');
    },
    [tempSubjectName, toast]
  );

  const startEditingTopic = useCallback((topicId: string, topic: SyllabusTopic) => {
    setEditingTopic(topicId);
    setTempTopicName(topic.name);
    setTempTopicHours(topic.estimatedHours ?? 5);
    setTempTopicDescription(topic.description ?? '');
  }, []);

  const saveTopicChanges = useCallback(
    (subjectId: string, topicId: string) => {
      if (tempTopicName.trim()) {
        const updates: Partial<SyllabusTopic> = {
          name: tempTopicName.trim(),
          estimatedHours: tempTopicHours,
          ...(tempTopicDescription.trim() && { description: tempTopicDescription.trim() }),
        };

        updateTopic(subjectId, topicId, updates);

        toast({
          title: 'Topic Updated',
          description: `Topic "${tempTopicName.trim()}" has been updated.`,
        });
      }
      setEditingTopic(null);
      setTempTopicName('');
      setTempTopicHours(5);
      setTempTopicDescription('');
    },
    [tempTopicName, tempTopicHours, tempTopicDescription, updateTopic, toast]
  );

  const cancelEditing = useCallback(() => {
    setEditingSubject(null);
    setEditingTopic(null);
    setTempSubjectName('');
    setTempTopicName('');
    setTempTopicHours(5);
    setTempTopicDescription('');
  }, []);

  const toggleTopicDetails = useCallback((topicId: string) => {
    setShowTopicDetails(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  }, []);

  const toggleTopicSelection = useCallback((topicId: string) => {
    setSelectedTopics(prev => {
      const newSet = new Set(prev);
      if (newSet.has(topicId)) {
        newSet.delete(topicId);
      } else {
        newSet.add(topicId);
      }
      return newSet;
    });
  }, []);

  const toggleSubjectExpansion = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  // OPTIMIZED: Pre-compute Map for O(1) lookups instead of O(n) array.find()
  const progressMap = useMemo(() => {
    const map = new Map<string, TopicProgress>();
    progress.forEach(p => map.set(p.topicId, p));
    return map;
  }, [progress]);

  const getTopicProgress = (topicId: string) => {
    return progressMap.get(topicId);
  };

  const getSubjectMastery = (subject: SyllabusSubject) => {
    if (!subject.topics || subject.topics.length === 0) {
      return 0;
    }

    const totalMastery = subject.topics.reduce((sum, topic) => {
      const progress = getTopicProgress(topic.id);
      return sum + (progress?.masteryScore || 0);
    }, 0);

    return Math.round(totalMastery / subject.topics.length);
  };

  const filteredSyllabus = syllabus.filter(subject => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.topics.some(topic => topic.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Mastery filter
    let matchesMastery = true;
    if (masteryFilter !== 'all') {
      const subjectMastery = getSubjectMastery(subject);
      switch (masteryFilter) {
        case 'low':
          matchesMastery = subjectMastery < MEDIUM_MASTERY_THRESHOLD;
          break;
        case 'medium':
          matchesMastery = subjectMastery >= MEDIUM_MASTERY_THRESHOLD && subjectMastery < MASTERY_THRESHOLD;
          break;
        case 'high':
          matchesMastery = subjectMastery >= MASTERY_THRESHOLD;
          break;
      }
    }



    // Hide Mastered filter
    let matchesHideMastered = true;
    if (hideMastered) {
      const subjectMastery = getSubjectMastery(subject);
      matchesHideMastered = subjectMastery < 100;
    }

    return matchesSearch && matchesMastery && matchesHideMastered;
  }); // Keep natural order - first subjects appear at the top

  // Calculate completed topics count for Strategy Insights
  const completedTopicsCount = progress.filter(p => p.status === 'completed' || p.status === 'mastered').length;

  const getMasteryColor = (score: number) => {
    if (score >= MASTERY_THRESHOLD) {
      return 'text-emerald-600';
    }
    if (score >= MEDIUM_MASTERY_THRESHOLD) {
      return 'text-amber-600';
    }
    return 'text-rose-600';
  };

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
          <div className="max-w-6xl mx-auto p-4 sm:p-6 pb-28 xl:pb-6 space-y-8">
            {/* Enhanced Header */}
            <FeaturePageHeader
              title="Strategic Syllabus"
              description="Manage your study priorities and track mastery progress"
              icon={<BookOpen className="h-5 w-5 text-blue-600" />}
              actions={
                editMode ? (
                  <div className="flex flex-wrap items-center gap-2">
                    <Button
                      variant={bulkEditMode ? 'default' : 'outline'}
                      onClick={() => {
                        setBulkEditMode(!bulkEditMode);
                        setSelectedTopics(new Set());
                      }}
                      className="flex items-center gap-2"
                      size="sm"
                    >
                      <Layers className="h-4 w-4" />
                      <span>{bulkEditMode ? 'Exit Bulk' : 'Bulk Edit'}</span>
                    </Button>

                    <Button
                      onClick={saveSyllabusChanges}
                      disabled={saving}
                      className="flex items-center gap-2 bg-green-600 hover:bg-green-700"
                      size="sm"
                    >
                      <Save className="h-4 w-4" />
                      <span>{saving ? 'Saving...' : 'Save'}</span>
                    </Button>

                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setEditMode(false);
                        cancelEditing();
                        setBulkEditMode(false);
                        setSelectedTopics(new Set());
                      }}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      Cancel
                    </Button>
                  </div>
                ) : (
                    <div className="flex gap-2">
                      <Button variant="outline" size="sm" asChild>
                        <Link href="/interview-questions">
                          <MessageSquareText className="h-4 w-4 mr-2" />
                          Interview Questions
                        </Link>
                      </Button>

                      {examResources.length > 0 && (
                        <Dialog>
                          <DialogTrigger asChild>
                            <Button variant="outline" size="sm">
                              <BookOpen className="h-4 w-4 mr-2" />
                              Resources
                            </Button>
                          </DialogTrigger>
                          <DialogContent className="max-w-3xl">
                            <DialogHeader>
                              <DialogTitle>Course Resources</DialogTitle>
                            </DialogHeader>
                            <TopicResourcesSection
                              resources={examResources}
                              title=""
                              description=""
                              className="mt-4"
                            />
                          </DialogContent>
                        </Dialog>
                      )}

                      <Button variant="outline" size="sm" asChild>
                        <Link href="/notes-revision">
                          <FileText className="h-4 w-4 mr-2" />
                          Revision Notes
                        </Link>
                      </Button>
                    </div>
                )
              }
            />

            {/* Bulk Edit Actions */}
            {editMode && bulkEditMode && selectedTopics.size > 0 && (
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 space-y-3">
                <div className="text-sm font-medium text-blue-900">
                  {selectedTopics.size} topic{selectedTopics.size > 1 ? 's' : ''} selected
                </div>
                <div className="flex justify-center items-center gap-2">
                  <Button size="sm" variant="outline">
                    <Timer className="h-3 w-3 mr-1" />
                    Set Hours
                  </Button>
                  <Button size="sm" variant="outline">
                    <ArrowUpDown className="h-3 w-3 mr-1" />
                    Move to Subject
                  </Button>
                  <Button size="sm" variant="outline" className="text-red-600 hover:text-red-700">
                    <Trash2 className="h-3 w-3 mr-1" />
                    Delete Selected
                  </Button>
                </div>
              </div>
            )}

            {/* Strategy Insights Section */}
            {!loading && userProfile && (
              <div className="animate-in fade-in duration-200">
                <StrategyInsights user={userProfile} syllabus={syllabus} completedTopicsCount={completedTopicsCount} />
              </div>
            )}

            {/* Compact Smart Filters Toolbar */}
            <div className="bg-white p-2 rounded-xl border border-slate-200 shadow-sm flex flex-col sm:flex-row items-center gap-2">
              {/* Search Field - Flexible Width */}
              <div className="relative flex-1 w-full">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  className="pl-9 border-0 bg-slate-50 focus-visible:ring-0 focus-visible:bg-white transition-all"
                  placeholder="Search subjects or topics..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                />
              </div>

              {/* Separator for desktop */}
              <div className="hidden sm:block w-px h-8 bg-slate-100 mx-1" />

              {/* Action Group */}
              <div className="flex items-center gap-2 w-full sm:w-auto justify-end">
                {/* Mastery Filter Dropdown */}
                 <DropdownMenu modal={false}>
                  <DropdownMenuTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      className={`gap-2 ${masteryFilter !== 'all' ? 'bg-blue-50 text-blue-700' : 'text-slate-600'}`}
                    >
                      <Filter className="h-4 w-4" />
                      <span className="hidden sm:inline">
                        {masteryFilter === 'all' ? 'Mastery' : 
                         masteryFilter === 'low' ? 'Low' : 
                         masteryFilter === 'medium' ? 'Medium' : 'High'}
                      </span>
                      {masteryFilter !== 'all' && (
                        <Badge variant="secondary" className="px-1.5 h-5 text-[10px] bg-blue-100 text-blue-700">
                          1
                        </Badge>
                      )}
                      <ChevronDown className="h-3 w-3 opacity-50" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-48">
                    <DropdownMenuItem onSelect={() => setMasteryFilter('all')}>
                      {masteryFilter === 'all' && <Check className="mr-2 h-4 w-4" />}
                      <span className={masteryFilter === 'all' ? '' : 'pl-6'}>All Levels</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setMasteryFilter('low')}>
                      {masteryFilter === 'low' && <Check className="mr-2 h-4 w-4" />}
                      <span className={masteryFilter === 'low' ? '' : 'pl-6'}>Low (&lt; 50%)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setMasteryFilter('medium')}>
                      {masteryFilter === 'medium' && <Check className="mr-2 h-4 w-4" />}
                      <span className={masteryFilter === 'medium' ? '' : 'pl-6'}>Medium (50-79%)</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onSelect={() => setMasteryFilter('high')}>
                      {masteryFilter === 'high' && <Check className="mr-2 h-4 w-4" />}
                      <span className={masteryFilter === 'high' ? '' : 'pl-6'}>High (≥ {MASTERY_THRESHOLD}%)</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>

                {/* Hide Mastered Toggle */}
                <div 
                  className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border transition-all cursor-pointer select-none ${
                    hideMastered 
                    ? 'bg-slate-900 border-slate-900 text-white' 
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                  onClick={() => setHideMastered(!hideMastered)}
                >
                  <span className="text-xs font-medium">Hide Mastered</span>
                  {hideMastered ? (
                    <EyeOff className="h-3.5 w-3.5" />
                  ) : (
                    <Eye className="h-3.5 w-3.5" />
                  )}
                </div>

                {/* Clear Filters (Only show if filters active) */}
                {(searchQuery || masteryFilter !== 'all' || !hideMastered) && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-9 w-9 text-slate-400 hover:text-rose-600 transition-colors"
                    onClick={() => {
                      setSearchQuery('');
                      setMasteryFilter('all');
                      setHideMastered(true);
                    }}
                    title="Reset Filters"
                  >
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Overview Stats - Clean Grid */}
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
              {/* Total Subjects */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-100">
                    <BookOpen className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">{syllabus.length}</p>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Total Subjects</p>
                  </div>
                </div>
              </div>

              {/* Total Topics */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-slate-100">
                    <Target className="h-5 w-5 text-slate-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">
                      {syllabus.reduce((sum, subject) => sum + subject.topics.length, 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Total Topics</p>
                  </div>
                </div>
              </div>

              {/* Average Mastery */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-blue-50">
                    <TrendingUp className="h-5 w-5 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">
                      {Math.round(
                        syllabus.reduce((sum, subject) => sum + getSubjectMastery(subject), 0) / (syllabus.length || 1)
                      )}
                      %
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Avg Mastery</p>
                  </div>
                </div>
              </div>

              {/* Due for Revision */}
              <div className="bg-white rounded-xl border border-slate-100 p-4 sm:p-5 shadow-sm">
                <div className="flex items-center gap-3">
                  <div className="p-2.5 rounded-lg bg-amber-50">
                    <Clock className="h-5 w-5 text-amber-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-slate-900">
                      {
                        progress.filter(p => {
                          if (!p.nextRevision?.toDate) {
                            return false;
                          }
                          const nextRevDate = p.nextRevision.toDate();
                          return isPast(nextRevDate) || isToday(nextRevDate);
                        }).length
                      }
                    </p>
                    <p className="text-xs sm:text-sm text-slate-500 font-medium truncate">Due for Revision</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Subjects List */}
            <>
              {/* Enhanced Edit Mode Controls */}
              {editMode && (
                <div className="space-y-4">
                  <Alert className="border-blue-200 bg-blue-50">
                    <Info className="h-4 w-4 text-blue-600" />
                    <AlertDescription className="text-blue-800">
                      <div className="space-y-2">
                        <p>
                          <strong>Edit Mode Active:</strong> You can now comprehensively manage your syllabus.
                        </p>
                        <div className="text-sm space-y-1">
                          <p>
                            • <strong>Topics:</strong> Add, edit, duplicate, and organize with detailed descriptions
                          </p>
                          <p>
                            • <strong>Time Estimates:</strong> Set study hours for each topic
                          </p>
                          <p>
                            • <strong>Bulk Actions:</strong> Select multiple topics for batch operations
                          </p>
                          <p>
                            • <strong>Drag & Drop:</strong> Reorder topics within subjects
                          </p>
                        </div>
                      </div>
                    </AlertDescription>
                  </Alert>

                  <div className="flex justify-center space-x-4">
                    <Button variant="outline" onClick={addCustomSubject} className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span>Add Custom Subject</span>
                    </Button>

                    <Button
                      variant="outline"
                      onClick={() => {
                        // Expand all subjects for better editing
                        const allSubjectIds = syllabus.map(s => s.id);
                        setExpandedSubjects(new Set(allSubjectIds));
                      }}
                      className="flex items-center space-x-2"
                    >
                      <Layers className="h-4 w-4" />
                      <span>Expand All</span>
                    </Button>
                  </div>
                </div>
              )}

              {/* Subjects List */}
              <div className="space-y-4">
                {filteredSyllabus.map(subject => {
                  const subjectMastery = getSubjectMastery(subject);
                  const isExpanded = expandedSubjects.has(subject.id);

                  return (
                    <Card key={subject.id} className="overflow-hidden">
                      <CardHeader
                        className={`transition-colors ${editMode ? 'p-4' : 'cursor-pointer hover:bg-gray-50'}`}
                        onClick={editMode ? undefined : () => toggleSubjectExpansion(subject.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4 flex-1">
                            {!editMode && (
                              <ChevronRight
                                className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                              />
                            )}
                            {editMode && (
                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => toggleSubjectExpansion(subject.id)}
                                className="p-1 h-auto"
                              >
                                {isExpanded ? (
                                  <ChevronDown className="h-4 w-4" />
                                ) : (
                                  <ChevronRight className="h-4 w-4" />
                                )}
                              </Button>
                            )}

                            <div className="flex-1">
                              {editMode && editingSubject === subject.id ? (
                                <div className="flex items-center space-x-2">
                                  <Input
                                    value={tempSubjectName}
                                    onChange={e => setTempSubjectName(e.target.value)}
                                    className="flex-1"
                                    autoFocus
                                    onKeyDown={e => {
                                      if (e.key === 'Enter') {
                                        saveSubjectName(subject.id);
                                      }
                                      if (e.key === 'Escape') {
                                        cancelEditing();
                                      }
                                    }}
                                  />
                                  <Button size="sm" variant="outline" onClick={() => saveSubjectName(subject.id)}>
                                    <Save className="h-4 w-4" />
                                  </Button>
                                  <Button size="sm" variant="outline" onClick={cancelEditing}>
                                    <X className="h-4 w-4" />
                                  </Button>
                                </div>
                              ) : (
                                <div className="flex items-center space-x-2">
                                  <div>
                                    <CardTitle className="text-xl">{subject.name}</CardTitle>
                                    <CardDescription>
                                      {subject.topics.length} topic{subject.topics.length !== 1 ? 's' : ''}
                                    </CardDescription>
                                  </div>
                                  {editMode && (
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEditingSubject(subject.id, subject.name)}
                                      className="p-1 h-auto"
                                    >
                                      <Edit3 className="h-3 w-3" />
                                    </Button>
                                  )}
                                </div>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            {editMode ? (
                              <>
                                {/* Remove Subject Button */}
                                {subject.isCustom && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeSubject(subject.id)}
                                    className="text-rose-600 hover:text-rose-700 hover:bg-rose-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                )}
                              </>
                            ) : (
                              <>
                                <div className="text-right">
                                  <p className={`text-lg font-bold ${getMasteryColor(subjectMastery)}`}>
                                    {subjectMastery}%
                                  </p>
                                  <p className="text-sm text-muted-foreground">Mastery</p>
                                </div>
                              </>
                            )}
                          </div>
                        </div>

                        {!editMode && (
                          <div className="mt-4">
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-sm text-muted-foreground">Subject Progress</span>
                              <span className="text-sm font-medium">{subjectMastery}%</span>
                            </div>
                            <Progress value={subjectMastery} className="h-2" />
                          </div>
                        )}
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0">
                          {editMode ? (
                            <div className="space-y-6">
                              <Separator />

                              {/* Topic Management Header */}
                              <div className="flex items-center justify-between">
                                <div className="flex items-center space-x-2">
                                  <h5 className="font-semibold text-gray-800">Topic Management</h5>
                                  <Badge variant="outline" className="text-xs">
                                    {subject.topics.length} topic{subject.topics.length !== 1 ? 's' : ''}
                                  </Badge>
                                </div>
                                <div className="flex items-center space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={() => addTopic(subject.id)}
                                    className="flex items-center space-x-1"
                                  >
                                    <Plus className="h-3 w-3" />
                                    <span>Add Topic</span>
                                  </Button>

                                  <DropdownMenu modal={false}>
                                    <DropdownMenuTrigger asChild>
                                      <Button size="sm" variant="ghost">
                                        <MoreHorizontal className="h-4 w-4" />
                                      </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                      <DropdownMenuItem
                                        onClick={() => addTopic(subject.id, { name: 'Quick Topic', estimatedHours: 3 })}
                                      >
                                        <Plus className="h-3 w-3 mr-2" />
                                        Quick Add Topic
                                      </DropdownMenuItem>
                                      <DropdownMenuSeparator />
                                      <DropdownMenuItem>
                                        <ArrowUpDown className="h-3 w-3 mr-2" />
                                        Reorder Topics
                                      </DropdownMenuItem>
                                      <DropdownMenuItem>
                                        <Timer className="h-3 w-3 mr-2" />
                                        Bulk Set Hours
                                      </DropdownMenuItem>
                                    </DropdownMenuContent>
                                  </DropdownMenu>
                                </div>
                              </div>

                              {/* Topics List */}
                              {subject.topics && subject.topics.length > 0 ? (
                                <div className="space-y-3">
                                  {subject.topics.map((topic: SyllabusTopic) => {
                                    const isEditing = editingTopic === topic.id;
                                    const isSelected = selectedTopics.has(topic.id);
                                    const showDetails = showTopicDetails.has(topic.id);

                                    return (
                                      <div
                                        key={topic.id}
                                        className={`group relative bg-white border-2 rounded-lg transition-all duration-200 ${
                                          isSelected
                                            ? 'border-blue-500 bg-blue-50'
                                            : isEditing
                                              ? 'border-green-500 bg-green-50'
                                              : 'border-gray-200 hover:border-gray-300 hover:shadow-sm'
                                        }`}
                                      >
                                        {/* Topic Header */}
                                        <div className="flex items-center justify-between p-4">
                                          <div className="flex items-center space-x-3 flex-1">
                                            {/* Drag Handle */}
                                            <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                              <GripVertical className="h-4 w-4 text-gray-400 cursor-move" />
                                            </div>

                                            {/* Bulk Select Checkbox */}
                                            {bulkEditMode && (
                                              <input
                                                type="checkbox"
                                                checked={isSelected}
                                                onChange={() => toggleTopicSelection(topic.id)}
                                                className="h-4 w-4 text-blue-600 rounded border-gray-300"
                                              />
                                            )}

                                            {/* Topic Content */}
                                            <div className="flex-1 min-w-0">
                                              {isEditing ? (
                                                <div className="space-y-3">
                                                  <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                                                    <div className="md:col-span-2">
                                                      <Label
                                                        htmlFor={`topic-name-${topic.id}`}
                                                        className="text-xs font-medium text-gray-700"
                                                      >
                                                        Topic Name
                                                      </Label>
                                                      <Input
                                                        id={`topic-name-${topic.id}`}
                                                        value={tempTopicName}
                                                        onChange={e => setTempTopicName(e.target.value)}
                                                        placeholder="Enter topic name..."
                                                        autoFocus
                                                        onKeyDown={e => {
                                                          if (e.key === 'Enter') {
                                                            saveTopicChanges(subject.id, topic.id);
                                                          }
                                                          if (e.key === 'Escape') {
                                                            cancelEditing();
                                                          }
                                                        }}
                                                      />
                                                    </div>
                                                    <div>
                                                      <Label
                                                        htmlFor={`topic-hours-${topic.id}`}
                                                        className="text-xs font-medium text-gray-700"
                                                      >
                                                        Est. Hours
                                                      </Label>
                                                      <Input
                                                        id={`topic-hours-${topic.id}`}
                                                        type="number"
                                                        inputMode="numeric"
                                                        min="1"
                                                        max="100"
                                                        value={tempTopicHours}
                                                        onChange={e => setTempTopicHours(Number(e.target.value))}
                                                      />
                                                    </div>
                                                  </div>

                                                  <div>
                                                    <Label
                                                      htmlFor={`topic-desc-${topic.id}`}
                                                      className="text-xs font-medium text-gray-700"
                                                    >
                                                      Description (Optional)
                                                    </Label>
                                                    <Textarea
                                                      id={`topic-desc-${topic.id}`}
                                                      value={tempTopicDescription}
                                                      onChange={e => setTempTopicDescription(e.target.value)}
                                                      placeholder="Add topic description, key points, or notes..."
                                                      rows={2}
                                                      className="resize-none"
                                                    />
                                                  </div>
                                                </div>
                                              ) : (
                                                <div className="space-y-1">
                                                  <div className="flex items-center space-x-2">
                                                    <h6 className="font-medium text-gray-900 line-clamp-2 break-words">
                                                      {topic.name}
                                                    </h6>
                                                    {topic.estimatedHours && (
                                                      <Badge variant="secondary" className="text-xs">
                                                        {topic.estimatedHours}h
                                                      </Badge>
                                                    )}
                                                  </div>
                                                  {topic.description && (
                                                    <p className="text-sm text-gray-600 line-clamp-2">
                                                      {topic.description}
                                                    </p>
                                                  )}
                                                  {!showDetails && (topic.subtopics?.length || 0) > 0 && (
                                                    <p className="text-xs text-gray-500">
                                                      {topic.subtopics?.length} subtopic
                                                      {(topic.subtopics?.length || 0) !== 1 ? 's' : ''}
                                                    </p>
                                                  )}
                                                </div>
                                              )}
                                            </div>
                                          </div>

                                          {/* Topic Actions */}
                                          <div className="flex items-center space-x-1">
                                            {isEditing ? (
                                              <>
                                                <Button
                                                  size="sm"
                                                  onClick={() => saveTopicChanges(subject.id, topic.id)}
                                                  className="bg-green-600 hover:bg-green-700 text-white px-3"
                                                >
                                                  <Save className="h-3 w-3 mr-1" />
                                                  Save
                                                </Button>
                                                <Button size="sm" variant="outline" onClick={cancelEditing}>
                                                  <X className="h-3 w-3" />
                                                </Button>
                                              </>
                                            ) : (
                                              <>
                                                <Button
                                                  size="sm"
                                                  variant="ghost"
                                                  onClick={() => toggleTopicDetails(topic.id)}
                                                  className="p-1"
                                                >
                                                  {showDetails ? (
                                                    <EyeOff className="h-3 w-3" />
                                                  ) : (
                                                    <Eye className="h-3 w-3" />
                                                  )}
                                                </Button>

                                                <DropdownMenu modal={false}>
                                                  <DropdownMenuTrigger asChild>
                                                    <Button size="sm" variant="ghost" className="p-1">
                                                      <MoreHorizontal className="h-3 w-3" />
                                                    </Button>
                                                  </DropdownMenuTrigger>
                                                  <DropdownMenuContent align="end">
                                                    <DropdownMenuItem
                                                      onClick={() => startEditingTopic(topic.id, topic)}
                                                    >
                                                      <Edit3 className="h-3 w-3 mr-2" />
                                                      Edit Topic
                                                    </DropdownMenuItem>
                                                    <DropdownMenuItem
                                                      onClick={() => duplicateTopic(subject.id, topic.id)}
                                                    >
                                                      <Plus className="h-3 w-3 mr-2" />
                                                      Duplicate
                                                    </DropdownMenuItem>
                                                    <DropdownMenuSeparator />
                                                    <AlertDialog>
                                                      <AlertDialogTrigger asChild>
                                                        <DropdownMenuItem
                                                          onSelect={e => e.preventDefault()}
                                                          className="text-red-600 focus:text-red-600"
                                                        >
                                                          <Trash2 className="h-3 w-3 mr-2" />
                                                          Delete
                                                        </DropdownMenuItem>
                                                      </AlertDialogTrigger>
                                                      <AlertDialogContent>
                                                        <AlertDialogHeader>
                                                          <AlertDialogTitle>Delete Topic?</AlertDialogTitle>
                                                          <AlertDialogDescription>
                                                            This will permanently delete &quot;{topic.name}&quot;. This
                                                            action cannot be undone.
                                                          </AlertDialogDescription>
                                                        </AlertDialogHeader>
                                                        <AlertDialogFooter>
                                                          <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                          <AlertDialogAction
                                                            onClick={() => removeTopic(subject.id, topic.id)}
                                                            className="bg-red-600 hover:bg-red-700"
                                                          >
                                                            Delete
                                                          </AlertDialogAction>
                                                        </AlertDialogFooter>
                                                      </AlertDialogContent>
                                                    </AlertDialog>
                                                  </DropdownMenuContent>
                                                </DropdownMenu>
                                              </>
                                            )}
                                          </div>
                                        </div>

                                        {/* Expanded Topic Details */}
                                        {showDetails && !isEditing && (
                                          <div className="border-t bg-gray-50 p-4 space-y-3">
                                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                                              <div>
                                                <span className="font-medium text-gray-700">Estimated Study Time:</span>
                                                <p className="text-gray-600">
                                                  {topic.estimatedHours ?? 'Not set'} hours
                                                </p>
                                              </div>
                                              <div>
                                                <span className="font-medium text-gray-700">Progress:</span>
                                                <p className="text-gray-600">Not started</p>
                                              </div>
                                            </div>

                                            {topic.subtopics && topic.subtopics.length > 0 && (
                                              <div>
                                                <span className="font-medium text-gray-700 text-sm">Subtopics:</span>
                                                <div className="mt-1 flex flex-wrap gap-1">
                                                  {topic.subtopics.map((subtopic, idx) => (
                                                    <Badge key={idx} variant="outline" className="text-xs">
                                                      {subtopic.name}
                                                    </Badge>
                                                  ))}
                                                </div>
                                              </div>
                                            )}

                                            {topic.description && (
                                              <div>
                                                <span className="font-medium text-gray-700 text-sm">Description:</span>
                                                <p className="text-gray-600 text-sm mt-1">{topic.description}</p>
                                              </div>
                                            )}
                                          </div>
                                        )}
                                      </div>
                                    );
                                  })}
                                </div>
                              ) : (
                                <div className="text-center py-8 border-2 border-dashed border-gray-300 rounded-lg bg-gray-50">
                                  <BookOpen className="h-8 w-8 text-gray-400 mx-auto mb-3" />
                                  <h4 className="font-medium text-gray-700 mb-2">No topics yet</h4>
                                  <p className="text-sm text-gray-600 mb-4">
                                    Start building your study plan by adding topics to this subject.
                                  </p>
                                  <Button
                                    size="sm"
                                    onClick={() => addTopic(subject.id)}
                                    className="flex items-center space-x-1"
                                  >
                                    <Plus className="h-4 w-4" />
                                    <span>Add First Topic</span>
                                  </Button>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                              {subject.topics.length === 0 ? (
                                <div className="col-span-full py-12 text-center bg-slate-50/50 rounded-xl border border-dashed border-slate-200">
                                  <BookOpen className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                                  <p className="text-sm text-slate-500 font-medium">No topics yet</p>
                                  <p className="text-xs text-slate-400 mt-1 mb-4">
                                    Add topics to start tracking your progress
                                  </p>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setEditMode(true)}
                                    className="text-blue-600 border-blue-200 hover:bg-blue-50"
                                  >
                                    Switch to Edit Mode
                                  </Button>
                                </div>
                              ) : (
                                subject.topics.map(topic => {
                                  const topicProgress = getTopicProgress(topic.id);
                                  const masteryScore = topicProgress?.masteryScore || 0;

                                  return (
                                    <Link key={topic.id} href={`/syllabus/${topic.id}?subject=${subject.id}`}>
                                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                        <CardContent className="p-4">
                                          <div className="space-y-3">
                                            <div>
                                              <h4 className="font-medium text-sm line-clamp-2">{topic.name}</h4>
                                              {topic.estimatedHours && (
                                                <p className="text-xs text-gray-500 mt-1">
                                                  {topic.estimatedHours} hours
                                                </p>
                                              )}
                                            </div>

                                            <div className="flex items-center justify-between">
                                              <span className={`text-sm font-medium ${getMasteryColor(masteryScore)}`}>
                                                {masteryScore}% mastery
                                              </span>
                                              <ChevronRight className="h-4 w-4 text-gray-400" />
                                            </div>

                                            <Progress value={masteryScore} className="h-1" />

                                            {topicProgress?.lastRevised && (
                                              <p className="text-xs text-muted-foreground">
                                                Last studied:{' '}
                                                {new Date(topicProgress.lastRevised.toDate()).toLocaleDateString()}
                                              </p>
                                            )}
                                          </div>
                                        </CardContent>
                                      </Card>
                                    </Link>
                                  );
                                })
                              )}
                            </div>
                          )}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>

              {filteredSyllabus.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No subjects found</h3>
                    <p className="text-muted-foreground">
                      Try adjusting your filters or search query to find subjects.
                    </p>
                  </CardContent>
                </Card>
              )}
            </>
          </div>
          {/* Edit Syllabus Toggle - At bottom, subtle but noticeable */}
          {!editMode && (
            <div className="flex justify-center py-8 mt-8">
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
                className="bg-blue-50 border-blue-100 hover:bg-blue-100 hover:border-blue-200 text-blue-700 flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
              >
                <Settings className="h-4 w-4" />
                <span>Edit Syllabus</span>
              </Button>
            </div>
          )}
        </PageTransition>
      </div>
    </AuthGuard>
  );
}
