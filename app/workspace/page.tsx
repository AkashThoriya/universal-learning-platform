'use client';

import { Loader2, Menu, ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useRef, useEffect } from 'react';
import { type ImperativePanelHandle } from 'react-resizable-panels';

import { Button } from '@/components/ui/button';
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from '@/components/ui/resizable';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { WorkspaceCommandPalette } from '@/components/workspace/WorkspaceCommandPalette';
import { WorkspaceEditor } from '@/components/workspace/WorkspaceEditor';
import { WorkspaceList } from '@/components/workspace/WorkspaceList';
import { WorkspaceSidebar } from '@/components/workspace/WorkspaceSidebar';
import { useAuth } from '@/contexts/AuthContext';
import { WorkspaceProvider, useWorkspace } from '@/contexts/WorkspaceContext';
import { cn } from '@/lib/utils/utils';

export default function WorkspacePage() {
  return (
    <WorkspaceProvider>
      <WorkspaceApp />
    </WorkspaceProvider>
  );
}

function WorkspaceApp() {
  const { user, loading } = useAuth();
  const router = useRouter();

  // State for selected items (lifted up for layout-level control)
  const [selectedView, setSelectedView] = useState<'tasks' | 'notes'>('tasks');
  const [selectedNoteId, setSelectedNoteId] = useState<string | null>(null);
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null);

  // Imperative resizing
  const leftPanelRef = useRef<ImperativePanelHandle>(null);
  const middlePanelRef = useRef<ImperativePanelHandle>(null);

  // Get data and actions from context
  const { notes, tasks, createNote } = useWorkspace();

  // Resize View Logic
  useEffect(() => {
    const p = middlePanelRef.current;
    if (p) {
      if (selectedView === 'tasks') {
        p.resize(30); // Restore to 30% when tasks
      } else {
        p.collapse(); // Collapse to 0 when notes
      }
    }
  }, [selectedView]);

  // Shortcuts
  useEffect(() => {
    const down = async (e: KeyboardEvent) => {
      // Toggle Sidebar: Mod+B
      if ((e.key === 'b' || e.key === 'B') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        const p = leftPanelRef.current;
        if (p) {
          const size = p.getSize();
          if (size < 5) {
            p.expand();
          } else {
            p.collapse();
          }
        }
      }

      // New Item: Mod+N
      if ((e.key === 'n' || e.key === 'N') && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        if (selectedView === 'tasks') {
          // Focus Quick Add
          document.getElementById('task-quick-add')?.focus();
        } else {
          // Create New Note
          const id = await createNote(null);
          if (id) {
            setSelectedNoteId(id);
            setSelectedView('notes');
          }
        }
      }

      // Escape: Deselect current item
      if (e.key === 'Escape') {
        setSelectedNoteId(null);
        setSelectedTaskId(null);
      }
    };

    document.addEventListener('keydown', down);
    return () => document.removeEventListener('keydown', down);
  }, [selectedView, createNote, setSelectedNoteId, setSelectedView]);

  if (loading) {
    return (
      <div className="flex h-screen w-full items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    router.push('/login');
    return null;
  }

  // Mobile Back Handler
  const handleMobileBack = () => {
    setSelectedNoteId(null);
    setSelectedTaskId(null);
  };

  const isEditorOpen = !!(selectedNoteId || selectedTaskId);

  return (
    <div className="h-screen w-full bg-background overflow-hidden flex flex-col">
      {/* Command Palette (Cmd+K) */}
      <WorkspaceCommandPalette
        notes={notes}
        tasks={tasks}
        onSelectNote={setSelectedNoteId}
        onSelectTask={setSelectedTaskId}
        onSwitchView={setSelectedView}
      />

      {/* MOBILE HEADER (Visible only on mobile) */}
      <div className="md:hidden flex items-center p-4 border-b">
        {isEditorOpen ? (
          <Button variant="ghost" size="sm" onClick={handleMobileBack} className="gap-2 -ml-2">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        ) : (
          <>
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="-ml-2">
                  <Menu className="h-5 w-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="p-0 w-80">
                <WorkspaceSidebar
                  selectedView={selectedView}
                  onSelectView={v => {
                    setSelectedView(v);
                    // Close sheet logic? (Requires controlled sheet state, let's keep it simple for now)
                  }}
                  selectedNoteId={selectedNoteId}
                  onSelectNote={setSelectedNoteId}
                />
              </SheetContent>
            </Sheet>
            <h1 className="font-semibold ml-2">Workspace</h1>
          </>
        )}
      </div>

      {/* MOBILE LIST / EDITOR (Visible only on mobile) */}
      <div className="md:hidden flex-1 overflow-hidden">
        {isEditorOpen ? (
          <WorkspaceEditor view={selectedView} selectedNoteId={selectedNoteId} selectedTaskId={selectedTaskId} />
        ) : (
          <WorkspaceList
            view={selectedView}
            selectedNoteId={selectedNoteId}
            onSelectNote={setSelectedNoteId}
            selectedTaskId={selectedTaskId}
            onSelectTask={setSelectedTaskId}
          />
        )}
      </div>

      {/* DESKTOP LAYOUT (Hidden on mobile) */}
      <div className="hidden md:flex h-full w-full">
        <ResizablePanelGroup direction="horizontal" autoSaveId="workspace-layout">
          {/* LEFT PANE: Navigation */}
          <ResizablePanel
            ref={leftPanelRef}
            collapsible
            collapsedSize={0}
            id="left-panel"
            order={1}
            defaultSize={20}
            minSize={15}
            maxSize={30}
            className={cn('border-r transition-all duration-300 ease-in-out' /* Add transition for smooth toggle */)}
          >
            <WorkspaceSidebar
              selectedView={selectedView}
              onSelectView={setSelectedView}
              selectedNoteId={selectedNoteId}
              onSelectNote={setSelectedNoteId}
              onReset={() => {
                setSelectedNoteId(null);
                setSelectedTaskId(null);
              }}
            />
          </ResizablePanel>

          <ResizableHandle withHandle />

          {/* MIDDLE PANE: List (Collapsible for Notes view) */}
          <ResizablePanel
            ref={middlePanelRef}
            id="middle-panel"
            order={2}
            defaultSize={selectedView === 'tasks' ? 30 : 0}
            minSize={selectedView === 'tasks' ? 20 : 0}
            collapsible
            collapsedSize={0}
            className={selectedView === 'notes' ? 'hidden' : 'border-r'}
          >
            <WorkspaceList
              view={selectedView}
              selectedNoteId={selectedNoteId}
              onSelectNote={setSelectedNoteId}
              selectedTaskId={selectedTaskId}
              onSelectTask={setSelectedTaskId}
            />
          </ResizablePanel>

          {selectedView === 'tasks' && <ResizableHandle withHandle />}

          {/* RIGHT PANE: Content/Editor */}
          <ResizablePanel id="right-panel" order={3} defaultSize={selectedView === 'notes' ? 80 : 50} minSize={30}>
            <WorkspaceEditor
              view={selectedView}
              selectedNoteId={selectedNoteId}
              selectedTaskId={selectedTaskId}
              onSelectNote={setSelectedNoteId}
              onSelectView={setSelectedView}
            />
          </ResizablePanel>
        </ResizablePanelGroup>
      </div>
    </div>
  );
}
