import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'
import { validateTourPrice } from './src/lib/pricing/priceValidator'

async function clearInvalidPrices() {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🧹 Clearing invalid prices from database...\n')
  console.log('This will set prices to NULL for tours with unrealistic prices')
  console.log('Users will see "Check availability" instead of wrong prices\n')
  console.log('=' .repeat(60))
  
  // Get all tours with prices
  const { data: tours, error } = await supabase
    .from('affiliate_tours')
    .select('id, slug, title, price')
    .not('price', 'is', null)
    .order('title')
  
  if (error) {
    console.error('Error fetching tours:', error)
    return
  }
  
  console.log(`\nChecking ${tours?.length || 0} tours with prices...\n`)
  
  let cleared = 0
  let kept = 0
  const toursToFix: any[] = []
  
  for (const tour of tours || []) {
    const validation = validateTourPrice(tour.price)
    
    if (!validation.isValid) {
      console.log(`❌ ${tour.title}`)
      console.log(`   Current price: ${tour.price}`)
      console.log(`   Reason: ${validation.reason}`)
      console.log(`   Action: Will clear price (show "Check availability")\n`)
      
      toursToFix.push(tour)
      cleared++
    } else {
      kept++
    }
  }
  
  if (toursToFix.length > 0) {
    console.log('\n' + '=' .repeat(60))
    console.log(`\n📊 Summary:`)
    console.log(`   Valid prices kept: ${kept}`)
    console.log(`   Invalid prices to clear: ${cleared}`)
    
    console.log('\n⏳ Clearing invalid prices...\n')
    
    for (const tour of toursToFix) {
      const { error: updateError } = await supabase
        .from('affiliate_tours')
        .update({ 
          price: null,
          updated_at: new Date().toISOString()
        })
        .eq('id', tour.id)
      
      if (updateError) {
        console.error(`Failed to clear price for ${tour.title}:`, updateError)
      } else {
        console.log(`✅ Cleared: ${tour.title}`)
      }
    }
    
    console.log('\n✨ Invalid prices cleared!')
    console.log('These tours will now show "Check availability" on the website')
    console.log('\nNext step: Run "pnpm sync:prices" to attempt fetching correct prices')
  } else {
    console.log('\n✅ All prices are valid! No changes needed.')
  }
}

clearInvalidPrices().catch(console.error)