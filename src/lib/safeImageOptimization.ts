/**
 * Safe Image Optimization System
 * Handles various image sources without breaking
 */

interface OptimizationOptions {
  width?: number
  height?: number
  quality?: number
  format?: 'auto' | 'webp' | 'avif' | 'jpg' | 'png'
}

/**
 * Safely optimize image URLs with proper fallbacks
 * Works with local assets, external URLs, and Supabase storage
 */
export function getOptimizedImageUrl(
  originalUrl: string,
  options: OptimizationOptions = {}
): string {
  // Safety check: Return original if no URL
  if (!originalUrl) return '/placeholder.jpg'
  
  // Don't optimize data URLs or SVGs
  if (originalUrl.startsWith('data:') || originalUrl.endsWith('.svg')) {
    return originalUrl
  }
  
  // Check if we're in development
  // In Astro SSR, we need to check import.meta.env instead of window
  let isDev = false
  try {
    isDev = import.meta.env.DEV === true
  } catch {
    // If import.meta is not available, we're not in dev
    isDev = false
  }
  
  // In development, always return original
  if (isDev) {
    return originalUrl
  }
  
  // For external URLs (not our domain), use them directly
  // This includes Supabase storage and partner sites
  if (originalUrl.startsWith('http://') || originalUrl.startsWith('https://')) {
    // If it's a BNAdventure image, we can optimize via proxy
    if (originalUrl.includes('bnadventure.com')) {
      return optimizeViaWeserv(originalUrl, options)
    }
    // For other external URLs, return as-is
    return originalUrl
  }
  
  // For local assets on our domain, use Netlify Image CDN
  if (originalUrl.startsWith('/')) {
    return optimizeViaNetlify(originalUrl, options)
  }
  
  // Default: return original
  return originalUrl
}

/**
 * Optimize local images using Netlify Image CDN
 * This is the safest option for our own assets
 */
function optimizeViaNetlify(path: string, options: OptimizationOptions): string {
  // Netlify Image CDN format: /.netlify/images?url={url}&w={width}&fm={format}
  const params = new URLSearchParams()
  
  params.set('url', path)
  
  if (options.width) {
    params.set('w', options.width.toString())
  }
  
  if (options.height) {
    params.set('h', options.height.toString())
  }
  
  if (options.quality) {
    params.set('q', options.quality.toString())
  }
  
  // Map format to Netlify's format parameter
  if (options.format && options.format !== 'auto') {
    const formatMap: Record<string, string> = {
      'jpg': 'jpg',
      'png': 'png',
      'webp': 'webp',
      'avif': 'avif'
    }
    if (formatMap[options.format]) {
      params.set('fm', formatMap[options.format])
    }
  }
  
  return `/.netlify/images?${params.toString()}`
}

/**
 * Optimize external images via Weserv.nl
 * Only for trusted domains like BNAdventure
 */
function optimizeViaWeserv(url: string, options: OptimizationOptions): string {
  const params = new URLSearchParams()
  
  params.set('url', url)
  
  if (options.width) {
    params.set('w', options.width.toString())
  }
  
  if (options.height) {
    params.set('h', options.height.toString())
  }
  
  params.set('q', options.quality?.toString() || '85')
  
  if (options.format && options.format !== 'auto') {
    params.set('output', options.format)
  } else {
    params.set('output', 'webp')
  }
  
  // Add optimization flags
  params.set('af', '') // Auto filter
  params.set('il', '') // Interlaced/progressive
  params.set('n', '-1') // No cache expiry
  
  return `https://images.weserv.nl/?${params.toString()}`
}

/**
 * Generate responsive srcset with safe optimization
 */
export function generateResponsiveSrcSet(
  originalUrl: string,
  sizes: number[] = [320, 640, 768, 1024, 1366, 1920],
  format?: 'webp' | 'avif' | 'jpg'
): string {
  // For development or problematic URLs, return simple srcset
  let isDev = false
  try {
    isDev = import.meta.env.DEV === true
  } catch {
    isDev = false
  }
  if (isDev || !originalUrl || originalUrl.startsWith('data:')) {
    return `${originalUrl} ${sizes[sizes.length - 1]}w`
  }
  
  return sizes
    .map(width => {
      const optimizedUrl = getOptimizedImageUrl(originalUrl, {
        width,
        format: format || 'auto',
        quality: 85
      })
      return `${optimizedUrl} ${width}w`
    })
    .join(', ')
}

/**
 * Generate picture element with multiple formats
 * Falls back gracefully if optimization fails
 */
export function generatePictureElement(
  originalUrl: string,
  alt: string,
  className: string = '',
  sizes: string = '100vw',
  loading: 'lazy' | 'eager' = 'lazy'
): string {
  // Safety: always have a fallback
  const fallbackUrl = originalUrl || '/placeholder.jpg'
  
  // Check if we should optimize
  const shouldOptimize = !originalUrl.startsWith('data:') && 
                        !originalUrl.endsWith('.svg') &&
                        (originalUrl.startsWith('/') || originalUrl.includes('bnadventure.com'))
  
  if (!shouldOptimize) {
    return `<img src="${fallbackUrl}" alt="${alt}" class="${className}" loading="${loading}" />`
  }
  
  // Generate optimized sources
  const srcsetSizes = [320, 640, 768, 1024, 1366, 1920]
  
  return `
    <picture>
      <source 
        type="image/avif"
        srcset="${generateResponsiveSrcSet(originalUrl, srcsetSizes, 'avif')}"
        sizes="${sizes}"
      />
      <source 
        type="image/webp"
        srcset="${generateResponsiveSrcSet(originalUrl, srcsetSizes, 'webp')}"
        sizes="${sizes}"
      />
      <img 
        src="${getOptimizedImageUrl(originalUrl, { width: 1024, format: 'jpg' })}"
        srcset="${generateResponsiveSrcSet(originalUrl, srcsetSizes, 'jpg')}"
        sizes="${sizes}"
        alt="${alt}"
        class="${className}"
        loading="${loading}"
        decoding="async"
      />
    </picture>
  `
}

/**
 * Check if Netlify Image CDN is available
 */
export function isNetlifyImageCDNAvailable(): boolean {
  // Check if we're on Netlify by looking for Netlify-specific environment
  return typeof process !== 'undefined' && 
         (process.env.NETLIFY === 'true' || 
          process.env.CONTEXT === 'production' ||
          process.env.CONTEXT === 'deploy-preview')
}

/**
 * Get the best optimization method for current environment
 */
export function getBestOptimizationMethod(): 'netlify' | 'weserv' | 'none' {
  let isDev = false
  try {
    isDev = import.meta.env.DEV === true
  } catch {
    // Check if window is available as fallback
    if (typeof window !== 'undefined' && window.location.hostname === 'localhost') {
      isDev = true
    }
  }
  
  if (isDev) return 'none'
  if (isNetlifyImageCDNAvailable()) return 'netlify'
  return 'weserv'
}