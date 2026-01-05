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

import { BarChart3 } from 'lucide-react';
import { Suspense, useEffect } from 'react';

import AnalyticsDashboard from '@/components/analytics/AnalyticsDashboard';
import { AnalyticsErrorState } from '@/components/analytics/AnalyticsErrorState';
import AuthGuard from '@/components/AuthGuard';
import { ComponentErrorBoundary } from '@/components/error-handling/GlobalErrorBoundary';
import { AnalyticsLayout } from '@/components/layout/AppLayout';
import { FeaturePageHeader } from '@/components/layout/PageHeader';
import { LoadingSpinner } from '@/components/ui/loading-states';
import { logInfo } from '@/lib/utils/logger';

export default function AnalyticsPage() {
  useEffect(() => {
    logInfo('Analytics page mounted');

    return () => {
      logInfo('Analytics page unmounted');
    };
  }, []);

  return (
    <AuthGuard>
      <AnalyticsLayout>
        <ComponentErrorBoundary
          fallback={<AnalyticsErrorState />}
        >
          <FeaturePageHeader
            title="Analytics Dashboard"
            description="Gain insights into your learning patterns and performance across all subjects"
            icon={<BarChart3 className="h-8 w-8" />}
            badge="📊 Performance Insights"
          />

          <Suspense
            fallback={
              <div className="flex items-center justify-center min-h-[60vh]">
                <div className="text-center space-y-6">
                  <div className="relative">
                    <div className="absolute inset-0 blur-3xl opacity-30 bg-gradient-to-r from-blue-400 to-purple-400 rounded-full animate-pulse" />
                    <div className="relative bg-white/80 backdrop-blur-sm rounded-2xl p-8 shadow-xl border border-white/20">
                      <LoadingSpinner size="large" />
                      <h3 className="text-lg font-semibold text-gray-900 mb-2 mt-4">Loading Analytics</h3>
                      <p className="text-sm text-gray-600">Analyzing your learning patterns and performance data...</p>
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
        </ComponentErrorBoundary>
      </AnalyticsLayout>
    </AuthGuard>
  );
}
