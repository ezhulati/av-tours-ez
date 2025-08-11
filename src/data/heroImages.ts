/**
 * Curated Hero Images for AlbaniaVisit
 * Premium adventure and destination photos for hero sections
 */

import { getOptimizedImageUrl } from '@/lib/imageOptimization'

export interface HeroImage {
  src: string
  alt: string
  title: string
  category: 'adventure' | 'destination' | 'signature'
  optimizedSrc?: string
}

// Curated list of the absolute best images for hero sections
// Using local assets to ensure they load properly
export const heroImages: HeroImage[] = [
  // === TOP ADVENTURE/ACTION SHOTS ===
  {
    src: '/Assets/Albania/Albanian_Alps.jpg',
    alt: 'Albanian Alps dramatic mountain peaks',
    title: 'Albanian Alps',
    category: 'adventure'
  },
  {
    src: '/Assets/Albania/Valbona_to_Theth_Trail.jpg',
    alt: 'Valbona to Theth hiking trail through mountains',
    title: 'Valbona Trail',
    category: 'adventure'
  },
  {
    src: '/Assets/Albania/Accursed_Mountains.jpeg',
    alt: 'Accursed Mountains dramatic peaks and valleys',
    title: 'Accursed Mountains',
    category: 'signature'
  },
  {
    src: '/Assets/Albania/Albania_Hiking.jpeg',
    alt: 'Mountain hiking trails in Albania',
    title: 'Mountain Hiking',
    category: 'adventure'
  },
  {
    src: '/Assets/Kosovo/Gjeravica_Kosovo_336042834.jpeg',
    alt: 'Gjeravica Peak - highest point in Kosovo',
    title: 'Gjeravica Peak',
    category: 'adventure'
  },
  
  // === STUNNING DESTINATION SHOTS ===
  {
    src: '/Assets/Albania/Albanian_Riviera_Beach_Blue_Water.jpeg',
    alt: 'Albanian Riviera turquoise waters and beaches',
    title: 'Albanian Riviera',
    category: 'destination'
  },
  {
    src: '/Assets/Albania/Albania_Lake_Koman.jpeg',
    alt: 'Lake Koman ferry through dramatic fjords',
    title: 'Lake Koman',
    category: 'destination'
  },
  {
    src: '/Assets/Montenegro/Lovcen Mountains National park Montenegro_165889777.jpeg',
    alt: 'Lovćen Mountains National Park Montenegro',
    title: 'Lovćen Mountains',
    category: 'destination'
  },
  {
    src: '/Assets/Albania/Lake_Prespa_Albania.jpeg',
    alt: 'Lake Prespa tranquil waters and mountains',
    title: 'Lake Prespa',
    category: 'destination'
  },
  
  // === ADDITIONAL HIGH-QUALITY SHOTS ===
  {
    src: '/Assets/North Macedonia/North Macedonia_456949808.jpeg',
    alt: 'North Macedonia mountain landscapes',
    title: 'Macedonia Mountains',
    category: 'adventure'
  },
  {
    src: '/Assets/Albania/Northern_Albania_Shala_River.jpeg',
    alt: 'Shala River crystal clear waters Northern Albania',
    title: 'Shala River',
    category: 'destination'
  }
]

// Generate optimized versions of all images
export const optimizedHeroImages = heroImages.map(image => {
  // For local images, convert to full URL for CDN optimization
  const fullUrl = image.src.startsWith('/') 
    ? `https://tours.albaniavisit.com${image.src}`
    : image.src
    
  return {
    ...image,
    optimizedSrc: getOptimizedImageUrl(fullUrl, {
      width: 1920,
      height: 1080,
      quality: 'auto:best',
      format: 'auto',
      enhance: true
    })
  }
})

// Get images by category
export const getHeroImagesByCategory = (category: 'adventure' | 'destination' | 'signature') => {
  return optimizedHeroImages.filter(img => img.category === category)
}

// Get a balanced mix for homepage (60% adventure, 40% destination)
export const getHomepageHeroImages = () => {
  const adventure = getHeroImagesByCategory('adventure').slice(0, 6)
  const destination = getHeroImagesByCategory('destination').slice(0, 4)
  const signature = getHeroImagesByCategory('signature')
  
  // Mix them for variety: adventure, destination, adventure, signature...
  const mixed: typeof optimizedHeroImages = []
  let advIndex = 0, destIndex = 0, sigIndex = 0
  
  for (let i = 0; i < 10; i++) {
    if (i % 3 === 0 && destIndex < destination.length) {
      mixed.push(destination[destIndex++])
    } else if (i % 5 === 0 && sigIndex < signature.length) {
      mixed.push(signature[sigIndex++])
    } else if (advIndex < adventure.length) {
      mixed.push(adventure[advIndex++])
    }
  }
  
  return mixed.filter(Boolean).slice(0, 8) // Return top 8 for slideshow
}

// Images to REMOVE from current hero (low quality or inappropriate)
export const imagesToRemove = [
  'Accursed_Mountains.jpeg', // Keep only if high-res version
  'Albanian_Alps.jpg', // Generic, not action-packed
  'Valbona_to_Theth_Trail.jpg', // Check quality
  'Northern_Albania_Shala_River.jpeg', // Static water shot
  'Kotor Montenegro_123711552.jpeg' // Not Albania-focused
]

// Recommended hero configuration
export const heroConfig = {
  slideDuration: 6000, // 6 seconds per slide
  transitionDuration: 2000, // 2 second fade
  enableKenBurns: true, // Subtle zoom effect
  enableParallax: true, // Parallax on scroll
  mobileOptimized: true // Different images for mobile
}