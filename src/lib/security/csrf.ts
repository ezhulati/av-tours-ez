/**
 * CSRF Protection Utilities
 * Provides Cross-Site Request Forgery protection
 */

import type { AstroCookies } from 'astro';

/**
 * Generate a cryptographically secure CSRF token
 */
export function generateCSRFToken(): string {
  // Use crypto API for secure random generation
  const array = new Uint8Array(32);
  
  if (typeof window !== 'undefined' && window.crypto) {
    // Client-side
    window.crypto.getRandomValues(array);
  } else if (typeof globalThis !== 'undefined' && globalThis.crypto) {
    // Server-side (Node.js 15+)
    globalThis.crypto.getRandomValues(array);
  } else {
    // Fallback for older Node versions
    const crypto = require('crypto');
    return crypto.randomBytes(32).toString('hex');
  }
  
  return Array.from(array, byte => byte.toString(16).padStart(2, '0')).join('');
}

/**
 * Set CSRF token in cookies
 */
export function setCSRFToken(cookies: AstroCookies): string {
  const token = generateCSRFToken();
  const isProduction = import.meta.env.PROD;
  
  cookies.set('csrf_token', token, {
    httpOnly: true,
    secure: isProduction,
    sameSite: 'strict',
    maxAge: 60 * 60 * 24, // 24 hours
    path: '/'
  });
  
  return token;
}

/**
 * Get CSRF token from cookies
 */
export function getCSRFToken(cookies: AstroCookies): string | null {
  return cookies.get('csrf_token')?.value || null;
}

/**
 * Validate CSRF token from request
 */
export function validateCSRFToken(
  requestToken: string | null,
  cookieToken: string | null
): boolean {
  if (!requestToken || !cookieToken) {
    console.error('CSRF validation failed: Missing token');
    return false;
  }
  
  if (requestToken !== cookieToken) {
    console.error('CSRF validation failed: Token mismatch');
    return false;
  }
  
  return true;
}

/**
 * Get CSRF token from request headers or body
 */
export async function getRequestCSRFToken(request: Request): Promise<string | null> {
  // Check header first (preferred method)
  const headerToken = request.headers.get('X-CSRF-Token');
  if (headerToken) {
    return headerToken;
  }
  
  // Check request body for form submissions
  if (request.method === 'POST') {
    try {
      const contentType = request.headers.get('content-type');
      
      if (contentType?.includes('application/json')) {
        const body = await request.clone().json();
        return body.csrf_token || null;
      }
      
      if (contentType?.includes('application/x-www-form-urlencoded')) {
        const formData = await request.clone().formData();
        return formData.get('csrf_token')?.toString() || null;
      }
    } catch (e) {
      console.error('Failed to parse request body for CSRF token:', e);
    }
  }
  
  return null;
}

/**
 * CSRF middleware for API routes
 */
export async function csrfMiddleware(
  request: Request,
  cookies: AstroCookies
): Promise<Response | null> {
  // Skip CSRF for safe methods
  if (['GET', 'HEAD', 'OPTIONS'].includes(request.method)) {
    return null;
  }
  
  const cookieToken = getCSRFToken(cookies);
  const requestToken = await getRequestCSRFToken(request);
  
  if (!validateCSRFToken(requestToken, cookieToken)) {
    return new Response(
      JSON.stringify({ 
        error: 'CSRF validation failed',
        message: 'Invalid or missing CSRF token'
      }),
      {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      }
    );
  }
  
  return null; // Validation passed
}

/**
 * Generate CSRF meta tag for HTML pages
 */
export function generateCSRFMetaTag(token: string): string {
  return `<meta name="csrf-token" content="${token}">`;
}

/**
 * Client-side helper to get CSRF token from meta tag
 */
export function getCSRFTokenFromMeta(): string | null {
  if (typeof document === 'undefined') return null;
  
  const metaTag = document.querySelector('meta[name="csrf-token"]');
  return metaTag?.getAttribute('content') || null;
}

/**
 * Client-side helper to add CSRF token to fetch requests
 */
export function fetchWithCSRF(url: string, options: RequestInit = {}): Promise<Response> {
  const csrfToken = getCSRFTokenFromMeta();
  
  if (!csrfToken) {
    console.warn('No CSRF token found in meta tag');
  }
  
  const headers = new Headers(options.headers || {});
  
  if (csrfToken) {
    headers.set('X-CSRF-Token', csrfToken);
  }
  
  return fetch(url, {
    ...options,
    headers
  });
}

/**
 * React hook for CSRF protection
 */
export function useCSRFToken(): {
  token: string | null;
  fetchWithToken: (url: string, options?: RequestInit) => Promise<Response>;
} {
  const token = getCSRFTokenFromMeta();
  
  const fetchWithToken = (url: string, options: RequestInit = {}) => {
    return fetchWithCSRF(url, options);
  };
  
  return { token, fetchWithToken };
}