import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

async function fixRemainingDuplicates() {
  console.log('🔧 Fixing remaining duplicate images...\n')
  
  // Find tours using the duplicate DB__8182 image
  const { data: tours, error } = await supabase
    .from('affiliate_tours')
    .select('id, slug, title, primary_image, image_gallery')
    .eq('is_active', true)
    .like('primary_image', '%DB__8182%')
    
  if (error || !tours) {
    console.error('Error fetching tours:', error)
    return
  }
  
  console.log(`Found ${tours.length} tours with duplicate image\n`)
  
  // For each tour, try to use a different image from its gallery
  let updated = 0
  for (const tour of tours) {
    if (tour.image_gallery && tour.image_gallery.length > 1) {
      // Find an image that's not the duplicate
      const alternativeImage = tour.image_gallery.find((img: string) => 
        !img.includes('DB__8182')
      )
      
      if (alternativeImage) {
        console.log(`✅ ${tour.title}`)
        console.log(`   Using alternative: ${alternativeImage.substring(0, 60)}...`)
        
        const { error: updateError } = await supabase
          .from('affiliate_tours')
          .update({
            primary_image: alternativeImage,
            updated_at: new Date().toISOString()
          })
          .eq('id', tour.id)
        
        if (!updateError) {
          updated++
        } else {
          console.error(`   ❌ Update failed:`, updateError.message)
        }
      } else {
        console.log(`⏭️  ${tour.title} - No alternative images available`)
      }
    } else {
      console.log(`⏭️  ${tour.title} - No gallery images`)
    }
  }
  
  console.log('\n' + '='.repeat(60))
  console.log(`✅ Updated ${updated} tours with alternative images`)
  console.log('✨ Duplicate fix completed!')
}

fixRemainingDuplicates().catch(console.error)