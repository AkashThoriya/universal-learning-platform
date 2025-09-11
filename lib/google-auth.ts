/**
 * @fileoverview Google Authentication Service
 *
 * Provides Google OAuth integration using Firebase Auth.
 * Handles Google sign-in, error handling, and user data management.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { signInWithPopup, GoogleAuthProvider, UserCredential, AuthError, User } from 'firebase/auth';
import { doc, setDoc, getDoc, Timestamp } from 'firebase/firestore';

import { auth, db } from './firebase';

// ============================================================================
// GOOGLE AUTH PROVIDER SETUP
// ============================================================================

/**
 * Configure Google Auth Provider with appropriate scopes
 */
const googleProvider = new GoogleAuthProvider();

// Add scopes for accessing user's basic profile information
googleProvider.addScope('email');
googleProvider.addScope('profile');

// Force account selection on every sign-in attempt
googleProvider.setCustomParameters({
  prompt: 'select_account',
});

// ============================================================================
// TYPES AND INTERFACES
// ============================================================================

export interface GoogleAuthResult {
  success: boolean;
  user?: {
    uid: string;
    email: string | null;
    displayName: string | null;
    photoURL: string | null;
    isNewUser: boolean;
  };
  error?: string;
  errorCode?: string;
}

export interface GoogleUserData {
  uid: string;
  email: string;
  displayName: string;
  photoURL: string | null;
  provider: 'google';
  createdAt: Timestamp;
  updatedAt: Timestamp;
  lastSignInAt: Timestamp;
  onboardingComplete: boolean;
  emailVerified: boolean;
  metadata: {
    creationTime: string;
    lastSignInTime: string;
  };
  stats: {
    totalStudyHours: number;
    currentStreak: number;
    longestStreak: number;
    totalMockTests: number;
    averageScore: number;
    topicsCompleted: number;
    totalTopics: number;
  };
}

// ============================================================================
// ERROR HANDLING
// ============================================================================

/**
 * Convert Firebase Auth errors to user-friendly messages
 */
function getGoogleAuthErrorMessage(error: AuthError): string {
  switch (error.code) {
    case 'auth/account-exists-with-different-credential':
      return 'An account already exists with the same email address but different sign-in credentials. Please sign in using your existing method.';

    case 'auth/auth-domain-config-required':
      return 'Authentication configuration error. Please contact support.';

    case 'auth/cancelled-popup-request':
      return 'Another sign-in attempt is already in progress.';

    case 'auth/operation-not-allowed':
      return 'Google sign-in is not enabled. Please contact support.';

    case 'auth/operation-not-supported-in-this-environment':
      return 'Google sign-in is not supported in this browser environment.';

    case 'auth/popup-blocked':
      return 'Sign-in popup was blocked by your browser. Please allow popups and try again.';

    case 'auth/popup-closed-by-user':
      return 'Sign-in was cancelled. Please try again.';

    case 'auth/unauthorized-domain':
      return 'This domain is not authorized for Google sign-in. Please contact support.';

    case 'auth/user-cancelled':
      return 'Sign-in was cancelled. Please try again.';

    case 'auth/user-disabled':
      return 'Your account has been disabled. Please contact support.';

    case 'auth/user-not-found':
      return 'No account found. A new account will be created.';

    case 'auth/network-request-failed':
      return 'Network error. Please check your connection and try again.';

    case 'auth/too-many-requests':
      return 'Too many sign-in attempts. Please wait a moment and try again.';

    default:
      console.error('Unhandled Google Auth error:', error.code, error.message);
      return 'An unexpected error occurred during sign-in. Please try again.';
  }
}

// ============================================================================
// CORE AUTHENTICATION FUNCTIONS
// ============================================================================

/**
 * Sign in with Google using popup
 *
 * @returns Promise<GoogleAuthResult> - Result of the authentication attempt
 */
export async function signInWithGoogle(): Promise<GoogleAuthResult> {
  try {
    // Show loading state or spinner here if needed
    // console.log('Initiating Google sign-in...');

    const result: UserCredential = await signInWithPopup(auth, googleProvider);
    const { user } = result;

    if (!user) {
      return {
        success: false,
        error: 'No user data received from Google.',
        errorCode: 'no-user-data',
      };
    }

    // console.log('Google sign-in successful:', user.uid);

    // Check if this is a new user
    const userDoc = await getDoc(doc(db, 'users', user.uid));
    const isNewUser = !userDoc.exists();

    // Create or update user data in Firestore
    await saveGoogleUserData(user, isNewUser);

    return {
      success: true,
      user: {
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        photoURL: user.photoURL,
        isNewUser,
      },
    };
  } catch (error) {
    console.error('Google sign-in error:', error);

    const authError = error as AuthError;
    return {
      success: false,
      error: getGoogleAuthErrorMessage(authError),
      errorCode: authError.code,
    };
  }
}

/**
 * Save or update Google user data in Firestore
 *
 * @param user - Firebase User object
 * @param isNewUser - Whether this is a new user registration
 * @returns Promise<GoogleUserData> - The saved user data
 */
async function saveGoogleUserData(user: User, isNewUser: boolean): Promise<GoogleUserData> {
  const now = Timestamp.fromDate(new Date());

  const userData: GoogleUserData = {
    uid: user.uid,
    email: user.email ?? '',
    displayName: user.displayName ?? 'Google User',
    photoURL: user.photoURL,
    provider: 'google',
    createdAt: isNewUser ? now : ((await getExistingUserData(user.uid))?.createdAt ?? now),
    updatedAt: now,
    lastSignInAt: now,
    onboardingComplete: isNewUser ? false : ((await getExistingUserData(user.uid))?.onboardingComplete ?? false),
    emailVerified: user.emailVerified ?? false,
    metadata: {
      creationTime: user.metadata.creationTime ?? new Date().toISOString(),
      lastSignInTime: user.metadata.lastSignInTime ?? new Date().toISOString(),
    },
    stats: isNewUser
      ? {
          totalStudyHours: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalMockTests: 0,
          averageScore: 0,
          topicsCompleted: 0,
          totalTopics: 0,
        }
      : ((await getExistingUserData(user.uid))?.stats ?? {
          totalStudyHours: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalMockTests: 0,
          averageScore: 0,
          topicsCompleted: 0,
          totalTopics: 0,
        }),
  };

  // Save to Firestore
  await setDoc(doc(db, 'users', user.uid), userData, { merge: true });

  // console.log(`User data ${isNewUser ? 'created' : 'updated'} for:`, user.uid);

  return userData;
}

/**
 * Get existing user data from Firestore
 *
 * @param uid - User ID
 * @returns Promise<GoogleUserData | null> - Existing user data or null
 */
async function getExistingUserData(uid: string): Promise<GoogleUserData | null> {
  try {
    const userDoc = await getDoc(doc(db, 'users', uid));
    return userDoc.exists() ? (userDoc.data() as GoogleUserData) : null;
  } catch (error) {
    console.error('Error fetching existing user data:', error);
    return null;
  }
}

// ============================================================================
// UTILITY FUNCTIONS
// ============================================================================

/**
 * Check if Google Auth is available in the current environment
 *
 * @returns boolean - Whether Google Auth is available
 */
export function isGoogleAuthAvailable(): boolean {
  // Check if we're in a browser environment
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if Firebase Auth is properly initialized
  if (!auth) {
    console.error('Firebase Auth not initialized');
    return false;
  }

  // Check if we have the required configuration
  if (!auth.app.options.apiKey) {
    console.error('Firebase API key not found');
    return false;
  }

  return true;
}

/**
 * Check if the current environment supports popups
 *
 * @returns boolean - Whether popups are supported
 */
export function isPopupSupported(): boolean {
  if (typeof window === 'undefined') {
    return false;
  }

  // Check if popup is blocked
  try {
    const popup = window.open('', '_blank', 'width=1,height=1');
    if (popup) {
      popup.close();
      return true;
    }
    return false;
  } catch {
    return false;
  }
}

/**
 * Get Google Auth provider instance (for testing or advanced usage)
 *
 * @returns GoogleAuthProvider - The configured provider
 */
export function getGoogleAuthProvider(): GoogleAuthProvider {
  return googleProvider;
}

// ============================================================================
// DEBUG AND LOGGING FUNCTIONS
// ============================================================================

/**
 * Log Google Auth configuration (for debugging)
 */
export function logGoogleAuthConfig(): void {
  if (process.env.NODE_ENV === 'development') {
    // console.log('Google Auth Configuration:', {
    //   available: isGoogleAuthAvailable(),
    //   popupSupported: isPopupSupported(),
    //   authDomain: auth?.app.options.authDomain,
    //   providerId: googleProvider.providerId,
    // });
  }
}

// ============================================================================
// EXPORTS
// ============================================================================

export { googleProvider };
export default signInWithGoogle;
