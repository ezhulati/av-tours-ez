import React from 'react'
import BookingButton from './BookingButton'

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

interface BookingButtonCompactProps {
  tour: Tour
  context?: 'tour-detail' | 'tour-card' | 'featured'
  className?: string
  children?: React.ReactNode
}

export default function BookingButtonCompact({ 
  tour,
  context = 'tour-card',
  className,
  children 
}: BookingButtonCompactProps) {
  return (
    <BookingButton
      tour={tour}
      context={context}
      variant="compact"
      className={className}
    >
      {children}
    </BookingButton>
  )
}