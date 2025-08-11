/**
 * Helper function to get optimized image URL
 * Works in both development and production environments
 */
export function getOptimizedImageUrl(
  originalSrc: string,
  width: number,
  format: 'webp' | 'avif' | 'jpg' = 'webp',
  isDevelopment: boolean = false
) {
  // In development, return original images without optimization
  if (isDevelopment) {
    return originalSrc
  }
  
  // For production, use Weserv.nl CDN for optimization
  const fullUrl = originalSrc.startsWith('/') 
    ? `https://tours.albaniavisit.com${originalSrc}`
    : originalSrc
    
  const params = new URLSearchParams({
    url: fullUrl,
    w: width.toString(),
    q: format === 'avif' ? '85' : '90',
    output: format,
    af: '', // Auto enhance
    il: '', // Progressive loading
    n: '-1' // No cache expiry
  })
  
  return `https://images.weserv.nl/?${params.toString()}`
}

/**
 * Generate srcset for responsive images
 */
export function generateResponsiveSrcSet(
  originalSrc: string,
  sizes: number[],
  format: 'webp' | 'avif' | 'jpg' = 'webp',
  isDevelopment: boolean = false
): string {
  if (isDevelopment) {
    // In development, just return single src
    return `${originalSrc} ${sizes[sizes.length - 1]}w`
  }
  
  return sizes
    .map(width => {
      const url = getOptimizedImageUrl(originalSrc, width, format, isDevelopment)
      return `${url} ${width}w`
    })
    .join(', ')
}