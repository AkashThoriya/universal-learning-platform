/**
 * @fileoverview Firebase Authentication Context for the Exam Strategy Engine
 *
 * Provides authentication state management using Firebase Auth with real-time
 * user state updates. Handles user login state, loading states, and logout functionality.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

'use client';

import { User, onAuthStateChanged, signOut } from 'firebase/auth';
import { createContext, useContext, useEffect, useState } from 'react';

import { auth } from '@/lib/firebase';

/**
 * Authentication context type definition
 *
 * @interface AuthContextType
 */
interface AuthContextType {
  /** Current authenticated user from Firebase Auth, null if not authenticated */
  user: User | null;
  /** Loading state while determining authentication status */
  loading: boolean;
  /** Function to log out the current user */
  logout: () => Promise<void>;
}

/**
 * Authentication context with default values
 * Provides user state, loading state, and logout functionality
 */
const AuthContext = createContext<AuthContextType>({
  user: null,
  loading: true,
  logout: async () => {},
});

/**
 * Custom hook to access authentication context
 * Must be used within an AuthProvider component
 *
 * @returns {AuthContextType} The authentication context value
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { user, loading, logout } = useAuth();
 *
 *   if (loading) return <div>Loading...</div>;
 *
 *   if (!user) {
 *     return <div>Please log in</div>;
 *   }
 *
 *   return (
 *     <div>
 *       Welcome {user.displayName}!
 *       <button onClick={logout}>Logout</button>
 *     </div>
 *   );
 * }
 * ```
 */
export const useAuth = () => useContext(AuthContext);

/**
 * Authentication provider component that wraps the app
 * Manages Firebase authentication state and provides context to child components
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} The provider component
 *
 * @example
 * ```typescript
 * function App() {
 *   return (
 *     <AuthProvider>
 *       <MyApplication />
 *     </AuthProvider>
 *   );
 * }
 * ```
 */
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Subscribe to Firebase auth state changes
    const unsubscribe = onAuthStateChanged(auth, user => {
      setUser(user);
      setLoading(false);
    });

    // Cleanup subscription on unmount
    return unsubscribe;
  }, []);

  /**
   * Logs out the current user using Firebase Auth
   *
   * @returns {Promise<void>} Promise that resolves when logout is complete
   */
  const logout = async () => {
    await signOut(auth);
  };

  return <AuthContext.Provider value={{ user, loading, logout }}>{children}</AuthContext.Provider>;
}
