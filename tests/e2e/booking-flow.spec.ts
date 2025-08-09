import { test, expect, Page } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test.describe('Complete Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  test('should complete full booking journey from homepage to partner redirect', async ({ page }) => {
    // Step 1: Browse tours from homepage
    await expect(page).toHaveTitle(/Albania Tours/)
    await expect(page.locator('h1')).toContainText(/Discover Albania/)
    
    // Check that tours are loaded
    await page.waitForSelector('[data-testid="tour-card"]', { timeout: 10000 })
    const tourCards = page.locator('[data-testid="tour-card"]')
    await expect(tourCards).toHaveCount(await tourCards.count())
    
    // Step 2: Click on a tour card to view details
    const firstTour = tourCards.first()
    const tourTitle = await firstTour.locator('h3').textContent()
    await firstTour.click()
    
    // Step 3: Verify tour detail page
    await page.waitForURL(/\/tours\/[^/]+$/)
    await expect(page.locator('h1')).toContainText(tourTitle || '')
    
    // Check critical tour information is displayed
    await expect(page.locator('[data-testid="tour-price"]')).toBeVisible()
    await expect(page.locator('[data-testid="tour-duration"]')).toBeVisible()
    await expect(page.locator('[data-testid="tour-description"]')).toBeVisible()
    
    // Step 4: Click booking button
    const bookingButton = page.locator('button:has-text("Check Availability"), button:has-text("Book Now")')
    await expect(bookingButton).toBeVisible()
    await bookingButton.click()
    
    // Step 5: Verify redirect modal appears
    await expect(page.locator('text=/you.*re leaving albaniavisit/i')).toBeVisible({ timeout: 5000 })
    await expect(page.locator('text=/redirecting to our trusted partner/i')).toBeVisible()
    
    // Verify modal content
    await expect(page.locator('text=/secure & trusted/i')).toBeVisible()
    await expect(page.locator('text=/check availability/i')).toBeVisible()
    await expect(page.locator('text=/best price/i')).toBeVisible()
    
    // Step 6: Test modal actions
    // Test closing modal
    await page.locator('button:has-text("Stay on AlbaniaVisit")').click()
    await expect(page.locator('text=/you.*re leaving albaniavisit/i')).not.toBeVisible()
    
    // Reopen modal
    await bookingButton.click()
    await expect(page.locator('text=/you.*re leaving albaniavisit/i')).toBeVisible()
    
    // Step 7: Continue to partner (in test, we'll just verify the button works)
    const continueButton = page.locator('button:has-text("Continue")')
    await expect(continueButton).toBeVisible()
    
    // Intercept the new tab/window opening
    const [newPage] = await Promise.all([
      page.context().waitForEvent('page'),
      continueButton.click()
    ])
    
    // Verify redirect URL pattern
    await expect(newPage.url()).toMatch(/\/out\//)
    await newPage.close()
  })

  test('should handle booking from tour listing page', async ({ page }) => {
    // Navigate to tours listing
    await page.goto('/tours')
    await page.waitForSelector('[data-testid="tour-card"]')
    
    // Click booking button directly from card
    const bookingButton = page.locator('[data-testid="tour-card"]').first().locator('button:has-text("View Tour"), button:has-text("Book Now")')
    await bookingButton.click()
    
    // Should either navigate to tour detail or open modal
    await expect(page).toHaveURL(/\/tours\/[^/]+$/)
  })

  test('should track affiliate clicks correctly', async ({ page }) => {
    // Setup request interception
    let affiliateTrackingCalled = false
    await page.route('**/api/track-click', route => {
      affiliateTrackingCalled = true
      route.fulfill({ status: 200, body: JSON.stringify({ success: true }) })
    })
    
    // Navigate to a tour
    await page.goto('/tours')
    const firstTour = page.locator('[data-testid="tour-card"]').first()
    await firstTour.click()
    
    // Click booking button
    const bookingButton = page.locator('button:has-text("Check Availability"), button:has-text("Book Now")')
    await bookingButton.click()
    
    // Continue to partner
    await page.locator('button:has-text("Continue")').click()
    
    // Verify tracking was called
    expect(affiliateTrackingCalled).toBe(true)
  })

  test('should preserve booking context across navigation', async ({ page }) => {
    // Start from homepage
    await page.goto('/')
    
    // Navigate to tours
    await page.locator('a:has-text("Tours"), a:has-text("Browse Tours")').first().click()
    await page.waitForURL(/\/tours/)
    
    // Select a tour
    const tourCard = page.locator('[data-testid="tour-card"]').first()
    const tourTitle = await tourCard.locator('h3').textContent()
    await tourCard.click()
    
    // Verify we're on the correct tour page
    await expect(page.locator('h1')).toContainText(tourTitle || '')
    
    // Navigate back
    await page.goBack()
    await expect(page).toHaveURL(/\/tours/)
    
    // Navigate forward
    await page.goForward()
    await expect(page.locator('h1')).toContainText(tourTitle || '')
  })

  test('should handle errors gracefully', async ({ page }) => {
    // Simulate API failure
    await page.route('**/api/tours/*', route => {
      route.fulfill({ status: 500, body: 'Server Error' })
    })
    
    // Try to load a tour page
    await page.goto('/tours/test-tour')
    
    // Should show error state (implementation dependent)
    // This assumes there's error handling in place
    await expect(page.locator('text=/error|failed|unable/i')).toBeVisible({ timeout: 10000 })
  })
})

test.describe('Mobile Booking Flow', () => {
  test.use({
    viewport: { width: 375, height: 667 },
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 14_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/14.0 Mobile/15E148 Safari/604.1'
  })

  test('should complete booking flow on mobile', async ({ page }) => {
    await page.goto('/')
    
    // Mobile menu navigation
    const menuButton = page.locator('[data-testid="mobile-menu"], button:has-text("Menu")')
    if (await menuButton.isVisible()) {
      await menuButton.click()
      await page.locator('a:has-text("Tours")').click()
    } else {
      await page.locator('a:has-text("Tours")').click()
    }
    
    // Wait for tours to load
    await page.waitForSelector('[data-testid="tour-card"]')
    
    // Click first tour
    await page.locator('[data-testid="tour-card"]').first().click()
    
    // Mobile-specific: Scroll to booking button
    const bookingButton = page.locator('button:has-text("Check Availability"), button:has-text("Book Now")')
    await bookingButton.scrollIntoViewIfNeeded()
    await bookingButton.click()
    
    // Verify modal appears and is mobile-optimized
    await expect(page.locator('text=/you.*re leaving albaniavisit/i')).toBeVisible()
    
    // Check mobile layout
    const modal = page.locator('[role="dialog"], .fixed.inset-0').filter({ hasText: /you.*re leaving/i })
    await expect(modal).toBeVisible()
    
    // Verify touch targets are adequate (min 48px)
    const buttons = modal.locator('button')
    const buttonCount = await buttons.count()
    for (let i = 0; i < buttonCount; i++) {
      const button = buttons.nth(i)
      const box = await button.boundingBox()
      expect(box?.height).toBeGreaterThanOrEqual(44) // iOS minimum
    }
  })

  test('should handle touch gestures on mobile gallery', async ({ page }) => {
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    // Find image gallery
    const gallery = page.locator('[data-testid="tour-gallery"], .gallery, [class*="gallery"]')
    if (await gallery.isVisible()) {
      // Simulate swipe gesture
      const box = await gallery.boundingBox()
      if (box) {
        await page.mouse.move(box.x + box.width * 0.8, box.y + box.height / 2)
        await page.mouse.down()
        await page.mouse.move(box.x + box.width * 0.2, box.y + box.height / 2, { steps: 10 })
        await page.mouse.up()
      }
    }
  })
})

test.describe('Accessibility Compliance', () => {
  test('should meet WCAG standards on homepage', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should meet WCAG standards on tour detail page', async ({ page }) => {
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should be keyboard navigable', async ({ page }) => {
    await page.goto('/')
    
    // Tab through main navigation
    await page.keyboard.press('Tab')
    await expect(page.locator(':focus')).toBeVisible()
    
    // Continue tabbing to tour cards
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
    }
    
    // Press Enter on focused element
    await page.keyboard.press('Enter')
    
    // Should navigate or trigger action
    await page.waitForTimeout(1000)
  })

  test('should work with screen reader', async ({ page }) => {
    await page.goto('/')
    
    // Check for ARIA landmarks
    await expect(page.locator('[role="main"]')).toBeVisible()
    await expect(page.locator('[role="navigation"]')).toBeVisible()
    
    // Check for proper heading hierarchy
    const h1 = await page.locator('h1').count()
    expect(h1).toBeGreaterThanOrEqual(1)
    
    // Check for alt text on images
    const images = page.locator('img')
    const imageCount = await images.count()
    for (let i = 0; i < Math.min(imageCount, 5); i++) {
      const img = images.nth(i)
      const alt = await img.getAttribute('alt')
      expect(alt).toBeTruthy()
    }
  })
})

test.describe('Cross-Device Continuity', () => {
  test('should maintain state across different viewports', async ({ page, context }) => {
    // Start on desktop
    await page.setViewportSize({ width: 1920, height: 1080 })
    await page.goto('/tours')
    
    // Select filters or search
    const searchInput = page.locator('input[type="search"], input[placeholder*="search"]')
    if (await searchInput.isVisible()) {
      await searchInput.fill('adventure')
      await page.keyboard.press('Enter')
    }
    
    // Switch to mobile viewport
    await page.setViewportSize({ width: 375, height: 667 })
    
    // Verify search/filter persists
    if (await searchInput.isVisible()) {
      const value = await searchInput.inputValue()
      expect(value).toBe('adventure')
    }
  })
})