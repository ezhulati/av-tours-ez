import type { TourCardDTO, TourDetailDTO } from '../dto'

export const TABLES = {
  tours: 'affiliate_tours',
  images: 'tour_images',
  categories: 'tour_categories',
  countries: 'tour_countries',
  operators: 'tour_operators',
  clicks: 'affiliate_clicks',
  inquiries: 'inquiries'
}

export function mapToTourCard(row: any): TourCardDTO {
  return {
    id: row.id,
    slug: row.slug,
    title: row.title,
    shortDescription: row.short_description,
    priceMin: row.price_min,
    priceMax: row.price_max,
    currency: row.currency || 'EUR',
    durationDays: row.duration_days,
    durationDisplay: row.duration_display || (row.duration_days ? `${row.duration_days} Days` : null),
    difficulty: row.difficulty,
    primaryImageUrl: row.primary_image_url || getImageUrl(row.primary_image_path),
    countries: row.countries || [],
    categorySlugs: row.category_slugs || [],
    featured: row.featured || false
  }
}

export function mapToTourDetail(row: any, images: any[], operator: any): TourDetailDTO {
  const card = mapToTourCard(row)
  
  return {
    ...card,
    fullDescription: row.full_description,
    inclusions: parseJsonArray(row.inclusions),
    exclusions: parseJsonArray(row.exclusions),
    departureNotes: row.departure_notes,
    images: images.map(img => ({
      url: img.url || getImageUrl(img.path),
      alt: img.alt || img.caption,
      width: img.width,
      height: img.height
    })),
    operator: operator ? {
      id: operator.id,
      name: operator.name,
      slug: operator.slug,
      logoUrl: operator.logo_url
    } : null,
    affiliateUrl: row.affiliate_url || ''
  }
}

function getImageUrl(path: string | null): string {
  if (!path) return '/placeholder.jpg'
  if (path.startsWith('http')) return path
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