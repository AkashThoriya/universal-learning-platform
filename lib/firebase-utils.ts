import { 
  collection, 
  doc, 
  getDoc, 
  getDocs, 
  setDoc, 
  updateDoc, 
  deleteDoc, 
  query, 
  where, 
  orderBy, 
  limit, 
  Timestamp,
  writeBatch,
  onSnapshot,
  QuerySnapshot,
  DocumentData
} from 'firebase/firestore';
import { db } from './firebase';
import { 
  User, 
  SyllabusSubject, 
  TopicProgress, 
  DailyLog, 
  MockTestLog,
  RevisionItem,
  StudyInsight 
} from '@/types/exam';

// User Management
export const createUser = async (userId: string, userData: Partial<User>) => {
  const userRef = doc(db, 'users', userId);
  await setDoc(userRef, {
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
      totalTopics: 0
    }
  });
};

export const getUser = async (userId: string): Promise<User | null> => {
  const userRef = doc(db, 'users', userId);
  const userSnap = await getDoc(userRef);
  
  if (userSnap.exists()) {
    return { userId, ...userSnap.data() } as User;
  }
  return null;
};

export const updateUser = async (userId: string, updates: Partial<User>) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, updates);
};

// Syllabus Management
export const saveSyllabus = async (userId: string, syllabus: SyllabusSubject[]) => {
  const batch = writeBatch(db);
  
  // Clear existing syllabus
  const syllabusRef = collection(db, 'users', userId, 'syllabus');
  const existingSyllabus = await getDocs(syllabusRef);
  existingSyllabus.docs.forEach(doc => {
    batch.delete(doc.ref);
  });
  
  // Add new syllabus
  syllabus.forEach(subject => {
    const subjectRef = doc(db, 'users', userId, 'syllabus', subject.id);
    batch.set(subjectRef, subject);
  });
  
  await batch.commit();
};

export const getSyllabus = async (userId: string): Promise<SyllabusSubject[]> => {
  const syllabusRef = collection(db, 'users', userId, 'syllabus');
  const syllabusSnap = await getDocs(syllabusRef);
  
  return syllabusSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as SyllabusSubject[];
};

// Progress Tracking
export const updateTopicProgress = async (
  userId: string, 
  topicId: string, 
  updates: Partial<TopicProgress>
) => {
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
      ...updates
    });
  }
};

export const getTopicProgress = async (userId: string, topicId: string): Promise<TopicProgress | null> => {
  const progressRef = doc(db, 'users', userId, 'progress', topicId);
  const progressSnap = await getDoc(progressRef);
  
  if (progressSnap.exists()) {
    return { id: progressSnap.id, ...progressSnap.data() } as TopicProgress;
  }
  return null;
};

export const getAllProgress = async (userId: string): Promise<TopicProgress[]> => {
  const progressRef = collection(db, 'users', userId, 'progress');
  const progressSnap = await getDocs(progressRef);
  
  return progressSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as TopicProgress[];
};

// Revision Queue
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
    if (daysSinceLastRevision > 1) priority = 'overdue';
    else if (daysSinceLastRevision === 1) priority = 'due_today';
    else priority = 'due_soon';
    
    return {
      topicId: progress.topicId,
      topicName: topic?.name || 'Unknown Topic',
      subjectName: subject?.name || 'Unknown Subject',
      tier: subject?.tier || 3,
      masteryScore: progress.masteryScore,
      daysSinceLastRevision,
      priority,
      estimatedTime: topic?.estimatedHours ? topic.estimatedHours * 60 : 30,
      lastRevised: progress.lastRevised,
      nextRevision: progress.nextRevision
    } as RevisionItem;
  });
};

// Daily Logging
export const saveDailyLog = async (userId: string, log: DailyLog) => {
  const logRef = doc(db, 'users', userId, 'logs_daily', log.id);
  await setDoc(logRef, log);
  
  // Update user stats
  await updateUserStats(userId, log);
};

export const getDailyLog = async (userId: string, date: string): Promise<DailyLog | null> => {
  const logRef = doc(db, 'users', userId, 'logs_daily', date);
  const logSnap = await getDoc(logRef);
  
  if (logSnap.exists()) {
    return { id: logSnap.id, ...logSnap.data() } as DailyLog;
  }
  return null;
};

export const getRecentDailyLogs = async (userId: string, days: number = 30): Promise<DailyLog[]> => {
  const logsRef = collection(db, 'users', userId, 'logs_daily');
  const logsQuery = query(
    logsRef,
    orderBy('date', 'desc'),
    limit(days)
  );
  
  const logsSnap = await getDocs(logsQuery);
  return logsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as DailyLog[];
};

// Mock Test Logging
export const saveMockTest = async (userId: string, test: MockTestLog) => {
  const testRef = doc(db, 'users', userId, 'logs_mocks', test.id);
  await setDoc(testRef, test);
  
  // Update mastery scores based on test performance
  await updateMasteryScoresFromTest(userId, test);
};

export const getMockTests = async (userId: string, limitCount: number = 10): Promise<MockTestLog[]> => {
  const testsRef = collection(db, 'users', userId, 'logs_mocks');
  const testsQuery = query(
    testsRef,
    orderBy('date', 'desc'),
    limit(limitCount)
  );
  
  const testsSnap = await getDocs(testsQuery);
  return testsSnap.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  })) as MockTestLog[];
};

// Analytics and Insights
export const generateStudyInsights = async (userId: string): Promise<StudyInsight[]> => {
  const insights: StudyInsight[] = [];
  
  // Get recent data
  const recentLogs = await getRecentDailyLogs(userId, 14);
  const recentTests = await getMockTests(userId, 5);
  const progress = await getAllProgress(userId);
  
  // Health-Performance Correlation
  if (recentLogs.length >= 7 && recentTests.length >= 2) {
    const avgEnergy = recentLogs.reduce((sum, log) => sum + log.health.energy, 0) / recentLogs.length;
    const avgScore = recentTests.reduce((sum, test) => {
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
          'Include physical exercise in your routine'
        ],
        priority: 'high',
        category: 'health'
      });
    }
  }
  
  // Consistency Check
  const studyDays = recentLogs.filter(log => log.studiedTopics.length > 0).length;
  if (studyDays < recentLogs.length * 0.7) {
    insights.push({
      type: 'warning',
      title: 'Inconsistent Study Pattern',
      description: `You've studied on only ${studyDays} out of ${recentLogs.length} days. Consistency is key for retention.`,
      actionItems: [
        'Set a minimum daily study goal',
        'Use study reminders',
        'Plan buffer days for flexibility'
      ],
      priority: 'high',
      category: 'strategy'
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
      data: { weakTopics }
    });
  }
  
  return insights;
};

// Helper Functions
const updateUserStats = async (userId: string, log: DailyLog) => {
  const user = await getUser(userId);
  if (!user) return;
  
  const totalMinutes = log.studiedTopics.reduce((sum, session) => sum + session.minutes, 0);
  const totalHours = user.stats.totalStudyHours + (totalMinutes / 60);
  
  // Calculate streak
  const yesterday = new Date();
  yesterday.setDate(yesterday.getDate() - 1);
  const yesterdayLog = await getDailyLog(userId, yesterday.toISOString().split('T')[0]);
  
  let currentStreak = user.stats.currentStreak;
  if (totalMinutes > 0) {
    if (yesterdayLog && yesterdayLog.studiedTopics.length > 0) {
      currentStreak += 1;
    } else {
      currentStreak = 1;
    }
  } else {
    currentStreak = 0;
  }
  
  const longestStreak = Math.max(user.stats.longestStreak, currentStreak);
  
  await updateUser(userId, {
    stats: {
      ...user.stats,
      totalStudyHours: totalHours,
      currentStreak,
      longestStreak
    }
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
        lastScoreImprovement: improvementFactor
      });
    }
  }
};

// Real-time subscriptions
export const subscribeToRevisionQueue = (
  userId: string, 
  callback: (items: RevisionItem[]) => void
) => {
  const progressRef = collection(db, 'users', userId, 'progress');
  const today = Timestamp.now();
  
  const revisionQuery = query(
    progressRef,
    where('nextRevision', '<=', today),
    orderBy('nextRevision', 'asc'),
    limit(20)
  );
  
  return onSnapshot(revisionQuery, async (snapshot) => {
    const syllabus = await getSyllabus(userId);
    const items = snapshot.docs.map(doc => {
      const progress = doc.data() as TopicProgress;
      const subject = syllabus.find(s => s.topics.some(t => t.id === progress.topicId));
      const topic = subject?.topics.find(t => t.id === progress.topicId);
      
      const daysSinceLastRevision = Math.floor(
        (today.toMillis() - progress.lastRevised.toMillis()) / (1000 * 60 * 60 * 24)
      );
      
      let priority: 'overdue' | 'due_today' | 'due_soon' | 'scheduled' = 'scheduled';
      if (daysSinceLastRevision > 1) priority = 'overdue';
      else if (daysSinceLastRevision === 1) priority = 'due_today';
      else priority = 'due_soon';
      
      return {
        topicId: progress.topicId,
        topicName: topic?.name || 'Unknown Topic',
        subjectName: subject?.name || 'Unknown Subject',
        tier: subject?.tier || 3,
        masteryScore: progress.masteryScore,
        daysSinceLastRevision,
        priority,
        estimatedTime: topic?.estimatedHours ? topic.estimatedHours * 60 : 30,
        lastRevised: progress.lastRevised,
        nextRevision: progress.nextRevision
      } as RevisionItem;
    });
    
    callback(items);
  });
};

export const subscribeToUserStats = (
  userId: string,
  callback: (user: User) => void
) => {
  const userRef = doc(db, 'users', userId);
  
  return onSnapshot(userRef, (doc) => {
    if (doc.exists()) {
      callback({ userId, ...doc.data() } as User);
    }
  });
};