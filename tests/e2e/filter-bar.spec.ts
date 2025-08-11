import { test, expect } from '@playwright/test'

test.describe('FilterBar Component E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/tours')
    await page.waitForLoadState('networkidle')
  })

  test.describe('Desktop Experience', () => {
    test.use({ viewport: { width: 1440, height: 900 } })

    test('should display all filter controls on desktop', async ({ page }) => {
      // All filters should be visible
      await expect(page.getByLabel('Filter by country')).toBeVisible()
      await expect(page.getByLabel('Filter by difficulty level')).toBeVisible()
      await expect(page.getByLabel('Minimum duration in days')).toBeVisible()
      await expect(page.getByLabel('Maximum duration in days')).toBeVisible()
      await expect(page.getByLabel('Minimum price in euros')).toBeVisible()
      await expect(page.getByLabel('Maximum price in euros')).toBeVisible()
      await expect(page.getByLabel('Filter by group size')).toBeVisible()
      await expect(page.getByLabel('Sort tours')).toBeVisible()
    })

    test('should filter tours by country', async ({ page }) => {
      // Select Albania
      await page.getByLabel('Filter by country').selectOption('Albania')
      
      // Wait for results to update
      await page.waitForResponse(response => 
        response.url().includes('/api/tours') && 
        response.url().includes('country=Albania')
      )
      
      // Check URL updated
      await expect(page).toHaveURL(/country=Albania/)
      
      // Verify results (assuming tour cards have data attributes)
      const tourCards = page.locator('[data-testid="tour-card"]')
      await expect(tourCards).toHaveCount.greaterThan(0)
    })

    test('should apply multiple filters simultaneously', async ({ page }) => {
      // Apply multiple filters
      await page.getByLabel('Filter by country').selectOption('Albania')
      await page.getByLabel('Filter by difficulty level').selectOption('easy')
      await page.getByLabel('Minimum price in euros').fill('100')
      await page.getByLabel('Maximum price in euros').fill('500')
      
      // Wait for debounced API call
      await page.waitForTimeout(600)
      
      // Check URL has all parameters
      await expect(page).toHaveURL(/country=Albania/)
      await expect(page).toHaveURL(/difficulty=easy/)
      await expect(page).toHaveURL(/price_min=100/)
      await expect(page).toHaveURL(/price_max=500/)
      
      // Clear filters button should be visible
      await expect(page.getByRole('button', { name: 'Clear all filters' })).toBeVisible()
    })

    test('should clear all filters', async ({ page }) => {
      // Apply some filters
      await page.getByLabel('Filter by country').selectOption('Kosovo')
      await page.getByLabel('Filter by difficulty level').selectOption('moderate')
      
      // Wait for filters to apply
      await page.waitForTimeout(600)
      
      // Clear filters
      await page.getByRole('button', { name: 'Clear all filters' }).click()
      
      // All filters should be reset
      await expect(page.getByLabel('Filter by country')).toHaveValue('')
      await expect(page.getByLabel('Filter by difficulty level')).toHaveValue('')
      
      // Clear button should be hidden
      await expect(page.getByRole('button', { name: 'Clear all filters' })).not.toBeVisible()
    })

    test('should show loading state during filtering', async ({ page }) => {
      // Slow down network to see loading state
      await page.route('**/api/tours*', async route => {
        await page.waitForTimeout(1000)
        await route.continue()
      })
      
      // Apply filter
      await page.getByLabel('Filter by country').selectOption('Montenegro')
      
      // Loading indicator should appear
      await expect(page.getByRole('status', { name: 'Loading tours' })).toBeVisible()
      
      // Wait for loading to complete
      await expect(page.getByRole('status', { name: 'Loading tours' })).not.toBeVisible({ timeout: 5000 })
    })

    test('should debounce rapid filter changes', async ({ page }) => {
      let apiCallCount = 0
      
      // Intercept API calls
      await page.route('**/api/tours*', async route => {
        apiCallCount++
        await route.continue()
      })
      
      // Type rapidly in price field
      const priceInput = page.getByLabel('Minimum price in euros')
      await priceInput.fill('1')
      await priceInput.fill('10')
      await priceInput.fill('100')
      
      // Wait for debounce period
      await page.waitForTimeout(600)
      
      // Should only make one API call
      expect(apiCallCount).toBeLessThanOrEqual(2) // Initial load + debounced call
    })
  })

  test.describe('Mobile Experience', () => {
    test.use({ viewport: { width: 375, height: 667 } })

    test('should show collapsible filter panel on mobile', async ({ page }) => {
      // Filter content should be hidden initially
      const filterContent = page.locator('#filter-content')
      await expect(filterContent).toHaveClass(/hidden/)
      
      // Toggle button should be visible
      const toggleButton = page.getByRole('button', { name: /show tour filters/i })
      await expect(toggleButton).toBeVisible()
    })

    test('should open and close filter panel', async ({ page }) => {
      const toggleButton = page.getByRole('button', { name: /show tour filters/i })
      const filterContent = page.locator('#filter-content')
      
      // Open filters
      await toggleButton.click()
      await expect(filterContent).not.toHaveClass(/hidden/)
      await expect(toggleButton).toHaveAttribute('aria-expanded', 'true')
      
      // Close filters
      await toggleButton.click()
      await expect(filterContent).toHaveClass(/hidden/)
      await expect(toggleButton).toHaveAttribute('aria-expanded', 'false')
    })

    test('should show active filter count in mobile toggle', async ({ page }) => {
      const toggleButton = page.getByRole('button', { name: /show tour filters/i })
      
      // Open filters
      await toggleButton.click()
      
      // Apply filters
      await page.getByLabel('Filter by country').selectOption('Albania')
      await page.getByLabel('Filter by difficulty level').selectOption('easy')
      
      // Close filters
      await toggleButton.click()
      
      // Should show active count
      await expect(page.locator('text=2 active')).toBeVisible()
    })

    test('should close panel with Escape key', async ({ page }) => {
      const toggleButton = page.getByRole('button', { name: /show tour filters/i })
      
      // Open filters
      await toggleButton.click()
      await expect(page.locator('#filter-content')).not.toHaveClass(/hidden/)
      
      // Press Escape
      await page.keyboard.press('Escape')
      
      // Should be closed
      await expect(page.locator('#filter-content')).toHaveClass(/hidden/)
    })

    test('should have touch-friendly control sizes', async ({ page }) => {
      // Open filters
      await page.getByRole('button', { name: /show tour filters/i }).click()
      
      // Check minimum heights
      const selects = page.locator('select')
      const selectCount = await selects.count()
      
      for (let i = 0; i < selectCount; i++) {
        const select = selects.nth(i)
        const box = await select.boundingBox()
        expect(box?.height).toBeGreaterThanOrEqual(48)
      }
      
      const inputs = page.locator('input[type="number"]')
      const inputCount = await inputs.count()
      
      for (let i = 0; i < inputCount; i++) {
        const input = inputs.nth(i)
        const box = await input.boundingBox()
        expect(box?.height).toBeGreaterThanOrEqual(48)
      }
    })
  })

  test.describe('Accessibility', () => {
    test('should support keyboard navigation', async ({ page }) => {
      // Start at first filter
      await page.getByLabel('Filter by country').focus()
      
      // Tab through filters
      await page.keyboard.press('Tab')
      await expect(page.getByLabel('Filter by difficulty level')).toBeFocused()
      
      await page.keyboard.press('Tab')
      await expect(page.getByLabel('Minimum duration in days')).toBeFocused()
      
      // Shift+Tab to go back
      await page.keyboard.press('Shift+Tab')
      await expect(page.getByLabel('Filter by difficulty level')).toBeFocused()
    })

    test('should announce results to screen readers', async ({ page }) => {
      // Apply filter
      await page.getByLabel('Filter by country').selectOption('Albania')
      
      // Wait for results
      await page.waitForTimeout(600)
      
      // Check for screen reader announcement
      const announcer = page.locator('#filter-announcer')
      await expect(announcer).toContainText(/Found \d+ tour/)
    })

    test('should have proper ARIA labels', async ({ page }) => {
      // Check region
      await expect(page.getByRole('region', { name: 'Tour filters' })).toBeVisible()
      
      // Check all filters have labels
      const filters = [
        'Filter by country',
        'Filter by difficulty level',
        'Minimum duration in days',
        'Maximum duration in days',
        'Minimum price in euros',
        'Maximum price in euros',
        'Filter by group size',
        'Sort tours'
      ]
      
      for (const label of filters) {
        await expect(page.getByLabel(label)).toBeVisible()
      }
    })

    test('should handle focus trap in mobile panel', async ({ page }) => {
      // Switch to mobile viewport
      await page.setViewportSize({ width: 375, height: 667 })
      
      // Open filter panel
      await page.getByRole('button', { name: /show tour filters/i }).click()
      
      // Focus should move to first filter
      await page.waitForTimeout(150)
      
      // Tab through all filters and ensure focus stays within panel
      const filterCount = 8 // Number of filter controls
      for (let i = 0; i < filterCount + 2; i++) {
        await page.keyboard.press('Tab')
      }
      
      // Focus should cycle back to beginning of panel
      const activeElement = await page.evaluate(() => document.activeElement?.getAttribute('aria-label'))
      expect(activeElement).toBeTruthy()
    })
  })

  test.describe('Error Handling', () => {
    test('should display error message on API failure', async ({ page }) => {
      // Make API fail
      await page.route('**/api/tours*', route => route.abort())
      
      // Apply filter
      await page.getByLabel('Filter by country').selectOption('Albania')
      
      // Wait for error
      await expect(page.getByRole('alert')).toContainText('Failed to load tours')
    })

    test('should recover from errors', async ({ page }) => {
      // Make first call fail
      let callCount = 0
      await page.route('**/api/tours*', async route => {
        callCount++
        if (callCount === 1) {
          await route.abort()
        } else {
          await route.continue()
        }
      })
      
      // Apply filter (will fail)
      await page.getByLabel('Filter by country').selectOption('Albania')
      await expect(page.getByRole('alert')).toBeVisible()
      
      // Clear and retry
      await page.getByRole('button', { name: 'Clear all filters' }).click()
      
      // Error should be gone
      await expect(page.getByRole('alert')).not.toBeVisible()
    })
  })

  test.describe('Performance', () => {
    test('should handle large result sets efficiently', async ({ page }) => {
      // Measure time to apply filters
      const startTime = Date.now()
      
      await page.getByLabel('Filter by country').selectOption('Albania')
      await page.waitForResponse(response => response.url().includes('/api/tours'))
      
      const endTime = Date.now()
      const loadTime = endTime - startTime
      
      // Should complete within reasonable time
      expect(loadTime).toBeLessThan(3000)
    })

    test('should cancel previous requests when filters change rapidly', async ({ page }) => {
      const responses: string[] = []
      
      // Track all API responses
      page.on('response', response => {
        if (response.url().includes('/api/tours')) {
          responses.push(response.url())
        }
      })
      
      // Change filters rapidly
      await page.getByLabel('Filter by country').selectOption('Albania')
      await page.getByLabel('Filter by country').selectOption('Kosovo')
      await page.getByLabel('Filter by country').selectOption('Montenegro')
      
      // Wait for debounce
      await page.waitForTimeout(600)
      
      // Should have cancelled earlier requests
      // Only the last filter value should be in the final request
      const lastResponse = responses[responses.length - 1]
      expect(lastResponse).toContain('Montenegro')
    })
  })

  test.describe('Visual Regression', () => {
    test('should match desktop layout screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 1440, height: 900 })
      await expect(page.locator('[role="region"][aria-label="Tour filters"]')).toHaveScreenshot('filter-bar-desktop.png')
    })

    test('should match mobile collapsed screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await expect(page.locator('[role="region"][aria-label="Tour filters"]')).toHaveScreenshot('filter-bar-mobile-collapsed.png')
    })

    test('should match mobile expanded screenshot', async ({ page }) => {
      await page.setViewportSize({ width: 375, height: 667 })
      await page.getByRole('button', { name: /show tour filters/i }).click()
      await page.waitForTimeout(300) // Wait for animation
      await expect(page.locator('[role="region"][aria-label="Tour filters"]')).toHaveScreenshot('filter-bar-mobile-expanded.png')
    })

    test('should match loading state screenshot', async ({ page }) => {
      // Slow down API
      await page.route('**/api/tours*', async route => {
        await page.waitForTimeout(2000)
        await route.continue()
      })
      
      // Trigger loading
      await page.getByLabel('Filter by country').selectOption('Albania')
      await page.waitForTimeout(100)
      
      await expect(page.locator('[role="region"][aria-label="Tour filters"]')).toHaveScreenshot('filter-bar-loading.png')
    })
  })
})