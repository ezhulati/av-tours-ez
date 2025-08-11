#!/usr/bin/env node

import { config } from 'dotenv'
import { ImageValidationReporter, runFullSyncWithValidation } from './src/lib/scraping/imageValidationReport'
import { RobustImageScraper } from './src/lib/scraping/robustImageScraper'

// Load environment variables
config()

/**
 * Main CLI for image synchronization
 */
async function main() {
  const args = process.argv.slice(2)
  const command = args[0] || 'help'
  
  console.log('\n🖼️  AlbaniaVisit Image Sync Tool')
  console.log('================================\n')
  
  try {
    switch (command) {
      case 'test': {
        // Test a single tour
        const url = args[1]
        if (!url) {
          console.error('❌ Please provide a URL to test')
          console.log('Usage: npm run sync-images test <url>')
          process.exit(1)
        }
        
        console.log(`Testing scraper with: ${url}\n`)
        const scraper = new RobustImageScraper()
        const result = await scraper.scrapeTourImages(url)
        
        if (result.success) {
          console.log(`✅ Found ${result.images.length} images`)
          console.log('\n📊 Breakdown:')
          console.log(`  Hero: ${result.stats.heroImages}`)
          console.log(`  Gallery: ${result.stats.galleryImages}`)
          console.log(`  Content: ${result.stats.contentImages}`)
          console.log(`  Background: ${result.stats.backgroundImages}`)
          console.log(`\n⏱️  Time: ${result.stats.timeMs}ms`)
          
          if (result.images.length > 0) {
            console.log('\n📸 First 3 images:')
            result.images.slice(0, 3).forEach((img, i) => {
              console.log(`  ${i + 1}. [${img.type}] ${img.url.substring(0, 80)}...`)
            })
          }
        } else {
          console.error(`❌ Scraping failed: ${result.error}`)
        }
        
        await scraper.cleanup()
        break
      }
      
      case 'validate': {
        // Validate a sample of tours
        const limit = parseInt(args[1] || '10')
        console.log(`Validating ${limit} sample tours...\n`)
        
        const reporter = new ImageValidationReporter()
        await reporter.validateSampleTours(limit)
        break
      }
      
      case 'sync': {
        // Run full sync for all tours
        console.log('⚠️  WARNING: This will sync ALL tours and may take a long time.')
        console.log('Press Ctrl+C to cancel, or wait 5 seconds to continue...\n')
        
        await new Promise(resolve => setTimeout(resolve, 5000))
        
        await runFullSyncWithValidation()
        break
      }
      
      case 'sync-tour': {
        // Sync a specific tour by ID
        const tourId = args[1]
        if (!tourId) {
          console.error('❌ Please provide a tour ID')
          console.log('Usage: npm run sync-images sync-tour <tour-id>')
          process.exit(1)
        }
        
        console.log(`Syncing tour: ${tourId}\n`)
        
        // Get tour from database
        const { createClient } = await import('@supabase/supabase-js')
        const supabase = createClient(
          process.env.SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        )
        
        const { data: tour, error } = await supabase
          .from('affiliate_tours')
          .select('id, title, source_url, affiliate_url')
          .eq('id', tourId)
          .single()
        
        if (error || !tour) {
          console.error('❌ Tour not found')
          process.exit(1)
        }
        
        const url = tour.source_url || tour.affiliate_url
        if (!url) {
          console.error('❌ No URL available for this tour')
          process.exit(1)
        }
        
        console.log(`Tour: ${tour.title}`)
        console.log(`URL: ${url}\n`)
        
        const scraper = new RobustImageScraper()
        const result = await scraper.scrapeTourImages(url)
        
        if (result.success && result.images.length > 0) {
          const syncResult = await scraper.syncToDatabase(tour.id, result.images)
          
          if (syncResult.updated) {
            console.log(`✅ Successfully synced ${result.images.length} images`)
          } else {
            console.error(`❌ Sync failed: ${syncResult.error}`)
          }
        } else {
          console.error(`❌ No images found or scraping failed: ${result.error}`)
        }
        
        await scraper.cleanup()
        break
      }
      
      case 'help':
      default: {
        console.log('Available commands:\n')
        console.log('  test <url>         Test scraper on a specific URL')
        console.log('  validate [limit]   Validate sample tours (default: 10)')
        console.log('  sync              Sync all tours (WARNING: takes time)')
        console.log('  sync-tour <id>    Sync a specific tour by ID')
        console.log('  help              Show this help message')
        console.log('\nExamples:')
        console.log('  npm run sync-images test https://bnadventure.com/products/blue-eye/')
        console.log('  npm run sync-images validate 5')
        console.log('  npm run sync-images sync-tour rock-climbing')
        console.log('  npm run sync-images sync')
        break
      }
    }
    
    console.log('\n✨ Done!\n')
    process.exit(0)
    
  } catch (error) {
    console.error('\n❌ Error:', error)
    process.exit(1)
  }
}

// Run if called directly
main().catch(error => {
  console.error('Fatal error:', error)
  process.exit(1)
})

export { main }