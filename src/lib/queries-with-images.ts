import { supabaseServer, isSupabaseConfigured } from './supabase.server'
import { TABLES, mapToTourCard, mapToTourDetailWithImages } from './adapters/dbMapperWithImages'
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
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    console.error('Supabase not configured - returning empty response')
    return {
      items: [],
      pagination: {
        page: pagination.page,
        limit: pagination.limit,
        total: 0,
        totalPages: 0
      }
    }
  }
  
  let query = supabaseServer
    .from(TABLES.tours)
    .select('*', { count: 'exact' })
    .eq('is_active', true)

  // Apply filters
  if (filters.country) {
    query = query.contains('locations', [filters.country])
  }
  if (filters.category) {
    query = query.ilike('activity_type', `%${filters.category}%`)
  }
  if (filters.difficulty) {
    query = query.ilike('difficulty_level', `%${filters.difficulty}%`)
  }
  if (filters.featured !== undefined) {
    query = query.eq('is_featured', filters.featured)
  }

  // Apply sorting
  switch (pagination.sort) {
    case 'price':
      query = query.order('price', { ascending: true, nullsFirst: false })
      break
    case 'duration':
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
  if (!supabaseServer) {
    console.error('Supabase not configured - cannot fetch tour detail')
    return null
  }

  const { data, error } = await supabaseServer
    .from(TABLES.tours)
    .select('*')
    .eq('slug', slug)
    .eq('is_active', true)
    .single()

  if (error || !data) {
    console.error('Error fetching tour detail:', error)
    return null
  }

  // Use the async version that fetches deduplicated images
  return await mapToTourDetailWithImages(data)
}

export async function getFeaturedTours(limit: number = 6): Promise<TourCardDTO[]> {
  if (!supabaseServer) {
    console.error('Supabase not configured')
    return []
  }

  const { data, error } = await supabaseServer
    .from(TABLES.tours)
    .select('*')
    .eq('is_active', true)
    .eq('is_featured', true)
    .order('created_at', { ascending: false })
    .limit(limit)

  if (error) {
    console.error('Error fetching featured tours:', error)
    return []
  }

  return (data || []).map(mapToTourCard)
}

export async function getRelatedTours(
  tourSlug: string,
  limit: number = 4
): Promise<TourCardDTO[]> {
  if (!supabaseServer) {
    console.error('Supabase not configured')
    return []
  }

  // First, get the current tour details
  const { data: currentTour } = await supabaseServer
    .from(TABLES.tours)
    .select('activity_type, locations, difficulty_level')
    .eq('slug', tourSlug)
    .single()

  if (!currentTour) {
    return []
  }

  // Find tours with similar attributes
  const { data, error } = await supabaseServer
    .from(TABLES.tours)
    .select('*')
    .eq('is_active', true)
    .neq('slug', tourSlug)
    .or(`activity_type.ilike.%${currentTour.activity_type}%,difficulty_level.ilike.%${currentTour.difficulty_level}%`)
    .limit(limit)

  if (error) {
    console.error('Error fetching related tours:', error)
    return []
  }

  return (data || []).map(mapToTourCard)
}

export async function searchTours(
  query: string,
  limit: number = 10
): Promise<TourCardDTO[]> {
  if (!supabaseServer) {
    console.error('Supabase not configured')
    return []
  }

  const { data, error } = await supabaseServer
    .from(TABLES.tours)
    .select('*')
    .eq('is_active', true)
    .or(`title.ilike.%${query}%,short_description.ilike.%${query}%,ai_enhanced_title.ilike.%${query}%,ai_enhanced_description.ilike.%${query}%`)
    .limit(limit)

  if (error) {
    console.error('Error searching tours:', error)
    return []
  }

  return (data || []).map(mapToTourCard)
}

/**
 * Track an affiliate click
 */
export async function trackAffiliateClick(
  tourSlug: string,
  tourId?: string,
  affiliateUrl?: string,
  userAgent?: string,
  cookieId?: string
): Promise<void> {
  if (!supabaseServer) {
    console.error('Supabase not configured - cannot track click')
    return
  }

  try {
    await supabaseServer
      .from(TABLES.clicks)
      .insert({
        tour_slug: tourSlug,
        tour_id: tourId,
        affiliate_url: affiliateUrl,
        user_agent: userAgent,
        cookie_id: cookieId,
        clicked_at: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error tracking affiliate click:', error)
  }
}

/**
 * Get tour images count for admin dashboard
 */
export async function getTourImageStats(): Promise<{
  totalImages: number
  duplicates: number
  toursWithImages: number
  toursWithoutImages: number
}> {
  if (!supabaseServer) {
    return {
      totalImages: 0,
      duplicates: 0,
      toursWithImages: 0,
      toursWithoutImages: 0
    }
  }

  try {
    // Get total images
    const { count: totalImages } = await supabaseServer
      .from(TABLES.images)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    // Get duplicates
    const { count: duplicates } = await supabaseServer
      .from(TABLES.images)
      .select('*', { count: 'exact', head: true })
      .eq('is_duplicate', true)

    // Get tours with images
    const { data: toursWithImagesData } = await supabaseServer
      .from(TABLES.images)
      .select('tour_slug')
      .eq('is_active', true)
      .eq('is_duplicate', false)

    const uniqueTourSlugs = new Set(toursWithImagesData?.map(d => d.tour_slug) || [])
    const toursWithImages = uniqueTourSlugs.size

    // Get total tours
    const { count: totalTours } = await supabaseServer
      .from(TABLES.tours)
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)

    const toursWithoutImages = (totalTours || 0) - toursWithImages

    return {
      totalImages: totalImages || 0,
      duplicates: duplicates || 0,
      toursWithImages,
      toursWithoutImages
    }
  } catch (error) {
    console.error('Error fetching image stats:', error)
    return {
      totalImages: 0,
      duplicates: 0,
      toursWithImages: 0,
      toursWithoutImages: 0
    }
  }
}