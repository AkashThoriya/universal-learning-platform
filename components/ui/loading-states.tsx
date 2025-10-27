/**
 * @fileoverview Enterprise Loading States and Skeleton Components
 *
 * Comprehensive loading state components that provide excellent UX
 * during data fetching and processing. Includes skeleton screens,
 * progressive loading indicators, and accessible loading feedback.
 *
 * @author Exam Strategy Engine Team
 * @version 2.0.0
 */

import { Loader2, RefreshCw, AlertCircle, CheckCircle, Clock, WifiOff } from 'lucide-react';
import React from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

// ============================================================================
// ENHANCED LOADING SPINNER COMPONENTS
// ============================================================================

/**
 * Advanced loading spinner with multiple variants and sizes
 */
export function LoadingSpinner({
  size = 'medium',
  color = 'primary',
  message = 'Loading...',
  className = '',
  showMessage = true,
}: {
  size?: 'small' | 'medium' | 'large' | 'xl';
  color?: 'primary' | 'secondary' | 'success' | 'warning' | 'danger';
  message?: string;
  className?: string;
  showMessage?: boolean;
}) {
  const sizeClasses = {
    small: 'h-4 w-4',
    medium: 'h-6 w-6',
    large: 'h-8 w-8',
    xl: 'h-12 w-12',
  };

  const colorClasses = {
    primary: 'text-blue-600',
    secondary: 'text-gray-600',
    success: 'text-green-600',
    warning: 'text-yellow-600',
    danger: 'text-red-600',
  };

  return (
    <div className={`flex items-center justify-center space-x-3 ${className}`} role="status" aria-live="polite">
      <Loader2 className={`animate-spin ${sizeClasses[size]} ${colorClasses[color]}`} />
      {showMessage && message && <span className="text-sm text-gray-600 animate-pulse font-medium">{message}</span>}
      <span className="sr-only">{message}</span>
    </div>
  );
}

/**
 * Gradient loading spinner for premium experience
 */
export function GradientSpinner({ size = 'large', className = '' }: { size?: 'medium' | 'large'; className?: string }) {
  const sizeClasses = {
    medium: 'h-8 w-8',
    large: 'h-12 w-12',
  };

  return (
    <div className={`relative ${sizeClasses[size]} ${className}`}>
      <div className="absolute inset-0 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 animate-spin">
        <div className="absolute inset-1 rounded-full bg-white" />
      </div>
    </div>
  );
}

/**
 * Full-page loading overlay with enhanced design
 */
export function PageLoadingOverlay({
  message = 'Loading...',
  submessage = 'Please wait while we prepare your content',
  showProgress = false,
  progress = 0,
}: {
  message?: string;
  submessage?: string;
  showProgress?: boolean;
  progress?: number;
}) {
  return (
    <div className="fixed inset-0 bg-white/95 backdrop-blur-sm flex items-center justify-center z-50">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md w-full mx-4 border border-gray-100">
        <div className="text-center space-y-6">
          <div className="flex justify-center">
            <div className="relative">
              <div className="absolute inset-0 blur-xl opacity-30 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
              <GradientSpinner size="large" />
            </div>
          </div>

          <div className="space-y-2">
            <h3 className="text-lg font-semibold text-gray-900">{message}</h3>
            <p className="text-sm text-gray-600">{submessage}</p>
          </div>

          {showProgress && (
            <div className="space-y-2">
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div
                  className="bg-gradient-to-r from-blue-500 to-purple-500 h-2 rounded-full transition-all duration-300 ease-out"
                  style={{ width: `${Math.min(100, Math.max(0, progress))}%` }}
                />
              </div>
              <p className="text-xs text-gray-500">{Math.round(progress)}% complete</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ============================================================================
// ENHANCED SKELETON COMPONENTS
// ============================================================================

/**
 * Advanced skeleton with shimmer effect
 */
export function Skeleton({
  className = '',
  width = 'w-full',
  height = 'h-4',
  rounded = 'rounded',
  shimmer = true,
}: {
  className?: string;
  width?: string;
  height?: string;
  rounded?: string;
  shimmer?: boolean;
}) {
  return (
    <div
      className={`bg-gray-200 ${shimmer ? 'animate-pulse' : ''} ${width} ${height} ${rounded} ${className}`}
      role="progressbar"
      aria-label="Loading content"
    >
      {shimmer && (
        <div className="h-full w-full bg-gradient-to-r from-transparent via-white/60 to-transparent animate-[shimmer_2s_infinite] bg-[length:200%_100%]" />
      )}
    </div>
  );
}

/**
 * Enhanced card skeleton with better visual hierarchy
 */
export function CardSkeleton({ className = '' }: { className?: string }) {
  return (
    <Card className={`w-full ${className}`}>
      <CardHeader className="space-y-3">
        <div className="flex items-center justify-between">
          <Skeleton height="h-6" width="w-3/4" />
          <Skeleton height="h-5" width="w-16" rounded="rounded-full" />
        </div>
        <Skeleton height="h-4" width="w-1/2" />
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="space-y-2">
          <Skeleton height="h-4" width="w-full" />
          <Skeleton height="h-4" width="w-5/6" />
          <Skeleton height="h-4" width="w-4/6" />
        </div>
        <div className="flex justify-between items-center pt-2">
          <Skeleton height="h-8" width="w-20" rounded="rounded-md" />
          <Skeleton height="h-8" width="w-24" rounded="rounded-md" />
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * Dashboard-specific skeleton
 */
export function DashboardSkeleton() {
  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="space-y-3">
        <Skeleton height="h-8" width="w-1/3" />
        <Skeleton height="h-4" width="w-1/2" />
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {Array.from({ length: 4 }).map((_, i) => (
          <Card key={i} className="animate-pulse">
            <CardContent className="p-6">
              <div className="flex items-center space-x-3">
                <Skeleton width="w-12" height="h-12" rounded="rounded-lg" />
                <div className="flex-1 space-y-2">
                  <Skeleton height="h-4" width="w-3/4" />
                  <Skeleton height="h-6" width="w-1/2" />
                  <Skeleton height="h-3" width="w-2/3" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Main Content */}
      <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-6">
        <CardSkeleton className="lg:col-span-2" />
        <CardSkeleton />
      </div>
    </div>
  );
}

/**
 * Mission-specific skeleton
 */
export function MissionCardSkeleton() {
  return (
    <Card className="w-full">
      <CardContent className="p-6">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1">
            <div className="flex items-start space-x-4">
              <Skeleton width="w-12" height="h-12" rounded="rounded-lg" />

              <div className="flex-1 space-y-3">
                <div className="flex items-center space-x-3">
                  <Skeleton height="h-5" width="w-48" />
                  <Skeleton height="h-6" width="w-20" rounded="rounded-full" />
                </div>

                <Skeleton height="h-4" width="w-full" />

                <div className="flex items-center space-x-3">
                  <Skeleton height="h-4" width="w-16" />
                  <Skeleton height="h-5" width="w-12" rounded="rounded-full" />
                  <Skeleton height="h-5" width="w-16" rounded="rounded-full" />
                </div>

                <div className="space-y-2">
                  <div className="flex justify-between">
                    <Skeleton height="h-3" width="w-16" />
                    <Skeleton height="h-3" width="w-12" />
                  </div>
                  <Skeleton height="h-2" width="w-full" rounded="rounded-full" />
                </div>
              </div>
            </div>
          </div>

          <div className="flex items-center space-x-3">
            <div className="text-right space-y-1">
              <Skeleton height="h-3" width="w-16" />
              <Skeleton height="h-4" width="w-20" />
            </div>
            <Skeleton height="h-9" width="w-24" rounded="rounded-md" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

/**
 * List skeleton with improved structure
 */
export function ListItemSkeleton({ count = 5 }: { count?: number }) {
  return (
    <div className="space-y-3">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="flex items-center space-x-4 p-4 border border-gray-100 rounded-lg">
          <Skeleton height="h-12" width="w-12" rounded="rounded-full" />
          <div className="flex-1 space-y-2">
            <Skeleton height="h-4" width="w-3/4" />
            <Skeleton height="h-3" width="w-1/2" />
          </div>
          <Skeleton height="h-8" width="w-20" rounded="rounded-md" />
        </div>
      ))}
    </div>
  );
}

/**
 * Table skeleton with header
 */
export function TableSkeleton({ rows = 5, columns = 4 }: { rows?: number; columns?: number }) {
  return (
    <div className="w-full border border-gray-200 rounded-lg overflow-hidden">
      {/* Header */}
      <div className={`grid grid-cols-${columns} gap-4 p-4 bg-gray-50 border-b border-gray-200`}>
        {Array.from({ length: columns }).map((_, i) => (
          <Skeleton key={i} height="h-4" width="w-20" />
        ))}
      </div>

      {/* Rows */}
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className={`grid grid-cols-${columns} gap-4 p-4 border-b border-gray-100 last:border-b-0`}>
          {Array.from({ length: columns }).map((_, colIndex) => (
            <Skeleton key={colIndex} height="h-4" width="w-full" />
          ))}
        </div>
      ))}
    </div>
  );
}

// ============================================================================
// ENHANCED ERROR AND EMPTY STATES
// ============================================================================

/**
 * Comprehensive error display component
 */
export function ErrorDisplay({
  title = 'Something went wrong',
  message = 'We encountered an unexpected error. Please try again.',
  error,
  onRetry,
  onGoHome,
  showRetry = true,
  showDetails = false,
  variant = 'default',
}: {
  title?: string;
  message?: string;
  error?: Error | string;
  onRetry?: () => void;
  onGoHome?: () => void;
  showRetry?: boolean;
  showDetails?: boolean;
  variant?: 'default' | 'compact' | 'inline';
}) {
  const errorMessage = typeof error === 'string' ? error : (error?.message || message);

  if (variant === 'compact') {
    return (
      <Alert className="border-red-200 bg-red-50">
        <AlertCircle className="h-4 w-4 text-red-600" />
        <AlertDescription className="text-red-800 flex items-center justify-between">
          <span>{errorMessage}</span>
          {showRetry && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry} className="ml-2 h-6 px-2 text-xs hover:bg-red-100">
              <RefreshCw className="h-3 w-3 mr-1" />
              Retry
            </Button>
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (variant === 'inline') {
    return (
      <div className="p-4 border border-red-200 bg-red-50 rounded-lg">
        <div className="flex items-center space-x-2">
          <AlertCircle className="h-5 w-5 text-red-600" />
          <div className="flex-1">
            <h4 className="font-medium text-red-800">{title}</h4>
            <p className="text-sm text-red-700">{errorMessage}</p>
          </div>
          {showRetry && onRetry && (
            <Button variant="outline" size="sm" onClick={onRetry}>
              <RefreshCw className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-8 text-center max-w-md mx-auto">
      <div className="rounded-full bg-red-100 p-4 mb-6">
        <AlertCircle className="h-8 w-8 text-red-600" />
      </div>

      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-6">{errorMessage}</p>

      {showDetails && error && typeof error !== 'string' && (
        <Alert className="text-left mb-6 max-w-sm">
          <AlertDescription className="font-mono text-xs break-all">{error.stack}</AlertDescription>
        </Alert>
      )}

      <div className="flex space-x-3">
        {showRetry && onRetry && (
          <Button onClick={onRetry} className="gap-2">
            <RefreshCw className="h-4 w-4" />
            Try Again
          </Button>
        )}
        {onGoHome && (
          <Button variant="outline" onClick={onGoHome}>
            Go Back
          </Button>
        )}
      </div>
    </div>
  );
}

/**
 * Enhanced empty state component
 */
export function EmptyState({
  title = 'No data found',
  message = 'There are no items to display at the moment.',
  actionLabel,
  onAction,
  icon: Icon = Clock,
  variant = 'default',
}: {
  title?: string;
  message?: string;
  actionLabel?: string;
  onAction?: () => void;
  icon?: React.ComponentType<React.SVGProps<SVGSVGElement>>;
  variant?: 'default' | 'compact';
}) {
  if (variant === 'compact') {
    return (
      <div className="text-center py-8">
        <Icon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{message}</p>
        {actionLabel && onAction && (
          <Button onClick={onAction} variant="outline">
            {actionLabel}
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center justify-center p-12 text-center">
      <div className="rounded-full bg-gray-100 p-4 mb-6">
        <Icon className="h-8 w-8 text-gray-400" />
      </div>
      <h3 className="text-xl font-semibold text-gray-900 mb-3">{title}</h3>
      <p className="text-gray-600 mb-6 max-w-sm">{message}</p>
      {actionLabel && onAction && (
        <Button onClick={onAction} className="gap-2">
          {actionLabel}
        </Button>
      )}
    </div>
  );
}

// ============================================================================
// SUCCESS AND CONNECTIVITY COMPONENTS
// ============================================================================

/**
 * Success animation component
 */
export function SuccessAnimation({ message = 'Success!', className = '' }: { message?: string; className?: string }) {
  return (
    <div className={`text-center space-y-4 ${className}`}>
      <div className="flex justify-center">
        <div className="rounded-full bg-green-100 p-4 animate-bounce">
          <CheckCircle className="h-8 w-8 text-green-600" />
        </div>
      </div>
      <p className="text-lg font-semibold text-green-800">{message}</p>
    </div>
  );
}

/**
 * Connectivity indicator
 */
export function ConnectivityIndicator({ isOnline, className = '' }: { isOnline: boolean; className?: string }) {
  if (isOnline) {
    return null;
  }

  return (
    <Alert className={`border-yellow-200 bg-yellow-50 ${className}`}>
      <WifiOff className="h-4 w-4 text-yellow-600" />
      <AlertDescription className="text-yellow-800">
        You're currently offline. Some features may not be available.
      </AlertDescription>
    </Alert>
  );
}

// ============================================================================
// PROGRESSIVE LOADING COMPONENTS
// ============================================================================

/**
 * Progressive loading with multiple stages
 */
export function ProgressiveLoader({
  stages,
  currentStage,
  className = '',
}: {
  stages: string[];
  currentStage: number;
  className?: string;
}) {
  const progress = ((currentStage + 1) / stages.length) * 100;

  return (
    <div className={`space-y-6 ${className}`}>
      <div className="text-center">
        <GradientSpinner size="large" className="mx-auto mb-4" />
        <h3 className="text-xl font-semibold text-gray-900 mb-2">{stages[currentStage] || 'Loading...'}</h3>
        <p className="text-gray-600">Please wait while we prepare everything for you</p>
      </div>

      <div className="space-y-2">
        <div className="w-full bg-gray-200 rounded-full h-3">
          <div
            className="bg-gradient-to-r from-blue-500 to-purple-500 h-3 rounded-full transition-all duration-700 ease-out"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-sm text-gray-500">
          <span>
            Step {currentStage + 1} of {stages.length}
          </span>
          <span>{Math.round(progress)}%</span>
        </div>
      </div>
    </div>
  );
}

/**
 * Smart loading wrapper with enhanced logic
 */
export function SmartLoading({
  isLoading,
  error,
  isEmpty = false,
  children,
  loadingComponent,
  errorComponent,
  emptyComponent,
  onRetry,
  className = '',
  loadingDelay = 200,
}: {
  isLoading: boolean;
  error?: Error | string | null;
  isEmpty?: boolean;
  children: React.ReactNode;
  loadingComponent?: React.ReactNode;
  errorComponent?: React.ReactNode;
  emptyComponent?: React.ReactNode;
  onRetry?: () => void;
  className?: string;
  loadingDelay?: number;
}) {
  const [showLoading, setShowLoading] = React.useState(false);

  React.useEffect(() => {
    let timeout: NodeJS.Timeout;

    if (isLoading) {
      timeout = setTimeout(() => {
        setShowLoading(true);
      }, loadingDelay);
    } else {
      setShowLoading(false);
    }

    return () => {
      if (timeout) {
        clearTimeout(timeout);
      }
    };
  }, [isLoading, loadingDelay]);

  if (error) {
    return (
      <div className={className}>{errorComponent || <ErrorDisplay error={error} {...(onRetry && { onRetry })} />}</div>
    );
  }

  if (isLoading && showLoading) {
    return <div className={className}>{loadingComponent || <LoadingSpinner size="large" />}</div>;
  }

  if (isLoading) {
    return null; // Don't show anything for the first few milliseconds
  }

  if (isEmpty) {
    return (
      <div className={className}>
        {emptyComponent || <EmptyState title="No data available" message="There's nothing to show here yet." />}
      </div>
    );
  }

  return <div className={className}>{children}</div>;
}

/**
 * Intersection observer loading component for infinite scroll
 */
export function LoadingTrigger({
  onIntersect,
  isLoading = false,
  threshold = 0.1,
  className = '',
}: {
  onIntersect: () => void;
  isLoading?: boolean;
  threshold?: number;
  className?: string;
}) {
  const triggerRef = React.useRef<HTMLDivElement>(null);

  React.useEffect(() => {
    const trigger = triggerRef.current;
    if (!trigger) {
      return;
    }

    const observer = new IntersectionObserver(
      entries => {
        if (entries[0]?.isIntersecting && !isLoading) {
          onIntersect();
        }
      },
      { threshold }
    );

    observer.observe(trigger);

    return () => {
      observer.unobserve(trigger);
    };
  }, [onIntersect, isLoading, threshold]);

  return (
    <div ref={triggerRef} className={`py-4 ${className}`}>
      {isLoading && <LoadingSpinner message="Loading more..." className="justify-center" />}
    </div>
  );
}
