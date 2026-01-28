'use client';

import { motion } from 'framer-motion';
import { ReactNode } from 'react';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { cn } from '@/lib/utils/utils';

interface SkeletonCardProps {
  children: ReactNode;
  className?: string;
  index?: number;
  showHeader?: boolean;
  headerContent?: ReactNode;
}

/**
 * Base skeleton card wrapper with shimmer effect and staggered animation.
 * Use this as a foundation for specific skeleton components.
 */
export function SkeletonCard({ children, className, index = 0, showHeader = false, headerContent }: SkeletonCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20, scale: 0.95 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ delay: index * 0.08, duration: 0.4 }}
    >
      <Card className={cn('border-0 shadow-lg overflow-hidden bg-white', className)}>
        {showHeader && (
          <CardHeader className="pb-3 relative">
            <ShimmerOverlay index={index} />
            {headerContent}
          </CardHeader>
        )}
        <CardContent className="relative">
          <ShimmerOverlay index={index} delay={0.3} />
          {children}
        </CardContent>
      </Card>
    </motion.div>
  );
}

interface ShimmerOverlayProps {
  index?: number;
  delay?: number;
}

/**
 * Shimmer effect overlay for skeleton loading states.
 */
export function ShimmerOverlay({ index = 0, delay = 0 }: ShimmerOverlayProps) {
  return (
    <motion.div
      className="absolute inset-0 bg-gradient-to-r from-transparent via-white/60 to-transparent z-10"
      animate={{ x: ['-100%', '100%'] }}
      transition={{
        duration: 1.5,
        repeat: Infinity,
        ease: 'linear',
        delay: index * 0.15 + delay,
      }}
    />
  );
}

interface SkeletonGridProps {
  count: number;
  columns?: {
    default: number;
    md?: number;
    lg?: number;
  };
  gap?: number;
  children: (index: number) => ReactNode;
  className?: string;
}

/**
 * Grid wrapper for skeleton cards with configurable columns.
 */
export function SkeletonGrid({
  count,
  columns = { default: 1, md: 2, lg: 3 },
  gap = 6,
  children,
  className,
}: SkeletonGridProps) {
  const gridCols = cn(
    `grid-cols-${columns.default}`,
    columns.md && `md:grid-cols-${columns.md}`,
    columns.lg && `lg:grid-cols-${columns.lg}`
  );

  return (
    <div className={cn(`grid gap-${gap}`, gridCols, className)}>
      {Array.from({ length: count }, (_, i) => children(i))}
    </div>
  );
}
