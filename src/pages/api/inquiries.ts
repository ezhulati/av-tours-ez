import type { APIRoute } from 'astro'
import { z } from 'zod'
import { supabaseServer, isSupabaseConfigured } from '@/lib/supabase.server'
import { TABLES } from '@/lib/adapters/dbMapper'

const inquirySchema = z.object({
  tourId: z.string().uuid(),
  tourSlug: z.string(),
  name: z.string().min(2).max(100),
  email: z.string().email(),
  phone: z.string().optional(),
  message: z.string().min(10).max(1000),
  travelDate: z.string().optional(),
  groupSize: z.number().min(1).max(100).optional(),
  utm_source: z.string().optional(),
  utm_medium: z.string().optional(),
  utm_campaign: z.string().optional(),
  affiliate_cookie: z.string().optional()
})

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - inquiry submission disabled')
      return new Response(JSON.stringify({ 
        error: 'Service temporarily unavailable' 
      }), {
        status: 503,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const body = await request.json()
    
    // Get affiliate cookie
    const affiliateCookie = cookies.get('_aff')?.value
    if (affiliateCookie) {
      body.affiliate_cookie = affiliateCookie
    }
    
    // Validate input
    const validated = inquirySchema.parse(body)
    
    // Insert inquiry
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
        created_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (error) throw error
    
    // Send email notification if Resend is configured
    if (import.meta.env.RESEND_KEY) {
      try {
        // Email sending would go here
        console.log('Would send email notification')
      } catch (emailError) {
        console.error('Email send failed:', emailError)
      }
    }
    
    return new Response(JSON.stringify({ 
      ok: true, 
      id: data.id 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Inquiry error:', error)
    
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