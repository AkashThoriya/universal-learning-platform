'use client';

import { Timestamp } from 'firebase/firestore';
import { Target, BarChart3, Clock, MessageSquare, AlertTriangle } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { getExamById } from '@/lib/data/exams-data';
import { saveMockTest, getUser } from '@/lib/firebase/firebase-utils';
import { MockTestLog, User, Exam } from '@/types/exam';

export default function MockTestLogPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  // User and exam data
  const [userData, setUserData] = useState<User | null>(null);
  const [examData, setExamData] = useState<Exam | null>(null);

  // Test details
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState('');
  const [testName, setTestName] = useState('');
  const [stage, setStage] = useState('');
  const [type, setType] = useState<'full_length' | 'sectional' | 'topic_wise' | 'previous_year'>('full_length');

  // Scores and timing
  const [scores, setScores] = useState<Record<string, number>>({});
  const [maxScores, setMaxScores] = useState<Record<string, number>>({});
  const [timeTaken, setTimeTaken] = useState<Record<string, number>>({});

  // Error analysis
  const [conceptGaps, setConceptGaps] = useState(0);
  const [carelessErrors, setCarelessErrors] = useState(0);
  const [intelligentGuesses, setIntelligentGuesses] = useState(0);
  const [timePressures, setTimePressures] = useState(0);

  // Mental state and environment
  const [confidence, setConfidence] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [anxiety, setAnxiety] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [focus, setFocus] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [location, setLocation] = useState('');
  const [timeOfDay, setTimeOfDay] = useState<'morning' | 'afternoon' | 'evening' | 'night'>('morning');
  const [distractions, setDistractions] = useState<string[]>([]);

  // Feedback and action items
  const [feedback, setFeedback] = useState('');
  const [actionItems, setActionItems] = useState<string[]>([]);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        return;
      }

      try {
        const userDoc = await getUser(user.uid);
        setUserData(userDoc);

        if (userDoc?.currentExam.id) {
          const exam = getExamById(userDoc.currentExam.id);
          setExamData(exam ?? null);

          // Initialize scores and max scores based on exam structure
          if (exam && exam.stages.length > 0) {
            const firstStage = exam.stages[0];
            if (firstStage) {
              setStage(firstStage.id);

              const initialScores: Record<string, number> = {};
              const initialMaxScores: Record<string, number> = {};
              const initialTimeTaken: Record<string, number> = {};

              firstStage.sections.forEach(section => {
                initialScores[section.id] = 0;
                initialMaxScores[section.id] = section.maxMarks;
                initialTimeTaken[section.id] = 0;
              });

              setScores(initialScores);
              setMaxScores(initialMaxScores);
              setTimeTaken(initialTimeTaken);
            }
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const getCurrentStage = () => {
    return examData?.stages.find(s => s.id === stage);
  };

  const getTotalScore = () => {
    return Object.values(scores).reduce((sum, score) => sum + score, 0);
  };

  const getTotalMaxScore = () => {
    return Object.values(maxScores).reduce((sum, score) => sum + score, 0);
  };

  const getTotalErrors = () => {
    return getTotalMaxScore() - getTotalScore();
  };

  const validateErrorAnalysis = () => {
    const totalErrors = getTotalErrors();
    const analyzedErrors = conceptGaps + carelessErrors + intelligentGuesses + timePressures;
    return analyzedErrors === totalErrors;
  };

  const addDistraction = () => {
    // TODO: Replace with proper modal dialog
    const distraction = 'Test distraction'; // Temporarily disabled prompt
    if (distraction) {
      setDistractions(prev => [...prev, distraction]);
    }
  };

  const addActionItem = () => {
    // TODO: Replace with proper modal dialog
    const action = 'Action item'; // Temporarily disabled prompt
    if (action) {
      setActionItems(prev => [...prev, action]);
    }
  };

  const handleSubmit = async () => {
    if (!user || !userData || !examData) {
      return;
    }

    if (!validateErrorAnalysis()) {
      // TODO: Replace with proper toast notification
      // console.warn(`Error analysis doesn't match total errors. You have ${getTotalErrors()} errors but analyzed ${conceptGaps + carelessErrors + intelligentGuesses + timePressures}.`);
      return;
    }

    setSaving(true);
    try {
      const testData: MockTestLog = {
        id: `test_${Date.now()}`,
        date: Timestamp.fromDate(new Date(date ?? new Date())),
        platform,
        testName,
        stage,
        type,
        scores,
        maxScores,
        timeTaken,
        analysis: {
          conceptGaps,
          carelessErrors,
          intelligentGuesses,
          timePressures,
          totalQuestions: getTotalMaxScore(), // Assuming 1 mark per question
          correctAnswers: getTotalScore(),
          wrongAnswers: getTotalErrors(),
          unattempted: 0, // Could be calculated separately
          accuracy: (getTotalScore() / getTotalMaxScore()) * 100,
          speed: getTotalMaxScore() / Object.values(timeTaken).reduce((sum, time) => sum + time, 0), // Questions per minute
        },
        topicWisePerformance: [], // This would be populated based on detailed analysis
        mentalState: {
          confidence,
          anxiety,
          focus,
        },
        environment: {
          location,
          distractions,
          timeOfDay,
        },
        feedback,
        actionItems,
      };

      await saveMockTest(user.uid, testData);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving mock test:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
              <p className="text-muted-foreground">Loading mock test logger...</p>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  if (!userData || !examData) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
          <Navigation />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-4">
              <h1 className="text-2xl font-bold">Setup Required</h1>
              <p className="text-muted-foreground">Please complete onboarding first.</p>
              <Button onClick={() => router.push('/onboarding')}>Complete Setup</Button>
            </div>
          </div>
        </div>
      </AuthGuard>
    );
  }

  const currentStage = getCurrentStage();

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
        <Navigation />

        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-block">
              <Badge variant="secondary" className="px-4 py-2 text-sm animate-float">
                🎯 Mock Test Analysis
              </Badge>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Target className="h-8 w-8 text-primary animate-glow" />
              <h1 className="text-3xl sm:text-4xl font-bold text-gradient">Mock Test Logger</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Analyze your <span className="font-semibold">{userData.currentExam.name}</span> performance with precision
            </p>
          </div>

          {step === 1 && (
            <Card className="glass border-0 hover:scale-[1.01] transition-all duration-300">
              <CardHeader className="text-center">
                <div className="p-3 rounded-full bg-blue-100 dark:bg-blue-900/20 w-fit mx-auto mb-4">
                  <Target className="h-12 w-12 text-blue-600" />
                </div>
                <CardTitle className="text-2xl">Test Details</CardTitle>
                <CardDescription>Basic information about your mock test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="test-date" className="text-sm font-medium">
                      Test Date
                    </label>
                    <Input id="test-date" type="date" value={date} onChange={e => setDate(e.target.value)} />
                  </div>
                  <div className="space-y-2">
                    <label htmlFor="test-platform" className="text-sm font-medium">
                      Platform/Source
                    </label>
                    <Select value={platform} onValueChange={setPlatform}>
                      <SelectTrigger id="test-platform">
                        <SelectValue placeholder="Select platform" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="testbook">Testbook</SelectItem>
                        <SelectItem value="oliveboard">Oliveboard</SelectItem>
                        <SelectItem value="adda247">Adda247</SelectItem>
                        <SelectItem value="gradeup">Gradeup</SelectItem>
                        <SelectItem value="vision_ias">Vision IAS</SelectItem>
                        <SelectItem value="insights">Insights IAS</SelectItem>
                        <SelectItem value="self_generated">Self Generated</SelectItem>
                        <SelectItem value="previous_year">Previous Year Paper</SelectItem>
                        <SelectItem value="other">Other</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="space-y-2">
                  <label htmlFor="test-name" className="text-sm font-medium">
                    Test Name
                  </label>
                  <Input
                    id="test-name"
                    placeholder="e.g., Full Length Test #15, Sectional Test - Polity"
                    value={testName}
                    onChange={e => setTestName(e.target.value)}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label htmlFor="exam-stage" className="text-sm font-medium">
                      Exam Stage
                    </label>
                    <Select value={stage} onValueChange={setStage}>
                      <SelectTrigger id="exam-stage">
                        <SelectValue placeholder="Select stage" />
                      </SelectTrigger>
                      <SelectContent>
                        {examData.stages.map(stageOption => (
                          <SelectItem key={stageOption.id} value={stageOption.id}>
                            {stageOption.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <label htmlFor="test-type" className="text-sm font-medium">
                      Test Type
                    </label>
                    <Select
                      value={type}
                      onValueChange={value =>
                        setType(value as 'full_length' | 'sectional' | 'topic_wise' | 'previous_year')
                      }
                    >
                      <SelectTrigger id="test-type">
                        <SelectValue placeholder="Select test type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="full_length">Full Length Test</SelectItem>
                        <SelectItem value="sectional">Sectional Test</SelectItem>
                        <SelectItem value="topic_wise">Topic-wise Test</SelectItem>
                        <SelectItem value="previous_year">Previous Year Paper</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={() => setStep(2)} className="w-full" disabled={!platform || !testName || !stage}>
                  Continue to Scores
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && currentStage && (
            <Card>
              <CardHeader className="text-center">
                <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Scores & Timing</CardTitle>
                <CardDescription>Enter your scores and time taken for {currentStage.name}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {currentStage.sections.map(section => (
                  <div key={section?.id} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">{section?.name}</h4>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-2">
                        <label htmlFor={`score-${section?.id}`} className="text-sm font-medium">
                          Score
                        </label>
                        <div className="flex items-center space-x-2">
                          <Input
                            id={`score-${section?.id}`}
                            type="number"
                            min="0"
                            max={section?.maxMarks}
                            value={section?.id ? (scores[section.id] || 0) : 0}
                            onChange={e =>
                              section?.id &&
                              setScores(prev => ({
                                ...prev,
                                [section.id]: Number(e.target.value),
                              }))
                            }
                          />
                          <span className="text-sm text-gray-500">/ {section?.maxMarks}</span>
                        </div>
                      </div>

                      <div className="space-y-2">
                        <label htmlFor={`time-taken-${section?.id}`} className="text-sm font-medium">
                          Time Taken (minutes)
                        </label>
                        <Input
                          id={`time-taken-${section?.id}`}
                          type="number"
                          min="0"
                          max={section?.maxTime}
                          value={section?.id ? (timeTaken[section.id] || 0) : 0}
                          onChange={e =>
                            section?.id &&
                            setTimeTaken(prev => ({
                              ...prev,
                              [section.id]: Number(e.target.value),
                            }))
                          }
                        />
                      </div>

                      <div className="space-y-2">
                        <label htmlFor={`accuracy-${section?.id}`} className="text-sm font-medium">
                          Accuracy
                        </label>
                        <div id={`accuracy-${section?.id}`} className="text-lg font-semibold text-blue-600">
                          {(() => {
                            if (!section?.id) {
                              return '0%';
                            }
                            const sectionId = section.id;
                            return maxScores[sectionId] && maxScores[sectionId] > 0
                              ? `${Math.round(((scores[sectionId] ?? 0) / maxScores[sectionId]) * 100)}%`
                              : '0%';
                          })()}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}

                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{getTotalScore()}</div>
                      <div className="text-sm text-blue-700">Total Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{getTotalMaxScore()}</div>
                      <div className="text-sm text-blue-700">Max Score</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">
                        {Math.round((getTotalScore() / getTotalMaxScore()) * 100)}%
                      </div>
                      <div className="text-sm text-blue-700">Overall Accuracy</div>
                    </div>
                    <div>
                      <div className="text-2xl font-bold text-blue-900">{getTotalErrors()}</div>
                      <div className="text-sm text-blue-700">Errors to Analyze</div>
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                    Back
                  </Button>
                  <Button onClick={() => setStep(3)} className="w-full">
                    Analyze Errors
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 3 && (
            <Card>
              <CardHeader className="text-center">
                <Clock className="h-12 w-12 text-orange-600 mx-auto mb-4" />
                <CardTitle>Error Analysis</CardTitle>
                <CardDescription>Categorize your {getTotalErrors()} errors for strategic improvement</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="bg-yellow-50 border border-yellow-200 p-4 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <AlertTriangle className="h-5 w-5 text-yellow-600" />
                    <h4 className="font-semibold text-yellow-800">Error Categories</h4>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-sm text-yellow-700">
                    <div>
                      <strong>Concept Gaps:</strong> You didn't know the concept/formula
                    </div>
                    <div>
                      <strong>Careless Errors:</strong> You knew the answer but made a mistake
                    </div>
                    <div>
                      <strong>Lucky Guesses:</strong> You got it right but weren't sure
                    </div>
                    <div>
                      <strong>Time Pressure:</strong> You could have solved with more time
                    </div>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium text-red-700">Concept Gaps</label>
                    <Input
                      type="number"
                      min="0"
                      max={getTotalErrors()}
                      value={conceptGaps}
                      onChange={e => setConceptGaps(Number(e.target.value))}
                      className="border-red-200 focus:border-red-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-orange-700">Careless Errors</label>
                    <Input
                      type="number"
                      min="0"
                      max={getTotalErrors()}
                      value={carelessErrors}
                      onChange={e => setCarelessErrors(Number(e.target.value))}
                      className="border-orange-200 focus:border-orange-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-blue-700">Lucky Guesses</label>
                    <Input
                      type="number"
                      min="0"
                      max={getTotalErrors()}
                      value={intelligentGuesses}
                      onChange={e => setIntelligentGuesses(Number(e.target.value))}
                      className="border-blue-200 focus:border-blue-400"
                    />
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium text-purple-700">Time Pressure</label>
                    <Input
                      type="number"
                      min="0"
                      max={getTotalErrors()}
                      value={timePressures}
                      onChange={e => setTimePressures(Number(e.target.value))}
                      className="border-purple-200 focus:border-purple-400"
                    />
                  </div>
                </div>

                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-medium">Analysis Progress:</span>
                    <span className="text-sm">
                      {conceptGaps + carelessErrors + intelligentGuesses + timePressures} / {getTotalErrors()} errors
                      analyzed
                    </span>
                  </div>
                  <div className="mt-2 w-full bg-gray-200 rounded-full h-2">
                    <div
                      className={`h-2 rounded-full transition-all ${
                        validateErrorAnalysis() ? 'bg-green-500' : 'bg-blue-500'
                      }`}
                      style={{
                        width: `${Math.min(100, ((conceptGaps + carelessErrors + intelligentGuesses + timePressures) / getTotalErrors()) * 100)}%`,
                      }}
                    />
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="w-full">
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} className="w-full" disabled={!validateErrorAnalysis()}>
                    Add Context & Reflection
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader className="text-center">
                <MessageSquare className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Test Context & Reflection</CardTitle>
                <CardDescription>Capture the complete picture of your test experience</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Mental State */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Mental State During Test</h4>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="confidence-select" className="text-sm font-medium">
                        Confidence (1-5)
                      </label>
                      <Select
                        value={confidence.toString()}
                        onValueChange={value => setConfidence(Number(value) as 1 | 2 | 3 | 4 | 5)}
                      >
                        <SelectTrigger id="confidence-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Very Low</SelectItem>
                          <SelectItem value="2">2 - Low</SelectItem>
                          <SelectItem value="3">3 - Moderate</SelectItem>
                          <SelectItem value="4">4 - High</SelectItem>
                          <SelectItem value="5">5 - Very High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="anxiety-select" className="text-sm font-medium">
                        Anxiety (1-5)
                      </label>
                      <Select
                        value={anxiety.toString()}
                        onValueChange={value => setAnxiety(Number(value) as 1 | 2 | 3 | 4 | 5)}
                      >
                        <SelectTrigger id="anxiety-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Very Low</SelectItem>
                          <SelectItem value="2">2 - Low</SelectItem>
                          <SelectItem value="3">3 - Moderate</SelectItem>
                          <SelectItem value="4">4 - High</SelectItem>
                          <SelectItem value="5">5 - Very High</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="focus-select" className="text-sm font-medium">
                        Focus (1-5)
                      </label>
                      <Select
                        value={focus.toString()}
                        onValueChange={value => setFocus(Number(value) as 1 | 2 | 3 | 4 | 5)}
                      >
                        <SelectTrigger id="focus-select">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1">1 - Very Poor</SelectItem>
                          <SelectItem value="2">2 - Poor</SelectItem>
                          <SelectItem value="3">3 - Average</SelectItem>
                          <SelectItem value="4">4 - Good</SelectItem>
                          <SelectItem value="5">5 - Excellent</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Environment */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Test Environment</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <label htmlFor="test-location" className="text-sm font-medium">
                        Location
                      </label>
                      <Input
                        id="test-location"
                        placeholder="e.g., Home, Library, Test Center"
                        value={location}
                        onChange={e => setLocation(e.target.value)}
                      />
                    </div>

                    <div className="space-y-2">
                      <label htmlFor="time-of-day" className="text-sm font-medium">
                        Time of Day
                      </label>
                      <Select
                        value={timeOfDay}
                        onValueChange={value => setTimeOfDay(value as 'morning' | 'afternoon' | 'evening' | 'night')}
                      >
                        <SelectTrigger id="time-of-day">
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="morning">Morning (6 AM - 12 PM)</SelectItem>
                          <SelectItem value="afternoon">Afternoon (12 PM - 6 PM)</SelectItem>
                          <SelectItem value="evening">Evening (6 PM - 10 PM)</SelectItem>
                          <SelectItem value="night">Night (10 PM - 6 AM)</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="distractions-list" className="text-sm font-medium">
                        Distractions
                      </label>
                      <Button type="button" variant="outline" size="sm" onClick={addDistraction}>
                        Add Distraction
                      </Button>
                    </div>
                    <div id="distractions-list" className="space-y-2">
                      {distractions.map((distraction, index) => (
                        <Badge key={index} variant="outline" className="mr-2">
                          {distraction}
                        </Badge>
                      ))}
                      {distractions.length === 0 && (
                        <p className="text-sm text-muted-foreground">No distractions logged</p>
                      )}
                    </div>
                  </div>
                </div>

                {/* Reflection */}
                <div className="space-y-4">
                  <h4 className="font-semibold">Reflection & Action Plan</h4>

                  <div className="space-y-2">
                    <label htmlFor="overall-feedback" className="text-sm font-medium">
                      Overall Feedback
                    </label>
                    <Textarea
                      id="overall-feedback"
                      value={feedback}
                      onChange={e => setFeedback(e.target.value)}
                      placeholder="How did you feel during the test? What went well? What was challenging?"
                      rows={4}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="action-items-list" className="text-sm font-medium">
                        Action Items
                      </label>
                      <Button type="button" variant="outline" size="sm" onClick={addActionItem}>
                        Add Action Item
                      </Button>
                    </div>
                    <div id="action-items-list" className="space-y-2">
                      {actionItems.map((action, index) => (
                        <div key={index} className="p-3 bg-blue-50 rounded border-l-4 border-blue-200">
                          <p className="text-sm">{action}</p>
                        </div>
                      ))}
                      {actionItems.length === 0 && <p className="text-sm text-muted-foreground">No action items yet</p>}
                    </div>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="w-full">
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={saving} className="w-full">
                    {saving ? (
                      <div className="flex items-center space-x-2">
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                        <span>Saving Analysis...</span>
                      </div>
                    ) : (
                      'Save Test Analysis'
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </AuthGuard>
  );
}
