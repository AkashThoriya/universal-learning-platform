/**
 * @fileoverview Event-Driven Consistency Engine (Habit Tracker)
 *
 * Singleton service that manages system and custom habits.
 * System habits auto-track platform events (topic completions, tests).
 * Custom habits are user-defined with manual toggle/increment.
 *
 * Firestore path: users/{userId}/habits/{habitId}
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  writeBatch,
  Timestamp,
  serverTimestamp,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/firebase';
import { logError, logInfo } from '@/lib/utils/logger';
import { createError, createSuccess, type Result } from '@/lib/utils/types-utils';
import type {
  HabitDocument,
  HabitEvent,
  HabitStats,
  CreateHabitInput,
  HabitEventType,
} from '@/types/habit';
import { habitHistoryService } from './habit-history';

// ============================================
// Day Key Helper
// ============================================

/** Returns today's date in YYYY-MM-DD format using the user's local timezone */
function getTodayKey(): string {
  return new Date().toLocaleDateString('en-CA');
}



// ============================================
// Default System Habits Configuration
// ============================================

interface DefaultHabitConfig {
  title: string;
  description: string;
  icon: string;
  linkedEventId: HabitEventType;
  targetValue: number;
  frequency: 'DAILY' | 'WEEKLY'; // Added frequency to config
}

const DEFAULT_SYSTEM_HABITS: DefaultHabitConfig[] = [
  {
    title: 'Study Topics',
    description: 'Complete syllabus topics to build knowledge',
    icon: 'BookOpen',
    linkedEventId: 'TOPIC_COMPLETED',
    targetValue: 3,
    frequency: 'DAILY',
  },
  {
    title: 'Take Tests',
    description: 'Practice with adaptive tests to sharpen skills',
    icon: 'Brain',
    linkedEventId: 'TEST_COMPLETED',
    targetValue: 1,
    frequency: 'WEEKLY', // Changed to WEEKLY per user request
  },
];

// ============================================
// HabitEngine Service
// ============================================

class HabitEngine {
  private static instance: HabitEngine;

  private constructor() {}

  static getInstance(): HabitEngine {
    if (!HabitEngine.instance) {
      HabitEngine.instance = new HabitEngine();
    }
    return HabitEngine.instance;
  }

  // --- Collection Path Helper ---
  private habitsPath(userId: string): string {
    return `users/${userId}/habits`;
  }

  // ============================================
  // processEvent — Auto-update system habits
  // ============================================

  /**
   * Process a platform event and update all matching system habits.
   * Uses Firestore writeBatch for atomic multi-document updates.
   */
  async processEvent(event: HabitEvent): Promise<Result<void>> {
    try {
      const habitsRef = collection(db, this.habitsPath(event.userId));
      const q = query(
        habitsRef,
        where('linkedEventId', '==', event.eventType),
        where('isActive', '==', true)
      );

      const snapshot = await getDocs(q);

      // Auto-initialize if system habit doesn't exist
      if (snapshot.empty) {
        const isSystemEvent = DEFAULT_SYSTEM_HABITS.some(h => h.linkedEventId === event.eventType);
        if (isSystemEvent) {
            logInfo('Auto-initializing default habits for event', { userId: event.userId, eventType: event.eventType });
            await this.initializeDefaultHabits(event.userId, event.courseId ?? null);
            
            // Re-fetch after initialization
            const retrySnapshot = await getDocs(q);
            if (!retrySnapshot.empty) {
                return this.processEventWithSnapshot(retrySnapshot, event);
            }
        }
        
        logInfo('No habits matched event', { eventType: event.eventType });
        return createSuccess(undefined);
      }

      return this.processEventWithSnapshot(snapshot, event);
    } catch (error) {
      logError('Failed to process habit event', {
        userId: event.userId,
        eventType: event.eventType,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return createError(error instanceof Error ? error : new Error('Failed to process event'));
    }
  }

  /**
   * Internal helper to process the update once we have the snapshot
   */
  private async processEventWithSnapshot(snapshot: any, event: HabitEvent): Promise<Result<void>> {
    try {
      const todayKey = getTodayKey();
      const batch = writeBatch(db);

      snapshot.docs.forEach((docSnap: any) => {
        const habit = { id: docSnap.id, ...docSnap.data() } as HabitDocument;
        const incrementValue = event.value ?? 1;

        // Check if we need to reset for a new period (Day vs Week)
        const lastUpdate = habit.updatedAt ? habit.updatedAt.toDate() : new Date();
        const lastDateStr = lastUpdate.toLocaleDateString('en-CA');
        
        let isNewPeriod = false;
        if (habit.frequency === 'WEEKLY') {
            const getStartOfWeek = (d: Date) => {
                const date = new Date(d);
                const day = date.getDay();
                const diff = date.getDate() - day + (day === 0 ? -6 : 1);
                return new Date(date.setDate(diff));
            };
            const currentWeekStart = getStartOfWeek(new Date()).toISOString().split('T')[0];
            const lastUpdateWeekStart = getStartOfWeek(lastUpdate).toISOString().split('T')[0];
            isNewPeriod = currentWeekStart !== lastUpdateWeekStart;
        } else {
            // DAILY
            isNewPeriod = lastDateStr !== todayKey;
        }

        // If it's a new period, reset currentValue
        const baseValue = isNewPeriod ? 0 : habit.currentValue;
        const newValue = baseValue + incrementValue;
        const metTarget = newValue >= habit.targetValue;

        let newStreak = habit.currentStreak;
        let newLongest = habit.longestStreak;

        // Only increment streak when crossing threshold for the first time today
        if (metTarget && !habit.isCompletedToday) {
          newStreak += 1;
          newLongest = Math.max(newStreak, newLongest);
        }

        batch.update(docSnap.ref, {
          currentValue: newValue,
          isCompletedToday: metTarget,
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastCompletedDate: metTarget ? serverTimestamp() : habit.lastCompletedDate,
          [`history.${todayKey}`]: newValue,
          updatedAt: serverTimestamp(),
        });

        // Dual-Write: Log to sub-collection
        habitHistoryService.logActivity(
            habit.userId,
            habit.id,
            {
                habitId: habit.id,
                userId: habit.userId,
                date: todayKey,
                value: incrementValue,
                action: 'SYSTEM_EVENT',
                metadata: { eventType: event.eventType }
            },
            batch
        );
      });

      await batch.commit();

      logInfo('Habit event processed', {
        userId: event.userId,
        eventType: event.eventType,
        habitsUpdated: snapshot.size,
      });

      return createSuccess(undefined);
    } catch (error) {
        throw error; // Re-throw to be caught by the caller
    }
  }

  // ============================================
  // validateStreaks — Midnight reset logic
  // ============================================

  /**
   * Client-side streak validation. Called on first load via useHabits hook.
   * Compares lastCompletedDate against yesterday — if older, resets streak.
   * Also resets currentValue to 0 for a new day.
   */
  async validateStreaks(userId: string): Promise<Result<void>> {
    try {
      const habitsRef = collection(db, this.habitsPath(userId));
      const q = query(habitsRef, where('isActive', '==', true));
      const snapshot = await getDocs(q);

      if (snapshot.empty) return createSuccess(undefined);

      const todayKey = getTodayKey();
      const batch = writeBatch(db);
      let updatesNeeded = false;

      // Helper to check if date is in current week (starts Monday)
      const getStartOfWeek = (d: Date) => {
        const date = new Date(d);
        const day = date.getDay();
        const diff = date.getDate() - day + (day === 0 ? -6 : 1); // Adjust when day is Sunday
        return new Date(date.setDate(diff));
      };
      
      const startOfCurrentWeek = getStartOfWeek(new Date()).toISOString().split('T')[0];

      snapshot.docs.forEach((docSnap) => {
        const habit = { id: docSnap.id, ...docSnap.data() } as HabitDocument;
        const lastDate = habit.lastCompletedDate ? habit.lastCompletedDate.toDate() : null;
        const lastDateStr = lastDate ? lastDate.toLocaleDateString('en-CA') : null;

        // Determine if we need to reset based on frequency
        let shouldReset = false;

        if (habit.frequency === 'WEEKLY') {
           const lastUpdate = habit.updatedAt ? habit.updatedAt.toDate() : new Date(0);
           // Reset if the last update was before the start of the current week
           // We use lastUpdate because a weekly habit might have progress but not be "completed" yet
           const startOfUpdateWeek = getStartOfWeek(lastUpdate).toISOString().split('T')[0];
           shouldReset = startOfUpdateWeek !== startOfCurrentWeek;
        } else {
           // DAILY: Reset if last completed date is not today
           // Note: This logic assumes if you have progress but not completion, it resets daily too.
           // To be safe, we check last activity (updatedAt) or completion.
           // Using simple daily logic: if not completed today, progress resets.
           shouldReset = lastDateStr !== todayKey;
        }

        if (shouldReset) {
            // Check if it's already reset to avoid redundant writes
            if (habit.currentValue !== 0 || habit.isCompletedToday) {
               batch.update(docSnap.ref, {
                currentValue: 0,
                isCompletedToday: false,
                updatedAt: serverTimestamp(),
               });
               updatesNeeded = true;
            }
        }
      });

      if (updatesNeeded) {
        await batch.commit();
        logInfo('Streaks validated', { userId, habitsChecked: snapshot.size });
      }

      return createSuccess(undefined);
    } catch (error) {
      logError('Failed to validate streaks', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      return createError(error instanceof Error ? error : new Error('Failed to validate streaks'));
    }
  }

  // ============================================
  // getUserHabits — Fetch habits
  // ============================================

  /**
   * Fetch all active habits for a user.
   * Optionally filter by courseId (null = global habits only).
   */
  async getUserHabits(userId: string, courseId?: string | null): Promise<Result<HabitDocument[]>> {
    try {
      const habitsRef = collection(db, this.habitsPath(userId));
      let q = query(habitsRef, where('isActive', '==', true));

      if (courseId !== undefined) {
        q = query(q, where('courseId', '==', courseId));
      }

      const snapshot = await getDocs(q);
      const habits = snapshot.docs.map((docSnap) => ({
        id: docSnap.id,
        ...docSnap.data(),
      })) as HabitDocument[];

      // Sort: system first, then by order
      habits.sort((a, b) => {
        if (a.type !== b.type) return a.type === 'SYSTEM' ? -1 : 1;
        return a.order - b.order;
      });

      return createSuccess(habits);
    } catch (error) {
      logError('Failed to get user habits', { userId });
      return createError(error instanceof Error ? error : new Error('Failed to fetch habits'));
    }
  }

  // ============================================
  // createHabit — Custom habit creation
  // ============================================

  async createHabit(userId: string, input: CreateHabitInput): Promise<Result<string>> {
    try {
      const habitsRef = collection(db, this.habitsPath(userId));
      const newDocRef = doc(habitsRef);
      const now = Timestamp.now();

      const habit: HabitDocument = {
        id: newDocRef.id,
        userId,
        courseId: input.courseId ?? null,
        title: input.title,
        description: input.description ?? '',
        icon: input.icon ?? 'Star',
        type: 'CUSTOM',
        frequency: input.frequency,
        metricType: input.metricType,
        targetValue: input.metricType === 'BOOLEAN' ? 1 : input.targetValue,
        currentValue: 0,
        isCompletedToday: false,
        currentStreak: 0,
        longestStreak: 0,
        lastCompletedDate: null,
        history: {},
        isActive: true,
        order: 999, // New habits go to the end
        createdAt: now,
        updatedAt: now,
      };

      await setDoc(newDocRef, habit);
      logInfo('Custom habit created', { userId, habitId: newDocRef.id, title: input.title });
      return createSuccess(newDocRef.id);
    } catch (error) {
      logError('Failed to create habit', { userId, title: input.title });
      return createError(error instanceof Error ? error : new Error('Failed to create habit'));
    }
  }

  // ============================================
  // toggleCustomHabit — Toggle BOOLEAN habit
  // ============================================

  async toggleCustomHabit(userId: string, habitId: string): Promise<Result<void>> {
    try {
      const habitRef = doc(db, this.habitsPath(userId), habitId);
      const todayKey = getTodayKey();

      // We need to read current state to toggle
      const habitsRef = collection(db, this.habitsPath(userId));
      const q = query(habitsRef, where('__name__', '==', habitId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return createError(new Error('Habit not found'));
      }

      const habit = { id: snapshot.docs[0]!.id, ...snapshot.docs[0]!.data() } as HabitDocument;

      if (habit.isCompletedToday) {
        // Un-toggle: decrement
        const newValue = Math.max(0, habit.currentValue - 1);
        const wasCompleted = habit.isCompletedToday;
        
        const batch = writeBatch(db);
        batch.update(habitRef, {
          currentValue: newValue,
          isCompletedToday: false,
          currentStreak: wasCompleted ? Math.max(0, habit.currentStreak - 1) : habit.currentStreak,
          [`history.${todayKey}`]: newValue,
          updatedAt: serverTimestamp(),
        });

        habitHistoryService.logActivity(userId, habitId, {
            habitId,
            userId,
            date: todayKey,
            value: -1, // Toggle OFF = -1
            action: 'TOGGLED'
        }, batch);
        
        await batch.commit();
      } else {
        // Toggle on
        const newValue = habit.currentValue + 1;
        const metTarget = newValue >= habit.targetValue;
        let newStreak = habit.currentStreak;
        let newLongest = habit.longestStreak;

        if (metTarget) {
          newStreak += 1;
          newLongest = Math.max(newStreak, newLongest);
        }

        // Create a batch to handle both update and log
        const batch = writeBatch(db);
        
        batch.update(habitRef, {
          currentValue: newValue,
          isCompletedToday: metTarget,
          currentStreak: newStreak,
          longestStreak: newLongest,
          lastCompletedDate: metTarget ? serverTimestamp() : habit.lastCompletedDate,
          [`history.${todayKey}`]: newValue,
          updatedAt: serverTimestamp(),
        });

        habitHistoryService.logActivity(userId, habitId, {
            habitId,
            userId,
            date: todayKey,
            value: 1, // Toggle ON = +1
            action: 'TOGGLED'
        }, batch);

        await batch.commit();
      }

      logInfo('Habit toggled', { userId, habitId });
      return createSuccess(undefined);
    } catch (error) {
      logError('Failed to toggle habit', { userId, habitId });
      return createError(error instanceof Error ? error : new Error('Failed to toggle habit'));
    }
  }

  // ============================================
  // incrementCustomHabit — Increment COUNT/DURATION
  // ============================================

  async incrementCustomHabit(
    userId: string,
    habitId: string,
    value: number = 1
  ): Promise<Result<void>> {
    try {
      const habitRef = doc(db, this.habitsPath(userId), habitId);
      const todayKey = getTodayKey();

      // Read current state
      const habitsRef = collection(db, this.habitsPath(userId));
      const q = query(habitsRef, where('__name__', '==', habitId));
      const snapshot = await getDocs(q);

      if (snapshot.empty) {
        return createError(new Error('Habit not found'));
      }

      const habit = { id: snapshot.docs[0]!.id, ...snapshot.docs[0]!.data() } as HabitDocument;
      const newValue = Math.max(0, habit.currentValue + value);
      const metTarget = newValue >= habit.targetValue;
      const wasCompleted = habit.isCompletedToday;

      let newStreak = habit.currentStreak;
      let newLongest = habit.longestStreak;

      if (metTarget && !wasCompleted) {
        newStreak += 1;
        newLongest = Math.max(newStreak, newLongest);
      } else if (!metTarget && wasCompleted) {
        // Un-completing (negative increment took us below target)
        newStreak = Math.max(0, newStreak - 1);
      }

      const batch = writeBatch(db);

      batch.update(habitRef, {
        currentValue: newValue,
        isCompletedToday: metTarget,
        currentStreak: newStreak,
        longestStreak: newLongest,
        lastCompletedDate: metTarget ? serverTimestamp() : habit.lastCompletedDate,
        [`history.${todayKey}`]: newValue,
        updatedAt: serverTimestamp(),
      });

      habitHistoryService.logActivity(userId, habitId, {
        habitId,
        userId,
        date: todayKey,
        value: value,
        action: 'INCREMENTED'
      }, batch);

      await batch.commit();

      logInfo('Habit incremented', { userId, habitId, value, newValue });
      return createSuccess(undefined);
    } catch (error) {
      logError('Failed to increment habit', { userId, habitId });
      return createError(error instanceof Error ? error : new Error('Failed to increment habit'));
    }
  }

  // ============================================
  // updateHabit — Edit habit details
  // ============================================

  async updateHabit(
    userId: string,
    habitId: string,
    updates: Partial<CreateHabitInput>
  ): Promise<Result<void>> {
    try {
      const habitRef = doc(db, this.habitsPath(userId), habitId);
      
      const payload: any = {
        ...updates,
        updatedAt: serverTimestamp(),
      };

      // Ensure we don't accidentally set undefined
      Object.keys(payload).forEach(
        (key) => payload[key] === undefined && delete payload[key]
      );

      // If metric type changes to BOOLEAN, enforce target = 1
      if (updates.metricType === 'BOOLEAN') {
        payload.targetValue = 1;
      }

      await updateDoc(habitRef, payload);
      logInfo('Habit updated', { userId, habitId });
      return createSuccess(undefined);
    } catch (error) {
      logError('Failed to update habit', { userId, habitId });
      return createError(
        error instanceof Error ? error : new Error('Failed to update habit')
      );
    }
  }

  // ============================================
  // deleteHabit — Soft-delete
  // ============================================

  async deleteHabit(userId: string, habitId: string): Promise<Result<void>> {
    try {
      const habitRef = doc(db, this.habitsPath(userId), habitId);
      await updateDoc(habitRef, {
        isActive: false,
        updatedAt: serverTimestamp(),
      });

      logInfo('Habit soft-deleted', { userId, habitId });
      return createSuccess(undefined);
    } catch (error) {
      logError('Failed to delete habit', { userId, habitId });
      return createError(error instanceof Error ? error : new Error('Failed to delete habit'));
    }
  }

  // ============================================
  // getHabitStats — Pure computation
  // ============================================

  getHabitStats(habits: HabitDocument[]): HabitStats {
    const activeHabits = habits.filter((h) => h.isActive);
    
    // Filter out WEEKLY habits from the denominator unless they are completed today.
    // This allows them to be "bonus" or "optional" for the daily view.
    const effectiveTotalHabits = activeHabits.filter(
      (h) => h.frequency === 'DAILY' || h.isCompletedToday
    ).length;

    const completedToday = activeHabits.filter((h) => h.isCompletedToday).length;
    
    const longestActiveStreak = activeHabits.reduce(
      (max, h) => Math.max(max, h.currentStreak),
      0
    );

    // Overall completion rate based on last 7 days (Logic remains same for specific habits)
    const last7Days: string[] = [];
    for (let i = 0; i < 7; i++) {
      const d = new Date();
      d.setDate(d.getDate() - i);
      last7Days.push(d.toLocaleDateString('en-CA'));
    }

    let totalPossible = 0;
    let totalCompleted = 0;

    activeHabits.forEach((habit) => {
      // For overall rate, we still track weekly as "should do once a week"
      // But for the sake of the simplified "daily progress" stats above, we treated them differently.
      // Here, we calculate a robust historical rate.
      if (habit.frequency === 'DAILY') {
        const createDate = habit.createdAt.toDate().toLocaleDateString('en-CA');
        last7Days.forEach((dayKey) => {
          if (dayKey >= createDate) {
            totalPossible++;
            if ((habit.history[dayKey] ?? 0) >= habit.targetValue) {
              totalCompleted++;
            }
          }
        });
      } else {
        // WEEKLY: count as 1 possible per week
        // A bit simplistic for "last 7 days" but acceptable approximation
        totalPossible += 1;
        // Check if ANY completion in the last 7 days sums up? 
        // Or just check if current value is met? 
        // For history, we just sum up the last 7 days activity and see if it met target?
        const weekValues = last7Days.reduce(
          (sum, day) => sum + (habit.history[day] ?? 0),
          0
        );
        if (weekValues >= habit.targetValue) totalCompleted++;
      }
    });

    const overallCompletionRate =
      totalPossible > 0 ? Math.round((totalCompleted / totalPossible) * 100) : 0;

    return {
      totalHabits: effectiveTotalHabits,
      completedToday,
      longestActiveStreak,
      overallCompletionRate,
    };
  }

  // ============================================
  // initializeDefaultHabits — System habits setup
  // ============================================

  /**
   * Create default system habits for a user (idempotent — skips if they already exist).
   * Called on first visit to /habits or during course setup.
   */
  async initializeDefaultHabits(
    userId: string,
    courseId: string | null
  ): Promise<Result<void>> {
    try {
      // Check if system habits already exist
      const habitsRef = collection(db, this.habitsPath(userId));
      const q = query(habitsRef, where('type', '==', 'SYSTEM'));
      const snapshot = await getDocs(q);

      // Build a set of existing linkedEventIds
      const existingEvents = new Set<string>();
      snapshot.docs.forEach((docSnap) => {
        const data = docSnap.data();
        if (data.linkedEventId) {
          existingEvents.add(data.linkedEventId);
        }
      });

      const batch = writeBatch(db);
      let habitsAdded = 0;
      const now = Timestamp.now();

      DEFAULT_SYSTEM_HABITS.forEach((config, index) => {
        if (existingEvents.has(config.linkedEventId)) {
          return; // Already exists
        }

        const newDocRef = doc(habitsRef);
        const habit: HabitDocument = {
          id: newDocRef.id,
          userId,
          courseId,
          title: config.title,
          description: config.description,
          icon: config.icon,
          type: 'SYSTEM',
          frequency: config.frequency,
          metricType: 'COUNT',
          targetValue: config.targetValue,
          linkedEventId: config.linkedEventId,
          currentValue: 0,
          isCompletedToday: false,
          currentStreak: 0,
          longestStreak: 0,
          lastCompletedDate: null,
          history: {},
          isActive: true,
          order: index,
          createdAt: now,
          updatedAt: now,
        };

        batch.set(newDocRef, habit);
        habitsAdded++;
      });

      if (habitsAdded > 0) {
        await batch.commit();
        logInfo('Default system habits created', { userId, courseId, count: habitsAdded });
      } else {
        logInfo('Default habits already exist, skipping', { userId });
      }

      return createSuccess(undefined);
    } catch (error) {
      logError('Failed to initialize default habits', { userId, courseId });
      return createError(
        error instanceof Error ? error : new Error('Failed to initialize habits')
      );
    }
  }
}

// ============================================
// Singleton Export
// ============================================

export const habitEngine = HabitEngine.getInstance();
