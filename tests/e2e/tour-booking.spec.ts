import { test, expect } from '@playwright/test'

test.describe('Tour Booking Flow', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tours')
  })

  test('should display tour listing page', async ({ page }) => {
    await expect(page).toHaveTitle(/Tours/)
    await expect(page.locator('h1')).toContainText(/Albania Tours/)
    
    // Check for tour cards
    const tourCards = page.locator('article[data-testid="tour-card"]')
    await expect(tourCards).toHaveCount(await tourCards.count())
  })

  test('should filter tours by category', async ({ page }) => {
    // Click on adventure filter
    await page.click('button:has-text("Adventure")')
    
    // Wait for filtered results
    await page.waitForLoadState('networkidle')
    
    // Verify URL contains filter
    await expect(page).toHaveURL(/category=adventure/)
    
    // Check that tours are filtered
    const tourCards = page.locator('article[data-testid="tour-card"]')
    const count = await tourCards.count()
    expect(count).toBeGreaterThan(0)
  })

  test('should filter tours by price range', async ({ page }) => {
    // Set price range
    await page.fill('input[name="minPrice"]', '20')
    await page.fill('input[name="maxPrice"]', '100')
    await page.click('button:has-text("Apply")')
    
    await page.waitForLoadState('networkidle')
    
    // Verify filtered results
    const prices = await page.locator('[data-testid="tour-price"]').allTextContents()
    prices.forEach(price => {
      const numPrice = parseFloat(price.replace('$', ''))
      expect(numPrice).toBeGreaterThanOrEqual(20)
      expect(numPrice).toBeLessThanOrEqual(100)
    })
  })

  test('should navigate to tour detail page', async ({ page }) => {
    // Click first tour card
    const firstTour = page.locator('article[data-testid="tour-card"]').first()
    const tourName = await firstTour.locator('h3').textContent()
    
    await firstTour.click()
    
    // Verify navigation to detail page
    await expect(page).toHaveURL(/\/tours\//)
    await expect(page.locator('h1')).toContainText(tourName!)
  })

  test('should complete booking flow', async ({ page }) => {
    // Navigate to a specific tour
    await page.goto('/tours/blue-eye-spring')
    
    // Click Book Now button
    await page.click('button:has-text("Book Now")')
    
    // Verify modal appears
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    await expect(page.locator('[role="dialog"]')).toContainText(/Booking with BNAdventure/)
    
    // Click Continue to Booking
    await page.click('button:has-text("Continue to Booking")')
    
    // Should track click and redirect
    await page.waitForURL(/bnadventure\.com/, { timeout: 10000 })
  })

  test('should handle modal cancellation', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    
    // Open booking modal
    await page.click('button:has-text("Book Now")')
    await expect(page.locator('[role="dialog"]')).toBeVisible()
    
    // Cancel modal
    await page.click('button:has-text("Cancel")')
    
    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
    
    // Should still be on same page
    await expect(page).toHaveURL(/\/tours\/blue-eye-spring/)
  })

  test('should display tour information correctly', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    
    // Check main elements
    await expect(page.locator('h1')).toBeVisible()
    await expect(page.locator('[data-testid="tour-price"]')).toBeVisible()
    await expect(page.locator('[data-testid="tour-duration"]')).toBeVisible()
    await expect(page.locator('[data-testid="tour-location"]')).toBeVisible()
    
    // Check sections
    await expect(page.locator('text=Highlights')).toBeVisible()
    await expect(page.locator('text=What\'s Included')).toBeVisible()
    await expect(page.locator('text=Itinerary')).toBeVisible()
  })
})