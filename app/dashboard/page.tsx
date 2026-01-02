'use client';

import { useEffect } from 'react';

import AuthGuard from '@/components/AuthGuard';
import AdaptiveDashboard from '@/components/dashboard/AdaptiveDashboard';
import BottomNav from '@/components/BottomNav';
import Navigation from '@/components/Navigation';
import { logInfo } from '@/lib/utils/logger';
import PageTransition from '@/components/layout/PageTransition';
import PageContainer from '@/components/layout/PageContainer';

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
        <PageContainer>
          <PageTransition>
            <AdaptiveDashboard />
          </PageTransition>
        </PageContainer>
      </div>
    </AuthGuard>
  );
}
