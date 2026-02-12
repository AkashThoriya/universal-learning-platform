'use client';

import { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import {
  collection,
  query,
  where,
  onSnapshot,
  orderBy,
} from 'firebase/firestore';

import { db } from '@/lib/firebase/firebase';
import { habitEngine } from '@/lib/services/habit-engine';
import type {
  HabitDocument,
  HabitStats,
  CreateHabitInput,
} from '@/types/habit';

interface UseHabitsReturn {
  habits: HabitDocument[];
  stats: HabitStats;
  loading: boolean;
  error: string | null;
  toggleHabit: (habitId: string) => Promise<void>;
  incrementHabit: (habitId: string, value?: number) => Promise<void>;
  createHabit: (input: CreateHabitInput) => Promise<void>;
  deleteHabit: (habitId: string) => Promise<void>;
  initializeDefaults: () => Promise<void>;
}

/**
 * Real-time Firestore listener for user habits.
 * Validates streaks on mount and provides mutation helpers.
 *
 * @param userId - Firebase user ID (undefined while auth is loading)
 * @param courseId - Optional course filter (null = global habits)
 */
export function useHabits(
  userId: string | undefined,
  courseId?: string | null
): UseHabitsReturn {
  const [habits, setHabits] = useState<HabitDocument[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const streakValidatedRef = useRef(false);

  // --- Real-time listener ---
  useEffect(() => {
    if (!userId) {
      setHabits([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError(null);
    streakValidatedRef.current = false;

    const habitsRef = collection(db, `users/${userId}/habits`);
    const q = query(
      habitsRef,
      where('isActive', '==', true),
      orderBy('order', 'asc')
    );

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const habitsData = snapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        })) as HabitDocument[];

        // Sort: system habits first, then by order
        habitsData.sort((a, b) => {
          if (a.type !== b.type) return a.type === 'SYSTEM' ? -1 : 1;
          return a.order - b.order;
        });

        setHabits(habitsData);
        setLoading(false);

        // Validate streaks once on first data load
        if (!streakValidatedRef.current && habitsData.length > 0) {
          streakValidatedRef.current = true;
          habitEngine.validateStreaks(userId).catch(console.warn);
        }
      },
      (err) => {
        console.error('Habits listener error:', err);
        setError(err.message ?? 'Failed to load habits');
        setLoading(false);
      }
    );

    return () => unsubscribe();
  }, [userId]);

  // --- Computed Stats ---
  const stats = useMemo<HabitStats>(() => {
    if (habits.length === 0) {
      return {
        totalHabits: 0,
        completedToday: 0,
        longestActiveStreak: 0,
        overallCompletionRate: 0,
      };
    }
    return habitEngine.getHabitStats(habits);
  }, [habits]);

  // --- Mutations ---
  const toggleHabit = useCallback(
    async (habitId: string) => {
      if (!userId) return;
      const result = await habitEngine.toggleCustomHabit(userId, habitId);
      if (!result.success) {
        setError('Failed to toggle habit');
      }
    },
    [userId]
  );

  const incrementHabit = useCallback(
    async (habitId: string, value: number = 1) => {
      if (!userId) return;
      const result = await habitEngine.incrementCustomHabit(userId, habitId, value);
      if (!result.success) {
        setError('Failed to update habit');
      }
    },
    [userId]
  );

  const createHabit = useCallback(
    async (input: CreateHabitInput) => {
      if (!userId) return;
      const result = await habitEngine.createHabit(userId, {
        ...input,
        courseId: input.courseId ?? courseId ?? null,
      });
      if (!result.success) {
        setError('Failed to create habit');
      }
    },
    [userId, courseId]
  );

  const deleteHabit = useCallback(
    async (habitId: string) => {
      if (!userId) return;
      const result = await habitEngine.deleteHabit(userId, habitId);
      if (!result.success) {
        setError('Failed to delete habit');
      }
    },
    [userId]
  );

  const initializeDefaults = useCallback(async () => {
    if (!userId) return;
    const result = await habitEngine.initializeDefaultHabits(userId, courseId ?? null);
    if (!result.success) {
      console.warn('Failed to initialize default habits:', result.error);
    }
  }, [userId, courseId]);

  return {
    habits,
    stats,
    loading,
    error,
    toggleHabit,
    incrementHabit,
    createHabit,
    deleteHabit,
    initializeDefaults,
  };
}
