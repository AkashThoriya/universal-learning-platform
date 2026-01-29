'use client';
import { CheckSquare, Plus, FilePlus } from 'lucide-react';
import { useState } from 'react';

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from '@/components/ui/tooltip';
import { NoteTree } from '@/components/workspace/NoteTree';
import { SidebarSkeleton } from '@/components/workspace/skeletons/SidebarSkeleton';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { cn } from '@/lib/utils/utils';

interface WorkspaceSidebarProps {
  selectedView: 'tasks' | 'notes';
  onSelectView: (view: 'tasks' | 'notes') => void;
  selectedNoteId: string | null;
  onSelectNote: (id: string) => void;
  onReset?: () => void;
}

export function WorkspaceSidebar({
  selectedView,
  onSelectView,
  selectedNoteId,
  onSelectNote,
  onReset,
}: WorkspaceSidebarProps) {
  const { notes, isLoadingNotes, createNote, deleteNote, updateNote } = useWorkspace();

  // Delete State
  const [deletingNoteId, setDeletingNoteId] = useState<string | null>(null);

  const handleCreateNote = async (parentId: string | null = null) => {
    const newNoteId = await createNote(parentId);
    if (newNoteId) {
      onSelectNote(newNoteId);
      onSelectView('notes');
    }
  };

  const confirmDeleteNote = async () => {
    if (!deletingNoteId) {
      return;
    }

    await deleteNote(deletingNoteId);
    if (selectedNoteId === deletingNoteId) {
      onSelectNote('');
    }
    setDeletingNoteId(null);
  };

  const handleMoveNote = async (noteId: string, newParentId: string | null) => {
    await updateNote(noteId, { parentId: newParentId });
  };

  return (
    <>
      <div className="flex flex-col h-full bg-muted/10">
        {/* Workspace Header */}
        <div className="p-4 border-b">
          <div className="flex items-center justify-between mb-4">
            <button
              onClick={onReset}
              className="font-semibold px-2 flex items-center gap-2 hover:bg-muted/50 rounded-md py-1 -ml-2 transition-colors"
            >
              <span className="w-6 h-6 rounded bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold">
                W
              </span>
              Workspace
            </button>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => handleCreateNote(null)}>
                    <Plus className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create New Note</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          {/* Core Navigation */}
          <SidebarItem
            icon={CheckSquare}
            label="My Tasks"
            active={selectedView === 'tasks'}
            onClick={() => onSelectView('tasks')}
            badge={null}
          />
        </div>

        {/* Folders & Notes Section */}
        <div className="flex-1 overflow-hidden flex flex-col pt-2">
          <div className="px-4 pb-2 flex items-center justify-center group justify-between">
            <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Notes</h3>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <button
                    onClick={() => handleCreateNote(null)}
                    className="opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FilePlus className="h-3.5 w-3.5 text-muted-foreground hover:text-foreground" />
                  </button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Create Root Page</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>

          <ScrollArea className="flex-1 px-2">
            {isLoadingNotes ? (
              <SidebarSkeleton />
            ) : notes.length === 0 ? (
              <div className="text-center p-4 text-xs text-muted-foreground">No notes yet. Create one!</div>
            ) : (
              <NoteTree
                notes={notes}
                parentId={null}
                selectedNoteId={selectedNoteId}
                onSelectNote={(id: string) => {
                  onSelectNote(id);
                  onSelectView('notes');
                }}
                onAddChild={handleCreateNote}
                onDeleteNote={setDeletingNoteId}
                onMoveNote={handleMoveNote}
              />
            )}
          </ScrollArea>
        </div>

        {/* User Profile / Settings (Optional) */}
        <div className="p-3 border-t mt-auto">{/* Placeholder for settings */}</div>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={!!deletingNoteId} onOpenChange={open => !open && setDeletingNoteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure?</AlertDialogTitle>
            <AlertDialogDescription>
              This action cannot be undone. This will permanently delete the note and any nested notes.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteNote}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

function SidebarItem({ icon: Icon, label, active, onClick, badge }: any) {
  return (
    <button
      onClick={onClick}
      className={cn(
        'flex w-full items-center gap-3 px-3 py-2 text-sm font-medium transition-all rounded-lg',
        active
          ? 'bg-primary text-primary-foreground shadow-sm'
          : 'text-muted-foreground hover:bg-muted hover:text-foreground'
      )}
    >
      <Icon className={cn('h-4 w-4', active ? 'text-primary-foreground' : '')} />
      <span className="flex-1 text-left truncate">{label}</span>
      {badge && <span className="text-[10px] bg-background/20 text-current px-1.5 py-0.5 rounded-full">{badge}</span>}
    </button>
  );
}
