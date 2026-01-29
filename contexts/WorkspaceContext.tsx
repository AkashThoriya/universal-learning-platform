'use client';

import { get, set } from 'idb-keyval';
import React, { createContext, useContext, useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import { workspaceService, WorkspaceNote, WorkspaceTask } from '@/lib/services/workspace-service';

interface WorkspaceContextType {
  notes: WorkspaceNote[];
  tasks: WorkspaceTask[];
  isLoadingNotes: boolean;
  isLoadingTasks: boolean;
  createNote: (parentId?: string | null) => Promise<string | null>;
  deleteNote: (id: string) => Promise<void>;
  createTask: (title: string) => Promise<string | null>;
  updateTask: (id: string, updates: Partial<WorkspaceTask>) => Promise<void>;
  deleteTask: (id: string) => Promise<void>;
  updateNote: (id: string, updates: Partial<WorkspaceNote>) => Promise<void>;
  loadMoreTasks: () => void;
  hasMoreTasks: boolean;
  performSearch: (query: string) => Promise<void>;
  isSearching: boolean;
}

const WorkspaceContext = createContext<WorkspaceContextType | undefined>(undefined);

export function WorkspaceProvider({ children }: { children: React.ReactNode }) {
  const { user } = useAuth();
  const { toast } = useToast();

  const [notes, setNotes] = useState<WorkspaceNote[]>([]);
  const [tasks, setTasks] = useState<WorkspaceTask[]>([]);

  // Pagination & Search State
  const [taskLimit, setTaskLimit] = useState(50);
  const [searchResults, setSearchResults] = useState<WorkspaceTask[] | null>(null);
  const [isSearching, setIsSearching] = useState(false);

  const [isLoadingNotes, setIsLoadingNotes] = useState(true);
  const [isLoadingTasks, setIsLoadingTasks] = useState(true);

  // Subscribe to Notes & Tasks (Local-First Pattern)
  useEffect(() => {
    if (!user?.uid) {
      setNotes([]);
      setTasks([]);
      setIsLoadingNotes(false);
      setIsLoadingTasks(false);
      return;
    }

    // 1. Load from Cache immediately

    const runCache = async () => {
      try {
        const [cachedNotes, cachedTasks] = await Promise.all([
          get<WorkspaceNote[]>(`notes-${user.uid}`),
          get<WorkspaceTask[]>(`tasks-${user.uid}`),
        ]);
        if (cachedNotes) {
          setNotes(cachedNotes);
        }
        if (cachedTasks) {
          setTasks(cachedTasks);
        }
      } catch (err) {
        console.warn(err);
      }
    };
    runCache();

    const unsubscribeNotes = workspaceService.subscribeToNotes(user.uid, null, fetchedNotes => {
      setNotes(fetchedNotes);
      setIsLoadingNotes(false);
      set(`notes-${user.uid}`, fetchedNotes).catch(console.warn);
    });

    // Subscribe with Limit
    const unsubscribeTasks = workspaceService.subscribeToTasks(user.uid, taskLimit, fetchedTasks => {
      setTasks(fetchedTasks);
      setIsLoadingTasks(false);
      set(`tasks-${user.uid}`, fetchedTasks).catch(console.warn);
    });

    return () => {
      unsubscribeNotes();
      unsubscribeTasks();
    };
  }, [user, taskLimit]); // Re-subscribe when limit changes

  // Pagination Action
  const loadMoreTasks = () => {
    setTaskLimit(prev => prev + 50);
  };

  // Search Action
  const performSearch = async (query: string) => {
    if (!user?.uid) {
      return;
    }
    if (!query.trim()) {
      setSearchResults(null); // Clear search
      setIsSearching(false);
      return;
    }

    setIsSearching(true);
    const results = await workspaceService.searchTasks(user.uid, query);
    setSearchResults(results);
    setIsSearching(false);
  };

  // Actions
  const createNote = async (parentId: string | null = null) => {
    if (!user?.uid) {
      return null;
    }
    try {
      const id = await workspaceService.createNote(user.uid, { parentId, title: '' });
      return id;
    } catch (error) {
      toast({ title: 'Failed to create note', variant: 'destructive' });
      return null;
    }
  };

  const deleteNote = async (id: string) => {
    if (!user?.uid) {
      return;
    }
    try {
      await workspaceService.deleteNote(user.uid, id);
      toast({ title: 'Note deleted' });
    } catch (error) {
      toast({ title: 'Failed to delete note', variant: 'destructive' });
    }
  };

  const createTask = async (title: string) => {
    if (!user?.uid) {
      return null;
    }
    try {
      const id = await workspaceService.createTask(user.uid, { title, status: 'todo' });
      return id;
    } catch (error) {
      toast({ title: 'Failed to create task', variant: 'destructive' });
      return null;
    }
  };

  const updateTask = async (id: string, updates: Partial<WorkspaceTask>) => {
    if (!user?.uid) {
      return;
    }
    try {
      await workspaceService.updateTask(user.uid, id, updates);
    } catch (error) {
      toast({ title: 'Failed to update task', variant: 'destructive' });
    }
  };

  const deleteTask = async (id: string) => {
    if (!user?.uid) {
      return;
    }
    try {
      await workspaceService.deleteTask(user.uid, id);
      toast({ title: 'Task deleted' });
    } catch (error) {
      toast({ title: 'Failed to delete task', variant: 'destructive' });
    }
  };

  const updateNote = async (id: string, updates: Partial<WorkspaceNote>) => {
    if (!user?.uid) {
      return;
    }
    try {
      await workspaceService.updateNote(user.uid, id, updates);
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <WorkspaceContext.Provider
      value={{
        notes,
        tasks: searchResults || tasks, // Show search results if active, else paginated tasks
        isLoadingNotes,
        isLoadingTasks: isLoadingTasks || isSearching,
        createNote,
        deleteNote,
        createTask,
        updateTask,
        deleteTask,
        updateNote,
        loadMoreTasks,
        hasMoreTasks: tasks.length >= taskLimit && !searchResults, // Heuristic: If we got full limit, likely more exist
        performSearch,
        isSearching,
      }}
    >
      {children}
    </WorkspaceContext.Provider>
  );
}

export function useWorkspace() {
  const context = useContext(WorkspaceContext);
  if (context === undefined) {
    throw new Error('useWorkspace must be used within a WorkspaceProvider');
  }
  return context;
}
