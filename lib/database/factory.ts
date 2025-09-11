/**
 * @fileoverview Database Factory and Configuration
 *
 * Factory for creating database providers and managing configurations
 * for different database backends.
 *
 * @author Exam Strategy Engine Team
 * @version 1.0.0
 */

import { FirebaseDatabaseProvider } from './firebase-provider';
import { DatabaseProvider, DatabaseFactory, DatabaseConfig } from './interfaces';

/**
 * Configuration validation utilities
 */
class ConfigValidator {
  static validateFirebaseConfig(config: unknown): boolean {
    const required = ['apiKey', 'authDomain', 'projectId', 'storageBucket', 'messagingSenderId', 'appId'];

    const typedConfig = config as { connection?: Record<string, unknown> };

    return required.every(
      key =>
        typedConfig.connection &&
        typeof typedConfig.connection[key] === 'string' &&
        typedConfig.connection[key].length > 0
    );
  }

  static validatePostgreSQLConfig(config: unknown): boolean {
    const required = ['host', 'port', 'database', 'username', 'password'];
    const typedConfig = config as { connection?: Record<string, unknown> };
    return required.every(key => typedConfig.connection && typedConfig.connection[key] !== undefined);
  }

  static validateMongoDBConfig(config: unknown): boolean {
    const typedConfig = config as { connection?: { uri?: string } };
    return !!(
      typedConfig.connection &&
      typeof typedConfig.connection.uri === 'string' &&
      typedConfig.connection.uri.length > 0
    );
  }

  static validateSupabaseConfig(config: unknown): boolean {
    const required = ['url', 'anonKey'];
    const typedConfig = config as { connection?: Record<string, unknown> };
    return required.every(
      key =>
        typedConfig.connection &&
        typeof typedConfig.connection[key] === 'string' &&
        typedConfig.connection[key].length > 0
    );
  }

  static validateSQLiteConfig(config: unknown): boolean {
    const typedConfig = config as { connection?: { path?: string } };
    return !!(typedConfig.connection && typeof typedConfig.connection.path === 'string');
  }
}

/**
 * Main database factory implementation
 */
export class ExamEngineDatabaseFactory implements DatabaseFactory {
  private static instance: ExamEngineDatabaseFactory;
  private providers = new Map<string, DatabaseProvider>();

  private constructor() {}

  static getInstance(): ExamEngineDatabaseFactory {
    if (!this.instance) {
      this.instance = new ExamEngineDatabaseFactory();
    }
    return this.instance;
  }

  createProvider(config: DatabaseConfig): DatabaseProvider {
    const providerId = this.generateProviderId(config);

    // Return existing provider if already created
    if (this.providers.has(providerId)) {
      const existingProvider = this.providers.get(providerId);
      if (!existingProvider) {
        throw new Error(`Provider not found for ID: ${providerId}`);
      }
      return existingProvider;
    }

    // Validate configuration
    if (!this.validateConfig(config.provider, config)) {
      throw new Error(`Invalid configuration for provider: ${config.provider}`);
    }

    // Create new provider based on type
    let provider: DatabaseProvider;

    switch (config.provider) {
      case 'firebase':
        provider = new FirebaseDatabaseProvider();
        break;

      case 'postgresql':
        provider = this.createPostgreSQLProvider(config);
        break;

      case 'mongodb':
        provider = this.createMongoDBProvider(config);
        break;

      case 'supabase':
        provider = this.createSupabaseProvider(config);
        break;

      case 'sqlite':
        provider = this.createSQLiteProvider(config);
        break;

      default:
        throw new Error(`Unsupported database provider: ${config.provider}`);
    }

    // Cache the provider
    this.providers.set(providerId, provider);

    return provider;
  }

  getSupportedProviders(): string[] {
    return ['firebase', 'postgresql', 'mongodb', 'supabase', 'sqlite'];
  }

  validateConfig(provider: string, config: unknown): boolean {
    switch (provider) {
      case 'firebase':
        return ConfigValidator.validateFirebaseConfig(config);
      case 'postgresql':
        return ConfigValidator.validatePostgreSQLConfig(config);
      case 'mongodb':
        return ConfigValidator.validateMongoDBConfig(config);
      case 'supabase':
        return ConfigValidator.validateSupabaseConfig(config);
      case 'sqlite':
        return ConfigValidator.validateSQLiteConfig(config);
      default:
        return false;
    }
  }

  // Provider-specific factory methods
  private createPostgreSQLProvider(_config: DatabaseConfig): DatabaseProvider {
    // Placeholder for PostgreSQL provider
    // In real implementation, this would create a PostgreSQL adapter
    throw new Error('PostgreSQL provider not yet implemented');
  }

  private createMongoDBProvider(_config: DatabaseConfig): DatabaseProvider {
    // Placeholder for MongoDB provider
    // In real implementation, this would create a MongoDB adapter
    throw new Error('MongoDB provider not yet implemented');
  }

  private createSupabaseProvider(_config: DatabaseConfig): DatabaseProvider {
    // Placeholder for Supabase provider
    // In real implementation, this would create a Supabase adapter
    throw new Error('Supabase provider not yet implemented');
  }

  private createSQLiteProvider(_config: DatabaseConfig): DatabaseProvider {
    // Placeholder for SQLite provider
    // In real implementation, this would create a SQLite adapter
    throw new Error('SQLite provider not yet implemented');
  }

  private generateProviderId(config: DatabaseConfig): string {
    // Generate unique ID based on provider type and connection config
    const connectionStr = JSON.stringify(config.connection);
    return `${config.provider}-${this.hashString(connectionStr)}`;
  }

  private hashString(str: string): string {
    let hash = 0;
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i);
      hash = (hash << 5) - hash + char;
      hash = hash & hash; // Convert to 32-bit integer
    }
    return hash.toString();
  }

  // Utility methods for common configurations
  createFirebaseConfig(firebaseConfig: {
    apiKey: string;
    authDomain: string;
    projectId: string;
    storageBucket: string;
    messagingSenderId: string;
    appId: string;
    measurementId?: string;
  }): DatabaseConfig {
    return {
      provider: 'firebase',
      connection: firebaseConfig,
      caching: {
        enabled: true,
        defaultTTL: 300000, // 5 minutes
        maxSize: 1000,
      },
      offline: {
        enableOfflineWrite: true,
        conflictResolution: 'client',
        syncStrategy: 'immediate',
      },
      performance: {
        enableMetrics: true,
        slowQueryThreshold: 1000,
      },
    };
  }

  createPostgreSQLConfig(connectionConfig: {
    host: string;
    port: number;
    database: string;
    username: string;
    password: string;
    ssl?: boolean;
  }): DatabaseConfig {
    return {
      provider: 'postgresql',
      connection: connectionConfig,
      caching: {
        enabled: true,
        defaultTTL: 180000, // 3 minutes
        maxSize: 500,
      },
      performance: {
        enableMetrics: true,
        slowQueryThreshold: 2000,
      },
    };
  }

  createMongoDBConfig(connectionConfig: { uri: string; options?: unknown }): DatabaseConfig {
    return {
      provider: 'mongodb',
      connection: connectionConfig,
      caching: {
        enabled: true,
        defaultTTL: 240000, // 4 minutes
        maxSize: 750,
      },
      performance: {
        enableMetrics: true,
        slowQueryThreshold: 1500,
      },
    };
  }

  createSupabaseConfig(connectionConfig: { url: string; anonKey: string; serviceRoleKey?: string }): DatabaseConfig {
    return {
      provider: 'supabase',
      connection: connectionConfig,
      caching: {
        enabled: true,
        defaultTTL: 300000, // 5 minutes
        maxSize: 1000,
      },
      offline: {
        enableOfflineWrite: false, // Supabase handles this
        conflictResolution: 'server',
        syncStrategy: 'batch',
      },
      performance: {
        enableMetrics: true,
        slowQueryThreshold: 1000,
      },
    };
  }

  // Cleanup methods
  async cleanup(): Promise<void> {
    const providers = Array.from(this.providers.values());
    for (const provider of providers) {
      try {
        await provider.disconnect();
      } catch (error) {
        console.error('Error disconnecting provider:', error);
      }
    }
    this.providers.clear();
  }

  getActiveProviders(): string[] {
    return Array.from(this.providers.keys());
  }
}

// Export singleton instance
export const databaseFactory = ExamEngineDatabaseFactory.getInstance();

/**
 * Environment-based configuration helpers
 */
export class DatabaseConfigHelper {
  static getFirebaseConfigFromEnv(): DatabaseConfig {
    const requiredEnvVars = [
      'NEXT_PUBLIC_FIREBASE_API_KEY',
      'NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN',
      'NEXT_PUBLIC_FIREBASE_PROJECT_ID',
      'NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET',
      'NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID',
      'NEXT_PUBLIC_FIREBASE_APP_ID',
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
      throw new Error(`Missing Firebase environment variables: ${missing.join(', ')}`);
    }

    // Extract validated environment variables
    const apiKey = process.env.NEXT_PUBLIC_FIREBASE_API_KEY;
    const authDomain = process.env.NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN;
    const projectId = process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID;
    const storageBucket = process.env.NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET;
    const messagingSenderId = process.env.NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID;
    const appId = process.env.NEXT_PUBLIC_FIREBASE_APP_ID;

    // TypeScript guard - should never happen due to validation above
    if (!apiKey || !authDomain || !projectId || !storageBucket || !messagingSenderId || !appId) {
      throw new Error('Firebase configuration validation failed');
    }

    const config = {
      apiKey,
      authDomain,
      projectId,
      storageBucket,
      messagingSenderId,
      appId,
      ...(process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID && {
        measurementId: process.env.NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID,
      }),
    };

    return databaseFactory.createFirebaseConfig(config);
  }

  static getPostgreSQLConfigFromEnv(): DatabaseConfig {
    const requiredEnvVars = [
      'DATABASE_HOST',
      'DATABASE_PORT',
      'DATABASE_NAME',
      'DATABASE_USERNAME',
      'DATABASE_PASSWORD',
    ];

    const missing = requiredEnvVars.filter(varName => !process.env[varName]);
    if (missing.length > 0) {
      throw new Error(`Missing PostgreSQL environment variables: ${missing.join(', ')}`);
    }

    // Extract validated environment variables
    const host = process.env.DATABASE_HOST;
    const port = process.env.DATABASE_PORT;
    const database = process.env.DATABASE_NAME;
    const username = process.env.DATABASE_USERNAME;
    const password = process.env.DATABASE_PASSWORD;

    // TypeScript guard - should never happen due to validation above
    if (!host || !port || !database || !username || !password) {
      throw new Error('PostgreSQL configuration validation failed');
    }

    return databaseFactory.createPostgreSQLConfig({
      host,
      port: parseInt(port),
      database,
      username,
      password,
      ssl: process.env.DATABASE_SSL === 'true',
    });
  }

  static getConfigFromEnv(): DatabaseConfig {
    const provider = process.env.DATABASE_PROVIDER ?? 'firebase';

    switch (provider) {
      case 'firebase':
        return this.getFirebaseConfigFromEnv();
      case 'postgresql':
        return this.getPostgreSQLConfigFromEnv();
      default:
        throw new Error(`Unsupported database provider in environment: ${provider}`);
    }
  }
}

/**
 * High-level database service that manages providers and repositories
 */
export class DatabaseService {
  private provider: DatabaseProvider;
  private config: DatabaseConfig;

  constructor(config?: DatabaseConfig) {
    this.config = config || DatabaseConfigHelper.getConfigFromEnv();
    this.provider = databaseFactory.createProvider(this.config);
  }

  async initialize(): Promise<void> {
    await this.provider.connect();

    if (this.config.offline?.enableOfflineWrite) {
      await this.provider.enableOffline(this.config.offline);
    }
  }

  getProvider(): DatabaseProvider {
    return this.provider;
  }

  getConfig(): DatabaseConfig {
    return this.config;
  }

  async switchProvider(newConfig: DatabaseConfig): Promise<void> {
    // Disconnect current provider
    await this.provider.disconnect();

    // Create new provider
    this.config = newConfig;
    this.provider = databaseFactory.createProvider(newConfig);

    // Initialize new provider
    await this.initialize();
  }

  async migrate(_targetConfig: DatabaseConfig): Promise<void> {
    // This would implement data migration between providers
    // For now, it's a placeholder
    // console.log(`Migration from ${this.config.provider} to ${targetConfig.provider} started`);

    // In real implementation:
    // 1. Export all data from current provider
    // 2. Transform data format if needed
    // 3. Import data to new provider
    // 4. Verify data integrity
    // 5. Switch to new provider

    throw new Error('Migration not yet implemented');
  }

  async cleanup(): Promise<void> {
    await this.provider.disconnect();
  }

  // Performance monitoring
  async getPerformanceReport(): Promise<{
    provider: string;
    connection: unknown;
    performance: unknown;
  }> {
    const status = this.provider.getConnectionStatus();

    return {
      provider: this.config.provider,
      connection: status,
      performance: {
        // Would include actual performance metrics
        cacheEnabled: this.config.caching?.enabled,
        offlineEnabled: this.config.offline?.enableOfflineWrite,
      },
    };
  }
}
