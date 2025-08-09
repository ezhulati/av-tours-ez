import type { APIRoute } from 'astro'
import { getTourDetail } from '@/lib/queries'

export const prerender = false

export const GET: APIRoute = async ({ params }) => {
  try {
    const { slug } = params
    
    if (!slug) {
      return new Response(JSON.stringify({ error: 'Slug is required' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    const tour = await getTourDetail(slug)
    
    if (!tour) {
      return new Response(JSON.stringify({ error: 'Tour not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' }
      })
    }
    
    return new Response(JSON.stringify(tour), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=300'
      }
    })
  } catch (error) {
    console.error('Error fetching tour:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch tour' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}