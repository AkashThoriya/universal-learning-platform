/**
 * @fileoverview Background Sync Service for Offline Data Management
 *
 * Handles background synchronization of user data when the app comes back online:
 * - Mission progress synchronization
 * - Analytics data sync
 * - User preferences and settings
 * - Conflict resolution for offline changes
 *
 * @version 1.0.0
 */

import { doc, setDoc, getDoc, collection, addDoc, updateDoc, Timestamp } from 'firebase/firestore';

import { db } from '@/lib/firebase';

export interface SyncData {
  id: string;
  type: 'mission' | 'progress' | 'analytics' | 'preferences' | 'session';
  data: unknown;
  timestamp: Date;
  userId: string;
  status: 'pending' | 'synced' | 'conflict' | 'failed';
  retryCount: number;
  lastAttempt?: Date;
}

export interface SyncResult {
  success: boolean;
  syncedItems: number;
  conflictItems: number;
  failedItems: number;
  errors: string[];
}

export interface ConflictResolution {
  itemId: string;
  resolution: 'local' | 'remote' | 'merge';
  mergedData?: unknown;
}

class BackgroundSyncService {
  private static instance: BackgroundSyncService;
  private syncQueue: SyncData[] = [];
  private isSyncing = false;
  private maxRetries = 3;

  static getInstance(): BackgroundSyncService {
    if (!BackgroundSyncService.instance) {
      BackgroundSyncService.instance = new BackgroundSyncService();
    }
    return BackgroundSyncService.instance;
  }

  // ============================================================================
  // QUEUE MANAGEMENT
  // ============================================================================

  async addToSyncQueue(data: Omit<SyncData, 'id' | 'status' | 'retryCount'>): Promise<void> {
    const syncItem: SyncData = {
      ...data,
      id: this.generateSyncId(),
      status: 'pending',
      retryCount: 0,
    };

    this.syncQueue.push(syncItem);

    // Store in IndexedDB for persistence
    await this.storeSyncItemLocally(syncItem);

    // Attempt sync if online
    if (navigator.onLine && !this.isSyncing) {
      this.startSync();
    }
  }

  async clearSyncQueue(): Promise<void> {
    this.syncQueue = [];
    await this.clearLocalSyncStorage();
  }

  getSyncQueueStatus(): {
    pending: number;
    synced: number;
    conflicts: number;
    failed: number;
  } {
    return {
      pending: this.syncQueue.filter(item => item.status === 'pending').length,
      synced: this.syncQueue.filter(item => item.status === 'synced').length,
      conflicts: this.syncQueue.filter(item => item.status === 'conflict').length,
      failed: this.syncQueue.filter(item => item.status === 'failed').length,
    };
  }

  // ============================================================================
  // SYNC EXECUTION
  // ============================================================================

  async startSync(): Promise<SyncResult> {
    if (this.isSyncing) {
      // console.log('Sync already in progress');
      return {
        success: false,
        syncedItems: 0,
        conflictItems: 0,
        failedItems: 0,
        errors: ['Sync already in progress'],
      };
    }

    this.isSyncing = true;
    // console.log('Starting background sync...');

    const result: SyncResult = {
      success: true,
      syncedItems: 0,
      conflictItems: 0,
      failedItems: 0,
      errors: [],
    };

    try {
      // Load pending items from local storage
      await this.loadLocalSyncQueue();

      const pendingItems = this.syncQueue.filter(
        item => item.status === 'pending' || (item.status === 'failed' && item.retryCount < this.maxRetries)
      );

      // console.log(`Syncing ${pendingItems.length} items...`);

      for (const item of pendingItems) {
        try {
          const syncSuccess = await this.syncItem(item);

          if (syncSuccess) {
            item.status = 'synced';
            result.syncedItems++;
          } else {
            item.retryCount++;
            item.lastAttempt = new Date();

            if (item.retryCount >= this.maxRetries) {
              item.status = 'failed';
              result.failedItems++;
            }
          }
        } catch (error) {
          console.error('Sync item error:', error);
          item.status = 'failed';
          result.failedItems++;
          result.errors.push(`Failed to sync ${item.type}: ${error}`);
        }
      }

      // Update local storage
      await this.updateLocalSyncQueue();

      // Notify listeners
      this.notifySyncComplete(result);
    } catch (error) {
      console.error('Background sync failed:', error);
      result.success = false;
      result.errors.push(`Sync failed: ${error}`);
    } finally {
      this.isSyncing = false;
    }

    return result;
  }

  private async syncItem(item: SyncData): Promise<boolean> {
    try {
      switch (item.type) {
        case 'mission':
          return await this.syncMissionData(item);
        case 'progress':
          return await this.syncProgressData(item);
        case 'analytics':
          return await this.syncAnalyticsData(item);
        case 'preferences':
          return await this.syncPreferencesData(item);
        case 'session':
          return await this.syncSessionData(item);
        default:
          // console.warn('Unknown sync type:', item.type);
          return false;
      }
    } catch (error) {
      console.error(`Failed to sync ${item.type}:`, error);
      return false;
    }
  }

  // ============================================================================
  // TYPE-SPECIFIC SYNC METHODS
  // ============================================================================

  private async syncMissionData(item: SyncData): Promise<boolean> {
    try {
      const data = item.data as {
        missionId: string;
        progress: any;
        completedAt?: Date;
        timeSpent: number;
      };
      const { missionId, progress, completedAt, timeSpent } = data;

      // Check for conflicts
      const remoteDoc = await getDoc(doc(db, `users/${item.userId}/journeys/${missionId}`));

      if (remoteDoc.exists()) {
        const remoteData = remoteDoc.data();
        const remoteTimestamp = remoteData.lastUpdated?.toDate() || new Date(0);

        if (remoteTimestamp > item.timestamp) {
          // Conflict detected - remote is newer
          await this.handleSyncConflict(item, remoteData);
          return false;
        }
      }

      // Sync to Firebase
      await setDoc(
        doc(db, `users/${item.userId}/journeys/${missionId}`),
        {
          progress,
          completedAt: completedAt ? Timestamp.fromDate(new Date(completedAt)) : null,
          timeSpent,
          lastUpdated: Timestamp.fromDate(item.timestamp),
          syncedFrom: 'offline',
        },
        { merge: true }
      );

      return true;
    } catch (error) {
      console.error('Mission sync error:', error);
      return false;
    }
  }

  private async syncProgressData(item: SyncData): Promise<boolean> {
    try {
      const data = item.data as {
        sessionId: string;
        subject: string;
        timeSpent: number;
        questionsAnswered: number;
        accuracy: number;
      };
      const { sessionId, subject, timeSpent, questionsAnswered, accuracy } = data;

      await addDoc(collection(db, `users/${item.userId}/study_sessions`), {
        sessionId,
        subject,
        timeSpent,
        questionsAnswered,
        accuracy,
        timestamp: Timestamp.fromDate(item.timestamp),
        syncedFrom: 'offline',
      });

      return true;
    } catch (error) {
      console.error('Progress sync error:', error);
      return false;
    }
  }

  private async syncAnalyticsData(item: SyncData): Promise<boolean> {
    try {
      const data = item.data as {
        eventType: string;
        eventData: any;
      };
      const { eventType, eventData } = data;

      await addDoc(collection(db, `users/${item.userId}/analytics_events`), {
        eventType,
        eventData,
        timestamp: Timestamp.fromDate(item.timestamp),
        source: 'offline_sync',
      });

      return true;
    } catch (error) {
      console.error('Analytics sync error:', error);
      return false;
    }
  }

  private async syncPreferencesData(item: SyncData): Promise<boolean> {
    try {
      const preferences = item.data as Record<string, any>;

      await updateDoc(doc(db, `users/${item.userId}`), {
        preferences: preferences && typeof preferences === 'object' ? preferences : {},
        lastUpdated: Timestamp.fromDate(item.timestamp),
      });

      return true;
    } catch (error) {
      console.error('Preferences sync error:', error);
      return false;
    }
  }

  private async syncSessionData(item: SyncData): Promise<boolean> {
    try {
      const sessionData = item.data as Record<string, any>;

      await setDoc(doc(db, `users/${item.userId}/sessions/${item.id}`), {
        ...(sessionData && typeof sessionData === 'object' ? sessionData : {}),
        timestamp: Timestamp.fromDate(item.timestamp),
        syncedFrom: 'offline',
      });

      return true;
    } catch (error) {
      console.error('Session sync error:', error);
      return false;
    }
  }

  // ============================================================================
  // CONFLICT RESOLUTION
  // ============================================================================

  private async handleSyncConflict(localItem: SyncData, remoteData: unknown): Promise<void> {
    localItem.status = 'conflict';

    // Store conflict for user resolution
    await this.storeConflict({
      localItem,
      remoteData,
      timestamp: new Date(),
    });

    // console.log('Sync conflict detected for item:', localItem.id);
  }

  async resolveConflicts(resolutions: ConflictResolution[]): Promise<boolean> {
    try {
      for (const resolution of resolutions) {
        const conflictItem = this.syncQueue.find(item => item.id === resolution.itemId);

        if (!conflictItem) {
          continue;
        }

        switch (resolution.resolution) {
          case 'local':
            // Keep local data, force sync
            conflictItem.status = 'pending';
            break;

          case 'remote':
            // Discard local data
            conflictItem.status = 'synced';
            break;

          case 'merge':
            // Use merged data
            if (resolution.mergedData) {
              conflictItem.data = resolution.mergedData;
              conflictItem.status = 'pending';
            }
            break;
        }
      }

      await this.updateLocalSyncQueue();

      // Restart sync for resolved conflicts
      if (navigator.onLine) {
        this.startSync();
      }

      return true;
    } catch (error) {
      console.error('Conflict resolution failed:', error);
      return false;
    }
  }

  // ============================================================================
  // LOCAL STORAGE MANAGEMENT
  // ============================================================================

  private async storeSyncItemLocally(item: SyncData): Promise<void> {
    try {
      const stored = localStorage.getItem('sync_queue');
      const queue = stored ? JSON.parse(stored) : [];

      queue.push({
        ...item,
        timestamp: item.timestamp.toISOString(),
        lastAttempt: item.lastAttempt?.toISOString(),
      });

      localStorage.setItem('sync_queue', JSON.stringify(queue));
    } catch (error) {
      console.error('Failed to store sync item locally:', error);
    }
  }

  private async loadLocalSyncQueue(): Promise<void> {
    try {
      const stored = localStorage.getItem('sync_queue');

      if (stored) {
        const queue = JSON.parse(stored);
        this.syncQueue = queue.map((item: any) => ({
          ...(item && typeof item === 'object' ? item : {}),
          timestamp: new Date(item?.timestamp ?? Date.now()),
          lastAttempt: item?.lastAttempt ? new Date(item.lastAttempt) : undefined,
        }));
      }
    } catch (error) {
      console.error('Failed to load local sync queue:', error);
      this.syncQueue = [];
    }
  }

  private async updateLocalSyncQueue(): Promise<void> {
    try {
      const serializedQueue = this.syncQueue.map(item => ({
        ...item,
        timestamp: item.timestamp.toISOString(),
        lastAttempt: item.lastAttempt?.toISOString(),
      }));

      localStorage.setItem('sync_queue', JSON.stringify(serializedQueue));
    } catch (error) {
      console.error('Failed to update local sync queue:', error);
    }
  }

  private async clearLocalSyncStorage(): Promise<void> {
    try {
      localStorage.removeItem('sync_queue');
      localStorage.removeItem('sync_conflicts');
    } catch (error) {
      console.error('Failed to clear local sync storage:', error);
    }
  }

  private async storeConflict(conflict: any): Promise<void> {
    try {
      const stored = localStorage.getItem('sync_conflicts');
      const conflicts = stored ? JSON.parse(stored) : [];

      conflicts.push({
        ...(conflict && typeof conflict === 'object' ? conflict : {}),
        timestamp: conflict?.timestamp?.toISOString() ?? new Date().toISOString(),
      });

      localStorage.setItem('sync_conflicts', JSON.stringify(conflicts));
    } catch (error) {
      console.error('Failed to store conflict:', error);
    }
  }

  // ============================================================================
  // UTILITY METHODS
  // ============================================================================

  private generateSyncId(): string {
    return `sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private notifySyncComplete(result: SyncResult): void {
    // Notify service worker
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({
        type: 'SYNC_COMPLETE',
        result,
      });
    }

    // Dispatch custom event
    window.dispatchEvent(
      new CustomEvent('backgroundSyncComplete', {
        detail: result,
      })
    );
  }

  // ============================================================================
  // PUBLIC API
  // ============================================================================

  async forceSyncNow(): Promise<SyncResult> {
    if (!navigator.onLine) {
      return {
        success: false,
        syncedItems: 0,
        conflictItems: 0,
        failedItems: 0,
        errors: ['No internet connection'],
      };
    }

    return this.startSync();
  }

  async syncMissionProgress(userId: string, missionId: string, progress: any): Promise<void> {
    await this.addToSyncQueue({
      type: 'mission',
      userId,
      timestamp: new Date(),
      data: {
        missionId,
        ...(progress && typeof progress === 'object' ? progress : {}),
      },
    });
  }

  async syncStudySession(userId: string, sessionData: any): Promise<void> {
    await this.addToSyncQueue({
      type: 'progress',
      userId,
      timestamp: new Date(),
      data: sessionData && typeof sessionData === 'object' ? sessionData : {},
    });
  }

  async syncAnalyticsEvent(userId: string, eventType: string, eventData: unknown): Promise<void> {
    await this.addToSyncQueue({
      type: 'analytics',
      userId,
      timestamp: new Date(),
      data: {
        eventType,
        eventData,
      },
    });
  }

  async syncUserPreferences(userId: string, preferences: unknown): Promise<void> {
    await this.addToSyncQueue({
      type: 'preferences',
      userId,
      timestamp: new Date(),
      data: preferences,
    });
  }

  // Initialize sync service
  async initialize(): Promise<void> {
    // Load existing queue from local storage
    await this.loadLocalSyncQueue();

    // Set up online/offline listeners
    window.addEventListener('online', () => {
      // console.log('Came back online, starting sync...');
      this.startSync();
    });

    window.addEventListener('offline', () => {
      // console.log('Went offline, sync will resume when back online');
    });

    // Initial sync if online
    if (navigator.onLine && this.syncQueue.length > 0) {
      setTimeout(() => this.startSync(), 1000);
    }
  }
}

export const backgroundSyncService = BackgroundSyncService.getInstance();
export default backgroundSyncService;
