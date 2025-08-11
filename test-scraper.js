import { config } from 'dotenv'
config()

import { scrapeTourImages } from './src/lib/scraping/imageScraper.js'

async function test() {
  const testUrl = 'https://bnadventure.com/tours/south-albania-blue-eye-riviera'
  console.log('Testing scraper with:', testUrl)
  
  try {
    const images = await scrapeTourImages(testUrl)
    console.log('Found images:', images.length)
    if (images.length > 0) {
      console.log('First 3 images:')
      images.slice(0, 3).forEach((img, i) => {
        console.log(`  ${i + 1}. ${img.url} (${img.type})`)
      })
    }
  } catch (error) {
    console.error('Error:', error)
  }
}

test()