import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Function to get or create the Supabase client
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || (typeof import.meta !== 'undefined' && import.meta.env?.SUPABASE_URL)
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (typeof import.meta !== 'undefined' && import.meta.env?.SUPABASE_SERVICE_ROLE_KEY)
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: {
      persistSession: false
    }
  })
}

interface ScrapedImage {
  url: string
  alt?: string
  type: 'primary' | 'gallery' | 'thumbnail'
  width?: number
  height?: number
}

interface ScrapeResult {
  tourSlug: string
  affiliateUrl: string
  images: ScrapedImage[]
  error?: string
}

interface ImageSyncResult {
  toursProcessed: number
  imagesFound: number
  imagesAdded: number
  imagesUpdated: number
  imagesDeactivated: number
  duplicatesFound: number
  errors: string[]
}

/**
 * Calculate hash for an image URL for deduplication
 */
function calculateImageHash(url: string): string {
  // Normalize URL before hashing
  const normalizedUrl = url
    .replace(/^https?:\/\//, '') // Remove protocol
    .replace(/\?.*$/, '') // Remove query params
    .replace(/\/$/, '') // Remove trailing slash
  
  return crypto.createHash('md5').update(normalizedUrl).digest('hex')
}

/**
 * Extract image filename from URL for alt text
 */
function extractImageName(url: string): string {
  const parts = url.split('/')
  const filename = parts[parts.length - 1]
  return filename
    .replace(/\.[^/.]+$/, '') // Remove extension
    .replace(/[-_]/g, ' ') // Replace separators with spaces
    .replace(/\b\w/g, l => l.toUpperCase()) // Capitalize words
}

/**
 * Scrape images from a BNAdventure tour page
 */
export async function scrapeTourImages(affiliateUrl: string): Promise<ScrapedImage[]> {
  try {
    // Follow the affiliate URL to get the actual BNAdventure page
    const response = await fetch(affiliateUrl, {
      method: 'GET',
      headers: {
        'User-Agent': 'AlbaniaVisit-ImageSync/1.0',
      },
      redirect: 'follow'
    })

    if (!response.ok) {
      throw new Error(`HTTP ${response.status}: ${response.statusText}`)
    }

    const html = await response.text()
    const images: ScrapedImage[] = []
    
    // Parse images using regex patterns (avoiding heavy dependencies)
    // Look for common image patterns in HTML
    
    // Pattern 1: Image gallery with data attributes
    const galleryPattern = /<img[^>]*data-src="([^"]+)"[^>]*(?:alt="([^"]*)")?/gi
    let match
    while ((match = galleryPattern.exec(html)) !== null) {
      const url = match[1]
      if (url && isValidImageUrl(url)) {
        images.push({
          url: normalizeImageUrl(url, affiliateUrl),
          alt: match[2] || extractImageName(url),
          type: 'gallery'
        })
      }
    }
    
    // Pattern 2: Standard img tags
    const imgPattern = /<img[^>]*src="([^"]+)"[^>]*(?:alt="([^"]*)")?/gi
    while ((match = imgPattern.exec(html)) !== null) {
      const url = match[1]
      if (url && isValidImageUrl(url) && !url.includes('logo') && !url.includes('icon')) {
        const normalizedUrl = normalizeImageUrl(url, affiliateUrl)
        // Check if we already have this image
        if (!images.some(img => img.url === normalizedUrl)) {
          images.push({
            url: normalizedUrl,
            alt: match[2] || extractImageName(url),
            type: images.length === 0 ? 'primary' : 'gallery'
          })
        }
      }
    }
    
    // Pattern 3: Background images in style attributes
    const bgPattern = /background-image:\s*url\(['"]?([^'")]+)['"]?\)/gi
    while ((match = bgPattern.exec(html)) !== null) {
      const url = match[1]
      if (url && isValidImageUrl(url)) {
        const normalizedUrl = normalizeImageUrl(url, affiliateUrl)
        if (!images.some(img => img.url === normalizedUrl)) {
          images.push({
            url: normalizedUrl,
            alt: extractImageName(url),
            type: 'gallery'
          })
        }
      }
    }

    // Pattern 4: Srcset for responsive images
    const srcsetPattern = /srcset="([^"]+)"/gi
    while ((match = srcsetPattern.exec(html)) !== null) {
      const srcset = match[1]
      const urls = srcset.split(',').map(s => s.trim().split(' ')[0])
      for (const url of urls) {
        if (url && isValidImageUrl(url)) {
          const normalizedUrl = normalizeImageUrl(url, affiliateUrl)
          if (!images.some(img => img.url === normalizedUrl)) {
            images.push({
              url: normalizedUrl,
              alt: extractImageName(url),
              type: 'gallery'
            })
          }
        }
      }
    }
    
    // Mark the first image as primary if we have images
    if (images.length > 0 && !images.some(img => img.type === 'primary')) {
      images[0].type = 'primary'
    }
    
    return images
  } catch (error) {
    console.error('Error scraping tour images:', error)
    return []
  }
}

/**
 * Check if a URL is a valid image URL
 */
function isValidImageUrl(url: string): boolean {
  if (!url) return false
  
  // Check for common image extensions
  const imageExtensions = /\.(jpg|jpeg|png|gif|webp|svg|bmp)$/i
  if (imageExtensions.test(url)) return true
  
  // Check for image CDN patterns
  const cdnPatterns = [
    /cloudinary/i,
    /imgur/i,
    /unsplash/i,
    /pexels/i,
    /cdn/i,
    /images/i,
    /media/i,
    /uploads/i
  ]
  
  return cdnPatterns.some(pattern => pattern.test(url))
}

/**
 * Normalize image URL to absolute URL
 */
function normalizeImageUrl(url: string, baseUrl: string): string {
  // Already absolute URL
  if (url.startsWith('http://') || url.startsWith('https://')) {
    return url
  }
  
  // Protocol-relative URL
  if (url.startsWith('//')) {
    return 'https:' + url
  }
  
  // Absolute path
  if (url.startsWith('/')) {
    const base = new URL(baseUrl)
    return `${base.protocol}//${base.host}${url}`
  }
  
  // Relative path
  const base = new URL(baseUrl)
  const path = base.pathname.split('/').slice(0, -1).join('/')
  return `${base.protocol}//${base.host}${path}/${url}`
}

/**
 * Sync images for a specific tour
 */
export async function syncTourImages(
  tourSlug: string, 
  tourId: string,
  affiliateUrl: string
): Promise<{ added: number; updated: number; duplicates: number; error?: string }> {
  const supabaseServer = getSupabaseClient()
  try {
    // Scrape images from BNAdventure
    const scrapedImages = await scrapeTourImages(affiliateUrl)
    
    if (scrapedImages.length === 0) {
      return { added: 0, updated: 0, duplicates: 0, error: 'No images found' }
    }
    
    let added = 0
    let updated = 0
    let duplicates = 0
    
    // Process each scraped image
    for (let i = 0; i < scrapedImages.length; i++) {
      const image = scrapedImages[i]
      const imageHash = calculateImageHash(image.url)
      
      // Check if image already exists for this tour
      const { data: existing } = await supabaseServer
        .from('tour_images')
        .select('id, is_duplicate')
        .eq('tour_slug', tourSlug)
        .eq('image_hash', imageHash)
        .single()
      
      if (existing) {
        if (existing.is_duplicate) {
          duplicates++
        } else {
          // Update existing image
          await supabaseServer
            .from('tour_images')
            .update({
              last_validated_at: new Date().toISOString(),
              validation_status: 'valid',
              display_order: i
            })
            .eq('id', existing.id)
          updated++
        }
      } else {
        // Insert new image
        const { error } = await supabaseServer
          .from('tour_images')
          .insert({
            tour_id: tourId,
            tour_slug: tourSlug,
            image_url: image.url,
            image_alt: image.alt || `${tourSlug} image ${i + 1}`,
            image_type: image.type,
            source_url: image.url,
            source_page_url: affiliateUrl,
            image_hash: imageHash,
            width: image.width,
            height: image.height,
            display_order: i,
            validation_status: 'valid',
            scraped_at: new Date().toISOString()
          })
        
        if (!error) {
          added++
        } else if (error.message?.includes('duplicate')) {
          duplicates++
        }
      }
    }
    
    // Deactivate images that weren't found in the latest scrape
    const scrapedHashes = scrapedImages.map(img => calculateImageHash(img.url))
    await supabaseServer
      .from('tour_images')
      .update({ 
        is_active: false,
        validation_status: 'invalid',
        validation_error: 'Image not found in latest scrape'
      })
      .eq('tour_slug', tourSlug)
      .not('image_hash', 'in', `(${scrapedHashes.join(',')})`)
    
    return { added, updated, duplicates }
  } catch (error) {
    console.error(`Error syncing images for tour ${tourSlug}:`, error)
    return { 
      added: 0, 
      updated: 0, 
      duplicates: 0, 
      error: error instanceof Error ? error.message : 'Unknown error' 
    }
  }
}

/**
 * Sync images for all tours
 */
export async function syncAllTourImages(): Promise<ImageSyncResult> {
  const supabaseServer = getSupabaseClient()
  const result: ImageSyncResult = {
    toursProcessed: 0,
    imagesFound: 0,
    imagesAdded: 0,
    imagesUpdated: 0,
    imagesDeactivated: 0,
    duplicatesFound: 0,
    errors: []
  }
  
  // Create sync log entry
  const { data: syncLog } = await supabaseServer
    .from('image_sync_logs')
    .insert({
      sync_type: 'scheduled',
      status: 'running'
    })
    .select()
    .single()
  
  try {
    // Get all active tours
    const { data: tours, error: toursError } = await supabaseServer
      .from('affiliate_tours')
      .select('id, slug, affiliate_url')
      .eq('is_active', true)
      .not('affiliate_url', 'is', null)
    
    if (toursError) {
      throw toursError
    }
    
    if (!tours || tours.length === 0) {
      throw new Error('No active tours found')
    }
    
    // Process each tour
    for (const tour of tours) {
      try {
        const syncResult = await syncTourImages(tour.slug, tour.id, tour.affiliate_url)
        
        result.toursProcessed++
        result.imagesAdded += syncResult.added
        result.imagesUpdated += syncResult.updated
        result.duplicatesFound += syncResult.duplicates
        
        if (syncResult.error) {
          result.errors.push(`Tour ${tour.slug}: ${syncResult.error}`)
        }
        
        // Add delay to avoid overwhelming the server
        await new Promise(resolve => setTimeout(resolve, 2000))
      } catch (error) {
        const errorMsg = `Failed to sync tour ${tour.slug}: ${error instanceof Error ? error.message : 'Unknown error'}`
        result.errors.push(errorMsg)
        console.error(errorMsg)
      }
    }
    
    // Update sync log
    await supabaseServer
      .from('image_sync_logs')
      .update({
        completed_at: new Date().toISOString(),
        tours_processed: result.toursProcessed,
        images_found: result.imagesFound,
        images_added: result.imagesAdded,
        images_updated: result.imagesUpdated,
        images_deactivated: result.imagesDeactivated,
        duplicates_found: result.duplicatesFound,
        errors_count: result.errors.length,
        status: result.errors.length === 0 ? 'completed' : 'partial',
        error_details: result.errors.length > 0 ? { errors: result.errors } : null
      })
      .eq('id', syncLog?.id)
    
  } catch (error) {
    // Update sync log with failure
    await supabaseServer
      .from('image_sync_logs')
      .update({
        completed_at: new Date().toISOString(),
        status: 'failed',
        error_details: { 
          error: error instanceof Error ? error.message : 'Unknown error' 
        }
      })
      .eq('id', syncLog?.id)
    
    throw error
  }
  
  return result
}

/**
 * Validate all images (check if URLs are still accessible)
 */
export async function validateAllImages(): Promise<{ validated: number; invalid: number }> {
  const supabaseServer = getSupabaseClient()
  let validated = 0
  let invalid = 0
  
  const { data: images } = await supabaseServer
    .from('tour_images')
    .select('id, image_url')
    .eq('is_active', true)
    .or('last_validated_at.is.null,last_validated_at.lt.' + new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString())
  
  if (!images) return { validated, invalid }
  
  for (const image of images) {
    try {
      const response = await fetch(image.image_url, { method: 'HEAD' })
      
      if (response.ok) {
        await supabaseServer
          .from('tour_images')
          .update({
            last_validated_at: new Date().toISOString(),
            validation_status: 'valid',
            validation_error: null
          })
          .eq('id', image.id)
        validated++
      } else {
        await supabaseServer
          .from('tour_images')
          .update({
            last_validated_at: new Date().toISOString(),
            validation_status: 'invalid',
            validation_error: `HTTP ${response.status}`
          })
          .eq('id', image.id)
        invalid++
      }
    } catch (error) {
      await supabaseServer
        .from('tour_images')
        .update({
          last_validated_at: new Date().toISOString(),
          validation_status: 'invalid',
          validation_error: error instanceof Error ? error.message : 'Network error'
        })
        .eq('id', image.id)
      invalid++
    }
    
    // Add small delay
    await new Promise(resolve => setTimeout(resolve, 100))
  }
  
  return { validated, invalid }
}