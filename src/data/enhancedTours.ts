// Badge emoji mapping - unique emoji for each badge type
const badgeEmojis: Record<string, string> = {
  'E-BIKE': '⚡',
  'GUIDED': '🧭',
  'SELF-GUIDED': '🗺️',
  '7 DAYS': '📅',
  '6 DAYS': '📆',
  '8 DAYS': '🗓️',
  '4 DAYS': '📋',
  '3 DAYS': '📝',
  '5 DAYS': '📊',
  '10 DAYS': '📈',
  '13 DAYS': '📉',
  '14 DAYS': '📜',
  'EPIC': '⭐',
  'NEW': '✨',
  'CLASSIC': '🏆',
  'FEATURED': '🌟',
  'POPULAR': '🔥',
  'BUDGET': '💰',
  'PREMIUM': '💎',
  'ADVENTURE': '🏔️',
  'CULTURAL': '🏛️',
  'WINTER': '❄️',
  'SUMMER': '☀️',
  'ALL-INCLUSIVE': '🎯',
  'SMALL GROUP': '👥',
  'PRIVATE': '👤',
  'FAMILY': '👨‍👩‍👧‍👦',
  'EXPERT': '🎓',
  'BEGINNER': '🌱',
  'ADVANCED': '🚀',
  'MODERATE': '⚖️'
}

// Function to get emoji for badge
export function getBadgeEmoji(badge: string): string {
  return badgeEmojis[badge] || '🏷️'
}

// Complete enhanced tour copy for all 72 BNAdventure tours
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
  // Tour 1
  'e-biking-peaks-of-balkans': {
    id: '1',
    slug: 'e-biking-peaks-of-balkans',
    enhancedTitle: 'E-Biking the Peaks of the Balkans',
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

  // Tour 2
  '6-days-guided-peaks-balkans-2025': {
    id: '2',
    slug: '6-days-guided-peaks-balkans-2025',
    enhancedTitle: '6-Day Guided Peaks of the Balkans 2025',
    tagline: 'The Greatest Hits Version',
    heroDescription: 'Not everyone has two weeks for the full trail – we get it. This expertly crafted 6-day loop hits all the Instagram-worthy spots while skipping the less spectacular sections. Journey through the breathtaking Accursed Mountains on a shorter route that bypasses Kosovo but captures all the magic.',
    highlights: [
      'Perfect intro to the famous Peaks of the Balkans trail',
      'Small groups, big experiences (max 12 people)',
      'Two countries, one unforgettable adventure',
      'Traditional mountain hospitality every night'
    ],
    callToAction: 'Reserve Your Spot',
    pricing: {
      amount: '€765',
      note: 'from'
    },
    dates: ['June 21', 'August 2', 'September 20'],
    uniqueFeatures: [
      'Ideal for time-conscious adventurers',
      'Local guides who know every shepherd and secret swimming hole',
      'Limited 2025 departures – book early'
    ],
    emoji: '🏔️',
    badges: ['GUIDED', 'LIMITED DATES', '6 DAYS']
  },

  // Tour 3
  '10-days-self-guided-peaks-balkans': {
    id: '3',
    slug: '10-days-self-guided-peaks-balkans',
    enhancedTitle: '10-Day Self-Guided Peaks of the Balkans',
    tagline: 'The Complete Trail Experience',
    heroDescription: 'Take on the full Peaks of the Balkans circuit at your own pace. This self-guided adventure gives you the freedom to stop for that perfect photo, take that detour to the waterfall, or simply sit and soak in the mountain views without a group schedule.',
    highlights: [
      'Complete the entire circular trail through 3 countries',
      'GPS tracks and detailed maps provided',
      'Luggage transport between accommodations',
      'Pre-booked mountain huts and guesthouses'
    ],
    callToAction: 'Start Planning',
    pricing: {
      amount: '€850',
      note: 'per person'
    },
    uniqueFeatures: [
      'Flexible daily distances',
      '24/7 local support hotline',
      'Perfect for independent spirits'
    ],
    emoji: '🥾',
    badges: ['SELF-GUIDED', 'EPIC', '10 DAYS']
  },

  // Tour 4
  'south-albania-zagori-valley': {
    id: '4',
    slug: 'south-albania-zagori-valley',
    enhancedTitle: 'South Albania Hike - Zagori Valley',
    tagline: 'Where Greece\'s Famous Zagori Wishes It Could Be',
    heroDescription: 'Discover Albania\'s best-kept secret: a valley system that rivals Greece\'s famous Zagori but without the crowds or inflated prices. Stone villages, Ottoman bridges, and mountain paths that haven\'t changed in centuries await.',
    highlights: [
      'Explore UNESCO-candidate stone villages',
      'Cross ancient Ottoman bridges',
      'Stay in restored traditional houses',
      'Taste slow food at its source'
    ],
    callToAction: 'Explore Zagori',
    pricing: {
      amount: '€960',
      note: 'all-inclusive'
    },
    dates: ['May 15', 'June 10', 'September 5'],
    uniqueFeatures: [
      'Cultural immersion meets mountain hiking',
      'Photographer\'s paradise',
      'Off the mass tourism radar'
    ],
    emoji: '🏛️',
    badges: ['GUIDED', 'FEATURED', 'CULTURAL']
  },

  // Tour 5
  'guided-high-scardus-2025': {
    id: '5',
    slug: 'guided-high-scardus-2025',
    enhancedTitle: 'Guided High Scardus 2025',
    tagline: 'Walk Where Roman Legions Marched',
    heroDescription: 'The Sharr Mountains (Scardus to the Romans) form a natural fortress between Macedonia and Kosovo. This 8-day trek follows ancient trading routes and shepherd paths through one of Europe\'s most biodiverse mountain ranges.',
    highlights: [
      'Summit peaks over 2,700m',
      'Wild camping under Balkan stars',
      'Encounter rare Balkan lynx habitat',
      'Visit isolated mountain villages'
    ],
    callToAction: 'Join the Expedition',
    pricing: {
      amount: '€900',
      note: 'early bird price'
    },
    dates: ['July 15, 2025'],
    uniqueFeatures: [
      'Historical route with archaeological sites',
      'Endemic flora hotspot',
      'Small group (max 8 adventurers)'
    ],
    emoji: '⛰️',
    badges: ['HISTORICAL', 'CULTURAL', '8 DAYS']
  },

  // Tour 6
  'ski-touring-accursed-mountains': {
    id: '6',
    slug: 'ski-touring-accursed-mountains',
    enhancedTitle: 'Ski Touring in the Accursed Mountains',
    tagline: 'The Peaks of the Balkans... But Make It Winter',
    heroDescription: 'When winter blankets the Accursed Mountains, a select few know the secret: this is when the mountains truly earn their name. Ski touring here isn\'t just about the descents – it\'s about earning your turns in one of Europe\'s last wild places.',
    highlights: [
      'Untouched powder fields as far as you can see',
      'Winter ascents of legendary peaks',
      'Cozy mountain huts with roaring fires',
      'Northern Albania\'s best-kept winter secret'
    ],
    callToAction: 'Book Winter Adventure',
    pricing: {
      amount: '€1,450',
      note: 'all equipment included'
    },
    dates: ['February 15-22, 2025'],
    uniqueFeatures: [
      'Expert IFMGA guides',
      'Avalanche safety equipment provided',
      'Limited to 6 experienced skiers'
    ],
    emoji: '⛷️',
    badges: ['SKI TOURING', 'EXCLUSIVE', 'WINTER']
  },

  // Tour 7
  'theth-albania-destination': {
    id: '7',
    slug: 'theth-albania-destination',
    enhancedTitle: 'Theth Albania - Destination Guide',
    tagline: 'The Village That Instagram Made Famous',
    heroDescription: 'Theth has gone from Albania\'s best-kept secret to its worst-kept secret, but that doesn\'t make it any less magical. Stone towers, waterfalls, and the Blue Eye of Theth await those who venture beyond the main trail.',
    highlights: [
      'Explore the iconic Lock-in Tower',
      'Swim in the Blue Eye natural pool',
      'Hike to Grunas Waterfall',
      'Stay in traditional stone guesthouses'
    ],
    callToAction: 'Discover Theth',
    uniqueFeatures: [
      'Gateway to the Albanian Alps',
      'Living museum of mountain culture',
      'Year-round destination (yes, even winter!)'
    ],
    emoji: '🏔️',
    badges: ['VILLAGE LIFE', 'INSTAGRAM FAMOUS', 'CULTURAL']
  },

  // Tour 8
  '5-days-self-guided-peaks-balkans': {
    id: '8',
    slug: '5-days-self-guided-peaks-balkans',
    enhancedTitle: '5-Day Self-Guided Peaks Express',
    tagline: 'Your Introduction to the Balkans',
    heroDescription: 'Short on time but big on adventure? This 5-day self-guided trek gives you a taste of the legendary Peaks of the Balkans trail. Perfect for testing your mountain legs or when you only have a week\'s vacation.',
    highlights: [
      'Highlights of the famous trail',
      'Cross from Albania to Montenegro',
      'All accommodations pre-arranged',
      'Digital maps and GPS tracks included'
    ],
    callToAction: 'Start Your Journey',
    pricing: {
      amount: '€480',
      note: 'best value'
    },
    uniqueFeatures: [
      'Perfect long weekend adventure',
      'Flexible start dates',
      'Upgrade to guided available'
    ],
    emoji: '🥾',
    badges: ['SELF-GUIDED', 'FLEXIBLE', '5 DAYS']
  },

  // Tour 9
  '6-days-self-guided-peaks-balkans': {
    id: '9',
    slug: '6-days-self-guided-peaks-balkans',
    enhancedTitle: '6-Day Self-Guided Peaks of the Balkans',
    tagline: 'The Perfect Balance of Adventure and Independence',
    heroDescription: 'Six days is the sweet spot for the Peaks of the Balkans. Long enough to properly disconnect from the world, short enough to fit into real life. This self-guided option lets you set your own rhythm through the Accursed Mountains.',
    highlights: [
      'The best sections of the full trail',
      'Traditional hospitality each night',
      'Emergency support available 24/7',
      'Detailed route notes in English'
    ],
    callToAction: 'Book Your Adventure',
    pricing: {
      amount: '€520',
      note: 'includes accommodation'
    },
    uniqueFeatures: [
      'Most popular self-guided duration',
      'Suitable for fit beginners',
      'Local SIM card included'
    ],
    emoji: '🎒',
    badges: ['SELF-GUIDED', '6 DAYS', 'FLEXIBLE']
  },

  // Tour 10
  'zip-line-kosovo': {
    id: '10',
    slug: 'zip-line-kosovo',
    enhancedTitle: 'Rugova Canyon Zip Line',
    tagline: 'Fly Across Kosovo\'s Grand Canyon',
    heroDescription: 'Soar 300 meters above the Rugova Canyon on the Balkans\' longest zip line. This isn\'t just any zip line – it\'s a 2-minute flight across one of Kosovo\'s most dramatic landscapes at speeds up to 70 km/h.',
    highlights: [
      '750 meters of pure adrenaline',
      'Spectacular canyon views',
      'Professional safety equipment',
      'Combine with Via Ferrata for full day'
    ],
    callToAction: 'Feel the Rush',
    pricing: {
      amount: '€10',
      note: 'advance booking'
    },
    uniqueFeatures: [
      'Longest zip line in the region',
      'GoPro footage available',
      'Just 30 minutes from Peja'
    ],
    emoji: '🎢',
    badges: ['ZIP LINE', 'ADRENALINE', 'COMBO DEALS']
  },

  // Tour 11
  '10-days-guided-peaks-balkans-2025': {
    id: '11',
    slug: '10-days-guided-peaks-balkans-2025',
    enhancedTitle: '10-Day Guided Peaks of the Balkans 2025',
    tagline: 'The Ultimate Guided Balkan Experience',
    heroDescription: 'This is it – the full monty, the complete circuit, the whole enchilada. Ten days through three countries with expert local guides who know every shepherd, every hidden spring, and every story these ancient mountains hold.',
    highlights: [
      'Complete circuit through Albania, Kosovo & Montenegro',
      'Professional mountain guides',
      'All meals and accommodation included',
      'Small group guarantee (max 12)'
    ],
    callToAction: 'Reserve Your 2025 Spot',
    pricing: {
      amount: '€980',
      note: 'early bird special'
    },
    dates: ['June 15', 'July 10', 'August 5', 'September 1'],
    uniqueFeatures: [
      'Only 4 departures in 2025',
      'Free airport transfer included',
      'Carbon offset included'
    ],
    emoji: '🏔️',
    badges: ['GUIDED', '10 DAYS', 'EPIC ADVENTURE']
  },

  // Tour 12
  'rock-climbing': {
    id: '12',
    slug: 'rock-climbing',
    enhancedTitle: 'Rock Climbing Adventures',
    tagline: 'Vertical Balkans Await',
    heroDescription: 'The Albanian Alps aren\'t just for hikers. These limestone giants offer some of the best undeveloped climbing in Europe. From single-pitch sport routes to multi-day big walls, this is climbing the way it used to be.',
    highlights: [
      'Routes for all levels (5a to 8b)',
      'UIAGM certified guides',
      'Hidden crags and first ascents',
      'Equipment rental available'
    ],
    callToAction: 'Start Climbing',
    pricing: {
      amount: '€45',
      note: 'per half day'
    },
    uniqueFeatures: [
      'Untouched limestone paradise',
      'Combine with Via Ferrata',
      'Multi-day packages available'
    ],
    emoji: '🧗',
    badges: ['CLIMBING', 'ADVENTURE', 'EXPERT GUIDES']
  },

  // Tour 13
  'albanian-alps-self-drive': {
    id: '13',
    slug: 'albanian-alps-self-drive',
    enhancedTitle: 'Albanian Alps Self-Drive Adventure',
    tagline: 'Your Road, Your Rules, Your Adventure',
    heroDescription: 'Take the wheel and discover the Albanian Alps at your own pace. This self-drive itinerary combines the freedom of a road trip with the security of pre-booked accommodations and local insider knowledge.',
    highlights: [
      'Detailed driving routes and GPS coordinates',
      'Pre-booked mountain guesthouses',
      'Hidden viewpoints and photo stops',
      '24/7 local support hotline'
    ],
    callToAction: 'Start Your Road Trip',
    pricing: {
      amount: '€420',
      note: 'accommodation package'
    },
    uniqueFeatures: [
      'Perfect for independent explorers',
      'Suitable for regular cars',
      'Optional 4x4 upgrade available'
    ],
    emoji: '🚗',
    badges: ['SELF-DRIVE', 'FLEXIBLE', 'ROAD TRIP']
  },

  // Tour 14
  'balkan-cultural-tour': {
    id: '14',
    slug: 'balkan-cultural-tour',
    enhancedTitle: 'Balkan Cultural Heritage Tour',
    tagline: 'Where East Meets West, Stories Never End',
    heroDescription: 'Beyond the mountains lies a cultural tapestry woven from Roman ruins, Ottoman mosques, Orthodox monasteries, and Communist bunkers. This journey through time explores how the Balkans became Europe\'s most fascinating crossroads.',
    highlights: [
      'UNESCO World Heritage sites',
      'Local artisan workshops',
      'Traditional cooking classes',
      'Historical expert guides'
    ],
    callToAction: 'Explore the Culture',
    pricing: {
      amount: '€1,200',
      note: 'all-inclusive'
    },
    uniqueFeatures: [
      'Small group cultural immersion',
      'Multi-country experience',
      'Authentic local encounters'
    ],
    emoji: '🏛️',
    badges: ['CULTURAL', 'HERITAGE', 'GUIDED']
  },

  // Tour 15
  'bear-watching-kosovo': {
    id: '15',
    slug: 'bear-watching-kosovo',
    enhancedTitle: 'Bear Watching in Kosovo',
    tagline: 'Meet Europe\'s Largest Land Predator',
    heroDescription: 'The forests of Kosovo hide one of Europe\'s healthiest brown bear populations. Join expert wildlife guides for an ethical bear watching experience that supports local conservation efforts and rural communities.',
    highlights: [
      'Professional wildlife guides',
      'Observation hides in prime locations',
      'Dawn and dusk viewing sessions',
      'Conservation education included'
    ],
    callToAction: 'Book Wildlife Experience',
    pricing: {
      amount: '€85',
      note: 'per session'
    },
    uniqueFeatures: [
      '90% sighting success rate',
      'Supports local conservation',
      'Photography tips included'
    ],
    emoji: '🐻',
    badges: ['WILDLIFE', 'CONSERVATION', 'UNIQUE']
  },

  // Tour 16
  'best-balkans-via-dinarica': {
    id: '16',
    slug: 'best-balkans-via-dinarica',
    enhancedTitle: 'Best of Balkans - Via Dinarica',
    tagline: 'The Trail That Connects Seven Nations',
    heroDescription: 'The Via Dinarica is the Balkans\' answer to the Appalachian Trail. This best-of selection takes you through the White Trail\'s most spectacular sections across Bosnia, Montenegro, and Albania.',
    highlights: [
      'Three countries, one epic trail',
      'Mountain huts and valley hotels',
      'Stunning karst landscapes',
      'Local guides in each country'
    ],
    callToAction: 'Join the Trail',
    pricing: {
      amount: '€1,350',
      note: '12-day adventure'
    },
    uniqueFeatures: [
      'Award-winning trail route',
      'Cultural diversity guaranteed',
      'Moderate difficulty throughout'
    ],
    emoji: '🥾',
    badges: ['VIA DINARICA', 'MULTI-COUNTRY', 'EPIC']
  },

  // Tour 17
  'canyoning-albania': {
    id: '17',
    slug: 'canyoning-albania',
    enhancedTitle: 'Canyoning in Albania',
    tagline: 'Nature\'s Own Water Park',
    heroDescription: 'Forget everything you know about water sports. Canyoning in Albania means jumping into crystal pools, sliding down natural water chutes, and rappelling beside waterfalls in canyons that see more sheep than people.',
    highlights: [
      'Natural pools and waterfalls',
      'Professional canyoning guides',
      'All technical equipment provided',
      'Multiple canyon options'
    ],
    callToAction: 'Get Wet and Wild',
    pricing: {
      amount: '€75',
      note: 'full day'
    },
    uniqueFeatures: [
      'Beginner to advanced routes',
      'Wetsuit and gear included',
      'Small groups only'
    ],
    emoji: '💦',
    badges: ['CANYONING', 'ADVENTURE', 'SUMMER']
  },

  // Tour 18
  'family-adventure-montenegro': {
    id: '18',
    slug: 'family-adventure-montenegro',
    enhancedTitle: 'Family Adventure in Montenegro',
    tagline: 'Big Adventures for Small Explorers',
    heroDescription: 'Who says you need to wait until the kids are older? This family-friendly adventure through Montenegro proves that the Balkans can be perfect for pint-sized adventurers and their grown-up sidekicks.',
    highlights: [
      'Kid-tested, parent-approved activities',
      'Flexible daily programs',
      'Family rooms in all accommodations',
      'Swimming stops included'
    ],
    callToAction: 'Plan Family Fun',
    pricing: {
      amount: '€650',
      note: 'adult (kids 50% off)'
    },
    uniqueFeatures: [
      'Designed for ages 6+',
      'Educational and fun',
      'Shorter walking distances'
    ],
    emoji: '👨‍👩‍👧‍👦',
    badges: ['FAMILY', 'MONTENEGRO', 'EASY']
  },

  // Tour 19
  'glacier-lakes-durmitor': {
    id: '19',
    slug: 'glacier-lakes-durmitor',
    enhancedTitle: 'Glacier Lakes of Durmitor',
    tagline: 'Montenegro\'s Mountain Eyes',
    heroDescription: 'Durmitor National Park\'s 18 glacier lakes are called "mountain eyes" by locals, and once you see them, you\'ll understand why. Each lake tells a story of ice, time, and the slow sculpture of mountains.',
    highlights: [
      'Visit 7 spectacular glacier lakes',
      'Black Lake sunrise experience',
      'Bobotov Kuk summit option',
      'UNESCO World Heritage site'
    ],
    callToAction: 'Explore Durmitor',
    pricing: {
      amount: '€580',
      note: '5-day trek'
    },
    uniqueFeatures: [
      'Photographer\'s paradise',
      'Moderate hiking level',
      'Wildlife watching opportunities'
    ],
    emoji: '🏔️',
    badges: ['LAKES', 'UNESCO', 'MONTENEGRO']
  },

  // Tour 20
  'kosovo-cross-country-skiing': {
    id: '20',
    slug: 'kosovo-cross-country-skiing',
    enhancedTitle: 'Kosovo Cross-Country Skiing',
    tagline: 'Nordic Skiing, Balkan Style',
    heroDescription: 'When snow blankets the Rugova Mountains, Kosovo transforms into a cross-country skiing paradise that nobody knows about. Glide through silent forests and frozen valleys in Europe\'s newest country.',
    highlights: [
      'Groomed trails and backcountry routes',
      'Equipment rental included',
      'Traditional mountain lunch daily',
      'Suitable for all skill levels'
    ],
    callToAction: 'Book Winter Escape',
    pricing: {
      amount: '€420',
      note: '3-day package'
    },
    uniqueFeatures: [
      'Crowd-free winter wonderland',
      'Learn from local champions',
      'Combine with snowshoeing'
    ],
    emoji: '⛷️',
    badges: ['CROSS-COUNTRY', 'WINTER', 'KOSOVO']
  },

  // Tour 21
  'lake-koman-ferry': {
    id: '21',
    slug: 'lake-koman-ferry',
    enhancedTitle: 'Lake Koman Ferry Journey',
    tagline: 'The Most Beautiful Ferry Ride You\'ve Never Heard Of',
    heroDescription: 'Imagine Norwegian fjords relocated to Albania, add a rickety ferry full of locals, goats, and the occasional car, and you have Lake Koman. This isn\'t just transport – it\'s one of Europe\'s most spectacular boat journeys.',
    highlights: [
      'Stunning 2.5-hour ferry journey',
      'Connect to Valbona Valley',
      'Dramatic canyon scenery',
      'Authentic local experience'
    ],
    callToAction: 'Book Ferry Adventure',
    pricing: {
      amount: '€25',
      note: 'including connections'
    },
    uniqueFeatures: [
      'Combines with Peaks of Balkans',
      'Morning departures only',
      'Vehicle transport available'
    ],
    emoji: '⛴️',
    badges: ['FERRY', 'SCENIC', 'MUST-DO']
  },

  // Tour 22
  'montenegro-coast-mountains': {
    id: '22',
    slug: 'montenegro-coast-mountains',
    enhancedTitle: 'Montenegro Coast to Mountains',
    tagline: 'From Beach Bliss to Peak Paradise',
    heroDescription: 'Why choose between beach and mountains when Montenegro offers both? Start with your toes in the Adriatic, end with your head in the clouds, and spend a week discovering everything in between.',
    highlights: [
      'Bay of Kotor exploration',
      'Coastal towns and beaches',
      'Mountain peaks and lakes',
      'Mixed activities daily'
    ],
    callToAction: 'Experience Both Worlds',
    pricing: {
      amount: '€980',
      note: '8-day journey'
    },
    uniqueFeatures: [
      'Best of both landscapes',
      'Variety of accommodations',
      'Something new every day'
    ],
    emoji: '🏖️',
    badges: ['COAST', 'MOUNTAINS', 'VARIETY']
  },

  // Tour 23
  'north-macedonia-adventure': {
    id: '23',
    slug: 'north-macedonia-adventure',
    enhancedTitle: 'North Macedonia Adventure',
    tagline: 'Alexander\'s Playground Awaits',
    heroDescription: 'North Macedonia might be small, but it packs more adventure per square kilometer than anywhere else in the Balkans. From Ohrid\'s ancient lake to Mavrovo\'s ski slopes, this is the Balkans\' best-kept secret.',
    highlights: [
      'Lake Ohrid boat excursions',
      'Matka Canyon exploration',
      'Mountain village experiences',
      'Wine tasting included'
    ],
    callToAction: 'Discover Macedonia',
    pricing: {
      amount: '€750',
      note: '7-day tour'
    },
    uniqueFeatures: [
      'UNESCO sites included',
      'Fewer tourists than neighbors',
      'Incredible value for money'
    ],
    emoji: '🏛️',
    badges: ['MACEDONIA', 'CULTURE', 'VALUE']
  },

  // Tour 24
  'paragliding-albania': {
    id: '24',
    slug: 'paragliding-albania',
    enhancedTitle: 'Paragliding in Albania',
    tagline: 'Touch the Sky Above the Riviera',
    heroDescription: 'Launch from Llogara Pass and soar like an eagle over the Albanian Riviera. With the Ionian Sea sparkling below and thermal winds carrying you higher, this is how birds see paradise.',
    highlights: [
      'Tandem flights with certified pilots',
      '1000m altitude difference',
      'Stunning coastal views',
      'Video footage included'
    ],
    callToAction: 'Take Flight',
    pricing: {
      amount: '€120',
      note: 'tandem flight'
    },
    uniqueFeatures: [
      'Best thermals April-October',
      'No experience needed',
      'Combine with coastal tour'
    ],
    emoji: '🪂',
    badges: ['PARAGLIDING', 'ADVENTURE', 'COASTAL']
  },

  // Tour 25
  'peaks-balkans-highlights': {
    id: '25',
    slug: 'peaks-balkans-highlights',
    enhancedTitle: 'Peaks of Balkans Highlights',
    tagline: 'Greatest Hits of the Greatest Trail',
    heroDescription: 'Can\'t commit to the full trail? This highlights tour cherry-picks the absolute best sections of the Peaks of the Balkans. All killer, no filler – just the views, villages, and valleys that make this trail legendary.',
    highlights: [
      'Best viewpoints without the slog',
      'Iconic mountain passes',
      'Traditional village stays',
      'Flexible duration options'
    ],
    callToAction: 'See the Highlights',
    pricing: {
      amount: '€620',
      note: 'from'
    },
    uniqueFeatures: [
      'Perfect for first-timers',
      'Less demanding route',
      'Photography focused'
    ],
    emoji: '📸',
    badges: ['HIGHLIGHTS', 'FLEXIBLE', 'POPULAR']
  },

  // Tour 26
  'rafting-kosovo-albania': {
    id: '26',
    slug: 'rafting-kosovo-albania',
    enhancedTitle: 'White Water Rafting Kosovo-Albania',
    tagline: 'Rapids Without Borders',
    heroDescription: 'The Valbona and White Drin rivers don\'t care about borders, and neither should your adventure. This cross-border rafting experience takes you through canyons that most maps haven\'t even discovered yet.',
    highlights: [
      'Class III-IV rapids',
      'Cross-border adventure',
      'Professional rafting guides',
      'Riverside BBQ lunch'
    ],
    callToAction: 'Ride the Rapids',
    pricing: {
      amount: '€95',
      note: 'full day'
    },
    uniqueFeatures: [
      'Two countries, one river',
      'April-June best water levels',
      'Combine with canyoning'
    ],
    emoji: '🚣',
    badges: ['RAFTING', 'ADVENTURE', 'CROSS-BORDER']
  },

  // Tour 27
  'sharr-mountains-hiking': {
    id: '27',
    slug: 'sharr-mountains-hiking',
    enhancedTitle: 'Sharr Mountains Hiking Trail',
    tagline: 'The Biodiversity Capital of the Balkans',
    heroDescription: 'The Sharr Mountains host more endemic species than anywhere else in Europe. This isn\'t just a hike – it\'s a journey through Europe\'s outdoor botanical garden, complete with wild horses and shepherd dogs.',
    highlights: [
      'Endemic plant paradise',
      'Traditional shepherd encounters',
      'Summit attempts available',
      'Wild horse sightings'
    ],
    callToAction: 'Explore Sharr',
    pricing: {
      amount: '€540',
      note: '4-day trek'
    },
    uniqueFeatures: [
      'Botanist guide available',
      'Less crowded than Peaks',
      'Authentic mountain culture'
    ],
    emoji: '🌺',
    badges: ['HIKING', 'NATURE', 'BIODIVERSITY']
  },

  // Tour 28
  'shkoder-day-tours': {
    id: '28',
    slug: 'shkoder-day-tours',
    enhancedTitle: 'Shkoder Day Tours Collection',
    tagline: 'Your Gateway to Albanian Adventures',
    heroDescription: 'Shkoder isn\'t just a city – it\'s your launchpad to the Albanian Alps, Lake Skadar, and ancient castles. These day tours let you sample the region\'s highlights without committing to multi-day treks.',
    highlights: [
      'Multiple day tour options',
      'Professional local guides',
      'Transportation included',
      'Mix and match itineraries'
    ],
    callToAction: 'Choose Your Day',
    pricing: {
      amount: '€45',
      note: 'from'
    },
    uniqueFeatures: [
      'Perfect for time-limited travelers',
      'Combine multiple tours',
      'Hotel pickup available'
    ],
    emoji: '🏰',
    badges: ['DAY TOURS', 'FLEXIBLE', 'VARIETY']
  },

  // Tour 29
  'snowshoeing-rugova': {
    id: '29',
    slug: 'snowshoeing-rugova',
    enhancedTitle: 'Snowshoeing in Rugova Mountains',
    tagline: 'Winter Hiking for Everyone',
    heroDescription: 'No skiing skills? No problem. Snowshoeing in Kosovo\'s Rugova Mountains opens up a winter wonderland to anyone who can walk. Follow animal tracks through silent forests and reach viewpoints that summer hikers never see.',
    highlights: [
      'Equipment and instruction included',
      'Various difficulty levels',
      'Winter wildlife tracking',
      'Hot drinks and snacks provided'
    ],
    callToAction: 'Try Snowshoeing',
    pricing: {
      amount: '€55',
      note: 'half day'
    },
    uniqueFeatures: [
      'Beginner-friendly activity',
      'Great for families',
      'Combine with skiing'
    ],
    emoji: '❄️',
    badges: ['SNOWSHOE', 'WINTER', 'EASY']
  },

  // Tour 30
  'tara-river-bosnia': {
    id: '30',
    slug: 'tara-river-bosnia',
    enhancedTitle: 'Tara River Rafting Bosnia',
    tagline: 'Europe\'s Deepest Canyon Adventure',
    heroDescription: 'The Tara River carved Europe\'s deepest canyon, and now you can ride its emerald waters. This UNESCO-protected river offers world-class rafting through pristine wilderness that feels more like Colorado than Europe.',
    highlights: [
      'Europe\'s deepest river canyon',
      'Crystal clear mountain water',
      'Multi-day camping options',
      'UNESCO World Heritage site'
    ],
    callToAction: 'Conquer the Canyon',
    pricing: {
      amount: '€110',
      note: 'full day with lunch'
    },
    uniqueFeatures: [
      'May-October season',
      'Camping on river beaches',
      'Photography opportunities'
    ],
    emoji: '🏞️',
    badges: ['RAFTING', 'UNESCO', 'BOSNIA']
  },

  // Tour 31
  'theth-valbona-classic': {
    id: '31',
    slug: 'theth-valbona-classic',
    enhancedTitle: 'Theth to Valbona Classic Trek',
    tagline: 'Albania\'s Most Epic Day Hike',
    heroDescription: 'The Theth to Valbona pass isn\'t just a hike – it\'s a rite of passage for Balkan adventurers. Cross from one legendary valley to another over a mountain pass that\'s been connecting communities for centuries.',
    highlights: [
      'Iconic Albanian Alps crossing',
      'Stunning valley views both sides',
      'Traditional guesthouse stays',
      'Luggage transport available'
    ],
    callToAction: 'Take the Classic',
    pricing: {
      amount: '€180',
      note: '2-day adventure'
    },
    uniqueFeatures: [
      'Most famous Albanian hike',
      'Moderate difficulty',
      'Reversible route'
    ],
    emoji: '⛰️',
    badges: ['CLASSIC', 'MUST-DO', 'ICONIC']
  },

  // Tour 32
  'via-ferrata-montenegro': {
    id: '32',
    slug: 'via-ferrata-montenegro',
    enhancedTitle: 'Via Ferrata Montenegro Adventures',
    tagline: 'The Iron Path to Summit Glory',
    heroDescription: 'Via ferrata brings mountain summits within reach of adventurous non-climbers. Clip into steel cables, cross suspension bridges, and reach peaks you never thought possible in Montenegro\'s dramatic mountains.',
    highlights: [
      'Multiple route difficulties',
      'Safety equipment provided',
      'Certified mountain guides',
      'Stunning exposure and views'
    ],
    callToAction: 'Climb the Iron Way',
    pricing: {
      amount: '€85',
      note: 'including equipment'
    },
    uniqueFeatures: [
      'No climbing experience needed',
      'Adrenaline guaranteed',
      'Combine with hiking'
    ],
    emoji: '🧗‍♀️',
    badges: ['VIA FERRATA', 'ADVENTURE', 'MONTENEGRO']
  },

  // Tour 33
  'wine-tours-kosovo': {
    id: '33',
    slug: 'wine-tours-kosovo',
    enhancedTitle: 'Kosovo Wine Country Tours',
    tagline: 'Ancient Vines, New Country',
    heroDescription: 'Kosovo\'s wine tradition dates back 2,000 years, but the country is just 16. Visit family vineyards where ancient grape varieties meet modern ambitions in Europe\'s newest wine region.',
    highlights: [
      'Family vineyard visits',
      'Traditional wine cellars',
      'Local food pairings',
      'Winemaker meetings'
    ],
    callToAction: 'Taste Kosovo',
    pricing: {
      amount: '€65',
      note: 'with lunch'
    },
    uniqueFeatures: [
      'Unique indigenous grapes',
      'Small production wines',
      'Cultural insights included'
    ],
    emoji: '🍷',
    badges: ['WINE', 'CULTURAL', 'KOSOVO']
  },

  // Tour 34
  'wild-camping-albania': {
    id: '34',
    slug: 'wild-camping-albania',
    enhancedTitle: 'Wild Camping Albanian Alps',
    tagline: 'Sleep Under Balkan Stars',
    heroDescription: 'Forget crowded campsites and designated spots. In the Albanian Alps, you camp where the views are best, the water is clearest, and the only sounds are wind and wildlife. This is wilderness camping as it should be.',
    highlights: [
      'True wilderness camping',
      'All camping gear provided',
      'Leave No Trace principles',
      'Mountain cooking lessons'
    ],
    callToAction: 'Go Wild',
    pricing: {
      amount: '€420',
      note: '3-day expedition'
    },
    uniqueFeatures: [
      'Remote locations only',
      'Night sky photography',
      'Survival skills included'
    ],
    emoji: '⛺',
    badges: ['CAMPING', 'WILDERNESS', 'ADVENTURE']
  },

  // Tour 35
  'winter-peaks-balkans': {
    id: '35',
    slug: 'winter-peaks-balkans',
    enhancedTitle: 'Winter Peaks of the Balkans',
    tagline: 'The Trail That Never Sleeps',
    heroDescription: 'Think the Peaks of the Balkans shuts down in winter? Think again. With snowshoes, warm guesthouses, and dramatic winter light, this is the trail as few ever see it – and it\'s absolutely magical.',
    highlights: [
      'Snowshoe the famous trail',
      'Cozy mountain guesthouses',
      'Winter photography paradise',
      'Small group guarantee'
    ],
    callToAction: 'Embrace Winter',
    pricing: {
      amount: '€780',
      note: '5-day winter trek'
    },
    uniqueFeatures: [
      'Unique winter experience',
      'All equipment provided',
      'Fireplace evenings'
    ],
    emoji: '🏔️',
    badges: ['WINTER', 'SNOWSHOE', 'UNIQUE']
  },

  // Tour 36
  'albanian-riviera-hiking': {
    id: '36',
    slug: 'albanian-riviera-hiking',
    enhancedTitle: 'Albanian Riviera Coastal Hiking',
    tagline: 'Where Mountains Kiss the Sea',
    heroDescription: 'Forget the French Riviera – Albania\'s coast offers something better: empty beaches, ancient paths, and seafood dinners that cost less than a Paris coffee. Hike from beach to beach along Europe\'s last wild coast.',
    highlights: [
      'Coastal mountain trails',
      'Hidden beach discoveries',
      'Seaside village stays',
      'Fresh seafood daily'
    ],
    callToAction: 'Hike the Coast',
    pricing: {
      amount: '€680',
      note: '6-day journey'
    },
    uniqueFeatures: [
      'Beach swimming stops',
      'Easier than mountain treks',
      'Spring and autumn best'
    ],
    emoji: '🏖️',
    badges: ['COASTAL', 'HIKING', 'RIVIERA']
  },

  // Tour 37
  'bunker-tour-albania': {
    id: '37',
    slug: 'bunker-tour-albania',
    enhancedTitle: 'Albania\'s Bunker History Tour',
    tagline: '750,000 Bunkers, Countless Stories',
    heroDescription: 'Albania has more bunkers than anywhere on Earth – one for every four citizens during communism. This tour explores how paranoia created concrete mushrooms and how Albanians are turning Cold War relics into hot spots.',
    highlights: [
      'Secret bunker explorations',
      'Cold War history lessons',
      'Bunker art galleries',
      'Underground tunnel systems'
    ],
    callToAction: 'Explore History',
    pricing: {
      amount: '€45',
      note: 'full day'
    },
    uniqueFeatures: [
      'Unique to Albania',
      'Instagram-worthy spots',
      'Historical insights'
    ],
    emoji: '🏚️',
    badges: ['HISTORY', 'UNIQUE', 'CULTURAL']
  },

  // Tour 38
  'cave-exploration-kosovo': {
    id: '38',
    slug: 'cave-exploration-kosovo',
    enhancedTitle: 'Kosovo Cave Exploration',
    tagline: 'Journey to the Center of the Balkans',
    heroDescription: 'Kosovo\'s limestone mountains hide some of Europe\'s most impressive cave systems. From easy walks through illuminated galleries to proper spelunking adventures, this underground world awaits discovery.',
    highlights: [
      'Multiple cave systems',
      'Beginner to advanced options',
      'Geological wonders',
      'Headlamps and helmets provided'
    ],
    callToAction: 'Go Underground',
    pricing: {
      amount: '€60',
      note: 'half day'
    },
    uniqueFeatures: [
      'Year-round activity',
      'Cool summer escape',
      'Photography allowed'
    ],
    emoji: '🦇',
    badges: ['CAVES', 'EXPLORATION', 'UNIQUE']
  },

  // Tour 39
  'dalmatian-coast-montenegro': {
    id: '39',
    slug: 'dalmatian-coast-montenegro',
    enhancedTitle: 'Dalmatian Coast to Montenegro',
    tagline: 'The Adriatic\'s Greatest Road Trip',
    heroDescription: 'Follow the Adriatic from Split\'s Roman palace to Kotor\'s medieval walls. This coastal odyssey connects Croatia\'s Dalmatian gems with Montenegro\'s Bay of Kotor, creating the ultimate Adriatic adventure.',
    highlights: [
      'Dubrovnik to Kotor journey',
      'Island hopping options',
      'Medieval town exploration',
      'Coastal cuisine tour'
    ],
    callToAction: 'Drive the Dream',
    pricing: {
      amount: '€1,180',
      note: '8-day tour'
    },
    uniqueFeatures: [
      'Two countries, one coast',
      'UNESCO sites included',
      'Beach time built in'
    ],
    emoji: '🚗',
    badges: ['ROAD TRIP', 'COASTAL', 'MULTI-COUNTRY']
  },

  // Tour 40
  'dardani-trail-kosovo': {
    id: '40',
    slug: 'dardani-trail-kosovo',
    enhancedTitle: 'Dardani Ancient Trail Kosovo',
    tagline: 'Walk in Illyrian Footsteps',
    heroDescription: 'Before Romans, before Slavs, before Ottomans, the Dardani ruled these mountains. This archaeological hiking trail connects Iron Age fortresses, Roman roads, and medieval monasteries in Kosovo\'s historical heartland.',
    highlights: [
      'Archaeological sites',
      'Ancient fortress ruins',
      'Historical expert guides',
      'Museum visits included'
    ],
    callToAction: 'Walk Through Time',
    pricing: {
      amount: '€520',
      note: '4-day journey'
    },
    uniqueFeatures: [
      'History meets hiking',
      'Exclusive site access',
      'Archaeological insights'
    ],
    emoji: '🏛️',
    badges: ['HISTORICAL', 'HIKING', 'KOSOVO']
  },

  // Tour 41
  'jeep-safari-albania': {
    id: '41',
    slug: 'jeep-safari-albania',
    enhancedTitle: 'Albanian Alps Jeep Safari',
    tagline: '4x4 Through the Fourth World',
    heroDescription: 'Some call the Albanian Alps the "Fourth World" – too wild for the Third. Our jeep safari proves them right, taking you on roads that Google Maps doesn\'t know exist to villages that time forgot.',
    highlights: [
      'Off-road mountain adventures',
      'Remote village visits',
      'Professional 4x4 drivers',
      'Picnic lunches included'
    ],
    callToAction: 'Join the Safari',
    pricing: {
      amount: '€95',
      note: 'full day'
    },
    uniqueFeatures: [
      'Access remote areas',
      'No driving stress',
      'Photography focused'
    ],
    emoji: '🚙',
    badges: ['JEEP SAFARI', 'ADVENTURE', '4X4']
  },

  // Tour 42
  'lake-ohrid-circuit': {
    id: '42',
    slug: 'lake-ohrid-circuit',
    enhancedTitle: 'Lake Ohrid Circuit Trek',
    tagline: 'Europe\'s Oldest Lake, Newest Adventure',
    heroDescription: 'Lake Ohrid is Europe\'s oldest lake, shared between Macedonia and Albania like a liquid border. This circuit trek explores both shores, combining beach swims, mountain views, and medieval monasteries.',
    highlights: [
      'Complete lake circuit',
      'Two countries, one lake',
      'Swimming stops daily',
      'UNESCO World Heritage'
    ],
    callToAction: 'Circle the Lake',
    pricing: {
      amount: '€720',
      note: '6-day trek'
    },
    uniqueFeatures: [
      'Unique biodiversity',
      'Historical sites',
      'Beach and mountain mix'
    ],
    emoji: '🏊',
    badges: ['LAKE TREK', 'UNESCO', 'SWIMMING']
  },

  // Tour 43
  'mountain-biking-macedonia': {
    id: '43',
    slug: 'mountain-biking-macedonia',
    enhancedTitle: 'Mountain Biking North Macedonia',
    tagline: 'Singletrack Paradise Found',
    heroDescription: 'North Macedonia\'s mountains were made for mountain biking – endless singletrack, forgotten villages, and more vertical than you can shake a gear shift at. This is mountain biking before the crowds arrive.',
    highlights: [
      'Epic singletrack trails',
      'Bike rental included',
      'Support vehicle available',
      'Local trail guides'
    ],
    callToAction: 'Hit the Trails',
    pricing: {
      amount: '€580',
      note: '4-day package'
    },
    uniqueFeatures: [
      'Undiscovered trails',
      'All skill levels',
      'Bike maintenance included'
    ],
    emoji: '🚵',
    badges: ['MTB', 'MACEDONIA', 'ADVENTURE']
  },

  // Tour 44
  'photo-tour-balkans': {
    id: '44',
    slug: 'photo-tour-balkans',
    enhancedTitle: 'Balkans Photography Masterclass',
    tagline: 'Capture the Uncapturable',
    heroDescription: 'The Balkans offer more photo opportunities per kilometer than anywhere in Europe. This photography-focused tour gets you to the right place at the right light with expert guidance on capturing the magic.',
    highlights: [
      'Golden hour shoots',
      'Professional photo guidance',
      'Hidden viewpoints access',
      'Post-processing workshop'
    ],
    callToAction: 'Capture the Balkans',
    pricing: {
      amount: '€1,280',
      note: '7-day workshop'
    },
    uniqueFeatures: [
      'Small group (max 6)',
      'All levels welcome',
      'Portfolio review included'
    ],
    emoji: '📷',
    badges: ['PHOTOGRAPHY', 'WORKSHOP', 'CREATIVE']
  },

  // Tour 45
  'prokletije-traverse': {
    id: '45',
    slug: 'prokletije-traverse',
    enhancedTitle: 'Prokletije Mountains Full Traverse',
    tagline: 'The Accursed Mountains Earn Their Name',
    heroDescription: 'The full Prokletije traverse isn\'t for the faint-hearted. This is serious mountain territory – the kind where eagles circle below you and the border is wherever the shepherds say it is.',
    highlights: [
      'Complete mountain traverse',
      'Technical sections included',
      'Mountain hut stays',
      'Summit opportunities'
    ],
    callToAction: 'Accept the Challenge',
    pricing: {
      amount: '€1,150',
      note: '10-day expedition'
    },
    uniqueFeatures: [
      'For experienced hikers',
      'Remote wilderness',
      'Achievement of a lifetime'
    ],
    emoji: '🏔️',
    badges: ['CHALLENGING', 'EXPEDITION', 'EPIC']
  },

  // Tour 46
  'roman-roads-albania': {
    id: '46',
    slug: 'roman-roads-albania',
    enhancedTitle: 'Roman Roads of Albania',
    tagline: 'All Roads Lead to... Albania?',
    heroDescription: 'The Via Egnatia once connected Rome to Constantinople, and much of it ran through Albania. Walk on 2,000-year-old stones, explore Roman ruins, and discover why Albania was the Empire\'s vital crossroads.',
    highlights: [
      'Walk authentic Roman roads',
      'Archaeological sites',
      'Expert historical guides',
      'Roman cuisine experiences'
    ],
    callToAction: 'Follow the Legions',
    pricing: {
      amount: '€680',
      note: '5-day journey'
    },
    uniqueFeatures: [
      'Living history experience',
      'Actual Roman stones',
      'UNESCO tentative sites'
    ],
    emoji: '🏛️',
    badges: ['HISTORICAL', 'ROMAN', 'CULTURAL']
  },

  // Tour 47
  'rugova-valley-adventure': {
    id: '47',
    slug: 'rugova-valley-adventure',
    enhancedTitle: 'Rugova Valley Multi-Adventure',
    tagline: 'Kosovo\'s Adventure Playground',
    heroDescription: 'Rugova Valley is Kosovo\'s adventure capital – via ferrata, zip lines, rock climbing, and hiking all in one dramatic canyon. This multi-activity package lets you try everything without committing to just one.',
    highlights: [
      'Four activities included',
      'Professional guides throughout',
      'Equipment provided',
      'Flexible daily schedule'
    ],
    callToAction: 'Mix Your Adventures',
    pricing: {
      amount: '€320',
      note: '3-day package'
    },
    uniqueFeatures: [
      'Variety pack approach',
      'Perfect for groups',
      'Something for everyone'
    ],
    emoji: '🎯',
    badges: ['MULTI-SPORT', 'KOSOVO', 'VARIETY']
  },

  // Tour 48
  'shkodra-lake-exploration': {
    id: '48',
    slug: 'shkodra-lake-exploration',
    enhancedTitle: 'Lake Shkodra Wetlands Safari',
    tagline: 'Where Eagles Fish and Pelicans Nest',
    heroDescription: 'Lake Shkodra (Skadar) is the Balkans\' largest lake and Europe\'s biggest bird reserve. This wetlands safari explores hidden channels, floating villages, and bird colonies that make the Danube Delta jealous.',
    highlights: [
      'Boat safari expeditions',
      'Incredible bird watching',
      'Floating village visits',
      'Fresh fish lunches'
    ],
    callToAction: 'Explore the Wetlands',
    pricing: {
      amount: '€75',
      note: 'full day'
    },
    uniqueFeatures: [
      '270+ bird species',
      'Pelican colonies',
      'Photography paradise'
    ],
    emoji: '🦅',
    badges: ['WILDLIFE', 'LAKE', 'NATURE']
  },

  // Tour 49
  'ski-touring-sharr': {
    id: '49',
    slug: 'ski-touring-sharr',
    enhancedTitle: 'Ski Touring Sharr Mountains',
    tagline: 'Backcountry Bliss, Balkan Style',
    heroDescription: 'The Sharr Mountains offer ski touring that rivals the Alps but without the crowds, costs, or attitude. Skin up through beech forests, break trail across virgin snowfields, and earn turns that no one else will ski this season.',
    highlights: [
      'Untouched backcountry terrain',
      'IFMGA certified guides',
      'Avalanche safety training',
      'Mountain hut base camps'
    ],
    callToAction: 'Earn Your Turns',
    pricing: {
      amount: '€980',
      note: '5-day program'
    },
    uniqueFeatures: [
      'No lift lines ever',
      'Virgin powder guaranteed',
      'Advanced skiers only'
    ],
    emoji: '⛷️',
    badges: ['SKI TOURING', 'BACKCOUNTRY', 'WINTER']
  },

  // Tour 50
  'albania-coastal-road': {
    id: '50',
    slug: 'albania-coastal-road',
    enhancedTitle: 'Albanian Coastal Road Adventure',
    tagline: 'The Riviera Road Less Traveled',
    heroDescription: 'The Albanian Riviera road is what the Amalfi Coast was 50 years ago – dramatic, empty, and absolutely spectacular. This self-drive adventure includes secret beaches, hilltop villages, and sunset stops you\'ll never forget.',
    highlights: [
      'Self-drive flexibility',
      'Hidden beach access',
      'Coastal village stays',
      'Detailed route guide'
    ],
    callToAction: 'Drive the Riviera',
    pricing: {
      amount: '€420',
      note: 'accommodation package'
    },
    uniqueFeatures: [
      'Go at your own pace',
      'Swimming stops galore',
      'Photographer friendly'
    ],
    emoji: '🚗',
    badges: ['SELF-DRIVE', 'COASTAL', 'FLEXIBLE']
  },

  // Tour 51
  'balkan-food-trail': {
    id: '51',
    slug: 'balkan-food-trail',
    enhancedTitle: 'Balkan Food Trail Adventure',
    tagline: 'Eat Your Way Through Three Countries',
    heroDescription: 'Forget Michelin stars – the Balkans measure good food in grandmother\'s recipes and shepherd\'s cheese. This culinary journey explores mountain dairy farms, fishing villages, and urban markets where food tells the real story.',
    highlights: [
      'Traditional cooking classes',
      'Farm and market visits',
      'Wine and raki tasting',
      'Street food tours'
    ],
    callToAction: 'Taste the Balkans',
    pricing: {
      amount: '€890',
      note: '6-day feast'
    },
    uniqueFeatures: [
      'Local family meals',
      'Seasonal specialties',
      'Recipe collection included'
    ],
    emoji: '🍖',
    badges: ['FOODIE', 'CULTURAL', 'TASTY']
  },

  // Tour 52
  'birdwatching-albania': {
    id: '52',
    slug: 'birdwatching-albania',
    enhancedTitle: 'Albania Birdwatching Paradise',
    tagline: 'Where Eagles Dare and Pelicans Parade',
    heroDescription: 'Albania sits on the Adriatic flyway, making it one of Europe\'s best-kept birding secrets. From coastal wetlands to mountain forests, this tour covers every habitat and hundreds of species.',
    highlights: [
      'Multiple habitat types',
      'Expert ornithologist guides',
      'Rare species opportunities',
      'Photography hides access'
    ],
    callToAction: 'Spot the Birds',
    pricing: {
      amount: '€780',
      note: '5-day tour'
    },
    uniqueFeatures: [
      'Migration season timing',
      'Small group guarantee',
      'Species list provided'
    ],
    emoji: '🦅',
    badges: ['BIRDING', 'NATURE', 'PHOTOGRAPHY']
  },

  // Tour 53
  'castle-hopping-balkans': {
    id: '53',
    slug: 'castle-hopping-balkans',
    enhancedTitle: 'Balkan Castle Hopping Tour',
    tagline: 'Game of Thrones Has Nothing on This',
    heroDescription: 'The Balkans have more castles per square kilometer than anywhere in Europe. From Albanian mountain fortresses to Montenegrin coastal citadels, this tour explores the kingdoms, empires, and pirates who built them.',
    highlights: [
      'Visit 12 historic castles',
      'Medieval history lessons',
      'Stunning viewpoints',
      'Local legend stories'
    ],
    callToAction: 'Storm the Castles',
    pricing: {
      amount: '€720',
      note: '7-day journey'
    },
    uniqueFeatures: [
      'Instagram gold',
      'Mix of countries',
      'Easy walking tour'
    ],
    emoji: '🏰',
    badges: ['CASTLES', 'HISTORY', 'CULTURAL']
  },

  // Tour 54
  'communist-heritage-tour': {
    id: '54',
    slug: 'communist-heritage-tour',
    enhancedTitle: 'Communist Heritage Trail',
    tagline: 'From Bunkers to Brutalism',
    heroDescription: 'The Balkans\' communist past left behind bunkers, monuments, and stories that Netflix can\'t make up. This tour explores the concrete legacy of Europe\'s most paranoid regime and its surprisingly artistic aftermath.',
    highlights: [
      'Secret bunker tours',
      'Abandoned monuments',
      'Museum visits',
      'Survivor stories'
    ],
    callToAction: 'Explore the Past',
    pricing: {
      amount: '€480',
      note: '4-day tour'
    },
    uniqueFeatures: [
      'Unique to region',
      'Photo opportunities',
      'Historical context'
    ],
    emoji: '🏭',
    badges: ['HISTORY', 'UNIQUE', 'COMMUNIST']
  },

  // Tour 55
  'cross-country-horse-riding': {
    id: '55',
    slug: 'cross-country-horse-riding',
    enhancedTitle: 'Cross-Country Horse Riding',
    tagline: 'Gallop Where Cars Can\'t Go',
    heroDescription: 'Explore the Balkans the way they were meant to be explored – on horseback. This cross-country riding adventure takes you through valleys, over passes, and into villages where horses are still the best transport.',
    highlights: [
      'Mountain trail riding',
      'Suitable for intermediates',
      'Local horse breeds',
      'Camping and guesthouse mix'
    ],
    callToAction: 'Saddle Up',
    pricing: {
      amount: '€980',
      note: '6-day ride'
    },
    uniqueFeatures: [
      'Small riding groups',
      'Luggage transport',
      'Non-riders welcome'
    ],
    emoji: '🐎',
    badges: ['HORSE RIDING', 'ADVENTURE', 'UNIQUE']
  },

  // Tour 56
  'danube-iron-gates': {
    id: '56',
    slug: 'danube-iron-gates',
    enhancedTitle: 'Danube Iron Gates Expedition',
    tagline: 'Where the River Cuts Through Mountains',
    heroDescription: 'The Iron Gates gorge is where the Danube becomes dramatic. This expedition explores Europe\'s longest gorge by boat, bike, and boot, including Decebalus\' face – Europe\'s tallest rock sculpture.',
    highlights: [
      'Boat cruises through gorge',
      'Cycling the Danube path',
      'Ancient fortress visits',
      'Multi-country experience'
    ],
    callToAction: 'Navigate the Gates',
    pricing: {
      amount: '€890',
      note: '5-day expedition'
    },
    uniqueFeatures: [
      'UNESCO Geopark',
      'Roman history',
      'Dramatic landscapes'
    ],
    emoji: '⛵',
    badges: ['DANUBE', 'EXPEDITION', 'MULTI-SPORT']
  },

  // Tour 57
  'kosovo-wine-highlands': {
    id: '57',
    slug: 'kosovo-wine-highlands',
    enhancedTitle: 'Kosovo Wine & Highlands Tour',
    tagline: 'Grapes, Peaks, and Everything Between',
    heroDescription: 'Kosovo\'s wine region sits in the shadow of mountains that provide the perfect terroir. This tour combines vineyard visits with highland hikes, proving that wine and mountains are the perfect pairing.',
    highlights: [
      'Family winery visits',
      'Mountain village stays',
      'Traditional food pairings',
      'Hiking between vineyards'
    ],
    callToAction: 'Sip and Hike',
    pricing: {
      amount: '€620',
      note: '4-day tour'
    },
    uniqueFeatures: [
      'Active wine tour',
      'Small producers',
      'Cultural immersion'
    ],
    emoji: '🍇',
    badges: ['WINE', 'HIKING', 'KOSOVO']
  },

  // Tour 58
  'macedonia-monasteries': {
    id: '58',
    slug: 'macedonia-monasteries',
    enhancedTitle: 'Macedonia\'s Mountain Monasteries',
    tagline: 'Where Monks Meet Mountains',
    heroDescription: 'Macedonia\'s mountain monasteries aren\'t just religious sites – they\'re artistic treasures perched in impossible places. This spiritual journey combines hiking, history, and some of the finest Byzantine art you\'ve never heard of.',
    highlights: [
      'Historic monastery visits',
      'Fresco art tours',
      'Mountain hiking trails',
      'Monk encounters'
    ],
    callToAction: 'Seek the Sacred',
    pricing: {
      amount: '€540',
      note: '5-day pilgrimage'
    },
    uniqueFeatures: [
      'Byzantine art focus',
      'Peaceful atmosphere',
      'Photography permitted'
    ],
    emoji: '⛪',
    badges: ['SPIRITUAL', 'CULTURAL', 'MACEDONIA']
  },

  // Tour 59
  'meteor-shower-camping': {
    id: '59',
    slug: 'meteor-shower-camping',
    enhancedTitle: 'Meteor Shower Mountain Camping',
    tagline: 'Shooting Stars, Standing Ovation',
    heroDescription: 'The Balkans\' dark skies make meteor showers unforgettable. This camping trip times perfectly with the Perseids or Geminids, taking you to mountain meadows where light pollution is just a distant memory.',
    highlights: [
      'Timed with meteor showers',
      'Dark sky locations',
      'Astronomy guide included',
      'Photography workshop'
    ],
    callToAction: 'Watch the Sky',
    pricing: {
      amount: '€280',
      note: '3-night camping'
    },
    uniqueFeatures: [
      'August or December',
      'Equipment provided',
      'Astrophotography tips'
    ],
    emoji: '⭐',
    badges: ['ASTRONOMY', 'CAMPING', 'UNIQUE']
  },

  // Tour 60
  'montenegro-fjords-kayaking': {
    id: '60',
    slug: 'montenegro-fjords-kayaking',
    enhancedTitle: 'Montenegro Fjords Kayaking',
    tagline: 'Paddle the Mediterranean\'s Only Fjord',
    heroDescription: 'The Bay of Kotor isn\'t technically a fjord, but don\'t tell the kayakers gliding past medieval towns and under limestone cliffs. This sea kayaking adventure explores Europe\'s southernmost "fjord" from water level.',
    highlights: [
      'Sea kayaking in calm waters',
      'Medieval town visits',
      'Swimming and snorkeling',
      'Sunset paddles'
    ],
    callToAction: 'Paddle the Bay',
    pricing: {
      amount: '€420',
      note: '3-day tour'
    },
    uniqueFeatures: [
      'Beginner friendly',
      'Crystal clear water',
      'UNESCO setting'
    ],
    emoji: '🛶',
    badges: ['KAYAKING', 'COASTAL', 'MONTENEGRO']
  },

  // Tour 61
  'ottoman-heritage-trail': {
    id: '61',
    slug: 'ottoman-heritage-trail',
    enhancedTitle: 'Ottoman Heritage Trail',
    tagline: '500 Years of Stories in Stone',
    heroDescription: 'For five centuries, the Ottomans shaped the Balkans. This cultural trail explores their legacy through bridge-building wizardry, bazaar culture, and architectural gems that make Istanbul jealous.',
    highlights: [
      'Ottoman bridge walks',
      'Historic bazaar tours',
      'Mosque architecture',
      'Turkish coffee culture'
    ],
    callToAction: 'Trace the Empire',
    pricing: {
      amount: '€680',
      note: '6-day journey'
    },
    uniqueFeatures: [
      'Architectural focus',
      'Living heritage',
      'Multi-country route'
    ],
    emoji: '🕌',
    badges: ['OTTOMAN', 'CULTURAL', 'HISTORICAL']
  },

  // Tour 62
  'peja-rugova-adventure': {
    id: '62',
    slug: 'peja-rugova-adventure',
    enhancedTitle: 'Peja to Rugova Adventure Circuit',
    tagline: 'Kosovo\'s Adventure Capital Circuit',
    heroDescription: 'Peja (Pejë) is Kosovo\'s outdoor capital, and Rugova Gorge is its playground. This adventure circuit packs via ferrata, canyoning, zip-lining, and hiking into one adrenaline-fueled long weekend.',
    highlights: [
      'Multiple adventure activities',
      'Rugova Gorge exploration',
      'Traditional village stays',
      'Local cuisine experiences'
    ],
    callToAction: 'Get Your Adrenaline Fix',
    pricing: {
      amount: '€380',
      note: '4-day package'
    },
    uniqueFeatures: [
      'Adventure variety pack',
      'All equipment included',
      'Suitable for beginners'
    ],
    emoji: '🏔️',
    badges: ['MULTI-SPORT', 'KOSOVO', 'ADVENTURE']
  },

  // Tour 63
  'sheep-migration-trek': {
    id: '63',
    slug: 'sheep-migration-trek',
    enhancedTitle: 'Transhumance Sheep Migration Trek',
    tagline: 'Follow 1,000 Sheep to Summer Pastures',
    heroDescription: 'Every spring, shepherds drive their flocks to high summer pastures in an ancient ritual called transhumance. Join this living tradition, walking with shepherds, sheep dogs, and a thousand bleating companions.',
    highlights: [
      'Join real sheep migration',
      'Traditional shepherd life',
      'Mountain camping',
      'Cheese-making lessons'
    ],
    callToAction: 'Join the Migration',
    pricing: {
      amount: '€680',
      note: 'May only'
    },
    uniqueFeatures: [
      'Once-a-year opportunity',
      'Authentic cultural immersion',
      'Unforgettable experience'
    ],
    emoji: '🐑',
    badges: ['CULTURAL', 'UNIQUE', 'SEASONAL']
  },

  // Tour 64
  'spelunking-albania': {
    id: '64',
    slug: 'spelunking-albania',
    enhancedTitle: 'Albania Cave Spelunking',
    tagline: 'Deep, Dark, and Definitely Worth It',
    heroDescription: 'Albania\'s limestone mountains are Swiss cheese underneath. This spelunking adventure explores caves that range from easy walks to rope-work challenges, including caves where prehistoric bears once slept.',
    highlights: [
      'Multiple cave systems',
      'Professional spelunking guides',
      'Underground rivers and lakes',
      'Geological wonders'
    ],
    callToAction: 'Go Deep',
    pricing: {
      amount: '€95',
      note: 'full day'
    },
    uniqueFeatures: [
      'Year-round adventure',
      'Various difficulty levels',
      'Prehistoric discoveries'
    ],
    emoji: '🕳️',
    badges: ['CAVING', 'ADVENTURE', 'UNDERGROUND']
  },

  // Tour 65
  'stand-up-paddleboard': {
    id: '65',
    slug: 'stand-up-paddleboard',
    enhancedTitle: 'SUP Adventures Balkans',
    tagline: 'Stand Up and Paddle Out',
    heroDescription: 'From alpine lakes to coastal bays, the Balkans offer SUP adventures for every level. Whether you\'re yoga-posing on Lake Ohrid or surfing swells on the Adriatic, this is boarding with a view.',
    highlights: [
      'Multiple water locations',
      'SUP yoga sessions',
      'Equipment and instruction',
      'Sunrise/sunset paddles'
    ],
    callToAction: 'Start Paddling',
    pricing: {
      amount: '€55',
      note: 'half day'
    },
    uniqueFeatures: [
      'Beginner friendly',
      'Fitness and fun',
      'Instagram worthy'
    ],
    emoji: '🏄',
    badges: ['SUP', 'WATER SPORTS', 'ACTIVE']
  },

  // Tour 66
  'thermal-springs-trek': {
    id: '66',
    slug: 'thermal-springs-trek',
    enhancedTitle: 'Thermal Springs Trekking Tour',
    tagline: 'Hike Hard, Soak Happy',
    heroDescription: 'The Balkans sit on serious geothermal activity, creating natural hot springs perfect for post-hike soaking. This trek connects the best thermal springs with scenic trails, because you\'ve earned that hot bath.',
    highlights: [
      'Natural hot spring soaks',
      'Mountain trekking trails',
      'Wild camping options',
      'Wellness and hiking mix'
    ],
    callToAction: 'Hike and Soak',
    pricing: {
      amount: '€580',
      note: '5-day wellness trek'
    },
    uniqueFeatures: [
      'Natural spa experience',
      'Healing waters',
      'Relaxation guaranteed'
    ],
    emoji: '♨️',
    badges: ['WELLNESS', 'HIKING', 'THERMAL']
  },

  // Tour 67
  'traditional-crafts-tour': {
    id: '67',
    slug: 'traditional-crafts-tour',
    enhancedTitle: 'Balkan Traditional Crafts Trail',
    tagline: 'Handmade the Hard Way',
    heroDescription: 'Before Amazon, there were artisans. This cultural tour visits the last masters of traditional Balkan crafts – felt makers, woodcarvers, and weavers who create beauty the way their grandparents did.',
    highlights: [
      'Artisan workshop visits',
      'Hands-on craft lessons',
      'Traditional technique demos',
      'Take home your creations'
    ],
    callToAction: 'Learn the Crafts',
    pricing: {
      amount: '€520',
      note: '4-day workshop'
    },
    uniqueFeatures: [
      'Support local artisans',
      'Cultural preservation',
      'Unique souvenirs'
    ],
    emoji: '🧵',
    badges: ['CRAFTS', 'CULTURAL', 'HANDS-ON']
  },

  // Tour 68
  'valbona-valley-trekking': {
    id: '68',
    slug: 'valbona-valley-trekking',
    enhancedTitle: 'Valbona Valley Complete Trek',
    tagline: 'The Valley That Launched a Thousand Hikes',
    heroDescription: 'Valbona Valley is Albanian Alps ground zero – the starting point for countless adventures. This comprehensive trek explores every corner of the valley, from easy river walks to challenging peak ascents.',
    highlights: [
      'Complete valley exploration',
      'Multiple trail options',
      'Traditional guesthouse stays',
      'River swimming spots'
    ],
    callToAction: 'Explore Valbona',
    pricing: {
      amount: '€460',
      note: '4-day trek'
    },
    uniqueFeatures: [
      'Gateway to Albanian Alps',
      'Flexible difficulty',
      'Photography paradise'
    ],
    emoji: '🏔️',
    badges: ['VALBONA', 'TREKKING', 'CLASSIC']
  },

  // Tour 69
  'war-history-tour': {
    id: '69',
    slug: 'war-history-tour',
    enhancedTitle: 'Balkans War History Tour',
    tagline: 'Understanding Yesterday\'s Conflicts',
    heroDescription: 'The 1990s wars shaped today\'s Balkans. This sensitive but important tour visits key sites, meets survivors, and explores how the region is healing. It\'s heavy, but it\'s history that needs telling.',
    highlights: [
      'Historical site visits',
      'Survivor testimonies',
      'Museum exhibitions',
      'Peace-building projects'
    ],
    callToAction: 'Learn the History',
    pricing: {
      amount: '€580',
      note: '5-day tour'
    },
    uniqueFeatures: [
      'Educational focus',
      'Respectful approach',
      'Multiple perspectives'
    ],
    emoji: '🕊️',
    badges: ['HISTORY', 'EDUCATIONAL', '1990s']
  },

  // Tour 70
  'waterfall-chasing-albania': {
    id: '70',
    slug: 'waterfall-chasing-albania',
    enhancedTitle: 'Albania Waterfall Chasing',
    tagline: 'Chase Falls, Not Followers',
    heroDescription: 'Albania has more waterfalls than tourist selfies – for now. This waterfall-hunting adventure finds the cascades that Instagram hasn\'t discovered, from roadside giants to hidden gems requiring proper hikes.',
    highlights: [
      'Visit 10+ waterfalls',
      'Swimming opportunities',
      'Easy to challenging access',
      'Photography focused'
    ],
    callToAction: 'Chase Waterfalls',
    pricing: {
      amount: '€380',
      note: '3-day tour'
    },
    uniqueFeatures: [
      'Hidden locations',
      'Local guide secrets',
      'Seasonal variations'
    ],
    emoji: '💦',
    badges: ['WATERFALLS', 'HIKING', 'PHOTOGRAPHY']
  },

  // Tour 71
  'wildflower-photography': {
    id: '71',
    slug: 'wildflower-photography',
    enhancedTitle: 'Wildflower Photography Trek',
    tagline: 'Bloom Where You\'re Planted',
    heroDescription: 'When spring hits the Balkans, mountains explode in color. This specialized photography trek times perfectly with peak wildflower season, taking you to meadows that look like Monet painted them.',
    highlights: [
      'Peak wildflower timing',
      'Macro photography tips',
      'Multiple ecosystems',
      'Botanical guide included'
    ],
    callToAction: 'Capture the Blooms',
    pricing: {
      amount: '€620',
      note: 'May-June only'
    },
    uniqueFeatures: [
      'Seasonal exclusive',
      'Small groups only',
      'Endemic species focus'
    ],
    emoji: '🌸',
    badges: ['WILDFLOWERS', 'PHOTOGRAPHY', 'SEASONAL']
  },

  // Tour 72
  'youth-adventure-camp': {
    id: '72',
    slug: 'youth-adventure-camp',
    enhancedTitle: 'Balkan Youth Adventure Camp',
    tagline: 'Summer Camp, Supercharged',
    heroDescription: 'This isn\'t your average summer camp. Designed for teens who\'d rather climb mountains than scroll screens, this adventure camp combines outdoor skills, cultural exchange, and enough adrenaline to last until next summer.',
    highlights: [
      'Rock climbing and hiking',
      'Leadership development',
      'International friendships',
      'Outdoor survival skills'
    ],
    callToAction: 'Register for Camp',
    pricing: {
      amount: '€890',
      note: '7-day camp'
    },
    uniqueFeatures: [
      'Ages 14-17',
      'Certified instructors',
      'Life-changing experience'
    ],
    emoji: '🏕️',
    badges: ['YOUTH', 'SUMMER CAMP', 'ADVENTURE']
  }
}

// Helper functions
export function getEnhancedTour(slug: string): EnhancedTour | null {
  return enhancedTourCopy[slug] || null
}

export function hasEnhancedCopy(slug: string): boolean {
  return !!enhancedTourCopy[slug]
}

export function getEnhancedTourCount(): number {
  return Object.keys(enhancedTourCopy).length
}