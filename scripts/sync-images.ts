#!/usr/bin/env node
import { config } from 'dotenv'
import { createClient } from '@supabase/supabase-js'
import { syncAllTourImages, syncTourImages } from '../src/lib/scraping/imageScraper'

// Load environment variables
config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY environment variables')
  process.exit(1)
}

// Parse command line arguments
const args = process.argv.slice(2)
const command = args[0]
const tourSlug = args[1]

async function main() {
  console.log('Starting image synchronization...')
  
  try {
    if (command === 'tour' && tourSlug) {
      // Sync single tour
      console.log(`Syncing images for tour: ${tourSlug}`)
      
      // Get tour details
      const supabase = createClient(supabaseUrl!, supabaseKey!)
      const { data: tour } = await supabase
        .from('affiliate_tours')
        .select('id, slug, title, affiliate_url')
        .eq('slug', tourSlug)
        .single()
      
      if (!tour) {
        console.error(`Tour not found: ${tourSlug}`)
        process.exit(1)
      }
      
      if (!tour.affiliate_url) {
        console.error(`Tour has no affiliate URL: ${tourSlug}`)
        process.exit(1)
      }
      
      console.log(`Found tour: ${tour.title}`)
      console.log(`Affiliate URL: ${tour.affiliate_url}`)
      
      const result = await syncTourImages(tour.slug, tour.id, tour.affiliate_url)
      
      console.log('\nSync completed:')
      console.log(`- Images added: ${result.added}`)
      console.log(`- Images updated: ${result.updated}`)
      console.log(`- Duplicates found: ${result.duplicates}`)
      
      if (result.error) {
        console.error(`- Error: ${result.error}`)
      }
      
    } else if (command === 'all') {
      // Sync all tours
      console.log('Syncing images for all tours...')
      console.log('This may take several minutes...\n')
      
      const result = await syncAllTourImages()
      
      console.log('\nSync completed:')
      console.log(`- Tours processed: ${result.toursProcessed}`)
      console.log(`- Images added: ${result.imagesAdded}`)
      console.log(`- Images updated: ${result.imagesUpdated}`)
      console.log(`- Duplicates found: ${result.duplicatesFound}`)
      
      if (result.errors.length > 0) {
        console.error('\nErrors encountered:')
        result.errors.forEach(error => console.error(`  - ${error}`))
      }
      
    } else if (command === 'stats') {
      // Show statistics
      const supabase = createClient(supabaseUrl!, supabaseKey!)
      
      // Get total images
      const { count: totalImages } = await supabase
        .from('tour_images')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      // Get duplicates
      const { count: duplicates } = await supabase
        .from('tour_images')
        .select('*', { count: 'exact', head: true })
        .eq('is_duplicate', true)
      
      // Get tours with images
      const { data: toursWithImagesData } = await supabase
        .from('tour_images')
        .select('tour_slug')
        .eq('is_active', true)
        .eq('is_duplicate', false)
      
      const uniqueTourSlugs = new Set(toursWithImagesData?.map(d => d.tour_slug) || [])
      
      // Get total tours
      const { count: totalTours } = await supabase
        .from('affiliate_tours')
        .select('*', { count: 'exact', head: true })
        .eq('is_active', true)
      
      // Get recent sync logs
      const { data: recentLogs } = await supabase
        .from('image_sync_logs')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(5)
      
      console.log('\nImage Statistics:')
      console.log(`- Total active images: ${totalImages || 0}`)
      console.log(`- Duplicate images: ${duplicates || 0}`)
      console.log(`- Tours with images: ${uniqueTourSlugs.size}`)
      console.log(`- Tours without images: ${(totalTours || 0) - uniqueTourSlugs.size}`)
      console.log(`- Total tours: ${totalTours || 0}`)
      
      if (recentLogs && recentLogs.length > 0) {
        console.log('\nRecent Sync History:')
        recentLogs.forEach(log => {
          const date = new Date(log.created_at).toLocaleString()
          console.log(`  ${date} - ${log.sync_type} - ${log.status} (${log.tours_processed} tours, ${log.images_added} added)`)
        })
      }
      
    } else {
      // Show help
      console.log('Usage:')
      console.log('  npm run sync-images tour <slug>  - Sync images for a specific tour')
      console.log('  npm run sync-images all          - Sync images for all tours')
      console.log('  npm run sync-images stats        - Show image statistics')
      console.log('\nExamples:')
      console.log('  npm run sync-images tour albania-trek-7-days')
      console.log('  npm run sync-images all')
      console.log('  npm run sync-images stats')
    }
    
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

// Run the script
main().then(() => {
  console.log('\nDone!')
  process.exit(0)
}).catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})