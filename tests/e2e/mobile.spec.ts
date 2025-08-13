import { test, expect, devices } from '@playwright/test'

test.use(devices['iPhone 12'])

test.describe('Mobile Experience', () => {
  test('should have responsive navigation menu', async ({ page }) => {
    await page.goto('/')
    
    // Mobile menu button should be visible
    const menuButton = page.locator('[data-testid="mobile-menu-button"]')
    await expect(menuButton).toBeVisible()
    
    // Click to open menu
    await menuButton.click()
    
    // Navigation links should be visible
    await expect(page.locator('nav a:has-text("Tours")')).toBeVisible()
    await expect(page.locator('nav a:has-text("About")')).toBeVisible()
    await expect(page.locator('nav a:has-text("Contact")')).toBeVisible()
  })

  test('should display tour cards in mobile layout', async ({ page }) => {
    await page.goto('/tours')
    
    // Tour cards should stack vertically
    const tourCards = page.locator('article[data-testid="tour-card"]')
    const firstCard = tourCards.first()
    const secondCard = tourCards.nth(1)
    
    const firstBox = await firstCard.boundingBox()
    const secondBox = await secondCard.boundingBox()
    
    // Cards should be stacked (second card Y position > first card bottom)
    if (firstBox && secondBox) {
      expect(secondBox.y).toBeGreaterThan(firstBox.y + firstBox.height)
    }
  })

  test('should have collapsible filters on mobile', async ({ page }) => {
    await page.goto('/tours')
    
    // Filter toggle button should be visible
    const filterToggle = page.locator('[data-testid="filter-toggle"]')
    await expect(filterToggle).toBeVisible()
    
    // Filters should be hidden initially
    const filterPanel = page.locator('[data-testid="filter-panel"]')
    await expect(filterPanel).not.toBeVisible()
    
    // Click to show filters
    await filterToggle.click()
    await expect(filterPanel).toBeVisible()
    
    // Apply a filter
    await page.click('button:has-text("Adventure")')
    
    // Filters should auto-collapse after applying
    await expect(filterPanel).not.toBeVisible()
  })

  test('should have touch-friendly booking button', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    
    const bookButton = page.locator('button:has-text("Book Now")')
    const box = await bookButton.boundingBox()
    
    // Button should be at least 44px tall (iOS touch target)
    if (box) {
      expect(box.height).toBeGreaterThanOrEqual(44)
    }
    
    // Button should be full width on mobile
    const viewport = page.viewportSize()
    if (box && viewport) {
      expect(box.width).toBeCloseTo(viewport.width - 32, 5) // Accounting for padding
    }
  })

  test('should have optimized image gallery for mobile', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    
    // Gallery section should be visible
    const gallery = page.locator('[data-testid="image-gallery"]')
    await expect(gallery).toBeVisible()
    
    // Check that the gallery is properly sized for mobile
    const box = await gallery.boundingBox()
    if (box) {
      // Gallery should be prominent but not full screen on mobile
      expect(box.height).toBeGreaterThan(250)
      expect(box.height).toBeLessThan(700)
    }
  })

  test('should have sticky booking bar on mobile', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    
    // Scroll down
    await page.evaluate(() => window.scrollBy(0, 500))
    
    // Booking bar should be sticky at bottom
    const bookingBar = page.locator('[data-testid="mobile-booking-bar"]')
    await expect(bookingBar).toBeVisible()
    
    const box = await bookingBar.boundingBox()
    const viewport = page.viewportSize()
    
    // Should be positioned at bottom of viewport
    if (box && viewport) {
      expect(box.y + box.height).toBeCloseTo(viewport.height, 5)
    }
  })

  test('should have optimized font sizes for mobile', async ({ page }) => {
    await page.goto('/tours')
    
    // Check heading font size
    const heading = page.locator('h1')
    const fontSize = await heading.evaluate(el => 
      window.getComputedStyle(el).fontSize
    )
    
    // Font should be at least 24px for readability
    expect(parseInt(fontSize)).toBeGreaterThanOrEqual(24)
    
    // Check body text
    const bodyText = page.locator('p').first()
    const bodyFontSize = await bodyText.evaluate(el => 
      window.getComputedStyle(el).fontSize
    )
    
    // Body text should be at least 14px
    expect(parseInt(bodyFontSize)).toBeGreaterThanOrEqual(14)
  })

  test('should handle offline gracefully', async ({ page, context }) => {
    await page.goto('/tours')
    
    // Go offline
    await context.setOffline(true)
    
    // Try to navigate
    await page.click('article[data-testid="tour-card"]').catch(() => {})
    
    // Should show offline message
    await expect(page.locator('text=/offline|connection/i')).toBeVisible({ timeout: 5000 })
    
    // Go back online
    await context.setOffline(false)
    await page.reload()
    
    // Should work again
    await expect(page.locator('article[data-testid="tour-card"]')).toBeVisible()
  })
})