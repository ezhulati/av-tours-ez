/**
 * Price validation and formatting utilities
 * Ensures tour prices are realistic and properly displayed
 */

export interface PriceValidation {
  isValid: boolean
  price?: string
  displayPrice: string
  reason?: string
}

// Minimum realistic price for a tour (in USD/EUR)
const MIN_TOUR_PRICE = 25

// Maximum realistic price for most tours (helps catch parsing errors)
const MAX_TOUR_PRICE = 10000

// Common false positive patterns to exclude
const FALSE_POSITIVE_PATTERNS = [
  /\$\d+\s*(off|discount|save)/i,  // Discount amounts
  /save\s*[€$]\s*\d+/i,             // Savings amounts
  /[€$]\d+\s*deposit/i,             // Deposit amounts
  /[€$]\d+\s*per\s*person/i,        // When followed by more context
  /child(?:ren)?\s*[€$]\s*\d+/i,    // Child pricing
  /was\s*[€$]\s*\d+/i,              // Original price (Was €100)
  /from\s*[€$]\s*\d+\s*pp/i,        // Per person pricing
]

/**
 * Validates if a price string represents a realistic tour price
 */
export function validateTourPrice(priceString: string | null | undefined): PriceValidation {
  // No price provided
  if (!priceString) {
    return {
      isValid: false,
      displayPrice: 'View price',
      reason: 'No price available'
    }
  }
  
  // Check if it's our placeholder text
  if (priceString === 'Check availability') {
    return {
      isValid: false,
      displayPrice: 'Check availability',
      reason: 'Placeholder price'
    }
  }

  // Clean the price string
  const cleaned = priceString.trim()
  
  // Check for "price on request" or similar
  if (/price\s*on\s*request|contact\s*for\s*price|call\s*for\s*price/i.test(cleaned)) {
    return {
      isValid: false,
      displayPrice: 'View price',
      reason: 'Price on request'
    }
  }

  // Check for false positive patterns
  for (const pattern of FALSE_POSITIVE_PATTERNS) {
    if (pattern.test(cleaned)) {
      return {
        isValid: false,
        displayPrice: 'View price',
        reason: 'False positive pattern detected'
      }
    }
  }

  // Extract numeric value from the price string
  const priceMatch = cleaned.match(/[€$]\s*(\d+(?:[.,]\d{1,2})?)/i)
  
  if (!priceMatch) {
    // Try without currency symbol
    const numberMatch = cleaned.match(/(\d+(?:[.,]\d{1,2})?)/i)
    if (!numberMatch) {
      return {
        isValid: false,
        displayPrice: 'View price',
        reason: 'No numeric price found'
      }
    }
  }

  const numericValue = parseFloat(
    (priceMatch?.[1] || cleaned.match(/(\d+(?:[.,]\d{1,2})?)/)?.[1] || '0')
      .replace(',', '.')
  )

  // Validate price range
  if (numericValue < MIN_TOUR_PRICE) {
    return {
      isValid: false,
      displayPrice: 'View price',
      reason: `Price too low (${numericValue} < ${MIN_TOUR_PRICE})`
    }
  }

  if (numericValue > MAX_TOUR_PRICE) {
    return {
      isValid: false,
      displayPrice: 'View price',
      reason: `Price too high (${numericValue} > ${MAX_TOUR_PRICE})`
    }
  }

  // Check for price ranges
  if (/\d+\s*[-–—]\s*\d+/.test(cleaned)) {
    // This is a range, validate both ends
    const rangeMatch = cleaned.match(/[€$]?\s*(\d+(?:[.,]\d{1,2})?)\s*[-–—]\s*[€$]?\s*(\d+(?:[.,]\d{1,2})?)/i)
    if (rangeMatch) {
      const minPrice = parseFloat(rangeMatch[1].replace(',', '.'))
      const maxPrice = parseFloat(rangeMatch[2].replace(',', '.'))
      
      if (minPrice >= MIN_TOUR_PRICE && maxPrice <= MAX_TOUR_PRICE) {
        return {
          isValid: true,
          price: cleaned,
          displayPrice: cleaned
        }
      }
    }
  }

  // Valid single price
  return {
    isValid: true,
    price: cleaned,
    displayPrice: cleaned
  }
}

/**
 * Formats a price for display with fallback messaging
 */
export function formatPriceDisplay(
  price: string | null | undefined,
  partnerName: string = 'BNAdventure'
): {
  primary: string
  secondary?: string
  isEstimate?: boolean
} {
  const validation = validateTourPrice(price)

  if (!validation.isValid) {
    return {
      primary: 'Check availability',
      secondary: `View price on ${partnerName}`,
      isEstimate: false
    }
  }

  // Format valid price
  const formattedPrice = validation.displayPrice
  
  // Check if it's a "from" price
  if (/from|starting/i.test(formattedPrice)) {
    return {
      primary: formattedPrice,
      secondary: 'Per person',
      isEstimate: true
    }
  }

  // Check if it's a range
  if (/\d+\s*[-–—]\s*\d+/.test(formattedPrice)) {
    return {
      primary: formattedPrice,
      secondary: 'Price range',
      isEstimate: false
    }
  }

  // Single price
  return {
    primary: formattedPrice,
    secondary: undefined,
    isEstimate: false
  }
}

/**
 * Validates prices during sync/scraping operations
 */
export function validateScrapedPrice(
  scrapedPrice: string | null,
  tourTitle: string
): {
  valid: boolean
  price: string | null
  warning?: string
} {
  if (!scrapedPrice) {
    return {
      valid: false,
      price: null,
      warning: `No price found for tour: ${tourTitle}`
    }
  }

  const validation = validateTourPrice(scrapedPrice)
  
  if (!validation.isValid) {
    console.warn(`Invalid price detected for "${tourTitle}": ${scrapedPrice} - ${validation.reason}`)
    return {
      valid: false,
      price: null,
      warning: `Invalid price (${validation.reason}): ${scrapedPrice}`
    }
  }

  return {
    valid: true,
    price: validation.price || scrapedPrice
  }
}

/**
 * Batch validate prices for reporting
 */
export function validatePriceBatch(
  tours: Array<{ id: string; title: string; price: string | null }>
): {
  valid: Array<{ id: string; title: string; price: string }>
  invalid: Array<{ id: string; title: string; reason: string }>
  stats: {
    total: number
    valid: number
    invalid: number
    noPrice: number
    tooLow: number
    tooHigh: number
  }
} {
  const valid: Array<{ id: string; title: string; price: string }> = []
  const invalid: Array<{ id: string; title: string; reason: string }> = []
  
  const stats = {
    total: tours.length,
    valid: 0,
    invalid: 0,
    noPrice: 0,
    tooLow: 0,
    tooHigh: 0
  }

  for (const tour of tours) {
    const validation = validateTourPrice(tour.price)
    
    if (validation.isValid && validation.price) {
      valid.push({
        id: tour.id,
        title: tour.title,
        price: validation.price
      })
      stats.valid++
    } else {
      invalid.push({
        id: tour.id,
        title: tour.title,
        reason: validation.reason || 'Unknown'
      })
      stats.invalid++
      
      // Categorize the issue
      if (!tour.price) {
        stats.noPrice++
      } else if (validation.reason?.includes('too low')) {
        stats.tooLow++
      } else if (validation.reason?.includes('too high')) {
        stats.tooHigh++
      }
    }
  }

  return { valid, invalid, stats }
}