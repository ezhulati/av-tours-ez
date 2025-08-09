import { supabaseServer } from './supabase.server'
import { TABLES, mapToTourCard, mapToTourDetail } from './adapters/dbMapper'
import type { TourCardDTO, TourDetailDTO, TourFilters, PaginationParams, PaginatedResponse } from './dto'

export async function getAllSlugs(): Promise<{ slug: string }[]> {
  const { data, error } = await supabaseServer
    .from(TABLES.tours)
    .select('slug')
    .eq('status', 'active')
    .order('created_at', { ascending: false })

  if (error) throw error
  return data || []
}

export async function getTourCardPage(
  filters: TourFilters = {},
  pagination: PaginationParams = { page: 1, limit: 12 }
): Promise<PaginatedResponse<TourCardDTO>> {
  let query = supabaseServer
    .from(TABLES.tours)
    .select(`
      *,
      countries:${TABLES.countries}(code, name),
      categories:${TABLES.categories}(slug, name)
    `, { count: 'exact' })
    .eq('status', 'active')

  // Apply filters
  if (filters.country) {
    query = query.contains('country_codes', [filters.country])
  }
  if (filters.category) {
    query = query.contains('category_slugs', [filters.category])
  }
  if (filters.difficulty) {
    query = query.eq('difficulty', filters.difficulty)
  }
  if (filters.priceMin !== undefined) {
    query = query.gte('price_min', filters.priceMin)
  }
  if (filters.priceMax !== undefined) {
    query = query.lte('price_max', filters.priceMax)
  }
  if (filters.durationMin !== undefined) {
    query = query.gte('duration_days', filters.durationMin)
  }
  if (filters.durationMax !== undefined) {
    query = query.lte('duration_days', filters.durationMax)
  }
  if (filters.featured !== undefined) {
    query = query.eq('featured', filters.featured)
  }

  // Apply sorting
  switch (pagination.sort) {
    case 'price':
      query = query.order('price_min', { ascending: true, nullsFirst: false })
      break
    case 'duration':
      query = query.order('duration_days', { ascending: true, nullsFirst: false })
      break
    case 'popular':
      query = query.order('view_count', { ascending: false })
      break
    case 'newest':
    default:
      query = query.order('created_at', { ascending: false })
  }

  // Apply pagination
  const from = (pagination.page - 1) * pagination.limit
  const to = from + pagination.limit - 1
  query = query.range(from, to)

  const { data, error, count } = await query

  if (error) throw error

  const items = (data || []).map(row => {
    const countries = row.countries?.map((c: any) => c.name) || row.country_codes || []
    const categorySlugs = row.categories?.map((c: any) => c.slug) || row.category_slugs || []
    return mapToTourCard({ ...row, countries, categorySlugs })
  })

  return {
    items,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: count || 0,
      totalPages: Math.ceil((count || 0) / pagination.limit)
    }
  }
}

export async function getTourDetail(slug: string): Promise<TourDetailDTO | null> {
  // Get tour data
  const { data: tour, error: tourError } = await supabaseServer
    .from(TABLES.tours)
    .select(`
      *,
      countries:${TABLES.countries}(code, name),
      categories:${TABLES.categories}(slug, name),
      operator:${TABLES.operators}(*)
    `)
    .eq('slug', slug)
    .eq('status', 'active')
    .single()

  if (tourError || !tour) return null

  // Get images
  const { data: images } = await supabaseServer
    .from(TABLES.images)
    .select('*')
    .eq('tour_id', tour.id)
    .order('sort_order', { ascending: true })

  const countries = tour.countries?.map((c: any) => c.name) || tour.country_codes || []
  const categorySlugs = tour.categories?.map((c: any) => c.slug) || tour.category_slugs || []

  return mapToTourDetail(
    { ...tour, countries, categorySlugs },
    images || [],
    tour.operator
  )
}

export async function searchTours(query: string, limit: number = 10): Promise<{
  suggestions: string[]
  items: TourCardDTO[]
}> {
  // Try to use RPC if available, otherwise fallback to text search
  try {
    const { data, error } = await supabaseServer
      .rpc('search_tours', { q: query, lim: limit })
    
    if (!error && data) {
      return {
        suggestions: data.suggestions || [],
        items: data.items?.map(mapToTourCard) || []
      }
    }
  } catch {
    // Fallback to basic search
  }

  // Fallback: Basic text search
  const { data } = await supabaseServer
    .from(TABLES.tours)
    .select('*')
    .eq('status', 'active')
    .or(`title.ilike.%${query}%,short_description.ilike.%${query}%`)
    .limit(limit)

  const items = (data || []).map(mapToTourCard)
  const suggestions = items.map(t => t.title).slice(0, 5)

  return { suggestions, items }
}

export async function getFeaturedTours(limit: number = 6): Promise<TourCardDTO[]> {
  const { data, error } = await supabaseServer
    .from(TABLES.tours)
    .select('*')
    .eq('status', 'active')
    .eq('featured', true)
    .order('sort_order', { ascending: true, nullsFirst: false })
    .limit(limit)

  if (error) throw error
  return (data || []).map(mapToTourCard)
}

export async function getCategories() {
  const { data, error } = await supabaseServer
    .from(TABLES.categories)
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}

export async function getCountries() {
  const { data, error } = await supabaseServer
    .from(TABLES.countries)
    .select('*')
    .order('name')

  if (error) throw error
  return data || []
}