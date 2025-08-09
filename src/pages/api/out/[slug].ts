import type { APIRoute } from 'astro'
import { getTourDetail } from '@/lib/queries'
import { injectAffiliateParams, logAffiliateClick, generateCookieId } from '@/lib/affiliate'

export const prerender = false

export const GET: APIRoute = async ({ params, request, cookies }) => {
  try {
    const { slug } = params
    
    if (!slug) {
      return new Response('Not found', { status: 404 })
    }
    
    // Get tour details
    const tour = await getTourDetail(slug)
    
    if (!tour || !tour.affiliateUrl) {
      return new Response('Tour not found', { status: 404 })
    }
    
    // Extract UTM parameters from request URL
    const url = new URL(request.url)
    const utmParams: Record<string, string> = {}
    const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
    utmKeys.forEach(key => {
      const value = url.searchParams.get(key)
      if (value) {
        utmParams[key] = value
      }
    })
    
    // Set defaults if not provided
    if (!utmParams.utm_source) utmParams.utm_source = 'albaniavisit'
    if (!utmParams.utm_medium) utmParams.utm_medium = 'affiliate'
    if (!utmParams.utm_campaign) utmParams.utm_campaign = 'tour-redirect'
    if (!utmParams.utm_content) utmParams.utm_content = slug
    
    // Inject affiliate parameters with UTM
    const redirectUrl = injectAffiliateParams(tour.affiliateUrl, slug, utmParams)
    
    // Get or create affiliate cookie
    let cookieId = cookies.get('_aff')?.value
    if (!cookieId) {
      cookieId = generateCookieId()
      cookies.set('_aff', cookieId, {
        httpOnly: true,
        secure: true,
        sameSite: 'lax',
        maxAge: 90 * 24 * 60 * 60, // 90 days
        path: '/'
      })
    }
    
    // Log the click
    const userAgent = request.headers.get('user-agent') || undefined
    const ipAddress = request.headers.get('x-forwarded-for') || 
                     request.headers.get('x-real-ip') || 
                     undefined
    
    await logAffiliateClick(
      slug,
      tour.id,
      redirectUrl,
      userAgent,
      ipAddress,
      cookieId
    )
    
    // Redirect to affiliate URL
    return new Response(null, {
      status: 302,
      headers: {
        'Location': redirectUrl,
        'Cache-Control': 'no-cache, no-store, must-revalidate'
      }
    })
  } catch (error) {
    console.error('Redirect error:', error)
    return new Response('Internal server error', { status: 500 })
  }
}