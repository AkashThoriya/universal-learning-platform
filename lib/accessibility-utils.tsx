'use client';

/**
 * @fileoverview Accessibility Utilities and Components
 *
 * Comprehensive accessibility utilities to ensure WCAG 2.1 AA compliance
 * throughout the application. Includes focus management, screen reader
 * support, keyboard navigation, and accessibility testing helpers.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import React, { useEffect, useRef, useState, useCallback } from 'react';

// ============================================================================
// FOCUS MANAGEMENT
// ============================================================================

/**
 * Focus trap hook for modals and dialogs
 */
export function useFocusTrap(isActive = true) {
  const containerRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !containerRef.current) { return; }

    const container = containerRef.current;
    const focusableElements = container.querySelectorAll(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );

    const firstElement = focusableElements[0] as HTMLElement;
    const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

    // Focus first element when trap activates
    if (firstElement) {
      firstElement.focus();
    }

    const handleTabKey = (e: KeyboardEvent) => {
      if (e.key !== 'Tab') { return; }

      if (e.shiftKey) {
        // Shift + Tab
        if (document.activeElement === firstElement) {
          e.preventDefault();
          lastElement?.focus();
        }
      } else {
        // Tab
        if (document.activeElement === lastElement) {
          e.preventDefault();
          firstElement?.focus();
        }
      }
    };

    container.addEventListener('keydown', handleTabKey);

    return () => {
      container.removeEventListener('keydown', handleTabKey);
    };
  }, [isActive]);

  return containerRef;
}

/**
 * Skip to content link for keyboard navigation
 */
export function SkipToContent({ targetId }: { targetId: string }) {
  const handleSkip = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      const target = document.getElementById(targetId);
      if (target) {
        target.focus();
        target.scrollIntoView({ behavior: 'smooth' });
      }
    }
  };

  return (
    <a
      href={`#${targetId}`}
      className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:z-50 bg-blue-600 text-white px-4 py-2 rounded-md text-sm font-medium"
      onKeyDown={handleSkip}
    >
      Skip to main content
    </a>
  );
}

// ============================================================================
// SCREEN READER UTILITIES
// ============================================================================

/**
 * Live region for screen reader announcements
 */
export function LiveRegion({
  children,
  politeness = 'polite' as 'polite' | 'assertive',
  atomic = false
}: {
  children: React.ReactNode;
  politeness?: 'polite' | 'assertive';
  atomic?: boolean;
}) {
  return (
    <div
      role="status"
      aria-live={politeness}
      aria-atomic={atomic}
      className="sr-only"
    >
      {children}
    </div>
  );
}

/**
 * Hook for making announcements to screen readers
 */
export function useScreenReader() {
  const [announcement, setAnnouncement] = useState('');

  const announce = useCallback((message: string, _priority: 'polite' | 'assertive' = 'polite') => {
    setAnnouncement(''); // Clear first to ensure re-announcement
    setTimeout(() => setAnnouncement(message), 100);
  }, []);

  const AnnouncementRegion = () => (
    <LiveRegion politeness="polite">
      {announcement}
    </LiveRegion>
  );

  return { announce, AnnouncementRegion };
}

// ============================================================================
// KEYBOARD NAVIGATION
// ============================================================================

/**
 * Enhanced button with keyboard and accessibility support
 */
export function AccessibleButton({
  children,
  onClick,
  disabled = false,
  variant = 'primary',
  size = 'medium',
  ariaLabel,
  ariaDescribedBy,
  ...props
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  variant?: 'primary' | 'secondary' | 'danger';
  size?: 'small' | 'medium' | 'large';
  ariaLabel?: string;
  ariaDescribedBy?: string;
  [key: string]: any;
}) {
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if ((e.key === 'Enter' || e.key === ' ') && !disabled) {
      e.preventDefault();
      onClick?.();
    }
  };

  const baseClasses = 'inline-flex items-center justify-center rounded-md font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-offset-2';

  const variantClasses = {
    primary: 'bg-blue-600 text-white hover:bg-blue-700 focus:ring-blue-500',
    secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 focus:ring-gray-500',
    danger: 'bg-red-600 text-white hover:bg-red-700 focus:ring-red-500'
  };

  const sizeClasses = {
    small: 'px-3 py-1.5 text-sm',
    medium: 'px-4 py-2 text-sm',
    large: 'px-6 py-3 text-base'
  };

  const disabledClasses = disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer';

  return (
    <button
      type="button"
      className={`${baseClasses} ${variantClasses[variant]} ${sizeClasses[size]} ${disabledClasses}`}
      onClick={onClick}
      onKeyDown={handleKeyDown}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-describedby={ariaDescribedBy}
      {...props}
    >
      {children}
    </button>
  );
}

/**
 * Keyboard navigation for lists
 */
export function useKeyboardNavigation(itemCount: number, isActive = true) {
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef<HTMLElement>(null);

  useEffect(() => {
    if (!isActive || !listRef.current) { return; }

    const handleKeyDown = (e: KeyboardEvent) => {
      switch (e.key) {
        case 'ArrowDown':
          e.preventDefault();
          setActiveIndex(prev => (prev + 1) % itemCount);
          break;
        case 'ArrowUp':
          e.preventDefault();
          setActiveIndex(prev => (prev - 1 + itemCount) % itemCount);
          break;
        case 'Home':
          e.preventDefault();
          setActiveIndex(0);
          break;
        case 'End':
          e.preventDefault();
          setActiveIndex(itemCount - 1);
          break;
      }
    };

    const container = listRef.current;
    container.addEventListener('keydown', handleKeyDown);

    return () => {
      container.removeEventListener('keydown', handleKeyDown);
    };
  }, [itemCount, isActive]);

  return { activeIndex, setActiveIndex, listRef };
}

// ============================================================================
// FORM ACCESSIBILITY
// ============================================================================

/**
 * Accessible form field with proper labeling and error handling
 */
export function AccessibleFormField({
  id,
  label,
  type = 'text',
  value,
  onChange,
  error,
  helpText,
  required = false,
  disabled = false,
  placeholder,
  autoComplete,
  ...props
}: {
  id: string;
  label: string;
  type?: string;
  value: string;
  onChange: (value: string) => void;
  error?: string;
  helpText?: string;
  required?: boolean;
  disabled?: boolean;
  placeholder?: string;
  autoComplete?: string;
  [key: string]: any;
}) {
  const errorId = `${id}-error`;
  const helpId = `${id}-help`;
  const describedBy = [
    error ? errorId : null,
    helpText ? helpId : null
  ].filter(Boolean).join(' ');

  return (
    <div className="space-y-1">
      <label
        htmlFor={id}
        className={`block text-sm font-medium ${disabled ? 'text-gray-400' : 'text-gray-700'}`}
      >
        {label}
        {required && <span className="text-red-500 ml-1" aria-label="required">*</span>}
      </label>

      <input
        id={id}
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        required={required}
        placeholder={placeholder}
        autoComplete={autoComplete}
        aria-describedby={describedBy || undefined}
        aria-invalid={error ? 'true' : 'false'}
        className={`block w-full px-3 py-2 border rounded-md shadow-sm focus:outline-none focus:ring-2 focus:ring-offset-2 sm:text-sm ${
          error
            ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
            : 'border-gray-300 focus:ring-blue-500 focus:border-blue-500'
        } ${disabled ? 'bg-gray-50 cursor-not-allowed' : 'bg-white'}`}
        {...props}
      />

      {helpText && (
        <p id={helpId} className="text-sm text-gray-500">
          {helpText}
        </p>
      )}

      {error && (
        <p id={errorId} className="text-sm text-red-600" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}

// ============================================================================
// COLOR CONTRAST AND VISIBILITY
// ============================================================================

/**
 * Check if color contrast meets WCAG standards
 */
export function getContrastRatio(color1: string, color2: string): number {
  // Simplified contrast ratio calculation
  // In a real implementation, you'd use a proper color parsing library
  const getLuminance = (color: string) => {
    // This is a simplified version - use a proper color library in production
    const hex = color.replace('#', '');
    const r = parseInt(hex.substr(0, 2), 16) / 255;
    const g = parseInt(hex.substr(2, 2), 16) / 255;
    const b = parseInt(hex.substr(4, 2), 16) / 255;

    const sRGB = [r, g, b].map(c => {
      return c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
    });

    // Ensure sRGB array has exactly 3 elements
    if (sRGB.length !== 3 || sRGB.some(val => val === undefined)) {
      return 0; // Return fallback luminance
    }

    return 0.2126 * sRGB[0]! + 0.7152 * sRGB[1]! + 0.0722 * sRGB[2]!;
  };

  const l1 = getLuminance(color1);
  const l2 = getLuminance(color2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);

  return (lighter + 0.05) / (darker + 0.05);
}

/**
 * Reduced motion detection
 */
export function useReducedMotion(): boolean {
  const [prefersReducedMotion, setPrefersReducedMotion] = useState(false);

  useEffect(() => {
    const mediaQuery = window.matchMedia('(prefers-reduced-motion: reduce)');
    setPrefersReducedMotion(mediaQuery.matches);

    const handleChange = (e: MediaQueryListEvent) => {
      setPrefersReducedMotion(e.matches);
    };

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, []);

  return prefersReducedMotion;
}

// ============================================================================
// ACCESSIBILITY TESTING HELPERS
// ============================================================================

/**
 * Development-only accessibility checker
 */
export function AccessibilityChecker({ children }: { children: React.ReactNode }) {
  useEffect(() => {
    if (process.env.NODE_ENV !== 'development') { return; }

    // Check for missing alt text on images
    const images = document.querySelectorAll('img:not([alt])');
    if (images.length > 0) {
      console.warn('Accessibility: Found images without alt text:', images);
    }

    // Check for missing form labels
    const inputs = document.querySelectorAll('input:not([aria-label]):not([aria-labelledby])');
    const unlabeledInputs = Array.from(inputs).filter(input => {
      const id = input.getAttribute('id');
      return !id || !document.querySelector(`label[for="${id}"]`);
    });

    if (unlabeledInputs.length > 0) {
      console.warn('Accessibility: Found inputs without proper labels:', unlabeledInputs);
    }

    // Check for missing headings
    const headings = document.querySelectorAll('h1, h2, h3, h4, h5, h6');
    if (headings.length === 0) {
      console.warn('Accessibility: No heading elements found on page');
    }
  }, []);

  return <>{children}</>;
}

// All exports are handled inline above - no need for duplicate export block
