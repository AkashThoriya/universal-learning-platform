import {
  collection,
  doc,
  getDocs,
  limit,
  orderBy,
  query,
  startAfter,
  Timestamp,
  writeBatch,
  QueryDocumentSnapshot,
  DocumentData,
  WriteBatch,
} from 'firebase/firestore';
import { db } from '@/lib/firebase/firebase';
import { logError, logInfo } from '@/lib/utils/logger';
import { createError, createSuccess, type Result } from '@/lib/utils/types-utils';
import type { HabitDocument } from '@/types/habit';

// ============================================
// Types
// ============================================

export interface HabitLogDocument {
  id: string;
  habitId: string;
  userId: string;
  date: string; // YYYY-MM-DD
  value: number; // Value contributed in this log (e.g., +1, +5)
  action: 'COMPLETED' | 'INCREMENTED' | 'TOGGLED' | 'SYSTEM_EVENT';
  metadata?: Record<string, any>; // e.g., Linked Event ID
  createdAt: Timestamp;
}

// ============================================
// Service
// ============================================

class HabitHistoryService {
  private static instance: HabitHistoryService;

  private constructor() {}

  static getInstance(): HabitHistoryService {
    if (!HabitHistoryService.instance) {
      HabitHistoryService.instance = new HabitHistoryService();
    }
    return HabitHistoryService.instance;
  }

  // --- Paths ---
  private getLogsPath(userId: string, habitId: string): string {
    return `users/${userId}/habits/${habitId}/logs`;
  }

  // ============================================
  // logActivity — Write to sub-collection
  // ============================================

  /**
   * Logs a single activity to the history sub-collection.
   * intended to be called within a batch/transaction from HabitEngine,
   * but can also run standalone.
   */
  async logActivity(
    userId: string,
    habitId: string,
    data: Omit<HabitLogDocument, 'id' | 'createdAt'>,
    batch?: WriteBatch // Optional: Pass active batch
  ): Promise<Result<string>> {
    try {
      const logsRef = collection(db, this.getLogsPath(userId, habitId));
      const newDocRef = doc(logsRef);
      
      const logEntry: HabitLogDocument = {
        id: newDocRef.id,
        ...data,
        createdAt: Timestamp.now(),
      };

      if (batch) {
        batch.set(newDocRef, logEntry);
      } else {
        const wb = writeBatch(db);
        wb.set(newDocRef, logEntry);
        await wb.commit();
      }

      return createSuccess(newDocRef.id);
    } catch (error) {
      logError('Failed to log habit activity', { userId, habitId, error });
      return createError(error instanceof Error ? error : new Error('Failed to log activity'));
    }
  }

  // ============================================
  // getHistoryLogs — Paginated Fetch
  // ============================================

  /**
   * Fetch paginated history logs for a habit.
   */
  async getHistoryLogs(
    userId: string,
    habitId: string,
    pageSize: number = 20,
    lastDoc?: QueryDocumentSnapshot<DocumentData>
  ): Promise<Result<{ logs: HabitLogDocument[]; lastDoc: QueryDocumentSnapshot<DocumentData> | null }>> {
    try {
      const logsRef = collection(db, this.getLogsPath(userId, habitId));
      let q = query(logsRef, orderBy('createdAt', 'desc'), limit(pageSize));

      if (lastDoc) {
        q = query(q, startAfter(lastDoc));
      }

      const snapshot = await getDocs(q);
      const logs = snapshot.docs.map(d => d.data() as HabitLogDocument);
      const newLastDoc = snapshot.docs[snapshot.docs.length - 1] || null;

      return createSuccess({ logs, lastDoc: newLastDoc });
    } catch (error) {
      logError('Failed to fetch history logs', { userId, habitId, error });
      return createError(error instanceof Error ? error : new Error('Failed to fetch history'));
    }
  }

  // ============================================
  // backfillHistory — Migration Utility
  // ============================================

  /**
   * Safe Backfill: One-time migration to populate logs from the `history` map.
   * Idempotent: Checks if logs exist for the date before creating.
   */
  async backfillHistory(userId: string, habit: HabitDocument): Promise<Result<number>> {
    try {
      const historyEntries = Object.entries(habit.history || {});
      if (historyEntries.length === 0) return createSuccess(0);

      const logsRef = collection(db, this.getLogsPath(userId, habit.id));
      const batch = writeBatch(db);
      let batchCount = 0;
      let skippedCount = 0;

      // 1. Fetch existing logs to avoid duplicates (Optimization: Link by date?)
      // Since history key is YYYY-MM-DD, we can check if a log exists with date == key
      // But logs can possess multiple entries per day. 
      // Strategy: Check if ANY log exists for that date. If so, assume migrated?
      // Or safer: Just create a "SUMMARY_MIGRATION" entry.
      
      const existingLogsSnapshot = await getDocs(logsRef);
      const existingDates = new Set(existingLogsSnapshot.docs.map(d => d.data().date));

      for (const [date, value] of historyEntries) {
        if (existingDates.has(date)) {
            skippedCount++;
            continue;
        }

        const newDocRef = doc(logsRef);
        const logEntry: HabitLogDocument = {
            id: newDocRef.id,
            habitId: habit.id,
            userId,
            date,
            value,
            action: 'SYSTEM_EVENT', // Generic action for backfill
            metadata: { isBackfill: true, originalValue: value },
            createdAt: Timestamp.now(), // Estimate? Or parse date? Let's use now for sort, or parse date + 12:00
        };
        
        // Better: Set createdAt to the date at noon to preserve roughly correct order
        const [y, m, d] = date.split('-').map(Number);
        if (y && m && d) {
            logEntry.createdAt = Timestamp.fromDate(new Date(y, m - 1, d, 12, 0, 0));
        }

        batch.set(newDocRef, logEntry);
        batchCount++;
      }

      if (batchCount > 0) {
        await batch.commit();
      }

      logInfo('Backfill complete', { userId, habitId: habit.id, created: batchCount, skipped: skippedCount });
      return createSuccess(batchCount);
    } catch (error) {
        console.error(error);
      logError('Failed to backfill history', { userId, habitId: habit.id, error });
      return createError(error instanceof Error ? error : new Error('Failed to backfill'));
    }
  }
}

export const habitHistoryService = HabitHistoryService.getInstance();
