/**
 * @fileoverview UI Content and Marketing Data
 *
 * Centralized content for marketing, features, and UI text across the application.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  Target,
  TrendingUp,
  Shield,
  Wifi,
  Zap,
  Bell,
  Smartphone,
  User,
  BookOpen,
  Settings,
  Clock,
  Trophy,
  Activity,
} from 'lucide-react';

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
  icon: typeof Zap;
  title: string;
  description: string;
}

/**
 * PWA installation benefits
 * Used in: components/PWAInstallBanner.tsx
 */
export const PWA_BENEFITS: readonly PWABenefit[] = [
  {
    icon: Zap,
    title: 'Faster Loading',
    description: 'Instant access with offline caching',
  },
  {
    icon: Wifi,
    title: 'Works Offline',
    description: 'Continue studying without internet',
  },
  {
    icon: Bell,
    title: 'Smart Notifications',
    description: 'Study reminders and progress updates',
  },
  {
    icon: Smartphone,
    title: 'Native Experience',
    description: 'Full-screen app-like interface',
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
    icon: BookOpen,
    title: 'Cached Content',
    description: 'Access previously viewed study materials and notes',
    available: true,
  },
  {
    icon: Clock,
    title: 'Study Timer',
    description: 'Continue timing your study sessions offline',
    available: true,
  },
  {
    icon: Trophy,
    title: 'Progress Tracking',
    description: "Your progress will sync when you're back online",
    available: true,
  },
  {
    icon: Activity,
    title: 'Analytics',
    description: 'View cached performance data and insights',
    available: true,
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
    id: 'personal',
    label: 'Personal Info',
    icon: User,
    description: 'Basic information and persona',
  },
  {
    id: 'courses',
    label: 'Courses',
    icon: BookOpen,
    description: 'Manage your exam preparations',
  },
  {
    id: 'exam',
    label: 'Exam Setup',
    icon: Target,
    description: 'Learning path and timeline',
  },
  {
    id: 'syllabus',
    label: 'Syllabus',
    icon: BookOpen,
    description: 'Subject organization and priorities',
  },
  {
    id: 'preferences',
    label: 'Study Preferences',
    icon: Settings,
    description: 'Goals and scheduling',
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
