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
  const [affiliateUrl, setAffiliateUrl] = useState<string>('#')
  const [showModal, setShowModal] = useState(false)
  
  // Get enhanced copy for this tour
  const enhancedTour = getEnhancedTour(tour.slug)
  const defaultCTA = enhancedTour?.callToAction || 'Check Availability'
  
  useEffect(() => {
    // Build affiliate URL on client-side to access window.location
    const url = buildAffiliateUrl(tour, context)
    setAffiliateUrl(url)
  }, [tour, context])

  const handleClick = async (e: React.MouseEvent) => {
    e.preventDefault()
    
    // Show modal for main booking buttons
    if (context === 'tour-detail' && variant !== 'compact') {
      setShowModal(true)
    } else {
      // For compact variants or non-detail contexts, track and navigate immediately
      await trackBookingClick(tour, context)
      window.open(affiliateUrl, '_blank', 'noopener,noreferrer')
    }
  }

  const handleContinueToPartner = async () => {
    // Track the click across all platforms
    await trackBookingClick(tour, context)
    
    // Navigate to partner site
    window.open(affiliateUrl, '_blank', 'noopener,noreferrer')
    
    // Close modal
    setShowModal(false)
  }

  if (variant === 'compact') {
    return (
      <a 
        href={affiliateUrl}
        rel="sponsored nofollow noopener"
        onClick={handleClick}
        className={`inline-block bg-accent text-white px-4 py-2 rounded-lg hover:bg-accent-600 transition font-semibold text-sm whitespace-nowrap ${className || ''}`}
      >
        {children || 'Book'}
      </a>
    )
  }

  return (
    <>
      <Button
        asChild
        className={className}
      >
        <a 
          href={affiliateUrl}
          rel="sponsored nofollow noopener"
          onClick={handleClick}
        >
          {children || defaultCTA}
        </a>
      </Button>
      
      <RedirectModal
        isOpen={showModal}
        onClose={() => setShowModal(false)}
        onContinue={handleContinueToPartner}
        partnerName={tour.operator?.name || 'Partner Operator'}
        partnerUrl={affiliateUrl}
      />
    </>
  )
}