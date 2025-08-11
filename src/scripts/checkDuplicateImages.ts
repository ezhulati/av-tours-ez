import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

// Load environment variables
dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabaseUrl = process.env.SUPABASE_URL || ''
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY || ''

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables')
  process.exit(1)
}

const supabase = createClient(supabaseUrl, supabaseKey)

function parseJsonArray(value: any): any[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

function getImageUrl(url: string): string {
  if (!url) return '/placeholder.jpg'
  if (url.startsWith('http')) return url
  if (url.startsWith('/')) return url
  return `https://bnadventure.com${url.startsWith('/') ? '' : '/'}${url}`
}

async function checkDuplicateImages() {
  console.log('Checking for duplicate images in tour galleries...\n')
  
  // Fetch all tours with their image data
  const { data: tours, error } = await supabase
    .from('affiliate_tours')
    .select('id, slug, title, primary_image, image_gallery')
    .eq('is_active', true)
    .order('title')

  if (error) {
    console.error('Error fetching tours:', error)
    return
  }

  if (!tours || tours.length === 0) {
    console.log('No tours found')
    return
  }

  let toursWithDuplicates = 0
  const duplicateReport: any[] = []

  tours.forEach((tour: any) => {
    // Construct images array like the app does
    const galleryImages = parseJsonArray(tour.image_gallery).map((url: string) => 
      getImageUrl(url)
    )
    
    // Combine primary image with gallery
    const allImages: string[] = []
    
    // Add primary image if exists
    if (tour.primary_image) {
      const primaryUrl = getImageUrl(tour.primary_image)
      allImages.push(primaryUrl)
    }
    
    // Add gallery images
    galleryImages.forEach(url => {
      allImages.push(url)
    })

    // Find duplicates
    const urlCounts = new Map<string, number>()
    const duplicates = new Set<string>()

    allImages.forEach((url: string) => {
      const count = (urlCounts.get(url) || 0) + 1
      urlCounts.set(url, count)
      if (count > 1) {
        duplicates.add(url)
      }
    })

    if (duplicates.size > 0) {
      toursWithDuplicates++
      duplicateReport.push({
        id: tour.id,
        slug: tour.slug,
        title: tour.title,
        totalImages: allImages.length,
        uniqueImages: urlCounts.size,
        duplicates: Array.from(duplicates).map(url => ({
          url,
          count: urlCounts.get(url),
          filename: url.split('/').pop()
        }))
      })

      console.log(`\n🔴 ${tour.title} (${tour.slug})`)
      console.log(`   Total images: ${allImages.length}`)
      console.log(`   Unique images: ${urlCounts.size}`)
      console.log(`   Duplicated images: ${duplicates.size}`)
      
      duplicates.forEach(url => {
        const filename = url.split('/').pop()
        console.log(`   - ${filename} appears ${urlCounts.get(url)} times`)
      })
    }
  })

  console.log('\n' + '='.repeat(60))
  console.log('SUMMARY')
  console.log('='.repeat(60))
  console.log(`Total tours checked: ${tours.length}`)
  console.log(`Tours with duplicate images: ${toursWithDuplicates}`)
  
  if (toursWithDuplicates > 0) {
    console.log(`\nTours needing cleanup:`)
    duplicateReport.forEach(tour => {
      console.log(`- ${tour.slug}: ${tour.totalImages - tour.uniqueImages} duplicate(s)`)
    })
    
    // Create a fix script
    console.log('\n' + '='.repeat(60))
    console.log('Creating fix script...')
    await createFixScript(duplicateReport)
  } else {
    console.log('\n✅ No duplicate images found in any tour galleries!')
  }

  return duplicateReport
}

async function createFixScript(duplicateReport: any[]) {
  const fixScript = `
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import path from 'path'

dotenv.config({ path: path.resolve(process.cwd(), '.env') })

const supabase = createClient(
  process.env.SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_ANON_KEY!
)

function parseJsonArray(value: any): any[] {
  if (!value) return []
  if (Array.isArray(value)) return value
  if (typeof value === 'string') {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : []
    } catch {
      return []
    }
  }
  return []
}

async function removeDuplicates() {
  const toursToFix = ${JSON.stringify(duplicateReport, null, 2)}
  
  for (const tour of toursToFix) {
    console.log(\`\\nFixing \${tour.title}...\`)
    
    // Fetch current tour data
    const { data, error } = await supabase
      .from('affiliate_tours')
      .select('primary_image, image_gallery, featured_image_url')
      .eq('id', tour.id)
      .single()
    
    if (error || !data) {
      console.error(\`Error fetching tour \${tour.slug}:\`, error)
      continue
    }
    
    // Parse current gallery
    const currentGallery = parseJsonArray(data.image_gallery)
    console.log(\`  Current gallery: \${currentGallery.length} images\`)
    
    // Remove duplicates from gallery
    const seen = new Set<string>()
    const uniqueGallery: string[] = []
    
    // Track featured and primary images to avoid duplicates
    if (data.featured_image_url) {
      seen.add(data.featured_image_url)
    }
    if (data.primary_image) {
      seen.add(data.primary_image)
    }
    
    // Filter gallery for unique images
    currentGallery.forEach((img: string) => {
      // Normalize the URL for comparison
      const normalizedUrl = img.replace(/^\\/+/, '').replace(/^https?:\\/\\/[^\\/]+/, '')
      const fullUrl = img.startsWith('http') ? img : img
      
      // Check if we've seen this image
      let isDuplicate = false
      for (const seenUrl of seen) {
        const normalizedSeen = seenUrl.replace(/^\\/+/, '').replace(/^https?:\\/\\/[^\\/]+/, '')
        if (normalizedUrl === normalizedSeen || fullUrl === seenUrl) {
          isDuplicate = true
          break
        }
      }
      
      if (!isDuplicate) {
        uniqueGallery.push(img)
        seen.add(fullUrl)
      } else {
        console.log(\`  Removing duplicate: \${img.split('/').pop()}\`)
      }
    })
    
    console.log(\`  New gallery: \${uniqueGallery.length} images\`)
    
    // Update tour with unique gallery
    const { error: updateError } = await supabase
      .from('affiliate_tours')
      .update({ image_gallery: uniqueGallery })
      .eq('id', tour.id)
    
    if (updateError) {
      console.error(\`Error updating tour \${tour.slug}:\`, updateError)
    } else {
      console.log(\`✅ Fixed \${tour.slug}: \${currentGallery.length} -> \${uniqueGallery.length} gallery images\`)
    }
  }
}

removeDuplicates()
  .then(() => console.log('\\n✨ Done! All duplicate images have been removed.'))
  .catch(console.error)
`

  const fs = await import('fs/promises')
  await fs.writeFile('src/scripts/fixDuplicateImages.ts', fixScript)
  console.log('Fix script created at: src/scripts/fixDuplicateImages.ts')
  console.log('Run it with: npx tsx src/scripts/fixDuplicateImages.ts')
}

// Run the check
checkDuplicateImages()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error('Script failed:', error)
    process.exit(1)
  })