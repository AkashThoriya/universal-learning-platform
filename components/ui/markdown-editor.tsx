'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Eye, Heading, Bold, Italic, List, ListOrdered, Quote, Code, Table, Link, Strikethrough, Minus, CheckSquare, Copy, Check, Sparkles } from 'lucide-react';
import { useState, useMemo, useRef, useCallback } from 'react';
import ReactMarkdown, { Components } from 'react-markdown';
import remarkGfm from 'remark-gfm';
import TurndownService from 'turndown';
import { gfm } from 'turndown-plugin-gfm';

import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { cn } from '@/lib/utils/utils';

// ============================================================================
// MEMOIZED CONSTANTS (Performance: avoid re-creation on every render)
// ============================================================================

/**
 * ReactMarkdown custom components for rendering tables with proper styling.
 * Extracted outside component to avoid recreation on each render.
 */
const MARKDOWN_COMPONENTS: Components = {
  table: ({ children }) => (
    <div className="my-4 w-full overflow-y-auto">
      <table className="w-full border-collapse border border-border text-sm">
        {children}
      </table>
    </div>
  ),
  thead: ({ children }) => <thead className="bg-muted/50">{children}</thead>,
  th: ({ children }) => (
    <th className="border border-border px-4 py-2 text-left font-semibold">
      {children}
    </th>
  ),
  td: ({ children }) => (
    <td className="border border-border px-4 py-2">{children}</td>
  ),
  // Code blocks with better styling
  code: ({ className, children, ...props }) => {
    const match = /language-(\w+)/.exec(className || '');
    const isInline = !match && !className;
    
    if (isInline) {
      return (
        <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono" {...props}>
          {children}
        </code>
      );
    }
    
    return (
      <code className={cn('block bg-muted/50 p-4 rounded-lg overflow-x-auto font-mono text-sm', className)} {...props}>
        {children}
      </code>
    );
  },
  pre: ({ children }) => (
    <pre className="bg-muted/50 rounded-lg overflow-x-auto my-4">
      {children}
    </pre>
  ),
};

/**
 * Animation variants for smooth mode transitions
 */
const CONTENT_VARIANTS = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

// ============================================================================
// COMPONENT PROPS
// ============================================================================

interface MarkdownEditorProps {
  value: string;
  onChange: (value: string) => void;
  initialMode?: 'write' | 'preview';
  placeholder?: string;
  minHeight?: string;
  className?: string;
  previewClassName?: string;
}

// ============================================================================
// MAIN COMPONENT
// ============================================================================

export function MarkdownEditor({
  value,
  onChange,
  placeholder,
  minHeight = 'min-h-[300px]',
  className,
  previewClassName,
  initialMode = 'write',
}: MarkdownEditorProps) {
  const [activeTab, setActiveTab] = useState<'write' | 'preview'>(initialMode);
  const [copied, setCopied] = useState(false);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // ============================================================================
  // MEMOIZED TURNDOWN SERVICE (Performance: initialize once)
  // ============================================================================
  const turndownService = useMemo(() => {
    const service = new TurndownService({
      headingStyle: 'atx',
      codeBlockStyle: 'fenced',
    });
    service.use(gfm);
    return service;
  }, []);

  // ============================================================================
  // COMPUTED VALUES
  // ============================================================================
  const wordCount = useMemo(() => {
    return value.trim().split(/\s+/).filter(Boolean).length;
  }, [value]);

  // ============================================================================
  // HANDLERS
  // ============================================================================

  /**
   * Insert markdown syntax at cursor position or wrap selected text
   */
  const insertSyntax = useCallback((prefix: string, suffix = '') => {
    const textarea = textareaRef.current;
    if (!textarea) {
      // Fallback: append to end
      onChange(value + prefix + suffix);
      return;
    }

    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const selectedText = value.substring(start, end);
    const textBefore = value.substring(0, start);
    const textAfter = value.substring(end);

    let newValue: string;
    let newCursorPos: number;

    if (selectedText) {
      // Wrap selected text
      newValue = textBefore + prefix + selectedText + suffix + textAfter;
      newCursorPos = start + prefix.length + selectedText.length + suffix.length;
    } else {
      // Insert at cursor
      newValue = textBefore + prefix + suffix + textAfter;
      newCursorPos = start + prefix.length;
    }

    onChange(newValue);

    // Restore cursor position after React re-render
    requestAnimationFrame(() => {
      textarea.focus();
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    });
  }, [value, onChange]);

  /**
   * Handle Paste: Smartly convert HTML to Markdown
   */
  const handlePaste = useCallback((e: React.ClipboardEvent<HTMLTextAreaElement>) => {
    const html = e.clipboardData.getData('text/html');
    if (html) {
      e.preventDefault();

      const markdown = turndownService.turndown(html);

      const textarea = e.currentTarget;
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const textBefore = value.substring(0, start);
      const textAfter = value.substring(end);

      onChange(textBefore + markdown + textAfter);
    }
  }, [value, onChange, turndownService]);

  /**
   * Handle keyboard shortcuts for formatting
   * Supports: Ctrl+B (bold), Ctrl+I (italic), Ctrl+K (link), Ctrl+E (code)
   *           Ctrl+Shift+S (strikethrough), Ctrl+Shift+K (code block)
   */
  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Check for Ctrl/Cmd key
    if (e.ctrlKey || e.metaKey) {
      // Ctrl+Shift combinations
      if (e.shiftKey) {
        switch (e.key.toLowerCase()) {
          case 's': // Strikethrough
            e.preventDefault();
            insertSyntax('~~', '~~');
            return;
          case 'k': // Code block
            e.preventDefault();
            insertSyntax('\n```\n', '\n```\n');
            return;
        }
      }
      
      // Ctrl-only combinations
      switch (e.key.toLowerCase()) {
        case 'b': // Bold
          e.preventDefault();
          insertSyntax('**', '**');
          break;
        case 'i': // Italic
          e.preventDefault();
          insertSyntax('*', '*');
          break;
        case 'k': // Link
          e.preventDefault();
          insertSyntax('[', '](url)');
          break;
        case 'e': // Inline code
          e.preventDefault();
          insertSyntax('`', '`');
          break;
        // Note: Ctrl+S is handled at the parent level for saving
      }
    }
  }, [insertSyntax]);

  /**
   * Copy content to clipboard
   */
  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  }, [value]);

  // ============================================================================
  // RENDER
  // ============================================================================

  return (
    <div
      className={cn(
        'group flex flex-col w-full border rounded-xl overflow-hidden bg-background transition-all duration-200',
        'focus-within:ring-2 focus-within:ring-primary/20 focus-within:border-primary',
        activeTab === 'preview' && 'border-muted bg-muted/5',
        className
      )}
    >
      {/* Toolbar - Only visible in Write mode */}
      {activeTab === 'write' && (
        <div className="flex flex-wrap items-center justify-between gap-2 p-2 bg-muted/30 border-b">
          {/* Formatting Tools */}
          <div className="flex items-center gap-1 flex-wrap">
            <ToolbarButton
              icon={Bold}
              label="Bold (Ctrl+B)"
              onClick={() => insertSyntax('**', '**')}
            />
            <ToolbarButton
              icon={Italic}
              label="Italic (Ctrl+I)"
              onClick={() => insertSyntax('*', '*')}
            />
            <ToolbarButton
              icon={Strikethrough}
              label="Strikethrough (Ctrl+Shift+S)"
              onClick={() => insertSyntax('~~', '~~')}
            />
            <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />
            <ToolbarButton
              icon={Heading}
              label="Heading"
              onClick={() => insertSyntax('### ')}
            />
            <ToolbarButton
              icon={Quote}
              label="Quote"
              onClick={() => insertSyntax('> ')}
            />
            <ToolbarButton
              icon={Code}
              label="Inline Code (Ctrl+E)"
              onClick={() => insertSyntax('`', '`')}
            />
            <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />
            <ToolbarButton
              icon={List}
              label="Bullet List"
              onClick={() => insertSyntax('- ')}
            />
            <ToolbarButton
              icon={ListOrdered}
              label="Numbered List"
              onClick={() => insertSyntax('1. ')}
            />
            <ToolbarButton
              icon={CheckSquare}
              label="Task List"
              onClick={() => insertSyntax('- [ ] ')}
            />
            <div className="w-px h-5 bg-border mx-1" aria-hidden="true" />
            <ToolbarButton
              icon={Link}
              label="Link (Ctrl+K)"
              onClick={() => insertSyntax('[', '](url)')}
            />
            <ToolbarButton
              icon={Table}
              label="Table"
              onClick={() =>
                insertSyntax('\n| Header 1 | Header 2 |\n| -------- | -------- |\n| Cell 1   | Cell 2   |\n')
              }
            />
            <ToolbarButton
              icon={Minus}
              label="Horizontal Rule"
              onClick={() => insertSyntax('\n---\n')}
            />
          </div>

          {/* Mode Switcher */}
          <div className="flex items-center p-1 bg-muted rounded-lg">
            <button
              onClick={() => setActiveTab('write')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all bg-background text-foreground shadow-sm"
              aria-pressed="true"
            >
              <FileText className="h-3.5 w-3.5" aria-hidden="true" />
              Write
            </button>
            <button
              onClick={() => setActiveTab('preview')}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-md transition-all text-muted-foreground hover:text-foreground hover:bg-background/50"
              aria-pressed="false"
            >
              <Eye className="h-3.5 w-3.5" aria-hidden="true" />
              Preview
            </button>
          </div>
        </div>
      )}

      {/* Preview Mode Header */}
      {activeTab === 'preview' && (
        <div className="flex items-center justify-between p-2 bg-primary/5 border-b border-primary/10">
          <span className="text-xs text-primary/70 font-medium flex items-center gap-1.5">
            <Eye className="h-3.5 w-3.5" aria-hidden="true" />
            Preview Mode
          </span>
          <div className="flex items-center gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={handleCopy}
              className="text-xs h-8"
              aria-label={copied ? 'Copied!' : 'Copy content'}
            >
              {copied ? (
                <>
                  <Check className="h-3.5 w-3.5 mr-1.5 text-green-500" aria-hidden="true" />
                  Copied!
                </>
              ) : (
                <>
                  <Copy className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
                  Copy
                </>
              )}
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setActiveTab('write')}
              className="text-xs h-8"
              aria-label="Switch to edit mode"
            >
              <FileText className="h-3.5 w-3.5 mr-1.5" aria-hidden="true" />
              Edit
            </Button>
          </div>
        </div>
      )}

      {/* Editor Content with Smooth Transitions */}
      <div className={cn('relative w-full', minHeight)}>
        <AnimatePresence mode="wait">
          {activeTab === 'write' ? (
            <motion.div
              key="write"
              variants={CONTENT_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="h-full w-full"
            >
              <Textarea
                ref={textareaRef}
                value={value}
                onChange={e => onChange(e.target.value)}
                placeholder={placeholder ?? 'Write your thoughts in markdown...'}
                className={cn(
                  'w-full h-full min-h-[inherit] p-4 resize-y border-0 focus-visible:ring-0 rounded-none bg-transparent font-mono text-sm leading-relaxed'
                )}
                spellCheck={false}
                onPaste={handlePaste}
                onKeyDown={handleKeyDown}
                aria-label="Markdown editor"
              />
            </motion.div>
          ) : (
            <motion.div
              key="preview"
              variants={CONTENT_VARIANTS}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.15, ease: 'easeOut' }}
              className="h-full w-full min-h-[inherit] p-4 md:p-6 overflow-auto cursor-text bg-gradient-to-b from-muted/5 to-transparent"
              onClick={() => setActiveTab('write')}
              role="button"
              tabIndex={0}
              onKeyDown={e => e.key === 'Enter' && setActiveTab('write')}
              aria-label="Preview content, click to edit"
            >
              {value ? (
                <div className={cn('prose prose-sm dark:prose-invert max-w-none break-words', previewClassName)}>
                  <ReactMarkdown
                    remarkPlugins={[remarkGfm]}
                    components={MARKDOWN_COMPONENTS}
                  >
                    {value}
                  </ReactMarkdown>
                </div>
              ) : (
                <EmptyPreviewState />
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Footer / Status Bar */}
      <div className="flex items-center justify-between px-3 py-2 bg-muted/30 border-t text-[10px] sm:text-xs text-muted-foreground">
        <div className="flex gap-3">
          <span>Markdown Supported</span>
        </div>
        <div className="flex gap-3 font-mono">
          <span>{wordCount} {wordCount === 1 ? 'word' : 'words'}</span>
          <span className="text-muted-foreground/50">•</span>
          <span>{value.length} {value.length === 1 ? 'char' : 'chars'}</span>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// EMPTY PREVIEW STATE WITH MARKDOWN EXAMPLES
// ============================================================================

function EmptyPreviewState() {
  return (
    <div className="flex flex-col items-center justify-center h-full text-muted-foreground min-h-[200px]">
      <div className="max-w-md w-full space-y-6 text-center">
        <div className="space-y-2">
          <Sparkles className="h-10 w-10 mx-auto opacity-30" aria-hidden="true" />
          <p className="text-sm font-medium">Nothing to preview yet</p>
          <p className="text-xs opacity-70">Start typing to see your markdown rendered</p>
        </div>
        
        {/* Markdown Cheat Sheet */}
        <div className="text-left bg-muted/30 rounded-lg p-4 text-xs space-y-2">
          <p className="font-medium text-foreground/70 mb-3">Quick Reference:</p>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1.5 font-mono">
            <span className="text-muted-foreground">**bold**</span>
            <span className="font-bold">bold</span>
            
            <span className="text-muted-foreground">*italic*</span>
            <span className="italic">italic</span>
            
            <span className="text-muted-foreground">~~strike~~</span>
            <span className="line-through">strike</span>
            
            <span className="text-muted-foreground">`code`</span>
            <span className="bg-muted px-1 rounded">code</span>
            
            <span className="text-muted-foreground">[link](url)</span>
            <span className="text-primary underline">link</span>
            
            <span className="text-muted-foreground">- list item</span>
            <span>• list item</span>
          </div>
          
          <div className="pt-2 border-t border-border/50 mt-3 text-[10px] text-muted-foreground/70">
            <p>Shortcuts: <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+B</kbd> Bold, <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+I</kbd> Italic, <kbd className="px-1 py-0.5 bg-muted rounded">Ctrl+K</kbd> Link</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// TOOLBAR BUTTON COMPONENT
// ============================================================================

function ToolbarButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: any;
  label: string;
  onClick: () => void;
}) {
  return (
    <Button
      variant="ghost"
      size="sm"
      onClick={onClick}
      className="h-8 w-8 p-0 text-muted-foreground hover:text-foreground"
      title={label}
      aria-label={label}
      type="button"
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
    </Button>
  );
}
