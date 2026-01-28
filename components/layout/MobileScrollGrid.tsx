'use client';

import { ReactNode } from 'react';

import { cn } from '@/lib/utils/utils';

interface MobileScrollGridProps {
  children: ReactNode;
  className?: string;
  itemClassName?: string;
}

/**
 * A hybrid layout component that:
 * - Shows a horizontal scrollable strip on mobile (snap-x)
 * - Shows a standard grid on desktop
 *
 * Perfect for "Stats" cards that take up too much vertical space on phones.
 */
export default function MobileScrollGrid({ children, className }: MobileScrollGridProps) {
  return (
    <div
      className={cn(
        // Mobile: Flex row with overflow, snapping
        'flex overflow-x-auto snap-x snap-mandatory gap-4 pb-4 -mx-4 px-4 no-scrollbar',
        // Desktop: Grid layout, reset flex properties
        'md:grid md:overflow-visible md:pb-0 md:mx-0 md:px-0',
        className
      )}
    >
      {/* 
        This wrapper logic relies on direct children usage or mapped children.
        We apply classes to children by cloning if they are valid elements,
        OR we rely on the consumer to style children correctly for snap-align-center.
        
        However, pure CSS on the container is often enough if we want *all* children to behave.
        For grid-cols, the consumer typically passes 'md:grid-cols-4' in className.
      */}
      {children}
    </div>
  );
}
