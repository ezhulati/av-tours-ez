import React, { useState } from 'react'

interface HeroGalleryProps {
  images: string[]
  title: string
}

export default function HeroGallery({ images, title }: HeroGalleryProps) {
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [isModalOpen, setIsModalOpen] = useState(false)
  
  // Ensure we have at least one image
  const allImages = images.length > 0 ? images : ['/placeholder.jpg']
  const currentImage = allImages[selectedIndex]
  
  const handlePrevious = () => {
    setSelectedIndex((prev) => (prev === 0 ? allImages.length - 1 : prev - 1))
  }
  
  const handleNext = () => {
    setSelectedIndex((prev) => (prev === allImages.length - 1 ? 0 : prev + 1))
  }

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
      {/* Hero Gallery Container - Full Width with overflow control */}
      <div className="relative w-screen -ml-[50vw] left-1/2 mb-8 prevent-overflow">
        {/* Main Display - Full width with height control */}
        <div className="relative w-full h-[50vh] md:h-[60vh] lg:h-[70vh] max-h-[800px]">
          {/* Main Image */}
          <img
            src={currentImage}
            alt={`${title} - Image ${selectedIndex + 1}`}
            className="w-full h-full object-cover"
            fetchPriority="high"
          />
          
          {/* Gradient Overlay for better text visibility */}
          <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent" />
          
          {/* Navigation Arrows - Only show if multiple images */}
          {allImages.length > 1 && (
            <>
              <button
                onClick={handlePrevious}
                className="absolute left-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-xl group z-10"
                aria-label="Previous image"
              >
                <svg 
                  className="w-5 h-5 text-gray-800 group-hover:scale-110 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              
              <button
                onClick={handleNext}
                className="absolute right-6 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/95 backdrop-blur-sm rounded-lg flex items-center justify-center hover:bg-white hover:scale-110 transition-all shadow-xl group z-10"
                aria-label="Next image"
              >
                <svg 
                  className="w-5 h-5 text-gray-800 group-hover:scale-110 transition-transform" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </>
          )}
          
          {/* View All Photos Button - Mobile prominent, desktop minimal */}
          <button
            onClick={openModal}
            className="absolute top-4 right-4 bg-white/95 backdrop-blur-sm text-gray-900 px-3 py-2 md:px-4 md:py-2 rounded-lg font-semibold text-sm hover:bg-white hover:scale-105 transition-all shadow-xl flex items-center gap-2 whitespace-nowrap z-30"
          >
            <svg 
              className="w-4 h-4" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            <span className="hidden sm:inline">View All </span>
            📸 {allImages.length}
          </button>
          
          {/* Mobile: Additional floating "View All Photos" button */}
          {allImages.length > 1 && (
            <button
              onClick={openModal}
              className="md:hidden absolute bottom-4 right-4 bg-accent text-white px-4 py-2 rounded-full font-semibold text-sm shadow-xl flex items-center gap-2 whitespace-nowrap z-30 animate-pulse"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
              View All Photos
            </button>
          )}
          
          {/* Image Counter - Less intrusive on mobile */}
          {allImages.length > 1 && (
            <div className="absolute top-4 left-4 bg-gray-900/60 backdrop-blur-sm text-white px-2 py-1 md:px-4 md:py-2 rounded-lg text-xs md:text-sm font-semibold z-20 shadow-lg">
              {selectedIndex + 1} / {allImages.length}
            </div>
          )}
        </div>
        
        {/* Thumbnail Strip - Only show if more than 1 image */}
        {allImages.length > 1 && (
          <div className="bg-white border-t border-gray-200 shadow-lg">
            <div className="pt-8 pb-6">
              <div className="container mx-auto px-4">
                <div className="overflow-x-auto scrollbar-hide">
                  <div className="flex gap-3 justify-center">
                    {allImages.map((image, index) => (
                      <button
                        key={index}
                        onClick={() => setSelectedIndex(index)}
                        className={`flex-shrink-0 relative rounded-xl overflow-hidden transition-all duration-300 group ${
                          index === selectedIndex 
                            ? 'ring-3 ring-accent ring-offset-2 scale-105 shadow-lg' 
                            : 'opacity-75 hover:opacity-100 hover:scale-102 hover:shadow-md'
                        }`}
                      >
                        <img
                          src={image}
                          alt={`Thumbnail ${index + 1}`}
                          className="w-24 h-16 object-cover group-hover:brightness-110 transition-all duration-300"
                          loading="lazy"
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
                className="absolute left-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white"
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
                className="absolute right-4 top-1/2 -translate-y-1/2 w-12 h-12 bg-white/10 backdrop-blur-sm rounded-full flex items-center justify-center hover:bg-white/20 transition-all text-white"
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