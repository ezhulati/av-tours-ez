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

// Cloudinary configuration (can use free tier or upgrade as needed)
const CLOUDINARY_CLOUD_NAME = 'dwnmuolg8' // Your Cloudinary cloud name
const CLOUDINARY_BASE_URL = `https://res.cloudinary.com/${CLOUDINARY_CLOUD_NAME}/image/fetch`

/**
 * Generate optimized image URL using Cloudinary's fetch API
 * This doesn't require uploading images - it fetches and optimizes on-the-fly
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  // Default optimization settings for travel website
  const defaultOptions = {
    quality: 'auto:best',
    format: 'auto',
    width: 1920,
    upscale: true,
    enhance: true
  }
  
  const opts = { ...defaultOptions, ...options }
  
  // Build Cloudinary transformation string
  const transformations: string[] = []
  
  // Size transformations
  if (opts.width) {
    transformations.push(`w_${opts.width}`)
  }
  if (opts.height) {
    transformations.push(`h_${opts.height}`)
  }
  
  // Quality and format
  transformations.push(`q_${opts.quality}`)
  transformations.push(`f_${opts.format}`)
  
  // Enhancements for travel photos
  if (opts.enhance) {
    // Auto enhance colors and contrast
    transformations.push('e_auto_brightness')
    transformations.push('e_auto_color')
    transformations.push('e_sharpen:50')
  }
  
  // AI upscaling for low-res images
  if (opts.upscale) {
    transformations.push('c_scale')
    transformations.push('e_upscale')
    transformations.push('fl_progressive:steep')
  }
  
  // Blur placeholder for lazy loading
  if (opts.blur) {
    transformations.push('e_blur:1000')
    transformations.push('q_1')
    transformations.push('w_50')
  }
  
  // Additional optimizations
  transformations.push('fl_lossy')
  transformations.push('fl_strip_profile')
  transformations.push('dpr_auto')
  
  // Build final URL
  const transformation = transformations.join(',')
  const encodedUrl = encodeURIComponent(originalUrl)
  
  return `${CLOUDINARY_BASE_URL}/${transformation}/${encodedUrl}`
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
      const url = getOptimizedImageUrl(originalUrl, { width })
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
    quality: 1,
    blur: true
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