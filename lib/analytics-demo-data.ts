/**
 * @fileoverview Analytics Demo Data Service
 *
 * Service to generate realistic demo data for analytics dashboard
 * demonstration purposes. Creates meaningful sample data that
 * showcases the full capabilities of the intelligent analytics system.
 *
 * Features:
 * - Realistic exam performance data with trends
 * - Course learning progress simulation
 * - Cross-track skill transfer examples
 * - Weak area identification patterns
 * - Predictive analytics sample data
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { Timestamp } from 'firebase/firestore';

/* eslint-disable import/no-cycle */
import {
  PerformanceAnalytics,
  WeakArea,
  AdaptiveRecommendation,
  LearningTransfer as _LearningTransfer,
  SkillSynergy as _SkillSynergy,
  CrossTrackBenefit as _CrossTrackBenefit,
  PerformanceTrend as _PerformanceTrend,
  SkillMasteryPrediction as _SkillMasteryPrediction,
  StudyPlanRecommendation as _StudyPlanRecommendation,
  RiskFactor as _RiskFactor,
  RecommendedAction as _RecommendedAction,
  ActionResource as _ActionResource,
} from '@/lib/intelligent-analytics-service';

// ============================================================================
// DEMO DATA GENERATOR SERVICE
// ============================================================================

export class AnalyticsDemoDataService {
  private static instance: AnalyticsDemoDataService;

  private constructor() {}

  public static getInstance(): AnalyticsDemoDataService {
    if (!AnalyticsDemoDataService.instance) {
      AnalyticsDemoDataService.instance = new AnalyticsDemoDataService();
    }
    return AnalyticsDemoDataService.instance;
  }

  /**
   * Generate comprehensive demo analytics data
   */
  generateDemoAnalytics(): PerformanceAnalytics {
    return {
      examPerformance: this.generateExamPerformance(),
      coursePerformance: this.generateCoursePerformance(),
      crossTrackInsights: this.generateCrossTrackInsights(),
      trends: this.generatePerformanceTrends(),
      predictions: this.generatePredictions(),
    };
  }

  /**
   * Generate demo weak areas
   */
  generateDemoWeakAreas(): WeakArea[] {
    return [
      {
        topicId: 'calculus_limits',
        topicName: 'Limits and Continuity',
        subjectId: 'mathematics',
        subjectName: 'Mathematics',
        weaknessScore: 78,
        frequency: 12,
        improvementPotential: 85,
        recommendedActions: [
          {
            actionType: 'practice_more',
            description: 'Complete 20 additional limit problems with increasing complexity',
            estimatedTime: 120,
            difficulty: 'medium',
            expectedImpact: 75,
            resources: [
              {
                type: 'video',
                title: 'Khan Academy - Limits Introduction',
                url: 'https://example.com/limits',
                duration: 25,
                difficulty: 'beginner',
              },
              {
                type: 'practice',
                title: 'Calculus Limit Practice Problems',
                duration: 90,
                difficulty: 'intermediate',
              },
            ],
          },
          {
            actionType: 'review_concepts',
            description: 'Review fundamental concepts of continuity and limit definitions',
            estimatedTime: 60,
            difficulty: 'easy',
            expectedImpact: 60,
            resources: [
              {
                type: 'article',
                title: 'Understanding Limits Conceptually',
                duration: 15,
                difficulty: 'beginner',
              },
            ],
          },
        ],
        lastImprovement: null,
        trendDirection: 'declining',
      },
      {
        topicId: 'data_structures_trees',
        topicName: 'Binary Trees & BST',
        subjectId: 'computer_science',
        subjectName: 'Data Structures',
        weaknessScore: 65,
        frequency: 8,
        improvementPotential: 92,
        recommendedActions: [
          {
            actionType: 'practice_more',
            description: 'Implement tree traversal algorithms from scratch',
            estimatedTime: 180,
            difficulty: 'hard',
            expectedImpact: 85,
            resources: [
              {
                type: 'practice',
                title: 'LeetCode Tree Problems',
                duration: 120,
                difficulty: 'advanced',
              },
            ],
          },
        ],
        lastImprovement: Timestamp.fromMillis(Date.now() - 7 * 24 * 60 * 60 * 1000),
        trendDirection: 'improving',
      },
      {
        topicId: 'physics_mechanics',
        topicName: 'Classical Mechanics',
        subjectId: 'physics',
        subjectName: 'Physics',
        weaknessScore: 72,
        frequency: 15,
        improvementPotential: 88,
        recommendedActions: [
          {
            actionType: 'change_method',
            description: 'Try visual learning approach with simulations',
            estimatedTime: 90,
            difficulty: 'medium',
            expectedImpact: 70,
            resources: [],
          },
        ],
        lastImprovement: Timestamp.fromMillis(Date.now() - 3 * 24 * 60 * 60 * 1000),
        trendDirection: 'stable',
      },
    ];
  }

  /**
   * Generate demo recommendations
   */
  generateDemoRecommendations(): AdaptiveRecommendation[] {
    return [
      {
        id: 'rec_1',
        type: 'study_method',
        priority: 'high',
        confidence: 89,
        recommendation: 'Switch to active recall method for Mathematics topics',
        reasoning: 'Your current passive reading shows 23% lower retention compared to active practice',
        expectedImpact: 'Improve retention by 35% and reduce study time by 20%',
        implementationSteps: [
          'Create flashcards for key formulas',
          'Practice problems without looking at solutions first',
          'Explain concepts out loud after each study session',
          'Test yourself weekly on previously covered topics',
        ],
        trackingMetrics: ['Problem-solving accuracy', 'Time to recall formulas', 'Mock test improvement rate'],
        validUntil: Timestamp.fromMillis(Date.now() + 14 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'rec_2',
        type: 'cross_track_opportunity',
        priority: 'medium',
        confidence: 82,
        recommendation: 'Apply coding problem-solving skills to Physics word problems',
        reasoning: 'Your systematic debugging approach in programming can enhance physics problem analysis',
        expectedImpact: 'Reduce physics problem-solving time by 25% and improve accuracy by 15%',
        implementationSteps: [
          'Break physics problems into smaller sub-problems',
          'Define variables and constraints clearly',
          'Use algorithmic thinking for solution steps',
          'Validate answers using dimensional analysis',
        ],
        trackingMetrics: ['Physics problem completion time', 'Solution accuracy rate', 'Confidence in approach'],
        validUntil: Timestamp.fromMillis(Date.now() + 21 * 24 * 60 * 60 * 1000),
      },
      {
        id: 'rec_3',
        type: 'schedule_optimization',
        priority: 'medium',
        confidence: 76,
        recommendation: 'Move challenging Mathematics sessions to morning hours',
        reasoning: 'Your performance data shows 28% better accuracy in complex calculations during 9-11 AM',
        expectedImpact: 'Increase daily math productivity by 22% and reduce cognitive fatigue',
        implementationSteps: [
          'Schedule calculus and advanced topics for 9-11 AM',
          'Use afternoon for revision and practice problems',
          'Reserve evenings for lighter subjects',
          'Track energy levels and adjust accordingly',
        ],
        trackingMetrics: ['Session completion rate', 'Problem accuracy by time of day', 'Perceived difficulty ratings'],
        validUntil: Timestamp.fromMillis(Date.now() + 30 * 24 * 60 * 60 * 1000),
      },
    ];
  }

  // ============================================================================
  // PRIVATE HELPER METHODS
  // ============================================================================

  private generateExamPerformance(): PerformanceAnalytics['examPerformance'] {
    return {
      totalMockTests: 18,
      averageScore: 73.5,
      scoreImprovement: 12.3,
      weakAreas: this.generateDemoWeakAreas(),
      strongAreas: ['Algebra Fundamentals', 'Basic Programming Concepts', 'English Comprehension', 'Logical Reasoning'],
      revisionEffectiveness: 78,
      predictedExamScore: 82.5,
    };
  }

  private generateCoursePerformance(): PerformanceAnalytics['coursePerformance'] {
    return {
      totalAssignments: 24,
      completionRate: 87.5,
      projectSuccessRate: 92,
      skillMastery: [
        {
          skillId: 'javascript_basics',
          skillName: 'JavaScript Fundamentals',
          category: 'Programming',
          masteryLevel: 85,
          practiceTime: 4500,
          projectsCompleted: 8,
          conceptualUnderstanding: 88,
          practicalApplication: 82,
          lastPracticed: Timestamp.fromMillis(Date.now() - 2 * 24 * 60 * 60 * 1000),
          improvementRate: 2.3,
        },
        {
          skillId: 'react_components',
          skillName: 'React Components',
          category: 'Frontend Development',
          masteryLevel: 76,
          practiceTime: 3200,
          projectsCompleted: 5,
          conceptualUnderstanding: 80,
          practicalApplication: 72,
          lastPracticed: Timestamp.fromMillis(Date.now() - 1 * 24 * 60 * 60 * 1000),
          improvementRate: 3.1,
        },
        {
          skillId: 'algorithm_design',
          skillName: 'Algorithm Design',
          category: 'Computer Science',
          masteryLevel: 68,
          practiceTime: 2800,
          projectsCompleted: 3,
          conceptualUnderstanding: 75,
          practicalApplication: 61,
          lastPracticed: Timestamp.fromMillis(Date.now() - 3 * 24 * 60 * 60 * 1000),
          improvementRate: 1.8,
        },
      ],
      codingEfficiency: 82,
      problemSolvingScore: 79,
    };
  }

  private generateCrossTrackInsights(): PerformanceAnalytics['crossTrackInsights'] {
    return {
      learningTransfer: [
        {
          fromTrack: 'course_tech',
          toTrack: 'exam',
          transferredSkill: 'Logical Problem Solving',
          effectivenessScore: 87,
          frequency: 12,
          examples: [
            {
              description: 'Applied debugging methodology to solve physics word problems',
              context: 'Physics mechanics problems',
              outcome: 'Improved accuracy from 65% to 82%',
              effectivenessRating: 85,
            },
            {
              description: 'Used algorithmic thinking for mathematics proofs',
              context: 'Calculus theorem proofs',
              outcome: 'Reduced solution time by 35%',
              effectivenessRating: 90,
            },
          ],
          potentialApplications: [
            'Apply to chemistry stoichiometry problems',
            'Use for complex mathematics word problems',
            'Apply systematic approach to essay writing',
          ],
        },
        {
          fromTrack: 'exam',
          toTrack: 'course_tech',
          transferredSkill: 'Pattern Recognition',
          effectivenessScore: 79,
          frequency: 8,
          examples: [
            {
              description: 'Applied mathematical pattern recognition to identify code optimization opportunities',
              context: 'JavaScript performance optimization',
              outcome: 'Improved code efficiency by 28%',
              effectivenessRating: 82,
            },
          ],
          potentialApplications: [
            'Design pattern recognition in software architecture',
            'Bug pattern identification in debugging',
            'User behavior pattern analysis',
          ],
        },
      ],
      skillSynergy: [
        {
          examSkill: 'Mathematical Analysis',
          techSkill: 'Algorithm Complexity Analysis',
          synergyStrength: 92,
          practicalApplications: [
            'Optimize recursive algorithms using mathematical principles',
            'Apply calculus concepts to machine learning algorithms',
            'Use statistical analysis for code performance metrics',
          ],
          careerBenefit: 'Strong foundation for data science and machine learning roles',
          reinforcementOpportunities: [
            'Practice LeetCode problems with mathematical components',
            'Implement mathematical algorithms from scratch',
            'Analyze algorithm performance using calculus concepts',
          ],
        },
        {
          examSkill: 'Logical Reasoning',
          techSkill: 'Software Debugging',
          synergyStrength: 85,
          practicalApplications: [
            'Systematic debugging using logical deduction',
            'Design test cases using logical principles',
            'Code review using structured reasoning',
          ],
          careerBenefit: 'Enhanced problem-solving capabilities in software development',
          reinforcementOpportunities: [
            'Practice debugging challenges',
            'Participate in code review sessions',
            'Solve logic puzzles regularly',
          ],
        },
      ],
      adaptiveRecommendations: this.generateDemoRecommendations(),
      crossTrackBenefits: [
        {
          benefitType: 'time_efficiency',
          description: 'Cross-track learning reduces overall study time by leveraging skill transfer',
          measuredImpact: 23,
          examples: [
            'Programming logic helps with mathematical proofs (save 2 hours/week)',
            'Mathematical thinking improves algorithm design (save 1.5 hours/week)',
          ],
          recommendedActions: [
            'Identify more opportunities for skill transfer',
            'Create study sessions that combine both tracks',
            'Document successful transfer techniques',
          ],
        },
        {
          benefitType: 'skill_reinforcement',
          description: 'Skills learned in one track reinforce understanding in another',
          measuredImpact: 35,
          examples: [
            'Calculus concepts strengthen understanding of machine learning algorithms',
            'Physics problem-solving improves systematic debugging approach',
          ],
          recommendedActions: [
            'Explicitly connect concepts between tracks',
            'Practice applying skills across domains',
            'Create concept maps showing connections',
          ],
        },
      ],
    };
  }

  private generatePerformanceTrends(): PerformanceAnalytics['trends'] {
    const now = Date.now();
    const dayInMs = 24 * 60 * 60 * 1000;

    return {
      daily: Array.from({ length: 30 }, (_, i) => ({
        date: Timestamp.fromMillis(now - (29 - i) * dayInMs),
        examScore: 65 + Math.sin(i * 0.3) * 10 + i * 0.5,
        courseProgress: 70 + Math.cos(i * 0.4) * 8 + i * 0.4,
        studyTime: 3 + Math.sin(i * 0.5) * 1.5,
        efficiency: 70 + Math.sin(i * 0.2) * 15,
        mood: 7 + Math.sin(i * 0.1) * 2,
        challenges: i % 7 === 0 ? ['Time management'] : [],
        achievements: i % 5 === 0 ? ['Completed practice set'] : [],
      })),
      weekly: Array.from({ length: 12 }, (_, i) => ({
        date: Timestamp.fromMillis(now - (11 - i) * 7 * dayInMs),
        examScore: 60 + i * 2 + Math.sin(i * 0.5) * 8,
        courseProgress: 65 + i * 1.5 + Math.cos(i * 0.3) * 6,
        studyTime: 20 + Math.sin(i * 0.4) * 8,
        efficiency: 65 + i * 1.2,
        mood: 6.5 + Math.sin(i * 0.2) * 1.5,
        challenges: [],
        achievements: [],
      })),
      monthly: Array.from({ length: 6 }, (_, i) => ({
        date: Timestamp.fromMillis(now - (5 - i) * 30 * dayInMs),
        examScore: 55 + i * 4,
        courseProgress: 60 + i * 3.5,
        studyTime: 80 + i * 10,
        efficiency: 60 + i * 4,
        mood: 6 + i * 0.3,
        challenges: [],
        achievements: [],
      })),
    };
  }

  private generatePredictions(): PerformanceAnalytics['predictions'] {
    return {
      examSuccessProbability: 84,
      skillMasteryTimeline: [
        {
          skillId: 'javascript_basics',
          currentLevel: 85,
          predictedLevel: 95,
          timeToMastery: 14,
          confidence: 89,
          requiredEffort: '2 hours/day focused practice',
        },
        {
          skillId: 'calculus_advanced',
          currentLevel: 62,
          predictedLevel: 85,
          timeToMastery: 28,
          confidence: 76,
          requiredEffort: '1.5 hours/day with emphasis on problem-solving',
        },
        {
          skillId: 'algorithm_design',
          currentLevel: 68,
          predictedLevel: 82,
          timeToMastery: 21,
          confidence: 82,
          requiredEffort: '3 hours/week on LeetCode + theory review',
        },
      ],
      optimalStudyPlan: [
        {
          phase: 'Foundation Strengthening',
          duration: 14,
          focusAreas: ['Calculus Fundamentals', 'JavaScript ES6+', 'Problem-Solving Patterns'],
          dailyGoals: ['Complete 5 calculus problems', 'Practice 1 JavaScript concept', 'Solve 2 algorithmic problems'],
          milestones: [
            'Score 80%+ on calculus practice test',
            'Complete JavaScript fundamentals project',
            'Solve 50 easy-medium algorithm problems',
          ],
          successMetrics: [
            'Weekly quiz scores above 85%',
            'Concept explanation without references',
            'Implementation speed improvement',
          ],
        },
        {
          phase: 'Advanced Integration',
          duration: 21,
          focusAreas: ['Advanced Calculus Applications', 'React & State Management', 'Complex Algorithms'],
          dailyGoals: [
            'Tackle advanced calculus applications',
            'Build React components',
            'Practice hard algorithm problems',
          ],
          milestones: [
            'Complete calculus optimization problems',
            'Build full-stack application',
            'Solve dynamic programming challenges',
          ],
          successMetrics: [
            'Mock exam scores above 85%',
            'Code review approval rate > 90%',
            'Algorithm efficiency improvements',
          ],
        },
      ],
      riskFactors: [
        {
          factor: 'Inconsistent Study Schedule',
          riskLevel: 'medium',
          impact: 'May delay mastery timeline by 2-3 weeks',
          mitigationStrategies: [
            'Set specific daily study times',
            'Use calendar blocking for study sessions',
            'Create accountability with study partner',
          ],
          earlyWarningSignals: [
            'Missing 2+ study sessions per week',
            'Declining weekly practice hours',
            'Postponing scheduled reviews',
          ],
        },
        {
          factor: 'Weak Areas Accumulation',
          riskLevel: 'low',
          impact: 'Gradual decrease in overall performance',
          mitigationStrategies: [
            'Address weak areas immediately',
            'Increase practice frequency for challenging topics',
            'Seek help from mentors or tutors',
          ],
          earlyWarningSignals: [
            'Repeated mistakes in same topics',
            'Avoiding challenging problems',
            'Declining confidence in weak subjects',
          ],
        },
      ],
    };
  }
}

// Export singleton instance
export const analyticsDemoService = AnalyticsDemoDataService.getInstance();
