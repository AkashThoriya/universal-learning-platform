export const DEFAULT_PREFERENCES = {
  DAILY_STUDY_GOAL_MINUTES: 240,
  PREFERRED_STUDY_TIME: 'morning',
  REVISION_INTERVALS: [1, 3, 7, 16, 35],
  NOTIFICATIONS: {
    revisionReminders: true,
    dailyGoalReminders: true,
    healthCheckReminders: true,
  },
  TIER_DEFINITIONS: {
    1: 'High Priority - Core Topics',
    2: 'Medium Priority - Important Topics',
    3: 'Low Priority - Additional Topics',
  },
} as const;

export const USER_PERSONAS = [
  {
    type: 'student',
    label: 'Student',
    description: 'Full-time student with flexible schedule',
    icon: 'User',
    color: 'blue',
  },
  {
    type: 'working_professional',
    label: 'Working Professional',
    description: 'Working professional with limited time',
    icon: 'UserCheck',
    color: 'green',
  },
  {
    type: 'freelancer',
    label: 'Freelancer',
    description: 'Flexible schedule with project commitments',
    icon: 'Activity',
    color: 'purple',
  },
] as const;
