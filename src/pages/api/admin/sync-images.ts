import type { APIRoute } from 'astro'
import { syncAllTourImages, syncTourImages } from '../../../lib/scraping/imageScraper'
import { supabaseServer } from '../../../lib/supabase.server'
import { requireAdminAuth } from '@/lib/security/admin-auth'
import { z } from 'zod'

// Input validation schema
const syncImagesSchema = z.object({
  tourSlug: z.string().regex(/^[a-z0-9-]+$/).optional(),
  fullSync: z.boolean().default(false)
}).refine(data => data.fullSync || data.tourSlug, {
  message: 'Either tourSlug or fullSync must be provided'
})

export const POST: APIRoute = async (context) => {
  try {
    // Secure admin authentication
    const authResult = await requireAdminAuth(context, 'sync:images')
    if (!authResult.authorized) {
      return authResult.response!
    }
    
    // Parse and validate request body
    const body = await context.request.json().catch(() => ({}))
    const validatedData = syncImagesSchema.parse(body)
    const { tourSlug, fullSync } = validatedData
    
    // Validation is now handled by Zod schema above
    
    let result
    
    if (fullSync) {
      // Sync all tours
      result = await syncAllTourImages()
      
      return new Response(
        JSON.stringify({
          success: true,
          message: 'Full image sync completed',
          stats: result
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    } else {
      // Sync single tour
      const { data: tour } = await supabaseServer
        .from('affiliate_tours')
        .select('id, slug, affiliate_url')
        .eq('slug', tourSlug)
        .single()
      
      if (!tour) {
        return new Response(
          JSON.stringify({ error: 'Tour not found' }),
          { 
            status: 404,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      if (!tour.affiliate_url) {
        return new Response(
          JSON.stringify({ error: 'Tour has no affiliate URL' }),
          { 
            status: 400,
            headers: { 'Content-Type': 'application/json' }
          }
        )
      }
      
      result = await syncTourImages(tour.slug, tour.id, tour.affiliate_url)
      
      return new Response(
        JSON.stringify({
          success: true,
          message: `Images synced for tour: ${tourSlug}`,
          stats: result
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Image sync error:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to sync images',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}

// GET endpoint to check sync status
export const GET: APIRoute = async (context) => {
  try {
    // Secure admin authentication
    const authResult = await requireAdminAuth(context, 'sync:images')
    if (!authResult.authorized) {
      return authResult.response!
    }
    
    const tourSlug = context.url.searchParams.get('tour')
    const limit = parseInt(context.url.searchParams.get('limit') || '10')
    
    if (tourSlug) {
      // Get images for specific tour
      const { data: images, error } = await supabaseServer
        .from('tour_images')
        .select('*')
        .eq('tour_slug', tourSlug)
        .eq('is_active', true)
        .eq('is_duplicate', false)
        .order('display_order', { ascending: true })
        .limit(limit)
      
      if (error) throw error
      
      return new Response(
        JSON.stringify({
          tour: tourSlug,
          imageCount: images?.length || 0,
          images: images || []
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    } else {
      // Get recent sync logs
      const { data: logs, error } = await supabaseServer
        .from('image_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit)
      
      if (error) throw error
      
      return new Response(
        JSON.stringify({
          syncLogs: logs || []
        }),
        { 
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        }
      )
    }
  } catch (error) {
    console.error('Error fetching sync status:', error)
    return new Response(
      JSON.stringify({ 
        error: 'Failed to fetch sync status',
        details: error instanceof Error ? error.message : 'Unknown error'
      }),
      { 
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      }
    )
  }
}