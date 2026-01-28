/**
 * @fileoverview Premium Page Header Component
 *
 * Provides consistent, beautifully designed page headers with titles,
 * descriptions, icons, and actions across all pages in the application.
 * Features glass-morphism, subtle animations, and responsive design.
 *
 * @author Exam Strategy Engine Team
 * @version 2.0.0
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils/utils';

interface PageHeaderProps {
  /** Main page title */
  title: string;
  /** Optional page description */
  description?: string;
  /** Optional icon to display next to title */
  icon?: ReactNode;
  /** Optional badge configuration */
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  };
  /** Optional back button configuration */
  backButton?: {
    href: string;
    label: string;
  };
  /** Actions to display (right side on desktop, below on mobile) */
  actions?: ReactNode;
  /** Additional content below the main header */
  children?: ReactNode;
  /** Center align the header content @default false */
  centered?: boolean;
  /** Additional CSS classes */
  className?: string;
}

/**
 * Premium Page Header Component
 *
 * Features:
 * - Glass-morphism background option
 * - Gradient icon backgrounds
 * - Responsive layout (stacks on mobile)
 * - Smooth animations
 * - Consistent spacing across all devices
 */
export default function PageHeader({
  title,
  description,
  icon,
  badge,
  backButton,
  actions,
  children,
  centered = false,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn('space-y-4', className)}>
      {/* Back Button */}
      {backButton && (
        <div className="flex items-center">
          <Link href={backButton.href}>
            <Button
              variant="ghost"
              size="sm"
              className="gap-2 text-muted-foreground hover:text-foreground transition-colors"
            >
              <ArrowLeft className="h-4 w-4" />
              {backButton.label}
            </Button>
          </Link>
        </div>
      )}

      {/* Main Header Container */}
      <div
        className={cn(
          'flex flex-col gap-4',
          centered ? 'items-center text-center' : 'sm:flex-row sm:items-start sm:justify-between'
        )}
      >
        {/* Left Section: Icon + Title + Description */}
        <div className={cn('flex items-start gap-4', centered && 'flex-col items-center')}>
          {/* Icon with gradient background */}
          {icon && (
            <div className="shrink-0 p-3 rounded-xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-primary/10 shadow-sm">
              <div className="text-primary">{icon}</div>
            </div>
          )}

          {/* Title and Description */}
          <div className={cn('space-y-1', centered && 'text-center')}>
            {/* Badge */}
            {badge && (
              <Badge variant={badge.variant || 'secondary'} className="mb-2 px-3 py-1 text-xs font-medium">
                {badge.text}
              </Badge>
            )}

            {/* Title */}
            <h1
              className={cn(
                'text-2xl sm:text-3xl font-bold tracking-tight',
                centered
                  ? 'bg-gradient-to-r from-gray-900 via-gray-800 to-gray-900 dark:from-white dark:via-gray-200 dark:to-white bg-clip-text text-transparent'
                  : 'text-foreground'
              )}
            >
              {title}
            </h1>

            {/* Description */}
            {description && <p className="text-sm sm:text-base text-muted-foreground max-w-2xl">{description}</p>}
          </div>
        </div>

        {/* Right Section: Actions */}
        {actions && (
          <div
            className={cn(
              'flex items-center gap-2 shrink-0',
              centered ? 'justify-center' : 'self-start sm:self-center'
            )}
          >
            {actions}
          </div>
        )}
      </div>

      {/* Additional Content */}
      {children && <div className={cn(centered && 'text-center')}>{children}</div>}
    </div>
  );
}

/**
 * ============================================
 * Specialized Header Variants
 * ============================================
 */

/**
 * Simple page header with just title and description
 * Best for: Settings pages, simple list pages
 */
export function SimplePageHeader({
  title,
  description,
  className,
}: {
  title: string;
  description?: string;
  className?: string;
}) {
  return (
    <PageHeader
      title={title}
      {...(description !== undefined && { description })}
      {...(className !== undefined && { className })}
    />
  );
}

/**
 * Feature page header with icon and optional actions
 * Best for: Main feature pages (Syllabus, Review, Test, etc.)
 *
 * @example
 * ```tsx
 * <FeaturePageHeader
 *   title="Concept Review"
 *   description="Topics flagged for review"
 *   icon={<AlertTriangle className="h-5 w-5" />}
 *   actions={<Badge>{count} items</Badge>}
 * />
 * ```
 */
export function FeaturePageHeader({
  title,
  description,
  icon,
  badge,
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <PageHeader
      title={title}
      {...(description !== undefined && { description })}
      {...(icon !== undefined && { icon })}
      {...(badge !== undefined && { badge: { text: badge } })}
      {...(actions !== undefined && { actions })}
      {...(className !== undefined && { className })}
    />
  );
}

/**
 * Centered feature header for dashboard-style pages
 * Best for: Dashboard, Syllabus overview, Journey planning
 */
export function CenteredPageHeader({
  title,
  description,
  icon,
  badge,
  actions,
  className,
}: {
  title: string;
  description?: string;
  icon?: ReactNode;
  badge?: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <PageHeader
      title={title}
      {...(description !== undefined && { description })}
      {...(icon !== undefined && { icon })}
      {...(badge !== undefined && { badge: { text: badge } })}
      {...(actions !== undefined && { actions })}
      {...(className !== undefined && { className })}
      centered
    />
  );
}

/**
 * Detail page header with back button
 * Best for: Topic details, Journey details, Test results
 */
export function DetailPageHeader({
  title,
  description,
  backHref,
  backLabel,
  actions,
  className,
}: {
  title: string;
  description?: string;
  backHref: string;
  backLabel: string;
  actions?: ReactNode;
  className?: string;
}) {
  return (
    <PageHeader
      title={title}
      {...(description !== undefined && { description })}
      backButton={{ href: backHref, label: backLabel }}
      {...(actions !== undefined && { actions })}
      {...(className !== undefined && { className })}
    />
  );
}
