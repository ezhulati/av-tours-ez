// Montenegro hero images for the destination page
export const montenegroHeroImages = [
  {
    url: '/Assets/Montenegro/Kotor Montenegro_123711552.jpeg',
    alt: 'Bay of Kotor with medieval town and mountains',
    caption: 'Bay of Kotor - Europe\'s Southernmost Fjord',
    title: 'Bay of Kotor - Europe\'s Southernmost Fjord'
  },
  {
    url: '/Assets/Montenegro/Lovcen Mountains National park Montenegro_165889777.jpeg',
    alt: 'Lovćen Mountains National Park panoramic view',
    caption: 'Lovćen Mountains - Montenegro\'s Black Mountain',
    title: 'Lovćen Mountains - Montenegro\'s Black Mountain'
  },
  {
    url: '/Assets/Montenegro/Montenegro_216089172.jpeg',
    alt: 'Dramatic Montenegro landscape',
    caption: 'Wild Beauty of Montenegro',
    title: 'Wild Beauty of Montenegro'
  },
  {
    url: '/Assets/Montenegro/Moracha Monastery Montenegro_382804243.jpeg',
    alt: 'Historic Morača Monastery in Montenegro',
    caption: 'Morača Monastery - Spiritual Heritage',
    title: 'Morača Monastery - Spiritual Heritage'
  }
]

// Export function to get Montenegro images
export function getMontenegroImages() {
  return montenegroHeroImages
}

// Export for database storage - formatted for JSON storage
export const montenegroImagesForDB = {
  country_code: 'ME',
  country_name: 'Montenegro',
  hero_images: montenegroHeroImages,
  updated_at: new Date().toISOString()
}