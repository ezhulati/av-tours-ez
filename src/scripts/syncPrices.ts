import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { TABLES } from '../lib/adapters/dbMapper'

// Load environment variables
dotenv.config()

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Price extraction regex patterns for BNAdventure
const PRICE_PATTERNS = [
  /€\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi,  // €45.00 or €1,234.56
  /(\d+(?:,\d{3})*(?:\.\d{2})?)\s*€/gi,  // 45.00€
  /EUR\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // EUR 45.00
  /Price:\s*€?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // Price: 45.00
  /From\s*€?\s*(\d+(?:,\d{3})*(?:\.\d{2})?)/gi, // From 45.00
]

interface Tour {
  id: string
  slug: string
  title: string
  price: string | null
  affiliate_url: string | null
  source_url: string | null
}

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
  
  // Remove currency symbols and spaces
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
    // Add affiliate parameters to URL
    const urlObj = new URL(url)
    urlObj.searchParams.set('partner_id', '9')
    urlObj.searchParams.set('tid', 'albaniavisit')
    
    const response = await fetch(urlObj.toString(), {
      headers: {
        'User-Agent': 'Mozilla/5.0 (compatible; AlbaniaVisit Price Sync Bot/1.0)',
        'Accept': 'text/html,application/xhtml+xml',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      redirect: 'follow',
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`)
      return null
    }
    
    const html = await response.text()
    
    // Try to find price in common locations
    const priceSelectors = [
      // Look for structured data
      /"price":\s*"?(\d+(?:\.\d{2})?)"?/i,
      /"priceRange":\s*"([^"]+)"/i,
      // Look for meta tags
      /<meta[^>]*property="product:price:amount"[^>]*content="([^"]+)"/i,
      /<meta[^>]*name="price"[^>]*content="([^"]+)"/i,
      // Look for common price display patterns
      /<span[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)</i,
      /<div[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)</i,
      /<p[^>]*class="[^"]*price[^"]*"[^>]*>([^<]+)</i,
      // Look for data attributes
      /data-price="([^"]+)"/i,
      /data-amount="([^"]+)"/i,
    ]
    
    let prices: number[] = []
    
    // Try each selector pattern
    for (const pattern of priceSelectors) {
      const matches = html.matchAll(new RegExp(pattern, 'gi'))
      for (const match of matches) {
        if (match[1]) {
          // Try to extract numeric price from the match
          for (const pricePattern of PRICE_PATTERNS) {
            const priceMatches = match[1].matchAll(pricePattern)
            for (const priceMatch of priceMatches) {
              const price = cleanPrice(priceMatch[1] || priceMatch[0])
              if (price && price > 0 && price < 100000) { // Sanity check
                prices.push(price)
              }
            }
          }
          
          // Also try direct numeric extraction
          const directPrice = cleanPrice(match[1])
          if (directPrice && directPrice > 0 && directPrice < 100000) {
            prices.push(directPrice)
          }
        }
      }
    }
    
    // Try broader search in the HTML
    for (const pattern of PRICE_PATTERNS) {
      const matches = html.matchAll(pattern)
      for (const match of matches) {
        const price = cleanPrice(match[1] || match[0])
        if (price && price > 0 && price < 100000) {
          prices.push(price)
        }
      }
    }
    
    if (prices.length === 0) {
      return null
    }
    
    // Remove duplicates and sort
    prices = [...new Set(prices)].sort((a, b) => a - b)
    
    // Return the most likely price (usually the first valid one found)
    // If there are multiple prices, format as range
    if (prices.length === 1) {
      return formatPrice(prices[0])
    } else if (prices.length > 1) {
      // Filter out outliers (prices that are too different)
      const minPrice = prices[0]
      const maxPrice = prices[prices.length - 1]
      
      // If the range is reasonable, return it
      if (maxPrice / minPrice < 3) { // Max is less than 3x min
        return formatPrice(minPrice, maxPrice)
      } else {
        // Otherwise just return the minimum price
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

// Main synchronization function
async function syncPrices() {
  console.log('Starting price synchronization...\n')
  
  // Fetch all active tours from database
  const { data: tours, error } = await supabase
    .from(TABLES.tours)
    .select('id, slug, title, price, affiliate_url, source_url')
    .eq('is_active', true)
    .order('created_at', { ascending: false })
  
  if (error) {
    console.error('Failed to fetch tours:', error)
    return
  }
  
  if (!tours || tours.length === 0) {
    console.log('No tours found in database')
    return
  }
  
  console.log(`Found ${tours.length} tours to check\n`)
  
  const results: PriceCheckResult[] = []
  let checkedCount = 0
  let errorCount = 0
  let updateCount = 0
  
  // Process tours in batches to avoid overwhelming the server
  for (const tour of tours) {
    checkedCount++
    console.log(`[${checkedCount}/${tours.length}] Checking: ${tour.title}`)
    
    const affiliateUrl = tour.affiliate_url || tour.source_url
    
    if (!affiliateUrl) {
      console.log(`  ⚠️  No affiliate URL found`)
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
      console.log(`  ⚠️  Could not extract price from BNAdventure`)
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
      // Compare prices
      const needsUpdate = tour.price !== bnPrice
      
      if (needsUpdate) {
        console.log(`  ✓ Price mismatch found:`)
        console.log(`    Current: ${tour.price || 'null'}`)
        console.log(`    BNAdventure: ${bnPrice}`)
        updateCount++
      } else {
        console.log(`  ✓ Price matches: ${bnPrice}`)
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
    
    // Add delay between requests to be respectful
    await delay(1000) // 1 second delay
  }
  
  console.log('\n' + '='.repeat(80))
  console.log('PRICE SYNCHRONIZATION SUMMARY')
  console.log('='.repeat(80))
  console.log(`Total tours checked: ${checkedCount}`)
  console.log(`Successful price extractions: ${checkedCount - errorCount}`)
  console.log(`Failed extractions: ${errorCount}`)
  console.log(`Tours needing price updates: ${updateCount}`)
  
  // Show tours that need updates
  const toUpdate = results.filter(r => r.needsUpdate)
  if (toUpdate.length > 0) {
    console.log('\n' + '-'.repeat(80))
    console.log('TOURS REQUIRING PRICE UPDATES:')
    console.log('-'.repeat(80))
    
    for (const result of toUpdate) {
      console.log(`\n${result.title} (${result.slug})`)
      console.log(`  Current price: ${result.currentPrice || 'null'}`)
      console.log(`  BNAdventure price: ${result.bnAdventurePrice}`)
    }
    
    // Ask for confirmation before updating
    console.log('\n' + '-'.repeat(80))
    console.log('Would you like to update these prices in the database? (y/n)')
    
    // For automated script, we'll proceed with updates
    // In production, you might want to add a flag or parameter to control this
    const shouldUpdate = true // or read from process.argv
    
    if (shouldUpdate) {
      console.log('\nUpdating prices in database...')
      
      let successCount = 0
      let failCount = 0
      
      for (const result of toUpdate) {
        const { error: updateError } = await supabase
          .from(TABLES.tours)
          .update({ price: result.bnAdventurePrice })
          .eq('id', result.tourId)
        
        if (updateError) {
          console.error(`Failed to update ${result.slug}:`, updateError)
          failCount++
        } else {
          console.log(`✓ Updated ${result.slug} to ${result.bnAdventurePrice}`)
          successCount++
        }
      }
      
      console.log('\n' + '='.repeat(80))
      console.log('UPDATE COMPLETE')
      console.log('='.repeat(80))
      console.log(`Successfully updated: ${successCount} tours`)
      console.log(`Failed updates: ${failCount} tours`)
    }
  } else {
    console.log('\n✓ All prices are in sync! No updates needed.')
  }
  
  // Save detailed report
  const reportPath = `/Users/mbp-ez/Desktop/AI Library/Apps/AV Tours EZ/price-sync-report-${new Date().toISOString().split('T')[0]}.json`
  const report = {
    timestamp: new Date().toISOString(),
    summary: {
      totalChecked: checkedCount,
      successfulExtractions: checkedCount - errorCount,
      failedExtractions: errorCount,
      needingUpdates: updateCount,
      updated: toUpdate.length
    },
    results
  }
  
  const fs = await import('fs/promises')
  await fs.writeFile(reportPath, JSON.stringify(report, null, 2))
  console.log(`\nDetailed report saved to: ${reportPath}`)
}

// Run the sync
syncPrices().catch(console.error)