import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'

async function checkImageDuplicates() {
  const supabaseUrl = process.env.SUPABASE_URL!
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
  const supabase = createClient(supabaseUrl, supabaseKey)
  
  console.log('🔍 Checking for duplicate images across tours...\n')
  
  // Get all tours with their images
  const { data: tours, error } = await supabase
    .from('affiliate_tours')
    .select('id, slug, title, primary_image, image_gallery')
    .eq('is_active', true)
    .order('title')
  
  if (error) {
    console.error('Error fetching tours:', error)
    return
  }
  
  console.log(`Found ${tours?.length || 0} active tours\n`)
  
  // Track image usage
  const imageUsage = new Map<string, string[]>()
  const primaryImages = new Map<string, number>()
  
  // Count tours with no images
  let toursWithNoImages = 0
  let toursWithImages = 0
  
  tours?.forEach(tour => {
    // Check primary image
    if (tour.primary_image) {
      const count = primaryImages.get(tour.primary_image) || 0
      primaryImages.set(tour.primary_image, count + 1)
      
      // Track which tours use this image
      const tours = imageUsage.get(tour.primary_image) || []
      tours.push(tour.title)
      imageUsage.set(tour.primary_image, tours)
    }
    
    // Check if tour has any images
    if (!tour.primary_image && (!tour.image_gallery || tour.image_gallery.length === 0)) {
      toursWithNoImages++
      console.log(`❌ No images: ${tour.title}`)
    } else {
      toursWithImages++
    }
  })
  
  console.log('\n' + '='.repeat(60))
  console.log('📊 IMAGE STATISTICS:')
  console.log('='.repeat(60))
  console.log(`Tours with images: ${toursWithImages}`)
  console.log(`Tours without images: ${toursWithNoImages}`)
  console.log(`Unique primary images: ${primaryImages.size}`)
  
  // Find duplicate primary images
  const duplicates = Array.from(primaryImages.entries())
    .filter(([_, count]) => count > 1)
    .sort((a, b) => b[1] - a[1])
  
  if (duplicates.length > 0) {
    console.log('\n⚠️  DUPLICATE PRIMARY IMAGES FOUND:')
    console.log('='.repeat(60))
    
    duplicates.forEach(([image, count]) => {
      console.log(`\n📸 Image used ${count} times:`)
      console.log(`   URL: ${image.substring(0, 80)}...`)
      console.log('   Used by:')
      const toursList = imageUsage.get(image) || []
      toursList.forEach(tour => {
        console.log(`   - ${tour}`)
      })
    })
  } else {
    console.log('\n✅ No duplicate primary images found!')
  }
  
  // Show most common images
  const top5Images = Array.from(primaryImages.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 5)
  
  console.log('\n📈 TOP 5 MOST USED IMAGES:')
  console.log('='.repeat(60))
  
  top5Images.forEach(([image, count], index) => {
    console.log(`\n${index + 1}. Used ${count} times`)
    console.log(`   ${image.substring(0, 100)}...`)
  })
  
  // Check for default/placeholder images
  const placeholderPatterns = [
    'placeholder',
    'default',
    'no-image',
    'coming-soon',
    'DSCF9726', // This seems to be a common default image
    'DB__8182'  // Another common one
  ]
  
  console.log('\n🎭 CHECKING FOR DEFAULT/PLACEHOLDER IMAGES:')
  console.log('='.repeat(60))
  
  let placeholderCount = 0
  tours?.forEach(tour => {
    if (tour.primary_image) {
      const isPlaceholder = placeholderPatterns.some(pattern => 
        tour.primary_image.toLowerCase().includes(pattern.toLowerCase())
      )
      if (isPlaceholder) {
        placeholderCount++
        console.log(`⚠️  ${tour.title}`)
        console.log(`   Image: ${tour.primary_image.substring(0, 80)}...`)
      }
    }
  })
  
  if (placeholderCount === 0) {
    console.log('✅ No obvious placeholder images detected')
  } else {
    console.log(`\n⚠️  Found ${placeholderCount} tours using potential placeholder images`)
  }
}

checkImageDuplicates().catch(console.error)