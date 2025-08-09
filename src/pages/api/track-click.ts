import type { APIRoute } from 'astro'
import { supabaseServer } from '@/lib/supabase.server'
import { TABLES } from '@/lib/adapters/dbMapper'

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json()
    
    const { tour_id, tour_slug, tour_title, operator, context, timestamp, utm_params } = data
    
    // Log to database for analytics
    await supabaseServer
      .from(TABLES.clicks)
      .insert({
        tour_id,
        tour_slug,
        tour_title,
        operator,
        context,
        utm_source: utm_params?.utm_source,
        utm_medium: utm_params?.utm_medium,
        utm_campaign: utm_params?.utm_campaign,
        utm_content: utm_params?.utm_content,
        utm_term: utm_params?.utm_term,
        clicked_at: new Date(timestamp).toISOString(),
        user_agent: request.headers.get('user-agent'),
        ip_address: request.headers.get('x-forwarded-for') || 
                   request.headers.get('x-real-ip')
      })
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Failed to track click:', error)
    return new Response(JSON.stringify({ error: 'Failed to track click' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}