import type { APIRoute } from 'astro'
import { supabaseServer, isSupabaseConfigured } from '@/lib/supabase.server'
import { TABLES } from '@/lib/adapters/dbMapper'

// Price extraction regex patterns for BNAdventure
const PRICE_PATTERNS = [
  /€\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*€/gi,
  /EUR\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /Price:\s*€?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
  /From\s*€?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,
]

interface PriceCheckResult {
  tourId: string
  slug: string
  title: string
  currentPrice: string | null
  bnAdventurePrice: string | null
  needsUpdate: boolean
  error?: string
}

// Helper to clean price strings
function cleanPrice(price: string): number | null {
  if (!price) return null
  const cleaned = price.replace(/[€$£,\s]/g, '')
  const num = parseFloat(cleaned)
  return isNaN(num) ? null : num
}

// Helper to format price for database
function formatPrice(minPrice: number, maxPrice?: number): string {
  if (maxPrice && maxPrice > minPrice) {
    return `€${minPrice}-${maxPrice}`
  }
  return `€${minPrice}`
}

// Extract price from BNAdventure page HTML
async function extractPriceFromBNAdventure(url: string): Promise<string | null> {
  try {
    const urlObj = new URL(url)
    urlObj.searchParams.set('partner_id', '9')
    urlObj.searchParams.set('tid', 'albaniavisit')
    
    const response = await fetch(urlObj.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlbaniaVisit Price Sync/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
      },
      redirect: 'follow',
    })
    
    if (!response.ok) return null
    
    const html = await response.text()
    
    // Try to find price in common locations
    const priceSelectors = [
      /"price":\s*"?(\d+(?:\.\d{2})?)"?/i,
      /"priceRange":\s*"([^"]+)"/i,
      /<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i,
      /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)</i,
      /data-price="([^"]+)"/i,
    ]
    
    let prices: number[] = []
    
    for (const pattern of priceSelectors) {
      const matches = html.matchAll(new RegExp(pattern, 'gi'))
      for (const match of matches) {
        if (match[1]) {
          for (const pricePattern of PRICE_PATTERNS) {
            const priceMatches = match[1].matchAll(pricePattern)
            for (const priceMatch of priceMatches) {
              const price = cleanPrice(priceMatch[1] || priceMatch[0])
              if (price && price > 0 && price < 100000) {
                prices.push(price)
              }
            }
          }
          
          const directPrice = cleanPrice(match[1])
          if (directPrice && directPrice > 0 && directPrice < 100000) {
            prices.push(directPrice)
          }
        }
      }
    }
    
    // Also try broader search
    for (const pattern of PRICE_PATTERNS) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        const price = cleanPrice(match[1] || match[0])
        if (price && price > 0 && price < 100000) {
          prices.push(price)
        }
      }
    }
    
    if (prices.length === 0) return null
    
    prices = [...new Set(prices)].sort((a, b) => a - b)
    
    if (prices.length === 1) {
      return formatPrice(prices[0])
    } else if (prices.length > 1) {
      const minPrice = prices[0]
      const maxPrice = prices[prices.length - 1]
      
      if (maxPrice / minPrice < 3) {
        return formatPrice(minPrice, maxPrice)
      } else {
        return formatPrice(minPrice)
      }
    }
    
    return null
  } catch (error) {
    console.error(`Error fetching price from ${url}:`, error)
    return null
  }
}

// Add delay to avoid rate limiting
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('Authorization')
    const adminKey = import.meta.env.ADMIN_API_KEY || process.env.ADMIN_API_KEY
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    if (!isSupabaseConfigured()) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get request body for optional filters
    const body = await request.json().catch(() => ({}))
    const { dryRun = false, tourIds = null } = body
    
    // Fetch tours to check
    let query = supabaseServer
      .from(TABLES.tours)
      .select('id, slug, title, price, affiliate_url, source_url')
      .eq('is_active', true)
      .order('created_at', { ascending: false })
    
    if (tourIds && Array.isArray(tourIds)) {
      query = query.in('id', tourIds)
    }
    
    const { data: tours, error } = await query
    
    if (error) throw error
    
    if (!tours || tours.length === 0) {
      return new Response(JSON.stringify({
        message: 'No tours found',
        summary: { totalChecked: 0, updated: 0 }
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const results: PriceCheckResult[] = []
    let checkedCount = 0
    let updateCount = 0
    let errorCount = 0
    
    // Process tours
    for (const tour of tours) {
      checkedCount++
      
      const affiliateUrl = tour.affiliate_url || tour.source_url
      
      if (!affiliateUrl) {
        results.push({
          tourId: tour.id,
          slug: tour.slug,
          title: tour.title,
          currentPrice: tour.price,
          bnAdventurePrice: null,
          needsUpdate: false,
          error: 'No affiliate URL'
        })
        continue
      }
      
      // Extract price from BNAdventure
      const bnPrice = await extractPriceFromBNAdventure(affiliateUrl)
      
      if (!bnPrice) {
        errorCount++
        results.push({
          tourId: tour.id,
          slug: tour.slug,
          title: tour.title,
          currentPrice: tour.price,
          bnAdventurePrice: null,
          needsUpdate: false,
          error: 'Could not extract price'
        })
      } else {
        const needsUpdate = tour.price !== bnPrice
        
        if (needsUpdate) {
          updateCount++
          
          if (!dryRun) {
            // Update the database
            await supabaseServer
              .from(TABLES.tours)
              .update({ price: bnPrice })
              .eq('id', tour.id)
          }
        }
        
        results.push({
          tourId: tour.id,
          slug: tour.slug,
          title: tour.title,
          currentPrice: tour.price,
          bnAdventurePrice: bnPrice,
          needsUpdate
        })
      }
      
      // Add delay between requests
      await delay(500)
    }
    
    // Store sync log in database
    await supabaseServer
      .from('price_sync_logs')
      .insert({
        timestamp: new Date().toISOString(),
        total_checked: checkedCount,
        successful_extractions: checkedCount - errorCount,
        failed_extractions: errorCount,
        tours_updated: dryRun ? 0 : updateCount,
        dry_run: dryRun,
        results: JSON.stringify(results)
      })
    
    return new Response(JSON.stringify({
      message: dryRun ? 'Dry run completed' : 'Price sync completed',
      summary: {
        totalChecked: checkedCount,
        successfulExtractions: checkedCount - errorCount,
        failedExtractions: errorCount,
        toursNeedingUpdate: updateCount,
        toursUpdated: dryRun ? 0 : updateCount
      },
      results: results.filter(r => r.needsUpdate)
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Price sync error:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}

// GET endpoint to retrieve last sync status
export const GET: APIRoute = async ({ request }) => {
  try {
    // Check for admin authorization
    const authHeader = request.headers.get('Authorization')
    const adminKey = import.meta.env.ADMIN_API_KEY || process.env.ADMIN_API_KEY
    
    if (!adminKey || authHeader !== `Bearer ${adminKey}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    if (!isSupabaseConfigured()) {
      return new Response(JSON.stringify({ error: 'Database not configured' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    // Get last sync log
    const { data, error } = await supabaseServer
      .from('price_sync_logs')
      .select('*')
      .order('timestamp', { ascending: false })
      .limit(1)
      .single()
    
    if (error || !data) {
      return new Response(JSON.stringify({ 
        message: 'No sync history found' 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify({
      lastSync: data.timestamp,
      summary: {
        totalChecked: data.total_checked,
        successfulExtractions: data.successful_extractions,
        failedExtractions: data.failed_extractions,
        toursUpdated: data.tours_updated,
        dryRun: data.dry_run
      }
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
    
  } catch (error) {
    console.error('Error fetching sync status:', error)
    return new Response(JSON.stringify({ 
      error: 'Internal server error' 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}