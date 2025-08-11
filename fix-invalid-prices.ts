import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'
import { validateTourPrice } from './src/lib/pricing/priceValidator'

async function fixInvalidPrices() {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🔧 Fixing invalid prices in database...\n')
  console.log('Setting invalid prices to "Check availability"')
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
  
  let fixed = 0
  let kept = 0
  const PLACEHOLDER_PRICE = 'Check availability' // Use this instead of NULL
  
  for (const tour of tours || []) {
    const validation = validateTourPrice(tour.price)
    
    if (!validation.isValid) {
      console.log(`❌ ${tour.title}`)
      console.log(`   Current: ${tour.price}`)
      console.log(`   Reason: ${validation.reason}`)
      
      // Update to placeholder price instead of NULL
      const { error: updateError } = await supabase
        .from('affiliate_tours')
        .update({ 
          price: PLACEHOLDER_PRICE,
          updated_at: new Date().toISOString()
        })
        .eq('id', tour.id)
      
      if (updateError) {
        console.error(`   Failed: ${updateError.message}`)
      } else {
        console.log(`   ✅ Fixed: Set to "${PLACEHOLDER_PRICE}"`)
        fixed++
      }
      console.log('')
    } else {
      kept++
    }
  }
  
  console.log('\n' + '=' .repeat(60))
  console.log(`\n📊 Summary:`)
  console.log(`   Valid prices kept: ${kept}`)
  console.log(`   Invalid prices fixed: ${fixed}`)
  
  if (fixed > 0) {
    console.log('\n✨ Invalid prices have been fixed!')
    console.log('Tours will now show "Check availability" instead of wrong prices')
  } else {
    console.log('\n✅ All prices are valid!')
  }
}

fixInvalidPrices().catch(console.error)