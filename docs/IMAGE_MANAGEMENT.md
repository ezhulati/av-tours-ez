# Tour Image Management System

## Overview

The AlbaniaVisit Tour Image Management System provides automated synchronization and deduplication of tour images from BNAdventure. This system solves the problem of duplicate images appearing on tour pages and ensures that tour images stay synchronized with the partner website.

## Features

### 1. Automated Image Scraping
- Extracts images from BNAdventure tour pages
- Follows affiliate links to get actual tour page content
- Captures primary images, gallery images, and thumbnails
- Preserves image metadata (alt text, dimensions)

### 2. Deduplication System
- Prevents the same image from appearing multiple times on a tour page
- Uses MD5 hashing to identify duplicate images
- Maintains relationships between original and duplicate images
- Automatically filters duplicates from display

### 3. Scheduled Synchronization
- Weekly automated sync every Sunday at 2 AM UTC
- Can be changed to bi-weekly by modifying the cron schedule
- Full sync processes all active tours
- Individual tour sync available for targeted updates

### 4. Admin Interface
- Web-based management dashboard at `/admin/images`
- View and manage tour images
- Trigger manual syncs
- Monitor sync logs and statistics
- Review image validation status

### 5. Image Fallbacks
- Automatic fallback to placeholder if images fail to load
- Validation system checks image availability
- Graceful error handling for broken image URLs

## Database Schema

### tour_images Table
```sql
- id: UUID (primary key)
- tour_id: UUID (tour reference)
- tour_slug: TEXT (for quick lookups)
- image_url: TEXT (full image URL)
- image_alt: TEXT (alt text)
- image_caption: TEXT (optional caption)
- image_type: TEXT ('primary', 'gallery', 'thumbnail')
- source_url: TEXT (original BNAdventure URL)
- source_page_url: TEXT (tour page URL)
- image_hash: TEXT (MD5 hash for deduplication)
- width: INTEGER (image width if known)
- height: INTEGER (image height if known)
- display_order: INTEGER (ordering within tour)
- is_active: BOOLEAN (soft delete)
- is_duplicate: BOOLEAN (duplicate flag)
- duplicate_of: UUID (reference to original)
- validation_status: TEXT ('valid', 'invalid', 'pending')
- validation_error: TEXT (error details if invalid)
- scraped_at: TIMESTAMP (when scraped)
- last_validated_at: TIMESTAMP (last validation)
```

### image_sync_logs Table
```sql
- id: UUID (primary key)
- sync_type: TEXT ('manual', 'scheduled', 'partial')
- started_at: TIMESTAMP
- completed_at: TIMESTAMP
- tours_processed: INTEGER
- images_found: INTEGER
- images_added: INTEGER
- images_updated: INTEGER
- duplicates_found: INTEGER
- status: TEXT ('running', 'completed', 'failed', 'partial')
- error_details: JSONB
```

## Usage

### Manual Sync Commands

```bash
# Sync images for a specific tour
npm run sync:images tour <tour-slug>

# Sync images for all tours
npm run sync:images:all

# View image statistics
npm run sync:images:stats
```

### API Endpoints

#### Trigger Image Sync
```
POST /api/admin/sync-images
Content-Type: application/json
Authorization: Bearer <admin-token>

{
  "tourSlug": "albania-trek-7-days"  // For single tour
  // OR
  "fullSync": true  // For all tours
}
```

#### Get Sync Status
```
GET /api/admin/sync-images?tour=<tour-slug>  // Images for specific tour
GET /api/admin/sync-images  // Recent sync logs
```

### Admin Dashboard

Access the admin interface at: `https://your-domain.com/admin/images`

Features:
- **Sync Tab**: Trigger full or individual tour syncs
- **Images Tab**: View and manage images for each tour
- **Logs Tab**: Monitor sync history and errors

## Implementation Details

### Image Extraction Process

1. **Fetch Tour Page**: Follow affiliate URL to BNAdventure
2. **Parse HTML**: Extract images using multiple patterns:
   - Standard `<img>` tags
   - Lazy-loaded images with `data-src`
   - Background images in CSS
   - Responsive images in `srcset`
3. **Normalize URLs**: Convert relative URLs to absolute
4. **Calculate Hash**: MD5 hash for deduplication
5. **Store in Database**: Save with metadata and relationships

### Deduplication Algorithm

1. **Hash Generation**: Create MD5 hash from normalized URL
2. **Duplicate Detection**: Check for existing hash in tour
3. **Mark Duplicates**: Flag duplicates and link to original
4. **Filter Display**: Only show non-duplicate images

### Component Integration

The system includes updated components that use deduplicated images:

- `HeroGalleryDeduplicated.tsx`: Enhanced gallery with deduplication
- `dbMapperWithImages.ts`: Database mapper with image fetching
- `queries-with-images.ts`: Updated queries for image data

## Scheduled Function

The Netlify scheduled function runs weekly:
- **Schedule**: Every Sunday at 2 AM UTC
- **Location**: `/netlify/functions/scheduled-image-sync.ts`
- **Configuration**: In `netlify.toml`

To change to bi-weekly:
```toml
[functions."scheduled-image-sync"]
  schedule = "0 2 */14 * 0"  # Every other Sunday
```

## Environment Variables

Required environment variables:
```
SUPABASE_URL=your-supabase-url
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
ADMIN_API_TOKEN=your-admin-token  # Optional, for API authentication
```

## Migration

Run the database migration to create necessary tables:
```sql
-- Apply migration
psql -d your_database < supabase/migrations/20250811_tour_images_system.sql
```

## Monitoring

### Check System Health
```bash
# View statistics
npm run sync:images:stats

# Check recent sync logs
SELECT * FROM image_sync_logs ORDER BY created_at DESC LIMIT 10;

# Find tours without images
SELECT slug FROM affiliate_tours 
WHERE is_active = true 
AND slug NOT IN (
  SELECT DISTINCT tour_slug FROM tour_images 
  WHERE is_active = true AND is_duplicate = false
);
```

### Common Issues

1. **No Images Found**: Check if affiliate URL is accessible
2. **High Duplicate Count**: Normal for tours with repeated images
3. **Validation Failures**: Images may have been removed from source
4. **Sync Timeouts**: Large number of tours may need batch processing

## Performance Considerations

- Images are lazy-loaded in the gallery component
- Preloading of adjacent images for smooth navigation
- Database indexes on frequently queried columns
- Rate limiting to avoid overwhelming partner servers
- 2-second delay between tour processing

## Security

- Admin endpoints require authentication token
- Input validation on all API endpoints
- Secure handling of external URLs
- Content Security Policy compliance

## Future Enhancements

- [ ] Image CDN integration for optimized delivery
- [ ] Automatic image optimization and resizing
- [ ] Machine learning for image quality scoring
- [ ] Bulk image upload interface
- [ ] Image tagging and categorization
- [ ] WebP format generation for modern browsers
- [ ] Integration with image hosting services