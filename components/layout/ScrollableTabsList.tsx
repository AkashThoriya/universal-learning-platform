'use client';

import * as React from 'react';
import { useState, useRef, useEffect, useCallback } from 'react';

import { cn } from '@/lib/utils/utils';

interface ScrollableTabsListProps {
  children: React.ReactNode;
  className?: string;
  /**
   * Whether to show gradient fade indicators when content overflows.
   * Default: true
   */
  showGradients?: boolean;
}

/**
 * ScrollableTabsList - A horizontal scrollable tabs container with fade indicators
 *
 * Use this wrapper around TabsList content when you have many tabs
 * that may overflow on mobile. It provides:
 * - Horizontal scroll with snap behavior
 * - Gradient fade indicators on left/right edges when overflowing
 * - Automatic detection of scroll position
 *
 * @example
 * ```tsx
 * <ScrollableTabsList>
 *   <TabsList>
 *     <TabsTrigger value="tab1">Tab 1</TabsTrigger>
 *     <TabsTrigger value="tab2">Tab 2</TabsTrigger>
 *     ...
 *   </TabsList>
 * </ScrollableTabsList>
 * ```
 */
export function ScrollableTabsList({ children, className, showGradients = true }: ScrollableTabsListProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(false);

  const checkScroll = useCallback(() => {
    const el = scrollRef.current;
    if (!el) return;

    const { scrollLeft, scrollWidth, clientWidth } = el;
    const SCROLL_THRESHOLD = 5; // Small buffer for edge detection

    setCanScrollLeft(scrollLeft > SCROLL_THRESHOLD);
    setCanScrollRight(scrollLeft < scrollWidth - clientWidth - SCROLL_THRESHOLD);
  }, []);

  useEffect(() => {
    const el = scrollRef.current;
    if (!el) return;

    // Initial check
    checkScroll();

    // Listen for scroll events
    el.addEventListener('scroll', checkScroll, { passive: true });

    // Listen for resize to recheck
    const resizeObserver = new ResizeObserver(checkScroll);
    resizeObserver.observe(el);

    return () => {
      el.removeEventListener('scroll', checkScroll);
      resizeObserver.disconnect();
    };
  }, [checkScroll]);

  return (
    <div className={cn('relative', className)}>
      {/* Left gradient fade - only visible when can scroll left */}
      {showGradients && canScrollLeft && (
        <div
          className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-background to-transparent z-10 pointer-events-none md:hidden"
          aria-hidden="true"
        />
      )}

      {/* Scrollable container */}
      <div ref={scrollRef} className="flex overflow-x-auto no-scrollbar snap-x snap-mandatory md:overflow-visible">
        {children}
      </div>

      {/* Right gradient fade - only visible when can scroll right */}
      {showGradients && canScrollRight && (
        <div
          className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-background to-transparent z-10 pointer-events-none md:hidden"
          aria-hidden="true"
        />
      )}
    </div>
  );
}
