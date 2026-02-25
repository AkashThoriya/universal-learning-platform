/**
 * @fileoverview Course Context for Multi-Course Architecture
 *
 * Provides course state management across the application. Handles active course
 * selection, course switching, progress tracking, and course-scoped data access.
 *
 * Features:
 * - Active course state (single course active at a time)
 * - Course switching with state persistence
 * - Progress tracking for active course
 * - Course list management
 *
 * @author Universal Learning Platform Team
 * @version 1.0.0
 */

'use client';

import { Timestamp, doc, getDoc, setDoc, collection, getDocs, updateDoc, query, orderBy } from 'firebase/firestore';
import { createContext, useContext, useEffect, useState, useCallback, ReactNode, useMemo } from 'react';

import { useAuth } from '@/contexts/AuthContext';
import { db } from '@/lib/firebase/firebase';
import { getUser, updateUser } from '@/lib/firebase/firebase-utils';
import { logError, logInfo } from '@/lib/utils/logger';
import type {
  UserCourse,
  CourseProgress,
  CourseSettings,
  CourseContextValue,
} from '@/types/course-progress';

// Re-export default settings for external use
export { DEFAULT_COURSE_SETTINGS } from '@/types/course-progress';

/**
 * Course context with default values
 */
const CourseContext = createContext<CourseContextValue | null>(null);

/**
 * Custom hook to access course context
 * Must be used within a CourseProvider component
 *
 * @returns {CourseContextValue} The course context value
 * @throws {Error} If used outside of CourseProvider
 *
 * @example
 * ```typescript
 * function MyComponent() {
 *   const { activeCourse, activeCourseId, switchCourse } = useCourse();
 *
 *   return (
 *     <div>
 *       <h1>Current Course: {activeCourse?.courseName}</h1>
 *       <button onClick={() => switchCourse('new-course-id')}>
 *         Switch Course
 *       </button>
 *     </div>
 *   );
 * }
 * ```
 */
export function useCourse(): CourseContextValue {
  const context = useContext(CourseContext);
  if (!context) {
    throw new Error('useCourse must be used within a CourseProvider');
  }
  return context;
}

/**
 * Optional hook that doesn't throw if used outside provider
 * Useful for components that may or may not be within the course context
 */
export function useCourseOptional(): CourseContextValue | null {
  return useContext(CourseContext);
}

/**
 * Course provider component that wraps the app
 * Manages course state and provides context to child components
 *
 * @param {Object} props - Component props
 * @param {React.ReactNode} props.children - Child components to wrap
 * @returns {JSX.Element} The provider component
 */
export function CourseProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();

  // State
  const [activeCourse, setActiveCourse] = useState<UserCourse | null>(null);
  const [activeCourseId, setActiveCourseId] = useState<string | null>(null);
  const [courses, setCourses] = useState<UserCourse[]>([]);
  const [activeProgress, setActiveProgress] = useState<CourseProgress | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSwitching, setIsSwitching] = useState(false);

  /**
   * Load all user courses from Firestore
   */
  const loadCourses = useCallback(async (userId: string): Promise<UserCourse[]> => {
    try {
      const coursesRef = collection(db, 'users', userId, 'courses');
      const q = query(coursesRef, orderBy('lastAccessedAt', 'desc'));
      const snapshot = await getDocs(q);

      const loadedCourses: UserCourse[] = snapshot.docs.map(docSnap => ({
        courseId: docSnap.id,
        ...docSnap.data(),
      } as UserCourse));

      logInfo('[CourseContext] Loaded courses', { userId, count: loadedCourses.length });
      return loadedCourses;
    } catch (error) {
      logError('[CourseContext] Failed to load courses', { userId, error });
      return [];
    }
  }, []);

  /**
   * Load course progress for a specific course
   */
  const loadCourseProgress = useCallback(async (userId: string, courseId: string): Promise<CourseProgress | null> => {
    try {
      const progressRef = doc(db, 'users', userId, 'courses', courseId, 'progress', 'summary');
      const progressDoc = await getDoc(progressRef);

      if (progressDoc.exists()) {
        return progressDoc.data() as CourseProgress;
      }

      // Return default progress if none exists
      return {
        courseId,
        userId,
        overallProgress: 0,
        stats: {
          totalStudyTime: 0,
          completedMissions: 0,
          averageScore: 0,
          streak: 0,
          longestStreak: 0,
          weeklyGoalProgress: 0,
          topicsStudied: 0,
          topicsCompleted: 0,
          mockTestsTaken: 0,
          averageMockScore: 0,
        },
        subjectProgress: [],
        lastUpdated: Timestamp.now(),
      };
    } catch (error) {
      logError('[CourseContext] Failed to load course progress', { userId, courseId, error });
      return null;
    }
  }, []);

  /**
   * Initialize course context from user profile
   */
  useEffect(() => {
    if (!user?.uid) {
      setIsLoading(false);
      setActiveCourse(null);
      setActiveCourseId(null);
      setCourses([]);
      setActiveProgress(null);
      return;
    }

    const initializeCourses = async () => {
      setIsLoading(true);
      try {
        // Load user profile to get current goal
        const profile = await getUser(user.uid);
        const currentExamId = profile?.currentExam?.id;

        // Load all user courses
        const userCourses = await loadCourses(user.uid);
        setCourses(userCourses);

        // Set active course based on profile or first available
        let activeId = currentExamId;
        let active = userCourses.find(c => c.courseId === currentExamId);

        // If no matching course, check for primary or first course
        if (!active && userCourses.length > 0) {
          active = userCourses.find(c => c.isPrimary) || userCourses[0];
          activeId = active?.courseId;
        }

        // If user has currentExam but no course document, create one
        if (currentExamId && profile?.currentExam && !active) {
          const currentExamDetails = profile!.currentExam!;
          const newCourse: UserCourse = {
            courseId: currentExamId,
            courseName: currentExamDetails.name || currentExamId,
            courseType: 'exam',
            status: 'active',
            isPrimary: true,
            ...(currentExamDetails.targetDate && { targetDate: currentExamDetails.targetDate }),
            startedAt: Timestamp.now(),
            lastAccessedAt: Timestamp.now(),
            settings: {
              dailyGoalMinutes: profile?.preferences?.dailyStudyGoalMinutes ?? 60,
              // Calculate weekly goal based on preferences (weekend mode vs daily)
              weeklyGoalHours: profile?.preferences?.useWeekendSchedule
                ? Math.round(((profile?.preferences?.weekdayStudyMinutes || 60) * 5 + (profile?.preferences?.weekendStudyMinutes || 60) * 2) / 60)
                : Math.round(((profile?.preferences?.dailyStudyGoalMinutes ?? 60) * 7) / 60),
              notificationsEnabled: true,
              preferredDifficulty: 'intermediate',
              reminderTime: '09:00',
              activeDays: [0, 1, 2, 3, 4, 5, 6], // Default to 7 days to match Onboarding logic
              useWeekendSchedule: profile?.preferences?.useWeekendSchedule || false,
              weekdayStudyMinutes: profile?.preferences?.weekdayStudyMinutes,
              weekendStudyMinutes: profile?.preferences?.weekendStudyMinutes,
            },
          };

          // Save the course document
          await setDoc(doc(db, 'users', user.uid, 'courses', currentExamId), newCourse);
          setCourses([newCourse, ...userCourses]);
          active = newCourse;
          activeId = currentExamId;
          logInfo('[CourseContext] Created course from currentExam', { courseId: currentExamId });
        }

        setActiveCourse(active || null);
        setActiveCourseId(activeId || null);

        // Load progress for active course
        if (activeId) {
          const progress = await loadCourseProgress(user.uid, activeId);
          setActiveProgress(progress);
        }

        logInfo('[CourseContext] Initialized', {
          userId: user.uid,
          activeCourseId: activeId,
          totalCourses: userCourses.length,
        });
      } catch (error) {
        logError('[CourseContext] Failed to initialize', { userId: user.uid, error });
      } finally {
        setIsLoading(false);
      }
    };

    initializeCourses();
  }, [user?.uid, loadCourses, loadCourseProgress]);

  /**
   * Switch to a different course
   */
  const switchCourse = useCallback(async (courseId: string) => {
    if (!user?.uid || courseId === activeCourseId) return;

    setIsSwitching(true);
    try {
      // Find the course
      const targetCourse = courses.find(c => c.courseId === courseId);
      if (!targetCourse) {
        logError('[CourseContext] Course not found', { courseId });
        return;
      }

      // Update last accessed time
      const courseRef = doc(db, 'users', user.uid, 'courses', courseId);
      await updateDoc(courseRef, {
        lastAccessedAt: Timestamp.now(),
      });

      // Update user profile with new active course
      await updateUser(user.uid, {
        currentExam: {
          id: courseId,
          name: targetCourse.courseName,
          ...(targetCourse.targetDate && { targetDate: targetCourse.targetDate }),
        },
        primaryCourseId: courseId,
      });

      // Update state
      setActiveCourse({ ...targetCourse, lastAccessedAt: Timestamp.now() });
      setActiveCourseId(courseId);

      // Load progress for new course
      const progress = await loadCourseProgress(user.uid, courseId);
      setActiveProgress(progress);

      logInfo('[CourseContext] Switched course', { userId: user.uid, courseId });
    } catch (error) {
      logError('[CourseContext] Failed to switch course', { courseId, error });
    } finally {
      setIsSwitching(false);
    }
  }, [user?.uid, activeCourseId, courses, loadCourseProgress]);

  /**
   * Refresh progress for current course
   */
  const refreshProgress = useCallback(async () => {
    if (!user?.uid || !activeCourseId) return;

    try {
      const progress = await loadCourseProgress(user.uid, activeCourseId);
      setActiveProgress(progress);
      logInfo('[CourseContext] Refreshed progress', { userId: user.uid, courseId: activeCourseId });
    } catch (error) {
      logError('[CourseContext] Failed to refresh progress', { error });
    }
  }, [user?.uid, activeCourseId, loadCourseProgress]);

  /**
   * Add a new course
   */
  const addCourse = useCallback(async (
    courseData: Omit<UserCourse, 'startedAt' | 'lastAccessedAt'>
  ): Promise<string> => {
    if (!user?.uid) throw new Error('User not authenticated');

    try {
      const now = Timestamp.now();
      const newCourse: UserCourse = {
        ...courseData,
        startedAt: now,
        lastAccessedAt: now,
      };

      // If this is the first/primary course, set isPrimary
      if (courses.length === 0 || courseData.isPrimary) {
        newCourse.isPrimary = true;
        // Reset isPrimary on other courses if setting this as primary
        if (courseData.isPrimary && courses.length > 0) {
          for (const course of courses) {
            if (course.isPrimary) {
              await updateDoc(doc(db, 'users', user.uid, 'courses', course.courseId), {
                isPrimary: false,
              });
            }
          }
        }
      }

      // Save to Firestore
      await setDoc(doc(db, 'users', user.uid, 'courses', courseData.courseId), newCourse);

      // Update local state
      setCourses(prev => [newCourse, ...prev]);

      // If first course or primary, make it active
      if (courses.length === 0 || courseData.isPrimary) {
        await switchCourse(courseData.courseId);
      }

      logInfo('[CourseContext] Added course', { userId: user.uid, courseId: courseData.courseId });
      return courseData.courseId;
    } catch (error) {
      logError('[CourseContext] Failed to add course', { error });
      throw error;
    }
  }, [user?.uid, courses, switchCourse]);

  /**
   * Update course settings
   */
  const updateCourseSettings = useCallback(async (
    courseId: string,
    settings: Partial<CourseSettings>
  ) => {
    if (!user?.uid) return;

    try {
      const courseRef = doc(db, 'users', user.uid, 'courses', courseId);
      await updateDoc(courseRef, {
        settings: settings,
      });

      // Update local state
      setCourses(prev => prev.map(c =>
        c.courseId === courseId
          ? { ...c, settings: { ...c.settings, ...settings } }
          : c
      ));

      if (activeCourseId === courseId && activeCourse) {
        setActiveCourse({
          ...activeCourse,
          settings: { ...activeCourse.settings, ...settings },
        });
      }

      logInfo('[CourseContext] Updated course settings', { courseId });
    } catch (error) {
      logError('[CourseContext] Failed to update settings', { courseId, error });
    }
  }, [user?.uid, activeCourseId, activeCourse]);

  /**
   * Archive a course
   */
  const archiveCourse = useCallback(async (courseId: string) => {
    if (!user?.uid) return;

    try {
      const courseRef = doc(db, 'users', user.uid, 'courses', courseId);
      await updateDoc(courseRef, {
        status: 'archived',
        isPrimary: false,
      });

      // Update local state
      setCourses(prev => prev.map(c =>
        c.courseId === courseId
          ? { ...c, status: 'archived', isPrimary: false }
          : c
      ));

      // If this was the active course, switch to another
      if (activeCourseId === courseId) {
        const nextCourse = courses.find(c => c.courseId !== courseId && c.status === 'active');
        if (nextCourse) {
          await switchCourse(nextCourse.courseId);
        } else {
          setActiveCourse(null);
          setActiveCourseId(null);
          setActiveProgress(null);
        }
      }

      logInfo('[CourseContext] Archived course', { courseId });
    } catch (error) {
      logError('[CourseContext] Failed to archive course', { courseId, error });
    }
  }, [user?.uid, activeCourseId, courses, switchCourse]);

  // Memoize context value to prevent unnecessary re-renders
  const value = useMemo<CourseContextValue>(() => ({
    activeCourse,
    activeCourseId,
    courses,
    activeProgress,
    switchCourse,
    refreshProgress,
    addCourse,
    updateCourseSettings,
    archiveCourse,
    isLoading,
    isSwitching,
  }), [
    activeCourse,
    activeCourseId,
    courses,
    activeProgress,
    switchCourse,
    refreshProgress,
    addCourse,
    updateCourseSettings,
    archiveCourse,
    isLoading,
    isSwitching,
  ]);

  return (
    <CourseContext.Provider value={value}>
      {children}
    </CourseContext.Provider>
  );
}

export default CourseContext;
