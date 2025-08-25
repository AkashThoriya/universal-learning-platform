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
import { useEffect } from 'react';

import { useAuth } from '@/contexts/AuthContext';

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
 * - Shows loading spinner while checking authentication
 * - Only renders children when user is authenticated
 * - Handles authentication state changes in real-time
 *
 * @param {AuthGuardProps} props - Component props
 * @returns {JSX.Element | null} Loading spinner, null (during redirect), or protected content
 *
 * @example
 * ```typescript
 * // Protect a dashboard page
 * function DashboardPage() {
 *   return (
 *     <AuthGuard>
 *       <div>This content is only visible to authenticated users</div>
 *     </AuthGuard>
 *   );
 * }
 *
 * // In a layout file
 * function ProtectedLayout({ children }) {
 *   return (
 *     <AuthGuard>
 *       <Navigation />
 *       {children}
 *       <Footer />
 *     </AuthGuard>
 *   );
 * }
 * ```
 */
export default function AuthGuard({ children }: AuthGuardProps) {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    // Redirect to login if user is not authenticated and loading is complete
    if (!loading && !user) {
      router.push('/login');
    }
  }, [user, loading, router]);

  // Show loading spinner while checking authentication status
  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary" />
      </div>
    );
  }

  // Return null during redirect (user is not authenticated)
  if (!user) {
    return null;
  }

  // Render protected content
  return <>{children}</>;
}
