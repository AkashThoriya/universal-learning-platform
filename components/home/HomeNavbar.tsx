'use client';

import { Target } from 'lucide-react';
import { Suspense, lazy } from 'react';

// Lazy load the auth-aware buttons to defer Firebase loading
const AuthAwareButtons = lazy(() => import('./AuthAwareButtons'));

function NavbarSkeleton() {
  return (
    <div className="flex items-center space-x-2 sm:space-x-4">
      <div className="h-9 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
      <div className="h-9 w-24 bg-primary/20 rounded animate-pulse" />
    </div>
  );
}

export default function HomeNavbar() {
  return (
    <nav className="relative z-50 px-6 lg:px-8 py-6">
      <div className="max-w-7xl mx-auto flex items-center justify-between">
        <div className="flex items-center space-x-2">
          <Target className="h-7 w-7 sm:h-8 sm:w-8 text-primary" />
          <span className="text-lg sm:text-xl font-bold text-gradient">
            <span className="hidden sm:inline">Universal Learning Platform</span>
            <span className="sm:hidden">ULP</span>
          </span>
        </div>
        <Suspense fallback={<NavbarSkeleton />}>
          <AuthAwareButtons />
        </Suspense>
      </div>
    </nav>
  );
}
