/**
 * Secure Admin Authentication System
 * Implements proper session management, rate limiting, and audit logging
 */

import type { APIContext } from 'astro'
import crypto from 'crypto'
import { supabaseServer } from '@/lib/supabase.server'

// Admin session store (in production, use Redis)
interface AdminSession {
  sessionId: string
  userId: string
  createdAt: number
  lastActivity: number
  ipAddress: string
  userAgent: string
  permissions: string[]
}

const adminSessions = new Map<string, AdminSession>()
const failedAttempts = new Map<string, { count: number; lockedUntil: number }>()

// Export session store for testing purposes
export const __testUtils = {
  adminSessions,
  failedAttempts
}

// Configuration
const CONFIG = {
  SESSION_TIMEOUT: 2 * 60 * 60 * 1000, // 2 hours
  MAX_FAILED_ATTEMPTS: 5,
  LOCKOUT_DURATION: 15 * 60 * 1000, // 15 minutes
  SESSION_ROTATION_INTERVAL: 30 * 60 * 1000, // 30 minutes
  ADMIN_PERMISSIONS: ['sync:prices', 'sync:images', 'view:analytics', 'manage:tours']
}

/**
 * Hash password with salt
 */
function hashPassword(password: string, salt: string): string {
  return crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex')
}

/**
 * Generate secure session ID
 */
function generateSessionId(): string {
  return crypto.randomBytes(32).toString('hex')
}

/**
 * Get client IP address
 */
function getClientIP(context: APIContext): string {
  return context.request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
         context.request.headers.get('x-real-ip') ||
         context.clientAddress ||
         'unknown'
}

/**
 * Check if IP is locked out due to failed attempts
 */
function isIPLockedOut(ip: string): boolean {
  const attempts = failedAttempts.get(ip)
  if (!attempts) return false
  
  if (Date.now() > attempts.lockedUntil) {
    failedAttempts.delete(ip)
    return false
  }
  
  return attempts.count >= CONFIG.MAX_FAILED_ATTEMPTS
}

/**
 * Record failed authentication attempt
 */
function recordFailedAttempt(ip: string): void {
  const attempts = failedAttempts.get(ip) || { count: 0, lockedUntil: 0 }
  attempts.count++
  
  if (attempts.count >= CONFIG.MAX_FAILED_ATTEMPTS) {
    attempts.lockedUntil = Date.now() + CONFIG.LOCKOUT_DURATION
  }
  
  failedAttempts.set(ip, attempts)
}

/**
 * Clear failed attempts on successful auth
 */
function clearFailedAttempts(ip: string): void {
  failedAttempts.delete(ip)
}

/**
 * Validate admin credentials
 */
async function validateCredentials(username: string, password: string): Promise<boolean> {
  // In production, store admin credentials securely in database
  const adminUsername = process.env.ADMIN_USERNAME || import.meta.env.ADMIN_USERNAME
  const adminPasswordHash = process.env.ADMIN_PASSWORD_HASH || import.meta.env.ADMIN_PASSWORD_HASH
  const adminSalt = process.env.ADMIN_SALT || import.meta.env.ADMIN_SALT
  
  if (!adminUsername || !adminPasswordHash || !adminSalt) {
    console.error('Admin credentials not configured')
    return false
  }
  
  if (username !== adminUsername) {
    return false
  }
  
  const providedHash = hashPassword(password, adminSalt)
  return crypto.timingSafeEqual(
    Buffer.from(adminPasswordHash),
    Buffer.from(providedHash)
  )
}

/**
 * Create admin session
 */
async function createAdminSession(
  userId: string,
  context: APIContext
): Promise<AdminSession> {
  const sessionId = generateSessionId()
  const now = Date.now()
  
  const session: AdminSession = {
    sessionId,
    userId,
    createdAt: now,
    lastActivity: now,
    ipAddress: getClientIP(context),
    userAgent: context.request.headers.get('user-agent') || 'unknown',
    permissions: CONFIG.ADMIN_PERMISSIONS
  }
  
  adminSessions.set(sessionId, session)
  
  // Store session in database for audit trail
  if (supabaseServer) {
    await supabaseServer.from('admin_sessions').insert({
      session_id: sessionId,
      user_id: userId,
      created_at: new Date(now).toISOString(),
      ip_address: session.ipAddress,
      user_agent: session.userAgent
    }).catch(console.error)
  }
  
  return session
}

/**
 * Validate admin session
 */
async function validateSession(sessionId: string, context: APIContext): Promise<AdminSession | null> {
  const session = adminSessions.get(sessionId)
  if (!session) return null
  
  const now = Date.now()
  
  // Check if session expired
  if (now - session.lastActivity > CONFIG.SESSION_TIMEOUT) {
    adminSessions.delete(sessionId)
    return null
  }
  
  // Check if IP changed (potential session hijacking)
  const currentIP = getClientIP(context)
  if (session.ipAddress !== currentIP) {
    console.error(`Session hijacking attempt detected: ${sessionId}, IP changed from ${session.ipAddress} to ${currentIP}`)
    adminSessions.delete(sessionId)
    return null
  }
  
  // Update last activity
  session.lastActivity = now
  
  // Rotate session ID periodically for security
  if (now - session.createdAt > CONFIG.SESSION_ROTATION_INTERVAL) {
    const newSessionId = generateSessionId()
    adminSessions.delete(sessionId)
    session.sessionId = newSessionId
    session.createdAt = now
    adminSessions.set(newSessionId, session)
  }
  
  return session
}

/**
 * Admin login endpoint
 */
export async function adminLogin(context: APIContext): Promise<Response> {
  const { request } = context
  const ip = getClientIP(context)
  
  // Check if IP is locked out
  if (isIPLockedOut(ip)) {
    const attempts = failedAttempts.get(ip)!
    return new Response(JSON.stringify({
      error: 'Account temporarily locked due to too many failed attempts',
      lockoutEndsAt: new Date(attempts.lockedUntil).toISOString()
    }), {
      status: 423, // Locked
      headers: { 'Content-Type': 'application/json' }
    })
  }
  
  try {
    const body = await request.json()
    const { username, password } = body
    
    if (!username || !password) {
      recordFailedAttempt(ip)
      return new Response(JSON.stringify({
        error: 'Username and password required'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Rate limit authentication attempts
    const rateLimitKey = `admin_login:${ip}`
    const recentAttempts = failedAttempts.get(rateLimitKey) || { count: 0, lockedUntil: 0 }
    
    if (recentAttempts.count >= 3 && Date.now() < recentAttempts.lockedUntil + 60000) {
      return new Response(JSON.stringify({
        error: 'Too many login attempts, please wait'
      }), {
        status: 429,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Validate credentials
    const isValid = await validateCredentials(username, password)
    
    if (!isValid) {
      recordFailedAttempt(ip)
      
      // Audit log failed attempt
      if (supabaseServer) {
        await supabaseServer.from('admin_audit_logs').insert({
          event_type: 'login_failed',
          user_id: username,
          ip_address: ip,
          user_agent: context.request.headers.get('user-agent'),
          details: { reason: 'invalid_credentials' },
          created_at: new Date().toISOString()
        }).catch(console.error)
      }
      
      return new Response(JSON.stringify({
        error: 'Invalid credentials'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Clear failed attempts on successful login
    clearFailedAttempts(ip)
    
    // Create session
    const session = await createAdminSession(username, context)
    
    // Audit log successful login
    if (supabaseServer) {
      await supabaseServer.from('admin_audit_logs').insert({
        event_type: 'login_success',
        user_id: username,
        session_id: session.sessionId,
        ip_address: ip,
        user_agent: context.request.headers.get('user-agent'),
        created_at: new Date().toISOString()
      }).catch(console.error)
    }
    
    return new Response(JSON.stringify({
      success: true,
      sessionId: session.sessionId,
      expiresAt: new Date(Date.now() + CONFIG.SESSION_TIMEOUT).toISOString(),
      permissions: session.permissions
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Set-Cookie': `admin_session=${session.sessionId}; HttpOnly; Secure; SameSite=Strict; Max-Age=${CONFIG.SESSION_TIMEOUT / 1000}`
      }
    })
    
  } catch (error) {
    console.error('Admin login error:', error)
    return new Response(JSON.stringify({
      error: 'Internal server error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

/**
 * Admin logout endpoint
 */
export async function adminLogout(context: APIContext): Promise<Response> {
  const sessionId = context.request.headers.get('Authorization')?.replace('Bearer ', '') ||
                    context.cookies.get('admin_session')?.value
  
  if (sessionId) {
    const session = adminSessions.get(sessionId)
    if (session) {
      adminSessions.delete(sessionId)
      
      // Audit log logout
      if (supabaseServer) {
        await supabaseServer.from('admin_audit_logs').insert({
          event_type: 'logout',
          user_id: session.userId,
          session_id: sessionId,
          ip_address: getClientIP(context),
          created_at: new Date().toISOString()
        }).catch(console.error)
      }
    }
  }
  
  return new Response(JSON.stringify({ success: true }), {
    status: 200,
    headers: {
      'Content-Type': 'application/json',
      'Set-Cookie': 'admin_session=; HttpOnly; Secure; SameSite=Strict; Max-Age=0'
    }
  })
}

/**
 * Middleware to protect admin endpoints
 */
export async function requireAdminAuth(
  context: APIContext,
  requiredPermission?: string
): Promise<{ authorized: boolean; session?: AdminSession; response?: Response }> {
  const ip = getClientIP(context)
  
  // Check if IP is locked out
  if (isIPLockedOut(ip)) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({
        error: 'Access temporarily restricted'
      }), {
        status: 423,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // Get session ID from header or cookie
  const sessionId = context.request.headers.get('Authorization')?.replace('Bearer ', '') ||
                    context.cookies.get('admin_session')?.value
  
  if (!sessionId) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({
        error: 'Authentication required'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // Validate session
  const session = await validateSession(sessionId, context)
  
  if (!session) {
    return {
      authorized: false,
      response: new Response(JSON.stringify({
        error: 'Invalid or expired session'
      }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // Check permissions if required
  if (requiredPermission && !session.permissions.includes(requiredPermission)) {
    // Audit log unauthorized access attempt
    if (supabaseServer) {
      await supabaseServer.from('admin_audit_logs').insert({
        event_type: 'access_denied',
        user_id: session.userId,
        session_id: sessionId,
        ip_address: ip,
        details: { required_permission: requiredPermission },
        created_at: new Date().toISOString()
      }).catch(console.error)
    }
    
    return {
      authorized: false,
      response: new Response(JSON.stringify({
        error: 'Insufficient permissions'
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  }
  
  // Audit log successful access
  if (supabaseServer) {
    await supabaseServer.from('admin_audit_logs').insert({
      event_type: 'endpoint_access',
      user_id: session.userId,
      session_id: sessionId,
      ip_address: ip,
      details: {
        endpoint: context.url.pathname,
        permission: requiredPermission
      },
      created_at: new Date().toISOString()
    }).catch(console.error)
  }
  
  return { authorized: true, session }
}

/**
 * Generate admin password hash for setup
 */
export function generateAdminPasswordHash(password: string): { hash: string; salt: string } {
  const salt = crypto.randomBytes(32).toString('hex')
  const hash = hashPassword(password, salt)
  return { hash, salt }
}

/**
 * Cleanup expired sessions
 */
setInterval(() => {
  const now = Date.now()
  for (const [sessionId, session] of adminSessions.entries()) {
    if (now - session.lastActivity > CONFIG.SESSION_TIMEOUT) {
      adminSessions.delete(sessionId)
    }
  }
  
  // Cleanup failed attempts
  for (const [ip, attempts] of failedAttempts.entries()) {
    if (now > attempts.lockedUntil) {
      failedAttempts.delete(ip)
    }
  }
}, 5 * 60 * 1000) // Cleanup every 5 minutes

export default {
  adminLogin,
  adminLogout,
  requireAdminAuth,
  generateAdminPasswordHash
}