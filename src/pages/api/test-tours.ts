import type { APIRoute } from 'astro'
import { supabaseServer } from '@/lib/supabase.server'

export const GET: APIRoute = async ({ url }) => {
  console.log('Test API called')
  
  try {
    // Quick test without complex logic
    const country = url.searchParams.get('country')
    console.log('Testing with country:', country)
    
    if (!supabaseServer) {
      return new Response(JSON.stringify({ error: 'Supabase not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    let query = supabaseServer
      .from('affiliate_tours')
      .select('id, title, locations, difficulty_level, price')
      .eq('is_active', true)
      .limit(5)
    
    if (country) {
      query = query.contains('locations', [country])
    }
    
    const { data, error } = await query
    
    if (error) {
      console.error('Query error:', error)
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({ 
      success: true,
      count: data?.length || 0,
      data 
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Test API error:', error)
    return new Response(JSON.stringify({ error: 'Internal error' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}