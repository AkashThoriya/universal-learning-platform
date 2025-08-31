/**
 * @fileoverview Production-Ready Logging Service
 *
 * Centralized logging system that replaces console statements with
 * proper production logging, error reporting, and debugging tools.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

type LogLevel = 'debug' | 'info' | 'warn' | 'error';

interface LogEntry {
  level: LogLevel;
  message: string;
  timestamp: string;
  context?: Record<string, any>;
  error?: Error;
  userId?: string;
  sessionId?: string;
}

class Logger {
  private isDevelopment = process.env.NODE_ENV === 'development';
  private sessionId = this.generateSessionId();

  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  private createLogEntry(level: LogLevel, message: string, context?: Record<string, any>, error?: Error): LogEntry {
    const userId = this.getCurrentUserId();
    return {
      level,
      message,
      timestamp: new Date().toISOString(),
      ...(context !== undefined && { context }),
      ...(error !== undefined && { error }),
      sessionId: this.sessionId,
      ...(userId !== undefined && { userId }),
    };
  }

  private getCurrentUserId(): string | undefined {
    // Get user ID from auth context if available
    if (typeof window !== 'undefined') {
      try {
        const authData = localStorage.getItem('auth-user');
        return authData ? JSON.parse(authData).uid : undefined;
      } catch {
        return undefined;
      }
    }
    return undefined;
  }

  private shouldLog(level: LogLevel): boolean {
    if (this.isDevelopment) {
      return true;
    }

    // In production, only log warn and error
    return level === 'warn' || level === 'error';
  }

  private formatMessage(entry: LogEntry): string {
    const { level, message, timestamp, context, userId } = entry;
    const userInfo = userId ? ` [User: ${userId}]` : '';
    const contextInfo = context ? ` [Context: ${JSON.stringify(context)}]` : '';

    return `[${timestamp}] ${level.toUpperCase()}${userInfo}: ${message}${contextInfo}`;
  }

  private outputLog(entry: LogEntry): void {
    const formattedMessage = this.formatMessage(entry);

    switch (entry.level) {
      case 'debug':
        console.debug(formattedMessage, entry.context);
        break;
      case 'info':
        console.info(formattedMessage, entry.context);
        break;
      case 'warn':
        console.warn(formattedMessage, entry.context);
        break;
      case 'error':
        console.error(formattedMessage, entry.error || entry.context);
        break;
    }
  }

  private async reportToExternalService(entry: LogEntry): Promise<void> {
    // In production, send critical errors to external monitoring service
    if (!this.isDevelopment && entry.level === 'error') {
      try {
        // TODO: Implement external error reporting (Sentry, LogRocket, etc.)
        // await this.sendToErrorReporting(entry);
      } catch (_error) {
        // Silently fail external reporting to avoid infinite loops
      }
    }
  }

  /**
   * Log debug information (development only)
   */
  debug(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('debug')) {
      return;
    }

    const entry = this.createLogEntry('debug', message, context);
    this.outputLog(entry);
  }

  /**
   * Log general information
   */
  info(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('info')) {
      return;
    }

    const entry = this.createLogEntry('info', message, context);
    this.outputLog(entry);
  }

  /**
   * Log warnings
   */
  warn(message: string, context?: Record<string, any>): void {
    if (!this.shouldLog('warn')) {
      return;
    }

    const entry = this.createLogEntry('warn', message, context);
    this.outputLog(entry);
    this.reportToExternalService(entry);
  }

  /**
   * Log errors
   */
  error(message: string, error?: Error | Record<string, any>): void {
    if (!this.shouldLog('error')) {
      return;
    }

    const errorObj = error instanceof Error ? error : undefined;
    const context = error instanceof Error ? undefined : error;

    const entry = this.createLogEntry('error', message, context, errorObj);
    this.outputLog(entry);
    this.reportToExternalService(entry);
  }

  /**
   * Track user actions for analytics
   */
  track(event: string, properties?: Record<string, any>): void {
    if (this.isDevelopment) {
      this.debug(`Track Event: ${event}`, properties);
    }

    // TODO: Implement analytics tracking
    // await this.sendToAnalytics(event, properties);
  }

  /**
   * Performance monitoring
   */
  perf(operation: string, duration: number, context?: Record<string, any>): void {
    const message = `Performance: ${operation} took ${duration}ms`;

    if (duration > 1000) {
      this.warn(message, context);
    } else {
      this.debug(message, context);
    }
  }
}

// Export singleton instance
export const logger = new Logger();

// Convenience functions for common patterns
export const logError = (message: string, error?: Error | Record<string, any>) => {
  logger.error(message, error);
};

export const logWarning = (message: string, context?: Record<string, any>) => {
  logger.warn(message, context);
};

export const logInfo = (message: string, context?: Record<string, any>) => {
  logger.info(message, context);
};

export const logDebug = (message: string, context?: Record<string, any>) => {
  logger.debug(message, context);
};

export const trackEvent = (event: string, properties?: Record<string, any>) => {
  logger.track(event, properties);
};

export const measurePerformance = async <T>(
  operation: string,
  fn: () => Promise<T> | T,
  context?: Record<string, any>
): Promise<T> => {
  const start = performance.now();
  try {
    const result = await fn();
    const duration = performance.now() - start;
    logger.perf(operation, duration, context);
    return result;
  } catch (error) {
    const duration = performance.now() - start;
    logger.error(`${operation} failed after ${duration}ms`, error as Error);
    throw error;
  }
};

export default logger;
