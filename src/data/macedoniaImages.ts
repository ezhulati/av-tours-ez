// North Macedonia hero images for the destination page
export const macedoniaHeroImages = [
  {
    url: '/Assets/North Macedonia/North Macedonia_456949808.jpeg',
    alt: 'North Macedonia landscape with mountains and valleys',
    caption: 'North Macedonia - Land of Ancient Wonders',
    title: 'North Macedonia - Land of Ancient Wonders'
  },
  {
    url: '/Assets/North Macedonia/Roman_Aquaduct_in_Macedonia_484708122.jpeg',
    alt: 'Ancient Roman Aqueduct in North Macedonia',
    caption: 'Roman Aqueduct - Living History',
    title: 'Roman Aqueduct - Living History'
  },
  {
    url: '/Assets/North Macedonia/Skopje Macedonia_230959493.jpeg',
    alt: 'Skopje city view with historic and modern architecture',
    caption: 'Skopje - Where Old Meets New',
    title: 'Skopje - Where Old Meets New'
  },
  {
    url: '/Assets/North Macedonia/Skopje, Macedonia_607034892.jpeg',
    alt: 'Skopje cityscape showing modern Macedonia',
    caption: 'Skopje Cityscape - Modern Macedonia',
    title: 'Skopje Cityscape - Modern Macedonia'
  }
]

// Export function to get North Macedonia images
export function getMacedoniaImages() {
  return macedoniaHeroImages
}

// Export for database storage - formatted for JSON storage
export const macedoniaImagesForDB = {
  country_code: 'MK',
  country_name: 'North Macedonia',
  hero_images: macedoniaHeroImages,
  updated_at: new Date().toISOString()
}