'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

import { 
  ArrowLeft, 
  Clock, 
  Target, 
  Award, 
  Brain, 
  Play, 
  CheckCircle2,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import { TestDetailSkeleton } from '@/components/skeletons';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/contexts/AuthContext';
import { adaptiveTestingService } from '@/lib/services/adaptive-testing-service';
import { AdaptiveTest, TestSession, AdaptiveQuestion } from '@/types/adaptive-testing';
import QuestionInterface from '@/components/adaptive-testing/QuestionInterface';
import TestAnalyticsDashboard from '@/components/adaptive-testing/TestAnalyticsDashboard';
import confetti from 'canvas-confetti';

export default function TestDetailPage() {
  const { testId } = useParams();
  const router = useRouter();
  const { user } = useAuth();
  const { toast } = useToast();

  const [test, setTest] = useState<AdaptiveTest | null>(null);
  const [activeSession, setActiveSession] = useState<TestSession | null>(null);
  const [loading, setLoading] = useState(true);
  const [mode, setMode] = useState<'landing' | 'active' | 'completed'>('landing');
  
  // Test Execution State
  const [currentQuestion, setCurrentQuestion] = useState<AdaptiveQuestion | null>(null);
  const [questionResult, setQuestionResult] = useState<{
      isCorrect: boolean;
      correctAnswer: string | number;
      explanation?: string;
  } | null>(null);
  const [pendingNext, setPendingNext] = useState<{
      nextQuestion?: AdaptiveQuestion;
      testCompleted: boolean;
      performance?: any;
  } | null>(null);
  const [hasShownConfetti, setHasShownConfetti] = useState(false);

  // Celebration confetti on completion
  useEffect(() => {
    if ((mode === 'completed' || test?.status === 'completed') && !hasShownConfetti) {
      setHasShownConfetti(true);
      // Fire confetti burst from both sides
      const duration = 3000;
      const end = Date.now() + duration;
      
      const frame = () => {
        confetti({
          particleCount: 3,
          angle: 60,
          spread: 55,
          origin: { x: 0 },
          colors: ['#6366f1', '#8b5cf6', '#a855f7'],
        });
        confetti({
          particleCount: 3,
          angle: 120,
          spread: 55,
          origin: { x: 1 },
          colors: ['#6366f1', '#8b5cf6', '#a855f7'],
        });
        
        if (Date.now() < end) {
          requestAnimationFrame(frame);
        }
      };
      frame();
    }
  }, [mode, test?.status, hasShownConfetti]);

  // Load Test Data
  useEffect(() => {
    const loadTest = async () => {
      if (!user?.uid || !testId) return;

      try {
        setLoading(true);
        // 1. Fetch Test Details
        const testResult = await adaptiveTestingService.getTest(testId as string);
        if (!testResult.success || !testResult.data) {
           throw new Error('Test not found');
        }
        setTest(testResult.data);

        // 2. Check for Active Session
        const sessionResult = await adaptiveTestingService.recoverActiveSession(user.uid, testId as string);
        if (sessionResult.success && sessionResult.data) {
            console.log('Resumed active session:', sessionResult.data.id);
            setActiveSession(sessionResult.data);
            // Don't auto-start? Let user click Resume.
            // Or auto-resume?
            // Let's show "Resume" button on landing.
        }

      } catch (error) {
        console.error('Error loading test:', error);
        toast({
          title: 'Error',
          description: 'Failed to load test details.',
          variant: 'destructive',
        });
        router.push('/test');
      } finally {
        setLoading(false);
      }
    };

    if (user?.uid) {
        loadTest();
    }
  }, [user, testId, router, toast]);

  const handleStartTest = async () => {
    if (!user?.uid || !test) return;

    try {
        const result = await adaptiveTestingService.startTestSession(user.uid, {
            testId: test.id,
            estimatedDuration: test.estimatedDuration,
        });

        if (result.success && result.data) {
             setActiveSession(result.data);
             setCurrentQuestion(result.data.nextQuestionPreview || null);
             setMode('active');
        } else {
             throw new Error('Failed to start session');
        }

    } catch (e) {
        console.error(e);
        toast({ title: 'Error', variant: 'destructive', description: 'Could not start test.' });
    }
  };

  const handleResumeTest = async () => {
      if (!activeSession) return;
      
      // If we have active session, we should have nextQuestionPreview in it?
      // Or we need to fetch the current question?
      // TestSession logic: currentQuestionIndex.
      // We might need to "get current question".
      // Usually `resumeTestSession` returns the session. 
      // Does it return the question?
      // `nextQuestionPreview` is on the session object if present.
      
      // If nextQuestionPreview is missing, we need to fetch it?
      // Service `resumeTestSession` doesn't fetch question.
      // But... how do we get the question?
      // Maybe calls to `submitResponse` with no answer? No.
      
      // If we recovered the session, check if question exists.
      if (activeSession.nextQuestionPreview) {
          setCurrentQuestion(activeSession.nextQuestionPreview || null);
          setMode('active');
      } else {
          // Fallback: This shouldn't happen if session is active and not finished?
          // Maybe we need to re-fetch the question from test.questions[currentQuestionIndex]?
          // But test.questions might be hidden/partial?
          // The Service loads the test.
          // Let's try to assume nextQuestionPreview is populated by `recoverActiveSession`?
          // It's part of Session interface.
          
          // If null, maybe we are at start?
          // But Resuming implies we started.
          
          // Let's just setMode('active') and see.
          // Ideally passing null currentQuestion is bad.
          
          // Workaround: We have `test.questions`.
          // We can find the question by `test.questions[session.currentQuestionIndex]`.
          // This assumes `test.questions` is populated.
          
          if (test && test.questions && activeSession.currentQuestionIndex < test.questions.length) {
              const q = test.questions[activeSession.currentQuestionIndex];
              setCurrentQuestion(q || null);
              setMode('active');
          } else {
              toast({ title: 'Error', description: 'Could not restore question.', variant: 'destructive' });
          }
      }
  };

  const handleAnswerSubmit = async (qid: string, ans: string, conf: number, time: number) => {
     if (!activeSession) return;
     
     const result = await adaptiveTestingService.submitResponse(user!.uid, {
         sessionId: activeSession.id,
         questionId: qid,
         answer: ans,
         confidence: conf,
         responseTime: time
     });
     
     if (result.success && result.data) {
         setQuestionResult({
            isCorrect: result.data.isCorrect,
            correctAnswer: result.data.correctAnswer,
            ...(result.data.explanation ? { explanation: result.data.explanation } : {})
         });
         setPendingNext({
             ...(result.data.nextQuestion ? { nextQuestion: result.data.nextQuestion } : {}),
             testCompleted: result.data.testCompleted,
             ...(result.data.performance ? { performance: result.data.performance } : {})
         });
         
         // Removed explicit scroll to prevent disorientation
         // setTimeout(() => window.scrollTo({ top: 200, behavior: 'smooth' }), 100);
     }
  };

  const handleNextQuestion = async () => {
    if (!pendingNext || !activeSession) return;

    if (pendingNext.testCompleted) {
        setMode('completed');
        // Update local test object with performance?
        if (test && pendingNext.performance) {
            setTest({ ...test, performance: pendingNext.performance });
        }
    } else if (pendingNext.nextQuestion) {
        setCurrentQuestion(pendingNext.nextQuestion);
        // Update session index locally
        setActiveSession({
            ...activeSession,
            currentQuestionIndex: activeSession.currentQuestionIndex + 1
        });
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }
    setQuestionResult(null);
    setPendingNext(null);
  };
  
  if (loading) {
      return <TestDetailSkeleton />;
  }

  if (!test) return null;

  // VIEW: COMPLETED
  if (mode === 'completed' || test.status === 'completed') {
      return (
          <div className="min-h-screen bg-gray-50 pb-20">
              <div className="bg-white border-b sticky top-0 z-40 px-4 py-4 flex items-center gap-4">
                  <Button variant="ghost" size="icon" onClick={() => router.push('/test')}>
                      <ArrowLeft className="w-5 h-5" />
                  </Button>
                  <h1 className="font-bold text-lg text-gray-900 truncate flex-1">{test.title}</h1>
              </div>
              <div className="container mx-auto px-4 py-8 max-w-5xl">
                 <TestAnalyticsDashboard 
                    performance={test.performance}
                    adaptiveMetrics={test.adaptiveMetrics}
                    questions={test.questions}
                    responses={test.responses || []}
                    showDetailedAnalysis
                    showRecommendations
                 />
              </div>
          </div>
      );
  }

  // VIEW: ACTIVE TEST
  if (mode === 'active' && currentQuestion) {
      return (
          <div className="min-h-screen bg-gray-50 pb-40">
              {/* Minimal Header */}
              <div className="bg-white border-b px-4 py-3 flex justify-between items-center sticky top-0 z-40 shadow-sm">
                  <div className="flex items-center gap-2 text-sm text-gray-500">
                      <Brain className="w-4 h-4 text-blue-600" />
                      <span className="font-semibold text-gray-900">{test.title}</span>
                  </div>
                  <AlertDialog>
                      <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="sm" className="text-red-500 hover:text-red-600 hover:bg-red-50">
                              Exit
                          </Button>
                      </AlertDialogTrigger>
                      <AlertDialogContent>
                          <AlertDialogHeader>
                              <AlertDialogTitle>Exit Assessment?</AlertDialogTitle>
                              <AlertDialogDescription>
                                  Your progress will be saved automatically. You can resume this test anytime from the dashboard.
                              </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                              <AlertDialogCancel>Continue Test</AlertDialogCancel>
                              <AlertDialogAction 
                                  onClick={() => setMode('landing')}
                                  className="bg-red-600 hover:bg-red-700"
                              >
                                  Exit & Save Progress
                              </AlertDialogAction>
                          </AlertDialogFooter>
                      </AlertDialogContent>
                  </AlertDialog>
              </div>

              <div className="container mx-auto px-4 py-6 max-w-4xl">
                  <QuestionInterface 
                    key={currentQuestion.id}
                    question={currentQuestion}
                    questionNumber={(activeSession?.currentQuestionIndex || 0) + 1}
                    totalQuestions={test.totalQuestions}
                    onAnswer={handleAnswerSubmit}
                    onNext={handleNextQuestion}
                    result={questionResult}
                    adaptiveMode
                    showTimer
                  />
              </div>
          </div>
      );
  }

  // VIEW: LANDING
  return (
    <div className="min-h-screen bg-[#F8F9FC]">
      {/* Navigation */}
      <div className="sticky top-0 z-40 bg-white/80 backdrop-blur-md border-b border-gray-100">
        <div className="container mx-auto px-4 h-16 flex items-center gap-4">
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={() => router.push('/test')}
            className="hover:bg-gray-100 rounded-full"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </Button>
          <span className="font-semibold text-gray-900">Assessment Details</span>
        </div>
      </div>

      <main className="container mx-auto px-4 py-8 max-w-5xl space-y-8">
        {/* Hero Section */}
        <div className="relative overflow-hidden rounded-3xl bg-white shadow-xl shadow-blue-900/5 border border-white/50">
            {/* Background Gradients */}
            <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gradient-to-br from-blue-50 to-purple-50 rounded-full blur-3xl -z-10 opacity-60" />
            <div className="absolute bottom-0 left-0 w-[300px] h-[300px] bg-gradient-to-tr from-cyan-50 to-teal-50 rounded-full blur-3xl -z-10 opacity-60" />

            <div className="p-8 md:p-12 relative z-10">
                <div className="flex flex-col md:flex-row gap-8 items-start md:items-center justify-between">
                    <div className="space-y-4 max-w-2xl">
                        <div className="flex flex-wrap gap-2">
                            {test.linkedSubjects.map(sub => (
                                <Badge key={sub} variant="secondary" className="bg-blue-50 text-blue-700 border-blue-100 px-3 py-1">
                                    {sub}
                                </Badge>
                            ))}
                            <Badge variant="outline" className="border-purple-200 text-purple-700 bg-purple-50/50">
                                {test.difficultyRange.min} - {test.difficultyRange.max}
                            </Badge>
                        </div>
                        
                        <h1 className="text-4xl md:text-5xl font-bold text-gray-900 tracking-tight leading-tight">
                            {test.title}
                        </h1>
                        <p className="text-lg text-gray-600 leading-relaxed">
                            {test.description}
                        </p>
                    </div>

                    <div className="flex flex-col gap-3 min-w-[200px]">
                        {activeSession ? (
                             <Button 
                                onClick={handleResumeTest}
                                size="lg" 
                                className="w-full bg-gradient-to-r from-green-600 to-emerald-600 hover:from-green-700 hover:to-emerald-700 text-white shadow-lg shadow-green-200 h-14 text-lg rounded-xl transition-all hover:scale-[1.02]"
                             >
                                <Play className="w-5 h-5 mr-2 fill-current" />
                                Resume Test
                             </Button>
                        ) : (
                             <Button 
                                onClick={handleStartTest}
                                size="lg" 
                                className="w-full bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white shadow-lg shadow-blue-200 h-14 text-lg rounded-xl transition-all hover:scale-[1.02] animate-pulse-slow"
                             >
                                <Play className="w-5 h-5 mr-2 fill-current" />
                                Start Assessment
                             </Button>
                        )}
                        <p className="text-xs text-center text-gray-400 font-medium">
                            {activeSession ? 'Session in progress' : 'Ready to begin'}
                        </p>
                    </div>
                </div>
            </div>

            {/* Stats Bar */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-px bg-gray-100 border-t border-gray-100">
                {[
                    { label: 'Questions', value: test.totalQuestions, icon: Target },
                    { label: 'Duration', value: `${test.estimatedDuration} min`, icon: Clock },
                    { label: 'Type', value: 'Adaptive', icon: Brain },
                    { label: 'XP Reward', value: `${test.totalQuestions * 50} XP`, icon: Award },
                ].map((stat, i) => (
                    <div key={i} className="bg-white p-6 flex items-center gap-4 group hover:bg-gray-50/80 transition-colors">
                        <div className="w-10 h-10 rounded-full bg-blue-50 flex items-center justify-center text-blue-600 group-hover:scale-110 transition-transform">
                            <stat.icon className="w-5 h-5" />
                        </div>
                        <div>
                            <div className="text-sm text-gray-500 font-medium">{stat.label}</div>
                            <div className="text-lg font-bold text-gray-900">{stat.value}</div>
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* Instructions / Info */}
        <div className="grid md:grid-cols-3 gap-8">
            <Card className="md:col-span-2 border-none shadow-lg bg-white/60 backdrop-blur-sm">
                <CardHeader>
                    <CardTitle>About this Assessment</CardTitle>
                    <CardDescription>What you need to know before starting</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Brain className="w-4 h-4 text-purple-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">Adaptive Difficulty</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                Questions adjust to your skill level in real-time. If you answer correctly, the next question gets harder. If incorrect, it gets easier.
                            </p>
                        </div>
                    </div>
                    <div className="flex gap-4 items-start">
                        <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center flex-shrink-0 mt-0.5">
                            <Clock className="w-4 h-4 text-blue-600" />
                        </div>
                        <div>
                            <h3 className="font-semibold text-gray-900">No Time Limit per Question</h3>
                            <p className="text-sm text-gray-600 mt-1">
                                While there is an estimated duration, take your time to think. Accuracy is more important than speed for your score.
                            </p>
                        </div>
                    </div>
                </CardContent>
            </Card>

            <Card className="border-none shadow-lg bg-gradient-to-br from-blue-600 to-indigo-700 text-white">
                <CardHeader>
                    <CardTitle className="text-white">Ready?</CardTitle>
                    <CardDescription className="text-blue-100">Tips for success</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                    <ul className="space-y-3 text-sm text-blue-50">
                        <li className="flex gap-2">
                             <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />
                             Find a quiet environment
                        </li>
                        <li className="flex gap-2">
                             <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />
                             Stable internet connection
                        </li>
                        <li className="flex gap-2">
                             <CheckCircle2 className="w-4 h-4 text-green-300 flex-shrink-0" />
                             Review topic summaries
                        </li>
                    </ul>
                </CardContent>
            </Card>
        </div>
      </main>
    </div>
  );
}
