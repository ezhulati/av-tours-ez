/**
 * Secure Affiliate Redirect Handler
 * Implements URL validation, rate limiting, and tracking
 */

import type { APIRoute } from 'astro'
import { createPublicEndpoint } from '@/lib/security/secure-api-handler'
import { sanitizers } from '@/lib/security/middleware'
import { generateSecureToken, anonymizeIP } from '@/lib/security/encryption'
import { getTourDetail } from '@/lib/queries'
import { supabaseServer } from '@/lib/supabase.server'
import { TABLES } from '@/lib/adapters/dbMapper'
import { z } from 'zod'

// Allowed partner domains for redirects
const ALLOWED_PARTNER_DOMAINS = [
  'bnadventure.com',
  'www.bnadventure.com',
  'viator.com',
  'www.viator.com',
  'getyourguide.com',
  'www.getyourguide.com',
  // Add other trusted partners
]

// Validation schema for redirect parameters
const redirectSchema = z.object({
  slug: z.string().regex(/^[a-z0-9-]+$/),
  utm_source: z.string().max(50).optional(),
  utm_medium: z.string().max(50).optional(),
  utm_campaign: z.string().max(100).optional(),
  utm_content: z.string().max(100).optional(),
  utm_term: z.string().max(50).optional(),
  ref: z.string().max(50).optional()
})

export const GET: APIRoute = createPublicEndpoint(
  async (context) => {
    const { params, request, cookies } = context
    const url = new URL(request.url)
    
    // Validate input parameters
    const validated = redirectSchema.parse({
      slug: params.slug,
      utm_source: url.searchParams.get('utm_source'),
      utm_medium: url.searchParams.get('utm_medium'),
      utm_campaign: url.searchParams.get('utm_campaign'),
      utm_content: url.searchParams.get('utm_content'),
      utm_term: url.searchParams.get('utm_term'),
      ref: url.searchParams.get('ref')
    })
    
    // Fetch tour details with validation
    const tour = await getTourDetail(validated.slug)
    
    if (!tour || !tour.affiliateUrl) {
      return new Response('Tour not found', { 
        status: 404,
        headers: {
          'X-Robots-Tag': 'noindex, nofollow'
        }
      })
    }
    
    // Validate affiliate URL
    const affiliateUrl = validateAndSanitizeUrl(tour.affiliateUrl)
    if (!affiliateUrl) {
      console.error('Invalid affiliate URL for tour:', validated.slug)
      return new Response('Invalid redirect destination', { status: 400 })
    }
    
    // Build secure redirect URL with parameters
    const redirectUrl = buildSecureRedirectUrl(affiliateUrl, validated, tour.slug)
    
    // Generate or retrieve secure tracking cookie
    let trackingId = cookies.get('_aff_secure')?.value
    if (!trackingId) {
      trackingId = generateSecureToken(32)
      // Sign the cookie for integrity
      const signature = signCookie(trackingId)
      cookies.set('_aff_secure', `${trackingId}.${signature}`, {
        httpOnly: true,
        secure: true,
        sameSite: 'strict',
        maxAge: 30 * 24 * 60 * 60, // 30 days (GDPR compliant)
        path: '/'
      })
    } else {
      // Verify cookie signature
      const [id, signature] = trackingId.split('.')
      if (!verifyCookieSignature(id, signature)) {
        // Cookie tampered, generate new one
        trackingId = generateSecureToken(32)
        const newSignature = signCookie(trackingId)
        cookies.set('_aff_secure', `${trackingId}.${newSignature}`, {
          httpOnly: true,
          secure: true,
          sameSite: 'strict',
          maxAge: 30 * 24 * 60 * 60,
          path: '/'
        })
      } else {
        trackingId = id
      }
    }
    
    // Log click with privacy protection
    await logSecureClick({
      tour_slug: validated.slug,
      tour_id: tour.id,
      redirect_url: redirectUrl.toString(),
      tracking_id: trackingId,
      ip_anonymized: anonymizeIP(
        request.headers.get('x-forwarded-for')?.split(',')[0] || 
        request.headers.get('x-real-ip') || 
        ''
      ),
      user_agent_hash: hashUserAgent(request.headers.get('user-agent')),
      referrer: sanitizers.sanitizeString(request.headers.get('referer') || ''),
      utm_source: validated.utm_source,
      utm_medium: validated.utm_medium,
      utm_campaign: validated.utm_campaign,
      clicked_at: new Date().toISOString()
    })
    
    // Return secure redirect
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Robots-Tag': 'noindex, nofollow',
        'Referrer-Policy': 'no-referrer',
        'X-Content-Type-Options': 'nosniff'
      }
    })
  },
  {
    rateLimit: true,
    rateLimitConfig: {
      windowMs: 60 * 1000, // 1 minute
      max: 10, // 10 redirects per minute per IP
      message: 'Too many redirect requests. Please wait before trying again.'
    },
    timeout: 5000, // 5 second timeout
    logRequests: true,
    sanitizeErrors: true
  }
)

/**
 * Validate and sanitize affiliate URL
 */
function validateAndSanitizeUrl(url: string): URL | null {
  try {
    const parsed = new URL(url)
    
    // Check protocol
    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return null
    }
    
    // Force HTTPS
    if (parsed.protocol === 'http:') {
      parsed.protocol = 'https:'
    }
    
    // Check against allowed domains
    const isAllowed = ALLOWED_PARTNER_DOMAINS.some(domain => 
      parsed.hostname === domain || 
      parsed.hostname.endsWith(`.${domain}`)
    )
    
    if (!isAllowed) {
      console.error('Blocked redirect to unauthorized domain:', parsed.hostname)
      return null
    }
    
    // Remove potentially dangerous parameters
    const dangerousParams = ['javascript', 'data', 'vbscript', 'file']
    dangerousParams.forEach(param => {
      parsed.searchParams.delete(param)
    })
    
    return parsed
  } catch (error) {
    console.error('URL validation error:', error)
    return null
  }
}

/**
 * Build secure redirect URL with tracking parameters
 */
function buildSecureRedirectUrl(
  baseUrl: URL, 
  params: z.infer<typeof redirectSchema>,
  tourSlug: string
): URL {
  const url = new URL(baseUrl.toString())
  
  // Add our tracking parameters
  url.searchParams.set('partner_id', '9')
  url.searchParams.set('tid', 'albaniavisit')
  url.searchParams.set('source', 'tours.albaniavisit.com')
  url.searchParams.set('tour', tourSlug)
  
  // Add UTM parameters if provided
  if (params.utm_source) url.searchParams.set('utm_source', params.utm_source)
  if (params.utm_medium) url.searchParams.set('utm_medium', params.utm_medium)
  if (params.utm_campaign) url.searchParams.set('utm_campaign', params.utm_campaign)
  if (params.utm_content) url.searchParams.set('utm_content', params.utm_content)
  if (params.utm_term) url.searchParams.set('utm_term', params.utm_term)
  
  // Add click tracking ID
  url.searchParams.set('click_id', generateClickId())
  url.searchParams.set('timestamp', Date.now().toString())
  
  return url
}

/**
 * Generate unique click ID
 */
function generateClickId(): string {
  const timestamp = Date.now().toString(36)
  const random = generateSecureToken(8)
  return `clk_${timestamp}_${random}`
}

/**
 * Sign cookie for integrity verification
 */
function signCookie(value: string): string {
  const secret = import.meta.env.COOKIE_SECRET || 'default-secret-change-in-production'
  return crypto
    .createHmac('sha256', secret)
    .update(value)
    .digest('hex')
    .substring(0, 16) // Use first 16 chars for shorter cookies
}

/**
 * Verify cookie signature
 */
function verifyCookieSignature(value: string, signature: string): boolean {
  const expected = signCookie(value)
  return crypto.timingSafeEqual(
    Buffer.from(signature),
    Buffer.from(expected)
  )
}

/**
 * Hash user agent for privacy
 */
function hashUserAgent(userAgent: string | null): string {
  if (!userAgent) return 'unknown'
  return crypto
    .createHash('sha256')
    .update(userAgent)
    .digest('hex')
    .substring(0, 16)
}

/**
 * Log click with privacy protection
 */
async function logSecureClick(data: any): Promise<void> {
  try {
    await supabaseServer
      .from(TABLES.clicks)
      .insert(data)
    
    // Also log to analytics service if configured
    if (import.meta.env.ANALYTICS_ENDPOINT) {
      // Send to analytics service
    }
  } catch (error) {
    // Log errors but don't fail the redirect
    console.error('Click logging error:', error)
  }
}

import crypto from 'crypto'