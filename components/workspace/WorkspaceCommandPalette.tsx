'use client';

import { FileText, CheckSquare } from 'lucide-react';
import * as React from 'react';

import {
  CommandDialog,
  CommandInput,
  CommandList,
  CommandEmpty,
  CommandGroup,
  CommandItem,
} from '@/components/ui/command';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceNote, WorkspaceTask } from '@/lib/services/workspace-service';

interface WorkspaceCommandPaletteProps {
  notes: WorkspaceNote[];
  tasks: WorkspaceTask[];
  onSelectNote: (id: string) => void;
  onSelectTask: (id: string) => void;
  onSwitchView: (view: 'tasks' | 'notes') => void;
}

export function WorkspaceCommandPalette({
  notes,
  tasks,
  onSelectNote,
  onSelectTask,
  onSwitchView,
}: WorkspaceCommandPaletteProps) {
  const [open, setOpen] = React.useState(false);
  const [inputValue, setInputValue] = React.useState('');
  const { performSearch, isSearching } = useWorkspace();

  // Global cursor listener
  React.useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === 'k' && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        setOpen(prev => !prev);
      }
    };
    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, []);

  // Search Effect
  React.useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(inputValue);
    }, 300);
    return () => clearTimeout(timer);
  }, [inputValue, performSearch]);

  const handleSelectNote = (noteId: string) => {
    onSelectNote(noteId);
    onSwitchView('notes');
    setOpen(false);
  };

  const handleSelectTask = (taskId: string) => {
    onSelectTask(taskId);
    onSwitchView('tasks');
    setOpen(false);
  };

  return (
    <CommandDialog open={open} onOpenChange={setOpen}>
      <CommandInput placeholder="Search everything..." value={inputValue} onValueChange={setInputValue} />
      <CommandList>
        <CommandEmpty>{isSearching ? 'Searching...' : 'No results found.'}</CommandEmpty>

        {/* Notes Group (Local for now, unless we stick 'notes' search in context too) */}
        {notes.length > 0 && (
          <CommandGroup heading="Notes">
            {notes.slice(0, 5).map(note => (
              <CommandItem
                key={note.id}
                value={`note-${note.id}-${note.title}`}
                onSelect={() => handleSelectNote(note.id)}
              >
                <FileText className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">{note.title || 'Untitled Note'}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}

        {/* Tasks Group (Global Search Results if searching) */}
        {tasks.length > 0 && (
          <CommandGroup heading={inputValue ? 'Search Results (Tasks)' : 'Recent Tasks'}>
            {tasks.slice(0, 10).map(task => (
              <CommandItem
                key={task.id}
                value={`task-${task.id}-${task.title}`}
                onSelect={() => handleSelectTask(task.id)}
              >
                <CheckSquare className="mr-2 h-4 w-4 text-muted-foreground" />
                <span className="truncate">{task.title}</span>
                {task.status === 'done' && <span className="ml-auto text-xs text-green-500">Done</span>}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  );
}
