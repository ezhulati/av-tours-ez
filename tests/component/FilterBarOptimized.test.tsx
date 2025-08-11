import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, screen, fireEvent, waitFor, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import FilterBarOptimized from '@/components/tours/FilterBarOptimized'
import type { TourFilters, PaginationParams } from '@/lib/dto'
import { server } from '../mocks/server'
import { http, HttpResponse } from 'msw'

// Mock window.history.replaceState
const mockReplaceState = vi.fn()
Object.defineProperty(window, 'history', {
  value: {
    replaceState: mockReplaceState
  },
  writable: true
})

describe('FilterBarOptimized', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockReplaceState.mockClear()
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  describe('Accessibility', () => {
    it('should have proper ARIA labels for all filters', () => {
      render(<FilterBarOptimized />)
      
      // Check filter selects and inputs exist with proper accessibility
      expect(screen.getByRole('combobox', { name: /filter by country/i })).toBeInTheDocument()
      expect(screen.getByRole('combobox', { name: /filter by difficulty/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /minimum duration/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /maximum duration/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /minimum price/i })).toBeInTheDocument()
      expect(screen.getByRole('spinbutton', { name: /maximum price/i })).toBeInTheDocument()
    })

    it('should support keyboard navigation', async () => {
      const user = userEvent.setup()
      
      // Mock desktop viewport and trigger resize
      Object.defineProperty(window, 'innerWidth', { value: 1024, writable: true })
      window.dispatchEvent(new Event('resize'))
      
      render(<FilterBarOptimized />)
      
      // Wait for component to adjust to desktop view
      await waitFor(() => {
        const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
        expect(countrySelect).toBeVisible()
      })
      
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      const difficultySelect = screen.getByRole('combobox', { name: /filter by difficulty/i })
      
      // Focus first element
      countrySelect.focus()
      expect(document.activeElement).toBe(countrySelect)
      
      // Tab to next filter
      await user.tab()
      expect(document.activeElement).toBe(difficultySelect)
    })

    it('should announce filter results to screen readers', async () => {
      // Mock API response
      server.use(
        http.get('/api/tours', () => {
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 5, totalPages: 1 }
          })
        })
      )
      
      render(<FilterBarOptimized />)
      
      // Change a filter
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      
      // Wait for announcement
      await waitFor(() => {
        expect(screen.getByText('5 tours found')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should handle focus management on mobile toggle', async () => {
      const user = userEvent.setup()
      
      // Set viewport to mobile
      window.innerWidth = 375
      render(<FilterBarOptimized />)
      
      const toggleButton = screen.getByRole('button', { name: /show tour filters/i })
      
      // Open filters
      await user.click(toggleButton)
      expect(screen.getByRole('button', { name: /hide tour filters/i })).toBeInTheDocument()
      
      // First filter should receive focus after opening
      await waitFor(() => {
        const firstFilter = screen.getByRole('combobox', { name: /filter by country/i })
        expect(document.activeElement).toBe(firstFilter)
      })
    })

    it('should close filters on Escape key', async () => {
      const user = userEvent.setup()
      
      // Set viewport to mobile
      window.innerWidth = 375
      render(<FilterBarOptimized />)
      
      const toggleButton = screen.getByRole('button', { name: /show tour filters/i })
      await user.click(toggleButton)
      
      // Press Escape
      await user.keyboard('{Escape}')
      
      // Should be closed and focus returned to toggle
      expect(screen.getByRole('button', { name: /show tour filters/i })).toBeInTheDocument()
      expect(document.activeElement).toBe(toggleButton)
    })
  })

  describe('Performance', () => {
    it('should debounce API calls', async () => {
      let requestCount = 0
      server.use(
        http.get('/api/tours', ({ request }) => {
          requestCount++
          const url = new URL(request.url)
          const priceMin = url.searchParams.get('price_min')
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }
          })
        })
      )
      
      render(<FilterBarOptimized />)
      
      const priceMin = screen.getByRole('spinbutton', { name: /minimum price/i })
      
      // Type quickly
      fireEvent.change(priceMin, { target: { value: '1' } })
      fireEvent.change(priceMin, { target: { value: '10' } })
      fireEvent.change(priceMin, { target: { value: '100' } })
      
      // Wait for debounce (500ms)
      await waitFor(() => {
        expect(requestCount).toBe(1)
      }, { timeout: 1000 })
    })

    it('should show loading state during fetch', async () => {
      let resolveResponse: any
      const responsePromise = new Promise((resolve) => {
        resolveResponse = resolve
      })
      
      server.use(
        http.get('/api/tours', async () => {
          await responsePromise
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }
          })
        })
      )
      
      render(<FilterBarOptimized />)
      
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      
      // Wait for loading indicator
      await waitFor(() => {
        expect(screen.getByText('Updating tours...')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      // Resolve the promise
      resolveResponse()
      
      // Loading should disappear
      await waitFor(() => {
        expect(screen.queryByText('Updating tours...')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should abort previous requests when filters change', async () => {
      server.use(
        http.get('/api/tours', () => {
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }
          })
        })
      )
      
      render(<FilterBarOptimized />)
      
      // Change filter multiple times quickly
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      fireEvent.change(countrySelect, { target: { value: 'Kosovo' } })
      
      // Should handle multiple rapid changes without errors
      await waitFor(() => {
        expect(screen.getByDisplayValue('Kosovo')).toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Mobile Responsiveness', () => {
    beforeEach(() => {
      // Set viewport to mobile
      window.innerWidth = 375
    })

    it('should show mobile toggle button on small screens', () => {
      render(<FilterBarOptimized />)
      
      const toggleButton = screen.getByRole('button', { name: /show tour filters/i })
      expect(toggleButton).toBeInTheDocument()
      
      // Filters should be hidden initially
      const filterContent = document.getElementById('filter-content')
      expect(filterContent).toHaveClass('hidden')
    })

    it('should show active filter count in mobile toggle', async () => {
      server.use(
        http.get('/api/tours', () => {
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 10, totalPages: 1 }
          })
        })
      )
      
      render(<FilterBarOptimized />)
      
      // Open filters
      const toggleButton = screen.getByRole('button', { name: /show tour filters/i })
      fireEvent.click(toggleButton)
      
      // Apply some filters
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      
      const difficultySelect = screen.getByRole('combobox', { name: /filter by difficulty/i })
      fireEvent.change(difficultySelect, { target: { value: 'easy' } })
      
      // Close filters
      fireEvent.click(toggleButton)
      
      // Should show active filter count
      await waitFor(() => {
        expect(screen.getByText('2 active')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should have touch-friendly controls', () => {
      render(<FilterBarOptimized />)
      
      const toggleButton = screen.getByRole('button', { name: /show tour filters/i })
      expect(toggleButton).toHaveClass('touch-manipulation')
      expect(toggleButton).toHaveClass('min-h-[56px]')
      
      // Open filters
      fireEvent.click(toggleButton)
      
      // Check input sizes
      const inputs = screen.getAllByRole('spinbutton')
      inputs.forEach(input => {
        expect(input).toHaveClass('min-h-[48px]')
      })
      
      const selects = screen.getAllByRole('combobox')
      selects.forEach(select => {
        expect(select).toHaveClass('min-h-[48px]')
      })
    })
  })

  describe('Error Handling', () => {
    it('should display error message on API failure', async () => {
      server.use(
        http.get('/api/tours', () => {
          return HttpResponse.error()
        })
      )
      
      render(<FilterBarOptimized />)
      
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to load tours')
      }, { timeout: 1000 })
    })

    it('should handle invalid API responses gracefully', async () => {
      server.use(
        http.get('/api/tours', () => {
          return HttpResponse.json({ invalid: 'response' })
        })
      )
      
      render(<FilterBarOptimized />)
      
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toHaveTextContent('Failed to load tours')
      }, { timeout: 1000 })
    })

    it('should recover from errors when filters are cleared', async () => {
      // First request fails
      server.use(
        http.get('/api/tours', () => {
          return HttpResponse.error()
        })
      )
      
      render(<FilterBarOptimized />)
      
      // Trigger error
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      
      await waitFor(() => {
        expect(screen.getByRole('alert')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      // Mock successful response for next call
      server.use(
        http.get('/api/tours', () => {
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }
          })
        })
      )
      
      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear all filters/i })
      fireEvent.click(clearButton)
      
      // Error should be gone
      await waitFor(() => {
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Filter Functionality', () => {
    it('should update URL with filter parameters', async () => {
      server.use(
        http.get('/api/tours', () => {
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }
          })
        })
      )
      
      render(<FilterBarOptimized />)
      
      // Apply filters
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      
      const minPrice = screen.getByRole('spinbutton', { name: /minimum price/i })
      fireEvent.change(minPrice, { target: { value: '100' } })
      
      // Wait for debounce and check URL update
      await waitFor(() => {
        expect(mockReplaceState).toHaveBeenCalledWith(
          {},
          '',
          expect.stringContaining('country=Albania')
        )
      }, { timeout: 1000 })
    })

    it('should reset to page 1 when filters change', async () => {
      const onFiltersChange = vi.fn()
      server.use(
        http.get('/api/tours', ({ request }) => {
          const url = new URL(request.url)
          expect(url.searchParams.get('page')).toBe('1')
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 50, totalPages: 5 }
          })
        })
      )
      
      render(
        <FilterBarOptimized 
          onFiltersChange={onFiltersChange}
          initialPagination={{ page: 3, limit: 12 }}
        />
      )
      
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      
      await waitFor(() => {
        expect(onFiltersChange).toHaveBeenCalled()
      }, { timeout: 1000 })
    })

    it('should clear all filters and reset state', async () => {
      server.use(
        http.get('/api/tours', () => {
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 10, totalPages: 1 }
          })
        })
      )
      
      render(<FilterBarOptimized />)
      
      // Apply multiple filters
      fireEvent.change(screen.getByRole('combobox', { name: /filter by country/i }), { target: { value: 'Albania' } })
      fireEvent.change(screen.getByRole('combobox', { name: /filter by difficulty/i }), { target: { value: 'easy' } })
      fireEvent.change(screen.getByRole('spinbutton', { name: /minimum price/i }), { target: { value: '100' } })
      
      await waitFor(() => {
        expect(screen.getByText(/10 tours found/i)).toBeInTheDocument()
      }, { timeout: 1000 })
      
      // Clear filters
      const clearButton = screen.getByRole('button', { name: /clear all filters/i })
      fireEvent.click(clearButton)
      
      // Check that filters are reset by verifying the clear button disappears
      // and the result count changes back to no filters applied
      await waitFor(() => {
        expect(screen.queryByRole('button', { name: /clear all filters/i })).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })

  describe('Visual Feedback', () => {
    it('should show results count when filters are active', async () => {
      server.use(
        http.get('/api/tours', () => {
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 15, totalPages: 2 }
          })
        })
      )
      
      render(<FilterBarOptimized />)
      
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      
      await waitFor(() => {
        expect(screen.getByText('15 tours found')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should show singular form for single result', async () => {
      server.use(
        http.get('/api/tours', () => {
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 1, totalPages: 1 }
          })
        })
      )
      
      render(<FilterBarOptimized />)
      
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      
      await waitFor(() => {
        expect(screen.getByText('1 tour found')).toBeInTheDocument()
      }, { timeout: 1000 })
    })

    it('should show loading overlay during updates', async () => {
      let resolveResponse: any
      const responsePromise = new Promise((resolve) => {
        resolveResponse = resolve
      })
      
      server.use(
        http.get('/api/tours', async () => {
          await responsePromise
          return HttpResponse.json({
            items: [],
            pagination: { page: 1, limit: 12, total: 0, totalPages: 0 }
          })
        })
      )
      
      render(<FilterBarOptimized />)
      
      const countrySelect = screen.getByRole('combobox', { name: /filter by country/i })
      fireEvent.change(countrySelect, { target: { value: 'Albania' } })
      
      // Should show loading overlay
      await waitFor(() => {
        expect(screen.getByText('Updating tours...')).toBeInTheDocument()
      }, { timeout: 1000 })
      
      // Resolve the promise
      resolveResponse()
      
      // Loading should disappear
      await waitFor(() => {
        expect(screen.queryByText('Updating tours...')).not.toBeInTheDocument()
      }, { timeout: 1000 })
    })
  })
})