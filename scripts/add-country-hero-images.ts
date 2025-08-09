import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

interface CountryHeroImage {
  country_code: string
  image_url: string
  title: string
  display_order: number
  is_active: boolean
}

const albaniaHeroImages: CountryHeroImage[] = [
  {
    country_code: 'albania',
    image_url: '/Assets/Albania/Albanian Riviera Beach Blue Water.jpeg',
    title: 'Albanian Riviera - Crystal Blue Waters',
    display_order: 1,
    is_active: true
  },
  {
    country_code: 'albania',
    image_url: '/Assets/Albania/Accursed Mountains.jpeg',
    title: 'Accursed Mountains - Majestic Peaks',
    display_order: 2,
    is_active: true
  },
  {
    country_code: 'albania',
    image_url: '/Assets/Albania/Northern Albania Shala River.jpeg',
    title: 'Shala River - Northern Albania Paradise',
    display_order: 3,
    is_active: true
  },
  {
    country_code: 'albania',
    image_url: '/Assets/Albania/Albania_Coast.jpeg',
    title: 'Albanian Coast - Endless Beauty',
    display_order: 4,
    is_active: true
  },
  {
    country_code: 'albania',
    image_url: '/Assets/Albania/Valbona Valley Guesthouse.jpg',
    title: 'Valbona Valley - Mountain Hospitality',
    display_order: 5,
    is_active: true
  },
  {
    country_code: 'albania',
    image_url: '/Assets/Albania/Albania, Lake Koman.jpeg',
    title: 'Lake Koman - Hidden Fjords',
    display_order: 6,
    is_active: true
  },
  {
    country_code: 'albania',
    image_url: '/Assets/Albania/Old Mes Bridge.jpeg',
    title: 'Mes Bridge - Historic Architecture',
    display_order: 7,
    is_active: true
  },
  {
    country_code: 'albania',
    image_url: '/Assets/Albania/albanian-riviera-5.jpg',
    title: 'Albanian Riviera - Coastal Paradise',
    display_order: 8,
    is_active: true
  }
]

async function createCountryHeroImagesTable() {
  // Create the table if it doesn't exist
  const { error: createError } = await supabase.rpc('exec_sql', {
    sql: `
      CREATE TABLE IF NOT EXISTS country_hero_images (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        country_code VARCHAR(50) NOT NULL,
        image_url TEXT NOT NULL,
        title TEXT,
        display_order INTEGER DEFAULT 0,
        is_active BOOLEAN DEFAULT true,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
      
      CREATE INDEX IF NOT EXISTS idx_country_hero_images_country_code 
      ON country_hero_images(country_code);
      
      CREATE INDEX IF NOT EXISTS idx_country_hero_images_display_order 
      ON country_hero_images(display_order);
    `
  })

  if (createError) {
    console.error('Error creating table:', createError)
    // Try alternative approach without exec_sql
    console.log('Table might already exist or exec_sql not available, continuing...')
  }
}

async function insertCountryHeroImages() {
  try {
    // First, try to create the table
    await createCountryHeroImagesTable()
    
    // Clear existing Albania images to avoid duplicates
    const { error: deleteError } = await supabase
      .from('country_hero_images')
      .delete()
      .eq('country_code', 'albania')
    
    if (deleteError && deleteError.code !== '42P01') { // 42P01 = table doesn't exist
      console.error('Error clearing existing images:', deleteError)
    }
    
    // Insert new images
    const { data, error } = await supabase
      .from('country_hero_images')
      .insert(albaniaHeroImages)
      .select()
    
    if (error) {
      console.error('Error inserting images:', error)
      return
    }
    
    console.log(`✅ Successfully inserted ${data.length} hero images for Albania`)
    console.log('Images added:', data.map(img => img.title))
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the script
insertCountryHeroImages()
  .then(() => {
    console.log('✅ Script completed successfully')
    process.exit(0)
  })
  .catch((error) => {
    console.error('❌ Script failed:', error)
    process.exit(1)
  })