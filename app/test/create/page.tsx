'use client';

import { BookOpen, Target, Zap, ArrowLeft, ChevronRight, HelpCircle, AlertCircle, Settings, Clock, Filter } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';

import { TestGenerationOverlay } from '@/components/adaptive-testing/TestGenerationOverlay';
import BottomNav from '@/components/BottomNav';
import { FeaturePageHeader } from '@/components/layout/PageHeader';
import PageTransition from '@/components/layout/PageTransition';
import Navigation from '@/components/Navigation';
import { TestConfigSkeleton } from '@/components/skeletons/TestConfigSkeleton';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Slider } from '@/components/ui/slider';
import { Switch } from '@/components/ui/switch';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/contexts/CourseContext';
import { useToast } from '@/hooks/use-toast';
import { getSyllabus } from '@/lib/firebase/firebase-utils';
import { adaptiveTestingService } from '@/lib/services/adaptive-testing-service';
import { logInfo, logError } from '@/lib/utils/logger';
import { MissionDifficulty } from '@/types/mission-system';

interface SyllabusSubject {
  id: string;
  name: string;
  topics: { id: string; name: string }[];
}

const DIFFICULTY_OPTIONS: { value: MissionDifficulty; label: string; description: string; color: string }[] = [
  {
    value: 'beginner',
    label: 'Beginner',
    description: 'Basic recall & understanding',
    color: 'bg-green-100 text-green-700 border-green-200',
  },
  {
    value: 'intermediate',
    label: 'Intermediate',
    description: 'Application of concepts',
    color: 'bg-blue-100 text-blue-700 border-blue-200',
  },
  {
    value: 'advanced',
    label: 'Advanced',
    description: 'Analysis & synthesis',
    color: 'bg-purple-100 text-purple-700 border-purple-200',
  },
  {
    value: 'expert',
    label: 'Expert',
    description: 'Evaluation & creation',
    color: 'bg-orange-100 text-orange-700 border-orange-200',
  },
];

function TestCreationContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const { activeCourseId } = useCourse();
  const { toast } = useToast();

  const [loading, setLoading] = useState(true);
  const [isGenerating, setIsGenerating] = useState(false);
  const [subjects, setSubjects] = useState<SyllabusSubject[]>([]);

  // Form state
  const [selectedSubjects, setSelectedSubjects] = useState<string[]>(
    searchParams.get('subject') ? [searchParams.get('subject')!] : []
  );
  const [selectedTopics, setSelectedTopics] = useState<string[]>(
    searchParams.get('topic') ? [searchParams.get('topic')!] : []
  );
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('intermediate');
  const [questionCount, setQuestionCount] = useState(Number(searchParams.get('questionCount')) || 10);

  // New Feature State
  const [filterMode, setFilterMode] = useState<'all' | 'unseen' | 'weakness'>('all');
  const [isTimed, setIsTimed] = useState(false);
  const [timePerQuestion, setTimePerQuestion] = useState(60); // seconds

  // Load syllabus data
  // FIXED: Removed selectedSubject from dependency array to prevent re-fetching on selection
  useEffect(() => {
    const loadSyllabus = async () => {
      if (!user?.uid) {
        return;
      }

      try {
        setLoading(true);
        const syllabusData = await getSyllabus(user.uid, activeCourseId ?? undefined);

        if (syllabusData && Array.isArray(syllabusData)) {
          const formattedSubjects: SyllabusSubject[] = syllabusData.map((subject: any) => ({
            id: subject.id,
            name: subject.name || subject.title,
            topics: Array.isArray(subject.topics)
              ? subject.topics.map((t: any) => ({ id: t.id, name: t.title || t.name }))
              : Object.values(subject.topics || {}).map((t: any) => ({ id: t.id, name: t.title || t.name })),
          }));

          setSubjects(formattedSubjects);

          // If no subject selected and we have subjects, select the first one
          // We check specifically if selectedSubjects is empty to avoid overriding if logic changes
          if (selectedSubjects.length === 0 && formattedSubjects.length > 0 && formattedSubjects[0]) {
            setSelectedSubjects([formattedSubjects[0].id]);
          }
        }
      } catch (error) {
        logError('[TestCreation] Failed to load syllabus', error as Error);
        toast({
          title: 'Error loading syllabus',
          description: 'Could not load your course configuration. Please try refreshing.',
          variant: 'destructive',
        });
      } finally {
        setLoading(false);
      }
    };

    loadSyllabus();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.uid, activeCourseId, toast]);

  // Handle generation matches the logic from page.tsx but dedicated here
  const handleGenerate = async () => {
    if (!user?.uid) {
      return;
    }
    if (selectedSubjects.length === 0) {
      toast({
        title: 'Selection Required',
        description: 'Please select at least one subject to continue.',
        variant: 'destructive',
      });
      return;
    }

    setIsGenerating(true);

    // Artificial delay for the nice animation
    const minAnimationTime = new Promise(resolve => setTimeout(resolve, 3000));

    try {
      const selectedSubjectsData = subjects.filter(s => selectedSubjects.includes(s.id));

      if (selectedSubjectsData.length === 0) {
        throw new Error('Invalid subjects selected');
      }

      const subjectNames = selectedSubjectsData.map(s => s.name).join(', ');

      // Map selected topic IDs to names
      const topicNames = selectedTopics
        .map(topicId => {
          // Search in all selected subjects
          for (const subject of selectedSubjectsData) {
            const topic = subject.topics.find(t => t.id === topicId);
            if (topic) {
              return topic.name;
            }
          }
          return topicId;
        })
        .filter(Boolean);

      const [testResult] = await Promise.all([
        adaptiveTestingService.createAdaptiveTest(user.uid, {
          title: `${selectedSubjectsData.length > 1 ? 'Multi-Subject' : selectedSubjectsData[0]?.name} Test - ${difficulty.charAt(0).toUpperCase() + difficulty.slice(1)}`,
          description:
            topicNames.length > 0 ? `Testing: ${topicNames.join(', ')}` : `Comprehensive test on: ${subjectNames}`,
          subjects: selectedSubjects,
          ...(selectedTopics.length > 0 && { topics: selectedTopics }),
          ...(activeCourseId && { courseId: activeCourseId }),
          difficulty,
          questionCount,

          questionType: 'multiple_choice',
          // New params
          filterMode,
          ...(isTimed && { timeLimitPerQuestion: timePerQuestion }),
        }),

        minAnimationTime,
      ]);

      if (!testResult.success) {
        throw new Error(testResult.error?.message || 'Failed to create test');
      }

      if (!testResult.data) {
        throw new Error('Test created but no data returned');
      }

      logInfo('[TestCreation] Test created successfully', { testId: testResult.data.id });

      router.push(`/test/${testResult.data.id}`);
    } catch (error) {
      logError('[TestCreation] Error generating test', error as Error);
      setIsGenerating(false);
      toast({
        title: 'Generation Failed',
        description: error instanceof Error ? error.message : 'Something went wrong. Please try again.',
        variant: 'destructive',
      });
    }
  };

  const availableTopics = subjects.filter(s => selectedSubjects.includes(s.id)).flatMap(s => s.topics);

  const toggleSubject = (subjectId: string) => {
    setSelectedSubjects(prev => {
      const newSelection = prev.includes(subjectId) ? prev.filter(id => id !== subjectId) : [...prev, subjectId];

      // If we deselect a subject, remove its topics from selectedTopics
      if (prev.includes(subjectId)) {
        const subject = subjects.find(s => s.id === subjectId);
        if (subject) {
          const subjectTopicIds = subject.topics.map(t => t.id);
          setSelectedTopics(current => current.filter(tid => !subjectTopicIds.includes(tid)));
        }
      }

      return newSelection;
    });
  };

  const toggleTopic = (topicId: string) => {
    setSelectedTopics(prev => (prev.includes(topicId) ? prev.filter(id => id !== topicId) : [...prev, topicId]));
  };

  const toggleAllTopics = () => {
    const allTopicIds = availableTopics.map(t => t.id);
    // If all are currently selected, deselect all (return to "implicit all" state? or explicit none? 
    // The current UI shows "All topics included" when 0 are selected.
    // However, for user control, "Select All" usually means filling the checkboxes.
    // If I click "Select All", I expect to see all highlighted.
    // If I click "Deselect All", I expect none highlighted (which technically means "All" in generation logic, but visual feedback matters).

    // Let's rely on the visual state.
    // If all are selected, clear it.
    if (selectedTopics.length === allTopicIds.length) {
      setSelectedTopics([]);
    } else {
      setSelectedTopics(allTopicIds);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 pb-20">
        <Navigation />
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
          {/* Back Button Skeleton */}
          <div className="mb-6">
            <Button variant="ghost" className="pl-0 text-slate-500" disabled>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Tests
            </Button>
          </div>
          <TestConfigSkeleton />
        </div>
        <BottomNav />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <Navigation />

      <TestGenerationOverlay isVisible={isGenerating} />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-8">
        <Button
          variant="ghost"
          className="mb-6 pl-0 text-slate-500 hover:text-slate-900 hover:bg-transparent"
          onClick={() => router.back()}
        >
          <ArrowLeft className="h-4 w-4 mr-2" />
          Back to Tests
        </Button>

        <PageTransition className="space-y-6">
          <FeaturePageHeader
            title="Create New Test"
            description="Configure your personalized assessment session"
            icon={<Zap className="h-5 w-5 text-amber-500" />}
          />

          {subjects.length === 0 ? (
            <Card className="border border-slate-200 shadow-sm bg-white">
              <CardContent className="flex flex-col items-center justify-center py-12 text-center">
                <AlertCircle className="h-12 w-12 text-amber-500 mb-4" />
                <h3 className="text-lg font-bold text-slate-900 mb-2">No Course Syllabus Found</h3>
                <p className="text-slate-500 max-w-md">
                  We couldn't find any questions for your current course. Please ensure you have a course selected or
                  try refreshing.
                </p>
                <Button className="mt-6" variant="outline" onClick={() => window.location.reload()}>
                  Refresh Page
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Main Configuration Area */}
              <div className="lg:col-span-2 space-y-6">
                <Card className="border border-slate-200 shadow-sm bg-white overflow-hidden">
                  <CardHeader className="bg-white border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <BookOpen className="h-5 w-5 text-blue-600" />
                      Subject & Topics
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                    {/* Subject Selection */}
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                          Subject Context
                        </Label>
                        <Badge variant="outline" className="text-xs font-normal text-slate-500">
                          Select Multiple
                        </Badge>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        {subjects.map(subject => (
                          <div
                            key={subject.id}
                            onClick={() => toggleSubject(subject.id)}
                            className={`
                                                            cursor-pointer p-4 rounded-xl border transition-all duration-200 flex items-center gap-3 relative overflow-hidden group
                                                            ${selectedSubjects.includes(subject.id)
                              ? 'border-blue-500 bg-blue-50/50 ring-1 ring-blue-500 shadow-sm'
                              : 'border-slate-200 bg-white hover:border-blue-300 hover:shadow-md hover:-translate-y-0.5'
                              }
                                                        `}
                          >
                            <div
                              className={`p-2 rounded-lg flex-shrink-0 ${selectedSubjects.includes(subject.id) ? 'bg-blue-100 text-blue-600' : 'bg-slate-100 text-slate-500'}`}
                            >
                              <BookOpen className="h-5 w-5" />
                            </div>
                            <span
                              className={`font-medium ${selectedSubjects.includes(subject.id) ? 'text-blue-900' : 'text-slate-700'}`}
                            >
                              {subject.name}
                            </span>
                            {selectedSubjects.includes(subject.id) && (
                              <div className="ml-auto">
                                <div className="h-2 w-2 rounded-full bg-blue-500" />
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Topic Selection */}
                    {selectedSubjects.length > 0 && (
                      <div className="space-y-3">
                        <div className="flex items-center justify-between">
                          <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                            Focus Topics
                          </Label>
                            <div className="flex items-center gap-2">
                              {availableTopics.length > 0 && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={toggleAllTopics}
                                  className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700 hover:bg-blue-50"
                                >
                                  {selectedTopics.length === availableTopics.length ? 'Deselect All' : 'Select All'}
                                </Button>
                              )}
                              <Badge
                                variant="secondary"
                                className="bg-slate-100 text-slate-600 hover:bg-slate-200 font-normal"
                              >
                                {selectedTopics.length > 0 ? `${selectedTopics.length} selected` : 'All topics included'}
                              </Badge>
                            </div>
                          </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[300px] overflow-y-auto pr-2 custom-scrollbar">
                            {availableTopics.map(topic => (
                            <div
                              key={topic.id}
                              onClick={() => toggleTopic(topic.id)}
                              className={`
                                                                cursor-pointer px-3 py-2.5 rounded-lg border text-sm transition-all
                                                                flex items-center gap-3
                                                                ${selectedTopics.includes(topic.id)
                                  ? 'border-blue-500 bg-blue-50 text-blue-900 font-medium'
                                  : 'border-slate-200 bg-white text-slate-600 hover:border-slate-300 hover:bg-slate-50'
                                }
                                                            `}
                            >
                              <div
                                className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-colors ${selectedTopics.includes(topic.id)
                                  ? 'border-blue-600 bg-blue-600'
                                  : 'border-slate-300 bg-white'
                                  }`}
                              >
                                {selectedTopics.includes(topic.id) && (
                                  <ChevronRight className="h-3 w-3 text-white rotate-90" />
                                )}
                              </div>
                              <span className="truncate">{topic.name}</span>
                            </div>
                          ))}
                        </div>
                          {availableTopics.length === 0 && (
                          <p className="text-sm text-slate-400 italic py-4 text-center border border-dashed border-slate-200 rounded-lg">
                            No specific topics found for this subject.
                          </p>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>

              {/* Sidebar Configuration */}
                <div className="space-y-6 lg:sticky lg:top-6 h-fit bg-slate-50/50 backdrop-blur-sm rounded-xl">
                <Card className="border border-slate-200 shadow-sm bg-white">
                  <CardHeader className="bg-white border-b border-slate-100 pb-4">
                    <CardTitle className="flex items-center gap-2 text-lg text-slate-900">
                      <Settings className="h-5 w-5 text-slate-600" />
                      Test Parameters
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-6 space-y-8">
                      {/* Content Filter */}
                      <div className="space-y-3">
                        <div className="flex items-center gap-2">
                          <Filter className="h-4 w-4 text-slate-500" />
                          <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                            Question Filter
                          </Label>
                        </div>
                        <RadioGroup value={filterMode} onValueChange={(val: any) => setFilterMode(val)} className="flex flex-col gap-2">
                          <div className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-all ${filterMode === 'all' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="all" id="r-all" />
                            <Label htmlFor="r-all" className="flex-1 cursor-pointer font-medium text-slate-700">All Questions</Label>
                          </div>
                          <div className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-all ${filterMode === 'unseen' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="unseen" id="r-unseen" />
                            <Label htmlFor="r-unseen" className="flex-1 cursor-pointer font-medium text-slate-700">Unseen Only</Label>
                          </div>
                          <div className={`flex items-center space-x-2 rounded-lg border p-3 cursor-pointer transition-all ${filterMode === 'weakness' ? 'border-blue-500 bg-blue-50' : 'border-slate-200 hover:bg-slate-50'}`}>
                            <RadioGroupItem value="weakness" id="r-weakness" />
                            <Label htmlFor="r-weakness" className="flex-1 cursor-pointer font-medium text-slate-700">Focus on Weaknesses</Label>
                          </div>
                        </RadioGroup>
                      </div>

                      <div className="h-px bg-slate-100" />

                      {/* Time Limit */}
                      <div className="space-y-4">
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Clock className="h-4 w-4 text-slate-500" />
                            <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                              Timed Mode
                            </Label>
                          </div>
                          <Switch checked={isTimed} onCheckedChange={setIsTimed} />
                        </div>

                        {isTimed && (
                          <div className="bg-slate-50 rounded-lg p-3 border border-slate-200 space-y-2 animate-in fade-in slide-in-from-top-2">
                            <div className="flex justify-between text-xs text-slate-500">
                              <span>Seconds per question</span>
                              <span className="font-medium text-slate-900">{timePerQuestion}s</span>
                            </div>
                            <Slider
                              value={[timePerQuestion]}
                              min={10}
                              max={300}
                              step={10}
                              onValueChange={([val]) => setTimePerQuestion(val ?? 60)}
                            />
                            <p className="text-xs text-slate-400 text-right">Total: {Math.ceil((questionCount * timePerQuestion) / 60)} mins</p>
                          </div>
                        )}
                      </div>

                      <div className="h-px bg-slate-100" />

                    {/* Difficulty Selection */}
                    <div className="space-y-3">
                      <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">
                        Difficulty
                      </Label>
                      <div className="space-y-2">
                        {DIFFICULTY_OPTIONS.map(option => (
                          <div
                            key={option.value}
                            onClick={() => setDifficulty(option.value)}
                            className={`
                                                            cursor-pointer p-3 rounded-lg border transition-all relative overflow-hidden flex items-center gap-3
                                                            ${difficulty === option.value
                                ? `border-slate-400 bg-slate-50 ring-1 ring-slate-200`
                                : 'border-slate-200 hover:border-slate-300 hover:bg-slate-50'
                              }
                                                        `}
                          >
                            <div
                              className={`p-1.5 rounded-md ${difficulty === option.value
                                ? 'bg-white shadow-sm text-slate-900'
                                : 'bg-slate-100 text-slate-500'
                                }`}
                            >
                              <Target className="h-4 w-4" />
                            </div>
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <span
                                  className={`text-sm font-medium ${difficulty === option.value ? 'text-slate-900' : 'text-slate-700'}`}
                                >
                                  {option.label}
                                </span>
                              </div>
                              <p className="text-xs text-slate-500">{option.description}</p>
                            </div>
                            {difficulty === option.value && <div className="h-2 w-2 rounded-full bg-slate-900" />}
                          </div>
                        ))}
                      </div>
                    </div>

                    <div className="h-px bg-slate-100" />

                    {/* Question Count */}
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <Label className="text-sm font-semibold text-slate-700 uppercase tracking-wider">Length</Label>
                        <span className="text-xl font-bold text-slate-900 font-mono">
                          {questionCount} <span className="text-sm font-normal text-slate-400">Qs</span>
                        </span>
                      </div>
                      <Slider
                        defaultValue={[10]}
                        value={[questionCount]}
                        min={3}
                        max={25}
                        step={1}
                        onValueChange={([val]) => setQuestionCount(val ?? 10)}
                        className="py-2"
                      />
                      <div className="flex justify-between text-[10px] text-slate-400 uppercase tracking-wider font-medium">
                        <span>Quick (3)</span>
                        <span>Deep (25)</span>
                      </div>
                    </div>
                  </CardContent>
                  <CardFooter className="p-4 bg-slate-50 border-t border-slate-100">
                    <Button
                      size="lg"
                        className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 transition-all duration-300 hover:scale-[1.02] active:scale-[0.98] font-bold text-lg h-12"
                      onClick={handleGenerate}
                      disabled={loading || isGenerating || selectedSubjects.length === 0}
                      >
                      {isGenerating ? (
                        <>Initializing AI...</>
                      ) : (
                        <>
                              <Zap className="h-5 w-5 mr-2 fill-current animate-pulse" />
                              Start Assessment
                        </>
                      )}
                    </Button>
                  </CardFooter>
                </Card>

                {/* Helper Info */}
                <div className="bg-blue-50 p-4 rounded-xl border border-blue-100 flex gap-3">
                  <HelpCircle className="h-5 w-5 text-blue-600 flex-shrink-0 mt-0.5" />
                  <div className="text-sm text-blue-900/80">
                    <p className="font-semibold text-blue-900 mb-1">Adaptive Engine Active</p>
                    <p className="leading-relaxed">Questions will adjust to your performance level in real-time.</p>
                  </div>
                </div>
              </div>
            </div>
          )}
        </PageTransition>
      </div>

      <BottomNav />
    </div>
  );
}

export default function TestCreationPage() {
  return (
    <Suspense fallback={<TestConfigSkeleton />}>
      <TestCreationContent />
    </Suspense>
  );
}
