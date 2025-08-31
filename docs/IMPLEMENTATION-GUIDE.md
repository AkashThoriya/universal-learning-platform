# 🛠️ IMPLEMENTATION GUIDE: Dual-Track Learning System

_Step-by-Step Technical Implementation Instructions_

## 🎯 **How to Use This Guide**

**This is your implementation bible.** Follow these exact steps to build the unified persona-aware system with dual learning tracks. Each section contains:

- ✅ **Prerequisites**: What must be done before starting
- 🏗️ **Implementation Steps**: Exact code and file changes
- 🔥 **Firebase Integration**: MANDATORY Firestore integration for ALL features
- 🧪 **Testing**: How to verify it works
- 📝 **Documentation**: What to document

## 🔥 **CRITICAL: Firebase-First Development**

**⚠️ MANDATORY REQUIREMENT**: From this point forward, ALL features MUST be built with Firebase Firestore integration from day one. No mock data, no temporary storage, no "we'll add Firebase later" approach.

### **Required Firebase Integration Checklist** ✅

- [ ] Use enhanced Firebase service layer from `lib/firebase-enhanced.ts`
- [ ] All data operations through Firestore collections
- [ ] Real-time data sync with `onSnapshot` for live updates
- [ ] Proper error handling with user-friendly messages
- [ ] Loading states during Firebase operations
- [ ] Offline support where applicable
- [ ] Type-safe Firebase operations with proper interfaces

---

## 📋 **Current Implementation Status**

### ✅ **COMPLETED (Phase 0)**

- **Persona Detection System** ✅
  - File: `/components/onboarding/PersonaDetection.tsx` (773 lines)
  - Features: 3-persona detection, work schedule input, real-time recommendations
- **Goal Setting Engine** ✅
  - File: `/lib/persona-aware-goals.ts` (200+ lines)
  - Features: Persona-aware goal calculation, availability analysis
- **Enhanced Onboarding** ✅
  - File: `/app/onboarding/enhanced-page/page.tsx`
  - Features: 5-step flow with persona integration

- **Type Definitions** ✅
  - File: `/types/exam.ts`
  - Features: Extended UserPersona, WorkSchedule, CareerContext interfaces

### ✅ **COMPLETED (Week 2-3: Dual-Track Micro-Learning System)**

- **Micro-Learning Types** ✅
  - File: `/types/micro-learning.ts`
  - Features: Complete type definitions for dual-track learning sessions

- **Firebase-Integrated Service** ✅
  - File: `/lib/micro-learning-service.ts`
  - Features: Session generation, progress tracking, completion handling with Firestore

- **Micro-Learning Components** ✅
  - Files: `/components/micro-learning/MicroLearningSession.tsx`, `MicroLearningDashboard.tsx`, `QuickSessionLauncher.tsx`, `SessionSummary.tsx`
  - Features: Complete UI with Firebase integration, error handling, loading states

- **Dashboard Integration** ✅
  - File: `/app/dashboard/page.tsx`
  - Features: Quick session launcher integrated into main dashboard

### ✅ **COMPLETED (Week 4-5: Adaptive Mission System)**

- **Mission System Core** ✅
  - File: `/lib/dual-persona-mission-engine.ts` (650+ lines)
  - Features: Dual-persona mission generation with Firebase integration

- **Mission Components** ✅
  - Files: `/components/missions/MissionDashboard.tsx`, `MissionExecution.tsx`, `AchievementSystem.tsx`, `ProgressVisualization.tsx`
  - Features: Complete mission UI with real-time Firebase sync

- **Mission Integration** ✅
  - File: `/app/missions/page.tsx`
  - Features: Full mission interface with navigation and state management

### ✅ **COMPLETED (Enterprise-Grade Infrastructure)**

- **Enhanced Firebase Service Layer** ✅
  - File: `/lib/firebase-enhanced.ts` (993 lines)
  - Features: RetryService, enhanced error handling, caching, performance monitoring

- **Global Error Boundaries** ✅
  - File: `/components/error-handling/GlobalErrorBoundary.tsx`
  - Features: Automatic error recovery, comprehensive error reporting

- **Input Validation & Security** ✅
  - File: `/lib/validation-utils.ts`
  - Features: XSS prevention, input sanitization, file upload validation

- **Accessibility Utilities** ✅
  - File: `/lib/accessibility-utils.tsx`
  - Features: WCAG compliance, screen reader support, keyboard navigation

- **Performance Optimization** ✅
  - File: `/components/ui/loading-states.tsx`
  - Features: Skeleton screens, progressive loading, error displays

- **Enhanced Layout & SEO** ✅
  - File: `/app/layout.tsx`
  - Features: Comprehensive SEO metadata, accessibility integration, error boundary

---

## 🎯 **NEXT IMPLEMENTATION: Week 6-7 Intelligent Analytics**

### **🎯 Objective**

Build comprehensive analytics system that provides insights across both learning tracks:

- **📚 Exam Analytics**: Mock test performance, weak areas, revision effectiveness
- **💻 Course/Tech Analytics**: Project completion rates, skill mastery, application success
- **Cross-Track Insights**: How exam preparation skills help with course learning and vice versa
- **Adaptive Recommendations**: AI-driven suggestions using Gemini API integration

### **📋 Prerequisites**

- ✅ Dual-track micro-learning system working
- ✅ Adaptive mission system implemented
- ✅ Firebase enhanced service layer available
- ✅ Enterprise-grade infrastructure in place
- ✅ User data collection mechanisms active

### **�️ Step 1: Create Analytics Types and Data Model**

**File**: `/types/analytics.ts`

```typescript
export interface AnalyticsEngine {
  examAnalytics: ExamAnalytics;
  courseAnalytics: CourseAnalytics;
  crossTrackInsights: CrossTrackInsights;
  adaptiveRecommendations: AdaptiveRecommendations;
}

export interface ExamAnalytics {
  mockTestPerformance: MockTestAnalytics[];
  weakAreas: WeakAreaAnalysis[];
  revisionEffectiveness: RevisionAnalytics;
  examReadiness: ExamReadinessScore;
  trendAnalysis: PerformanceTrend[];
}

export interface CourseAnalytics {
  projectCompletionRates: ProjectAnalytics[];
  skillMastery: SkillMasteryAnalysis[];
  applicationSuccess: ApplicationSuccessMetrics;
  learningVelocity: LearningVelocityMetrics;
  portfolioQuality: PortfolioQualityScore;
}

export interface CrossTrackInsights {
  skillTransferAnalysis: SkillTransferMetrics;
  learningPatternCorrelations: LearningCorrelation[];
  adaptabilityScore: AdaptabilityMetrics;
  holisticProgress: HolisticProgressView;
}

export interface AdaptiveRecommendations {
  nextBestActions: RecommendedAction[];
  learningPathOptimizations: PathOptimization[];
  timeAllocationSuggestions: TimeAllocationAdvice[];
  difficultyAdjustments: DifficultyRecommendation[];
}
```

### **🏗️ Step 2: Implement Analytics Service with Gemini AI**

**File**: `/lib/analytics-service.ts`

```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
import { AnalyticsEngine, ExamAnalytics, CourseAnalytics } from '@/types/analytics';
import { analyticsFirebaseService } from '@/lib/firebase-enhanced';

export class IntelligentAnalyticsService {
  private static genAI = new GoogleGenerativeAI(process.env.NEXT_PUBLIC_GEMINI_API_KEY!);

  /**
   * Generate comprehensive analytics for a user with AI insights
   */
  static async generateAnalytics(userId: string): Promise<Result<AnalyticsEngine>> {
    try {
      // Fetch raw data from Firebase
      const [examData, courseData, userProgress] = await Promise.all([
        this.getExamData(userId),
        this.getCourseData(userId),
        this.getUserProgress(userId),
      ]);

      // Process analytics
      const examAnalytics = await this.processExamAnalytics(examData);
      const courseAnalytics = await this.processCourseAnalytics(courseData);
      const crossTrackInsights = await this.generateCrossTrackInsights(examData, courseData);
      const adaptiveRecommendations = await this.generateAIRecommendations(
        examAnalytics,
        courseAnalytics,
        crossTrackInsights,
        userProgress
      );

      const analytics: AnalyticsEngine = {
        examAnalytics,
        courseAnalytics,
        crossTrackInsights,
        adaptiveRecommendations,
      };

      // Save analytics to Firebase
      await analyticsFirebaseService.saveAnalytics(userId, analytics);

      return createSuccess(analytics);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Analytics generation failed'));
    }
  }

  /**
   * Generate AI-powered recommendations using Gemini
   */
  private static async generateAIRecommendations(
    examAnalytics: ExamAnalytics,
    courseAnalytics: CourseAnalytics,
    crossTrackInsights: CrossTrackInsights,
    userProgress: any
  ): Promise<AdaptiveRecommendations> {
    try {
      const model = this.genAI.getGenerativeModel({ model: 'gemini-pro' });

      const prompt = `
Analyze this learner's data and provide adaptive recommendations:

EXAM PERFORMANCE:
- Mock test scores: ${JSON.stringify(examAnalytics.mockTestPerformance)}
- Weak areas: ${JSON.stringify(examAnalytics.weakAreas)}
- Revision effectiveness: ${JSON.stringify(examAnalytics.revisionEffectiveness)}

COURSE/TECH PERFORMANCE:
- Project completion: ${JSON.stringify(courseAnalytics.projectCompletionRates)}
- Skill mastery: ${JSON.stringify(courseAnalytics.skillMastery)}
- Learning velocity: ${JSON.stringify(courseAnalytics.learningVelocity)}

CROSS-TRACK INSIGHTS:
- Skill transfer patterns: ${JSON.stringify(crossTrackInsights.skillTransferAnalysis)}
- Learning correlations: ${JSON.stringify(crossTrackInsights.learningPatternCorrelations)}

Please provide:
1. Top 3 next best actions for this learner
2. Learning path optimizations for both exam and course tracks
3. Time allocation suggestions based on their patterns
4. Difficulty adjustments needed

Format as JSON with specific, actionable recommendations.
      `;

      const result = await model.generateContent(prompt);
      const response = await result.response;
      const recommendations = JSON.parse(response.text());

      return recommendations;
    } catch (error) {
      console.error('AI recommendation generation failed:', error);
      return this.getFallbackRecommendations(examAnalytics, courseAnalytics);
    }
  }

  // Implementation methods...
}
```

### **🏗️ Step 3: Create Analytics Dashboard Component**

**File**: `/components/analytics/AnalyticsDashboard.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { IntelligentAnalyticsService } from '@/lib/analytics-service';
import { AnalyticsEngine } from '@/types/analytics';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { LineChart, Line, AreaChart, Area, BarChart, Bar, PieChart, Pie } from 'recharts';
import { TrendingUp, Brain, Target, Zap } from 'lucide-react';

interface AnalyticsDashboardProps {
  userId: string;
}

export function AnalyticsDashboard({ userId }: AnalyticsDashboardProps) {
  const [analytics, setAnalytics] = useState<AnalyticsEngine | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    loadAnalytics();
  }, [userId]);

  const loadAnalytics = async () => {
    try {
      setLoading(true);
      const result = await IntelligentAnalyticsService.generateAnalytics(userId);

      if (result.success) {
        setAnalytics(result.data);
      } else {
        setError(result.error?.message || 'Failed to load analytics');
      }
    } catch (error) {
      setError('Failed to load analytics');
    } finally {
      setLoading(false);
    }
  };

  // Component implementation with comprehensive analytics visualization
  return (
    <div className="space-y-6">
      {/* Analytics cards and charts */}
    </div>
  );
}
```

### **🧪 Testing Steps for Analytics**

1. **Test Analytics Generation**:

   ```typescript
   const result = await IntelligentAnalyticsService.generateAnalytics('user_id');
   console.log('Analytics:', result);
   ```

2. **Test AI Recommendations**:
   - Verify Gemini API integration
   - Check recommendation quality and relevance
   - Test fallback mechanisms

3. **Test Real-time Updates**:
   - Verify analytics update when new data comes in
   - Check Firebase real-time sync

### **🔥 Firebase Integration for Analytics**

- Store analytics in `users/{userId}/analytics/{date}`
- Real-time dashboard updates with `onSnapshot`
- Historical analytics tracking
- Performance optimization with caching

---

## 📋 **Next Implementation: Week 8-9 Smart Pattern Recognition**

After completing analytics, implement:

1. **Learning Pattern Detection** - Identify optimal study methods per persona
2. **Validation Systems** - Exam vs Course validation pipelines
3. **Adaptive Algorithms** - System learns and improves recommendations
4. **Predictive Analytics** - Anticipate learner needs and outcomes

### **🏗️ Step 1: Create Dual-Track Micro-Learning Types**

**File**: `/types/micro-learning.ts`

```typescript
export interface MicroLearningSession {
  id: string;
  userId: string;
  learningTrack: 'exam' | 'course_tech';
  subjectId: string;
  topicId: string;
  sessionType: 'concept' | 'practice' | 'review' | 'assessment' | 'project' | 'assignment';
  duration: number; // minutes
  difficulty: 'easy' | 'medium' | 'hard';
  personaOptimizations: PersonaOptimizations;
  content: MicroContent[];
  validationMethod: ExamValidation | CourseValidation;
  createdAt: Date;
  completedAt?: Date;
  performance?: SessionPerformance;
}

export interface ExamValidation {
  type: 'exam';
  mockTestQuestions: number;
  revisionTopics: string[];
  practiceScore?: number;
  targetExam: string;
}

export interface CourseValidation {
  type: 'course_tech';
  assignmentTasks: AssignmentTask[];
  projectComponents: ProjectComponent[];
  skillsToValidate: string[];
  completionCriteria: CompletionCriteria;
}

export interface AssignmentTask {
  id: string;
  title: string;
  description: string;
  estimatedTime: number; // minutes
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  skillsRequired: string[];
}

export interface ProjectComponent {
  id: string;
  componentType: 'frontend' | 'backend' | 'database' | 'deployment' | 'testing';
  title: string;
  requirements: string[];
  estimatedHours: number;
}

export interface CompletionCriteria {
  minimumScore: number;
  requiredTasks: string[];
  portfolioSubmission: boolean;
  peerReview: boolean;
}

export interface PersonaOptimizations {
  sessionLength: number; // adapted based on persona
  breakReminders: boolean; // for working professionals
  contextSwitching: boolean; // for professionals with interruptions
  motivationalFraming: 'academic' | 'career' | 'personal' | 'skill_building';
  complexityRamp: 'gentle' | 'standard' | 'accelerated';
  learningTrackPreference: 'exam' | 'course_tech' | 'mixed';
}

export interface MicroContent {
  id: string;
  type: 'concept' | 'example' | 'practice' | 'quiz' | 'code_snippet' | 'hands_on';
  content: string;
  estimatedTime: number; // seconds
  learningTrack: 'exam' | 'course_tech';
  personaAdaptations: {
    student?: ContentAdaptation;
    working_professional?: ContentAdaptation;
    freelancer?: ContentAdaptation;
  };
}

export interface ContentAdaptation {
  examples: string[]; // persona-specific examples
  motivation: string; // persona-specific motivation
  applicationContext: string; // how this applies to their life/work
  validationMethod: 'quiz' | 'practice' | 'project' | 'assignment';
}

export interface SessionPerformance {
  accuracy: number;
  timeSpent: number;
  engagementScore: number;
  conceptsLearned: string[];
  skillsDeveloped: string[];
  areasForImprovement: string[];
  trackSpecificMetrics: ExamTrackMetrics | CourseTrackMetrics;
}

export interface ExamTrackMetrics {
  mockTestScore: number;
  revisionEffectiveness: number;
  examReadinessScore: number;
  weakTopics: string[];
}

export interface CourseTrackMetrics {
  assignmentCompletionRate: number;
  projectProgressPercentage: number;
  skillMasteryLevel: Record<string, number>;
  portfolioQuality: number;
}
```

### **🏗️ Step 2: Create Firebase-Integrated Micro-Learning Service**

**File**: `/lib/micro-learning-service.ts`

```typescript
import { UserPersona, MicroLearningSession, PersonaOptimizations } from '@/types';
import { microLearningFirebaseService } from '@/lib/firebase-enhanced';
import { Result, createSuccess, createError } from '@/lib/types-utils';

export class MicroLearningService {
  /**
   * Generate and SAVE a personalized micro-learning session to Firestore
   */
  static async generateSession(
    userId: string,
    subjectId: string,
    topicId: string,
    requestedDuration?: number
  ): Promise<Result<MicroLearningSession>> {
    try {
      const persona = await getUserPersona(userId);
      const optimizations = this.calculatePersonaOptimizations(persona, requestedDuration);

      const baseContent = await this.getTopicContent(topicId);
      const adaptedContent = this.adaptContentForPersona(baseContent, persona);

      const session: MicroLearningSession = {
        id: this.generateSessionId(),
        userId,
        subjectId,
        topicId,
        sessionType: this.selectOptimalSessionType(persona, topicId),
        duration: optimizations.sessionLength,
        difficulty: await this.calculateOptimalDifficulty(userId, topicId),
        personaOptimizations: optimizations,
        content: adaptedContent,
        createdAt: new Date(),
      };

      // 🔥 SAVE TO FIRESTORE IMMEDIATELY
      const saveResult = await microLearningFirebaseService.saveSession(userId, session);

      if (!saveResult.success) {
        return createError(saveResult.error || new Error('Failed to save session'));
      }

      return createSuccess(session);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to generate session'));
    }
  }

  /**
   * Get user's session history from Firestore
   */
  static async getSessionHistory(userId: string, limit: number = 20): Promise<Result<MicroLearningSession[]>> {
    return microLearningFirebaseService.getSessionHistory(userId, limit);
  }

  /**
   * Update session progress in Firestore
   */
  static async updateSessionProgress(
    userId: string,
    sessionId: string,
    progress: any
  ): Promise<Result<void>> {
    return microLearningFirebaseService.updateSessionProgress(userId, sessionId, progress);
  }

  /**
   * Save session completion data to Firestore
   */
  static async completeSession(
    userId: string,
    sessionId: string,
    performance: SessionPerformance
  ): Promise<Result<void>> {
    try {
      // Update session with completion data
      const updateResult = await microLearningFirebaseService.updateSessionProgress(userId, sessionId, {
        completedAt: new Date(),
        performance
      });

      if (!updateResult.success) {
        return updateResult;
      }

      // Generate and save recommendations based on performance
      const recommendations = await this.generateRecommendations(userId, performance);
      await microLearningFirebaseService.saveRecommendations(userId, recommendations);

      return createSuccess(undefined);
    } catch (error) {
      return createError(error instanceof Error ? error : new Error('Failed to complete session'));
    }
  }

  /**
   * Get personalized recommendations from Firestore
   */
  static async getRecommendations(userId: string): Promise<Result<any[]>> {
    return microLearningFirebaseService.getRecommendations(userId);
  }

  // ... rest of the methods remain the same but with Firebase integration
}

  /**
   * Calculate persona-specific optimizations
   */
  private static calculatePersonaOptimizations(
    persona: UserPersona,
    requestedDuration?: number
  ): PersonaOptimizations {
    switch (persona.type) {
      case 'student':
        return {
          sessionLength: requestedDuration || 15, // Students can do longer sessions
          breakReminders: false,
          contextSwitching: false,
          motivationalFraming: 'academic',
          complexityRamp: 'standard',
        };

      case 'working_professional':
        const workSchedule = persona.workSchedule;
        const hasLimitedTime = workSchedule?.hoursPerWeek > 40;

        return {
          sessionLength: requestedDuration || (hasLimitedTime ? 7 : 12),
          breakReminders: true,
          contextSwitching: true, // Expect interruptions
          motivationalFraming: 'career',
          complexityRamp: hasLimitedTime ? 'accelerated' : 'standard',
        };

      case 'freelancer':
        return {
          sessionLength: requestedDuration || 10,
          breakReminders: true,
          contextSwitching: true,
          motivationalFraming: 'personal',
          complexityRamp: 'accelerated',
        };

      default:
        return {
          sessionLength: 10,
          breakReminders: false,
          contextSwitching: false,
          motivationalFraming: 'personal',
          complexityRamp: 'standard',
        };
    }
  }

  /**
   * Adapt content based on persona
   */
  private static adaptContentForPersona(
    baseContent: any[],
    persona: UserPersona
  ): MicroContent[] {
    return baseContent.map(content => ({
      ...content,
      personaAdaptations: this.generatePersonaAdaptations(content, persona),
    }));
  }

  /**
   * Generate persona-specific content adaptations
   */
  private static generatePersonaAdaptations(content: any, persona: UserPersona) {
    const adaptations: any = {};

    // Student adaptations - academic focus
    adaptations.student = {
      examples: this.generateAcademicExamples(content.topic),
      motivation: `Master this concept for exam success!`,
      applicationContext: `This appears frequently in ${content.examType} exams`,
    };

    // Professional adaptations - career focus
    adaptations.working_professional = {
      examples: this.generateProfessionalExamples(content.topic, persona.careerContext),
      motivation: `Advance your career with this knowledge!`,
      applicationContext: `This skill directly applies to ${persona.careerContext?.targetRole || 'your work'}`,
    };

    // Freelancer adaptations - business focus
    adaptations.freelancer = {
      examples: this.generateFreelancerExamples(content.topic),
      motivation: `Expand your service offerings!`,
      applicationContext: `This knowledge can help you charge premium rates`,
    };

    return adaptations;
  }

  /**
   * Smart session scheduling based on persona
   */
  static async suggestOptimalSessionTime(userId: string): Promise<Date[]> {
    const persona = await getUserPersona(userId);
    const now = new Date();
    const suggestions: Date[] = [];

    switch (persona.type) {
      case 'student':
        // Students: suggest morning and evening slots
        suggestions.push(
          new Date(now.getTime() + 2 * 60 * 60 * 1000), // 2 hours from now
          this.getNextDayTime(8, 0), // 8 AM tomorrow
          this.getNextDayTime(19, 0), // 7 PM tomorrow
        );
        break;

      case 'working_professional':
        const workSchedule = persona.workSchedule;
        if (workSchedule) {
          // Suggest before work, lunch break, or evening
          suggestions.push(
            this.getNextDayTime(7, 30), // Before work
            this.getNextDayTime(12, 30), // Lunch break
            this.getNextDayTime(18, 30), // After work
          );
        }
        break;

      case 'freelancer':
        // Flexible schedule - suggest current availability
        suggestions.push(
          new Date(now.getTime() + 30 * 60 * 1000), // 30 mins from now
          new Date(now.getTime() + 3 * 60 * 60 * 1000), // 3 hours from now
          this.getNextDayTime(10, 0), // 10 AM tomorrow
        );
        break;
    }

    return suggestions;
  }

  private static getNextDayTime(hours: number, minutes: number): Date {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    tomorrow.setHours(hours, minutes, 0, 0);
    return tomorrow;
  }

  private static generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Placeholder methods - implement based on your content structure
  private static async getTopicContent(topicId: string): Promise<any[]> {
    // Implementation depends on your content structure
    return [];
  }

  private static selectOptimalSessionType(persona: UserPersona, topicId: string): string {
    // Logic to select best session type based on persona and progress
    return 'concept';
  }

  private static async calculateOptimalDifficulty(userId: string, topicId: string): Promise<string> {
    // Logic to calculate optimal difficulty based on past performance
    return 'medium';
  }

  private static generateAcademicExamples(topic: string): string[] {
    // Generate academic-focused examples
    return [];
  }

  private static generateProfessionalExamples(topic: string, careerContext: any): string[] {
    // Generate professional-focused examples
    return [];
  }

  private static generateFreelancerExamples(topic: string): string[] {
    // Generate freelancer-focused examples
    return [];
  }
}
```

### **🏗️ Step 3: Create Firebase-Integrated Micro-Learning Component**

**File**: `/components/micro-learning/MicroLearningSession.tsx`

```typescript
'use client';

import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { Clock, Play, Pause, Check, ArrowRight, AlertCircle } from 'lucide-react';
import { MicroLearningSession, SessionPerformance } from '@/types/micro-learning';
import { MicroLearningService } from '@/lib/micro-learning-service';
import { LoadingState, ErrorBoundary } from '@/components/ui';
import { useAuth } from '@/contexts/AuthContext';

interface MicroLearningSessionProps {
  subjectId: string;
  topicId: string;
  onComplete?: (performance: SessionPerformance) => void;
  onError?: (error: Error) => void;
}

export function MicroLearningSession({
  subjectId,
  topicId,
  onComplete,
  onError
}: MicroLearningSessionProps) {
  const { user } = useAuth();
  const [session, setSession] = useState<MicroLearningSession | null>(null);
  const [currentContentIndex, setCurrentContentIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (user?.uid) {
      loadSession();
    }
  }, [user?.uid, subjectId, topicId]);

  const loadSession = async () => {
    if (!user?.uid) return;

    setLoading(true);
    setError(null);

    try {
      const result = await MicroLearningService.generateSession(
        user.uid,
        subjectId,
        topicId
      );

      if (result.success) {
        setSession(result.data);
      } else {
        const errorMessage = result.error?.message || 'Failed to load session';
        setError(errorMessage);
        onError?.(result.error || new Error(errorMessage));
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to load session';
      setError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setLoading(false);
    }
  };

  const startSession = () => {
    setIsPlaying(true);
    setStartTime(new Date());
  };

  const pauseSession = () => {
    setIsPlaying(false);
  };

  const nextContent = async () => {
    if (session && currentContentIndex < session.content.length - 1) {
      setCurrentContentIndex(currentContentIndex + 1);

      // 🔥 SAVE PROGRESS TO FIRESTORE
      if (user?.uid) {
        await MicroLearningService.updateSessionProgress(
          user.uid,
          session.id,
          {
            currentContentIndex: currentContentIndex + 1,
            answers,
            lastUpdated: new Date()
          }
        );
      }
    } else {
      await completeSession();
    }
  };

  const completeSession = async () => {
    if (!session || !startTime || !user?.uid) return;

    setSaving(true);

    try {
      const endTime = new Date();
      const timeSpent = endTime.getTime() - startTime.getTime();

      const performance: SessionPerformance = {
        accuracy: calculateAccuracy(),
        timeSpent: timeSpent / 1000, // seconds
        engagementScore: calculateEngagementScore(),
        conceptsLearned: session.content.map(c => c.id),
        skillsDeveloped: session.content.map(c => c.type),
        areasForImprovement: [],
        trackSpecificMetrics: calculateTrackSpecificMetrics()
      };

      // 🔥 SAVE COMPLETION DATA TO FIRESTORE
      const result = await MicroLearningService.completeSession(
        user.uid,
        session.id,
        performance
      );

      if (result.success) {
        onComplete?.(performance);
      } else {
        setError(result.error?.message || 'Failed to save session completion');
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to complete session';
      setError(errorMessage);
      onError?.(error instanceof Error ? error : new Error(errorMessage));
    } finally {
      setSaving(false);
    }
  };

  // ... calculation methods remain the same

  if (!user) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto" />
            <p className="text-center text-gray-500">Please log in to access micro-learning sessions</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (loading) {
    return <LoadingState type="component" title="Loading Session" description="Preparing your personalized learning experience..." />;
  }

  if (error) {
    return (
      <Card className="w-full max-w-2xl mx-auto">
        <CardContent className="p-6">
          <div className="text-center space-y-4">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto" />
            <p className="text-center text-red-500">{error}</p>
            <Button onClick={loadSession} variant="outline">
              Try Again
            </Button>
          </div>
        </CardContent>
      </Card>
    );
  }

  // ... rest of the component remains the same but with proper error handling and loading states
}
```

const startSession = () => {
setIsPlaying(true);
setStartTime(new Date());
};

const pauseSession = () => {
setIsPlaying(false);
};

const nextContent = () => {
if (session && currentContentIndex < session.content.length - 1) {
setCurrentContentIndex(currentContentIndex + 1);
} else {
completeSession();
}
};

const completeSession = () => {
if (session && startTime) {
const endTime = new Date();
const timeSpent = endTime.getTime() - startTime.getTime();

      const performance: SessionPerformance = {
        accuracy: calculateAccuracy(),
        timeSpent: timeSpent / 1000, // seconds
        engagementScore: calculateEngagementScore(),
        conceptsLearned: session.content.map(c => c.id),
        areasForImprovement: [],
      };

      onComplete?.(performance);
    }

};

const calculateAccuracy = (): number => {
// Calculate based on quiz answers
return 85; // Placeholder
};

const calculateEngagementScore = (): number => {
// Calculate based on interaction patterns
return 90; // Placeholder
};

if (loading) {
return (
<Card className="w-full max-w-2xl mx-auto">
<CardContent className="p-6">
<div className="animate-pulse space-y-4">
<div className="h-4 bg-gray-200 rounded w-3/4"></div>
<div className="h-4 bg-gray-200 rounded w-1/2"></div>
</div>
</CardContent>
</Card>
);
}

if (!session) {
return (
<Card className="w-full max-w-2xl mx-auto">
<CardContent className="p-6">
<p className="text-center text-gray-500">Failed to load session</p>
</CardContent>
</Card>
);
}

const currentContent = session.content[currentContentIndex];
const progress = ((currentContentIndex + 1) / session.content.length) \* 100;

return (
<Card className="w-full max-w-2xl mx-auto">
<CardHeader>
<div className="flex items-center justify-between">
<CardTitle className="flex items-center gap-2">
<Clock className="h-5 w-5" />
{session.duration} min session
</CardTitle>
<div className="text-sm text-gray-500">
{currentContentIndex + 1} of {session.content.length}
</div>
</div>
<Progress value={progress} className="w-full" />
</CardHeader>

      <CardContent className="p-6">
        {!isPlaying && startTime === null ? (
          <div className="text-center space-y-4">
            <h3 className="text-lg font-semibold">Ready to start?</h3>
            <p className="text-gray-600">
              This session is optimized for your learning style and schedule.
            </p>
            <Button onClick={startSession} className="gap-2">
              <Play className="h-4 w-4" />
              Start Session
            </Button>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-semibold capitalize">
                {currentContent?.type} Content
              </h3>
              <Button
                variant="outline"
                size="sm"
                onClick={isPlaying ? pauseSession : startSession}
                className="gap-2"
              >
                {isPlaying ? (
                  <>
                    <Pause className="h-4 w-4" />
                    Pause
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Resume
                  </>
                )}
              </Button>
            </div>

            <div className="prose max-w-none">
              <div dangerouslySetInnerHTML={{ __html: currentContent?.content || '' }} />
            </div>

            <div className="flex justify-between">
              <Button
                variant="outline"
                onClick={() => setCurrentContentIndex(Math.max(0, currentContentIndex - 1))}
                disabled={currentContentIndex === 0}
              >
                Previous
              </Button>

              <Button onClick={nextContent} className="gap-2">
                {currentContentIndex === session.content.length - 1 ? (
                  <>
                    <Check className="h-4 w-4" />
                    Complete
                  </>
                ) : (
                  <>
                    Next
                    <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </Button>
            </div>
          </div>
        )}
      </CardContent>
    </Card>

);
}

````

### **🧪 Testing Steps**

1. **Test Firebase Connection**:
   ```bash
   # Verify Firebase is connected and working
   # Check Firestore console for proper collections
````

2. **Test Session Generation and Storage**:

   ```typescript
   // Test in browser console
   const result = await MicroLearningService.generateSession('user_id', 'subject_id', 'topic_id');
   console.log('Session created:', result);

   // Verify in Firebase console:
   // users/{userId}/micro-learning-sessions/{sessionId}
   ```

3. **Test Real-time Updates**:
   - Start a session
   - Check Firebase console for real-time progress updates
   - Verify session completion data is saved

4. **Test Error Handling**:
   - Disconnect internet and verify offline error handling
   - Test with invalid user IDs
   - Verify user-friendly error messages

### **🔥 Firebase Integration Verification Checklist**

- [ ] Session data appears in Firestore console
- [ ] Progress updates happen in real-time
- [ ] Session completion data is properly saved
- [ ] Recommendations are generated and stored
- [ ] Error handling works for network issues
- [ ] Loading states show during Firebase operations
- [ ] User authentication is verified before operations

### **📝 Documentation**

- Update README.md with micro-learning features
- Document persona optimization algorithms
- Create user guide for micro-learning sessions

---

## 🧪 **Testing Your Implementation**

### **Unit Tests**

```bash
npm test -- micro-learning
```

### **Integration Tests**

```bash
npm run test:integration
```

### **User Acceptance Testing**

- Test with different personas
- Verify session adaptation
- Check scheduling recommendations

---

## 📋 **Next Implementation: Week 4-5 Adaptive Mission System**

After completing micro-learning, you'll implement:

1. **Dynamic Mission Generation** - Persona-aware daily/weekly missions with Firebase storage
2. **Progress Tracking** - Unified progress system with real-time Firestore sync
3. **Achievement System** - Motivational rewards stored in Firebase with real-time updates

### **🔥 MANDATORY Firebase Requirements for Mission System:**

- Mission templates stored in `users/{userId}/mission-templates`
- Active missions in `users/{userId}/active-missions` with real-time updates
- Mission history in `users/{userId}/mission-history`
- Achievement data in `users/{userId}/achievements`
- Progress tracking with Firebase Functions for complex calculations
- Real-time leaderboards and social features

**Continue with the next section once micro-learning is complete and tested.**

---

## 🔥 **Firebase-First Development Rules**

### **For ALL Future Features:**

1. **No Mock Data**: Every feature must use real Firestore data from day one
2. **Real-time Updates**: Use `onSnapshot` for live data synchronization
3. **Enhanced Service Layer**: Always use `lib/firebase-enhanced.ts` service methods
4. **Error Handling**: Implement comprehensive error boundaries and user feedback
5. **Loading States**: Show proper loading indicators during Firebase operations
6. **Type Safety**: Use proper TypeScript interfaces for all Firebase operations
7. **Security**: Implement proper Firestore security rules for user data isolation
8. **Performance**: Use caching and batch operations where appropriate

### **Development Workflow:**

1. Design the feature
2. Define Firebase data structure
3. Implement Firebase service methods
4. Build UI components with Firebase integration
5. Add error handling and loading states
6. Test with real Firebase data
7. Verify security rules
8. Document the implementation

**No exceptions - all features must follow this Firebase-first approach!**

---

_Follow this guide step-by-step. Each section builds on the previous one. Test thoroughly before moving to the next implementation. Check 03-CURRENT-STATUS.md for latest progress updates._
