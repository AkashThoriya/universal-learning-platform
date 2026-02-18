'use client';

import {
  BookOpen,
  MessageSquareText,
  ChevronDown,
  ChevronRight,
  ArrowLeft,
  Folder,
  FolderOpen,
  HelpCircle,
} from 'lucide-react';
import Link from 'next/link';
import { useState, useEffect, useCallback } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import { FeaturePageHeader } from '@/components/layout/PageHeader';
import PageTransition from '@/components/layout/PageTransition';
import Navigation from '@/components/Navigation';
import { SyllabusDashboardSkeleton } from '@/components/skeletons';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { EmptyState } from '@/components/ui/empty-state';
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from '@/components/ui/accordion';
import { useAuth } from '@/contexts/AuthContext';
import { useCourse } from '@/contexts/CourseContext';
import { useToast } from '@/hooks/use-toast';
import { getSyllabus } from '@/lib/firebase/firebase-utils';
import { cn } from '@/lib/utils/utils';
import { SyllabusSubject, SyllabusTopic } from '@/types/exam';

// Interface for aggregated question data
interface TopicQuestions {
  topic: SyllabusTopic;
  questions: (string | { question: string; answer: string })[];
}

interface SubjectQuestions {
  subject: SyllabusSubject;
  topics: TopicQuestions[];
  totalQuestions: number;
}

export default function InterviewQuestionsPage() {
  const { user } = useAuth();
  const { activeCourseId } = useCourse();
  const { toast } = useToast();

  // State
  const [loading, setLoading] = useState(true);
  const [subjectQuestions, setSubjectQuestions] = useState<SubjectQuestions[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  const [totalQuestionsCount, setTotalQuestionsCount] = useState(0);

  // Fetch syllabus data and aggregate questions
  const fetchData = useCallback(async () => {
    if (!user?.uid) {
      return;
    }

    setLoading(true);
    try {
      const syllabus = await getSyllabus(user.uid, activeCourseId ?? undefined);

      if (!syllabus || syllabus.length === 0) {
        setSubjectQuestions([]);
        setLoading(false);
        return;
      }

      let totalCount = 0;
      const aggregated: SubjectQuestions[] = syllabus
        .map(subject => {
          const topics: TopicQuestions[] = subject.topics
            .map(topic => ({
              topic,
              questions: topic.interviewQuestions || [],
            }))
            .filter(t => t.questions.length > 0);

          const subjectTotal = topics.reduce((acc, t) => acc + t.questions.length, 0);
          totalCount += subjectTotal;

          return {
            subject,
            topics,
            totalQuestions: subjectTotal,
          };
        })
        .filter(s => s.totalQuestions > 0);

      setSubjectQuestions(aggregated);
      setTotalQuestionsCount(totalCount);

      // Auto-expand first subject if there are questions
      if (aggregated.length > 0 && aggregated[0]) {
        setExpandedSubjects(new Set([aggregated[0].subject.id]));
      }
    } catch (error) {
      console.error('Error fetching interview questions:', error);
      toast({
        title: 'Error',
        description: 'Failed to load interview questions. Please try again.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.uid, activeCourseId, toast]);

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

  // Helper to get question text
  const getQuestionText = (item: string | { question: string }) => {
    return typeof item === 'string' ? item : item.question;
  };

  // Helper to get answer text
  const getAnswerText = (item: string | { answer: string }) => {
    return typeof item === 'string' ? null : item.answer;
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
              title="Interview Questions"
              description={
                totalQuestionsCount > 0
                  ? `${totalQuestionsCount} questions across ${subjectQuestions.length} subjects`
                  : 'Practice with common interview questions'
              }
              icon={<MessageSquareText className="h-5 w-5 text-indigo-600" />}
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
            {subjectQuestions.length === 0 && (
              <Card className="border-dashed">
                <CardContent className="py-12">
                  <EmptyState
                    icon={MessageSquareText}
                    title="No questions found"
                    description="Your syllabus doesn't have any interview questions yet."
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

            {/* Questions organized by Subject/Topic */}
            <div className="space-y-4">
              {subjectQuestions.map(subjectData => (
                <Card key={subjectData.subject.id} className="overflow-hidden border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  {/* Subject Header */}
                  <CardHeader
                    className={cn(
                      'cursor-pointer transition-colors hover:bg-slate-50 py-4',
                      expandedSubjects.has(subjectData.subject.id) && 'bg-slate-50 border-b border-slate-100'
                    )}
                    onClick={() => toggleSubject(subjectData.subject.id)}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        {expandedSubjects.has(subjectData.subject.id) ? (
                          <FolderOpen className="h-5 w-5 text-indigo-600" />
                        ) : (
                          <Folder className="h-5 w-5 text-slate-400" />
                        )}
                        <div>
                          <CardTitle className="text-lg text-slate-900">{subjectData.subject.name}</CardTitle>
                          <p className="text-sm text-slate-500">
                            {subjectData.topics.length} topic{subjectData.topics.length !== 1 ? 's' : ''} •{' '}
                            {subjectData.totalQuestions} question{subjectData.totalQuestions !== 1 ? 's' : ''}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center gap-3">

                        {expandedSubjects.has(subjectData.subject.id) ? (
                          <ChevronDown className="h-5 w-5 text-slate-400" />
                        ) : (
                          <ChevronRight className="h-5 w-5 text-slate-400" />
                        )}
                      </div>
                    </div>
                  </CardHeader>

                  {/* Topics within Subject */}
                  {expandedSubjects.has(subjectData.subject.id) && (
                    <CardContent className="p-0 bg-white">
                      <div className="divide-y divide-slate-100">
                         {subjectData.topics.map((topicData, topicIndex) => (
                          <div key={topicData.topic.id} className="p-4 sm:p-6 space-y-4">
                            {/* Topic Heading */}
                            <div className="flex items-center gap-2 mb-2">
                              <Badge variant="outline" className="text-xs font-semibold text-indigo-600 border-indigo-200 bg-indigo-50">
                                Topic {topicIndex + 1}
                              </Badge>
                              <h3 className="text-base font-semibold text-slate-800">
                                {topicData.topic.name}
                              </h3>
                            </div>

                            {/* Questions Accordion */}
                            <Accordion type="single" collapsible className="w-full space-y-2">
                              {topicData.questions.map((questionItem, qIndex) => {
                                const questionText = getQuestionText(questionItem);
                                const answerText = getAnswerText(questionItem);
                                
                                return (
                                  <AccordionItem 
                                    key={qIndex} 
                                    value={`item-${topicData.topic.id}-${qIndex}`}
                                    className="border rounded-lg px-4 bg-slate-50/50 data-[state=open]:bg-white data-[state=open]:shadow-sm transition-all duration-200"
                                  >
                                    <AccordionTrigger className="hover:no-underline py-3 text-left font-medium text-slate-700 hover:text-slate-900 data-[state=open]:text-indigo-700">
                                      <span className="mr-2">{qIndex + 1}. {questionText}</span>
                                    </AccordionTrigger>
                                    <AccordionContent className="pt-2 pb-4 text-slate-600">
                                      {answerText ? (
                                        <div className="prose prose-sm prose-slate max-w-none prose-p:leading-relaxed prose-pre:bg-slate-900 prose-pre:text-slate-50">
                                          <ReactMarkdown remarkPlugins={[remarkGfm]}>
                                            {answerText}
                                          </ReactMarkdown>
                                        </div>
                                      ) : (
                                        <div className="flex items-center gap-2 text-slate-400 italic">
                                          <HelpCircle className="h-4 w-4" />
                                          <span>No sample answer available for this question.</span>
                                        </div>
                                      )}
                                    </AccordionContent>
                                  </AccordionItem>
                                );
                              })}
                            </Accordion>
                          </div>
                        ))}
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </PageTransition>
      </div>
    </AuthGuard>
  );
}
