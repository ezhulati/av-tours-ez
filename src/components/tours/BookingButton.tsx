import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import RedirectModal from './RedirectModal'
import { buildAffiliateUrl, trackBookingClick } from '@/lib/affiliateTracking'
import { trackBookingClick as trackClarityBooking } from '@/lib/clarityTracking'
import { getEnhancedTour } from '@/data/enhancedTours'

interface Tour {
  id: string
  slug: string
  title: string
  affiliateUrl?: string
  operator?: {
    id: string
    name: string
  }
}

interface BookingButtonProps {
  tour: Tour
  context?: 'tour-detail' | 'tour-card' | 'featured'
  variant?: 'default' | 'compact'
  className?: string
  children?: React.ReactNode
}

export default function BookingButton({ 
  tour, 
  context = 'tour-detail',
  variant = 'default',
  className, 
  children 
}: BookingButtonProps) {
  const [affiliateUrl, setAffiliateUrl] = useState<string>('')
  const [showModal, setShowModal] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  
  // Get enhanced copy for this tour
  const enhancedTour = getEnhancedTour(tour.slug)
  const defaultCTA = enhancedTour?.callToAction || 'Check Availability'
  
  useEffect(() => {
    try {
      // Build affiliate URL on client-side to access window.location
      const url = buildAffiliateUrl(tour, context)
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
    
    try {
      // Track booking click in Clarity
      trackClarityBooking(tour.slug, context, variant || 'default')
      
      // Always show modal for all booking buttons
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
              <span>Loading...</span>
            </>
          ) : (
            <>
              <span className="mr-2">{children || 'Check Availability'}</span>
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
        
        {showModal && (
          <RedirectModal
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

  return (
    <>
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
            <span>Loading...</span>
          </>
        ) : (
          <>
            <span className="mr-2">{children || defaultCTA}</span>
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
      
      {showModal && (
        <RedirectModal
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
