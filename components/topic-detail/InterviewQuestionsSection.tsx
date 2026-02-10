'use client';

import { MessageSquareText } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import { ChevronDown, ChevronUp } from 'lucide-react';
import { useState } from 'react';
import { cn } from '@/lib/utils/utils';

interface QuestionObject {
  question: string;
  answer: string;
}

interface InterviewQuestionsSectionProps {
  questions: (string | QuestionObject)[];
}

function QuestionItem({ item, index }: { item: string | QuestionObject; index: number }) {
  const [isOpen, setIsOpen] = useState(false);
  const isObject = typeof item === 'object' && item !== null;
  const questionText = isObject ? (item as QuestionObject).question : (item as string);

  if (!isObject) {
    return (
      <div
        className="group relative bg-white rounded-xl border border-slate-200 p-5 transition-all duration-200 hover:border-indigo-300 hover:shadow-sm"
      >
        <div className="flex gap-4 items-start">
          <span className="flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg bg-slate-50 text-slate-500 font-mono text-sm font-medium border border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100 transition-colors">
            {index + 1}
          </span>
          <div className="flex-1 pt-1">
            <p className="text-slate-700 font-medium leading-relaxed group-hover:text-slate-900 transition-colors">
              {questionText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  // Render actionable accordion-like card for Q&A
  return (
    <div
      className={cn(
        "group relative bg-white rounded-xl border transition-all duration-200 overflow-hidden",
        isOpen ? "border-indigo-200 shadow-md ring-1 ring-indigo-50" : "border-slate-200 hover:border-indigo-300 hover:shadow-sm"
      )}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex gap-4 items-start text-left p-5 focus:outline-none"
      >
        <span className={cn(
          "flex-shrink-0 w-8 h-8 flex items-center justify-center rounded-lg font-mono text-sm font-medium border transition-colors",
          isOpen
            ? "bg-indigo-100 text-indigo-700 border-indigo-200"
            : "bg-slate-50 text-slate-500 border-slate-100 group-hover:bg-indigo-50 group-hover:text-indigo-600 group-hover:border-indigo-100"
        )}>
          {index + 1}
        </span>
        <div className="flex-1 pt-1">
          <p className={cn(
            "font-medium leading-relaxed transition-colors pr-8",
            isOpen ? "text-indigo-900" : "text-slate-700 group-hover:text-slate-900"
          )}>
            {questionText}
          </p>
        </div>
        <div className="flex-shrink-0 pt-1 text-slate-400 group-hover:text-indigo-500">
          {isOpen ? <ChevronUp className="h-5 w-5" /> : <ChevronDown className="h-5 w-5" />}
        </div>
      </button>

      {isOpen && (
        <div className="px-5 pb-5 pl-[4.5rem] animate-in slide-in-from-top-2 duration-200">
          <div className="prose prose-sm prose-slate max-w-none text-slate-600 bg-slate-50 p-4 rounded-lg border border-slate-100">
            <ReactMarkdown remarkPlugins={[remarkGfm]}>{(item as QuestionObject).answer}</ReactMarkdown>
          </div>
        </div>
      )}
    </div>
  );
}

export function InterviewQuestionsSection({ questions }: InterviewQuestionsSectionProps) {
  if (!questions || questions.length === 0) return null;

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center gap-3">
        <div className="bg-indigo-50 p-2 rounded-lg">
          <MessageSquareText className="h-5 w-5 text-indigo-600" />
        </div>
        <div>
          <h2 className="text-xl font-semibold text-slate-900">Interview Questions</h2>
          <p className="text-sm text-slate-500">Common questions asked in technical interviews</p>
        </div>
      </div>

      <div className="grid gap-4">
        {questions.map((item, idx) => (
          <QuestionItem key={idx} item={item} index={idx} />
        ))}
      </div>
    </div>
  );
}
