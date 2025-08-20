'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { doc, setDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Calendar, BookOpen, Target, BarChart3, CheckCircle } from 'lucide-react';

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Form data
  const [examDate, setExamDate] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [mockPlatform, setMockPlatform] = useState('');
  const [quantBook, setQuantBook] = useState('');
  const [pkCourse, setPkCourse] = useState('');
  
  // Diagnostic data
  const [quantScore, setQuantScore] = useState(0);
  const [reasoningScore, setReasoningScore] = useState(0);
  const [englishScore, setEnglishScore] = useState(0);
  const [pkScore, setPkScore] = useState(0);
  
  // Error analysis
  const [quantConcepts, setQuantConcepts] = useState(0);
  const [reasoningConcepts, setReasoningConcepts] = useState(0);
  const [englishConcepts, setEnglishConcepts] = useState(0);
  const [pkConcepts, setPkConcepts] = useState(0);

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      const userData = {
        userId: user.uid,
        email: user.email || '',
        displayName,
        examDate: Timestamp.fromDate(new Date(examDate)),
        createdAt: Timestamp.now(),
        onboardingComplete: true,
        currentPhase: 'foundation_1',
        resources: {
          mockPlatform,
          quantBook,
          pkCourse,
        },
        settings: {
          dailyStudyGoalHrs: 8,
          wakeTime: '06:00',
          sleepTime: '23:00',
        },
      };

      await setDoc(doc(db, 'users', user.uid), userData);

      // Create initial diagnostic
      const diagnosticData = {
        diagnosticId: 'initial',
        date: Timestamp.now(),
        type: 'initial_prelims',
        results: {
          quantScore,
          reasoningScore,
          englishScore,
          pkScore,
          totalScore: quantScore + reasoningScore + englishScore + pkScore,
        },
        analysis: {
          conceptGapCount: quantConcepts + reasoningConcepts + englishConcepts + pkConcepts,
          carelessErrorCount: 0,
          timePressureCount: 0,
          weakestSection: getWeakestSection(),
        },
      };

      await setDoc(
        doc(db, 'users', user.uid, 'userDiagnostics', 'initial'),
        diagnosticData
      );

      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const getWeakestSection = () => {
    const sections = [
      { name: 'quant', score: quantScore },
      { name: 'reasoning', score: reasoningScore },
      { name: 'english', score: englishScore },
      { name: 'pk', score: pkScore },
    ];
    return sections.sort((a, b) => a.score - b.score)[0].name;
  };

  const getProgress = () => (step / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to War Room</h1>
          <p className="text-muted-foreground">Let's set up your strategic preparation dashboard</p>
        </div>

        <div className="mb-8">
          <Progress value={getProgress()} className="h-2" />
          <div className="flex justify-between mt-2 text-sm text-muted-foreground">
            <span>Step {step} of 4</span>
            <span>{Math.round(getProgress())}% complete</span>
          </div>
        </div>

        {step === 1 && (
          <Card>
            <CardHeader className="text-center">
              <Calendar className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Set Your Battle Timeline</CardTitle>
              <CardDescription>When is your IBPS SO IT Officer exam?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Your Name</label>
                <Input
                  placeholder="Enter your name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Exam Date</label>
                <Input
                  type="date"
                  value={examDate}
                  onChange={(e) => setExamDate(e.target.value)}
                />
              </div>
              <Button 
                onClick={() => setStep(2)} 
                className="w-full"
                disabled={!displayName || !examDate}
              >
                Continue to Resources
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <CardHeader className="text-center">
              <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Your Arsenal</CardTitle>
              <CardDescription>What resources are you using for preparation?</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Mock Test Platform</label>
                <Select value={mockPlatform} onValueChange={setMockPlatform}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select platform" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="testbook">Testbook</SelectItem>
                    <SelectItem value="oliveboard">Oliveboard</SelectItem>
                    <SelectItem value="adda247">Adda247</SelectItem>
                    <SelectItem value="gradeup">Gradeup</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Quantitative Aptitude Book/Course</label>
                <Input
                  placeholder="e.g., RS Aggarwal, Arun Sharma"
                  value={quantBook}
                  onChange={(e) => setQuantBook(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Professional Knowledge Course</label>
                <Input
                  placeholder="e.g., Udemy, Coursera, YouTube channel"
                  value={pkCourse}
                  onChange={(e) => setPkCourse(e.target.value)}
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  className="w-full"
                  disabled={!mockPlatform || !quantBook || !pkCourse}
                >
                  Continue to Diagnostic
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 3 && (
          <Card>
            <CardHeader className="text-center">
              <Target className="h-12 w-12 text-orange-600 mx-auto mb-4" />
              <CardTitle>Diagnostic Assessment</CardTitle>
              <CardDescription>
                Take a recent mock test and input your scores (out of 50 each)
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quantitative Aptitude</label>
                  <Input
                    type="number"
                    max="50"
                    min="0"
                    placeholder="Score /50"
                    value={quantScore}
                    onChange={(e) => setQuantScore(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reasoning</label>
                  <Input
                    type="number"
                    max="50"
                    min="0"
                    placeholder="Score /50"
                    value={reasoningScore}
                    onChange={(e) => setReasoningScore(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">English</label>
                  <Input
                    type="number"
                    max="50"
                    min="0"
                    placeholder="Score /50"
                    value={englishScore}
                    onChange={(e) => setEnglishScore(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Professional Knowledge</label>
                  <Input
                    type="number"
                    max="50"
                    min="0"
                    placeholder="Score /50"
                    value={pkScore}
                    onChange={(e) => setPkScore(Number(e.target.value))}
                  />
                </div>
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(2)} className="w-full">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(4)} 
                  className="w-full"
                  disabled={quantScore === 0 && reasoningScore === 0 && englishScore === 0 && pkScore === 0}
                >
                  Analyze Weaknesses
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === 4 && (
          <Card>
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Weakness Analysis</CardTitle>
              <CardDescription>
                How many questions did you get wrong due to not knowing the concept?
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Quant Concept Gaps</label>
                  <Input
                    type="number"
                    max={50 - quantScore}
                    min="0"
                    placeholder="Count"
                    value={quantConcepts}
                    onChange={(e) => setQuantConcepts(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Reasoning Concept Gaps</label>
                  <Input
                    type="number"
                    max={50 - reasoningScore}
                    min="0"
                    placeholder="Count"
                    value={reasoningConcepts}
                    onChange={(e) => setReasoningConcepts(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">English Concept Gaps</label>
                  <Input
                    type="number"
                    max={50 - englishScore}
                    min="0"
                    placeholder="Count"
                    value={englishConcepts}
                    onChange={(e) => setEnglishConcepts(Number(e.target.value))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">PK Concept Gaps</label>
                  <Input
                    type="number"
                    max={50 - pkScore}
                    min="0"
                    placeholder="Count"
                    value={pkConcepts}
                    onChange={(e) => setPkConcepts(Number(e.target.value))}
                  />
                </div>
              </div>

              <div className="bg-blue-50 p-4 rounded-lg">
                <h3 className="font-semibold text-blue-900 mb-2">Your Battle Plan Preview</h3>
                <div className="space-y-1 text-sm text-blue-800">
                  <p>Total Score: {quantScore + reasoningScore + englishScore + pkScore}/200</p>
                  <p>Concept Gaps: {quantConcepts + reasoningConcepts + englishConcepts + pkConcepts}</p>
                  <p>Weakest Section: {getWeakestSection()}</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(3)} className="w-full">
                  Back
                </Button>
                <Button 
                  onClick={handleComplete} 
                  className="w-full"
                  disabled={loading}
                >
                  {loading ? (
                    <div className="flex items-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                      <span>Setting up...</span>
                    </div>
                  ) : (
                    <div className="flex items-center space-x-2">
                      <CheckCircle className="h-4 w-4" />
                      <span>Enter War Room</span>
                    </div>
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  );
}