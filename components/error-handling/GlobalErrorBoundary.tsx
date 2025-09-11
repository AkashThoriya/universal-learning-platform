/**
 * @fileoverview Global Error Boundary Component
 *
 * Provides application-wide error handling with detailed error reporting,
 * fallback UI, and automatic error recovery mechanisms.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

'use client';

import { AlertTriangle, RefreshCw, Home, Bug } from 'lucide-react';
import React, { Component, ReactNode } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

// Simple logger for error reporting
const logger = {
  error: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.error(message, data);
    }
    // In production, this could send to an external logging service
  },
  warn: (_message: string, _data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      // console.warn(message, data);
    }
  },
  info: (message: string, data?: unknown) => {
    if (process.env.NODE_ENV === 'development') {
      console.info(message, data);
    }
  },
};

// ============================================================================
// TYPES
// ============================================================================

interface ErrorInfo {
  componentStack: string;
  errorBoundary?: string;
  errorBoundaryStack?: string;
}

interface ErrorBoundaryState {
  hasError: boolean;
  error: Error | null;
  errorInfo: ErrorInfo | null;
  errorId: string | null;
  retryCount: number;
  isReporting: boolean;
}

interface ErrorBoundaryProps {
  children: ReactNode;
  fallback?: (error: Error, errorInfo: ErrorInfo, retry: () => void) => ReactNode;
  onError?: (error: Error, errorInfo: ErrorInfo, errorId: string) => void;
  maxRetries?: number;
  showDetails?: boolean;
  level?: 'page' | 'component' | 'global';
}

// ============================================================================
// ERROR REPORTING
// ============================================================================

class ErrorReporter {
  private static instance: ErrorReporter;
  private reportedErrors = new Set<string>();

  static getInstance(): ErrorReporter {
    if (!ErrorReporter.instance) {
      ErrorReporter.instance = new ErrorReporter();
    }
    return ErrorReporter.instance;
  }

  async reportError(error: Error, errorInfo: ErrorInfo, context: Record<string, unknown> = {}): Promise<string> {
    const errorId = this.generateErrorId(error);

    // Prevent duplicate reporting
    if (this.reportedErrors.has(errorId)) {
      return errorId;
    }

    this.reportedErrors.add(errorId);

    const errorData = {
      errorId,
      message: error.message,
      stack: error.stack,
      componentStack: errorInfo.componentStack,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'SSR',
      url: typeof window !== 'undefined' ? window.location.href : 'SSR',
      userId: context.userId ?? 'anonymous',
      sessionId: context.sessionId ?? 'unknown',
      buildVersion: process.env.NEXT_PUBLIC_BUILD_VERSION ?? 'unknown',
      ...context,
    };

    try {
      // Log to console in development
      if (process.env.NODE_ENV === 'development') {
        console.group(`🚨 Error Boundary: ${errorId}`);
        console.error('Error:', error);
        console.error('Component Stack:', errorInfo.componentStack);
        console.error('Context:', context);
        console.groupEnd();
      }

      // Log using performance utils
      logger.error('Error Boundary Caught Error', errorData);

      // Report to external service (if configured)
      if (process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT) {
        await fetch(process.env.NEXT_PUBLIC_ERROR_REPORTING_ENDPOINT, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(errorData),
        });
      }

      return errorId;
    } catch (reportingError) {
      console.error('Failed to report error:', reportingError);
      return errorId;
    }
  }

  private generateErrorId(error: Error): string {
    const hash = error.message + error.stack;
    return btoa(hash).slice(0, 12);
  }

  clearReportedErrors(): void {
    this.reportedErrors.clear();
  }
}

// ============================================================================
// ERROR BOUNDARY COMPONENT
// ============================================================================

export class GlobalErrorBoundary extends Component<ErrorBoundaryProps, ErrorBoundaryState> {
  private errorReporter = ErrorReporter.getInstance();
  private retryTimeout: NodeJS.Timeout | null = null;

  constructor(props: ErrorBoundaryProps) {
    super(props);
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: 0,
      isReporting: false,
    };
  }

  static getDerivedStateFromError(error: Error): Partial<ErrorBoundaryState> {
    return {
      hasError: true,
      error,
    };
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    this.handleError(error, errorInfo);
  }

  private async handleError(error: Error, errorInfo: ErrorInfo) {
    const isDevelopment = process.env.NODE_ENV === 'development';

    if (isDevelopment) {
      console.error('Global Error Boundary caught an error:', error);
      console.error('Error Info:', errorInfo);
    }

    this.setState({
      isReporting: true,
    });

    try {
      const errorId = await this.errorReporter.reportError(error, errorInfo, {
        level: this.props.level ?? 'global',
        retryCount: this.state.retryCount,
      });

      this.setState({
        errorInfo,
        errorId,
        isReporting: false,
      });

      // Call custom error handler
      this.props.onError?.(error, errorInfo, errorId);

      // Auto-retry for recoverable errors
      if (this.isRecoverableError(error) && this.state.retryCount < (this.props.maxRetries ?? 3)) {
        this.scheduleRetry();
      }
    } catch (reportingError) {
      console.error('Error reporting failed:', reportingError);
      this.setState({ isReporting: false });
    }
  }

  private isRecoverableError(error: Error): boolean {
    const recoverablePatterns = [/ChunkLoadError/, /Loading chunk/, /Failed to fetch/, /NetworkError/, /TimeoutError/];

    return recoverablePatterns.some(pattern => pattern.test(error.message) || pattern.test(error.name));
  }

  private scheduleRetry() {
    this.retryTimeout = setTimeout(
      () => {
        this.handleRetry();
      },
      Math.min(1000 * Math.pow(2, this.state.retryCount), 10000)
    ); // Exponential backoff, max 10s
  }

  private handleRetry = () => {
    this.setState(prevState => ({
      hasError: false,
      error: null,
      errorInfo: null,
      errorId: null,
      retryCount: prevState.retryCount + 1,
      isReporting: false,
    }));
  };

  private handleManualRetry = () => {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
      this.retryTimeout = null;
    }
    this.handleRetry();
  };

  private handleGoHome = () => {
    if (typeof window !== 'undefined') {
      window.location.href = '/dashboard';
    }
  };

  private handleReload = () => {
    if (typeof window !== 'undefined') {
      window.location.reload();
    }
  };

  componentWillUnmount() {
    if (this.retryTimeout) {
      clearTimeout(this.retryTimeout);
    }
  }

  render() {
    if (this.state.hasError && this.state.error) {
      // Use custom fallback if provided
      if (this.props.fallback && this.state.errorInfo) {
        return this.props.fallback(this.state.error, this.state.errorInfo, this.handleManualRetry);
      }

      // Default error UI
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50 px-4">
          <Card className="max-w-lg w-full p-6">
            <div className="text-center space-y-4">
              {/* Error Icon */}
              <div className="flex justify-center">
                <div className="rounded-full bg-red-100 p-3">
                  <AlertTriangle className="h-8 w-8 text-red-600" />
                </div>
              </div>

              {/* Error Title */}
              <div>
                <h1 className="text-xl font-semibold text-gray-900">Oops! Something went wrong</h1>
                <p className="text-gray-600 mt-2">
                  We encountered an unexpected error. Don't worry, we've been notified and are working on a fix.
                </p>
              </div>

              {/* Error Details (Development only) */}
              {(this.props.showDetails ?? process.env.NODE_ENV === 'development') && (
                <Alert className="text-left">
                  <Bug className="h-4 w-4" />
                  <AlertDescription className="font-mono text-xs">
                    <strong>Error:</strong> {this.state.error.message}
                    {this.state.errorId && (
                      <>
                        <br />
                        <strong>ID:</strong> {this.state.errorId}
                      </>
                    )}
                  </AlertDescription>
                </Alert>
              )}

              {/* Reporting Status */}
              {this.state.isReporting && (
                <Alert>
                  <AlertDescription>Reporting error... Please wait.</AlertDescription>
                </Alert>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Button
                  onClick={this.handleManualRetry}
                  disabled={this.state.isReporting}
                  className="flex items-center gap-2"
                >
                  <RefreshCw className="h-4 w-4" />
                  Try Again
                </Button>

                <Button variant="outline" onClick={this.handleGoHome} className="flex items-center gap-2">
                  <Home className="h-4 w-4" />
                  Go to Dashboard
                </Button>

                <Button variant="outline" onClick={this.handleReload} className="flex items-center gap-2">
                  <RefreshCw className="h-4 w-4" />
                  Reload Page
                </Button>
              </div>

              {/* Retry Count */}
              {this.state.retryCount > 0 && (
                <p className="text-sm text-gray-500">
                  Retry attempt: {this.state.retryCount} / {this.props.maxRetries ?? 3}
                </p>
              )}
            </div>
          </Card>
        </div>
      );
    }

    return this.props.children;
  }
}

// ============================================================================
// COMPONENT-LEVEL ERROR BOUNDARY
// ============================================================================

interface ComponentErrorBoundaryProps {
  children: ReactNode;
  fallback?: ReactNode;
  onError?: (error: Error) => void;
}

export function ComponentErrorBoundary({ children, fallback, onError }: ComponentErrorBoundaryProps) {
  return (
    <GlobalErrorBoundary
      level="component"
      maxRetries={1}
      onError={error => onError?.(error)}
      fallback={() =>
        fallback || (
          <Alert className="border-red-200 bg-red-50">
            <AlertTriangle className="h-4 w-4 text-red-600" />
            <AlertDescription className="text-red-800">
              This component encountered an error. Please try refreshing the page.
            </AlertDescription>
          </Alert>
        )
      }
    >
      {children}
    </GlobalErrorBoundary>
  );
}

// ============================================================================
// EXPORTS
// ============================================================================

export default GlobalErrorBoundary;
export { ErrorReporter };
