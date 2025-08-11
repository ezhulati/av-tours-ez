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

// Extract the featured product image and gallery from BNAdventure
async function extractFeaturedImage(url: string): Promise<{ featured: string | null, gallery: string[] }> {
  try {
    const response = await fetch(url, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
      }
    })
    
    if (!response.ok) {
      console.error(`Failed to fetch ${url}: ${response.status}`)
      return { featured: null, gallery: [] }
    }
    
    const html = await response.text()
    const $ = cheerio.load(html)
    
    let featuredImage: string | null = null
    const galleryImages: string[] = []
    
    // Priority 1: WooCommerce main product image (most reliable)
    const wooMainImage = $('.woocommerce-product-gallery__wrapper .woocommerce-product-gallery__image:first-child img').attr('data-large_image') ||
                        $('.woocommerce-product-gallery__wrapper .woocommerce-product-gallery__image:first-child img').attr('src') ||
                        $('.woocommerce-product-gallery__image:first-child a').attr('href')
    
    if (wooMainImage) {
      featuredImage = new URL(wooMainImage, url).href
      console.log('   Found WooCommerce featured image')
    }
    
    // Priority 2: Product featured image
    if (!featuredImage) {
      const productImage = $('.product-image img').first().attr('src') ||
                          $('.product-featured-image img').attr('src') ||
                          $('.main-image img').attr('src') ||
                          $('.product-photo-main img').attr('src')
      
      if (productImage) {
        featuredImage = new URL(productImage, url).href
        console.log('   Found product featured image')
      }
    }
    
    // Priority 3: Open Graph image (usually the featured image)
    if (!featuredImage) {
      const ogImage = $('meta[property="og:image"]').attr('content')
      if (ogImage && !ogImage.includes('logo') && !ogImage.includes('default')) {
        featuredImage = new URL(ogImage, url).href
        console.log('   Using Open Graph image')
      }
    }
    
    // Collect gallery images (excluding the featured image)
    $('.woocommerce-product-gallery__image').each((_, elem) => {
      const img = $(elem).find('img')
      const src = img.attr('data-large_image') || img.attr('src')
      const link = $(elem).find('a').attr('href')
      
      const imageUrl = src || link
      if (imageUrl) {
        const fullUrl = new URL(imageUrl, url).href
        if (fullUrl !== featuredImage && isValidTourImage(fullUrl)) {
          galleryImages.push(fullUrl)
        }
      }
    })
    
    // Also check for gallery in other common locations
    $('.product-thumbnails img, .product-gallery img, .gallery-item img').each((_, elem) => {
      const src = $(elem).attr('src') || $(elem).attr('data-src')
      if (src) {
        const fullUrl = new URL(src, url).href
        if (fullUrl !== featuredImage && isValidTourImage(fullUrl) && !galleryImages.includes(fullUrl)) {
          galleryImages.push(fullUrl)
        }
      }
    })
    
    // If still no featured image, use the first valid large image on the page
    if (!featuredImage) {
      $('img').each((_, elem) => {
        if (featuredImage) return // Already found
        
        const src = $(elem).attr('src') || $(elem).attr('data-src')
        if (src && isValidTourImage(src)) {
          // Check if it's a reasonably large image (not a thumbnail)
          const imgUrl = new URL(src, url).href
          if (!imgUrl.includes('-150x') && !imgUrl.includes('-300x') && !imgUrl.includes('thumbnail')) {
            featuredImage = imgUrl
            console.log('   Using first large image found')
          }
        }
      })
    }
    
    return { 
      featured: featuredImage,
      gallery: galleryImages.slice(0, 10) // Limit to 10 gallery images
    }
    
  } catch (error) {
    console.error(`Error extracting images from ${url}:`, error)
    return { featured: null, gallery: [] }
  }
}

// Check if an image URL is valid for a tour
function isValidTourImage(url: string): boolean {
  const lower = url.toLowerCase()
  
  // Skip unwanted images
  const skipPatterns = [
    'logo', 'icon', 'avatar', 'payment', 'badge', 'flag',
    'placeholder', 'loading', '.svg', 'data:image',
    'facebook', 'twitter', 'instagram', 'youtube',
    'arrow', 'close', 'menu', 'search', 'cart',
    'wishlist', 'compare', 'share'
  ]
  
  if (skipPatterns.some(pattern => lower.includes(pattern))) {
    return false
  }
  
  // Only include actual image files
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  return imageExtensions.some(ext => lower.includes(ext))
}

async function syncFeaturedImages() {
  console.log('🎯 Starting featured image sync for all tours...\n')
  console.log('This will use the same featured image that BNAdventure displays\n')
  
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
    console.log('=' .repeat(60) + '\n')
    
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
      
      console.log(`📸 Processing: ${tour.title}`)
      console.log(`   URL: ${url}`)
      
      // Extract featured image and gallery
      const { featured, gallery } = await extractFeaturedImage(url)
      
      if (!featured) {
        console.log(`   ❌ No featured image found`)
        failed++
        continue
      }
      
      console.log(`   ✅ Featured: ${featured.substring(featured.lastIndexOf('/') + 1)}`)
      if (gallery.length > 0) {
        console.log(`   📚 Gallery: ${gallery.length} additional images`)
      }
      
      // Update the tour with the featured image
      const updateData: any = {
        primary_image: featured,
        updated_at: new Date().toISOString()
      }
      
      // Include gallery if we found images
      if (gallery.length > 0) {
        // Ensure featured image is first, then add gallery
        updateData.image_gallery = [featured, ...gallery]
      } else if (!tour.image_gallery || tour.image_gallery.length === 0) {
        // If no existing gallery, at least set the featured image
        updateData.image_gallery = [featured]
      }
      
      const { error: updateError } = await supabase
        .from('affiliate_tours')
        .update(updateData)
        .eq('id', tour.id)
      
      if (updateError) {
        console.error(`   ❌ Failed to update:`, updateError.message)
        failed++
      } else {
        console.log(`   ✅ Updated successfully`)
        updated++
      }
      
      console.log() // Empty line for readability
      
      // Small delay to be respectful to the server
      await new Promise(resolve => setTimeout(resolve, 500))
    }
    
    console.log('=' .repeat(60))
    console.log('📊 SYNC SUMMARY:')
    console.log('=' .repeat(60))
    console.log(`✅ Updated: ${updated} tours`)
    console.log(`⏭️  Skipped: ${skipped} tours`)
    console.log(`❌ Failed: ${failed} tours`)
    console.log('\n✨ Featured image sync completed!')
    console.log('All tours now use the same featured image as BNAdventure')
    
  } catch (error) {
    console.error('Fatal error during sync:', error)
  }
}

// Run the sync
syncFeaturedImages()