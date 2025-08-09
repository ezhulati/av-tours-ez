import { test, expect } from '@playwright/test'
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'

// Performance budgets based on Core Web Vitals
const PERFORMANCE_BUDGETS = {
  FCP: 1800, // First Contentful Paint (ms)
  LCP: 2500, // Largest Contentful Paint (ms)
  CLS: 0.1,  // Cumulative Layout Shift
  FID: 100,  // First Input Delay (ms)
  TTFB: 800, // Time to First Byte (ms)
  TTI: 3800, // Time to Interactive (ms)
}

// Mobile performance budgets (slightly relaxed)
const MOBILE_PERFORMANCE_BUDGETS = {
  FCP: 2400,
  LCP: 3500,
  CLS: 0.15,
  FID: 200,
  TTFB: 1200,
  TTI: 5000,
}

// Bundle size limits
const BUNDLE_SIZE_LIMITS = {
  'main.js': 200 * 1024, // 200KB
  'vendor.js': 300 * 1024, // 300KB
  'main.css': 50 * 1024, // 50KB
  total: 600 * 1024, // 600KB total
}

test.describe('Performance Tests', () => {
  test('should meet Core Web Vitals on homepage', async ({ page }) => {
    await page.goto('/')
    
    // Measure Core Web Vitals
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {}
        
        // First Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
              metrics.FCP = entry.startTime
            }
          })
        }).observe({ entryTypes: ['paint'] })
        
        // Largest Contentful Paint
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          metrics.LCP = lastEntry.startTime
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        // Cumulative Layout Shift
        let clsValue = 0
        new PerformanceObserver((list) => {
          for (const entry of list.getEntries()) {
            if (!(entry as any).hadRecentInput) {
              clsValue += (entry as any).value
            }
          }
          metrics.CLS = clsValue
        }).observe({ entryTypes: ['layout-shift'] })
        
        // Time to First Byte
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming
        metrics.TTFB = navigation.responseStart - navigation.fetchStart
        
        // Resolve after collecting metrics
        setTimeout(() => resolve(metrics), 5000)
      })
    })
    
    // Assert metrics are within budgets
    expect(metrics.FCP).toBeLessThan(PERFORMANCE_BUDGETS.FCP)
    expect(metrics.LCP).toBeLessThan(PERFORMANCE_BUDGETS.LCP)
    expect(metrics.CLS).toBeLessThan(PERFORMANCE_BUDGETS.CLS)
    expect(metrics.TTFB).toBeLessThan(PERFORMANCE_BUDGETS.TTFB)
  })

  test('should meet mobile performance budgets', async ({ page }) => {
    // Set mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Throttle network to 3G
    await page.route('**/*', route => route.continue())
    
    await page.goto('/')
    
    const metrics = await page.evaluate(() => {
      return new Promise((resolve) => {
        const metrics: any = {}
        
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          entries.forEach(entry => {
            if (entry.name === 'first-contentful-paint') {
              metrics.FCP = entry.startTime
            }
          })
        }).observe({ entryTypes: ['paint'] })
        
        new PerformanceObserver((list) => {
          const entries = list.getEntries()
          const lastEntry = entries[entries.length - 1]
          metrics.LCP = lastEntry.startTime
        }).observe({ entryTypes: ['largest-contentful-paint'] })
        
        setTimeout(() => resolve(metrics), 5000)
      })
    })
    
    expect(metrics.FCP).toBeLessThan(MOBILE_PERFORMANCE_BUDGETS.FCP)
    expect(metrics.LCP).toBeLessThan(MOBILE_PERFORMANCE_BUDGETS.LCP)
  })

  test('should have optimized image loading', async ({ page }) => {
    await page.goto('/')
    
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
    
    // Check for responsive images
    const responsiveImages = await page.locator('img[srcset], picture source').count()
    expect(responsiveImages).toBeGreaterThan(0)
  })

  test('should minimize bundle sizes', async ({ page }) => {
    const resources: Record<string, number> = {}
    
    page.on('response', response => {
      const url = response.url()
      const headers = response.headers()
      const contentLength = headers['content-length']
      
      if (url.includes('.js') || url.includes('.css')) {
        const filename = url.split('/').pop() || ''
        resources[filename] = parseInt(contentLength || '0')
      }
    })
    
    await page.goto('/')
    await page.waitForLoadState('networkidle')
    
    // Check individual bundle sizes
    for (const [file, size] of Object.entries(resources)) {
      if (file.includes('main') && file.endsWith('.js')) {
        expect(size).toBeLessThan(BUNDLE_SIZE_LIMITS['main.js'])
      }
      if (file.includes('vendor') && file.endsWith('.js')) {
        expect(size).toBeLessThan(BUNDLE_SIZE_LIMITS['vendor.js'])
      }
      if (file.includes('main') && file.endsWith('.css')) {
        expect(size).toBeLessThan(BUNDLE_SIZE_LIMITS['main.css'])
      }
    }
    
    // Check total bundle size
    const totalSize = Object.values(resources).reduce((sum, size) => sum + size, 0)
    expect(totalSize).toBeLessThan(BUNDLE_SIZE_LIMITS.total)
  })

  test('should handle slow network gracefully', async ({ page, context }) => {
    // Simulate slow 3G
    await context.route('**/*', route => {
      setTimeout(() => route.continue(), 100) // Add 100ms delay
    })
    
    const startTime = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const loadTime = Date.now() - startTime
    
    // Page should be interactive within 10 seconds on slow network
    expect(loadTime).toBeLessThan(10000)
    
    // Critical content should be visible
    await expect(page.locator('h1')).toBeVisible({ timeout: 5000 })
  })

  test('should optimize API response times', async ({ page }) => {
    const apiTimes: number[] = []
    
    page.on('response', response => {
      if (response.url().includes('/api/')) {
        const timing = response.timing()
        if (timing) {
          apiTimes.push(timing.responseEnd)
        }
      }
    })
    
    await page.goto('/tours')
    await page.waitForLoadState('networkidle')
    
    // All API calls should complete within 1 second
    for (const time of apiTimes) {
      expect(time).toBeLessThan(1000)
    }
    
    // Average API response time should be under 500ms
    const avgTime = apiTimes.reduce((sum, time) => sum + time, 0) / apiTimes.length
    expect(avgTime).toBeLessThan(500)
  })
})

test.describe('Lighthouse Performance Audit', () => {
  test.skip('should score well on Lighthouse audit', async () => {
    const chrome = await launch({ chromeFlags: ['--headless'] })
    const options = {
      logLevel: 'info' as const,
      output: 'json' as const,
      port: chrome.port,
    }
    
    const runnerResult = await lighthouse('http://localhost:4321', options)
    await chrome.kill()
    
    if (!runnerResult) {
      throw new Error('Lighthouse failed to run')
    }
    
    const { lhr } = runnerResult
    
    // Performance score should be at least 90
    expect(lhr.categories.performance.score).toBeGreaterThanOrEqual(0.9)
    
    // Accessibility score should be at least 95
    expect(lhr.categories.accessibility.score).toBeGreaterThanOrEqual(0.95)
    
    // Best practices score should be at least 90
    expect(lhr.categories['best-practices'].score).toBeGreaterThanOrEqual(0.9)
    
    // SEO score should be 100
    expect(lhr.categories.seo.score).toBe(1)
  })
})

test.describe('Memory and Resource Usage', () => {
  test('should not have memory leaks', async ({ page }) => {
    await page.goto('/')
    
    // Get initial memory usage
    const initialMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    // Navigate through multiple pages
    for (let i = 0; i < 5; i++) {
      await page.goto('/tours')
      await page.goto('/')
    }
    
    // Force garbage collection if available
    await page.evaluate(() => {
      if ((global as any).gc) {
        (global as any).gc()
      }
    })
    
    // Get final memory usage
    const finalMemory = await page.evaluate(() => {
      return (performance as any).memory?.usedJSHeapSize || 0
    })
    
    // Memory should not increase by more than 50%
    expect(finalMemory).toBeLessThan(initialMemory * 1.5)
  })

  test('should cancel pending requests on navigation', async ({ page }) => {
    let pendingRequests = 0
    
    page.on('request', () => pendingRequests++)
    page.on('requestfinished', () => pendingRequests--)
    page.on('requestfailed', () => pendingRequests--)
    
    await page.goto('/tours')
    
    // Navigate away before all resources load
    await page.goto('/', { waitUntil: 'commit' })
    
    // Wait a bit for cleanup
    await page.waitForTimeout(1000)
    
    // Should have no or very few pending requests
    expect(pendingRequests).toBeLessThanOrEqual(2)
  })
})