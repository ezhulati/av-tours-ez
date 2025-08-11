import { describe, it, expect } from 'vitest'
import { render, screen } from '@testing-library/react'
import TourCard from '@components/tours/TourCard'
import { createMockTourCard } from '../factories/tourFactory'

describe('TourCard Component', () => {
  const mockTour = createMockTourCard({
    title: 'Blue Eye Spring Tour',
    shortDescription: 'Experience the stunning Blue Eye spring in Saranda',
    durationDisplay: '4 hours',
    difficulty: 'easy',
    priceMin: 25.50,
    currency: 'EUR',
    featured: true,
    primaryImageUrl: '/assets/blue-eye.jpg',
    slug: 'blue-eye-spring-tour'
  })

  it('renders tour information correctly', () => {
    render(<TourCard tour={mockTour} />)
    
    expect(screen.getByText('Blue Eye Spring Tour')).toBeInTheDocument()
    expect(screen.getByText('Experience the stunning Blue Eye spring in Saranda')).toBeInTheDocument()
    expect(screen.getByText('4 hours')).toBeInTheDocument()
    expect(screen.getByText('From €25.5')).toBeInTheDocument()
  })

  it('shows featured indicator for featured tours', () => {
    render(<TourCard tour={mockTour} />)
    const featuredElement = screen.getByText('Featured')
    expect(featuredElement).toBeInTheDocument()
  })

  it('displays difficulty level', () => {
    render(<TourCard tour={mockTour} />)
    expect(screen.getByText('easy')).toBeInTheDocument()
  })

  it('shows check availability when price is null', () => {
    const tourWithoutPrice = { ...mockTour, priceMin: null }
    render(<TourCard tour={tourWithoutPrice} />)
    expect(screen.getByText('Check availability')).toBeInTheDocument()
  })

  it('renders loading skeleton when loading prop is true', () => {
    const { container } = render(<TourCard tour={mockTour} loading={true} />)
    const skeleton = container.querySelector('.animate-pulse')
    expect(skeleton).toBeInTheDocument()
  })

  it('contains link to tour detail page', () => {
    render(<TourCard tour={mockTour} />)
    const links = screen.getAllByRole('link')
    
    links.forEach(link => {
      expect(link).toHaveAttribute('href', '/tours/blue-eye-spring-tour')
    })
  })
})