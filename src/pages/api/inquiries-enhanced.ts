import type { APIRoute } from 'astro'
import { z } from 'zod'
import { supabaseServer } from '@/lib/supabase.server'
import { TABLES } from '@/lib/adapters/dbMapper'
import { validateCSRFToken } from './csrf-token'
import { inquiryLimiter } from '@/lib/rateLimit'

const inquirySchema = z.object({
  tourId: z.string().uuid(),
  tourSlug: z.string().min(1).max(100).regex(/^[a-z0-9-]+$/), // Secure slug validation
  name: z.string().min(2).max(100).regex(/^[a-zA-Z\s\-'\.]+$/), // Only letters, spaces, hyphens, apostrophes, dots
  email: z.string().email().max(200),
  phone: z.string().max(20).regex(/^[\+\d\s\-\(\)]*$/).optional(), // Only phone number characters
  message: z.string().min(10).max(1000),
  travelDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(), // YYYY-MM-DD format only
  groupSize: z.number().int().min(1).max(100).optional(),
  utm_source: z.string().max(100).optional(),
  utm_medium: z.string().max(100).optional(), 
  utm_campaign: z.string().max(100).optional(),
  affiliate_cookie: z.string().optional(),
  // Security fields
  csrfToken: z.string().min(32, 'Invalid CSRF token'),
  // Smart routing fields
  tourTitle: z.string().max(200).optional(),
  inquiryType: z.enum(['tour', 'general']).default('tour')
})

// Email routing configuration based on tour operator/partner
const EMAIL_ROUTES = {
  // Tour inquiries (specific tour interest)
  tour: {
    bnadventure: ['info@bnadventure.com', 'tours@albaniavisit.com'],
    viator: ['tours@albaniavisit.com'], // Future: Add Viator routing
    default: ['tours@albaniavisit.com']
  },
  // General site inquiries (contact us forms)
  general: {
    default: ['tours@albaniavisit.com']
  }
}

// Determine operator from tour data or affiliate URL
function determineOperator(tourData: any): 'bnadventure' | 'viator' | 'unknown' {
  if (tourData?.operator?.name?.toLowerCase().includes('bnadventure') || 
      tourData?.affiliateUrl?.includes('bnadventure.com')) {
    return 'bnadventure'
  }
  if (tourData?.operator?.name?.toLowerCase().includes('viator') || 
      tourData?.affiliateUrl?.includes('viator.com')) {
    return 'viator'
  }
  return 'unknown'
}

// Get appropriate email recipients based on inquiry type and tour operator
function getEmailRecipients(inquiryType: 'tour' | 'general', operator?: string): string[] {
  if (inquiryType === 'tour' && operator && EMAIL_ROUTES.tour[operator]) {
    return EMAIL_ROUTES.tour[operator]
  }
  return EMAIL_ROUTES[inquiryType].default
}

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // CRITICAL: Apply rate limiting first
    const rateLimitResult = inquiryLimiter(request)
    if (!rateLimitResult.success) {
      return new Response(JSON.stringify({ 
        error: rateLimitResult.error,
        rateLimited: true 
      }), {
        status: 429,
        headers: { 
          'Content-Type': 'application/json',
          'X-RateLimit-Remaining': '0',
          'Retry-After': '3600'
        }
      })
    }
    
    const body = await request.json()
    
    // CRITICAL: Validate CSRF token first
    const csrfTokenFromCookie = cookies.get('_csrf')?.value
    if (!validateCSRFToken(body.csrfToken, csrfTokenFromCookie)) {
      return new Response(JSON.stringify({ 
        error: 'Invalid CSRF token. Please refresh the page and try again.' 
      }), {
        status: 403,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get affiliate cookie
    const affiliateCookie = cookies.get('_aff')?.value
    if (affiliateCookie) {
      body.affiliate_cookie = affiliateCookie
    }
    
    // Validate input with strict validation
    const validated = inquirySchema.parse(body)
    
    // Get tour data to determine operator
    let tourData = null
    let operator = 'unknown'
    
    if (validated.inquiryType === 'tour' && validated.tourId) {
      try {
        const { data: tour } = await supabaseServer
          .from(TABLES.tours)
          .select(`
            id, slug, title, 
            operator:operators(id, name, slug),
            affiliate_url
          `)
          .eq('id', validated.tourId)
          .single()
        
        tourData = tour
        if (tour) {
          operator = determineOperator(tour)
        }
      } catch (error) {
        console.warn('Could not fetch tour data for operator detection:', error)
      }
    }
    
    // Get email recipients based on inquiry type and operator
    const emailRecipients = getEmailRecipients(validated.inquiryType, operator)
    
    // Insert inquiry with routing information
    const { data, error } = await supabaseServer
      .from(TABLES.inquiries)
      .insert({
        tour_id: validated.tourId,
        tour_slug: validated.tourSlug,
        name: validated.name,
        email: validated.email,
        phone: validated.phone,
        message: validated.message,
        travel_date: validated.travelDate,
        group_size: validated.groupSize,
        utm_source: validated.utm_source,
        utm_medium: validated.utm_medium,
        utm_campaign: validated.utm_campaign,
        affiliate_cookie: validated.affiliate_cookie,
        // Store routing metadata
        operator: operator,
        inquiry_type: validated.inquiryType,
        email_recipients: emailRecipients,
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    // TODO: Integrate with Netlify Forms for actual email sending
    // For now, we'll prepare the form data for Netlify
    const netlifyFormData = {
      'form-name': validated.inquiryType === 'tour' ? 'tour-inquiry' : 'general-contact',
      'tour-title': validated.tourTitle || 'N/A',
      'tour-slug': validated.tourSlug,
      'name': validated.name,
      'email': validated.email,
      'phone': validated.phone || '',
      'travel-date': validated.travelDate || '',
      'group-size': validated.groupSize?.toString() || '1',
      'message': validated.message,
      'operator': operator,
      'email-recipients': emailRecipients.join(', '),
      'utm-source': validated.utm_source || '',
      'utm-campaign': validated.utm_campaign || '',
      'created-at': new Date().toISOString()
    }
    
    // Send to Netlify Forms (this will be handled by the frontend)
    console.log('Inquiry processed with routing:', {
      inquiryId: data.id,
      operator,
      emailRecipients,
      netlifyFormData
    })
    
    return new Response(JSON.stringify({ 
      ok: true, 
      id: data.id,
      operator,
      emailRecipients,
      netlifyFormData // Frontend can use this to submit to Netlify
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Enhanced inquiry error:', error)
    
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({ 
        error: 'Validation failed', 
        details: error.errors 
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ error: 'Failed to submit inquiry' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}