/**
 * Security Middleware for AlbaniaVisit Tours
 * Implements comprehensive security controls including rate limiting,
 * CSRF protection, and security headers
 */

import type { APIContext, MiddlewareHandler } from 'astro'
import { z } from 'zod'
import crypto from 'crypto'

// Rate limiting store (in production, use Redis)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>()

// CSRF token store (in production, use secure session storage)
const csrfTokenStore = new Map<string, { token: string; expires: number }>()

/**
 * Rate limiting configuration
 */
interface RateLimitConfig {
  windowMs: number // Time window in milliseconds
  max: number // Maximum requests per window
  message?: string // Error message
  skipSuccessfulRequests?: boolean // Don't count successful requests
  skipFailedRequests?: boolean // Don't count failed requests
  keyGenerator?: (ctx: APIContext) => string // Custom key generator
}

/**
 * Default rate limit configurations per endpoint
 */
export const RATE_LIMITS: Record<string, RateLimitConfig> = {
  '/api/inquiries': {
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 5, // 5 inquiries per 15 minutes
    message: 'Too many inquiries. Please wait before submitting again.'
  },
  '/api/search': {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 30, // 30 searches per minute
    message: 'Too many search requests. Please slow down.'
  },
  '/api/tours': {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 60, // 60 requests per minute
    message: 'Rate limit exceeded. Please try again later.'
  },
  '/api/out': {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 10, // 10 redirects per minute per IP
    message: 'Too many redirect requests.'
  },
  '/api/track-click': {
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 20, // 20 tracking events per minute
    message: 'Too many tracking requests.'
  }
}

/**
 * Security headers configuration
 */
export const SECURITY_HEADERS = {
  // Content Security Policy - Strict but functional
  'Content-Security-Policy': [
    "default-src 'self'",
    "script-src 'self' 'nonce-{nonce}' https://www.googletagmanager.com https://www.google-analytics.com",
    "style-src 'self' 'unsafe-inline'", // Required for Tailwind
    "img-src 'self' data: https: blob:",
    "font-src 'self' data:",
    "connect-src 'self' https://*.supabase.co https://www.google-analytics.com",
    "frame-src 'none'",
    "object-src 'none'",
    "base-uri 'self'",
    "form-action 'self'",
    "frame-ancestors 'none'",
    "upgrade-insecure-requests",
    "block-all-mixed-content"
  ].join('; '),
  
  // Strict Transport Security
  'Strict-Transport-Security': 'max-age=31536000; includeSubDomains; preload',
  
  // Prevent MIME type sniffing
  'X-Content-Type-Options': 'nosniff',
  
  // XSS Protection (legacy but still useful)
  'X-XSS-Protection': '1; mode=block',
  
  // Prevent clickjacking
  'X-Frame-Options': 'DENY',
  
  // Referrer Policy
  'Referrer-Policy': 'strict-origin-when-cross-origin',
  
  // Permissions Policy (formerly Feature Policy)
  'Permissions-Policy': [
    'accelerometer=()',
    'camera=()',
    'geolocation=()',
    'gyroscope=()',
    'magnetometer=()',
    'microphone=()',
    'payment=()',
    'usb=()',
    'interest-cohort=()'
  ].join(', ')
}

/**
 * Generate CSP nonce for inline scripts
 */
export function generateNonce(): string {
  return crypto.randomBytes(16).toString('base64')
}

/**
 * Apply rate limiting to a request
 */
export function rateLimit(config: RateLimitConfig): MiddlewareHandler {
  return async (context, next) => {
    const { request, clientAddress } = context
    const url = new URL(request.url)
    
    // Generate rate limit key
    const key = config.keyGenerator 
      ? config.keyGenerator(context)
      : `${clientAddress}:${url.pathname}`
    
    // Get or create rate limit entry
    const now = Date.now()
    let entry = rateLimitStore.get(key)
    
    // Reset if window expired
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + config.windowMs }
      rateLimitStore.set(key, entry)
    }
    
    // Check if limit exceeded
    if (entry.count >= config.max) {
      return new Response(
        JSON.stringify({ 
          error: config.message || 'Rate limit exceeded',
          retryAfter: Math.ceil((entry.resetTime - now) / 1000)
        }),
        {
          status: 429,
          headers: {
            'Content-Type': 'application/json',
            'Retry-After': Math.ceil((entry.resetTime - now) / 1000).toString(),
            'X-RateLimit-Limit': config.max.toString(),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Reset': new Date(entry.resetTime).toISOString()
          }
        }
      )
    }
    
    // Increment counter
    entry.count++
    
    // Add rate limit headers to response
    const response = await next()
    response.headers.set('X-RateLimit-Limit', config.max.toString())
    response.headers.set('X-RateLimit-Remaining', (config.max - entry.count).toString())
    response.headers.set('X-RateLimit-Reset', new Date(entry.resetTime).toISOString())
    
    return response
  }
}

/**
 * CSRF token generation and validation
 */
export function generateCSRFToken(sessionId: string): string {
  const token = crypto.randomBytes(32).toString('hex')
  const expires = Date.now() + 3600000 // 1 hour
  csrfTokenStore.set(sessionId, { token, expires })
  return token
}

export function validateCSRFToken(sessionId: string, token: string): boolean {
  const stored = csrfTokenStore.get(sessionId)
  if (!stored || stored.expires < Date.now()) {
    return false
  }
  return crypto.timingSafeEqual(
    Buffer.from(stored.token),
    Buffer.from(token)
  )
}

/**
 * CSRF protection middleware
 */
export function csrfProtection(): MiddlewareHandler {
  return async (context, next) => {
    const { request, cookies } = context
    
    // Skip CSRF for GET requests
    if (request.method === 'GET' || request.method === 'HEAD') {
      return next()
    }
    
    // Get or create session
    let sessionId = cookies.get('_session')?.value
    if (!sessionId) {
      sessionId = crypto.randomBytes(32).toString('hex')
      cookies.set('_session', sessionId, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 86400 // 24 hours
      })
    }
    
    // Validate CSRF token
    const token = request.headers.get('X-CSRF-Token')
    if (!token || !validateCSRFToken(sessionId, token)) {
      return new Response(
        JSON.stringify({ error: 'Invalid CSRF token' }),
        {
          status: 403,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
    
    return next()
  }
}

/**
 * Apply security headers to response
 */
export function applySecurityHeaders(response: Response, nonce?: string): Response {
  Object.entries(SECURITY_HEADERS).forEach(([header, value]) => {
    if (header === 'Content-Security-Policy' && nonce) {
      value = value.replace('{nonce}', nonce)
    }
    response.headers.set(header, value)
  })
  return response
}

/**
 * Input sanitization utilities
 */
export const sanitizers = {
  /**
   * Sanitize string input to prevent XSS
   */
  sanitizeString(input: string): string {
    return input
      .replace(/[<>]/g, '') // Remove angle brackets
      .replace(/javascript:/gi, '') // Remove javascript: protocol
      .replace(/on\w+\s*=/gi, '') // Remove event handlers
      .trim()
  },
  
  /**
   * Sanitize SQL input to prevent injection
   */
  sanitizeSQL(input: string): string {
    return input
      .replace(/['";\\]/g, '') // Remove quotes and escape characters
      .replace(/--/g, '') // Remove SQL comments
      .replace(/\/\*/g, '') // Remove block comments
      .replace(/\*\//g, '')
      .replace(/\b(DROP|DELETE|INSERT|UPDATE|ALTER|CREATE|EXEC|EXECUTE)\b/gi, '')
      .trim()
  },
  
  /**
   * Sanitize URL to prevent open redirects
   */
  sanitizeURL(url: string, allowedDomains: string[] = []): string | null {
    try {
      const parsed = new URL(url)
      
      // Check protocol
      if (!['http:', 'https:'].includes(parsed.protocol)) {
        return null
      }
      
      // Check against allowed domains if specified
      if (allowedDomains.length > 0) {
        const isAllowed = allowedDomains.some(domain => 
          parsed.hostname === domain || 
          parsed.hostname.endsWith(`.${domain}`)
        )
        if (!isAllowed) {
          return null
        }
      }
      
      return parsed.toString()
    } catch {
      return null
    }
  },
  
  /**
   * Sanitize filename for uploads
   */
  sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid characters
      .replace(/\.{2,}/g, '_') // Remove directory traversal
      .substring(0, 255) // Limit length
  }
}

/**
 * Request validation schemas
 */
export const validators = {
  inquiry: z.object({
    tourId: z.string().uuid(),
    tourSlug: z.string().regex(/^[a-z0-9-]+$/),
    name: z.string().min(2).max(100).transform(sanitizers.sanitizeString),
    email: z.string().email().max(255),
    phone: z.string().regex(/^[+\d\s()-]*$/).max(20).optional(),
    message: z.string().min(10).max(1000).transform(sanitizers.sanitizeString),
    travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
    groupSize: z.number().int().min(1).max(100).optional(),
    utm_source: z.string().max(50).optional().transform(s => s ? sanitizers.sanitizeString(s) : undefined),
    utm_medium: z.string().max(50).optional().transform(s => s ? sanitizers.sanitizeString(s) : undefined),
    utm_campaign: z.string().max(50).optional().transform(s => s ? sanitizers.sanitizeString(s) : undefined)
  }),
  
  search: z.object({
    q: z.string().min(2).max(100).transform(sanitizers.sanitizeSQL),
    limit: z.number().int().min(1).max(50).default(10)
  }),
  
  tourFilter: z.object({
    country: z.string().max(2).optional(),
    category: z.string().max(50).optional().transform(s => s ? sanitizers.sanitizeString(s) : undefined),
    difficulty: z.enum(['easy', 'moderate', 'challenging']).optional(),
    minPrice: z.number().min(0).optional(),
    maxPrice: z.number().max(10000).optional(),
    page: z.number().int().min(1).default(1),
    limit: z.number().int().min(1).max(100).default(12)
  })
}

/**
 * IP-based request throttling
 */
export function throttleByIP(maxRequests: number, windowMs: number): MiddlewareHandler {
  const ipStore = new Map<string, { count: number; resetTime: number }>()
  
  return async (context, next) => {
    const ip = context.clientAddress || 
               context.request.headers.get('x-forwarded-for')?.split(',')[0] || 
               'unknown'
    
    const now = Date.now()
    let entry = ipStore.get(ip)
    
    if (!entry || entry.resetTime <= now) {
      entry = { count: 0, resetTime: now + windowMs }
      ipStore.set(ip, entry)
    }
    
    if (entry.count >= maxRequests) {
      return new Response('Too many requests from this IP', { status: 429 })
    }
    
    entry.count++
    return next()
  }
}

/**
 * Clean up expired entries periodically
 */
setInterval(() => {
  const now = Date.now()
  
  // Clean rate limit store
  for (const [key, entry] of rateLimitStore.entries()) {
    if (entry.resetTime <= now) {
      rateLimitStore.delete(key)
    }
  }
  
  // Clean CSRF token store
  for (const [key, entry] of csrfTokenStore.entries()) {
    if (entry.expires <= now) {
      csrfTokenStore.delete(key)
    }
  }
}, 60000) // Clean every minute

export default {
  rateLimit,
  csrfProtection,
  applySecurityHeaders,
  generateNonce,
  generateCSRFToken,
  validateCSRFToken,
  sanitizers,
  validators,
  throttleByIP
}