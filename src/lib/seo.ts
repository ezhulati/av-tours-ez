import type { TourDetailDTO } from './dto'
import { reviewStats } from '@/data/partnerReviews'

export function generateTouristTripSchema(tour: TourDetailDTO, url: string, includeRatings = true) {
  const images = tour.images?.map(img => img.url) || [tour.primaryImageUrl]
  
  return {
    '@context': 'https://schema.org',
    '@type': 'Product',
    '@id': `${url}#product`,
    name: tour.title,
    description: tour.shortDescription || tour.fullDescription,
    url,
    image: images,
    brand: {
      '@type': 'Organization',
      name: 'AlbaniaVisit'
    },
    category: 'Tour Package',
    offers: tour.priceMin ? {
      '@type': 'AggregateOffer',
      lowPrice: tour.priceMin,
      highPrice: tour.priceMax || tour.priceMin,
      priceCurrency: tour.currency || 'EUR',
      offerCount: 1,
      availability: 'https://schema.org/InStock',
      url: tour.affiliateUrl || url,
      validFrom: new Date().toISOString(),
      seller: {
        '@type': 'Organization',
        name: tour.operator?.name || 'BNAdventure',
        url: tour.affiliateUrl
      }
    } : undefined,
    aggregateRating: includeRatings ? {
      '@type': 'AggregateRating',
      ratingValue: reviewStats.averageRating.toFixed(1),
      reviewCount: reviewStats.totalReviews,
      bestRating: '5',
      worstRating: '1'
    } : undefined,
    additionalProperty: [
      {
        '@type': 'PropertyValue',
        name: 'Duration',
        value: tour.durationDays ? `${tour.durationDays} days` : 'Variable'
      },
      {
        '@type': 'PropertyValue',
        name: 'Difficulty Level',
        value: tour.difficulty || 'Moderate'
      },
      {
        '@type': 'PropertyValue',
        name: 'Group Size',
        value: `${tour.groupSize?.min || 2}-${tour.groupSize?.max || 12} people`
      },
      {
        '@type': 'PropertyValue',
        name: 'Countries',
        value: tour.countries?.join(', ') || 'Albania'
      },
      {
        '@type': 'PropertyValue',
        name: 'Activity Type',
        value: tour.categories?.join(', ') || 'Adventure Tour'
      }
    ]
  }
}

export function generateBreadcrumbSchema(items: { name: string; url: string }[]) {
  // Generate @id from the last item's URL (current page)
  const currentPageUrl = items[items.length - 1]?.url || 'https://tours.albaniavisit.com'
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    '@id': `${currentPageUrl}#breadcrumb`,
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
    '@type': 'TravelAgency',
    '@id': 'https://tours.albaniavisit.com/#organization',
    name: 'AlbaniaVisit',
    alternateName: 'Albania Visit Tours',
    url: 'https://tours.albaniavisit.com',
    logo: {
      '@type': 'ImageObject',
      url: 'https://tours.albaniavisit.com/logo.png',
      width: 200,
      height: 200
    },
    image: 'https://tours.albaniavisit.com/Assets/Albania/Albanian_Alps.jpg',
    description: 'Premium mountain tour operator connecting adventurers with authentic experiences across Albania, Kosovo, Montenegro, and North Macedonia.',
    foundingDate: '2020',
    areaServed: [
      {
        '@type': 'Country',
        name: 'Albania'
      },
      {
        '@type': 'Country',
        name: 'Kosovo'
      },
      {
        '@type': 'Country',
        name: 'Montenegro'
      },
      {
        '@type': 'Country',
        name: 'North Macedonia'
      }
    ],
    sameAs: [
      'https://www.facebook.com/AlbaniaVisitOfficial/',
      'https://www.instagram.com/albania_visit_/',
      'https://www.youtube.com/@Albania-Visit',
      'https://www.linkedin.com/company/albania-visit/',
      'https://albaniavisit.com'
    ],
    contactPoint: {
      '@type': 'ContactPoint',
      contactType: 'customer service',
      email: 'info@albaniavisit.com',
      availableLanguage: ['English', 'Albanian'],
      areaServed: 'Worldwide'
    },
    aggregateRating: {
      '@type': 'AggregateRating',
      ratingValue: '4.9',
      reviewCount: '2000',
      bestRating: '5',
      worstRating: '1'
    }
  }
}

export function generateWebSiteSchema() {
  return {
    '@context': 'https://schema.org',
    '@type': 'WebSite',
    '@id': 'https://tours.albaniavisit.com/#website',
    url: 'https://tours.albaniavisit.com',
    name: 'AlbaniaVisit Tours',
    description: 'Discover authentic mountain adventures across Albania and the Balkans',
    publisher: {
      '@id': 'https://tours.albaniavisit.com/#organization'
    },
    potentialAction: {
      '@type': 'SearchAction',
      target: {
        '@type': 'EntryPoint',
        urlTemplate: 'https://tours.albaniavisit.com/tours?search={search_term_string}'
      },
      'query-input': 'required name=search_term_string'
    },
    inLanguage: 'en-US'
  }
}

export function generateCollectionPageSchema(
  title: string,
  description: string,
  tours: any[],
  pageUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    '@id': pageUrl,
    name: title,
    description: description,
    url: pageUrl,
    isPartOf: {
      '@id': 'https://tours.albaniavisit.com/#website'
    },
    // Removed breadcrumb reference - using separate BreadcrumbList schema instead
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: tours.length,
      itemListElement: tours.map((tour, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        item: {
          '@type': 'TouristTrip',
          name: tour.title,
          description: tour.shortDescription,
          image: tour.primaryImageUrl,
          url: `https://tours.albaniavisit.com/tours/${tour.slug}`,
          offers: tour.priceMin ? {
            '@type': 'Offer',
            price: tour.priceMin,
            priceCurrency: 'EUR',
            availability: 'https://schema.org/InStock'
          } : undefined
        }
      }))
    }
  }
}

export function generateDestinationSchema(
  countryName: string,
  description: string,
  tours: any[],
  pageUrl: string
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'TouristDestination',
    '@id': `${pageUrl}#destination`,
    name: countryName,
    description: description,
    url: pageUrl,
    image: `https://tours.albaniavisit.com/Assets/${countryName.replace(' ', '%20')}/hero.jpg`,
    geo: getCountryGeoData(countryName),
    containsPlace: tours.map(tour => ({
      '@type': 'TouristAttraction',
      name: tour.title,
      description: tour.shortDescription,
      url: `https://tours.albaniavisit.com/tours/${tour.slug}`
    }))
  }
}

function getCountryGeoData(country: string) {
  const geoData: Record<string, any> = {
    'Albania': {
      '@type': 'GeoCoordinates',
      latitude: 41.1533,
      longitude: 20.1683
    },
    'Kosovo': {
      '@type': 'GeoCoordinates',
      latitude: 42.6026,
      longitude: 20.9030
    },
    'Montenegro': {
      '@type': 'GeoCoordinates',
      latitude: 42.7087,
      longitude: 19.3744
    },
    'North Macedonia': {
      '@type': 'GeoCoordinates',
      latitude: 41.6086,
      longitude: 21.7453
    }
  }
  return geoData[country] || null
}

export function generateFAQSchema(faqs: { question: string; answer: string }[]) {
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