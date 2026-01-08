'use client';

import { format } from 'date-fns';
import { Timestamp } from 'firebase/firestore';
import { 
  Zap, Moon, Star, Plus, Minus, X, Save, Calendar, 
  BookOpen, PenTool, Brain, RotateCcw, MonitorPlay, AlertCircle, Target,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';

import AuthGuard from '@/components/AuthGuard';
import BottomNav from '@/components/BottomNav';
import Navigation from '@/components/Navigation';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
import { saveDailyLog, getSyllabus, getDailyLog } from '@/lib/firebase/firebase-utils';
import { DailyLog, StudySession } from '@/types/exam';
import { cn } from '@/lib/utils/utils';

// Helper component for visual mood/productivity selector
const VisualSelector = ({ 
  value, 
  onChange, 
  options, 
  label,
  colorClass = "border-primary text-primary" 
}: any) => (
  <div className="space-y-3">
    <label className="text-sm font-medium">{label}</label>
    <div className="grid grid-cols-5 gap-2 sm:gap-3">
      {options.map((option: any) => (
        <button
          key={option.value}
          type="button"
          onClick={() => onChange(option.value)}
          className={cn(
            "flex flex-col items-center justify-center p-2 sm:p-3 rounded-xl border-2 transition-all duration-200 gap-1.5 sm:gap-2",
            value === option.value
              ? cn("bg-primary/5 shadow-md scale-105", colorClass)
              : "bg-background border-transparent hover:bg-muted hover:scale-105 text-muted-foreground"
          )}
        >
          <span className="text-2xl sm:text-3xl filter drop-shadow-sm" role="img" aria-label={option.label}>
            {option.icon}
          </span>
          <span className={cn(
            "text-[10px] sm:text-xs font-semibold truncate w-full text-center transition-colors",
             value === option.value ? "opacity-100" : "opacity-70"
          )}>
            {option.label}
          </span>
        </button>
      ))}
    </div>
  </div>
);



// Helper component for Star Rating
const StarRating = ({ value, onChange, max = 5 }: any) => (
  <div className="flex gap-1">
    {Array.from({ length: max }).map((_, i) => (
      <button
        key={i}
        type="button"
        onClick={() => onChange(i + 1)}
        className="focus:outline-none transition-transform hover:scale-110 active:scale-95"
      >
        <Star
          className={cn(
            "h-6 w-6 transition-colors",
            i < value ? "fill-yellow-400 text-yellow-400" : "fill-muted/20 text-muted-foreground/30"
          )}
        />
      </button>
    ))}
  </div>
);

// Helper component for Method Pill Selector
const MethodSelector = ({ value, onChange }: any) => {
  const methods = [
    { id: 'reading', label: 'Reading', icon: BookOpen },
    { id: 'notes', label: 'Notes', icon: PenTool },
    { id: 'practice', label: 'Practice', icon: Brain },
    { id: 'revision', label: 'Revision', icon: RotateCcw },
    { id: 'mock_test', label: 'Mock Test', icon: MonitorPlay },
  ];

  return (
    <div className="flex flex-wrap gap-2">
      {methods.map((method) => {
        const Icon = method.icon;
        const isSelected = value === method.id;
        return (
          <button
            key={method.id}
            type="button"
            onClick={() => onChange(method.id)}
            className={cn(
              "flex items-center gap-1.5 px-3 py-1.5 rounded-full text-sm font-medium border transition-all",
              isSelected 
                ? "bg-primary text-primary-foreground border-primary shadow-sm" 
                : "bg-background text-muted-foreground border-border hover:border-primary/50 hover:bg-muted"
            )}
          >
            <Icon className="h-3.5 w-3.5" />
            {method.label}
          </button>
        );
      })}
    </div>
  );
};

// Helper component for Number Stepper
const StepperInput = ({ value, onChange, min, max, step = 1, suffix = '' }: any) => (
  <div className="flex items-center border rounded-lg bg-background p-1 w-full sm:w-fit">
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-md hover:bg-muted"
      onClick={() => onChange(Math.max(min, value - step))}
      disabled={value <= min}
    >
      <Minus className="h-4 w-4" />
    </Button>
    <div className="flex-1 min-w-[3rem] text-center font-mono font-medium text-sm">
      {value}{suffix}
    </div>
    <Button
      type="button"
      variant="ghost"
      size="icon"
      className="h-8 w-8 rounded-md hover:bg-muted"
      onClick={() => onChange(Math.min(max, value + step))}
      disabled={value >= max}
    >
      <Plus className="h-4 w-4" />
    </Button>
  </div>
);

export default function DailyLogPage() {
  const { user } = useAuth();
  const router = useRouter();

  // Health metrics
  const [energyLevel, setEnergyLevel] = useState(7);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState(7);
  const [stressLevel, setStressLevel] = useState(5);
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

  // Dialog state for challenges and wins
  const [challengeDialogOpen, setChallengeDialogOpen] = useState(false);
  const [winDialogOpen, setWinDialogOpen] = useState(false);
  const [newChallenge, setNewChallenge] = useState('');
  const [newWin, setNewWin] = useState('');

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      if (!user) {
        return;
      }

      setLoading(true);
      try {
        // Fetch topics
        const syllabus = await getSyllabus(user.uid);
        const topics = syllabus.flatMap(subject =>
          subject.topics.map(topic => ({
            id: topic.id,
            name: topic.name,
            subject: subject.name,
          }))
        );
        setAvailableTopics(topics);

        // Check if today's log already exists
        const today = format(new Date(), 'yyyy-MM-dd');
        const existingLog = await getDailyLog(user.uid, today);

        if (existingLog) {
          // Pre-populate form with existing data
          setEnergyLevel(existingLog.health.energy);
          setSleepHours(existingLog.health.sleepHours);
          setSleepQuality(existingLog.health.sleepQuality);
          setStressLevel(existingLog.health.stressLevel);
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
    setStudySessions(prev => [
      ...prev,
      {
        topicId: '',
        subjectId: '',
        minutes: 60,
        method: 'reading',
        effectiveness: 3,
        distractions: 0,
      },
    ]);
  };

  const updateStudySession = (index: number, updates: Partial<StudySession>) => {
    setStudySessions(prev => prev.map((session, i) => (i === index ? { ...session, ...updates } : session)));
  };

  const removeStudySession = (index: number) => {
    setStudySessions(prev => prev.filter((_, i) => i !== index));
  };

  const addChallenge = () => {
    if (newChallenge.trim()) {
      setChallenges(prev => [...prev, newChallenge.trim()]);
      setNewChallenge('');
      setChallengeDialogOpen(false);
    }
  };

  const addWin = () => {
    if (newWin.trim()) {
      setWins(prev => [...prev, newWin.trim()]);
      setNewWin('');
      setWinDialogOpen(false);
    }
  };

  const getTotalStudyMinutes = () => {
    return studySessions.reduce((sum, session) => sum + session.minutes, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      return;
    }

    setSaving(true);
    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const logData: DailyLog = {
        id: today,
        date: Timestamp.now(),
        health: {
          energy: energyLevel,
          sleepHours,
          sleepQuality: sleepQuality,
          stressLevel: stressLevel,
          physicalActivity,
          screenTime: 0,
        },
        studiedTopics: studySessions.filter(session => session.topicId && session.minutes > 0),
        goals: {
          targetMinutes,
          actualMinutes: getTotalStudyMinutes(),
          completed: getTotalStudyMinutes() >= targetMinutes,
        },
        mood,
        productivity,
        note,
        challenges,
        wins,
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
          <BottomNav />
          <div className="flex items-center justify-center min-h-[60vh]">
            <div className="text-center space-y-6">
              <div className="relative">
                <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
                <div className="relative glass rounded-2xl p-8">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4" />
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
        <BottomNav />

        <div className="max-w-4xl mx-auto p-4 sm:p-6 pb-28 xl:pb-6 space-y-8">
          {/* Header */}
          <div className="text-center space-y-3 mb-2">
            <Badge variant="secondary" className="px-4 py-1.5 text-sm font-medium">
              📅 Daily Progress Tracking
            </Badge>
            <div className="flex items-center justify-center gap-3">
              <Calendar className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
              <h1 className="text-2xl sm:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-primary to-purple-600 bg-clip-text text-transparent">
                Daily Progress Log
              </h1>
            </div>
            <p className="text-muted-foreground text-sm sm:text-base">
              Track your journey for <span className="font-semibold text-foreground">{format(new Date(), 'EEEE, MMMM d, yyyy')}</span>
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Health Metrics */}
            <Card className="border shadow-sm hover:shadow-md transition-shadow duration-200">
              <CardHeader className="pb-4">
                <CardTitle className="flex items-center gap-3 text-lg sm:text-xl">
                  <div className="p-2 rounded-lg bg-yellow-100 dark:bg-yellow-900/20">
                    <Zap className="h-5 w-5 text-yellow-600" />
                  </div>
                  <span>Health & Wellness</span>
                </CardTitle>
                <CardDescription className="text-sm">Your physical state directly impacts study performance</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">


                {/* Sleep and Activity Grid */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 sm:gap-6">
                  <div className="space-y-2 p-4 rounded-xl bg-blue-50/50 dark:bg-blue-900/10 border border-blue-100 dark:border-blue-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-md bg-blue-100 dark:bg-blue-900/40 text-blue-600 dark:text-blue-400">
                        <Moon className="h-4 w-4" />
                      </div>
                      <label htmlFor="sleep-hours" className="text-sm font-semibold">
                        Sleep Duration
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        id="sleep-hours"
                        type="number"
                        inputMode="decimal"
                        min="0"
                        max="12"
                        step="0.5"
                        value={sleepHours}
                        onChange={e => setSleepHours(Number(e.target.value))}
                        className="h-12 text-lg font-mono font-medium md:max-w-[120px]"
                      />
                      <span className="text-sm text-muted-foreground font-medium">hours</span>
                    </div>
                  </div>

                  <div className="space-y-2 p-4 rounded-xl bg-purple-50/50 dark:bg-purple-900/10 border border-purple-100 dark:border-purple-900/20">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="p-1.5 rounded-md bg-purple-100 dark:bg-purple-900/40 text-purple-600 dark:text-purple-400">
                        <Zap className="h-4 w-4" />
                      </div>
                      <label htmlFor="physical-activity" className="text-sm font-semibold">
                        Physical Activity
                      </label>
                    </div>
                    <div className="flex items-center gap-3">
                      <Input
                        id="physical-activity"
                        type="number"
                        inputMode="numeric"
                        min="0"
                        max="300"
                        step="5"
                        value={physicalActivity}
                        onChange={e => setPhysicalActivity(Number(e.target.value))}
                        className="h-12 text-lg font-mono font-medium md:max-w-[120px]"
                      />
                      <span className="text-sm text-muted-foreground font-medium">minutes</span>
                    </div>
                  </div>
                </div>

                <div className="h-px bg-border/50 my-6" />

                {/* Visual Selectors Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <VisualSelector
                    label="Energy Level"
                    value={energyLevel}
                    onChange={setEnergyLevel}
                    colorClass="border-yellow-500 text-yellow-600 bg-yellow-50/50"
                    options={[
                      { value: 1, label: 'Drained', icon: '🔋' },
                      { value: 3, label: 'Low', icon: '🪫' },
                      { value: 5, label: 'Okay', icon: '😐' },
                      { value: 7, label: 'Good', icon: '⚡' },
                      { value: 9, label: 'Max', icon: '🚀' },
                    ]}
                  />
                  
                  <VisualSelector
                    label="Sleep Quality"
                    value={sleepQuality}
                    onChange={setSleepQuality}
                    colorClass="border-blue-500 text-blue-600 bg-blue-50/50"
                    options={[
                      { value: 1, label: 'Terrible', icon: '😫' },
                      { value: 3, label: 'Poor', icon: '🥱' },
                      { value: 5, label: 'Decent', icon: '😌' },
                      { value: 7, label: 'Good', icon: '😴' },
                      { value: 9, label: 'Great', icon: '🛌' },
                    ]}
                  />

                  <VisualSelector
                    label="Stress Level"
                    value={stressLevel}
                    onChange={setStressLevel}
                    colorClass="border-orange-500 text-orange-600 bg-orange-50/50"
                    options={[
                      { value: 1, label: 'Zen', icon: '🧘' },
                      { value: 3, label: 'Calm', icon: '😌' },
                      { value: 5, label: 'Moderate', icon: '😬' },
                      { value: 7, label: 'High', icon: '😰' },
                      { value: 9, label: 'Extreme', icon: '🤯' },
                    ]}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Study Sessions */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <CardTitle className="text-lg sm:text-xl">Study Sessions</CardTitle>
                    <CardDescription className="text-sm">Log your study activities for today</CardDescription>
                  </div>
                  <Button type="button" variant="outline" onClick={addStudySession} className="w-full sm:w-auto">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Session
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                {studySessions.map((session, index) => (
                  <div key={index} className="p-4 border rounded-xl bg-muted/30 hover:bg-muted/50 transition-colors space-y-4">
                    <div className="flex items-center justify-between">
                      <Badge variant="secondary" className="text-xs font-medium">Session {index + 1}</Badge>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeStudySession(index)} className="h-8 w-8 p-0 text-muted-foreground hover:text-destructive">
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-12 gap-6 items-start">
                      {/* Topic & Time - Spans 5 cols */}
                      <div className="lg:col-span-5 space-y-4">
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-muted-foreground">Topic</label>
                          <Select
                            value={session.topicId}
                            onValueChange={value => {
                              const topic = availableTopics.find(t => t.id === value);
                              updateStudySession(index, {
                                topicId: value,
                                subjectId: topic?.subject ?? '',
                              });
                            }}
                          >
                            <SelectTrigger className="h-10">
                              <SelectValue placeholder="Select topic..." />
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
                        
                        <div className="space-y-1.5">
                          <label className="text-sm font-medium text-muted-foreground">Duration</label>
                          <StepperInput 
                            value={session.minutes} 
                            onChange={(val: number) => updateStudySession(index, { minutes: val })}
                            min={5}
                            max={480}
                            step={5}
                            suffix="m"
                          />
                        </div>
                      </div>

                      {/* Method & Stats - Spans 7 cols */}
                      <div className="lg:col-span-7 space-y-5">
                        <div className="space-y-2">
                          <label className="text-sm font-medium text-muted-foreground">Study Method</label>
                          <MethodSelector 
                            value={session.method} 
                            onChange={(val: string) => updateStudySession(index, { method: val as any })} 
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row gap-6">
                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground">Effectiveness</label>
                            <StarRating 
                              value={session.effectiveness} 
                              onChange={(val: number) => updateStudySession(index, { effectiveness: val as any })} 
                            />
                          </div>

                          <div className="space-y-2">
                            <label className="text-sm font-medium text-muted-foreground flex items-center gap-1.5">
                              Distractions
                              <AlertCircle className="h-3 w-3 text-muted-foreground" />
                            </label>
                            <StepperInput 
                              value={session.distractions} 
                              onChange={(val: number) => updateStudySession(index, { distractions: val })}
                              min={0}
                              max={50}
                            />
                          </div>
                        </div>
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
                        Total study time:{' '}
                        <strong>
                          {Math.floor(getTotalStudyMinutes() / 60)}h {getTotalStudyMinutes() % 60}m
                        </strong>
                      </p>
                      <Badge
                        className={
                          getTotalStudyMinutes() >= targetMinutes
                            ? 'bg-green-100 text-green-800'
                            : 'bg-yellow-100 text-yellow-800'
                        }
                      >
                        {getTotalStudyMinutes() >= targetMinutes
                          ? 'Goal Achieved!'
                          : `${targetMinutes - getTotalStudyMinutes()}m to goal`}
                      </Badge>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Goals and Reflection */}
            <Card className="border shadow-sm">
              <CardHeader className="pb-4">
                <CardTitle className="text-lg sm:text-xl">Goals & Reflection</CardTitle>
                <CardDescription className="text-sm">Set goals and reflect on your day</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                  <div className="space-y-3">
                    <label htmlFor="daily-goal" className="text-sm font-medium flex items-center gap-2">
                      <Target className="h-4 w-4 text-primary" />
                      Study Target
                    </label>
                    <div className="p-4 rounded-xl border bg-muted/20 space-y-3">
                      <Input
                        id="daily-goal"
                        type="number"
                        inputMode="numeric"
                        min="60"
                        max="720"
                        step="30"
                        value={targetMinutes}
                        onChange={e => setTargetMinutes(Number(e.target.value))}
                        className="h-12 text-lg font-mono"
                      />
                      <p className="text-xs text-muted-foreground">Minutes per day goal</p>
                    </div>
                  </div>

                  <VisualSelector
                    label="Today's Mood"
                    value={mood}
                    onChange={setMood}
                    colorClass="border-pink-500 text-pink-600 bg-pink-50/50"
                    options={[
                      { value: 1, label: 'Rough', icon: '😫' },
                      { value: 2, label: 'Low', icon: '😕' },
                      { value: 3, label: 'Okay', icon: '😐' },
                      { value: 4, label: 'Good', icon: '🙂' },
                      { value: 5, label: 'Great', icon: '🤩' },
                    ]}
                  />

                  <VisualSelector
                    label="Productivity Level"
                    value={productivity}
                    onChange={setProductivity}
                    colorClass="border-emerald-500 text-emerald-600 bg-emerald-50/50"
                    options={[
                      { value: 1, label: 'None', icon: '🐌' },
                      { value: 2, label: 'Low', icon: '🐢' },
                      { value: 3, label: 'Avg', icon: '🐇' },
                      { value: 4, label: 'High', icon: '🐆' },
                      { value: 5, label: 'Max', icon: '🚀' },
                    ]}
                  />
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <label htmlFor="challenges-list" className="text-sm font-medium">
                        Challenges
                      </label>
                      <Dialog open={challengeDialogOpen} onOpenChange={setChallengeDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Challenge</DialogTitle>
                            <DialogDescription>
                              What challenge did you face during your study today?
                            </DialogDescription>
                          </DialogHeader>
                          <Input
                            value={newChallenge}
                            onChange={(e) => setNewChallenge(e.target.value)}
                            placeholder="Describe the challenge..."
                            onKeyDown={(e) => e.key === 'Enter' && addChallenge()}
                          />
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setChallengeDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="button" onClick={addChallenge} disabled={!newChallenge.trim()}>
                              Add Challenge
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div id="challenges-list" className="space-y-2 min-h-[100px] max-h-[200px] overflow-y-auto">
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
                      <label htmlFor="wins-list" className="text-sm font-medium">
                        Wins
                      </label>
                      <Dialog open={winDialogOpen} onOpenChange={setWinDialogOpen}>
                        <DialogTrigger asChild>
                          <Button type="button" variant="outline" size="sm">
                            <Plus className="h-3 w-3 mr-1" />
                            Add
                          </Button>
                        </DialogTrigger>
                        <DialogContent className="sm:max-w-md">
                          <DialogHeader>
                            <DialogTitle>Add Win</DialogTitle>
                            <DialogDescription>
                              What was a win or accomplishment from your study today?
                            </DialogDescription>
                          </DialogHeader>
                          <Input
                            value={newWin}
                            onChange={(e) => setNewWin(e.target.value)}
                            placeholder="Describe your win..."
                            onKeyDown={(e) => e.key === 'Enter' && addWin()}
                          />
                          <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setWinDialogOpen(false)}>
                              Cancel
                            </Button>
                            <Button type="button" onClick={addWin} disabled={!newWin.trim()}>
                              Add Win
                            </Button>
                          </DialogFooter>
                        </DialogContent>
                      </Dialog>
                    </div>
                    <div id="wins-list" className="space-y-2 min-h-[100px] max-h-[200px] overflow-y-auto">
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
                  <label htmlFor="additional-notes" className="text-sm font-medium">
                    Additional Notes
                  </label>
                  <Textarea
                    id="additional-notes"
                    value={note}
                    onChange={e => setNote(e.target.value)}
                    placeholder="Any additional thoughts about today's study session..."
                    rows={4}
                  />
                </div>
              </CardContent>
            </Card>

            {/* Submit Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 pt-2">
              <Button type="button" variant="outline" onClick={() => router.push('/dashboard')} className="w-full sm:w-auto sm:flex-1 h-12 text-base">
                Cancel
              </Button>
              <Button type="submit" disabled={saving} className="w-full sm:w-auto sm:flex-1 h-12 text-base bg-gradient-to-r from-primary to-purple-600 hover:from-primary/90 hover:to-purple-700">
                {saving ? (
                  <div className="flex items-center gap-2">
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                    <span>Saving...</span>
                  </div>
                ) : (
                  <div className="flex items-center gap-2">
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
