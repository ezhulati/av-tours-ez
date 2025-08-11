import React, { useState, useEffect, useCallback, useRef } from 'react'

interface Image {
  url: string
  alt: string | null
  width?: number
  height?: number
}

interface HeroGalleryProps {
  images: Image[]
  title: string
  tourSlug?: string
}

// Generate srcset for responsive images
const generateSrcSet = (url: string): string => {
  // If it's already a full URL, use it directly
  if (url.startsWith('http')) {
    return `${url} 1x, ${url} 2x`
  }
  // For local images, just return the original
  return url
}

// Lazy load observer
const useLazyLoad = () => {
  const [isIntersecting, setIsIntersecting] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsIntersecting(true)
          observer.disconnect()
        }
      },
      { threshold: 0.1, rootMargin: '50px' }
    )

    if (ref.current) {
      observer.observe(ref.current)
    }

    return () => observer.disconnect()
  }, [])

  return { ref, isIntersecting }
}

// Filter out duplicate images based on URL similarity
const deduplicateImages = (images: Image[]): Image[] => {
  const seen = new Set<string>()
  const deduplicated: Image[] = []
  
  for (const image of images) {
    // Normalize URL for comparison (remove protocol, query params, etc.)
    const normalizedUrl = image.url
      .replace(/^https?:\/\//, '')
      .replace(/\?.*$/, '')
      .toLowerCase()
    
    if (!seen.has(normalizedUrl)) {
      seen.add(normalizedUrl)
      deduplicated.push(image)
    }
  }
  
  return deduplicated
}

export default function HeroGalleryDeduplicated({ images, title, tourSlug }: HeroGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0])) // Preload first image
  const [imageErrors, setImageErrors] = useState<Set<number>>(new Set()) // Track failed images
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  
  // Deduplicate images to prevent showing the same image multiple times
  const uniqueImages = deduplicateImages(images)
  
  // Filter out images that failed to load
  const validImages = uniqueImages.filter((_, index) => !imageErrors.has(index))
  
  // Ensure we have at least one image
  const allImages = validImages.length > 0 ? validImages : [{ url: '/placeholder.jpg', alt: 'Tour', width: undefined, height: undefined }]
  const currentImage = allImages[selectedIndex] || allImages[0]
  
  const handlePrevious = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev === 0 ? allImages.length - 1 : prev - 1
      // Preload adjacent images
      setImagesLoaded(loaded => new Set([...loaded, newIndex]))
      return newIndex
    })
  }, [allImages.length])
  
  const handleNext = useCallback(() => {
    setSelectedIndex((prev) => {
      const newIndex = prev === allImages.length - 1 ? 0 : prev + 1
      // Preload adjacent images
      setImagesLoaded(loaded => new Set([...loaded, newIndex]))
      return newIndex
    })
  }, [allImages.length])

  // Handle image load errors
  const handleImageError = (index: number) => {
    setImageErrors(errors => new Set([...errors, index]))
    // If current image failed, move to next
    if (index === selectedIndex && allImages.length > 1) {
      handleNext()
    }
  }

  // Touch swipe handlers
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.touches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    
    const distance = touchStartX.current - touchEndX.current
    const isLeftSwipe = distance > 50
    const isRightSwipe = distance < -50

    if (isLeftSwipe && allImages.length > 1) {
      handleNext()
    }
    if (isRightSwipe && allImages.length > 1) {
      handlePrevious()
    }
  }

  // Preload adjacent images
  useEffect(() => {
    const preloadIndices = [
      selectedIndex - 1 < 0 ? allImages.length - 1 : selectedIndex - 1,
      selectedIndex,
      selectedIndex + 1 >= allImages.length ? 0 : selectedIndex + 1
    ]
    
    preloadIndices.forEach(index => {
      if (!imagesLoaded.has(index) && !imageErrors.has(index)) {
        const img = new Image()
        img.src = allImages[index].url
        img.onload = () => {
          setImagesLoaded(loaded => new Set([...loaded, index]))
        }
        img.onerror = () => {
          handleImageError(index)
        }
      }
    })
  }, [selectedIndex, allImages, imagesLoaded, imageErrors])

  const openModal = () => {
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    document.body.style.overflow = 'auto'
  }

  // Log image stats for debugging (only in development)
  useEffect(() => {
    if (process.env.NODE_ENV === 'development' && tourSlug) {
      console.log(`Tour ${tourSlug}: ${images.length} original images, ${uniqueImages.length} unique images, ${imageErrors.size} failed`)
    }
  }, [images.length, uniqueImages.length, imageErrors.size, tourSlug])

  return (
    <>
      {/* Hero Gallery Container */}
      <div className="relative w-full mb-0">
        {/* Image Count Badge */}
        {allImages.length > 1 && (
          <div className="absolute top-4 left-4 z-10 bg-black/50 text-white px-3 py-1 rounded-full text-sm backdrop-blur-sm">
            {selectedIndex + 1} / {allImages.length}
          </div>
        )}
        
        {/* Main Display */}
        <div 
          className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] max-h-[800px] overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {/* Main Image with loading state */}
          {!imagesLoaded.has(selectedIndex) && (
            <div className="absolute inset-0 bg-gray-200 animate-pulse flex items-center justify-center">
              <svg className="animate-spin h-8 w-8 text-gray-400" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          )}
          <img
            src={currentImage.url}
            srcSet={generateSrcSet(currentImage.url)}
            alt={currentImage.alt || `${title} - Image ${selectedIndex + 1}`}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imagesLoaded.has(selectedIndex) ? 'opacity-100' : 'opacity-0'}`}
            loading="lazy"
            onError={() => handleImageError(selectedIndex)}
            onClick={openModal}
            style={{ cursor: 'zoom-in' }}
          />
          
          {/* Navigation Arrows - Hidden on mobile */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="hidden md:flex absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleNext}
                className="hidden md:flex absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 bg-black/50 text-white rounded-full items-center justify-center hover:bg-black/70 transition-colors backdrop-blur-sm"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
        
        {/* Thumbnail Strip - Desktop only */}
        {allImages.length > 1 && (
          <div className="hidden lg:flex gap-2 p-4 bg-gray-50 overflow-x-auto">
            {allImages.map((image, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`flex-shrink-0 w-24 h-16 rounded overflow-hidden border-2 transition-all ${
                  selectedIndex === index
                    ? 'border-red-500 shadow-lg'
                    : 'border-transparent hover:border-gray-300'
                }`}
              >
                <img
                  src={image.url}
                  alt={image.alt || `Thumbnail ${index + 1}`}
                  className="w-full h-full object-cover"
                  loading="lazy"
                />
              </button>
            ))}
          </div>
        )}
        
        {/* Mobile Dots Indicator */}
        {allImages.length > 1 && (
          <div className="flex lg:hidden justify-center gap-2 py-3 bg-gray-50">
            {allImages.map((_, index) => (
              <button
                key={index}
                onClick={() => setSelectedIndex(index)}
                className={`w-2 h-2 rounded-full transition-all ${
                  selectedIndex === index
                    ? 'bg-red-500 w-6'
                    : 'bg-gray-300 hover:bg-gray-400'
                }`}
                aria-label={`Go to image ${index + 1}`}
              />
            ))}
          </div>
        )}
      </div>

      {/* Fullscreen Modal */}
      {isModalOpen && (
        <div 
          className="fixed inset-0 bg-black z-50 flex items-center justify-center"
          onClick={closeModal}
        >
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 text-white/80 hover:text-white z-10"
            aria-label="Close fullscreen"
          >
            <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          
          <img
            src={currentImage.url}
            alt={currentImage.alt || title}
            className="max-w-full max-h-full object-contain"
            onClick={(e) => e.stopPropagation()}
          />
          
          {/* Modal Navigation */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handlePrevious()
                }}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-sm"
                aria-label="Previous image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={(e) => {
                  e.stopPropagation()
                  handleNext()
                }}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 text-white rounded-full flex items-center justify-center hover:bg-white/20 transition-colors backdrop-blur-sm"
                aria-label="Next image"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
        </div>
      )}
    </>
  )
}