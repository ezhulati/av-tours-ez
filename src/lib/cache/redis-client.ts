/**
 * Redis Cache Client
 * High-performance caching layer for AlbaniaVisit Tours
 */

import type { TourCardDTO, TourDetailDTO, PaginatedResponse } from '../dto'

// Cache configuration
const CACHE_CONFIG = {
  // TTL in seconds
  TTL: {
    TOUR_LIST: 300,        // 5 minutes for tour lists
    TOUR_DETAIL: 600,      // 10 minutes for tour details
    SEARCH_RESULTS: 180,   // 3 minutes for search results
    FEATURED_TOURS: 900,   // 15 minutes for featured tours
    CATEGORIES: 3600,      // 1 hour for categories
    COUNTRIES: 3600,       // 1 hour for countries
    AVAILABILITY: 60,      // 1 minute for availability
  },
  // Stale-while-revalidate windows
  SWR: {
    TOUR_LIST: 60,         // 1 minute SWR window
    TOUR_DETAIL: 120,      // 2 minutes SWR window
    SEARCH_RESULTS: 30,    // 30 seconds SWR window
  },
  // Cache key prefixes
  PREFIX: {
    TOUR_LIST: 'tours:list',
    TOUR_DETAIL: 'tours:detail',
    SEARCH: 'tours:search',
    FEATURED: 'tours:featured',
    CATEGORIES: 'meta:categories',
    COUNTRIES: 'meta:countries',
    AVAILABILITY: 'tours:availability',
  }
}

// In-memory cache for edge functions (when Redis not available)
class InMemoryCache {
  private cache = new Map<string, { data: any; expires: number; staleAt: number }>()
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    // Cleanup expired entries every minute
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 60000)
    }
  }

  async get<T>(key: string): Promise<{ data: T | null; stale: boolean }> {
    const entry = this.cache.get(key)
    if (!entry) return { data: null, stale: false }

    const now = Date.now()
    if (now > entry.expires) {
      this.cache.delete(key)
      return { data: null, stale: false }
    }

    const stale = now > entry.staleAt
    return { data: entry.data as T, stale }
  }

  async set<T>(key: string, data: T, ttl: number, swr: number = 0): Promise<void> {
    const now = Date.now()
    this.cache.set(key, {
      data,
      expires: now + (ttl * 1000),
      staleAt: now + ((ttl - swr) * 1000)
    })
  }

  async delete(key: string): Promise<void> {
    this.cache.delete(key)
  }

  async deletePattern(pattern: string): Promise<void> {
    const regex = new RegExp(pattern.replace('*', '.*'))
    for (const key of this.cache.keys()) {
      if (regex.test(key)) {
        this.cache.delete(key)
      }
    }
  }

  private cleanup(): void {
    const now = Date.now()
    for (const [key, entry] of this.cache.entries()) {
      if (now > entry.expires) {
        this.cache.delete(key)
      }
    }
  }

  destroy(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    this.cache.clear()
  }
}

// Redis client wrapper with fallback to in-memory cache
class CacheClient {
  private inMemoryCache: InMemoryCache
  private redisUrl: string | undefined
  private isRedisAvailable: boolean = false

  constructor() {
    this.inMemoryCache = new InMemoryCache()
    this.redisUrl = process.env.REDIS_URL || process.env.UPSTASH_REDIS_REST_URL
    this.checkRedisAvailability()
  }

  private async checkRedisAvailability(): Promise<void> {
    if (!this.redisUrl) {
      console.info('Redis URL not configured, using in-memory cache')
      return
    }

    try {
      // Try to ping Redis (implementation depends on Redis client)
      // For now, we'll use in-memory cache as fallback
      this.isRedisAvailable = false
    } catch (error) {
      console.warn('Redis not available, falling back to in-memory cache')
      this.isRedisAvailable = false
    }
  }

  /**
   * Generate cache key with versioning support
   */
  private generateKey(prefix: string, params: Record<string, any>): string {
    const sortedParams = Object.keys(params)
      .sort()
      .reduce((acc, key) => {
        if (params[key] !== undefined && params[key] !== null) {
          acc[key] = params[key]
        }
        return acc
      }, {} as Record<string, any>)
    
    const paramStr = JSON.stringify(sortedParams)
    const hash = this.simpleHash(paramStr)
    return `${prefix}:v1:${hash}`
  }

  private simpleHash(str: string): string {
    let hash = 0
    for (let i = 0; i < str.length; i++) {
      const char = str.charCodeAt(i)
      hash = ((hash << 5) - hash) + char
      hash = hash & hash // Convert to 32bit integer
    }
    return Math.abs(hash).toString(36)
  }

  /**
   * Get cached tour list with stale-while-revalidate
   */
  async getTourList(
    filters: Record<string, any>,
    pagination: Record<string, any>
  ): Promise<{ data: PaginatedResponse<TourCardDTO> | null; stale: boolean }> {
    const key = this.generateKey(CACHE_CONFIG.PREFIX.TOUR_LIST, { filters, pagination })
    return this.inMemoryCache.get<PaginatedResponse<TourCardDTO>>(key)
  }

  /**
   * Set tour list cache with SWR
   */
  async setTourList(
    filters: Record<string, any>,
    pagination: Record<string, any>,
    data: PaginatedResponse<TourCardDTO>
  ): Promise<void> {
    const key = this.generateKey(CACHE_CONFIG.PREFIX.TOUR_LIST, { filters, pagination })
    await this.inMemoryCache.set(
      key,
      data,
      CACHE_CONFIG.TTL.TOUR_LIST,
      CACHE_CONFIG.SWR.TOUR_LIST
    )
  }

  /**
   * Get cached tour detail
   */
  async getTourDetail(slug: string): Promise<{ data: TourDetailDTO | null; stale: boolean }> {
    const key = `${CACHE_CONFIG.PREFIX.TOUR_DETAIL}:${slug}`
    return this.inMemoryCache.get<TourDetailDTO>(key)
  }

  /**
   * Set tour detail cache
   */
  async setTourDetail(slug: string, data: TourDetailDTO): Promise<void> {
    const key = `${CACHE_CONFIG.PREFIX.TOUR_DETAIL}:${slug}`
    await this.inMemoryCache.set(
      key,
      data,
      CACHE_CONFIG.TTL.TOUR_DETAIL,
      CACHE_CONFIG.SWR.TOUR_DETAIL
    )
  }

  /**
   * Get cached search results
   */
  async getSearchResults(query: string): Promise<{ data: any | null; stale: boolean }> {
    const key = this.generateKey(CACHE_CONFIG.PREFIX.SEARCH, { query })
    return this.inMemoryCache.get(key)
  }

  /**
   * Set search results cache
   */
  async setSearchResults(query: string, data: any): Promise<void> {
    const key = this.generateKey(CACHE_CONFIG.PREFIX.SEARCH, { query })
    await this.inMemoryCache.set(
      key,
      data,
      CACHE_CONFIG.TTL.SEARCH_RESULTS,
      CACHE_CONFIG.SWR.SEARCH_RESULTS
    )
  }

  /**
   * Get cached featured tours
   */
  async getFeaturedTours(): Promise<{ data: TourCardDTO[] | null; stale: boolean }> {
    const key = `${CACHE_CONFIG.PREFIX.FEATURED}:all`
    return this.inMemoryCache.get<TourCardDTO[]>(key)
  }

  /**
   * Set featured tours cache
   */
  async setFeaturedTours(data: TourCardDTO[]): Promise<void> {
    const key = `${CACHE_CONFIG.PREFIX.FEATURED}:all`
    await this.inMemoryCache.set(key, data, CACHE_CONFIG.TTL.FEATURED_TOURS)
  }

  /**
   * Invalidate cache by pattern
   */
  async invalidatePattern(pattern: string): Promise<void> {
    await this.inMemoryCache.deletePattern(pattern)
  }

  /**
   * Invalidate all tour-related caches
   */
  async invalidateTourCaches(): Promise<void> {
    await Promise.all([
      this.inMemoryCache.deletePattern(`${CACHE_CONFIG.PREFIX.TOUR_LIST}:*`),
      this.inMemoryCache.deletePattern(`${CACHE_CONFIG.PREFIX.TOUR_DETAIL}:*`),
      this.inMemoryCache.deletePattern(`${CACHE_CONFIG.PREFIX.FEATURED}:*`),
      this.inMemoryCache.deletePattern(`${CACHE_CONFIG.PREFIX.SEARCH}:*`),
    ])
  }

  /**
   * Warm up cache with frequently accessed data
   */
  async warmupCache(fetchFn: () => Promise<any>): Promise<void> {
    try {
      // Warm up featured tours
      const featuredData = await fetchFn()
      if (featuredData) {
        await this.setFeaturedTours(featuredData)
      }
    } catch (error) {
      console.error('Cache warmup failed:', error)
    }
  }

  /**
   * Get cache statistics
   */
  getCacheStats(): { size: number; hitRate?: number } {
    // In production, this would connect to Redis for detailed stats
    return {
      size: this.inMemoryCache['cache'].size,
    }
  }

  destroy(): void {
    this.inMemoryCache.destroy()
  }
}

// Export singleton instance
export const cacheClient = new CacheClient()

// Export cache configuration for use in other modules
export { CACHE_CONFIG }

// Cache key generators for consistency
export const CacheKeys = {
  tourList: (filters: any, pagination: any) => 
    cacheClient['generateKey'](CACHE_CONFIG.PREFIX.TOUR_LIST, { filters, pagination }),
  tourDetail: (slug: string) => 
    `${CACHE_CONFIG.PREFIX.TOUR_DETAIL}:${slug}`,
  search: (query: string) => 
    cacheClient['generateKey'](CACHE_CONFIG.PREFIX.SEARCH, { query }),
  featured: () => 
    `${CACHE_CONFIG.PREFIX.FEATURED}:all`,
  categories: () => 
    `${CACHE_CONFIG.PREFIX.CATEGORIES}:all`,
  countries: () => 
    `${CACHE_CONFIG.PREFIX.COUNTRIES}:all`,
}