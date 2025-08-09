import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import { albaniaImagesForDB } from '../src/data/albaniaImages'
import { kosovoImagesForDB } from '../src/data/kosovoImages'
import { montenegroImagesForDB } from '../src/data/montenegroImages'
import { macedoniaImagesForDB } from '../src/data/macedoniaImages'

// Load environment variables
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

// Country images data
const countryImages = [
  albaniaImagesForDB,
  kosovoImagesForDB,
  montenegroImagesForDB,
  macedoniaImagesForDB
]

async function updateCountryHeroImages() {
  console.log('Starting to update country hero images...\n')
  
  for (const country of countryImages) {
    try {
      console.log(`Updating ${country.country_name} (${country.country_code}) with ${country.hero_images.length} hero images...`)
      
      // Try to update or insert the country record
      const { data, error } = await supabase
        .from('countries')
        .upsert({ 
          code: country.country_code,
          name: country.country_name,
          hero_images: country.hero_images,
          updated_at: country.updated_at
        }, {
          onConflict: 'code'
        })
        .select()

      if (error) {
        console.error(`❌ Error updating ${country.country_name}:`, error.message)
      } else {
        console.log(`✅ Successfully updated ${country.country_name}`)
      }

    } catch (err) {
      console.error(`❌ Unexpected error for ${country.country_name}:`, err)
    }
  }
  
  console.log('\n=== Update Complete ===')
  console.log('Total countries processed:', countryImages.length)
  console.log('Countries:', countryImages.map(c => c.country_name).join(', '))
}

// Run the update
updateCountryHeroImages()
  .then(() => {
    console.log('\nScript completed successfully!')
  })
  .catch((err) => {
    console.error('\nScript failed:', err)
    process.exit(1)
  })