/**
 * @fileoverview Database Abstraction Layer - Main Export
 *
 * Main entry point for the database abstraction layer that provides
 * a unified interface for database operations while maintaining
 * backward compatibility with the existing Firebase implementation.
 *
 * @author Universal Learning Platform Team
 * @version 1.0.0
 */

// Quick access imports for common usage
import { databaseService as mainDbService, enhancedDatabaseService, firebaseService } from './service';

// Core interfaces and types
export * from './interfaces';

// Repository pattern implementations
export * from './repositories';

// Factory and configuration
export * from './factory';

// Enhanced service layer
export * from './service';

// Database providers
export { FirebaseDatabaseProvider } from './firebase-provider';

// Default export for easy migration from firebase-services.ts
export default mainDbService;

// Backward compatibility export
export { firebaseService, enhancedDatabaseService };

// Legacy export names for existing code
export const databaseService = mainDbService;
export const db = mainDbService;
