import { supabaseServer } from './supabase.server'
import { TABLES } from './adapters/dbMapper'

export function injectAffiliateParams(url: string, slug: string): string {
  try {
    const urlObj = new URL(url)
    
    // Inject our affiliate parameters
    urlObj.searchParams.set('partner_id', '9')
    urlObj.searchParams.set('tid', 'albaniavisit')
    urlObj.searchParams.set('src', `/tours/${slug}`)
    
    return urlObj.toString()
  } catch {
    // If URL parsing fails, append parameters manually
    const separator = url.includes('?') ? '&' : '?'
    return `${url}${separator}partner_id=9&tid=albaniavisit&src=/tours/${slug}`
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