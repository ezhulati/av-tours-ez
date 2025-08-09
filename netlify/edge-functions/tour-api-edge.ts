/**
 * Edge Function for Tour API
 * Runs at the edge for ultra-low latency responses
 */

import type { Context } from '@netlify/edge-functions'

// Edge KV cache interface
interface EdgeCache {
  get(key: string): Promise<string | null>
  put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>
  delete(key: string): Promise<void>
}

// Geolocation-based routing
interface GeoData {
  country?: string
  region?: string
  city?: string
  latitude?: number
  longitude?: number
  timezone?: string
}

export default async function handler(request: Request, context: Context) {
  const url = new URL(request.url)
  const path = url.pathname
  
  // Performance tracking
  const startTime = Date.now()
  
  try {
    // Get geolocation data for personalization
    const geo = context.geo as GeoData
    
    // Edge caching with stale-while-revalidate
    const cache = await getCacheStrategy(url, geo)
    
    // Handle different API endpoints
    if (path.startsWith('/api/tours')) {
      return handleToursAPI(request, context, cache, geo)
    } else if (path.startsWith('/api/search')) {
      return handleSearchAPI(request, context, cache, geo)
    } else if (path.startsWith('/api/featured')) {
      return handleFeaturedAPI(request, context, cache, geo)
    }
    
    // Default response
    return new Response('Not Found', { status: 404 })
    
  } catch (error) {
    console.error('Edge function error:', error)
    
    return new Response(JSON.stringify({
      error: 'Internal Server Error',
      message: error instanceof Error ? error.message : 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        'X-Response-Time': `${Date.now() - startTime}ms`
      }
    })
  }
}

async function handleToursAPI(
  request: Request,
  context: Context,
  cache: EdgeCache,
  geo: GeoData
): Promise<Response> {
  const url = new URL(request.url)
  const cacheKey = generateCacheKey('tours', url.searchParams, geo)
  
  // Try edge cache first
  const cached = await cache.get(cacheKey)
  if (cached) {
    const data = JSON.parse(cached)
    
    // Check if stale
    if (data.expires > Date.now()) {
      return new Response(JSON.stringify(data.content), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'X-Cache': 'HIT',
          'X-Cache-Age': `${Date.now() - data.created}ms`,
          'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
        }
      })
    }
    
    // Return stale content while revalidating
    revalidateCache(cacheKey, url, context)
    
    return new Response(JSON.stringify(data.content), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'STALE',
        'X-Cache-Age': `${Date.now() - data.created}ms`,
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    })
  }
  
  // Fetch from origin
  const response = await fetchFromOrigin('/api/tours', url.searchParams)
  
  // Cache the response
  if (response.ok) {
    const content = await response.json()
    await cache.put(cacheKey, JSON.stringify({
      content,
      created: Date.now(),
      expires: Date.now() + 60000 // 1 minute
    }), {
      expirationTtl: 300 // 5 minutes total TTL
    })
    
    return new Response(JSON.stringify(content), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=60, stale-while-revalidate=300'
      }
    })
  }
  
  return response
}

async function handleSearchAPI(
  request: Request,
  context: Context,
  cache: EdgeCache,
  geo: GeoData
): Promise<Response> {
  const url = new URL(request.url)
  const query = url.searchParams.get('q') || ''
  
  // Normalize query for better cache hits
  const normalizedQuery = query.toLowerCase().trim()
  const cacheKey = `search:${normalizedQuery}:${geo.country || 'global'}`
  
  // Check cache
  const cached = await cache.get(cacheKey)
  if (cached) {
    return new Response(cached, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=180' // 3 minutes
      }
    })
  }
  
  // Fetch from origin
  const response = await fetchFromOrigin('/api/search', new URLSearchParams({ q: normalizedQuery }))
  
  if (response.ok) {
    const content = await response.text()
    
    // Cache search results
    await cache.put(cacheKey, content, {
      expirationTtl: 180 // 3 minutes
    })
    
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=180'
      }
    })
  }
  
  return response
}

async function handleFeaturedAPI(
  request: Request,
  context: Context,
  cache: EdgeCache,
  geo: GeoData
): Promise<Response> {
  // Featured tours can be cached more aggressively
  const cacheKey = `featured:${geo.country || 'global'}`
  
  const cached = await cache.get(cacheKey)
  if (cached) {
    return new Response(cached, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'HIT',
        'Cache-Control': 'public, max-age=900, s-maxage=1800' // 15 min client, 30 min CDN
      }
    })
  }
  
  // Fetch from origin
  const response = await fetchFromOrigin('/api/featured', new URLSearchParams())
  
  if (response.ok) {
    const content = await response.text()
    
    // Cache featured tours for longer
    await cache.put(cacheKey, content, {
      expirationTtl: 1800 // 30 minutes
    })
    
    return new Response(content, {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'X-Cache': 'MISS',
        'Cache-Control': 'public, max-age=900, s-maxage=1800'
      }
    })
  }
  
  return response
}

function generateCacheKey(
  prefix: string,
  params: URLSearchParams,
  geo: GeoData
): string {
  // Sort params for consistent cache keys
  const sortedParams = Array.from(params.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([k, v]) => `${k}=${v}`)
    .join('&')
  
  // Include geo data for personalization
  const geoKey = geo.country || 'global'
  
  return `${prefix}:${geoKey}:${sortedParams}`
}

async function fetchFromOrigin(
  path: string,
  params: URLSearchParams
): Promise<Response> {
  const originUrl = `${process.env.ORIGIN_URL || 'https://albaniavisit.com'}${path}?${params}`
  
  try {
    const response = await fetch(originUrl, {
      headers: {
        'X-Edge-Request': 'true'
      }
    })
    
    return response
  } catch (error) {
    console.error('Origin fetch failed:', error)
    return new Response('Service Unavailable', { status: 503 })
  }
}

async function revalidateCache(
  cacheKey: string,
  url: URL,
  context: Context
): Promise<void> {
  // Fire and forget background revalidation
  context.waitUntil(
    (async () => {
      try {
        const response = await fetchFromOrigin(url.pathname, url.searchParams)
        if (response.ok) {
          const content = await response.json()
          const cache = await getCacheStrategy(url, context.geo as GeoData)
          
          await cache.put(cacheKey, JSON.stringify({
            content,
            created: Date.now(),
            expires: Date.now() + 60000
          }), {
            expirationTtl: 300
          })
        }
      } catch (error) {
        console.error('Cache revalidation failed:', error)
      }
    })()
  )
}

async function getCacheStrategy(url: URL, geo: GeoData): Promise<EdgeCache> {
  // This would connect to actual edge KV store
  // For now, using in-memory cache simulation
  return {
    async get(key: string): Promise<string | null> {
      // Simulate edge KV get
      return null
    },
    
    async put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void> {
      // Simulate edge KV put
    },
    
    async delete(key: string): Promise<void> {
      // Simulate edge KV delete
    }
  }
}

export const config = {
  path: '/api/*',
  cache: 'manual'
}