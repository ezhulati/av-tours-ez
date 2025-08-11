import { test, expect } from '@playwright/test'
import lighthouse from 'lighthouse'
import { launch } from 'chrome-launcher'

const THRESHOLDS = {
  performance: 90,
  accessibility: 95,
  'best-practices': 90,
  seo: 90,
  pwa: 80,
}

const CORE_WEB_VITALS = {
  'largest-contentful-paint': 2500, // LCP < 2.5s
  'first-input-delay': 100, // FID < 100ms
  'cumulative-layout-shift': 0.1, // CLS < 0.1
  'first-contentful-paint': 1800, // FCP < 1.8s
  'time-to-interactive': 3800, // TTI < 3.8s
  'speed-index': 3400, // SI < 3.4s
  'total-blocking-time': 200, // TBT < 200ms
}

async function runLighthouse(url: string) {
  const chrome = await launch({ chromeFlags: ['--headless'] })
  const options = {
    logLevel: 'info' as const,
    output: 'json' as const,
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo', 'pwa'],
    port: chrome.port,
  }
  
  const runnerResult = await lighthouse(url, options)
  await chrome.kill()
  
  return runnerResult?.lhr
}

test.describe('Lighthouse Performance Tests', () => {
  test('Homepage performance', async () => {
    const url = process.env.E2E_BASE_URL || 'http://localhost:4321'
    const results = await runLighthouse(url)
    
    if (!results) {
      throw new Error('Lighthouse failed to generate results')
    }
    
    // Check category scores
    Object.entries(THRESHOLDS).forEach(([category, threshold]) => {
      const score = (results.categories[category]?.score || 0) * 100
      expect(score).toBeGreaterThanOrEqual(threshold)
    })
    
    // Check Core Web Vitals
    const metrics = results.audits
    Object.entries(CORE_WEB_VITALS).forEach(([metric, threshold]) => {
      const value = metrics[metric]?.numericValue || 0
      expect(value).toBeLessThanOrEqual(threshold)
    })
  })
  
  test('Tours listing page performance', async () => {
    const url = `${process.env.E2E_BASE_URL || 'http://localhost:4321'}/tours`
    const results = await runLighthouse(url)
    
    if (!results) {
      throw new Error('Lighthouse failed to generate results')
    }
    
    const performanceScore = (results.categories.performance?.score || 0) * 100
    expect(performanceScore).toBeGreaterThanOrEqual(85)
    
    // Check LCP specifically for image-heavy page
    const lcp = results.audits['largest-contentful-paint']?.numericValue || 0
    expect(lcp).toBeLessThanOrEqual(3000) // Slightly higher threshold for tours page
  })
  
  test('Tour detail page performance', async () => {
    const url = `${process.env.E2E_BASE_URL || 'http://localhost:4321'}/tours/blue-eye-spring`
    const results = await runLighthouse(url)
    
    if (!results) {
      throw new Error('Lighthouse failed to generate results')
    }
    
    const performanceScore = (results.categories.performance?.score || 0) * 100
    expect(performanceScore).toBeGreaterThanOrEqual(85)
    
    // Check image optimization
    const imageOptimization = results.audits['uses-optimized-images']
    expect(imageOptimization?.score).toBeGreaterThanOrEqual(0.9)
    
    // Check for lazy loading
    const lazyLoading = results.audits['offscreen-images']
    expect(lazyLoading?.score).toBeGreaterThanOrEqual(0.9)
  })
})