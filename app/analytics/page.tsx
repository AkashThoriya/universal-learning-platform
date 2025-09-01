/**
 * @fileoverview Analytics Page - Intelligent Analytics Implementation
 *
 * Comprehensive analytics page providing insights across exam and course
 * learning tracks with real-time data, cross-track insights, and
 * AI-powered recommendations for learning optimization.
 *
 * Features:
 * - Real-time performance analytics dashboard
 * - Cross-track learning pattern recognition
 * - Weak area identification and improvement recommendations
 * - Predictive analytics for success forecasting
 * - Enterprise-grade UI/UX with responsive design
 * - Advanced error handling and loading states
 * - Accessibility-compliant interfaces
 *
 * @author Exam Strategy Engine Team
 * @version 2.0.0
 */

'use client';

import { Suspense, useEffect } from 'react';

import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import AuthGuard from '@/components/AuthGuard';
import { ComponentErrorBoundary } from '@/components/error-handling/GlobalErrorBoundary';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { logInfo } from '@/lib/logger';

export default function AnalyticsPage() {
  useEffect(() => {
    logInfo('Analytics page mounted');

    return () => {
      logInfo('Analytics page unmounted');
    };
  }, []);

  return (
    <AuthGuard>
      <ComponentErrorBoundary
        fallback={
          <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 flex items-center justify-center p-4">
            <div className="text-center space-y-4 max-w-md">
              <div className="text-6xl">📊</div>
              <h2 className="text-2xl font-bold text-gray-900">Analytics Temporarily Unavailable</h2>
              <p className="text-gray-600">
                We're working to restore your analytics dashboard. Please try refreshing the page.
              </p>
              <button
                onClick={() => window.location.reload()}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        }
      >
        <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
          <div className="container mx-auto px-4 py-8">
            <Suspense
              fallback={
                <div className="flex items-center justify-center min-h-[60vh]">
                  <div className="text-center space-y-6">
                    <div className="relative">
                      <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
                      <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                        <LoadingSpinner size="large" />
                        <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">Loading Analytics</h3>
                        <p className="text-sm text-gray-600">
                          Analyzing your learning patterns and performance data...
                        </p>
                        <div className="mt-4 space-y-2">
                          <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                            <div
                              className="h-full bg-gradient-to-r from-green-500 to-blue-500 rounded-full animate-pulse"
                              style={{ width: '60%' }}
                            />
                          </div>
                          <p className="text-xs text-gray-500">Processing cross-track insights</p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }
            >
              <AnalyticsDashboard />
            </Suspense>
          </div>
        </div>
      </ComponentErrorBoundary>
    </AuthGuard>
  );
}
