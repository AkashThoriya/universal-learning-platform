'use client';

import { useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import { saveDailyLog, getSyllabus } from '@/lib/firebase-utils';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Slider } from '@/components/ui/slider';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { Zap, Moon, Star, Plus, X } from 'lucide-react';
import { format } from 'date-fns';
import { DailyLog, SyllabusSubject, StudySession } from '@/types/exam';
import { Timestamp } from 'firebase/firestore';
import { useEffect } from 'react';

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
  const [availableTopics, setAvailableTopics] = useState<{ id: string; name: string; subject: string }[]>([]);
  
  // Goals and reflection
  const [targetMinutes, setTargetMinutes] = useState(480); // 8 hours default
  const [mood, setMood] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [productivity, setProductivity] = useState<1 | 2 | 3 | 4 | 5>(3);
  const [note, setNote] = useState('');
  const [challenges, setChallenges] = useState<string[]>([]);
  const [wins, setWins] = useState<string[]>([]);
  
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchTopics = async () => {
      if (!user) return;
      
      try {
        const syllabus = await getSyllabus(user.uid);
        const topics = syllabus.flatMap(subject =>
          subject.topics.map(topic => ({
            id: topic.id,
            name: topic.name,
            subject: subject.name
          }))
        );
        setAvailableTopics(topics);
      } catch (error) {
        console.error('Error fetching topics:', error);
      }
    };

    if (isOpen) {
      fetchTopics();
    }
  }, [user, isOpen]);

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

    setLoading(true);
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
          screenTime: 0 // Could be added later
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
      onClose();
      
      // Reset form
      setStudySessions([]);
      setChallenges([]);
      setWins([]);
      setNote('');
    } catch (error) {
      console.error('Error saving daily log:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <Zap className="h-5 w-5 text-yellow-500" />
            <span>Daily Progress Log</span>
          </DialogTitle>
          <DialogDescription>
            Log your daily study progress, health metrics, and reflections
          </DialogDescription>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Health Metrics */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Health Metrics</h3>
            
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

            <div className="grid grid-cols-2 gap-4">
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

            <div className="grid grid-cols-2 gap-4">
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
          </div>

          {/* Study Sessions */}
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-lg">Study Sessions</h3>
              <Button type="button" variant="outline" size="sm" onClick={addStudySession}>
                <Plus className="h-4 w-4 mr-1" />
                Add Session
              </Button>
            </div>
            
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
                
                <div className="grid grid-cols-2 gap-3">
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
                
                <div className="grid grid-cols-2 gap-3">
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
                </div>
              </div>
            ))}
            
            {studySessions.length > 0 && (
              <div className="bg-blue-50 p-3 rounded-lg">
                <p className="text-sm text-blue-800">
                  Total study time: <strong>{Math.floor(getTotalStudyMinutes() / 60)}h {getTotalStudyMinutes() % 60}m</strong>
                </p>
              </div>
            )}
          </div>

          {/* Goals and Reflection */}
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Goals & Reflection</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily Goal (min)</label>
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
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={mood}
                  onChange={(e) => setMood(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                />
              </div>
              
              <div className="space-y-2">
                <label className="text-sm font-medium">Productivity (1-5)</label>
                <Input
                  type="number"
                  min="1"
                  max="5"
                  value={productivity}
                  onChange={(e) => setProductivity(Number(e.target.value) as 1 | 2 | 3 | 4 | 5)}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Challenges</label>
                  <Button type="button" variant="outline" size="sm" onClick={addChallenge}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {challenges.map((challenge, index) => (
                    <div key={index} className="text-sm p-2 bg-red-50 rounded border-l-2 border-red-200">
                      {challenge}
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium">Wins</label>
                  <Button type="button" variant="outline" size="sm" onClick={addWin}>
                    <Plus className="h-3 w-3" />
                  </Button>
                </div>
                <div className="space-y-1">
                  {wins.map((win, index) => (
                    <div key={index} className="text-sm p-2 bg-green-50 rounded border-l-2 border-green-200">
                      {win}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <label className="text-sm font-medium">Additional Notes</label>
              <Textarea
                value={note}
                onChange={(e) => setNote(e.target.value)}
                placeholder="Any additional thoughts about today..."
                rows={3}
              />
            </div>
          </div>

          <div className="flex space-x-2">
            <Button type="button" variant="outline" onClick={onClose} className="w-full">
              Cancel
            </Button>
            <Button type="submit" disabled={loading} className="w-full">
              {loading ? 'Saving...' : 'Save Daily Log'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}