import React from 'react'
import { Button } from '@/components/ui/button'

interface BookingButtonProps {
  slug: string
  className?: string
  children?: React.ReactNode
}

export default function BookingButton({ slug, className, children }: BookingButtonProps) {
  const handleClick = () => {
    // Track GA event if available
    if (typeof gtag !== 'undefined') {
      ;(window as any).gtag('event', 'affiliate_click', {
        tour_slug: slug,
        event_category: 'engagement',
        event_label: slug
      })
    }
  }

  return (
    <Button
      asChild
      className={className}
    >
      <a 
        href={`/out/${slug}`}
        rel="sponsored nofollow noopener"
        onClick={handleClick}
      >
        {children || 'Book Now'}
      </a>
    </Button>
  )
}