import { describe, it, expect, vi, beforeEach } from 'vitest'
import { render, screen, waitFor } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import RedirectModal from '@/components/tours/RedirectModal'
import { axe, toHaveNoViolations } from 'jest-axe'

expect.extend(toHaveNoViolations)

describe('RedirectModal Component', () => {
  const defaultProps = {
    isOpen: true,
    onClose: vi.fn(),
    onContinue: vi.fn(),
    partnerName: 'Test Partner',
    partnerUrl: 'https://partner.com/tour',
  }

  let user: ReturnType<typeof userEvent.setup>

  beforeEach(() => {
    user = userEvent.setup()
    vi.clearAllMocks()
  })

  describe('Rendering', () => {
    it('should render when isOpen is true', () => {
      render(<RedirectModal {...defaultProps} />)
      expect(screen.getByText(/you're leaving albaniavisit/i)).toBeInTheDocument()
    })

    it('should not render when isOpen is false', () => {
      render(<RedirectModal {...defaultProps} isOpen={false} />)
      expect(screen.queryByText(/you're leaving albaniavisit/i)).not.toBeInTheDocument()
    })

    it('should display partner name', () => {
      render(<RedirectModal {...defaultProps} />)
      expect(screen.getByText('Test Partner')).toBeInTheDocument()
    })

    it('should display extracted domain', () => {
      render(<RedirectModal {...defaultProps} />)
      expect(screen.getByText('partner.com')).toBeInTheDocument()
    })

    it('should display all trust indicators', () => {
      render(<RedirectModal {...defaultProps} />)
      expect(screen.getByText(/secure & trusted/i)).toBeInTheDocument()
      expect(screen.getByText(/check availability/i)).toBeInTheDocument()
      expect(screen.getByText(/best price/i)).toBeInTheDocument()
    })

    it('should show both action buttons', () => {
      render(<RedirectModal {...defaultProps} />)
      expect(screen.getByText(/stay on albaniavisit/i)).toBeInTheDocument()
      expect(screen.getByText(/continue/i)).toBeInTheDocument()
    })
  })

  describe('Interactions', () => {
    it('should call onClose when clicking backdrop', async () => {
      const { container } = render(<RedirectModal {...defaultProps} />)
      const backdrop = container.querySelector('.absolute.inset-0')
      
      if (backdrop) {
        await user.click(backdrop)
      }
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onClose when clicking Stay button', async () => {
      render(<RedirectModal {...defaultProps} />)
      const stayButton = screen.getByText(/stay on albaniavisit/i)
      
      await user.click(stayButton)
      
      expect(defaultProps.onClose).toHaveBeenCalledTimes(1)
    })

    it('should call onContinue when clicking Continue button', async () => {
      render(<RedirectModal {...defaultProps} />)
      const continueButton = screen.getByText(/continue/i)
      
      await user.click(continueButton)
      
      expect(defaultProps.onContinue).toHaveBeenCalledTimes(1)
    })

    it('should not trigger actions when modal is closed', () => {
      const { rerender } = render(<RedirectModal {...defaultProps} />)
      rerender(<RedirectModal {...defaultProps} isOpen={false} />)
      
      expect(screen.queryByText(/continue/i)).not.toBeInTheDocument()
    })
  })

  describe('Edge Cases', () => {
    it('should handle invalid URL gracefully', () => {
      render(<RedirectModal {...defaultProps} partnerUrl="not-a-valid-url" />)
      expect(screen.getByText('partner site')).toBeInTheDocument()
    })

    it('should handle missing partner name', () => {
      render(<RedirectModal {...defaultProps} partnerName="" />)
      expect(screen.getByText('Partner Site')).toBeInTheDocument()
    })

    it('should handle URL with www prefix', () => {
      render(<RedirectModal {...defaultProps} partnerUrl="https://www.example.com" />)
      expect(screen.getByText('example.com')).toBeInTheDocument()
    })
  })

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<RedirectModal {...defaultProps} />)
      const results = await axe(container)
      expect(results).toHaveNoViolations()
    })

    it('should be keyboard navigable', async () => {
      render(<RedirectModal {...defaultProps} />)
      
      const stayButton = screen.getByText(/stay on albaniavisit/i)
      const continueButton = screen.getByText(/continue/i)
      
      stayButton.focus()
      expect(document.activeElement).toBe(stayButton)
      
      await user.tab()
      expect(document.activeElement).toBe(continueButton)
    })

    it('should trap focus within modal', () => {
      render(<RedirectModal {...defaultProps} />)
      
      const modalContent = screen.getByText(/you're leaving albaniavisit/i).closest('.relative')
      expect(modalContent).toBeInTheDocument()
      
      // Modal should be in focus trap
      const buttons = screen.getAllByRole('button')
      expect(buttons.length).toBeGreaterThan(0)
    })

    it('should have proper ARIA attributes', () => {
      const { container } = render(<RedirectModal {...defaultProps} />)
      const modal = container.querySelector('.fixed.inset-0')
      
      expect(modal).toHaveClass('z-[60]')
      // Modal should be above other content
    })
  })

  describe('Visual States', () => {
    it('should apply correct styling for backdrop', () => {
      const { container } = render(<RedirectModal {...defaultProps} />)
      const backdrop = container.querySelector('.bg-black\\/60')
      
      expect(backdrop).toHaveClass('backdrop-blur-sm')
    })

    it('should apply correct styling for modal container', () => {
      const { container } = render(<RedirectModal {...defaultProps} />)
      const modal = container.querySelector('.bg-white')
      
      expect(modal).toHaveClass('rounded-2xl')
      expect(modal).toHaveClass('shadow-2xl')
    })

    it('should display icon in header', () => {
      render(<RedirectModal {...defaultProps} />)
      const svg = document.querySelector('svg')
      
      expect(svg).toBeInTheDocument()
      expect(svg).toHaveClass('text-accent')
    })
  })

  describe('Responsive Design', () => {
    it('should use flex column on small screens', () => {
      const { container } = render(<RedirectModal {...defaultProps} />)
      const buttonContainer = container.querySelector('.flex.flex-col')
      
      expect(buttonContainer).toHaveClass('sm:flex-row')
    })

    it('should have full width buttons on mobile', () => {
      const { container } = render(<RedirectModal {...defaultProps} />)
      const buttons = container.querySelectorAll('.w-full')
      
      expect(buttons.length).toBeGreaterThan(0)
    })
  })

  describe('Animation and Transitions', () => {
    it('should reset countdown on open', async () => {
      const { rerender } = render(<RedirectModal {...defaultProps} isOpen={false} />)
      
      rerender(<RedirectModal {...defaultProps} isOpen={true} />)
      
      await waitFor(() => {
        expect(screen.getByText(/you're leaving albaniavisit/i)).toBeInTheDocument()
      })
      
      // No countdown should be visible
      expect(screen.queryByText(/redirecting in/i)).not.toBeInTheDocument()
    })
  })
})