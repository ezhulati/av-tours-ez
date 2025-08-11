import { config } from 'dotenv'
config()

import { chromium } from '@playwright/test'

async function testDirectScrape() {
  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()
  
  console.log('Navigating to BNAdventure...')
  await page.goto('https://bnadventure.com/products/blue-eye/', {
    waitUntil: 'networkidle',
    timeout: 30000
  })
  
  console.log('Page loaded, extracting images...')
  
  // Simple image extraction
  const images = await page.evaluate(() => {
    const imgs = document.querySelectorAll('img')
    const results = []
    
    for (let i = 0; i < imgs.length; i++) {
      const img = imgs[i]
      if (img.src) {
        results.push({
          url: img.src,
          alt: img.alt || '',
          width: img.width,
          height: img.height
        })
      }
    }
    
    return results
  })
  
  console.log(`Found ${images.length} images`)
  
  if (images.length > 0) {
    console.log('\nFirst 5 images:')
    images.slice(0, 5).forEach((img, i) => {
      console.log(`${i + 1}. ${img.url.substring(0, 80)}...`)
    })
  }
  
  await browser.close()
}

testDirectScrape().catch(console.error)