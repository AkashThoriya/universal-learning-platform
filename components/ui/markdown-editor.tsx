'use client';

import { FileText, Eye, Heading, Bold, Italic, List, ListOrdered, Quote, Code } from 'lucide-react';
import { useState } from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/utils';

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  minHeight?: string;
  className?: string;
  previewClassName?: string;
}

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = 'min-h-[300px]',
  className,
  previewClassName,
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>('write');

  const insertSyntax = (syntax: string, suffix: string = '') => {
    // A more robust insertion could be added here (using ref to get cursor position),
    // but for now, appending or simple wrapping is a quick win.
    // Ideally, we'd want to wrap selection.

    // For simplicity in this iteration, we'll append if empty, or wrap if we had a selection logic (omitted for brevity)
    // We will just append to end for now to keep it safe without refs complexity
    onChange(value + syntax + suffix);
  };

  return (
    <div
      className={cn(
        'group flex flex-col w-full border rounded-xl overflow-hidden bg-background transition-all duration-200',
        'focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary',
        className
      )}
    >
      {/* Unified Toolbar */}
      <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-muted/30 border-b">
        {/* Formatting Tools */}
        <div className="flex items-center gap-1">
          <ToolbarButton
            icon={Bold}
            label="Bold"
            onClick={() => insertSyntax('**', '**')}
            disabled={activeTab === 'preview'}
          />
          <ToolbarButton
            icon={Italic}
            label="Italic"
            onClick={() => insertSyntax('*', '*')}
            disabled={activeTab === 'preview'}
          />
          <div className="w-px h-5 bg-border mx-1" />
          <ToolbarButton
            icon={Heading}
            label="Heading"
            onClick={() => insertSyntax('### ')}
            disabled={activeTab === 'preview'}
          />
          <ToolbarButton
            icon={Quote}
            label="Quote"
            onClick={() => insertSyntax('> ')}
            disabled={activeTab === 'preview'}
          />
          <div className="w-px h-5 bg-border mx-1" />
          <ToolbarButton
            icon={List}
            label="List"
            onClick={() => insertSyntax('- ')}
            disabled={activeTab === 'preview'}
          />
          <ToolbarButton
            icon={ListOrdered}
            label="Ordered List"
            onClick={() => insertSyntax('1. ')}
            disabled={activeTab === 'preview'}
          />
          <ToolbarButton
            icon={Code}
            label="Code Block"
            onClick={() => insertSyntax('```\n', '\n```')}
            disabled={activeTab === 'preview'}
          />
        </div>

        {/* Mode Switcher (Segmented Control) */}
        <div className="flex items-center p-1 bg-muted rounded-lg">
          <button
            onClick={() => setActiveTab('write')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              activeTab === 'write'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <FileText className="h-3.5 w-3.5" />
            Write
          </button>
          <button
            onClick={() => setActiveTab('preview')}
            className={cn(
              'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all',
              activeTab === 'preview'
                ? 'bg-background text-foreground shadow-sm'
                : 'text-muted-foreground hover:text-foreground hover:bg-background/50'
            )}
          >
            <Eye className="h-3.5 w-3.5" />
            Preview
          </button>
        </div>
      </div>

      {/* Editor Content */}
      <div className={cn('relative w-full', minHeight)}>
        {activeTab === 'write' ? (
          <Textarea
            value={value}
            onChange={e => onChange(e.target.value)}
            placeholder={placeholder ?? 'Write your thoughts in markdown...'}
            className={cn(
              'w-full h-full min-h-[inherit] p-4 resize-y border-0 focus-visible:ring-0 rounded-none bg-transparent font-mono text-sm leading-relaxed'
            )}
            spellCheck={false}
          />
        ) : (
          <div className="h-full w-full min-h-[inherit] p-4 md:p-6 overflow-auto bg-muted/5">
            {value ? (
              <div className={cn('prose prose-sm dark:prose-invert max-w-none break-words', previewClassName)}>
                <ReactMarkdown remarkPlugins={[remarkGfm]}>{value}</ReactMarkdown>
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center h-full text-muted-foreground opacity-60 min-h-[200px]">
                <Eye className="h-10 w-10 mb-3 opacity-20" />
                <p>Nothing to preview yet</p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Footer / Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t text-[10px] sm:text-xs text-muted-foreground">
        <div className="flex gap-3">
          <span>Markdown Supported</span>
          {/* Could add word count here later */}
        </div>
        <div className="font-mono">{value.length} chars</div>
      </div>
    </div>
  );
}

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
  disabled,
}: {
  icon: any;
  label: string;
  onClick: () => void;
  disabled: boolean;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      disabled={disabled}
      className={cn(
        'h-8 w-8 p-0 text-muted-foreground hover:text-foreground',
        disabled && 'opacity-50 cursor-not-allowed'
      )}
      title={label}
      type="button"
    >
      <Icon className="h-4 w-4" />
    </Button>
  );
}
