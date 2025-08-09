/**
 * Rate Limiting Middleware
 * Protects API endpoints from abuse with intelligent rate limiting
 */

import type { APIContext } from 'astro'

interface RateLimitConfig {
  windowMs: number      // Time window in milliseconds
  maxRequests: number    // Max requests per window
  skipSuccessfulRequests?: boolean
  keyGenerator?: (context: APIContext) => string
  handler?: (context: APIContext) => Response
  skip?: (context: APIContext) => boolean
  onLimitReached?: (key: string, requests: number) => void
}

interface RateLimitStore {
  requests: number
  resetTime: number
}

class RateLimiter {
  private store: Map<string, RateLimitStore> = new Map()
  private cleanupInterval: NodeJS.Timeout | null = null
  
  constructor(private config: RateLimitConfig) {
    // Cleanup expired entries every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
    }
  }
  
  /**
   * Generate unique key for rate limiting
   */
  private getKey(context: APIContext): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(context)
    }
    
    // Default: Use IP address
    const forwarded = context.request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               context.request.headers.get('x-real-ip') || 
               'unknown'
    
    return `ratelimit:${ip}`
  }
  
  /**
   * Check if request should be rate limited
   */
  async shouldLimit(context: APIContext): Promise<{ limited: boolean; retryAfter?: number }> {
    // Check if should skip
    if (this.config.skip && this.config.skip(context)) {
      return { limited: false }
    }
    
    const key = this.getKey(context)
    const now = Date.now()
    
    let record = this.store.get(key)
    
    // Initialize or reset if window expired
    if (!record || now > record.resetTime) {
      record = {
        requests: 0,
        resetTime: now + this.config.windowMs
      }
      this.store.set(key, record)
    }
    
    // Increment request count
    record.requests++
    
    // Check if limit exceeded
    if (record.requests > this.config.maxRequests) {
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      
      // Call limit reached handler
      if (this.config.onLimitReached) {
        this.config.onLimitReached(key, record.requests)
      }
      
      return { limited: true, retryAfter }
    }
    
    return { limited: false }
  }
  
  /**
   * Create rate limit response
   */
  createLimitResponse(retryAfter: number): Response {
    return new Response(JSON.stringify({
      error: 'Too many requests',
      message: 'Rate limit exceeded. Please try again later.',
      retryAfter
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': this.config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString()
      }
    })
  }
  
  /**
   * Clean up expired entries
   */
  private cleanup(): void {
    const now = Date.now()
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime + this.config.windowMs) {
        this.store.delete(key)
      }
    }
  }
  
  /**
   * Get current stats
   */
  getStats(): { activeKeys: number; totalRequests: number } {
    let totalRequests = 0
    for (const record of this.store.values()) {
      totalRequests += record.requests
    }
    
    return {
      activeKeys: this.store.size,
      totalRequests
    }
  }
  
  /**
   * Reset rate limit for a specific key
   */
  reset(key: string): void {
    this.store.delete(key)
  }
  
  /**
   * Destroy the rate limiter
   */
  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.store.clear()
  }
}

// Sliding window rate limiter for more accurate limiting
class SlidingWindowRateLimiter {
  private requests: Map<string, number[]> = new Map()
  
  constructor(private config: RateLimitConfig) {}
  
  async shouldLimit(context: APIContext): Promise<{ limited: boolean; retryAfter?: number }> {
    const key = this.getKey(context)
    const now = Date.now()
    const windowStart = now - this.config.windowMs
    
    // Get or initialize request timestamps
    let timestamps = this.requests.get(key) || []
    
    // Remove old timestamps outside the window
    timestamps = timestamps.filter(t => t > windowStart)
    
    // Check if limit would be exceeded
    if (timestamps.length >= this.config.maxRequests) {
      const oldestRequest = timestamps[0]
      const retryAfter = Math.ceil((oldestRequest + this.config.windowMs - now) / 1000)
      return { limited: true, retryAfter }
    }
    
    // Add current request
    timestamps.push(now)
    this.requests.set(key, timestamps)
    
    return { limited: false }
  }
  
  private getKey(context: APIContext): string {
    const forwarded = context.request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               context.request.headers.get('x-real-ip') || 
               'unknown'
    return `sliding:${ip}`
  }
}

// Token bucket rate limiter for burst allowance
class TokenBucketRateLimiter {
  private buckets: Map<string, { tokens: number; lastRefill: number }> = new Map()
  
  constructor(
    private config: RateLimitConfig & { 
      bucketSize?: number
      refillRate?: number 
    }
  ) {}
  
  async shouldLimit(context: APIContext): Promise<{ limited: boolean; retryAfter?: number }> {
    const key = this.getKey(context)
    const now = Date.now()
    
    const bucketSize = this.config.bucketSize || this.config.maxRequests
    const refillRate = this.config.refillRate || 
                      (this.config.maxRequests / (this.config.windowMs / 1000))
    
    let bucket = this.buckets.get(key)
    
    if (!bucket) {
      bucket = { tokens: bucketSize, lastRefill: now }
      this.buckets.set(key, bucket)
    } else {
      // Refill tokens based on time passed
      const timePassed = (now - bucket.lastRefill) / 1000
      const tokensToAdd = timePassed * refillRate
      bucket.tokens = Math.min(bucketSize, bucket.tokens + tokensToAdd)
      bucket.lastRefill = now
    }
    
    // Check if token available
    if (bucket.tokens < 1) {
      const retryAfter = Math.ceil(1 / refillRate)
      return { limited: true, retryAfter }
    }
    
    // Consume token
    bucket.tokens--
    
    return { limited: false }
  }
  
  private getKey(context: APIContext): string {
    const forwarded = context.request.headers.get('x-forwarded-for')
    const ip = forwarded ? forwarded.split(',')[0].trim() : 
               context.request.headers.get('x-real-ip') || 
               'unknown'
    return `bucket:${ip}`
  }
}

// Create rate limiter instances for different use cases
export const rateLimiters = {
  // Standard API rate limiting
  api: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 60,     // 60 requests per minute
    onLimitReached: (key, requests) => {
      console.warn(`Rate limit reached for ${key}: ${requests} requests`)
    }
  }),
  
  // Strict rate limiting for sensitive endpoints
  strict: new RateLimiter({
    windowMs: 60 * 1000, // 1 minute
    maxRequests: 10,     // 10 requests per minute
  }),
  
  // Search endpoint rate limiting
  search: new SlidingWindowRateLimiter({
    windowMs: 10 * 1000, // 10 seconds
    maxRequests: 20,     // 20 searches per 10 seconds
  }),
  
  // Booking/inquiry rate limiting with burst allowance
  booking: new TokenBucketRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 5,
    bucketSize: 10,      // Allow burst of 10
    refillRate: 0.1      // Refill 0.1 tokens per second
  })
}

// Middleware factory
export function createRateLimitMiddleware(
  limiter: RateLimiter | SlidingWindowRateLimiter | TokenBucketRateLimiter
) {
  return async (context: APIContext, next: () => Promise<Response>) => {
    const { limited, retryAfter } = await limiter.shouldLimit(context)
    
    if (limited && retryAfter) {
      if (limiter instanceof RateLimiter) {
        return limiter.createLimitResponse(retryAfter)
      }
      
      // Default response for other limiters
      return new Response(JSON.stringify({
        error: 'Too many requests',
        retryAfter
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': retryAfter.toString()
        }
      })
    }
    
    // Add rate limit headers to successful responses
    const response = await next()
    
    if (limiter instanceof RateLimiter) {
      const stats = limiter.getStats()
      response.headers.set('X-RateLimit-Limit', limiter['config'].maxRequests.toString())
      // Note: Remaining count would need to be tracked per key
    }
    
    return response
  }
}

// Export types
export type { RateLimitConfig, RateLimitStore }
export { RateLimiter, SlidingWindowRateLimiter, TokenBucketRateLimiter }