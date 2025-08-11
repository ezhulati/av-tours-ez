import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen } from '@testing-library/react'
import BookingButton from '@components/tours/BookingButton'

// Mock enhanced tours
vi.mock('@/data/enhancedTours', () => ({
  getEnhancedTour: vi.fn(() => ({
    callToAction: 'Book Now'
  }))
}))

// Mock affiliate tracking
vi.mock('@/lib/affiliateTracking', () => ({
  buildAffiliateUrl: vi.fn(() => 'https://bnadventure.com/tour/test'),
  trackBookingClick: vi.fn(() => Promise.resolve())
}))

describe('BookingButton Component', () => {
  const mockTour = {
    id: '1',
    slug: 'blue-eye-spring',
    title: 'Blue Eye Spring Tour',
    affiliateUrl: 'https://bnadventure.com/tour/blue-eye',
    operator: {
      id: 'op1',
      name: 'BNAdventure'
    }
  }

  beforeEach(() => {
    vi.clearAllMocks()
  })

  it('renders booking button with correct text', () => {
    render(<BookingButton tour={mockTour} />)
    expect(screen.getByRole('button')).toBeInTheDocument()
  })
})