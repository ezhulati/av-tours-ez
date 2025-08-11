import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { execSync } from 'child_process'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface ImageAnalysis {
  path: string
  filename: string
  sizeKB: number
  dimensions?: string
  quality: 'excellent' | 'good' | 'fair' | 'poor'
  content: string
  score: number
  isHeroWorthy: boolean
}

// Get image dimensions using ImageMagick identify
function getImageDimensions(imagePath: string): string {
  try {
    const result = execSync(`identify -format "%wx%h" "${imagePath}" 2>/dev/null`, { encoding: 'utf8' })
    return result.trim()
  } catch {
    return 'unknown'
  }
}

// Analyze local asset images
async function analyzeLocalAssets(): Promise<ImageAnalysis[]> {
  const results: ImageAnalysis[] = []
  const assetsDir = 'public/Assets'
  
  console.log('🔍 Analyzing Local Asset Images...\n')
  
  // Get all image files
  const imageExtensions = ['.jpg', '.jpeg', '.png', '.webp']
  const findImages = (dir: string): string[] => {
    const files: string[] = []
    const items = fs.readdirSync(dir)
    
    for (const item of items) {
      const fullPath = path.join(dir, item)
      const stat = fs.statSync(fullPath)
      
      if (stat.isDirectory()) {
        files.push(...findImages(fullPath))
      } else if (imageExtensions.some(ext => item.toLowerCase().endsWith(ext))) {
        files.push(fullPath)
      }
    }
    return files
  }
  
  const imageFiles = findImages(assetsDir)
  
  for (const imagePath of imageFiles) {
    const stat = fs.statSync(imagePath)
    const sizeKB = Math.round(stat.size / 1024)
    const filename = path.basename(imagePath)
    const dimensions = getImageDimensions(imagePath)
    
    // Parse dimensions
    const [width, height] = dimensions.split('x').map(d => parseInt(d) || 0)
    
    // Score based on multiple factors
    let score = 0
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'poor'
    
    // Size scoring (prefer high-res)
    if (width >= 1920) {
      score += 30
      quality = 'excellent'
    } else if (width >= 1280) {
      score += 20
      quality = 'good'
    } else if (width >= 800) {
      score += 10
      quality = 'fair'
    }
    
    // File size (indicates quality)
    if (sizeKB > 500 && sizeKB < 2000) score += 15 // Good quality range
    if (sizeKB > 2000) score += 5 // Might be too large
    
    // Content scoring based on filename
    const filenameL = filename.toLowerCase()
    const heroKeywords = [
      'mountain', 'alps', 'peak', 'trail', 'hiking', 'accursed',
      'valbona', 'theth', 'riviera', 'koman', 'canyon', 'river',
      'gjeravica', 'beach', 'coast', 'sunset', 'sunrise', 'panorama'
    ]
    
    const avoidKeywords = [
      'flag', 'statue', 'portrait', 'indoor', 'wall', 'building',
      'city', 'urban', 'car', 'road', 'abandoned', 'fortress'
    ]
    
    // Positive keywords
    heroKeywords.forEach(keyword => {
      if (filenameL.includes(keyword)) score += 10
    })
    
    // Negative keywords
    avoidKeywords.forEach(keyword => {
      if (filenameL.includes(keyword)) score -= 15
    })
    
    // Special boost for known great images
    if (filenameL.includes('valbona') && filenameL.includes('theth')) score += 20
    if (filenameL.includes('accursed_mountains')) score += 20
    if (filenameL.includes('albanian_riviera')) score += 15
    if (filenameL.includes('lake_koman')) score += 15
    if (filenameL.includes('gjeravica')) score += 15
    
    // Determine content type
    let content = 'landscape'
    if (filenameL.includes('trail') || filenameL.includes('hiking')) content = 'hiking/adventure'
    if (filenameL.includes('beach') || filenameL.includes('riviera') || filenameL.includes('coast')) content = 'beach/coast'
    if (filenameL.includes('mountain') || filenameL.includes('alps') || filenameL.includes('peak')) content = 'mountain'
    if (filenameL.includes('lake') || filenameL.includes('river')) content = 'water/nature'
    if (filenameL.includes('flag') || filenameL.includes('statue')) content = 'cultural/static'
    if (filenameL.includes('city') || filenameL.includes('building')) content = 'urban'
    
    const isHeroWorthy = score >= 40 && quality !== 'poor' && width >= 1280
    
    results.push({
      path: imagePath.replace('public/', '/'),
      filename,
      sizeKB,
      dimensions,
      quality,
      content,
      score,
      isHeroWorthy
    })
  }
  
  return results
}

// Analyze tour images from database
async function analyzeTourImages(): Promise<ImageAnalysis[]> {
  const results: ImageAnalysis[] = []
  
  console.log('\n🔍 Analyzing Tour Images from Database...\n')
  
  const { data: tours } = await supabase
    .from('affiliate_tours')
    .select('title, primary_image')
    .eq('is_active', true)
    .not('primary_image', 'is', null)
  
  if (!tours) return results
  
  for (const tour of tours) {
    const url = tour.primary_image
    const filename = url.split('/').pop() || ''
    const filenameL = filename.toLowerCase()
    
    // Score based on URL patterns
    let score = 0
    let quality: 'excellent' | 'good' | 'fair' | 'poor' = 'fair'
    
    // Check for size indicators in URL
    if (url.includes('scaled') || url.includes('2048') || url.includes('1920')) {
      quality = 'excellent'
      score += 30
    } else if (url.includes('1024') || url.includes('1280')) {
      quality = 'good'
      score += 20
    } else if (url.includes('768') || url.includes('600')) {
      quality = 'fair'
      score += 10
    } else if (url.includes('300') || url.includes('150') || url.includes('thumb')) {
      quality = 'poor'
      score -= 20
    }
    
    // Content scoring based on tour title
    const titleL = tour.title.toLowerCase()
    const adventureKeywords = ['climbing', 'via ferrata', 'peak', 'summit', 'ski', 'bike', 'trek', 'trail']
    
    adventureKeywords.forEach(keyword => {
      if (titleL.includes(keyword)) score += 15
    })
    
    // Special boost for signature tours
    if (titleL.includes('peaks of the balkans')) score += 25
    if (titleL.includes('via ferrata')) score += 20
    if (titleL.includes('ski')) score += 20
    
    const content = titleL.includes('via ferrata') ? 'climbing/adventure' :
                   titleL.includes('ski') ? 'winter/adventure' :
                   titleL.includes('peak') || titleL.includes('summit') ? 'mountain/summit' :
                   titleL.includes('trail') || titleL.includes('trek') ? 'hiking/adventure' :
                   titleL.includes('beach') || titleL.includes('riviera') ? 'beach/coast' :
                   'tour/general'
    
    const isHeroWorthy = score >= 30 && quality !== 'poor'
    
    results.push({
      path: url,
      filename: `${tour.title} - ${filename}`,
      sizeKB: 0, // Unknown from URL
      dimensions: 'check-url',
      quality,
      content,
      score,
      isHeroWorthy
    })
  }
  
  return results
}

async function findBestHeroImages() {
  console.log('🎬 COMPREHENSIVE IMAGE ANALYSIS FOR HERO SELECTION\n')
  console.log('=' .repeat(70))
  
  // Analyze all images
  const localImages = await analyzeLocalAssets()
  const tourImages = await analyzeTourImages()
  const allImages = [...localImages, ...tourImages]
  
  // Sort by score
  allImages.sort((a, b) => b.score - a.score)
  
  // Get hero-worthy images
  const heroWorthy = allImages.filter(img => img.isHeroWorthy)
  
  console.log('\n🏆 TOP 15 HERO-WORTHY IMAGES:')
  console.log('=' .repeat(70))
  
  heroWorthy.slice(0, 15).forEach((img, i) => {
    console.log(`\n${i + 1}. [Score: ${img.score}] ${img.filename}`)
    console.log(`   Quality: ${img.quality.toUpperCase()} | Dimensions: ${img.dimensions}`)
    console.log(`   Content: ${img.content} | Size: ${img.sizeKB}KB`)
    console.log(`   Path: ${img.path}`)
  })
  
  // Group by content type
  const byContent: Record<string, typeof heroWorthy> = {}
  heroWorthy.forEach(img => {
    if (!byContent[img.content]) byContent[img.content] = []
    byContent[img.content].push(img)
  })
  
  console.log('\n\n📊 BEST IMAGES BY CATEGORY:')
  console.log('=' .repeat(70))
  
  Object.entries(byContent).forEach(([content, images]) => {
    console.log(`\n${content.toUpperCase()}:`)
    images.slice(0, 3).forEach(img => {
      console.log(`  • ${img.filename} (Score: ${img.score})`)
    })
  })
  
  // Final recommendations
  console.log('\n\n✨ RECOMMENDED HERO SLIDESHOW (FINAL 10):')
  console.log('=' .repeat(70))
  
  const recommendations = [
    heroWorthy.find(img => img.content === 'hiking/adventure'),
    heroWorthy.find(img => img.content === 'mountain'),
    heroWorthy.find(img => img.content === 'climbing/adventure'),
    heroWorthy.find(img => img.content === 'beach/coast'),
    heroWorthy.find(img => img.content === 'water/nature'),
    heroWorthy.find(img => img.content === 'mountain/summit'),
    ...heroWorthy.filter(img => img.content === 'landscape').slice(0, 2),
    ...heroWorthy.filter(img => img.score > 50).slice(0, 2)
  ].filter(Boolean).slice(0, 10)
  
  console.log('\nFinal Selection:')
  recommendations.forEach((img, i) => {
    if (img) {
      console.log(`${i + 1}. ${img.filename}`)
      console.log(`   ${img.path}`)
    }
  })
  
  // Generate code snippet
  console.log('\n\n📝 CODE FOR heroImages.ts:')
  console.log('=' .repeat(70))
  console.log('export const heroImages = [')
  recommendations.slice(0, 8).forEach(img => {
    if (img) {
      console.log(`  {`)
      console.log(`    src: '${img.path}',`)
      console.log(`    alt: '${img.content.replace('/', ' ')} in Albania',`)
      console.log(`    title: '${img.filename.split('.')[0].replace(/_/g, ' ')}',`)
      console.log(`    category: '${img.content.includes('adventure') || img.content.includes('mountain') ? 'adventure' : 'destination'}'`)
      console.log(`  },`)
    }
  })
  console.log(']')
}

findBestHeroImages().catch(console.error)