import { SyllabusSubject, User, TopicProgress } from '@/types/exam';

export interface SubjectMetrics {
  id: string;
  name: string;
  totalTopics: number;
  completedTopics: number;
  masteryScoreAvg: number;
  totalStudyHours: number;
  completionPercentage: number;
  efficiency: number; // Topics per Hour
}

export interface RevisionHealth {
  overdue: number;
  dueToday: number;
  upcoming: number;
  total: number;
  healthScore: number; // 0-100
}

export interface StudyEfficiency {
  actualHourlyPace: number; // Avg hours/day
  requiredHourlyPace: number; // Based on goal
  efficiencyRatio: number; // Actual / Goal
  totalStudyHours: number;
  goalStudyHours: number;
}

export interface StrategyMetrics {
  startDate: Date;
  examDate: Date;
  totalTopics: number;
  completedTopicsCount: number;
  daysElapsed: number;
  daysRemaining: number;
  currentVelocity: number; // Topics per day
  requiredVelocity: number; // Topics per day
  projectedFinishDate: Date;
  status: 'on_track' | 'at_risk' | 'critical' | 'ahead';
  percentageTimeElapsed: number;
  percentageContentCompleted: number;
  
  // V2 Metrics
  subjectMetrics: SubjectMetrics[];
  revisionHealth: RevisionHealth;
  studyEfficiency: StudyEfficiency;
}

export function calculateStrategyMetrics(
  user: User,
  syllabus: SyllabusSubject[],
  completedTopicsCount: number,
  topicProgressMap?: Map<string, TopicProgress>,
  courseStartDate?: Date,
  courseTargetDate?: Date,
  courseSettings?: {
    dailyGoalMinutes?: number;
    useWeekendSchedule?: boolean;
    weekdayStudyMinutes?: number;
    weekendStudyMinutes?: number;
    activeDays?: number[];
  }
): StrategyMetrics | null {
  const today = new Date();
  const startDate = courseStartDate || user.preparationStartDate?.toDate();

  // Robustly resolve exam date
  let targetDate: Date | undefined = courseTargetDate;

  // Only fallback to global user.currentExam if we are NOT in a specific course context
  // (i.e., if no course-specific start date was passed)
  if (!targetDate && !courseStartDate && user.currentExam?.targetDate) {
    targetDate = user.currentExam.targetDate.toDate();
  }

  // Sanity Check: If target date provides less than 2 days of prep time, assume it's an initialization error
  // (e.g. inherited "Today" from default profile) and force the smart fallback.
  if (targetDate && startDate) {
    const diffTime = targetDate.getTime() - startDate.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    if (diffDays < 2) {
       targetDate = undefined;
    }
  }

  // Fallback: If no target date is set (or was invalid), assume 6 months from now
  if (!targetDate) {
    targetDate = new Date();
    targetDate.setMonth(targetDate.getMonth() + 6);
  }

  const examDate = targetDate;

  if (!startDate || !examDate) {
    return null;
  }

  const totalTopics = syllabus.reduce((acc, subject) => acc + (subject.topics?.length || 0), 0);
  const remainingTopics = Math.max(0, totalTopics - completedTopicsCount);

  // Time calculations
  const daysElapsed = Math.max(1, Math.ceil((today.getTime() - startDate.getTime()) / (1000 * 60 * 60 * 24)));
  const daysRemaining = Math.max(0, Math.ceil((examDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)));
  const totalDays = daysElapsed + daysRemaining;

  // Velocity (Topics per Day)
  const currentVelocity = completedTopicsCount / daysElapsed; // Topics/Day
  const requiredVelocity = remainingTopics / Math.max(1, daysRemaining); // Topics/Day

  // Projected Finish
  let daysToFinishAtCurrentPace = 9999; // Default to "never" if velocity is 0
  
  if (currentVelocity > 0) {
    daysToFinishAtCurrentPace = Math.ceil(remainingTopics / currentVelocity);
  } else if (daysElapsed <= 7 && completedTopicsCount === 0) {
    // New User Grace Period:
    // If user is within first week and hasn't finished anything, avoid "Critical Delay" panic.
    // Optimistically assume they will match the required pace to finish on time.
    daysToFinishAtCurrentPace = daysRemaining;
  }

  const projectedFinishDate = new Date(today.getTime() + daysToFinishAtCurrentPace * 24 * 60 * 60 * 1000);

  // Status Logic
  let status: 'on_track' | 'at_risk' | 'critical' | 'ahead' = 'on_track';

  if (daysRemaining <= 0 && remainingTopics > 0) {
    status = 'critical';
  } else if (projectedFinishDate > examDate) {
    // If projection is way past exam date
    const delayDays = Math.ceil((projectedFinishDate.getTime() - examDate.getTime()) / (1000 * 60 * 60 * 24));
    status = delayDays > 14 ? 'critical' : 'at_risk';
  } else if (projectedFinishDate < new Date(examDate.getTime() - 14 * 24 * 60 * 60 * 1000)) {
    status = 'ahead'; // Finishing 2 weeks early
  }

  // ==========================================
  // V2 Advanced Calculations
  // ==========================================

  // 1. Subject Metrics
  const subjectMetrics: SubjectMetrics[] = syllabus.map(subject => {
    let completed = 0;
    let masterySum = 0;
    let studyMinutes = 0;

    subject.topics.forEach(topic => {
      const p = topicProgressMap?.get(topic.id);
      if (p) {
        if (p.status === 'completed' || p.status === 'mastered') completed++;
        masterySum += p.masteryScore || 0;
        
        let duration = p.totalStudyTime || 0;
        // Fallback: If completed/mastered but 0 time logged, use estimated hours (default 1h)
        if (duration === 0 && (p.status === 'completed' || p.status === 'mastered')) {
             duration = (topic.estimatedHours || 1) * 60;
        }
        studyMinutes += duration;
      }
    });

    const total = subject.topics.length;
    return {
      id: subject.id,
      name: subject.name,
      totalTopics: total,
      completedTopics: completed,
      masteryScoreAvg: total > 0 ? masterySum / total : 0,
      totalStudyHours: studyMinutes / 60,
      completionPercentage: total > 0 ? (completed / total) * 100 : 0,
      efficiency: studyMinutes > 0 ? completed / (studyMinutes / 60) : 0,
    };
  });

  // 2. Revision Health
  let overdue = 0;
  let dueToday = 0;
  let upcoming = 0;
  let totalWithRevision = 0;

  topicProgressMap?.forEach(p => {
    if (p.nextRevision) {
      totalWithRevision++;
      const nextDate = p.nextRevision.toDate();
      const diffDays = Math.ceil((nextDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
      
      if (diffDays < 0) overdue++;
      else if (diffDays === 0) dueToday++;
      else upcoming++;
    }
  });

  const revisionHealth: RevisionHealth = {
    overdue,
    dueToday,
    upcoming,
    total: totalWithRevision,
    healthScore: totalWithRevision > 0 ? Math.max(0, 100 - (overdue / totalWithRevision) * 100) : 100,
  };

  // 3. Study Efficiency
  // Use the calculated subject metrics to ensure consistency with the table (includes fallback estimates)
  const totalStudyMinutes = subjectMetrics.reduce((acc, s) => acc + (s.totalStudyHours * 60), 0);
  const totalStudyHours = totalStudyMinutes / 60;

  // Granular Schedule Logic
  let goalStudyMinutes = 0;
  
  // Use course-specific settings if available, otherwise fall back to user global preferences
  const settings = {
    dailyGoalMinutes: user.preferences?.dailyStudyGoalMinutes || 60,
    useWeekendSchedule: user.preferences?.useWeekendSchedule || false,
    weekdayStudyMinutes: user.preferences?.weekdayStudyMinutes,
    weekendStudyMinutes: user.preferences?.weekendStudyMinutes,
    activeDays: [0, 1, 2, 3, 4, 5, 6], // Default to all days
    ...courseSettings // Override with course settings if provided
  };

  // Advanced Calculation: Iterate days to sum exact capacity
  // We do this if we have granular weekend settings OR restricted active days
  const hasGranularSchedule = settings.useWeekendSchedule && settings.weekdayStudyMinutes && settings.weekendStudyMinutes;
  // If activeDays is explicitly a subset of the week (length < 7), we should use the loop
  // Note: courseSettings.activeDays might be passed from Wizard
  const hasRestrictedDays = settings.activeDays && settings.activeDays.length < 7;

  if (hasGranularSchedule || hasRestrictedDays) {
    const tempDate = new Date(startDate);
    const endDate = new Date(today);
    
    // Safety check to prevent infinite loops if dates are messy
    let loopCount = 0;
    while (tempDate <= endDate && loopCount < 3650) { // Max 10 years
       const day = tempDate.getDay();
       const isActive = settings.activeDays.includes(day);

       if (isActive) {
         if (hasGranularSchedule) {
            if (day === 0 || day === 6) {
              goalStudyMinutes += settings.weekendStudyMinutes!;
            } else {
              goalStudyMinutes += settings.weekdayStudyMinutes!;
            }
         } else {
            // Standard daily minutes, but only on active days
            goalStudyMinutes += settings.dailyGoalMinutes;
         }
       }
       
       tempDate.setDate(tempDate.getDate() + 1);
       loopCount++;
    }
  } else {
    // Standard Calculation (Simple Average for full weeks)
    goalStudyMinutes = settings.dailyGoalMinutes * daysElapsed;
  }

  const goalStudyHours = goalStudyMinutes / 60;

  const studyEfficiency: StudyEfficiency = {
    actualHourlyPace: totalStudyHours / Math.max(1, daysElapsed),
    requiredHourlyPace: goalStudyMinutes / 60 / Math.max(1, daysElapsed),
    efficiencyRatio: goalStudyHours > 0 ? totalStudyHours / goalStudyHours : 0,
    totalStudyHours,
    goalStudyHours,
  };

  return {
    startDate,
    examDate,
    totalTopics,
    completedTopicsCount,
    daysElapsed,
    daysRemaining,
    currentVelocity,
    requiredVelocity,
    projectedFinishDate,
    status,
    percentageTimeElapsed: Math.min(100, (daysElapsed / totalDays) * 100),
    percentageContentCompleted: totalTopics > 0 ? Math.min(100, (completedTopicsCount / totalTopics) * 100) : 0,
    
    // V2 Data
    subjectMetrics,
    revisionHealth,
    studyEfficiency,
  };
}

export function formatVelocity(topicsPerDay: number): string {
  return (topicsPerDay * 7).toFixed(1); // Convert to Weekly Velocity
}

export function getStatusLabel(status: string): string {
  const labels: Record<string, string> = {
    on_track: 'On Track',
    ahead: 'Ahead of Schedule',
    at_risk: 'At Risk',
    critical: 'Critical Delay',
  };
  return labels[status] || status;
}

export function getStatusColor(status: string): string {
  const colors: Record<string, string> = {
    on_track: 'text-emerald-600 bg-emerald-100 border-emerald-200',
    ahead: 'text-emerald-700 bg-emerald-100 border-emerald-200',
    at_risk: 'text-amber-700 bg-amber-100 border-amber-200',
    critical: 'text-rose-700 bg-rose-100 border-rose-200',
  };
  return colors[status] || 'text-gray-700 bg-gray-100 border-gray-200';
}
