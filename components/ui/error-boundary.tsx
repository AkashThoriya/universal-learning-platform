'use client';

import { AlertTriangle, RefreshCw, Home } from 'lucide-react';

import { Component, ReactNode, ErrorInfo, ComponentType, useCallback } from 'react';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: ComponentType<ErrorFallbackProps>;
  onError?: (error: Error, errorInfo: ErrorInfo) => void;
}

interface ErrorFallbackProps {
  error: Error;
  resetError: () => void;
  onNavigateHome?: () => void;
}

/**
 * Default error fallback component with improved UX
 */
function DefaultErrorFallback({ error, resetError, onNavigateHome }: ErrorFallbackProps) {
  const isDevelopment = process.env.NODE_ENV === 'development';

  return (
    <div className="min-h-screen bg-gradient-to-br from-red-50 to-orange-50 flex items-center justify-center p-4">
      <Card className="w-full max-w-2xl border-red-200">
        <CardHeader className="text-center">
          <div className="mx-auto w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <AlertTriangle className="w-8 h-8 text-red-600" />
          </div>
          <CardTitle className="text-2xl font-bold text-red-900">Something went wrong</CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <div className="text-center">
            <p className="text-gray-600 mb-4">
              We encountered an unexpected error. Our team has been notified and is working on a fix.
            </p>

            {isDevelopment && (
              <Alert variant="destructive" className="text-left">
                <AlertTriangle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Development Error:</strong>
                  <pre className="mt-2 text-xs overflow-auto max-h-32">
                    {error.message}
                    {error.stack && `\n\nStack trace:\n${error.stack}`}
                  </pre>
                </AlertDescription>
              </Alert>
            )}
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Button onClick={resetError} className="flex items-center gap-2" variant="default">
              <RefreshCw className="w-4 h-4" />
              Try Again
            </Button>

            <Button
              onClick={onNavigateHome || (() => (window.location.href = '/'))}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Home className="w-4 h-4" />
              Go Home
            </Button>
          </div>

          <div className="text-center text-sm text-gray-500">
            <p>If this problem persists, please contact support.</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

/**
 * Enhanced Error Boundary with better error handling and user experience
 */
export class ErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.setState({
      error,
      errorInfo,
    });

    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo);
    }

    // Call optional error handler
    if (this.props.onError) {
      this.props.onError(error, errorInfo);
    }

    // In production, you would send this to your error reporting service
    // Example: Sentry.captureException(error, { contexts: { react: errorInfo } });
  }

  resetError = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    });
  };

  render() {
    if (this.state.hasError && this.state.error) {
      const FallbackComponent = this.props.fallback || DefaultErrorFallback;

      return <FallbackComponent error={this.state.error} resetError={this.resetError} />;
    }

    return this.props.children;
  }
}

/**
 * Hook for functional components to handle errors
 */
export function useErrorHandler() {
  return useCallback((error: Error, _errorInfo?: ErrorInfo) => {
    console.error('Error caught by useErrorHandler:', error);

    // In production, send to error reporting service
    // Example: Sentry.captureException(error, { extra: errorInfo });

    // You could also set global error state here
    // Example: dispatch({ type: 'SET_GLOBAL_ERROR', error });
  }, []);
}

/**
 * Simple error fallback for specific components
 */
export function SimpleErrorFallback({
  error,
  resetError,
  title = 'Something went wrong',
  description = 'Please try again or contact support if the problem persists.',
}: {
  error: Error;
  resetError: () => void;
  title?: string;
  description?: string;
}) {
  return (
    <Alert variant="destructive" className="my-4">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription>
        <div className="space-y-3">
          <div>
            <h4 className="font-medium">{title}</h4>
            <p className="text-sm mt-1">{description}</p>
          </div>

          {process.env.NODE_ENV === 'development' && (
            <details className="text-xs">
              <summary className="cursor-pointer font-medium">Error Details (Development)</summary>
              <pre className="mt-2 p-2 bg-gray-100 rounded text-xs overflow-auto max-h-32">
                {error.message}
                {error.stack && `\n\n${error.stack}`}
              </pre>
            </details>
          )}

          <Button onClick={resetError} size="sm" variant="outline" className="flex items-center gap-2">
            <RefreshCw className="w-3 h-3" />
            Try Again
          </Button>
        </div>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Wrapper component for individual features
 */
export function FeatureErrorBoundary({
  children,
  featureName,
  fallbackMessage,
}: {
  children: ReactNode;
  featureName: string;
  fallbackMessage?: string;
}) {
  return (
    <ErrorBoundary
      fallback={({ error, resetError }) => (
        <SimpleErrorFallback
          error={error}
          resetError={resetError}
          title={`Error in ${featureName}`}
          description={fallbackMessage || `There was an issue with the ${featureName} feature.`}
        />
      )}
      onError={(error, errorInfo) => {
        console.error(`Error in ${featureName}:`, error, errorInfo);
        // Log feature-specific errors
      }}
    >
      {children}
    </ErrorBoundary>
  );
}

export default ErrorBoundary;
