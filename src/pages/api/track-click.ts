import type { APIRoute } from 'astro'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase.server'
import { TABLES } from '@/lib/adapters/dbMapper'
import { trackClickLimiter } from '@/lib/rateLimit'

// Strict validation schema to prevent XSS and injection attacks
const trackClickSchema = z.object({
  tour_id: z.string().uuid('Invalid tour ID format'),
  tour_slug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/, 'Invalid tour slug format'),
  tour_title: z.string().min(1).max(200).regex(/^[a-zA-Z0-9\s\-&.,()!']+$/, 'Invalid characters in tour title'),
  operator: z.string().min(1).max(50).regex(/^[a-zA-Z0-9\s\-_.]+$/, 'Invalid operator name'),
  context: z.enum(['booking', 'details', 'search', 'redirect'], 'Invalid context'),
  timestamp: z.number().int().positive().max(Date.now() + 60000, 'Invalid timestamp'), // Max 1 minute future
  utm_params: z.object({
    utm_source: z.string().max(100).optional(),
    utm_medium: z.string().max(100).optional(), 
    utm_campaign: z.string().max(100).optional(),
    utm_content: z.string().max(100).optional(),
    utm_term: z.string().max(100).optional()
  }).optional()
})

// Simple IP anonymization for GDPR compliance
function anonymizeIP(ip: string | null): string | null {
  if (!ip) return null
  const parts = ip.split('.')
  if (parts.length === 4) {
    return `${parts[0]}.${parts[1]}.${parts[2]}.0` // Zero out last octet
  }
  return null
}

export const POST: APIRoute = async ({ request }) => {
  try {
    // Apply rate limiting (skip in production for now - needs Redis or similar)
    if (import.meta.env.DEV) {
      const rateLimitResult = trackClickLimiter(request)
      if (!rateLimitResult.success) {
        return new Response(JSON.stringify({ 
          error: rateLimitResult.error,
          rateLimited: true 
        }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '60'
        }
      })
      }
    }
    
    const rawData = await request.json()
    
    // CRITICAL: Validate all input data
    const data = trackClickSchema.parse(rawData)
    
    // Get and anonymize IP for GDPR compliance
    const rawIP = request.headers.get('x-forwarded-for')?.split(',')[0]?.trim() || 
                  request.headers.get('x-real-ip')
    const anonymizedIP = anonymizeIP(rawIP)
    
    // Log to database for analytics with validated, sanitized data
    const { error } = await supabaseServer
      .from(TABLES.clicks)
      .insert({
        tour_id: data.tour_id,
        tour_slug: data.tour_slug,
        tour_title: data.tour_title,
        operator: data.operator,
        context: data.context,
        utm_source: data.utm_params?.utm_source,
        utm_medium: data.utm_params?.utm_medium,
        utm_campaign: data.utm_params?.utm_campaign,
        utm_content: data.utm_params?.utm_content,
        utm_term: data.utm_params?.utm_term,
        clicked_at: new Date(data.timestamp).toISOString(),
        user_agent: request.headers.get('user-agent')?.substring(0, 500), // Limit length
        ip_address_anonymized: anonymizedIP
      })
    
    if (error) {
      console.error('Database insert failed:', error)
      throw error
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Failed to track click:', error)
    
    // Handle validation errors specifically
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Invalid input data',
        details: error.errors.map(e => e.message)
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Generic server error (don't leak implementation details)
    return new Response(JSON.stringify({ error: 'Internal server error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}