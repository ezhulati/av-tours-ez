// Only import Clarity on the client side
let Clarity: any = null;
if (typeof window !== 'undefined') {
  import('@microsoft/clarity').then(module => {
    Clarity = module.default;
  });
}

// Initialize Clarity
export function initClarity(projectId?: string) {
  if (typeof window === 'undefined' || !Clarity) {
    return false; // Skip on server-side
  }
  
  const clarityProjectId = projectId || import.meta.env.PUBLIC_CLARITY_PROJECT_ID
  
  if (!clarityProjectId) {
    console.warn('Clarity project ID not configured')
    return false
  }

  try {
    Clarity.init(clarityProjectId)
    
    // Set initial tags
    Clarity.setTag('site', 'tours.albaniavisit.com')
    Clarity.setTag('environment', import.meta.env.MODE || 'production')
    
    return true
  } catch (error) {
    console.error('Clarity initialization failed:', error)
    return false
  }
}

// Track page views with custom data
export function trackPageView(pageName: string, pageType: string, customData?: Record<string, string>) {
  if (typeof window === 'undefined' || !Clarity) return; // Skip on server-side
  
  try {
    // Set page-specific tags
    Clarity.setTag('page_name', pageName)
    Clarity.setTag('page_type', pageType)
    
    // Add any custom data as tags
    if (customData) {
      Object.entries(customData).forEach(([key, value]) => {
        Clarity.setTag(key, value)
      })
    }
  } catch (error) {
    console.error('Clarity page tracking failed:', error)
  }
}

// Track tour views
export function trackTourView(tourSlug: string, tourTitle: string, tourOperator: string, tourPrice?: number) {
  if (typeof window === 'undefined' || !Clarity) return; // Skip on server-side
  
  try {
    Clarity.event('tour_viewed')
    Clarity.setTag('tour_slug', tourSlug)
    Clarity.setTag('tour_operator', tourOperator)
    if (tourPrice) {
      Clarity.setTag('tour_price_range', getPriceRange(tourPrice))
    }
  } catch (error) {
    console.error('Clarity tour tracking failed:', error)
  }
}

// Track booking button clicks
export function trackBookingClick(tourSlug: string, context: string, buttonLocation: string) {
  if (typeof window === 'undefined' || !Clarity) return; // Skip on server-side
  
  try {
    Clarity.event('booking_button_clicked')
    Clarity.setTag('booking_tour', tourSlug)
    Clarity.setTag('booking_context', context)
    Clarity.setTag('button_location', buttonLocation)
    
    // Upgrade session for booking intent
    Clarity.upgrade('booking_intent')
  } catch (error) {
    console.error('Clarity booking tracking failed:', error)
  }
}

// Track filter usage
export function trackFilterUsage(filterType: string, filterValue: string) {
  if (typeof window === 'undefined' || !Clarity) return; // Skip on server-side
  
  try {
    Clarity.event('filter_applied')
    Clarity.setTag('filter_type', filterType)
    Clarity.setTag('filter_value', filterValue)
  } catch (error) {
    console.error('Clarity filter tracking failed:', error)
  }
}

// Track search
export function trackSearch(searchQuery: string, resultsCount: number) {
  if (typeof window === 'undefined' || !Clarity) return; // Skip on server-side
  
  try {
    Clarity.event('search_performed')
    Clarity.setTag('search_query_length', searchQuery.length.toString())
    Clarity.setTag('search_results_count', resultsCount.toString())
    
    // Upgrade session if no results found (might indicate content gap)
    if (resultsCount === 0) {
      Clarity.upgrade('no_search_results')
    }
  } catch (error) {
    console.error('Clarity search tracking failed:', error)
  }
}

// Track inquiry form interactions
export function trackInquiryForm(action: 'opened' | 'submitted' | 'abandoned', tourSlug?: string) {
  if (typeof window === 'undefined' || !Clarity) return; // Skip on server-side
  
  try {
    Clarity.event(`inquiry_form_${action}`)
    if (tourSlug) {
      Clarity.setTag('inquiry_tour', tourSlug)
    }
    
    // Upgrade session for inquiry submission
    if (action === 'submitted') {
      Clarity.upgrade('inquiry_submitted')
    }
  } catch (error) {
    console.error('Clarity inquiry tracking failed:', error)
  }
}

// Helper function to categorize price ranges
function getPriceRange(price: number): string {
  if (price < 50) return 'budget'
  if (price < 150) return 'mid-range'
  if (price < 300) return 'premium'
  return 'luxury'
}

// Set user consent for GDPR compliance
export function setClarityConsent(hasConsent: boolean) {
  if (typeof window === 'undefined' || !Clarity) return; // Skip on server-side
  
  try {
    Clarity.consent(hasConsent)
  } catch (error) {
    console.error('Clarity consent setting failed:', error)
  }
}