import { test, expect } from '@playwright/test'

test.describe('SEO Tests', () => {
  test('homepage has proper meta tags', async ({ page }) => {
    await page.goto('/')
    
    // Check title
    const title = await page.title()
    expect(title).toContain('AlbaniaVisit')
    
    // Check meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toBeTruthy()
    expect(description?.length).toBeGreaterThan(50)
    
    // Check Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    expect(ogTitle).toBeTruthy()
    
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
    expect(ogDescription).toBeTruthy()
    
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    expect(ogImage).toBeTruthy()
  })

  test('has valid structured data', async ({ page }) => {
    await page.goto('/')
    
    // Check for JSON-LD structured data
    const structuredData = await page.locator('script[type="application/ld+json"]').all()
    expect(structuredData.length).toBeGreaterThan(0)
    
    // Validate JSON structure
    for (const script of structuredData) {
      const content = await script.textContent()
      if (content) {
        const json = JSON.parse(content)
        expect(json['@context']).toBeTruthy()
        expect(json['@type']).toBeTruthy()
      }
    }
  })

  test('has proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    // Should have exactly one h1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
    
    // Check heading hierarchy
    const h2Count = await page.locator('h2').count()
    expect(h2Count).toBeGreaterThan(0)
  })

  test('has canonical URL', async ({ page }) => {
    await page.goto('/')
    
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toBeTruthy()
    expect(canonical).toMatch(/^https?:\/\//)
  })

  test('robots.txt is accessible', async ({ page }) => {
    const response = await page.goto('/robots.txt')
    expect(response?.status()).toBe(200)
    
    const content = await response?.text()
    expect(content).toContain('User-agent')
  })

  test('sitemap.xml is accessible', async ({ page }) => {
    const response = await page.goto('/sitemap.xml')
    expect(response?.status()).toBe(200)
    
    const content = await response?.text()
    expect(content).toContain('<?xml')
    expect(content).toContain('<urlset')
  })
})