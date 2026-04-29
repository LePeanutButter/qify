/**
 * Centralized error handling utility for the Quality Attribute DSL IDE
 * Provides structured error handling with recovery strategies
 */

import { logger } from './logger';

declare const setTimeout: (callback: (value?: unknown) => void, delay: number) => void;

export enum ErrorType {
  PARSE_ERROR = 'PARSE_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  VISUALIZATION_ERROR = 'VISUALIZATION_ERROR',
  UI_ERROR = 'UI_ERROR',
  NETWORK_ERROR = 'NETWORK_ERROR',
  STORAGE_ERROR = 'STORAGE_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

export enum ErrorSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

export interface ErrorContext {
  component: string;
  action: string;
  userInput?: string;
  timestamp: string;
  sessionId?: string;
  userId?: string;
}

export interface AppError {
  id: string;
  type: ErrorType;
  severity: ErrorSeverity;
  message: string;
  originalError?: Error;
  context: ErrorContext;
  stack?: string;
  recoverable: boolean;
  recoveryStrategy?: RecoveryStrategy;
}

export interface RecoveryStrategy {
  type: 'retry' | 'fallback' | 'user-input' | 'restart-component' | 'ignore';
  description: string;
  action?: () => Promise<void> | void;
  maxRetries?: number;
}

export interface ErrorHandlerConfig {
  enableLogging: boolean;
  enableUserNotification: boolean;
  enableErrorReporting: boolean;
  maxErrorHistory: number;
  criticalErrorThreshold: number;
}

/**
 * Central error handler class
 */
export class ErrorHandler {
  private static instance: ErrorHandler;
  private config: ErrorHandlerConfig;
  private errorHistory: AppError[] = [];
  private readonly errorCounts: Map<ErrorType, number> = new Map();
  private readonly sessionId: string;

  private constructor(config: Partial<ErrorHandlerConfig> = {}) {
    this.config = {
      enableLogging: true,
      enableUserNotification: true,
      enableErrorReporting: false,
      maxErrorHistory: 100,
      criticalErrorThreshold: 5,
      ...config
    };

    this.sessionId = this.generateSessionId();
    this.initializeErrorCounts();
  }

  /**
   * Get singleton error handler instance
   */
  static getInstance(config?: Partial<ErrorHandlerConfig>): ErrorHandler {
    if (!ErrorHandler.instance) {
      ErrorHandler.instance = new ErrorHandler(config);
    }
    return ErrorHandler.instance;
  }

  /**
   * Handle an error with context and recovery strategy
   */
  async handleError(
    error: Error | string,
    context: Partial<ErrorContext>,
    options: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      recoverable?: boolean;
      recoveryStrategy?: RecoveryStrategy;
    } = {}
  ): Promise<void> {
    const appError = this.createAppError(error, context, options);

    // Log error
    if (this.config.enableLogging) {
      this.logError(appError);
    }

    // Store in history
    this.storeError(appError);

    // Update error counts
    this.updateErrorCounts(appError);

    // Notify user if enabled
    if (this.config.enableUserNotification) {
      this.notifyUser(appError);
    }

    // Attempt recovery if possible
    if (appError.recoverable && appError.recoveryStrategy) {
      await this.attemptRecovery(appError);
    }

    // Check for critical error threshold
    this.checkCriticalThreshold();

    // Report error if enabled
    if (this.config.enableErrorReporting) {
      this.reportError(appError);
    }
  }

  /**
   * Create a structured AppError from raw error
   */
  private createAppError(
    error: Error | string,
    context: Partial<ErrorContext>,
    options: {
      type?: ErrorType;
      severity?: ErrorSeverity;
      recoverable?: boolean;
      recoveryStrategy?: RecoveryStrategy;
    }
  ): AppError {
    const errorObj = typeof error === 'string' ? new Error(error) : error;
    
    return {
      id: this.generateErrorId(),
      type: options.type ?? this.inferErrorType(errorObj),
      severity: options.severity ?? this.inferErrorSeverity(errorObj),
      message: errorObj.message,
      originalError: errorObj,
      context: {
        component: context.component ?? 'unknown',
        action: context.action ?? 'unknown',
        userInput: context.userInput,
        timestamp: new Date().toISOString(),
        sessionId: this.sessionId,
        ...context
      },
      stack: errorObj.stack,
      recoverable: options.recoverable ?? this.isRecoverable(errorObj, options.type),
      recoveryStrategy: options.recoveryStrategy
    };
  }

  /**
   * Infer error type from error object
   */
  private inferErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase();
    
    if (message.includes('parse') || message.includes('syntax')) {
      return ErrorType.PARSE_ERROR;
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION_ERROR;
    }
    if (message.includes('canvas') || message.includes('render')) {
      return ErrorType.VISUALIZATION_ERROR;
    }
    if (message.includes('dom') || message.includes('element')) {
      return ErrorType.UI_ERROR;
    }
    if (message.includes('network') || message.includes('fetch')) {
      return ErrorType.NETWORK_ERROR;
    }
    if (message.includes('storage') || message.includes('localstorage')) {
      return ErrorType.STORAGE_ERROR;
    }

    return ErrorType.UNKNOWN_ERROR;
  }

  /**
   * Infer error severity from error object
   */
  private inferErrorSeverity(error: Error): ErrorSeverity {
    const message = error.message.toLowerCase();
    
    if (message.includes('critical') || message.includes('fatal')) {
      return ErrorSeverity.CRITICAL;
    }
    if (message.includes('error') || message.includes('failed')) {
      return ErrorSeverity.HIGH;
    }
    if (message.includes('warning') || message.includes('deprecated')) {
      return ErrorSeverity.MEDIUM;
    }

    return ErrorSeverity.LOW;
  }

  /**
   * Determine if error is recoverable
   */
  private isRecoverable(error: Error, type?: ErrorType): boolean {
    switch (type) {
      case ErrorType.PARSE_ERROR:
        return true; // Can be recovered by fixing syntax
      case ErrorType.VALIDATION_ERROR:
        return true; // Can be recovered by fixing validation
      case ErrorType.UI_ERROR:
        return true; // Can be recovered by re-rendering
      case ErrorType.NETWORK_ERROR:
        return true; // Can be recovered by retrying
      case ErrorType.VISUALIZATION_ERROR:
        return false; // Usually requires user intervention
      case ErrorType.STORAGE_ERROR:
        return true; // Can be recovered by clearing storage
      default:
        return false;
    }
  }

  /**
   * Log error to logger
   */
  private logError(error: AppError): void {
    const logData = {
      errorId: error.id,
      type: error.type,
      severity: error.severity,
      component: error.context.component,
      action: error.context.action,
      recoverable: error.recoverable,
      stack: error.stack
    };

    switch (error.severity) {
      case ErrorSeverity.CRITICAL:
        logger.fatal('error', error.message, error.originalError, logData);
        break;
      case ErrorSeverity.HIGH:
        logger.error('error', error.message, error.originalError, logData);
        break;
      case ErrorSeverity.MEDIUM:
        logger.warn('error', error.message, logData);
        break;
      case ErrorSeverity.LOW:
        logger.info('error', error.message, logData);
        break;
    }
  }

  /**
   * Store error in history
   */
  private storeError(error: AppError): void {
    this.errorHistory.push(error);

    // Trim history if exceeding max size
    if (this.errorHistory.length > this.config.maxErrorHistory) {
      this.errorHistory = this.errorHistory.slice(-this.config.maxErrorHistory);
    }
  }

  /**
   * Update error counts
   */
  private updateErrorCounts(error: AppError): void {
    const currentCount = this.errorCounts.get(error.type) ?? 0;
    this.errorCounts.set(error.type, currentCount + 1);
  }

  /**
   * Notify user of error
   */
  private notifyUser(error: AppError): void {
    // Create user-friendly notification
    const notification = this.createUserNotification(error);
    
    // Dispatch custom event for UI components to handle
    const event = new CustomEvent('app-error', {
      detail: {
        error,
        notification
      }
    });
    
    document.dispatchEvent(event);
  }

  /**
   * Create user-friendly notification message
   */
  private createUserNotification(error: AppError): {
    title: string;
    message: string;
    actions?: Array<{
      label: string;
      action: () => void;
    }>;
  } {
    const baseMessage = this.getBaseErrorMessage(error.type);
    
    return {
      title: `${baseMessage} Error`,
      message: error.message,
      actions: error.recoveryStrategy ? [{
        label: error.recoveryStrategy.description,
        action: () => {
          const strategy = error.recoveryStrategy;
          if (strategy) {
            return this.executeRecoveryStrategy(strategy);
          }
        }
      }] : undefined
    };
  }

  /**
   * Get base error message for error type
   */
  private getBaseErrorMessage(type: ErrorType): string {
    switch (type) {
      case ErrorType.PARSE_ERROR:
        return 'Parse';
      case ErrorType.VALIDATION_ERROR:
        return 'Validation';
      case ErrorType.VISUALIZATION_ERROR:
        return 'Visualization';
      case ErrorType.UI_ERROR:
        return 'Interface';
      case ErrorType.NETWORK_ERROR:
        return 'Network';
      case ErrorType.STORAGE_ERROR:
        return 'Storage';
      default:
        return 'System';
    }
  }

  /**
   * Attempt error recovery
   */
  private async attemptRecovery(error: AppError): Promise<void> {
    if (!error.recoveryStrategy) return;

    try {
      await this.executeRecoveryStrategy(error.recoveryStrategy);
      logger.info('error', `Successfully recovered from error: ${error.id}`);
    } catch (recoveryError) {
      logger.error('error', 'Recovery strategy failed', recoveryError instanceof Error ? recoveryError : new Error(String(recoveryError)));
    }
  }

  /**
   * Execute recovery strategy
   */
  private async executeRecoveryStrategy(strategy: RecoveryStrategy): Promise<void> {
    switch (strategy.type) {
      case 'retry':
        await this.executeRetryStrategy(strategy);
        break;
      case 'fallback':
        await this.executeFallbackStrategy(strategy);
        break;
      case 'user-input':
        await this.executeUserInputStrategy(strategy);
        break;
      case 'restart-component':
        await this.executeRestartStrategy(strategy);
        break;
      case 'ignore':
        // Do nothing
        break;
    }
  }

  /**
   * Execute retry strategy
   */
  private async executeRetryStrategy(strategy: RecoveryStrategy): Promise<void> {
    const maxRetries = strategy.maxRetries ?? 3;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        if (strategy.action) {
          await strategy.action();
        }
        return; // Success
      } catch (error) {
        if (attempt === maxRetries) {
          throw error;
        }
        // Wait before retry
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }
  }

  /**
   * Execute fallback strategy
   */
  private async executeFallbackStrategy(strategy: RecoveryStrategy): Promise<void> {
    if (strategy.action) {
      await strategy.action();
    }
  }

  /**
   * Execute user input strategy
   */
  private async executeUserInputStrategy(_strategy: RecoveryStrategy): Promise<void> {
    // This would trigger a user prompt
    logger.info('error', 'User input required for recovery');
  }

  /**
   * Execute restart strategy
   */
  private async executeRestartStrategy(_strategy: RecoveryStrategy): Promise<void> {
    // This would restart the affected component
    logger.info('error', 'Component restart initiated');
  }

  /**
   * Check critical error threshold
   */
  private checkCriticalThreshold(): void {
    const totalErrors = Array.from(this.errorCounts.values()).reduce((sum, count) => sum + count, 0);
    
    if (totalErrors >= this.config.criticalErrorThreshold) {
      logger.fatal('error', `Critical error threshold reached: ${totalErrors} errors`);
      
      // Dispatch critical error event
      const event = new CustomEvent('critical-error-threshold', {
        detail: {
          totalErrors,
          errorCounts: Object.fromEntries(this.errorCounts),
          threshold: this.config.criticalErrorThreshold
        }
      });
      
      document.dispatchEvent(event);
    }
  }

  /**
   * Report error to external service
   */
  private reportError(error: AppError): void {
    // This would integrate with error reporting service
    logger.info('error', `Error reported: ${error.id}`);
  }

  /**
   * Get error history
   */
  getErrorHistory(): AppError[] {
    return [...this.errorHistory];
  }

  /**
   * Get error statistics
   */
  getErrorStats(): {
    total: number;
    byType: Record<ErrorType, number>;
    bySeverity: Record<ErrorSeverity, number>;
    recent: AppError[];
  } {
    const byType: Record<ErrorType, number> = {} as Record<ErrorType, number>;
    const bySeverity: Record<ErrorSeverity, number> = {} as Record<ErrorSeverity, number>;

    this.errorHistory.forEach(error => {
      byType[error.type] = (byType[error.type] ?? 0) + 1;
      bySeverity[error.severity] = (bySeverity[error.severity] ?? 0) + 1;
    });

    return {
      total: this.errorHistory.length,
      byType,
      bySeverity,
      recent: this.errorHistory.slice(-10)
    };
  }

  /**
   * Clear error history
   */
  clearErrorHistory(): void {
    this.errorHistory = [];
    this.initializeErrorCounts();
  }

  /**
   * Update configuration
   */
  updateConfig(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config };
  }

  // Utility methods
  private generateSessionId(): string {
    return `session_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private generateErrorId(): string {
    return `error_${Date.now()}_${Math.random().toString(36).slice(2, 11)}`;
  }

  private initializeErrorCounts(): void {
    Object.values(ErrorType).forEach(type => {
      this.errorCounts.set(type, 0);
    });
  }
}

/**
 * Default error handler instance
 */
export const errorHandler = ErrorHandler.getInstance();

/**
 * Convenience functions for common error handling
 */
export const handleError = (
  error: Error | string,
  context: Partial<ErrorContext>,
  options?: {
    type?: ErrorType;
    severity?: ErrorSeverity;
    recoverable?: boolean;
    recoveryStrategy?: RecoveryStrategy;
  }
): Promise<void> => {
  return errorHandler.handleError(error, context, options);
};

/**
 * Create recovery strategy
 */
export const createRecoveryStrategy = (
  type: RecoveryStrategy['type'],
  description: string,
  action?: () => Promise<void> | void,
  maxRetries?: number
): RecoveryStrategy => ({
  type,
  description,
  action,
  maxRetries
});
