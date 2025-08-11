import { test, expect } from '@playwright/test'
import { injectAxe, checkA11y } from 'axe-playwright'

test.describe('Accessibility Tests', () => {
  test('Homepage accessibility', async ({ page }) => {
    await page.goto('/')
    await injectAxe(page)
    
    // Check for violations
    const violations = await checkA11y(page, undefined, {
      detailedReport: true,
      detailedReportOptions: {
        html: true,
      },
    })
    
    expect(violations).toBeNull()
  })
  
  test('Tours listing accessibility', async ({ page }) => {
    await page.goto('/tours')
    await injectAxe(page)
    
    // Check main content area
    await checkA11y(page, 'main', {
      detailedReport: true,
    })
    
    // Check specific WCAG criteria
    await checkA11y(page, undefined, {
      runOnly: {
        type: 'tag',
        values: ['wcag2a', 'wcag2aa', 'wcag21aa'],
      },
    })
  })
  
  test('Tour detail page accessibility', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    await injectAxe(page)
    
    await checkA11y(page, undefined, {
      detailedReport: true,
    })
  })
  
  test('Keyboard navigation', async ({ page }) => {
    await page.goto('/tours')
    
    // Tab through interactive elements
    await page.keyboard.press('Tab')
    let focusedElement = await page.evaluate(() => document.activeElement?.tagName)
    expect(focusedElement).toBeTruthy()
    
    // Navigate to first tour card
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      focusedElement = await page.evaluate(() => {
        const el = document.activeElement
        return el?.getAttribute('data-testid') || el?.tagName
      })
      
      if (focusedElement === 'tour-card') break
    }
    
    // Activate with Enter key
    await page.keyboard.press('Enter')
    await page.waitForURL(/\/tours\//)
    
    // Should navigate to tour detail
    expect(page.url()).toContain('/tours/')
  })
  
  test('Focus management in modal', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    
    // Open booking modal
    await page.click('button:has-text("Book Now")')
    
    // Check focus is trapped in modal
    const modalFocus = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]')
      return modal?.contains(document.activeElement)
    })
    
    expect(modalFocus).toBeTruthy()
    
    // Tab through modal elements
    await page.keyboard.press('Tab')
    await page.keyboard.press('Tab')
    
    // Focus should stay in modal
    const stillInModal = await page.evaluate(() => {
      const modal = document.querySelector('[role="dialog"]')
      return modal?.contains(document.activeElement)
    })
    
    expect(stillInModal).toBeTruthy()
    
    // Close with Escape
    await page.keyboard.press('Escape')
    
    // Modal should close
    await expect(page.locator('[role="dialog"]')).not.toBeVisible()
  })
  
  test('ARIA labels and roles', async ({ page }) => {
    await page.goto('/tours')
    
    // Check navigation landmark
    const nav = page.locator('nav')
    await expect(nav).toHaveAttribute('aria-label', /navigation|menu/i)
    
    // Check main landmark
    const main = page.locator('main')
    await expect(main).toBeVisible()
    
    // Check button accessibility
    const buttons = await page.locator('button').all()
    for (const button of buttons) {
      const text = await button.textContent()
      const ariaLabel = await button.getAttribute('aria-label')
      
      // Button should have accessible text or aria-label
      expect(text || ariaLabel).toBeTruthy()
    }
    
    // Check image alt texts
    const images = await page.locator('img').all()
    for (const img of images) {
      const alt = await img.getAttribute('alt')
      const role = await img.getAttribute('role')
      
      // Images should have alt text or be decorative
      expect(alt !== null || role === 'presentation').toBeTruthy()
    }
  })
  
  test('Color contrast', async ({ page }) => {
    await page.goto('/')
    await injectAxe(page)
    
    // Check color contrast specifically
    await checkA11y(page, undefined, {
      runOnly: {
        type: 'rule',
        values: ['color-contrast'],
      },
    })
  })
  
  test('Form accessibility', async ({ page }) => {
    await page.goto('/contact')
    
    // Check form labels
    const inputs = await page.locator('input:not([type="hidden"])').all()
    for (const input of inputs) {
      const id = await input.getAttribute('id')
      const label = id ? await page.locator(`label[for="${id}"]`).count() : 0
      const ariaLabel = await input.getAttribute('aria-label')
      
      // Input should have associated label or aria-label
      expect(label > 0 || ariaLabel !== null).toBeTruthy()
    }
    
    // Check error messages association
    await page.click('button[type="submit"]')
    
    const errorMessages = await page.locator('[role="alert"]').all()
    for (const error of errorMessages) {
      const id = await error.getAttribute('id')
      if (id) {
        const associatedInput = await page.locator(`[aria-describedby="${id}"]`).count()
        expect(associatedInput).toBeGreaterThan(0)
      }
    }
  })
  
  test('Screen reader announcements', async ({ page }) => {
    await page.goto('/tours')
    
    // Check for live regions
    const liveRegions = await page.locator('[aria-live]').all()
    expect(liveRegions.length).toBeGreaterThan(0)
    
    // Apply filter and check for announcement
    await page.click('button:has-text("Adventure")')
    
    // Check if results count is announced
    const announcement = await page.locator('[aria-live="polite"]').textContent()
    expect(announcement).toContain(/\d+ tours? found/)
  })
  
  test('Heading hierarchy', async ({ page }) => {
    await page.goto('/tours/blue-eye-spring')
    
    // Get all headings
    const headings = await page.evaluate(() => {
      const h1 = document.querySelectorAll('h1')
      const h2 = document.querySelectorAll('h2')
      const h3 = document.querySelectorAll('h3')
      
      return {
        h1Count: h1.length,
        h2Count: h2.length,
        h3Count: h3.length,
        h1Text: Array.from(h1).map(el => el.textContent),
      }
    })
    
    // Should have exactly one h1
    expect(headings.h1Count).toBe(1)
    
    // Should have logical heading structure
    if (headings.h3Count > 0) {
      expect(headings.h2Count).toBeGreaterThan(0)
    }
  })
  
  test('Skip navigation link', async ({ page }) => {
    await page.goto('/')
    
    // Focus skip link (usually first focusable element)
    await page.keyboard.press('Tab')
    
    const skipLink = await page.evaluate(() => {
      const el = document.activeElement
      return el?.textContent?.toLowerCase().includes('skip') || 
             el?.getAttribute('href') === '#main'
    })
    
    expect(skipLink).toBeTruthy()
  })
})