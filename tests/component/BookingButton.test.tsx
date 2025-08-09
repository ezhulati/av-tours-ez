import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import BookingButton from '@/components/tours/BookingButton'
import { tourFactory } from '../factories/tourFactory'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('BookingButton Component', () => {
  const mockTour = tourFactory.build()
  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Rendering', () => {
    it('should render with default props', () => {
      render(<BookingButton tour={mockTour} />)
      const button = screen.getByRole('button', { name: /book tour/i })
      expect(button).toBeInTheDocument()
    })

    it('should render with custom children text', () => {
      render(<BookingButton tour={mockTour}>Book Now</BookingButton>)
      expect(screen.getByText('Book Now')).toBeInTheDocument()
    })

    it('should render compact variant correctly', () => {
      render(<BookingButton tour={mockTour} variant="compact" />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass('inline-flex')
      expect(button).toHaveClass('min-h-[48px]')
    })

    it('should apply custom className', () => {
      const customClass = 'custom-test-class'
      render(<BookingButton tour={mockTour} className={customClass} />)
      const button = screen.getByRole('button')
      expect(button).toHaveClass(customClass)
    })

    it('should have proper aria-label', () => {
      render(<BookingButton tour={mockTour} />)
      const button = screen.getByRole('button')
      expect(button).toHaveAttribute('aria-label', `Book tour: ${mockTour.title}`)
    })
  })

  describe('Interactions', () => {
    it('should show loading state when clicked', async () => {
      render(<BookingButton tour={mockTour} />)
      const button = screen.getByRole('button')
      
      await user.click(button)
      
      expect(screen.getByText('Loading...')).toBeInTheDocument()
      await waitFor(() => {
        expect(screen.queryByText('Loading...')).not.toBeInTheDocument()
      })
    })

    it('should open modal when clicked', async () => {
      render(<BookingButton tour={mockTour} />)
      const button = screen.getByRole('button')
      
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/you're leaving albaniavisit/i)).toBeInTheDocument()
      })
    })

    it('should trigger haptic feedback on mobile', async () => {
      const vibrateMock = vi.fn()
      Object.defineProperty(navigator, 'vibrate', {
        value: vibrateMock,
        writable: true,
      })
      
      render(<BookingButton tour={mockTour} />)
      const button = screen.getByRole('button')
      
      await user.click(button)
      
      expect(vibrateMock).toHaveBeenCalledWith(10)
    })

    it('should prevent event propagation', async () => {
      const handleContainerClick = vi.fn()
      
      render(
        <div onClick={handleContainerClick}>
          <BookingButton tour={mockTour} />
        </div>
      )
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      expect(handleContainerClick).not.toHaveBeenCalled()
    })

    it('should handle modal close', async () => {
      render(<BookingButton tour={mockTour} />)
      const button = screen.getByRole('button')
      
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/you're leaving albaniavisit/i)).toBeInTheDocument()
      })
      
      const closeButton = screen.getByText(/stay on albaniavisit/i)
      await user.click(closeButton)
      
      await waitFor(() => {
        expect(screen.queryByText(/you're leaving albaniavisit/i)).not.toBeInTheDocument()
      })
    })

    it('should handle continue to partner', async () => {
      const openMock = vi.fn()
      window.open = openMock
      
      render(<BookingButton tour={mockTour} />)
      const button = screen.getByRole('button')
      
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/you're leaving albaniavisit/i)).toBeInTheDocument()
      })
      
      const continueButton = screen.getByText(/continue/i)
      await user.click(continueButton)
      
      expect(openMock).toHaveBeenCalledWith(
        `/out/${mockTour.slug}`,
        '_blank',
        'noopener,noreferrer'
      )
    })
  })

  describe('Context Variations', () => {
    it('should handle tour-detail context', () => {
      render(<BookingButton tour={mockTour} context="tour-detail" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle tour-card context', () => {
      render(<BookingButton tour={mockTour} context="tour-card" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })

    it('should handle featured context', () => {
      render(<BookingButton tour={mockTour} context="featured" />)
      expect(screen.getByRole('button')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<BookingButton tour={mockTour} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be keyboard navigable', async () => {
      render(<BookingButton tour={mockTour} />)
      const button = screen.getByRole('button')
      
      button.focus()
      expect(document.activeElement).toBe(button)
      
      fireEvent.keyDown(button, { key: 'Enter' })
      
      await waitFor(() => {
        expect(screen.getByText(/you're leaving albaniavisit/i)).toBeInTheDocument()
      })
    })

    it('should have sufficient color contrast', () => {
      const { container } = render(<BookingButton tour={mockTour} />)
      const button = container.querySelector('button')
      
      // This would typically use a color contrast checking library
      expect(button).toHaveClass('bg-accent')
      expect(button).toHaveClass('text-white')
    })

    it('should maintain 48px touch target', () => {
      const { container } = render(<BookingButton tour={mockTour} variant="compact" />)
      const button = container.querySelector('button')
      
      expect(button).toHaveClass('min-h-[48px]')
    })
  })

  describe('Error Handling', () => {
    it('should handle missing affiliate URL gracefully', async () => {
      const tourWithoutAffiliate = { ...mockTour, affiliateUrl: undefined }
      render(<BookingButton tour={tourWithoutAffiliate} />)
      
      const button = screen.getByRole('button')
      await user.click(button)
      
      await waitFor(() => {
        expect(screen.getByText(/you're leaving albaniavisit/i)).toBeInTheDocument()
      })
    })

    it('should handle modal errors gracefully', async () => {
      const consoleErrorSpy = vi.spyOn(console, 'error').mockImplementation(() => {})
      
      render(<BookingButton tour={mockTour} />)
      const button = screen.getByRole('button')
      
      await user.click(button)
      
      // Modal should still appear even if there are console errors
      await waitFor(() => {
        expect(screen.getByText(/you're leaving albaniavisit/i)).toBeInTheDocument()
      })
      
      consoleErrorSpy.mockRestore()
    })
  })

  describe('Performance', () => {
    it('should not re-render unnecessarily', () => {
      const { rerender } = render(<BookingButton tour={mockTour} />)
      const button = screen.getByRole('button')
      
      // Same props should not cause re-render
      rerender(<BookingButton tour={mockTour} />)
      expect(screen.getByRole('button')).toBe(button)
    })

    it('should debounce rapid clicks', async () => {
      render(<BookingButton tour={mockTour} />)
      const button = screen.getByRole('button')
      
      // Rapid clicks
      await user.click(button)
      await user.click(button)
      await user.click(button)
      
      // Should only open one modal
      await waitFor(() => {
        const modals = screen.queryAllByText(/you're leaving albaniavisit/i)
        expect(modals).toHaveLength(1)
      })
    })
  })
})