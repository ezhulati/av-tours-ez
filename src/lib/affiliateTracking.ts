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
  // Validate required tour data
  if (!tour || !tour.slug) {
    console.error('Invalid tour data provided to buildAffiliateUrl:', tour)
    return 'https://www.bnadventure.com/?partner_id=9&tid=albaniavisit'
  }
  
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
  
  // Validate base URL before proceeding
  if (!baseUrl || typeof baseUrl !== 'string') {
    console.error('Invalid base URL generated:', baseUrl)
    return `https://www.bnadventure.com/tours/${tour.slug}?partner_id=9&tid=albaniavisit`
  }
  
  try {
    // Ensure the URL has a protocol
    if (!baseUrl.match(/^https?:\/\//)) {
      baseUrl = 'https://' + baseUrl
    }
    
    const url = new URL(baseUrl)
    
    // Add default affiliate parameters if not present
    if (!url.searchParams.has('partner_id')) {
      url.searchParams.set('partner_id', '9')
    }
    if (!url.searchParams.has('tid')) {
      url.searchParams.set('tid', 'albaniavisit')
    }
    
    // Extract current page UTM params (safely handle server-side)
    let pageUTMParams = {}
    try {
      pageUTMParams = extractUTMParams()
    } catch (utmError) {
      console.warn('Failed to extract UTM params:', utmError)
    }
    
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
    console.error('Error building affiliate URL for tour:', tour.slug, error)
    // Return safe fallback URL with basic tracking
    return `https://www.bnadventure.com/tours/${tour.slug}?partner_id=9&tid=albaniavisit&utm_source=albaniavisit&utm_medium=affiliate&utm_campaign=${context}&utm_content=${tour.slug}`
  }
}

/**
 * Track booking click across multiple platforms
 */
export async function trackBookingClick(tour: Tour, context: string = 'tour-detail'): Promise<void> {
  // Validate tour data
  if (!tour || !tour.id || !tour.slug) {
    console.error('Invalid tour data provided to trackBookingClick:', tour)
    return
  }

  // Extract UTM params safely
  let utmParams = {}
  try {
    utmParams = extractUTMParams()
  } catch (utmError) {
    console.warn('Failed to extract UTM params for tracking:', utmError)
  }

  const clickData = {
    tour_id: tour.id,
    tour_slug: tour.slug,
    tour_title: tour.title || 'Unknown Tour',
    operator: tour.operator?.name || 'unknown',
    context,
    timestamp: Date.now(),
    utm_params: utmParams
  }
  
  // Track with Google Analytics 4 (client-side only)
  if (typeof window !== 'undefined' && (window as any).gtag) {
    try {
      (window as any).gtag('event', 'affiliate_click', {
        tour_slug: tour.slug,
        tour_id: tour.id,
        tour_title: tour.title,
        event_category: 'engagement',
        event_label: context,
        value: 1
      })
    } catch (gaError) {
      console.warn('Failed to track with Google Analytics:', gaError)
    }
  }
  
  // Track with Facebook Pixel if available (client-side only)
  if (typeof window !== 'undefined' && (window as any).fbq) {
    try {
      (window as any).fbq('track', 'ViewContent', {
        content_ids: [tour.id],
        content_name: tour.title,
        content_type: 'product',
        content_category: context
      })
    } catch (fbError) {
      console.warn('Failed to track with Facebook Pixel:', fbError)
    }
  }
  
  // Server-side tracking - make it non-blocking
  if (typeof window !== 'undefined') {
    // Client-side: use fetch with timeout
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 3000) // 3 second timeout
    
    try {
      await fetch('/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clickData),
        signal: controller.signal
      })
      clearTimeout(timeoutId)
    } catch (error) {
      clearTimeout(timeoutId)
      console.warn('Failed to track click server-side (non-critical):', error)
      // Don't throw - this shouldn't block user interaction
    }
  } else {
    // Server-side: use standard fetch
    try {
      const response = await fetch('https://tours.albaniavisit.com/api/track-click', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(clickData)
      })
      if (!response.ok) {
        console.warn('Server-side tracking response not OK:', response.status)
      }
    } catch (error) {
      console.warn('Failed to track click server-side (non-critical):', error)
      // Don't throw - this shouldn't block the redirect
    }
  }
}
