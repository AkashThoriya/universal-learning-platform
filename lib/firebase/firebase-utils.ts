/**
 * @fileoverview Firebase Firestore utility functions for the Exam Strategy Engine
 *
 * This module provides a comprehensive set of functions for managing user data,
 * syllabus, progress tracking, daily logs, mock tests, and analytics within
 * Firebase Firestore. All functions include proper error handling and TypeScript support.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc as _deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  writeBatch,
  onSnapshot,
  QuerySnapshot as _QuerySnapshot,
  DocumentData as _DocumentData,
  QueryConstraint,
} from 'firebase/firestore';

import { logError, logInfo, measurePerformance } from '@/lib/utils/logger';
import {
  User,
  SyllabusSubject,
  Subtopic,
  TopicProgress,
  DailyLog,
  MockTestLog,
  RevisionItem,
  StudyInsight,
} from '@/types/exam';
import { CourseSettings, UserCourse } from '@/types/course-progress';

import { db } from './firebase';

// User Management

/**
 * Creates a new user document in Firestore with default settings and statistics
 *
 * @param {string} userId - The unique user ID from Firebase Auth
 * @param {Partial<User>} userData - Partial user data to be stored
 * @returns {Promise<void>} Promise that resolves when user is created
 *
 * @example
 * ```typescript
 * await createUser('user123', {
 *   email: 'student@example.com',
 *   displayName: 'John Doe'
 * });
 * ```
 */
export const createUser = async (userId: string, userData: Partial<User>) => {
  return measurePerformance('createUser', async () => {
    logInfo('Creating new user', {
      userId,
      displayName: userData.displayName ?? 'no-display-name',
      currentExamId: userData.currentExam?.id ?? 'no-exam',
    });

    try {
      const userRef = doc(db, 'users', userId);

      // Filter out undefined values
      const cleanUserData = { ...userData };

      const newUserData = {
        ...cleanUserData,
        createdAt: Timestamp.now(),
      };

      await setDoc(userRef, newUserData);

      logInfo('User created successfully', {
        userId,
        createdAt: newUserData.createdAt.toDate(),
      });
    } catch (error) {
      logError('Failed to create user', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  });
};

// ============================================================================
// USER CACHE (Reduces redundant API calls across pages)
// ============================================================================

interface UserCacheEntry {
  data: User;
  timestamp: number;
}

const userCache = new Map<string, UserCacheEntry>();
const USER_CACHE_TTL = 5 * 60 * 1000; // 5 minutes

/**
 * Invalidate user cache for a specific user
 * Call this after any update operation to ensure fresh data
 */
export const invalidateUserCache = (userId: string): void => {
  userCache.delete(userId);
};

/**
 * Retrieves a user document from Firestore by user ID
 * Uses in-memory caching with 5-minute TTL to reduce redundant API calls
 *
 * @param {string} userId - The unique user ID
 * @returns {Promise<User | null>} Promise that resolves to User object or null if not found
 *
 * @example
 * ```typescript
 * const user = await getUser('user123');
 * if (user) {
 *   // console.log(`Welcome ${user.displayName}!`);
 * }
 * ```
 */
export const getUser = async (userId: string): Promise<User | null> => {
  return measurePerformance('getUser', async () => {
    // Check cache first
    const cached = userCache.get(userId);

    if (cached && Date.now() - cached.timestamp < USER_CACHE_TTL) {
      logInfo('User cache hit', { userId, cacheAge: Date.now() - cached.timestamp });
      return cached.data;
    }

    logInfo('Fetching user data', { userId });

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = { userId, ...userSnap.data() } as User;

        // Cache the result
        userCache.set(userId, { data: userData, timestamp: Date.now() });

        logInfo('User data retrieved and cached', {
          userId,
          hasDisplayName: !!userData.displayName,
          primaryCourseId: userData.primaryCourseId ?? 'none',
        });
        return userData;
      }
      logInfo('User not found', { userId });
      return null;
    } catch (error) {
      logError('Failed to fetch user data', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  });
};

/**
 * Updates an existing user document with new data
 *
 * @param {string} userId - The unique user ID
 * @param {Partial<User>} updates - Partial user data to update
 * @returns {Promise<void>} Promise that resolves when user is updated
 *
 * @example
 * ```typescript
 * await updateUser('user123', {
 *   onboardingComplete: true,
 *   settings: { dailyStudyGoalMinutes: 480 }
 * });
 * ```
 */
export const updateUser = async (userId: string, updates: Partial<User>) => {
  return measurePerformance('updateUser', async () => {
    logInfo('Updating user data', {
      userId,
      updateFields: Object.keys(updates),
    });

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updates);

      // Invalidate cache after update to ensure fresh data
      invalidateUserCache(userId);

      logInfo('User data updated successfully', {
        userId,
        updatedFields: Object.keys(updates),
      });
    } catch (error) {
      logError('Failed to update user data', {
        userId,
        updateFields: Object.keys(updates),
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  });
};

// Syllabus Management

/**
 * Saves a complete syllabus for a user, replacing any existing syllabus
 *
 * This function now automatically resolves the user's current exam/course
 * and saves to the course-based storage.
 *
 * @param {string} userId - The unique user ID
 * @param {SyllabusSubject[]} syllabus - Array of syllabus subjects to save
 * @param {string} [courseId] - Optional course ID (will use user's current exam if not provided)
 * @returns {Promise<void>} Promise that resolves when syllabus is saved
 *
 * @example
 * ```typescript
 * const syllabus = [
 *   { id: 'history', name: 'History', tier: 1, topics: [...] },
 *   { id: 'geography', name: 'Geography', tier: 2, topics: [...] }
 * ];
 * // Auto-resolve from user's current exam
 * await saveSyllabus('user123', syllabus);
 *
 * // Or specify a specific course
 * await saveSyllabus('user123', syllabus, 'upsc-cse');
 * ```
 */
export const saveSyllabus = async (userId: string, syllabus: SyllabusSubject[], courseId?: string) => {
  return measurePerformance('saveSyllabus', async () => {
    try {
      // If courseId not provided, resolve from user's current exam
      let resolvedCourseId = courseId;

      if (!resolvedCourseId) {
        const user = await getUser(userId);
        resolvedCourseId = user?.currentExam?.id;

        if (!resolvedCourseId) {
          logError('Cannot save syllabus: No courseId provided and user has no current exam', { userId });
          throw new Error('No course selected. Please select an exam first.');
        }
      }

      logInfo('Saving syllabus (delegating to course-based storage)', {
        userId,
        courseId: resolvedCourseId,
        subjectCount: syllabus.length,
        tierDistribution: {
          tier1: syllabus.filter(s => s.tier === 1).length,
          tier2: syllabus.filter(s => s.tier === 2).length,
          tier3: syllabus.filter(s => s.tier === 3).length,
        },
      });

      // Delegate to course-based syllabus save
      await saveSyllabusForCourse(userId, resolvedCourseId, syllabus);

      logInfo('Syllabus saved successfully', { userId, courseId: resolvedCourseId });
    } catch (error) {
      logError('Failed to save syllabus', {
        userId,
        courseId,
        subjectCount: syllabus.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  });
};

/**
 * Updates the status of a specific topic for a user
 *
 * @param {string} userId - The unique user ID
 * @param {string} subjectId - The subject ID containing the topic
 * @param {string} topicId - The topic ID to update
 * @param {object} statusUpdate - The status update data
 * @returns {Promise<void>} Promise that resolves when topic status is updated
 */
export const updateTopicStatus = async (
  userId: string,
  subjectId: string,
  topicId: string,
  statusUpdate: {
    status?: 'not_started' | 'in_progress' | 'completed' | 'mastered';
    progress?: number;
    timeSpent?: number;
    masteryLevel?: number;
    averageScore?: number;
    notes?: string;
    userBankingContext?: string;
  },
  courseId?: string
) => {
  return measurePerformance('updateTopicStatus', async () => {
    logInfo('Updating topic status', {
      userId,
      subjectId,
      topicId,
      statusUpdate,
      courseId,
    });

    try {
      let subjectRef;
      if (courseId) {
        subjectRef = doc(db, 'users', userId, 'courses', courseId, 'syllabus', subjectId);
      } else {
        // Legacy/Global fallback
        subjectRef = doc(db, 'users', userId, 'syllabus', subjectId);
      }
      
      const subjectDoc = await getDoc(subjectRef);

      if (!subjectDoc.exists()) {
        throw new Error(`Subject ${subjectId} not found for user ${userId}`);
      }

      const subjectData = subjectDoc.data();
      const topicStatus = subjectData.topicStatus ?? {};

      // Update topic status
      const updatedTopicStatus = {
        ...topicStatus[topicId],
        ...statusUpdate,
        lastAccessed: Timestamp.now(),
        attempts: (topicStatus[topicId]?.attempts ?? 0) + 1,
      };

      // Mark completion timestamp if status is completed or mastered
      if (statusUpdate.status === 'completed' || statusUpdate.status === 'mastered') {
        updatedTopicStatus.completedAt = Timestamp.now();
      }

      topicStatus[topicId] = updatedTopicStatus;

      // Calculate subject progress
      const totalTopics = Object.keys(topicStatus).length;
      const completedTopics = Object.values(topicStatus).filter(
        (status: any) => status.status === 'completed' || status.status === 'mastered'
      ).length;
      const overallProgress = totalTopics > 0 ? Math.round((completedTopics / totalTopics) * 100) : 0;
      const totalTimeSpent = Object.values(topicStatus).reduce(
        (total: number, status: any) => total + (status.timeSpent ?? 0),
        0
      );

      // Update subject progress
      const subjectProgress = {
        ...subjectData.subjectProgress,
        overallProgress,
        completedTopics,
        timeSpent: totalTimeSpent,
        status: overallProgress === 100 ? 'completed' : overallProgress > 0 ? 'in_progress' : 'not_started',
        ...(overallProgress === 100 && !subjectData.subjectProgress?.completedAt && { completedAt: Timestamp.now() }),
        ...(overallProgress > 0 && !subjectData.subjectProgress?.startedAt && { startedAt: Timestamp.now() }),
      };

      // Update the document
      await updateDoc(subjectRef, {
        topicStatus,
        subjectProgress,
        updatedAt: Timestamp.now(),
      });

      logInfo('Topic status updated successfully', {
        userId,
        subjectId,
        topicId,
        newStatus: updatedTopicStatus.status,
        subjectOverallProgress: overallProgress,
      });
    } catch (error) {
      logError('Failed to update topic status', {
        userId,
        subjectId,
        topicId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  });
};

/**
 * Updates a specific subtopic within a topic
 *
 * @param {string} userId - The unique user ID
 * @param {string} subjectId - The subject ID
 * @param {string} topicId - The topic ID
 * @param {string} subtopicId - The subtopic ID to update
 * @param {Partial<Subtopic>} updates - fields to update
 */
export const updateSubtopic = async (
  userId: string,
  subjectId: string,
  topicId: string,
  subtopicId: string,
  updates: Partial<Subtopic>,
  courseId?: string
) => {
  return measurePerformance('updateSubtopic', async () => {
    logInfo('Updating subtopic', { userId, subjectId, topicId, subtopicId, courseId });

    try {
      // Determine path based on courseId presence
      const subjectRef = courseId
        ? doc(db, 'users', userId, 'courses', courseId, 'syllabus', subjectId)
        : doc(db, 'users', userId, 'syllabus', subjectId);

      const subjectDoc = await getDoc(subjectRef);

      if (!subjectDoc.exists()) {
        throw new Error(`Subject ${subjectId} not found`);
      }

      const subjectData = subjectDoc.data() as SyllabusSubject;
      const subjectsTopics = [...subjectData.topics];

      const topicIndex = subjectsTopics.findIndex(t => t.id === topicId);
      if (topicIndex === -1) {
        throw new Error(`Topic ${topicId} not found`);
      }

      const topic = subjectsTopics[topicIndex];
      // TypeScript safety
      if (!topic) {
        throw new Error(`Topic at index ${topicIndex} is undefined`);
      }

      const subtopics = topic.subtopics ? [...topic.subtopics] : [];

      const subtopicIndex = subtopics.findIndex(s => s.id === subtopicId);
      if (subtopicIndex === -1) {
        throw new Error(`Subtopic ${subtopicId} not found`);
      }

      // Apply updates safely ensuring required fields are kept
      const currentSubtopic = subtopics[subtopicIndex];
      if (!currentSubtopic) {
        throw new Error(`Subtopic at index ${subtopicIndex} is undefined`);
      }

      // Clean updates to remove undefined optional fields if strict
      const cleanUpdates = Object.entries(updates).reduce((acc: any, [k, v]) => {
        if (v !== undefined) {
          acc[k] = v;
        }
        return acc;
      }, {}) as Partial<Subtopic>;

      subtopics[subtopicIndex] = {
        ...currentSubtopic,
        ...cleanUpdates,
      } as Subtopic;

      // Update nested array
      subjectsTopics[topicIndex] = {
        ...topic,
        subtopics,
      };

      await updateDoc(subjectRef, {
        topics: subjectsTopics,
        updatedAt: Timestamp.now(),
      });

      logInfo('Subtopic updated successfully', { userId, subtopicId });
    } catch (error) {
      logError('Failed to update subtopic', { userId, subtopicId, error });
      throw error;
    }
  });
};

/**
 * Retrieves the complete syllabus for a user
 *
 * This function now automatically resolves the user's current exam/course
 * and fetches the syllabus from the course-based storage.
 *
 * @param {string} userId - The unique user ID
 * @param {string} [courseId] - Optional course ID (will use user's current exam if not provided)
 * @returns {Promise<SyllabusSubject[]>} Promise that resolves to array of syllabus subjects
 *
 * @example
 * ```typescript
 * // Auto-resolve from user's current exam
 * const syllabus = await getSyllabus('user123');
 *
 * // Or specify a specific course
 * const syllabus = await getSyllabus('user123', 'upsc-cse');
 * ```
 */
export const getSyllabus = async (userId: string, courseId?: string): Promise<SyllabusSubject[]> => {
  try {
    // If courseId not provided, resolve from user's current exam
    let resolvedCourseId = courseId;

    if (!resolvedCourseId) {
      const user = await getUser(userId);
      resolvedCourseId = user?.currentExam?.id;

      if (!resolvedCourseId) {
        logInfo('No courseId provided and user has no current exam, returning empty syllabus', { userId });
        return [];
      }
    }

    // Delegate to course-based syllabus retrieval
    return await getSyllabusForCourse(userId, resolvedCourseId);
  } catch (error) {
    logError('Failed to get syllabus', { userId, courseId, error });
    return [];
  }
};

/**
 * Saves a syllabus for a specific course (Multi-course support)
 * Stores in: users/{userId}/courses/{courseId}/syllabus
 */
export const saveSyllabusForCourse = async (userId: string, courseId: string, syllabus: SyllabusSubject[]) => {
  return measurePerformance('saveSyllabusForCourse', async () => {
    logInfo('Saving syllabus for course', { userId, courseId, subjectCount: syllabus.length });

    try {
      const batch = writeBatch(db);

      // Collection path: users/{userId}/courses/{courseId}/syllabus
      const syllabusRef = collection(db, 'users', userId, 'courses', courseId, 'syllabus');
      const existingSyllabus = await getDocs(syllabusRef);

      // Clear existing course syllabus
      existingSyllabus.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Add new syllabus subjects
      syllabus.forEach((subject, index) => {
        const subjectRef = doc(syllabusRef, subject.id);

        // Similar to main saveSyllabus but scoped
        const userSubjectData = {
          ...subject,
          order: index,
          userId,
          courseId,
          createdAt: Timestamp.now(),
          updatedAt: Timestamp.now(),
          topics:
            subject.topics?.map((topic, topicIndex) => ({
              ...topic,
              order: topicIndex,
            })) ?? [],
          // Initialize topic status (same logic as main saveSyllabus)
          topicStatus:
            subject.topics?.reduce(
              (acc, topic) => ({
                ...acc,
                [topic.id]: {
                  status: 'not_started',
                  progress: 0,
                  timeSpent: 0,
                  masteryLevel: 0,
                  attempts: 0,
                  averageScore: 0,
                  difficulty: 'medium',
                  estimatedHours: topic.estimatedHours ?? 0,
                },
              }),
              {} as Record<string, any>
            ) ?? {},
          subjectProgress: {
            // ... copy standard init logic
            totalTopics: subject.topics?.length ?? 0,
            completedTopics: 0,
            masteredTopics: 0,
            totalTimeSpent: 0,
            averageMastery: 0,
            status: 'not_started',
          },
        };

        batch.set(subjectRef, userSubjectData);
      });

      await batch.commit();

      // Invalidate cache
      invalidateSyllabusCache(courseId);

      logInfo('Course syllabus saved successfully', { userId, courseId });
    } catch (error) {
      logError('Failed to save course syllabus', { userId, courseId, error });
      throw error;
    }
  });
};

/**
 * Saves or updates settings for a specific course
 * Stores in: users/{userId}/courses/{courseId} (merges with existing data)
 */
export const saveCourseSettings = async (
  userId: string, 
  courseId: string, 
  settings: Partial<CourseSettings> | any, // Use any to allow flexible updates during migration
  additionalData?: any
) => {
  return measurePerformance('saveCourseSettings', async () => {
    logInfo('Saving course settings', { userId, courseId, settingsKeys: Object.keys(settings) });

    try {
      const courseRef = doc(db, 'users', userId, 'courses', courseId);
      
      // Prepare update data
      const updateData: any = {
        updatedAt: Timestamp.now(),
        settings: settings,
        ...additionalData
      };

      // Use setDoc with merge: true to ensure we don't overwrite entire document
      // and create it if it doesn't exist
      await setDoc(courseRef, updateData, { merge: true });

      logInfo('Course settings saved successfully', { userId, courseId });
    } catch (error) {
      logError('Failed to save course settings', { userId, courseId, error });
      throw error;
    }
  });
};

/**
 * Retrieves a specific course for a user
 *
 * @param {string} userId - The unique user ID
 * @param {string} courseId - The course ID to retrieve
 * @returns {Promise<UserCourse | null>} Promise that resolves to UserCourse or null
 */
export const getCourse = async (userId: string, courseId: string): Promise<UserCourse | null> => {
  return measurePerformance('getCourse', async () => {
    try {
      const courseRef = doc(db, 'users', userId, 'courses', courseId);
      const courseSnap = await getDoc(courseRef);

      if (courseSnap.exists()) {
        return courseSnap.data() as UserCourse;
      }
      return null;
    } catch (error) {
      logError('Failed to get course', { userId, courseId, error });
      throw error;
    }
  });
};

// ============================================================================
// SYLLABUS CACHE
// ============================================================================

interface SyllabusCacheEntry {
  data: SyllabusSubject[];
  timestamp: number;
}

const syllabusCache = new Map<string, SyllabusCacheEntry>();
const SYLLABUS_CACHE_TTL = 10 * 60 * 1000; // 10 minutes

/**
 * Invalidate syllabus cache for a specific course
 */
export const invalidateSyllabusCache = (courseId: string): void => {
  syllabusCache.delete(courseId);
};

/**
 * Retrieves the syllabus for a specific course
 * Uses in-memory caching with 10-minute TTL
 */
import { getExamById } from '@/lib/data/exams-data';

export const getSyllabusForCourse = async (userId: string, courseId: string): Promise<SyllabusSubject[]> => {
  return measurePerformance('getSyllabusForCourse', async () => {
    // Check cache first
    const cached = syllabusCache.get(courseId);
    if (cached && Date.now() - cached.timestamp < SYLLABUS_CACHE_TTL) {
      logInfo('Syllabus cache hit', { courseId, cacheAge: Date.now() - cached.timestamp });
      return cached.data;
    }

    try {
      const syllabusRef = collection(db, 'users', userId, 'courses', courseId, 'syllabus');
      const snapshot = await getDocs(syllabusRef);

      const subjects = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      })) as SyllabusSubject[];

      let sortedSubjects = subjects
        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
        .map(subject => ({
          ...subject,
          topics: subject.topics?.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)) ?? [],
        }));

      // If no syllabus found in Firestore, try to get default from static data
      if (sortedSubjects.length === 0) {
        logInfo('No syllabus in Firestore, checking default data', { courseId });
        const exam = getExamById(courseId);
        if (exam && exam.defaultSyllabus) {
          logInfo('Found default syllabus', { courseId, subjectCount: exam.defaultSyllabus.length });
          sortedSubjects = [...exam.defaultSyllabus];
        }
      }

      // Cache the result
      syllabusCache.set(courseId, { data: sortedSubjects, timestamp: Date.now() });

      return sortedSubjects;
    } catch (error) {
      logError('Failed to get course syllabus', { userId, courseId, error });
      throw error;
    }
  });
};

/**
 * Retrieves all syllabi for all user courses
 */
export const getAllSyllabi = async (userId: string): Promise<Record<string, SyllabusSubject[]>> => {
  const user = await getUser(userId);
  if (!user?.currentExam?.id) {
    return {};
  }

  const results: Record<string, SyllabusSubject[]> = {};

  // Currently focusing on primary exam
  results[user.currentExam.id] = await getSyllabusForCourse(userId, user.currentExam.id);

  return results;
};

// Progress Tracking

// ============================================================================
// PROGRESS CACHE (Reduces redundant API calls on page switches)
// ============================================================================

interface ProgressCacheEntry {
  data: TopicProgress[];
  timestamp: number;
}

const progressCache = new Map<string, ProgressCacheEntry>();
const PROGRESS_CACHE_TTL = 2 * 60 * 1000; // 2 minutes

/**
 * Invalidate progress cache for a specific user
 * Call this after any update operation to ensure fresh data
 */
export const invalidateProgressCache = (userId: string): void => {
  progressCache.delete(userId);
};

/**
 * Updates or creates progress tracking for a specific topic
 * Automatically creates new progress entry if one doesn't exist
 *
 * @param {string} userId - The unique user ID
 * @param {string} topicId - The unique topic ID
 * @param {Partial<TopicProgress>} updates - Progress data to update
 * @returns {Promise<void>} Promise that resolves when progress is updated
 *
 * @example
 * ```typescript
 * await updateTopicProgress('user123', 'british_rule', {
 *   masteryScore: 85,
 *   userNotes: 'Key concepts mastered',
 *   personalContext: 'Important for understanding colonial impact'
 * });
 * ```
 */
/**
 * Updates or creates progress tracking for a specific topic
 * Automatically creates new progress entry if one doesn't exist
 *
 * @param {string} userId - The unique user ID
 * @param {string} topicId - The unique topic ID
 * @param {Partial<TopicProgress>} updates - Progress data to update
 * @param {string} [courseId] - Optional course ID (if provided, writes to course-scoped path)
 * @returns {Promise<void>} Promise that resolves when progress is updated
 *
 * @example
 * ```typescript
 * await updateTopicProgress('user123', 'british_rule', {
 *   masteryScore: 85,
 *   userNotes: 'Key concepts mastered',
 *   personalContext: 'Important for understanding colonial impact'
 * }, 'upsc_2026');
 * ```
 */
export const updateTopicProgress = async (
  userId: string,
  topicId: string,
  updates: Partial<TopicProgress>,
  courseId?: string
) => {
  try {
    // Determine path based on courseId presence
    const progressRef = courseId
      ? doc(db, 'users', userId, 'courses', courseId, 'progress', topicId)
      : doc(db, 'users', userId, 'progress', topicId);

    const progressSnap = await getDoc(progressRef);

    if (progressSnap.exists()) {
      await updateDoc(progressRef, updates);
    } else {
      // Create new progress entry
      await setDoc(progressRef, {
        id: topicId,
        topicId,
        courseId: courseId || null, // Track which course this belongs to
        masteryScore: 0,
        lastRevised: Timestamp.now(),
        nextRevision: Timestamp.now(),
        revisionCount: 0,
        totalStudyTime: 0,
        userNotes: '',
        personalContext: '',
        tags: [],
        difficulty: 3,
        importance: 3,
        lastScoreImprovement: 0,
        ...updates,
      });
    }

    // Invalidate cache after update
    // We invalidate both global and course-specific caches to be safe, 
    // or we could be more granular. For now, simple invalidation.
    invalidateProgressCache(userId);

    logInfo('Topic progress updated', {
      userId,
      topicId,
      courseId: courseId || 'global',
      updateFields: Object.keys(updates),
    });
  } catch (error) {
    logError('Failed to update topic progress', {
      userId,
      topicId,
      courseId,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Retrieves progress data for a specific topic
 *
 * @param {string} userId - The unique user ID
 * @param {string} topicId - The unique topic ID
 * @param {string} [courseId] - Optional course ID (if provided, reads from course-scoped path)
 * @returns {Promise<TopicProgress | null>} Promise that resolves to progress data or null if not found
 */
export const getTopicProgress = async (userId: string, topicId: string, courseId?: string): Promise<TopicProgress | null> => {
  // Determine path based on courseId presence
  const progressRef = courseId
    ? doc(db, 'users', userId, 'courses', courseId, 'progress', topicId)
    : doc(db, 'users', userId, 'progress', topicId);

  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    return { id: progressSnap.id, ...progressSnap.data() } as TopicProgress;
  }
  return null;
};

/**
 * Retrieves all progress data for a user across all topics
 * Uses in-memory caching with 2-minute TTL to reduce redundant API calls
 *
 * @param {string} userId - The unique user ID
 * @returns {Promise<TopicProgress[]>} Promise that resolves to array of all topic progress
 *
 * @example
 * ```typescript
 * const allProgress = await getAllProgress('user123');
 * const averageMastery = allProgress.reduce((sum, p) => sum + p.masteryScore, 0) / allProgress.length;
 * ```
 */
/**
 * Retrieves all progress data for a user across all topics
 * Uses in-memory caching with 2-minute TTL to reduce redundant API calls
 *
 * @param {string} userId - The unique user ID
 * @param {string} [courseId] - Optional course ID (if provided, reads from course-scoped path)
 * @returns {Promise<TopicProgress[]>} Promise that resolves to array of all topic progress
 *
 * @example
 * ```typescript
 * const allProgress = await getAllProgress('user123', 'upsc_2026');
 * ```
 */
export const getAllProgress = async (userId: string, courseId?: string): Promise<TopicProgress[]> => {
  // Create a composite cache key if courseId is present
  const cacheKey = courseId ? `${userId}_${courseId}` : userId;
  
  // Check cache first
  const cached = progressCache.get(cacheKey);

  if (cached && Date.now() - cached.timestamp < PROGRESS_CACHE_TTL) {
    logInfo('Progress cache hit', { userId, courseId, cacheAge: Date.now() - cached.timestamp });
    return cached.data;
  }

  // Fetch from Firestore
  // Determine path based on courseId presence
  const progressRef = courseId 
    ? collection(db, 'users', userId, 'courses', courseId, 'progress')
    : collection(db, 'users', userId, 'progress');

  const progressSnap = await getDocs(progressRef);

  const progressData = progressSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as TopicProgress[];

  // Cache the result
  progressCache.set(cacheKey, { data: progressData, timestamp: Date.now() });

  logInfo('Progress fetched and cached', { userId, courseId, count: progressData.length });
  return progressData;
};

/**
 * Marks a practice question as solved for a topic
 * Adds the question slug to solvedQuestions array and increments practiceCount
 *
 * @param {string} userId - The unique user ID
 * @param {string} topicId - The unique topic ID
 * @param {string} questionSlug - The unique slug of the question being marked as solved
 * @returns {Promise<void>} Promise that resolves when question is marked as solved
 *
 * @example
 * ```typescript
 * await markQuestionSolved('user123', 'arrays', 'two-sum');
 * ```
 */
/**
 * Marks a practice question as solved for a topic
 * Adds the question slug to solvedQuestions array and increments practiceCount
 *
 * @param {string} userId - The unique user ID
 * @param {string} topicId - The unique topic ID
 * @param {string} questionSlug - The unique slug of the question being marked as solved
 * @param {string} [courseId] - Optional course ID
 * @returns {Promise<void>} Promise that resolves when question is marked as solved
 */
export const markQuestionSolved = async (
  userId: string,
  topicId: string,
  questionSlug: string,
  courseId?: string
): Promise<void> => {
  try {
    const current = await getTopicProgress(userId, topicId, courseId);
    const solvedQuestions = current?.solvedQuestions || [];

    // Only add if not already solved
    if (!solvedQuestions.includes(questionSlug)) {
      await updateTopicProgress(
        userId,
        topicId,
        {
          solvedQuestions: [...solvedQuestions, questionSlug],
          practiceCount: (current?.practiceCount || 0) + 1,
          lastPracticed: Timestamp.now(),
        },
        courseId
      );

      logInfo('Question marked as solved', { userId, topicId, questionSlug, courseId });
    }
  } catch (error) {
    logError('Failed to mark question as solved', { userId, topicId, questionSlug, courseId, error });
    throw error;
  }
};

/**
 * Toggles a practice question's solved status for a topic
 * Adds or removes the question slug from solvedQuestions array
 *
 * @param {string} userId - The unique user ID
 * @param {string} topicId - The unique topic ID
 * @param {string} questionSlug - The unique slug of the question to toggle
 * @returns {Promise<boolean>} Promise that resolves to true if now solved, false if unsolved
 *
 * @example
 * ```typescript
 * const isSolved = await toggleQuestionSolved('user123', 'arrays', 'two-sum');
 * console.log(isSolved ? 'Now solved!' : 'Marked as unsolved');
 * ```
 */
/**
 * Toggles a practice question's solved status for a topic
 * Adds or removes the question slug from solvedQuestions array
 *
 * @param {string} userId - The unique user ID
 * @param {string} topicId - The unique topic ID
 * @param {string} questionSlug - The unique slug of the question to toggle
 * @param {string} [courseId] - Optional course ID
 * @returns {Promise<boolean>} Promise that resolves to true if now solved, false if unsolved
 */
export const toggleQuestionSolved = async (
  userId: string,
  topicId: string,
  questionSlug: string,
  courseId?: string
): Promise<boolean> => {
  try {
    const current = await getTopicProgress(userId, topicId, courseId);
    const solvedQuestions = current?.solvedQuestions || [];
    const isSolved = solvedQuestions.includes(questionSlug);

    if (isSolved) {
      // Remove from solved list
      await updateTopicProgress(
        userId,
        topicId,
        {
          solvedQuestions: solvedQuestions.filter(slug => slug !== questionSlug),
        },
        courseId
      );
      logInfo('Question unmarked as solved', { userId, topicId, questionSlug, courseId });
      return false;
    }
    // Add to solved list
    await updateTopicProgress(
      userId,
      topicId,
      {
        solvedQuestions: [...solvedQuestions, questionSlug],
        practiceCount: (current?.practiceCount || 0) + 1,
        lastPracticed: Timestamp.now(),
      },
      courseId
    );
    logInfo('Question marked as solved', { userId, topicId, questionSlug, courseId });
    return true;
  } catch (error) {
    logError('Failed to toggle question solved status', { userId, topicId, questionSlug, courseId, error });
    throw error;
  }
};

// Revision Queue

/**
 * Generates the spaced repetition revision queue for a user
 * Returns topics that are due for revision based on the spaced repetition algorithm
 *
 * @param {string} userId - The unique user ID
 * @returns {Promise<RevisionItem[]>} Promise that resolves to array of topics due for revision
 *
 * @example
 * ```typescript
 * const revisionQueue = await getRevisionQueue('user123');
 * // console.log(`${revisionQueue.length} topics due for revision`);
 * revisionQueue.forEach(item => {
 *   // console.log(`${item.topicName} - ${item.priority}`);
 * });
 * ```
 */
export const getRevisionQueue = async (userId: string, courseId?: string): Promise<RevisionItem[]> => {
  // Use course-scoped path if courseId provided, else legacy global path
  const progressRef = courseId
    ? collection(db, 'users', userId, 'courses', courseId, 'progress')
    : collection(db, 'users', userId, 'progress');
  const today = Timestamp.now();

  const revisionQuery = query(
    progressRef,
    where('nextRevision', '<=', today),
    orderBy('nextRevision', 'asc'),
    limit(20)
  );

  const revisionSnap = await getDocs(revisionQuery);
  const syllabus = await getSyllabus(userId, courseId);

  return revisionSnap.docs.map(doc => {
    const progress = doc.data() as TopicProgress;
    const subject = syllabus.find(s => s.topics.some(t => t.id === progress.topicId));
    const topic = subject?.topics.find(t => t.id === progress.topicId);

    const lastRevisedMillis = progress.lastRevised?.toMillis?.() || today.toMillis();
    const daysSinceLastRevision = Math.floor((today.toMillis() - lastRevisedMillis) / (1000 * 60 * 60 * 24));

    let priority: 'overdue' | 'due_today' | 'due_soon' | 'scheduled' = 'scheduled';
    if (daysSinceLastRevision > 1) {
      priority = 'overdue';
    } else if (daysSinceLastRevision === 1) {
      priority = 'due_today';
    } else {
      priority = 'due_soon';
    }

    return {
      topicId: progress.topicId,
      topicName: topic?.name ?? 'Unknown Topic',
      subjectName: subject?.name ?? 'Unknown Subject',
      tier: subject?.tier ?? 3,
      masteryScore: progress.masteryScore,
      daysSinceLastRevision,
      priority,
      estimatedTime: topic?.estimatedHours ? topic.estimatedHours * 60 : 30,
      lastRevised: progress.lastRevised,
      nextRevision: progress.nextRevision,
    } as RevisionItem;
  });
};

// Daily Logging

/**
 * Saves a daily log entry and updates user statistics
 * Automatically calculates study streaks and updates user stats
 *
 * @param {string} userId - The unique user ID
 * @param {DailyLog} log - The daily log data to save
 * @returns {Promise<void>} Promise that resolves when log is saved
 *
 * @example
 * ```typescript
 * const dailyLog = {
 *   id: '2025-08-20',
 *   date: Timestamp.now(),
 *   health: { energy: 8, sleepHours: 7, sleepQuality: 8, stressLevel: 3, physicalActivity: 30, screenTime: 8 },
 *   studiedTopics: [...],
 *   goals: { targetMinutes: 480, actualMinutes: 450, completed: true },
 *   mood: 4,
 *   productivity: 4,
 *   note: 'Great study session today',
 *   challenges: [],
 *   wins: ['Completed all planned topics']
 * };
 * await saveDailyLog('user123', dailyLog);
 * ```
 */
export const saveDailyLog = async (userId: string, log: DailyLog) => {
  try {
    const logRef = doc(db, 'users', userId, 'logs_daily', log.id);
    await setDoc(logRef, log);

    // Update user stats
    await updateUserStats(userId, log);

    logInfo('Daily log saved', {
      userId,
      logId: log.id,
      studiedTopicsCount: log.studiedTopics?.length ?? 0,
    });
  } catch (error) {
    logError('Failed to save daily log', {
      userId,
      logId: log.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Retrieves a daily log entry for a specific date
 *
 * @param {string} userId - The unique user ID
 * @param {string} date - The date in format 'YYYY-MM-DD'
 * @returns {Promise<DailyLog | null>} Promise that resolves to daily log or null if not found
 *
 * @example
 * ```typescript
 * const todayLog = await getDailyLog('user123', '2025-08-20');
 * if (todayLog) {
 *   // console.log(`Study time: ${todayLog.goals.actualMinutes} minutes`);
 * }
 * ```
 */
export const getDailyLog = async (userId: string, date: string): Promise<DailyLog | null> => {
  const logRef = doc(db, 'users', userId, 'logs_daily', date);
  const logSnap = await getDoc(logRef);

  if (logSnap.exists()) {
    return { id: logSnap.id, ...logSnap.data() } as DailyLog;
  }
  return null;
};

/**
 * Retrieves recent daily logs for a user
 * Returns logs in descending order by date (most recent first)
 *
 * @param {string} userId - The unique user ID
 * @param {number} days - Number of recent days to retrieve (default: 30)
 * @returns {Promise<DailyLog[]>} Promise that resolves to array of recent daily logs
 *
 * @example
 * ```typescript
 * const recentLogs = await getRecentDailyLogs('user123', 7);
 * const totalStudyTime = recentLogs.reduce((sum, log) => sum + log.goals.actualMinutes, 0);
 * // console.log(`Total study time in last 7 days: ${totalStudyTime} minutes`);
 * ```
 */
export const getRecentDailyLogs = async (userId: string, days = 30): Promise<DailyLog[]> => {
  const logsRef = collection(db, 'users', userId, 'logs_daily');
  const logsQuery = query(logsRef, orderBy('date', 'desc'), limit(days));

  const logsSnap = await getDocs(logsQuery);
  return logsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as DailyLog[];
};

// Mock Test Logging

/**
 * Saves a mock test log and automatically updates mastery scores based on performance
 *
 * @param {string} userId - The unique user ID
 * @param {MockTestLog} test - The mock test data to save
 * @returns {Promise<void>} Promise that resolves when test is saved and scores updated
 *
 * @example
 * ```typescript
 * const mockTest = {
 *   id: 'mock_123',
 *   date: Timestamp.now(),
 *   platform: 'Vision IAS',
 *   testName: 'Prelims Test #5',
 *   stage: 'prelims',
 *   type: 'full_length',
 *   scores: { 'GS Paper I': 98, 'CSAT': 180 },
 *   maxScores: { 'GS Paper I': 200, 'CSAT': 200 },
 *   // ... other properties
 * };
 * await saveMockTest('user123', mockTest);
 * ```
 */
export const saveMockTest = async (userId: string, test: MockTestLog, courseId?: string) => {
  try {
    const testRef = doc(db, 'users', userId, 'logs_mocks', test.id);
    await setDoc(testRef, test);

    // Update mastery scores based on test performance (pass courseId for course-scoped updates)
    await updateMasteryScoresFromTest(userId, test, courseId);

    logInfo('Mock test saved', {
      userId,
      testId: test.id,
      platform: test.platform,
      testName: test.testName,
    });
  } catch (error) {
    logError('Failed to save mock test', {
      userId,
      testId: test.id,
      error: error instanceof Error ? error.message : 'Unknown error',
    });
    throw error;
  }
};

/**
 * Retrieves recent mock test logs for a user
 * Returns tests in descending order by date (most recent first)
 *
 * @param {string} userId - The unique user ID
 * @param {number} limitCount - Maximum number of tests to retrieve (default: 10)
 * @param {string} courseId - Optional course ID to filter tests by course
 * @returns {Promise<MockTestLog[]>} Promise that resolves to array of mock test logs
 *
 * @example
 * ```typescript
 * const recentTests = await getMockTests('user123', 5, 'course-id');
 * const averageScore = recentTests.reduce((sum, test) => {
 *   const totalScore = Object.values(test.scores).reduce((s, score) => s + score, 0);
 *   const maxScore = Object.values(test.maxScores).reduce((s, score) => s + score, 0);
 *   return sum + (totalScore / maxScore) * 100;
 * }, 0) / recentTests.length;
 * ```
 */
export const getMockTests = async (userId: string, limitCount = 10, courseId?: string): Promise<MockTestLog[]> => {
  const testsRef = collection(db, 'users', userId, 'logs_mocks');
  
  // Build query constraints - filter by courseId if provided
  const constraints: QueryConstraint[] = [];
  if (courseId) {
    constraints.push(where('courseId', '==', courseId));
  }
  constraints.push(orderBy('date', 'desc'));
  constraints.push(limit(limitCount));
  
  const testsQuery = query(testsRef, ...constraints);

  const testsSnap = await getDocs(testsQuery);
  return testsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as MockTestLog[];
};

// Analytics and Insights

/**
 * Generates AI-powered study insights based on user's recent performance, health data, and progress
 * Analyzes patterns and provides actionable recommendations
 *
 * @param {string} userId - The unique user ID
 * @returns {Promise<StudyInsight[]>} Promise that resolves to array of personalized study insights
 *
 * @example
 * ```typescript
 * const insights = await generateStudyInsights('user123');
 * insights.forEach(insight => {
 *   // console.log(`${insight.priority.toUpperCase()}: ${insight.title}`);
 *   // console.log(insight.description);
 *   insight.actionItems.forEach(action => // console.log(`- ${action}`));
 * });
 * ```
 */
export const generateStudyInsights = async (userId: string, courseId?: string): Promise<StudyInsight[]> => {
  const insights: StudyInsight[] = [];

  // Get recent data
  const recentLogs = await getRecentDailyLogs(userId, 14);
  const recentTests = await getMockTests(userId, 5);
  const progress = await getAllProgress(userId, courseId);

  // Health-Performance Correlation Analysis
  if (recentLogs.length >= 7 && recentTests.length >= 2) {
    const avgEnergy = recentLogs.reduce((sum, log) => sum + log.health.energy, 0) / recentLogs.length;
    const avgScore =
      recentTests.reduce((sum, test) => {
        const totalScore = Object.values(test.scores).reduce((s, score) => s + score, 0);
        const maxScore = Object.values(test.maxScores).reduce((s, score) => s + score, 0);
        return sum + (totalScore / maxScore) * 100;
      }, 0) / recentTests.length;

    if (avgEnergy < 6 && avgScore < 70) {
      insights.push({
        type: 'warning',
        title: 'Low Energy Affecting Performance',
        description: `Your average energy level (${avgEnergy.toFixed(1)}/10) correlates with lower test scores (${avgScore.toFixed(1)}%). Consider improving sleep and health habits.`,
        actionItems: [
          'Maintain 7-8 hours of sleep daily',
          'Take regular breaks during study sessions',
          'Include physical exercise in your routine',
        ],
        priority: 'high',
        category: 'health',
      });
    }
  }

  // Study Consistency Analysis
  const studyDays = recentLogs.filter(log => log.studiedTopics.length > 0).length;
  if (studyDays < recentLogs.length * 0.7) {
    insights.push({
      type: 'warning',
      title: 'Inconsistent Study Pattern',
      description: `You've studied on only ${studyDays} out of ${recentLogs.length} days. Consistency is key for retention.`,
      actionItems: ['Set a minimum daily study goal', 'Use study reminders', 'Plan buffer days for flexibility'],
      priority: 'high',
      category: 'strategy',
    });
  }

  // Weak Areas Identification
  const weakTopics = progress
    .filter(p => p.masteryScore < 50)
    .sort((a, b) => a.masteryScore - b.masteryScore)
    .slice(0, 3);

  if (weakTopics.length > 0) {
    insights.push({
      type: 'recommendation',
      title: 'Focus on Weak Areas',
      description: `${weakTopics.length} topics need immediate attention with mastery scores below 50%.`,
      actionItems: weakTopics.map(topic => `Prioritize revision for ${topic.topicId}`),
      priority: 'medium',
      category: 'performance',
      data: { weakTopics },
    });
  }

  return insights;
};

// Helper Functions
const updateUserStats = async (userId: string, log: DailyLog) => {
  try {
    // Get current unified progress
    const progressRef = doc(db, 'users', userId, 'progress', 'unified');
    const progressSnap = await getDoc(progressRef);
    
    // Define default progress structure if it doesn't exist
    const defaultProgress = {
      userId,
      overallProgress: {
        totalMissionsCompleted: 0,
        totalTimeInvested: 0,
        averageScore: 0,
        currentStreak: 0,
        longestStreak: 0,
        consistencyRating: 0,
      },
      trackProgress: {
        exam: {
          track: 'exam' as const,
          missionsCompleted: 0,
          averageScore: 0,
          timeInvested: 0,
          proficiencyLevel: 'beginner' as const,
          masteredSkills: [],
          skillsInProgress: [],
          performanceTrend: 'stable' as const,
          difficultyProgression: {
            current: 'medium' as const,
            recommended: 'medium' as const,
            readyForAdvancement: false,
          },
          topicBreakdown: [],
        },
        course_tech: {
          track: 'course_tech' as const,
          missionsCompleted: 0,
          averageScore: 0,
          timeInvested: 0,
          proficiencyLevel: 'beginner' as const,
          masteredSkills: [],
          skillsInProgress: [],
          performanceTrend: 'stable' as const,
          difficultyProgression: {
            current: 'medium' as const,
            recommended: 'medium' as const,
            readyForAdvancement: false,
          },
          topicBreakdown: [],
        },
      },
      crossTrackInsights: {
        transferableSkills: [],
        effectivePatterns: [],
        recommendedBalance: { exam: 70, course_tech: 30 },
      },
      periodSummaries: {
        weekly: [],
        monthly: [],
      },
      updatedAt: new Date(),
    };

    const currentProgress = progressSnap.exists() 
      ? progressSnap.data()
      : defaultProgress;

    // Calculate study time from log
    const studyMinutes = log.studiedTopics?.reduce((sum, session) => sum + session.minutes, 0) ?? 0;
    
    // Update overall stats
    currentProgress.overallProgress.totalTimeInvested = 
      (currentProgress.overallProgress.totalTimeInvested ?? 0) + studyMinutes;
    currentProgress.overallProgress.totalMissionsCompleted = 
      (currentProgress.overallProgress.totalMissionsCompleted ?? 0) + 1;
    
    // Update streak (check if this is a consecutive day)
    const lastUpdate = currentProgress.updatedAt;
    const lastActivityDate = lastUpdate 
      ? (lastUpdate.toDate ? lastUpdate.toDate() : new Date(lastUpdate)).toDateString()
      : null;
    const today = new Date().toDateString();
    const yesterday = new Date(Date.now() - 86400000).toDateString();
    
    if (lastActivityDate === yesterday) {
      // Consecutive day - increment streak
      currentProgress.overallProgress.currentStreak = 
        (currentProgress.overallProgress.currentStreak ?? 0) + 1;
    } else if (lastActivityDate !== today) {
      // Not consecutive and not same day - reset to 1
      currentProgress.overallProgress.currentStreak = 1;
    }
    // If same day, don't change streak
    
    // Update longest streak
    if ((currentProgress.overallProgress.currentStreak ?? 0) > (currentProgress.overallProgress.longestStreak ?? 0)) {
      currentProgress.overallProgress.longestStreak = currentProgress.overallProgress.currentStreak;
    }
    
    // Update consistency rating (0-100 scale for weeklyGoalProgress)
    const streakScore = Math.min((currentProgress.overallProgress.currentStreak ?? 0) / 30, 1);
    const volumeScore = Math.min((currentProgress.overallProgress.totalMissionsCompleted ?? 0) / 100, 1);
    currentProgress.overallProgress.consistencyRating = Math.round((streakScore * 0.6 + volumeScore * 0.4) * 100);
    
    // Update timestamp
    currentProgress.updatedAt = Timestamp.now();
    
    await setDoc(progressRef, currentProgress, { merge: true });
    
    logInfo('User stats updated from daily log', { 
      userId, 
      studyMinutes,
      currentStreak: currentProgress.overallProgress.currentStreak,
      totalTimeInvested: currentProgress.overallProgress.totalTimeInvested,
    });
  } catch (error) {
    logError('Failed to update user stats', { 
      userId, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

const updateMasteryScoresFromTest = async (userId: string, test: MockTestLog, courseId?: string) => {
  // Update mastery scores based on topic-wise performance
  for (const topicPerf of test.topicWisePerformance) {
    const currentProgress = await getTopicProgress(userId, topicPerf.topicId, courseId);

    if (currentProgress) {
      // Calculate new mastery score based on accuracy
      const improvementFactor = topicPerf.accuracy > 0.8 ? 10 : topicPerf.accuracy > 0.6 ? 5 : -5;
      const newMasteryScore = Math.max(0, Math.min(100, currentProgress.masteryScore + improvementFactor));

      await updateTopicProgress(userId, topicPerf.topicId, {
        masteryScore: newMasteryScore,
        lastScoreImprovement: improvementFactor,
      }, courseId);
    }
  }
};

// Real-time subscriptions
export const subscribeToRevisionQueue = (userId: string, callback: (items: RevisionItem[]) => void, courseId?: string) => {
  // Use course-scoped path if courseId provided, else legacy global path
  const progressRef = courseId 
    ? collection(db, 'users', userId, 'courses', courseId, 'progress')
    : collection(db, 'users', userId, 'progress');
  const today = Timestamp.now();

  const revisionQuery = query(
    progressRef,
    where('nextRevision', '<=', today),
    orderBy('nextRevision', 'asc'),
    limit(20)
  );

  return onSnapshot(
    revisionQuery,
    async snapshot => {
      const syllabus = await getSyllabus(userId, courseId);
      const items = snapshot.docs.map(doc => {
        const progress = doc.data() as TopicProgress;
        const subject = syllabus.find(s => s.topics.some(t => t.id === progress.topicId));
        const topic = subject?.topics.find(t => t.id === progress.topicId);

        const daysSinceLastRevision = Math.floor(
          (today.toMillis() - progress.lastRevised.toMillis()) / (1000 * 60 * 60 * 24)
        );

        let priority: 'overdue' | 'due_today' | 'due_soon' | 'scheduled' = 'scheduled';
        if (daysSinceLastRevision > 1) {
          priority = 'overdue';
        } else if (daysSinceLastRevision === 1) {
          priority = 'due_today';
        } else {
          priority = 'due_soon';
        }

        return {
          topicId: progress.topicId,
          topicName: topic?.name ?? 'Unknown Topic',
          subjectName: subject?.name ?? 'Unknown Subject',
          tier: subject?.tier ?? 3,
          masteryScore: progress.masteryScore,
          daysSinceLastRevision,
          priority,
          estimatedTime: topic?.estimatedHours ? topic.estimatedHours * 60 : 30,
          lastRevised: progress.lastRevised,
          nextRevision: progress.nextRevision,
        } as RevisionItem;
      });

      callback(items);
    },
    error => {
      logError('Subscription error in subscribeToRevisionQueue', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  );
};

export const subscribeToUserStats = (userId: string, callback: (user: User) => void) => {
  const userRef = doc(db, 'users', userId);

  return onSnapshot(
    userRef,
    doc => {
      if (doc.exists()) {
        callback({ userId, ...doc.data() } as User);
      }
    },
    error => {
      logError('Subscription error in subscribeToUserStats', {
        userId,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  );
};

// ============================================================================
// DAILY LOGS & STREAK ANALYTICS
// ============================================================================

/**
 * Retrieves daily logs history for a specific user
 * Used for streak visualization and heatmaps
 *
 * @param {string} userId - The unique user ID
 * @param {number} days - Number of days to look back (default: 365)
 * @returns {Promise<DailyLog[]>} Promise that resolves to array of daily logs
 */
export const getDailyLogsHistory = async (userId: string, days = 365): Promise<DailyLog[]> => {
  return measurePerformance('getDailyLogsHistory', async () => {
    try {
      const logsRef = collection(db, 'users', userId, 'dailyLogs');

      // Calculate start date
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const q = query(logsRef, where('date', '>=', Timestamp.fromDate(startDate)), orderBy('date', 'desc'));

      const snapshot = await getDocs(q);

      return snapshot.docs.map(
        doc =>
          ({
            id: doc.id,
            ...doc.data(),
          }) as DailyLog
      );
    } catch (error) {
      logError('Failed to get daily logs history', { userId, days, error });
      return [];
    }
  });
};
