'use client';

import { useRouter } from 'next/navigation';
import { useEffect } from 'react';

/**
 * Onboarding Page Redirect
 *
 * Redirects to the enhanced onboarding experience for better UX
 */
export default function OnboardingPage() {
  const router = useRouter();

  useEffect(() => {
    // Redirect to enhanced onboarding page
    router.replace('/onboarding/enhanced-page');
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      <div className="text-center space-y-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
        <p className="text-muted-foreground">Preparing enhanced onboarding...</p>
      </div>
    </div>
  );
}
