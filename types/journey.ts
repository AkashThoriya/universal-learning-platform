/**
 * @fileoverview Journey Planning System Types
 * Integrates with existing Mission System and Progress Service
 */

// Unused import: import { Exam } from './exam';
import { LearningTrack, MissionDifficulty } from './mission-system';

export interface UserJourney {
  id: string;
  userId: string;
  title: string;
  description: string;
  examId?: string; // Links to existing exam from exams-data.ts
  customGoals: JourneyGoal[];
  targetCompletionDate: Date;
  priority: 'low' | 'medium' | 'high' | 'critical';
  status: 'planning' | 'active' | 'completed' | 'paused' | 'cancelled';
  track: LearningTrack;

  // Integration with existing systems
  linkedMissionTemplates: string[]; // Mission template IDs
  progressTracking: JourneyProgressTracking;

  // Metadata
  createdAt: Date;
  updatedAt: Date;
  createdFrom: 'onboarding' | 'manual' | 'recommendation';
}

export interface JourneyGoal {
  id: string;
  title: string;
  description: string;
  targetValue: number;
  currentValue: number;
  unit: 'percentage' | 'hours' | 'topics' | 'tests' | 'projects';
  category: 'knowledge' | 'skill' | 'speed' | 'accuracy' | 'consistency';

  // SMART goal attributes
  isSpecific: boolean;
  isMeasurable: boolean;
  isAchievable: boolean;
  isRelevant: boolean;
  isTimeBound: boolean;
  deadline: Date;

  // Integration points
  linkedSubjects: string[]; // Subject IDs from exam data
  linkedTopics: string[]; // Topic IDs from exam data
  autoUpdateFrom: 'missions' | 'tests' | 'manual' | 'mixed';
}

export interface JourneyProgressTracking {
  overallCompletion: number; // 0-100
  goalCompletions: Record<string, number>; // goalId -> completion %
  weeklyProgress: WeeklyProgress[];
  milestoneAchievements: MilestoneAchievement[];

  // Integration with existing progress service
  linkedUnifiedProgress: string; // UnifiedProgress ID
  lastSyncedAt: Date;
  autoSyncEnabled: boolean;
}

export interface WeeklyProgress {
  weekStarting: Date;
  hoursStudied: number;
  missionsCompleted: number;
  testsCompleted: number;
  averageScore: number;
  goalsAdvanced: string[]; // Goal IDs that progressed
}

export interface MilestoneAchievement {
  id: string;
  title: string;
  description: string;
  achievedAt: Date;
  relatedGoals: string[];
  celebrationMessage: string;
}

// Request/Response types for API
export interface CreateJourneyRequest {
  title: string;
  description: string;
  examId?: string;
  customGoals: Omit<JourneyGoal, 'id' | 'currentValue'>[];
  targetCompletionDate: Date;
  priority: UserJourney['priority'];
  track: LearningTrack;
}

export interface UpdateJourneyProgressRequest {
  journeyId: string;
  goalUpdates: Array<{
    goalId: string;
    newValue: number;
    source: 'mission' | 'test' | 'manual';
  }>;
  weeklyUpdate?: Partial<WeeklyProgress>;
}

export interface JourneyAnalytics {
  journeyId: string;
  completionRate: number;
  averageWeeklyHours: number;
  goalCompletionVelocity: number; // goals per week
  predictedCompletionDate: Date;
  riskFactors: string[];
  recommendations: string[];
  comparisonWithSimilarUsers: {
    percentile: number;
    averageCompletionTime: number;
  };
}

// Additional types for collaboration features
export interface JourneyCollaborator {
  id: string;
  userId: string;
  name: string;
  email: string;
  avatar?: string;
  role: 'owner' | 'mentor' | 'peer' | 'viewer';
  joinedAt: Date;
  lastActive: Date;
  permissions: JourneyPermissions;
}

export interface JourneyPermissions {
  canView: boolean;
  canComment: boolean;
  canEditGoals: boolean;
  canInviteOthers: boolean;
  canManageCollaborators: boolean;
}

export interface JourneyComment {
  id: string;
  userId: string;
  userName: string;
  userAvatar?: string;
  content: string;
  type: 'comment' | 'suggestion' | 'encouragement' | 'milestone';
  createdAt: Date;
  updatedAt: Date;
  likes: string[]; // User IDs who liked
  replies: JourneyComment[];
  relatedGoalId?: string;
  isEdited: boolean;
}

export interface JourneyInvitation {
  id: string;
  journeyId: string;
  inviterUserId: string;
  inviterName: string;
  inviteeEmail: string;
  role: JourneyCollaborator['role'];
  message: string;
  status: 'pending' | 'accepted' | 'declined' | 'expired';
  createdAt: Date;
  expiresAt: Date;
}

// Journey template types
export interface JourneyTemplate {
  id: string;
  title: string;
  description: string;
  category: 'exam_prep' | 'skill_building' | 'course_completion' | 'certification';
  defaultDuration: number; // days
  estimatedHours: number;
  difficultyLevel: MissionDifficulty;
  prerequisites: string[];
  goalTemplates: JourneyGoalTemplate[];
  popularityScore: number;
  successRate: number;
  createdBy: 'system' | 'community';
  tags: string[];
}

export interface JourneyGoalTemplate {
  title: string;
  description: string;
  targetValue: number;
  unit: JourneyGoal['unit'];
  category: JourneyGoal['category'];
  estimatedTimeToComplete: number; // days
  difficulty: MissionDifficulty;
  dependencies: string[]; // Other goal template IDs
}

// Smart suggestions and recommendations
export interface JourneyRecommendation {
  id: string;
  type: 'goal_adjustment' | 'schedule_change' | 'difficulty_change' | 'collaboration' | 'resource';
  title: string;
  description: string;
  reasoning: string;
  confidence: number; // 0-1
  priority: 'low' | 'medium' | 'high' | 'critical';
  actionable: boolean;
  estimatedImpact: {
    timeImprovement?: number; // days saved
    successProbability?: number; // 0-1
    difficultyReduction?: number; // 0-1
  };
  suggestedActions: string[];
  implementationComplexity: 'easy' | 'medium' | 'hard';
}

// Journey sharing and export
export interface JourneyExportData {
  journey: UserJourney;
  goals: JourneyGoal[];
  progressHistory: WeeklyProgress[];
  achievements: MilestoneAchievement[];
  analytics: JourneyAnalytics;
  collaborators: JourneyCollaborator[];
  comments: JourneyComment[];
  exportedAt: Date;
  exportedBy: string;
  version: string;
}

// Journey notification preferences
export interface JourneyNotificationSettings {
  userId: string;
  journeyId: string;
  preferences: {
    goalDeadlineReminders: boolean;
    weeklyProgressSummary: boolean;
    milestoneAchievements: boolean;
    collaboratorActivity: boolean;
    recommendationAlerts: boolean;
    motivationalMessages: boolean;
  };
  reminderTiming: {
    dailyReminder?: string; // HH:MM format
    weeklyDigest?: 'monday' | 'sunday';
    goalDeadlineAdvance?: number; // days before deadline
  };
}
