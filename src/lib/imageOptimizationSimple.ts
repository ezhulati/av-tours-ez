/**
 * Simplified Image Optimization for AlbaniaVisit
 * Using direct transformations without Cloudinary fetch API
 */

interface ImageOptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'webp' | 'avif' | 'jpg' | 'png' | 'auto'
}

/**
 * Generate optimized image URL using imgproxy.net (free alternative)
 * or imgix for on-the-fly optimization
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: ImageOptimizationOptions = {}
): string {
  const defaults = {
    width: 1920,
    quality: 85,
    format: 'auto' as const
  }
  
  const opts = { ...defaults, ...options }
  
  // Use weserv.nl - free image optimization service (no signup needed!)
  const baseUrl = 'https://images.weserv.nl/'
  const params = new URLSearchParams({
    url: originalUrl,
    w: opts.width?.toString() || '',
    q: opts.quality?.toString() || '85',
    output: opts.format === 'auto' ? 'webp' : opts.format || 'jpg',
    af: '', // auto filter
    il: '', // interlace/progressive
    n: '-1' // no cache limit
  })
  
  if (opts.height) {
    params.append('h', opts.height.toString())
  }
  
  return `${baseUrl}?${params.toString()}`
}

/**
 * Alternative using Statically.io CDN (also free, no signup)
 */
export function getStaticallyOptimizedUrl(
  originalUrl: string,
  width: number = 1920,
  quality: number = 85
): string {
  // Statically CDN - free image optimization
  const encodedUrl = encodeURIComponent(originalUrl)
  return `https://cdn.statically.io/img/${encodedUrl}?w=${width}&q=${quality}&f=auto`
}

/**
 * Generate responsive srcset
 */
export function generateSrcSet(
  originalUrl: string,
  sizes: number[] = [640, 768, 1024, 1366, 1920]
): string {
  return sizes
    .map(width => {
      const url = getOptimizedImageUrl(originalUrl, { width })
      return `${url} ${width}w`
    })
    .join(', ')
}

/**
 * Get sizes for responsive images
 */
export const IMAGE_SIZES = {
  hero: { width: 1920, height: 1080 },
  card: { width: 640, height: 480 },
  thumbnail: { width: 320, height: 240 },
  gallery: { width: 1366, height: 768 },
  mobile: { width: 768, height: 512 }
}

/**
 * Simple optimization function
 */
export default function optimizeImage(
  url: string,
  context: 'hero' | 'card' | 'thumbnail' | 'gallery' = 'card'
): string {
  const dimensions = IMAGE_SIZES[context]
  return getOptimizedImageUrl(url, {
    ...dimensions,
    quality: 85,
    format: 'auto'
  })
}