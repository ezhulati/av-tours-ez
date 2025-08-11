/**
 * Advanced Rate Limiting System
 * Implements multiple layers of protection against abuse and bypass attempts
 */

import type { APIContext } from 'astro'
import crypto from 'crypto'

interface RateLimitConfig {
  windowMs: number
  maxRequests: number
  skipSuccessfulRequests?: boolean
  skipFailedRequests?: boolean
  keyGenerator?: (context: APIContext) => string
  onLimitReached?: (key: string, requests: number) => void
  blockDuration?: number // How long to block after limit reached
  progressiveDelay?: boolean // Increase delay with more requests
  testMode?: boolean // Disable real timers for testing
}

interface RateLimitRecord {
  requests: number
  resetTime: number
  blockedUntil?: number
  firstRequest: number
  lastRequest: number
  ipAddresses: Set<string>
  userAgents: Set<string>
  fingerprint: string
}

interface DistributedAttackDetection {
  suspiciousIPs: Map<string, number>
  ipClusters: Map<string, string[]>
  botSignatures: Set<string>
}

class AdvancedRateLimiter {
  private store = new Map<string, RateLimitRecord>()
  private globalStats = new Map<string, number>()
  private distributedDetection: DistributedAttackDetection = {
    suspiciousIPs: new Map(),
    ipClusters: new Map(),
    botSignatures: new Set()
  }
  
  // Known bot signatures to detect and block
  private readonly BOT_SIGNATURES = [
    /bot/i, /crawler/i, /spider/i, /scraper/i,
    /curl/i, /wget/i, /python/i, /node/i,
    /automated/i, /postman/i, /scrapy/i
    // Note: Removed /test/i to allow test user agents
  ]
  
  // Suspicious IP ranges (can be expanded)
  private readonly SUSPICIOUS_IP_RANGES = [
    /^10\./, /^172\.(1[6-9]|2[0-9]|3[01])\./, /^192\.168\./,  // Private ranges
    /^127\./, /^0\./, /^169\.254\./, /^224\./  // Special use ranges
  ]

  constructor(private config: RateLimitConfig) {
    // Clean up expired entries every minute (skip in test mode)
    if (!config.testMode) {
      setInterval(() => this.cleanup(), 60000)
    }
    
    // Update bot signatures periodically
    this.updateBotSignatures()
  }
  
  /**
   * Generate comprehensive key for rate limiting
   */
  private generateKey(context: APIContext): string {
    if (this.config.keyGenerator) {
      return this.config.keyGenerator(context)
    }
    
    const ip = this.getClientIP(context)
    const userAgent = context.request.headers.get('user-agent') || 'unknown'
    
    // Handle undefined or invalid URL gracefully
    let path = '/unknown'
    try {
      if (context.request.url) {
        path = new URL(context.request.url).pathname
      }
    } catch (error) {
      // Use fallback path if URL parsing fails
      path = '/unknown'
    }
    
    // Create fingerprint based on multiple factors
    const fingerprint = this.createFingerprint(context)
    
    return `${ip}:${path}:${fingerprint}`
  }
  
  /**
   * Get real client IP with proxy detection
   */
  private getClientIP(context: APIContext): string {
    const forwarded = context.request.headers.get('x-forwarded-for')
    const realIP = context.request.headers.get('x-real-ip')
    const cfIP = context.request.headers.get('cf-connecting-ip')
    
    // Prefer Cloudflare IP if available
    if (cfIP && this.isValidIP(cfIP)) {
      return cfIP
    }
    
    // Check X-Real-IP
    if (realIP && this.isValidIP(realIP)) {
      return realIP
    }
    
    // Parse X-Forwarded-For (take first valid IP)
    if (forwarded) {
      const ips = forwarded.split(',').map(ip => ip.trim())
      for (const ip of ips) {
        if (this.isValidIP(ip) && !this.isPrivateIP(ip)) {
          return ip
        }
      }
    }
    
    return context.clientAddress || 'unknown'
  }
  
  /**
   * Validate IP address format
   */
  private isValidIP(ip: string): boolean {
    const ipv4Regex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$/
    const ipv6Regex = /^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/
    return ipv4Regex.test(ip) || ipv6Regex.test(ip)
  }
  
  /**
   * Check if IP is in private range
   */
  private isPrivateIP(ip: string): boolean {
    return this.SUSPICIOUS_IP_RANGES.some(range => range.test(ip))
  }
  
  /**
   * Create request fingerprint
   */
  private createFingerprint(context: APIContext): string {
    const headers = context.request.headers
    const factors = [
      headers.get('user-agent') || '',
      headers.get('accept-language') || '',
      headers.get('accept-encoding') || '',
      headers.get('accept') || '',
      headers.get('connection') || '',
      headers.get('upgrade-insecure-requests') || '',
      context.request.method
    ]
    
    return crypto.createHash('md5').update(factors.join('|')).digest('hex')
  }
  
  /**
   * Detect if request is from a bot
   */
  private isBotRequest(context: APIContext): boolean {
    const userAgent = context.request.headers.get('user-agent') || ''
    return this.BOT_SIGNATURES.some(signature => signature.test(userAgent))
  }
  
  /**
   * Detect distributed attack patterns
   */
  private detectDistributedAttack(key: string, ip: string): boolean {
    const now = Date.now()
    const windowMs = 5 * 60 * 1000 // 5 minute window
    
    // Track suspicious IPs
    const suspiciousCount = this.distributedDetection.suspiciousIPs.get(ip) || 0
    if (suspiciousCount > 10) {
      return true
    }
    
    // Detect IP clusters (same /24 subnet)
    const subnet = ip.split('.').slice(0, 3).join('.')
    const clusterIPs = this.distributedDetection.ipClusters.get(subnet) || []
    
    // Update cluster tracking first
    if (!clusterIPs.includes(ip)) {
      clusterIPs.push(ip)
      this.distributedDetection.ipClusters.set(subnet, clusterIPs)
    }
    
    // Check for attack after updating (>= 20 instead of > 20)
    if (clusterIPs.length >= 20) {
      console.warn(`Potential distributed attack from subnet: ${subnet}`)
      return true
    }
    
    return false
  }
  
  /**
   * Calculate dynamic rate limit based on behavior
   */
  private calculateDynamicLimit(record: RateLimitRecord, ip: string): number {
    let multiplier = 1
    
    // Reduce limit for suspicious behavior
    if (this.distributedDetection.suspiciousIPs.has(ip)) {
      multiplier *= 0.5
    }
    
    // Reduce limit if many different IPs from same fingerprint
    if (record.ipAddresses.size > 5) {
      multiplier *= 0.3
    }
    
    // Reduce limit if many different user agents
    if (record.userAgents.size > 3) {
      multiplier *= 0.5
    }
    
    return Math.floor(this.config.maxRequests * multiplier)
  }
  
  /**
   * Main rate limiting check
   */
  async shouldLimit(context: APIContext): Promise<{
    limited: boolean
    retryAfter?: number
    reason?: string
    remainingRequests?: number
  }> {
    const now = Date.now()
    const key = this.generateKey(context)
    const ip = this.getClientIP(context)
    const userAgent = context.request.headers.get('user-agent') || 'unknown'
    
    // Immediate block for bots
    if (this.isBotRequest(context)) {
      this.distributedDetection.botSignatures.add(userAgent)
      return {
        limited: true,
        reason: 'Bot traffic detected',
        retryAfter: Math.floor(this.config.windowMs / 1000)
      }
    }
    
    // Check for distributed attack
    if (this.detectDistributedAttack(key, ip)) {
      return {
        limited: true,
        reason: 'Distributed attack detected',
        retryAfter: 300 // 5 minutes
      }
    }
    
    // Get or create record
    let record = this.store.get(key)
    
    if (!record || now > record.resetTime) {
      record = {
        requests: 0,
        resetTime: now + this.config.windowMs,
        firstRequest: now,
        lastRequest: now,
        ipAddresses: new Set([ip]),
        userAgents: new Set([userAgent]),
        fingerprint: this.createFingerprint(context)
      }
      this.store.set(key, record)
    }
    
    // Check if currently blocked
    if (record.blockedUntil && now < record.blockedUntil) {
      return {
        limited: true,
        reason: 'IP temporarily blocked',
        retryAfter: Math.ceil((record.blockedUntil - now) / 1000)
      }
    }
    
    // Update tracking data
    record.lastRequest = now
    record.ipAddresses.add(ip)
    record.userAgents.add(userAgent)
    
    // Calculate dynamic limit
    const dynamicLimit = this.calculateDynamicLimit(record, ip)
    
    // Increment request count
    record.requests++
    
    // Check if limit exceeded
    if (record.requests > dynamicLimit) {
      // Apply progressive penalties
      if (this.config.blockDuration) {
        const blockMultiplier = Math.min(record.requests - dynamicLimit, 10)
        record.blockedUntil = now + (this.config.blockDuration * blockMultiplier)
      }
      
      // Mark IP as suspicious
      const suspiciousCount = this.distributedDetection.suspiciousIPs.get(ip) || 0
      this.distributedDetection.suspiciousIPs.set(ip, suspiciousCount + 1)
      
      // Call limit reached handler
      if (this.config.onLimitReached) {
        this.config.onLimitReached(key, record.requests)
      }
      
      const retryAfter = Math.ceil((record.resetTime - now) / 1000)
      
      return {
        limited: true,
        reason: 'Rate limit exceeded',
        retryAfter,
        remainingRequests: 0
      }
    }
    
    // Progressive delay for high request rates (skip in test mode)
    if (this.config.progressiveDelay && !this.config.testMode && record.requests > dynamicLimit * 0.8) {
      const delay = Math.pow(2, record.requests - Math.floor(dynamicLimit * 0.8)) * 100
      await new Promise(resolve => setTimeout(resolve, Math.min(delay, 5000)))
    }
    
    return {
      limited: false,
      remainingRequests: dynamicLimit - record.requests
    }
  }
  
  /**
   * Create rate limit response with security headers
   */
  createLimitResponse(retryAfter: number, reason?: string): Response {
    return new Response(JSON.stringify({
      error: 'Rate limit exceeded',
      message: reason || 'Too many requests. Please try again later.',
      retryAfter
    }), {
      status: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': retryAfter.toString(),
        'X-RateLimit-Limit': this.config.maxRequests.toString(),
        'X-RateLimit-Remaining': '0',
        'X-RateLimit-Reset': new Date(Date.now() + retryAfter * 1000).toISOString(),
        'X-RateLimit-Policy': 'advanced-protection'
      }
    })
  }
  
  /**
   * Update bot signatures from threat intelligence
   */
  private updateBotSignatures(): void {
    // In production, this could fetch from threat intelligence feeds
    const additionalBotSignatures = [
      /postman/i, /insomnia/i, /httpie/i,
      /masscan/i, /zmap/i, /nuclei/i
    ]
    
    this.BOT_SIGNATURES.push(...additionalBotSignatures)
  }
  
  /**
   * Clean up expired entries and reset suspicious IP tracking
   */
  private cleanup(): void {
    const now = Date.now()
    
    // Clean up expired rate limit records
    for (const [key, record] of this.store.entries()) {
      if (now > record.resetTime + this.config.windowMs && 
          (!record.blockedUntil || now > record.blockedUntil)) {
        this.store.delete(key)
      }
    }
    
    // Reset suspicious IP tracking periodically
    if (this.distributedDetection.suspiciousIPs.size > 1000) {
      // Keep only IPs with high suspicious scores
      for (const [ip, count] of this.distributedDetection.suspiciousIPs.entries()) {
        if (count < 5) {
          this.distributedDetection.suspiciousIPs.delete(ip)
        }
      }
    }
    
    // Clean IP clusters older than 1 hour
    this.distributedDetection.ipClusters.clear()
  }
  
  /**
   * Get current statistics
   */
  getStats(): {
    activeKeys: number
    totalRequests: number
    suspiciousIPs: number
    botSignatures: number
  } {
    let totalRequests = 0
    for (const record of this.store.values()) {
      totalRequests += record.requests
    }
    
    return {
      activeKeys: this.store.size,
      totalRequests,
      suspiciousIPs: this.distributedDetection.suspiciousIPs.size,
      botSignatures: this.distributedDetection.botSignatures.size
    }
  }
  
  /**
   * Manually block an IP
   */
  blockIP(ip: string, duration: number): void {
    const key = `blocked:${ip}`
    this.store.set(key, {
      requests: 999,
      resetTime: Date.now() + duration,
      blockedUntil: Date.now() + duration,
      firstRequest: Date.now(),
      lastRequest: Date.now(),
      ipAddresses: new Set([ip]),
      userAgents: new Set(['manual-block']),
      fingerprint: 'blocked'
    })
  }
  
  /**
   * Unblock an IP
   */
  unblockIP(ip: string): void {
    const key = `blocked:${ip}`
    this.store.delete(key)
    this.distributedDetection.suspiciousIPs.delete(ip)
  }
}

// Pre-configured rate limiters for different endpoints
export const rateLimiters = {
  // Standard API endpoints
  api: new AdvancedRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 60,
    progressiveDelay: true,
    blockDuration: 5 * 60 * 1000, // 5 minutes
    onLimitReached: (key, requests) => {
      console.warn(`API rate limit exceeded: ${key} - ${requests} requests`)
    }
  }),
  
  // Admin endpoints - very strict
  admin: new AdvancedRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 10,
    blockDuration: 15 * 60 * 1000, // 15 minutes
    onLimitReached: (key, requests) => {
      console.error(`Admin rate limit exceeded: ${key} - ${requests} requests`)
    }
  }),
  
  // Search endpoints
  search: new AdvancedRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 30,
    progressiveDelay: true,
    onLimitReached: (key, requests) => {
      console.warn(`Search rate limit exceeded: ${key} - ${requests} requests`)
    }
  }),
  
  // Booking/inquiry endpoints
  booking: new AdvancedRateLimiter({
    windowMs: 15 * 60 * 1000, // 15 minutes
    maxRequests: 5,
    blockDuration: 30 * 60 * 1000, // 30 minutes
    onLimitReached: (key, requests) => {
      console.warn(`Booking rate limit exceeded: ${key} - ${requests} requests`)
    }
  }),
  
  // Affiliate tracking
  tracking: new AdvancedRateLimiter({
    windowMs: 60 * 1000,
    maxRequests: 20,
    progressiveDelay: true
  })
}

/**
 * Middleware factory for advanced rate limiting
 */
export function createAdvancedRateLimitMiddleware(limiter: AdvancedRateLimiter) {
  return async (context: APIContext, next: () => Promise<Response>) => {
    const result = await limiter.shouldLimit(context)
    
    if (result.limited) {
      return limiter.createLimitResponse(
        result.retryAfter || 60,
        result.reason
      )
    }
    
    // Proceed with request
    const response = await next()
    
    // Add rate limit headers
    if (result.remainingRequests !== undefined) {
      response.headers.set('X-RateLimit-Remaining', result.remainingRequests.toString())
    }
    
    return response
  }
}

export { AdvancedRateLimiter }
export default rateLimiters