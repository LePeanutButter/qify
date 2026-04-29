/**
 * Structured logging utility for the Quality Attribute DSL IDE
 * Provides different log levels and structured output
 */

declare const localStorage: {
  getItem(key: string): string | null;
  setItem(key: string, value: string): void;
  removeItem(key: string): void;
};

export enum LogLevel {
  DEBUG = 0,
  INFO = 1,
  WARN = 2,
  ERROR = 3,
  FATAL = 4
}

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  category: string;
  message: string;
  data?: unknown;
  error?: Error;
  stack?: string;
}

export interface LoggerConfig {
  level: LogLevel;
  enableConsole: boolean;
  enableStorage: boolean;
  maxStorageEntries: number;
  categories: string[];
}

/**
 * Structured logger class
 */
export class Logger {
  private static instance: Logger;
  private config: LoggerConfig;
  private logs: LogEntry[] = [];

  private constructor(config: Partial<LoggerConfig> = {}) {
    this.config = {
      level: LogLevel.INFO,
      enableConsole: true,
      enableStorage: true,
      maxStorageEntries: 1000,
      categories: ['app', 'parser', 'visualizer', 'ui', 'error'],
      ...config
    };
  }

  /**
   * Get singleton logger instance
   */
  static getInstance(config?: Partial<LoggerConfig>): Logger {
    if (!Logger.instance) {
      Logger.instance = new Logger(config);
    }
    return Logger.instance;
  }

  /**
   * Log debug message
   */
  debug(category: string, message: string, data?: unknown): void {
    this.log(LogLevel.DEBUG, category, message, data);
  }

  /**
   * Log info message
   */
  info(category: string, message: string, data?: unknown): void {
    this.log(LogLevel.INFO, category, message, data);
  }

  /**
   * Log warning message
   */
  warn(category: string, message: string, data?: unknown): void {
    this.log(LogLevel.WARN, category, message, data);
  }

  /**
   * Log error message
   */
  error(category: string, message: string, error?: Error, data?: unknown): void {
    this.log(LogLevel.ERROR, category, message, data, error);
  }

  /**
   * Log fatal error message
   */
  fatal(category: string, message: string, error?: Error, data?: unknown): void {
    this.log(LogLevel.FATAL, category, message, data, error);
  }

  /**
   * Core logging method
   */
  private log(
    level: LogLevel,
    category: string,
    message: string,
    data?: unknown,
    error?: Error
  ): void {
    // Skip if level is below configured threshold
    if (level < this.config.level) {
      return;
    }

    // Validate category
    if (!this.config.categories.includes(category)) {
      category = 'app';
    }

    const logEntry: LogEntry = {
      timestamp: new Date().toISOString(),
      level,
      category,
      message,
      data,
      error: error ? {
        name: error.name,
        message: error.message,
        stack: error.stack
      } : undefined,
      stack: error?.stack
    };

    // Store log entry
    if (this.config.enableStorage) {
      this.storeLog(logEntry);
    }

    // Output to console
    if (this.config.enableConsole) {
      this.outputToConsole(logEntry);
    }
  }

  /**
   * Store log entry in memory
   */
  private storeLog(entry: LogEntry): void {
    this.logs.push(entry);

    // Trim logs if exceeding max storage
    if (this.logs.length > this.config.maxStorageEntries) {
      this.logs = this.logs.slice(-this.config.maxStorageEntries);
    }

    // Store in localStorage for persistence
    try {
      const storedLogs = this.getStoredLogs();
      storedLogs.push(entry);
      
      // Keep only recent logs in localStorage
      if (storedLogs.length > 100) {
        storedLogs.splice(0, storedLogs.length - 100);
      }

      localStorage.setItem('dsl-ide-logs', JSON.stringify(storedLogs));
    } catch {
      // Silent fail for storage errors
      // Console warning removed for production
    }
  }

  /**
   * Get stored logs from localStorage
   */
  private getStoredLogs(): LogEntry[] {
    try {
      const stored = localStorage.getItem('dsl-ide-logs');
      return stored ? JSON.parse(stored) : [];
    } catch {
      return [];
    }
  }

  /**
   * Output log entry to console with formatting
   */
  private outputToConsole(_entry: LogEntry): void {
    // Console output removed for production
  }

  /**
   * Get console styling for log level
   */
  private getConsoleStyle(level: LogLevel): string {
    switch (level) {
      case LogLevel.DEBUG:
        return 'color: #888; font-style: italic;';
      case LogLevel.INFO:
        return 'color: #007bff; font-weight: bold;';
      case LogLevel.WARN:
        return 'color: #ffc107; font-weight: bold;';
      case LogLevel.ERROR:
        return 'color: #dc3545; font-weight: bold;';
      case LogLevel.FATAL:
        return 'color: #6f42c1; font-weight: bold; background: #ffe6ff;';
      default:
        return '';
    }
  }

  /**
   * Get all logs
   */
  getLogs(): LogEntry[] {
    return [...this.logs];
  }

  /**
   * Get logs by category
   */
  getLogsByCategory(category: string): LogEntry[] {
    return this.logs.filter(log => log.category === category);
  }

  /**
   * Get logs by level
   */
  getLogsByLevel(level: LogLevel): LogEntry[] {
    return this.logs.filter(log => log.level === level);
  }

  /**
   * Clear all logs
   */
  clearLogs(): void {
    this.logs = [];
    try {
      localStorage.removeItem('dsl-ide-logs');
    } catch {
      // Silent fail
    }
  }

  /**
   * Export logs as JSON
   */
  exportLogs(): string {
    return JSON.stringify(this.logs, null, 2);
  }

  /**
   * Update logger configuration
   */
  updateConfig(config: Partial<LoggerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  /**
   * Get current configuration
   */
  getConfig(): LoggerConfig {
    return { ...this.config };
  }
}

/**
 * Default logger instance
 */
export const logger = Logger.getInstance();

/**
 * Convenience functions for common logging categories
 */
export const log = {
  debug: (message: string, data?: unknown) => logger.debug('app', message, data),
  info: (message: string, data?: unknown) => logger.info('app', message, data),
  warn: (message: string, data?: unknown) => logger.warn('app', message, data),
  error: (message: string, error?: Error, data?: unknown) => logger.error('app', message, error, data),
  fatal: (message: string, error?: Error, data?: unknown) => logger.fatal('app', message, error, data)
};

/**
 * Category-specific loggers
 */
export const parserLog = {
  debug: (message: string, data?: unknown) => logger.debug('parser', message, data),
  info: (message: string, data?: unknown) => logger.info('parser', message, data),
  warn: (message: string, data?: unknown) => logger.warn('parser', message, data),
  error: (message: string, error?: Error, data?: unknown) => logger.error('parser', message, error, data),
  fatal: (message: string, error?: Error, data?: unknown) => logger.fatal('parser', message, error, data)
};

export const visualizerLog = {
  debug: (message: string, data?: unknown) => logger.debug('visualizer', message, data),
  info: (message: string, data?: unknown) => logger.info('visualizer', message, data),
  warn: (message: string, data?: unknown) => logger.warn('visualizer', message, data),
  error: (message: string, error?: Error, data?: unknown) => logger.error('visualizer', message, error, data),
  fatal: (message: string, error?: Error, data?: unknown) => logger.fatal('visualizer', message, error, data)
};

export const uiLog = {
  debug: (message: string, data?: unknown) => logger.debug('ui', message, data),
  info: (message: string, data?: unknown) => logger.info('ui', message, data),
  warn: (message: string, data?: unknown) => logger.warn('ui', message, data),
  error: (message: string, error?: Error, data?: unknown) => logger.error('ui', message, error, data),
  fatal: (message: string, error?: Error, data?: unknown) => logger.fatal('ui', message, error, data)
};
