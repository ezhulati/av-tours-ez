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
        const data: PaginatedResponse<TourCardDTO> = await response.json()
        
        if (onFiltersChange) {
          onFiltersChange(filters, pagination)
        }

        // Update tours grid (you might want to emit an event or use a state management solution)
        const event = new CustomEvent('tours-updated', { detail: data })
        window.dispatchEvent(event)
      } catch (error) {
        console.error('Failed to fetch tours:', error)
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
    <div className="bg-white rounded-lg shadow p-4 mb-6">
      {/* Mobile Toggle */}
      <button
        className="md:hidden w-full flex items-center justify-between p-2 text-left"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold">Filters</span>
        <svg className={`w-5 h-5 transform transition ${isOpen ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {/* Filter Controls */}
      <div className={`${isOpen ? 'block' : 'hidden'} md:block space-y-4 md:space-y-0 md:flex md:items-center md:gap-4`}>
        {/* Difficulty */}
        <select
          value={filters.difficulty || ''}
          onChange={(e) => handleFilterChange('difficulty', e.target.value || undefined)}
          className="w-full md:w-auto px-3 py-2 border rounded-lg"
        >
          <option value="">All Difficulties</option>
          <option value="easy">Easy</option>
          <option value="moderate">Moderate</option>
          <option value="challenging">Challenging</option>
          <option value="difficult">Difficult</option>
        </select>

        {/* Duration */}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="1"
            max="30"
            placeholder="Min days"
            value={filters.durationMin || ''}
            onChange={(e) => handleFilterChange('durationMin', e.target.value ? Number(e.target.value) : undefined)}
            className="w-24 px-3 py-2 border rounded-lg"
          />
          <span>-</span>
          <input
            type="number"
            min="1"
            max="30"
            placeholder="Max days"
            value={filters.durationMax || ''}
            onChange={(e) => handleFilterChange('durationMax', e.target.value ? Number(e.target.value) : undefined)}
            className="w-24 px-3 py-2 border rounded-lg"
          />
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
    </div>
  )
}