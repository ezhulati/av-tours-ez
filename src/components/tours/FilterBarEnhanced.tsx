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

// Enhanced Country/Region filter with regional groupings
const CountryRegionFilter = memo(({ value, onChange }: { 
  value: string | undefined, 
  onChange: (value: string | undefined) => void 
}) => {
  const countryOptions = [
    { value: '', label: 'All Countries & Regions' },
    { 
      group: 'Albania Focus',
      options: [
        { value: 'Albania', label: 'Albania Only' },
        { value: 'albania-day-tours', label: 'Albania Day Tours' },
        { value: 'albania-packages', label: 'Albania Packages' }
      ]
    },
    { 
      group: 'Multi-Country Tours',
      options: [
        { value: 'balkans', label: 'Balkan Countries' },
        { value: 'Montenegro', label: 'Montenegro' },
        { value: 'Kosovo', label: 'Kosovo' },
        { value: 'North Macedonia', label: 'North Macedonia' },
        { value: 'Greece', label: 'Greece' },
        { value: 'Croatia', label: 'Croatia' },
        { value: 'Bosnia', label: 'Bosnia & Herzegovina' },
        { value: 'Serbia', label: 'Serbia' },
        { value: 'Bulgaria', label: 'Bulgaria' }
      ]
    }
  ]

  return (
    <div className="flex-1 md:flex-initial" role="group" aria-labelledby="country-region-filter-label">
      <label id="country-region-filter-label" className="sr-only">Filter by country or region</label>
      <select
        value={value || ''}
        onChange={(e) => onChange(e.target.value || undefined)}
        className="w-full md:w-auto min-h-[48px] px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer"
        aria-label="Filter by country or region"
      >
        {countryOptions.map((item, index) => 
          'group' in item ? (
            <optgroup key={index} label={item.group}>
              {item.options.map(option => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </optgroup>
          ) : (
            <option key={item.value} value={item.value}>
              {item.label}
            </option>
          )
        )}
      </select>
    </div>
  )
})
CountryRegionFilter.displayName = 'CountryRegionFilter'

// Enhanced Duration filter with quick preset buttons
const DurationFilterEnhanced = memo(({ min, max, onChange }: { 
  min: number | undefined,
  max: number | undefined,
  onChange: (type: 'min' | 'max', value: number | undefined) => void 
}) => {
  const presets = [
    { label: '1 Day', min: 1, max: 1 },
    { label: '2-3 Days', min: 2, max: 3 },
    { label: '4-5 Days', min: 4, max: 5 },
    { label: '6-7 Days', min: 6, max: 7 },
    { label: '1+ Week', min: 8, max: undefined }
  ]

  const handlePresetClick = (preset: typeof presets[0]) => {
    onChange('min', preset.min)
    onChange('max', preset.max)
  }

  const currentPreset = presets.find(p => p.min === min && p.max === max)

  return (
    <div className="flex-1 md:flex-initial" role="group" aria-labelledby="duration-filter-enhanced-label">
      <label id="duration-filter-enhanced-label" className="sr-only">Filter by duration in days</label>
      
      {/* Mobile: Preset buttons */}
      <div className="md:hidden space-y-2">
        <div className="flex flex-wrap gap-1">
          {presets.map((preset) => (
            <button
              key={preset.label}
              onClick={() => handlePresetClick(preset)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                currentPreset?.label === preset.label
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {preset.label}
            </button>
          ))}
          <button
            onClick={() => {
              onChange('min', undefined)
              onChange('max', undefined)
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              !min && !max
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Any
          </button>
        </div>
        {/* Custom range inputs for mobile */}
        <div className="flex gap-2 items-center">
          <input
            type="number"
            min="1"
            max="30"
            placeholder="Min"
            value={min || ''}
            onChange={(e) => onChange('min', e.target.value ? Number(e.target.value) : undefined)}
            className="flex-1 min-h-[40px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
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
            className="flex-1 min-h-[40px] px-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
            aria-label="Maximum duration in days"
            inputMode="numeric"
          />
          <span className="text-sm text-gray-600">days</span>
        </div>
      </div>

      {/* Desktop: Compact input with dropdown presets */}
      <div className="hidden md:block">
        <div className="relative">
          <div className="flex gap-2 items-center">
            <input
              type="number"
              min="1"
              max="30"
              placeholder="Min"
              value={min || ''}
              onChange={(e) => onChange('min', e.target.value ? Number(e.target.value) : undefined)}
              className="w-20 min-h-[48px] px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
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
              className="w-20 min-h-[48px] px-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
              aria-label="Maximum duration in days"
              inputMode="numeric"
            />
            <span className="text-sm text-gray-600 ml-1">days</span>
          </div>
          
          {/* Quick preset buttons for desktop */}
          <div className="absolute top-full left-0 mt-2 hidden group-hover:block bg-white border border-gray-200 rounded-lg shadow-lg p-2 z-10">
            <div className="text-xs text-gray-600 mb-1">Quick select:</div>
            <div className="flex flex-wrap gap-1">
              {presets.map((preset) => (
                <button
                  key={preset.label}
                  onClick={() => handlePresetClick(preset)}
                  className="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 rounded transition-colors"
                >
                  {preset.label}
                </button>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
})
DurationFilterEnhanced.displayName = 'DurationFilterEnhanced'

// Enhanced Difficulty filter with visual difficulty indicators
const DifficultyFilterEnhanced = memo(({ value, onChange }: { 
  value: string | undefined, 
  onChange: (value: string | undefined) => void 
}) => {
  const difficulties = [
    { value: 'easy', label: 'Easy', icon: '●', color: 'text-green-500' },
    { value: 'moderate', label: 'Moderate', icon: '●●', color: 'text-yellow-500' },
    { value: 'challenging', label: 'Challenging', icon: '●●●', color: 'text-orange-500' },
    { value: 'difficult', label: 'Difficult', icon: '●●●●', color: 'text-red-500' }
  ]

  return (
    <div className="flex-1 md:flex-initial" role="group" aria-labelledby="difficulty-enhanced-filter-label">
      <label id="difficulty-enhanced-filter-label" className="sr-only">Filter by difficulty level</label>
      
      {/* Mobile: Button grid */}
      <div className="md:hidden space-y-2">
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onChange(undefined)}
            className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all ${
              !value 
                ? 'border-accent bg-accent text-white' 
                : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
            }`}
          >
            All Levels
          </button>
          {difficulties.map((diff) => (
            <button
              key={diff.value}
              onClick={() => onChange(diff.value)}
              className={`px-3 py-2 text-sm font-medium rounded-lg border transition-all flex items-center gap-2 ${
                value === diff.value 
                  ? 'border-accent bg-accent text-white' 
                  : 'border-gray-200 bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className={value === diff.value ? 'text-white' : diff.color}>
                {diff.icon}
              </span>
              {diff.label}
            </button>
          ))}
        </div>
      </div>

      {/* Desktop: Dropdown */}
      <div className="hidden md:block">
        <select
          value={value || ''}
          onChange={(e) => onChange(e.target.value || undefined)}
          className="w-full md:w-auto min-h-[48px] px-4 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all cursor-pointer"
          aria-label="Filter by difficulty level"
        >
          <option value="">All Difficulties</option>
          {difficulties.map((diff) => (
            <option key={diff.value} value={diff.value}>
              {diff.icon} {diff.label}
            </option>
          ))}
        </select>
      </div>
    </div>
  )
})
DifficultyFilterEnhanced.displayName = 'DifficultyFilterEnhanced'

// Enhanced Price filter with currency and preset ranges
const PriceFilterEnhanced = memo(({ min, max, onChange }: { 
  min: number | undefined,
  max: number | undefined,
  onChange: (type: 'min' | 'max', value: number | undefined) => void 
}) => {
  const priceRanges = [
    { label: '< €50', min: undefined, max: 50 },
    { label: '€50-100', min: 50, max: 100 },
    { label: '€100-200', min: 100, max: 200 },
    { label: '€200-500', min: 200, max: 500 },
    { label: '€500+', min: 500, max: undefined }
  ]

  const handlePresetClick = (preset: typeof priceRanges[0]) => {
    onChange('min', preset.min)
    onChange('max', preset.max)
  }

  const currentRange = priceRanges.find(r => r.min === min && r.max === max)

  return (
    <div className="flex-1 md:flex-initial" role="group" aria-labelledby="price-enhanced-filter-label">
      <label id="price-enhanced-filter-label" className="sr-only">Filter by price range in euros</label>
      
      {/* Mobile: Preset buttons */}
      <div className="md:hidden space-y-2">
        <div className="flex flex-wrap gap-1">
          {priceRanges.map((range) => (
            <button
              key={range.label}
              onClick={() => handlePresetClick(range)}
              className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
                currentRange?.label === range.label
                  ? 'bg-accent text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {range.label}
            </button>
          ))}
          <button
            onClick={() => {
              onChange('min', undefined)
              onChange('max', undefined)
            }}
            className={`px-3 py-1.5 text-xs font-medium rounded-full transition-all ${
              !min && !max
                ? 'bg-accent text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            Any Price
          </button>
        </div>
        {/* Custom range inputs */}
        <div className="flex gap-2 items-center">
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€</span>
            <input
              type="number"
              min="0"
              step="25"
              placeholder="Min"
              value={min || ''}
              onChange={(e) => onChange('min', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full min-h-[40px] pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
              aria-label="Minimum price in euros"
              inputMode="numeric"
            />
          </div>
          <span className="text-gray-400 font-medium" aria-hidden="true">–</span>
          <div className="relative flex-1">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€</span>
            <input
              type="number"
              min="0"
              step="25"
              placeholder="Max"
              value={max || ''}
              onChange={(e) => onChange('max', e.target.value ? Number(e.target.value) : undefined)}
              className="w-full min-h-[40px] pl-8 pr-3 py-2 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
              aria-label="Maximum price in euros"
              inputMode="numeric"
            />
          </div>
        </div>
      </div>

      {/* Desktop: Compact inputs */}
      <div className="hidden md:block">
        <div className="flex gap-2 items-center">
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€</span>
            <input
              type="number"
              min="0"
              step="50"
              placeholder="Min"
              value={min || ''}
              onChange={(e) => onChange('min', e.target.value ? Number(e.target.value) : undefined)}
              className="w-24 min-h-[48px] pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
              aria-label="Minimum price in euros"
              inputMode="numeric"
            />
          </div>
          <span className="text-gray-400 font-medium" aria-hidden="true">–</span>
          <div className="relative">
            <span className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-500 text-sm">€</span>
            <input
              type="number"
              min="0"
              step="50"
              placeholder="Max"
              value={max || ''}
              onChange={(e) => onChange('max', e.target.value ? Number(e.target.value) : undefined)}
              className="w-24 min-h-[48px] pl-8 pr-3 py-2.5 border border-gray-300 rounded-lg bg-white text-gray-900 hover:border-gray-400 focus:border-accent focus:ring-2 focus:ring-accent/20 focus:outline-none transition-all"
              aria-label="Maximum price in euros"
              inputMode="numeric"
            />
          </div>
        </div>
      </div>
    </div>
  )
})
PriceFilterEnhanced.displayName = 'PriceFilterEnhanced'

// Re-use other components from the original filter
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
    >
      <option value="any">Any Group Size</option>
      <option value="small">Small Group (≤15)</option>
      <option value="large">Large Group (16+)</option>
    </select>
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
    >
      <option value="newest">Newest First</option>
      <option value="popular">Most Popular</option>
      <option value="price">Price: Low to High</option>
      <option value="duration">Duration: Short to Long</option>
    </select>
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

// Main Enhanced Filter Component
function FilterBarEnhanced({ 
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

  // Enhanced fetch function that handles regional filters
  const fetchTours = useCallback(async (filters: TourFilters, pagination: PaginationParams) => {
    setLoading(true)
    setError(null)
    
    const abortController = new AbortController()
    
    try {
      const params = new URLSearchParams()
      
      // Handle regional filters
      if (filters.country) {
        if (filters.country === 'balkans') {
          // For Balkan tours, redirect to the dedicated landing page
          window.location.href = '/tours/balkans'
          return
        } else if (filters.country === 'albania-day-tours') {
          window.location.href = '/tours/albania-day-tours'
          return
        } else if (filters.country === 'albania-packages') {
          window.location.href = '/tours/albania-packages'
          return
        } else {
          params.set('country', filters.country)
        }
      }
      
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
      return
    }
    debouncedFetch(filters, pagination)
  }, [filters, pagination])

  // Filter handlers
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
    
    const announcer = document.getElementById('filter-announcer')
    if (announcer) announcer.textContent = 'All filters cleared'
  }, [])

  const toggleFilters = useCallback(() => {
    const newState = !isOpen
    setIsOpen(newState)
    
    if (newState) {
      lastFocusedElement.current = document.activeElement as HTMLElement
      setTimeout(() => {
        const firstInput = filterContainerRef.current?.querySelector('select, input') as HTMLElement
        firstInput?.focus()
      }, 100)
    } else if (lastFocusedElement.current) {
      lastFocusedElement.current.focus()
    }
  }, [isOpen])

  return (
    <div 
      className="relative bg-white rounded-xl shadow-sm border border-gray-200 p-6 mb-8"
      role="region"
      aria-label="Enhanced tour filters"
    >
      <LoadingOverlay isLoading={loading} />
      
      {/* Screen reader announcements */}
      <div id="filter-announcer" className="sr-only" aria-live="polite" aria-atomic="true"></div>
      
      {/* Mobile Toggle */}
      <button
        className="md:hidden w-full flex items-center justify-between min-h-[56px] pl-4 pr-6 py-3 text-left rounded-lg hover:bg-gray-50 active:bg-gray-100 transition-colors touch-manipulation focus:outline-none focus:ring-2 focus:ring-accent/20"
        onClick={toggleFilters}
        aria-expanded={isOpen}
        aria-controls="filter-content-enhanced"
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
            <span className="bg-accent text-white text-xs font-bold px-2.5 py-1 rounded-full ml-2">
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

      {/* Enhanced Filter Controls */}
      <div 
        ref={filterContainerRef}
        id="filter-content-enhanced"
        className={`${isOpen ? 'block animate-slide-down mt-6' : 'hidden'} md:block md:mt-0 space-y-4 md:space-y-0 md:flex md:items-start md:gap-4 md:flex-wrap`}
        role="group"
        aria-label="Enhanced filter options"
      >
        <CountryRegionFilter 
          value={filters.country} 
          onChange={(value) => handleFilterChange('country', value)} 
        />
        
        <DifficultyFilterEnhanced 
          value={filters.difficulty} 
          onChange={(value) => handleFilterChange('difficulty', value)} 
        />
        
        <DurationFilterEnhanced 
          min={filters.durationMin} 
          max={filters.durationMax} 
          onChange={handleDurationChange} 
        />
        
        <PriceFilterEnhanced 
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

        {/* Action Buttons and Results */}
        <div className="flex flex-col md:flex-row gap-2 md:ml-auto items-start md:items-center">
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
              Clear All
            </button>
          )}
        </div>
      </div>
      
      {/* Error Display */}
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
  )
}

export default memo(FilterBarEnhanced)