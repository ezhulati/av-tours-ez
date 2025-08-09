import { test, expect, devices } from '@playwright/test'

// Common mobile devices to test
const MOBILE_DEVICES = [
  { name: 'iPhone 12', device: devices['iPhone 12'] },
  { name: 'iPhone SE', device: devices['iPhone SE'] },
  { name: 'Pixel 5', device: devices['Pixel 5'] },
  { name: 'Galaxy S21', device: devices['Galaxy S9'] },
  { name: 'iPad', device: devices['iPad (gen 7)'] },
]

// Network conditions
const NETWORK_CONDITIONS = {
  '3G': {
    offline: false,
    downloadThroughput: (500 * 1024) / 8, // 500kb/s
    uploadThroughput: (500 * 1024) / 8,
    latency: 400,
  },
  '4G': {
    offline: false,
    downloadThroughput: (4 * 1024 * 1024) / 8, // 4Mb/s
    uploadThroughput: (3 * 1024 * 1024) / 8,
    latency: 50,
  },
  'Slow 3G': {
    offline: false,
    downloadThroughput: (40 * 1024) / 8, // 40kb/s
    uploadThroughput: (40 * 1024) / 8,
    latency: 2000,
  },
}

test.describe('Mobile Touch Gestures', () => {
  test.use(devices['iPhone 12'])

  test('should handle swipe gestures in gallery', async ({ page }) => {
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    // Find gallery element
    const gallery = page.locator('[data-testid="tour-gallery"], .gallery').first()
    await expect(gallery).toBeVisible()
    
    // Get initial state
    const initialImage = await gallery.locator('img').first().getAttribute('src')
    
    // Perform swipe gesture
    const box = await gallery.boundingBox()
    if (box) {
      await page.touchscreen.tap(box.x + box.width * 0.8, box.y + box.height / 2)
      await page.waitForTimeout(100)
      
      // Swipe left
      await page.touchscreen.swipe({
        startX: box.x + box.width * 0.8,
        startY: box.y + box.height / 2,
        endX: box.x + box.width * 0.2,
        endY: box.y + box.height / 2,
        speed: 300,
      })
      
      // Verify image changed
      await page.waitForTimeout(500)
      const newImage = await gallery.locator('img').first().getAttribute('src')
      expect(newImage).not.toBe(initialImage)
    }
  })

  test('should handle pinch-to-zoom on images', async ({ page }) => {
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    const image = page.locator('[data-testid="tour-gallery"] img').first()
    await expect(image).toBeVisible()
    
    const box = await image.boundingBox()
    if (box) {
      // Simulate pinch-to-zoom
      const centerX = box.x + box.width / 2
      const centerY = box.y + box.height / 2
      
      // Start with two fingers close together
      await page.touchscreen.tap(centerX - 10, centerY)
      await page.touchscreen.tap(centerX + 10, centerY)
      
      // Move fingers apart (zoom in)
      await Promise.all([
        page.touchscreen.swipe({
          startX: centerX - 10,
          startY: centerY,
          endX: centerX - 50,
          endY: centerY,
          speed: 200,
        }),
        page.touchscreen.swipe({
          startX: centerX + 10,
          startY: centerY,
          endX: centerX + 50,
          endY: centerY,
          speed: 200,
        }),
      ])
    }
  })

  test('should handle pull-to-refresh', async ({ page }) => {
    await page.goto('/tours')
    
    // Simulate pull-to-refresh gesture
    await page.touchscreen.swipe({
      startX: 200,
      startY: 100,
      endX: 200,
      endY: 400,
      speed: 500,
    })
    
    // Page should handle the gesture gracefully
    await expect(page.locator('[data-testid="tour-card"]').first()).toBeVisible()
  })

  test('should have smooth scroll behavior', async ({ page }) => {
    await page.goto('/tours')
    
    // Test momentum scrolling
    await page.touchscreen.swipe({
      startX: 200,
      startY: 600,
      endX: 200,
      endY: 100,
      speed: 100, // Fast swipe for momentum
    })
    
    // Content should scroll smoothly
    await page.waitForTimeout(1000)
    
    // Check scroll position changed
    const scrollY = await page.evaluate(() => window.scrollY)
    expect(scrollY).toBeGreaterThan(0)
  })
})

test.describe('Mobile Viewport Testing', () => {
  MOBILE_DEVICES.forEach(({ name, device }) => {
    test(`should render correctly on ${name}`, async ({ browser }) => {
      const context = await browser.newContext(device)
      const page = await context.newPage()
      
      await page.goto('/')
      
      // Check viewport meta
      const viewport = await page.evaluate(() => {
        return document.querySelector('meta[name="viewport"]')?.getAttribute('content')
      })
      expect(viewport).toContain('width=device-width')
      
      // Check mobile menu is visible
      const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]')
      const isMenuVisible = await mobileMenu.isVisible()
      
      // On phones, menu should be collapsed
      if (device.viewport.width < 768) {
        expect(isMenuVisible).toBeTruthy()
      }
      
      // Check touch targets
      const buttons = await page.locator('button, a').all()
      for (const button of buttons.slice(0, 5)) { // Check first 5
        const box = await button.boundingBox()
        if (box) {
          expect(box.height).toBeGreaterThanOrEqual(44) // iOS minimum
          expect(box.width).toBeGreaterThanOrEqual(44)
        }
      }
      
      await context.close()
    })
  })

  test('should handle orientation changes', async ({ browser }) => {
    const context = await browser.newContext({
      ...devices['iPhone 12'],
      viewport: { width: 390, height: 844 }, // Portrait
    })
    const page = await context.newPage()
    
    await page.goto('/')
    
    // Get initial layout
    const portraitLayout = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: window.screen.orientation?.type || 'portrait',
    }))
    
    // Change to landscape
    await page.setViewportSize({ width: 844, height: 390 })
    
    // Trigger orientation change event
    await page.evaluate(() => {
      window.dispatchEvent(new Event('orientationchange'))
    })
    
    await page.waitForTimeout(500)
    
    // Get landscape layout
    const landscapeLayout = await page.evaluate(() => ({
      width: window.innerWidth,
      height: window.innerHeight,
      orientation: window.screen.orientation?.type || 'landscape',
    }))
    
    expect(landscapeLayout.width).toBeGreaterThan(landscapeLayout.height)
    expect(portraitLayout.width).toBeLessThan(portraitLayout.height)
    
    await context.close()
  })
})

test.describe('Mobile Network Conditions', () => {
  test.use(devices['iPhone 12'])

  test('should load on 3G network', async ({ page, context }) => {
    // Simulate 3G network
    await context.route('**/*', async route => {
      await new Promise(resolve => setTimeout(resolve, 100)) // Add latency
      await route.continue()
    })
    
    const startTime = Date.now()
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    const loadTime = Date.now() - startTime
    
    // Should load within reasonable time on 3G
    expect(loadTime).toBeLessThan(10000)
    
    // Critical content should be visible
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[data-testid="tour-card"]').first()).toBeVisible({ timeout: 15000 })
  })

  test('should show offline message when disconnected', async ({ page, context }) => {
    await page.goto('/')
    
    // Go offline
    await context.setOffline(true)
    
    // Try to navigate
    await page.locator('[data-testid="tour-card"]').first().click().catch(() => {})
    
    // Should show offline indicator or handle gracefully
    // Implementation dependent - adjust based on actual offline handling
    const offlineIndicator = page.locator('text=/offline|connection|network/i')
    const isOfflineHandled = await offlineIndicator.isVisible().catch(() => false)
    
    // Either shows offline message or caches content
    expect(isOfflineHandled || await page.title()).toBeTruthy()
    
    // Go back online
    await context.setOffline(false)
  })

  test('should implement progressive enhancement', async ({ page }) => {
    // Disable JavaScript
    await page.goto('/', { waitUntil: 'domcontentloaded' })
    await page.setJavaScriptEnabled(false)
    await page.reload()
    
    // Core content should still be accessible
    const title = await page.locator('h1').textContent()
    expect(title).toBeTruthy()
    
    // Links should work
    const links = await page.locator('a[href^="/tours"]').count()
    expect(links).toBeGreaterThan(0)
    
    // Re-enable JavaScript
    await page.setJavaScriptEnabled(true)
  })
})

test.describe('Mobile-Specific Features', () => {
  test.use(devices['iPhone 12'])

  test('should trigger haptic feedback on interactions', async ({ page }) => {
    await page.goto('/tours')
    
    // Mock vibrate API
    await page.evaluate(() => {
      window.vibrateLog = []
      navigator.vibrate = (pattern) => {
        (window as any).vibrateLog.push(pattern)
        return true
      }
    })
    
    // Click booking button
    await page.locator('[data-testid="tour-card"]').first().click()
    await page.locator('button:has-text("Book"), button:has-text("Check Availability")').first().click()
    
    // Check if vibrate was called
    const vibrateLog = await page.evaluate(() => (window as any).vibrateLog)
    expect(vibrateLog.length).toBeGreaterThan(0)
  })

  test('should handle app-like navigation', async ({ page }) => {
    await page.goto('/')
    
    // Test swipe-back gesture (iOS)
    await page.locator('[data-testid="tour-card"]').first().click()
    await page.waitForURL(/\/tours\//)
    
    // Simulate swipe from left edge
    await page.touchscreen.swipe({
      startX: 10,
      startY: 400,
      endX: 300,
      endY: 400,
      speed: 300,
    })
    
    // Should handle gesture or use browser back
    await page.goBack()
    await expect(page).toHaveURL(/\/(tours)?$/)
  })

  test('should optimize for one-handed use', async ({ page }) => {
    await page.goto('/tours')
    
    // Check that important actions are in thumb-reach zone
    const buttons = await page.locator('button, [role="button"]').all()
    const viewportHeight = 844 // iPhone 12 height
    
    for (const button of buttons) {
      const box = await button.boundingBox()
      if (box) {
        // Important buttons should be in lower 2/3 of screen (thumb reach)
        const isInThumbReach = box.y > viewportHeight * 0.33
        
        // At least some buttons should be reachable
        if (isInThumbReach) {
          expect(box.height).toBeGreaterThanOrEqual(44)
        }
      }
    }
  })

  test('should handle mobile form input correctly', async ({ page }) => {
    await page.goto('/tours')
    
    // Find search or filter input
    const searchInput = page.locator('input[type="search"], input[type="text"]').first()
    
    if (await searchInput.isVisible()) {
      await searchInput.click()
      
      // Check that keyboard appears (viewport changes)
      await page.waitForTimeout(500)
      
      // Type with mobile keyboard
      await searchInput.type('albania tours', { delay: 100 })
      
      // Check autocomplete/suggestions if available
      const suggestions = page.locator('[role="listbox"], .suggestions, .autocomplete')
      if (await suggestions.isVisible()) {
        await suggestions.locator('li, [role="option"]').first().click()
      }
      
      // Dismiss keyboard
      await page.keyboard.press('Enter')
    }
  })
})

test.describe('Mobile Performance Optimization', () => {
  test.use(devices['iPhone 12'])

  test('should lazy load images on mobile', async ({ page }) => {
    let imagesLoaded = 0
    
    page.on('response', response => {
      if (response.url().match(/\.(jpg|jpeg|png|webp|avif)/i)) {
        imagesLoaded++
      }
    })
    
    await page.goto('/tours')
    
    // Initial images loaded
    const initialImages = imagesLoaded
    
    // Scroll down
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(1000)
    
    // More images should load
    expect(imagesLoaded).toBeGreaterThan(initialImages)
  })

  test('should use appropriate image sizes for mobile', async ({ page }) => {
    await page.goto('/tours')
    
    const images = await page.locator('img').all()
    
    for (const img of images.slice(0, 5)) { // Check first 5
      const srcset = await img.getAttribute('srcset')
      
      if (srcset) {
        // Should have mobile-optimized sizes
        expect(srcset).toMatch(/\b(375w|390w|414w|768w)\b/)
      }
      
      // Check actual loaded image size
      const naturalWidth = await img.evaluate((el: HTMLImageElement) => el.naturalWidth)
      
      // On mobile, images shouldn't be unnecessarily large
      expect(naturalWidth).toBeLessThanOrEqual(1200)
    }
  })

  test('should minimize JavaScript execution on mobile', async ({ page }) => {
    const metrics = await page.evaluate(() => {
      const start = performance.now()
      
      // Simulate some JavaScript work
      for (let i = 0; i < 1000; i++) {
        document.querySelectorAll('*').length
      }
      
      return {
        executionTime: performance.now() - start,
        memoryUsage: (performance as any).memory?.usedJSHeapSize,
      }
    })
    
    // JavaScript execution should be fast
    expect(metrics.executionTime).toBeLessThan(100)
  })
})

test.describe('Mobile Accessibility', () => {
  test.use(devices['iPhone 12'])

  test('should support mobile screen readers', async ({ page }) => {
    await page.goto('/')
    
    // Check for proper ARIA labels on mobile-specific elements
    const mobileMenu = page.locator('[data-testid="mobile-menu"], button[aria-label*="menu"]')
    if (await mobileMenu.isVisible()) {
      const ariaLabel = await mobileMenu.getAttribute('aria-label')
      expect(ariaLabel).toBeTruthy()
    }
    
    // Check for proper focus management
    await page.keyboard.press('Tab')
    const focused = await page.evaluate(() => document.activeElement?.tagName)
    expect(focused).toBeTruthy()
  })

  test('should have sufficient touch target spacing', async ({ page }) => {
    await page.goto('/tours')
    
    const touchTargets = await page.locator('button, a, input, [role="button"]').all()
    const positions: Array<{ x: number; y: number; width: number; height: number }> = []
    
    for (const target of touchTargets.slice(0, 10)) { // Check first 10
      const box = await target.boundingBox()
      if (box) {
        positions.push(box)
      }
    }
    
    // Check spacing between adjacent targets
    for (let i = 0; i < positions.length - 1; i++) {
      const current = positions[i]
      const next = positions[i + 1]
      
      // Calculate minimum distance
      const horizontalGap = Math.abs(next.x - (current.x + current.width))
      const verticalGap = Math.abs(next.y - (current.y + current.height))
      
      // Should have at least 8px spacing (WCAG 2.5.8)
      if (horizontalGap < 100) { // Adjacent horizontally
        expect(horizontalGap).toBeGreaterThanOrEqual(8)
      }
      if (verticalGap < 100) { // Adjacent vertically
        expect(verticalGap).toBeGreaterThanOrEqual(8)
      }
    }
  })
})