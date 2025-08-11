import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { TABLES } from '../lib/adapters/dbMapper'
import { validateScrapedPrice, validatePriceBatch } from '../lib/pricing/priceValidator'

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

// Patterns to exclude (false positives)
const EXCLUDE_PATTERNS = [
  /save\s*€?\s*\d+/gi,           // Save €10
  /\$\d+\s*off/gi,                // $10 off
  /discount/gi,                   // Discount mentions
  /deposit/gi,                    // Deposit amounts
  /child(?:ren)?\s*€?\s*\d+/gi,  // Children pricing
  /was\s*€?\s*\d+/gi,             // Original price
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
  scrapedPrice: string | null
  validatedPrice: string | null
  needsUpdate: boolean
  validationWarning?: string
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

// Enhanced price extraction with validation
async function extractAndValidatePrice(url: string, tourTitle: string): Promise<{
  price: string | null
  warning?: string
}> {
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
      return { price: null, warning: `HTTP ${response.status}` }
    }
    
    const html = await response.text()
    
    // Remove excluded patterns from HTML to avoid false positives
    let cleanedHtml = html
    for (const pattern of EXCLUDE_PATTERNS) {
      cleanedHtml = cleanedHtml.replace(pattern, '')
    }
    
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
    
    let foundPrices: string[] = []
    
    // Try structured selectors first
    for (const selector of priceSelectors) {
      const matches = cleanedHtml.match(selector)
      if (matches && matches[1]) {
        const priceText = matches[1].trim()
        foundPrices.push(priceText)
      }
    }
    
    // If no structured prices, try general patterns
    if (foundPrices.length === 0) {
      for (const pattern of PRICE_PATTERNS) {
        const matches = [...cleanedHtml.matchAll(pattern)]
        for (const match of matches) {
          if (match[1]) {
            foundPrices.push(match[1].trim())
          }
        }
      }
    }
    
    // Validate all found prices and use the first valid one
    for (const priceCandidate of foundPrices) {
      const validation = validateScrapedPrice(priceCandidate, tourTitle)
      if (validation.valid && validation.price) {
        return { price: validation.price }
      }
    }
    
    // No valid price found
    return { 
      price: null, 
      warning: `Found ${foundPrices.length} price candidates but none were valid` 
    }
    
  } catch (error) {
    console.error(`Error extracting price from ${url}:`, error)
    return { 
      price: null, 
      warning: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

// Check and sync prices for all tours
async function syncPrices() {
  console.log('🔄 Starting price synchronization with validation...\n')
  
  try {
    // Fetch all active tours
    const { data: tours, error } = await supabase
      .from(TABLES.AFFILIATE_TOURS)
      .select('id, slug, title, price, affiliate_url, source_url')
      .eq('is_active', true)
      .order('title')
    
    if (error) {
      console.error('Error fetching tours:', error)
      return
    }
    
    if (!tours || tours.length === 0) {
      console.log('No tours found')
      return
    }
    
    console.log(`Found ${tours.length} tours to check\n`)
    
    const results: PriceCheckResult[] = []
    let updated = 0
    let skipped = 0
    let failed = 0
    let invalidPrices = 0
    
    // Process each tour
    for (const tour of tours as Tour[]) {
      const url = tour.source_url || tour.affiliate_url
      
      if (!url) {
        console.log(`❌ ${tour.title}: No URL available`)
        results.push({
          tourId: tour.id,
          slug: tour.slug,
          title: tour.title,
          currentPrice: tour.price,
          scrapedPrice: null,
          validatedPrice: null,
          needsUpdate: false,
          error: 'No URL available'
        })
        failed++
        continue
      }
      
      // Extract and validate price from BNAdventure
      const { price: scrapedPrice, warning } = await extractAndValidatePrice(url, tour.title)
      
      // Validate the scraped price
      const validation = validateScrapedPrice(scrapedPrice, tour.title)
      
      const result: PriceCheckResult = {
        tourId: tour.id,
        slug: tour.slug,
        title: tour.title,
        currentPrice: tour.price,
        scrapedPrice: scrapedPrice,
        validatedPrice: validation.valid ? validation.price : null,
        needsUpdate: false,
        validationWarning: warning || validation.warning
      }
      
      if (!validation.valid) {
        // Invalid or no price found - set to null to show "Check price" in UI
        if (tour.price !== null) {
          const { error: updateError } = await supabase
            .from(TABLES.AFFILIATE_TOURS)
            .update({ 
              price: null,
              updated_at: new Date().toISOString()
            })
            .eq('id', tour.id)
          
          if (!updateError) {
            console.log(`⚠️  ${tour.title}: Price removed (was ${tour.price}, validation: ${validation.warning})`)
            result.needsUpdate = true
            invalidPrices++
          } else {
            console.error(`❌ ${tour.title}: Failed to update - ${updateError.message}`)
            failed++
          }
        } else {
          console.log(`⏭️  ${tour.title}: No valid price (keeping as null)`)
          skipped++
        }
      } else if (validation.price !== tour.price) {
        // Valid price found and different from current
        const { error: updateError } = await supabase
          .from(TABLES.AFFILIATE_TOURS)
          .update({ 
            price: validation.price,
            updated_at: new Date().toISOString()
          })
          .eq('id', tour.id)
        
        if (!updateError) {
          console.log(`✅ ${tour.title}: ${tour.price || 'null'} → ${validation.price}`)
          result.needsUpdate = true
          updated++
        } else {
          console.error(`❌ ${tour.title}: Failed to update - ${updateError.message}`)
          failed++
        }
      } else {
        console.log(`⏭️  ${tour.title}: Price unchanged (${tour.price})`)
        skipped++
      }
      
      results.push(result)
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    // Batch validation report
    const batchValidation = validatePriceBatch(
      tours.map(t => ({
        id: t.id,
        title: t.title,
        price: results.find(r => r.tourId === t.id)?.validatedPrice || null
      }))
    )
    
    // Summary
    console.log('\n' + '='.repeat(60))
    console.log('📊 PRICE SYNC SUMMARY')
    console.log('='.repeat(60))
    console.log(`✅ Updated: ${updated} tours`)
    console.log(`⚠️  Invalid prices removed: ${invalidPrices} tours`)
    console.log(`⏭️  Skipped: ${skipped} tours (no changes)`)
    console.log(`❌ Failed: ${failed} tours`)
    console.log('\n📈 Validation Statistics:')
    console.log(`   Valid prices: ${batchValidation.stats.valid}`)
    console.log(`   Invalid prices: ${batchValidation.stats.invalid}`)
    console.log(`   No price found: ${batchValidation.stats.noPrice}`)
    console.log(`   Too low (<€25): ${batchValidation.stats.tooLow}`)
    console.log(`   Too high (>€10000): ${batchValidation.stats.tooHigh}`)
    
    // Show tours with invalid prices
    if (batchValidation.invalid.length > 0) {
      console.log('\n⚠️  Tours with invalid/removed prices:')
      batchValidation.invalid.slice(0, 10).forEach(tour => {
        console.log(`   - ${tour.title}: ${tour.reason}`)
      })
      if (batchValidation.invalid.length > 10) {
        console.log(`   ... and ${batchValidation.invalid.length - 10} more`)
      }
    }
    
    console.log('\n✨ Price sync with validation completed!')
    
  } catch (error) {
    console.error('Fatal error during price sync:', error)
  }
}

// Run the sync
syncPrices()