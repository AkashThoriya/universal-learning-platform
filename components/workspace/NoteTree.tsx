'use client';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragOverlay,
  defaultDropAnimationSideEffects,
  DropAnimation,
  DragEndEvent,
  DragStartEvent,
  DragOverEvent,
} from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy, useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import { FileText, ChevronRight, ChevronDown, MoreHorizontal, Plus, GripVertical, Pin } from 'lucide-react';
import { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu';
import { useAuth } from '@/contexts/AuthContext';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { WorkspaceNote, workspaceService } from '@/lib/services/workspace-service';
import { cn } from '@/lib/utils/utils';

// ... (props interfaces)

const dropAnimation: DropAnimation = {
  sideEffects: defaultDropAnimationSideEffects({
    styles: {
      active: {
        opacity: '0.4',
      },
    },
  }),
};

// Lazy Logic Component
function LazyNoteBranch({ parentId, level, selectedNoteId, onSelectNote, onAddChild, onDeleteNote, onMoveNote }: any) {
  const { user } = useAuth();
  const [children, setChildren] = useState<WorkspaceNote[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.uid || !parentId) {
      return;
    }

    // Subscribe to children
    const unsubscribe = workspaceService.subscribeToNotes(user.uid, parentId, notes => {
      setChildren(notes);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [user, parentId]);

  if (loading) {
    return <div className="pl-6 py-1 text-xs text-muted-foreground">Loading...</div>;
  }

  if (children.length === 0) {
    return <div className="pl-6 py-1 text-xs text-muted-foreground">No pages inside</div>;
  }

  return (
    <NoteTree
      notes={children}
      parentId={parentId} // Pass strictly for recursion context if needed (though NoteTree filters by this, here we pass pre-filtered)
      level={level}
      selectedNoteId={selectedNoteId}
      onSelectNote={onSelectNote}
      onAddChild={onAddChild}
      onDeleteNote={onDeleteNote}
      onMoveNote={onMoveNote}
    />
  );
}

// Sortable Note Item Component
// Sortable Note Item Component
function SortableNoteItem({
  note,
  // notes prop removed
  level,
  selectedNoteId,
  onSelectNote,
  onAddChild,
  onDeleteNote,
  onMoveNote,
  expanded,
  toggleExpand,
  isOver,
}: any) {
  const { togglePinNote } = useWorkspace();
  // ... (useSortable hooks remain same)
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: note.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  // Lazy approach: We don't know if it has children until we look.
  // For now, assume folders MIGHT have children.
  // Ideally, we'd add a `childCount` field to the note document.
  // But for now, let's always show the chevron.
  // const hasChildren = true; // Unused
  const isExpanded = expanded[note.id];
  const paddingLeft = level * 12 + 8;

  return (
    <li ref={setNodeRef} style={style} className="relative transition-all">
      {isOver && !isDragging && <DropIndicator />}
      <div
        className={cn(
          'group flex items-center gap-1 py-1 pr-2 text-sm rounded-sm hover:bg-muted/50 cursor-pointer select-none transition-colors',
          selectedNoteId === note.id && 'bg-primary/10 text-primary hover:bg-primary/15',
          isDragging && 'opacity-30'
        )}
        style={{ paddingLeft: `${paddingLeft}px` }}
        onClick={() => onSelectNote(note.id)}
      >
        {/* ... (Drag Handle same) ... */}
        <div
          {...attributes}
          {...listeners}
          className="h-5 w-5 flex items-center justify-center rounded-sm opacity-0 group-hover:opacity-100 hover:bg-muted-foreground/10 cursor-grab transition-opacity"
          onClick={e => e.stopPropagation()}
        >
          <GripVertical className="h-3 w-3 text-muted-foreground" />
        </div>

        {/* Expand Toggle */}
        <div
          className={cn(
            'h-5 w-5 flex items-center justify-center rounded-sm hover:bg-muted-foreground/10 transition-colors'
          )}
          onClick={e => toggleExpand(e, note.id)}
        >
          {isExpanded ? (
            <ChevronDown className="h-3.5 w-3.5 text-muted-foreground" />
          ) : (
            <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
          )}
        </div>

        {/* Icon & Title & Actions (Same) */}
        <FileText
          className={cn(
            'h-4 w-4 shrink-0 transition-colors',
            selectedNoteId === note.id ? 'text-primary' : 'text-muted-foreground'
          )}
        />

        {note.isPinned && (
          <Pin className="h-3 w-3 text-orange-500 -rotate-45" />
        )}

        <span className="flex-1 truncate">{note.title || 'Untitled Note'}</span>

        {/* Actions Dropdown (Same) */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button className="h-5 w-5 opacity-0 group-hover:opacity-100 flex items-center justify-center hover:bg-background rounded-sm text-muted-foreground transition-all">
              <MoreHorizontal className="h-3 w-3" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="start" className="w-40">
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                onAddChild(note.id);
              }}
            >
              <Plus className="mr-2 h-4 w-4" /> Add Child Page
            </DropdownMenuItem>
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                togglePinNote(note.id, note.isPinned || false);
              }}
            >
              <Pin className="mr-2 h-4 w-4" /> {note.isPinned ? 'Unpin' : 'Pin to Top'}
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              onClick={e => {
                e.stopPropagation();
                onDeleteNote(note.id);
              }}
              className="text-red-600 focus:text-red-600 focus:bg-red-50"
            >
              Delete
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Lazy Load Children if Expanded */}
      {isExpanded && (
        <LazyNoteBranch
          parentId={note.id}
          level={level + 1}
          selectedNoteId={selectedNoteId}
          onSelectNote={onSelectNote}
          onAddChild={onAddChild}
          onDeleteNote={onDeleteNote}
          onMoveNote={onMoveNote}
        />
      )}
    </li>
  );
}

function DropIndicator() {
  return <div className="absolute top-0 left-0 w-full h-[2px] bg-primary rounded-full z-10 -translate-y-[1px]" />;
}

function DragOverlayItem({ note }: { note: any }) {
  return (
    <div className="flex items-center gap-1 py-1 pr-2 text-sm rounded-sm bg-background border shadow-md opacity-90 cursor-grabbing">
      <div className="h-5 w-5 flex items-center justify-center">
        <GripVertical className="h-3 w-3 text-muted-foreground" />
      </div>
      <div className="h-5 w-5 flex items-center justify-center">
        <ChevronRight className="h-3.5 w-3.5 text-muted-foreground" />
      </div>
      <FileText className="h-4 w-4 shrink-0 text-muted-foreground" />
      <span className="truncate">{note.title || 'Untitled Note'}</span>
    </div>
  );
}

export function NoteTree({
  notes,
  parentId,
  level = 0,
  selectedNoteId,
  onSelectNote,
  onAddChild,
  onDeleteNote,
  onMoveNote,
}: any) {
  // If lazy loaded, use notes directly. If not (root), filter by parentId logic?
  // Actually, 'notes' passed in here are specifically the siblings we want to render.
  // For Root: We passed 'rootNotes' (filtered by Context).
  // For Branch: We passed 'children' (filtered by Service).
  // So NO filtering needed inside this component anymore!
  const childNotes = notes; // Direct usage

  const [expanded, setExpanded] = useState<Record<string, boolean>>({});
  const [activeId, setActiveId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);

  // DND Sensors etc... (Same)
  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(KeyboardSensor)
  );

  const toggleExpand = (e: React.MouseEvent, noteId: string) => {
    e.stopPropagation();
    setExpanded(prev => ({ ...prev, [noteId]: !prev[noteId] }));
  };

  // Handlers (Same)
  const handleDragStart = (event: DragStartEvent) => {
    setActiveId(event.active.id as string);
  };
  const handleDragOver = (event: DragOverEvent) => {
    setOverId(event.over?.id as string | null);
  };
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    setActiveId(null);
    setOverId(null);
    if (over && active.id !== over.id && onMoveNote) {
      onMoveNote(active.id as string, parentId); // Logic might need adjustment for lazy?
      // Moving logic with lazy loading is tricky because 'parentId' isn't visible?
      // But we are in the context of the LIST where it was dropped.
      // So 'parentId' prop of THIS list is the new parent. Correct.
    }
  };

  if (childNotes.length === 0 && level > 0) {
    return null;
  } // Only hide if deep and empty? (Handled by LazyBranch "No pages" msg)

  const activeNote = activeId ? notes.find((n: any) => n.id === activeId) : null;

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={closestCenter}
      onDragStart={handleDragStart}
      onDragOver={handleDragOver}
      onDragEnd={handleDragEnd}
    >
      <SortableContext items={childNotes.map((n: any) => n.id)} strategy={verticalListSortingStrategy}>
        <ul className="space-y-0.5 relative">
          {childNotes.map((note: any) => (
            <SortableNoteItem
              key={note.id}
              note={note}
              level={level}
              selectedNoteId={selectedNoteId}
              onSelectNote={onSelectNote}
              onAddChild={onAddChild}
              onDeleteNote={onDeleteNote}
              onMoveNote={onMoveNote}
              expanded={expanded}
              toggleExpand={toggleExpand}
              isOver={overId === note.id}
            />
          ))}
        </ul>
      </SortableContext>

      {createPortal(
        <DragOverlay dropAnimation={dropAnimation}>
          {activeNote ? <DragOverlayItem note={activeNote} /> : null}
        </DragOverlay>,
        document.body
      )}
    </DndContext>
  );
}
