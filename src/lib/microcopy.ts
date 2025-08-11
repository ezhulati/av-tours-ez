/**
 * Microcopy Configuration for AlbaniaVisit Tours
 * Optimized for conversion rate >4.5%
 * 
 * Usage: Import and use these strings throughout the app for consistent, 
 * conversion-optimized messaging
 */

export const microcopy = {
  // ============================================
  // CALL-TO-ACTION BUTTONS
  // ============================================
  cta: {
    booking: {
      primary: 'Check Availability & Book',
      primaryVariants: ['Book This Adventure', 'Secure Your Spot', 'Reserve Now'],
      compact: 'Book Now',
      compactVariants: ['Reserve', 'Book', 'Secure Spot'],
      loading: 'Loading...',
      mobile: 'View',
    },
    tourCard: {
      default: 'Explore This Adventure',
      variants: ['Discover More', 'View Details', 'See This Tour'],
      detailed: 'Check Dates & Pricing',
    },
    hero: {
      primary: 'Discover Real Albania',
      primaryVariants: ['Find Your Adventure', 'Skip Tourist Traps', 'Explore Authentically'],
      secondary: 'Traveler Favorites',
      secondaryVariants: ['Most Loved', 'Top Rated'],
    },
    inquiry: {
      open: 'Get Expert Advice',
      submit: 'Send My Questions',
      submitting: 'Connecting you with local experts...',
      success: 'Message Sent Successfully',
    },
    filters: {
      apply: 'Show Results',
      clear: 'Reset',
      toggle: 'Filter',
      mobileToggle: (count: number) => count > 0 ? `Filter (${count})` : 'Filter',
    },
    navigation: {
      viewAll: 'View All Tours',
      backToTours: 'Back to Tours',
      nextTour: 'Next Adventure',
      previousTour: 'Previous Tour',
    },
  },

  // ============================================
  // URGENCY & SCARCITY MESSAGING
  // ============================================
  urgency: {
    availability: {
      urgent: (spots: number, date?: string) => 
        date ? `⚡ Only ${spots} spots left for ${date}` : `⚡ Only ${spots} spots remaining`,
      moderate: '🔥 Limited availability - book soon',
      lastMinute: '⏰ Last-minute availability',
      fillingFast: (spots: number) => `🚀 Filling fast - ${spots} spots left`,
      soldOut: '❌ Fully booked - join waitlist',
      almostGone: '⚠️ Almost sold out!',
    },
    social: {
      viewing: (count: number) => `${count} travelers viewing now`,
      booked: (count: number) => `Booked ${count} times today`,
      lastBooking: (time: string) => `Last booking ${time} ago`,
      popular: 'Popular choice',
      trending: 'Trending now',
    },
    seasonal: {
      highSeason: (spots: number) => `Peak season - ${spots} spots remaining`,
      shoulderSeason: 'Great availability - book now',
      lastChance: 'Last chance for this season',
    },
  },

  // ============================================
  // TRUST SIGNALS
  // ============================================
  trust: {
    verification: {
      partner: '✓ Verified Local Partner',
      secure: '✓ Licensed & Insured Operator',
      protected: '✓ Trusted Since 2020',
    },
    guarantees: {
      price: '💰 Direct Pricing - No Hidden Fees',
      satisfaction: '🚀 100% Satisfaction Promise',
      cancellation: '❌ Free Cancellation on Most Tours',
      instant: '⚡ Instant Confirmation Available',
    },
    ratings: {
      excellent: (rating: number) => `Excellent ${rating}/5`,
      reviews: (count: number) => `${count} verified reviews`,
      recommended: (percent: number) => `${percent}% recommend`,
    },
  },

  // ============================================
  // FORM LABELS & HELPERS
  // ============================================
  forms: {
    labels: {
      name: 'Your full name',
      email: 'Email address',
      phone: 'Phone number (optional)',
      date: 'Preferred travel date',
      groupSize: 'Group size',
      message: 'Tell us about your adventure goals',
    },
    placeholders: {
      name: 'John Smith',
      email: 'your@email.com',
      phone: '+1 234 567 8900',
      message: 'Tell us about your travel plans, special requirements, or questions...',
      search: 'Search adventures...',
    },
    helpers: {
      name: 'As it appears on your ID',
      email: 'We\'ll send your tour details here',
      phone: 'For urgent updates only',
      date: 'Select your preferred date',
      groupSize: 'Including yourself',
      message: 'Optional but helps us personalize',
    },
  },

  // ============================================
  // ERROR MESSAGES
  // ============================================
  errors: {
    validation: {
      required: (field: string) => `Please enter your ${field}`,
      email: 'Please check your email address',
      phone: 'Please enter a valid phone number',
      date: 'Please select a valid date',
      groupSize: 'Please enter a number between 1 and 50',
    },
    availability: {
      unavailable: (date: string, suggested?: string) => 
        suggested 
          ? `This date is fully booked. Try ${suggested}?`
          : `This date is fully booked`,
      conflict: 'This time slot just became unavailable',
      expired: 'This offer has expired',
    },
    network: {
      connection: 'Connection hiccup. Reconnecting now...',
      timeout: 'Almost there! Just a moment longer...',
      failed: 'Oops! Let\'s try that again together.',
      offline: 'No internet connection. We\'ll wait for you!',
    },
    form: {
      incomplete: (fields: string[]) => `You\'re almost done! Just need: ${fields.join(', ')}`,
      invalid: 'Quick check needed on the highlighted fields',
      submission: 'Submission failed. Let\'s give it another try!',
    },
  },

  // ============================================
  // SUCCESS MESSAGES
  // ============================================
  success: {
    booking: {
      confirmed: 'Adventure confirmed!',
      processing: 'Processing your booking...',
      complete: 'Booking complete! Check your email.',
    },
    inquiry: {
      sent: 'Thank you for your inquiry!',
      received: 'We\'ll get back to you within 24 hours.',
    },
    saved: {
      tour: 'Tour saved to your list',
      removed: 'Removed from saved tours',
    },
  },

  // ============================================
  // EMPTY STATES
  // ============================================
  empty: {
    search: {
      title: 'No exact matches',
      subtitle: 'But you might love these similar adventures:',
      action: 'Clear Filters',
    },
    favorites: {
      title: 'No saved tours yet',
      subtitle: 'Save tours you love for easy booking later',
      action: 'Browse Tours',
    },
    availability: {
      title: 'Fully booked for this date',
      subtitle: 'Join the waitlist or see similar adventures',
      actions: ['Join Waitlist', 'Similar Tours'],
    },
    tours: {
      title: 'No tours available',
      subtitle: 'Check back soon for new adventures',
      action: 'View All Tours',
    },
  },

  // ============================================
  // LOADING STATES
  // ============================================
  loading: {
    tours: 'Finding perfect adventures...',
    availability: 'Checking real-time availability...',
    booking: 'Securing your spot...',
    prices: 'Getting best prices...',
    images: 'Loading photos...',
    steps: {
      checking: 'Checking availability...',
      reserving: 'Reserving your spot...',
      confirming: 'Confirming details...',
    },
  },

  // ============================================
  // HERO & HEADLINES
  // ============================================
  headlines: {
    hero: {
      primary: 'Real Mountains. Real Guides. Real Adventures.',
      primaryVariants: [
        'Skip the Tourist Traps. Find Real Adventure.',
        'Where Locals Take You Off the Beaten Path',
        'Authentic Balkan Adventures Start Here',
      ],
      secondary: 'Join 2,000+ adventurers exploring hidden Balkan gems',
    },
    categories: {
      adventure: 'Heart-Pounding Adventures in Raw Balkan Terrain',
      hiking: 'Hike Where Eagles Soar',
      cultural: 'Beyond Museums: Living History with Locals',
      beach: 'Pristine Coastlines Away from Crowds',
    },
    value: {
      authentic: 'No Tourist Traps',
      guided: 'Expert Local Guides',
      small: 'Small Group Sizes',
      flexible: 'Flexible Booking',
    },
  },

  // ============================================
  // REDIRECT MODAL
  // ============================================
  redirect: {
    title: 'Complete booking with our trusted partner',
    subtitle: 'You\'ll be redirected to finish your booking',
    benefits: [
      'Secure booking with verified operator',
      'Best price guaranteed',
      'Real-time availability',
    ],
    buttons: {
      continue: 'Continue to Book',
      back: 'Back to Tour',
    },
    footer: 'AlbaniaVisit helps you find and connect with trusted tour operators',
  },

  // ============================================
  // NAVIGATION
  // ============================================
  navigation: {
    menu: {
      tours: 'Adventures',
      categories: 'Activities',
      destinations: 'Destinations',
      about: 'Our Story',
      contact: 'Get Help',
      account: 'Your Trips',
    },
    breadcrumbs: {
      home: 'Home',
      tours: 'All Adventures',
      category: (name: string) => `${name} Tours`,
      destination: (name: string) => `${name} Adventures`,
    },
  },

  // ============================================
  // METADATA & SEO
  // ============================================
  metadata: {
    title: {
      suffix: ' | AlbaniaVisit - Real Adventure Tours',
      home: 'AlbaniaVisit - Discover the Unexpected | Authentic Balkan Adventures',
      tours: 'Adventure Tours in Albania & Balkans',
      tour: (name: string) => `${name} - Book Direct`,
    },
    description: {
      home: 'Skip tourist traps. Experience authentic Balkan adventures with local guides. 2000+ happy adventurers.',
      tours: 'Browse authentic adventure tours in Albania, Kosovo, Macedonia & Montenegro. Small groups, expert guides.',
      tour: (name: string, price: number) => `${name} from €${price}. Expert guides, small groups, authentic experience.`,
    },
  },

  // ============================================
  // MOBILE SPECIFIC
  // ============================================
  mobile: {
    cta: {
      book: 'Book',
      dates: 'Dates',
      save: 'Save',
      share: 'Share',
      call: 'Call',
    },
    filters: {
      sort: (current: string) => `Sort: ${current}`,
      sortOptions: {
        price: 'Price',
        popular: 'Popular',
        newest: 'Newest',
        duration: 'Duration',
      },
    },
    navigation: {
      back: 'Back',
      close: 'Close',
      menu: 'Menu',
      search: 'Search',
    },
  },

  // ============================================
  // DYNAMIC MESSAGING
  // ============================================
  dynamic: {
    // Return visitor messaging
    returning: {
      welcome: 'Welcome back!',
      stillInterested: 'Still interested in this tour?',
      readyToBook: 'Ready to book? We\'re here to help',
      savedTour: 'You saved this tour last time',
    },
    // Time-based messaging
    timeBased: {
      morning: 'Start your day with adventure',
      afternoon: 'Afternoon explorer',
      evening: 'Planning tomorrow\'s adventure?',
      weekend: 'Weekend adventure awaits',
    },
    // Seasonal messaging
    seasonal: {
      summer: 'Peak hiking season is here',
      winter: 'Winter adventures available',
      spring: 'Spring tours now booking',
      fall: 'Fall colors tours available',
    },
  },
};

// Helper function to get A/B test variant
export function getVariant<T>(variants: T[], testGroup: number = 0): T {
  return variants[testGroup % variants.length];
}

// Helper function for character-limited copy
export function truncateCopy(text: string, maxChars: number, suffix: string = '...'): string {
  if (text.length <= maxChars) return text;
  return text.substring(0, maxChars - suffix.length) + suffix;
}

// Helper function for mobile vs desktop copy
export function getResponsiveCopy(mobile: string, desktop: string, isMobile: boolean): string {
  return isMobile ? mobile : desktop;
}

// Export type for TypeScript support
export type Microcopy = typeof microcopy;