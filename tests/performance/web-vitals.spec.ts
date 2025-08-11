import { test, expect } from '@playwright/test'

test.describe('Core Web Vitals Monitoring', () => {
  test('should meet LCP requirements on homepage', async ({ page }) => {
    await page.goto('/')
    
    // Measure LCP
    const lcp = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1] as any
          resolve(lastEntry.renderTime || lastEntry.loadTime)
        }).observe({ type: 'largest-contentful-paint', buffered: true })
        
        // Fallback after 10s
        setTimeout(() => resolve(10000), 10000)
      })
    })
    
    expect(lcp).toBeLessThan(2500) // Good LCP < 2.5s
  })
  
  test('should meet CLS requirements on tours page', async ({ page }) => {
    await page.goto('/tours')
    
    // Wait for initial load
    await page.waitForLoadState('networkidle')
    
    // Measure CLS
    const cls = await page.evaluate(() => {
      let clsScore = 0
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsScore += (entry as any).value
          }
        }
      }).observe({ type: 'layout-shift', buffered: true })
      
      return new Promise<number>((resolve) => {
        setTimeout(() => resolve(clsScore), 3000)
      })
    })
    
    expect(cls).toBeLessThan(0.1) // Good CLS < 0.1
  })
  
  test('should meet FID requirements', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    
    // Simulate user interaction
    const button = page.locator('button').first()
    
    const startTime = Date.now()
    await button.click()
    const endTime = Date.now()
    
    const fid = endTime - startTime
    expect(fid).toBeLessThan(100) // Good FID < 100ms
  })
  
  test('should have optimized bundle size', async ({ page }) => {
    const resourceSizes: Record<string, number> = {}
    
    page.on('response', response => {
      const url = response.url()
      const size = parseInt(response.headers()['content-length'] || '0')
      
      if (url.includes('.js')) {
        resourceSizes['js'] = (resourceSizes['js'] || 0) + size
      } else if (url.includes('.css')) {
        resourceSizes['css'] = (resourceSizes['css'] || 0) + size
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check bundle sizes (in bytes)
    expect(resourceSizes['js']).toBeLessThan(500000) // JS < 500KB
    expect(resourceSizes['css']).toBeLessThan(100000) // CSS < 100KB
  })
  
  test('should have efficient image loading', async ({ page }) => {
    await page.goto('/tours')
    
    // Check for lazy loading
    const images = await page.locator('img').all()
    let lazyLoadedCount = 0
    
    for (const img of images) {
      const loading = await img.getAttribute('loading')
      if (loading === 'lazy') {
        lazyLoadedCount++
      }
    }
    
    // At least 50% of images should be lazy loaded
    expect(lazyLoadedCount).toBeGreaterThan(images.length * 0.5)
    
    // Check for modern image formats
    const sources = await page.locator('source').all()
    let webpCount = 0
    
    for (const source of sources) {
      const type = await source.getAttribute('type')
      if (type?.includes('webp')) {
        webpCount++
      }
    }
    
    // Should have WebP sources
    expect(webpCount).toBeGreaterThan(0)
  })
  
  test('should have efficient caching headers', async ({ page }) => {
    const cacheableResources: string[] = []
    
    page.on('response', response => {
      const cacheControl = response.headers()['cache-control']
      const url = response.url()
      
      if (cacheControl && (url.includes('.js') || url.includes('.css') || url.includes('/Assets/'))) {
        if (cacheControl.includes('max-age=') && !cacheControl.includes('max-age=0')) {
          cacheableResources.push(url)
        }
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Should have cacheable static resources
    expect(cacheableResources.length).toBeGreaterThan(0)
  })
  
  test('should minimize main thread blocking', async ({ page }) => {
    await page.goto('/tours')
    
    const tbt = await page.evaluate(() => {
      return new Promise<number>((resolve) => {
        let totalBlockingTime = 0
        const observer = new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if ((entry as any).duration > 50) {
              totalBlockingTime += (entry as any).duration - 50
            }
          }
        })
        
        observer.observe({ type: 'longtask', buffered: true })
        
        setTimeout(() => {
          observer.disconnect()
          resolve(totalBlockingTime)
        }, 5000)
      })
    })
    
    expect(tbt).toBeLessThan(200) // TBT < 200ms
  })
  
  test('should have fast time to interactive', async ({ page }) => {
    const startTime = Date.now()
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Wait for page to be interactive
    await page.evaluate(() => {
      return new Promise((resolve) => {
        if (document.readyState === 'complete') {
          resolve(true)
        } else {
          window.addEventListener('load', () => resolve(true))
        }
      })
    })
    
    const tti = Date.now() - startTime
    expect(tti).toBeLessThan(3800) // TTI < 3.8s
  })
})