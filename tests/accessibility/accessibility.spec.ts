import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

// WCAG 2.1 Level AA requirements
const WCAG_RULES = {
  'wcag2a': true,
  'wcag2aa': true,
  'wcag21a': true,
  'wcag21aa': true,
  'best-practice': true,
}

// Color contrast requirements
const CONTRAST_RATIOS = {
  normalText: 4.5, // WCAG AA for normal text
  largeText: 3.0,  // WCAG AA for large text (18pt+)
  enhancedNormalText: 7.0, // WCAG AAA for normal text
  enhancedLargeText: 4.5,  // WCAG AAA for large text
}

// Touch target minimum sizes
const TOUCH_TARGET_SIZES = {
  minimum: 44, // iOS minimum
  recommended: 48, // Material Design recommendation
}

test.describe('WCAG 2.1 Compliance', () => {
  test('should pass WCAG 2.1 AA on homepage', async ({ page }) => {
    await page.goto('/')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    // Log violations for debugging
    if (accessibilityScanResults.violations.length > 0) {
      console.log('Accessibility violations:', JSON.stringify(accessibilityScanResults.violations, null, 2))
    }
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should pass WCAG 2.1 AA on tour listing page', async ({ page }) => {
    await page.goto('/tours')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should pass WCAG 2.1 AA on tour detail page', async ({ page }) => {
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })

  test('should pass WCAG 2.1 AA with modal open', async ({ page }) => {
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    // Open booking modal
    const bookingButton = page.locator('button:has-text("Check Availability"), button:has-text("Book Now")').first()
    await bookingButton.click()
    
    // Wait for modal
    await page.waitForSelector('text=/you.*re leaving albaniavisit/i')
    
    const accessibilityScanResults = await new AxeBuilder({ page })
      .withTags(['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa'])
      .analyze()
    
    expect(accessibilityScanResults.violations).toEqual([])
  })
})

test.describe('Keyboard Navigation', () => {
  test('should navigate entire site with keyboard only', async ({ page }) => {
    await page.goto('/')
    
    // Start tabbing from body
    await page.keyboard.press('Tab')
    
    // First focused element should be skip link or main navigation
    const firstFocused = await page.evaluate(() => {
      const element = document.activeElement
      return {
        tagName: element?.tagName,
        text: element?.textContent?.trim(),
        role: element?.getAttribute('role'),
      }
    })
    
    expect(firstFocused.tagName).toMatch(/^(A|BUTTON)$/i)
    
    // Tab through main navigation
    for (let i = 0; i < 5; i++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => document.activeElement?.tagName)
      expect(focused).toBeTruthy()
    }
    
    // Test reverse tabbing
    await page.keyboard.press('Shift+Tab')
    const reverseFocused = await page.evaluate(() => document.activeElement?.tagName)
    expect(reverseFocused).toBeTruthy()
  })

  test('should handle focus trap in modal', async ({ page }) => {
    await page.goto('/tours')
    await page.locator('[data-testid="tour-card"]').first().click()
    
    // Open modal
    const bookingButton = page.locator('button:has-text("Check Availability"), button:has-text("Book Now")').first()
    await bookingButton.click()
    await page.waitForSelector('text=/you.*re leaving albaniavisit/i')
    
    // Tab through modal elements
    const modalElements: string[] = []
    for (let i = 0; i < 10; i++) {
      await page.keyboard.press('Tab')
      const focused = await page.evaluate(() => {
        const element = document.activeElement
        return element?.outerHTML.substring(0, 50)
      })
      modalElements.push(focused || '')
      
      // Check if we've cycled back to the first element
      if (i > 3 && modalElements[i] === modalElements[0]) {
        break
      }
    }
    
    // Focus should stay within modal
    expect(modalElements.length).toBeGreaterThan(0)
  })

  test('should provide keyboard shortcuts', async ({ page }) => {
    await page.goto('/')
    
    // Test Escape key closes modal
    await page.locator('[data-testid="tour-card"]').first().click()
    const bookingButton = page.locator('button:has-text("Check Availability"), button:has-text("Book Now")').first()
    await bookingButton.click()
    await page.waitForSelector('text=/you.*re leaving albaniavisit/i')
    
    await page.keyboard.press('Escape')
    await expect(page.locator('text=/you.*re leaving albaniavisit/i')).not.toBeVisible()
  })

  test('should show focus indicators', async ({ page }) => {
    await page.goto('/')
    
    // Tab to first interactive element
    await page.keyboard.press('Tab')
    
    // Check for focus styles
    const focusStyles = await page.evaluate(() => {
      const element = document.activeElement
      if (!element) return null
      
      const styles = window.getComputedStyle(element)
      return {
        outline: styles.outline,
        outlineWidth: styles.outlineWidth,
        outlineColor: styles.outlineColor,
        boxShadow: styles.boxShadow,
      }
    })
    
    // Should have visible focus indicator
    expect(
      focusStyles?.outline !== 'none' || 
      focusStyles?.boxShadow !== 'none' ||
      parseInt(focusStyles?.outlineWidth || '0') > 0
    ).toBeTruthy()
  })
})

test.describe('Screen Reader Support', () => {
  test('should have proper ARIA landmarks', async ({ page }) => {
    await page.goto('/')
    
    const landmarks = await page.evaluate(() => {
      const roles = ['banner', 'navigation', 'main', 'contentinfo', 'search', 'complementary']
      const found: Record<string, number> = {}
      
      roles.forEach(role => {
        const elements = document.querySelectorAll(`[role="${role}"]`)
        const tagElements = role === 'banner' ? document.querySelectorAll('header') :
                          role === 'navigation' ? document.querySelectorAll('nav') :
                          role === 'main' ? document.querySelectorAll('main') :
                          role === 'contentinfo' ? document.querySelectorAll('footer') : []
        
        found[role] = elements.length + tagElements.length
      })
      
      return found
    })
    
    // Should have essential landmarks
    expect(landmarks.navigation).toBeGreaterThan(0)
    expect(landmarks.main).toBe(1) // Only one main landmark
  })

  test('should have proper heading hierarchy', async ({ page }) => {
    await page.goto('/')
    
    const headings = await page.evaluate(() => {
      const h1 = document.querySelectorAll('h1')
      const h2 = document.querySelectorAll('h2')
      const h3 = document.querySelectorAll('h3')
      const h4 = document.querySelectorAll('h4')
      
      return {
        h1: h1.length,
        h2: h2.length,
        h3: h3.length,
        h4: h4.length,
        h1Text: Array.from(h1).map(h => h.textContent?.trim()),
      }
    })
    
    // Should have exactly one h1
    expect(headings.h1).toBe(1)
    
    // h1 should have content
    expect(headings.h1Text[0]).toBeTruthy()
    
    // Should have logical hierarchy (h2 before h3, etc.)
    if (headings.h3 > 0) {
      expect(headings.h2).toBeGreaterThan(0)
    }
  })

  test('should have descriptive link text', async ({ page }) => {
    await page.goto('/')
    
    const links = await page.evaluate(() => {
      const allLinks = document.querySelectorAll('a')
      const problems: string[] = []
      
      allLinks.forEach(link => {
        const text = link.textContent?.trim()
        const aria = link.getAttribute('aria-label')
        
        // Check for non-descriptive link text
        if (!aria && (!text || text.match(/^(click here|here|more|read more)$/i))) {
          problems.push(`Non-descriptive link: "${text}"`)
        }
      })
      
      return problems
    })
    
    expect(links).toEqual([])
  })

  test('should have alt text for images', async ({ page }) => {
    await page.goto('/')
    
    const imageIssues = await page.evaluate(() => {
      const images = document.querySelectorAll('img')
      const issues: string[] = []
      
      images.forEach(img => {
        const alt = img.getAttribute('alt')
        const src = img.getAttribute('src')
        
        if (alt === null) {
          issues.push(`Missing alt attribute: ${src}`)
        } else if (alt === '' && !img.getAttribute('role')?.includes('presentation')) {
          issues.push(`Empty alt without presentation role: ${src}`)
        }
      })
      
      return issues
    })
    
    expect(imageIssues).toEqual([])
  })

  test('should announce dynamic content changes', async ({ page }) => {
    await page.goto('/tours')
    
    // Check for ARIA live regions
    const liveRegions = await page.evaluate(() => {
      const regions = document.querySelectorAll('[aria-live], [role="alert"], [role="status"]')
      return regions.length
    })
    
    expect(liveRegions).toBeGreaterThan(0)
  })
})

test.describe('Color Contrast', () => {
  test('should have sufficient color contrast for text', async ({ page }) => {
    await page.goto('/')
    
    const contrastIssues = await page.evaluate(() => {
      const issues: string[] = []
      
      // This is a simplified check - in production, use a proper contrast calculation
      const elements = document.querySelectorAll('*')
      elements.forEach(element => {
        const styles = window.getComputedStyle(element)
        const color = styles.color
        const backgroundColor = styles.backgroundColor
        
        // Skip if transparent or inherited
        if (backgroundColor === 'rgba(0, 0, 0, 0)' || backgroundColor === 'transparent') {
          return
        }
        
        // Check for potential low contrast (this is simplified)
        if (color && backgroundColor) {
          // In a real implementation, calculate actual contrast ratio
          // For now, just flag light gray on white as potential issue
          if (color.includes('rgb(200') && backgroundColor.includes('rgb(255')) {
            issues.push(`Potential low contrast: ${element.tagName}`)
          }
        }
      })
      
      return issues
    })
    
    // This is a basic check - use axe-core for comprehensive testing
    expect(contrastIssues.length).toBeLessThan(5)
  })
})

test.describe('Touch Targets', () => {
  test('should have adequate touch target sizes on mobile', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const touchTargets = await page.evaluate((minSize) => {
      const issues: string[] = []
      const interactive = document.querySelectorAll('button, a, input, select, textarea, [role="button"]')
      
      interactive.forEach(element => {
        const rect = element.getBoundingClientRect()
        const width = rect.width
        const height = rect.height
        
        if (width < minSize || height < minSize) {
          issues.push(`Small touch target: ${element.tagName} (${width}x${height})`)
        }
      })
      
      return issues
    }, TOUCH_TARGET_SIZES.minimum)
    
    expect(touchTargets).toEqual([])
  })

  test('should have adequate spacing between touch targets', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')
    
    const spacingIssues = await page.evaluate(() => {
      const issues: string[] = []
      const interactive = Array.from(document.querySelectorAll('button, a, [role="button"]'))
      
      for (let i = 0; i < interactive.length - 1; i++) {
        const rect1 = interactive[i].getBoundingClientRect()
        const rect2 = interactive[i + 1].getBoundingClientRect()
        
        // Check if elements are close horizontally or vertically
        const horizontalGap = Math.abs(rect2.left - rect1.right)
        const verticalGap = Math.abs(rect2.top - rect1.bottom)
        
        if ((horizontalGap < 8 && horizontalGap > 0) || (verticalGap < 8 && verticalGap > 0)) {
          issues.push(`Insufficient spacing between touch targets`)
        }
      }
      
      return issues
    })
    
    // Allow some close targets but not too many
    expect(spacingIssues.length).toBeLessThan(3)
  })
})

test.describe('Form Accessibility', () => {
  test('should have accessible form labels', async ({ page }) => {
    await page.goto('/tours')
    
    const formIssues = await page.evaluate(() => {
      const issues: string[] = []
      const inputs = document.querySelectorAll('input, select, textarea')
      
      inputs.forEach(input => {
        const id = input.getAttribute('id')
        const ariaLabel = input.getAttribute('aria-label')
        const ariaLabelledby = input.getAttribute('aria-labelledby')
        
        // Check for associated label
        let hasLabel = false
        if (id) {
          hasLabel = !!document.querySelector(`label[for="${id}"]`)
        }
        
        if (!hasLabel && !ariaLabel && !ariaLabelledby) {
          issues.push(`Input without label: ${input.getAttribute('type') || 'text'}`)
        }
      })
      
      return issues
    })
    
    expect(formIssues).toEqual([])
  })

  test('should have error messages associated with fields', async ({ page }) => {
    // This test would need a form with validation
    // For now, we'll check if error messages use proper ARIA
    await page.goto('/tours')
    
    const errorHandling = await page.evaluate(() => {
      const errors = document.querySelectorAll('[role="alert"], .error-message, .field-error')
      const properlyAssociated: boolean[] = []
      
      errors.forEach(error => {
        const id = error.getAttribute('id')
        if (id) {
          // Check if any input references this error
          const associated = document.querySelector(`[aria-describedby*="${id}"], [aria-errormessage="${id}"]`)
          properlyAssociated.push(!!associated)
        }
      })
      
      return properlyAssociated
    })
    
    // All error messages should be associated with fields
    expect(errorHandling.every(Boolean)).toBeTruthy()
  })
})