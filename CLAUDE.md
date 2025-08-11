# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `pnpm dev` - Start local development server at localhost:4321
- `pnpm build` - Build production site to ./dist/
- `pnpm preview` - Preview production build locally
- `pnpm lint` - Run ESLint across the codebase

### Testing (Comprehensive Suite)
#### Unit Testing (Vitest)
- `pnpm test` - Run Vitest unit tests with watch mode
- `pnpm test:coverage` - Generate coverage report (80% threshold)
- `pnpm test:ui` - Launch Vitest UI for interactive testing
- `pnpm test:watch` - Run tests in watch mode

#### End-to-End Testing (Playwright)
- `pnpm test:e2e` - Run all E2E tests across browsers
- `pnpm test:e2e:headed` - Run E2E tests in headed mode
- `pnpm test:e2e:debug` - Debug E2E tests interactively
- `pnpm test:mobile` - Run mobile-specific E2E tests
- `pnpm test:a11y` - Run accessibility compliance tests
- `pnpm test:perf` - Run performance benchmark tests
- `pnpm test:seo` - Run SEO and schema validation tests

#### Combined Testing
- `pnpm test:all` - Run complete test suite (unit + E2E)
- `pnpm test:ci` - CI-optimized test pipeline

### Testing Individual Components
- Test specific tour pages: `http://localhost:4321/tours/[slug]`
- Test affiliate redirects: `http://localhost:4321/out/[slug]`
- Test API endpoints: `http://localhost:4321/api/tours`

### Data Synchronization Scripts
- `pnpm sync:prices` - Sync tour prices with BNAdventure (validated)
- `pnpm sync:images` - Sync featured images from BNAdventure
- `pnpm agent` - Run image validation agent
- `pnpm agent:once` - Run image validation agent once

## Architecture Overview

### Tech Stack
- **Framework**: Astro 5.12+ with SSR (server-side rendering)
- **Frontend**: React 19 islands with TypeScript
- **Styling**: Tailwind CSS with custom design system
- **Database**: Supabase (PostgreSQL)
- **Deployment**: Netlify with edge functions disabled
- **Analytics**: Custom affiliate tracking system

### Core Data Flow
1. **Database Layer**: Supabase stores tour data in `affiliate_tours` table
2. **Data Mapping**: `src/lib/adapters/dbMapper.ts` transforms raw data to DTOs
3. **Enhanced Content**: `src/data/enhancedTours.ts` overlays marketing copy
4. **API Layer**: `/api/tours` endpoints serve paginated, filtered results
5. **Affiliate System**: `/out/[slug]` redirects track conversions to BNAdventure

### Critical Components

#### BookingButton System
- **BookingButton.tsx**: Main booking component with modal flow
- **RedirectModal.tsx**: User confirmation before partner redirect  
- **Affiliate Tracking**: `src/lib/affiliateTracking.ts` handles URL building and analytics
- **Server Redirects**: `/out/[slug]` endpoints for proper tracking

#### Tour Data Architecture
```typescript
TourCardDTO -> TourDetailDTO (extends with operator, images, affiliate)
Enhanced Tours -> Marketing overlay system with badges, pricing, dates
Database Mapping -> Transforms affiliate_tours table to app DTOs
```

#### Mobile-First Responsive Design
- **70% mobile traffic**: All components prioritize mobile experience
- **Hero Gallery**: Minimal overlays on mobile, full experience on desktop
- **Booking Flow**: Modal-first approach with trust indicators
- **Filter System**: Collapsible on mobile, full controls on desktop

### Key File Locations

#### Data & API
- `src/lib/queries.ts` - Database queries and tour fetching
- `src/lib/queries-optimized.ts` - Performance-optimized query variations
- `src/lib/dto.ts` - TypeScript interfaces for tour data
- `src/lib/adapters/dbMapper.ts` - Database to DTO transformation layer
- `src/pages/api/tours.ts` - Main tours API with filtering
- `src/pages/api/tours-optimized.ts` - Enhanced API with caching and performance
- `src/pages/api/out/[slug].ts` - Affiliate redirect tracking
- `src/pages/api/out-secure/` - Secured affiliate redirect endpoints

#### Components & UI
- `src/components/tours/` - All tour-related React components
- `src/components/tours/OptimizedTourCard.tsx` - Performance-enhanced tour card
- `src/components/tours/BookingButtonOptimized.tsx` - Enhanced booking flow
- `src/components/ui/` - Radix-based design system components
- `src/components/ui/SkeletonLoader.tsx` - Loading state components
- `src/layouts/BaseLayout.astro` - Site-wide layout with navigation

#### Infrastructure & Security
- `src/lib/security/` - Security middleware and encryption utilities
- `src/lib/cache/` - Redis caching implementation
- `src/lib/db/` - Database connection pooling
- `src/lib/monitoring/` - Performance monitoring and analytics
- `src/lib/middleware/` - Rate limiting and request processing

#### Styling & Assets
- `src/styles/global.css` - Tailwind config and custom utilities
- Mobile-first breakpoints: 375px, 768px, 1024px, 1440px+
- Color system: accent (red), gray neutrals, no blue hues

#### Testing Architecture
- `tests/component/` - React component unit tests
- `tests/e2e/` - End-to-end browser tests
- `tests/accessibility/` - A11y compliance tests
- `tests/performance/` - Core Web Vitals and lighthouse tests
- `tests/seo/` - SEO and schema markup validation
- `tests/factories/` - Test data factories and mocks

### Environment & Deployment
- **Supabase**: Connection via `src/lib/supabase.server.ts` and `src/lib/supabase.secure.ts`
- **Netlify**: Configured in `netlify.toml` with `/out/*` redirects and CSP headers
- **Security**: Content Security Policy, rate limiting, and encrypted sensitive data
- **Performance**: Redis caching, connection pooling, and monitoring
- **Node 18**: Specified in `.nvmrc` for consistent builds

### Development Patterns & Best Practices
- **React Hydration**: Use `client:load` for interactive components
- **Astro Islands**: Minimal JavaScript, maximum performance
- **Type Safety**: All data flows through TypeScript DTOs with Zod validation
- **Error Handling**: Graceful degradation for missing affiliate URLs
- **Security-First**: All API endpoints use secure handlers and rate limiting
- **Performance Monitoring**: Built-in Core Web Vitals tracking and optimization
- **Mobile Testing**: Always test responsive behavior 375px-1440px+
- **Test Coverage**: Maintain 80% coverage threshold across unit tests

### Path Aliases & Module Resolution
- `@/` - Root src directory
- `@components/` - Components directory
- `@lib/` - Library utilities and services
- `@data/` - Data files and enhanced tour content

### Affiliate Business Logic
- **Primary Partner**: BNAdventure.com for all tour bookings
- **Tracking**: Partner ID 9, TID "albaniavisit", full UTM parameter support
- **Conversion Flow**: AlbaniaVisit -> Modal -> BNAdventure booking page
- **Analytics**: Server-side click tracking in `affiliate_clicks` table

## Important Development Guidelines

### Code Quality & Standards
- **Always run linting**: Use `pnpm lint` before committing changes
- **Security priority**: Use secure API handlers and validate all inputs
- **Performance first**: Optimize for Core Web Vitals and mobile experience
- **Test everything**: Maintain comprehensive test coverage across all layers

### Package Management
- **Use pnpm**: Project uses pnpm for package management, not npm
- **Node 18 required**: Specified in `.nvmrc` (Node v18)

### Multi-layered Testing Strategy
- **Component tests**: Focus on user interactions and business logic
- **E2E tests**: Cover complete user journeys across devices
- **Performance tests**: Monitor Core Web Vitals and loading metrics  
- **A11y tests**: Ensure WCAG compliance across all components
- **SEO tests**: Validate schema markup and meta tags

## Form System & Analytics

### Contact Forms
- **Formspree Integration**: All forms use Formspree for email routing
- **Tour Inquiries**: Form ID `xvgoogpj` for tour-specific inquiries
- **General Contact**: Form ID `xanyypoo` for general questions
- **Cross-Domain Tracking**: Microsoft Clarity configured for albaniavisit.com

### Monitoring & Reporting
- **Netlify Functions**: Scheduled weekly/monthly analytics reports
- **Performance Monitoring**: Built-in Core Web Vitals tracking
- **Affiliate Analytics**: Server-side click tracking in database

## Test Infrastructure

### Vitest Configuration
- **Test Files**: `tests/component/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}`
- **Coverage Threshold**: 80% for branches, functions, lines, and statements
- **Test Environment**: happy-dom with React Testing Library
- **Setup File**: `tests/setup.ts` for global test configuration

### Playwright Configuration  
- **Browser Support**: Chromium, Firefox, WebKit, Mobile Chrome, Mobile Safari
- **Base URL**: `http://localhost:4321` (override with E2E_BASE_URL env)
- **Test Reports**: HTML, JSON, and JUnit formats in test-results/
- **Trace & Video**: Captured on test failure for debugging

## Path Resolution & Aliases

### TypeScript Path Mapping
- `@/*` → `src/*` - Root source directory
- `@components/*` → `src/components/*` - React/Astro components
- `@lib/*` → `src/lib/*` - Utilities and services
- `@data/*` → `src/data/*` - Static data and enhanced content

### Vite Aliases (for testing)
- Same path mappings configured in `vitest.config.ts`
- Ensures consistent imports across runtime and test environments

## Database Schema

### Primary Table: `affiliate_tours`
- Contains all tour data fetched from BNAdventure
- Key fields: `title`, `slug`, `price_from`, `difficulty_level`, `locations` (JSON array), `activity_type`
- Enhanced with `featured_image_url` for optimized images
- Affiliate tracking: `affiliate_url`, `affiliate_partner_id`, `affiliate_product_id`

### Analytics Table: `affiliate_clicks`
- Tracks all outbound clicks to partner sites
- Records: `tour_slug`, `timestamp`, `referrer`, `user_agent`, UTM parameters
- Used for conversion tracking and reporting