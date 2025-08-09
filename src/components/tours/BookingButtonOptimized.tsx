import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import RedirectModal from './RedirectModalOptimized'
import { buildAffiliateUrl, trackBookingClick } from '@/lib/affiliateTracking'
import { getEnhancedTour } from '@/data/enhancedTours'
import { microcopy } from '@/lib/microcopy'

interface Tour {
  id: string
  slug: string
  title: string
  affiliateUrl?: string
  operator?: {
    id: string
    name: string
  }
  spotsRemaining?: number
  lastBookingTime?: string
  viewingCount?: number
}

interface BookingButtonProps {
  tour: Tour
  context?: 'tour-detail' | 'tour-card' | 'featured'
  variant?: 'default' | 'compact'
  className?: string
  children?: React.ReactNode
  showUrgency?: boolean
}

export default function BookingButtonOptimized({ 
  tour, 
  context = 'tour-detail',
  variant = 'default',
  className, 
  children,
  showUrgency = true
}: BookingButtonProps) {
  const [affiliateUrl, setAffiliateUrl] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [urgencyMessage, setUrgencyMessage] = useState<string>('')
  
  // Get enhanced copy for this tour
  const enhancedTour = getEnhancedTour(tour.slug)
  
  // Determine the CTA text based on context and variant
  const getCtaText = () => {
    if (children) return children
    
    if (variant === 'compact') {
      // Mobile-optimized short copy
      if (window.innerWidth < 640) {
        return microcopy.cta.booking.mobile
      }
      return microcopy.cta.booking.compact
    }
    
    // Use enhanced tour CTA if available, otherwise use optimized default
    return enhancedTour?.callToAction || microcopy.cta.booking.primary
  }
  
  // Set urgency messaging based on tour data
  useEffect(() => {
    if (!showUrgency) return
    
    // Priority 1: Low availability
    if (tour.spotsRemaining && tour.spotsRemaining < 5) {
      setUrgencyMessage(microcopy.urgency.availability.urgent(tour.spotsRemaining))
      return
    }
    
    // Priority 2: Active viewers
    if (tour.viewingCount && tour.viewingCount > 1) {
      setUrgencyMessage(microcopy.urgency.social.viewing(tour.viewingCount))
      return
    }
    
    // Priority 3: Recent booking
    if (tour.lastBookingTime) {
      setUrgencyMessage(microcopy.urgency.social.lastBooking(tour.lastBookingTime))
      return
    }
    
    // Default: Limited availability for featured tours
    if (context === 'featured') {
      setUrgencyMessage(microcopy.urgency.availability.moderate)
    }
  }, [tour, showUrgency, context])
  
  useEffect(() => {
    try {
      // Build affiliate URL on client-side to access window.location
      const url = buildAffiliateUrl(tour, context)
      console.log('Built affiliate URL:', url)
      setAffiliateUrl(url)
    } catch (error) {
      console.error('Error building affiliate URL:', error)
      setAffiliateUrl(`https://www.bnadventure.com/tours/${tour.slug}`)
    }
  }, [tour, context])

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault()
    e.stopPropagation()
    
    // Haptic feedback for mobile
    if ('vibrate' in navigator) {
      navigator.vibrate(10)
    }
    
    console.log('=== BOOKING BUTTON CLICKED ===')
    console.log('Context:', context, 'Variant:', variant)
    console.log('Tour slug:', tour.slug)
    
    try {
      // Always show modal for all booking buttons
      console.log('=> Opening modal')
      setIsLoading(true)
      setTimeout(() => {
        setShowModal(true)
        setIsLoading(false)
      }, 100) // Small delay for better UX
    } catch (error) {
      console.error('Error in handleClick:', error)
      setIsLoading(false)
    }
  }

  const handleContinueToPartner = () => {
    console.log('=== CONTINUE TO PARTNER CLICKED ===')
    try {
      // Navigate via server-side redirect for proper affiliate tracking
      window.open(`/out/${tour.slug}`, '_blank', 'noopener,noreferrer')
      
      // Close modal
      setShowModal(false)
    } catch (error) {
      console.error('Error in handleContinueToPartner:', error)
    }
  }

  if (variant === 'compact') {
    return (
      <>
        <div className="relative">
          {urgencyMessage && context === 'tour-card' && (
            <span className="absolute -top-6 left-0 text-xs text-orange-600 font-medium animate-pulse">
              {urgencyMessage}
            </span>
          )}
          <button 
            onClick={handleClick}
            disabled={isLoading}
            className={`inline-flex items-center justify-center min-h-[48px] bg-accent text-white px-6 py-3 rounded-lg hover:bg-accent-600 active:bg-accent-700 transition-all duration-200 font-semibold text-sm whitespace-nowrap touch-manipulation transform hover:scale-105 active:scale-95 shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed ${className || ''}`}
            aria-label={`Book tour: ${tour.title}`}
          >
            {isLoading ? (
              <>
                <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>{microcopy.cta.booking.loading}</span>
              </>
            ) : (
              <>
                <span className="mr-2">{getCtaText()}</span>
                <svg 
                  className="w-4 h-4 flex-shrink-0" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7"></path>
                </svg>
              </>
            )}
          </button>
        </div>
        
        {showModal && (
          <RedirectModalOptimized
            isOpen={showModal}
            onClose={() => setShowModal(false)}
            onContinue={handleContinueToPartner}
            partnerName={tour.operator?.name || 'Partner Operator'}
            partnerUrl={affiliateUrl}
          />
        )}
      </>
    )
  }

  console.log('BookingButton rendering:', { tour: tour?.slug, context, variant, className })

  return (
    <>
      <div className="relative">
        {urgencyMessage && context === 'tour-detail' && (
          <div className="flex items-center gap-2 mb-2">
            <svg className="w-4 h-4 text-orange-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clipRule="evenodd" />
            </svg>
            <span className="text-sm text-orange-600 font-medium">
              {urgencyMessage}
            </span>
          </div>
        )}
        
        <button
          onClick={handleClick}
          disabled={isLoading}
          className={`${className || ''} inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-accent text-white hover:bg-accent-700 active:bg-accent-800 shadow-sm hover:shadow-lg active:shadow-md rounded-lg min-h-[48px] h-12 px-6 touch-manipulation transform hover:scale-105 active:scale-95`}
          type="button"
          aria-label={`Book tour: ${tour.title}`}
        >
          {isLoading ? (
            <>
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>{microcopy.cta.booking.loading}</span>
            </>
          ) : (
            <>
              <span className="mr-2">{getCtaText()}</span>
              <svg 
                className="w-4 h-4 flex-shrink-0 transition-transform group-hover:translate-x-1" 
                fill="none" 
                stroke="currentColor" 
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 8l4 4m0 0l-4 4m4-4H3"></path>
              </svg>
            </>
          )}
        </button>
        
        {/* Trust signals below button */}
        {context === 'tour-detail' && (
          <div className="flex items-center gap-4 mt-3 text-xs text-gray-600">
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
              {microcopy.trust.guarantees.instant}
            </span>
            <span className="flex items-center gap-1">
              <svg className="w-4 h-4 text-gray-900" fill="currentColor" viewBox="0 0 20 20">
                <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
              </svg>
              {microcopy.trust.guarantees.price}
            </span>
          </div>
        )}
      </div>
      
      {showModal && (
        <RedirectModalOptimized
          isOpen={showModal}
          onClose={() => setShowModal(false)}
          onContinue={handleContinueToPartner}
          partnerName={tour.operator?.name || 'Partner Operator'}
          partnerUrl={affiliateUrl}
        />
      )}
    </>
  )
}