'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { collection, addDoc, Timestamp } from 'firebase/firestore';
import { db } from '@/lib/firebase';
import { useRouter } from 'next/navigation';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Target, BarChart3, Clock, MessageSquare } from 'lucide-react';

export default function TestLoggerPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);

  // Test details
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [platform, setPlatform] = useState('');
  const [type, setType] = useState('');
  
  // Scores
  const [quantScore, setQuantScore] = useState(0);
  const [reasoningScore, setReasoningScore] = useState(0);
  const [englishScore, setEnglishScore] = useState(0);
  const [pkScore, setPkScore] = useState(0);
  
  // Time taken (in minutes)
  const [quantTime, setQuantTime] = useState(0);
  const [reasoningTime, setReasoningTime] = useState(0);
  const [englishTime, setEnglishTime] = useState(0);
  const [pkTime, setPkTime] = useState(0);
  
  // Error analysis
  const [quantConcepts, setQuantConcepts] = useState(0);
  const [quantCareless, setQuantCareless] = useState(0);
  const [quantGuesses, setQuantGuesses] = useState(0);
  const [quantTime, setQuantTimePressure] = useState(0);
  
  const [reasoningConcepts, setReasoningConcepts] = useState(0);
  const [reasoningCareless, setReasoningCareless] = useState(0);
  const [reasoningGuesses, setReasoningGuesses] = useState(0);
  const [reasoningTimePressure, setReasoningTimePressure] = useState(0);
  
  const [englishConcepts, setEnglishConcepts] = useState(0);
  const [englishCareless, setEnglishCareless] = useState(0);
  const [englishGuesses, setEnglishGuesses] = useState(0);
  const [englishTimePressure, setEnglishTimePressure] = useState(0);
  
  const [pkConcepts, setPkConcepts] = useState(0);
  const [pkCareless, setPkCareless] = useState(0);
  const [pkGuesses, setPkGuesses] = useState(0);
  const [pkTimePressure, setPkTimePressure] = useState(0);
  
  const [feedback, setFeedback] = useState('');

  const getTotalScore = () => quantScore + reasoningScore + englishScore + pkScore;
  const getTotalErrors = (section: 'quant' | 'reasoning' | 'english' | 'pk') => {
    const maxScore = 50;
    const actualScore = section === 'quant' ? quantScore : 
                      section === 'reasoning' ? reasoningScore :
                      section === 'english' ? englishScore : pkScore;
    return maxScore - actualScore;
  };

  const validateErrorAnalysis = () => {
    const sections = [
      { name: 'Quant', errors: getTotalErrors('quant'), analysis: quantConcepts + quantCareless + quantGuesses + quantTime },
      { name: 'Reasoning', errors: getTotalErrors('reasoning'), analysis: reasoningConcepts + reasoningCareless + reasoningGuesses + reasoningTimePressure },
      { name: 'English', errors: getTotalErrors('english'), analysis: englishConcepts + englishCareless + englishGuesses + englishTimePressure },
      { name: 'PK', errors: getTotalErrors('pk'), analysis: pkConcepts + pkCareless + pkGuesses + pkTimePressure },
    ];

    for (const section of sections) {
      if (section.analysis !== section.errors) {
        return `${section.name}: Error analysis (${section.analysis}) doesn't match total errors (${section.errors})`;
      }
    }
    return null;
  };

  const handleSubmit = async () => {
    if (!user) return;

    const validationError = validateErrorAnalysis();
    if (validationError) {
      alert(validationError);
      return;
    }

    setLoading(true);
    try {
      const testData = {
        date: Timestamp.fromDate(new Date(date)),
        platform,
        type,
        scores: {
          quant: quantScore,
          reasoning: reasoningScore,
          english: englishScore,
          pk: pkScore,
          total: getTotalScore(),
        },
        timeTaken: {
          quant: quantTime,
          reasoning: reasoningTime,
          english: englishTime,
          pk: pkTime,
        },
        analysis: {
          conceptGaps: quantConcepts + reasoningConcepts + englishConcepts + pkConcepts,
          carelessErrors: quantCareless + reasoningCareless + englishCareless + pkCareless,
          intelligentGuesses: quantGuesses + reasoningGuesses + englishGuesses + pkGuesses,
          timePressures: quantTime + reasoningTimePressure + englishTimePressure + pkTimePressure,
        },
        feedback,
      };

      await addDoc(collection(db, 'users', user.uid, 'mockTests'), testData);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving test:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        
        <div className="max-w-4xl mx-auto p-6 space-y-6">
          <div className="text-center space-y-2">
            <h1 className="text-4xl font-bold text-gray-900">Test Logger</h1>
            <p className="text-muted-foreground">Log your mock test performance and analyze weaknesses</p>
          </div>

          {step === 1 && (
            <Card>
              <CardHeader className="text-center">
                <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
                <CardTitle>Test Details</CardTitle>
                <CardDescription>Basic information about your mock test</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Test Date</label>
                    <Input
                      type="date"
                      value={date}
                      onChange={(e) => setDate(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Platform</label>
                    <Select value={platform} onValueChange={setPlatform}>
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
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Test Type</label>
                  <Select value={type} onValueChange={setType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select test type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="full_prelims">Full Prelims (200 questions)</SelectItem>
                      <SelectItem value="sectional">Sectional Test</SelectItem>
                      <SelectItem value="pk_only">Professional Knowledge Only</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <Button 
                  onClick={() => setStep(2)} 
                  className="w-full"
                  disabled={!platform || !type}
                >
                  Continue to Scores
                </Button>
              </CardContent>
            </Card>
          )}

          {step === 2 && (
            <Card>
              <CardHeader className="text-center">
                <BarChart3 className="h-12 w-12 text-green-600 mx-auto mb-4" />
                <CardTitle>Test Scores & Timing</CardTitle>
                <CardDescription>Enter your scores (out of 50 each) and time taken</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { label: 'Quantitative Aptitude', score: quantScore, setScore: setQuantScore, time: quantTime, setTime: setQuantTime },
                  { label: 'Reasoning', score: reasoningScore, setScore: setReasoningScore, time: reasoningTime, setTime: setReasoningTime },
                  { label: 'English', score: englishScore, setScore: setEnglishScore, time: englishTime, setTime: setEnglishTime },
                  { label: 'Professional Knowledge', score: pkScore, setScore: setPkScore, time: pkTime, setTime: setPkTime },
                ].map((section, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <h4 className="font-semibold mb-3">{section.label}</h4>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Score (out of 50)</label>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          value={section.score}
                          onChange={(e) => section.setScore(Number(e.target.value))}
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Time Taken (minutes)</label>
                        <Input
                          type="number"
                          min="0"
                          value={section.time}
                          onChange={(e) => section.setTime(Number(e.target.value))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900">Total Score: {getTotalScore()}/200</h4>
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
                <CardDescription>
                  Categorize your errors to identify improvement areas
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {[
                  { 
                    label: 'Quantitative Aptitude', 
                    totalErrors: getTotalErrors('quant'),
                    concepts: quantConcepts, setConcepts: setQuantConcepts,
                    careless: quantCareless, setCareless: setQuantCareless,
                    guesses: quantGuesses, setGuesses: setQuantGuesses,
                    timePressure: quantTime, setTimePressure: setQuantTimePressure
                  },
                  { 
                    label: 'Reasoning', 
                    totalErrors: getTotalErrors('reasoning'),
                    concepts: reasoningConcepts, setConcepts: setReasoningConcepts,
                    careless: reasoningCareless, setCareless: setReasoningCareless,
                    guesses: reasoningGuesses, setGuesses: setReasoningGuesses,
                    timePressure: reasoningTimePressure, setTimePressure: setReasoningTimePressure
                  },
                  { 
                    label: 'English', 
                    totalErrors: getTotalErrors('english'),
                    concepts: englishConcepts, setConcepts: setEnglishConcepts,
                    careless: englishCareless, setCareless: setEnglishCareless,
                    guesses: englishGuesses, setGuesses: setEnglishGuesses,
                    timePressure: englishTimePressure, setTimePressure: setEnglishTimePressure
                  },
                  { 
                    label: 'Professional Knowledge', 
                    totalErrors: getTotalErrors('pk'),
                    concepts: pkConcepts, setConcepts: setPkConcepts,
                    careless: pkCareless, setCareless: setPkCareless,
                    guesses: pkGuesses, setGuesses: setPkGuesses,
                    timePressure: pkTimePressure, setTimePressure: setPkTimePressure
                  },
                ].map((section, index) => (
                  <div key={index} className="bg-gray-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="font-semibold">{section.label}</h4>
                      <span className="text-sm text-red-600 font-medium">
                        {section.totalErrors} errors to analyze
                      </span>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-red-700">Concept Gaps</label>
                        <Input
                          type="number"
                          min="0"
                          max={section.totalErrors}
                          value={section.concepts}
                          onChange={(e) => section.setConcepts(Number(e.target.value))}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-orange-700">Careless Errors</label>
                        <Input
                          type="number"
                          min="0"
                          max={section.totalErrors}
                          value={section.careless}
                          onChange={(e) => section.setCareless(Number(e.target.value))}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-blue-700">Lucky Guesses</label>
                        <Input
                          type="number"
                          min="0"
                          max={section.totalErrors}
                          value={section.guesses}
                          onChange={(e) => section.setGuesses(Number(e.target.value))}
                          className="text-sm"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-xs font-medium text-purple-700">Time Pressure</label>
                        <Input
                          type="number"
                          min="0"
                          max={section.totalErrors}
                          value={section.timePressure}
                          onChange={(e) => section.setTimePressure(Number(e.target.value))}
                          className="text-sm"
                        />
                      </div>
                    </div>
                    <div className="mt-2 text-xs text-gray-600">
                      Analyzed: {section.concepts + section.careless + section.guesses + section.timePressure}/{section.totalErrors}
                    </div>
                  </div>
                ))}

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setStep(2)} className="w-full">
                    Back
                  </Button>
                  <Button onClick={() => setStep(4)} className="w-full">
                    Add Feedback
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {step === 4 && (
            <Card>
              <CardHeader className="text-center">
                <MessageSquare className="h-12 w-12 text-purple-600 mx-auto mb-4" />
                <CardTitle>Test Feedback</CardTitle>
                <CardDescription>
                  How did you feel during the test? Any observations?
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <Textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="Mental state, concentration level, test environment, specific difficulties faced..."
                  rows={6}
                />

                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-semibold text-blue-900 mb-2">Test Summary</h4>
                  <div className="space-y-1 text-sm text-blue-800">
                    <p>Total Score: {getTotalScore()}/200</p>
                    <p>Total Concept Gaps: {quantConcepts + reasoningConcepts + englishConcepts + pkConcepts}</p>
                    <p>Total Careless Errors: {quantCareless + reasoningCareless + englishCareless + pkCareless}</p>
                  </div>
                </div>

                <div className="flex space-x-2">
                  <Button variant="outline" onClick={() => setStep(3)} className="w-full">
                    Back
                  </Button>
                  <Button onClick={handleSubmit} disabled={loading} className="w-full">
                    {loading ? 'Saving Test...' : 'Save Test & Analysis'}
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