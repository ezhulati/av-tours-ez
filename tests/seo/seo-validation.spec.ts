import { test, expect } from '@playwright/test'

test.describe('SEO and Meta Tags', () => {
  test('Homepage SEO meta tags', async ({ page }) => {
    await page.goto('/')
    
    // Title tag
    const title = await page.title()
    expect(title).toBeTruthy()
    expect(title.length).toBeGreaterThan(30)
    expect(title.length).toBeLessThan(60)
    
    // Meta description
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toBeTruthy()
    expect(description!.length).toBeGreaterThan(120)
    expect(description!.length).toBeLessThan(160)
    
    // Canonical URL
    const canonical = await page.locator('link[rel="canonical"]').getAttribute('href')
    expect(canonical).toBeTruthy()
    expect(canonical).toContain('albaniavisit.com')
    
    // Open Graph tags
    const ogTitle = await page.locator('meta[property="og:title"]').getAttribute('content')
    const ogDescription = await page.locator('meta[property="og:description"]').getAttribute('content')
    const ogImage = await page.locator('meta[property="og:image"]').getAttribute('content')
    const ogUrl = await page.locator('meta[property="og:url"]').getAttribute('content')
    
    expect(ogTitle).toBeTruthy()
    expect(ogDescription).toBeTruthy()
    expect(ogImage).toBeTruthy()
    expect(ogUrl).toBeTruthy()
    
    // Twitter Card tags
    const twitterCard = await page.locator('meta[name="twitter:card"]').getAttribute('content')
    const twitterTitle = await page.locator('meta[name="twitter:title"]').getAttribute('content')
    const twitterDescription = await page.locator('meta[name="twitter:description"]').getAttribute('content')
    const twitterImage = await page.locator('meta[name="twitter:image"]').getAttribute('content')
    
    expect(twitterCard).toBe('summary_large_image')
    expect(twitterTitle).toBeTruthy()
    expect(twitterDescription).toBeTruthy()
    expect(twitterImage).toBeTruthy()
  })
  
  test('Tour page SEO optimization', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    
    // Check for unique title
    const title = await page.title()
    expect(title).toContain('Blue Eye')
    expect(title).toContain('Albania')
    
    // Check for unique description
    const description = await page.locator('meta[name="description"]').getAttribute('content')
    expect(description).toContain('Blue Eye')
    
    // Check for breadcrumbs
    const breadcrumbs = await page.locator('[typeof="BreadcrumbList"]').count()
    expect(breadcrumbs).toBeGreaterThan(0)
  })
  
  test('Robots meta tags', async ({ page }) => {
    await page.goto('/')
    
    const robots = await page.locator('meta[name="robots"]').getAttribute('content')
    expect(robots).toBe('index, follow')
    
    // Check for noindex on certain pages
    await page.goto('/out/test-tour')
    const redirectRobots = await page.locator('meta[name="robots"]').getAttribute('content')
    expect(redirectRobots).toContain('noindex')
  })
  
  test('Sitemap accessibility', async ({ page }) => {
    const response = await page.goto('/sitemap-index.xml')
    expect(response?.status()).toBe(200)
    
    const content = await page.content()
    expect(content).toContain('<sitemap>')
    expect(content).toContain('<loc>')
  })
  
  test('Mobile viewport meta tag', async ({ page }) => {
    await page.goto('/')
    
    const viewport = await page.locator('meta[name="viewport"]').getAttribute('content')
    expect(viewport).toContain('width=device-width')
    expect(viewport).toContain('initial-scale=1')
  })
  
  test('Language attributes', async ({ page }) => {
    await page.goto('/')
    
    const htmlLang = await page.locator('html').getAttribute('lang')
    expect(htmlLang).toBe('en')
    
    // Check for hreflang tags if applicable
    const hreflang = await page.locator('link[rel="alternate"][hreflang]').count()
    if (hreflang > 0) {
      const defaultLang = await page.locator('link[rel="alternate"][hreflang="x-default"]').count()
      expect(defaultLang).toBe(1)
    }
  })
  
  test('Image SEO attributes', async ({ page }) => {
    await page.goto('/tours')
    
    const images = await page.locator('img').all()
    for (const img of images.slice(0, 10)) { // Check first 10 images
      const alt = await img.getAttribute('alt')
      const src = await img.getAttribute('src')
      
      // All images should have alt text
      expect(alt).toBeTruthy()
      
      // Alt text should be descriptive
      expect(alt!.length).toBeGreaterThan(5)
      
      // Image filenames should be SEO-friendly
      if (src && !src.includes('data:')) {
        expect(src).not.toContain(' ')
        expect(src).toMatch(/\.(jpg|jpeg|png|webp|svg)$/i)
      }
    }
  })
  
  test('Heading structure for SEO', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    
    // Should have exactly one H1
    const h1Count = await page.locator('h1').count()
    expect(h1Count).toBe(1)
    
    // H1 should contain keywords
    const h1Text = await page.locator('h1').textContent()
    expect(h1Text).toBeTruthy()
    expect(h1Text!.length).toBeGreaterThan(10)
    
    // Check for proper heading hierarchy
    const h2Count = await page.locator('h2').count()
    expect(h2Count).toBeGreaterThan(0)
  })
  
  test('Internal linking structure', async ({ page }) => {
    await page.goto('/tours')
    
    // Check for internal links
    const internalLinks = await page.locator('a[href^="/"]').all()
    expect(internalLinks.length).toBeGreaterThan(10)
    
    // Check that links have descriptive text
    for (const link of internalLinks.slice(0, 10)) {
      const text = await link.textContent()
      const ariaLabel = await link.getAttribute('aria-label')
      
      // Links should have descriptive text or aria-label
      expect(text || ariaLabel).toBeTruthy()
      
      // Avoid generic link text
      if (text) {
        expect(text.toLowerCase()).not.toBe('click here')
        expect(text.toLowerCase()).not.toBe('read more')
      }
    }
  })
  
  test('Page load performance for SEO', async ({ page }) => {
    const startTime = Date.now()
    await page.goto('/')
    const loadTime = Date.now() - startTime
    
    // Page should load quickly for SEO
    expect(loadTime).toBeLessThan(3000)
    
    // Check for render-blocking resources
    const renderBlockingScripts = await page.evaluate(() => {
      const scripts = document.querySelectorAll('script:not([async]):not([defer])')
      return Array.from(scripts).filter(s => !s.src.includes('gtm') && !s.src.includes('analytics'))
    })
    
    expect(renderBlockingScripts.length).toBe(0)
  })
})