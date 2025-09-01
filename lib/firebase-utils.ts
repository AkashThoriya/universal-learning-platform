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
} from 'firebase/firestore';

import { User, SyllabusSubject, TopicProgress, DailyLog, MockTestLog, RevisionItem, StudyInsight } from '@/types/exam';

import { db } from './firebase';
import { logError, logInfo, measurePerformance } from './logger';

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
      selectedExamId: userData.selectedExamId ?? 'no-exam',
      isCustomExam: userData.isCustomExam ?? false,
    });

    try {
      const userRef = doc(db, 'users', userId);
      const newUserData = {
        ...userData,
        createdAt: Timestamp.now(),
        onboardingComplete: false,
        stats: {
          totalStudyHours: 0,
          currentStreak: 0,
          longestStreak: 0,
          totalMockTests: 0,
          averageScore: 0,
          topicsCompleted: 0,
          totalTopics: 0,
        },
      };

      await setDoc(userRef, newUserData);

      logInfo('User created successfully', {
        userId,
        createdAt: newUserData.createdAt.toDate(),
        onboardingComplete: newUserData.onboardingComplete,
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

/**
 * Retrieves a user document from Firestore by user ID
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
    logInfo('Fetching user data', { userId });

    try {
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);

      if (userSnap.exists()) {
        const userData = { userId, ...userSnap.data() } as User;
        logInfo('User data retrieved successfully', {
          userId,
          hasDisplayName: !!userData.displayName,
          onboardingComplete: userData.onboardingComplete ?? false,
          selectedExamId: userData.selectedExamId ?? 'none',
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
      onboardingComplete: updates.onboardingComplete,
    });

    try {
      const userRef = doc(db, 'users', userId);
      await updateDoc(userRef, updates);

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
 * Uses batch operations for atomic updates
 *
 * @param {string} userId - The unique user ID
 * @param {SyllabusSubject[]} syllabus - Array of syllabus subjects to save
 * @returns {Promise<void>} Promise that resolves when syllabus is saved
 *
 * @example
 * ```typescript
 * const syllabus = [
 *   { id: 'history', name: 'History', tier: 1, topics: [...] },
 *   { id: 'geography', name: 'Geography', tier: 2, topics: [...] }
 * ];
 * await saveSyllabus('user123', syllabus);
 * ```
 */
export const saveSyllabus = async (userId: string, syllabus: SyllabusSubject[]) => {
  return measurePerformance('saveSyllabus', async () => {
    logInfo('Saving syllabus', {
      userId,
      subjectCount: syllabus.length,
      subjectIds: syllabus.map(s => s.id),
      tierDistribution: {
        tier1: syllabus.filter(s => s.tier === 1).length,
        tier2: syllabus.filter(s => s.tier === 2).length,
        tier3: syllabus.filter(s => s.tier === 3).length,
      },
    });

    try {
      const batch = writeBatch(db);

      // Clear existing syllabus
      const syllabusRef = collection(db, 'users', userId, 'syllabus');
      const existingSyllabus = await getDocs(syllabusRef);

      logInfo('Clearing existing syllabus', {
        userId,
        existingSubjectCount: existingSyllabus.docs.length,
      });

      existingSyllabus.docs.forEach(doc => {
        batch.delete(doc.ref);
      });

      // Add new syllabus
      syllabus.forEach(subject => {
        const subjectRef = doc(db, 'users', userId, 'syllabus', subject.id);
        batch.set(subjectRef, subject);
      });

      await batch.commit();

      logInfo('Syllabus saved successfully', {
        userId,
        newSubjectCount: syllabus.length,
        totalTopics: syllabus.reduce((total, subject) => total + (subject.topics?.length ?? 0), 0),
      });
    } catch (error) {
      logError('Failed to save syllabus', {
        userId,
        subjectCount: syllabus.length,
        error: error instanceof Error ? error.message : 'Unknown error',
      });
      throw error;
    }
  });
};

/**
 * Retrieves the complete syllabus for a user
 *
 * @param {string} userId - The unique user ID
 * @returns {Promise<SyllabusSubject[]>} Promise that resolves to array of syllabus subjects
 *
 * @example
 * ```typescript
 * const syllabus = await getSyllabus('user123');
 * // console.log(`User has ${syllabus.length} subjects in their syllabus`);
 * ```
 */
export const getSyllabus = async (userId: string): Promise<SyllabusSubject[]> => {
  const syllabusRef = collection(db, 'users', userId, 'syllabus');
  const syllabusSnap = await getDocs(syllabusRef);

  return syllabusSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as SyllabusSubject[];
};

// Progress Tracking

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
export const updateTopicProgress = async (userId: string, topicId: string, updates: Partial<TopicProgress>) => {
  const progressRef = doc(db, 'users', userId, 'progress', topicId);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    await updateDoc(progressRef, updates);
  } else {
    // Create new progress entry
    await setDoc(progressRef, {
      id: topicId,
      topicId,
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
};

/**
 * Retrieves progress data for a specific topic
 *
 * @param {string} userId - The unique user ID
 * @param {string} topicId - The unique topic ID
 * @returns {Promise<TopicProgress | null>} Promise that resolves to progress data or null if not found
 *
 * @example
 * ```typescript
 * const progress = await getTopicProgress('user123', 'british_rule');
 * if (progress) {
 *   // console.log(`Mastery score: ${progress.masteryScore}%`);
 * }
 * ```
 */
export const getTopicProgress = async (userId: string, topicId: string): Promise<TopicProgress | null> => {
  const progressRef = doc(db, 'users', userId, 'progress', topicId);
  const progressSnap = await getDoc(progressRef);

  if (progressSnap.exists()) {
    return { id: progressSnap.id, ...progressSnap.data() } as TopicProgress;
  }
  return null;
};

/**
 * Retrieves all progress data for a user across all topics
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
export const getAllProgress = async (userId: string): Promise<TopicProgress[]> => {
  const progressRef = collection(db, 'users', userId, 'progress');
  const progressSnap = await getDocs(progressRef);

  return progressSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data(),
  })) as TopicProgress[];
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
export const getRevisionQueue = async (userId: string): Promise<RevisionItem[]> => {
  const progressRef = collection(db, 'users', userId, 'progress');
  const today = Timestamp.now();

  const revisionQuery = query(
    progressRef,
    where('nextRevision', '<=', today),
    orderBy('nextRevision', 'asc'),
    limit(20)
  );

  const revisionSnap = await getDocs(revisionQuery);
  const syllabus = await getSyllabus(userId);

  return revisionSnap.docs.map(doc => {
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
  const logRef = doc(db, 'users', userId, 'logs_daily', log.id);
  await setDoc(logRef, log);

  // Update user stats
  await updateUserStats(userId, log);
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
export const saveMockTest = async (userId: string, test: MockTestLog) => {
  const testRef = doc(db, 'users', userId, 'logs_mocks', test.id);
  await setDoc(testRef, test);

  // Update mastery scores based on test performance
  await updateMasteryScoresFromTest(userId, test);
};

/**
 * Retrieves recent mock test logs for a user
 * Returns tests in descending order by date (most recent first)
 *
 * @param {string} userId - The unique user ID
 * @param {number} limitCount - Maximum number of tests to retrieve (default: 10)
 * @returns {Promise<MockTestLog[]>} Promise that resolves to array of mock test logs
 *
 * @example
 * ```typescript
 * const recentTests = await getMockTests('user123', 5);
 * const averageScore = recentTests.reduce((sum, test) => {
 *   const totalScore = Object.values(test.scores).reduce((s, score) => s + score, 0);
 *   const maxScore = Object.values(test.maxScores).reduce((s, score) => s + score, 0);
 *   return sum + (totalScore / maxScore) * 100;
 * }, 0) / recentTests.length;
 * ```
 */
export const getMockTests = async (userId: string, limitCount = 10): Promise<MockTestLog[]> => {
  const testsRef = collection(db, 'users', userId, 'logs_mocks');
  const testsQuery = query(testsRef, orderBy('date', 'desc'), limit(limitCount));

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
export const generateStudyInsights = async (userId: string): Promise<StudyInsight[]> => {
  const insights: StudyInsight[] = [];

  // Get recent data
  const recentLogs = await getRecentDailyLogs(userId, 14);
  const recentTests = await getMockTests(userId, 5);
  const progress = await getAllProgress(userId);

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
  const user = await getUser(userId);
  if (!user) {
    return;
  }

  // Initialize stats if they don't exist
  const defaultStats = {
    totalStudyHours: 0,
    currentStreak: 0,
    longestStreak: 0,
    totalMockTests: 0,
    averageScore: 0,
    topicsCompleted: 0,
    totalTopics: 0,
  };

  const currentStats = user.stats ?? defaultStats;

  const totalMinutes = log.studiedTopics.reduce((sum, session) => sum + session.minutes, 0);
  const totalHours = currentStats.totalStudyHours + totalMinutes / 60;

  // Calculate streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayDateString = yesterday.toISOString().split('T')[0]!; // Safe since ISO string always has 'T'
  const yesterdayLog = await getDailyLog(userId, yesterdayDateString);

  let { currentStreak } = currentStats;
  if (totalMinutes > 0) {
    if (yesterdayLog && yesterdayLog.studiedTopics.length > 0) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
  } else {
    currentStreak = 0;
  }

  const longestStreak = Math.max(currentStats.longestStreak, currentStreak);

  await updateUser(userId, {
    stats: {
      ...currentStats,
      totalStudyHours: totalHours,
      currentStreak,
      longestStreak,
    },
  });
};

const updateMasteryScoresFromTest = async (userId: string, test: MockTestLog) => {
  // Update mastery scores based on topic-wise performance
  for (const topicPerf of test.topicWisePerformance) {
    const currentProgress = await getTopicProgress(userId, topicPerf.topicId);

    if (currentProgress) {
      // Calculate new mastery score based on accuracy
      const improvementFactor = topicPerf.accuracy > 0.8 ? 10 : topicPerf.accuracy > 0.6 ? 5 : -5;
      const newMasteryScore = Math.max(0, Math.min(100, currentProgress.masteryScore + improvementFactor));

      await updateTopicProgress(userId, topicPerf.topicId, {
        masteryScore: newMasteryScore,
        lastScoreImprovement: improvementFactor,
      });
    }
  }
};

// Real-time subscriptions
export const subscribeToRevisionQueue = (userId: string, callback: (items: RevisionItem[]) => void) => {
  const progressRef = collection(db, 'users', userId, 'progress');
  const today = Timestamp.now();

  const revisionQuery = query(
    progressRef,
    where('nextRevision', '<=', today),
    orderBy('nextRevision', 'asc'),
    limit(20)
  );

  return onSnapshot(revisionQuery, async snapshot => {
    const syllabus = await getSyllabus(userId);
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
  });
};

export const subscribeToUserStats = (userId: string, callback: (user: User) => void) => {
  const userRef = doc(db, 'users', userId);

  return onSnapshot(userRef, doc => {
    if (doc.exists()) {
      callback({ userId, ...doc.data() } as User);
    }
  });
};
