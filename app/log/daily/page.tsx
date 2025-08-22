'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { saveDailyLog, getSyllabus, getDailyLog } from '@/lib/firebase-utils';
import AuthGuard from '@/components/AuthGuard';
import Navigation from '@/components/Navigation';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { Zap, Moon, Star, Plus, X, Save, Calendar } from 'lucide-react';
import { DailyLog, SyllabusSubject, StudySession } from '@/types/exam';
import { Timestamp } from 'firebase/firestore';
import { format } from 'date-fns';

export default function DailyLogPage() {
  const { user } = useAuth();
  const router = useRouter();
  
  // Health metrics
  const [energyLevel, setEnergyLevel] = useState([7]);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState([7]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [physicalActivity, setPhysicalActivity] = useState(30);
  
  // Study sessions
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [availableTopics, setAvailableTopics] = useState<{ id: string; name: string; subject: string }[]>([]);
  
  // Goals and reflection
  const [targetMinutes, setTargetMinutes] = useState(480);
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [productivity, setProductivity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState('');
  const [challenges, setChallenges] = useState<string[]>([]);
  const [wins, setWins] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) return;
      
      setLoading(true);
      try {
        // Fetch topics
        const syllabus = await getSyllabus(user.uid);
        const topics = syllabus.flatMap(subject =>
          subject.topics.map(topic => ({
            id: topic.id,
            name: topic.name,
            subject: subject.name
          }))
        );
        setAvailableTopics(topics);

        // Check if today's log already exists
        const today = format(new Date(), 'yyyy-MM-dd');
        const existingLog = await getDailyLog(user.uid, today);
        
        if (existingLog) {
          // Pre-populate form with existing data
          setEnergyLevel([existingLog.health.energy]);
          setSleepHours(existingLog.health.sleepHours);
          setSleepQuality([existingLog.health.sleepQuality]);
          setStressLevel([existingLog.health.stressLevel]);
          setPhysicalActivity(existingLog.health.physicalActivity);
          setStudySessions(existingLog.studiedTopics);
          setTargetMinutes(existingLog.goals.targetMinutes);
          setMood(existingLog.mood);
          setProductivity(existingLog.productivity);
          setNote(existingLog.note);
          setChallenges(existingLog.challenges);
          setWins(existingLog.wins);
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [user]);

  const addStudySession = () => {
    setStudySessions(prev => [...prev, {
      topicId: '',
      subjectId: '',
      minutes: 60,
      method: 'reading',
      effectiveness: 3,
      distractions: 0
    }]);
  };

  const updateStudySession = (index: number, updates: Partial<StudySession>) => {
    setStudySessions(prev => prev.map((session, i) => 
      i === index ? { ...session, ...updates } : session
    ));
  };

  const removeStudySession = (index: number) => {
    setStudySessions(prev => prev.filter((_, i) => i !== index));
  };

  const addChallenge = () => {
    const challenge = prompt('What made studying difficult today?');
    if (challenge) {
      setChallenges(prev => [...prev, challenge]);
    }
  };

  const addWin = () => {
    const win = prompt('What went well today?');
    if (win) {
      setWins(prev => [...prev, win]);
    }
  };

  const getTotalStudyMinutes = () => {
    return studySessions.reduce((sum, session) => sum + session.minutes, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    setSaving(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const logData: DailyLog = {
        id: today,
        date: Timestamp.now(),
        health: {
          energy: energyLevel[0],
          sleepHours,
          sleepQuality: sleepQuality[0],
          stressLevel: stressLevel[0],
          physicalActivity,
          screenTime: 0
        },
        studiedTopics: studySessions.filter(session => session.topicId && session.minutes > 0),
        goals: {
          targetMinutes,
          actualMinutes: getTotalStudyMinutes(),
          completed: getTotalStudyMinutes() >= targetMinutes
        },
        mood,
        productivity,
        note,
        challenges,
        wins
      };

      await saveDailyLog(user.uid, logData);
      router.push('/dashboard');
    } catch (error) {
      console.error('Error saving daily log:', error);
    } finally {
      setSaving(false);
    }
  };

  if (loading) {
    return (
      <AuthGuard>
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50 dark:from-gray-900 dark:via-blue-900 dark:to-indigo-900">
          <Navigation />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse"></div>
                <div className="relative glass rounded-2xl p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
                  <p className="text-muted-foreground">Preparing your daily log...</p>
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
        
        <div className="max-w-4xl mx-auto p-4 sm:p-6 space-y-8">
          {/* Header */}
          <div className="text-center space-y-4">
            <div className="inline-block">
              <Badge variant="secondary" className="px-4 py-2 text-sm animate-float">
                📅 Daily Progress Tracking
              </Badge>
            </div>
            <div className="flex items-center justify-center space-x-3">
              <Calendar className="h-8 w-8 text-primary animate-glow" />
              <h1 className="text-3xl sm:text-4xl font-bold text-gradient">Daily Progress Log</h1>
            </div>
            <p className="text-muted-foreground text-lg">
              Track your journey for <span className="font-semibold">{format(new Date(), 'PPPP')}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Health Metrics */}
            <Card className="glass border-0 hover:scale-[1.02] transition-all duration-300">
              <CardHeader>
                <CardTitle className="flex items-center space-x-3">
                  <div className="p-2 rounded-full bg-yellow-100 dark:bg-yellow-900/20">
                    <Zap className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span>Health & Wellness Metrics</span>
                </CardTitle>
                <CardDescription>
                  Your physical and mental state directly impacts study performance
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium">Energy Level</label>
                    <span className="text-sm text-muted-foreground">{energyLevel[0]}/10</span>
                  </div>
                  <Slider
                    value={energyLevel}
                    onValueChange={setEnergyLevel}
                    max={10}
                    min={1}
                    step={1}
                    className="w-full"
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Moon className="h-4 w-4 text-blue-500" />
                      <label className="text-sm font-medium">Sleep Hours</label>
                    </div>
                    <Input
                      type="number"
                      min="0"
                      max="12"
                      step="0.5"
                      value={sleepHours}
                      onChange={(e) => setSleepHours(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Physical Activity (min)</label>
                    <Input
                      type="number"
                      min="0"
                      max="300"
                      value={physicalActivity}
                      onChange={(e) => setPhysicalActivity(Number(e.target.value))}
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Star className="h-4 w-4 text-yellow-500" />
                        <label className="text-sm font-medium">Sleep Quality</label>
                      </div>
                      <span className="text-sm text-muted-foreground">{sleepQuality[0]}/10</span>
                    </div>
                    <Slider
                      value={sleepQuality}
                      onValueChange={setSleepQuality}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                  
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <label className="text-sm font-medium">Stress Level</label>
                      <span className="text-sm text-muted-foreground">{stressLevel[0]}/10</span>
                    </div>
                    <Slider
                      value={stressLevel}
                      onValueChange={setStressLevel}
                      max={10}
                      min={1}
                      step={1}
                      className="w-full"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Study Sessions */}
            <Card>
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Study Sessions</CardTitle>
                    <CardDescription>Log all your study activities for today</CardDescription>
                  </div>
                  <Button type="button" variant="outline" onClick={addStudySession}>
                    <Plus className="h-4 w-4 mr-2" />
                    Add Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {studySessions.map((session, index) => (
                  <div key={index} className="p-4 border rounded-lg space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="font-medium">Session {index + 1}</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => removeStudySession(index)}
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Topic</label>
                        <Select
                          value={session.topicId}
                          onValueChange={(value) => {
                            const topic = availableTopics.find(t => t.id === value);
                            updateStudySession(index, {
                              topicId: value,
                              subjectId: topic?.subject || ''
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTopics.map(topic => (
                              <SelectItem key={topic.id} value={topic.id}>
                                <div className="flex items-center space-x-2">
                                  <span>{topic.name}</span>
                                  <Badge variant="outline" className="text-xs">
                                    {topic.subject}
                                  </Badge>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Minutes</label>
                        <Input
                          type="number"
                          min="5"
                          max="480"
                          value={session.minutes}
                          onChange={(e) => updateStudySession(index, { minutes: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Method</label>
                        <Select
                          value={session.method}
                          onValueChange={(value: any) => updateStudySession(index, { method: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reading">Reading</SelectItem>
                            <SelectItem value="notes">Note Taking</SelectItem>
                            <SelectItem value="practice">Practice Questions</SelectItem>
                            <SelectItem value="revision">Revision</SelectItem>
                            <SelectItem value="mock_test">Mock Test</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Effectiveness (1-5)</label>
                        <Input
                          type="number"
                          min="1"
                          max="5"
                          value={session.effectiveness}
                          onChange={(e) => updateStudySession(index, { effectiveness: Number(e.target.value) as 1 | 2 | 3 | 4 | 5 })}
                        />
                      </div>
                      
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Distractions</label>
                        <Input
                          type="number"
                          min="0"
                          max="50"
                          value={session.distractions}
                          onChange={(e) => updateStudySession(index, { distractions: Number(e.target.value) })}
                        />
                      </div>
                    </div>
                  </div>
                ))}
                
                {studySessions.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground">
                    <p>No study sessions logged yet.</p>
                    <p className="text-sm">Click "Add Session" to start tracking your study time.</p>
                  </div>
                )}
                
                {studySessions.length > 0 && (
                  <div className="bg-blue-50 p-4 rounded-lg">
                    <div className="flex items-center justify-between">
                      <p className="text-sm text-blue-800">
                        Total study time: <strong>{Math.floor(getTotalStudyMinutes() / 60)}h {getTotalStudyMinutes() % 60}m</strong>
                      </p>
                      <Badge 
                        className={getTotalStudyMinutes() >= targetMinutes ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'}
                      >
                        {getTotalStudyMinutes() >= targetMinutes ? 'Goal Achieved!' : `${targetMinutes - getTotalStudyMinutes()}m to goal`}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Goals and Reflection */}
            <Card>
              <CardHeader>
                <CardTitle>Goals & Reflection</CardTitle>
                <CardDescription>Set goals and reflect on your day</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Daily Goal (minutes)</label>
                    <Input
                      type="number"
                      min="60"
                      max="720"
                      value={targetMinutes}
                      onChange={(e) => setTargetMinutes(Number(e.target.value))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Mood (1-5)</label>
                    <Select
                      value={mood.toString()}
                      onValueChange={(value) => setMood(Number(value) as 1 | 2 | 3 | 4 | 5)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Very Bad</SelectItem>
                        <SelectItem value="2">2 - Bad</SelectItem>
                        <SelectItem value="3">3 - Neutral</SelectItem>
                        <SelectItem value="4">4 - Good</SelectItem>
                        <SelectItem value="5">5 - Excellent</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Productivity (1-5)</label>
                    <Select
                      value={productivity.toString()}
                      onValueChange={(value) => setProductivity(Number(value) as 1 | 2 | 3 | 4 | 5)}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="1">1 - Very Low</SelectItem>
                        <SelectItem value="2">2 - Low</SelectItem>
                        <SelectItem value="3">3 - Average</SelectItem>
                        <SelectItem value="4">4 - High</SelectItem>
                        <SelectItem value="5">5 - Very High</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Challenges</label>
                      <Button type="button" variant="outline" size="sm" onClick={addChallenge}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2 min-h-[100px] max-h-[200px] overflow-y-auto">
                      {challenges.map((challenge, index) => (
                        <div key={index} className="text-sm p-3 bg-red-50 rounded border-l-4 border-red-200">
                          {challenge}
                        </div>
                      ))}
                      {challenges.length === 0 && (
                        <div className="text-sm text-muted-foreground p-3 border-2 border-dashed rounded">
                          No challenges logged yet
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label className="text-sm font-medium">Wins</label>
                      <Button type="button" variant="outline" size="sm" onClick={addWin}>
                        <Plus className="h-3 w-3 mr-1" />
                        Add
                      </Button>
                    </div>
                    <div className="space-y-2 min-h-[100px] max-h-[200px] overflow-y-auto">
                      {wins.map((win, index) => (
                        <div key={index} className="text-sm p-3 bg-green-50 rounded border-l-4 border-green-200">
                          {win}
                        </div>
                      ))}
                      {wins.length === 0 && (
                        <div className="text-sm text-muted-foreground p-3 border-2 border-dashed rounded">
                          No wins logged yet
                        </div>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Additional Notes</label>
                  <Textarea
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Any additional thoughts about today's study session..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Button */}
            <div className="flex space-x-4">
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => router.push('/dashboard')}
                className="w-full"
              >
                Cancel
              </Button>
              <Button 
                type="submit" 
                disabled={saving}
                className="w-full"
              >
                {saving ? (
                  <div className="flex items-center space-x-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center space-x-2">
                    <Save className="h-4 w-4" />
                    <span>Save Daily Log</span>
                  </div>
                )}
              </Button>
            </div>
          </form>
        </div>
      </div>
    </AuthGuard>
  );
}