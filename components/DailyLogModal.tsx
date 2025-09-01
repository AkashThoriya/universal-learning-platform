'use client';

import { format } from 'date-fns';
import { Zap, Moon, Star, Plus, X } from 'lucide-react';
import { useState, useEffect } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Textarea } from '@/components/ui/textarea';
import { useAuth } from '@/contexts/AuthContext';
// Use new database abstraction layer
import { enhancedDatabaseService, RepositoryFactory } from '@/lib/database';

// Type definitions for daily log
interface StudySession {
  topicId: string;
  subjectId: string;
  minutes: number;
  method: 'reading' | 'practice' | 'video' | 'notes' | 'discussion';
  effectiveness: 1 | 2 | 3 | 4 | 5;
  distractions: number;
}

interface DailyLogData {
  id?: string;
  userId: string;
  date: string;
  health: {
    energy: number;
    sleepHours: number;
    sleepQuality: number;
    stressLevel: number;
    physicalActivity: number;
  };
  studiedTopics: StudySession[];
  goals: {
    targetMinutes: number;
  };
  mood: 1 | 2 | 3 | 4 | 5;
  productivity: 1 | 2 | 3 | 4 | 5;
  note: string;
  challenges: string[];
  wins: string[];
  createdAt: Date;
  updatedAt: Date;
}

interface Topic {
  id: string;
  name: string;
  subject: string;
}

interface DailyLogModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function DailyLogModal({ isOpen, onClose }: DailyLogModalProps) {
  const { user } = useAuth();

  // Health metrics
  const [energyLevel, setEnergyLevel] = useState([7]);
  const [sleepHours, setSleepHours] = useState(7);
  const [sleepQuality, setSleepQuality] = useState([7]);
  const [stressLevel, setStressLevel] = useState([5]);
  const [physicalActivity, setPhysicalActivity] = useState(30);

  // Study sessions
  const [studySessions, setStudySessions] = useState<StudySession[]>([]);
  const [availableTopics, setAvailableTopics] = useState<Topic[]>([]);

  // Goals and reflection
  const [targetMinutes, setTargetMinutes] = useState(480); // 8 hours default
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [productivity, setProductivity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState('');
  const [challenges, setChallenges] = useState<string[]>([]);
  const [wins, setWins] = useState<string[]>([]);

  // New input states for challenges and wins
  const [newChallenge, setNewChallenge] = useState('');
  const [newWin, setNewWin] = useState('');
  const [showChallengeInput, setShowChallengeInput] = useState(false);
  const [showWinInput, setShowWinInput] = useState(false);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /**
   * Fetch topics using the new database abstraction layer
   */
  useEffect(() => {
    const fetchTopics = async () => {
      if (!user) {
        return;
      }

      try {
        // For now, we'll create a temporary repository for syllabus data
        // This can be refactored to use a dedicated SyllabusRepository later
        const db = enhancedDatabaseService.getProvider();
        const result = await db.query<{
          id: string;
          name: string;
          subjects: Array<{
            id: string;
            name: string;
            topics: Array<{ id: string; name: string }>;
          }>;
        }>(`users/${user.uid}/syllabus`);

        if (result.success && result.data) {
          const topics: Topic[] = [];
          result.data.forEach((syllabusItem: any) => {
            syllabusItem.subjects?.forEach((subject: any) => {
              subject.topics?.forEach((topic: any) => {
                topics.push({
                  id: topic.id,
                  name: topic.name,
                  subject: subject.name,
                });
              });
            });
          });
          setAvailableTopics(topics);
        }
      } catch (error) {
        console.error('Error fetching topics:', error);
        setError('Failed to load topics');
      }
    };

    if (isOpen) {
      fetchTopics();
      // Check if today's log already exists
      loadExistingLog();
    }
  }, [user, isOpen]);

  /**
   * Load existing daily log for today
   */
  const loadExistingLog = async () => {
    if (!user) {
      return;
    }

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const db = enhancedDatabaseService.getProvider();
      const result = await db.read<DailyLogData>(`users/${user.uid}/daily-logs`, today);

      if (result.success && result.data) {
        const log = result.data;
        // Pre-populate form with existing data
        setEnergyLevel([log.health.energy]);
        setSleepHours(log.health.sleepHours);
        setSleepQuality([log.health.sleepQuality]);
        setStressLevel([log.health.stressLevel]);
        setPhysicalActivity(log.health.physicalActivity);
        setStudySessions(log.studiedTopics);
        setTargetMinutes(log.goals.targetMinutes);
        setMood(log.mood);
        setProductivity(log.productivity);
        setNote(log.note);
        setChallenges(log.challenges);
        setWins(log.wins);
      }
    } catch (error) {
      console.error('Error loading existing log:', error);
    }
  };

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
    setShowChallengeInput(true);
  };

  const addWin = () => {
    setShowWinInput(true);
  };

  const handleAddChallenge = (e: React.KeyboardEvent<HTMLInputElement> | React.FormEvent) => {
    if ('key' in e && e.key !== 'Enter') {
      return;
    }
    e.preventDefault();

    if (newChallenge.trim()) {
      setChallenges(prev => [...prev, newChallenge.trim()]);
      setNewChallenge('');
      setShowChallengeInput(false);
    }
  };

  const handleAddWin = (e: React.KeyboardEvent<HTMLInputElement> | React.FormEvent) => {
    if ('key' in e && e.key !== 'Enter') {
      return;
    }
    e.preventDefault();

    if (newWin.trim()) {
      setWins(prev => [...prev, newWin.trim()]);
      setNewWin('');
      setShowWinInput(false);
    }
  };

  const cancelChallengeInput = () => {
    setNewChallenge('');
    setShowChallengeInput(false);
  };

  const cancelWinInput = () => {
    setNewWin('');
    setShowWinInput(false);
  };

  const getTotalStudyMinutes = () => {
    return studySessions.reduce((sum, session) => sum + session.minutes, 0);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const today = format(new Date(), 'yyyy-MM-dd');
      const now = new Date();

      const dailyLogData: DailyLogData = {
        userId: user.uid,
        date: today,
        health: {
          energy: energyLevel[0] || 7,
          sleepHours,
          sleepQuality: sleepQuality[0] || 7,
          stressLevel: stressLevel[0] || 5,
          physicalActivity,
        },
        studiedTopics: studySessions,
        goals: {
          targetMinutes,
        },
        mood,
        productivity,
        note,
        challenges,
        wins,
        createdAt: now,
        updatedAt: now,
      };

      // Save daily log using the database abstraction layer
      const db = enhancedDatabaseService.getProvider();
      const result = await db.update(`users/${user.uid}/daily-logs`, today, dailyLogData);

      if (!result.success) {
        throw new Error(result.error || 'Failed to save daily log');
      }

      // Record analytics event for daily log completion
      const factory = new RepositoryFactory(enhancedDatabaseService.getProvider());
      const analyticsRepo = factory.createAnalyticsRepository();

      await analyticsRepo.recordEvent(
        user.uid,
        'daily_log_completed',
        {
          totalStudyMinutes: getTotalStudyMinutes(),
          sessionsCount: studySessions.length,
          mood,
          productivity,
          energy: energyLevel[0],
          sleepHours,
        },
        `session-${Date.now()}`
      );

      // Update user progress based on study sessions
      if (studySessions.length > 0) {
        const progressRepo = factory.createProgressRepository();

        for (const session of studySessions) {
          if (session.topicId && session.subjectId) {
            await progressRepo.updateProgress(user.uid, session.subjectId, {
              lastStudied: now,
              totalTimeSpent: session.minutes,
            });
          }
        }
      }

      onClose();
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to save daily log';
      setError(message);
      console.error('Error saving daily log:', error);
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setEnergyLevel([7]);
    setSleepHours(7);
    setSleepQuality([7]);
    setStressLevel([5]);
    setPhysicalActivity(30);
    setStudySessions([]);
    setTargetMinutes(480);
    setMood(3);
    setProductivity(3);
    setNote('');
    setChallenges([]);
    setWins([]);
    // Reset input states
    setNewChallenge('');
    setNewWin('');
    setShowChallengeInput(false);
    setShowWinInput(false);
    setError(null);
  };

  const handleClose = () => {
    resetForm();
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Star className="h-5 w-5" />
            Daily Log - {format(new Date(), 'MMMM dd, yyyy')}
          </DialogTitle>
          <DialogDescription>Track your health, study sessions, and reflections for today</DialogDescription>
        </DialogHeader>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
            <p className="text-red-700">{error}</p>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Health Metrics */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Zap className="h-5 w-5" />
              Health & Wellness
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Energy Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Energy Level</label>
                <Slider
                  value={energyLevel}
                  onValueChange={setEnergyLevel}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Low (1)</span>
                  <span>High (10)</span>
                </div>
                <p className="text-center font-medium">Current: {energyLevel[0]}/10</p>
              </div>

              {/* Sleep Hours */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sleep Hours</label>
                <Input
                  type="number"
                  value={sleepHours}
                  onChange={e => setSleepHours(Number(e.target.value))}
                  min="0"
                  max="24"
                  step="0.5"
                />
              </div>

              {/* Sleep Quality */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Sleep Quality</label>
                <Slider
                  value={sleepQuality}
                  onValueChange={setSleepQuality}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Poor (1)</span>
                  <span>Excellent (10)</span>
                </div>
                <p className="text-center font-medium">Current: {sleepQuality[0]}/10</p>
              </div>

              {/* Stress Level */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Stress Level</label>
                <Slider
                  value={stressLevel}
                  onValueChange={setStressLevel}
                  max={10}
                  min={1}
                  step={1}
                  className="w-full"
                />
                <div className="flex justify-between text-xs text-gray-500">
                  <span>Relaxed (1)</span>
                  <span>Stressed (10)</span>
                </div>
                <p className="text-center font-medium">Current: {stressLevel[0]}/10</p>
              </div>

              {/* Physical Activity */}
              <div className="space-y-2 md:col-span-2">
                <label className="text-sm font-medium">Physical Activity (minutes)</label>
                <Input
                  type="number"
                  value={physicalActivity}
                  onChange={e => setPhysicalActivity(Number(e.target.value))}
                  min="0"
                  max="1440"
                />
              </div>
            </div>
          </div>

          {/* Study Sessions */}
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold">Study Sessions</h3>
              <Button type="button" onClick={addStudySession} size="sm">
                <Plus className="h-4 w-4 mr-2" />
                Add Session
              </Button>
            </div>

            {studySessions.length === 0 ? (
              <div className="text-center py-8 bg-gray-50 rounded-lg">
                <p className="text-gray-600">No study sessions added yet</p>
                <Button type="button" onClick={addStudySession} className="mt-2">
                  Add Your First Session
                </Button>
              </div>
            ) : (
              <div className="space-y-4">
                {studySessions.map((session, index) => (
                  <div key={index} className="border rounded-lg p-4 space-y-4">
                    <div className="flex justify-between items-center">
                      <h4 className="font-medium">Session {index + 1}</h4>
                      <Button type="button" variant="ghost" size="sm" onClick={() => removeStudySession(index)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      {/* Topic Selection */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Topic</label>
                        <Select
                          value={session.topicId}
                          onValueChange={value => {
                            const topic = availableTopics.find(t => t.id === value);
                            updateStudySession(index, {
                              topicId: value,
                              subjectId: topic?.subject || '',
                            });
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select a topic" />
                          </SelectTrigger>
                          <SelectContent>
                            {availableTopics.map(topic => (
                              <SelectItem key={topic.id} value={topic.id}>
                                {topic.subject} - {topic.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Study Method */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Study Method</label>
                        <Select
                          value={session.method}
                          onValueChange={(value: StudySession['method']) =>
                            updateStudySession(index, { method: value })
                          }
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="reading">Reading</SelectItem>
                            <SelectItem value="practice">Practice Problems</SelectItem>
                            <SelectItem value="video">Video Learning</SelectItem>
                            <SelectItem value="notes">Note Taking</SelectItem>
                            <SelectItem value="discussion">Discussion</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Minutes */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Minutes</label>
                        <Input
                          type="number"
                          value={session.minutes}
                          onChange={e => updateStudySession(index, { minutes: Number(e.target.value) })}
                          min="1"
                          max="1440"
                        />
                      </div>

                      {/* Effectiveness */}
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Effectiveness (1-5)</label>
                        <Select
                          value={session.effectiveness.toString()}
                          onValueChange={value =>
                            updateStudySession(index, { effectiveness: Number(value) as StudySession['effectiveness'] })
                          }
                        >
                          <SelectTrigger>
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

                      {/* Distractions */}
                      <div className="space-y-2 md:col-span-2">
                        <label className="text-sm font-medium">Distractions (count)</label>
                        <Input
                          type="number"
                          value={session.distractions}
                          onChange={e => updateStudySession(index, { distractions: Number(e.target.value) })}
                          min="0"
                          max="100"
                        />
                      </div>
                    </div>
                  </div>
                ))}

                {/* Study Summary */}
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">Total Study Time</span>
                    <Badge variant="secondary">
                      {Math.floor(getTotalStudyMinutes() / 60)}h {getTotalStudyMinutes() % 60}m
                    </Badge>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-medium">
                      Target: {Math.floor(targetMinutes / 60)}h {targetMinutes % 60}m
                    </span>
                    <span className="text-sm text-gray-600">
                      {getTotalStudyMinutes() >= targetMinutes
                        ? '✅ Target achieved!'
                        : `${targetMinutes - getTotalStudyMinutes()}m remaining`}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Goals & Reflection */}
          <div className="space-y-6">
            <h3 className="text-lg font-semibold flex items-center gap-2">
              <Moon className="h-5 w-5" />
              Goals & Reflection
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Target Minutes */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily Target (minutes)</label>
                <Input
                  type="number"
                  value={targetMinutes}
                  onChange={e => setTargetMinutes(Number(e.target.value))}
                  min="0"
                  max="1440"
                />
              </div>

              {/* Mood */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Overall Mood</label>
                <Select value={mood.toString()} onValueChange={value => setMood(Number(value) as typeof mood)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1">😢 Very Sad</SelectItem>
                    <SelectItem value="2">😕 Sad</SelectItem>
                    <SelectItem value="3">😐 Neutral</SelectItem>
                    <SelectItem value="4">😊 Happy</SelectItem>
                    <SelectItem value="5">😄 Very Happy</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Productivity */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Productivity</label>
                <Select
                  value={productivity.toString()}
                  onValueChange={value => setProductivity(Number(value) as typeof productivity)}
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

            {/* Notes */}
            <div className="space-y-2">
              <label className="text-sm font-medium">Notes & Observations</label>
              <Textarea
                value={note}
                onChange={e => setNote(e.target.value)}
                placeholder="Any additional notes about your day..."
                rows={3}
              />
            </div>

            {/* Challenges & Wins */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Challenges */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-red-500 rounded-full" />
                    Challenges
                  </label>
                  <Button
                    type="button"
                    onClick={addChallenge}
                    size="sm"
                    variant="outline"
                    className="text-red-600 border-red-200 hover:bg-red-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Challenge
                  </Button>
                </div>

                <div className="space-y-2">
                  {/* Inline input for new challenge */}
                  {showChallengeInput && (
                    <div className="bg-red-50 border-2 border-red-200 rounded-lg p-3 space-y-2">
                      <Input
                        value={newChallenge}
                        onChange={e => setNewChallenge(e.target.value)}
                        onKeyDown={handleAddChallenge}
                        placeholder="What challenge did you face today?"
                        className="border-red-300 focus:border-red-500 focus:ring-red-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleAddChallenge}
                          size="sm"
                          className="bg-red-600 hover:bg-red-700 text-white"
                          disabled={!newChallenge.trim()}
                        >
                          Add Challenge
                        </Button>
                        <Button
                          type="button"
                          onClick={cancelChallengeInput}
                          size="sm"
                          variant="ghost"
                          className="text-red-600 hover:bg-red-100"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* List of existing challenges */}
                  {challenges.map((challenge, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between bg-red-50 border border-red-200 p-3 rounded-lg group hover:bg-red-100 transition-colors"
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <span className="w-1.5 h-1.5 bg-red-500 rounded-full mt-2 flex-shrink-0" />
                        <span className="text-sm text-red-800 leading-relaxed">{challenge}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setChallenges(prev => prev.filter((_, i) => i !== index))}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-red-600 hover:bg-red-200 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {challenges.length === 0 && !showChallengeInput && (
                    <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-500 mb-2">No challenges recorded yet</p>
                      <Button
                        type="button"
                        onClick={addChallenge}
                        size="sm"
                        variant="ghost"
                        className="text-red-600 hover:bg-red-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Add your first challenge
                      </Button>
                    </div>
                  )}
                </div>
              </div>

              {/* Wins */}
              <div className="space-y-3">
                <div className="flex justify-between items-center">
                  <label className="text-sm font-medium flex items-center gap-2">
                    <span className="w-2 h-2 bg-green-500 rounded-full" />
                    Wins & Achievements
                  </label>
                  <Button
                    type="button"
                    onClick={addWin}
                    size="sm"
                    variant="outline"
                    className="text-green-600 border-green-200 hover:bg-green-50"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Add Win
                  </Button>
                </div>

                <div className="space-y-2">
                  {/* Inline input for new win */}
                  {showWinInput && (
                    <div className="bg-green-50 border-2 border-green-200 rounded-lg p-3 space-y-2">
                      <Input
                        value={newWin}
                        onChange={e => setNewWin(e.target.value)}
                        onKeyDown={handleAddWin}
                        placeholder="What win did you achieve today?"
                        className="border-green-300 focus:border-green-500 focus:ring-green-500"
                        autoFocus
                      />
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          onClick={handleAddWin}
                          size="sm"
                          className="bg-green-600 hover:bg-green-700 text-white"
                          disabled={!newWin.trim()}
                        >
                          Add Win
                        </Button>
                        <Button
                          type="button"
                          onClick={cancelWinInput}
                          size="sm"
                          variant="ghost"
                          className="text-green-600 hover:bg-green-100"
                        >
                          Cancel
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* List of existing wins */}
                  {wins.map((win, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between bg-green-50 border border-green-200 p-3 rounded-lg group hover:bg-green-100 transition-colors"
                    >
                      <div className="flex items-start gap-2 flex-1">
                        <span className="text-green-600 mt-1 flex-shrink-0">🎉</span>
                        <span className="text-sm text-green-800 leading-relaxed">{win}</span>
                      </div>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={() => setWins(prev => prev.filter((_, i) => i !== index))}
                        className="opacity-0 group-hover:opacity-100 transition-opacity text-green-600 hover:bg-green-200 ml-2"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}

                  {wins.length === 0 && !showWinInput && (
                    <div className="text-center py-8 bg-gray-50 border-2 border-dashed border-gray-200 rounded-lg">
                      <p className="text-sm text-gray-500 mb-2">No wins recorded yet</p>
                      <Button
                        type="button"
                        onClick={addWin}
                        size="sm"
                        variant="ghost"
                        className="text-green-600 hover:bg-green-50"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        Celebrate your first win
                      </Button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Submit Buttons */}
          <div className="flex justify-end gap-4 pt-6 border-t">
            <Button type="button" variant="outline" onClick={handleClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Saving...' : 'Save Daily Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
