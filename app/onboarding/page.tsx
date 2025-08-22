'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { createUser, saveSyllabus } from '@/lib/firebase-utils';
import { EXAMS_DATA, getExamById } from '@/lib/exams-data';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { Checkbox } from '@/components/ui/checkbox';
import { Calendar, BookOpen, Target, BarChart3, CheckCircle, Search, Plus, Minus } from 'lucide-react';
import { Exam, SyllabusSubject, User } from '@/types/exam';
import { Timestamp } from 'firebase/firestore';

export default function OnboardingPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // Step 1: Basic Info
  const [displayName, setDisplayName] = useState('');
  const [selectedExam, setSelectedExam] = useState<Exam | null>(null);
  const [examDate, setExamDate] = useState('');
  const [isCustomExam, setIsCustomExam] = useState(false);
  
  // Step 2: Custom Exam (if needed)
  const [customExamName, setCustomExamName] = useState('');
  const [customExamDescription, setCustomExamDescription] = useState('');
  
  // Step 3: Syllabus Management
  const [syllabus, setSyllabus] = useState<SyllabusSubject[]>([]);
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());
  
  // Step 4: Settings
  const [dailyGoalMinutes, setDailyGoalMinutes] = useState(480); // 8 hours default
  const [tierDefinitions, setTierDefinitions] = useState({
    1: 'High Priority',
    2: 'Medium Priority',
    3: 'Low Priority'
  });

  useEffect(() => {
    if (selectedExam && !isCustomExam) {
      setSyllabus(selectedExam.defaultSyllabus);
    }
  }, [selectedExam, isCustomExam]);

  const filteredExams = EXAMS_DATA.filter(exam =>
    exam.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    exam.category.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleExamSelect = (examId: string) => {
    if (examId === 'custom') {
      setIsCustomExam(true);
      setSelectedExam(null);
    } else {
      const exam = getExamById(examId);
      setSelectedExam(exam || null);
      setIsCustomExam(false);
    }
  };

  const toggleSubjectExpansion = (subjectId: string) => {
    const newExpanded = new Set(expandedSubjects);
    if (newExpanded.has(subjectId)) {
      newExpanded.delete(subjectId);
    } else {
      newExpanded.add(subjectId);
    }
    setExpandedSubjects(newExpanded);
  };

  const updateSubjectTier = (subjectId: string, tier: 1 | 2 | 3) => {
    setSyllabus(prev => prev.map(subject =>
      subject.id === subjectId ? { ...subject, tier } : subject
    ));
  };

  const addTopic = (subjectId: string) => {
    const topicName = prompt('Enter topic name:');
    if (topicName) {
      setSyllabus(prev => prev.map(subject =>
        subject.id === subjectId
          ? {
              ...subject,
              topics: [
                ...subject.topics,
                {
                  id: `${subjectId}_${Date.now()}`,
                  name: topicName,
                  estimatedHours: 10
                }
              ]
            }
          : subject
      ));
    }
  };

  const removeTopic = (subjectId: string, topicId: string) => {
    setSyllabus(prev => prev.map(subject =>
      subject.id === subjectId
        ? {
            ...subject,
            topics: subject.topics.filter(topic => topic.id !== topicId)
          }
        : subject
    ));
  };

  const addSubject = () => {
    const subjectName = prompt('Enter subject name:');
    if (subjectName) {
      const newSubject: SyllabusSubject = {
        id: `subject_${Date.now()}`,
        name: subjectName,
        tier: 2,
        topics: [],
        estimatedHours: 50
      };
      setSyllabus(prev => [...prev, newSubject]);
    }
  };

  const handleComplete = async () => {
    if (!user) return;

    setLoading(true);
    try {
      // Create user document
      const userData: Partial<User> = {
        email: user.email || '',
        displayName,
        currentExam: {
          id: selectedExam?.id || 'custom',
          name: selectedExam?.name || customExamName,
          targetDate: Timestamp.fromDate(new Date(examDate))
        },
        onboardingComplete: true,
        settings: {
          revisionIntervals: [1, 3, 7, 16, 35], // Spaced repetition intervals
          dailyStudyGoalMinutes: dailyGoalMinutes,
          tierDefinition: tierDefinitions,
          notifications: {
            revisionReminders: true,
            dailyGoalReminders: true,
            healthCheckReminders: true
          },
          preferences: {
            theme: 'system',
            language: 'en',
            timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
          }
        }
      };

      await createUser(user.uid, userData);

      // Save syllabus
      await saveSyllabus(user.uid, syllabus);

      router.push('/dashboard');
    } catch (error) {
      console.error('Error completing onboarding:', error);
    } finally {
      setLoading(false);
    }
  };

  const getProgress = () => (step / 4) * 100;

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Exam Strategy Engine</h1>
          <p className="text-muted-foreground">Let's build your personalized strategic preparation system for competitive exam success</p>
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
              <Target className="h-12 w-12 text-blue-600 mx-auto mb-4" />
              <CardTitle>Choose Your Exam</CardTitle>
              <CardDescription>Select your target exam or create a custom one</CardDescription>
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
                <label className="text-sm font-medium">Search Exams</label>
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search for your exam..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">Available Exams</label>
                <div className="grid grid-cols-1 gap-2 max-h-60 overflow-y-auto">
                  {filteredExams.map(exam => (
                    <div
                      key={exam.id}
                      className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                        selectedExam?.id === exam.id
                          ? 'border-blue-500 bg-blue-50'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                      onClick={() => handleExamSelect(exam.id)}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h4 className="font-medium">{exam.name}</h4>
                          <p className="text-sm text-gray-600">{exam.description}</p>
                        </div>
                        <Badge variant="outline">{exam.category}</Badge>
                      </div>
                    </div>
                  ))}
                  
                  <div
                    className={`p-3 border rounded-lg cursor-pointer transition-colors ${
                      isCustomExam
                        ? 'border-blue-500 bg-blue-50'
                        : 'border-gray-200 hover:border-gray-300'
                    }`}
                    onClick={() => handleExamSelect('custom')}
                  >
                    <div className="flex items-center space-x-2">
                      <Plus className="h-4 w-4" />
                      <span className="font-medium">Create Custom Exam</span>
                    </div>
                    <p className="text-sm text-gray-600 mt-1">Perfect for state PSCs, specialized exams, or custom syllabi</p>
                  </div>
                </div>
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
                disabled={!displayName || !examDate || (!selectedExam && !isCustomExam)}
              >
                Continue
              </Button>
            </CardContent>
          </Card>
        )}

        {step === 2 && isCustomExam && (
          <Card>
            <CardHeader className="text-center">
              <BookOpen className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Custom Exam Details</CardTitle>
              <CardDescription>Define your custom exam structure</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Exam Name</label>
                <Input
                  placeholder="e.g., State PSC Prelims"
                  value={customExamName}
                  onChange={(e) => setCustomExamName(e.target.value)}
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium">Description</label>
                <Textarea
                  placeholder="Brief description of your exam"
                  value={customExamDescription}
                  onChange={(e) => setCustomExamDescription(e.target.value)}
                  rows={3}
                />
              </div>
              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(1)} className="w-full">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(3)} 
                  className="w-full"
                  disabled={!customExamName}
                >
                  Continue to Syllabus
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === (isCustomExam ? 3 : 2) && (
          <Card>
            <CardHeader className="text-center">
              <BarChart3 className="h-12 w-12 text-purple-600 mx-auto mb-4" />
              <CardTitle>Syllabus Management</CardTitle>
              <CardDescription>
                Organize your syllabus by priority tiers. This is the strategic foundation of your preparation.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="bg-blue-50 p-4 rounded-lg">
                <h4 className="font-semibold text-blue-900 mb-2">Tier System</h4>
                <div className="space-y-1 text-sm text-blue-800">
                  <p><strong>Tier 1:</strong> {tierDefinitions[1]} - Focus 60% of your time</p>
                  <p><strong>Tier 2:</strong> {tierDefinitions[2]} - Focus 30% of your time</p>
                  <p><strong>Tier 3:</strong> {tierDefinitions[3]} - Focus 10% of your time</p>
                </div>
              </div>

              <div className="space-y-3 max-h-96 overflow-y-auto">
                {syllabus.map(subject => (
                  <div key={subject.id} className="border rounded-lg p-3">
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center space-x-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => toggleSubjectExpansion(subject.id)}
                        >
                          {expandedSubjects.has(subject.id) ? <Minus className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
                        </Button>
                        <h4 className="font-medium">{subject.name}</h4>
                        <Badge variant="outline">{subject.topics.length} topics</Badge>
                      </div>
                      <div className="flex items-center space-x-2">
                        {[1, 2, 3].map(tier => (
                          <Button
                            key={tier}
                            variant={subject.tier === tier ? "default" : "outline"}
                            size="sm"
                            onClick={() => updateSubjectTier(subject.id, tier as 1 | 2 | 3)}
                            className={`w-8 h-8 p-0 ${
                              subject.tier === tier
                                ? tier === 1 ? 'bg-red-500 hover:bg-red-600' :
                                  tier === 2 ? 'bg-yellow-500 hover:bg-yellow-600' :
                                  'bg-green-500 hover:bg-green-600'
                                : ''
                            }`}
                          >
                            {tier}
                          </Button>
                        ))}
                      </div>
                    </div>
                    
                    {expandedSubjects.has(subject.id) && (
                      <div className="ml-6 space-y-2">
                        {subject.topics.map(topic => (
                          <div key={topic.id} className="flex items-center justify-between p-2 bg-gray-50 rounded">
                            <span className="text-sm">{topic.name}</span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTopic(subject.id, topic.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                          </div>
                        ))}
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => addTopic(subject.id)}
                          className="w-full"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Topic
                        </Button>
                      </div>
                    )}
                  </div>
                ))}
              </div>

              <Button variant="outline" onClick={addSubject} className="w-full">
                <Plus className="h-4 w-4 mr-2" />
                Add Subject
              </Button>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(isCustomExam ? 2 : 1)} className="w-full">
                  Back
                </Button>
                <Button 
                  onClick={() => setStep(isCustomExam ? 4 : 3)} 
                  className="w-full"
                  disabled={syllabus.length === 0}
                >
                  Continue to Settings
                </Button>
              </div>
            </CardContent>
          </Card>
        )}

        {step === (isCustomExam ? 4 : 3) && (
          <Card>
            <CardHeader className="text-center">
              <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
              <CardTitle>Final Settings</CardTitle>
              <CardDescription>
                Configure your study preferences and goals
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <label className="text-sm font-medium">Daily Study Goal (minutes)</label>
                <Input
                  type="number"
                  min="60"
                  max="720"
                  value={dailyGoalMinutes}
                  onChange={(e) => setDailyGoalMinutes(Number(e.target.value))}
                />
                <p className="text-xs text-gray-600">
                  {Math.floor(dailyGoalMinutes / 60)}h {dailyGoalMinutes % 60}m per day
                </p>
              </div>

              <div className="space-y-3">
                <label className="text-sm font-medium">Customize Tier Definitions</label>
                {[1, 2, 3].map(tier => (
                  <div key={tier} className="space-y-1">
                    <label className="text-xs text-gray-600">Tier {tier}</label>
                    <Input
                      value={tierDefinitions[tier as 1 | 2 | 3]}
                      onChange={(e) => setTierDefinitions(prev => ({
                        ...prev,
                        [tier]: e.target.value
                      }))}
                      placeholder={`Define Tier ${tier}`}
                    />
                  </div>
                ))}
              </div>

              <div className="bg-green-50 p-4 rounded-lg">
                <h4 className="font-semibold text-green-900 mb-2">Setup Summary</h4>
                <div className="space-y-1 text-sm text-green-800">
                  <p><strong>Exam:</strong> {selectedExam?.name || customExamName}</p>
                  <p><strong>Target Date:</strong> {new Date(examDate).toLocaleDateString()}</p>
                  <p><strong>Subjects:</strong> {syllabus.length}</p>
                  <p><strong>Total Topics:</strong> {syllabus.reduce((sum, s) => sum + s.topics.length, 0)}</p>
                  <p><strong>Daily Goal:</strong> {Math.floor(dailyGoalMinutes / 60)}h {dailyGoalMinutes % 60}m</p>
                </div>
              </div>

              <div className="flex space-x-2">
                <Button variant="outline" onClick={() => setStep(isCustomExam ? 3 : 2)} className="w-full">
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
                      <span>Launch Strategy Engine</span>
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