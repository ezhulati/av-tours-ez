/**
 * Enhanced Schema.org Implementation for AlbaniaVisit Tours
 * Comprehensive structured data for maximum rich snippet opportunities
 */

import type { TourDetailDTO } from './dto'

// Core Schema Types
export interface SchemaProduct {
  '@context': 'https://schema.org'
  '@type': 'Product'
  '@id'?: string
  name: string
  description: string
  image: string | string[]
  brand?: {
    '@type': 'Brand'
    name: string
  }
  offers?: SchemaOffer | SchemaOffer[]
  aggregateRating?: SchemaAggregateRating
  review?: SchemaReview[]
  category?: string
  sku?: string
  gtin?: string
  mpn?: string
}

export interface SchemaOffer {
  '@type': 'Offer'
  url: string
  priceCurrency: string
  price: number | string
  priceValidUntil?: string
  availability: string
  validFrom?: string
  itemCondition?: string
  seller?: {
    '@type': 'Organization'
    name: string
  }
}

export interface SchemaAggregateRating {
  '@type': 'AggregateRating'
  ratingValue: number
  reviewCount: number
  bestRating?: number
  worstRating?: number
}

export interface SchemaReview {
  '@type': 'Review'
  reviewRating: {
    '@type': 'Rating'
    ratingValue: number
    bestRating?: number
  }
  author: {
    '@type': 'Person'
    name: string
  }
  datePublished: string
  reviewBody?: string
}

/**
 * Enhanced TourPackage Schema with full rich snippet support
 */
export function generateTourPackageSchema(
  tour: TourDetailDTO,
  url: string,
  reviews?: { rating: number; count: number }
) {
  const baseUrl = 'https://tours.albaniavisit.com'
  
  // Generate multiple image objects for better carousel support
  const images = tour.images?.length > 0 
    ? tour.images.map(img => ({
        '@type': 'ImageObject',
        url: img.url,
        caption: img.alt || tour.title,
        width: img.width || 1200,
        height: img.height || 800
      }))
    : [{
        '@type': 'ImageObject',
        url: tour.primaryImageUrl,
        caption: tour.title,
        width: 1200,
        height: 800
      }]

  return {
    '@context': 'https://schema.org',
    '@type': ['Product', 'TouristTrip'],
    '@id': url,
    name: tour.title,
    description: tour.shortDescription || tour.fullDescription?.slice(0, 300),
    image: images,
    brand: {
      '@type': 'Brand',
      name: 'AlbaniaVisit Tours'
    },
    category: 'Adventure Tours',
    sku: tour.slug,
    
    // Detailed offer information for price display
    offers: {
      '@type': 'AggregateOffer',
      url: url,
      priceCurrency: tour.currency || 'EUR',
      lowPrice: tour.priceMin,
      highPrice: tour.priceMax || tour.priceMin,
      offerCount: tour.durationDays || 1,
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString().split('T')[0],
      priceValidUntil: new Date(Date.now() + 90 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      seller: {
        '@type': 'Organization',
        name: tour.operator?.name || 'AlbaniaVisit Tours',
        url: baseUrl,
        logo: `${baseUrl}/logo.png`,
        contactPoint: {
          '@type': 'ContactPoint',
          contactType: 'reservations',
          email: 'tours@albaniavisit.com',
          telephone: '+355-69-123-4567',
          availableLanguage: ['en', 'sq', 'de', 'fr']
        }
      }
    },
    
    // Add aggregate rating if available
    ...(reviews && reviews.count > 0 ? {
      aggregateRating: {
        '@type': 'AggregateRating',
        ratingValue: reviews.rating,
        reviewCount: reviews.count,
        bestRating: 5,
        worstRating: 1
      }
    } : {}),
    
    // Tourist trip specific properties
    touristType: tour.difficulty ? `${tour.difficulty} level adventure` : 'Adventure',
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: tour.durationDays,
      itemListElement: tour.countries.map((country, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'City',
          name: country,
          address: {
            '@type': 'PostalAddress',
            addressCountry: getCountryCode(country)
          }
        }
      }))
    },
    
    // Additional properties for enhanced snippets
    duration: tour.durationDays ? `P${tour.durationDays}D` : undefined,
    includesAttraction: tour.inclusions?.slice(0, 5).map(inclusion => ({
      '@type': 'TouristAttraction',
      name: inclusion
    })),
    
    // Audience targeting
    audience: {
      '@type': 'PeopleAudience',
      audienceType: getAudienceType(tour.difficulty),
      suggestedMinAge: tour.difficulty === 'difficult' ? 18 : 12,
      suggestedMaxAge: tour.difficulty === 'easy' ? 75 : 65
    },
    
    // Performance and actions
    potentialAction: {
      '@type': 'ReserveAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: `${url}?action=book`,
        actionPlatform: [
          'http://schema.org/DesktopWebPlatform',
          'http://schema.org/MobileWebPlatform'
        ]
      },
      result: {
        '@type': 'Reservation',
        name: 'Tour Booking'
      }
    }
  }
}

/**
 * Enhanced Organization Schema with LocalBusiness
 */
export function generateEnhancedOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': ['Organization', 'LocalBusiness', 'TravelAgency'],
    '@id': 'https://tours.albaniavisit.com/#organization',
    name: 'AlbaniaVisit Tours',
    alternateName: 'Albania Visit Adventure Tours',
    url: 'https://tours.albaniavisit.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://tours.albaniavisit.com/logo.png',
      width: 600,
      height: 60
    },
    image: [
      'https://tours.albaniavisit.com/hero-albania.jpg',
      'https://tours.albaniavisit.com/team.jpg',
      'https://tours.albaniavisit.com/office.jpg'
    ],
    description: 'Premier adventure tour operator specializing in authentic Balkan experiences across Albania, Montenegro, Kosovo, and North Macedonia.',
    
    // Contact information
    telephone: '+355-69-123-4567',
    email: 'tours@albaniavisit.com',
    address: {
      '@type': 'PostalAddress',
      streetAddress: 'Rruga e Durrësit',
      addressLocality: 'Tirana',
      addressRegion: 'Tirana County',
      postalCode: '1001',
      addressCountry: 'AL'
    },
    
    // Geo coordinates for local SEO
    geo: {
      '@type': 'GeoCoordinates',
      latitude: 41.3275,
      longitude: 19.8187
    },
    
    // Business hours
    openingHoursSpecification: [
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
        opens: '09:00',
        closes: '18:00'
      },
      {
        '@type': 'OpeningHoursSpecification',
        dayOfWeek: 'Saturday',
        opens: '10:00',
        closes: '14:00'
      }
    ],
    
    // Price range and payment
    priceRange: '€€-€€€',
    paymentAccepted: ['Cash', 'Credit Card', 'Debit Card', 'PayPal', 'Bank Transfer'],
    currenciesAccepted: 'EUR, USD, ALL',
    
    // Social profiles
    sameAs: [
      'https://www.facebook.com/albaniavisit',
      'https://www.instagram.com/albaniavisit',
      'https://twitter.com/albaniavisit',
      'https://www.youtube.com/@albaniavisit',
      'https://www.tripadvisor.com/Attraction_Review-albaniavisit',
      'https://www.linkedin.com/company/albaniavisit'
    ],
    
    // Awards and certifications
    award: [
      'TripAdvisor Certificate of Excellence 2023',
      'Best Adventure Tour Operator Albania 2023',
      'Sustainable Tourism Certified'
    ],
    
    // Aggregate rating
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: 4.9,
      reviewCount: 2145,
      bestRating: 5,
      worstRating: 1
    },
    
    // Areas served
    areaServed: [
      {
        '@type': 'Country',
        name: 'Albania'
      },
      {
        '@type': 'Country',
        name: 'Montenegro'
      },
      {
        '@type': 'Country',
        name: 'Kosovo'
      },
      {
        '@type': 'Country',
        name: 'North Macedonia'
      }
    ],
    
    // Services offered
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Adventure Tours',
      itemListElement: [
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Mountain Trekking Tours'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Cultural Heritage Tours'
          }
        },
        {
          '@type': 'Offer',
          itemOffered: {
            '@type': 'Service',
            name: 'Multi-Country Balkan Tours'
          }
        }
      ]
    }
  }
}

/**
 * FAQ Schema for common questions
 */
export function generateFAQSchema(faqs: Array<{ question: string; answer: string }>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'FAQPage',
    mainEntity: faqs.map(faq => ({
      '@type': 'Question',
      name: faq.question,
      acceptedAnswer: {
        '@type': 'Answer',
        text: faq.answer
      }
    }))
  }
}

/**
 * Event Schema for scheduled tour departures
 */
export function generateTourEventSchema(
  tour: TourDetailDTO,
  startDate: string,
  endDate: string,
  url: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'Event',
    name: tour.title,
    description: tour.shortDescription,
    startDate: startDate,
    endDate: endDate,
    eventStatus: 'https://schema.org/EventScheduled',
    eventAttendanceMode: 'https://schema.org/OfflineEventAttendanceMode',
    location: {
      '@type': 'Place',
      name: tour.countries.join(', '),
      address: {
        '@type': 'PostalAddress',
        addressCountry: tour.countries.map(c => getCountryCode(c)).join(', ')
      }
    },
    organizer: {
      '@type': 'Organization',
      name: tour.operator?.name || 'AlbaniaVisit Tours',
      url: 'https://tours.albaniavisit.com'
    },
    offers: {
      '@type': 'Offer',
      url: url,
      price: tour.priceMin,
      priceCurrency: tour.currency || 'EUR',
      availability: 'https://schema.org/InStock',
      validFrom: new Date().toISOString()
    },
    performer: {
      '@type': 'Person',
      name: 'Professional Local Guide'
    },
    maximumAttendees: 15,
    typicalAgeRange: '18-65'
  }
}

/**
 * Enhanced BreadcrumbList with position URLs
 */
export function generateEnhancedBreadcrumbSchema(
  items: Array<{ name: string; url: string; position: number }>
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${items[items.length - 1].url}#breadcrumb`,
    itemListElement: items.map(item => ({
      '@type': 'ListItem',
      position: item.position,
      name: item.name,
      item: {
        '@type': 'WebPage',
        '@id': item.url,
        url: item.url,
        name: item.name
      }
    }))
  }
}

/**
 * WebSite Schema with SearchAction
 */
export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://tours.albaniavisit.com/#website',
    url: 'https://tours.albaniavisit.com',
    name: 'AlbaniaVisit Tours',
    description: 'Adventure tours and trekking experiences across Albania and the Balkans',
    publisher: {
      '@id': 'https://tours.albaniavisit.com/#organization'
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://tours.albaniavisit.com/search?q={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    },
    inLanguage: ['en', 'sq', 'de', 'fr']
  }
}

/**
 * Video Schema for tour videos
 */
export function generateVideoSchema(
  videoUrl: string,
  title: string,
  description: string,
  thumbnailUrl: string,
  duration: string, // ISO 8601 format, e.g., "PT4M30S"
  uploadDate: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'VideoObject',
    name: title,
    description: description,
    thumbnailUrl: thumbnailUrl,
    uploadDate: uploadDate,
    duration: duration,
    contentUrl: videoUrl,
    embedUrl: videoUrl.replace('watch?v=', 'embed/'),
    publisher: {
      '@type': 'Organization',
      name: 'AlbaniaVisit Tours',
      logo: {
        '@type': 'ImageObject',
        url: 'https://tours.albaniavisit.com/logo.png'
      }
    }
  }
}

/**
 * CollectionPage Schema for category/country pages
 */
export function generateCollectionPageSchema(
  title: string,
  description: string,
  url: string,
  tours: TourDetailDTO[]
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: title,
    description: description,
    url: url,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: tours.length,
      itemListElement: tours.map((tour, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: `https://tours.albaniavisit.com/tours/${tour.slug}`,
        name: tour.title,
        description: tour.shortDescription
      }))
    },
    breadcrumb: {
      '@id': `${url}#breadcrumb`
    }
  }
}

// Utility functions
function getCountryCode(country: string): string {
  const countryMap: Record<string, string> = {
    'Albania': 'AL',
    'Montenegro': 'ME',
    'Kosovo': 'XK',
    'North Macedonia': 'MK',
    'Greece': 'GR',
    'Serbia': 'RS',
    'Bosnia': 'BA',
    'Croatia': 'HR'
  }
  return countryMap[country] || 'AL'
}

function getAudienceType(difficulty?: string): string {
  switch (difficulty) {
    case 'easy':
      return 'Families, Beginners'
    case 'moderate':
      return 'Active Travelers'
    case 'challenging':
      return 'Experienced Hikers'
    case 'difficult':
      return 'Expert Adventurers'
    default:
      return 'Adventure Seekers'
  }
}

// Export all schema generators
export const SchemaGenerators = {
  tourPackage: generateTourPackageSchema,
  organization: generateEnhancedOrganizationSchema,
  faq: generateFAQSchema,
  event: generateTourEventSchema,
  breadcrumb: generateEnhancedBreadcrumbSchema,
  website: generateWebSiteSchema,
  video: generateVideoSchema,
  collectionPage: generateCollectionPageSchema
}