// Albania hero images for the destination page
export const albaniaHeroImages = [
  {
    url: '/Assets/Albania/Albanian_Riviera_Beach_Blue_Water.jpeg',
    alt: 'Albanian Riviera beach with crystal blue waters',
    caption: 'Albanian Riviera - Crystal Blue Waters',
    title: 'Albanian Riviera - Crystal Blue Waters'
  },
  {
    url: '/Assets/Albania/Accursed_Mountains.jpeg',
    alt: 'Accursed Mountains peaks in northern Albania',
    caption: 'Accursed Mountains - Majestic Peaks',
    title: 'Accursed Mountains - Majestic Peaks'
  },
  {
    url: '/Assets/Albania/Northern_Albania_Shala_River.jpeg',
    alt: 'Shala River in Northern Albania',
    caption: 'Shala River - Northern Albania Paradise',
    title: 'Shala River - Northern Albania Paradise'
  },
  {
    url: '/Assets/Albania/Albania_Coast.jpeg',
    alt: 'Albanian coastline with dramatic cliffs',
    caption: 'Albanian Coast - Endless Beauty',
    title: 'Albanian Coast - Endless Beauty'
  },
  {
    url: '/Assets/Albania/Valbona_Valley_Guesthouse.jpg',
    alt: 'Traditional guesthouse in Valbona Valley',
    caption: 'Valbona Valley - Mountain Hospitality',
    title: 'Valbona Valley - Mountain Hospitality'
  },
  {
    url: '/Assets/Albania/Albania_Lake_Koman.jpeg',
    alt: 'Lake Koman fjord-like waters',
    caption: 'Lake Koman - Hidden Fjords',
    title: 'Lake Koman - Hidden Fjords'
  },
  {
    url: '/Assets/Albania/Ali_Pasha_Fortress_Porto_Palermo.jpeg',
    alt: 'Ali Pasha Fortress at Porto Palermo',
    caption: 'Ali Pasha Fortress - Porto Palermo',
    title: 'Ali Pasha Fortress - Porto Palermo'
  },
  {
    url: '/Assets/Albania/Lukove_beach.jpeg',
    alt: 'Lukove beach on the Albanian Riviera',
    caption: 'Lukove Beach - Hidden Gem',
    title: 'Lukove Beach - Hidden Gem'
  },
  {
    url: '/Assets/Albania/Lake_Prespa_Albania.jpeg',
    alt: 'Lake Prespa tranquil waters',
    caption: 'Lake Prespa - Tranquil Waters',
    title: 'Lake Prespa - Tranquil Waters'
  },
  {
    url: '/Assets/Albania/Albanian_Alps.jpg',
    alt: 'Albanian Alps mountain wilderness',
    caption: 'Albanian Alps - Majestic Wilderness',
    title: 'Albanian Alps - Majestic Wilderness'
  },
  {
    url: '/Assets/Albania/Albania_Hiking.jpeg',
    alt: 'Hikers on Albanian mountain trails',
    caption: 'Mountain Trails - Adventure Awaits',
    title: 'Mountain Trails - Adventure Awaits'
  },
  {
    url: '/Assets/Albania/Albanian_Flag_Porto_Palermo.jpeg',
    alt: 'Albanian flag at Porto Palermo Castle',
    caption: 'Porto Palermo Castle - National Pride',
    title: 'Porto Palermo Castle - National Pride'
  },
  {
    url: '/Assets/Albania/Old_Mes_Bridge.jpeg',
    alt: 'Historic Mes Bridge architecture',
    caption: 'Mes Bridge - Historic Architecture',
    title: 'Mes Bridge - Historic Architecture'
  },
  {
    url: '/Assets/Albania/albanian-riviera-5.jpg',
    alt: 'Albanian Riviera coastal paradise',
    caption: 'Albanian Riviera - Coastal Paradise',
    title: 'Albanian Riviera - Coastal Paradise'
  },
  {
    url: '/Assets/Albania/albanian-riviera-2.jpeg',
    alt: 'Albanian Riviera azure waters',
    caption: 'Albanian Riviera - Azure Waters',
    title: 'Albanian Riviera - Azure Waters'
  }
]

// Export function to get Albania images
export function getAlbaniaImages() {
  return albaniaHeroImages
}

// Export for database storage - formatted for JSON storage
export const albaniaImagesForDB = {
  country_code: 'AL',
  country_name: 'Albania',
  hero_images: albaniaHeroImages,
  updated_at: new Date().toISOString()
}