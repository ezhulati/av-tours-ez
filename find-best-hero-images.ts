import { config } from 'dotenv'
config()

import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.SUPABASE_URL!
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY!
const supabase = createClient(supabaseUrl, supabaseKey)

interface TourImage {
  title: string
  slug: string
  primary_image: string
  category?: string
  difficulty?: string
}

// Categories that represent adventure/action
const adventureKeywords = [
  'climbing', 'climb', 'via ferrata', 'peak', 'summit', 
  'ski', 'bike', 'biking', 'hiking', 'trek', 'trail',
  'adventure', 'mountain', 'alpine', 'canyon', 'zip',
  'snowshoe', 'wildlife', 'e-bike', 'downhill'
]

// High-quality destination keywords
const destinationKeywords = [
  'riviera', 'beach', 'lake', 'valley', 'castle',
  'heritage', 'unesco', 'city', 'cultural', 'temple'
]

async function findBestHeroImages() {
  console.log('🎬 Finding Best Hero Images for AlbaniaVisit\n')
  console.log('=' .repeat(60))
  
  // Get all tours with images
  const { data: tours, error } = await supabase
    .from('affiliate_tours')
    .select('title, slug, primary_image')
    .eq('is_active', true)
    .not('primary_image', 'is', null)
    .order('title')
  
  if (error || !tours) {
    console.error('Error fetching tours:', error)
    return
  }
  
  // Categorize tours
  const adventureTours: TourImage[] = []
  const destinationTours: TourImage[] = []
  const peaksTours: TourImage[] = []
  
  tours.forEach(tour => {
    const titleLower = tour.title.toLowerCase()
    
    // Special category for "Peaks of the Balkans" - signature tours
    if (titleLower.includes('peaks of the balkans')) {
      peaksTours.push(tour)
      return
    }
    
    // Check for adventure tours
    const isAdventure = adventureKeywords.some(keyword => 
      titleLower.includes(keyword)
    )
    
    if (isAdventure) {
      adventureTours.push(tour)
    }
    
    // Check for destination tours
    const isDestination = destinationKeywords.some(keyword => 
      titleLower.includes(keyword)
    )
    
    if (isDestination) {
      destinationTours.push(tour)
    }
  })
  
  console.log('\n🏔️ ADVENTURE/ACTION TOURS (Best for Hero):')
  console.log('=' .repeat(60))
  
  // Filter for high-quality images (not thumbnails)
  const topAdventure = adventureTours
    .filter(tour => {
      const img = tour.primary_image.toLowerCase()
      return !img.includes('-150x') && 
             !img.includes('-300x') && 
             !img.includes('thumb') &&
             !img.includes('small')
    })
    .slice(0, 15) // Top 15 adventure images
  
  topAdventure.forEach((tour, i) => {
    console.log(`\n${i + 1}. ${tour.title}`)
    const filename = tour.primary_image.split('/').pop()
    console.log(`   Image: ${filename}`)
    console.log(`   Full: ${tour.primary_image}`)
  })
  
  console.log('\n\n🌊 DESTINATION TOURS (Scenic Views):')
  console.log('=' .repeat(60))
  
  const topDestination = destinationTours
    .filter(tour => {
      const img = tour.primary_image.toLowerCase()
      return !img.includes('-150x') && 
             !img.includes('-300x') && 
             !img.includes('thumb')
    })
    .slice(0, 10)
  
  topDestination.forEach((tour, i) => {
    console.log(`\n${i + 1}. ${tour.title}`)
    const filename = tour.primary_image.split('/').pop()
    console.log(`   Image: ${filename}`)
  })
  
  console.log('\n\n⭐ PEAKS OF THE BALKANS (Signature Tours):')
  console.log('=' .repeat(60))
  
  peaksTours.slice(0, 5).forEach((tour, i) => {
    console.log(`\n${i + 1}. ${tour.title}`)
    const filename = tour.primary_image.split('/').pop()
    console.log(`   Image: ${filename}`)
  })
  
  // Generate recommended hero slideshow
  console.log('\n\n🎯 RECOMMENDED HERO SLIDESHOW (Top 10):')
  console.log('=' .repeat(60))
  
  const recommendations = [
    // Mix of adventure and scenic
    'Via Ferrata Mat and Ari - Via-Ferrata-Mat-1-1-scaled.jpg',
    'Ski Touring in the Accursed Mountains - kosovi-skitour-SSchoepf-1.jpg',
    'Peaks of the Balkans Trail - Qafa-e-Valbones-photo-by-Mentor-Vokshi.jpg',
    'Rock Climbing - danish5-768x476-1.jpg',
    'High Scardus Trail - 20230801_170835-scaled.jpg',
    'Maja Jezerce - jezerc-candy-960x476-min.jpg',
    'Albanian Riviera (keep current)',
    'Zagori Valley - Zagori-9-scaled.jpg',
    'Via Ferrata Shpellat - DB__8436-1-scaled.jpg',
    'Lake Koman (keep current)'
  ]
  
  console.log('\nRecommended slideshow order:')
  recommendations.forEach((rec, i) => {
    console.log(`${i + 1}. ${rec}`)
  })
  
  console.log('\n💡 IMAGES TO REMOVE:')
  console.log('- Any with animals (cows, etc)')
  console.log('- Low resolution images (<1024px width)')
  console.log('- Static/boring compositions')
  console.log('- Duplicates or similar views')
  
  console.log('\n✨ OPTIMIZATION NOTES:')
  console.log('- All images should be 1920x1080 minimum')
  console.log('- Use Weserv.nl CDN for optimization')
  console.log('- Prioritize action shots (climbing, skiing, hiking)')
  console.log('- Include 2-3 scenic destination shots for variety')
  console.log('- Ensure sharp, vibrant, high-contrast images')
}

findBestHeroImages().catch(console.error)