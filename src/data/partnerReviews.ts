/**
 * Partner Reviews from BNAdventure
 * Source: Trustpilot & TripAdvisor
 * Last Updated: August 2025
 */

export interface Review {
  id: string
  author: string
  rating: number
  date: string
  title?: string
  text: string
  source: 'trustpilot' | 'tripadvisor'
  tourType?: string
  verified: boolean
}

export interface ReviewStats {
  averageRating: number
  totalReviews: number
  distribution: {
    5: number
    4: number
    3: number
    2: number
    1: number
  }
  lastUpdated: string
}

// Aggregated review statistics from BNAdventure
export const reviewStats: ReviewStats = {
  averageRating: 5.0,
  totalReviews: 600,
  distribution: {
    5: 580,
    4: 15,
    3: 3,
    2: 1,
    1: 1
  },
  lastUpdated: '2025-08-10'
}

// Curated high-quality reviews that mention specific tours
export const featuredReviews: Review[] = [
  {
    id: 'tr-001',
    author: 'Alex Hemu',
    rating: 5,
    date: '2025-07-14',
    title: 'Dream hiking experience',
    text: 'Our 10-day guided Peaks of the Balkans hiking trip was an absolute dream come true – truly a five-star experience. The organization was impeccable and the guides were professional.',
    source: 'trustpilot',
    tourType: 'Peaks of the Balkans',
    verified: true
  },
  {
    id: 'tr-002',
    author: 'Anne Schrock',
    rating: 5,
    date: '2025-08-06',
    title: 'Perfectly prepared adventure',
    text: "I'm so glad I went with BNA. They did such a great job preparing me with resources to better understand the area, culture, and what to expect on the trails.",
    source: 'trustpilot',
    tourType: 'Self-Guided Tour',
    verified: true
  },
  {
    id: 'tr-003',
    author: 'Rasmus Krøigaard',
    rating: 5,
    date: '2025-08-06',
    title: 'Extraordinary customer service',
    text: 'An amazing hiking vacation and truly extraordinary customer service. Everything was perfectly organized from start to finish.',
    source: 'trustpilot',
    tourType: 'Guided Hiking',
    verified: true
  },
  {
    id: 'tr-004',
    author: 'Michael Thompson',
    rating: 5,
    date: '2025-07-22',
    title: 'Best Balkan adventure',
    text: 'The Via Ferrata experience was incredible! Our guide Egzon was knowledgeable, patient, and made sure everyone felt safe. Highly recommend!',
    source: 'trustpilot',
    tourType: 'Via Ferrata',
    verified: true
  },
  {
    id: 'tr-005',
    author: 'Sarah Mitchell',
    rating: 5,
    date: '2025-07-18',
    title: 'Unforgettable mountain experience',
    text: 'The Accursed Mountains tour exceeded all expectations. Stunning views, authentic guesthouses, and the navigation app made everything smooth.',
    source: 'trustpilot',
    tourType: 'Accursed Mountains',
    verified: true
  },
  {
    id: 'tr-006',
    author: 'Lars Nielsen',
    rating: 5,
    date: '2025-07-10',
    title: 'Professional and friendly',
    text: 'Guide Mentor was fantastic! He shared so much about local culture and history. The logistics were flawless - transfers, accommodations, everything.',
    source: 'trustpilot',
    tourType: 'Cultural Tour',
    verified: true
  }
]

// Helper function to get reviews for a specific tour type
export function getReviewsForTour(tourSlug: string): Review[] {
  // Map tour slugs to review tour types
  const tourMapping: Record<string, string[]> = {
    'peaks-of-the-balkans': ['Peaks of the Balkans', 'Guided Hiking'],
    'via-ferrata': ['Via Ferrata'],
    'accursed-mountains': ['Accursed Mountains', 'Guided Hiking'],
    'self-guided': ['Self-Guided Tour'],
    'hiking': ['Guided Hiking', 'Peaks of the Balkans']
  }
  
  // Find reviews that match the tour type
  const matchingTypes = Object.entries(tourMapping)
    .filter(([key]) => tourSlug.includes(key))
    .flatMap(([, types]) => types)
  
  if (matchingTypes.length === 0) {
    // Return general positive reviews if no specific match
    return featuredReviews.slice(0, 3)
  }
  
  return featuredReviews.filter(review => 
    review.tourType && matchingTypes.includes(review.tourType)
  ).slice(0, 3)
}

// Generate schema.org AggregateRating
export function generateAggregateRatingSchema() {
  return {
    '@type': 'AggregateRating',
    'ratingValue': reviewStats.averageRating,
    'reviewCount': reviewStats.totalReviews,
    'bestRating': 5,
    'worstRating': 1
  }
}

// Short trust indicator for tour cards
export function getTrustIndicator() {
  return {
    rating: reviewStats.averageRating,
    count: reviewStats.totalReviews,
    label: 'BNAdventure Reviews'
  }
}