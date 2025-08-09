/**
 * Optimized Query Functions
 * High-performance database queries with caching and monitoring
 */

import { connectionPool } from './db/connection-pool'
import { cacheClient } from './cache/redis-client'
import { TABLES, mapToTourCard, mapToTourDetail } from './adapters/dbMapper'
import type { TourCardDTO, TourDetailDTO, TourFilters, PaginationParams, PaginatedResponse } from './dto'

// Performance monitoring
class QueryPerformanceMonitor {
  private metrics: Map<string, { count: number; totalTime: number; errors: number }>

  constructor() {
    this.metrics = new Map()
  }

  async track<T>(
    queryName: string,
    fn: () => Promise<T>
  ): Promise<T> {
    const startTime = performance.now()
    
    try {
      const result = await fn()
      const duration = performance.now() - startTime
      
      this.recordSuccess(queryName, duration)
      
      // Log slow queries
      if (duration > 200) {
        console.warn(`Slow query detected: ${queryName} took ${duration.toFixed(2)}ms`)
      }
      
      return result
    } catch (error) {
      this.recordError(queryName)
      throw error
    }
  }

  private recordSuccess(queryName: string, duration: number): void {
    const current = this.metrics.get(queryName) || { count: 0, totalTime: 0, errors: 0 }
    current.count++
    current.totalTime += duration
    this.metrics.set(queryName, current)
  }

  private recordError(queryName: string): void {
    const current = this.metrics.get(queryName) || { count: 0, totalTime: 0, errors: 0 }
    current.errors++
    this.metrics.set(queryName, current)
  }

  getMetrics() {
    const result: Record<string, any> = {}
    
    for (const [name, metrics] of this.metrics.entries()) {
      result[name] = {
        count: metrics.count,
        errors: metrics.errors,
        averageTime: metrics.count > 0 ? metrics.totalTime / metrics.count : 0,
        errorRate: metrics.count > 0 ? metrics.errors / metrics.count : 0
      }
    }
    
    return result
  }
}

const queryMonitor = new QueryPerformanceMonitor()

/**
 * Get all tour slugs (optimized with caching)
 */
export async function getAllSlugsOptimized(): Promise<{ slug: string }[]> {
  return queryMonitor.track('getAllSlugs', async () => {
    // Check cache first
    const cacheKey = 'meta:slugs:all'
    const cached = await cacheClient['inMemoryCache'].get<{ slug: string }[]>(cacheKey)
    
    if (cached.data && !cached.stale) {
      return cached.data
    }

    // If stale, fetch in background
    if (cached.data && cached.stale) {
      // Return stale data immediately
      fetchAndCacheSlugs(cacheKey) // Fire and forget
      return cached.data
    }

    // Fetch from database
    return fetchAndCacheSlugs(cacheKey)
  })
}

async function fetchAndCacheSlugs(cacheKey: string): Promise<{ slug: string }[]> {
  const result = await connectionPool.execute(async (client) => {
    const { data, error } = await client
      .from(TABLES.tours)
      .select('slug')
      .eq('is_active', true)
      .order('created_at', { ascending: false })

    if (error) throw error
    return data || []
  })

  // Cache the result
  await cacheClient['inMemoryCache'].set(cacheKey, result, 300) // 5 minutes
  
  return result
}

/**
 * Get paginated tour cards with advanced caching
 */
export async function getTourCardPageOptimized(
  filters: TourFilters = {},
  pagination: PaginationParams = { page: 1, limit: 12 }
): Promise<PaginatedResponse<TourCardDTO>> {
  return queryMonitor.track('getTourCardPage', async () => {
    // Check cache
    const cached = await cacheClient.getTourList(filters, pagination)
    
    if (cached.data && !cached.stale) {
      return cached.data
    }

    // Return stale data while revalidating
    if (cached.data && cached.stale) {
      fetchAndCacheTourList(filters, pagination) // Fire and forget
      return cached.data
    }

    // Fetch fresh data
    return fetchAndCacheTourList(filters, pagination)
  })
}

async function fetchAndCacheTourList(
  filters: TourFilters,
  pagination: PaginationParams
): Promise<PaginatedResponse<TourCardDTO>> {
  const result = await connectionPool.execute(async (client) => {
    let query = client
      .from(TABLES.tours)
      .select('*', { count: 'exact' })
      .eq('is_active', true)

    // Optimized filter application
    if (filters.country) {
      query = query.contains('locations', [filters.country])
    }
    if (filters.category) {
      query = query.ilike('activity_type', `%${filters.category}%`)
    }
    if (filters.difficulty) {
      query = query.eq('difficulty_level', filters.difficulty)
    }
    if (filters.featured !== undefined) {
      query = query.eq('featured', filters.featured)
    }

    // Optimized sorting with index hints
    switch (pagination.sort) {
      case 'popular':
        query = query.order('view_count', { ascending: false })
        break
      case 'price':
        query = query.order('price_min', { ascending: true })
        break
      case 'newest':
      default:
        query = query.order('created_at', { ascending: false })
    }

    // Apply pagination with optimal range
    const from = (pagination.page - 1) * pagination.limit
    const to = from + pagination.limit - 1
    query = query.range(from, to)

    const { data, error, count } = await query

    if (error) throw error

    const items = (data || []).map(mapToTourCard)

    return {
      items,
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: count || 0,
        totalPages: Math.ceil((count || 0) / pagination.limit)
      }
    }
  })

  // Cache the result
  await cacheClient.setTourList(filters, pagination, result)
  
  return result
}

/**
 * Get tour detail with optimized caching
 */
export async function getTourDetailOptimized(slug: string): Promise<TourDetailDTO | null> {
  return queryMonitor.track('getTourDetail', async () => {
    // Check cache
    const cached = await cacheClient.getTourDetail(slug)
    
    if (cached.data && !cached.stale) {
      // Increment view count asynchronously
      incrementViewCount(slug)
      return cached.data
    }

    // Return stale data while revalidating
    if (cached.data && cached.stale) {
      fetchAndCacheTourDetail(slug) // Fire and forget
      incrementViewCount(slug)
      return cached.data
    }

    // Fetch fresh data
    const result = await fetchAndCacheTourDetail(slug)
    if (result) {
      incrementViewCount(slug)
    }
    return result
  })
}

async function fetchAndCacheTourDetail(slug: string): Promise<TourDetailDTO | null> {
  const result = await connectionPool.execute(async (client) => {
    const { data: tour, error } = await client
      .from(TABLES.tours)
      .select('*')
      .eq('slug', slug)
      .eq('is_active', true)
      .single()

    if (error || !tour) return null

    return mapToTourDetail(tour, [], null)
  })

  if (result) {
    await cacheClient.setTourDetail(slug, result)
  }

  return result
}

async function incrementViewCount(slug: string): Promise<void> {
  try {
    await connectionPool.execute(async (client) => {
      await client.rpc('increment_view_count', { tour_slug: slug })
    })
  } catch (error) {
    // Log but don't throw - view count is not critical
    console.error('Failed to increment view count:', error)
  }
}

/**
 * Optimized search with caching and full-text search
 */
export async function searchToursOptimized(
  query: string,
  limit: number = 10
): Promise<{ suggestions: string[]; items: TourCardDTO[] }> {
  return queryMonitor.track('searchTours', async () => {
    // Normalize query for better cache hits
    const normalizedQuery = query.toLowerCase().trim()
    
    // Check cache
    const cached = await cacheClient.getSearchResults(normalizedQuery)
    
    if (cached.data && !cached.stale) {
      return cached.data
    }

    // Fetch fresh data
    const result = await connectionPool.execute(async (client) => {
      try {
        // Try optimized RPC function first
        const { data, error } = await client
          .rpc('search_tours_optimized', { 
            q: normalizedQuery, 
            lim: limit 
          })
        
        if (!error && data) {
          return {
            suggestions: data.suggestions || [],
            items: data.items?.map(mapToTourCard) || []
          }
        }
      } catch {
        // Fallback to basic search
      }

      // Fallback: Optimized text search with better indexing
      const { data } = await client
        .from(TABLES.tours)
        .select('*')
        .eq('is_active', true)
        .or(`title.ilike.%${normalizedQuery}%,short_description.ilike.%${normalizedQuery}%`)
        .order('featured', { ascending: false })
        .order('view_count', { ascending: false })
        .limit(limit)

      const items = (data || []).map(mapToTourCard)
      const suggestions = [...new Set(items.map(t => t.title))].slice(0, 5)

      return { suggestions, items }
    })

    // Cache the result
    await cacheClient.setSearchResults(normalizedQuery, result)
    
    return result
  })
}

/**
 * Get featured tours with aggressive caching
 */
export async function getFeaturedToursOptimized(limit: number = 6): Promise<TourCardDTO[]> {
  return queryMonitor.track('getFeaturedTours', async () => {
    // Check cache
    const cached = await cacheClient.getFeaturedTours()
    
    if (cached.data && !cached.stale) {
      return cached.data.slice(0, limit)
    }

    // Fetch fresh data
    const result = await connectionPool.execute(async (client) => {
      const { data, error } = await client
        .from(TABLES.tours)
        .select('*')
        .eq('is_active', true)
        .eq('is_featured', true)
        .order('featured_order', { ascending: true, nullsFirst: false })
        .limit(Math.min(limit * 2, 12)) // Fetch extra for cache

      if (error) throw error
      return (data || []).map(mapToTourCard)
    })

    // Cache all featured tours
    await cacheClient.setFeaturedTours(result)
    
    return result.slice(0, limit)
  })
}

/**
 * Batch fetch multiple tours by slugs (optimized for performance)
 */
export async function batchFetchTours(slugs: string[]): Promise<Map<string, TourDetailDTO>> {
  return queryMonitor.track('batchFetchTours', async () => {
    const results = new Map<string, TourDetailDTO>()
    const uncachedSlugs: string[] = []

    // Check cache for each slug
    for (const slug of slugs) {
      const cached = await cacheClient.getTourDetail(slug)
      if (cached.data) {
        results.set(slug, cached.data)
      } else {
        uncachedSlugs.push(slug)
      }
    }

    // Batch fetch uncached tours
    if (uncachedSlugs.length > 0) {
      const tours = await connectionPool.execute(async (client) => {
        const { data, error } = await client
          .from(TABLES.tours)
          .select('*')
          .in('slug', uncachedSlugs)
          .eq('is_active', true)

        if (error) throw error
        return data || []
      })

      // Process and cache results
      for (const tour of tours) {
        const tourDetail = mapToTourDetail(tour, [], null)
        results.set(tour.slug, tourDetail)
        await cacheClient.setTourDetail(tour.slug, tourDetail)
      }
    }

    return results
  })
}

/**
 * Get real-time availability for a tour
 */
export async function getTourAvailability(
  tourId: string,
  date: string
): Promise<{ available: boolean; spotsLeft: number }> {
  return queryMonitor.track('getTourAvailability', async () => {
    // This would typically connect to a real-time availability system
    // For now, return mock data with caching
    
    const cacheKey = `availability:${tourId}:${date}`
    const cached = await cacheClient['inMemoryCache'].get<{ available: boolean; spotsLeft: number }>(cacheKey)
    
    if (cached.data) {
      return cached.data
    }

    // Simulate availability check
    const result = {
      available: Math.random() > 0.2,
      spotsLeft: Math.floor(Math.random() * 20) + 1
    }

    // Cache for 1 minute
    await cacheClient['inMemoryCache'].set(cacheKey, result, 60)
    
    return result
  })
}

/**
 * Warm up cache with frequently accessed data
 */
export async function warmupCache(): Promise<void> {
  console.log('Starting cache warmup...')
  
  try {
    // Warm up featured tours
    await getFeaturedToursOptimized()
    
    // Warm up first page of tours
    await getTourCardPageOptimized({}, { page: 1, limit: 12 })
    
    // Warm up popular categories
    const popularFilters = [
      { category: 'adventure' },
      { category: 'cultural' },
      { category: 'beach' }
    ]
    
    for (const filter of popularFilters) {
      await getTourCardPageOptimized(filter, { page: 1, limit: 12 })
    }
    
    console.log('Cache warmup completed successfully')
  } catch (error) {
    console.error('Cache warmup failed:', error)
  }
}

/**
 * Get query performance metrics
 */
export function getQueryMetrics() {
  return queryMonitor.getMetrics()
}

// Export optimized functions as default
export default {
  getAllSlugs: getAllSlugsOptimized,
  getTourCardPage: getTourCardPageOptimized,
  getTourDetail: getTourDetailOptimized,
  searchTours: searchToursOptimized,
  getFeaturedTours: getFeaturedToursOptimized,
  batchFetchTours,
  getTourAvailability,
  warmupCache,
  getQueryMetrics
}