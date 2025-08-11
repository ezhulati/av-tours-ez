import React, { useState, useEffect, useCallback, useRef } from 'react'

interface HeroGalleryProps {
  images: string[]
  title: string
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

export default function HeroGallery({ images, title }: HeroGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [imagesLoaded, setImagesLoaded] = useState<Set<number>>(new Set([0])) // Preload first image
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)
  
  // Ensure we have at least one image
  const allImages = images.length > 0 ? images : ['/placeholder.jpg']
  const currentImage = allImages[selectedIndex]
  
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
      if (!imagesLoaded.has(index)) {
        const img = new Image()
        img.src = allImages[index]
        img.onload = () => {
          setImagesLoaded(loaded => new Set([...loaded, index]))
        }
      }
    })
  }, [selectedIndex, allImages, imagesLoaded])

  const openModal = () => {
    setIsModalOpen(true)
    document.body.style.overflow = 'hidden'
  }

  const closeModal = () => {
    setIsModalOpen(false)
    document.body.style.overflow = 'auto'
  }

  return (
    <>
      {/* Hero Gallery Container */}
      <div className="relative w-full mb-0">
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
            src={currentImage}
            srcSet={generateSrcSet(currentImage)}
            alt={`${title} - Image ${selectedIndex + 1}`}
            className={`w-full h-full object-cover transition-opacity duration-300 ${imagesLoaded.has(selectedIndex) ? 'opacity-100' : 'opacity-0'}`}
            fetchPriority={selectedIndex === 0 ? "high" : "low"}
            loading={selectedIndex === 0 ? "eager" : "lazy"}
          />
          
          {/* Gradient Overlay - Exact same size as image */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent" />
          
          {/* Navigation Arrows - Enhanced for mobile touch */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-2 md:left-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all shadow-xl group z-10 touch-manipulation"
                aria-label="Previous image"
              >
                <svg 
                  className="w-4 h-4 md:w-5 md:h-5 text-gray-800 group-hover:scale-110 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleNext}
                className="absolute right-2 md:right-6 top-1/2 -translate-y-1/2 w-12 h-12 md:w-14 md:h-14 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white hover:scale-110 active:scale-95 transition-all shadow-xl group z-10 touch-manipulation"
                aria-label="Next image"
              >
                <svg 
                  className="w-4 h-4 md:w-5 md:h-5 text-gray-800 group-hover:scale-110 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* View All Photos Button */}
          <button
            onClick={openModal}
            className="absolute top-4 right-4 min-h-[48px] bg-white/95 backdrop-blur-sm text-gray-900 px-4 py-3 md:px-4 md:py-2 rounded-lg font-semibold text-sm hover:bg-white hover:scale-105 active:scale-95 transition-all shadow-xl flex items-center gap-2 whitespace-nowrap z-30 touch-manipulation"
            aria-label={`View all ${allImages.length} photos`}
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden sm:inline">View All</span>
            <span className="font-bold">{allImages.length}</span>
          </button>
          
          {/* Image Counter - Less intrusive on mobile */}
          {allImages.length > 1 && (
            <div className="absolute top-4 left-4 bg-gray-900/60 backdrop-blur-sm text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold z-20 shadow-lg">
              {selectedIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
        
        {/* Thumbnail Strip - Only show if more than 1 image */}
        {allImages.length > 1 && (
          <div className="bg-white border-t border-gray-200">
            <div className="py-4">
              <div className="overflow-x-auto scrollbar-hide">
                <div className="flex gap-2 px-4" style={{ justifyContent: 'flex-start' }}>
                  {allImages.map((image, index) => (
                    <button
                      key={index}
                      onClick={() => {
                        setSelectedIndex(index)
                        // Preload the selected image
                        setImagesLoaded(loaded => new Set([...loaded, index]))
                      }}
                      className={`flex-shrink-0 relative rounded-lg overflow-hidden transition-all duration-300 group touch-manipulation ${
                        index === selectedIndex 
                          ? 'scale-105 shadow-lg' 
                          : 'opacity-75 hover:opacity-100 hover:scale-102 hover:shadow-md'
                      }`}
                      style={index === selectedIndex ? {
                        outline: '3px solid #dc2626',
                        outlineOffset: '2px',
                        borderRadius: '8px'
                      } : {}}
                    >
                      <img
                        src={image}
                        alt={`Thumbnail ${index + 1}`}
                        className="w-16 h-12 md:w-20 md:h-14 object-cover group-hover:brightness-110 transition-all duration-300"
                        loading="lazy"
                        decoding="async"
                      />
                      {index === selectedIndex && (
                        <div className="absolute inset-0 bg-accent/15 backdrop-blur-[1px]" />
                      )}
                      {index !== selectedIndex && (
                        <div className="absolute inset-0 bg-black/10 group-hover:bg-transparent transition-all duration-300" />
                      )}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Full Screen Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 bg-gray-900">
          {/* Close Button */}
          <button
            onClick={closeModal}
            className="absolute top-4 right-4 z-50 w-10 h-10 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white"
            aria-label="Close gallery"
          >
            <svg 
              className="w-6 h-6" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>

          {/* Image Counter */}
          <div className="absolute top-4 left-4 z-50 bg-gray-900/80 backdrop-blur-sm text-white px-3 py-2 rounded-lg">
            <span className="font-semibold">{selectedIndex + 1}</span>
            <span className="mx-2 opacity-60">/</span>
            <span className="opacity-80">{allImages.length}</span>
          </div>

          {/* Main Image Container */}
          <div className="h-full flex items-center justify-center p-4">
            <img
              src={currentImage}
              alt={`${title} - Image ${selectedIndex + 1}`}
              className="max-w-full max-h-full object-contain"
            />
          </div>

          {/* Navigation */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white touch-manipulation"
                aria-label="Previous image"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleNext}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-14 h-14 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white touch-manipulation"
                aria-label="Next image"
              >
                <svg 
                  className="w-6 h-6" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}

          {/* Thumbnail Grid at Bottom */}
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-gray-900/90 to-transparent px-4 pt-8 pb-4">
            <div className="flex gap-2 justify-center overflow-x-auto">
              {allImages.map((image, index) => (
                <button
                  key={index}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex-shrink-0 relative rounded-lg overflow-hidden transition-all ${
                    index === selectedIndex 
                      ? 'ring-2 ring-white scale-110' 
                      : 'opacity-60 hover:opacity-100'
                  }`}
                >
                  <img
                    src={image}
                    alt={`Thumbnail ${index + 1}`}
                    className="w-16 h-12 object-cover"
                  />
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </>
  )
}