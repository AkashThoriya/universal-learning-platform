import {
  collection,
  doc,
  getDocs,
  getDoc,
  addDoc,
  updateDoc,
  deleteDoc,
  query,
  orderBy,
  serverTimestamp,
  onSnapshot,
  limit,
  startAt,
  endAt,
  where,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/firebase';
import { logError } from '@/lib/utils/logger';

// Types
export interface WorkspaceNote {
  id: string;
  userId: string;
  title: string;
  content: string;
  parentId: string | null;
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
  tags: string[];
  isExpanded?: boolean; // For UI state
}

export interface WorkspaceTask {
  id: string;
  userId: string;
  title: string;
  description?: string;
  status: 'todo' | 'in-progress' | 'done';
  priority: 'low' | 'medium' | 'high';
  dueDate?: any; // Timestamp
  createdAt: any; // Timestamp
  updatedAt: any; // Timestamp
  tags: string[];
}

class WorkspaceService {
  // --- Notes Collections ---

  /**
   * Get all notes for a user
   */
  async getUserNotes(userId: string): Promise<WorkspaceNote[]> {
    try {
      const q = query(collection(db, 'users', userId, 'workspace_notes'), orderBy('updatedAt', 'desc'));

      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as WorkspaceNote
      );
    } catch (error) {
      logError('Error fetching user notes', error as Error);
      return [];
    }
  }

  /**
   * Subscribe to notes (Real-time)
   */
  /**
   * Subscribe to notes (Real-time)
   * If parentId is provided, subscribes to children of that note.
   * If parentId is null, subscribes to root notes.
   * If parentId is undefined, subscribes to ALL notes (Legacy behavior, discouraged for scale).
   */
  subscribeToNotes(userId: string, parentId: string | null | undefined, callback: (notes: WorkspaceNote[]) => void) {
    let q;

    if (parentId !== undefined) {
      // Lazy Load Mode: Fetch specific level
      q = query(
        collection(db, 'users', userId, 'workspace_notes'),
        where('parentId', '==', parentId),
        orderBy('updatedAt', 'desc')
      );
    } else {
      // Legacy/Global Mode (Careful with scale)
      q = query(collection(db, 'users', userId, 'workspace_notes'), orderBy('updatedAt', 'desc'));
    }

    return onSnapshot(
      q,
      snapshot => {
        const notes = snapshot.docs.map(
          doc =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as WorkspaceNote
        );
        callback(notes);
      },
      error => {
        logError('Error subscribing to notes', error as Error);
      }
    );
  }

  /**
   * Get a single note
   */
  async getNote(userId: string, noteId: string): Promise<WorkspaceNote | null> {
    try {
      const docRef = doc(db, 'users', userId, 'workspace_notes', noteId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as WorkspaceNote;
      }
      return null;
    } catch (error) {
      logError('Error fetching note', error as Error);
      return null;
    }
  }

  /**
   * Create a new note
   */
  async createNote(userId: string, activeNote: Partial<WorkspaceNote> = {}): Promise<string> {
    try {
      const noteData = {
        userId,
        title: activeNote.title || 'Untitled Note',
        content: activeNote.content || '',
        parentId: activeNote.parentId || null,
        tags: activeNote.tags || [],
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'users', userId, 'workspace_notes'), noteData);
      return docRef.id;
    } catch (error) {
      logError('Error creating note', error as Error);
      throw error;
    }
  }

  /**
   * Update an existing note
   */
  async updateNote(userId: string, noteId: string, updates: Partial<WorkspaceNote>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'workspace_notes', noteId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logError('Error updating note', error as Error);
      throw error;
    }
  }

  /**
   * Delete a note and recursively create a visual indication for children?
   * For now, just delete the note. Ideally we should handle orphans.
   */
  async deleteNote(userId: string, noteId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId, 'workspace_notes', noteId));
    } catch (error) {
      logError('Error deleting note', error as Error);
      throw error;
    }
  }

  // --- Tasks Collections ---

  /**
   * Subscribe to tasks (Real-time)
   */
  /**
   * Subscribe to tasks (Real-time) with Pagination
   */
  subscribeToTasks(userId: string, limitCount = 50, callback: (tasks: WorkspaceTask[]) => void) {
    const q = query(
      collection(db, 'users', userId, 'workspace_tasks'),
      orderBy('createdAt', 'desc'),
      limit(limitCount)
    );

    return onSnapshot(
      q,
      snapshot => {
        const tasks = snapshot.docs.map(
          doc =>
            ({
              id: doc.id,
              ...doc.data(),
            }) as WorkspaceTask
        );
        callback(tasks);
      },
      error => {
        logError('Error subscribing to tasks', error as Error);
      }
    );
  }

  /**
   * Search tasks globally (Server-side)
   * Note: Firestore only supports prefix search natively.
   */
  async searchTasks(userId: string, searchTerm: string): Promise<WorkspaceTask[]> {
    try {
      // Basic prefix search (Case sensitive in Firestore unfortunately, unless we store lowercase)
      // For MVP, we'll fetch a larger set and filter?
      // OR we just rely on Client-side filtering if the set is small enough?
      // NO, the requirement is "100s of tasks".
      // Best approach without external index: Store a 'keywords' array or just fetch recent 200 matches.
      // Let's implement a 'title' prefix query.

      const q = query(
        collection(db, 'users', userId, 'workspace_tasks'),
        orderBy('title'),
        startAt(searchTerm),
        endAt(`${searchTerm}\uf8ff`),
        limit(20)
      );

      const snapshot = await getDocs(q);
      return snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as WorkspaceTask
      );
    } catch (error) {
      console.error('Search failed', error);
      return [];
    }
  }

  /**
   * Get a single task
   */
  async getTask(userId: string, taskId: string): Promise<WorkspaceTask | null> {
    try {
      const docRef = doc(db, 'users', userId, 'workspace_tasks', taskId);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        return {
          id: docSnap.id,
          ...docSnap.data(),
        } as WorkspaceTask;
      }
      return null;
    } catch (error) {
      logError('Error fetching task', error as Error);
      return null;
    }
  }

  /**
   * Create a new task
   */
  async createTask(userId: string, task: Partial<WorkspaceTask>): Promise<string> {
    try {
      const taskData = {
        userId,
        title: task.title || 'New Task',
        status: task.status || 'todo',
        priority: task.priority || 'medium',
        description: task.description || '',
        tags: task.tags || [],
        dueDate: task.dueDate || null,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      const docRef = await addDoc(collection(db, 'users', userId, 'workspace_tasks'), taskData);
      return docRef.id;
    } catch (error) {
      logError('Error creating task', error as Error);
      throw error;
    }
  }

  /**
   * Update a task
   */
  async updateTask(userId: string, taskId: string, updates: Partial<WorkspaceTask>): Promise<void> {
    try {
      const docRef = doc(db, 'users', userId, 'workspace_tasks', taskId);
      await updateDoc(docRef, {
        ...updates,
        updatedAt: serverTimestamp(),
      });
    } catch (error) {
      logError('Error updating task', error as Error);
      throw error;
    }
  }

  /**
   * Delete a task
   */
  async deleteTask(userId: string, taskId: string): Promise<void> {
    try {
      await deleteDoc(doc(db, 'users', userId, 'workspace_tasks', taskId));
    } catch (error) {
      logError('Error deleting task', error as Error);
      throw error;
    }
  }
}

export const workspaceService = new WorkspaceService();
