import type { APIRoute } from 'astro'
import { getTourDetail } from '@/lib/queries'
import { buildAffiliateUrl, trackBookingClick } from '@/lib/affiliateTracking'

// This route must be server-rendered for dynamic redirects
export const prerender = false

export const GET: APIRoute = async ({ params, request, redirect }) => {
  const { slug } = params
  
  if (!slug) {
    return new Response('Tour slug is required', { status: 400 })
  }

  try {
    // Get tour details
    const tour = await getTourDetail(slug)
    
    if (!tour) {
      console.error(`Tour not found: ${slug}`)
      // Fallback to BNAdventure with search
      const fallbackUrl = `https://www.bnadventure.com/tours/?search=${encodeURIComponent(slug)}&partner_id=9&tid=albaniavisit`
      return redirect(fallbackUrl, 302)
    }

    // Convert TourDetailDTO to Tour type for affiliate functions
    const tourForTracking = {
      id: tour.id,
      slug: tour.slug,
      title: tour.title,
      affiliateUrl: tour.affiliateUrl,
      operator: tour.operator ? {
        id: tour.operator.id,
        name: tour.operator.name
      } : undefined
    }

    // Track the click
    try {
      await trackBookingClick(tourForTracking, 'server-redirect')
      console.log(`✅ Tracked click for tour: ${slug}`)
    } catch (trackError) {
      console.error('Failed to track click:', trackError)
      // Continue with redirect even if tracking fails
    }

    // Build affiliate URL with proper UTM parameters
    const affiliateUrl = buildAffiliateUrl(tourForTracking, 'tour-detail')
    
    console.log(`🔗 Redirecting ${slug} to: ${affiliateUrl}`)
    
    // 302 redirect to partner site with affiliate tracking
    return redirect(affiliateUrl, 302)
    
  } catch (error) {
    console.error(`Error processing redirect for ${slug}:`, error)
    
    // Fallback redirect to BNAdventure search
    const fallbackUrl = `https://www.bnadventure.com/tours/?search=${encodeURIComponent(slug)}&partner_id=9&tid=albaniavisit`
    return redirect(fallbackUrl, 302)
  }
}
