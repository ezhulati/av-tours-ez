# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

### Development
- `npm run dev` - Start local development server at localhost:4321
- `npm run build` - Build production site to ./dist/
- `npm run preview` - Preview production build locally
- `npm run lint` - Run ESLint across the codebase
- `npm run test` - Run Vitest unit tests
- `npm run test:e2e` - Run Playwright end-to-end tests

### Testing Individual Components
- Test specific tour pages: `http://localhost:4321/tours/[slug]`
- Test affiliate redirects: `http://localhost:4321/out/[slug]`
- Test API endpoints: `http://localhost:4321/api/tours`

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
- `src/lib/dto.ts` - TypeScript interfaces for tour data
- `src/pages/api/tours.ts` - Main tours API with filtering
- `src/pages/api/out/[slug].ts` - Affiliate redirect tracking

#### Components
- `src/components/tours/` - All tour-related React components
- `src/components/ui/button.tsx` - Radix-based design system button
- `src/layouts/BaseLayout.astro` - Site-wide layout with navigation

#### Styling & Assets
- `src/styles/global.css` - Tailwind config and custom utilities
- Mobile-first breakpoints: 375px, 768px, 1024px, 1440px+
- Color system: accent (red), gray neutrals, no blue hues

### Environment & Deployment
- **Supabase**: Connection via `src/lib/supabase.server.ts`
- **Netlify**: Configured in `netlify.toml` with redirects for `/out/*`
- **CSP**: Content Security Policy configured for external tour operators
- **Node 18**: Specified in `.nvmrc` for consistent builds

### Development Patterns
- **React Hydration**: Use `client:load` for interactive components
- **Astro Islands**: Minimal JavaScript, maximum performance
- **Type Safety**: All data flows through TypeScript DTOs
- **Error Handling**: Graceful degradation for missing affiliate URLs
- **Mobile Testing**: Always test responsive behavior 375px-1440px+

### Affiliate Business Logic
- **Primary Partner**: BNAdventure.com for all tour bookings
- **Tracking**: Partner ID 9, TID "albaniavisit", full UTM parameter support
- **Conversion Flow**: AlbaniaVisit -> Modal -> BNAdventure booking page
- **Analytics**: Server-side click tracking in `affiliate_clicks` table