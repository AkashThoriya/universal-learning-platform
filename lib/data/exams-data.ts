/**
 * @fileoverview Predefined exam data with comprehensive syllabus structures
 *
 * This module imports exam data from individual JSON files for better organization
 * and maintainability. Each exam includes complete syllabus structure with subjects,
 * topics, and estimated study hours.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { Exam } from '@/types/exam';

// Import individual exam data from JSON files
import cat from './exams/cat.json';
import devOpsMastery from './exams/devops-mastery.json';
import dsaByNamastedev from './exams/dsa-by-namastedev.json';
import dsaByStriver from './exams/dsa-by-striver.json';
import gateCse from './exams/gate-cse.json';
import ibpsSoIt from './exams/ibps-so-it.json';
import jeeMain from './exams/jee-main.json';
import neet from './exams/neet.json';
import nodejsByNamastedev from './exams/nodejs-by-namastedev.json';
import reactByNamastedev from './exams/react-by-namastedev.json';
import rrbNtpc from './exams/rrb-ntpc.json';
import sbiPo from './exams/sbi-po.json';
import sqlMastery from './exams/sql-mastery.json';
import sscCgl from './exams/ssc-cgl.json';
import systemsDsa from './exams/systems-dsa.json';
import upscCsePrelims from './exams/upsc-cse-prelims.json';

/**
 * Array of predefined exams with complete syllabus data
 * Includes major competitive exams across different categories:
 * - Computer Science: DevOps, Data Structures & Algorithms (Striver & namastedev), React (namastedev), NodeJS (namastedev), SQL
 * - Civil Services: UPSC CSE, UPSC CDS, State PCS
 * - Banking: IBPS PO, IBPS Clerk, SBI PO
 * - Engineering: GATE, IES, State Engineering Services
 * - Management: CAT, XAT, SNAP
 * - Staff Selection: SSC CGL, SSC CHSL
 * - Railway: RRB NTPC, Group D
 * - Entrance: JEE Main, NEET
 *
 * @example
 * ```typescript
 * // Find a specific exam
 * const upscExam = EXAMS_DATA.find(exam => exam.id === 'upsc_cse_prelims');
 *
 * // Get all banking exams
 * const bankingExams = EXAMS_DATA.filter(exam => exam.category === 'Banking');
 *
 * // Calculate total estimated hours for an exam
 * const totalHours = upscExam?.defaultSyllabus.reduce((sum, subject) =>
 *   sum + (subject.estimatedHours ?? 0), 0
 * );
 * ```
 */
export const EXAMS_DATA: Exam[] = [
  upscCsePrelims as Exam,
  ibpsSoIt as Exam,
  sscCgl as Exam,
  gateCse as Exam,
  cat as Exam,
  sbiPo as Exam,
  jeeMain as Exam,
  neet as Exam,
  rrbNtpc as Exam,
  devOpsMastery as Exam,
  dsaByStriver as Exam,
  dsaByNamastedev as Exam,
  nodejsByNamastedev as Exam,
  reactByNamastedev as Exam,
  sqlMastery as Exam,
  systemsDsa as Exam,
];

/**
 * Get all available exam categories
 * @returns Array of unique exam categories
 */
export const getExamCategories = (): string[] => {
  return Array.from(new Set(EXAMS_DATA.map(exam => exam.category)));
};

/**
 * Find an exam by its ID
 * @param examId - The unique identifier for the exam
 * @returns The exam object or undefined if not found
 */
export const getExamById = (examId: string): Exam | undefined => {
  return EXAMS_DATA.find(exam => exam.id === examId);
};

/**
 * Get exams by category
 * @param category - The category to filter by
 * @returns Array of exams in the specified category
 */
export const getExamsByCategory = (category: string): Exam[] => {
  return EXAMS_DATA.filter(exam => exam.category === category);
};

/**
 * Search exams by name or description
 * @param query - The search query
 * @returns Array of matching exams
 */
export const searchExams = (query: string): Exam[] => {
  const lowercaseQuery = query.toLowerCase();
  return EXAMS_DATA.filter(
    exam => exam.name.toLowerCase().includes(lowercaseQuery) || exam.description.toLowerCase().includes(lowercaseQuery)
  );
};

/**
 * Calculate total study hours for an exam
 * @param examId - The unique identifier for the exam
 * @returns Total estimated study hours or 0 if exam not found
 */
export const calculateTotalStudyHours = (examId: string): number => {
  const exam = getExamById(examId);
  if (!exam) {
    return 0;
  }

  return exam.defaultSyllabus.reduce((total, subject) => {
    return total + (subject.estimatedHours ?? 0);
  }, 0);
};

/**
 * Get all exam IDs
 * @returns Array of all exam IDs
 */
export const getAllExamIds = (): string[] => {
  return EXAMS_DATA.map(exam => exam.id);
};

/**
 * Get exam statistics
 * @returns Object containing various statistics about the exams
 */
export const getExamStatistics = () => {
  const totalExams = EXAMS_DATA.length;
  const categories = getExamCategories();
  const totalSubjects = EXAMS_DATA.reduce((sum, exam) => sum + exam.defaultSyllabus.length, 0);
  const averageSubjectsPerExam = Math.round(totalSubjects / totalExams);

  return {
    totalExams,
    totalCategories: categories.length,
    categories,
    totalSubjects,
    averageSubjectsPerExam,
    examsByCategory: categories.map(category => ({
      category,
      count: getExamsByCategory(category).length,
    })),
  };
};
