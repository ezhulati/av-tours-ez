import React, { useState, useEffect, useCallback } from 'react'
import type { TourFilters, PaginationParams, PaginatedResponse, TourCardDTO } from '@/lib/dto'

// Debounce utility
function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeout: NodeJS.Timeout | null = null
  
  return (...args: Parameters<T>) => {
    if (timeout) clearTimeout(timeout)
    timeout = setTimeout(() => func(...args), wait)
  }
}

interface FilterBarProps {
  onFiltersChange?: (filters: TourFilters, pagination: PaginationParams) => void
  initialFilters?: TourFilters
  initialPagination?: PaginationParams
}

export default function FilterBar({ 
  onFiltersChange, 
  initialFilters = {},
  initialPagination = { page: 1, limit: 12 }
}: FilterBarProps) {
  const [filters, setFilters] = useState<TourFilters>(initialFilters)
  const [pagination, setPagination] = useState<PaginationParams>(initialPagination)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Debounced fetch function
  const fetchTours = useCallback(
    debounce(async (filters: TourFilters, pagination: PaginationParams) => {
      setLoading(true)
      
      const params = new URLSearchParams()
      if (filters.country) params.set('country', filters.country)
      if (filters.category) params.set('category', filters.category)
      if (filters.difficulty) params.set('difficulty', filters.difficulty)
      if (filters.priceMin) params.set('price_min', filters.priceMin.toString())
      if (filters.priceMax) params.set('price_max', filters.priceMax.toString())
      if (filters.durationMin) params.set('duration_min', filters.durationMin.toString())
      if (filters.durationMax) params.set('duration_max', filters.durationMax.toString())
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (pagination.sort) params.set('sort', pagination.sort)

      // Update URL
      window.history.replaceState({}, '', `/tours?${params.toString()}`)

      try {
        const response = await fetch(`/api/tours?${params.toString()}`)
        
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`)
        }
        
        const data: PaginatedResponse<TourCardDTO> = await response.json()
        
        if (onFiltersChange) {
          onFiltersChange(filters, pagination)
        }

        // Update tours grid (you might want to emit an event or use a state management solution)
        const event = new CustomEvent('tours-updated', { detail: data })
        window.dispatchEvent(event)
        
        // Clear any previous errors
        setError(null)
      } catch (error) {
        console.error('Failed to fetch tours:', error)
        setError('Failed to load tours. Please try again.')
      } finally {
        setLoading(false)
      }
    }, 500),
    [onFiltersChange]
  )

  useEffect(() => {
    fetchTours(filters, pagination)
  }, [filters, pagination])

  const handleFilterChange = (key: keyof TourFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 })) // Reset to page 1 on filter change
  }

  const handleSortChange = (sort: PaginationParams['sort']) => {
    setPagination(prev => ({ ...prev, sort, page: 1 }))
  }

  const clearFilters = () => {
    setFilters({})
    setPagination({ page: 1, limit: 12, sort: 'newest' })
  }

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4 mb-8">
      {/* Mobile Toggle - Enhanced */}
      <button
        className="md:hidden w-full flex items-center justify-between min-h-[48px] p-2 text-left rounded-lg hover:bg-gray-50 transition-colors touch-manipulation"
        onClick={() => setIsOpen(!isOpen)}
        aria-expanded={isOpen}
        aria-controls="filter-content"
      >
        <div className="flex items-center gap-3">
          <svg 
            className="w-5 h-5 text-gray-600" 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
          </svg>
          <span className="font-semibold text-gray-900">Filter Tours</span>
          {Object.keys(filters).length > 0 && (
            <span className="bg-accent text-white text-xs px-2 py-1 rounded-full">
              {Object.keys(filters).length}
            </span>
          )}
        </div>
        <svg 
          className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`} 
          fill="none" 
          stroke="currentColor" 
          viewBox="0 0 24 24"
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Controls */}
      <div 
        id="filter-content"
        className={`${isOpen ? 'block animate-slide-down' : 'hidden'} md:block space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 pt-4 md:pt-0`}
      >
        {/* Difficulty */}
        <div className="space-y-2 md:space-y-0">
          <label className="block md:hidden text-sm font-medium text-gray-700">Difficulty Level</label>
          <select
            value={filters.difficulty || ''}
            onChange={(e) => handleFilterChange('difficulty', e.target.value || undefined)}
            className="w-full md:w-auto min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
            aria-label="Filter by difficulty level"
          >
            <option value="">All Difficulties</option>
            <option value="easy">Easy</option>
            <option value="moderate">Moderate</option>
            <option value="challenging">Challenging</option>
            <option value="difficult">Difficult</option>
          </select>
        </div>

        {/* Duration */}
        <div className="space-y-2 md:space-y-0">
          <label className="block md:hidden text-sm font-medium text-gray-700">Duration (Days)</label>
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              max="30"
              placeholder="Min days"
              value={filters.durationMin || ''}
              onChange={(e) => handleFilterChange('durationMin', e.target.value ? Number(e.target.value) : undefined)}
              className="w-20 md:w-24 min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              aria-label="Minimum duration in days"
            />
            <span className="text-gray-400 font-medium">to</span>
            <input
              type="number"
              min="1"
              max="30"
              placeholder="Max days"
              value={filters.durationMax || ''}
              onChange={(e) => handleFilterChange('durationMax', e.target.value ? Number(e.target.value) : undefined)}
              className="w-20 md:w-24 min-h-[44px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 transition-colors"
              aria-label="Maximum duration in days"
            />
          </div>
        </div>

        {/* Price Range */}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="0"
            step="50"
            placeholder="Min €"
            value={filters.priceMin || ''}
            onChange={(e) => handleFilterChange('priceMin', e.target.value ? Number(e.target.value) : undefined)}
            className="w-24 px-3 py-2 border rounded-lg"
          />
          <span>-</span>
          <input
            type="number"
            min="0"
            step="50"
            placeholder="Max €"
            value={filters.priceMax || ''}
            onChange={(e) => handleFilterChange('priceMax', e.target.value ? Number(e.target.value) : undefined)}
            className="w-24 px-3 py-2 border rounded-lg"
          />
        </div>

        {/* Sort */}
        <select
          value={pagination.sort || 'newest'}
          onChange={(e) => handleSortChange(e.target.value as any)}
          className="w-full md:w-auto px-3 py-2 border rounded-lg"
        >
          <option value="newest">Newest</option>
          <option value="popular">Most Popular</option>
          <option value="price">Price: Low to High</option>
          <option value="duration">Duration: Short to Long</option>
        </select>

        {/* Clear Button */}
        <button
          onClick={clearFilters}
          className="px-4 py-2 text-sm text-gray-600 hover:text-gray-900"
        >
          Clear All
        </button>

        {loading && (
          <div className="flex items-center">
            <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          </div>
        )}
      </div>
      
      {/* Error Display */}
      {error && (
        <div className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm">
          {error}
        </div>
      )}
    </div>
  )
}