'use client'

// Performance monitoring utilities for tracking render times and bottlenecks
import { errorHandler, createValidationError, ErrorSeverity } from '@/lib/error-handler'

interface PerformanceMetric {
  name: string
  startTime: number
  endTime?: number
  duration?: number
}

class PerformanceMonitor {
  private metrics: Map<string, PerformanceMetric> = new Map()
  private enabled: boolean = process.env.NODE_ENV === 'development'

  startMeasure(name: string): void {
    if (!this.enabled) return
    
    this.metrics.set(name, {
      name,
      startTime: performance.now()
    })
  }

  endMeasure(name: string): number | null {
    return errorHandler.wrapSync(() => {
      if (!this.enabled) return null
      
      if (!name || typeof name !== 'string') {
        throw createValidationError(
          'Invalid metric name provided',
          'PERFORMANCE_INVALID_NAME'
        )
      }
      
      const metric = this.metrics.get(name)
      if (!metric) {
        console.warn(`Performance metric '${name}' not found`)
        return null
      }

      const endTime = performance.now()
      const duration = endTime - metric.startTime
      
      metric.endTime = endTime
      metric.duration = duration

      // Log slow operations (> 16ms for 60fps)
      if (duration > 16) {
        console.warn(`Slow operation detected: ${name} took ${duration.toFixed(2)}ms`)
      }

      return duration
    }, 'endMeasure', null)
  }

  getMetrics(): PerformanceMetric[] {
    return Array.from(this.metrics.values()).filter(m => m.duration !== undefined)
  }

  clearMetrics(): void {
    this.metrics.clear()
  }

  logSummary(): void {
    if (!this.enabled) return
    
    const metrics = this.getMetrics()
    if (metrics.length === 0) return

    console.group('Performance Summary')
    metrics.forEach(metric => {
      console.log(`${metric.name}: ${metric.duration?.toFixed(2)}ms`)
    })
    console.groupEnd()
  }
}

// Global performance monitor instance
export const performanceMonitor = new PerformanceMonitor()

// React hook for measuring component render times
export function usePerformanceMonitor(componentName: string) {
  const startRender = () => {
    performanceMonitor.startMeasure(`${componentName}-render`)
  }

  const endRender = () => {
    performanceMonitor.endMeasure(`${componentName}-render`)
  }

  return { startRender, endRender }
}

// Utility for measuring async operations
export async function measureAsync<T>(
  name: string,
  operation: () => Promise<T>
): Promise<T> {
  return errorHandler.wrapAsync(async () => {
    if (!name || typeof operation !== 'function') {
      throw createValidationError(
        'Invalid parameters for async measurement',
        'MEASURE_ASYNC_INVALID_PARAMS'
      )
    }
    
    performanceMonitor.startMeasure(name)
    try {
      const result = await operation()
      return result
    } finally {
      performanceMonitor.endMeasure(name)
    }
  }, 'measureAsync') as Promise<T>
}

// Utility for measuring synchronous operations
export function measureSync<T>(
  name: string,
  operation: () => T
): T {
  const result = errorHandler.wrapSync(() => {
    if (!name || typeof operation !== 'function') {
      throw createValidationError(
        'Invalid parameters for sync measurement',
        'MEASURE_SYNC_INVALID_PARAMS'
      )
    }
    
    performanceMonitor.startMeasure(name)
    try {
      const result = operation()
      return result
    } finally {
      performanceMonitor.endMeasure(name)
    }
  }, 'measureSync')
  
  if (result === null) {
    throw new Error('measureSync operation failed')
  }
  
  return result
}

// Debounced performance logger to avoid spam
let logTimeout: NodeJS.Timeout | null = null
export function debouncedPerformanceLog() {
  errorHandler.wrapSync(() => {
    if (logTimeout) clearTimeout(logTimeout)
    logTimeout = setTimeout(() => {
      try {
        performanceMonitor.logSummary()
        performanceMonitor.clearMetrics()
      } catch (error) {
        errorHandler.handle(
          error as Error,
          'debouncedPerformanceLog.timeout'
        )
      }
    }, 1000)
  }, 'debouncedPerformanceLog')
}