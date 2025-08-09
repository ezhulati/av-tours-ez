import { supabaseServer } from './supabase.server'
import { TABLES, mapToTourCard, mapToTourDetail } from './adapters/dbMapper'
import type { TourCardDTO, TourDetailDTO, TourFilters, PaginationParams, PaginatedResponse } from './dto'

export async function getAllSlugs(): Promise<{ slug: string }[]> {
  const { data, error } = await supabaseServer
    .from(TABLES.tours)
    .select('slug')
    .eq('is_active', true)
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
    .select('*', { count: 'exact' })
    .eq('is_active', true)

  // Apply filters
  if (filters.country) {
    // Filter by location in the locations JSON array
    query = query.contains('locations', [filters.country])
  }
  if (filters.category) {
    // Filter by activity type
    query = query.ilike('activity_type', `%${filters.category}%`)
  }
  if (filters.difficulty) {
    query = query.ilike('difficulty_level', `%${filters.difficulty}%`)
  }
  // Price and duration filtering would need to be done client-side
  // since they're stored as strings in the database
  if (filters.featured !== undefined) {
    query = query.eq('featured', filters.featured)
  }

  // Apply sorting
  switch (pagination.sort) {
    case 'price':
      // Price sorting would need to be done client-side
      query = query.order('price', { ascending: true, nullsFirst: false })
      break
    case 'duration':
      // Duration sorting would need to be done client-side  
      query = query.order('duration', { ascending: true, nullsFirst: false })
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
}

export async function getTourDetail(slug: string): Promise<TourDetailDTO | null> {
  // Get tour data
  const { data: tour, error: tourError } = await supabaseServer
    .from(TABLES.tours)
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (tourError || !tour) return null

  // Note: Images are stored in the tour record itself (image_gallery field)
  return mapToTourDetail(tour, [], null)
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
    .eq('is_active', true)
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
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('featured_order', { ascending: true, nullsFirst: false })
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

export async function getTotalTourCount(): Promise<number> {
  const { count, error } = await supabaseServer
    .from(TABLES.tours)
    .select('*', { count: 'exact', head: true })
    .eq('is_active', true)

  if (error) throw error
  return count || 0
}