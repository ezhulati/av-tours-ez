/**
 * Security Sanitization Utilities
 * Provides XSS protection and input sanitization
 */

/**
 * Sanitize HTML content to prevent XSS attacks
 * Removes all HTML tags and dangerous characters
 */
export function sanitizeHtml(input: string): string {
  if (!input) return '';
  
  // Remove all HTML tags
  let sanitized = input.replace(/<[^>]*>/g, '');
  
  // Escape dangerous characters
  sanitized = sanitized
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#x27;')
    .replace(/\//g, '&#x2F;');
  
  // Remove any remaining script-like content
  sanitized = sanitized.replace(/javascript:/gi, '')
    .replace(/on\w+\s*=/gi, '')
    .replace(/data:text\/html/gi, '');
  
  return sanitized.trim();
}

/**
 * Sanitize URLs to prevent XSS and open redirect attacks
 */
export function sanitizeUrl(url: string, allowedProtocols: string[] = ['http:', 'https:']): string {
  if (!url) return '';
  
  try {
    // Handle relative URLs
    if (url.startsWith('/')) {
      return url;
    }
    
    const parsed = new URL(url);
    
    // Check protocol
    if (!allowedProtocols.includes(parsed.protocol)) {
      console.error('Invalid URL protocol blocked:', url);
      return '';
    }
    
    // Additional checks for data URLs
    if (parsed.protocol === 'data:') {
      if (!url.startsWith('data:image/')) {
        console.error('Non-image data URL blocked:', url);
        return '';
      }
    }
    
    return url;
  } catch (e) {
    // Invalid URL
    console.error('Invalid URL blocked:', url);
    return '';
  }
}

/**
 * Sanitize image URLs specifically
 */
export function sanitizeImageUrl(url: string): string {
  if (!url) return '/placeholder.jpg';
  
  const allowedProtocols = ['http:', 'https:', 'data:'];
  const sanitized = sanitizeUrl(url, allowedProtocols);
  
  if (!sanitized) {
    return '/placeholder.jpg';
  }
  
  // For data URLs, ensure they're images
  if (sanitized.startsWith('data:') && !sanitized.startsWith('data:image/')) {
    return '/placeholder.jpg';
  }
  
  return sanitized;
}

/**
 * Validate and sanitize phone numbers
 */
export function sanitizePhone(phone: string): string {
  if (!phone) return '';
  
  // Remove everything except digits, spaces, and common phone characters
  return phone.replace(/[^\d\s\-\+\(\)]/g, '').slice(0, 20);
}

/**
 * Validate and sanitize email addresses
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
  return emailRegex.test(email) && email.length <= 254;
}

/**
 * Sanitize numeric inputs
 */
export function sanitizeNumber(value: any, min: number, max: number, defaultValue: number): number {
  const num = parseInt(value, 10);
  
  if (isNaN(num)) {
    return defaultValue;
  }
  
  return Math.max(min, Math.min(max, num));
}

/**
 * Escape JSON for safe inclusion in HTML
 */
export function escapeJson(json: any): string {
  return JSON.stringify(json)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/'/g, '\\u0027');
}

/**
 * Generate secure random IDs
 */
export function generateSecureId(prefix: string = 'id'): string {
  const timestamp = Date.now().toString(36);
  const randomPart = Math.random().toString(36).substring(2, 11);
  return `${prefix}_${timestamp}_${randomPart}`;
}

/**
 * Validate redirect URLs against whitelist
 */
const ALLOWED_REDIRECT_DOMAINS = [
  'bnadventure.com',
  'www.bnadventure.com',
  'albaniavisit.com',
  'tours.albaniavisit.com'
];

export function validateRedirectUrl(url: string): boolean {
  if (!url) return false;
  
  try {
    const parsed = new URL(url);
    
    // Check if domain is whitelisted
    if (!ALLOWED_REDIRECT_DOMAINS.includes(parsed.hostname)) {
      console.error('Redirect to untrusted domain blocked:', parsed.hostname);
      return false;
    }
    
    // Only allow HTTPS in production
    if (process.env.NODE_ENV === 'production' && parsed.protocol !== 'https:') {
      console.error('Non-HTTPS redirect blocked in production:', url);
      return false;
    }
    
    return true;
  } catch (e) {
    console.error('Invalid redirect URL:', url);
    return false;
  }
}

/**
 * Rate limiting helper
 */
const requestCounts = new Map<string, { count: number; resetTime: number }>();

export function checkRateLimit(
  identifier: string,
  maxRequests: number = 10,
  windowMs: number = 60000
): boolean {
  const now = Date.now();
  const record = requestCounts.get(identifier);
  
  if (!record || now > record.resetTime) {
    // New window
    requestCounts.set(identifier, {
      count: 1,
      resetTime: now + windowMs
    });
    return true;
  }
  
  if (record.count >= maxRequests) {
    console.warn('Rate limit exceeded for:', identifier);
    return false;
  }
  
  record.count++;
  return true;
}

/**
 * Clean up old rate limit records periodically
 */
setInterval(() => {
  const now = Date.now();
  for (const [key, value] of requestCounts.entries()) {
    if (now > value.resetTime) {
      requestCounts.delete(key);
    }
  }
}, 60000); // Clean up every minute