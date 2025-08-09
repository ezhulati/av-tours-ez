import type { APIRoute } from 'astro'
import { getTourDetail } from '@/lib/queries'
import { injectAffiliateParams, logAffiliateClick, generateCookieId } from '@/lib/affiliate'

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
    
    // Inject affiliate parameters
    const redirectUrl = injectAffiliateParams(tour.affiliateUrl, slug)
    
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