// Rate limiting utility for API endpoints

interface RateLimitEntry {
  count: number
  resetTime: number
}

class RateLimiter {
  private attempts: Map<string, RateLimitEntry> = new Map()
  private maxAttempts: number
  private windowMs: number

  constructor(maxAttempts: number = 5, windowMs: number = 15 * 60 * 1000) { // 5 attempts per 15 minutes
    this.maxAttempts = maxAttempts
    this.windowMs = windowMs
  }

  isRateLimited(identifier: string): boolean {
    const now = Date.now()
    const entry = this.attempts.get(identifier)

    if (!entry) {
      return false
    }

    // Reset if window has expired
    if (now > entry.resetTime) {
      this.attempts.delete(identifier)
      return false
    }

    return entry.count >= this.maxAttempts
  }

  recordAttempt(identifier: string): void {
    const now = Date.now()
    const entry = this.attempts.get(identifier)

    if (!entry || now > entry.resetTime) {
      // New entry or expired window
      this.attempts.set(identifier, {
        count: 1,
        resetTime: now + this.windowMs
      })
    } else {
      // Increment existing entry
      entry.count++
    }
  }

  getRemainingTime(identifier: string): number {
    const entry = this.attempts.get(identifier)
    if (!entry) return 0
    
    const now = Date.now()
    return Math.max(0, entry.resetTime - now)
  }

  reset(identifier: string): void {
    this.attempts.delete(identifier)
  }

  // Clean up expired entries periodically
  cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.attempts.entries()) {
      if (now > entry.resetTime) {
        this.attempts.delete(key)
      }
    }
  }
}

// Global rate limiter instance for admin login
export const adminLoginRateLimiter = new RateLimiter(5, 15 * 60 * 1000) // 5 attempts per 15 minutes

// Helper function to get client IP
export function getClientIP(request: Request): string {
  const forwarded = request.headers.get('x-forwarded-for')
  const realIP = request.headers.get('x-real-ip')
  const cfConnectingIP = request.headers.get('cf-connecting-ip')
  
  if (forwarded) {
    return forwarded.split(',')[0].trim()
  }
  
  if (realIP) {
    return realIP
  }
  
  if (cfConnectingIP) {
    return cfConnectingIP
  }
  
  return 'unknown'
}

// Cleanup expired entries every 5 minutes
if (typeof setInterval !== 'undefined') {
  setInterval(() => {
    adminLoginRateLimiter.cleanup()
  }, 5 * 60 * 1000)
}