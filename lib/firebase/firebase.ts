/**
 * @fileoverview Firebase Configuration and Initialization
 *
 * Firebase configuration with proper error handling,
 * environment validation, and offline capabilities.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { getAnalytics, Analytics } from 'firebase/analytics';
import { initializeApp, getApps, FirebaseApp } from 'firebase/app';
import { getAuth, Auth } from 'firebase/auth';
import { getFirestore, Firestore, enableNetwork, disableNetwork, doc, getDoc } from 'firebase/firestore';

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
  // Get environment variables with fallback values for development
  const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
  const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
  const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
  const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
  const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
  const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;
  const measurementId = process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID;

  // Validate required environment variables
  const requiredEnvVars = [
    { name: 'NEXT_PUBLIC_FIREBASE_API_KEY', value: apiKey },
    { name: 'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN', value: authDomain },
    { name: 'NEXT_PUBLIC_FIREBASE_PROJECT_ID', value: projectId },
    { name: 'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET', value: storageBucket },
    { name: 'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID', value: messagingSenderId },
    { name: 'NEXT_PUBLIC_FIREBASE_APP_ID', value: appId },
  ];

  const missing = requiredEnvVars.filter(envVar => !envVar.value);

  if (missing.length > 0) {
    console.error(
      'Missing Firebase environment variables:',
      missing.map(v => v.name)
    );
    throw new Error(
      `Missing required Firebase environment variables: ${missing.map(v => v.name).join(', ')}. ` +
        'Please check your .env.local file.'
    );
  }

  // TypeScript guard - these values are guaranteed to exist due to validation above
  if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
    throw new Error('Firebase configuration validation failed');
  }

  const config: FirebaseConfig = {
    apiKey,
    authDomain,
    projectId,
    storageBucket,
    messagingSenderId,
    appId,
  };

  // Only add measurementId if it exists
  if (measurementId) {
    config.measurementId = measurementId;
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
    const existingApps = getApps();
    const firstApp = existingApps[0];
    if (!firstApp) {
      throw new Error('Firebase app initialization failed');
    }
    app = firstApp;
  }

  // Initialize services
  auth = getAuth(app);
  db = getFirestore(app);

  // Initialize analytics only in browser and production
  if (typeof window !== 'undefined' && process.env.NODE_ENV === 'production') {
    try {
      analytics = getAnalytics(app);
    } catch (_error) {
      // console.warn('Analytics initialization failed:', error);
    }
  }

  // Development emulator connections - DISABLED for production use
  // Uncomment the lines below if you want to use Firebase emulators in development
  /*
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
  */
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
  return new Promise(resolve => {
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
