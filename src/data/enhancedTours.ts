// Enhanced tour copy with rich formatting and engaging descriptions
export interface EnhancedTour {
  id: string
  slug: string
  enhancedTitle: string
  tagline: string
  heroDescription: string
  highlights: string[]
  callToAction: string
  pricing?: {
    amount: string
    note?: string
  }
  dates?: string[]
  uniqueFeatures: string[]
  emoji: string
  badges?: string[]
}

export const enhancedTourCopy: Record<string, EnhancedTour> = {
  '6-days-guided-peaks-balkans-2025': {
    id: '1',
    slug: '6-days-guided-peaks-balkans-2025',
    enhancedTitle: '6-Day Guided Peaks of the Balkans 2025',
    tagline: 'The Greatest Hits Version',
    heroDescription: 'Not everyone has two weeks for the full trail – we get it. This expertly crafted 6-day loop hits all the Instagram-worthy spots while skipping the less spectacular sections.',
    highlights: [
      'Journey through the breathtaking Accursed Mountains',
      'Trek ancient village paths with professional guides',
      'Cross dramatic mountain passes',
      'Experience authentic Balkan hospitality'
    ],
    pricing: {
      amount: '€765',
      note: 'Limited 2025 Dates Available'
    },
    dates: ['June 4-9', 'July 30-August 5', 'September 3-9'],
    callToAction: 'Reserve Your Spot',
    uniqueFeatures: [
      'Perfect loop for time-conscious adventurers',
      'All Instagram-worthy spots included',
      'Professional guide with secret viewpoints'
    ],
    emoji: '🏔️',
    badges: ['GUIDED', 'LIMITED DATES', '6 DAYS']
  },

  '10-days-self-guided-peaks-balkans': {
    id: '2',
    slug: '10-days-self-guided-peaks-balkans',
    enhancedTitle: '10-Day Self-Guided Peaks of the Balkans',
    tagline: 'The Complete Trail Experience',
    heroDescription: 'Experience the full legendary 192km Peaks of the Balkans trail at your own pace. This self-guided adventure crosses Montenegro, Albania, and Kosovo through pristine wilderness.',
    highlights: [
      'Complete the full 192km legendary trail',
      'Trek through three countries independently',
      'Stay in remote mountain huts and guesthouses',
      'Experience Europe\'s last true wilderness'
    ],
    pricing: {
      amount: '€850',
      note: 'All logistics pre-arranged'
    },
    callToAction: 'Start Your Epic Journey',
    uniqueFeatures: [
      'The complete legendary Balkan trail experience',
      'Cross three countries on foot',
      'Full independence with support when needed'
    ],
    emoji: '🎒',
    badges: ['SELF-GUIDED', 'EPIC', '10 DAYS']
  },

  'south-albania-zagori-valley': {
    id: '3',
    slug: 'south-albania-zagori-valley',
    enhancedTitle: 'South Albania Hike - Zagori Valley',
    tagline: 'Where Greece\'s Famous Zagori Wishes It Could Be',
    heroDescription: 'Southern Albania\'s best-kept secret. This 8-day guided adventure through the Zagori region combines Ottoman bridges, thermal springs, remote stone villages, and UNESCO Gjirokaster.',
    highlights: [
      'Stay with local families for authentic experiences',
      'Feast on traditional home cooking',
      'Soak in natural thermal springs',
      'Explore UNESCO-listed Gjirokaster'
    ],
    pricing: {
      amount: '€960',
      note: 'Featured in Financial Times'
    },
    dates: ['May 17-24 (wildflower season)', 'September 20-27 (perfect weather)', 'October 18-25 (autumn colors)'],
    callToAction: 'Book Your Spot',
    uniqueFeatures: [
      'Featured in Financial Times',
      'WWII battle sites and 19th-century bridges',
      'Albania before the crowds arrive'
    ],
    emoji: '🌺',
    badges: ['GUIDED', 'FEATURED', 'CULTURAL']
  },

  'guided-high-scardus-2025': {
    id: '4',
    slug: 'guided-high-scardus-2025',
    enhancedTitle: 'Guided High Scardus 2025',
    tagline: 'Walk Where Roman Legions Marched',
    heroDescription: 'Follow a 2,000-year-old Roman trail through Albania and North Macedonia on this 8-day cultural trek. The High Scardus Trail isn\'t just about the hiking – it\'s about walking through living history.',
    highlights: [
      'Summit Mount Korab (2,764m), the region\'s highest peak',
      'Wander through Europe\'s largest alpine pastures',
      'Cross ancient borders and discover unity in diversity',
      'Walk through 2,000 years of living history'
    ],
    pricing: {
      amount: '€900',
      note: 'Single June Departure'
    },
    dates: ['June 28 - July 5'],
    callToAction: 'Join This Historic Journey',
    uniqueFeatures: [
      '2,000-year-old Roman trail',
      'Climb the highest peak in the region',
      'Europe\'s largest alpine pastures'
    ],
    emoji: '🏛️',
    badges: ['HISTORICAL', 'CULTURAL', '8 DAYS']
  },

  'ski-touring-accursed-mountains': {
    id: '5',
    slug: 'ski-touring-accursed-mountains',
    enhancedTitle: 'Ski Touring in the Accursed Mountains',
    tagline: 'The Peaks of the Balkans... But Make It Winter',
    heroDescription: 'While everyone else fights crowds in the Alps, you\'ll be floating through untouched powder in the Balkans. This exclusive 8-day ski touring adventure takes you through Kosovo, Montenegro, and Albania\'s winter wonderland.',
    highlights: [
      'Float through untouched powder in the Balkans',
      'Maximum 1000m daily ascents keep it achievable',
      'Remote mountain guesthouses provide authentic comfort',
      'Choose from open bowls or tree-lined routes'
    ],
    pricing: {
      amount: '€1450',
      note: 'Only ONE 2025 Departure'
    },
    dates: ['March 8 (join the group departure)'],
    callToAction: 'Claim Your Powder',
    uniqueFeatures: [
      'Tested by IFMGA guides in 2024',
      'Winter version of the famous summer trail',
      'Remote mountain guesthouses'
    ],
    emoji: '⛷️',
    badges: ['SKI TOURING', 'EXCLUSIVE', 'WINTER']
  },

  'theth-albania-destination': {
    id: '6',
    slug: 'theth-albania-destination',
    enhancedTitle: 'Theth Albania - Destination Guide',
    tagline: 'The Village That Instagram Made Famous',
    heroDescription: 'This isn\'t just another mountain village – Theth is where sharp peaks meet ancient traditions. Home to that tiny Catholic church you\'ve seen in every Albania photo, plus genuine stone architecture that\'s survived centuries.',
    highlights: [
      'Visit the legendary Lock-in Tower',
      'Chase waterfalls at Grunas',
      'Swim in the famous Blue Eye natural pool',
      'Experience traditional stone architecture'
    ],
    callToAction: 'Plan Your Visit',
    uniqueFeatures: [
      'Base for countless hiking trails',
      'Shala River\'s natural "bathtubs"',
      'Authentic mountain village atmosphere'
    ],
    emoji: '🏘️',
    badges: ['VILLAGE LIFE', 'INSTAGRAM FAMOUS', 'CULTURAL']
  },

  '5-days-self-guided-peaks-balkans': {
    id: '7',
    slug: '5-days-self-guided-peaks-balkans',
    enhancedTitle: '5-Day Self-Guided Peaks Express',
    tagline: 'Your Introduction to the Balkans',
    heroDescription: 'The shortest, most affordable way to taste the Peaks of the Balkans magic. This 5-day self-guided adventure packs in the essentials: a scenic Komani Lake ferry ride, the iconic Valbona to Theth hike, and optional summit of Maja Rosit.',
    highlights: [
      'Scenic Komani Lake ferry ride included',
      'Iconic Valbona to Theth hiking route',
      'Optional summit of Maja Rosit peak',
      'All logistics handled - accommodation & transport'
    ],
    pricing: {
      amount: '€480',
      note: 'Start Any Day May-October'
    },
    callToAction: 'Start Planning',
    uniqueFeatures: [
      'Perfect for first-time Balkans visitors',
      'Complete flexibility - start any day during season',
      'All logistics pre-arranged'
    ],
    emoji: '🎒',
    badges: ['SELF-GUIDED', 'FLEXIBLE', '5 DAYS']
  },

  'e-biking-peaks-of-balkans': {
    id: '8',
    slug: 'e-biking-peaks-of-balkans',
    enhancedTitle: 'E-Biking in Peaks of the Balkans',
    tagline: 'Conquer Three Countries Without Breaking a Sweat',
    heroDescription: 'Ready to tackle the legendary Peaks of the Balkans but want to save your legs for the views? This 7-day e-bike adventure lets you cruise through Montenegro, Albania, and Kosovo with electric assistance when you need it most.',
    highlights: [
      'Follow ancient mountain trails with e-bike assistance',
      'Sleep in traditional guesthouses every night',
      'Discover crystal-clear alpine lakes',
      'Cross three countries on two wheels'
    ],
    callToAction: 'Check Availability',
    uniqueFeatures: [
      '7 days of pedal-assisted paradise',
      'Moderate difficulty (the e-bike is your friend)',
      'Perfect for adventure seekers who prefer smart over hard'
    ],
    emoji: '🚴‍♂️',
    badges: ['E-BIKE', 'GUIDED', '7 DAYS']
  },

  '6-days-self-guided-peaks-balkans': {
    id: '9',
    slug: '6-days-self-guided-peaks-balkans',
    enhancedTitle: '6-Day Self-Guided Peaks of the Balkans',
    tagline: 'The Perfect Balance of Adventure and Independence',
    heroDescription: 'This delightful 6-day journey offers the perfect balance between guided support and independent exploration. Experience the natural and cultural wonders of the Balkans at your own pace.',
    highlights: [
      'Self-guided freedom with expert route planning',
      'Cross spectacular mountain passes',
      'Stay in authentic mountain guesthouses',
      'Explore two countries: Albania and Montenegro'
    ],
    pricing: {
      amount: '€520',
      note: 'Flexible start dates'
    },
    callToAction: 'Book Your Adventure',
    uniqueFeatures: [
      'Perfect 6-day duration for busy schedules',
      'Combines best of Albania and Montenegro',
      'All logistics handled, full independence'
    ],
    emoji: '🗺️',
    badges: ['SELF-GUIDED', '6 DAYS', 'FLEXIBLE']
  },

  'zip-line-kosovo': {
    id: '10',
    slug: 'zip-line-kosovo',
    enhancedTitle: 'Zip Line Kosovo',
    tagline: 'Fly Across Rugova Canyon',
    heroDescription: 'Zoom across spectacular Rugova Canyon on Kosovo\'s longest zip line. Full safety briefing and equipment included – all you need is the nerve to step off the platform.',
    highlights: [
      'Kosovo\'s longest zip line experience',
      'Spectacular views of Rugova Canyon',
      'Professional safety equipment included',
      'Groups of 5+ get special rates'
    ],
    pricing: {
      amount: '€10',
      note: 'or €22 with Via Ferrata combo'
    },
    callToAction: 'Feel the Rush',
    uniqueFeatures: [
      '1-2 hours total experience',
      'Save with Via Ferrata combo package',
      'Perfect for adrenaline seekers'
    ],
    emoji: '🎢',
    badges: ['ZIP LINE', 'ADRENALINE', 'COMBO DEALS']
  },

  '10-days-guided-peaks-balkans-2025': {
    id: '11',
    slug: '10-days-guided-peaks-balkans-2025',
    enhancedTitle: '10-Day Guided Peaks of the Balkans 2025',
    tagline: 'The Ultimate Guided Balkan Experience',
    heroDescription: 'Experience the complete legendary Peaks of the Balkans trail with expert guides. This 10-day adventure crosses Montenegro, Albania, and Kosovo with full support and local expertise.',
    highlights: [
      'Complete guided trail experience',
      'Trek through three countries with experts',
      'Stay in remote mountain huts and guesthouses',
      'Learn from passionate local guides'
    ],
    pricing: {
      amount: '€980',
      note: '2025 Summer Departures'
    },
    dates: ['June 15-24', 'July 20-29', 'August 10-19', 'September 5-14'],
    callToAction: 'Join This Epic Trek',
    uniqueFeatures: [
      'Full guided support on the legendary trail',
      'Expert local knowledge and stories',
      'All logistics handled by professionals'
    ],
    emoji: '🏔️',
    badges: ['GUIDED', '10 DAYS', 'EPIC ADVENTURE']
  },

  'rock-climbing': {
    id: '12',
    slug: 'rock-climbing',
    enhancedTitle: 'Rock Climbing Adventures',
    tagline: 'Vertical Balkans Await',
    heroDescription: 'The Rugova Valley offers some of Europe\'s last undeveloped climbing paradise. Whether you\'re a beginner or expert, our guides know every crag and secret spot.',
    highlights: [
      'Routes from easy slabs to challenging overhangs',
      'Pristine limestone climbing on virgin rock',
      'Swimming in mountain springs between climbs',
      'All equipment provided by certified guides'
    ],
    pricing: {
      amount: '€45',
      note: 'Half day from €45, full day €80'
    },
    callToAction: 'Start Climbing',
    uniqueFeatures: [
      'Europe\'s last undeveloped climbing paradise',
      'Ask about first ascents on unclimbed routes',
      'Combine with zip-lining and hiking'
    ],
    emoji: '🧗',
    badges: ['CLIMBING', 'ADVENTURE', 'EXPERT GUIDES']
  }
}

// Helper function to get enhanced copy for a tour
export function getEnhancedTour(slug: string): EnhancedTour | null {
  return enhancedTourCopy[slug] || null
}

// Helper function to check if tour has enhanced copy
export function hasEnhancedCopy(slug: string): boolean {
  return slug in enhancedTourCopy
}