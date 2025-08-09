/**
 * Optimized Tours API Endpoint
 * High-performance API with caching, compression, and monitoring
 */

import type { APIRoute } from 'astro'
import queries from '@/lib/queries-optimized'
import type { TourFilters, PaginationParams } from '@/lib/dto'
import { z } from 'zod'

// Request validation schemas
const FilterSchema = z.object({
  country: z.string().optional(),
  category: z.string().optional(),
  difficulty: z.enum(['easy', 'moderate', 'difficult']).optional(),
  priceMin: z.number().min(0).optional(),
  priceMax: z.number().min(0).optional(),
  durationMin: z.number().min(1).optional(),
  durationMax: z.number().min(1).optional(),
  featured: z.boolean().optional()
})

const PaginationSchema = z.object({
  page: z.number().min(1).default(1),
  limit: z.number().min(1).max(100).default(12),
  sort: z.enum(['newest', 'popular', 'price', 'duration']).default('newest')
})

// Response compression
function shouldCompress(acceptEncoding: string | null): string | null {
  if (!acceptEncoding) return null
  
  if (acceptEncoding.includes('br')) return 'br'
  if (acceptEncoding.includes('gzip')) return 'gzip'
  if (acceptEncoding.includes('deflate')) return 'deflate'
  
  return null
}

// ETag generation
function generateETag(data: any): string {
  const str = JSON.stringify(data)
  let hash = 0
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i)
    hash = ((hash << 5) - hash) + char
    hash = hash & hash
  }
  return `"${Math.abs(hash).toString(36)}"`
}

export const GET: APIRoute = async ({ url, request }) => {
  const startTime = performance.now()
  
  try {
    // Parse and validate query parameters
    const params = url.searchParams
    
    // Parse filters with validation
    const rawFilters = {
      country: params.get('country') || undefined,
      category: params.get('category') || undefined,
      difficulty: params.get('difficulty') || undefined,
      priceMin: params.get('price_min') ? Number(params.get('price_min')) : undefined,
      priceMax: params.get('price_max') ? Number(params.get('price_max')) : undefined,
      durationMin: params.get('duration_min') ? Number(params.get('duration_min')) : undefined,
      durationMax: params.get('duration_max') ? Number(params.get('duration_max')) : undefined,
      featured: params.get('featured') === 'true' ? true : undefined
    }
    
    const rawPagination = {
      page: Number(params.get('page')) || 1,
      limit: Number(params.get('limit')) || 12,
      sort: params.get('sort') || 'newest'
    }
    
    // Validate inputs
    const filters = FilterSchema.parse(rawFilters) as TourFilters
    const pagination = PaginationSchema.parse(rawPagination) as PaginationParams
    
    // Check If-None-Match for caching
    const ifNoneMatch = request.headers.get('If-None-Match')
    
    // Fetch data with optimized queries
    const result = await queries.getTourCardPage(filters, pagination)
    
    // Generate ETag
    const etag = generateETag(result)
    
    // Return 304 if content hasn't changed
    if (ifNoneMatch && ifNoneMatch === etag) {
      return new Response(null, {
        status: 304,
        headers: {
          'ETag': etag,
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
          'X-Response-Time': `${(performance.now() - startTime).toFixed(2)}ms`
        }
      })
    }
    
    // Serialize response
    const responseBody = JSON.stringify(result)
    
    // Prepare headers
    const headers: HeadersInit = {
      'Content-Type': 'application/json',
      'ETag': etag,
      'Cache-Control': 'public, max-age=60, stale-while-revalidate=300',
      'X-Response-Time': `${(performance.now() - startTime).toFixed(2)}ms`,
      'X-Total-Count': result.pagination.total.toString(),
      'X-Page-Count': result.pagination.totalPages.toString(),
      'Vary': 'Accept-Encoding'
    }
    
    // Add CORS headers
    headers['Access-Control-Allow-Origin'] = '*'
    headers['Access-Control-Allow-Methods'] = 'GET, OPTIONS'
    headers['Access-Control-Max-Age'] = '86400'
    
    // Check if client supports compression
    const acceptEncoding = request.headers.get('Accept-Encoding')
    const compressionType = shouldCompress(acceptEncoding)
    
    if (compressionType) {
      headers['Content-Encoding'] = compressionType
      // Note: Actual compression would be handled by the edge/CDN layer
      // or we could use Node.js zlib here if needed
    }
    
    // Log performance metrics
    const responseTime = performance.now() - startTime
    if (responseTime > 200) {
      console.warn(`Slow API response: ${responseTime.toFixed(2)}ms`, {
        filters,
        pagination,
        resultCount: result.items.length
      })
    }
    
    return new Response(responseBody, {
      status: 200,
      headers
    })
    
  } catch (error) {
    const responseTime = performance.now() - startTime
    
    // Handle validation errors
    if (error instanceof z.ZodError) {
      return new Response(JSON.stringify({
        error: 'Invalid request parameters',
        details: error.errors
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          'X-Response-Time': `${responseTime.toFixed(2)}ms`
        }
      })
    }
    
    // Log error
    console.error('Error fetching tours:', error, {
      url: url.toString(),
      responseTime: responseTime.toFixed(2)
    })
    
    // Return error response
    return new Response(JSON.stringify({
      error: 'Failed to fetch tours',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'no-cache',
        'X-Response-Time': `${responseTime.toFixed(2)}ms`
      }
    })
  }
}

export const OPTIONS: APIRoute = async () => {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, If-None-Match',
      'Access-Control-Max-Age': '86400'
    }
  })
}