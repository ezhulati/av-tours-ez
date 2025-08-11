import { chromium, type Browser, type Page } from '@playwright/test'
import { createClient, type SupabaseClient } from '@supabase/supabase-js'
import crypto from 'crypto'

// Initialize Supabase client
function getSupabaseClient(): SupabaseClient {
  const supabaseUrl = process.env.SUPABASE_URL || (typeof import.meta !== 'undefined' && import.meta.env?.SUPABASE_URL)
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || (typeof import.meta !== 'undefined' && import.meta.env?.SUPABASE_SERVICE_ROLE_KEY)
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  }
  
  return createClient(supabaseUrl, supabaseKey, {
    auth: { persistSession: false }
  })
}

interface ScrapedImage {
  url: string
  alt?: string
  type: 'hero' | 'gallery' | 'content' | 'logo' | 'background'
  width?: number
  height?: number
  hash?: string
  source: string
}

interface ScrapeResult {
  success: boolean
  images: ScrapedImage[]
  error?: string
  stats: {
    totalFound: number
    uniqueImages: number
    heroImages: number
    galleryImages: number
    contentImages: number
    backgroundImages: number
    timeMs: number
  }
}

interface ValidationResult {
  url: string
  accessible: boolean
  statusCode?: number
  contentType?: string
  size?: number
  error?: string
}

export class RobustImageScraper {
  private browser: Browser | null = null
  private maxRetries = 3
  private retryDelay = 2000
  
  async initialize() {
    if (!this.browser) {
      this.browser = await chromium.launch({
        headless: true,
        args: ['--no-sandbox', '--disable-setuid-sandbox']
      })
    }
  }
  
  async cleanup() {
    if (this.browser) {
      await this.browser.close()
      this.browser = null
    }
  }
  
  /**
   * Scrape images from a BNAdventure tour page with advanced techniques
   */
  async scrapeTourImages(url: string): Promise<ScrapeResult> {
    const startTime = Date.now()
    const images: ScrapedImage[] = []
    const imageSet = new Set<string>()
    
    try {
      await this.initialize()
      const page = await this.browser!.newPage()
      
      // Set viewport for desktop to get all images
      await page.setViewportSize({ width: 1920, height: 1080 })
      
      // Navigate with retry logic
      let lastError: Error | null = null
      for (let i = 0; i < this.maxRetries; i++) {
        try {
          await page.goto(url, {
            waitUntil: 'networkidle',
            timeout: 30000
          })
          break
        } catch (error) {
          lastError = error as Error
          console.log(`Retry ${i + 1}/${this.maxRetries} for ${url}`)
          await new Promise(resolve => setTimeout(resolve, this.retryDelay))
        }
      }
      
      if (lastError) {
        throw lastError
      }
      
      // Wait for images to load
      await page.waitForTimeout(2000)
      
      // Scroll to trigger lazy loading
      await this.scrollPage(page)
      
      // Extract images using multiple strategies
      const extractedImages = await page.evaluate(() => {
        const images: any[] = []
        const seen = new Set<string>()
        
        // Helper to clean and validate URLs
        function cleanUrl(url: string | null | undefined): string | null {
          if (!url) return null
          try {
            // Handle relative URLs
            if (url.startsWith('/')) {
              url = new URL(url, window.location.origin).href
            } else if (!url.startsWith('http')) {
              url = new URL(url, window.location.href).href
            }
            
            // Clean query params that might cause duplicates
            const urlObj = new URL(url)
            // Remove common tracking/cache params
            urlObj.searchParams.delete('v')
            urlObj.searchParams.delete('ver')
            urlObj.searchParams.delete('cache')
            
            return urlObj.href
          } catch {
            return null
          }
        }
        
        // Helper to determine image type based on context
        function getImageType(element: Element, src: string): string {
          const classes = element.className || ''
          const parentClasses = element.parentElement?.className || ''
          
          // Check for hero/banner images
          if (classes.includes('hero') || parentClasses.includes('hero') ||
              classes.includes('banner') || parentClasses.includes('banner') ||
              classes.includes('header') || parentClasses.includes('header')) {
            return 'hero'
          }
          
          // Check for gallery images
          if (classes.includes('gallery') || parentClasses.includes('gallery') ||
              classes.includes('slider') || parentClasses.includes('slider') ||
              classes.includes('carousel') || parentClasses.includes('carousel') ||
              classes.includes('swiper') || parentClasses.includes('swiper')) {
            return 'gallery'
          }
          
          // Check for logo
          if (src.includes('logo')) {
            return 'logo'
          }
          
          return 'content'
        }
        
        // Strategy 1: Regular img tags
        const imgElements = document.querySelectorAll('img')
        for (const img of Array.from(imgElements)) {
          const imgElement = img as HTMLImageElement
          const src = cleanUrl(imgElement.src || imgElement.dataset?.src || imgElement.dataset?.lazySrc)
          if (src && !seen.has(src)) {
            seen.add(src)
            
            images.push({
              url: src,
              alt: imgElement.alt || imgElement.title || '',
              type: getImageType(imgElement, src),
              width: imgElement.naturalWidth || imgElement.width,
              height: imgElement.naturalHeight || imgElement.height,
              source: 'img'
            })
          }
        }
        
        // Strategy 2: Background images
        const elementsWithBg = document.querySelectorAll('[style]')
        for (const element of Array.from(elementsWithBg)) {
          const style = element.getAttribute('style') || ''
          if (style.includes('background-image')) {
            const match = style.match(/url\(['"]?([^'")]+)['"]?\)/)
            if (match) {
              const src = cleanUrl(match[1])
              if (src && !seen.has(src)) {
                seen.add(src)
                images.push({
                  url: src,
                  alt: '',
                  type: 'background',
                  source: 'css-background'
                })
              }
            }
          }
        }
        
        // Strategy 3: Picture elements with sources
        const sourceElements = document.querySelectorAll('picture source')
        for (const source of Array.from(sourceElements)) {
          const srcset = source.getAttribute('srcset')
          if (srcset) {
            // Parse srcset for all image URLs
            const urls = srcset.split(',').map(s => s.trim().split(' ')[0])
            for (const url of urls) {
              const src = cleanUrl(url)
              if (src && !seen.has(src)) {
                seen.add(src)
                images.push({
                  url: src,
                  alt: '',
                  type: 'gallery',
                  source: 'picture'
                })
              }
            }
          }
        }
        
        // Strategy 4: Check for Swiper/carousel specific images
        const carouselSelectors = ['.swiper-slide img', '.carousel-item img', '.glide__slide img']
        for (const selector of carouselSelectors) {
          const carouselImages = document.querySelectorAll(selector)
          for (const img of Array.from(carouselImages)) {
            const imgElement = img as HTMLImageElement
            const src = cleanUrl(imgElement.getAttribute('src') || imgElement.getAttribute('data-src'))
            if (src && !seen.has(src)) {
              seen.add(src)
              images.push({
                url: src,
                alt: imgElement.getAttribute('alt') || '',
                type: 'gallery',
                source: 'carousel'
              })
            }
          }
        }
        
        // Strategy 5: WooCommerce specific selectors
        const wooSelectors = ['.woocommerce-product-gallery__image img', '.product-image img']
        for (const selector of wooSelectors) {
          const wooImages = document.querySelectorAll(selector)
          for (const img of Array.from(wooImages)) {
            const imgElement = img as HTMLImageElement
            const src = cleanUrl(imgElement.getAttribute('src') || imgElement.getAttribute('data-src'))
            if (src && !seen.has(src)) {
              seen.add(src)
              images.push({
                url: src,
                alt: imgElement.getAttribute('alt') || '',
                type: 'gallery',
                source: 'woocommerce'
              })
            }
          }
        }
        
        // Strategy 6: Data attributes that might contain images
        const dataSelectors = ['[data-image]', '[data-bg]', '[data-background-image]']
        for (const selector of dataSelectors) {
          const dataElements = document.querySelectorAll(selector)
          for (const element of Array.from(dataElements)) {
            const dataImage = element.getAttribute('data-image') || 
                             element.getAttribute('data-bg') || 
                             element.getAttribute('data-background-image')
            const src = cleanUrl(dataImage)
            if (src && !seen.has(src)) {
              seen.add(src)
              images.push({
                url: src,
                alt: '',
                type: 'background',
                source: 'data-attribute'
              })
            }
          }
        }
        
        return images
      })
      
      // Add extracted images to our collection
      extractedImages.forEach(img => {
        if (!imageSet.has(img.url)) {
          imageSet.add(img.url)
          images.push({
            ...img,
            hash: this.generateImageHash(img.url)
          })
        }
      })
      
      // Filter out unwanted images
      const filteredImages = images.filter(img => {
        const url = img.url.toLowerCase()
        // Skip logos, icons, avatars, and other non-tour images
        if (url.includes('logo') || 
            url.includes('icon') || 
            url.includes('avatar') ||
            url.includes('payment') ||
            url.includes('badge') ||
            url.includes('flag') ||
            url.includes('.svg') ||
            url.includes('placeholder') ||
            url.includes('loading')) {
          return false
        }
        
        // Only include substantial images
        if (img.width && img.height && (img.width < 200 || img.height < 200)) {
          return false
        }
        
        return true
      })
      
      await page.close()
      
      // Calculate statistics
      const stats = {
        totalFound: images.length,
        uniqueImages: filteredImages.length,
        heroImages: filteredImages.filter(i => i.type === 'hero').length,
        galleryImages: filteredImages.filter(i => i.type === 'gallery').length,
        contentImages: filteredImages.filter(i => i.type === 'content').length,
        backgroundImages: filteredImages.filter(i => i.type === 'background').length,
        timeMs: Date.now() - startTime
      }
      
      return {
        success: true,
        images: filteredImages,
        stats
      }
      
    } catch (error) {
      return {
        success: false,
        images: [],
        error: error instanceof Error ? error.message : 'Unknown error',
        stats: {
          totalFound: 0,
          uniqueImages: 0,
          heroImages: 0,
          galleryImages: 0,
          contentImages: 0,
          backgroundImages: 0,
          timeMs: Date.now() - startTime
        }
      }
    }
  }
  
  /**
   * Scroll page to trigger lazy loading
   */
  private async scrollPage(page: Page) {
    await page.evaluate(async () => {
      await new Promise<void>((resolve) => {
        let totalHeight = 0
        const distance = 200
        const timer = setInterval(() => {
          const scrollHeight = document.body.scrollHeight
          window.scrollBy(0, distance)
          totalHeight += distance
          
          if (totalHeight >= scrollHeight) {
            clearInterval(timer)
            // Scroll back to top
            window.scrollTo(0, 0)
            resolve()
          }
        }, 100)
        
        // Timeout after 10 seconds
        setTimeout(() => {
          clearInterval(timer)
          resolve()
        }, 10000)
      })
    })
    
    // Wait for any new images to load
    await page.waitForTimeout(1000)
  }
  
  /**
   * Generate hash for image deduplication
   */
  private generateImageHash(url: string): string {
    return crypto.createHash('md5').update(url).digest('hex')
  }
  
  /**
   * Validate that an image URL is accessible
   */
  async validateImage(url: string): Promise<ValidationResult> {
    try {
      const response = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(5000)
      })
      
      return {
        url,
        accessible: response.ok,
        statusCode: response.status,
        contentType: response.headers.get('content-type') || undefined,
        size: parseInt(response.headers.get('content-length') || '0')
      }
    } catch (error) {
      return {
        url,
        accessible: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
  
  /**
   * Sync scraped images to database
   */
  async syncToDatabase(tourId: string, images: ScrapedImage[]): Promise<{
    updated: boolean
    imagesAdded: number
    error?: string
  }> {
    try {
      const supabase = getSupabaseClient()
      
      // Get current tour data
      const { data: tour, error: fetchError } = await supabase
        .from('affiliate_tours')
        .select('id, image_gallery, primary_image')
        .eq('id', tourId)
        .single()
      
      if (fetchError) {
        throw fetchError
      }
      
      if (!tour) {
        throw new Error('Tour not found')
      }
      
      // Prepare image URLs
      const imageUrls = images.map(img => img.url)
      
      // Set primary image (prefer hero, then first gallery image)
      const heroImage = images.find(img => img.type === 'hero')
      const primaryImage = heroImage?.url || images[0]?.url || tour.primary_image
      
      // Update tour with new images
      const { error: updateError } = await supabase
        .from('affiliate_tours')
        .update({
          image_gallery: imageUrls,
          primary_image: primaryImage,
          updated_at: new Date().toISOString()
        })
        .eq('id', tourId)
      
      if (updateError) {
        throw updateError
      }
      
      return {
        updated: true,
        imagesAdded: imageUrls.length
      }
      
    } catch (error) {
      return {
        updated: false,
        imagesAdded: 0,
        error: error instanceof Error ? error.message : 'Unknown error'
      }
    }
  }
}

/**
 * Main function to sync all tour images with validation
 */
export async function syncAllTourImagesWithValidation(): Promise<{
  totalTours: number
  successfulSyncs: number
  failedSyncs: number
  totalImagesScraped: number
  validationReport: any[]
}> {
  const scraper = new RobustImageScraper()
  const supabase = getSupabaseClient()
  const validationReport: any[] = []
  
  try {
    // Get all active tours
    const { data: tours, error } = await supabase
      .from('affiliate_tours')
      .select('id, title, source_url, affiliate_url, image_gallery')
      .eq('is_active', true)
    
    if (error) {
      throw error
    }
    
    if (!tours || tours.length === 0) {
      return {
        totalTours: 0,
        successfulSyncs: 0,
        failedSyncs: 0,
        totalImagesScraped: 0,
        validationReport: []
      }
    }
    
    let successfulSyncs = 0
    let failedSyncs = 0
    let totalImagesScraped = 0
    
    console.log(`🚀 Starting sync for ${tours.length} tours`)
    
    for (const tour of tours) {
      console.log(`\n📸 Processing: ${tour.title}`)
      
      // Use source_url for scraping (without affiliate params)
      const urlToScrape = tour.source_url || tour.affiliate_url
      
      if (!urlToScrape) {
        console.log('  ⚠️  No URL available')
        failedSyncs++
        validationReport.push({
          tourId: tour.id,
          title: tour.title,
          status: 'failed',
          reason: 'No URL available',
          imagesFound: 0
        })
        continue
      }
      
      // Scrape images
      const result = await scraper.scrapeTourImages(urlToScrape)
      
      if (result.success && result.images.length > 0) {
        // Sync to database
        const syncResult = await scraper.syncToDatabase(tour.id, result.images)
        
        if (syncResult.updated) {
          successfulSyncs++
          totalImagesScraped += result.images.length
          
          console.log(`  ✅ Success: ${result.images.length} images found`)
          console.log(`     Types: ${result.stats.heroImages} hero, ${result.stats.galleryImages} gallery`)
          
          // Validate a sample of images
          const sampleImage = result.images[0]
          if (sampleImage) {
            const validation = await scraper.validateImage(sampleImage.url)
            console.log(`     Sample validation: ${validation.accessible ? '✓' : '✗'}`)
          }
          
          validationReport.push({
            tourId: tour.id,
            title: tour.title,
            status: 'success',
            imagesFound: result.images.length,
            stats: result.stats,
            previousImageCount: tour.image_gallery?.length || 0
          })
        } else {
          failedSyncs++
          console.log(`  ❌ Database sync failed: ${syncResult.error}`)
          
          validationReport.push({
            tourId: tour.id,
            title: tour.title,
            status: 'failed',
            reason: syncResult.error,
            imagesFound: result.images.length
          })
        }
      } else {
        failedSyncs++
        console.log(`  ❌ Scraping failed: ${result.error || 'No images found'}`)
        
        validationReport.push({
          tourId: tour.id,
          title: tour.title,
          status: 'failed',
          reason: result.error || 'No images found',
          imagesFound: 0
        })
      }
      
      // Small delay between tours to be respectful
      await new Promise(resolve => setTimeout(resolve, 1000))
    }
    
    await scraper.cleanup()
    
    return {
      totalTours: tours.length,
      successfulSyncs,
      failedSyncs,
      totalImagesScraped,
      validationReport
    }
    
  } catch (error) {
    await scraper.cleanup()
    throw error
  }
}