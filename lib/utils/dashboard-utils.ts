import { Exam, SyllabusSubject, TopicProgress } from '@/types/exam';

export interface RecommendationResult {
  currentTopic?: string;
  currentTopicId?: string;
  currentSubjectId?: string;
  nextAction?: string;
  studyGoal?: string;
  examDaysLeft?: number;
  subjectRecommendation?: string;
  todaysPlan?: string[];
  allTopicsComplete?: boolean;
}

/**
 * Generates study recommendations based on the user's current progress and target date.
 */
export const generateTodayRecommendations = (
  _exam: Exam,
  syllabus: SyllabusSubject[],
  topicProgress: TopicProgress[],
  examDaysLeft?: number
): RecommendationResult => {
  // Find the next topic to study (first incomplete topic)
  let currentTopic = '';
  let currentTopicId = '';
  let currentSubjectId = '';
  let nextAction = '';
  let subjectRecommendation = '';
  const todaysPlan: string[] = [];
  let foundIncompleteTopic = false;

  if (syllabus.length > 0) {
    // Find first subject with incomplete topics
    for (const subject of syllabus) {
      if (subject.topics && subject.topics.length > 0) {
        const incompleteTopic = subject.topics.find(topic => {
          // Check topic progress status from Firebase data
          const progress = topicProgress.find(p => p.topicId === topic.id);
          // Only recommend topics that are NOT completed or mastered
          const status = progress?.status;
          return !status || !['completed', 'mastered'].includes(status);
        });

        if (incompleteTopic) {
          currentTopic = `${subject.name} - ${incompleteTopic.name}`;
          currentTopicId = incompleteTopic.id;
          currentSubjectId = subject.id;
          subjectRecommendation = subject.name;
          todaysPlan.push(`📚 Study ${incompleteTopic.name}`);
          todaysPlan.push(`⏱️ Target: ${incompleteTopic.estimatedHours ?? 2} hours`);
          foundIncompleteTopic = true;
          break;
        }
      }
    }
  }

  // Generate action based on day and goal timeline
  if (examDaysLeft !== undefined) {
    if (examDaysLeft <= 7) {
      nextAction = 'Take a practice test';
    } else if (examDaysLeft <= 30) {
      nextAction = 'Review and practice questions';
    } else {
      nextAction = 'Study new topics';
    }
  } else {
    nextAction = 'Continue your learning journey';
  }

  // Generate study goal
  let studyGoal = '';
  if (examDaysLeft !== undefined) {
    if (examDaysLeft <= 7) {
      studyGoal = 'Focus on revision and mock tests';
    } else if (examDaysLeft <= 30) {
      studyGoal = 'Complete topic review and practice';
    } else {
      studyGoal = 'Master fundamental concepts';
    }
  } else {
    studyGoal = 'Build strong foundations';
  }

  // Add general plan items
  if (todaysPlan.length === 0) {
    todaysPlan.push('📚 Choose a topic to study');
    todaysPlan.push('⏱️ Target: 2 hours focused study');
  }
  todaysPlan.push('🧪 Take practice test');
  todaysPlan.push('📝 Review weak areas');

  return {
    ...(foundIncompleteTopic ? { currentTopic } : {}),
    ...(currentTopicId ? { currentTopicId } : {}),
    ...(currentSubjectId ? { currentSubjectId } : {}),
    nextAction,
    studyGoal,
    subjectRecommendation: subjectRecommendation || 'Choose a subject to begin',
    todaysPlan,
    ...(examDaysLeft !== undefined ? { examDaysLeft } : {}),
    allTopicsComplete: !foundIncompleteTopic && syllabus.length > 0,
  };
};
