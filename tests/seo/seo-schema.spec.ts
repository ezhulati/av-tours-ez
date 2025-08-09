import { test, expect } from '@playwright/test'

// SEO requirements
const SEO_REQUIREMENTS = {
  titleLength: { min: 30, max: 60 },
  descriptionLength: { min: 120, max: 160 },
  minKeywords: 3,
  ogTagsRequired: ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'],
  twitterTagsRequired: ['twitter:card', 'twitter:title', 'twitter:description'],
}

// Schema.org types we expect
const EXPECTED_SCHEMA_TYPES = [
  'TouristTrip',
  'TravelAction',
  'Organization',
  'Product',
  'Offer',
  'AggregateRating',
  'BreadcrumbList',
]

test.describe('SEO Meta Tags', () => {
  test('should have proper meta tags on homepage', async ({ page }) => {
    await page.goto('/')
    
    // Get all meta tags
    const metaTags = await page.evaluate(() => {
      const tags: Record<string, string> = {}
      document.querySelectorAll('meta').forEach(meta => {
        const name = meta.getAttribute('name') || meta.getAttribute('property')
        const content = meta.getAttribute('content')
        if (name && content) {
          tags[name] = content
        }
      })
      return tags
    })
    
    // Check title
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThanOrEqual(SEO_REQUIREMENTS.titleLength.min)
    expect(title.length).toBeLessThanOrEqual(SEO_REQUIREMENTS.titleLength.max)
    
    // Check description
    expect(metaTags.description).toBeTruthy()
    expect(metaTags.description.length).toBeGreaterThanOrEqual(SEO_REQUIREMENTS.descriptionLength.min)
    expect(metaTags.description.length).toBeLessThanOrEqual(SEO_REQUIREMENTS.descriptionLength.max)
    
    // Check keywords
    if (metaTags.keywords) {
      const keywords = metaTags.keywords.split(',').map(k => k.trim())
      expect(keywords.length).toBeGreaterThanOrEqual(SEO_REQUIREMENTS.minKeywords)
    }
    
    // Check Open Graph tags
    SEO_REQUIREMENTS.ogTagsRequired.forEach(tag => {
      expect(metaTags[tag]).toBeTruthy()
    })
    
    // Check Twitter tags
    SEO_REQUIREMENTS.twitterTagsRequired.forEach(tag => {
      expect(metaTags[tag]).toBeTruthy()
    })
    
    // Check viewport
    expect(metaTags.viewport).toBe('width=device-width, initial-scale=1')
  })

  test('should have unique meta tags on tour pages', async ({ page }) => {
    // Get meta from first tour
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    const tour1Meta = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      }
    })
    
    // Get meta from second tour
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').nth(1).click()
    
    const tour2Meta = await page.evaluate(() => {
      return {
        title: document.title,
        description: document.querySelector('meta[name="description"]')?.getAttribute('content'),
        ogTitle: document.querySelector('meta[property="og:title"]')?.getAttribute('content'),
      }
    })
    
    // Meta tags should be unique per page
    expect(tour1Meta.title).not.toBe(tour2Meta.title)
    expect(tour1Meta.description).not.toBe(tour2Meta.description)
    expect(tour1Meta.ogTitle).not.toBe(tour2Meta.ogTitle)
  })

  test('should have canonical URLs', async ({ page }) => {
    await page.goto('/')
    
    const canonical = await page.evaluate(() => {
      return document.querySelector('link[rel="canonical"]')?.getAttribute('href')
    })
    
    expect(canonical).toBeTruthy()
    expect(canonical).toMatch(/^https?:\/\//)
  })

  test('should have hreflang tags for multi-language support', async ({ page }) => {
    await page.goto('/')
    
    const hreflangTags = await page.evaluate(() => {
      const tags = document.querySelectorAll('link[rel="alternate"][hreflang]')
      return Array.from(tags).map(tag => ({
        hreflang: tag.getAttribute('hreflang'),
        href: tag.getAttribute('href'),
      }))
    })
    
    // Should have at least default language
    expect(hreflangTags.length).toBeGreaterThanOrEqual(1)
    
    // Should have x-default
    const hasDefault = hreflangTags.some(tag => tag.hreflang === 'x-default')
    expect(hasDefault).toBeTruthy()
  })
})

test.describe('Schema.org Structured Data', () => {
  test('should have valid JSON-LD schema on homepage', async ({ page }) => {
    await page.goto('/')
    
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      return Array.from(scripts).map(script => {
        try {
          return JSON.parse(script.textContent || '{}')
        } catch {
          return null
        }
      }).filter(Boolean)
    })
    
    expect(schemas.length).toBeGreaterThan(0)
    
    // Check for Organization schema
    const orgSchema = schemas.find(s => s['@type'] === 'Organization' || s['@type']?.includes('Organization'))
    expect(orgSchema).toBeTruthy()
    expect(orgSchema?.name).toBeTruthy()
    expect(orgSchema?.url).toBeTruthy()
  })

  test('should have TouristTrip schema on tour pages', async ({ page }) => {
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      return Array.from(scripts).map(script => {
        try {
          return JSON.parse(script.textContent || '{}')
        } catch {
          return null
        }
      }).filter(Boolean)
    })
    
    // Check for TouristTrip or Product schema
    const tourSchema = schemas.find(s => 
      s['@type'] === 'TouristTrip' || 
      s['@type'] === 'Product' ||
      s['@type']?.includes('Trip')
    )
    
    expect(tourSchema).toBeTruthy()
    
    // Validate required properties
    if (tourSchema) {
      expect(tourSchema.name).toBeTruthy()
      expect(tourSchema.description).toBeTruthy()
      
      // Check for offers
      if (tourSchema.offers) {
        expect(tourSchema.offers.price || tourSchema.offers.priceRange).toBeTruthy()
        expect(tourSchema.offers.priceCurrency).toBeTruthy()
      }
    }
  })

  test('should have BreadcrumbList schema', async ({ page }) => {
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      return Array.from(scripts).map(script => {
        try {
          return JSON.parse(script.textContent || '{}')
        } catch {
          return null
        }
      }).filter(Boolean)
    })
    
    const breadcrumbSchema = schemas.find(s => s['@type'] === 'BreadcrumbList')
    expect(breadcrumbSchema).toBeTruthy()
    
    if (breadcrumbSchema) {
      expect(breadcrumbSchema.itemListElement).toBeTruthy()
      expect(Array.isArray(breadcrumbSchema.itemListElement)).toBeTruthy()
      expect(breadcrumbSchema.itemListElement.length).toBeGreaterThan(0)
    }
  })

  test('should have valid AggregateRating schema', async ({ page }) => {
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      return Array.from(scripts).map(script => {
        try {
          return JSON.parse(script.textContent || '{}')
        } catch {
          return null
        }
      }).filter(Boolean)
    })
    
    // Find schema with rating
    const ratedSchema = schemas.find(s => s.aggregateRating)
    
    if (ratedSchema?.aggregateRating) {
      expect(ratedSchema.aggregateRating['@type']).toBe('AggregateRating')
      expect(ratedSchema.aggregateRating.ratingValue).toBeTruthy()
      expect(ratedSchema.aggregateRating.reviewCount).toBeTruthy()
      expect(ratedSchema.aggregateRating.bestRating).toBeTruthy()
      expect(ratedSchema.aggregateRating.worstRating).toBeTruthy()
    }
  })

  test('should validate schema with Google Rich Results Test', async ({ page }) => {
    // This is a placeholder for actual Google Rich Results Test
    // In production, you might use Google's API or a headless browser test
    
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    const schemas = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script[type="application/ld+json"]')
      return Array.from(scripts).map(script => script.textContent).filter(Boolean)
    })
    
    // Basic JSON validation
    schemas.forEach(schemaText => {
      expect(() => JSON.parse(schemaText || '')).not.toThrow()
    })
  })
})

test.describe('Sitemap and Robots', () => {
  test('should have accessible sitemap.xml', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    expect(response?.status()).toBe(200)
    
    const content = await page.content()
    expect(content).toContain('<urlset')
    expect(content).toContain('<url>')
    expect(content).toContain('<loc>')
  })

  test('should have robots.txt', async ({ page }) => {
    const response = await page.goto('/robots.txt')
    expect(response?.status()).toBe(200)
    
    const content = await page.content()
    expect(content).toContain('User-agent')
    expect(content).toContain('Sitemap')
  })

  test('should have sitemap referenced in robots.txt', async ({ page }) => {
    await page.goto('/robots.txt')
    const content = await page.content()
    
    expect(content).toMatch(/Sitemap:\s*https?:\/\/[^\s]+\/sitemap\.xml/i)
  })
})

test.describe('Page Speed and Core Web Vitals', () => {
  test('should have optimized images with proper formats', async ({ page }) => {
    await page.goto('/')
    
    const images = await page.evaluate(() => {
      const imgs = document.querySelectorAll('img')
      return Array.from(imgs).map(img => ({
        src: img.src,
        loading: img.loading,
        decoding: img.decoding,
        srcset: img.srcset,
        sizes: img.sizes,
      }))
    })
    
    images.forEach(img => {
      // Check for lazy loading (except above-the-fold images)
      // Check for modern formats in srcset
      if (img.srcset) {
        expect(img.srcset).toMatch(/\.(webp|avif)/i)
      }
      
      // Check for responsive images
      if (img.sizes) {
        expect(img.sizes).toBeTruthy()
      }
    })
  })

  test('should have preconnect and dns-prefetch for external resources', async ({ page }) => {
    await page.goto('/')
    
    const resourceHints = await page.evaluate(() => {
      const hints = document.querySelectorAll('link[rel="preconnect"], link[rel="dns-prefetch"]')
      return Array.from(hints).map(hint => ({
        rel: hint.getAttribute('rel'),
        href: hint.getAttribute('href'),
      }))
    })
    
    // Should have resource hints for critical third-party domains
    expect(resourceHints.length).toBeGreaterThan(0)
  })
})

test.describe('International SEO', () => {
  test('should have proper language attributes', async ({ page }) => {
    await page.goto('/')
    
    const htmlLang = await page.evaluate(() => {
      return document.documentElement.getAttribute('lang')
    })
    
    expect(htmlLang).toBeTruthy()
    expect(htmlLang).toMatch(/^[a-z]{2}(-[A-Z]{2})?$/) // e.g., 'en' or 'en-US'
  })

  test('should handle different locales correctly', async ({ page }) => {
    // Test different country pages
    const countries = ['al', 'mk', 'me', 'xk']
    
    for (const country of countries) {
      await page.goto(`/country/${country}`)
      
      const title = await page.title()
      expect(title).toBeTruthy()
      
      // Check for country-specific content
      const content = await page.content()
      expect(content).toBeTruthy()
    }
  })
})

test.describe('Search Engine Indexability', () => {
  test('should not have noindex on important pages', async ({ page }) => {
    const importantPages = ['/', '/tours', '/tours/sample-tour']
    
    for (const url of importantPages) {
      await page.goto(url)
      
      const robotsMeta = await page.evaluate(() => {
        return document.querySelector('meta[name="robots"]')?.getAttribute('content')
      })
      
      // Should not have noindex
      expect(robotsMeta).not.toContain('noindex')
      
      // Should allow indexing
      if (robotsMeta) {
        expect(robotsMeta).toMatch(/index|all/i)
      }
    }
  })

  test('should have clean URLs without unnecessary parameters', async ({ page }) => {
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    const url = page.url()
    
    // URL should be clean (no session IDs, tracking parameters, etc.)
    expect(url).not.toContain('?session')
    expect(url).not.toContain('&utm_')
    expect(url).toMatch(/\/tours\/[a-z0-9-]+$/i)
  })
})

test.describe('Mobile SEO', () => {
  test('should be mobile-friendly', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    // Check viewport meta tag
    const viewport = await page.evaluate(() => {
      return document.querySelector('meta[name="viewport"]')?.getAttribute('content')
    })
    
    expect(viewport).toContain('width=device-width')
    expect(viewport).toContain('initial-scale=1')
    
    // Check text is readable without zooming
    const bodyFontSize = await page.evaluate(() => {
      return window.getComputedStyle(document.body).fontSize
    })
    
    expect(parseInt(bodyFontSize)).toBeGreaterThanOrEqual(14)
  })
})