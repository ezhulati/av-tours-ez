import type { APIRoute } from 'astro'
import { searchTours } from '@/lib/queries'

export const GET: APIRoute = async ({ url }) => {
  try {
    const query = url.searchParams.get('q')
    const limit = Number(url.searchParams.get('limit')) || 10
    
    if (!query || query.length < 2) {
      return new Response(JSON.stringify({ 
        suggestions: [], 
        items: [] 
      }), {
        status: 200,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const result = await searchTours(query, limit)
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      }
    })
  } catch (error) {
    console.error('Search error:', error)
    return new Response(JSON.stringify({ error: 'Search failed' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}