import React, { useState, useEffect, useRef } from 'react'
import BookingButton from './BookingButton'
import { TourCardSkeleton } from '../ui/SkeletonLoader'
import { formatPriceDisplay } from '@/lib/pricing/priceValidator'
import OptimizedImage from '../OptimizedImage'

interface Tour {
  id: string
  slug: string
  title: string
  shortDescription?: string
  images: { url: string }[]
  priceMin?: number
  priceMax?: number
  durationDisplay?: string
  difficulty?: string
  countries: string[]
  operator?: {
    id: string
    name: string
  }
}

interface OptimizedTourCardProps {
  tour: Tour
  priority?: boolean
}

const OptimizedTourCard: React.FC<OptimizedTourCardProps> = ({ tour, priority = false }) => {
  const [isVisible, setIsVisible] = useState(false)
  const [imageLoaded, setImageLoaded] = useState(false)
  const [imageError, setImageError] = useState(false)
  const cardRef = useRef<HTMLDivElement>(null)
  
  // Intersection Observer for lazy loading
  useEffect(() => {
    if (priority) {
      setIsVisible(true)
      return
    }
    
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setIsVisible(true)
          observer.disconnect()
        }
      },
      {
        threshold: 0.1,
        rootMargin: '50px'
      }
    )
    
    if (cardRef.current) {
      observer.observe(cardRef.current)
    }
    
    return () => observer.disconnect()
  }, [priority])
  
  const handleImageLoad = () => {
    setImageLoaded(true)
  }
  
  const handleImageError = () => {
    setImageError(true)
    setImageLoaded(true)
  }
  
  // Show skeleton while not visible
  if (!isVisible) {
    return (
      <div ref={cardRef}>
        <TourCardSkeleton />
      </div>
    )
  }
  
  const mainImage = tour.images?.[0]?.url || '/placeholder.jpg'
  
  // Format price display with validation
  const priceDisplay = formatPriceDisplay(
    tour.priceMin ? `€${tour.priceMin}` : null,
    'BNAdventure'
  )
  
  return (
    <article 
      ref={cardRef}
      className="group bg-white rounded-xl shadow-lg hover:shadow-2xl transition-all duration-300 overflow-hidden transform hover:scale-[1.02] will-change-transform"
      itemScope 
      itemType="https://schema.org/TouristTrip"
    >
      <a 
        href={`/tours/${tour.slug}`} 
        className="block focus:outline-none focus:ring-2 focus:ring-accent focus:ring-offset-2 rounded-xl"
        aria-label={`View details for ${tour.title}`}
      >
        {/* Optimized Image Container */}
        <div className="relative h-56 overflow-hidden">
          <OptimizedImage
            src={mainImage}
            alt={tour.title}
            context="card"
            className="w-full h-full group-hover:scale-110 transition-transform duration-500"
            priority={priority}
            aspectRatio="4/3"
          />
          
          {/* Badges */}
          <div className="absolute top-3 left-3 flex gap-2">
            {tour.difficulty && (
              <span className="bg-white/95 backdrop-blur-sm text-gray-800 px-3 py-1 rounded-full text-xs font-semibold capitalize">
                {tour.difficulty}
              </span>
            )}
          </div>
          
          {/* Price Badge */}
          <div className={`absolute bottom-3 left-3 backdrop-blur-sm px-3 py-2 rounded-lg ${
            priceDisplay.primary === 'Check availability' 
              ? 'bg-white/90 text-gray-700' 
              : 'bg-gray-900/90 text-white'
          }`}>
            {priceDisplay.secondary && (
              <div className="text-xs opacity-90">{priceDisplay.secondary}</div>
            )}
            <div className={priceDisplay.primary === 'Check availability' ? 'text-sm font-medium' : 'text-lg font-bold'}>
              {priceDisplay.primary}
            </div>
          </div>
        </div>
        
        {/* Content */}
        <div className="p-5">
          <h3 
            className="text-lg font-bold text-gray-900 mb-2 line-clamp-2 group-hover:text-accent transition-colors"
            itemProp="name"
          >
            {tour.title}
          </h3>
          
          {tour.shortDescription && (
            <p 
              className="text-sm text-gray-600 mb-3 line-clamp-2"
              itemProp="description"
            >
              {tour.shortDescription}
            </p>
          )}
          
          {/* Meta Info */}
          <div className="flex flex-wrap gap-3 mb-4 text-xs text-gray-500">
            {tour.durationDisplay && (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span itemProp="duration">{tour.durationDisplay}</span>
              </div>
            )}
            
            {tour.countries && tour.countries.length > 0 && (
              <div className="flex items-center gap-1">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                </svg>
                <span itemProp="location">{tour.countries[0]}</span>
              </div>
            )}
          </div>
        </div>
      </a>
      
      {/* CTA Section */}
      <div className="px-5 pb-5 pt-0">
        <BookingButton
          tour={tour}
          context="tour-card"
          variant="compact"
          className="w-full"
        >
          View Details
        </BookingButton>
      </div>
    </article>
  )
}

export default OptimizedTourCard