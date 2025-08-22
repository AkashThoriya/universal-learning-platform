/**
 * @fileoverview Persona-Aware Goal Setting Engine
 * 
 * Calculates realistic study goals based on user persona and work schedule.
 * Adapts study time recommendations for different lifestyle contexts.
 * 
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { UserPersona, WorkSchedule } from '@/types/exam';

/**
 * Persona-aware goal setting utilities
 */
export class PersonaAwareGoalSetting {
  
  /**
   * Calculate realistic daily study goal based on user persona
   * 
   * @param persona - User persona configuration
   * @returns Recommended daily study time in minutes
   */
  static calculateRealisticStudyGoal(persona: UserPersona): number {
    switch (persona.type) {
      case 'student':
        return 480; // 8 hours - traditional assumption for full-time students
        
      case 'working_professional':
        if (!persona.workSchedule) {
          return 120; // 2 hours - conservative default if no schedule provided
        }
        const { workSchedule } = persona;
        const weekdayMinutes = this.calculateWeekdayAvailability(workSchedule);
        const weekendMinutes = this.calculateWeekendAvailability(workSchedule);
        
        // Calculate average across week (5 weekdays + 2 weekend days)
        return Math.floor((weekdayMinutes * 5 + weekendMinutes * 2) / 7);
        
      case 'freelancer':
        return 360; // 6 hours - flexible but unpredictable schedule
        
      default:
        return 240; // 4 hours - conservative default
    }
  }
  
  /**
   * Calculate available study time on weekdays for working professionals
   * 
   * @param schedule - Work schedule configuration
   * @returns Available minutes for study on weekdays
   */
  private static calculateWeekdayAvailability(schedule: WorkSchedule): number {
    const workStart = this.parseTime(schedule.workingHours.start);
    const workEnd = this.parseTime(schedule.workingHours.end);
    
    // Available time = Early morning + Evening - commute time - buffer time
    const morningTime = Math.max(0, workStart - 6) * 60; // Assume 6 AM earliest start
    const eveningTime = Math.max(0, 23 - workEnd) * 60; // Assume 11 PM latest end
    
    // Subtract commute time and add 30-minute buffer for work transition
    const totalAvailable = morningTime + eveningTime - schedule.commuteTime - 30;
    
    // Minimum 1 hour (60 minutes) to ensure achievable goals
    return Math.max(60, totalAvailable);
  }
  
  /**
   * Calculate available study time on weekends for working professionals
   * 
   * @param schedule - Work schedule configuration
   * @returns Available minutes for study on weekends
   */
  private static calculateWeekendAvailability(schedule: WorkSchedule): number {
    const isWeekendWorker = schedule.workingDays.includes('saturday') || 
                           schedule.workingDays.includes('sunday');
    
    if (isWeekendWorker) {
      // If works on weekends, reduce availability
      return schedule.flexibility === 'rigid' ? 240 : 360; // 4-6 hours
    }
    
    // Full weekends available - assume 6-8 hours depending on flexibility
    return schedule.flexibility === 'rigid' ? 360 : 480; // 6-8 hours
  }
  
  /**
   * Parse time string to hour number (24-hour format)
   * 
   * @param timeString - Time in "HH:MM" format (e.g., "09:00")
   * @returns Hour as number (0-23)
   */
  private static parseTime(timeString: string): number {
    const [hours] = timeString.split(':');
    return parseInt(hours, 10);
  }
  
  /**
   * Format hour number back to time string
   * 
   * @param hour - Hour as number (0-23)
   * @returns Time string in "HH:MM" format
   */
  private static formatTime(hour: number): string {
    return `${hour.toString().padStart(2, '0')}:00`;
  }
  
  /**
   * Get personalized study time recommendations
   * 
   * @param persona - User persona configuration
   * @returns Study time recommendations and tips
   */
  static getStudyTimeRecommendations(persona: UserPersona): {
    recommendedGoal: number;
    minGoal: number;
    maxGoal: number;
    tips: string[];
    timeSlots: string[];
  } {
    const recommendedGoal = this.calculateRealisticStudyGoal(persona);
    
    switch (persona.type) {
      case 'student':
        return {
          recommendedGoal,
          minGoal: 240, // 4 hours minimum
          maxGoal: 720, // 12 hours maximum
          tips: [
            'Take regular breaks to maintain focus',
            'Use deep work blocks for complex topics',
            'Schedule lighter topics during low-energy periods'
          ],
          timeSlots: ['Morning (6-12)', 'Afternoon (2-6)', 'Evening (7-11)']
        };
        
      case 'working_professional':
        return {
          recommendedGoal,
          minGoal: 60, // 1 hour minimum
          maxGoal: 300, // 5 hours maximum on weekdays
          tips: [
            'Utilize commute time for audio learning',
            'Use lunch breaks for quick reviews',
            'Focus on high-impact topics during limited time',
            'Dedicate weekends for intensive study sessions'
          ],
          timeSlots: this.getWorkingProfessionalTimeSlots(persona.workSchedule)
        };
        
      case 'freelancer':
        return {
          recommendedGoal,
          minGoal: 120, // 2 hours minimum
          maxGoal: 600, // 10 hours maximum
          tips: [
            'Block time slots like client work',
            'Use project gaps for study sessions',
            'Maintain consistent daily study routine',
            'Track time to ensure progress'
          ],
          timeSlots: ['Early Morning', 'Mid-day Break', 'Evening Wind-down']
        };
        
      default:
        return {
          recommendedGoal,
          minGoal: 60,
          maxGoal: 480,
          tips: ['Start with small, consistent goals', 'Build study habits gradually'],
          timeSlots: ['Morning', 'Evening']
        };
    }
  }
  
  /**
   * Get recommended time slots for working professionals
   * 
   * @param workSchedule - Work schedule configuration
   * @returns Array of time slot descriptions
   */
  private static getWorkingProfessionalTimeSlots(workSchedule?: WorkSchedule): string[] {
    if (!workSchedule) {
      return ['Early Morning', 'Evening After Work'];
    }
    
    const slots: string[] = [];
    const workStart = this.parseTime(workSchedule.workingHours.start);
    const workEnd = this.parseTime(workSchedule.workingHours.end);
    
    // Early morning slot
    if (workStart > 7) {
      slots.push(`Early Morning (6:00-${workSchedule.workingHours.start})`);
    }
    
    // Lunch break slot
    if (workSchedule.lunchBreakDuration >= 30) {
      slots.push('Lunch Break (Quick Review)');
    }
    
    // Evening slot
    if (workEnd < 22) {
      const eveningStart = this.formatTime(workEnd + 1);
      slots.push(`Evening (${eveningStart}-23:00)`);
    }
    
    // Weekend intensive
    const isWeekendWorker = workSchedule.workingDays.includes('saturday') || 
                           workSchedule.workingDays.includes('sunday');
    if (!isWeekendWorker) {
      slots.push('Weekend Intensive Sessions');
    }
    
    return slots.length > 0 ? slots : ['Evening After Work', 'Weekends'];
  }
  
  /**
   * Validate and adjust study goal based on persona constraints
   * 
   * @param goal - Proposed study goal in minutes
   * @param persona - User persona configuration
   * @returns Adjusted study goal within realistic bounds
   */
  static validateStudyGoal(goal: number, persona: UserPersona): number {
    const recommendations = this.getStudyTimeRecommendations(persona);
    
    // Ensure goal is within recommended bounds
    if (goal < recommendations.minGoal) {
      return recommendations.minGoal;
    }
    
    if (goal > recommendations.maxGoal) {
      return recommendations.maxGoal;
    }
    
    return goal;
  }
}
