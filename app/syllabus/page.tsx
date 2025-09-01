'use client';

import { BookOpen, ChevronRight, Search, Filter, Grid, List, Clock, Target, TrendingUp } from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect } from 'react';

import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { getSyllabus, getAllProgress } from '@/lib/firebase-utils';
import { logInfo, logError } from '@/lib/logger';
import { SyllabusSubject, TopicProgress } from '@/types/exam';

// Constants
const MASTERY_THRESHOLD = 80;
const MEDIUM_MASTERY_THRESHOLD = 50;

export default function SyllabusPage() {
  const { user } = useAuth();
  const [syllabus, setSyllabus] = useState<SyllabusSubject[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [masteryFilter, setMasteryFilter] = useState<string>('all');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<'subjects' | 'topics'>('subjects');

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        logInfo('Syllabus page: No user available, skipping data fetch');
        return;
      }

      logInfo('Syllabus page: Starting data fetch', { userId: user.uid });

      try {
        const [syllabusData, progressData] = await Promise.all([getSyllabus(user.uid), getAllProgress(user.uid)]);

        logInfo('Syllabus page: Data fetched successfully', {
          syllabusCount: syllabusData.length,
          progressCount: progressData.length,
          userId: user.uid,
        });

        setSyllabus(syllabusData);
        setProgress(progressData);
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

    const totalMastery = validProgresses.reduce((sum, p) => sum + (p?.masteryScore ?? 0), 0);
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
  });

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
      const masteryScore = topicProgress?.masteryScore ?? 0;
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
  });

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
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
          <Navigation />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
                <div className="relative glass rounded-2xl p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
                  <p className="text-muted-foreground">Loading syllabus...</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <Navigation />

        <div className="max-w-7xl mx-auto p-4 sm:p-6 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-block">
              <Badge variant="secondary" className="px-4 py-2 text-sm animate-float">
                📚 Syllabus Management
              </Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-bold text-gradient">Strategic Syllabus Overview</h1>
            <p className="text-muted-foreground text-lg">Manage your study priorities and track mastery progress</p>
          </div>

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

          {/* Overview Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <BookOpen className="h-8 w-8 text-blue-600" />
                  <div>
                    <p className="text-2xl font-bold">{syllabus.length}</p>
                    <p className="text-sm text-muted-foreground">Total Subjects</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Target className="h-8 w-8 text-green-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {syllabus.reduce((sum, subject) => sum + subject.topics.length, 0)}
                    </p>
                    <p className="text-sm text-muted-foreground">Total Topics</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <TrendingUp className="h-8 w-8 text-purple-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {Math.round(
                        syllabus.reduce((sum, subject) => sum + getSubjectMastery(subject), 0) / (syllabus.length ?? 1)
                      )}
                      %
                    </p>
                    <p className="text-sm text-muted-foreground">Avg Mastery</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center space-x-2">
                  <Clock className="h-8 w-8 text-orange-600" />
                  <div>
                    <p className="text-2xl font-bold">
                      {
                        progress.filter(p => {
                          const daysSince = Math.floor(
                            (Date.now() - p.nextRevision.toMillis()) / (1000 * 60 * 60 * 24)
                          );
                          return daysSince >= 0;
                        }).length
                      }
                    </p>
                    <p className="text-sm text-muted-foreground">Due for Revision</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Content based on view mode */}
          {viewMode === 'subjects' ? (
            <>
              {/* Subjects List */}
              <div className="space-y-4">
                {filteredSyllabus.map(subject => {
                  const subjectMastery = getSubjectMastery(subject);
                  const isExpanded = expandedSubjects.has(subject.id);

                  return (
                    <Card key={subject.id} className="overflow-hidden">
                      <CardHeader
                        className="cursor-pointer hover:bg-gray-50 transition-colors"
                        onClick={() => toggleSubjectExpansion(subject.id)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center space-x-4">
                            <ChevronRight className={`h-5 w-5 transition-transform ${isExpanded ? 'rotate-90' : ''}`} />
                            <div>
                              <CardTitle className="text-xl">{subject.name}</CardTitle>
                              <CardDescription>
                                {subject.topics.length} topics • {getTierLabel(subject.tier)}
                              </CardDescription>
                            </div>
                          </div>

                          <div className="flex items-center space-x-4">
                            <div className="text-right">
                              <p className={`text-lg font-bold ${getMasteryColor(subjectMastery)}`}>
                                {subjectMastery}%
                              </p>
                              <p className="text-sm text-muted-foreground">Mastery</p>
                            </div>
                            <Badge className={getTierColor(subject.tier)}>Tier {subject.tier}</Badge>
                          </div>
                        </div>

                        <div className="mt-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Subject Progress</span>
                            <span className="text-sm font-medium">{subjectMastery}%</span>
                          </div>
                          <Progress value={subjectMastery} className="h-2" />
                        </div>
                      </CardHeader>

                      {isExpanded && (
                        <CardContent className="pt-0">
                          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                            {subject.topics.map(topic => {
                              const topicProgress = getTopicProgress(topic.id);
                              const masteryScore = topicProgress?.masteryScore ?? 0;

                              return (
                                <Link key={topic.id} href={`/syllabus/${topic.id}?subject=${subject.id}`}>
                                  <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                    <CardContent className="p-4">
                                      <div className="space-y-3">
                                        <div>
                                          <h4 className="font-medium text-sm line-clamp-2">{topic.name}</h4>
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
                {filteredTopics.map(topic => {
                  const topicProgress = getTopicProgress(topic.id);
                  const masteryScore = topicProgress?.masteryScore ?? 0;

                  return (
                    <Link
                      key={`${topic.subjectId}-${topic.id}`}
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
                                <p className="text-sm text-muted-foreground mt-1 flex items-center">
                                  <span className="truncate">{topic.subjectName}</span>
                                  <Badge className={`ml-2 text-xs ${getTierColor(topic.subjectTier)}`}>
                                    T{topic.subjectTier}
                                  </Badge>
                                </p>
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
      </div>
    </AuthGuard>
  );
}
