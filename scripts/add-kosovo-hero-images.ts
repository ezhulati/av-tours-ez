import { createClient } from '@supabase/supabase-js'
import * as dotenv from 'dotenv'

// Load environment variables
dotenv.config({ path: '.env' })

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY!

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseServiceKey)

const kosovoHeroImages = [
  {
    url: '/Assets/Kosovo/Gjeravica_Kosovo_336042834.jpeg',
    alt: 'Gjeravica Peak, the highest mountain in Kosovo',
    caption: 'Gjeravica Peak - Kosovo\'s Roof at 2,656m'
  },
  {
    url: '/Assets/Kosovo/Kosovo_329920270.jpeg',
    alt: 'Traditional Kosovo landscape with mountains',
    caption: 'The Untamed Beauty of Kosovo\'s Highlands'
  },
  {
    url: '/Assets/Kosovo/Kucisko_Lake_Kosovo_135448859.jpeg',
    alt: 'Kuçishte Lake surrounded by Kosovo mountains',
    caption: 'Kuçishte Lake - A Hidden Alpine Gem'
  },
  {
    url: '/Assets/Kosovo/Lac Leqinat Pejë Kosovo_220878090.jpeg',
    alt: 'Leqinat Lakes near Peja in Kosovo',
    caption: 'Leqinat Lakes - Where Mountains Mirror the Sky'
  }
]

async function updateKosovoHeroImages() {
  try {
    console.log('Updating Kosovo (XK) with hero images...')
    
    // Update the country record for Kosovo
    const { data, error } = await supabase
      .from('countries')
      .update({ 
        hero_images: kosovoHeroImages,
        updated_at: new Date().toISOString()
      })
      .eq('code', 'XK')
      .select()

    if (error) {
      console.error('Error updating Kosovo:', error)
      return
    }

    if (data && data.length > 0) {
      console.log('✅ Successfully updated Kosovo with', kosovoHeroImages.length, 'hero images')
      console.log('Hero images:', JSON.stringify(kosovoHeroImages, null, 2))
    } else {
      console.log('❌ No data returned - Kosovo may not exist in the database')
      
      // Let's check if Kosovo exists
      const { data: checkData, error: checkError } = await supabase
        .from('countries')
        .select('*')
        .eq('code', 'XK')
      
      if (checkError) {
        console.error('Error checking for Kosovo:', checkError)
      } else if (!checkData || checkData.length === 0) {
        console.log('Kosovo (XK) not found in countries table. You may need to add it first.')
      } else {
        console.log('Kosovo exists but update may have failed silently')
      }
    }

  } catch (err) {
    console.error('Unexpected error:', err)
  }
}

// Run the update
updateKosovoHeroImages()