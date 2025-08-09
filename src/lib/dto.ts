export type Difficulty = 'easy' | 'moderate' | 'challenging' | 'difficult'
export type Currency = 'EUR' | 'USD' | 'GBP'

export interface TourCardDTO {
  id: string
  slug: string
  title: string
  shortDescription: string | null
  priceMin: number | null
  priceMax: number | null
  currency: Currency
  durationDays: number | null
  durationDisplay: string | null
  difficulty: Difficulty | null
  primaryImageUrl: string
  countries: string[]
  categorySlugs: string[]
  featured: boolean
}

export interface TourDetailDTO extends TourCardDTO {
  fullDescription: string | null
  inclusions: string[]
  exclusions: string[]
  departureNotes: string | null
  images: {
    url: string
    alt: string | null
    width?: number
    height?: number
  }[]
  operator: {
    id: string
    name: string
    slug: string
    logoUrl?: string | null
  } | null
  affiliateUrl: string
}

export interface TourFilters {
  country?: string
  category?: string
  difficulty?: Difficulty
  priceMin?: number
  priceMax?: number
  durationMin?: number
  durationMax?: number
  featured?: boolean
}

export interface PaginationParams {
  page: number
  limit: number
  sort?: 'price' | 'duration' | 'newest' | 'popular'
}

export interface PaginatedResponse<T> {
  items: T[]
  pagination: {
    page: number
    limit: number
    total: number
    totalPages: number
  }
}