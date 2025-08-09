/**
 * Secure API Handler Wrapper
 * Provides a secure wrapper for API endpoints with built-in
 * authentication, validation, rate limiting, and error handling
 */

import type { APIRoute, APIContext } from 'astro'
import { z } from 'zod'
import crypto from 'crypto'
import { RATE_LIMITS, rateLimit, validators, sanitizers } from './middleware'

// Secure environment variables access
const getSecureEnv = (key: string): string => {
  const value = import.meta.env[key]
  if (!value && import.meta.env.PROD) {
    throw new Error(`Missing required environment variable: ${key}`)
  }
  return value || ''
}

// API Authentication methods
export enum AuthMethod {
  NONE = 'none',
  API_KEY = 'api_key',
  JWT = 'jwt',
  HMAC = 'hmac',
  SESSION = 'session'
}

interface SecureHandlerOptions {
  auth?: AuthMethod
  rateLimit?: boolean
  rateLimitConfig?: typeof RATE_LIMITS[string]
  validateInput?: z.ZodSchema
  cors?: {
    origin?: string | string[]
    methods?: string[]
    credentials?: boolean
  }
  timeout?: number
  logRequests?: boolean
  sanitizeErrors?: boolean
}

interface AuthContext {
  authenticated: boolean
  userId?: string
  permissions?: string[]
  apiKeyId?: string
}

/**
 * Validate API key authentication
 */
async function validateAPIKey(request: Request): Promise<AuthContext> {
  const apiKey = request.headers.get('X-API-Key')
  
  if (!apiKey) {
    return { authenticated: false }
  }
  
  // In production, validate against database
  // For now, check against environment variable
  const validKey = getSecureEnv('API_SECRET_KEY')
  
  if (!validKey || !crypto.timingSafeEqual(Buffer.from(apiKey), Buffer.from(validKey))) {
    return { authenticated: false }
  }
  
  return {
    authenticated: true,
    apiKeyId: 'default',
    permissions: ['read', 'write']
  }
}

/**
 * Validate HMAC signature
 */
function validateHMAC(request: Request, body: string): boolean {
  const signature = request.headers.get('X-Signature')
  const timestamp = request.headers.get('X-Timestamp')
  
  if (!signature || !timestamp) {
    return false
  }
  
  // Check timestamp is within 5 minutes
  const now = Date.now()
  const requestTime = parseInt(timestamp)
  if (Math.abs(now - requestTime) > 300000) {
    return false
  }
  
  // Generate expected signature
  const secret = getSecureEnv('HMAC_SECRET')
  const payload = `${timestamp}.${body}`
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

/**
 * Sanitize error messages for production
 */
function sanitizeError(error: unknown): { message: string; code: string } {
  if (error instanceof z.ZodError) {
    return {
      message: 'Validation failed',
      code: 'VALIDATION_ERROR'
    }
  }
  
  if (error instanceof Error) {
    // In production, don't expose internal error messages
    if (import.meta.env.PROD) {
      return {
        message: 'An error occurred processing your request',
        code: 'INTERNAL_ERROR'
      }
    }
    return {
      message: error.message,
      code: 'ERROR'
    }
  }
  
  return {
    message: 'Unknown error',
    code: 'UNKNOWN_ERROR'
  }
}

/**
 * Log API requests for audit trail
 */
async function logRequest(
  context: APIContext,
  auth: AuthContext,
  statusCode: number,
  responseTime: number
) {
  const { request, clientAddress } = context
  const url = new URL(request.url)
  
  const logEntry = {
    timestamp: new Date().toISOString(),
    method: request.method,
    path: url.pathname,
    query: Object.fromEntries(url.searchParams),
    ip: clientAddress,
    userAgent: request.headers.get('user-agent'),
    authenticated: auth.authenticated,
    userId: auth.userId,
    apiKeyId: auth.apiKeyId,
    statusCode,
    responseTime,
    // In production, send to logging service
  }
  
  if (import.meta.env.DEV) {
    console.log('API Request:', logEntry)
  }
  
  // In production, send to logging service like DataDog, CloudWatch, etc.
}

/**
 * Create a secure API handler with built-in security features
 */
export function createSecureHandler(
  handler: (context: APIContext, auth: AuthContext, data?: any) => Promise<Response>,
  options: SecureHandlerOptions = {}
): APIRoute {
  return async (context: APIContext) => {
    const startTime = Date.now()
    let auth: AuthContext = { authenticated: false }
    let statusCode = 500
    
    try {
      const { request } = context
      const url = new URL(request.url)
      
      // Apply CORS if configured
      if (options.cors) {
        const origin = request.headers.get('origin')
        const corsHeaders: Record<string, string> = {}
        
        if (options.cors.origin) {
          const allowedOrigins = Array.isArray(options.cors.origin) 
            ? options.cors.origin 
            : [options.cors.origin]
          
          if (origin && allowedOrigins.includes(origin)) {
            corsHeaders['Access-Control-Allow-Origin'] = origin
          }
        }
        
        if (options.cors.methods) {
          corsHeaders['Access-Control-Allow-Methods'] = options.cors.methods.join(', ')
        }
        
        if (options.cors.credentials) {
          corsHeaders['Access-Control-Allow-Credentials'] = 'true'
        }
        
        // Handle preflight requests
        if (request.method === 'OPTIONS') {
          return new Response(null, {
            status: 204,
            headers: corsHeaders
          })
        }
      }
      
      // Apply rate limiting if enabled
      if (options.rateLimit !== false) {
        const rateLimitConfig = options.rateLimitConfig || 
          RATE_LIMITS[url.pathname] || 
          RATE_LIMITS['/api/default']
        
        if (rateLimitConfig) {
          const rateLimitResult = await rateLimit(rateLimitConfig)(context, async () => new Response())
          if (rateLimitResult.status === 429) {
            statusCode = 429
            return rateLimitResult
          }
        }
      }
      
      // Authenticate request if required
      if (options.auth && options.auth !== AuthMethod.NONE) {
        switch (options.auth) {
          case AuthMethod.API_KEY:
            auth = await validateAPIKey(request)
            break
          case AuthMethod.HMAC:
            const body = await request.text()
            if (!validateHMAC(request, body)) {
              statusCode = 401
              return new Response(
                JSON.stringify({ error: 'Invalid signature' }),
                {
                  status: 401,
                  headers: { 'Content-Type': 'application/json' }
                }
              )
            }
            auth = { authenticated: true }
            break
          // Add other auth methods as needed
        }
        
        if (!auth.authenticated) {
          statusCode = 401
          return new Response(
            JSON.stringify({ error: 'Authentication required' }),
            {
              status: 401,
              headers: { 
                'Content-Type': 'application/json',
                'WWW-Authenticate': `${options.auth}`
              }
            }
          )
        }
      }
      
      // Parse and validate input if schema provided
      let validatedData: any
      if (options.validateInput) {
        try {
          let rawData: any
          
          if (request.method === 'GET') {
            // For GET requests, validate query parameters
            rawData = Object.fromEntries(url.searchParams)
          } else {
            // For POST/PUT/PATCH, validate body
            const contentType = request.headers.get('content-type')
            if (contentType?.includes('application/json')) {
              rawData = await request.json()
            } else if (contentType?.includes('application/x-www-form-urlencoded')) {
              const formData = await request.formData()
              rawData = Object.fromEntries(formData)
            } else {
              rawData = await request.text()
            }
          }
          
          validatedData = options.validateInput.parse(rawData)
        } catch (error) {
          statusCode = 400
          if (error instanceof z.ZodError) {
            return new Response(
              JSON.stringify({
                error: 'Validation failed',
                details: import.meta.env.DEV ? error.errors : undefined
              }),
              {
                status: 400,
                headers: { 'Content-Type': 'application/json' }
              }
            )
          }
          throw error
        }
      }
      
      // Set timeout if configured
      let timeoutId: NodeJS.Timeout | undefined
      if (options.timeout) {
        const controller = new AbortController()
        timeoutId = setTimeout(() => controller.abort(), options.timeout)
      }
      
      // Call the actual handler
      const response = await handler(context, auth, validatedData)
      statusCode = response.status
      
      // Clear timeout
      if (timeoutId) {
        clearTimeout(timeoutId)
      }
      
      // Log request if enabled
      if (options.logRequests) {
        const responseTime = Date.now() - startTime
        await logRequest(context, auth, statusCode, responseTime)
      }
      
      return response
      
    } catch (error) {
      // Log error
      console.error('API Handler Error:', error)
      
      // Sanitize error for response
      const sanitized = options.sanitizeErrors !== false 
        ? sanitizeError(error)
        : { message: String(error), code: 'ERROR' }
      
      statusCode = 500
      return new Response(
        JSON.stringify({
          error: sanitized.message,
          code: sanitized.code,
          timestamp: new Date().toISOString()
        }),
        {
          status: 500,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    } finally {
      // Log request if enabled and not already logged
      if (options.logRequests && statusCode === 500) {
        const responseTime = Date.now() - startTime
        await logRequest(context, auth, statusCode, responseTime)
      }
    }
  }
}

/**
 * Create rate-limited public endpoint
 */
export function createPublicEndpoint(
  handler: (context: APIContext, data?: any) => Promise<Response>,
  options: Omit<SecureHandlerOptions, 'auth'> = {}
): APIRoute {
  return createSecureHandler(
    async (context, auth, data) => handler(context, data),
    { ...options, auth: AuthMethod.NONE }
  )
}

/**
 * Create authenticated API endpoint
 */
export function createAuthenticatedEndpoint(
  handler: (context: APIContext, auth: AuthContext, data?: any) => Promise<Response>,
  options: Omit<SecureHandlerOptions, 'auth'> = {}
): APIRoute {
  return createSecureHandler(handler, { ...options, auth: AuthMethod.API_KEY })
}

/**
 * Utility to verify webhook signatures
 */
export function verifyWebhookSignature(
  payload: string,
  signature: string,
  secret: string
): boolean {
  const expectedSignature = crypto
    .createHmac('sha256', secret)
    .update(payload)
    .digest('hex')
  
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expectedSignature)
  )
}

export default {
  createSecureHandler,
  createPublicEndpoint,
  createAuthenticatedEndpoint,
  verifyWebhookSignature,
  AuthMethod
}