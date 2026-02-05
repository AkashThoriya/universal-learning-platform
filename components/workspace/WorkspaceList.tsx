'use client';

import confetti from 'canvas-confetti';
import { format, isToday, isTomorrow, isPast } from 'date-fns';
import { Plus, CheckCircle2, Circle, ListFilter, CalendarDays, Search } from 'lucide-react';
import { useState, useMemo, useRef, useEffect } from 'react';

import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuCheckboxItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { Input } from '@/components/ui/input';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { TaskListSkeleton } from '@/components/workspace/skeletons/TaskListSkeleton';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceTask } from '@/lib/services/workspace-service';
import { cn } from '@/lib/utils/utils';

interface WorkspaceListProps {
  view: 'tasks' | 'notes';
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  selectedTaskId: string | null;
  onSelectTask: (id: string) => void;
}

// Isolated Input Component for Performance
const TaskInput = ({
  onCreate,
  inputRef,
}: {
  onCreate: (title: string) => Promise<void>;
  inputRef: React.RefObject<HTMLInputElement>;
}) => {
  const [title, setTitle] = useState('');

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      return;
    }
    await onCreate(title);
    setTitle('');
  };

  return (
    <div className="flex items-center gap-2 w-full">
      <form onSubmit={handleCreate} className="relative w-full">
        <Input
          ref={inputRef}
          id="task-quick-add" // Stable ID (legacy support)
          placeholder="Add a new task..."
          value={title}
          onChange={e => setTitle(e.target.value)}
          className="pr-10"
        />
        <TooltipProvider>
          <Tooltip>
            <TooltipTrigger asChild>
              <Button
                type="submit"
                size="icon"
                variant="ghost"
                className="absolute right-0 top-0 h-10 w-10 text-muted-foreground hover:text-primary"
                disabled={!title.trim()}
              >
                <Plus className="h-5 w-5" />
              </Button>
            </TooltipTrigger>
            <TooltipContent>
              <p>Add Task</p>
            </TooltipContent>
          </Tooltip>
        </TooltipProvider>
      </form>
    </div>
  );
};

export function WorkspaceList({ view, onSelectTask, selectedTaskId }: WorkspaceListProps) {
  const { tasks, isLoadingTasks, createTask, updateTask, loadMoreTasks, hasMoreTasks, performSearch, isSearching } =
    useWorkspace();

  const [statusFilters, setStatusFilters] = useState<string[]>(['todo', 'in_progress']);
  const [sortByPriority, setSortByPriority] = useState(true);

  // Search State
  const [searchQuery, setSearchQuery] = useState('');

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      performSearch(searchQuery);
    }, 300);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  // Derived Tasks
  const filteredTasks = useMemo(() => {
    let result = tasks;

    // Only apply filters if NOT searching (Search should be global)
    // Wait, if search returns results, we might still want to filter by status?
    // Let's keep filters active on search results too for power users.
    if (statusFilters.length > 0) {
      result = result.filter(t => statusFilters.includes(t.status));
    }

    // Sort Logic
    result = result.sort((a, b) => {
      // 1. Active first, Done last
      if (a.status === 'done' && b.status !== 'done') {
        return 1;
      }
      if (a.status !== 'done' && b.status === 'done') {
        return -1;
      }

      // 2. Priority (if enabled)
      if (sortByPriority) {
        const priorityWeight = { high: 3, medium: 2, low: 1 };
        const weightA = priorityWeight[a.priority] || 1;
        const weightB = priorityWeight[b.priority] || 1;
        if (weightA !== weightB) {
          return weightB - weightA;
        } // Descending
      }

      // 3. Fallback to newest created or alpha
      return (a.title || '').localeCompare(b.title || '');
    });

    return result;
  }, [tasks, statusFilters, sortByPriority]);

  // Input Ref for Quick Add
  const taskInputRef = useRef<HTMLInputElement>(null);

  const handleCreateTask = async (title: string) => {
    const id = await createTask(title);
    if (id) {
      onSelectTask(id);
    }
  };

  const handleFocusInput = () => {
    if (taskInputRef.current) {
      taskInputRef.current.focus();
    }
  };

  const toggleTaskStatus = async (e: React.MouseEvent, task: WorkspaceTask) => {
    e.stopPropagation();
    const newStatus = task.status === 'done' ? 'todo' : 'done';

    if (newStatus === 'done') {
      confetti({
        particleCount: 40,
        spread: 70,
        origin: { y: 0.7, x: 0.5 },
        colors: ['#22c55e', '#3b82f6', '#f59e0b'],
      });
    }

    await updateTask(task.id, { status: newStatus });
  };

  if (view === 'notes') {
    return (
      <div className="flex flex-col h-full bg-background border-r">
        <div className="p-4 border-b">
          <h1 className="text-xl font-bold">Notes</h1>
        </div>
        <div className="flex-1 flex items-center justify-center text-muted-foreground text-sm p-4 text-center">
          Select a note from the sidebar to view or edit.
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full bg-background border-r">
      {/* Header */}
      <div className="p-4 border-b space-y-4">
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold">Tasks</h1>
          <div className="flex items-center gap-1">
            {/* Search Toggle or Input? Let's put a small Search Input here */}
            <div className="relative w-32 focus-within:w-48 transition-all duration-200 mr-2">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="h-8 pl-8 text-xs bg-muted/40 border-muted focus:bg-background transition-colors"
              />
            </div>

            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={handleFocusInput}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Quick Add Task</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="h-8 w-8">
                  <ListFilter className="h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuLabel>Filter Status</DropdownMenuLabel>
                <DropdownMenuCheckboxItem
                  checked={statusFilters.includes('todo')}
                  onCheckedChange={checked => {
                    setStatusFilters(prev => (checked ? [...prev, 'todo'] : prev.filter(s => s !== 'todo')));
                  }}
                >
                  Todo
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilters.includes('in_progress')}
                  onCheckedChange={checked => {
                    setStatusFilters(prev =>
                      checked ? [...prev, 'in_progress'] : prev.filter(s => s !== 'in_progress')
                    );
                  }}
                >
                  In Progress
                </DropdownMenuCheckboxItem>
                <DropdownMenuCheckboxItem
                  checked={statusFilters.includes('done')}
                  onCheckedChange={checked => {
                    setStatusFilters(prev => (checked ? [...prev, 'done'] : prev.filter(s => s !== 'done')));
                  }}
                >
                  Done
                </DropdownMenuCheckboxItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Sort</DropdownMenuLabel>
                <DropdownMenuCheckboxItem checked={sortByPriority} onCheckedChange={setSortByPriority}>
                  Priority (High first)
                </DropdownMenuCheckboxItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Quick Add (Isolated) */}
        <TaskInput onCreate={handleCreateTask} inputRef={taskInputRef} />
      </div>

      {/* Task List */}
      <ScrollArea className="flex-1 p-2">
        {isLoadingTasks || isSearching ? (
          <TaskListSkeleton />
        ) : filteredTasks.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-8 text-center h-full">
            {searchQuery ? (
              // Search Empty State
              <>
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 opacity-50">
                  <Search className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No tasks found for "{searchQuery}".</p>
                <Button variant="link" size="sm" onClick={() => setSearchQuery('')} className="mt-2">
                  Clear Search
                </Button>
              </>
            ) : statusFilters.includes('todo') && tasks.some(t => t.status === 'done') ? (
              // All tasks done case
              <div className="animate-in fade-in zoom-in duration-500">
                <div className="w-16 h-16 bg-green-100 dark:bg-green-900/20 rounded-full flex items-center justify-center mx-auto mb-4">
                  <div className="text-3xl">☕</div>
                </div>
                <h3 className="text-lg font-semibold text-foreground mb-1">All Caught Up!</h3>
                <p className="text-sm text-muted-foreground max-w-[200px] mx-auto">
                  You've completed all your pending tasks.
                </p>
              </div>
            ) : (
              // Regular empty state
              <>
                <div className="w-12 h-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-3 opacity-50">
                  <ListFilter className="h-6 w-6 text-muted-foreground" />
                </div>
                <p className="text-sm text-muted-foreground">No tasks match your filters.</p>
                <Button
                  variant="link"
                  size="sm"
                  onClick={() => setStatusFilters(['todo', 'in_progress', 'done'])}
                  className="mt-2"
                >
                  Clear filters
                </Button>
              </>
            )}
          </div>
        ) : (
          <div className="space-y-1 pb-4">
            {filteredTasks.map(task => (
              <div
                key={task.id}
                onClick={() => onSelectTask(task.id)}
                className={cn(
                  'group flex items-center gap-3 p-3 rounded-lg cursor-pointer transition-all border border-transparent',
                  selectedTaskId === task.id
                    ? 'bg-primary/5 border-l-4 border-l-primary shadow-sm' // Active State
                    : 'hover:bg-muted/50' // Inactive State
                )}
              >
                <button
                  onClick={e => toggleTaskStatus(e, task)}
                  className={cn(
                    'shrink-0 transition-colors',
                    task.status === 'done' ? 'text-green-500' : 'text-muted-foreground hover:text-foreground'
                  )}
                >
                  {task.status === 'done' ? <CheckCircle2 className="h-5 w-5" /> : <Circle className="h-5 w-5" />}
                </button>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p
                      className={cn(
                        'text-sm font-medium truncate',
                        task.status === 'done' && 'line-through text-muted-foreground'
                      )}
                    >
                      {task.title}
                    </p>
                    {task.priority && task.priority !== 'medium' && (
                      <span
                        className={cn(
                          'shrink-0 w-2 h-2 rounded-full',
                          task.priority === 'high' && 'bg-red-500',
                          task.priority === 'low' && 'bg-green-500'
                        )}
                        title={`${task.priority} priority`}
                      />
                    )}
                  </div>
                  {task.dueDate && (
                    <div
                      className={cn(
                        'flex items-center gap-1 text-xs mt-0.5',
                        task.status !== 'done' &&
                          isPast(task.dueDate.toDate?.() || new Date(task.dueDate)) &&
                          !isToday(task.dueDate.toDate?.() || new Date(task.dueDate))
                          ? 'text-red-500'
                          : isToday(task.dueDate.toDate?.() || new Date(task.dueDate))
                            ? 'text-orange-500'
                            : 'text-muted-foreground'
                      )}
                    >
                      <CalendarDays className="h-3 w-3" />
                      {isToday(task.dueDate.toDate?.() || new Date(task.dueDate))
                        ? 'Today'
                        : isTomorrow(task.dueDate.toDate?.() || new Date(task.dueDate))
                          ? 'Tomorrow'
                          : format(task.dueDate.toDate?.() || new Date(task.dueDate), 'MMM d')}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {/* Load More Button */}
            {!searchQuery && hasMoreTasks && (
              <div className="pt-2 flex justify-center">
                <Button variant="ghost" size="sm" onClick={loadMoreTasks} className="text-muted-foreground text-xs">
                  Load More Tasks
                </Button>
              </div>
            )}
          </div>
        )}
      </ScrollArea>
    </div>
  );
}
