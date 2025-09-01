/**
 * @fileoverview UI Content and Marketing Data
 *
 * Centralized content for marketing, features, and UI text across the application.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { Target, TrendingUp, Shield, Wifi, Download, Zap, FileText, BarChart } from 'lucide-react';

// ============================================================================
// LOGIN PAGE CONTENT
// ============================================================================

export interface FeatureHighlight {
  icon: typeof Target;
  title: string;
  description: string;
  color: string;
}

/**
 * Feature highlights for login page
 * Used in: app/login/page.tsx
 */
export const LOGIN_FEATURES: readonly FeatureHighlight[] = [
  {
    icon: Target,
    title: 'Strategic Planning',
    description: 'Tier-based prioritization with spaced repetition',
    color: 'blue',
  },
  {
    icon: TrendingUp,
    title: 'Progress Analytics',
    description: 'AI-powered insights and performance correlation',
    color: 'green',
  },
  {
    icon: Shield,
    title: 'Contextual Mastery',
    description: 'Personal context creation for deeper understanding',
    color: 'purple',
  },
] as const;

// ============================================================================
// PWA CONTENT
// ============================================================================

export interface PWABenefit {
  icon: string;
  title: string;
  description: string;
}

/**
 * PWA installation benefits
 * Used in: components/PWAInstallBanner.tsx
 */
export const PWA_BENEFITS: readonly PWABenefit[] = [
  {
    icon: '⚡',
    title: 'Faster Loading',
    description: 'Lightning-fast performance with offline caching',
  },
  {
    icon: '📱',
    title: 'Mobile Experience',
    description: 'Native app-like experience on your device',
  },
  {
    icon: '🔔',
    title: 'Push Notifications',
    description: 'Stay updated with study reminders and progress alerts',
  },
] as const;

export interface OfflineFeature {
  icon: typeof Wifi;
  title: string;
  description: string;
  available: boolean;
}

/**
 * Offline capabilities description
 * Used in: app/offline/page.tsx
 */
export const OFFLINE_FEATURES: readonly OfflineFeature[] = [
  {
    icon: FileText,
    title: 'Offline Reading',
    description: 'Access your saved content and notes without internet',
    available: true,
  },
  {
    icon: BarChart,
    title: 'Progress Tracking',
    description: 'View your study progress and analytics offline',
    available: true,
  },
  {
    icon: Download,
    title: 'Content Sync',
    description: 'Download content for offline access',
    available: true,
  },
  {
    icon: Zap,
    title: 'Background Sync',
    description: 'Automatic synchronization when connection returns',
    available: true,
  },
  {
    icon: Wifi,
    title: 'Offline Quizzes',
    description: 'Take practice tests without internet connection',
    available: false,
  },
] as const;

// ============================================================================
// PROFILE PAGE CONTENT
// ============================================================================

export interface ProfileTab {
  id: string;
  label: string;
  icon: typeof Target;
  description: string;
}

/**
 * Profile page tab configuration
 * Used in: app/profile/page.tsx
 */
export const PROFILE_TABS: readonly ProfileTab[] = [
  {
    id: 'overview',
    label: 'Overview',
    icon: Target,
    description: 'Your study progress and key metrics',
  },
  {
    id: 'achievements',
    label: 'Achievements',
    icon: TrendingUp,
    description: "Badges and milestones you've earned",
  },
  {
    id: 'analytics',
    label: 'Analytics',
    icon: BarChart,
    description: 'Detailed performance insights',
  },
  {
    id: 'settings',
    label: 'Settings',
    icon: Shield,
    description: 'Account preferences and privacy',
  },
] as const;

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Get feature by color theme
 */
export const getFeaturesByColor = (color: string): FeatureHighlight[] => {
  return LOGIN_FEATURES.filter(feature => feature.color === color);
};

/**
 * Get profile tab by ID
 */
export const getProfileTabById = (id: string): ProfileTab | undefined => {
  return PROFILE_TABS.find(tab => tab.id === id);
};

/**
 * Get available offline features
 */
export const getAvailableOfflineFeatures = (): OfflineFeature[] => {
  return OFFLINE_FEATURES.filter(feature => feature.available);
};

/**
 * Get unavailable offline features
 */
export const getUnavailableOfflineFeatures = (): OfflineFeature[] => {
  return OFFLINE_FEATURES.filter(feature => !feature.available);
};
