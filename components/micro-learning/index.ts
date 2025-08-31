/**
 * Micro-Learning Components
 *
 * A comprehensive suite of components for the Dual-Track Micro-Learning System
 * supporting both exam preparation and course/tech learning tracks with
 * persona-aware optimizations.
 */

export { MicroLearningSession } from './MicroLearningSession';
export { SessionSummary } from './SessionSummary';
export { MicroLearningDashboard } from './MicroLearningDashboard';
export { QuickSessionLauncher } from './QuickSessionLauncher';

// Re-export types for convenience
export type {
  MicroLearningSession as MicroLearningSessionType,
  SessionPerformance,
  PersonaOptimizations,
  MicroContent,
  ExamTrackMetrics,
  CourseTrackMetrics,
} from '@/types/micro-learning';
