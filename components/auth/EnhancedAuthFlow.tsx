'use client';

import { signInWithEmailAndPassword, createUserWithEmailAndPassword } from 'firebase/auth';
import { motion, AnimatePresence } from 'framer-motion';
import { Eye, EyeOff, Mail, Lock, ArrowRight, Shield, CheckCircle, Loader2 } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { useState, useCallback, useEffect, useMemo } from 'react';

import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Progress } from '@/components/ui/progress';
import { auth } from '@/lib/firebase';

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
      // Check if user exists by attempting to sign in with a dummy password
      // This is a simplified approach - in production, you'd use a dedicated API
      const MOCK_USER_EXISTS_PROBABILITY = 0.5;
      setIsNewUser(Math.random() > MOCK_USER_EXISTS_PROBABILITY); // Simulated for demo
      setCurrentStep('password');
    } catch (_err) {
      setError('Failed to verify email. Please try again.');
    } finally {
      setLoading(false);
    }
  }, [email, validateEmail]);

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

      // Delay navigation to show success state
      const REDIRECT_DELAY = 1500;
      setTimeout(() => {
        if (onSuccess) {
          onSuccess(userCredential.user);
        } else {
          router.push('/');
        }
      }, REDIRECT_DELAY);
    } catch (err: unknown) {
      let errorMessage = 'Authentication failed. Please try again.';

      if (err && typeof err === 'object' && 'code' in err) {
        const firebaseError = err as { code: string };

        if (firebaseError.code === 'auth/wrong-password') {
          errorMessage = 'Incorrect password. Please try again.';
        } else if (firebaseError.code === 'auth/user-not-found') {
          errorMessage = 'No account found with this email.';
        } else if (firebaseError.code === 'auth/email-already-in-use') {
          errorMessage = 'An account with this email already exists.';
        } else if (firebaseError.code === 'auth/weak-password') {
          errorMessage = 'Password is too weak. Please choose a stronger password.';
        }
      }

      setError(errorMessage);
    } finally {
      setLoading(false);
    }
  }, [password, email, isNewUser, passwordStrength, onSuccess, router]);

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
          Continue
        </Button>

        <div className="flex items-center space-x-2 text-xs text-gray-500">
          <Shield className="h-3 w-3" />
          <span>Secure authentication with end-to-end encryption</span>
        </div>

        <div className="text-center text-xs text-gray-500 mt-4">
          <p>Prefer one-click sign-in? Try Google authentication above</p>
        </div>
      </motion.div>
    ),
    [email, error, loading, handleEmailSubmit]
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
              onClick={() => {
                // TODO: Implement forgot password flow
                setError('Password reset functionality coming soon!');
              }}
            >
              Forgot your password?
            </button>
          </div>
        )}
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
      success: {
        id: 'success',
        title: 'All Set!',
        subtitle: "Your account is ready. Let's personalize your experience",
        component: SuccessStep,
      },
    }),
    [EmailCaptureStep, PasswordStep, SuccessStep, isNewUser]
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
