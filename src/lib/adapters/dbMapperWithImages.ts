import type { TourCardDTO, TourDetailDTO } from '../dto'
import { supabaseServer } from '../supabase.server'

export const TABLES = {
  tours: 'affiliate_tours',
  images: 'tour_images',
  categories: 'tour_categories',
  countries: 'tour_countries',
  operators: 'tour_operators',
  clicks: 'affiliate_clicks',
  inquiries: 'inquiries'
}

/**
 * Get unique, validated images for a tour
 */
async function getTourImages(tourSlug: string): Promise<Array<{
  url: string
  alt: string | null
  caption?: string | null
  type: string
  width?: number
  height?: number
}>> {
  try {
    const { data: images, error } = await supabaseServer
      .from('tour_images')
      .select('image_url, image_alt, image_caption, image_type, width, height, display_order')
      .eq('tour_slug', tourSlug)
      .eq('is_active', true)
      .eq('is_duplicate', false)
      .neq('validation_status', 'invalid')
      .order('display_order', { ascending: true })
      .order('created_at', { ascending: true })
    
    if (error || !images || images.length === 0) {
      return []
    }
    
    return images.map(img => ({
      url: img.image_url,
      alt: img.image_alt,
      caption: img.image_caption,
      type: img.image_type,
      width: img.width || undefined,
      height: img.height || undefined
    }))
  } catch (error) {
    console.error('Error fetching tour images:', error)
    return []
  }
}

export function mapToTourCard(row: any): TourCardDTO {
  // Parse price from string format (e.g., "€45-80")
  let priceMin = null
  let priceMax = null
  if (row.price) {
    const priceMatch = row.price.match(/[€$£]?(\d+)(?:-(\d+))?/)
    if (priceMatch) {
      priceMin = parseInt(priceMatch[1])
      priceMax = priceMatch[2] ? parseInt(priceMatch[2]) : priceMin
    }
  }

  // Parse duration from string format (e.g., "Half/Full day", "3 days")
  let durationDays = null
  let durationDisplay = row.duration
  if (row.duration) {
    const dayMatch = row.duration.match(/(\d+)\s*day/i)
    if (dayMatch) {
      durationDays = parseInt(dayMatch[1])
    } else if (row.duration.toLowerCase().includes('half')) {
      durationDays = 0.5
      durationDisplay = 'Half Day'
    } else if (row.duration.toLowerCase().includes('full')) {
      durationDays = 1
      durationDisplay = 'Full Day'
    }
  }

  return {
    id: row.id,
    slug: row.slug,
    title: row.ai_enhanced_title || row.title,
    shortDescription: row.ai_enhanced_description || row.short_description,
    priceMin,
    priceMax,
    currency: 'EUR',
    durationDays,
    durationDisplay,
    difficulty: mapDifficulty(row.difficulty_level),
    primaryImageUrl: getImageUrl(row.primary_image),
    countries: parseLocations(row.locations),
    categorySlugs: [row.activity_type?.toLowerCase().replace(/\s+/g, '-')].filter(Boolean),
    featured: row.is_featured || false
  }
}

export async function mapToTourDetailWithImages(row: any, operator: any = null): Promise<TourDetailDTO> {
  const card = mapToTourCard(row)
  
  // Get deduplicated images from tour_images table
  const tourImages = await getTourImages(row.slug)
  
  // If we have images from the new system, use those
  let allImages: Array<{ url: string; alt: string | null; width?: number; height?: number }>
  
  if (tourImages.length > 0) {
    // Use deduplicated images from database
    allImages = tourImages.map(img => ({
      url: img.url,
      alt: img.alt || row.title,
      width: img.width,
      height: img.height
    }))
  } else {
    // Fallback to old system if no scraped images yet
    const galleryImages = parseJsonArray(row.image_gallery).map((url: string) => ({
      url: getImageUrl(url),
      alt: row.title,
      width: undefined,
      height: undefined
    }))

    // Combine primary image with gallery
    allImages = row.primary_image ? 
      [{ url: getImageUrl(row.primary_image), alt: row.title }].concat(galleryImages) : 
      galleryImages
  }
  
  // Ensure we have at least one image
  if (allImages.length === 0) {
    allImages = [{ url: '/placeholder.jpg', alt: 'Tour' }]
  }

  return {
    ...card,
    fullDescription: row.full_description,
    inclusions: parseJsonArray(row.inclusions),
    exclusions: parseJsonArray(row.exclusions),
    departureNotes: row.starting_point || row.ending_point,
    images: allImages,
    operator: {
      id: row.source_provider || 'partner',
      name: row.source_provider || 'Partner',
      slug: row.source_provider || 'partner',
      logoUrl: null
    },
    affiliateUrl: row.affiliate_url || row.source_url || ''
  }
}

// Keep the original synchronous version for backward compatibility
export function mapToTourDetail(row: any, images: any[] = [], operator: any = null): TourDetailDTO {
  const card = mapToTourCard(row)
  
  // Parse image gallery from the old system
  const galleryImages = parseJsonArray(row.image_gallery).map((url: string) => ({
    url: getImageUrl(url),
    alt: row.title,
    width: undefined,
    height: undefined
  }))

  // Combine primary image with gallery
  const allImages = row.primary_image ? 
    [{ url: getImageUrl(row.primary_image), alt: row.title }].concat(galleryImages) : 
    galleryImages

  return {
    ...card,
    fullDescription: row.full_description,
    inclusions: parseJsonArray(row.inclusions),
    exclusions: parseJsonArray(row.exclusions),
    departureNotes: row.starting_point || row.ending_point,
    images: allImages.length > 0 ? allImages : [{ url: '/placeholder.jpg', alt: 'Tour' }],
    operator: {
      id: row.source_provider || 'partner',
      name: row.source_provider || 'Partner',
      slug: row.source_provider || 'partner',
      logoUrl: null
    },
    affiliateUrl: row.affiliate_url || row.source_url || ''
  }
}

function getImageUrl(path: string | null): string {
  if (!path) return '/placeholder.jpg'
  if (path.startsWith('http')) return path
  if (path.startsWith('/')) return path
  // For Supabase storage paths
  return `https://mioqyazjthmrmgsbsvfg.supabase.co/storage/v1/object/public/tour-images/${path}`
}

function parseJsonArray(value: any): string[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return value.split(',').map(s => s.trim()).filter(Boolean)
    }
  }
  return []
}

function mapDifficulty(level: string | null): 'easy' | 'moderate' | 'challenging' | 'difficult' | null {
  if (!level) return null
  const normalized = level.toLowerCase()
  if (normalized.includes('easy')) return 'easy'
  if (normalized.includes('moderate')) return 'moderate'
  if (normalized.includes('challenging')) return 'challenging'
  if (normalized.includes('difficult')) return 'difficult'
  return 'moderate'
}

function parseLocations(locations: any): string[] {
  if (!locations) return ['Albania']
  const parsed = parseJsonArray(locations)
  return parsed.length > 0 ? parsed : ['Albania']
}