/**
 * @fileoverview Onboarding Step Components - Part 2
 *
 * Syllabus Management and Preferences step components for the enhanced onboarding flow.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  BookOpen,
  Plus,
  Trash2,
  Settings,
  Target,
  AlertCircle,
  CheckCircle,
  Info,
  Edit3,
  Save,
  X,
  ChevronDown,
  ChevronRight,
  GripVertical,
} from 'lucide-react';
import { useState, useMemo } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { UseFormReturn } from '@/hooks/useForm';
import { EXAMS_DATA } from '@/lib/data/exams-data';
import { Exam, SyllabusSubject, SyllabusTopic, OnboardingFormData } from '@/types/exam';

/**
 * Get context-aware strategy tips based on the selected exam
 */
function getExamSpecificTips(selectedExamId: string) {
  const exam = EXAMS_DATA.find(e => e.id === selectedExamId);

  if (!exam) {
    return {
      strategyTip:
        'Focus 60% effort on high-weightage topics, 30% on medium-weightage topics, and 10% on low-weightage topics for optimal score maximization.',
      topicManagement:
        'Expand subjects to manage topics - add specialized areas, remove irrelevant ones, and customize names to match your study material or coaching notes.',
    };
  }

  // Exam-specific strategy tips
  const examTips: Record<string, { strategyTip: string; topicManagement: string }> = {
    upsc_cse_prelims: {
      strategyTip:
        'For UPSC Prelims: 40% focus on Current Affairs & Polity (daily changing), 30% on Geography & History (static), 30% on Economics & Science (semi-static). Prioritize newspaper reading and monthly magazines.',
      topicManagement:
        'Customize topics to match your optional subject and coaching material. Add monthly current affairs, remove overlapping history topics, and focus on areas frequently asked in recent years.',
    },
    ssc_cgl: {
      strategyTip:
        'For SSC CGL: 35% on Quantitative Aptitude (high scoring), 30% on Reasoning (accuracy crucial), 25% on General Awareness (fact-based), 10% on English (qualifying). Time management is critical - aim 50 seconds per question.',
      topicManagement:
        'Focus on high-frequency topics like Data Interpretation, Simplification in Quant. Add recent government schemes in GA and remove outdated historical facts.',
    },
    neet: {
      strategyTip:
        'For NEET: 50% on Biology (360 marks - highest weightage), 25% on Physics (conceptual clarity), 25% on Chemistry (memory + concepts). NCERT is 85% of paper - master it completely before moving to other books.',
      topicManagement:
        'Prioritize NCERT line-by-line for Biology. Add previous year questions as topics. Remove very advanced topics not in NCERT. Focus on diagrams and table format for quick revision.',
    },
    jee_main: {
      strategyTip:
        'For JEE Main: Equal 33% weightage to PCM, but Mathematics often has easier scoring topics. Focus 40% on Mathematics (Calculus, Algebra), 30% on Physics (Mechanics, Electrostatics), 30% on Chemistry (Organic reactions).',
      topicManagement:
        'Add numerical practice as separate topics under each subject. Include previous year question trends. Remove very theoretical topics - focus on application-based problem solving.',
    },
    sbi_po: {
      strategyTip:
        'For Banking PO: 35% on Reasoning (puzzle-heavy), 30% on Quantitative Aptitude (speed crucial), 25% on English (vocabulary focus), 10% on Current Affairs. Mock tests are essential for time management.',
      topicManagement:
        'Add monthly banking current affairs. Focus on high-speed topics like Simplification, Percentage. Include sectional time management as separate practice topics.',
    },
    cat: {
      strategyTip:
        'For CAT: 40% on VARC (Reading speed crucial), 35% on DILR (logical thinking), 25% on QA (selective attempt). Focus on accuracy over speed - each wrong answer costs 3 correct ones due to negative marking.',
      topicManagement:
        'Add Reading Comprehension passages by topic (business, science, etc.). Include mock analysis sessions. Remove low-yield quantitative topics and focus on high-probability areas.',
    },
    gate_cse: {
      strategyTip:
        'For GATE CSE: 70% on technical subjects (algorithms, programming, etc.), 20% on Engineering Mathematics, 10% on General Aptitude. Previous years show 60% weightage to core CS subjects.',
      topicManagement:
        'Break down programming topics into implementation and theory. Add specific algorithms as separate topics. Include numerical answer type question practice for each subject.',
    },
  };

  return (
    examTips[selectedExamId] || {
      strategyTip: `Focus on high-weightage subjects first. For ${exam.category} exams, prioritize accuracy over speed and maintain consistent daily practice across all subjects.`,
      topicManagement:
        'Expand each subject to see topics. Customize based on your exam pattern - add emerging areas, remove outdated topics, and align with latest syllabus changes.',
    }
  );
}

/**
 * Syllabus Management Step
 */
interface SyllabusManagementStepProps {
  form: UseFormReturn<OnboardingFormData>;
  selectedExam: Exam | null;
  onUpdateSubjectTier: (subjectId: string, tier: 1 | 2 | 3) => void;
  onAddSubject: () => void;
  onRemoveSubject: (subjectId: string) => void;
  onAddTopic: (subjectId: string, topicName?: string) => void;
  onRemoveTopic: (subjectId: string, topicId: string) => void;
  onUpdateTopic: (subjectId: string, topicId: string, updates: Partial<SyllabusTopic>) => void;
  onReorderTopics: (subjectId: string, topicIds: string[]) => void;
}

export function SyllabusManagementStep({
  form,
  onUpdateSubjectTier: _onUpdateSubjectTier,
  onAddSubject,
  onRemoveSubject,
  onAddTopic,
  onRemoveTopic,
  onUpdateTopic,
  onReorderTopics: _onReorderTopics, // Renamed with underscore to indicate intentional non-use
}: SyllabusManagementStepProps) {
  // Note: onReorderTopics is available for future drag-and-drop functionality
  const [editingSubject, setEditingSubject] = useState<string | null>(null);
  const [tempSubjectName, setTempSubjectName] = useState('');
  const [editingTopic, setEditingTopic] = useState<string | null>(null);
  const [tempTopicName, setTempTopicName] = useState('');
  const [expandedSubjects, setExpandedSubjects] = useState<Set<string>>(new Set());

  // Get exam-specific strategy tips
  const examTips = getExamSpecificTips(form.data.selectedExamId || '');

  // Helper to get primary course name
  const primaryCourseName = useMemo(() => {
    if (form.data.isCustomExam) {
      return form.data.customExam?.name || 'Custom Course';
    }
    if (form.data.selectedExamId && form.data.selectedCourses) {
      const course = form.data.selectedCourses.find(c => c.examId === form.data.selectedExamId);
      if (course) {
        return course.examName;
      }
    }
    return 'Selected Course';
  }, [form.data.isCustomExam, form.data.customExam, form.data.selectedExamId, form.data.selectedCourses]);

  const startEditing = (subjectId: string, currentName: string) => {
    setEditingSubject(subjectId);
    setTempSubjectName(currentName);
  };

  const saveSubjectName = (subjectId: string) => {
    if (tempSubjectName.trim()) {
      const updatedSyllabus = form.data.syllabus.map((subject: SyllabusSubject) =>
        subject.id === subjectId ? { ...subject, name: tempSubjectName.trim() } : subject
      );
      form.updateField('syllabus', updatedSyllabus);
    }
    setEditingSubject(null);
    setTempSubjectName('');
  };

  const cancelEditing = () => {
    setEditingSubject(null);
    setTempSubjectName('');
  };

  const startEditingTopic = (topicId: string, currentName: string) => {
    setEditingTopic(topicId);
    setTempTopicName(currentName);
  };

  const saveTopicName = (subjectId: string, topicId: string) => {
    if (tempTopicName.trim()) {
      onUpdateTopic(subjectId, topicId, { name: tempTopicName.trim() });
    }
    setEditingTopic(null);
    setTempTopicName('');
  };

  const cancelEditingTopic = () => {
    setEditingTopic(null);
    setTempTopicName('');
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

  return (
    <CardContent className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center space-x-2">
          <BookOpen className="h-6 w-6 text-purple-600" />
          <CardTitle>Syllabus Management</CardTitle>
        </div>
        <CardDescription>Organize your subjects by priority tiers to optimize your study strategy.</CardDescription>
      </CardHeader>

      {/* Subjects List */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Subjects ({form.data.syllabus.length})</h4>
          <Button variant="outline" size="default" onClick={onAddSubject} className="flex items-center space-x-1 h-10">
            {' '}
            {/* Larger on Tablet */}
            <Plus className="h-4 w-4" />
            <span>Add Subject</span>
          </Button>
        </div>

        {/* Multi-course clarification alert */}
        {form.data.selectedCourses && form.data.selectedCourses.length > 1 && (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800 text-sm">
              Customizing syllabus for <strong>{primaryCourseName}</strong>. Other selected courses will use a standard
              recommended syllabus which you can customize later in your profile.
            </AlertDescription>
          </Alert>
        )}

        {form.data.syllabus.length === 0 ? (
          <Alert className="border-amber-200 bg-amber-50">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <AlertDescription className="text-amber-800">
              No subjects added yet. Click "Add Subject" to get started.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-3">
            {form.data.syllabus.map((subject: SyllabusSubject) => {
              const isExpanded = expandedSubjects.has(subject.id);
              return (
                <div
                  key={subject.id}
                  className="bg-white border rounded-lg overflow-hidden hover:shadow-sm transition-shadow"
                >
                  {/* Subject Header */}
                  <div className="flex items-center justify-between p-4">
                    <div className="flex items-center space-x-3 flex-1">
                      {/* Expand/Collapse Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => toggleSubjectExpansion(subject.id)}
                        className="h-10 w-10 p-0"
                      >
                        {isExpanded ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                      </Button>

                      {/* Subject Name */}
                      <div className="flex-1">
                        {editingSubject === subject.id ? (
                          <div className="flex items-center space-x-2">
                            <Input
                              value={tempSubjectName}
                              onChange={e => setTempSubjectName(e.target.value)}
                              className="flex-1"
                              autoFocus
                              onKeyDown={e => {
                                if (e.key === 'Enter') {
                                  saveSubjectName(subject.id);
                                }
                                if (e.key === 'Escape') {
                                  cancelEditing();
                                }
                              }}
                            />
                            <Button size="sm" variant="outline" onClick={() => saveSubjectName(subject.id)}>
                              <Save className="h-4 w-4" />
                            </Button>
                            <Button size="sm" variant="outline" onClick={cancelEditing}>
                              <X className="h-4 w-4" />
                            </Button>
                          </div>
                        ) : (
                          <div className="flex items-center space-x-2">
                            <span className="font-medium">{subject.name}</span>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => startEditing(subject.id, subject.name)}
                              className="h-10 w-10 p-0"
                            >
                              <Edit3 className="h-4 w-4" />
                            </Button>
                            <span className="text-sm text-gray-600">({subject.topics?.length || 0} topics)</span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center space-x-3">
                      {/* Remove Subject Button */}
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => onRemoveSubject(subject.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>

                  {/* Topics Section */}
                  {isExpanded && (
                    <div className="border-t bg-gray-50 p-4">
                      <div className="flex items-center justify-between mb-3">
                        <h5 className="font-medium text-sm text-gray-700">Topics</h5>
                        <Button size="sm" variant="outline" onClick={() => onAddTopic(subject.id)} className="text-xs">
                          <Plus className="h-3 w-3 mr-1" />
                          Add Topic
                        </Button>
                      </div>

                      {subject.topics && subject.topics.length > 0 ? (
                        <div className="space-y-2">
                          {subject.topics.map((topic: SyllabusTopic) => (
                            <div
                              key={topic.id}
                              className="flex items-center justify-between p-3 md:p-4 bg-white border rounded-md hover:shadow-sm transition-shadow"
                            >
                              <div className="flex items-center gap-2 flex-1">
                                <div className="p-3 -ml-3 md:p-4 md:-ml-4 cursor-grab opacity-50 hover:opacity-100 transition-opacity">
                                  {' '}
                                  {/* Increased touch target for tablet */}
                                  <GripVertical className="h-5 w-5 text-gray-400" />
                                </div>
                                {editingTopic === topic.id ? (
                                  <div className="flex items-center space-x-2 flex-1">
                                    <Input
                                      value={tempTopicName}
                                      onChange={e => setTempTopicName(e.target.value)}
                                      className="flex-1 text-sm"
                                      autoFocus
                                      onKeyDown={e => {
                                        if (e.key === 'Enter') {
                                          saveTopicName(subject.id, topic.id);
                                        }
                                        if (e.key === 'Escape') {
                                          cancelEditingTopic();
                                        }
                                      }}
                                    />
                                    <Button
                                      size="sm"
                                      variant="outline"
                                      onClick={() => saveTopicName(subject.id, topic.id)}
                                    >
                                      <Save className="h-3 w-3" />
                                    </Button>
                                    <Button size="sm" variant="outline" onClick={cancelEditingTopic}>
                                      <X className="h-3 w-3" />
                                    </Button>
                                  </div>
                                ) : (
                                  <div className="flex items-center space-x-2 flex-1">
                                    <span className="text-sm">{topic.name}</span>
                                    <Button
                                      size="sm"
                                      variant="ghost"
                                      onClick={() => startEditingTopic(topic.id, topic.name)}
                                      className="h-10 w-10 p-0"
                                    >
                                      <Edit3 className="h-4 w-4" />
                                    </Button>
                                    {topic.estimatedHours && (
                                      <span className="text-xs text-gray-500">({topic.estimatedHours}h)</span>
                                    )}
                                  </div>
                                )}
                              </div>

                              <Button
                                size="sm"
                                variant="ghost"
                                onClick={() => onRemoveTopic(subject.id, topic.id)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50 h-10 w-10 p-0"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          ))}
                        </div>
                      ) : (
                        <div className="text-center py-6 border-2 border-dashed border-gray-300 rounded-lg">
                          <Plus className="h-6 w-6 text-gray-400 mx-auto mb-2" />
                          <p className="text-sm text-gray-600 mb-2">No topics yet</p>
                          <Button size="sm" variant="outline" onClick={() => onAddTopic(subject.id)}>
                            Add First Topic
                          </Button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {form.errors.syllabus && (
        <Alert className="border-red-200 bg-red-50">
          <AlertCircle className="h-4 w-4 text-red-600" />
          <AlertDescription className="text-red-800">{form.errors.syllabus.message}</AlertDescription>
        </Alert>
      )}

      {/* Strategy Tips */}
      <Alert className="border-blue-200 bg-blue-50">
        <Info className="h-4 w-4 text-blue-600" />
        <AlertDescription className="text-blue-800">
          <div className="space-y-2">
            <p>
              <strong>Strategy Tip:</strong> {examTips.strategyTip}
            </p>
            <p>
              <strong>Topic Management:</strong> {examTips.topicManagement}
            </p>
          </div>
        </AlertDescription>
      </Alert>
    </CardContent>
  );
}

/**
 * Study Preferences Step
 */
interface PreferencesStepProps {
  form: UseFormReturn<OnboardingFormData>;
}

import { PREFERRED_STUDY_TIMES } from '@/lib/config/constants';
// ... (imports)

// ... (keep PreferencesStepProps)

export function PreferencesStep({ form }: PreferencesStepProps) {
  const [customInterval, setCustomInterval] = useState('');
  const {
    dailyStudyGoalMinutes,
    useWeekendSchedule,
    weekdayStudyMinutes,
    weekendStudyMinutes,
    preferredStudyTime,
    revisionIntervals,
  } = form.data.preferences;

  const addRevisionInterval = () => {
    const days = parseInt(customInterval);
    if (days > 0 && !revisionIntervals.includes(days)) {
      const newIntervals = [...revisionIntervals, days].sort((a, b) => a - b);
      form.updateField('preferences', {
        ...form.data.preferences,
        revisionIntervals: newIntervals,
      });
      setCustomInterval('');
    }
  };

  const removeRevisionInterval = (days: number) => {
    const newIntervals = revisionIntervals.filter((d: number) => d !== days);
    form.updateField('preferences', {
      ...form.data.preferences,
      revisionIntervals: newIntervals,
    });
  };

  const formatHours = (minutes: number) => {
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return `${h}h${m > 0 ? ` ${m}m` : ''}`;
  };

  const studyGoalHours = Math.floor(dailyStudyGoalMinutes / 60);
  const studyGoalMinutes = dailyStudyGoalMinutes % 60;

  return (
    <CardContent className="space-y-6">
      <CardHeader className="px-0 pt-0">
        <div className="flex items-center space-x-2">
          <Settings className="h-6 w-6 text-indigo-600" />
          <CardTitle>Study Preferences</CardTitle>
        </div>
        <CardDescription>Customize your study schedule and revision preferences for optimal learning.</CardDescription>
      </CardHeader>

      {/* Daily Study Goal */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Study Schedule</Label>

        {useWeekendSchedule && weekdayStudyMinutes && weekendStudyMinutes ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="p-4 bg-indigo-50 rounded-lg border border-indigo-100">
              <div className="text-sm text-indigo-600 font-medium mb-1">Weekdays (Mon-Fri)</div>
              <div className="text-2xl font-bold text-indigo-700">
                {formatHours(weekdayStudyMinutes)}
                <span className="text-base font-normal text-indigo-600 ml-1">/day</span>
              </div>
            </div>
            <div className="p-4 bg-purple-50 rounded-lg border border-purple-100">
              <div className="text-sm text-purple-600 font-medium mb-1">Weekends (Sat-Sun)</div>
              <div className="text-2xl font-bold text-purple-700">
                {formatHours(weekendStudyMinutes)}
                <span className="text-base font-normal text-purple-600 ml-1">/day</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="p-4 bg-gradient-to-r from-indigo-50 to-purple-50 rounded-lg flex items-center justify-between">
            <div>
              <div className="text-2xl font-bold text-indigo-700">
                {studyGoalHours}h {studyGoalMinutes > 0 ? `${studyGoalMinutes}m` : ''}
                <span className="text-base font-normal text-indigo-600 ml-1">per day</span>
              </div>
              <p className="text-xs text-indigo-600 mt-1">
                Set based on your schedule in Step 2. You can adjust this later in settings.
              </p>
            </div>
            <Target className="h-8 w-8 text-indigo-300" />
          </div>
        )}
      </div>

      {/* Preferred Study Time */}
      <div className="space-y-2">
        <Label className="text-sm font-medium">Preferred Study Time</Label>
        <Select
          value={preferredStudyTime}
          onValueChange={(value: any) =>
            form.updateField('preferences', {
              ...form.data.preferences,
              preferredStudyTime: value,
            })
          }
        >
          <SelectTrigger>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {PREFERRED_STUDY_TIMES.map((option) => (
              <SelectItem key={option.value} value={option.value}>
                <div className="flex items-center space-x-2">
                  <span>{option.icon}</span>
                  <span>{option.label}</span>
                </div>
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Revision Intervals */}
      <div className="space-y-4">
        <Label className="text-sm font-medium">Spaced Repetition Intervals (days)</Label>

        <div className="flex flex-wrap gap-2">
          {revisionIntervals.map((days: number) => (
            <Badge key={days} variant="secondary" className="flex items-center space-x-1 px-2 py-1">
              <span>{days}d</span>
              <button onClick={() => removeRevisionInterval(days)} className="ml-1 text-gray-500 hover:text-red-600">
                <X className="h-3 w-3" />
              </button>
            </Badge>
          ))}
        </div>

        <div className="flex space-x-2">
          <Input
            type="number"
            placeholder="Add interval (days)"
            value={customInterval}
            onChange={e => setCustomInterval(e.target.value)}
            onKeyDown={e => {
              if (e.key === 'Enter') {
                e.preventDefault();
                addRevisionInterval();
              }
            }}
            className="flex-1"
            min="1"
            max="365"
          />
          <Button onClick={addRevisionInterval} disabled={!customInterval}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>

        <Alert className="border-blue-200 bg-blue-50">
          <Info className="h-4 w-4 text-blue-600" />
          <AlertDescription className="text-blue-800 text-sm">
            Based on research: Review after 1, 3, 7, 16, and 35 days for optimal retention.
          </AlertDescription>
        </Alert>
      </div>

      {/* Summary */}
      <Alert className="border-green-200 bg-green-50">
        <CheckCircle className="h-4 w-4 text-green-600" />
        <AlertDescription className="text-green-800">
          <strong>Setup Complete!</strong> Your personalized strategy engine is ready. You can modify these settings
          anytime from your dashboard.
        </AlertDescription>
      </Alert>
    </CardContent>
  );
}
