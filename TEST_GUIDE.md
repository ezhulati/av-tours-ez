# AlbaniaVisit Tours - Comprehensive Test Guide

## Overview

This document provides complete instructions for running and maintaining the test suite for the AlbaniaVisit Tours application. The test suite ensures world-class quality across all critical areas including functionality, performance, accessibility, and SEO.

## Test Coverage Areas

### 1. Component Tests (Unit/Integration)
- **Location**: `/tests/component/`
- **Framework**: Vitest + React Testing Library
- **Coverage Target**: >80%
- **Key Components**:
  - BookingButton (all states and variants)
  - RedirectModal (transparency flow)
  - FilterBar functionality
  - Tour cards and galleries
  - Form components

### 2. End-to-End Tests
- **Location**: `/tests/e2e/`
- **Framework**: Playwright
- **Coverage**:
  - Complete booking flow (browse → detail → modal → redirect)
  - Mobile-specific user journeys
  - Cross-device booking continuity
  - Affiliate tracking verification
  - Error recovery scenarios

### 3. Performance Tests
- **Location**: `/tests/performance/`
- **Metrics Monitored**:
  - Core Web Vitals (LCP < 2.5s, FID < 100ms, CLS < 0.1)
  - Bundle sizes (main < 200KB, vendor < 300KB)
  - API response times (< 1s)
  - Memory usage and leaks
  - Network condition handling

### 4. Accessibility Tests
- **Location**: `/tests/accessibility/`
- **Standards**: WCAG 2.1 AA
- **Coverage**:
  - Screen reader compatibility
  - Keyboard navigation
  - Touch target sizes (min 48px)
  - Color contrast ratios
  - ARIA implementation

### 5. SEO & Schema Tests
- **Location**: `/tests/seo/`
- **Validation**:
  - Meta tags (title, description, OG, Twitter)
  - Schema.org structured data
  - Sitemap generation
  - Canonical URLs
  - Hreflang implementation

### 6. Mobile-Specific Tests
- **Location**: `/tests/e2e/mobile.spec.ts`
- **Devices Tested**:
  - iPhone 12, iPhone SE
  - Pixel 5, Galaxy S21
  - iPad
- **Features**:
  - Touch gestures
  - Orientation changes
  - Network conditions (3G/4G)
  - Haptic feedback
  - One-handed usability

## Installation

### Prerequisites
- Node.js 20+
- pnpm 8+

### Setup
```bash
# Install dependencies
pnpm install

# Install Playwright browsers
pnpm exec playwright install
```

## Running Tests

### Quick Start
```bash
# Run all unit tests
pnpm test

# Run all E2E tests
pnpm test:e2e

# Run complete test suite
pnpm test:all
```

### Component Tests
```bash
# Run unit tests
pnpm test

# Run with coverage
pnpm test:coverage

# Run in watch mode
pnpm test:watch

# Open UI mode
pnpm test:ui
```

### E2E Tests
```bash
# Run all E2E tests
pnpm test:e2e

# Run in headed mode (see browser)
pnpm test:e2e:headed

# Debug mode
pnpm test:e2e:debug

# Specific browser
pnpm test:e2e --project=chromium
pnpm test:e2e --project=firefox
pnpm test:e2e --project=webkit
```

### Specialized Tests
```bash
# Mobile tests only
pnpm test:mobile

# Accessibility tests
pnpm test:a11y

# Performance tests
pnpm test:perf

# SEO tests
pnpm test:seo
```

### CI/CD Tests
```bash
# Run tests as in CI
pnpm test:ci
```

## Test Development

### Writing Component Tests

```typescript
// Example: BookingButton.test.tsx
import { describe, it, expect, vi } from 'vitest'
import { render, screen } from '../utils/test-utils'
import userEvent from '@testing-library/user-event'
import BookingButton from '@/components/tours/BookingButton'
import { tourFactory } from '../factories/tourFactory'

describe('BookingButton', () => {
  it('should open modal on click', async () => {
    const user = userEvent.setup()
    const tour = tourFactory.build()
    
    render(<BookingButton tour={tour} />)
    
    const button = screen.getByRole('button')
    await user.click(button)
    
    expect(screen.getByText(/leaving albaniavisit/i)).toBeInTheDocument()
  })
})
```

### Writing E2E Tests

```typescript
// Example: booking-flow.spec.ts
import { test, expect } from '@playwright/test'

test('complete booking flow', async ({ page }) => {
  await page.goto('/')
  
  // Browse tours
  await page.locator('[data-testid="tour-card"]').first().click()
  
  // Check tour details
  await expect(page.locator('h1')).toBeVisible()
  
  // Click booking button
  await page.locator('button:has-text("Book Now")').click()
  
  // Verify modal
  await expect(page.locator('text=/leaving albaniavisit/i')).toBeVisible()
})
```

### Writing Accessibility Tests

```typescript
// Example: accessibility.spec.ts
import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

test('WCAG compliance', async ({ page }) => {
  await page.goto('/')
  
  const results = await new AxeBuilder({ page })
    .withTags(['wcag2aa'])
    .analyze()
  
  expect(results.violations).toEqual([])
})
```

## Test Data & Mocking

### Using Factories

```typescript
import { tourFactory, operatorFactory } from '../factories/tourFactory'

// Create single tour
const tour = tourFactory.build()

// Create with overrides
const customTour = tourFactory.build({
  title: 'Special Tour',
  price: 999
})

// Create multiple
const tours = tourFactory.buildList(10)
```

### Using MSW for API Mocking

```typescript
import { http, HttpResponse } from 'msw'

export const handlers = [
  http.get('/api/tours', () => {
    return HttpResponse.json({ tours: tourFactory.buildList(10) })
  })
]
```

## Coverage Requirements

### Minimum Coverage Thresholds
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%
- **Statements**: 80%

### Viewing Coverage Reports
```bash
# Generate coverage report
pnpm test:coverage

# Open HTML report
open coverage/index.html
```

## Performance Benchmarks

### Core Web Vitals Targets
| Metric | Desktop | Mobile |
|--------|---------|--------|
| FCP | < 1.8s | < 2.4s |
| LCP | < 2.5s | < 3.5s |
| CLS | < 0.1 | < 0.15 |
| FID | < 100ms | < 200ms |
| TTFB | < 800ms | < 1.2s |

### Bundle Size Limits
- Main JS: < 200KB
- Vendor JS: < 300KB
- Main CSS: < 50KB
- Total: < 600KB

## CI/CD Integration

### GitHub Actions Workflow
Tests run automatically on:
- Push to main/develop branches
- Pull requests
- Daily at 2 AM UTC

### Test Jobs
1. **Unit Tests**: Vitest with coverage
2. **E2E Tests**: Playwright on Chrome, Firefox, Safari
3. **Mobile Tests**: Mobile viewports and touch interactions
4. **Accessibility Tests**: WCAG 2.1 AA compliance
5. **Performance Tests**: Core Web Vitals and bundle analysis
6. **SEO Tests**: Meta tags and schema validation

## Debugging Tests

### Component Tests
```bash
# Debug with UI
pnpm test:ui

# Debug specific test
pnpm test BookingButton

# Debug with console logs
pnpm test -- --reporter=verbose
```

### E2E Tests
```bash
# Debug mode with inspector
pnpm test:e2e:debug

# Slow down execution
SLOWMO=1000 pnpm test:e2e

# Save traces
pnpm test:e2e --trace on

# View trace
pnpm exec playwright show-trace trace.zip
```

### Screenshots & Videos
Failed E2E tests automatically capture:
- Screenshots on failure
- Videos on failure
- Traces for debugging

Find artifacts in:
- `playwright-report/`
- `test-results/`

## Troubleshooting

### Common Issues

#### 1. Playwright browsers not installed
```bash
pnpm exec playwright install
```

#### 2. Port 4321 already in use
```bash
# Kill process on port
lsof -ti:4321 | xargs kill -9
```

#### 3. Test timeouts
Increase timeout in test:
```typescript
test('slow test', async ({ page }) => {
  test.setTimeout(60000) // 60 seconds
  // ...
})
```

#### 4. Flaky tests
Use retry and wait strategies:
```typescript
await expect(element).toBeVisible({ timeout: 10000 })
await page.waitForLoadState('networkidle')
```

## Best Practices

### 1. Test Organization
- Group related tests in describe blocks
- Use clear, descriptive test names
- One assertion per test when possible

### 2. Test Data
- Use factories for consistent test data
- Avoid hardcoded values
- Clean up after tests

### 3. Selectors
- Prefer data-testid attributes
- Use role-based queries for accessibility
- Avoid CSS class selectors

### 4. Async Operations
- Always await async operations
- Use proper wait strategies
- Handle loading states

### 5. Error Scenarios
- Test error states explicitly
- Verify error messages
- Test recovery flows

## Maintenance

### Regular Tasks
- **Weekly**: Review flaky tests
- **Monthly**: Update test dependencies
- **Quarterly**: Review coverage reports
- **Yearly**: Update WCAG compliance standards

### Adding New Tests
1. Identify test requirements from PRD/user stories
2. Write tests before implementation (TDD)
3. Ensure tests are deterministic
4. Add to appropriate test suite
5. Update this documentation

## Resources

### Documentation
- [Vitest Docs](https://vitest.dev/)
- [Playwright Docs](https://playwright.dev/)
- [Testing Library](https://testing-library.com/)
- [WCAG Guidelines](https://www.w3.org/WAI/WCAG21/quickref/)

### Tools
- [axe DevTools](https://www.deque.com/axe/devtools/)
- [Lighthouse](https://developers.google.com/web/tools/lighthouse)
- [Schema Validator](https://validator.schema.org/)

## Support

For test-related issues:
1. Check this guide first
2. Review existing test examples
3. Consult team lead
4. Create issue with reproduction steps

---

**Last Updated**: 2025-08-09
**Maintained By**: QA Team
**Version**: 1.0.0