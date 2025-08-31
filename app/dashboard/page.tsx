'use client';

import AuthGuard from '@/components/AuthGuard';
import AdaptiveDashboard from '@/components/dashboard/AdaptiveDashboard';
import Navigation from '@/components/Navigation';

export default function Dashboard() {
  return (
    <AuthGuard>
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
        <Navigation />
        <div className="max-w-7xl mx-auto p-6">
          <AdaptiveDashboard />
        </div>
      </div>
    </AuthGuard>
  );
}
