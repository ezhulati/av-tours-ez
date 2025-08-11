import type { APIRoute } from 'astro'
import { searchTours } from '@/lib/queries'
import { rateLimiters, createAdvancedRateLimitMiddleware } from '@/lib/security/advanced-rate-limiter'
import { secureSchemas } from '@/lib/security/comprehensive-validator'
import { z } from 'zod'

// Secure search validation
const searchSchema = z.object({
  q: secureSchemas.secureString(2, 100),
  limit: secureSchemas.secureInt(1, 50)
})

const rateLimitMiddleware = createAdvancedRateLimitMiddleware(rateLimiters.search)

export const GET: APIRoute = async (context) => {
  return rateLimitMiddleware(context, async () => {
    try {
      const { url } = context
      const rawQuery = url.searchParams.get('q')
      const rawLimit = url.searchParams.get('limit')
      
      if (!rawQuery || rawQuery.length < 2) {
        return new Response(JSON.stringify({ 
          suggestions: [], 
          items: [] 
        }), {
          status: 200,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      // Validate and sanitize input
      const validatedData = searchSchema.parse({
        q: rawQuery,
        limit: rawLimit ? Number(rawLimit) : 10
      })
      
      const result = await searchTours(validatedData.q, validatedData.limit)
    
      return new Response(JSON.stringify(result), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'public, max-age=60'
        }
      })
    } catch (error) {
      console.error('Search error:', error)
      
      if (error instanceof z.ZodError) {
        return new Response(JSON.stringify({
          error: 'Invalid search parameters',
          details: error.errors
        }), {
          status: 400,
          headers: { 'Content-Type': 'application/json' }
        })
      }
      
      return new Response(JSON.stringify({ error: 'Search failed' }), {
        status: 500,
        headers: { 'Content-Type': 'application/json' }
      })
    }
  })
}