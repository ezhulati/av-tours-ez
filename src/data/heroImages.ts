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
// These are action-packed, high-quality, sharp images that showcase adventure
export const heroImages: HeroImage[] = [
  // === TOP ADVENTURE/ACTION SHOTS ===
  {
    src: 'https://bnadventure.com/wp-content/uploads/2023/11/Via-Ferrata-Mat-1-1-scaled.jpg',
    alt: 'Via Ferrata climbing adventure in Albanian mountains',
    title: 'Via Ferrata Mat',
    category: 'adventure'
  },
  {
    src: 'https://bnadventure.com/wp-content/uploads/2023/11/kosovi-skitour-SSchoepf-1.jpg',
    alt: 'Ski touring in the Accursed Mountains',
    title: 'Ski Touring',
    category: 'adventure'
  },
  {
    src: 'https://bnadventure.com/wp-content/uploads/2023/09/Qafa-e-Valbones-photo-by-Mentor-Vokshi.jpg',
    alt: 'Peaks of the Balkans trail panoramic view',
    title: 'Peaks of the Balkans',
    category: 'signature'
  },
  {
    src: 'https://bnadventure.com/wp-content/uploads/2023/09/20230801_170835-scaled.jpg',
    alt: 'High Scardus Trail mountain ridge',
    title: 'High Scardus Trail',
    category: 'adventure'
  },
  {
    src: 'https://bnadventure.com/wp-content/uploads/2023/09/View-from-Kollata-Peak-scaled-e1637588560888-1348x476-min.jpg',
    alt: 'View from Zla Kollata peak summit',
    title: 'Zla Kollata Summit',
    category: 'adventure'
  },
  {
    src: 'https://bnadventure.com/wp-content/uploads/2023/11/DB__8436-1-scaled.jpg',
    alt: 'Via Ferrata Shpellat caves adventure',
    title: 'Via Ferrata Caves',
    category: 'adventure'
  },
  
  // === STUNNING DESTINATION SHOTS ===
  {
    src: 'https://bnadventure.com/wp-content/uploads/2024/01/Zagori-9-scaled.jpg',
    alt: 'Zagori Valley Albania scenic landscape',
    title: 'Zagori Valley',
    category: 'destination'
  },
  {
    src: 'https://bnadventure.com/wp-content/uploads/2023/09/liqeni-liqunatit-kufini-1348x476-min.jpg',
    alt: 'Lake Liqenat crystal clear alpine waters',
    title: 'Lake Liqenat',
    category: 'destination'
  },
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
  
  // === ADDITIONAL HIGH-QUALITY SHOTS ===
  {
    src: 'https://bnadventure.com/wp-content/uploads/2023/09/2I6A7056-1-1348x476-min.jpg',
    alt: 'Highest peaks of 4 countries expedition',
    title: 'Four Country Peaks',
    category: 'adventure'
  },
  {
    src: 'https://bnadventure.com/wp-content/uploads/2023/09/adriatik-top-white-1348x476-min.jpg',
    alt: 'Mountain summit view across Kosovo',
    title: 'Kosovo Summit',
    category: 'adventure'
  }
]

// Generate optimized versions of all images
export const optimizedHeroImages = heroImages.map(image => ({
  ...image,
  optimizedSrc: getOptimizedImageUrl(image.src, {
    width: 1920,
    height: 1080,
    quality: 'auto:best',
    format: 'auto',
    enhance: true
  })
}))

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