'use client';

import { ReactNode } from 'react';

import { cn } from '@/lib/utils/utils';

interface PageContainerProps {
  children: ReactNode;
  className?: string;
  /**
   * Whether to add bottom padding for the mobile bottom navigation bar.
   * Default: true (adds pb-24 on mobile/tablet, pb-6 on xl screens)
   */
  withBottomNavPadding?: boolean;
  /**
   * Maximum width constraint. Default: 7xl (max-w-7xl)
   */
  maxWidth?: 'full' | '7xl' | '6xl' | '5xl' | '4xl' | '3xl' | '2xl';
}

const maxWidthClasses = {
  full: 'max-w-full',
  '7xl': 'max-w-7xl',
  '6xl': 'max-w-6xl',
  '5xl': 'max-w-5xl',
  '4xl': 'max-w-4xl',
  '3xl': 'max-w-3xl',
  '2xl': 'max-w-2xl',
};

/**
 * PageContainer - Standardized page wrapper with consistent padding
 *
 * Handles:
 * - Bottom navigation padding on mobile/tablet (pb-24 xl:pb-6)
 * - Responsive horizontal padding (p-4 sm:p-6)
 * - Max-width constraint with auto margins
 *
 * Use this wrapper for all authenticated pages to ensure consistent
 * layout across the application.
 */
export default function PageContainer({
  children,
  className,
  withBottomNavPadding = true,
  maxWidth = '7xl',
}: PageContainerProps) {
  return (
    <div
      className={cn(
        'mx-auto p-4 sm:p-6',
        maxWidthClasses[maxWidth],
        withBottomNavPadding && 'pb-24 xl:pb-6',
        className
      )}
    >
      {children}
    </div>
  );
}
