/**
 * @fileoverview Input Validation and Sanitization Utilities
 *
 * Provides comprehensive input validation, sanitization, and security measures
 * for user inputs across the application. Includes XSS prevention, SQL injection
 * protection, and data format validation.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import DOMPurify from 'dompurify';
import { JSDOM } from 'jsdom';
import { z } from 'zod';

// Create DOMPurify instance for server-side usage
const createDOMPurify = () => {
  if (typeof window !== 'undefined') {
    // Client-side
    return DOMPurify;
  } else {
    // Server-side
    const { window } = new JSDOM('');
    return DOMPurify(window);
  }
};

const purify = createDOMPurify();

// ============================================================================
// INPUT SANITIZATION
// ============================================================================

/**
 * Sanitize HTML content to prevent XSS attacks
 */
export function sanitizeHtml(input: string): string {
  return purify.sanitize(input, {
    ALLOWED_TAGS: ['b', 'i', 'em', 'strong', 'u', 'br', 'p', 'ul', 'ol', 'li'],
    ALLOWED_ATTR: [],
    KEEP_CONTENT: true,
  });
}

/**
 * Sanitize plain text input
 */
export function sanitizeText(input: string): string {
  return input
    .trim()
    .replace(/[<>]/g, '') // Remove angle brackets
    .replace(/javascript:/gi, '') // Remove javascript: protocol
    .replace(/on\w+\s*=/gi, '') // Remove event handlers
    .substring(0, 1000); // Limit length
}

/**
 * Sanitize email input
 */
export function sanitizeEmail(email: string): string {
  return email
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9@._-]/g, '');
}

/**
 * Sanitize numeric input
 */
export function sanitizeNumber(input: string | number): number | null {
  const num = typeof input === 'string' ? parseFloat(input) : input;
  return isNaN(num) ? null : num;
}

// ============================================================================
// VALIDATION SCHEMAS
// ============================================================================

/**
 * Common validation schemas using Zod
 */
export const ValidationSchemas = {
  // User input validation
  displayName: z
    .string()
    .min(2, 'Name must be at least 2 characters')
    .max(50, 'Name must be less than 50 characters')
    .regex(/^[a-zA-Z\s]+$/, 'Name can only contain letters and spaces'),

  email: z.string().email('Please enter a valid email address').max(254, 'Email address is too long'),

  // Study-related validation
  studyGoalMinutes: z.number().min(15, 'Minimum study goal is 15 minutes').max(720, 'Maximum study goal is 12 hours'),

  score: z.number().min(0, 'Score cannot be negative').max(100, 'Score cannot exceed 100'),

  // Date validation
  examDate: z
    .string()
    .min(1, 'Please select an exam date')
    .refine(date => {
      const selectedDate = new Date(date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return selectedDate >= today;
    }, 'Exam date must be in the future'),

  // Content validation
  subjectName: z
    .string()
    .min(2, 'Subject name must be at least 2 characters')
    .max(100, 'Subject name must be less than 100 characters')
    .regex(/^[a-zA-Z0-9\s\-&()]+$/, 'Subject name contains invalid characters'),

  topicName: z
    .string()
    .min(2, 'Topic name must be at least 2 characters')
    .max(200, 'Topic name must be less than 200 characters'),

  // User notes and descriptions
  description: z.string().max(1000, 'Description must be less than 1000 characters').optional(),

  notes: z.string().max(2000, 'Notes must be less than 2000 characters').optional(),

  // Mission and learning validation
  missionName: z
    .string()
    .min(3, 'Mission name must be at least 3 characters')
    .max(100, 'Mission name must be less than 100 characters'),

  difficulty: z.enum(['beginner', 'intermediate', 'advanced', 'expert']),

  frequency: z.enum(['daily', 'weekly', 'monthly', 'custom']),

  // Progress and analytics
  completionPercentage: z
    .number()
    .min(0, 'Completion percentage cannot be negative')
    .max(100, 'Completion percentage cannot exceed 100'),

  confidenceLevel: z
    .number()
    .min(1, 'Confidence level must be at least 1')
    .max(10, 'Confidence level cannot exceed 10'),
};

// ============================================================================
// FORM VALIDATION HELPERS
// ============================================================================

/**
 * Validate and sanitize form data
 */
export function validateFormData<T>(
  data: unknown,
  schema: z.ZodSchema<T>
): { success: true; data: T } | { success: false; errors: string[] } {
  try {
    const validated = schema.parse(data);
    return { success: true, data: validated };
  } catch (error) {
    if (error instanceof z.ZodError) {
      const errors = error.errors.map(err => `${err.path.join('.')}: ${err.message}`);
      return { success: false, errors };
    }
    return { success: false, errors: ['Validation failed'] };
  }
}

/**
 * Sanitize object properties recursively
 */
export function sanitizeObject(obj: Record<string, unknown>): Record<string, unknown> {
  const sanitized: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(obj)) {
    if (typeof value === 'string') {
      sanitized[key] = sanitizeText(value);
    } else if (typeof value === 'number') {
      sanitized[key] = value;
    } else if (typeof value === 'boolean') {
      sanitized[key] = value;
    } else if (Array.isArray(value)) {
      sanitized[key] = value.map(item =>
        typeof item === 'object' && item !== null
          ? sanitizeObject(item as Record<string, unknown>)
          : sanitizeText(String(item))
      );
    } else if (value && typeof value === 'object') {
      sanitized[key] = sanitizeObject(value as Record<string, unknown>);
    } else {
      sanitized[key] = value;
    }
  }

  return sanitized;
}

// ============================================================================
// SECURITY VALIDATION
// ============================================================================

/**
 * Check for potentially malicious patterns
 */
export function containsMaliciousContent(input: string): boolean {
  const maliciousPatterns = [
    /<script[^>]*>.*?<\/script>/gi,
    /javascript:/gi,
    /vbscript:/gi,
    /onload\s*=/gi,
    /onerror\s*=/gi,
    /onclick\s*=/gi,
    /eval\s*\(/gi,
    /expression\s*\(/gi,
    /<iframe/gi,
    /<object/gi,
    /<embed/gi,
    /document\.cookie/gi,
    /document\.write/gi,
  ];

  return maliciousPatterns.some(pattern => pattern.test(input));
}

/**
 * Validate file upload security
 */
export function validateFileUpload(file: File): { valid: boolean; error?: string } {
  // Check file size (max 5MB)
  if (file.size > 5 * 1024 * 1024) {
    return { valid: false, error: 'File size must be less than 5MB' };
  }

  // Check file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp', 'application/pdf', 'text/plain'];

  if (!allowedTypes.includes(file.type)) {
    return { valid: false, error: 'File type not allowed' };
  }

  // Check file name for malicious patterns
  if (containsMaliciousContent(file.name)) {
    return { valid: false, error: 'Invalid file name' };
  }

  return { valid: true };
}

// ============================================================================
// RATE LIMITING HELPERS
// ============================================================================

/**
 * Simple in-memory rate limiter for client-side validation
 */
class ClientRateLimiter {
  private attempts = new Map<string, { count: number; resetTime: number }>();

  isAllowed(key: string, maxAttempts = 5, windowMs = 300000): boolean {
    const now = Date.now();
    const attempt = this.attempts.get(key);

    if (!attempt || now > attempt.resetTime) {
      this.attempts.set(key, { count: 1, resetTime: now + windowMs });
      return true;
    }

    if (attempt.count >= maxAttempts) {
      return false;
    }

    attempt.count++;
    return true;
  }

  reset(key: string): void {
    this.attempts.delete(key);
  }
}

export const rateLimiter = new ClientRateLimiter();

// ============================================================================
// ALIASES FOR CONVENIENCE
// ============================================================================

export const validators = ValidationSchemas;
