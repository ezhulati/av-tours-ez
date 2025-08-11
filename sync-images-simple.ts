import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface Tour {
  id: string
  slug: string
  title: string
  source_url: string | null
  affiliate_url: string | null
  primary_image: string | null
  image_gallery: string[] | null
}

// Simple image extraction using cheerio (no browser needed)
async function extractImagesFromUrl(url: string): Promise<string[]> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`)
      return []
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    const images = new Set<string>()
    
    // Extract images from various sources
    // 1. Regular img tags
    $('img').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src') || $(elem).attr('data-lazy-src')
      if (src) {
        const fullUrl = new URL(src, url).href
        if (isValidTourImage(fullUrl)) {
          images.add(fullUrl)
        }
      }
    })
    
    // 2. Background images
    $('[style*="background-image"]').each((_, elem) => {
      const style = $(elem).attr('style') || ''
      const match = style.match(/url\(['"]?([^'")]+)['"]?\)/)
      if (match && match[1]) {
        const fullUrl = new URL(match[1], url).href
        if (isValidTourImage(fullUrl)) {
          images.add(fullUrl)
        }
      }
    })
    
    // 3. Gallery/carousel images
    $('.gallery img, .carousel img, .swiper-slide img, .product-image img').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src')
      if (src) {
        const fullUrl = new URL(src, url).href
        if (isValidTourImage(fullUrl)) {
          images.add(fullUrl)
        }
      }
    })
    
    // 4. WooCommerce product gallery
    $('.woocommerce-product-gallery__image img').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-large_image')
      if (src) {
        const fullUrl = new URL(src, url).href
        if (isValidTourImage(fullUrl)) {
          images.add(fullUrl)
        }
      }
    })
    
    // 5. Links to images
    $('a[href$=".jpg"], a[href$=".jpeg"], a[href$=".png"], a[href$=".webp"]').each((_, elem) => {
      const href = $(elem).attr('href')
      if (href) {
        const fullUrl = new URL(href, url).href
        if (isValidTourImage(fullUrl)) {
          images.add(fullUrl)
        }
      }
    })
    
    return Array.from(images)
  } catch (error) {
    console.error(`Error extracting images from ${url}:`, error)
    return []
  }
}

// Check if an image URL is valid for a tour (not a logo, icon, etc.)
function isValidTourImage(url: string): boolean {
  const lower = url.toLowerCase()
  
  // Skip unwanted images
  const skipPatterns = [
    'logo', 'icon', 'avatar', 'payment', 'badge', 'flag',
    'placeholder', 'loading', '.svg', 'data:image',
    'facebook', 'twitter', 'instagram', 'youtube',
    'arrow', 'close', 'menu', 'search'
  ]
  
  if (skipPatterns.some(pattern => lower.includes(pattern))) {
    return false
  }
  
  // Only include actual image files
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  return imageExtensions.some(ext => lower.includes(ext))
}

// Get a unique primary image for a tour (avoiding duplicates)
function selectPrimaryImage(images: string[], usedImages: Set<string>): string | null {
  // Try to find an unused image
  for (const img of images) {
    if (!usedImages.has(img)) {
      return img
    }
  }
  
  // If all images are used, try to find the least used one
  // For now, just return the first image if available
  return images[0] || null
}

async function syncAllTourImages() {
  console.log('🚀 Starting simple image sync for all tours...\n')
  
  try {
    // Get all active tours
    const { data: tours, error } = await supabase
      .from('affiliate_tours')
      .select('id, slug, title, source_url, affiliate_url, primary_image, image_gallery')
      .eq('is_active', true)
      .order('title')
    
    if (error || !tours) {
      console.error('Error fetching tours:', error)
      return
    }
    
    console.log(`Found ${tours.length} tours to process\n`)
    
    // Track used primary images to avoid duplicates
    const usedPrimaryImages = new Set<string>()
    
    // First, collect all currently used primary images
    tours.forEach(tour => {
      if (tour.primary_image) {
        usedPrimaryImages.add(tour.primary_image)
      }
    })
    
    let updated = 0
    let failed = 0
    let skipped = 0
    
    // Process each tour
    for (const tour of tours) {
      const url = tour.source_url || tour.affiliate_url
      
      if (!url) {
        console.log(`⏭️  ${tour.title}: No URL available`)
        skipped++
        continue
      }
      
      // Check if this tour is using a duplicate image
      const isDuplicate = tour.primary_image && 
        (tour.primary_image.includes('DSCF9726') || 
         tour.primary_image.includes('DB__8182') ||
         tour.primary_image.includes('kosovi-skitour-SSchoepf-53'))
      
      if (!isDuplicate && tour.image_gallery && tour.image_gallery.length > 3) {
        console.log(`⏭️  ${tour.title}: Already has unique images`)
        skipped++
        continue
      }
      
      console.log(`📸 Processing: ${tour.title}`)
      
      // Extract images from the tour page
      const images = await extractImagesFromUrl(url)
      
      if (images.length === 0) {
        console.log(`   ❌ No images found`)
        failed++
        continue
      }
      
      console.log(`   ✅ Found ${images.length} images`)
      
      // Select a unique primary image
      const primaryImage = selectPrimaryImage(images, usedPrimaryImages)
      
      if (primaryImage) {
        usedPrimaryImages.add(primaryImage)
        
        // Update the tour with new images
        const { error: updateError } = await supabase
          .from('affiliate_tours')
          .update({
            primary_image: primaryImage,
            image_gallery: images.slice(0, 10), // Limit to 10 images
            updated_at: new Date().toISOString()
          })
          .eq('id', tour.id)
        
        if (updateError) {
          console.error(`   ❌ Failed to update:`, updateError.message)
          failed++
        } else {
          console.log(`   ✅ Updated with ${images.length} images`)
          updated++
        }
      } else {
        console.log(`   ⚠️  No unique primary image available`)
        skipped++
      }
      
      // Small delay to be respectful
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log('\n' + '='.repeat(60))
    console.log('📊 SYNC SUMMARY:')
    console.log('='.repeat(60))
    console.log(`✅ Updated: ${updated} tours`)
    console.log(`⏭️  Skipped: ${skipped} tours`)
    console.log(`❌ Failed: ${failed} tours`)
    console.log('\n✨ Image sync completed!')
    
  } catch (error) {
    console.error('Fatal error during sync:', error)
  }
}

// Run the sync
syncAllTourImages()