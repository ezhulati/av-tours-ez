import type { APIRoute } from 'astro'
import { getTourCardPage } from '@/lib/queries'
import type { TourFilters, PaginationParams } from '@/lib/dto'

export const GET: APIRoute = async ({ url }) => {
  try {
    const params = url.searchParams
    
    // Parse filters
    const filters: TourFilters = {
      country: params.get('country') || undefined,
      category: params.get('category') || undefined,
      difficulty: params.get('difficulty') as any || undefined,
      priceMin: params.get('price_min') ? Number(params.get('price_min')) : undefined,
      priceMax: params.get('price_max') ? Number(params.get('price_max')) : undefined,
      durationMin: params.get('duration_min') ? Number(params.get('duration_min')) : undefined,
      durationMax: params.get('duration_max') ? Number(params.get('duration_max')) : undefined,
      featured: params.get('featured') === 'true' ? true : undefined
    }
    
    // Parse pagination
    const pagination: PaginationParams = {
      page: Number(params.get('page')) || 1,
      limit: Number(params.get('limit')) || 12,
      sort: params.get('sort') as any || 'newest'
    }
    
    const result = await getTourCardPage(filters, pagination)
    
    return new Response(JSON.stringify(result), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Cache-Control': 'public, max-age=60'
      }
    })
  } catch (error) {
    console.error('Error fetching tours:', error)
    return new Response(JSON.stringify({ error: 'Failed to fetch tours' }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}