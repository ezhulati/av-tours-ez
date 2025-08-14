/**
 * Programmatic SEO Configuration for Filtered Tour Pages
 * 
 * This system creates SEO-friendly URLs for high-value filter combinations,
 * similar to how Booking.com, Expedia, and Kayak handle faceted navigation.
 * 
 * We focus on combinations with actual search volume instead of creating
 * pages for every possible filter combination.
 */

export interface SEORoute {
  pattern: string
  title: string
  metaTitle: string
  metaDescription: string
  h1: string
  introText?: string
  filters: {
    country?: string
    difficulty?: string
    category?: string
    priceRange?: 'budget' | 'mid' | 'premium'
    duration?: 'weekend' | 'week' | 'extended'
  }
  priority: number // For sitemap
  changefreq: 'daily' | 'weekly' | 'monthly'
}

// High-value SEO routes based on search volume analysis
export const SEO_ROUTES: Record<string, SEORoute> = {
  // Country-specific pages (highest search volume)
  'albania-tours': {
    pattern: '/tours/filter/albania',
    title: 'Albania Tours',
    metaTitle: 'Albania Tours 2025 | Hiking, Culture & Adventure Tours',
    metaDescription: 'Explore Albania with our handpicked tours. From Albanian Alps hiking to Riviera beaches, discover authentic adventures with local guides. Best prices guaranteed.',
    h1: 'Albania Tours & Adventures',
    introText: 'Discover the Land of Eagles with our carefully selected Albania tours. From the dramatic peaks of the Albanian Alps to the turquoise waters of the Riviera, experience authentic adventures led by local experts.',
    filters: { country: 'Albania' },
    priority: 0.9,
    changefreq: 'weekly'
  },
  
  'kosovo-tours': {
    pattern: '/tours/kosovo',
    title: 'Kosovo Tours',
    metaTitle: 'Kosovo Tours 2025 | Hiking, Cultural & Adventure Experiences',
    metaDescription: 'Discover Kosovo\'s hidden gems with expert-led tours. Explore Rugova Valley, Sharr Mountains, and vibrant Pristina. Small groups, authentic experiences.',
    h1: 'Kosovo Tours & Adventures',
    introText: 'Experience Europe\'s youngest country through our expertly curated Kosovo tours. From the peaks of Sharr Mountains to the cultural treasures of Pristina, discover a land of warm hospitality and untouched nature.',
    filters: { country: 'Kosovo' },
    priority: 0.9,
    changefreq: 'weekly'
  },
  
  'montenegro-tours': {
    pattern: '/tours/montenegro',
    title: 'Montenegro Tours',
    metaTitle: 'Montenegro Tours 2025 | Mountain, Coast & Adventure Tours',
    metaDescription: 'Book Montenegro tours: Durmitor hiking, Bay of Kotor, Tara rafting. Small group adventures with expert local guides. Compare prices & book online.',
    h1: 'Montenegro Tours & Adventures',
    introText: 'Explore Montenegro\'s dramatic landscapes from mountain to sea. Our tours showcase the best of Durmitor National Park, the stunning Bay of Kotor, and hidden coastal gems.',
    filters: { country: 'Montenegro' },
    priority: 0.9,
    changefreq: 'weekly'
  },
  
  'north-macedonia-tours': {
    pattern: '/tours/north-macedonia',
    title: 'North Macedonia Tours',
    metaTitle: 'North Macedonia Tours 2025 | Hiking, Culture & Wine Tours',
    metaDescription: 'Explore North Macedonia with guided tours. Lake Ohrid, Mavrovo hiking, Skopje culture tours. Authentic Balkan experiences with local guides.',
    h1: 'North Macedonia Tours',
    introText: 'Journey through North Macedonia\'s rich tapestry of history and nature. From the ancient shores of Lake Ohrid to the peaks of Mavrovo, discover a land where East meets West.',
    filters: { country: 'North Macedonia' },
    priority: 0.9,
    changefreq: 'weekly'
  },

  // Country + Activity combinations (high search volume)
  'albania-hiking-tours': {
    pattern: '/tours/albania/hiking',
    title: 'Albania Hiking Tours',
    metaTitle: 'Albania Hiking Tours 2025 | Albanian Alps, Valbona & Theth Treks',
    metaDescription: 'Best Albania hiking tours: Valbona to Theth trek, Albanian Alps circuits, coastal trails. Expert guides, all levels. Book your mountain adventure.',
    h1: 'Albania Hiking & Trekking Tours',
    introText: 'Trek through Albania\'s spectacular mountain landscapes. From the famous Valbona to Theth trail to multi-day Albanian Alps circuits, find your perfect hiking adventure.',
    filters: { country: 'Albania', category: 'hiking' },
    priority: 0.85,
    changefreq: 'weekly'
  },

  'kosovo-hiking-tours': {
    pattern: '/tours/kosovo/hiking',
    title: 'Kosovo Hiking Tours',
    metaTitle: 'Kosovo Hiking Tours | Rugova Valley & Sharr Mountain Treks',
    metaDescription: 'Discover Kosovo hiking: Rugova Valley trails, Sharr Mountains peaks, Via Dinarica routes. Small groups, expert guides, authentic mountain experiences.',
    h1: 'Kosovo Hiking & Mountain Tours',
    introText: 'Explore Kosovo\'s pristine mountain trails. From day hikes in Rugova Valley to challenging peaks in the Sharr Mountains, experience the Balkans\' best-kept hiking secret.',
    filters: { country: 'Kosovo', category: 'hiking' },
    priority: 0.85,
    changefreq: 'weekly'
  },

  'montenegro-hiking-tours': {
    pattern: '/tours/montenegro/hiking',
    title: 'Montenegro Hiking Tours',
    metaTitle: 'Montenegro Hiking Tours | Durmitor, Prokletije & Coastal Trails',
    metaDescription: 'Montenegro hiking adventures: Durmitor peaks, Prokletije wilderness, coastal paths. All levels welcome. Expert guides, small groups, unforgettable views.',
    h1: 'Montenegro Hiking Adventures',
    introText: 'Hike Montenegro\'s diverse landscapes from Durmitor\'s glacial lakes to Prokletije\'s wild peaks and the stunning coastal mountains above the Adriatic.',
    filters: { country: 'Montenegro', category: 'hiking' },
    priority: 0.85,
    changefreq: 'weekly'
  },

  // Difficulty-based pages (good for beginners/families)
  'easy-tours': {
    pattern: '/tours/easy',
    title: 'Easy Tours',
    metaTitle: 'Easy Tours in Albania & Balkans | Family-Friendly Adventures',
    metaDescription: 'Easy tours perfect for families and beginners. Gentle hikes, cultural experiences, scenic drives. No experience needed. All ages welcome.',
    h1: 'Easy & Family-Friendly Tours',
    introText: 'Perfect for families, beginners, and those seeking gentle adventures. These tours offer the beauty of the Balkans without the challenge.',
    filters: { difficulty: 'easy' },
    priority: 0.8,
    changefreq: 'weekly'
  },

  'moderate-tours': {
    pattern: '/tours/moderate',
    title: 'Moderate Tours',
    metaTitle: 'Moderate Difficulty Tours | Active Adventures in the Balkans',
    metaDescription: 'Moderate tours for active travelers. Balance of adventure and comfort. Some hiking experience helpful but not required. Perfect for most fitness levels.',
    h1: 'Moderate Adventure Tours',
    introText: 'Ideal for active travelers seeking a balance of adventure and comfort. These tours require basic fitness but reward you with incredible experiences.',
    filters: { difficulty: 'moderate' },
    priority: 0.8,
    changefreq: 'weekly'
  },

  'challenging-tours': {
    pattern: '/tours/challenging',
    title: 'Challenging Tours',
    metaTitle: 'Challenging Mountain Tours | Advanced Hiking in Albania & Balkans',
    metaDescription: 'Challenging tours for experienced hikers. Mountain peaks, multi-day treks, technical trails. Good fitness and hiking experience required.',
    h1: 'Challenging Mountain Adventures',
    introText: 'For experienced adventurers seeking to push their limits. These tours feature demanding hikes, high peaks, and remote wilderness areas.',
    filters: { difficulty: 'challenging' },
    priority: 0.8,
    changefreq: 'weekly'
  },

  // Duration-based pages
  'weekend-tours': {
    pattern: '/tours/weekend',
    title: 'Weekend Tours',
    metaTitle: 'Weekend Tours Albania & Balkans | 2-3 Day Short Breaks',
    metaDescription: 'Perfect weekend getaways in Albania and the Balkans. 2-3 day tours, city breaks, short hikes. Make the most of your long weekend.',
    h1: 'Weekend Tours & Short Breaks',
    introText: 'Make the most of your weekend with these perfectly crafted 2-3 day adventures. Ideal for quick escapes and long weekends.',
    filters: { duration: 'weekend' },
    priority: 0.75,
    changefreq: 'weekly'
  },

  'week-long-tours': {
    pattern: '/tours/week-long',
    title: 'Week-Long Tours',
    metaTitle: '7-Day Tours Albania & Balkans | One Week Adventures',
    metaDescription: 'Week-long tours across Albania and the Balkans. 6-8 day itineraries covering multiple destinations. Perfect vacation length adventures.',
    h1: 'Week-Long Adventures',
    introText: 'Our most popular tour length - one week of Balkan adventure. These 6-8 day tours offer the perfect balance of exploration and relaxation.',
    filters: { duration: 'week' },
    priority: 0.75,
    changefreq: 'weekly'
  },

  // Price-focused pages
  'budget-tours': {
    pattern: '/tours/budget',
    title: 'Budget Tours',
    metaTitle: 'Budget Tours Albania & Balkans | Affordable Adventures Under €500',
    metaDescription: 'Affordable Balkan tours under €500. Budget-friendly adventures without compromising quality. Backpacker tours, group discounts, best value guaranteed.',
    h1: 'Budget-Friendly Tours',
    introText: 'Incredible adventures that won\'t break the bank. These budget tours offer amazing value without compromising on quality or experience.',
    filters: { priceRange: 'budget' },
    priority: 0.75,
    changefreq: 'weekly'
  },

  'luxury-tours': {
    pattern: '/tours/luxury',
    title: 'Luxury Tours',
    metaTitle: 'Luxury Tours Albania & Balkans | Premium Small Group Adventures',
    metaDescription: 'Premium tours with luxury accommodation, private guides, gourmet dining. Exclusive small group experiences in Albania and the Balkans.',
    h1: 'Luxury & Premium Tours',
    introText: 'Experience the Balkans in style. Premium accommodations, private guides, gourmet cuisine, and exclusive access to the region\'s hidden gems.',
    filters: { priceRange: 'premium' },
    priority: 0.75,
    changefreq: 'weekly'
  },

  // Multi-country tours
  'balkan-tours': {
    pattern: '/tours/balkans',
    title: 'Balkan Tours',
    metaTitle: 'Balkan Tours 2025 | Multi-Country Adventures Albania Kosovo Montenegro',
    metaDescription: 'Multi-country Balkan tours covering Albania, Kosovo, Montenegro, Macedonia. Cross-border adventures, Peaks of the Balkans, Via Dinarica trails.',
    h1: 'Multi-Country Balkan Tours',
    introText: 'Cross borders and explore multiple Balkan countries in one epic adventure. From the Peaks of the Balkans to the Via Dinarica, discover the region\'s diversity.',
    filters: {}, // Will need custom logic for multi-country
    priority: 0.85,
    changefreq: 'weekly'
  },

  // Seasonal pages
  'summer-tours': {
    pattern: '/tours/summer',
    title: 'Summer Tours',
    metaTitle: 'Summer Tours Albania & Balkans 2025 | June-September Adventures',
    metaDescription: 'Best summer tours in the Balkans. High altitude hikes, coastal adventures, peak season experiences. June through September departures.',
    h1: 'Summer Tours & Adventures',
    introText: 'Make the most of summer in the Balkans. From high mountain peaks to pristine beaches, these tours showcase the region at its finest.',
    filters: {}, // Will filter by dates
    priority: 0.7,
    changefreq: 'monthly'
  },

  'winter-tours': {
    pattern: '/tours/winter',
    title: 'Winter Tours',
    metaTitle: 'Winter Tours Albania & Balkans | Ski Touring & Snowshoe Adventures',
    metaDescription: 'Winter adventures in the Balkans. Ski touring, snowshoeing, winter hiking. December through March mountain experiences.',
    h1: 'Winter Tours & Snow Adventures',
    introText: 'Discover the magic of the Balkans in winter. From ski touring in pristine powder to cozy mountain lodges, experience a different side of the region.',
    filters: {}, // Will filter by dates
    priority: 0.7,
    changefreq: 'monthly'
  },

  // Activity-specific pages
  'cultural-tours': {
    pattern: '/tours/cultural',
    title: 'Cultural Tours',
    metaTitle: 'Cultural Tours Albania & Balkans | History, Heritage & Local Life',
    metaDescription: 'Cultural tours exploring Balkan history, UNESCO sites, local traditions. City tours, archaeological sites, authentic village experiences.',
    h1: 'Cultural & Heritage Tours',
    introText: 'Immerse yourself in the rich cultural tapestry of the Balkans. From ancient ruins to living traditions, discover the stories that shaped this region.',
    filters: { category: 'cultural' },
    priority: 0.8,
    changefreq: 'weekly'
  },

  'adventure-tours': {
    pattern: '/tours/adventure',
    title: 'Adventure Tours',
    metaTitle: 'Adventure Tours Albania & Balkans | Rafting, Climbing, Extreme Sports',
    metaDescription: 'Extreme adventure tours: rafting, rock climbing, canyoning, paragliding. Adrenaline-pumping activities in Albania and the Balkans.',
    h1: 'Adventure & Adrenaline Tours',
    introText: 'Get your adrenaline pumping with our adventure tours. From white-water rafting to rock climbing, these tours are for true thrill-seekers.',
    filters: { category: 'adventure' },
    priority: 0.8,
    changefreq: 'weekly'
  }
}

// Helper to get SEO route from URL path
export function getSEORouteFromPath(path: string): SEORoute | null {
  const route = Object.values(SEO_ROUTES).find(r => r.pattern === path)
  return route || null
}

// Helper to get SEO route by key
export function getSEORoute(key: string): SEORoute | null {
  return SEO_ROUTES[key] || null
}

// Generate canonical URL
export function getCanonicalUrl(path: string, baseUrl: string = 'https://tours.albaniavisit.com'): string {
  // Remove trailing slashes and query parameters
  const cleanPath = path.split('?')[0].replace(/\/$/, '')
  return `${baseUrl}${cleanPath}`
}

// Convert filters to URL parameters
export function filtersToParams(filters: SEORoute['filters']): URLSearchParams {
  const params = new URLSearchParams()
  
  if (filters.country) params.set('country', filters.country)
  if (filters.difficulty) params.set('difficulty', filters.difficulty)
  if (filters.category) params.set('category', filters.category)
  
  // Price range mapping
  if (filters.priceRange) {
    switch (filters.priceRange) {
      case 'budget':
        params.set('price_max', '500')
        break
      case 'mid':
        params.set('price_min', '500')
        params.set('price_max', '1500')
        break
      case 'premium':
        params.set('price_min', '1500')
        break
    }
  }
  
  // Duration mapping
  if (filters.duration) {
    switch (filters.duration) {
      case 'weekend':
        params.set('duration_min', '2')
        params.set('duration_max', '3')
        break
      case 'week':
        params.set('duration_min', '6')
        params.set('duration_max', '8')
        break
      case 'extended':
        params.set('duration_min', '9')
        break
    }
  }
  
  return params
}

// Get all SEO routes for sitemap generation
export function getAllSEORoutes(): SEORoute[] {
  return Object.values(SEO_ROUTES)
}

// Breadcrumb generation for SEO pages
export function generateSEOBreadcrumbs(route: SEORoute): any {
  const breadcrumbs = [
    { name: 'Home', url: 'https://tours.albaniavisit.com' },
    { name: 'Tours', url: 'https://tours.albaniavisit.com/tours' }
  ]
  
  // Add intermediate breadcrumbs based on route type
  if (route.filters.country && route.filters.category) {
    breadcrumbs.push({
      name: route.filters.country,
      url: `https://tours.albaniavisit.com/tours/${route.filters.country.toLowerCase().replace(' ', '-')}`
    })
  }
  
  breadcrumbs.push({
    name: route.title,
    url: `https://tours.albaniavisit.com${route.pattern}`
  })
  
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    'itemListElement': breadcrumbs.map((item, index) => ({
      '@type': 'ListItem',
      'position': index + 1,
      'name': item.name,
      'item': item.url
    }))
  }
}

// Generate collection page schema for SEO routes
export function generateSEOCollectionSchema(route: SEORoute, tours: any[], totalCount: number): any {
  return {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    'name': route.h1,
    'description': route.metaDescription,
    'url': `https://tours.albaniavisit.com${route.pattern}`,
    'breadcrumb': generateSEOBreadcrumbs(route),
    'mainEntity': {
      '@type': 'ItemList',
      'numberOfItems': totalCount,
      'itemListElement': tours.map((tour, index) => ({
        '@type': 'ListItem',
        'position': index + 1,
        'item': {
          '@type': 'TouristTrip',
          'name': tour.title,
          'description': tour.shortDescription,
          'url': `https://tours.albaniavisit.com/tours/${tour.slug}`,
          'image': tour.primaryImageUrl,
          'provider': {
            '@type': 'TourOperator',
            'name': tour.operatorName || 'Local Tour Operator'
          },
          'offers': tour.priceMin ? {
            '@type': 'AggregateOffer',
            'priceCurrency': 'EUR',
            'lowPrice': tour.priceMin,
            'highPrice': tour.priceMax || tour.priceMin,
            'offerCount': 1
          } : undefined
        }
      }))
    },
    'isPartOf': {
      '@type': 'WebSite',
      'name': 'AlbaniaVisit Tours',
      'url': 'https://tours.albaniavisit.com'
    }
  }
}

// Internal linking suggestions for content
export function getInternalLinks(currentRoute: SEORoute): Array<{ text: string, url: string, priority: number }> {
  const links: Array<{ text: string, url: string, priority: number }> = []
  
  // Always link to main tours page
  links.push({
    text: 'all tours',
    url: '/tours',
    priority: 1
  })
  
  // Add country links if not on a country page
  if (!currentRoute.filters.country) {
    links.push(
      { text: 'Albania tours', url: '/tours/albania', priority: 2 },
      { text: 'Kosovo tours', url: '/tours/kosovo', priority: 2 },
      { text: 'Montenegro tours', url: '/tours/montenegro', priority: 2 }
    )
  }
  
  // Add difficulty links if not on a difficulty page
  if (!currentRoute.filters.difficulty) {
    links.push(
      { text: 'easy tours', url: '/tours/easy', priority: 3 },
      { text: 'challenging adventures', url: '/tours/challenging', priority: 3 }
    )
  }
  
  // Add activity links if relevant
  if (!currentRoute.filters.category) {
    links.push(
      { text: 'hiking tours', url: '/tours/albania/hiking', priority: 3 },
      { text: 'cultural experiences', url: '/tours/cultural', priority: 3 }
    )
  }
  
  // Add complementary links based on current page
  if (currentRoute.filters.country === 'Albania') {
    links.push(
      { text: 'Kosovo hiking', url: '/tours/kosovo/hiking', priority: 4 },
      { text: 'Montenegro adventures', url: '/tours/montenegro', priority: 4 }
    )
  }
  
  if (currentRoute.filters.difficulty === 'easy') {
    links.push({ text: 'moderate tours', url: '/tours/moderate', priority: 4 })
  } else if (currentRoute.filters.difficulty === 'challenging') {
    links.push({ text: 'moderate tours', url: '/tours/moderate', priority: 4 })
  }
  
  return links.sort((a, b) => a.priority - b.priority)
}