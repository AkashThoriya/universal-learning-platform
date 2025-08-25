/**
 * @fileoverview Push Notification Service for Exam Strategy Engine
 * 
 * Handles push notification subscription, sending, and management:
 * - VAPID key configuration
 * - Subscription management
 * - Notification templates for study reminders
 * - Smart scheduling based on user preferences
 * 
 * @version 1.0.0
 */

import { db } from '@/lib/firebase';
import { doc, setDoc, getDoc, collection, query, where, getDocs } from 'firebase/firestore';

// VAPID Configuration (used by server-side push service)
export const VAPID_KEYS = {
  publicKey: process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY!,
  privateKey: process.env.VAPID_PRIVATE_KEY!,
};

export interface PushSubscription {
  endpoint: string;
  keys: {
    auth: string;
    p256dh: string;
  };
}

export interface NotificationPayload {
  title: string;
  body: string;
  icon?: string;
  badge?: string;
  image?: string;
  data?: any;
  actions?: Array<{
    action: string;
    title: string;
    icon?: string;
  }>;
  tag?: string;
  requireInteraction?: boolean;
  vibrate?: number[];
}

export interface StudyReminder {
  userId: string;
  type: 'daily_goal' | 'mission_deadline' | 'streak_risk' | 'micro_learning';
  scheduledTime: Date;
  title: string;
  body: string;
  data?: any;
}

class PushNotificationService {
  private static instance: PushNotificationService;

  static getInstance(): PushNotificationService {
    if (!PushNotificationService.instance) {
      PushNotificationService.instance = new PushNotificationService();
    }
    return PushNotificationService.instance;
  }

  // ============================================================================
  // SUBSCRIPTION MANAGEMENT
  // ============================================================================

  async subscribeUser(userId: string, subscription: PushSubscription): Promise<boolean> {
    try {
      await setDoc(doc(db, 'push_subscriptions', userId), {
        userId,
        subscription,
        createdAt: new Date(),
        isActive: true,
        platform: this.detectPlatform(),
        userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      });

      console.log('Push subscription saved for user:', userId);
      return true;
    } catch (error) {
      console.error('Failed to save push subscription:', error);
      return false;
    }
  }

  async unsubscribeUser(userId: string): Promise<boolean> {
    try {
      await setDoc(doc(db, 'push_subscriptions', userId), {
        isActive: false,
        unsubscribedAt: new Date(),
      }, { merge: true });

      return true;
    } catch (error) {
      console.error('Failed to unsubscribe user:', error);
      return false;
    }
  }

  async getUserSubscription(userId: string): Promise<PushSubscription | null> {
    try {
      const subscriptionDoc = await getDoc(doc(db, 'push_subscriptions', userId));
      
      if (subscriptionDoc.exists() && subscriptionDoc.data().isActive) {
        return subscriptionDoc.data().subscription;
      }
      
      return null;
    } catch (error) {
      console.error('Failed to get user subscription:', error);
      return null;
    }
  }

  // ============================================================================
  // NOTIFICATION SENDING
  // ============================================================================

  async sendNotification(userId: string, payload: NotificationPayload): Promise<boolean> {
    try {
      const subscription = await this.getUserSubscription(userId);
      
      if (!subscription) {
        console.log('No active subscription found for user:', userId);
        return false;
      }

      // In a real implementation, this would use a server-side push service
      // For now, we'll simulate the notification
      console.log('Sending notification to user:', userId, payload);
      
      // Store notification in Firestore for tracking
      await this.logNotification(userId, payload);
      
      return true;
    } catch (error) {
      console.error('Failed to send notification:', error);
      return false;
    }
  }

  async sendBulkNotifications(userIds: string[], payload: NotificationPayload): Promise<number> {
    let successCount = 0;
    
    const promises = userIds.map(async (userId) => {
      const success = await this.sendNotification(userId, payload);
      if (success) {
        successCount++;
      }
    });
    
    await Promise.all(promises);
    return successCount;
  }

  // ============================================================================
  // STUDY REMINDERS
  // ============================================================================

  async scheduleStudyReminder(reminder: StudyReminder): Promise<boolean> {
    try {
      await setDoc(doc(collection(db, 'scheduled_notifications')), {
        ...reminder,
        createdAt: new Date(),
        status: 'scheduled',
      });

      return true;
    } catch (error) {
      console.error('Failed to schedule reminder:', error);
      return false;
    }
  }

  async cancelStudyReminder(userId: string, type: string): Promise<boolean> {
    try {
      const q = query(
        collection(db, 'scheduled_notifications'),
        where('userId', '==', userId),
        where('type', '==', type),
        where('status', '==', 'scheduled')
      );
      
      const querySnapshot = await getDocs(q);
      
      const promises = querySnapshot.docs.map(doc => 
        setDoc(doc.ref, { status: 'cancelled' }, { merge: true })
      );
      
      await Promise.all(promises);
      return true;
    } catch (error) {
      console.error('Failed to cancel reminder:', error);
      return false;
    }
  }

  // ============================================================================
  // PREDEFINED NOTIFICATION TEMPLATES
  // ============================================================================

  createDailyGoalReminder(userName: string, goalProgress: number): NotificationPayload {
    const isLate = goalProgress < 50;
    
    return {
      title: isLate ? "Don't give up!" : "Keep it up!",
      body: isLate 
        ? `Hi ${userName}, you're ${100 - goalProgress}% away from your daily goal. A quick session can make a difference!`
        : `Great progress ${userName}! You're ${goalProgress}% towards your daily goal.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'daily_goal',
        url: '/dashboard',
        progress: goalProgress
      },
      actions: [
        {
          action: 'study',
          title: 'Start Studying',
          icon: '/icons/action-study.png'
        },
        {
          action: 'later',
          title: 'Remind Later',
          icon: '/icons/action-later.png'
        }
      ],
      tag: 'daily-goal',
      vibrate: [100, 50, 100]
    };
  }

  createMissionDeadlineReminder(missionTitle: string, hoursLeft: number): NotificationPayload {
    return {
      title: "Mission Deadline Approaching",
      body: `"${missionTitle}" is due in ${hoursLeft} hours. Complete it to maintain your streak!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'mission_deadline',
        url: '/missions',
        hoursLeft
      },
      actions: [
        {
          action: 'complete',
          title: 'Complete Mission',
          icon: '/icons/action-mission.png'
        },
        {
          action: 'postpone',
          title: 'Postpone',
          icon: '/icons/action-postpone.png'
        }
      ],
      tag: 'mission-deadline',
      requireInteraction: true,
      vibrate: [200, 100, 200]
    };
  }

  createStreakRiskReminder(currentStreak: number): NotificationPayload {
    return {
      title: "Streak at Risk! 🔥",
      body: `Your ${currentStreak}-day study streak is at risk! Study for just 10 minutes to keep it alive.`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: '/images/streak-risk.png',
      data: {
        type: 'streak_risk',
        url: '/micro-learning',
        streak: currentStreak
      },
      actions: [
        {
          action: 'quick_study',
          title: '10 Min Study',
          icon: '/icons/action-quick.png'
        },
        {
          action: 'dismiss',
          title: 'Dismiss',
          icon: '/icons/action-dismiss.png'
        }
      ],
      tag: 'streak-risk',
      requireInteraction: true,
      vibrate: [300, 100, 300, 100, 300]
    };
  }

  createMicroLearningReminder(subject: string): NotificationPayload {
    return {
      title: "Quick Learning Break",
      body: `Ready for a 5-minute ${subject} session? Perfect for a quick study break!`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      data: {
        type: 'micro_learning',
        url: '/micro-learning',
        subject
      },
      actions: [
        {
          action: 'start',
          title: 'Start Session',
          icon: '/icons/action-start.png'
        },
        {
          action: 'snooze',
          title: 'Snooze 30min',
          icon: '/icons/action-snooze.png'
        }
      ],
      tag: 'micro-learning',
      vibrate: [100, 50, 100]
    };
  }

  createAchievementNotification(achievement: string, description: string): NotificationPayload {
    return {
      title: `🏆 Achievement Unlocked!`,
      body: `${achievement}: ${description}`,
      icon: '/icons/icon-192x192.png',
      badge: '/icons/badge-72x72.png',
      image: '/images/achievement.png',
      data: {
        type: 'achievement',
        url: '/dashboard',
        achievement
      },
      actions: [
        {
          action: 'view',
          title: 'View Achievement',
          icon: '/icons/action-view.png'
        },
        {
          action: 'share',
          title: 'Share',
          icon: '/icons/action-share.png'
        }
      ],
      tag: 'achievement',
      requireInteraction: false,
      vibrate: [200, 100, 200, 100, 200]
    };
  }

  // ============================================================================
  // SMART SCHEDULING
  // ============================================================================

  async scheduleSmartReminders(userId: string, preferences: {
    studyTime: 'morning' | 'afternoon' | 'evening';
    timezone: string;
    frequency: 'low' | 'medium' | 'high';
    types: string[];
  }): Promise<boolean> {
    try {
      const baseTime = this.getPreferredStudyTime(preferences.studyTime);
      const reminderIntervals = this.getReminderIntervals(preferences.frequency);
      
      // Schedule different types of reminders
      for (const type of preferences.types) {
        for (const interval of reminderIntervals) {
          const scheduledTime = new Date(baseTime.getTime() + interval);
          
          await this.scheduleStudyReminder({
            userId,
            type: type as any,
            scheduledTime,
            title: this.getDefaultTitle(type),
            body: this.getDefaultBody(type),
            data: { automated: true }
          });
        }
      }
      
      return true;
    } catch (error) {
      console.error('Failed to schedule smart reminders:', error);
      return false;
    }
  }

  // ============================================================================
  // HELPER METHODS
  // ============================================================================

  private detectPlatform(): string {
    if (typeof window === 'undefined') {
      return 'server';
    }
    
    const userAgent = window.navigator.userAgent;
    
    if (/iPad|iPhone|iPod/.test(userAgent)) {
      return 'ios';
    }
    if (/Android/.test(userAgent)) {
      return 'android';
    }
    if (/Windows/.test(userAgent)) {
      return 'windows';
    }
    if (/Mac/.test(userAgent)) {
      return 'mac';
    }
    
    return 'unknown';
  }

  private async logNotification(userId: string, payload: NotificationPayload): Promise<void> {
    try {
      await setDoc(doc(collection(db, 'notification_logs')), {
        userId,
        payload,
        sentAt: new Date(),
        platform: this.detectPlatform(),
      });
    } catch (error) {
      console.error('Failed to log notification:', error);
    }
  }

  private getPreferredStudyTime(studyTime: string): Date {
    const now = new Date();
    const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    
    switch (studyTime) {
      case 'morning':
        return new Date(today.getTime() + 8 * 60 * 60 * 1000); // 8 AM
      case 'afternoon':
        return new Date(today.getTime() + 14 * 60 * 60 * 1000); // 2 PM
      case 'evening':
        return new Date(today.getTime() + 19 * 60 * 60 * 1000); // 7 PM
      default:
        return new Date(today.getTime() + 9 * 60 * 60 * 1000); // 9 AM
    }
  }

  private getReminderIntervals(frequency: string): number[] {
    const hour = 60 * 60 * 1000;
    
    switch (frequency) {
      case 'high':
        return [0, 2 * hour, 6 * hour, 12 * hour]; // 4 times a day
      case 'medium':
        return [0, 4 * hour, 8 * hour]; // 3 times a day
      case 'low':
        return [0, 6 * hour]; // 2 times a day
      default:
        return [0, 4 * hour]; // Default: 2 times a day
    }
  }

  private getDefaultTitle(type: string): string {
    switch (type) {
      case 'daily_goal':
        return 'Daily Goal Reminder';
      case 'mission_deadline':
        return 'Mission Due Soon';
      case 'streak_risk':
        return 'Streak at Risk';
      case 'micro_learning':
        return 'Quick Study Time';
      default:
        return 'Study Reminder';
    }
  }

  private getDefaultBody(type: string): string {
    switch (type) {
      case 'daily_goal':
        return 'Time to work on your daily study goal!';
      case 'mission_deadline':
        return 'You have a mission deadline approaching.';
      case 'streak_risk':
        return 'Your study streak is at risk. Study now to maintain it!';
      case 'micro_learning':
        return 'Perfect time for a quick learning session.';
      default:
        return 'Time to study!';
    }
  }
}

export const pushNotificationService = PushNotificationService.getInstance();
export default pushNotificationService;
