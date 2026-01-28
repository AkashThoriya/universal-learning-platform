'use client';

import { Suspense, lazy } from 'react';

// Lazy load the auth check to defer Firebase loading
const AuthAwareHeroButton = lazy(() => import('./AuthAwareHeroButton'));

function HeroButtonSkeleton() {
  return <div className="h-14 w-72 bg-primary/20 rounded-lg animate-pulse" />;
}

export default function HeroActions() {
  return (
    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center mb-6 sm:mb-8">
      <Suspense fallback={<HeroButtonSkeleton />}>
        <AuthAwareHeroButton />
      </Suspense>
    </div>
  );
}
