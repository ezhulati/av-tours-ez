// Simple in-memory rate limiter for API endpoints
// For production, consider Redis or similar persistent store

interface RateLimitEntry {
  count: number
  resetTime: number
}

const rateLimitStore = new Map<string, RateLimitEntry>()

interface RateLimitConfig {
  maxRequests: number
  windowMs: number
  keyGenerator?: (request: Request) => string
}

export function rateLimit(config: RateLimitConfig) {
  return (request: Request): { success: boolean; error?: string; remainingRequests?: number } => {
    const now = Date.now()
    const key = config.keyGenerator ? config.keyGenerator(request) : getClientKey(request)
    
    // Clean up expired entries to prevent memory leaks
    if (rateLimitStore.size > 10000) { // Prevent unbounded growth
      const cutoff = now - config.windowMs * 2
      for (const [k, entry] of rateLimitStore.entries()) {
        if (entry.resetTime < cutoff) {
          rateLimitStore.delete(k)
        }
      }
    }
    
    const entry = rateLimitStore.get(key)
    const resetTime = now + config.windowMs
    
    if (!entry || entry.resetTime <= now) {
      // First request or window expired
      rateLimitStore.set(key, { count: 1, resetTime })
      return { success: true, remainingRequests: config.maxRequests - 1 }
    }
    
    if (entry.count >= config.maxRequests) {
      // Rate limit exceeded
      return { 
        success: false, 
        error: `Rate limit exceeded. Try again in ${Math.ceil((entry.resetTime - now) / 1000)} seconds.`,
        remainingRequests: 0
      }
    }
    
    // Increment counter
    entry.count++
    return { success: true, remainingRequests: config.maxRequests - entry.count }
  }
}

// Generate a key for rate limiting based on IP and User-Agent
function getClientKey(request: Request): string {
  const ip = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
             request.headers.get('x-real-ip') || 
             'unknown'
  const userAgent = request.headers.get('user-agent')?.substring(0, 50) || 'unknown'
  return `${ip}:${userAgent}`
}

// Pre-configured rate limiters for different endpoint types
export const trackClickLimiter = rateLimit({
  maxRequests: 50, // 50 clicks per minute per client
  windowMs: 60 * 1000 // 1 minute
})

export const inquiryLimiter = rateLimit({
  maxRequests: 5, // 5 inquiries per hour per client
  windowMs: 60 * 60 * 1000 // 1 hour
})

export const toursApiLimiter = rateLimit({
  maxRequests: 100, // 100 requests per minute
  windowMs: 60 * 1000 // 1 minute
})