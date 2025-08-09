import React, { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import RedirectModal from './RedirectModal'
import { buildAffiliateUrl, trackBookingClick } from '@/lib/affiliateTracking'
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
  
  // Get enhanced copy for this tour
  const enhancedTour = getEnhancedTour(tour.slug)
  const defaultCTA = enhancedTour?.callToAction || 'Check Availability'
  
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
    console.log('=== BOOKING BUTTON CLICKED ===')
    console.log('Context:', context, 'Variant:', variant)
    console.log('Tour slug:', tour.slug)
    
    try {
      // Always show modal for all booking buttons
      console.log('=> Opening modal')
      setShowModal(true)
    } catch (error) {
      console.error('Error in handleClick:', error)
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
        <button 
          onClick={handleClick}
          className={`inline-block bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-600 transition font-semibold text-sm whitespace-nowrap ${className || ''}`}
        >
          {children || 'Check Availability'}
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

  console.log('BookingButton rendering:', { tour: tour?.slug, context, variant, className })

  return (
    <>
      <button
        onClick={handleClick}
        className={`${className || ''} inline-flex items-center justify-center whitespace-nowrap text-sm font-semibold ring-offset-background transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-accent focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-accent text-white hover:bg-accent-700 shadow-sm hover:shadow-md rounded-lg h-12 px-6`}
        type="button"
      >
        {children || defaultCTA}
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
