import type { APIRoute } from 'astro'
import crypto from 'crypto'

// Generate a secure CSRF token
function generateCSRFToken(): string {
  return crypto.randomBytes(32).toString('hex')
}

export const GET: APIRoute = async ({ cookies }) => {
  try {
    // Generate new CSRF token
    const csrfToken = generateCSRFToken()
    
    // Set CSRF token in httpOnly cookie (more secure than localStorage)
    cookies.set('_csrf', csrfToken, {
      httpOnly: true,
      secure: true, // Only over HTTPS
      sameSite: 'strict',
      maxAge: 60 * 60 * 24, // 24 hours
      path: '/'
    })
    
    // Return token for client-side form inclusion
    return new Response(JSON.stringify({ 
      csrfToken,
      success: true 
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-store, no-cache, must-revalidate'
      }
    })
  } catch (error) {
    console.error('CSRF token generation failed:', error)
    return new Response(JSON.stringify({ error: 'Failed to generate token' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// Utility function to validate CSRF token
export function validateCSRFToken(token: string | null, cookieToken: string | null): boolean {
  if (!token || !cookieToken) return false
  return token === cookieToken
}