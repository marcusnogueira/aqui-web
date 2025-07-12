// Performance optimization configuration

export const PERFORMANCE_CONFIG = {
  // Enable performance monitoring in development
  MONITORING_ENABLED: process.env.NODE_ENV === 'development',
  
  // Debounce delays (in milliseconds)
  SEARCH_DEBOUNCE_DELAY: 300,
  MAP_BOUNDS_DEBOUNCE_DELAY: 100,
  PERFORMANCE_LOG_DEBOUNCE_DELAY: 1000,
  
  // Performance thresholds (in milliseconds)
  SLOW_RENDER_THRESHOLD: 16, // 60fps target
  SLOW_FETCH_THRESHOLD: 1000, // 1 second
  SLOW_SEARCH_THRESHOLD: 100,
  
  // Virtual scrolling configuration
  VIRTUAL_SCROLL_ENABLED: true,
  VIRTUAL_SCROLL_ITEM_HEIGHT: 120, // Height of each vendor card
  VIRTUAL_SCROLL_BUFFER: 5, // Number of items to render outside viewport
  
  // Map optimization
  MAP_MARKER_CLUSTERING_ENABLED: true,
  MAP_MARKER_CLUSTERING_THRESHOLD: 50, // Cluster when more than 50 markers
  
  // Real-time updates
  REALTIME_THROTTLE_DELAY: 500, // Throttle real-time updates
  
  // Memory management
  MAX_CACHED_VENDORS: 1000,
  CACHE_CLEANUP_INTERVAL: 300000, // 5 minutes
  
  // Image optimization
  LAZY_LOADING_ENABLED: true,
  IMAGE_PLACEHOLDER_ENABLED: true,
  
  // Analytics and logging
  PERFORMANCE_ANALYTICS_ENABLED: process.env.NODE_ENV === 'development',
  ERROR_REPORTING_ENABLED: true,
} as const

// Feature flags for A/B testing performance optimizations
export const FEATURE_FLAGS = {
  USE_OPTIMIZED_VENDOR_CARDS: true,
  USE_DEBOUNCED_SEARCH: true,
  USE_MEMOIZED_FILTERS: true,
  USE_VIRTUAL_SCROLLING: false, // Disabled by default, can be enabled for testing
  USE_MARKER_CLUSTERING: false, // Disabled by default
  USE_PERFORMANCE_MONITORING: process.env.NODE_ENV === 'development',
} as const

// Performance budget thresholds
export const PERFORMANCE_BUDGET = {
  // Time to Interactive (TTI)
  TTI_THRESHOLD: 3000, // 3 seconds
  
  // First Contentful Paint (FCP)
  FCP_THRESHOLD: 1500, // 1.5 seconds
  
  // Largest Contentful Paint (LCP)
  LCP_THRESHOLD: 2500, // 2.5 seconds
  
  // Cumulative Layout Shift (CLS)
  CLS_THRESHOLD: 0.1,
  
  // First Input Delay (FID)
  FID_THRESHOLD: 100, // 100ms
  
  // Memory usage (in MB)
  MEMORY_THRESHOLD: 50,
} as const

// Export utility function to check if a feature is enabled
export function isFeatureEnabled(feature: keyof typeof FEATURE_FLAGS): boolean {
  return FEATURE_FLAGS[feature]
}

// Export utility function to get performance threshold
export function getPerformanceThreshold(metric: keyof typeof PERFORMANCE_BUDGET): number {
  return PERFORMANCE_BUDGET[metric]
}