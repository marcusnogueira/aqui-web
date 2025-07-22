import React from 'react'
import { errorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handler'

// Performance monitoring utilities

// Web Vitals tracking
export const trackWebVitals = (metric: any) => {
  if (process.env.NODE_ENV === 'production') {
    // Log to console in development, send to analytics in production
    console.log(metric)
    
    // Example: Send to Google Analytics or other analytics service
    // gtag('event', metric.name, {
    //   value: Math.round(metric.name === 'CLS' ? metric.value * 1000 : metric.value),
    //   event_category: 'Web Vitals',
    //   event_label: metric.id,
    //   non_interaction: true,
    // })
  }
}

// Performance timing utilities
export class PerformanceTimer {
  private startTime: number
  private label: string

  constructor(label: string) {
    this.label = label
    this.startTime = performance.now()
  }

  end(): number {
    const endTime = performance.now()
    const duration = endTime - this.startTime
    
    if (process.env.NODE_ENV === 'development') {
      console.log(`⏱️ ${this.label}: ${duration.toFixed(2)}ms`)
    }
    
    return duration
  }
}

// Memory usage tracking
export const trackMemoryUsage = () => {
  try {
    if (!('memory' in performance)) {
      throw errorHandler.create(
        ErrorType.EXTERNAL_API,
        'Memory API not supported in this browser',
        ErrorSeverity.LOW,
        'MEMORY_API_UNSUPPORTED'
      )
    }
    
    const memory = (performance as Performance & { memory?: { usedJSHeapSize: number; totalJSHeapSize: number; jsHeapSizeLimit: number } }).memory
    
    if (!memory) {
      throw errorHandler.create(
        ErrorType.VALIDATION,
        'Memory API not available',
        ErrorSeverity.LOW,
        'MEMORY_API_UNAVAILABLE'
      )
    }
    
    return {
      usedJSHeapSize: memory.usedJSHeapSize,
      totalJSHeapSize: memory.totalJSHeapSize,
      jsHeapSizeLimit: memory.jsHeapSizeLimit
    }
  } catch (error) {
    throw errorHandler.handle(error as Error, 'trackMemoryUsage')
  }
}

// Lazy loading utility for heavy components
export const createLazyComponent = <T extends React.ComponentType<any>>(
  importFunc: () => Promise<{ default: T }>,
  fallback?: React.ComponentType
) => {
  const LazyComponent = React.lazy(importFunc)
  
  return (props: React.ComponentProps<T>) => 
    React.createElement(
      React.Suspense,
      { fallback: fallback ? React.createElement(fallback) : React.createElement('div', null, 'Loading...') },
      React.createElement(LazyComponent, props)
    )
}

// Image preloading utility
export const preloadImage = (src: string): Promise<void> => {
  return new Promise((resolve, reject) => {
    const img = new Image()
    img.onload = () => resolve()
    img.onerror = reject
    img.src = src
  })
}

// Critical resource preloading
export const preloadCriticalResources = async (resources: string[]) => {
  const timer = new PerformanceTimer('Critical Resources Preload')
  
  try {
    await Promise.all(resources.map(preloadImage))
    timer.end()
  } catch (error) {
    console.error('Failed to preload critical resources:', error)
  }
}

// Bundle size analyzer (development only)
export const analyzeBundleSize = () => {
  if (process.env.NODE_ENV === 'development' && typeof window !== 'undefined') {
    // Simple bundle size estimation
    const scripts = Array.from(document.querySelectorAll('script[src]'))
    const totalSize = scripts.reduce((acc, script) => {
      const src = (script as HTMLScriptElement).src
      if (src.includes('/_next/static/')) {
        // Estimate size based on script URL patterns
        return acc + 1 // Placeholder - in real implementation, you'd fetch actual sizes
      }
      return acc
    }, 0)
    
    console.log(`📦 Estimated bundle size: ${totalSize} chunks`)
  }
}