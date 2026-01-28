'use client';

import { Suspense, lazy } from 'react';

// Lazy load the auth-aware CTA button to defer Firebase loading
const AuthAwareCTAButton = lazy(() => import('./AuthAwareCTAButton'));

function CTAButtonSkeleton() {
  return <div className="h-16 w-80 bg-primary/20 rounded-lg animate-pulse" />;
}

export default function CTAActions() {
  return (
    <div className="flex justify-center mb-8 sm:mb-12">
      <Suspense fallback={<CTAButtonSkeleton />}>
        <AuthAwareCTAButton />
      </Suspense>
    </div>
  );
}
