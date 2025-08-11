import { supabaseServer, isSupabaseConfigured } from './supabase.server'
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
  console.log('getTourCardPage called with:', { filters, pagination })
  
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
  
  // First, get all matching tours without pagination for client-side filtering
  let query = supabaseServer
    .from(TABLES.tours)
    .select('*', { count: 'exact' })
    .eq('is_active', true)

  // Apply database-level filters
  if (filters.country) {
    // Filter by location in the locations JSON array
    // Use contains for JSON array matching
    query = query.contains('locations', [filters.country])
  }
  if (filters.category) {
    // Filter by activity type
    query = query.ilike('activity_type', `%${filters.category}%`)
  }
  if (filters.difficulty) {
    // Map difficulty values to match database values
    const difficultyMap: Record<string, string> = {
      'easy': 'Easy',
      'moderate': 'Moderate',
      'challenging': 'Challenging',
      'difficult': 'Difficult'
    }
    const dbDifficulty = difficultyMap[filters.difficulty] || filters.difficulty
    query = query.ilike('difficulty_level', `%${dbDifficulty}%`)
  }
  if (filters.featured !== undefined) {
    query = query.eq('is_featured', filters.featured)
  }

  // Get all results for client-side filtering and sorting
  const { data: allData, error: allError, count: totalCount } = await query

  if (allError) throw allError

  // Map all items to DTOs
  let items = (allData || []).map(mapToTourCard)

  // Apply client-side filters for price and duration
  if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
    items = items.filter(item => {
      if (filters.priceMin !== undefined && item.priceMin !== null) {
        if (item.priceMin < filters.priceMin) return false
      }
      if (filters.priceMax !== undefined && item.priceMax !== null) {
        if (item.priceMax > filters.priceMax) return false
      }
      return true
    })
  }

  if (filters.durationMin !== undefined || filters.durationMax !== undefined) {
    items = items.filter(item => {
      if (item.durationDays === null) return false
      if (filters.durationMin !== undefined) {
        if (item.durationDays < filters.durationMin) return false
      }
      if (filters.durationMax !== undefined) {
        if (item.durationDays > filters.durationMax) return false
      }
      return true
    })
  }

  // Apply group size filter if provided
  if (filters.groupSize) {
    // Filter based on group size in title or description
    items = items.filter(item => {
      const searchText = `${item.title} ${item.shortDescription || ''}`.toLowerCase()
      if (filters.groupSize === 'small') {
        return searchText.includes('small group') || searchText.includes('private') || 
               searchText.includes('intimate') || searchText.includes('personalized')
      } else if (filters.groupSize === 'large') {
        return searchText.includes('group tour') || searchText.includes('shared') || 
               !searchText.includes('small group')
      }
      return true
    })
  }

  // Apply sorting
  switch (pagination.sort) {
    case 'price':
      items.sort((a, b) => {
        const aPrice = a.priceMin || Number.MAX_VALUE
        const bPrice = b.priceMin || Number.MAX_VALUE
        return aPrice - bPrice
      })
      break
    case 'duration':
      items.sort((a, b) => {
        const aDuration = a.durationDays || Number.MAX_VALUE
        const bDuration = b.durationDays || Number.MAX_VALUE
        return aDuration - bDuration
      })
      break
    case 'popular':
      // Sort by featured status first, then keep database order
      items.sort((a, b) => {
        if (a.featured && !b.featured) return -1
        if (!a.featured && b.featured) return 1
        return 0
      })
      break
    case 'newest':
    default:
      // Keep database order (already sorted by created_at)
      break
  }

  // Apply pagination to the filtered results
  const filteredTotal = items.length
  const from = (pagination.page - 1) * pagination.limit
  const to = from + pagination.limit
  const paginatedItems = items.slice(from, to)

  return {
    items: paginatedItems,
    pagination: {
      page: pagination.page,
      limit: pagination.limit,
      total: filteredTotal,
      totalPages: Math.ceil(filteredTotal / pagination.limit)
    }
  }
}

export async function getTourDetail(slug: string): Promise<TourDetailDTO | null> {
  if (!supabaseServer) {
    console.error('Supabase not configured - cannot fetch tour detail')
    return null
  }

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

export async function getSimilarTours(currentTour: TourDetailDTO, limit: number = 4): Promise<TourCardDTO[]> {
  if (!supabaseServer) {
    console.error('Supabase not configured - cannot fetch similar tours')
    return []
  }

  // Build similarity query based on multiple factors
  let query = supabaseServer
    .from(TABLES.tours)
    .select('*')
    .eq('is_active', true)
    .neq('id', currentTour.id) // Exclude current tour

  // Strategy 1: Find tours in same countries
  if (currentTour.countries.length > 0) {
    // For each country, find tours that include it
    const countryFilters = currentTour.countries.map(country => 
      `locations.cs.["${country}"]`
    ).join(',')
    
    const { data: sameCountryTours, error: countryError } = await query
      .or(countryFilters)
      .limit(limit)
    
    if (!countryError && sameCountryTours && sameCountryTours.length >= limit) {
      return sameCountryTours.map(mapToTourCard)
    }
  }

  // Strategy 2: Find tours with same activity type
  const { data: tours, error } = await supabaseServer
    .from(TABLES.tours)
    .select('*')
    .eq('is_active', true)
    .neq('id', currentTour.id)
    .limit(20) // Get more to filter from

  if (error) return []

  const allTours = (tours || []).map(mapToTourCard)
  const similarTours: TourCardDTO[] = []

  // Score tours by similarity
  for (const tour of allTours) {
    let score = 0

    // Same countries (high priority)
    const sharedCountries = currentTour.countries.filter(country => 
      tour.countries.includes(country)
    ).length
    score += sharedCountries * 3

    // Similar difficulty (medium priority)
    if (tour.difficulty === currentTour.difficulty) {
      score += 2
    }

    // Similar duration (medium priority)
    if (tour.durationDays && currentTour.durationDays) {
      const durationDiff = Math.abs(tour.durationDays - currentTour.durationDays)
      if (durationDiff <= 1) score += 2
      else if (durationDiff <= 3) score += 1
    }

    // Similar price range (low priority)
    if (tour.priceMin && currentTour.priceMin) {
      const priceDiff = Math.abs(tour.priceMin - currentTour.priceMin)
      if (priceDiff <= 50) score += 1
    }

    // Same category slugs (medium priority)
    const sharedCategories = currentTour.categorySlugs.filter(cat => 
      tour.categorySlugs.includes(cat)
    ).length
    score += sharedCategories * 2

    // Add tour with score
    if (score > 0) {
      similarTours.push({ ...tour, score })
    }
  }

  // Sort by score and return top results
  return similarTours
    .sort((a, b) => (b as any).score - (a as any).score)
    .slice(0, limit)
    .map(({ score, ...tour }) => tour) // Remove score from final result
}