'use client';

import { useEffect } from 'react';

import AuthGuard from '@/components/AuthGuard';
import AdaptiveDashboard from '@/components/dashboard/AdaptiveDashboard';
import BottomNav from '@/components/BottomNav';
import Navigation from '@/components/Navigation';
import { logInfo } from '@/lib/utils/logger';
import PageTransition from '@/components/layout/PageTransition';

export default function Dashboard() {
  useEffect(() => {
    logInfo('Dashboard page loaded', {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    });
  }, []);

  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <BottomNav />
        {/* <PWAInstallBanner variant="inline" /> */}
        <PageTransition className="max-w-7xl mx-auto p-4 sm:p-6 pb-20 xl:pb-6">
          <AdaptiveDashboard />
        </PageTransition>
      </div>
    </AuthGuard>
  );
}
