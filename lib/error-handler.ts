/**
 * Standardized error handling utilities for lib/ modules
 * Provides consistent error types, logging, and handling patterns
 */

// Standard error types for the application
export enum ErrorType {
  AUTHENTICATION = 'AUTHENTICATION',
  AUTHORIZATION = 'AUTHORIZATION',
  VALIDATION = 'VALIDATION',
  NETWORK = 'NETWORK',
  DATABASE = 'DATABASE',
  GEOLOCATION = 'GEOLOCATION',
  EXTERNAL_API = 'EXTERNAL_API',
  UNKNOWN = 'UNKNOWN'
}

// Standard error severity levels
export enum ErrorSeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL'
}

// Standard error interface
export interface AppError {
  type: ErrorType
  severity: ErrorSeverity
  message: string
  code?: string
  details?: any
  timestamp: Date
  context?: string
}

// Custom error class
export class StandardError extends Error implements AppError {
  public readonly type: ErrorType
  public readonly severity: ErrorSeverity
  public readonly code?: string
  public readonly details?: any
  public readonly timestamp: Date
  public readonly context?: string

  constructor(
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code?: string,
    details?: any,
    context?: string
  ) {
    super(message)
    this.name = 'StandardError'
    this.type = type
    this.severity = severity
    this.code = code
    this.details = details
    this.timestamp = new Date()
    this.context = context
  }
}

// Error handler configuration
interface ErrorHandlerConfig {
  enableLogging: boolean
  enableConsoleOutput: boolean
  logLevel: ErrorSeverity
}

class ErrorHandler {
  private config: ErrorHandlerConfig = {
    enableLogging: process.env.NODE_ENV !== 'test',
    enableConsoleOutput: process.env.NODE_ENV === 'development',
    logLevel: ErrorSeverity.LOW
  }

  /**
   * Handle and log errors consistently
   */
  handle(error: Error | StandardError, context?: string): StandardError {
    let standardError: StandardError

    if (error instanceof StandardError) {
      standardError = error
    } else {
      // Convert regular errors to StandardError
      standardError = new StandardError(
        this.inferErrorType(error),
        error.message,
        ErrorSeverity.MEDIUM,
        undefined,
        error,
        context
      )
    }

    // Log the error if enabled
    if (this.config.enableLogging && this.shouldLog(standardError.severity)) {
      this.logError(standardError)
    }

    return standardError
  }

  /**
   * Create a standardized error
   */
  create(
    type: ErrorType,
    message: string,
    severity: ErrorSeverity = ErrorSeverity.MEDIUM,
    code?: string,
    details?: any,
    context?: string
  ): StandardError {
    return new StandardError(type, message, severity, code, details, context)
  }

  /**
   * Wrap async operations with error handling
   */
  async wrapAsync<T>(
    operation: () => Promise<T>,
    context: string,
    fallbackValue?: T
  ): Promise<T | null> {
    try {
      return await operation()
    } catch (error) {
      const standardError = this.handle(error as Error, context)
      
      if (fallbackValue !== undefined) {
        return fallbackValue
      }
      
      // For critical errors, re-throw
      if (standardError.severity === ErrorSeverity.CRITICAL) {
        throw standardError
      }
      
      return null
    }
  }

  /**
   * Wrap async operations with Result type error handling
   */
  async wrapAsyncResult<T>(
    operation: () => Promise<T>,
    context: string
  ): Promise<Result<T>> {
    try {
      const data = await operation()
      return createResult.success(data)
    } catch (error) {
      const standardError = this.handle(error as Error, context)
      return createResult.error(standardError)
    }
  }

  /**
   * Wrap sync operations with error handling
   */
  wrapSync<T>(
    operation: () => T,
    context: string,
    fallbackValue?: T
  ): T | null {
    try {
      return operation()
    } catch (error) {
      const standardError = this.handle(error as Error, context)
      
      if (fallbackValue !== undefined) {
        return fallbackValue
      }
      
      // For critical errors, re-throw
      if (standardError.severity === ErrorSeverity.CRITICAL) {
        throw standardError
      }
      
      return null
    }
  }

  /**
   * Infer error type from error message/properties
   */
  private inferErrorType(error: Error): ErrorType {
    const message = error.message.toLowerCase()
    
    if (message.includes('auth') || message.includes('login') || message.includes('token')) {
      return ErrorType.AUTHENTICATION
    }
    if (message.includes('permission') || message.includes('unauthorized')) {
      return ErrorType.AUTHORIZATION
    }
    if (message.includes('validation') || message.includes('invalid')) {
      return ErrorType.VALIDATION
    }
    if (message.includes('network') || message.includes('fetch') || message.includes('connection')) {
      return ErrorType.NETWORK
    }
    if (message.includes('database') || message.includes('supabase')) {
      return ErrorType.DATABASE
    }
    if (message.includes('geolocation') || message.includes('location')) {
      return ErrorType.GEOLOCATION
    }
    if (message.includes('api') || message.includes('external')) {
      return ErrorType.EXTERNAL_API
    }
    
    return ErrorType.UNKNOWN
  }

  /**
   * Check if error should be logged based on severity
   */
  private shouldLog(severity: ErrorSeverity): boolean {
    const severityLevels = {
      [ErrorSeverity.LOW]: 0,
      [ErrorSeverity.MEDIUM]: 1,
      [ErrorSeverity.HIGH]: 2,
      [ErrorSeverity.CRITICAL]: 3
    }
    
    return severityLevels[severity] >= severityLevels[this.config.logLevel]
  }

  /**
   * Log error to console (development) or external service (production)
   */
  private logError(error: StandardError): void {
    if (this.config.enableConsoleOutput) {
      const logMethod = this.getLogMethod(error.severity)
      logMethod(`[${error.type}] ${error.message}`, {
        severity: error.severity,
        code: error.code,
        context: error.context,
        details: error.details,
        timestamp: error.timestamp
      })
    }
    
    // In production, you might want to send to an external logging service
    // Example: sendToLoggingService(error)
  }

  /**
   * Get appropriate console method based on severity
   */
  private getLogMethod(severity: ErrorSeverity): typeof console.log {
    switch (severity) {
      case ErrorSeverity.LOW:
        return console.info
      case ErrorSeverity.MEDIUM:
        return console.warn
      case ErrorSeverity.HIGH:
      case ErrorSeverity.CRITICAL:
        return console.error
      default:
        return console.log
    }
  }

  /**
   * Update configuration
   */
  configure(config: Partial<ErrorHandlerConfig>): void {
    this.config = { ...this.config, ...config }
  }
}

// Export singleton instance
export const errorHandler = new ErrorHandler()

// Convenience functions for common error types
export const createAuthError = (message: string, code?: string, details?: any) =>
  errorHandler.create(ErrorType.AUTHENTICATION, message, ErrorSeverity.HIGH, code, details)

export const createValidationError = (message: string, code?: string, details?: any) =>
  errorHandler.create(ErrorType.VALIDATION, message, ErrorSeverity.MEDIUM, code, details)

export const createNetworkError = (message: string, code?: string, details?: any) =>
  errorHandler.create(ErrorType.NETWORK, message, ErrorSeverity.MEDIUM, code, details)

export const createDatabaseError = (message: string, code?: string, details?: any) =>
  errorHandler.create(ErrorType.DATABASE, message, ErrorSeverity.HIGH, code, details)

export const createGeolocationError = (message: string, code?: string, details?: any) =>
  errorHandler.create(ErrorType.GEOLOCATION, message, ErrorSeverity.LOW, code, details)

// Result type for operations that might fail
export type Result<T, E = StandardError> = 
  | { success: true; data: T }
  | { success: false; error: E }

// Helper to create success/error results
export const createResult = {
  success: <T>(data: T): Result<T> => ({ success: true, data }),
  error: <T>(error: StandardError): Result<T> => ({ success: false, error })
}