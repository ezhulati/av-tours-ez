/**
 * Affiliate URL Building and Tracking Utilities
 */

export interface UTMParams {
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
  utm_content?: string
  utm_term?: string
}

export interface Tour {
  id: string
  slug: string
  title: string
  affiliateUrl?: string
  operator?: {
    id: string
    name: string
  }
}

/**
 * Generate a unique click ID
 */
export function generateClickId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `clk_${timestamp}_${random}`
}

/**
 * Extract UTM parameters from current URL
 */
export function extractUTMParams(): UTMParams {
  if (typeof window === 'undefined') return {}
  
  const params = new URLSearchParams(window.location.search)
  const utmParams: UTMParams = {}
  
  const utmKeys = ['utm_source', 'utm_medium', 'utm_campaign', 'utm_content', 'utm_term']
  utmKeys.forEach(key => {
    const value = params.get(key)
    if (value) {
      utmParams[key as keyof UTMParams] = value
    }
  })
  
  return utmParams
}

/**
 * Build the complete affiliate URL with all tracking parameters
 */
export function buildAffiliateUrl(
  tour: Tour,
  context: 'tour-detail' | 'tour-card' | 'featured' = 'tour-detail'
): string {
  // Start with the base affiliate URL or construct from operator
  let baseUrl = tour.affiliateUrl || ''
  
  if (!baseUrl && tour.operator) {
    // All tours should redirect to BNAdventure as per PRD
    baseUrl = `https://www.bnadventure.com/tours/${tour.slug}`
  }
  
  if (!baseUrl) {
    // Final fallback - use BNAdventure as specified in PRD
    console.warn('No affiliate URL available for tour, using BNAdventure fallback:', tour.slug)
    baseUrl = `https://www.bnadventure.com/tours/${tour.slug}`
  }
  
  try {
    const url = new URL(baseUrl)
    
    // Add default affiliate parameters if not present
    if (!url.searchParams.has('partner_id')) {
      url.searchParams.set('partner_id', '9')
    }
    if (!url.searchParams.has('tid')) {
      url.searchParams.set('tid', 'albaniavisit')
    }
    
    // Extract current page UTM params
    const pageUTMParams = extractUTMParams()
    
    // Set UTM parameters with AlbaniaVisit defaults
    url.searchParams.set('utm_source', pageUTMParams.utm_source || 'albaniavisit')
    url.searchParams.set('utm_medium', pageUTMParams.utm_medium || 'affiliate')
    url.searchParams.set('utm_campaign', pageUTMParams.utm_campaign || context)
    url.searchParams.set('utm_content', pageUTMParams.utm_content || tour.slug)
    
    if (pageUTMParams.utm_term) {
      url.searchParams.set('utm_term', pageUTMParams.utm_term)
    }
    
    // Add extra tracking fields
    url.searchParams.set('click_id', generateClickId())
    url.searchParams.set('source', 'tours.albaniavisit.com')
    url.searchParams.set('ref_time', Date.now().toString())
    
    return url.toString()
  } catch (error) {
    console.error('Error building affiliate URL:', error)
    return baseUrl
  }
}

/**
 * Track booking click across multiple platforms
 */
export async function trackBookingClick(tour: Tour, context: string = 'tour-detail'): Promise<void> {
  const clickData = {
    tour_id: tour.id,
    tour_slug: tour.slug,
    tour_title: tour.title,
    operator: tour.operator?.name || 'unknown',
    context,
    timestamp: Date.now(),
    utm_params: extractUTMParams()
  }
  
  // Track with Google Analytics 4
  if (typeof window !== 'undefined' && (window as any).gtag) {
    (window as any).gtag('event', 'affiliate_click', {
      tour_slug: tour.slug,
      tour_id: tour.id,
      tour_title: tour.title,
      event_category: 'engagement',
      event_label: context,
      value: 1
    })
  }
  
  // Track with Facebook Pixel if available
  if (typeof window !== 'undefined' && (window as any).fbq) {
    (window as any).fbq('track', 'ViewContent', {
      content_ids: [tour.id],
      content_name: tour.title,
      content_type: 'product',
      content_category: context
    })
  }
  
  // Server-side tracking
  try {
    await fetch('/api/track-click', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(clickData)
    })
  } catch (error) {
    console.error('Failed to track click server-side:', error)
  }
}
