/**
 * @fileoverview Authentication Guard Component
 *
 * A higher-order component that protects routes by ensuring user authentication.
 * Redirects unauthenticated users to the login page and shows loading states.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { logInfo, logError } from '@/lib/utils/logger';

/**
 * AuthGuard component props
 *
 * @interface AuthGuardProps
 */
interface AuthGuardProps {
  /** Child components to render when user is authenticated */
  children: React.ReactNode;
}

/**
 * Authentication guard component that protects routes from unauthorized access
 *
 * Features:
 * - Redirects unauthenticated users to /login
 * - Redirects users with incomplete onboarding to /onboarding
 * - Shows loading spinner while checking authentication
 * - Only renders children when user is authenticated and onboarded
 *
 * @param {AuthGuardProps} props - Component props
 * @returns {JSX.Element | null} Loading spinner, null (during redirect), or protected content
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();
  const [isCheckingOnboarding, setIsCheckingOnboarding] = useState(true);
  const [onboardingComplete, setOnboardingComplete] = useState(false);

  useEffect(() => {
    // Redirect to login if user is not authenticated and loading is complete
    if (!loading && !user) {
      router.push('/login');
      return;
    }

    // Check onboarding status for authenticated users
    const checkOnboardingStatus = async () => {
      if (!user) {
        setIsCheckingOnboarding(false);
        return;
      }

      try {
        const { doc, getDoc } = await import('firebase/firestore');
        const { db } = await import('@/lib/firebase/firebase');

        const userDocRef = doc(db, 'users', user.uid);
        const userDoc = await getDoc(userDocRef);

        if (userDoc.exists()) {
          const userData = userDoc.data();

          // Check explicit field first, then fall back to detecting completed onboarding from essential data
          // This handles legacy documents that don't have the explicit onboardingComplete field
          const hasExplicitFlag = userData?.onboardingComplete === true;
          const hasEssentialData = !!(userData?.primaryCourseId && userData?.currentExam && userData?.preferences);
          const isOnboardingComplete = hasExplicitFlag || hasEssentialData;

          setOnboardingComplete(isOnboardingComplete);

          // Redirect to onboarding if not complete
          if (!isOnboardingComplete) {
            logInfo('[AuthGuard] Onboarding incomplete, redirecting', { userId: user.uid });
            router.push('/onboarding');
          }
        } else {
          // No user doc means new user, redirect to onboarding
          logInfo('[AuthGuard] No user document found, redirecting', { userId: user.uid });
          router.push('/onboarding');
        }
      } catch (error) {
        logError('[AuthGuard] Error checking onboarding status', error as Error);
        // On error, assume onboarding is complete to not block the user
        setOnboardingComplete(true);
      } finally {
        setIsCheckingOnboarding(false);
      }
    };

    if (user && !loading) {
      checkOnboardingStatus();
    }
  }, [user, loading, router]);

  // Show loading spinner while checking authentication or onboarding status
  if (loading || isCheckingOnboarding) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Return null during redirect (user is not authenticated or onboarding incomplete)
  if (!user || !onboardingComplete) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
