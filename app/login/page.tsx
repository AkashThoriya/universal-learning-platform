'use client';

import { Shield, ArrowLeft, Loader2 } from 'lucide-react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';

import EnhancedAuthFlow from '@/components/auth/EnhancedAuthFlow';
import PageTransition from '@/components/layout/PageTransition';
import { Button } from '@/components/ui/button';
import { signInWithGoogle } from '@/lib/auth/google-auth';
import { LOGIN_FEATURES } from '@/lib/data/ui-content';
import { logError, logInfo } from '@/lib/utils/logger';

export default function LoginPage() {
  const router = useRouter();
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [googleError, setGoogleError] = useState('');

  const handleGoogleSignIn = async () => {
    logInfo('Google sign-in initiated', {
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'unknown',
    });

    setIsGoogleLoading(true);
    setGoogleError('');

    try {
      const result = await signInWithGoogle();

      if (result.success && result.user) {
        logInfo('Google sign-in successful', {
          userId: result.user.uid,
          email: result.user.email ?? 'No email',
          isNewUser: result.user.isNewUser ?? false,
        });

        if (result.user.isNewUser) {
          logInfo('Redirecting new user to onboarding');
          router.push('/onboarding');
        } else {
          logInfo('Redirecting existing user to dashboard');
          router.push('/dashboard');
        }
      } else {
        logError('Google sign-in failed', {
          error: result.error ?? 'Unknown error',
          context: 'authentication_flow',
        });
        setGoogleError(result.error ?? 'Google sign-in failed. Please try again.');
      }
    } catch (error) {
      logError('Unexpected error during Google sign-in', {
        error: error instanceof Error ? error.message : String(error),
        stack: error instanceof Error ? error.stack : undefined,
        context: 'authentication_exception',
      });
      setGoogleError('An unexpected error occurred. Please try again.');
    } finally {
      setIsGoogleLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-indigo-50 to-purple-50">
      {/* Back to Home */}
      <div className="absolute top-4 left-4 md:top-6 md:left-6 z-20">
        <Link href="/">
          <Button variant="ghost" size="sm" className="text-gray-600 hover:text-gray-900 h-10">
            <ArrowLeft className="h-4 w-4 mr-2" />
            <span className="hidden sm:inline">Back to Home</span>
          </Button>
        </Link>
      </div>

      <div className="flex items-center justify-center min-h-screen px-4 py-16 sm:py-12">
        <PageTransition>
          <div className="w-full max-w-6xl grid xl:grid-cols-2 gap-8 xl:gap-12 items-center">
            {/* Left side - Features (Hidden on Mobile/Tablet, visible on xl+ / 1280px+) */}
            <div className="hidden xl:block space-y-8 text-left">
              <div className="space-y-4">
                <h1 className="text-4xl xl:text-5xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight pb-2">
                  Exam Strategy Engine
                </h1>
                <p className="text-xl text-gray-600 leading-relaxed">
                  Universal Strategic Platform for Competitive Exam Success
                </p>
                <div className="flex items-center space-x-2 text-sm text-gray-500">
                  <Shield className="h-4 w-4" />
                  <span>Trusted by 10,000+ successful candidates</span>
                </div>
              </div>

              <div className="space-y-6">
                {LOGIN_FEATURES.map((feature, index) => (
                  <div key={index} className="flex items-start space-x-4">
                    <div className={`p-3 rounded-xl bg-${feature.color}-100 flex-shrink-0`}>
                      <feature.icon className={`h-6 w-6 text-${feature.color}-600`} />
                    </div>
                    <div className="text-left">
                      <h3 className="font-semibold text-gray-900 mb-1">{feature.title}</h3>
                      <p className="text-gray-600 text-sm leading-relaxed">{feature.description}</p>
                    </div>
                  </div>
                ))}
              </div>

              {/* Trust Indicators */}
              <div className="pt-6 border-t border-gray-200">
                <div className="flex flex-wrap items-center gap-6 text-sm text-gray-500">
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-green-500 rounded-full" />
                    <span>99.9% Uptime</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-blue-500 rounded-full" />
                    <span>Bank-Grade Security</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <div className="w-2 h-2 bg-purple-500 rounded-full" />
                    <span>GDPR Compliant</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Right side - Auth Form (Full width on mobile/tablet, constrained on desktop) */}
            <div className="w-full max-w-md mx-auto">
              {/* Header - Visible on mobile and tablet (hidden on xl+) */}
              <div className="xl:hidden text-center mb-8">
                <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold bg-gradient-to-r from-blue-600 to-purple-600 bg-clip-text text-transparent leading-tight pb-2">
                  Exam Strategy Engine
                </h1>
                <p className="text-sm sm:text-base text-gray-600 max-w-sm mx-auto">
                  Universal Strategic Platform for Competitive Exam Success
                </p>
                {/* Compact Trust Badges for Tablet */}
                <div className="hidden sm:flex xl:hidden items-center justify-center gap-4 mt-4 text-xs text-gray-500">
                  <div className="flex items-center space-x-1.5">
                    <Shield className="h-3.5 w-3.5 text-blue-500" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>99.9% Uptime</span>
                  </div>
                  <div className="flex items-center space-x-1.5">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>GDPR Compliant</span>
                  </div>
                </div>
              </div>

              <EnhancedAuthFlow />

              {/* Additional Options */}
              <div className="mt-6 text-center space-y-4">
                <div className="relative">
                  <div className="absolute inset-0 flex items-center">
                    <div className="w-full border-t border-gray-200" />
                  </div>
                  <div className="relative flex justify-center text-sm">
                    <span className="px-3 bg-blue-50/80 text-gray-500 text-xs sm:text-sm">Or continue with</span>
                  </div>
                </div>

                {googleError && (
                  <div className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700">
                    {googleError}
                  </div>
                )}

                <Button
                  variant="outline"
                  className="w-full h-12 text-base active:scale-[0.98] transition-transform"
                  onClick={handleGoogleSignIn}
                  disabled={isGoogleLoading}
                >
                  {isGoogleLoading ? (
                    <Loader2 className="w-5 h-5 mr-2 animate-spin" />
                  ) : (
                    <svg className="w-5 h-5 mr-2" viewBox="0 0 24 24">
                      <path
                        fill="currentColor"
                        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                      />
                      <path
                        fill="currentColor"
                        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                      />
                      <path
                        fill="currentColor"
                        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                      />
                    </svg>
                  )}
                  {isGoogleLoading ? 'Signing in...' : 'Continue with Google'}
                </Button>
              </div>

              {/* Legal Links */}
              <div className="mt-6 text-center text-xs text-gray-500">
                <p>
                  By continuing, you agree to our{' '}
                  <Link href="/terms" className="text-blue-600 hover:text-blue-700 underline">
                    Terms
                  </Link>{' '}
                  and{' '}
                  <Link href="/privacy" className="text-blue-600 hover:text-blue-700 underline">
                    Privacy Policy
                  </Link>
                </p>
              </div>

              {/* Mobile-only Trust Indicators (hidden on sm+) */}
              <div className="sm:hidden mt-6 pt-4 border-t border-gray-200">
                <div className="flex flex-wrap items-center justify-center gap-3 text-xs text-gray-500">
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    <span>99.9% Uptime</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-blue-500 rounded-full" />
                    <span>Secure</span>
                  </div>
                  <div className="flex items-center space-x-1">
                    <div className="w-1.5 h-1.5 bg-purple-500 rounded-full" />
                    <span>GDPR</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </PageTransition>
      </div>
    </div>
  );
}
