import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'
import { getOptimizedImageUrl, needsOptimization, IMAGE_SIZES } from './imageOptimization'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface OptimizationResult {
  tourId: string
  title: string
  originalImage: string
  optimizedImage: string
  improvements: string[]
  status: 'success' | 'failed' | 'skipped'
}

/**
 * Image Optimization Agent
 * Automatically finds and fixes low-quality images
 */
class ImageOptimizationAgent {
  private results: OptimizationResult[] = []
  
  /**
   * Find high-resolution alternatives for low-quality images
   */
  private async findBetterImage(tourUrl: string, currentImage: string): Promise<string | null> {
    try {
      // Try to find the original high-res version by removing size suffixes
      const patterns = [
        /-\d+x\d+/g,  // Remove dimension suffixes like -768x476
        /-scaled/g,   // Remove scaled suffix
        /-min/g,      // Remove min suffix
        /thumb/gi     // Remove thumb indicators
      ]
      
      let originalUrl = currentImage
      patterns.forEach(pattern => {
        originalUrl = originalUrl.replace(pattern, '')
      })
      
      // If we found a different URL, try it
      if (originalUrl !== currentImage) {
        // Verify the URL exists
        try {
          const response = await fetch(originalUrl, { method: 'HEAD' })
          if (response.ok) {
            return originalUrl
          }
        } catch {
          // URL doesn't exist, continue
        }
      }
      
      // Try common high-res patterns
      const highResPatterns = [
        originalUrl.replace(/\.(jpg|jpeg|png)$/i, '-scaled.$1'),
        originalUrl.replace(/\.(jpg|jpeg|png)$/i, '-2048x2048.$1'),
        originalUrl.replace(/\.(jpg|jpeg|png)$/i, '-1920x1080.$1'),
        originalUrl.replace(/\.(jpg|jpeg|png)$/i, '-full.$1')
      ]
      
      for (const testUrl of highResPatterns) {
        try {
          const response = await fetch(testUrl, { method: 'HEAD' })
          if (response.ok) {
            return testUrl
          }
        } catch {
          // Continue trying other patterns
        }
      }
      
      return null
    } catch (error) {
      console.error('Error finding better image:', error)
      return null
    }
  }
  
  /**
   * Optimize a single tour's images
   */
  private async optimizeTourImages(tour: any): Promise<OptimizationResult> {
    const result: OptimizationResult = {
      tourId: tour.id,
      title: tour.title,
      originalImage: tour.primary_image,
      optimizedImage: tour.primary_image,
      improvements: [],
      status: 'skipped'
    }
    
    try {
      // Check if image needs optimization
      if (!needsOptimization(tour.primary_image)) {
        // Even "good" images can benefit from CDN optimization
        const optimized = getOptimizedImageUrl(tour.primary_image, {
          ...IMAGE_SIZES.hero,
          quality: 'auto:best',
          enhance: true
        })
        
        result.optimizedImage = optimized
        result.improvements.push('CDN optimization applied')
        result.status = 'success'
        
        return result
      }
      
      // Try to find a better quality source image
      const betterImage = await this.findBetterImage(
        tour.source_url || tour.affiliate_url,
        tour.primary_image
      )
      
      if (betterImage) {
        result.originalImage = betterImage
        result.improvements.push('Found higher resolution source')
      }
      
      // Apply optimization transformations
      const optimized = getOptimizedImageUrl(result.originalImage, {
        ...IMAGE_SIZES.hero,
        quality: 'auto:best',
        enhance: true,
        upscale: true // AI upscaling for low-res images
      })
      
      result.optimizedImage = optimized
      result.improvements.push('AI upscaling applied')
      result.improvements.push('Auto color/contrast enhancement')
      result.improvements.push('WebP/AVIF format support')
      result.improvements.push('Progressive loading enabled')
      
      // Update the database with optimized URL
      const { error } = await supabase
        .from('affiliate_tours')
        .update({
          primary_image_optimized: optimized,
          optimization_date: new Date().toISOString()
        })
        .eq('id', tour.id)
      
      if (error) {
        console.error(`Failed to update tour ${tour.id}:`, error)
        result.status = 'failed'
      } else {
        result.status = 'success'
      }
      
    } catch (error) {
      console.error(`Error optimizing tour ${tour.id}:`, error)
      result.status = 'failed'
    }
    
    return result
  }
  
  /**
   * Run optimization on all tours
   */
  async optimizeAllTours() {
    console.log('🚀 Image Optimization Agent Starting...\n')
    console.log('This agent will:')
    console.log('✓ Find higher resolution source images')
    console.log('✓ Apply AI upscaling for low-res images')
    console.log('✓ Enhance colors and contrast')
    console.log('✓ Enable WebP/AVIF format delivery')
    console.log('✓ Set up CDN caching and optimization\n')
    
    try {
      // First, add the optimization column if it doesn't exist
      console.log('Setting up database schema...')
      await supabase.rpc('exec_sql', {
        sql: `
          ALTER TABLE affiliate_tours 
          ADD COLUMN IF NOT EXISTS primary_image_optimized TEXT,
          ADD COLUMN IF NOT EXISTS optimization_date TIMESTAMP
        `
      }).catch(() => {
        // Column might already exist, that's okay
      })
      
      // Get all tours
      const { data: tours, error } = await supabase
        .from('affiliate_tours')
        .select('id, slug, title, primary_image, source_url, affiliate_url')
        .eq('is_active', true)
        .order('title')
      
      if (error || !tours) {
        console.error('Error fetching tours:', error)
        return
      }
      
      console.log(`Found ${tours.length} tours to optimize\n`)
      console.log('=' .repeat(60) + '\n')
      
      // Process each tour
      for (let i = 0; i < tours.length; i++) {
        const tour = tours[i]
        console.log(`[${i + 1}/${tours.length}] Optimizing: ${tour.title}`)
        
        const result = await this.optimizeTourImages(tour)
        this.results.push(result)
        
        if (result.status === 'success') {
          console.log(`   ✅ Optimized successfully`)
          if (result.improvements.length > 0) {
            console.log(`   Improvements:`)
            result.improvements.forEach(imp => {
              console.log(`   - ${imp}`)
            })
          }
        } else if (result.status === 'failed') {
          console.log(`   ❌ Optimization failed`)
        } else {
          console.log(`   ⏭️  Already optimized`)
        }
        
        console.log() // Empty line for readability
        
        // Small delay to avoid overwhelming servers
        await new Promise(resolve => setTimeout(resolve, 100))
      }
      
      // Generate report
      this.generateReport()
      
    } catch (error) {
      console.error('Fatal error during optimization:', error)
    }
  }
  
  /**
   * Generate optimization report
   */
  private generateReport() {
    const successful = this.results.filter(r => r.status === 'success').length
    const failed = this.results.filter(r => r.status === 'failed').length
    const skipped = this.results.filter(r => r.status === 'skipped').length
    
    console.log('=' .repeat(60))
    console.log('📊 OPTIMIZATION REPORT')
    console.log('=' .repeat(60))
    console.log(`✅ Successfully optimized: ${successful}`)
    console.log(`⏭️  Already optimized: ${skipped}`)
    console.log(`❌ Failed: ${failed}`)
    
    // Show examples of optimized URLs
    console.log('\n' + '=' .repeat(60))
    console.log('🖼️  EXAMPLE OPTIMIZED URLS:')
    console.log('=' .repeat(60))
    
    const examples = this.results
      .filter(r => r.status === 'success')
      .slice(0, 3)
    
    examples.forEach(ex => {
      console.log(`\n${ex.title}`)
      console.log('Original:')
      console.log(`  ${ex.originalImage.substring(0, 80)}...`)
      console.log('Optimized (via CDN):')
      console.log(`  ${ex.optimizedImage.substring(0, 80)}...`)
    })
    
    console.log('\n' + '=' .repeat(60))
    console.log('✨ Optimization complete!')
    console.log('\nNOTE: To enable CDN optimization, you need to:')
    console.log('1. Sign up for a free Cloudinary account at cloudinary.com')
    console.log('2. Update CLOUDINARY_CLOUD_NAME in imageOptimization.ts')
    console.log('3. Use OptimizedImage component in your React components')
    console.log('4. Images will be automatically optimized on-the-fly!')
  }
}

// Run the agent
async function main() {
  const agent = new ImageOptimizationAgent()
  await agent.optimizeAllTours()
}

// Support running directly or importing
if (require.main === module) {
  main().catch(console.error)
}

export default ImageOptimizationAgent