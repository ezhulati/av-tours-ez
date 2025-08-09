/**
 * SEO Configuration and Keyword Strategy for AlbaniaVisit Tours
 * Comprehensive SEO settings, keyword mapping, and content optimization
 */

// Primary Target Keywords by Category
export const keywordStrategy = {
  // High-value primary keywords (high volume, medium competition)
  primary: [
    'albania tours',
    'balkan tours',
    'albania hiking tours',
    'peaks of the balkans',
    'albania adventure tours',
    'montenegro tours',
    'kosovo tours',
    'albania trekking'
  ],
  
  // Long-tail keywords (lower volume, low competition, high conversion)
  longTail: [
    'peaks of the balkans self guided',
    'albania mountain tours from tirana',
    'best hiking tours albania 2025',
    'albania unesco sites tour',
    'zagori valley albania hiking',
    'theth to valbona hike',
    'albania riviera hiking tours',
    'guided tours albania mountains',
    'albania tours for solo travelers',
    'albania adventure holidays packages'
  ],
  
  // Location-based keywords
  location: [
    'tours from tirana',
    'shkoder hiking tours',
    'gjirokaster day tours',
    'berat wine tours',
    'saranda boat tours',
    'albania alps tours',
    'accursed mountains trekking',
    'valbona valley tours',
    'theth national park tours',
    'butrint archaeological tours'
  ],
  
  // Competitor gap keywords
  competitorGap: [
    'albania vs montenegro tours',
    'cheaper alternative croatia tours',
    'undiscovered balkans tours',
    'albania hidden gems tours',
    'off the beaten path albania',
    'authentic albania experiences',
    'local guided tours albania',
    'albania cultural tours'
  ],
  
  // Seasonal/trending keywords
  seasonal: {
    spring: ['albania wildflower tours', 'albania easter tours', 'albania spring hiking'],
    summer: ['albania summer adventures', 'albania beach hiking', 'albania festival tours'],
    autumn: ['albania autumn colors tours', 'albania harvest tours', 'albania wine harvest'],
    winter: ['albania snowshoe tours', 'albania winter culture', 'albania christmas tours']
  }
}

// Tour-specific keyword mapping
export const tourKeywordMap: Record<string, {
  primary: string[]
  secondary: string[]
  longTail: string[]
  semantic: string[]
}> = {
  '6-days-guided-peaks-balkans-2025': {
    primary: ['peaks of the balkans', 'balkans hiking tour', 'albania montenegro kosovo tour'],
    secondary: ['6 day balkan tour', 'guided mountain trek albania', 'accursed mountains tour'],
    longTail: [
      'peaks of the balkans 6 days guided',
      'short peaks of balkans tour 2025',
      'best peaks balkans tour company',
      'peaks of balkans tour from shkoder'
    ],
    semantic: ['prokletije', 'albanian alps', 'three borders tour', 'valbona to theth']
  },
  
  '10-days-self-guided-peaks-balkans': {
    primary: ['self guided balkans', 'peaks balkans self guided', '10 day albania trek'],
    secondary: ['independent hiking albania', 'balkans trail solo', 'DIY peaks balkans'],
    longTail: [
      'peaks of balkans self guided 10 days',
      'complete peaks balkans trail',
      'self guided hiking albania montenegro kosovo',
      'peaks balkans without guide'
    ],
    semantic: ['192km trail', 'mountain huts albania', 'border crossing hike', 'tea house trek balkans']
  },
  
  'south-albania-zagori-valley': {
    primary: ['zagori albania', 'south albania tours', 'gjirokaster tours'],
    secondary: ['zagori valley hike', 'thermal springs albania', 'ottoman bridges albania'],
    longTail: [
      'zagori valley albania vs greece',
      'south albania cultural hiking tour',
      'gjirokaster unesco heritage tour',
      'albania thermal springs hiking'
    ],
    semantic: ['permet', 'stone villages', 'vjosa river', 'financial times albania']
  }
}

// Meta title and description templates
export const metaTemplates = {
  tour: {
    title: (name: string, days: number, price: number) => 
      `${name} | ${days} Days from €${price} | AlbaniaVisit Tours`,
    description: (name: string, highlight: string, countries: string[]) =>
      `${name}: ${highlight}. Explore ${countries.join(', ')} with expert guides. Compare tours & connect with trusted operators.`
  },
  
  category: {
    title: (category: string, count: number) =>
      `${category} Tours Albania | ${count}+ Adventures | AlbaniaVisit`,
    description: (category: string, examples: string[]) =>
      `Discover ${category.toLowerCase()} tours in Albania & Balkans. Featured: ${examples.join(', ')}. Compare operators, find the best tours.`
  },
  
  country: {
    title: (country: string, year: number) =>
      `${country} Tours ${year} | Adventure & Cultural Trips | AlbaniaVisit`,
    description: (country: string, highlights: string[]) =>
      `Explore ${country} with authentic tours: ${highlights.join(', ')}. Small groups, expert guides, 2000+ happy travelers.`
  },
  
  homepage: {
    title: 'Albania Tours & Balkan Adventures | 72+ Trips | AlbaniaVisit Tours',
    description: 'Find the best Albania tours & Balkan adventures. Compare trusted operators, mountain treks, cultural tours. Connect directly with local tour companies.'
  }
}

// Internal linking strategy
export const internalLinkingStrategy = {
  // Hub pages (high authority distribution)
  hubs: [
    { path: '/', anchorVariations: ['albania tours', 'home', 'all tours'] },
    { path: '/tours', anchorVariations: ['browse tours', 'all adventures', 'tour catalog'] },
    { path: '/country/albania', anchorVariations: ['albania tours', 'albania adventures'] },
    { path: '/category/hiking', anchorVariations: ['hiking tours', 'trekking adventures'] }
  ],
  
  // Spoke pages (receive authority)
  contextualLinks: {
    'peaks-balkans': [
      { text: 'Theth to Valbona hike', url: '/tours/theth-valbona-hike' },
      { text: 'Albania mountain guides', url: '/category/mountain' },
      { text: 'Multi-country tours', url: '/category/multi-country' }
    ],
    'cultural': [
      { text: 'UNESCO Gjirokaster', url: '/tours/gjirokaster-tour' },
      { text: 'Berat city tour', url: '/tours/berat-thousand-windows' },
      { text: 'Ottoman heritage', url: '/category/cultural' }
    ]
  },
  
  // Anchor text variations for natural linking
  anchorTextVariations: {
    exact: 30, // 30% exact match
    partial: 40, // 40% partial match
    branded: 20, // 20% branded
    generic: 10 // 10% generic (click here, learn more)
  }
}

// Content optimization guidelines
export const contentGuidelines = {
  tourPage: {
    minWords: 800,
    maxWords: 1500,
    structure: {
      h1: 1, // One H1 with primary keyword
      h2: 3, // 3-5 H2s with secondary keywords
      h3: 6, // 6-10 H3s with semantic keywords
      paragraphs: 8, // 8-12 paragraphs
      lists: 2, // 2-3 bulleted lists
      images: 5, // Minimum 5 images with alt text
      videos: 1 // At least 1 video embed
    },
    keywordDensity: {
      primary: '1-2%',
      secondary: '0.5-1%',
      semantic: 'natural occurrence'
    }
  },
  
  categoryPage: {
    minWords: 600,
    maxWords: 1000,
    introContent: true,
    faqSection: true,
    tourGrid: true
  },
  
  homepage: {
    minWords: 500,
    heroSection: true,
    trustSignals: true,
    featuredTours: true,
    testimonials: true,
    faqSection: true
  }
}

// Technical SEO configuration
export const technicalSEO = {
  // Page speed targets
  performance: {
    LCP: 2.5, // Largest Contentful Paint < 2.5s
    FID: 100, // First Input Delay < 100ms
    CLS: 0.1, // Cumulative Layout Shift < 0.1
    targetScore: 90 // Target PageSpeed score
  },
  
  // Mobile optimization
  mobile: {
    viewport: 'width=device-width, initial-scale=1',
    tapTargets: '48px minimum',
    fontSizes: '16px minimum',
    horizontalScrolling: false
  },
  
  // Crawling directives
  crawling: {
    maxCrawlDepth: 4,
    priorityPages: ['/tours', '/country/*', '/category/*'],
    crawlBudget: 'optimize for 10,000 pages/day',
    renderBudget: '500ms max'
  },
  
  // Image optimization
  images: {
    formats: ['webp', 'avif', 'jpg'],
    lazyLoading: true,
    responsive: true,
    maxSize: '150KB',
    dimensions: {
      thumbnail: '400x300',
      card: '800x600',
      hero: '1920x1080',
      gallery: '1200x900'
    }
  }
}

// Hreflang configuration for multi-language
export const hreflangConfig = {
  enabled: true,
  defaultLang: 'en',
  languages: [
    { code: 'en', label: 'English', region: 'US' },
    { code: 'sq', label: 'Albanian', region: 'AL' },
    { code: 'de', label: 'German', region: 'DE' },
    { code: 'fr', label: 'French', region: 'FR' }
  ],
  xDefault: 'en'
}

// Rich snippet priorities
export const richSnippetPriorities = [
  {
    type: 'Product',
    pages: 'all tour pages',
    priority: 'HIGH',
    expectedCTRIncrease: '20-30%'
  },
  {
    type: 'Review/Rating',
    pages: 'tour pages with reviews',
    priority: 'HIGH',
    expectedCTRIncrease: '15-20%'
  },
  {
    type: 'FAQ',
    pages: 'tour pages, category pages',
    priority: 'MEDIUM',
    expectedCTRIncrease: '10-15%'
  },
  {
    type: 'Breadcrumb',
    pages: 'all pages',
    priority: 'MEDIUM',
    expectedCTRIncrease: '5-10%'
  },
  {
    type: 'Organization',
    pages: 'homepage',
    priority: 'HIGH',
    expectedCTRIncrease: '10-15%'
  },
  {
    type: 'Event',
    pages: 'scheduled departures',
    priority: 'LOW',
    expectedCTRIncrease: '5-10%'
  }
]

// Monitoring KPIs
export const seoKPIs = {
  organic: {
    traffic: { target: '+50% YoY', baseline: 'current' },
    keywords: { target: 'Top 3 for 20 primary keywords', tracking: 'weekly' },
    ctr: { target: '5%+ average', improvement: '+1% quarterly' }
  },
  
  technical: {
    indexation: { target: '95%+ pages indexed', check: 'weekly' },
    crawlErrors: { target: '<1%', check: 'daily' },
    pageSpeed: { target: '90+ mobile score', check: 'weekly' }
  },
  
  conversions: {
    organicBookings: { target: '3%+ conversion rate', tracking: 'daily' },
    assistedConversions: { target: 'Track all touchpoints', attribution: 'data-driven' },
    revenuePerVisitor: { target: '€15+', optimization: 'continuous' }
  }
}