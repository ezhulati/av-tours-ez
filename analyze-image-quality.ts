import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'
import * as cheerio from 'cheerio'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ImageAnalysis {
  url: string
  width?: number
  height?: number
  format?: string
  sizeKB?: number
  quality: 'high' | 'medium' | 'low' | 'very-low'
  issues: string[]
}

// Analyze image quality from URL
async function analyzeImageQuality(imageUrl: string): Promise<ImageAnalysis | null> {
  try {
    // Extract dimensions from URL if present (common in WordPress)
    const dimensionMatch = imageUrl.match(/(\d+)x(\d+)/g)
    let urlWidth = 0
    let urlHeight = 0
    
    if (dimensionMatch) {
      const dims = dimensionMatch[dimensionMatch.length - 1].split('x')
      urlWidth = parseInt(dims[0])
      urlHeight = parseInt(dims[1])
    }
    
    // Check for low-quality indicators in URL
    const issues: string[] = []
    const lowerUrl = imageUrl.toLowerCase()
    
    // Check for thumbnail indicators
    if (lowerUrl.includes('thumb') || lowerUrl.includes('-150x') || lowerUrl.includes('-300x')) {
      issues.push('Thumbnail image')
    }
    
    // Check for scaled images (often lower quality)
    if (lowerUrl.includes('-scaled')) {
      issues.push('Pre-scaled image (may be compressed)')
    }
    
    // Check for small dimensions
    if (urlWidth > 0 && urlWidth < 800) {
      issues.push(`Low width: ${urlWidth}px (need 1920px+)`)
    }
    if (urlHeight > 0 && urlHeight < 600) {
      issues.push(`Low height: ${urlHeight}px (need 1080px+)`)
    }
    
    // Check format
    let format = 'unknown'
    if (lowerUrl.includes('.jpg') || lowerUrl.includes('.jpeg')) format = 'jpeg'
    else if (lowerUrl.includes('.png')) format = 'png'
    else if (lowerUrl.includes('.webp')) format = 'webp'
    else if (lowerUrl.includes('.gif')) {
      format = 'gif'
      issues.push('GIF format (not optimal for photos)')
    }
    
    // Determine quality rating
    let quality: 'high' | 'medium' | 'low' | 'very-low' = 'high'
    
    if (urlWidth > 0 && urlWidth < 600) quality = 'very-low'
    else if (urlWidth >= 600 && urlWidth < 1024) quality = 'low'
    else if (urlWidth >= 1024 && urlWidth < 1920) quality = 'medium'
    else if (issues.length > 2) quality = 'low'
    else if (issues.length > 0) quality = 'medium'
    
    // Try to fetch actual image for more accurate analysis
    try {
      const response = await fetch(imageUrl, { method: 'HEAD' })
      if (response.ok) {
        const contentLength = response.headers.get('content-length')
        if (contentLength) {
          const sizeKB = Math.round(parseInt(contentLength) / 1024)
          if (sizeKB > 2000) {
            issues.push(`Large file size: ${sizeKB}KB (optimize to <500KB)`)
          }
          
          return {
            url: imageUrl,
            width: urlWidth || undefined,
            height: urlHeight || undefined,
            format,
            sizeKB,
            quality,
            issues
          }
        }
      }
    } catch (e) {
      // Ignore fetch errors, continue with URL analysis
    }
    
    return {
      url: imageUrl,
      width: urlWidth || undefined,
      height: urlHeight || undefined,
      format,
      quality,
      issues
    }
    
  } catch (error) {
    console.error(`Error analyzing ${imageUrl}:`, error)
    return null
  }
}

async function analyzeAllTourImages() {
  console.log('🔍 Analyzing image quality across all tours...\n')
  
  try {
    // Get all active tours
    const { data: tours, error } = await supabase
      .from('affiliate_tours')
      .select('id, slug, title, primary_image, image_gallery')
      .eq('is_active', true)
      .order('title')
    
    if (error || !tours) {
      console.error('Error fetching tours:', error)
      return
    }
    
    console.log(`Found ${tours.length} tours to analyze\n`)
    
    const stats = {
      total: 0,
      high: 0,
      medium: 0,
      low: 0,
      veryLow: 0,
      problematicTours: [] as any[]
    }
    
    // Analyze each tour's primary image
    for (const tour of tours) {
      if (!tour.primary_image) continue
      
      const analysis = await analyzeImageQuality(tour.primary_image)
      if (!analysis) continue
      
      stats.total++
      
      switch (analysis.quality) {
        case 'high':
          stats.high++
          break
        case 'medium':
          stats.medium++
          break
        case 'low':
          stats.low++
          stats.problematicTours.push({
            title: tour.title,
            slug: tour.slug,
            image: tour.primary_image,
            quality: analysis.quality,
            issues: analysis.issues,
            dimensions: analysis.width ? `${analysis.width}x${analysis.height}` : 'unknown'
          })
          break
        case 'very-low':
          stats.veryLow++
          stats.problematicTours.push({
            title: tour.title,
            slug: tour.slug,
            image: tour.primary_image,
            quality: analysis.quality,
            issues: analysis.issues,
            dimensions: analysis.width ? `${analysis.width}x${analysis.height}` : 'unknown'
          })
          break
      }
      
      // Show progress
      if (stats.total % 10 === 0) {
        console.log(`Analyzed ${stats.total} tours...`)
      }
    }
    
    // Report results
    console.log('\n' + '='.repeat(60))
    console.log('📊 IMAGE QUALITY ANALYSIS REPORT')
    console.log('='.repeat(60))
    console.log(`Total images analyzed: ${stats.total}`)
    console.log(`✅ High quality (1920px+): ${stats.high} (${Math.round(stats.high/stats.total*100)}%)`)
    console.log(`⚠️  Medium quality (1024-1920px): ${stats.medium} (${Math.round(stats.medium/stats.total*100)}%)`)
    console.log(`❌ Low quality (600-1024px): ${stats.low} (${Math.round(stats.low/stats.total*100)}%)`)
    console.log(`🚨 Very low quality (<600px): ${stats.veryLow} (${Math.round(stats.veryLow/stats.total*100)}%)`)
    
    if (stats.problematicTours.length > 0) {
      console.log('\n' + '='.repeat(60))
      console.log('🚨 TOURS WITH LOW-QUALITY IMAGES:')
      console.log('='.repeat(60))
      
      // Sort by quality (worst first)
      stats.problematicTours.sort((a, b) => {
        if (a.quality === 'very-low' && b.quality !== 'very-low') return -1
        if (b.quality === 'very-low' && a.quality !== 'very-low') return 1
        return 0
      })
      
      for (const tour of stats.problematicTours.slice(0, 20)) { // Show top 20
        console.log(`\n📸 ${tour.title}`)
        console.log(`   Quality: ${tour.quality.toUpperCase()}`)
        console.log(`   Dimensions: ${tour.dimensions}`)
        if (tour.issues.length > 0) {
          console.log(`   Issues:`)
          tour.issues.forEach((issue: string) => {
            console.log(`   - ${issue}`)
          })
        }
        console.log(`   URL: ${tour.image.substring(0, 80)}...`)
      }
      
      if (stats.problematicTours.length > 20) {
        console.log(`\n... and ${stats.problematicTours.length - 20} more tours with quality issues`)
      }
    }
    
    // Recommendations
    console.log('\n' + '='.repeat(60))
    console.log('💡 RECOMMENDATIONS:')
    console.log('='.repeat(60))
    console.log('1. Set up Cloudinary or similar CDN for automatic optimization')
    console.log('2. Use AI upscaling for low-resolution images')
    console.log('3. Implement responsive images with srcset')
    console.log('4. Convert to WebP/AVIF for better compression')
    console.log('5. Set minimum quality thresholds (1920x1080 for hero images)')
    
    const needsOptimization = stats.low + stats.veryLow
    console.log(`\n🎯 ${needsOptimization} tours (${Math.round(needsOptimization/stats.total*100)}%) need immediate image optimization`)
    
  } catch (error) {
    console.error('Fatal error during analysis:', error)
  }
}

// Run the analysis
analyzeAllTourImages()