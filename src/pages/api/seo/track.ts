import type { APIRoute } from 'astro'
import { trackSEOPageView, trackSEOConversion } from '@/lib/seo/seoMonitoring'

export const POST: APIRoute = async ({ request }) => {
  try {
    const data = await request.json()
    const { type, path, sessionId, userId, source, tourSlug, conversionType } = data
    
    if (type === 'pageview') {
      await trackSEOPageView(
        path,
        source || 'direct',
        sessionId,
        userId
      )
    } else if (type === 'conversion') {
      await trackSEOConversion(
        path,
        tourSlug,
        conversionType,
        sessionId
      )
    }
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    console.error('Error tracking SEO event:', error)
    return new Response(JSON.stringify({ error: 'Failed to track event' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}