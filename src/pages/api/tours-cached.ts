import type { APIRoute } from 'astro'
import { getTourCardPage, getTotalTourCount, getFeaturedTours } from '@/lib/queries'
import type { TourFilters } from '@/lib/dto'

// In-memory cache for better performance
const cache = new Map<string, { data: any; timestamp: number }>()
const CACHE_DURATION = 5 * 60 * 1000 // 5 minutes

export const GET: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url)
    const cacheKey = url.search || 'default'
    
    // Check cache first
    const cached = cache.get(cacheKey)
    if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
      return new Response(JSON.stringify(cached.data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
          'CDN-Cache-Control': 'public, max-age=600',
          'Vary': 'Accept-Encoding',
          'X-Cache': 'HIT'
        }
      })
    }
    
    // Parse query parameters
    const page = parseInt(url.searchParams.get('page') || '1')
    const limit = parseInt(url.searchParams.get('limit') || '12')
    const category = url.searchParams.get('category') || undefined
    const country = url.searchParams.get('country') || undefined
    const difficulty = url.searchParams.get('difficulty') || undefined
    const minPrice = url.searchParams.get('minPrice') ? parseFloat(url.searchParams.get('minPrice')!) : undefined
    const maxPrice = url.searchParams.get('maxPrice') ? parseFloat(url.searchParams.get('maxPrice')!) : undefined
    const search = url.searchParams.get('search') || undefined
    const featured = url.searchParams.get('featured') === 'true' ? true : undefined
    const sortBy = url.searchParams.get('sortBy') || 'featured'
    
    // Build filters object
    const filters: TourFilters = {
      category,
      country,
      difficulty,
      minPrice,
      maxPrice,
      search,
      featured
    }
    
    // Remove undefined values
    Object.keys(filters).forEach(key => {
      if (filters[key as keyof TourFilters] === undefined) {
        delete filters[key as keyof TourFilters]
      }
    })
    
    // Fetch data with pagination
    const offset = (page - 1) * limit
    
    // If featured filter is set, use getFeaturedTours
    let tours, total
    if (featured) {
      [tours, total] = await Promise.all([
        getFeaturedTours(limit),
        getTotalTourCount()
      ])
    } else {
      const result = await getTourCardPage(
        page,
        limit,
        filters,
        sortBy as 'featured' | 'price_asc' | 'price_desc' | 'duration_asc' | 'duration_desc' | 'title_asc' | 'title_desc' | undefined
      )
      tours = result.tours
      total = result.totalCount
    }
    
    const totalPages = Math.ceil(total / limit)
    
    const responseData = {
      tours,
      pagination: {
        page,
        limit,
        total,
        totalPages,
        hasNext: page < totalPages,
        hasPrev: page > 1
      },
      filters: filters
    }
    
    // Update cache
    cache.set(cacheKey, {
      data: responseData,
      timestamp: Date.now()
    })
    
    // Clean old cache entries periodically
    if (cache.size > 100) {
      const now = Date.now()
      for (const [key, value] of cache.entries()) {
        if (now - value.timestamp > CACHE_DURATION * 2) {
          cache.delete(key)
        }
      }
    }
    
    return new Response(JSON.stringify(responseData), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300, s-maxage=600, stale-while-revalidate=86400',
        'CDN-Cache-Control': 'public, max-age=600',
        'Vary': 'Accept-Encoding',
        'X-Cache': 'MISS'
      }
    })
  } catch (error) {
    console.error('Error fetching tours:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to fetch tours',
      details: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache'
      }
    })
  }
}

// Prefetch handler for preloading data
export const POST: APIRoute = async ({ request }) => {
  try {
    const { filters } = await request.json()
    
    // Prefetch common queries
    const prefetchQueries = [
      { ...filters, limit: 12, offset: 0 },
      { featured: true, limit: 6, offset: 0 },
      { country: 'albania', limit: 12, offset: 0 }
    ]
    
    await Promise.all(prefetchQueries.map(async (query: any) => {
      const cacheKey = new URLSearchParams(query).toString()
      if (!cache.has(cacheKey)) {
        let tours, total
        if (query.featured) {
          [tours, total] = await Promise.all([
            getFeaturedTours(query.limit || 6),
            getTotalTourCount()
          ])
        } else {
          const result = await getTourCardPage(
            1,
            query.limit || 12,
            query,
            'featured'
          )
          tours = result.tours
          total = result.totalCount
        }
        
        cache.set(cacheKey, {
          data: { tours, total },
          timestamp: Date.now()
        })
      }
    }))
    
    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Prefetch failed' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}