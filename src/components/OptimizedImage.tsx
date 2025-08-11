import React, { useState, useEffect, useRef } from 'react'
import { 
  getOptimizedImageUrl, 
  generateSrcSet, 
  getPlaceholderUrl,
  IMAGE_SIZES 
} from '@/lib/imageOptimization'

interface OptimizedImageProps {
  src: string
  alt: string
  context?: 'hero' | 'card' | 'thumbnail' | 'gallery' | 'mobile'
  className?: string
  priority?: boolean
  onLoad?: () => void
  onError?: () => void
  aspectRatio?: string // e.g., "16/9", "4/3", "1/1"
}

/**
 * High-performance image component with automatic optimization
 * Features:
 * - Lazy loading with intersection observer
 * - Blur-up placeholder effect
 * - Responsive srcset generation
 * - WebP/AVIF with fallbacks
 * - Automatic quality enhancement
 */
const OptimizedImage: React.FC<OptimizedImageProps> = ({
  src,
  alt,
  context = 'card',
  className = '',
  priority = false,
  onLoad,
  onError,
  aspectRatio = '4/3'
}) => {
  const [isLoaded, setIsLoaded] = useState(false)
  const [isInView, setIsInView] = useState(priority)
  const [hasError, setHasError] = useState(false)
  const imgRef = useRef<HTMLImageElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  
  // Get optimized URLs
  const dimensions = IMAGE_SIZES[context] || IMAGE_SIZES.card
  const optimizedUrl = getOptimizedImageUrl(src, {
    ...dimensions,
    quality: 'auto:best',
    format: 'auto',
    enhance: true,
    upscale: true
  })
  
  const placeholderUrl = getPlaceholderUrl(src)
  const srcSet = generateSrcSet(src)
  
  // Sizes for responsive loading
  const sizes = {
    hero: '100vw',
    card: '(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw',
    thumbnail: '(max-width: 640px) 50vw, 25vw',
    gallery: '(max-width: 768px) 100vw, 50vw',
    mobile: '100vw'
  }[context]
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority || !containerRef.current) {
      setIsInView(true)
      return
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsInView(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.01,
        rootMargin: '100px'
      }
    )
    
    observer.observe(containerRef.current)
    
    return () => observer.disconnect()
  }, [priority])
  
  const handleLoad = () => {
    setIsLoaded(true)
    onLoad?.()
  }
  
  const handleError = () => {
    setHasError(true)
    setIsLoaded(true)
    onError?.()
  }
  
  // Fallback for error state
  if (hasError) {
    return (
      <div 
        className={`bg-gray-200 flex items-center justify-center ${className}`}
        style={{ aspectRatio }}
      >
        <div className="text-center p-4">
          <svg 
            className="w-12 h-12 text-gray-400 mx-auto mb-2" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              strokeWidth={2} 
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" 
            />
          </svg>
          <p className="text-sm text-gray-500">Image unavailable</p>
        </div>
      </div>
    )
  }
  
  return (
    <div 
      ref={containerRef}
      className={`relative overflow-hidden bg-gray-100 ${className}`}
      style={{ aspectRatio }}
    >
      {/* Blur placeholder */}
      {!isLoaded && (
        <img
          src={placeholderUrl}
          alt=""
          className="absolute inset-0 w-full h-full object-cover filter blur-lg scale-110"
          aria-hidden="true"
        />
      )}
      
      {/* Main image with progressive enhancement */}
      {isInView && (
        <picture>
          {/* AVIF format (best compression) */}
          <source
            type="image/avif"
            srcSet={generateSrcSet(src)}
            sizes={sizes}
          />
          
          {/* WebP format (good compression) */}
          <source
            type="image/webp"
            srcSet={generateSrcSet(src)}
            sizes={sizes}
          />
          
          {/* Fallback JPEG */}
          <img
            ref={imgRef}
            src={optimizedUrl}
            srcSet={srcSet}
            sizes={sizes}
            alt={alt}
            loading={priority ? 'eager' : 'lazy'}
            fetchpriority={priority ? 'high' : 'auto'}
            decoding="async"
            onLoad={handleLoad}
            onError={handleError}
            className={`
              w-full h-full object-cover
              transition-opacity duration-300
              ${isLoaded ? 'opacity-100' : 'opacity-0'}
            `}
          />
        </picture>
      )}
      
      {/* Loading shimmer effect */}
      {!isLoaded && isInView && (
        <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent animate-shimmer" />
      )}
    </div>
  )
}

export default OptimizedImage

// Add shimmer animation to global CSS
export const shimmerStyles = `
  @keyframes shimmer {
    0% {
      transform: translateX(-100%);
    }
    100% {
      transform: translateX(100%);
    }
  }
  
  .animate-shimmer {
    animation: shimmer 1.5s infinite;
  }
`