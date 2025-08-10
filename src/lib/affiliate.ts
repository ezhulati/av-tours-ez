import { supabaseServer, isSupabaseConfigured } from './supabase.server'
import { TABLES } from './adapters/dbMapper'

export function injectAffiliateParams(
  url: string, 
  slug: string,
  utmParams?: Record<string, string>
): string {
  try {
    const urlObj = new URL(url)
    
    // Inject our affiliate parameters
    if (!urlObj.searchParams.has('partner_id')) {
      urlObj.searchParams.set('partner_id', '9')
    }
    if (!urlObj.searchParams.has('tid')) {
      urlObj.searchParams.set('tid', 'albaniavisit')
    }
    urlObj.searchParams.set('src', `/tours/${slug}`)
    
    // Add UTM parameters if provided
    if (utmParams) {
      Object.entries(utmParams).forEach(([key, value]) => {
        if (value && key.startsWith('utm_')) {
          urlObj.searchParams.set(key, value)
        }
      })
    }
    
    // Add tracking fields
    urlObj.searchParams.set('click_id', generateClickId())
    urlObj.searchParams.set('source', 'tours.albaniavisit.com')
    urlObj.searchParams.set('ref_time', Date.now().toString())
    
    return urlObj.toString()
  } catch {
    // If URL parsing fails, append parameters manually
    const separator = url.includes('?') ? '&' : '?'
    const clickId = generateClickId()
    const refTime = Date.now()
    return `${url}${separator}partner_id=9&tid=albaniavisit&src=/tours/${slug}&click_id=${clickId}&source=tours.albaniavisit.com&ref_time=${refTime}`
  }
}

export async function logAffiliateClick(
  tourSlug: string,
  tourId: string,
  affiliateUrl: string,
  userAgent?: string,
  ipAddress?: string,
  cookieId?: string
) {
  try {
    // Check if Supabase is configured
    if (!isSupabaseConfigured()) {
      console.warn('Supabase not configured - skipping affiliate click logging')
      return
    }
    
    await supabaseServer
      .from(TABLES.clicks)
      .insert({
        tour_slug: tourSlug,
        tour_id: tourId,
        affiliate_url: affiliateUrl,
        user_agent: userAgent,
        ip_address: ipAddress,
        cookie_id: cookieId,
        clicked_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Failed to log affiliate click:', error)
  }
}

export function generateCookieId(): string {
  return `aff_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

export function generateClickId(): string {
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 9)
  return `clk_${timestamp}_${random}`
}