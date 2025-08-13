import React, { useState, useEffect, useCallback, useRef, useMemo, memo } from 'react'
import type { TourFilters, PaginationParams, PaginatedResponse, TourCardDTO } from '@/lib/dto'

// Performance-optimized debounce with cleanup
function useDebounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  const timeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  useEffect(() => {
    return () => {
      if (timeoutRef.current) clearTimeout(timeoutRef.current)
    }
  }, [])
  
  return useCallback((...args: Parameters<T>) => {
    if (timeoutRef.current) clearTimeout(timeoutRef.current)
    timeoutRef.current = setTimeout(() => func(...args), wait)
  }, [func, wait])
}

interface FilterBarProps {
  onFiltersChange?: (filters: TourFilters, pagination: PaginationParams) => void
  initialFilters?: TourFilters
  initialPagination?: PaginationParams
}

// Filter skeleton component for loading states
const FilterSkeleton = memo(() => (
  <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8 animate-pulse">
    <div className="flex flex-col md:flex-row md:items-center gap-4">
      <div className="h-12 bg-gray-200 rounded-lg w-40" />
      <div className="h-12 bg-gray-200 rounded-lg w-40" />
      <div className="h-12 bg-gray-200 rounded-lg w-32" />
      <div className="h-12 bg-gray-200 rounded-lg w-32" />
      <div className="h-12 bg-gray-200 rounded-lg w-40 md:ml-auto" />
    </div>
  </div>
))
FilterSkeleton.displayName = 'FilterSkeleton'

// Individual filter components with memo for performance
const CountryFilter = memo(({ value, onChange }: { 
  value: string | undefined, 
  onChange: (value: string | undefined) => void 
}) => (
  <div className="flex-1 md:flex-initial" role="group" aria-labelledby="country-filter-label">
    <label id="country-filter-label" className="sr-only">Filter by country</label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="w-full md:w-auto min-h-[48px] px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer"
      aria-label="Filter by country"
      aria-describedby="country-filter-desc"
    >
      <option value="">All Countries</option>
      <option value="Albania">Albania</option>
      <option value="Kosovo">Kosovo</option>
      <option value="Montenegro">Montenegro</option>
      <option value="North Macedonia">North Macedonia</option>
    </select>
    <span id="country-filter-desc" className="sr-only">Filter tours by country</span>
  </div>
))
CountryFilter.displayName = 'CountryFilter'

const DifficultyFilter = memo(({ value, onChange }: { 
  value: string | undefined, 
  onChange: (value: string | undefined) => void 
}) => (
  <div className="flex-1 md:flex-initial" role="group" aria-labelledby="difficulty-filter-label">
    <label id="difficulty-filter-label" className="sr-only">Filter by difficulty level</label>
    <select
      value={value || ''}
      onChange={(e) => onChange(e.target.value || undefined)}
      className="w-full md:w-auto min-h-[48px] px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer"
      aria-label="Filter by difficulty level"
      aria-describedby="difficulty-filter-desc"
    >
      <option value="">All Difficulties</option>
      <option value="easy">Easy</option>
      <option value="moderate">Moderate</option>
      <option value="challenging">Challenging</option>
      <option value="difficult">Difficult</option>
    </select>
    <span id="difficulty-filter-desc" className="sr-only">Filter tours by difficulty level</span>
  </div>
))
DifficultyFilter.displayName = 'DifficultyFilter'

const DurationFilter = memo(({ min, max, onChange }: { 
  min: number | undefined,
  max: number | undefined,
  onChange: (type: 'min' | 'max', value: number | undefined) => void 
}) => (
  <div className="flex-1 md:flex-initial" role="group" aria-labelledby="duration-filter-label">
    <label id="duration-filter-label" className="sr-only">Filter by duration in days</label>
    <div className="flex gap-2 items-center">
      <input
        type="number"
        min="1"
        max="30"
        placeholder="Min"
        value={min || ''}
        onChange={(e) => onChange('min', e.target.value ? Number(e.target.value) : undefined)}
        className="w-full md:w-20 min-h-[48px] px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
        aria-label="Minimum duration in days"
        inputMode="numeric"
      />
      <span className="text-gray-400 font-medium px-1" aria-hidden="true">–</span>
      <input
        type="number"
        min="1"
        max="30"
        placeholder="Max"
        value={max || ''}
        onChange={(e) => onChange('max', e.target.value ? Number(e.target.value) : undefined)}
        className="w-full md:w-20 min-h-[48px] px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
        aria-label="Maximum duration in days"
        inputMode="numeric"
      />
      <span className="hidden md:inline text-sm text-gray-600 ml-1">days</span>
    </div>
  </div>
))
DurationFilter.displayName = 'DurationFilter'

const PriceFilter = memo(({ min, max, onChange }: { 
  min: number | undefined,
  max: number | undefined,
  onChange: (type: 'min' | 'max', value: number | undefined) => void 
}) => (
  <div className="flex-1 md:flex-initial" role="group" aria-labelledby="price-filter-label">
    <label id="price-filter-label" className="sr-only">Filter by price range in euros</label>
    <div className="flex gap-2 items-center">
      <input
        type="number"
        min="0"
        step="50"
        placeholder="Min"
        value={min || ''}
        onChange={(e) => onChange('min', e.target.value ? Number(e.target.value) : undefined)}
        className="w-full md:w-20 min-h-[48px] px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
        aria-label="Minimum price in euros"
        inputMode="numeric"
      />
      <span className="text-gray-400 font-medium" aria-hidden="true">–</span>
      <input
        type="number"
        min="0"
        step="50"
        placeholder="Max"
        value={max || ''}
        onChange={(e) => onChange('max', e.target.value ? Number(e.target.value) : undefined)}
        className="w-full md:w-20 min-h-[48px] px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
        aria-label="Maximum price in euros"
        inputMode="numeric"
      />
      <span className="hidden md:inline text-sm text-gray-600" aria-label="euros">€</span>
    </div>
  </div>
))
PriceFilter.displayName = 'PriceFilter'

const GroupSizeFilter = memo(({ value, onChange }: { 
  value: string | undefined,
  onChange: (value: string | undefined) => void 
}) => (
  <div className="flex-1 md:flex-initial" role="group" aria-labelledby="group-filter-label">
    <label id="group-filter-label" className="sr-only">Filter by group size</label>
    <select
      value={value || 'any'}
      onChange={(e) => onChange(e.target.value === 'any' ? undefined : e.target.value)}
      className="w-full md:w-auto min-h-[48px] px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer"
      aria-label="Filter by group size"
      aria-describedby="group-filter-desc"
    >
      <option value="any">Any Group Size</option>
      <option value="small">Small Group</option>
      <option value="large">Large Group</option>
    </select>
    <span id="group-filter-desc" className="sr-only">Filter tours by group size</span>
  </div>
))
GroupSizeFilter.displayName = 'GroupSizeFilter'

const SortFilter = memo(({ value, onChange }: { 
  value: string | undefined,
  onChange: (value: string) => void 
}) => (
  <div className="flex-1 md:flex-initial" role="group" aria-labelledby="sort-filter-label">
    <label id="sort-filter-label" className="sr-only">Sort tours by</label>
    <select
      value={value || 'newest'}
      onChange={(e) => onChange(e.target.value)}
      className="w-full md:w-auto min-h-[48px] px-4 py-2.5 pr-10 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer"
      aria-label="Sort tours"
      aria-describedby="sort-filter-desc"
    >
      <option value="newest">Newest First</option>
      <option value="popular">Most Popular</option>
      <option value="price">Price: Low to High</option>
      <option value="duration">Duration: Short to Long</option>
    </select>
    <span id="sort-filter-desc" className="sr-only">Sort tour results</span>
  </div>
))
SortFilter.displayName = 'SortFilter'

// Loading overlay component
const LoadingOverlay = memo(({ isLoading }: { isLoading: boolean }) => {
  if (!isLoading) return null
  
  return (
    <div className="absolute inset-0 bg-white/50 backdrop-blur-sm flex items-center justify-center z-10 rounded-xl" 
         role="status" 
         aria-live="polite"
         aria-label="Loading tours">
      <div className="flex items-center gap-3 bg-white px-4 py-3 rounded-lg shadow-lg">
        <svg className="animate-spin h-5 w-5 text-accent" fill="none" viewBox="0 0 24 24" aria-hidden="true">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
        </svg>
        <span className="text-sm font-medium text-gray-700">Updating tours...</span>
      </div>
    </div>
  )
})
LoadingOverlay.displayName = 'LoadingOverlay'

// Error boundary component
class FilterErrorBoundary extends React.Component<
  { children: React.ReactNode },
  { hasError: boolean, error: Error | null }
> {
  constructor(props: { children: React.ReactNode }) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error: Error) {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('Filter component error:', error, errorInfo)
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 mb-8" role="alert">
          <h3 className="text-red-800 font-semibold mb-2">Filter Error</h3>
          <p className="text-red-700 text-sm">
            There was an error loading the filters. Please refresh the page to try again.
          </p>
        </div>
      )
    }

    return this.props.children
  }
}

function FilterBarOptimized({ 
  onFiltersChange, 
  initialFilters = {},
  initialPagination = { page: 1, limit: 12 }
}: FilterBarProps) {
  const [filters, setFilters] = useState<TourFilters>(initialFilters)
  const [pagination, setPagination] = useState<PaginationParams>(initialPagination)
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [totalResults, setTotalResults] = useState<number>(0)
  const [isInitialMount, setIsInitialMount] = useState(true)
  
  // Track focus for accessibility
  const filterContainerRef = useRef<HTMLDivElement>(null)
  const lastFocusedElement = useRef<HTMLElement | null>(null)

  // Memoize active filter count
  const activeFilterCount = useMemo(() => {
    return Object.entries(filters).filter(([key, value]) => {
      if (key === 'groupSize') return value && value !== 'any'
      return value !== undefined && value !== null && value !== ''
    }).length
  }, [filters])

  const hasActiveFilters = activeFilterCount > 0

  // Optimized fetch function with proper error handling
  const fetchTours = useCallback(async (filters: TourFilters, pagination: PaginationParams) => {
    console.log('FilterBar: Fetching tours with filters:', filters, 'pagination:', pagination)
    setLoading(true)
    setError(null)
    
    const abortController = new AbortController()
    
    try {
      const params = new URLSearchParams()
      if (filters.country) params.set('country', filters.country)
      if (filters.category) params.set('category', filters.category)
      if (filters.difficulty) params.set('difficulty', filters.difficulty)
      if (filters.priceMin !== undefined) params.set('price_min', filters.priceMin.toString())
      if (filters.priceMax !== undefined) params.set('price_max', filters.priceMax.toString())
      if (filters.durationMin !== undefined) params.set('duration_min', filters.durationMin.toString())
      if (filters.durationMax !== undefined) params.set('duration_max', filters.durationMax.toString())
      if (filters.groupSize && filters.groupSize !== 'any') params.set('group_size', filters.groupSize)
      params.set('page', pagination.page.toString())
      params.set('limit', pagination.limit.toString())
      if (pagination.sort) params.set('sort', pagination.sort)

      // Update URL without triggering navigation
      window.history.replaceState({}, '', `/tours?${params.toString()}`)

      const response = await fetch(`/api/tours?${params.toString()}`, {
        signal: abortController.signal
      })
      
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }
      
      const data: PaginatedResponse<TourCardDTO> = await response.json()
      
      if (!data.items || !data.pagination) {
        throw new Error('Invalid response structure from API')
      }
      
      setTotalResults(data.pagination.total)
      
      if (onFiltersChange) {
        onFiltersChange(filters, pagination)
      }

      // Dispatch event for tour grid update
      const event = new CustomEvent('tours-updated', { 
        detail: {
          ...data,
          filters,
          isFilterUpdate: true
        } 
      })
      window.dispatchEvent(event)
      
      // Announce results to screen readers
      const announcement = `Found ${data.pagination.total} ${data.pagination.total === 1 ? 'tour' : 'tours'}`
      const announcer = document.getElementById('filter-announcer')
      if (announcer) announcer.textContent = announcement
      
      setError(null)
    } catch (err: any) {
      if (err.name === 'AbortError') return
      
      console.error('Failed to fetch tours:', err)
      setError('Failed to load tours. Please try again.')
      
      const event = new CustomEvent('tours-updated', { 
        detail: {
          items: [],
          pagination: {
            page: 1,
            limit: 12,
            total: 0,
            totalPages: 0
          },
          filters,
          isFilterUpdate: true,
          error: true
        } 
      })
      window.dispatchEvent(event)
    } finally {
      setLoading(false)
    }
    
    return () => abortController.abort()
  }, [onFiltersChange])

  // Debounced fetch with 500ms delay for better UX
  const debouncedFetch = useDebounce(fetchTours, 500)

  useEffect(() => {
    if (isInitialMount) {
      setIsInitialMount(false)
      // Don't fetch on initial mount - tours are already server-rendered
      return
    }
    debouncedFetch(filters, pagination)
  }, [filters, pagination])

  // Memoized handlers to prevent re-renders
  const handleFilterChange = useCallback((key: keyof TourFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }))
    setPagination(prev => ({ ...prev, page: 1 }))
  }, [])

  const handleDurationChange = useCallback((type: 'min' | 'max', value: number | undefined) => {
    const key = type === 'min' ? 'durationMin' : 'durationMax'
    handleFilterChange(key, value)
  }, [handleFilterChange])

  const handlePriceChange = useCallback((type: 'min' | 'max', value: number | undefined) => {
    const key = type === 'min' ? 'priceMin' : 'priceMax'
    handleFilterChange(key, value)
  }, [handleFilterChange])

  const handleSortChange = useCallback((sort: string) => {
    setPagination(prev => ({ ...prev, sort: sort as PaginationParams['sort'], page: 1 }))
  }, [])

  const clearFilters = useCallback(() => {
    setFilters({})
    setPagination({ page: 1, limit: 12, sort: 'newest' })
    setTotalResults(0)
    
    // Announce to screen readers
    const announcer = document.getElementById('filter-announcer')
    if (announcer) announcer.textContent = 'All filters cleared'
  }, [])

  // Keyboard navigation for filter panel
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    if (e.key === 'Escape' && isOpen) {
      setIsOpen(false)
      if (lastFocusedElement.current) {
        lastFocusedElement.current.focus()
      }
    }
  }, [isOpen])

  const toggleFilters = useCallback(() => {
    const newState = !isOpen
    setIsOpen(newState)
    
    if (newState) {
      lastFocusedElement.current = document.activeElement as HTMLElement
      // Focus first filter on open
      setTimeout(() => {
        const firstInput = filterContainerRef.current?.querySelector('select, input') as HTMLElement
        firstInput?.focus()
      }, 100)
    } else if (lastFocusedElement.current) {
      lastFocusedElement.current.focus()
    }
  }, [isOpen])

  return (
    <FilterErrorBoundary>
      <div 
        className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
        onKeyDown={handleKeyDown}
        role="region"
        aria-label="Tour filters"
      >
        <LoadingOverlay isLoading={loading} />
        
        {/* Screen reader announcements */}
        <div id="filter-announcer" className="sr-only" aria-live="polite" aria-atomic="true"></div>
        
        {/* Mobile Toggle - Enhanced with ARIA */}
        <button
          data-testid="filter-toggle"
          className="md:hidden w-full flex items-center justify-between min-h-[56px] pl-4 pr-6 py-3 text-left rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-accent/20"
          onClick={toggleFilters}
          aria-expanded={isOpen}
          aria-controls="filter-content"
          aria-label={`${isOpen ? 'Hide' : 'Show'} tour filters${hasActiveFilters ? `, ${activeFilterCount} active` : ''}`}
        >
          <div className="flex items-center gap-3">
            <svg 
              className="w-5 h-5 text-gray-600" 
              fill="none" 
              stroke="currentColor" 
              viewBox="0 0 24 24"
              aria-hidden="true"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
            </svg>
            <span className="font-semibold text-gray-900">Filter Tours</span>
            {hasActiveFilters && (
              <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full ml-2" aria-label={`${activeFilterCount} filters active`}>
                {activeFilterCount} active
              </span>
            )}
          </div>
          <svg 
            className={`w-5 h-5 text-gray-400 transform transition-transform duration-200 mr-2 ${isOpen ? 'rotate-180' : ''}`} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {/* Filter Controls with improved accessibility */}
        <div 
          ref={filterContainerRef}
          id="filter-content"
          data-testid="filter-panel"
          className={`${isOpen ? 'block animate-slide-down mt-6' : 'hidden'} md:block md:mt-0 space-y-4 md:space-y-0 md:flex md:items-center md:gap-4 md:flex-wrap`}
          role="group"
          aria-label="Filter options"
        >
          <CountryFilter 
            value={filters.country} 
            onChange={(value) => handleFilterChange('country', value)} 
          />
          
          <DifficultyFilter 
            value={filters.difficulty} 
            onChange={(value) => handleFilterChange('difficulty', value)} 
          />
          
          <DurationFilter 
            min={filters.durationMin} 
            max={filters.durationMax} 
            onChange={handleDurationChange} 
          />
          
          <PriceFilter 
            min={filters.priceMin} 
            max={filters.priceMax} 
            onChange={handlePriceChange} 
          />
          
          <GroupSizeFilter 
            value={filters.groupSize} 
            onChange={(value) => handleFilterChange('groupSize', value)} 
          />
          
          <SortFilter 
            value={pagination.sort} 
            onChange={handleSortChange} 
          />

          {/* Action Buttons and Results Count */}
          <div className="flex gap-2 md:ml-auto items-center">
            {totalResults > 0 && hasActiveFilters && (
              <span 
                className="text-sm text-gray-600 font-medium px-3"
                role="status"
                aria-live="polite"
              >
                {totalResults} {totalResults === 1 ? 'tour' : 'tours'} found
              </span>
            )}
            {hasActiveFilters && (
              <button
                onClick={clearFilters}
                className="min-h-[48px] px-5 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-lg transition-all flex items-center gap-2 focus:outline-none focus:ring-2 focus:ring-accent/20"
                aria-label="Clear all filters"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
                Clear Filters
              </button>
            )}
          </div>
        </div>
        
        {/* Error Display with ARIA */}
        {error && (
          <div 
            className="mt-4 p-3 bg-red-50 border border-red-200 text-red-700 rounded-lg text-sm"
            role="alert"
            aria-live="assertive"
          >
            <span className="font-medium">Error: </span>{error}
          </div>
        )}
      </div>
    </FilterErrorBoundary>
  )
}

// Export wrapped with memo for performance
export default memo(FilterBarOptimized)