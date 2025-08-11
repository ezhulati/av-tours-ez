import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'

async function checkSchema() {
  const supabaseUrl = process.env.SUPABASE_URL
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!supabaseUrl || !supabaseKey) {
    throw new Error('Missing environment variables')
  }
  
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  // First, let's see what tables we have
  const { data: tables, error: tablesError } = await supabase
    .from('information_schema.tables')
    .select('table_name')
    .eq('table_schema', 'public')
  
  if (tablesError) {
    console.log('Trying a different approach...')
    // Try to just get data from affiliate_tours
    const { data, error } = await supabase
      .from('affiliate_tours')
      .select('*')
      .limit(1)
    
    if (error) {
      console.error('Error:', error)
    } else {
      console.log('Sample row from affiliate_tours:')
      console.log(JSON.stringify(data, null, 2))
      
      if (data && data.length > 0) {
        console.log('\nColumn names:')
        console.log(Object.keys(data[0]))
      }
    }
  } else {
    console.log('Tables:', tables?.map(t => t.table_name))
  }
  
  // Also check if we have a regular tours table
  const { data: tours, error: toursError } = await supabase
    .from('tours')
    .select('*')
    .limit(3)
  
  if (!toursError) {
    console.log('\nSample tours:')
    tours?.forEach((tour, i) => {
      console.log(`${i + 1}. ${tour.title || tour.name}`)
      console.log(`   Slug: ${tour.slug || tour.id}`)
      console.log(`   Affiliate URL: ${tour.affiliate_url || 'N/A'}`)
    })
  }
}

checkSchema().catch(console.error)