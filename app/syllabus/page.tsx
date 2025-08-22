'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { getSyllabus, getAllProgress } from '@/lib/firebase-utils';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { BookOpen, Target, Filter, Search, ChevronRight, Clock, TrendingUp } from 'lucide-react';
import { SyllabusSubject, TopicProgress } from '@/types/exam';
import Link from 'next/link';

export default function SyllabusPage() {
  const { user } = useAuth();
  const [syllabus, setSyllabus] = useState<SyllabusSubject[]>([]);
  const [progress, setProgress] = useState<TopicProgress[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [tierFilter, setTierFilter] = useState<string>('all');
  const [masteryFilter, setMasteryFilter] = useState<string>('all');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;

      try {
        const [syllabusData, progressData] = await Promise.all([
          getSyllabus(user.uid),
          getAllProgress(user.uid)
        ]);
        
        setSyllabus(syllabusData);
        setProgress(progressData);
      } catch (error) {
        console.error('Error fetching syllabus data:', error);
      } finally {
        setLoading(false);
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
    
    if (validProgresses.length === 0) return 0;
    
    const totalMastery = validProgresses.reduce((sum, p) => sum + (p?.masteryScore || 0), 0);
    return Math.round(totalMastery / validProgresses.length);
  };

  const filteredSyllabus = syllabus.filter(subject => {
    // Search filter
    const matchesSearch = searchQuery === '' || 
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
          matchesMastery = subjectMastery < 50;
          break;
        case 'medium':
          matchesMastery = subjectMastery >= 50 && subjectMastery < 80;
          break;
        case 'high':
          matchesMastery = subjectMastery >= 80;
          break;
      }
    }

    return matchesSearch && matchesTier && matchesMastery;
  });

  const getTierColor = (tier: number) => {
    switch (tier) {
      case 1: return 'bg-red-100 text-red-800 border-red-200';
      case 2: return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 3: return 'bg-green-100 text-green-800 border-green-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTierLabel = (tier: number) => {
    switch (tier) {
      case 1: return 'High Priority';
      case 2: return 'Medium Priority';
      case 3: return 'Low Priority';
      default: return 'Standard';
    }
  };

  const getMasteryColor = (score: number) => {
    if (score >= 80) return 'text-green-600';
    if (score >= 50) return 'text-yellow-600';
    return 'text-red-600';
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
              <p className="text-muted-foreground">Loading syllabus...</p>
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
        
        <div className="max-w-7xl mx-auto p-6 space-y-6">
          {/* Header */}
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">Strategic Syllabus Overview</h1>
            <p className="text-muted-foreground">
              Master your preparation with tier-based prioritization and progress tracking
            </p>
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
                  <label className="text-sm font-medium">Search Topics</label>
                  <div className="relative">
                    <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                    <Input
                      placeholder="Search subjects or topics..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
                
                <div className="space-y-2">
                  <label className="text-sm font-medium">Filter by Tier</label>
                  <Select value={tierFilter} onValueChange={setTierFilter}>
                    <SelectTrigger>
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
                  <label className="text-sm font-medium">Filter by Mastery</label>
                  <Select value={masteryFilter} onValueChange={setMasteryFilter}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Levels</SelectItem>
                      <SelectItem value="low">Low (&lt; 50%)</SelectItem>
                      <SelectItem value="medium">Medium (50-79%)</SelectItem>
                      <SelectItem value="high">High (≥ 80%)</SelectItem>
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
                        syllabus.reduce((sum, subject) => sum + getSubjectMastery(subject), 0) / 
                        (syllabus.length || 1)
                      )}%
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
                      {progress.filter(p => {
                        const daysSince = Math.floor(
                          (Date.now() - p.nextRevision.toMillis()) / (1000 * 60 * 60 * 24)
                        );
                        return daysSince >= 0;
                      }).length}
                    </p>
                    <p className="text-sm text-muted-foreground">Due for Revision</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

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
                        <ChevronRight 
                          className={`h-5 w-5 transition-transform ${
                            isExpanded ? 'rotate-90' : ''
                          }`} 
                        />
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
                        <Badge className={getTierColor(subject.tier)}>
                          Tier {subject.tier}
                        </Badge>
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
                          const masteryScore = topicProgress?.masteryScore || 0;
                          
                          return (
                            <Link 
                              key={topic.id} 
                              href={`/syllabus/${topic.id}?subject=${subject.id}`}
                            >
                              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                                <CardContent className="p-4">
                                  <div className="space-y-3">
                                    <div>
                                      <h4 className="font-medium text-sm line-clamp-2">
                                        {topic.name}
                                      </h4>
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
                                        Last studied: {new Date(topicProgress.lastRevised.toDate()).toLocaleDateString()}
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
        </div>
      </div>
    </AuthGuard>
  );
}