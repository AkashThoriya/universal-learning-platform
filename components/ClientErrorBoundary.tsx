'use client';

import ErrorBoundary from '@/components/ui/error-boundary';

interface ClientErrorBoundaryProps {
  children: React.ReactNode;
}

export default function ClientErrorBoundary({ children }: ClientErrorBoundaryProps) {
  return (
    <ErrorBoundary
      onError={(error, errorInfo) => {
        // In production, send to error reporting service
        console.error('Root layout error:', error, errorInfo);
      }}
    >
      {children}
    </ErrorBoundary>
  );
}
