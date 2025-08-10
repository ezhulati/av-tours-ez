import { test, expect } from '@playwright/test'

test.describe('Basic E2E Tests', () => {
  test('homepage loads successfully', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveTitle(/AlbaniaVisit/)
    await expect(page.locator('h1')).toContainText('Elevate')
  })

  test('tours page loads successfully', async ({ page }) => {
    await page.goto('/tours')
    await expect(page).toHaveTitle(/Tours/)
  })
})