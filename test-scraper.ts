import { config } from 'dotenv'
config()

import { scrapeTourImages, syncTourImages, syncAllTourImages, validateAllImages } from './src/lib/scraping/imageScraper'

async function testSingleScrape() {
  const testUrl = 'https://bnadventure.com/tours/south-albania-blue-eye-riviera'
  console.log('🔍 Testing scraper with:', testUrl)
  
  try {
    const images = await scrapeTourImages(testUrl)
    console.log(`✅ Found ${images.length} images`)
    
    if (images.length > 0) {
      console.log('\n📸 Sample images found:')
      images.slice(0, 5).forEach((img, i) => {
        console.log(`  ${i + 1}. Type: ${img.type}`)
        console.log(`     URL: ${img.url}`)
        console.log(`     Alt: ${img.alt || 'No alt text'}`)
      })
      
      // Group by type
      const byType = images.reduce((acc, img) => {
        acc[img.type] = (acc[img.type] || 0) + 1
        return acc
      }, {} as Record<string, number>)
      
      console.log('\n📊 Images by type:')
      Object.entries(byType).forEach(([type, count]) => {
        console.log(`  ${type}: ${count}`)
      })
    } else {
      console.log('⚠️  No images found - this might indicate a problem!')
    }
    
    return images.length
  } catch (error) {
    console.error('❌ Error:', error)
    return 0
  }
}

async function testCompleteSync() {
  console.log('\n🔄 Testing complete sync for a single tour...')
  
  // Test with a known tour ID and URL
  const testTourId = 'south-albania-blue-eye-riviera'
  const testUrl = 'https://bnadventure.com/tours/south-albania-blue-eye-riviera'
  
  try {
    const result = await syncTourImages(testTourId, testUrl)
    console.log('✅ Sync result:', result)
    
    if (result.error) {
      console.log('⚠️  Sync had errors:', result.error)
    }
    
    return result
  } catch (error) {
    console.error('❌ Sync error:', error)
    return null
  }
}

async function validateImages() {
  console.log('\n🔍 Validating all stored images...')
  
  try {
    const result = await validateAllImages()
    console.log('✅ Validation complete:')
    console.log(`  Valid: ${result.validated}`)
    console.log(`  Invalid: ${result.invalid}`)
    
    if (result.invalid > 0) {
      console.log('⚠️  Some images are invalid and may need to be re-scraped')
    }
    
    return result
  } catch (error) {
    console.error('❌ Validation error:', error)
    return null
  }
}

async function runTests() {
  console.log('🚀 Starting comprehensive image scraper tests\n')
  console.log('='*50)
  
  // Test 1: Basic scraping
  const imageCount = await testSingleScrape()
  
  if (imageCount === 0) {
    console.log('\n⚠️  WARNING: No images scraped. Checking for issues...')
    // We'll enhance this with better debugging
  }
  
  // Test 2: Database sync (commented out for safety - uncomment when ready)
  // await testCompleteSync()
  
  // Test 3: Validation (commented out for safety - uncomment when ready)
  // await validateImages()
  
  console.log('\n' + '='*50)
  console.log('✅ Tests complete!')
}

// Run the tests
runTests().catch(console.error)