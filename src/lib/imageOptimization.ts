/**
 * Image Optimization System for AlbaniaVisit
 * 
 * Features:
 * - Automatic image optimization via Cloudinary CDN
 * - AI upscaling for low-resolution images
 * - Responsive image generation
 * - WebP/AVIF format support
 * - Lazy loading with blur-up placeholders
 */

interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: 'auto' | 'auto:best' | 'auto:good' | 'auto:eco' | number
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
  blur?: boolean
  upscale?: boolean
  enhance?: boolean
}

// Using Weserv.nl - FREE image optimization service (no signup required!)
// Documentation: https://images.weserv.nl/docs/

/**
 * Generate optimized image URL using Weserv.nl
 * FREE service with unlimited usage, no API key needed
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  // If it's a local image path, return it as-is in development
  // Weserv.nl cannot access localhost URLs
  if (originalUrl.startsWith('/')) {
    // In production, this would work with the actual domain
    // For now, just return the original URL
    return originalUrl
  }
  
  // Default optimization settings for travel website
  const defaultOptions = {
    quality: 'auto:best',
    format: 'auto',
    width: 1920,
    upscale: true,
    enhance: true
  }
  
  const opts = { ...defaultOptions, ...options }
  
  // Build Weserv.nl URL with parameters for external images
  const weservUrl = 'https://images.weserv.nl/'
  const params = new URLSearchParams()
  
  // Set the source URL
  params.set('url', originalUrl)
  
  // Size parameters
  if (opts.width) {
    params.set('w', opts.width.toString())
  }
  if (opts.height) {
    params.set('h', opts.height.toString())
  }
  
  // Quality (0-100, or use default 85 for 'auto:best')
  const quality = opts.quality === 'auto:best' ? '90' :
                  opts.quality === 'auto:good' ? '80' :
                  opts.quality === 'auto:eco' ? '60' :
                  typeof opts.quality === 'number' ? opts.quality.toString() : '85'
  params.set('q', quality)
  
  // Format conversion
  if (opts.format === 'auto') {
    params.set('output', 'webp') // WebP for best compression
  } else if (opts.format) {
    params.set('output', opts.format)
  }
  
  // Enhancement filters
  if (opts.enhance) {
    params.set('af', '') // Auto filter (enhances colors/contrast)
    params.set('sharp', '1') // Sharpen image
  }
  
  // Progressive/interlaced loading
  params.set('il', '') // Interlace for progressive loading
  
  // Blur for placeholder
  if (opts.blur) {
    params.set('blur', '20')
    params.set('w', '50') // Small size for placeholder
    params.set('q', '30') // Low quality for placeholder
  }
  
  // Cache control (-1 = no expiry)
  params.set('n', '-1')
  
  return `${weservUrl}?${params.toString()}`
}

/**
 * Generate responsive image srcset for optimal loading
 */
export function generateSrcSet(
  originalUrl: string,
  sizes: number[] = [640, 768, 1024, 1366, 1920, 2560]
): string {
  return sizes
    .map(width => {
      const url = getOptimizedImageUrl(originalUrl, { 
        width,
        format: 'auto',
        quality: 'auto:best',
        enhance: true
      })
      return `${url} ${width}w`
    })
    .join(', ')
}

/**
 * Get blur-up placeholder for lazy loading
 */
export function getPlaceholderUrl(originalUrl: string): string {
  return getOptimizedImageUrl(originalUrl, {
    width: 50,
    quality: 30,
    blur: true,
    format: 'jpg' // Use JPEG for placeholders (smaller for blurred images)
  })
}

/**
 * Determine if an image needs optimization based on URL analysis
 */
export function needsOptimization(imageUrl: string): boolean {
  const lowerUrl = imageUrl.toLowerCase()
  
  // Check for low-quality indicators
  const lowQualityIndicators = [
    '-150x',
    '-300x',
    '-768x',
    'thumb',
    'thumbnail',
    'small',
    'medium'
  ]
  
  return lowQualityIndicators.some(indicator => lowerUrl.includes(indicator))
}

/**
 * Get optimal image dimensions for different contexts
 */
export const IMAGE_SIZES = {
  hero: { width: 1920, height: 1080 },
  card: { width: 640, height: 480 },
  thumbnail: { width: 320, height: 240 },
  gallery: { width: 1366, height: 768 },
  mobile: { width: 768, height: 512 }
}

/**
 * Generate picture element with multiple formats
 */
export function generatePictureElement(
  originalUrl: string,
  alt: string,
  className: string = ''
): string {
  const fallbackUrl = getOptimizedImageUrl(originalUrl, { format: 'jpg' })
  
  return `
    <picture>
      <source type="image/avif" srcset="${generateSrcSet(originalUrl)}" />
      <source type="image/webp" srcset="${generateSrcSet(originalUrl)}" />
      <img 
        src="${fallbackUrl}"
        srcset="${generateSrcSet(originalUrl)}"
        sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
        alt="${alt}"
        class="${className}"
        loading="lazy"
        decoding="async"
      />
    </picture>
  `
}

/**
 * Batch optimize multiple images (for gallery views)
 */
export function batchOptimizeImages(
  imageUrls: string[],
  options: ImageOptimizationOptions = {}
): string[] {
  return imageUrls.map(url => getOptimizedImageUrl(url, options))
}

/**
 * Get Cloudinary analytics tracking (for monitoring usage)
 */
export function getImageAnalytics(imageUrl: string): string {
  // Add analytics context for tracking
  return getOptimizedImageUrl(imageUrl, {
    // Add context tags for analytics
  }).replace('/image/fetch/', '/image/fetch/fl_analytics/')
}

// Alternative: Using Vercel/Netlify Image Optimization (if you prefer)
export function getVercelOptimizedUrl(
  originalUrl: string,
  width: number,
  quality: number = 75
): string {
  // Vercel Image Optimization API
  const params = new URLSearchParams({
    url: originalUrl,
    w: width.toString(),
    q: quality.toString()
  })
  
  return `/_vercel/image?${params.toString()}`
}

export function getNetlifyOptimizedUrl(
  originalUrl: string,
  width: number,
  format: string = 'webp'
): string {
  // Netlify Image CDN
  return `/.netlify/images?url=${encodeURIComponent(originalUrl)}&w=${width}&fm=${format}`
}

// Export default optimization function
export default function optimizeImage(
  url: string,
  context: 'hero' | 'card' | 'thumbnail' | 'gallery' = 'card'
): string {
  const dimensions = IMAGE_SIZES[context]
  return getOptimizedImageUrl(url, {
    ...dimensions,
    quality: 'auto:best',
    format: 'auto',
    enhance: true,
    upscale: needsOptimization(url)
  })
}