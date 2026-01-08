'use client';

/**
 * @fileoverview Test Configuration Modal
 * 
 * Modal dialog for configuring adaptive test generation with
 * subject/topic selection and difficulty settings.
 */

import { useState, useEffect } from 'react';
import {
  Brain,
  BookOpen,
  Target,
  Zap,
  X,
} from 'lucide-react';

import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Badge } from '@/components/ui/badge';
import { useAuth } from '@/contexts/AuthContext';
import { getSyllabus } from '@/lib/firebase/firebase-utils';
import { MissionDifficulty } from '@/types/mission-system';

interface SyllabusSubject {
  id: string;
  name: string;
  topics: { id: string; name: string }[];
}

interface TestConfigModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onGenerate: (config: TestConfig) => void;
  isGenerating?: boolean;
  preSelectedSubject?: string;
  preSelectedTopic?: string;
}

export interface TestConfig {
  subjects: string[];
  topics: string[];
  difficulty: MissionDifficulty;
  questionCount: number;
  syllabusContext?: string | undefined;
}

const DIFFICULTY_OPTIONS: { value: MissionDifficulty; label: string; description: string }[] = [
  { value: 'beginner', label: 'Beginner', description: 'Basic recall & understanding' },
  { value: 'intermediate', label: 'Intermediate', description: 'Application of concepts' },
  { value: 'advanced', label: 'Advanced', description: 'Analysis & synthesis' },
  { value: 'expert', label: 'Expert', description: 'Evaluation & creation' },
];

export function TestConfigModal({
  open,
  onOpenChange,
  onGenerate,
  isGenerating = false,
  preSelectedSubject,
  preSelectedTopic,
}: TestConfigModalProps) {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [subjects, setSubjects] = useState<SyllabusSubject[]>([]);
  
  // Form state
  const [selectedSubject, setSelectedSubject] = useState<string>(preSelectedSubject || '');
  const [selectedTopics, setSelectedTopics] = useState<string[]>(preSelectedTopic ? [preSelectedTopic] : []);
  const [difficulty, setDifficulty] = useState<MissionDifficulty>('intermediate');
  const [questionCount, setQuestionCount] = useState(5);

  // Load syllabus data
  useEffect(() => {
    const loadSyllabus = async () => {
      if (!user?.uid || !open) return;
      
      try {
        setLoading(true);
        const syllabusData = await getSyllabus(user.uid);
        
        const mappedSubjects: SyllabusSubject[] = syllabusData.map((subject: any) => ({
          id: subject.id,
          name: subject.name,
          topics: subject.topics?.map((topic: any) => ({
            id: topic.id,
            name: topic.name,
          })) || [],
        }));
        
        setSubjects(mappedSubjects);
        
        // Set pre-selected values
        if (preSelectedSubject && !selectedSubject) {
          setSelectedSubject(preSelectedSubject);
        }
        if (preSelectedTopic && selectedTopics.length === 0) {
          setSelectedTopics([preSelectedTopic]);
        }
      } catch (error) {
        console.error('Failed to load syllabus:', error);
      } finally {
        setLoading(false);
      }
    };

    loadSyllabus();
  }, [user?.uid, open, preSelectedSubject, preSelectedTopic]);

  // Get topics for selected subject
  const availableTopics = subjects.find(s => s.id === selectedSubject)?.topics || [];

  // Handle topic toggle
  const handleTopicToggle = (topicId: string) => {
    setSelectedTopics(prev => 
      prev.includes(topicId)
        ? prev.filter(t => t !== topicId)
        : [...prev, topicId]
    );
  };

  // Handle subject change
  const handleSubjectChange = (subjectId: string) => {
    setSelectedSubject(subjectId);
    setSelectedTopics([]); // Clear topics when subject changes
  };

  // Handle generate
  const handleGenerate = () => {
    const subject = subjects.find(s => s.id === selectedSubject);
    const topicNames = selectedTopics
      .map(id => availableTopics.find(t => t.id === id)?.name)
      .filter(Boolean) as string[];

    const config: TestConfig = {
      subjects: [subject?.name || selectedSubject],
      topics: topicNames.length > 0 ? topicNames : [],
      difficulty,
      questionCount,
      syllabusContext: topicNames.length > 0 
        ? `Focus on: ${topicNames.join(', ')} from ${subject?.name}`
        : undefined,
    };

    onGenerate(config);
  };

  const canGenerate = selectedSubject && !isGenerating;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Brain className="h-5 w-5 text-purple-600" />
            Configure Smart Test
          </DialogTitle>
          <DialogDescription>
            Select subject, topics, and difficulty to generate a personalized test.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4">
          {/* Subject Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <BookOpen className="h-4 w-4" />
              Subject
            </Label>
            <Select
              value={selectedSubject}
              onValueChange={handleSubjectChange}
              disabled={loading}
            >
              <SelectTrigger>
                <SelectValue placeholder={loading ? 'Loading subjects...' : 'Select a subject'} />
              </SelectTrigger>
              <SelectContent>
                {subjects.map((subject) => (
                  <SelectItem key={subject.id} value={subject.id}>
                    {subject.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Topic Selection */}
          {selectedSubject && availableTopics.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Topics (optional)
              </Label>
              <p className="text-xs text-muted-foreground">
                Select specific topics or leave empty for all topics
              </p>
              <div className="flex flex-wrap gap-2 max-h-[150px] overflow-y-auto p-2 border rounded-lg bg-muted/30">
                {availableTopics.map((topic) => (
                  <Badge
                    key={topic.id}
                    variant={selectedTopics.includes(topic.id) ? 'default' : 'outline'}
                    className="cursor-pointer hover:bg-primary/80 transition-colors"
                    onClick={() => handleTopicToggle(topic.id)}
                  >
                    {topic.name}
                    {selectedTopics.includes(topic.id) && (
                      <X className="h-3 w-3 ml-1" />
                    )}
                  </Badge>
                ))}
              </div>
              {selectedTopics.length > 0 && (
                <p className="text-xs text-muted-foreground">
                  {selectedTopics.length} topic{selectedTopics.length > 1 ? 's' : ''} selected
                </p>
              )}
            </div>
          )}

          {/* Difficulty Selection */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Zap className="h-4 w-4" />
              Difficulty
            </Label>
            <div className="grid grid-cols-2 gap-2">
              {DIFFICULTY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setDifficulty(option.value)}
                  className={`p-3 rounded-lg border text-left transition-all ${
                    difficulty === option.value
                      ? 'border-primary bg-primary/10 ring-1 ring-primary'
                      : 'border-border hover:border-primary/50 hover:bg-muted/50'
                  }`}
                >
                  <div className="font-medium text-sm">{option.label}</div>
                  <div className="text-xs text-muted-foreground">{option.description}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Question Count */}
          <div className="space-y-3">
            <div className="flex items-center justify-between">
              <Label>Number of Questions</Label>
              <span className="text-sm font-medium text-primary">{questionCount}</span>
            </div>
            <Slider
              value={[questionCount]}
              onValueChange={([value]) => setQuestionCount(value ?? 5)}
              min={3}
              max={15}
              step={1}
              className="w-full"
            />
            <div className="flex justify-between text-xs text-muted-foreground">
              <span>3 (Quick)</span>
              <span>15 (Comprehensive)</span>
            </div>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={isGenerating}>
            Cancel
          </Button>
          <Button onClick={handleGenerate} disabled={!canGenerate}>
            {isGenerating ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                Generating...
              </>
            ) : (
              <>
                <Brain className="h-4 w-4 mr-2" />
                Generate Test
              </>
            )}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

export default TestConfigModal;
