import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'

async function checkUrls() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing environment variables')
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // Get a few sample tours with their affiliate URLs
  const { data: tours, error } = await supabase
    .from('affiliate_tours')
    .select('id, name, affiliate_url')
    .limit(5)
  
  if (error) {
    console.error('Error fetching tours:', error)
    return
  }
  
  console.log('Sample tours from database:')
  tours?.forEach((tour, i) => {
    console.log(`\n${i + 1}. ${tour.name}`)
    console.log(`   ID: ${tour.id}`)
    console.log(`   URL: ${tour.affiliate_url}`)
  })
}

checkUrls().catch(console.error)