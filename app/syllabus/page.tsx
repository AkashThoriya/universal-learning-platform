'use client';

import { motion } from 'framer-motion';
import { FeaturePageHeader } from '@/components/layout/PageHeader';
import PageTransition from '@/components/layout/PageTransition';
import {
  BookOpen,
  ChevronRight,
  Search,
  Filter,
  Grid,
  List,
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
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import Navigation from '@/components/Navigation';
import { Alert, AlertDescription } from '@/components/ui/alert';
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
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

import { getSyllabus, getAllProgress, saveSyllabus, getUser } from '@/lib/firebase/firebase-utils';
import { logInfo, logError } from '@/lib/utils/logger';
import { SyllabusSubject, TopicProgress, SyllabusTopic } from '@/types/exam';
import StrategyInsights from '@/components/syllabus/StrategyInsights';
import { SyllabusDashboardSkeleton } from '@/components/skeletons';

// Constants
const MASTERY_THRESHOLD = 80;
const MEDIUM_MASTERY_THRESHOLD = 50;

export default function SyllabusPage() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [syllabus, setSyllabus] = useState<SyllabusSubject[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [userProfile, setUserProfile] = useState<any>(null); // Using any temporarily to avoid Import hell, but ideally User type
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [masteryFilter, setMasteryFilter] = useState<string>('all');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  const [viewMode, setViewMode] = useState<'subjects' | 'topics'>('subjects');

  
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

        const userProfile = await getUser(user.uid);


        // getSyllabus now auto-resolves courseId from user's current exam
        const syllabusData = await getSyllabus(user.uid);

        const progressData = await getAllProgress(user.uid);

        logInfo('Syllabus page: Data fetched successfully', {
          syllabusCount: syllabusData.length,
          progressCount: progressData.length,
          userId: user.uid,
        });

        setSyllabus(syllabusData);
        setProgress(progressData);
        if (userProfile) setUserProfile(userProfile);
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
  }, [user]);

  // Save syllabus changes to Firebase
  const saveSyllabusChanges = useCallback(async () => {
    if (!user) {
      return;
    }

    setSaving(true);

    try {
      // saveSyllabus now auto-resolves courseId from user's current exam
      await saveSyllabus(user.uid, syllabus);
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
  const updateSubjectTier = useCallback((subjectId: string, tier: 1 | 2 | 3) => {
    setSyllabus(prev => prev.map(subject => (subject.id === subjectId ? { ...subject, tier } : subject)));
  }, []);

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

  const getTopicProgress = (topicId: string) => {
    return progress.find(p => p.topicId === topicId);
  };

  const getSubjectMastery = (subject: SyllabusSubject) => {
    const topicProgresses = subject.topics.map(topic => getTopicProgress(topic.id));
    const validProgresses = topicProgresses.filter(p => p !== undefined);

    if (validProgresses.length === 0) {
      return 0;
    }

    const totalMastery = validProgresses.reduce((sum, p) => sum + (p?.masteryScore || 0), 0);
    return Math.round(totalMastery / validProgresses.length);
  };

  const filteredSyllabus = syllabus.filter(subject => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      subject.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      subject.topics.some(topic => topic.name.toLowerCase().includes(searchQuery.toLowerCase()));

    // Tier filter
    const matchesTier = tierFilter === 'all' || subject.tier.toString() === tierFilter;

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

    return matchesSearch && matchesTier && matchesMastery;
  }); // Keep natural order - first subjects appear at the top

  // Get all topics with subject information for topics view
  const getAllTopics = () => {
    return syllabus.flatMap(subject =>
      subject.topics.map(topic => ({
        ...topic,
        subjectId: subject.id,
        subjectName: subject.name,
        subjectTier: subject.tier,
      }))
    );
  };

  const filteredTopics = getAllTopics().filter(topic => {
    // Search filter
    const matchesSearch =
      searchQuery === '' ||
      topic.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      topic.subjectName.toLowerCase().includes(searchQuery.toLowerCase());

    // Tier filter
    const matchesTier = tierFilter === 'all' || topic.subjectTier.toString() === tierFilter;

    // Mastery filter
    let matchesMastery = true;
    if (masteryFilter !== 'all') {
      const topicProgress = getTopicProgress(topic.id);
      const masteryScore = topicProgress?.masteryScore || 0;
      switch (masteryFilter) {
        case 'low':
          matchesMastery = masteryScore < MEDIUM_MASTERY_THRESHOLD;
          break;
        case 'medium':
          matchesMastery = masteryScore >= MEDIUM_MASTERY_THRESHOLD && masteryScore < MASTERY_THRESHOLD;
          break;
        case 'high':
          matchesMastery = masteryScore >= MASTERY_THRESHOLD;
          break;
      }
    }

    return matchesSearch && matchesTier && matchesMastery;
  }); // Keep natural order - first topics appear at the top
  // Calculate completed topics count for Strategy Insights
  const completedTopicsCount = progress.filter(p => p.status === 'completed').length;

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

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1:
        return 'High Priority';
      case 2:
        return 'Medium Priority';
      case 3:
        return 'Low Priority';
      default:
        return 'Standard';
    }
  };

  const getMasteryColor = (score: number) => {
    if (score >= MASTERY_THRESHOLD) {
      return 'text-green-600';
    }
    if (score >= MEDIUM_MASTERY_THRESHOLD) {
      return 'text-yellow-600';
    }
    return 'text-red-600';
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <BottomNav />
          <SyllabusDashboardSkeleton />
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
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
              ) : undefined
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
            <div className="animate-in fade-in slide-in-from-top-4 duration-500">
              <StrategyInsights 
                user={userProfile} 
                syllabus={syllabus} 
                completedTopicsCount={completedTopicsCount} 
              />
            </div>
          )}

          {/* View Mode Toggle */}
          <div className="flex justify-center">
            <div className="bg-white rounded-lg p-1 shadow-sm border">
              <div className="flex space-x-1">
                <Button
                  variant={viewMode === 'subjects' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('subjects')}
                  className="px-4 py-2 text-sm font-medium"
                >
                  <List className="h-4 w-4 mr-2" />
                  Subjects View
                </Button>
                <Button
                  variant={viewMode === 'topics' ? 'default' : 'ghost'}
                  size="sm"
                  onClick={() => setViewMode('topics')}
                  className="px-4 py-2 text-sm font-medium"
                >
                  <Grid className="h-4 w-4 mr-2" />
                  Topics View
                </Button>
              </div>
            </div>
          </div>

          {/* Filters */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Filter className="h-5 w-5" />
                <span>Filters & Search</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="space-y-2">
                  <label htmlFor="search-topics" className="text-sm font-medium">
                    Search Topics
                  </label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      id="search-topics"
                      placeholder="Search subjects or topics..."
                      value={searchQuery}
                      onChange={e => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="tier-filter" className="text-sm font-medium">
                    Filter by Tier
                  </label>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger id="tier-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Tiers</SelectItem>
                      <SelectItem value="1">Tier 1 (High Priority)</SelectItem>
                      <SelectItem value="2">Tier 2 (Medium Priority)</SelectItem>
                      <SelectItem value="3">Tier 3 (Low Priority)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label htmlFor="mastery-filter" className="text-sm font-medium">
                    Filter by Mastery
                  </label>
                  <Select value={masteryFilter} onValueChange={setMasteryFilter}>
                    <SelectTrigger id="mastery-filter">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="low">Low (&lt; 50%)</SelectItem>
                      <SelectItem value="medium">Medium (50-79%)</SelectItem>
                      <SelectItem value="high">High (≥ {MASTERY_THRESHOLD}%)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Quick Actions</label>
                  <Button
                    variant="outline"
                    className="w-full"
                    onClick={() => {
                      setSearchQuery('');
                      setTierFilter('all');
                      setMasteryFilter('all');
                    }}
                  >
                    Clear Filters
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Overview Stats - Enhanced Responsive Grid */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            {/* Total Subjects */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100/50 border-blue-200/50 hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-xl bg-blue-500/10">
                    <BookOpen className="h-5 w-5 sm:h-6 sm:w-6 text-blue-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-blue-900">{syllabus.length}</p>
                    <p className="text-xs sm:text-sm text-blue-700/70 font-medium truncate">Total Subjects</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Total Topics */}
            <Card className="bg-gradient-to-br from-green-50 to-green-100/50 border-green-200/50 hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-xl bg-green-500/10">
                    <Target className="h-5 w-5 sm:h-6 sm:w-6 text-green-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-green-900">
                      {syllabus.reduce((sum, subject) => sum + subject.topics.length, 0)}
                    </p>
                    <p className="text-xs sm:text-sm text-green-700/70 font-medium truncate">Total Topics</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Average Mastery */}
            <Card className="bg-gradient-to-br from-purple-50 to-purple-100/50 border-purple-200/50 hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-xl bg-purple-500/10">
                    <TrendingUp className="h-5 w-5 sm:h-6 sm:w-6 text-purple-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-purple-900">
                      {Math.round(
                        syllabus.reduce((sum, subject) => sum + getSubjectMastery(subject), 0) / (syllabus.length || 1)
                      )}%
                    </p>
                    <p className="text-xs sm:text-sm text-purple-700/70 font-medium truncate">Avg Mastery</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Due for Revision */}
            <Card className="bg-gradient-to-br from-orange-50 to-orange-100/50 border-orange-200/50 hover:shadow-md transition-all duration-200">
              <CardContent className="p-4 sm:p-6">
                <div className="flex items-center gap-3">
                  <div className="p-2 sm:p-3 rounded-xl bg-orange-500/10">
                    <Clock className="h-5 w-5 sm:h-6 sm:w-6 text-orange-600" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-xl sm:text-2xl font-bold text-orange-900">
                      {
                        progress.filter(p => {
                          if (!p.nextRevision?.toMillis) return false;
                          const daysSince = Math.floor(
                            (Date.now() - p.nextRevision.toMillis()) / (1000 * 60 * 60 * 24)
                          );
                          return daysSince >= 0;
                        }).length
                      }
                    </p>
                    <p className="text-xs sm:text-sm text-orange-700/70 font-medium truncate">Due for Revision</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content based on view mode */}
          {viewMode === 'subjects' ? (
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
                                      {subject.topics.length} topics • {getTierLabel(subject.tier)}
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
                                {/* Tier Selection */}
                                <Select
                                  value={subject.tier.toString()}
                                  onValueChange={value => updateSubjectTier(subject.id, parseInt(value) as 1 | 2 | 3)}
                                >
                                  <SelectTrigger className="w-32">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="1">
                                      <Badge className="bg-red-100 text-red-800 border-red-200">Tier 1</Badge>
                                    </SelectItem>
                                    <SelectItem value="2">
                                      <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">Tier 2</Badge>
                                    </SelectItem>
                                    <SelectItem value="3">
                                      <Badge className="bg-green-100 text-green-800 border-green-200">Tier 3</Badge>
                                    </SelectItem>
                                  </SelectContent>
                                </Select>

                                {/* Remove Subject Button */}
                                {subject.isCustom && (
                                  <Button
                                    size="sm"
                                    variant="ghost"
                                    onClick={() => removeSubject(subject.id)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
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
                                <Badge className={getTierColor(subject.tier)}>Tier {subject.tier}</Badge>
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

                                  <DropdownMenu>
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
                                                    <h6 className="font-medium text-gray-900 line-clamp-2 break-words">{topic.name}</h6>
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

                                                <DropdownMenu>
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
                                                          onSelect={(e) => e.preventDefault()}
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
                                                            This will permanently delete &quot;{topic.name}&quot;. This action cannot be undone.
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
                              {subject.topics.map(topic => {
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
                                              <p className="text-xs text-gray-500 mt-1">{topic.estimatedHours} hours</p>
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
                              })}
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
          ) : (
            <>
              {/* Topics Grid View */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {filteredTopics.map((topic, index) => {
                  const topicProgress = getTopicProgress(topic.id);
                  const masteryScore = topicProgress?.masteryScore || 0;

                  return (
                    <motion.div
                      key={`${topic.subjectId}-${topic.id}`}
                      initial={{ opacity: 0, y: 20 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: index * 0.05, duration: 0.3 }}
                    >
                    <Link
                      href={`/syllabus/${topic.id}?subject=${topic.subjectId}`}
                    >
                      <Card className="hover:shadow-md transition-shadow cursor-pointer h-full group">
                        <CardContent className="p-5">
                          <div className="space-y-4">
                            {/* Topic Header */}
                            <div className="flex items-start justify-between">
                              <div className="flex-1 min-w-0">
                                <h3 className="font-semibold text-base line-clamp-2 group-hover:text-blue-600 transition-colors">
                                  {topic.name}
                                </h3>
                                <div className="text-sm text-muted-foreground mt-1 flex items-center">
                                  <span className="truncate">{topic.subjectName}</span>
                                  <Badge className={`ml-2 text-xs ${getTierColor(topic.subjectTier)}`}>
                                    T{topic.subjectTier}
                                  </Badge>
                                </div>
                              </div>
                              <ChevronRight className="h-4 w-4 text-gray-400 group-hover:text-blue-600 transition-colors mt-1 flex-shrink-0" />
                            </div>

                            {/* Progress Section */}
                            <div className="space-y-2">
                              <div className="flex items-center justify-between">
                                <span className="text-sm text-muted-foreground">Mastery</span>
                                <span className={`text-sm font-semibold ${getMasteryColor(masteryScore)}`}>
                                  {masteryScore}%
                                </span>
                              </div>
                              <Progress value={masteryScore} className="h-2" />
                            </div>

                            {/* Last Study Info */}
                            {topicProgress?.lastRevised && (
                              <div className="text-xs text-muted-foreground">
                                Last studied: {new Date(topicProgress.lastRevised.toDate()).toLocaleDateString()}
                              </div>
                            )}

                            {/* Study Time if available */}
                            {topic.estimatedHours && (
                              <div className="text-xs text-muted-foreground flex items-center">
                                <Clock className="h-3 w-3 mr-1" />
                                {topic.estimatedHours}h estimated
                              </div>
                            )}
                          </div>
                        </CardContent>
                      </Card>
                    </Link>
                    </motion.div>
                  );
                })}
              </div>

              {filteredTopics.length === 0 && (
                <Card>
                  <CardContent className="py-12 text-center">
                    <BookOpen className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                    <h3 className="text-lg font-medium text-gray-900 mb-2">No topics found</h3>
                    <p className="text-muted-foreground">Try adjusting your filters or search query to find topics.</p>
                  </CardContent>
                </Card>
              )}
            </>
          )}
        </div>

          {/* Edit Syllabus Toggle - At bottom, subtle but noticeable */}
          {!editMode && (
            <div className="flex justify-center py-8 mt-8">
              <Button
                variant="outline"
                onClick={() => setEditMode(true)}
                className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 border-blue-200 dark:border-blue-800 hover:border-blue-400 text-blue-700 dark:text-blue-300 flex items-center gap-2 shadow-sm hover:shadow-md transition-all"
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
