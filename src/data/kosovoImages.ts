// Kosovo hero images for the destination page
export const kosovoHeroImages = [
  {
    url: '/Assets/Kosovo/Gjeravica_Kosovo_336042834.jpeg',
    alt: 'Gjeravica Peak, the highest mountain in Kosovo',
    caption: 'Gjeravica Peak - Kosovo\'s Roof at 2,656m',
    title: 'Gjeravica Peak - Kosovo\'s Roof at 2,656m'
  },
  {
    url: '/Assets/Kosovo/Kosovo_329920270.jpeg',
    alt: 'Traditional Kosovo landscape with mountains',
    caption: 'The Untamed Beauty of Kosovo\'s Highlands',
    title: 'The Untamed Beauty of Kosovo\'s Highlands'
  },
  {
    url: '/Assets/Kosovo/Kucisko_Lake_Kosovo_135448859.jpeg',
    alt: 'Kuçishte Lake surrounded by Kosovo mountains',
    caption: 'Kuçishte Lake - A Hidden Alpine Gem',
    title: 'Kuçishte Lake - A Hidden Alpine Gem'
  },
  {
    url: '/Assets/Kosovo/Lac Leqinat Pejë Kosovo_220878090.jpeg',
    alt: 'Leqinat Lakes near Peja in Kosovo',
    caption: 'Leqinat Lakes - Where Mountains Mirror the Sky',
    title: 'Leqinat Lakes - Where Mountains Mirror the Sky'
  }
]

// Export function to get Kosovo images
export function getKosovoImages() {
  return kosovoHeroImages
}

// Export for database storage - formatted for JSON storage
export const kosovoImagesForDB = {
  country_code: 'XK',
  country_name: 'Kosovo',
  hero_images: kosovoHeroImages,
  updated_at: new Date().toISOString()
}