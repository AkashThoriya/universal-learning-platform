'use client';

import { useEffect } from 'react';

import AuthGuard from '@/components/AuthGuard';
import AdaptiveDashboard from '@/components/dashboard/AdaptiveDashboard';
import Navigation from '@/components/Navigation';
// import PWAInstallBanner from '@/components/PWAInstallBanner'; // Disabled PWA
import { logInfo } from '@/lib/utils/logger';

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
        {/* <PWAInstallBanner variant="inline" /> */}
        <div className="max-w-7xl mx-auto p-6">
          <AdaptiveDashboard />
        </div>
      </div>
    </AuthGuard>
  );
}
