import {
  Sparkles,
  Code,
  FileText,
  CheckCircle,
  ExternalLink,
  BookOpen,
  GraduationCap,
  Scale,
  CornerUpRight,
  Cpu,
  Microscope,
  PenLine,
} from 'lucide-react';
import { useState } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { cn } from '@/lib/utils/utils';
import { SyllabusTopic, TopicProgress } from '@/types/exam';

import { HandwrittenNotesTab } from './HandwrittenNotesTab';

// Helper to parse concept text into category and intent
function parseConcept(text: string): {
  category: string | null;
  content: string;
  icon: React.ReactNode;
  borderColor: string;
  textColor: string;
} {
  const normalized = text.toLowerCase().trim();

  if (normalized.startsWith('constraints:') || normalized.includes('complexity')) {
    const content = text.replace(/^(Constraints:|Time Complexity:|Space Complexity:)/i, '').trim();
    return {
      category: 'Constraint',
      content,
      icon: <Scale className="h-4 w-4" />,
      borderColor: 'border-rose-500',
      textColor: 'text-rose-600',
    };
  }

  if (normalized.startsWith('edge cases:')) {
    const content = text.replace(/^Edge Cases:/i, '').trim();
    return {
      category: 'Edge Case',
      content,
      icon: <CornerUpRight className="h-4 w-4" />,
      borderColor: 'border-amber-500',
      textColor: 'text-amber-600',
    };
  }

  if (normalized.startsWith('dry run:')) {
    const content = text.replace(/^Dry Run:/i, '').trim();
    return {
      category: 'Validation',
      content,
      icon: <Microscope className="h-4 w-4" />,
      borderColor: 'border-blue-500',
      textColor: 'text-blue-600',
    };
  }

  // Default / General Concept
  return {
    category: null, // No label for general insights to avoid repetition
    content: text.replace(/^DO NOT MISS:/i, '').trim(),
    icon: null,
    borderColor: 'border-slate-200', // Subtle neutral border
    textColor: 'text-slate-600',
  };
}

interface TopicContentTabsProps {
  topic: SyllabusTopic;
  progress: TopicProgress | null;
  userNotes: string;
  saving?: boolean;
  userId: string;
  onNotesChange: (value: string) => void;
  onSaveNotes: () => void;
  onToggleQuestion: (slug: string, link?: string, name?: string) => void;
}

export function TopicContentTabs({
  topic,
  progress,
  userNotes,
  saving,
  userId,
  onNotesChange,
  onSaveNotes,
  onToggleQuestion,
}: TopicContentTabsProps) {
  const [activeTab, setActiveTab] = useState('overview');

  return (
    <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden min-h-[60vh]">
      <Tabs defaultValue="overview" value={activeTab} onValueChange={setActiveTab} className="w-full">
        {/* Apple-style Tabs List */}
        <div className="border-b border-slate-100 px-2 sm:px-6 sticky top-0 bg-white/95 backdrop-blur z-20">
          <TabsList className="h-14 bg-transparent p-0 gap-6 sm:gap-8 overflow-x-auto w-full justify-start no-scrollbar relative">
            <TabTriggerItem value="overview" icon={<BookOpen size={18} />} label="Overview" />
            <TabTriggerItem value="concepts" icon={<Sparkles size={18} />} label="Key Concepts" />
            <TabTriggerItem
              value="practice"
              icon={<Code size={18} />}
              label="Practice"
              count={topic.practiceQuestions?.length || 0}
            />
            <TabTriggerItem value="notes" icon={<FileText size={18} />} label="Notes" />
            <TabTriggerItem value="handwritten" icon={<PenLine size={18} />} label="Handwritten" />
          </TabsList>
        </div>

        {/* Tab Content Area - with padding */}
        <div className="p-4 sm:p-6 lg:p-8">
          {/* Overview Tab */}
          <TabsContent value="overview" className="mt-0 space-y-8 animate-in fade-in duration-200">
            {/* Description - Enhanced Typography */}
            <div className="prose prose-slate max-w-none">
              <h3 className="text-xl font-medium text-slate-900 mb-4 tracking-tight">Introduction</h3>
              <p className="text-slate-600 leading-relaxed text-lg font-light antialiased">
                {topic.description || 'No description available for this topic yet.'}
              </p>
            </div>

            {/* Pro Tips - Insight Card Style */}
            {topic.learningTip && topic.learningTip.length > 0 && (
              <div className="bg-slate-50/50 rounded-lg p-6 border border-slate-100/50 relative overflow-hidden">
                <h3 className="text-sm font-bold text-slate-400 uppercase tracking-widest mb-5 flex items-center gap-2">
                  <Sparkles className="h-4 w-4" />
                  Pro Tips
                </h3>
                <ul className="space-y-4">
                  {topic.learningTip.map((tip, idx) => (
                    <li key={idx} className="flex gap-4 items-start">
                      <span className="flex-shrink-0 w-5 h-5 rounded-full bg-slate-200/50 text-slate-500 flex items-center justify-center text-[10px] font-bold mt-1">
                        {idx + 1}
                      </span>
                      <span className="text-slate-700 leading-relaxed font-medium">{tip}</span>
                    </li>
                  ))}
                </ul>
              </div>
            )}


          </TabsContent>

          {/* Concepts Tab - Zen List Style */}
          <TabsContent value="concepts" className="mt-0 space-y-8 animate-in fade-in duration-200">
            <div className="space-y-6">
              <div className="flex items-center justify-between border-b border-slate-100 pb-4">
                <div className="space-y-1">
                  <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Core Concepts</h3>
                  <p className="text-sm text-slate-500">Essential knowledge for this topic</p>
                </div>
              </div>

              {topic.mustNotMiss && topic.mustNotMiss.length > 0 ? (
                <div className="space-y-6">
                  {topic.mustNotMiss
                    .filter(concept => concept.toLowerCase().trim() !== 'do not miss:') // Filter out the header-only string
                    .map((conceptStr, idx) => {
                      const { category, content, borderColor, textColor } = parseConcept(conceptStr);

                      return (
                        <div key={idx} className={cn('pl-4 border-l-2', borderColor)}>
                          {category && (
                            <div className="flex items-center gap-2 mb-1.5">
                              <span className={cn('text-[10px] uppercase tracking-widest font-bold', textColor)}>
                                {category}
                              </span>
                            </div>
                          )}
                          <p
                            className={cn(
                              'leading-relaxed text-base font-medium max-w-prose',
                              category ? 'text-slate-800' : 'text-slate-700'
                            )}
                          >
                            {content}
                          </p>
                        </div>
                      );
                    })}
                </div>
              ) : (
                <div className="text-center py-20 bg-slate-50/30 rounded-lg border border-dashed border-slate-200">
                  <Cpu className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-slate-900 font-medium">No concepts listed.</p>
                </div>
              )}
            </div>
          </TabsContent>

          {/* Practice Tab - with Concept Mastery State */}
          <TabsContent value="practice" className="mt-0 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Practice Problems</h3>
              {topic.practiceQuestions && topic.practiceQuestions.length > 0 && (
                <p className="text-sm font-medium text-slate-500 bg-slate-100 px-3 py-1 rounded-full">
                  {progress?.solvedQuestions?.length || 0} <span className="text-slate-400">/</span>{' '}
                  {topic.practiceQuestions?.length || 0} Solved
                </p>
              )}
            </div>

            {topic.practiceQuestions && topic.practiceQuestions.length > 0 ? (
              <div className="space-y-3">
                {topic.practiceQuestions.map((question, idx) => {
                  const isSolved = progress?.solvedQuestions?.includes(question.slug);

                  return (
                    <div
                      key={question.slug || idx}
                      className={cn(
                        'group flex items-center justify-between p-4 rounded-xl border transition-all duration-200',
                        isSolved
                          ? 'bg-green-50/30 border-green-200 shadow-sm'
                          : 'bg-white border-slate-100 hover:border-blue-300 hover:shadow-md hover:shadow-blue-50'
                      )}
                    >
                      <div className="flex items-center gap-4">
                        <button
                          onClick={() => onToggleQuestion(question.slug, question.link, question.name)}
                          className={cn(
                            'w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all duration-300 transform',
                            isSolved
                              ? 'bg-green-500 border-green-500 text-white hover:scale-110'
                              : 'border-slate-300 text-transparent hover:border-blue-400 hover:scale-110'
                          )}
                        >
                          <CheckCircle
                            size={14}
                            fill="currentColor"
                            className={cn('transition-transform duration-300', isSolved ? 'scale-100' : 'scale-0')}
                          />
                        </button>

                        <div>
                          <div
                            className={cn(
                              'font-medium transition-colors duration-300 text-base',
                              isSolved
                                ? 'text-slate-500 line-through decoration-slate-300'
                                : 'text-slate-900 group-hover:text-blue-700'
                            )}
                          >
                            {question.name}
                          </div>
                          <div className="flex gap-2 mt-1.5">
                            <Badge
                              variant="secondary"
                              className={cn(
                                'text-[10px] px-2 py-0.5 h-auto font-medium shadow-sm border',
                                question.difficulty === 'Easy'
                                  ? 'bg-green-50 border-green-100 text-green-700'
                                  : question.difficulty === 'Medium'
                                    ? 'bg-amber-50 border-amber-100 text-amber-700'
                                    : 'bg-red-50 border-red-100 text-red-700'
                              )}
                            >
                              {question.difficulty}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <a
                        href={question.link}
                        target="_blank"
                        rel="noreferrer"
                        className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-all opacity-0 group-hover:opacity-100 focus:opacity-100 -translate-x-2 group-hover:translate-x-0"
                        title="Open Practice Problem"
                      >
                        <ExternalLink size={18} />
                      </a>
                    </div>
                  );
                })}
              </div>
            ) : (
              // Enhanced "Concept Focus" State - Zen Style
              <div className="py-16 px-6 bg-slate-50/50 rounded-xl border border-dashed border-slate-200 text-center relative overflow-hidden">
                <div className="relative z-10 max-w-md mx-auto space-y-4">
                  <div className="w-16 h-16 bg-white rounded-full shadow-sm flex items-center justify-center mx-auto mb-6 border border-slate-100">
                    <GraduationCap className="h-8 w-8 text-slate-400" />
                  </div>
                  <h4 className="text-xl font-semibold text-slate-900">Concept Mastery</h4>
                  <p className="text-slate-600 leading-relaxed">
                    This topic focuses on foundational knowledge. There are no coding problems here—your goal is to
                    understand the core principles thoroughly.
                  </p>
                  <div className="pt-4">
                    <Button
                      variant="outline"
                      className="border-slate-200 text-slate-700 bg-white hover:bg-slate-50"
                      disabled
                    >
                      Concept Focus Mode Active
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </TabsContent>

          {/* Notes Tab */}
          <TabsContent value="notes" className="mt-0 space-y-6 animate-in fade-in duration-200">
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xl font-semibold text-slate-900 tracking-tight">Personal Notes</h3>
              <Button
                onClick={onSaveNotes}
                disabled={saving}
                size="sm"
                className={cn('transition-all', saving ? 'opacity-80' : '')}
              >
                {saving ? 'Saving...' : 'Save Notes'}
              </Button>
            </div>

            <div className="min-h-[500px] border border-slate-200 rounded-xl bg-white overflow-hidden shadow-sm focus-within:ring-2 focus-within:ring-slate-100 transition-all">
              <MarkdownEditor value={userNotes} onChange={onNotesChange} minHeight="min-h-[500px]" />
            </div>
            <p className="text-xs text-slate-400 text-right font-medium">
              Markdown supported • Changes must be saved manually
            </p>
          </TabsContent>

          {/* Handwritten Notes Tab - Lazy Loaded */}
          <TabsContent value="handwritten" className="mt-0 animate-in fade-in duration-200">
            {activeTab === 'handwritten' && <HandwrittenNotesTab userId={userId} topicId={topic.id} />}
          </TabsContent>
        </div>
      </Tabs>
    </div>
  );
}

// Helper for Tab Triggers
function TabTriggerItem({
  value,
  icon,
  label,
  count,
}: {
  value: string;
  icon: React.ReactNode;
  label: string;
  count?: number;
}) {
  return (
    <TabsTrigger
      value={value}
      className="data-[state=active]:bg-transparent data-[state=active]:shadow-none data-[state=active]:border-b-2 data-[state=active]:border-blue-600 data-[state=active]:text-blue-700 rounded-none border-b-2 border-transparent px-1 py-4 h-full gap-2.5 text-slate-500 hover:text-slate-800 transition-colors group min-w-fit"
    >
      <div className="group-data-[state=active]:text-blue-600 transition-colors">{icon}</div>
      <span className="font-medium">{label}</span>
      {count !== undefined && count > 0 && (
        <span className="ml-1 text-[10px] py-0.5 px-1.5 bg-slate-100 text-slate-600 font-bold rounded-full border border-slate-200 group-data-[state=active]:bg-blue-50 group-data-[state=active]:text-blue-700 group-data-[state=active]:border-blue-100">
          {count}
        </span>
      )}
    </TabsTrigger>
  );
}
