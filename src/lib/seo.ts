import type { TourDetailDTO } from './dto'

export function generateTouristTripSchema(tour: TourDetailDTO, url: string) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristTrip',
    name: tour.title,
    description: tour.shortDescription || tour.fullDescription,
    url,
    image: tour.primaryImageUrl,
    touristType: tour.difficulty ? `${tour.difficulty} level` : undefined,
    itinerary: {
      '@type': 'ItemList',
      numberOfItems: tour.durationDays || undefined
    },
    offers: tour.priceMin ? {
      '@type': 'Offer',
      price: tour.priceMin,
      priceCurrency: tour.currency,
      availability: 'https://schema.org/InStock',
      url
    } : undefined,
    provider: tour.operator ? {
      '@type': 'Organization',
      name: tour.operator.name,
      url: tour.affiliateUrl
    } : undefined
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      item: item.url
    }))
  }
}

export function generateOrganizationSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'Organization',
    name: 'AlbaniaVisit Tours',
    url: 'https://tours.albaniavisit.com',
    logo: 'https://tours.albaniavisit.com/logo.png',
    sameAs: [
      'https://www.facebook.com/albaniavisit',
      'https://www.instagram.com/albaniavisit',
      'https://twitter.com/albaniavisit'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'tours@albaniavisit.com'
    }
  }
}

export function generateMetaTags(tour: TourDetailDTO) {
  const title = tour.priceMin 
    ? `${tour.title} | ${tour.durationDays || ''} Days | From €${tour.priceMin}`
    : `${tour.title} | ${tour.durationDays || ''} Days`
  
  const description = tour.shortDescription?.slice(0, 155) || 
    tour.fullDescription?.slice(0, 155) || 
    `Discover ${tour.title} with AlbaniaVisit Tours`

  return {
    title: title.replace(/\s+/g, ' ').trim(),
    description: description.replace(/\s+/g, ' ').trim(),
    ogImage: tour.primaryImageUrl,
    ogType: 'product'
  }
}