'use client';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword, sendPasswordResetEmail } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { auth, db } from '@/lib/firebase/firebase';
import { logInfo, logError } from '@/lib/utils/logger';

interface AuthStep {
  id: string;
  title: string;
  subtitle: string;
  component: React.ReactNode;
}

interface AuthFlowProps {
  onSuccess?: (user: { uid: string; email: string | null }) => void;
  className?: string;
}

// Helper functions for password strength display
const getPasswordStrengthColor = (strength: number): string => {
  const WEAK_THRESHOLD = 25;
  const FAIR_THRESHOLD = 50;
  const GOOD_THRESHOLD = 75;

  if (strength < WEAK_THRESHOLD) {
    return 'text-red-500';
  }
  if (strength < FAIR_THRESHOLD) {
    return 'text-orange-500';
  }
  if (strength < GOOD_THRESHOLD) {
    return 'text-yellow-500';
  }
  return 'text-green-500';
};

const getPasswordStrengthText = (strength: number): string => {
  const WEAK_THRESHOLD = 25;
  const FAIR_THRESHOLD = 50;
  const GOOD_THRESHOLD = 75;

  if (strength < WEAK_THRESHOLD) {
    return 'Weak';
  }
  if (strength < FAIR_THRESHOLD) {
    return 'Fair';
  }
  if (strength < GOOD_THRESHOLD) {
    return 'Good';
  }
  return 'Strong';
};

export default function EnhancedAuthFlow({ onSuccess, className }: AuthFlowProps) {
  const [currentStep, setCurrentStep] = useState('email');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [isNewUser, setIsNewUser] = useState(false);
  const [passwordStrength, setPasswordStrength] = useState(0);
  // Auth mode: 'auto' uses email detection, 'signin' forces login, 'signup' forces registration
  const [authMode, setAuthMode] = useState<'auto' | 'signin' | 'signup'>('auto');
  const router = useRouter();

  const validateEmail = useCallback((email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  }, []);

  const calculatePasswordStrength = useCallback((password: string): number => {
    let strength = 0;
    const MIN_LENGTH = 8;
    const STRENGTH_POINTS = 25;
    if (password.length >= MIN_LENGTH) {
      strength += STRENGTH_POINTS;
    }
    if (/[a-z]/.test(password)) {
      strength += STRENGTH_POINTS;
    }
    if (/[A-Z]/.test(password)) {
      strength += STRENGTH_POINTS;
    }
    if (/[0-9]/.test(password) && /[^a-zA-Z0-9]/.test(password)) {
      strength += STRENGTH_POINTS;
    }
    return strength;
  }, []);

  useEffect(() => {
    if (password) {
      setPasswordStrength(calculatePasswordStrength(password));
    }
  }, [password, calculatePasswordStrength]);

  const handleEmailSubmit = useCallback(async () => {
    if (!validateEmail(email)) {
      setError('Please enter a valid email address');
      return;
    }

    setLoading(true);
    setError('');

    try {
      // If user manually selected a mode, use that
      if (authMode !== 'auto') {
        setIsNewUser(authMode === 'signup');
        setCurrentStep('password');
        return;
      }

      // For 'auto' mode: Default to sign-in (existing user) as the safer and more common case.
      // Firebase's Email Enumeration Protection makes fetchSignInMethodsForEmail unreliable
      // (it returns empty array for security), so we can't reliably detect if user exists.
      // Instead, we default to sign-in and handle 'user-not-found' error gracefully in password step.
      setIsNewUser(false);
      setCurrentStep('password');
    } catch (err) {
      logError('Email verification error', err as Error);
      // Default to sign-in on any error
      setIsNewUser(false);
      setCurrentStep('password');
    } finally {
      setLoading(false);
    }
  }, [email, validateEmail, authMode]);

  const handlePasswordSubmit = useCallback(async () => {
    if (password.length < 6) {
      setError('Password must be at least 6 characters long');
      return;
    }

    if (isNewUser && passwordStrength < 50) {
      setError('Please choose a stronger password');
      return;
    }

    setLoading(true);
    setError('');

    try {
      let userCredential;
      if (isNewUser) {
        userCredential = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      }

      setCurrentStep('success');

      // Smart redirect: check onboarding status before redirecting
      const REDIRECT_DELAY = 1500;
      setTimeout(async () => {
        if (onSuccess) {
          onSuccess(userCredential.user);
        } else {
          // Check if user has completed onboarding
          try {
            const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
            if (userDoc.exists()) {
              const userData = userDoc.data();
              // Check explicit flag or presence of essential data
              const hasExplicitFlag = userData?.onboardingComplete === true;
              const hasEssentialData = !!(userData?.primaryCourseId && userData?.currentExam && userData?.preferences);
              const isOnboardingComplete = hasExplicitFlag || hasEssentialData;

              if (isOnboardingComplete) {
                logInfo('[Auth] Onboarding complete, redirecting to dashboard', { userId: userCredential.user.uid });
                router.push('/dashboard');
              } else {
                logInfo('[Auth] Onboarding incomplete, redirecting to onboarding', { userId: userCredential.user.uid });
                router.push('/onboarding');
              }
            } else {
              // No user document - new user, go to onboarding
              logInfo('[Auth] No user document found, redirecting to onboarding', { userId: userCredential.user.uid });
              router.push('/onboarding');
            }
          } catch (error) {
            logError('[Auth] Error checking onboarding status', error as Error);
            // Fallback: redirect to dashboard (AuthGuard will handle it)
            router.push('/dashboard');
          }
        }
      }, REDIRECT_DELAY);
    } catch (err: unknown) {
      let errorMessage = 'Authentication failed. Please try again.';

      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = err as { code: string };

        if (firebaseError.code === 'auth/wrong-password' || firebaseError.code === 'auth/invalid-credential') {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (firebaseError.code === 'auth/user-not-found') {
          // User doesn't exist - switch to signup mode
          setIsNewUser(true);
          errorMessage = 'No account found with this email. Create a new account instead?';
        } else if (firebaseError.code === 'auth/email-already-in-use') {
          // Email exists - switch to sign-in mode
          setIsNewUser(false);
          errorMessage = 'An account with this email already exists. Please sign in instead.';
        } else if (firebaseError.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [password, email, isNewUser, passwordStrength, onSuccess, router]);

  const handleForgotPassword = useCallback(async () => {
    if (!email || !validateEmail(email)) {
      setError('Please enter a valid email address first.');
      return;
    }

    setLoading(true);
    setError('');

    try {
      await sendPasswordResetEmail(auth, email);
      setError('');
      setCurrentStep('resetSent');
    } catch (err) {
      logError('Password reset error', err as Error);
      setError('Failed to send reset email. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, validateEmail]);

  const EmailCaptureStep = useMemo(
    () => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <label htmlFor="email" className="text-sm font-medium text-gray-700">
            Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="email"
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="pl-10"
              autoComplete="email"
            />
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        <Button onClick={handleEmailSubmit} disabled={!email || loading} className="w-full" size="lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
          {authMode === 'signup' ? 'Create Account' : authMode === 'signin' ? 'Sign In' : 'Continue'}
        </Button>

        {/* Auth Mode Toggle */}
        <div className="text-center pt-4 border-t border-gray-100">
          <button
            type="button"
            className="text-sm text-blue-600 hover:text-blue-700 font-medium"
            onClick={() => {
              if (authMode === 'signup') {
                setAuthMode('signin');
              } else {
                setAuthMode('signup');
              }
              setError('');
            }}
          >
            {authMode === 'signup' ? 'Already have an account? Sign in' : "Don't have an account? Create one"}
          </button>
        </div>

        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Shield className="h-3 w-3" />
          <span>Secure authentication with end-to-end encryption</span>
        </div>
      </motion.div>
    ),
    [email, error, loading, handleEmailSubmit, authMode]
  );

  const PasswordStep = useMemo(
    () => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="flex items-center space-x-2 text-sm text-gray-600 mb-4">
          <CheckCircle className="h-4 w-4 text-green-500" />
          <span>{email}</span>
        </div>

        <div className="space-y-2">
          <label htmlFor="password" className="text-sm font-medium text-gray-700">
            {isNewUser ? 'Create Password' : 'Enter Password'}
          </label>
          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="password"
              type={showPassword ? 'text' : 'password'}
              placeholder={isNewUser ? 'Create a strong password' : 'Enter your password'}
              value={password}
              onChange={e => setPassword(e.target.value)}
              className="pl-10 pr-10"
              autoComplete={isNewUser ? 'new-password' : 'current-password'}
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
            >
              {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {isNewUser && password && (
          <div className="space-y-2">
            <div className="flex justify-between text-xs">
              <span className="text-gray-600">Password Strength</span>
              <span className={`font-medium ${getPasswordStrengthColor(passwordStrength)}`}>
                {getPasswordStrengthText(passwordStrength)}
              </span>
            </div>
            <Progress value={passwordStrength} className="h-2" />
          </div>
        )}

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        <div className="flex space-x-3">
          <Button variant="outline" onClick={() => setCurrentStep('email')} disabled={loading} className="flex-1">
            Back
          </Button>
          <Button onClick={handlePasswordSubmit} disabled={!password || loading} className="flex-1" size="lg">
            {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
            {isNewUser ? 'Create Account' : 'Sign In'}
          </Button>
        </div>

        {!isNewUser && (
          <div className="text-center">
            <button
              type="button"
              className="text-sm text-blue-600 hover:text-blue-700 underline"
              onClick={() => setCurrentStep('forgotPassword')}
            >
              Forgot your password?
            </button>
          </div>
        )}

        {/* Mode Switch */}
        <div className="text-center pt-2">
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700"
            onClick={() => {
              setIsNewUser(!isNewUser);
              setError('');
            }}
          >
            {isNewUser ? 'Already have an account? Sign in instead' : "Don't have an account? Create one"}
          </button>
        </div>
      </motion.div>
    ),
    [
      email,
      isNewUser,
      password,
      showPassword,
      passwordStrength,
      error,
      loading,
      handlePasswordSubmit,
      setCurrentStep,
      setShowPassword,
      setPassword,
      setError,
    ]
  );

  const ForgotPasswordStep = useMemo(
    () => (
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -20 }}
        className="space-y-6"
      >
        <div className="space-y-2">
          <label htmlFor="reset-email" className="text-sm font-medium text-gray-700">
            Confirm Email Address
          </label>
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              id="reset-email"
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={e => setEmail(e.target.value)}
              className="pl-10"
              autoComplete="email"
            />
          </div>
        </div>

        {error && (
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="p-3 bg-red-50 border border-red-200 rounded-lg text-sm text-red-700"
          >
            {error}
          </motion.div>
        )}

        <Button onClick={handleForgotPassword} disabled={!email || loading} className="w-full" size="lg">
          {loading ? <Loader2 className="h-4 w-4 animate-spin mr-2" /> : <ArrowRight className="h-4 w-4 mr-2" />}
          Send Reset Link
        </Button>

        <div className="text-center">
          <button
            type="button"
            className="text-sm text-gray-500 hover:text-gray-700 font-medium"
            onClick={() => setCurrentStep('password')}
          >
            Back to Sign In
          </button>
        </div>
      </motion.div>
    ),
    [email, error, loading, handleForgotPassword, setCurrentStep, setEmail]
  );

  const ResetSentStep = useMemo(
    () => (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto"
        >
          <Mail className="h-8 w-8 text-blue-600" />
        </motion.div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">Check your inbox</h3>
          <p className="text-gray-600 mt-1">
            We've sent a password reset link to <strong>{email}</strong>
          </p>
        </div>

        <Button onClick={() => setCurrentStep('password')} variant="outline" className="w-full">
          Back to Sign In
        </Button>
      </motion.div>
    ),
    [email, setCurrentStep]
  );

  const SuccessStep = useMemo(
    () => (
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="text-center space-y-6"
      >
        <motion.div
          initial={{ scale: 0 }}
          animate={{ scale: 1 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto"
        >
          <CheckCircle className="h-8 w-8 text-green-600" />
        </motion.div>

        <div>
          <h3 className="text-lg font-semibold text-gray-900">Welcome Aboard! 🎉</h3>
          <p className="text-gray-600 mt-1">
            {isNewUser ? 'Your account has been created successfully' : "You've been signed in successfully"}
          </p>
        </div>

        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.8 }}
          className="text-sm text-gray-500"
        >
          Redirecting to your personalized dashboard...
        </motion.div>
      </motion.div>
    ),
    [isNewUser]
  );

  const authSteps: Record<string, AuthStep> = useMemo(
    () => ({
      email: {
        id: 'email',
        title: "Welcome! Let's get started",
        subtitle: 'Enter your email to begin your learning journey',
        component: EmailCaptureStep,
      },
      password: {
        id: 'password',
        title: isNewUser ? 'Secure Your Account' : 'Welcome Back!',
        subtitle: isNewUser ? 'Create a strong password for your account' : 'Enter your password to continue',
        component: PasswordStep,
      },
      forgotPassword: {
        id: 'forgotPassword',
        title: 'Reset Password',
        subtitle: "Enter your email and we'll send you a link to reset your password",
        component: ForgotPasswordStep,
      },
      resetSent: {
        id: 'resetSent',
        title: 'Email Sent',
        subtitle: 'Please check your email',
        component: ResetSentStep,
      },
      success: {
        id: 'success',
        title: 'All Set!',
        subtitle: "Your account is ready. Let's personalize your experience",
        component: SuccessStep,
      },
    }),
    [EmailCaptureStep, PasswordStep, ForgotPasswordStep, ResetSentStep, SuccessStep, isNewUser]
  );

  const currentStepData = authSteps[currentStep];

  if (!currentStepData) {
    return null;
  }

  return (
    <div className={`w-full max-w-md mx-auto ${className}`}>
      <Card className="shadow-lg border-0 bg-white/95 backdrop-blur-sm">
        <CardHeader className="text-center space-y-4">
          <div className="flex justify-center space-x-2">
            {Object.keys(authSteps).map(stepId => (
              <div
                key={stepId}
                className={`w-2 h-2 rounded-full transition-colors duration-300 ${
                  stepId === currentStep ||
                  Object.keys(authSteps).indexOf(stepId) < Object.keys(authSteps).indexOf(currentStep)
                    ? 'bg-blue-500'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>

          <div>
            <CardTitle className="text-xl font-bold text-gray-900">{currentStepData.title}</CardTitle>
            <CardDescription className="text-gray-600 mt-2">{currentStepData.subtitle}</CardDescription>
          </div>
        </CardHeader>

        <CardContent>
          <AnimatePresence mode="wait">
            <motion.div key={currentStep}>{currentStepData.component}</motion.div>
          </AnimatePresence>
        </CardContent>
      </Card>
    </div>
  );
}
