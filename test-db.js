// Test database connection
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

console.log('Testing Supabase connection...')
console.log('URL:', supabaseUrl ? 'Found' : 'Missing')
console.log('Key:', supabaseKey ? 'Found' : 'Missing')

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing environment variables!')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

async function testConnection() {
  try {
    // Test 1: Count tours
    const { count, error: countError } = await supabase
      .from('affiliate_tours')
      .select('*', { count: 'exact', head: true })
      .eq('is_active', true)
    
    if (countError) {
      console.error('Count error:', countError)
    } else {
      console.log('Total active tours:', count)
    }
    
    // Test 2: Get sample tour
    const { data, error } = await supabase
      .from('affiliate_tours')
      .select('id, title, locations, difficulty_level, price')
      .eq('is_active', true)
      .limit(1)
      .single()
    
    if (error) {
      console.error('Fetch error:', error)
    } else {
      console.log('Sample tour:', data)
    }
    
    // Test 3: Test Albania filter
    const { data: albaniaData, error: albaniaError } = await supabase
      .from('affiliate_tours')
      .select('title, locations')
      .eq('is_active', true)
      .contains('locations', ['Albania'])
      .limit(3)
    
    if (albaniaError) {
      console.error('Albania filter error:', albaniaError)
    } else {
      console.log('Albania tours found:', albaniaData?.length)
      albaniaData?.forEach(tour => {
        console.log(' -', tour.title, '|', tour.locations)
      })
    }
    
  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

testConnection().then(() => {
  console.log('Test complete!')
  process.exit(0)
})