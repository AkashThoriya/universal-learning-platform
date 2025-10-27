/**
 * @fileoverview Page Header Component
 *
 * Provides consistent page headers with titles, descriptions, and actions
 * across all pages in the application.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

'use client';

import { ArrowLeft } from 'lucide-react';
import Link from 'next/link';
import React, { ReactNode } from 'react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

interface PageHeaderProps {
  /**
   * Main page title
   */
  title: string;
  /**
   * Optional page description
   */
  description?: string;
  /**
   * Optional icon to display next to title
   */
  icon?: ReactNode;
  /**
   * Optional badge to display above title
   */
  badge?: {
    text: string;
    variant?: 'default' | 'secondary' | 'outline' | 'destructive';
  };
  /**
   * Optional back button configuration
   */
  backButton?: {
    href: string;
    label: string;
  };
  /**
   * Actions to display on the right side
   */
  actions?: ReactNode;
  /**
   * Additional content below the main header
   */
  children?: ReactNode;
  /**
   * Center align the header content
   * @default false
   */
  centered?: boolean;
  /**
   * Additional CSS classes
   */
  className?: string;
}

/**
 * Page Header Component
 *
 * Provides consistent page headers across the application
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
    <div className={cn('space-y-6', className)}>
      {/* Back Button */}
      {backButton && (
        <div className="flex items-center">
          <Link href={backButton.href}>
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              {backButton.label}
            </Button>
          </Link>
        </div>
      )}

      {/* Main Header */}
      <div className={cn('space-y-4', centered && 'text-center')}>
        {/* Badge */}
        {badge && (
          <div className={cn('inline-block', centered && 'block')}>
            <Badge variant={badge.variant || 'secondary'} className="px-4 py-2 text-sm">
              {badge.text}
            </Badge>
          </div>
        )}

        {/* Title Row */}
        <div className={cn('flex items-center justify-between', centered && 'flex-col space-y-4')}>
          <div className={cn('flex items-center space-x-3', centered && 'justify-center')}>
            {icon && (
              <div className="p-3 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white shadow-lg">
                {icon}
              </div>
            )}
            <div className={cn(centered && 'text-center')}>
              <h1 className={cn('text-3xl sm:text-4xl font-bold text-gray-900', centered && 'text-gradient')}>
                {title}
              </h1>
              {description && (
                <p className={cn('text-muted-foreground text-lg mt-1', centered && 'mt-2')}>{description}</p>
              )}
            </div>
          </div>

          {/* Actions */}
          {actions && !centered && <div className="flex items-center space-x-3">{actions}</div>}
        </div>

        {/* Centered Actions */}
        {actions && centered && <div className="flex justify-center items-center space-x-3">{actions}</div>}
      </div>

      {/* Additional Content */}
      {children && <div className={cn(centered && 'text-center')}>{children}</div>}
    </div>
  );
}

/**
 * Specialized page header variants
 */

/**
 * Simple page header with just title and description
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
      {...(description && { description })}
      {...(className && { className })}
      centered 
    />
  );
}

/**
 * Feature page header with badge and icon
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
      {...(description && { description })}
      {...(icon && { icon })}
      {...(badge && { badge: { text: badge } })}
      {...(actions && { actions })}
      {...(className && { className })}
      centered
    />
  );
}

/**
 * Detail page header with back button
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
      {...(description && { description })}
      backButton={{ href: backHref, label: backLabel }}
      {...(actions && { actions })}
      {...(className && { className })}
    />
  );
}
