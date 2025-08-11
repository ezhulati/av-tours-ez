import { test, expect } from '@playwright/test'

interface SchemaOrgData {
  '@context': string
  '@type': string | string[]
  [key: string]: any
}

async function extractSchemaData(page: any): Promise<SchemaOrgData[]> {
  return await page.evaluate(() => {
    const scripts = document.querySelectorAll('script[type="application/ld+json"]')
    return Array.from(scripts).map(script => {
      try {
        return JSON.parse(script.textContent || '{}')
      } catch {
        return null
      }
    }).filter(Boolean)
  })
}

test.describe('Schema.org Structured Data', () => {
  test('Homepage Organization schema', async ({ page }) => {
    await page.goto('/')
    const schemas = await extractSchemaData(page)
    
    // Find Organization schema
    const orgSchema = schemas.find(s => 
      s['@type'] === 'Organization' || 
      (Array.isArray(s['@type']) && s['@type'].includes('Organization'))
    )
    
    expect(orgSchema).toBeTruthy()
    expect(orgSchema?.name).toBe('Albania Visit')
    expect(orgSchema?.url).toContain('albaniavisit.com')
    expect(orgSchema?.logo).toBeTruthy()
    expect(orgSchema?.sameAs).toBeInstanceOf(Array)
  })
  
  test('Tour page Product schema', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    const schemas = await extractSchemaData(page)
    
    // Find Product or TouristAttraction schema
    const tourSchema = schemas.find(s => 
      s['@type'] === 'Product' || 
      s['@type'] === 'TouristAttraction' ||
      s['@type'] === 'TouristTrip'
    )
    
    expect(tourSchema).toBeTruthy()
    expect(tourSchema?.name).toContain('Blue Eye')
    expect(tourSchema?.description).toBeTruthy()
    
    // Check for Offer schema
    if (tourSchema?.offers) {
      expect(tourSchema.offers['@type']).toBe('Offer')
      expect(tourSchema.offers.price).toBeTruthy()
      expect(tourSchema.offers.priceCurrency).toBe('USD')
      expect(tourSchema.offers.availability).toBeTruthy()
      expect(tourSchema.offers.url).toBeTruthy()
    }
    
    // Check for AggregateRating if present
    if (tourSchema?.aggregateRating) {
      expect(tourSchema.aggregateRating['@type']).toBe('AggregateRating')
      expect(tourSchema.aggregateRating.ratingValue).toBeGreaterThanOrEqual(1)
      expect(tourSchema.aggregateRating.ratingValue).toBeLessThanOrEqual(5)
      expect(tourSchema.aggregateRating.reviewCount).toBeGreaterThan(0)
    }
  })
  
  test('BreadcrumbList schema', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    const schemas = await extractSchemaData(page)
    
    const breadcrumbSchema = schemas.find(s => s['@type'] === 'BreadcrumbList')
    
    expect(breadcrumbSchema).toBeTruthy()
    expect(breadcrumbSchema?.itemListElement).toBeInstanceOf(Array)
    expect(breadcrumbSchema?.itemListElement.length).toBeGreaterThan(1)
    
    // Check breadcrumb structure
    const items = breadcrumbSchema?.itemListElement || []
    items.forEach((item: any, index: number) => {
      expect(item['@type']).toBe('ListItem')
      expect(item.position).toBe(index + 1)
      expect(item.name).toBeTruthy()
      expect(item.item || item['@id']).toBeTruthy()
    })
  })
  
  test('Tours listing CollectionPage schema', async ({ page }) => {
    await page.goto('/tours')
    const schemas = await extractSchemaData(page)
    
    const collectionSchema = schemas.find(s => 
      s['@type'] === 'CollectionPage' || 
      s['@type'] === 'ItemList'
    )
    
    if (collectionSchema) {
      expect(collectionSchema.name).toBeTruthy()
      expect(collectionSchema.description).toBeTruthy()
      
      if (collectionSchema['@type'] === 'ItemList') {
        expect(collectionSchema.itemListElement).toBeInstanceOf(Array)
        expect(collectionSchema.numberOfItems).toBeGreaterThan(0)
      }
    }
  })
  
  test('LocalBusiness schema for tours', async ({ page }) => {
    await page.goto('/tours')
    const schemas = await extractSchemaData(page)
    
    const businessSchema = schemas.find(s => 
      s['@type'] === 'LocalBusiness' || 
      s['@type'] === 'TravelAgency'
    )
    
    if (businessSchema) {
      expect(businessSchema.name).toBeTruthy()
      expect(businessSchema.address).toBeTruthy()
      expect(businessSchema.telephone).toBeTruthy()
      expect(businessSchema.openingHoursSpecification).toBeTruthy()
    }
  })
  
  test('WebSite schema with SearchAction', async ({ page }) => {
    await page.goto('/')
    const schemas = await extractSchemaData(page)
    
    const websiteSchema = schemas.find(s => s['@type'] === 'WebSite')
    
    expect(websiteSchema).toBeTruthy()
    expect(websiteSchema?.url).toContain('albaniavisit.com')
    expect(websiteSchema?.name).toBeTruthy()
    
    // Check for SearchAction
    if (websiteSchema?.potentialAction) {
      const searchAction = Array.isArray(websiteSchema.potentialAction) 
        ? websiteSchema.potentialAction.find((a: any) => a['@type'] === 'SearchAction')
        : websiteSchema.potentialAction
      
      if (searchAction) {
        expect(searchAction['@type']).toBe('SearchAction')
        expect(searchAction.target).toBeTruthy()
        expect(searchAction['query-input']).toBeTruthy()
      }
    }
  })
  
  test('FAQ schema on relevant pages', async ({ page }) => {
    await page.goto('/faq')
    const schemas = await extractSchemaData(page)
    
    const faqSchema = schemas.find(s => s['@type'] === 'FAQPage')
    
    if (faqSchema) {
      expect(faqSchema.mainEntity).toBeInstanceOf(Array)
      
      faqSchema.mainEntity.forEach((question: any) => {
        expect(question['@type']).toBe('Question')
        expect(question.name).toBeTruthy()
        expect(question.acceptedAnswer).toBeTruthy()
        expect(question.acceptedAnswer['@type']).toBe('Answer')
        expect(question.acceptedAnswer.text).toBeTruthy()
      })
    }
  })
  
  test('Event schema for tour dates', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    const schemas = await extractSchemaData(page)
    
    const eventSchema = schemas.find(s => s['@type'] === 'Event')
    
    if (eventSchema) {
      expect(eventSchema.name).toBeTruthy()
      expect(eventSchema.startDate).toBeTruthy()
      expect(eventSchema.location).toBeTruthy()
      expect(eventSchema.organizer).toBeTruthy()
      
      // Check for offer details
      if (eventSchema.offers) {
        expect(eventSchema.offers.url).toBeTruthy()
        expect(eventSchema.offers.price).toBeTruthy()
        expect(eventSchema.offers.availability).toBeTruthy()
      }
    }
  })
  
  test('Review schema for testimonials', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    const schemas = await extractSchemaData(page)
    
    const reviewSchemas = schemas.filter(s => s['@type'] === 'Review')
    
    if (reviewSchemas.length > 0) {
      reviewSchemas.forEach(review => {
        expect(review.author).toBeTruthy()
        expect(review.reviewRating).toBeTruthy()
        expect(review.reviewRating['@type']).toBe('Rating')
        expect(review.reviewRating.ratingValue).toBeGreaterThanOrEqual(1)
        expect(review.reviewRating.ratingValue).toBeLessThanOrEqual(5)
        expect(review.reviewBody || review.description).toBeTruthy()
      })
    }
  })
  
  test('Schema validation for required properties', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    const schemas = await extractSchemaData(page)
    
    schemas.forEach(schema => {
      // All schemas should have @context and @type
      expect(schema['@context']).toBeTruthy()
      expect(schema['@type']).toBeTruthy()
      
      // Product schemas should have required properties
      if (schema['@type'] === 'Product') {
        expect(schema.name).toBeTruthy()
        expect(schema.description).toBeTruthy()
        expect(schema.image).toBeTruthy()
      }
      
      // Organization schemas should have required properties
      if (schema['@type'] === 'Organization') {
        expect(schema.name).toBeTruthy()
        expect(schema.url).toBeTruthy()
      }
    })
  })
})