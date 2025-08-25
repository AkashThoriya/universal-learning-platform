/**
 * @fileoverview Firebase Configuration and Initialization
 *
 * Enhanced Firebase configuration with proper error handling,
 * environment validation, and offline capabilities.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { getAnalytics, Analytics } from 'firebase/analytics';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth, connectAuthEmulator } from 'firebase/auth';
import { getFirestore, Firestore, connectFirestoreEmulator, enableNetwork, disableNetwork, doc, getDoc } from 'firebase/firestore';

// ============================================================================
// ENVIRONMENT VALIDATION
// ============================================================================

interface FirebaseConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const validateFirebaseConfig = (): FirebaseConfig => {
  const requiredEnvVars = [
    'NEXT_PUBLIC_FIREBASE_API_KEY',
    'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
    'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
    'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
    'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
    'NEXT_PUBLIC_FIREBASE_APP_ID'
  ];

  const missing = requiredEnvVars.filter(varName => !process.env[varName]);

  if (missing.length > 0) {
    throw new Error(
      `Missing required Firebase environment variables: ${missing.join(', ')}. ` +
      'Please check your .env.local file.'
    );
  }

  const config: FirebaseConfig = {
    apiKey: process.env.NEXT_PUBLIC_FIREBASE_API_KEY!,
    authDomain: process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN!,
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID!,
    storageBucket: process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET!,
    messagingSenderId: process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID!,
    appId: process.env.NEXT_PUBLIC_FIREBASE_APP_ID!
  };

  // Only add measurementId if it exists
  if (process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID) {
    config.measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;
  }

  return config;
};

// ============================================================================
// FIREBASE INITIALIZATION
// ============================================================================

let app: FirebaseApp;
let auth: Auth;
let db: Firestore;
let analytics: Analytics | null = null;

try {
  const firebaseConfig = validateFirebaseConfig();

  // Initialize Firebase app (singleton pattern)
  if (!getApps().length) {
    app = initializeApp(firebaseConfig);
  } else {
    app = getApps()[0]!;
  }

  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);

  // Initialize analytics only in browser and production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    try {
      analytics = getAnalytics(app);
    } catch (error) {
      console.warn('Analytics initialization failed:', error);
    }
  }

  // Development emulator connections
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    try {
      // Connect to emulators if available
      if (!auth.currentUser && window.location.hostname === 'localhost') {
        connectAuthEmulator(auth, 'http://localhost:9099', { disableWarnings: true });
      }

      if (window.location.hostname === 'localhost') {
        connectFirestoreEmulator(db, 'localhost', 8080);
      }
    } catch (_error) {
      // Emulators not available, use production
      console.info('Using production Firebase services');
    }
  }

} catch (error) {
  console.error('Firebase initialization failed:', error);
  throw error;
}

// ============================================================================
// OFFLINE SUPPORT
// ============================================================================

export const enableOfflineSupport = async (): Promise<void> => {
  try {
    await enableNetwork(db);
  } catch (error) {
    console.error('Failed to enable offline support:', error);
  }
};

export const disableOfflineSupport = async (): Promise<void> => {
  try {
    await disableNetwork(db);
  } catch (error) {
    console.error('Failed to disable offline support:', error);
  }
};

// ============================================================================
// CONNECTION STATUS
// ============================================================================

export const getConnectionStatus = (): Promise<boolean> => {
  return new Promise((resolve) => {
    if (typeof window === 'undefined') {
      resolve(true); // Assume connected on server
      return;
    }

    if (navigator.onLine === false) {
      resolve(false);
      return;
    }

    // Test with a simple operation
    const testRef = doc(db, 'health', 'check');
    getDoc(testRef)
      .then(() => resolve(true))
      .catch(() => resolve(false));
  });
};

// ============================================================================
// EXPORTS
// ============================================================================

export { auth, db, analytics };
export default app;

// Type exports for better development experience
export type { FirebaseApp, Auth, Firestore, Analytics };
