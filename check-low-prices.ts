import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'

async function checkLowPrices() {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🔍 Checking for tours with suspiciously low prices...\n')
  
  // Get all tours with prices
  const { data: tours, error } = await supabase
    .from('affiliate_tours')
    .select('id, slug, title, price, source_url, affiliate_url')
    .not('price', 'is', null)
    .order('price')
  
  if (error) {
    console.error('Error fetching tours:', error)
    return
  }
  
  console.log(`Found ${tours?.length || 0} tours with prices\n`)
  
  // Check for low prices (under €25)
  const lowPriceTours = tours?.filter(tour => {
    const priceMatch = tour.price?.match(/\d+(?:\.\d{2})?/)
    if (priceMatch) {
      const numericPrice = parseFloat(priceMatch[0])
      return numericPrice < 25
    }
    return false
  })
  
  if (lowPriceTours && lowPriceTours.length > 0) {
    console.log(`⚠️  Found ${lowPriceTours.length} tours with prices under €25:\n`)
    
    lowPriceTours.forEach(tour => {
      console.log(`📍 ${tour.title}`)
      console.log(`   Price: ${tour.price}`)
      console.log(`   Slug: ${tour.slug}`)
      console.log(`   URL: ${tour.source_url || tour.affiliate_url}`)
      console.log('')
    })
  } else {
    console.log('✅ No tours found with suspiciously low prices')
  }
  
  // Also check for $19 specifically
  const nineteenDollarTours = tours?.filter(tour => 
    tour.price?.includes('19') || tour.price?.includes('14')
  )
  
  if (nineteenDollarTours && nineteenDollarTours.length > 0) {
    console.log(`\n💵 Tours with prices containing "19" or "14":\n`)
    
    nineteenDollarTours.forEach(tour => {
      console.log(`📍 ${tour.title}`)
      console.log(`   Price: ${tour.price}`)
      console.log(`   Slug: ${tour.slug}`)
      console.log('')
    })
  }
}

checkLowPrices().catch(console.error)