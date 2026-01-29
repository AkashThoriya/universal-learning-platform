'use client';

import { isToday } from 'date-fns';
import { motion, AnimatePresence } from 'framer-motion';
import { MoreHorizontal, Maximize2, Minimize2, CheckCircle2, Trash2, Cloud, LayoutDashboard } from 'lucide-react';
import React, { useState, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import { DatePicker } from '@/components/ui/date-picker';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
} from '@/components/ui/dropdown-menu';
import { MarkdownEditor } from '@/components/ui/markdown-editor';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useDebounce } from '@/hooks/use-debounce';
import { cn } from '@/lib/utils/utils';

import { EditableTitle } from './EditableTitle';
import { SlashCommandMenu } from './SlashCommandMenu';

interface WorkspaceEditorProps {
  view: 'tasks' | 'notes';
  selectedNoteId: string | null;
  selectedTaskId: string | null;
  onSelectNote?: (id: string) => void;
  onSelectView?: (view: 'notes' | 'tasks') => void;
}

export function WorkspaceEditor({
  view,
  selectedNoteId,
  selectedTaskId,
  onSelectNote,
  onSelectView,
}: WorkspaceEditorProps) {
  // State
  // We'll keep local state for editing, but initialize from context
  const { notes, tasks, updateNote, updateTask, deleteNote, deleteTask } = useWorkspace();

  const [content, setContent] = useState('');
  const [title, setTitle] = useState('');

  const [saving, setSaving] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showHeader, setShowHeader] = useState(true);

  // Derived state to find active item
  const activeNote = notes.find(n => n.id === selectedNoteId) || null;
  const activeTask = tasks.find(t => t.id === selectedTaskId) || null;

  // Initialize editor when selection changes
  // We use a separate effect for initialization vs saving
  useEffect(() => {
    if (view === 'notes' && activeNote) {
      // Only update if ID changed to avoid overwriting typed content?
      // Actually simpler: just sync when ID changes.
      // But we need to handle reference stability.
      setTitle(t => (t !== activeNote.title ? activeNote.title : t));
      setContent(c => (c !== activeNote.content ? activeNote.content : c));
    } else if (view === 'tasks' && activeTask) {
      setTitle(t => (t !== activeTask.title ? activeTask.title : t));
      setContent(c => (c !== (activeTask.description || '') ? activeTask.description || '' : c));
    } else {
      setContent('');
      setTitle('');
    }
  }, [view, selectedNoteId, selectedTaskId, activeNote, activeTask]); // Dependencies should be specific

  // Need to be careful: if we type, we don't want the effect above to overwrite us
  // if background sync happens.
  // The context updates might come in slightly later.
  // Ideally, local state should win while editing.
  // For now, let's assume single-user and just rely on selection change triggers, checking if ID changed.

  // Track last saved state to detect dirty changes
  const lastSavedTitle = React.useRef(title);
  const lastSavedContent = React.useRef(content);
  const prevIdRef = React.useRef<string | null>(null);
  const prevViewRef = React.useRef<'tasks' | 'notes'>(view);

  useEffect(() => {
    const currentId = view === 'notes' ? selectedNoteId : selectedTaskId;

    // Check if we changed items
    if (currentId !== prevIdRef.current || view !== prevViewRef.current) {
      // 1. SAVE PREVIOUS before switching (if valid and dirty)
      const prevId = prevIdRef.current;
      const prevView = prevViewRef.current;

      if (prevId) {
        const isDirty = title !== lastSavedTitle.current || content !== lastSavedContent.current;
        if (isDirty) {
          if (prevView === 'notes') {
            // Only save if note still exists (wasn't just deleted)
            if (notes.some(n => n.id === prevId)) {
              updateNote(prevId, { title, content }).catch(e => console.error(e));
            }
          } else {
            // Only save if task still exists
            if (tasks.some(t => t.id === prevId)) {
              updateTask(prevId, { title, description: content }).catch(e => console.error(e));
            }
          }
        }
      }

      // 2. LOAD NEW
      prevIdRef.current = currentId;
      prevViewRef.current = view;

      if (view === 'notes' && activeNote) {
        setTitle(activeNote.title);
        setContent(activeNote.content);
        lastSavedTitle.current = activeNote.title;
        lastSavedContent.current = activeNote.content;
      } else if (view === 'tasks' && activeTask) {
        setTitle(activeTask.title);
        setContent(activeTask.description || '');
        lastSavedTitle.current = activeTask.title;
        lastSavedContent.current = activeTask.description || '';
      } else {
        setTitle('');
        setContent('');
        lastSavedTitle.current = '';
        lastSavedContent.current = '';
      }
    }
  }, [selectedNoteId, selectedTaskId, view, activeNote, activeTask, title, content, updateNote, updateTask]);

  // Debounce updates
  const debouncedContent = useDebounce(content, 1000);
  const debouncedTitle = useDebounce(title, 1000);

  // Mounted ref
  const isMounted = React.useRef(false);
  useEffect(() => {
    isMounted.current = true;
    return () => {
      isMounted.current = false;
    };
  }, []);

  // --- SAVE LOGIC ---
  const saveNote = async () => {
    if (!selectedNoteId || !activeNote) {
      return;
    }
    if (content === activeNote.content && title === activeNote.title) {
      return;
    }

    setSaving(true);
    try {
      await updateNote(selectedNoteId, { title, content });
      lastSavedTitle.current = title;
      lastSavedContent.current = content;
    } finally {
      if (isMounted.current) {
        setSaving(false);
      }
    }
  };

  const saveTask = async () => {
    if (!selectedTaskId || !activeTask) {
      return;
    }
    if (content === (activeTask.description || '') && title === activeTask.title) {
      return;
    }

    setSaving(true);
    try {
      await updateTask(selectedTaskId, { title, description: content });
      lastSavedTitle.current = title;
      lastSavedContent.current = content;
    } finally {
      if (isMounted.current) {
        setSaving(false);
      }
    }
  };

  // --- AUTO-SAVE LOGIC ---
  useEffect(() => {
    if ((view === 'notes' && selectedNoteId) || (view === 'tasks' && selectedTaskId)) {
      if (view === 'notes') {
        saveNote();
      } else {
        saveTask();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [debouncedContent, debouncedTitle]);

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 's') {
        e.preventDefault();
        if (view === 'notes') {
          saveNote();
        }
        if (view === 'tasks') {
          saveTask();
        }
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [view, content, title]);

  // --- ZEN MODE IDLE LOGIC ---
  useEffect(() => {
    if (!isFullscreen) {
      setShowHeader(true);
      return;
    }

    let timeout: NodeJS.Timeout;
    const handleActivity = () => {
      setShowHeader(true);
      clearTimeout(timeout);
      timeout = setTimeout(() => {
        setShowHeader(false);
      }, 2000); // Hide after 2s inactivity
    };

    window.addEventListener('mousemove', handleActivity);
    window.addEventListener('keydown', handleActivity);

    // Initial trigger
    handleActivity();

    return () => {
      window.removeEventListener('mousemove', handleActivity);
      window.removeEventListener('keydown', handleActivity);
      clearTimeout(timeout);
    };
  }, [isFullscreen]);

  // --- SLASH COMMAND LOGIC ---
  const [showSlashMenu, setShowSlashMenu] = useState(false);
  const [slashPosition, setSlashPosition] = useState({ top: 0, left: 0 });

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    // Detect '/'
    if (e.key === '/') {
      // Simple positioning for now (bottom left of cursor or just near bottom).
      // Real rich text editors calculate caret position coordinates.
      // We'll just mock it to appear nearby or fixed for this iteration.
      setShowSlashMenu(true);
      // In a real implementation, we'd use getBoundingClientRect of a dummy element at cursor
      setSlashPosition({ top: e.currentTarget.scrollTop + 50, left: 20 });
    } else {
      setShowSlashMenu(false);
    }
  };

  // This needs to be passed to the MarkdownEditor if it accepts custom key handlers.
  // Since we are using a simple wrapper, let's just assume we can overlay it for now
  // or add it to the wrapper.

  // 0. Dashboard View (Empty State)
  const { user } = useAuth();

  if (!selectedTaskId && !selectedNoteId) {
    const tasksDueToday = tasks.filter(t => t.dueDate && isToday(t.dueDate.toDate?.() || new Date(t.dueDate))).length;
    const pendingTasks = tasks.filter(t => t.status !== 'done').length;

    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-muted/5 p-8 animate-in fade-in duration-500">
        <div className="max-w-md w-full space-y-8">
          <div className="text-center space-y-2">
            <div className="w-16 h-16 bg-primary/10 rounded-2xl flex items-center justify-center mx-auto mb-4">
              <LayoutDashboard className="h-8 w-8 text-primary" />
            </div>
            <h2 className="text-2xl font-bold text-foreground">
              Good {new Date().getHours() < 12 ? 'morning' : new Date().getHours() < 18 ? 'afternoon' : 'evening'},{' '}
              {user?.displayName?.split(' ')[0] || 'there'}!
            </h2>
            <p className="text-muted-foreground">Here is your workspace summary for today.</p>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="bg-background border rounded-xl p-4 shadow-sm">
              <div className="text-3xl font-bold text-foreground mb-1">{tasksDueToday}</div>
              <div className="text-sm font-medium text-muted-foreground">Tasks Due Today</div>
            </div>
            <div className="bg-background border rounded-xl p-4 shadow-sm">
              <div className="text-3xl font-bold text-foreground mb-1">{pendingTasks}</div>
              <div className="text-sm font-medium text-muted-foreground">Pending Tasks</div>
            </div>
          </div>

          <div className="bg-background border rounded-xl p-4 shadow-sm">
            <h3 className="text-sm font-semibold mb-3 text-foreground">Recent Notes</h3>
            {notes.length === 0 ? (
              <p className="text-xs text-muted-foreground">No notes yet.</p>
            ) : (
              <ul className="space-y-2">
                {notes.slice(0, 3).map(note => (
                  <button
                    key={note.id}
                    onClick={() => {
                      if (onSelectNote) {
                        onSelectNote(note.id);
                      }
                      if (onSelectView) {
                        onSelectView('notes');
                      }
                    }}
                    className="flex w-full items-center gap-2 text-sm text-muted-foreground hover:text-primary hover:bg-muted/50 p-2 rounded-md transition-colors text-left"
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-blue-500/50" />
                    {note.title || 'Untitled Note'}
                  </button>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    );
  }

  // 1. Task View
  if (view === 'tasks') {
    if (selectedTaskId) {
      // Ensure task exists logic is handled by parent, but strict check here
      return (
        <div className="flex flex-col h-full">
          {/* Task Header */}
          <div className="flex items-center justify-between p-4 border-b">
            <EditableTitle
              value={title}
              onChange={setTitle}
              placeholder="Task Title"
              className="text-xl font-bold placeholder:text-muted-foreground/30"
            />
            <div className="flex items-center gap-2">
              {saving ? (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full">
                  <Cloud className="h-3 w-3 animate-bounce" />
                  <span>Saving...</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 opacity-50 hover:opacity-100 transition-opacity">
                  <CheckCircle2 className="h-3 w-3 text-green-500" />
                  <span>Saved</span>
                </div>
              )}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="ghost" size="icon">
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    className="text-red-600 focus:text-red-600 focus:bg-red-50"
                    onClick={() => {
                      if (selectedTaskId) {
                        deleteTask(selectedTaskId);
                      }
                    }}
                  >
                    <Trash2 className="mr-2 h-4 w-4" /> Delete Task
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Task Meta */}
          <div className="p-4 border-b bg-muted/10 grid grid-cols-3 gap-4">
            <div className="text-sm">
              <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">
                Status
              </span>
              <Select
                value={activeTask?.status || 'todo'}
                onValueChange={(val: any) => selectedTaskId && updateTask(selectedTaskId, { status: val })}
              >
                <SelectTrigger className="h-8 bg-background border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="todo">Todo</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="done">Done</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">
                Priority
              </span>
              <Select
                value={activeTask?.priority || 'medium'}
                onValueChange={(val: any) => selectedTaskId && updateTask(selectedTaskId, { priority: val })}
              >
                <SelectTrigger className="h-8 bg-background border-input">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="text-sm">
              <span className="text-muted-foreground block mb-1 text-xs uppercase tracking-wider font-semibold">
                Due Date
              </span>
              <DatePicker
                value={activeTask?.dueDate?.toDate?.() || (activeTask?.dueDate ? new Date(activeTask.dueDate) : null)}
                onChange={date => selectedTaskId && updateTask(selectedTaskId, { dueDate: date })}
                placeholder="Set due date"
              />
            </div>
          </div>

          {/* Task Description Editor */}
          <div className="flex-1 overflow-hidden p-4">
            <label className="text-xs font-semibold text-muted-foreground mb-2 block uppercase tracking-wider">
              Description
            </label>
            <div className="h-[calc(100%-2rem)] border rounded-xl overflow-hidden shadow-sm">
              <MarkdownEditor
                value={content}
                onChange={setContent}
                className="h-full border-0 rounded-none shadow-none"
                minHeight="h-full"
                onKeyDown={handleKeyDown}
              />
            </div>
          </div>
        </div>
      );
    }
  }

  // 2. Note View
  if (!selectedNoteId) {
    return (
      <div className="flex flex-col h-full items-center justify-center text-muted-foreground bg-muted/5 p-8 text-center animate-in fade-in duration-500">
        <div className="w-16 h-16 bg-muted rounded-full flex items-center justify-center mb-4">
          <MoreHorizontal className="h-8 w-8 text-muted-foreground/50" />
        </div>
        <h3 className="text-lg font-semibold mb-2">No Note Selected</h3>
        <p className="text-sm max-w-xs mx-auto">
          Select a note from the sidebar to start writing, or create a new one to capture your thoughts.
        </p>
      </div>
    );
  }

  const EditorContent = (
    <div
      className={cn(
        'flex flex-col h-full bg-background transition-all duration-300',
        isFullscreen ? 'max-w-4xl mx-auto w-full shadow-2xl rounded-xl border my-4 h-[95vh]' : ''
      )}
    >
      {/* Note Header */}
      <div
        className={cn(
          'flex items-center justify-between p-4 border-b transition-opacity duration-500',
          isFullscreen && !showHeader ? 'opacity-0 pointer-events-none delay-1000' : 'opacity-100'
        )}
      >
        <EditableTitle
          value={title}
          onChange={setTitle}
          placeholder="Untitled Note"
          className="text-2xl font-bold placeholder:text-muted-foreground/30"
        />
        <div className="flex items-center gap-2 flex-shrink-0">
          {saving ? (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground bg-muted/50 px-2 py-1 rounded-full mr-2">
              <Cloud className="h-3 w-3 animate-bounce" />
              <span>Saving...</span>
            </div>
          ) : (
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground px-2 py-1 opacity-50 hover:opacity-100 transition-opacity mr-2">
              <CheckCircle2 className="h-3 w-3 text-green-500" />
              <span>Saved</span>
            </div>
          )}

          <Button variant="ghost" size="icon" onClick={() => setIsFullscreen(!isFullscreen)} className="hover:bg-muted">
            {isFullscreen ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
          </Button>

          {!isFullscreen && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon">
                  <MoreHorizontal className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem
                  className="text-red-600 focus:text-red-600 focus:bg-red-50"
                  onClick={() => {
                    if (selectedNoteId) {
                      deleteNote(selectedNoteId);
                    }
                  }}
                >
                  <Trash2 className="mr-2 h-4 w-4" /> Delete Note
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Note Editor Body */}
      <div className="flex-1 overflow-hidden p-4">
        <div className={cn('h-full overflow-hidden', !isFullscreen && 'border rounded-xl shadow-sm')}>
          <MarkdownEditor
            value={content}
            onChange={setContent}
            className="h-full border-0 rounded-none shadow-none"
            minHeight="h-full"
            onKeyDown={handleKeyDown}
            initialMode="preview"
          />
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Regular View */}
      <div className={cn('flex flex-col h-full', isFullscreen ? 'opacity-0 pointer-events-none' : 'opacity-100')}>
        {!isFullscreen && EditorContent}
      </div>

      {/* Fullscreen Portal */}
      <AnimatePresence>
        {isFullscreen && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-background/80 backdrop-blur-sm flex items-center justify-center p-4"
          >
            {EditorContent}
            {showSlashMenu && (
              <SlashCommandMenu
                position={slashPosition}
                onSelect={cmd => {
                  setContent(prev => prev + cmd);
                  setShowSlashMenu(false);
                }}
              />
            )}
          </motion.div>
        )}
      </AnimatePresence>

      {/* Slash Menu for non-fullscreen (naive positioning) */}
      {!isFullscreen && showSlashMenu && (
        <SlashCommandMenu
          position={slashPosition}
          onSelect={cmd => {
            setContent(prev => prev + cmd);
            setShowSlashMenu(false);
          }}
        />
      )}
    </>
  );
}
