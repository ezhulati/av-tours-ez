import { schedule } from '@netlify/functions'
import { createClient } from '@supabase/supabase-js'

// Initialize Supabase client
const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

// Import scraper functions (we'll need to make them compatible)
async function syncAllTourImages() {
  const result = {
    toursProcessed: 0,
    imagesAdded: 0,
    imagesUpdated: 0,
    duplicatesFound: 0,
    errors: [] as string[]
  }
  
  // Create sync log entry
  const { data: syncLog } = await supabase
    .from('image_sync_logs')
    .insert({
      sync_type: 'scheduled',
      status: 'running'
    })
    .select()
    .single()
  
  try {
    // Get all active tours
    const { data: tours, error: toursError } = await supabase
      .from('affiliate_tours')
      .select('id, slug, affiliate_url')
      .eq('is_active', true)
      .not('affiliate_url', 'is', null)
    
    if (toursError || !tours) {
      throw new Error('Failed to fetch tours')
    }
    
    // Process each tour
    for (const tour of tours) {
      try {
        // Fetch and process images for this tour
        const response = await fetch(tour.affiliate_url, {
          headers: {
            'User-Agent': 'AlbaniaVisit-ImageSync/1.0'
          }
        })
        
        if (!response.ok) {
          throw new Error(`HTTP ${response.status}`)
        }
        
        const html = await response.text()
        const images: string[] = []
        
        // Extract images from HTML
        const imgRegex = /<img[^>]+src="([^"]+)"/gi
        let match
        while ((match = imgRegex.exec(html)) !== null) {
          const url = match[1]
          if (url && !url.includes('logo') && !url.includes('icon')) {
            images.push(url)
          }
        }
        
        // Process extracted images
        for (let i = 0; i < images.length; i++) {
          const imageUrl = images[i]
          const imageHash = Buffer.from(imageUrl).toString('base64').substring(0, 32)
          
          // Check for duplicates
          const { data: existing } = await supabase
            .from('tour_images')
            .select('id')
            .eq('tour_slug', tour.slug)
            .eq('image_hash', imageHash)
            .single()
          
          if (!existing) {
            // Insert new image
            await supabase
              .from('tour_images')
              .insert({
                tour_id: tour.id,
                tour_slug: tour.slug,
                image_url: imageUrl,
                image_alt: `${tour.slug} image ${i + 1}`,
                image_type: i === 0 ? 'primary' : 'gallery',
                source_page_url: tour.affiliate_url,
                image_hash: imageHash,
                display_order: i,
                validation_status: 'valid'
              })
            result.imagesAdded++
          } else {
            result.imagesUpdated++
          }
        }
        
        result.toursProcessed++
        
        // Add delay to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000))
        
      } catch (error) {
        result.errors.push(`Tour ${tour.slug}: ${error}`)
      }
    }
    
    // Update sync log
    await supabase
      .from('image_sync_logs')
      .update({
        completed_at: new Date().toISOString(),
        tours_processed: result.toursProcessed,
        images_added: result.imagesAdded,
        images_updated: result.imagesUpdated,
        duplicates_found: result.duplicatesFound,
        errors_count: result.errors.length,
        status: result.errors.length === 0 ? 'completed' : 'partial',
        error_details: result.errors.length > 0 ? { errors: result.errors } : null
      })
      .eq('id', syncLog?.id)
    
    return result
    
  } catch (error) {
    // Update sync log with failure
    if (syncLog) {
      await supabase
        .from('image_sync_logs')
        .update({
          completed_at: new Date().toISOString(),
          status: 'failed',
          error_details: { error: String(error) }
        })
        .eq('id', syncLog.id)
    }
    throw error
  }
}

// Schedule to run every Sunday at 2 AM (weekly)
// You can change to bi-weekly by using '0 2 */14 * 0' (every other Sunday)
export const handler = schedule('0 2 * * 0', async (event) => {
  console.log('Starting scheduled image sync...')
  
  try {
    const result = await syncAllTourImages()
    
    console.log('Image sync completed:', result)
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Image sync completed successfully',
        result
      })
    }
  } catch (error) {
    console.error('Image sync failed:', error)
    
    // Log error to Supabase
    await supabase
      .from('image_sync_logs')
      .insert({
        sync_type: 'scheduled',
        status: 'failed',
        completed_at: new Date().toISOString(),
        error_details: { error: String(error) }
      })
    
    return {
      statusCode: 500,
      body: JSON.stringify({
        message: 'Image sync failed',
        error: String(error)
      })
    }
  }
})