/**
 * @fileoverview Unified App Layout Component
 *
 * Provides consistent layout structure across all authenticated pages
 * with unified navigation, proper spacing, and responsive design.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

'use client';

import { ReactNode } from 'react';

import Navigation from '@/components/Navigation';
import BottomNav from '@/components/BottomNav';
import { cn } from '@/lib/utils/utils';

interface AppLayoutProps {
  children: ReactNode;
  className?: string;
  /**
   * Maximum width of the content container
   * @default 'max-w-7xl'
   */
  maxWidth?: 'max-w-4xl' | 'max-w-5xl' | 'max-w-6xl' | 'max-w-7xl' | 'max-w-full';
  /**
   * Background gradient variant
   * @default 'blue'
   */
  background?: 'blue' | 'purple' | 'gray' | 'green';
  /**
   * Content padding
   * @default 'standard'
   */
  padding?: 'tight' | 'standard' | 'relaxed';
  /**
   * Whether to show the main navigation
   * @default true
   */
  showNavigation?: boolean;
  /**
   * Additional header content to display below navigation
   */
  headerContent?: ReactNode;
}

const backgroundVariants = {
  blue: 'bg-gradient-to-br from-blue-50 to-indigo-100',
  purple: 'bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50',
  gray: 'bg-gradient-to-br from-gray-50 to-blue-50',
  green: 'bg-gradient-to-br from-emerald-50 to-blue-50',
};

const paddingVariants = {
  tight: 'p-4',
  standard: 'p-4 sm:p-6',
  relaxed: 'p-6 sm:p-8',
};

/**
 * Unified App Layout Component
 *
 * Provides consistent structure for all authenticated pages
 */
export default function AppLayout({
  children,
  className,
  maxWidth = 'max-w-7xl',
  background = 'blue',
  padding = 'standard',
  showNavigation = true,
  headerContent,
}: AppLayoutProps) {
  return (
    <div className={cn('min-h-screen', backgroundVariants[background])}>
      {/* Navigation */}
      {showNavigation && (
        <>
          <Navigation />
          <BottomNav />
        </>
      )}

      {/* Optional Header Content */}
      {headerContent && <div className={cn(maxWidth, 'mx-auto', paddingVariants[padding])}>{headerContent}</div>}

      {/* Main Content */}
      <div className={cn(maxWidth, 'mx-auto', paddingVariants[padding], className)}>{children}</div>
    </div>
  );
}

/**
 * Pre-configured layout variants for common use cases
 */

/**
 * Standard layout for most pages
 */
export function StandardLayout({ children, ...props }: Omit<AppLayoutProps, 'background' | 'maxWidth'>) {
  return (
    <AppLayout background="blue" maxWidth="max-w-7xl" {...props}>
      {children}
    </AppLayout>
  );
}

/**
 * Analytics layout with purple theme
 */
export function AnalyticsLayout({ children, ...props }: Omit<AppLayoutProps, 'background'>) {
  return (
    <AppLayout background="purple" {...props}>
      {children}
    </AppLayout>
  );
}

/**
 * Compact layout for detail pages
 */
export function CompactLayout({ children, ...props }: Omit<AppLayoutProps, 'maxWidth' | 'padding'>) {
  return (
    <AppLayout maxWidth="max-w-5xl" padding="standard" {...props}>
      {children}
    </AppLayout>
  );
}

/**
 * Wide layout for dashboards and complex interfaces
 */
export function WideLayout({ children, ...props }: Omit<AppLayoutProps, 'maxWidth' | 'padding'>) {
  return (
    <AppLayout maxWidth="max-w-7xl" padding="relaxed" {...props}>
      {children}
    </AppLayout>
  );
}

/**
 * Full-width layout for special cases
 */
export function FullWidthLayout({ children, ...props }: Omit<AppLayoutProps, 'maxWidth'>) {
  return (
    <AppLayout maxWidth="max-w-full" {...props}>
      {children}
    </AppLayout>
  );
}
