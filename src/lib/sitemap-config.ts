/**
 * Enhanced Sitemap Configuration for AlbaniaVisit Tours
 * Optimized for crawl efficiency and priority distribution
 */

export interface SitemapEntry {
  url: string
  changefreq?: 'always' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'yearly' | 'never'
  priority?: number
  lastmod?: string
  images?: Array<{
    url: string
    title?: string
    caption?: string
    geo_location?: string
    license?: string
  }>
  videos?: Array<{
    thumbnail_loc: string
    title: string
    description: string
    content_loc?: string
    duration?: number
    publication_date?: string
  }>
  alternates?: Array<{
    href: string
    hreflang: string
  }>
}

// Priority scoring based on business value and user intent
export const priorityScoring = {
  homepage: 1.0,
  tourDetail: 0.9, // High commercial intent
  categoryHub: 0.8, // Navigation hubs
  countryHub: 0.8,
  tourListing: 0.7,
  about: 0.6,
  blog: 0.5,
  legal: 0.3
}

// Change frequency based on content update patterns
export const changeFrequency = {
  homepage: 'daily' as const,
  tourDetail: 'weekly' as const, // Prices/availability change
  categoryPage: 'weekly' as const,
  countryPage: 'weekly' as const,
  tourListing: 'daily' as const,
  staticPage: 'monthly' as const
}

// Generate sitemap entries with full metadata
export async function generateSitemapEntries(
  tours: Array<{ slug: string; updatedAt: string; images?: any[] }>,
  categories: Array<{ slug: string }>,
  countries: Array<{ code: string }>
): Promise<SitemapEntry[]> {
  const baseUrl = 'https://tours.albaniavisit.com'
  const entries: SitemapEntry[] = []
  
  // Homepage - highest priority
  entries.push({
    url: baseUrl,
    changefreq: 'daily',
    priority: 1.0,
    lastmod: new Date().toISOString().split('T')[0]
  })
  
  // Tour listing page
  entries.push({
    url: `${baseUrl}/tours`,
    changefreq: 'daily',
    priority: 0.9,
    lastmod: new Date().toISOString().split('T')[0]
  })
  
  // Individual tour pages - high priority with images
  tours.forEach(tour => {
    const images = tour.images?.slice(0, 5).map(img => ({
      url: img.url,
      title: img.alt || `${tour.slug} tour image`,
      caption: img.caption,
      geo_location: 'Albania'
    }))
    
    entries.push({
      url: `${baseUrl}/tours/${tour.slug}`,
      changefreq: 'weekly',
      priority: 0.85,
      lastmod: tour.updatedAt || new Date().toISOString().split('T')[0],
      images: images,
      alternates: [
        { href: `${baseUrl}/tours/${tour.slug}`, hreflang: 'en' },
        { href: `${baseUrl}/sq/tours/${tour.slug}`, hreflang: 'sq' },
        { href: `${baseUrl}/de/tours/${tour.slug}`, hreflang: 'de' },
        { href: `${baseUrl}/fr/tours/${tour.slug}`, hreflang: 'fr' }
      ]
    })
  })
  
  // Category pages - navigation hubs
  categories.forEach(category => {
    entries.push({
      url: `${baseUrl}/category/${category.slug}`,
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date().toISOString().split('T')[0]
    })
  })
  
  // Country pages - local SEO value
  countries.forEach(country => {
    entries.push({
      url: `${baseUrl}/country/${country.code.toLowerCase()}`,
      changefreq: 'weekly',
      priority: 0.7,
      lastmod: new Date().toISOString().split('T')[0]
    })
  })
  
  // Static pages
  const staticPages = [
    { path: '/about', priority: 0.6 },
    { path: '/contact', priority: 0.6 },
    { path: '/faq', priority: 0.5 },
    { path: '/terms', priority: 0.3 },
    { path: '/privacy', priority: 0.3 }
  ]
  
  staticPages.forEach(page => {
    entries.push({
      url: `${baseUrl}${page.path}`,
      changefreq: 'monthly',
      priority: page.priority,
      lastmod: new Date().toISOString().split('T')[0]
    })
  })
  
  return entries
}

// Sitemap index configuration for large sites
export const sitemapIndexConfig = {
  // Split sitemaps by content type for better organization
  sitemaps: [
    {
      name: 'sitemap-tours.xml',
      filter: (url: string) => url.includes('/tours/'),
      maxEntries: 5000
    },
    {
      name: 'sitemap-categories.xml',
      filter: (url: string) => url.includes('/category/'),
      maxEntries: 1000
    },
    {
      name: 'sitemap-countries.xml',
      filter: (url: string) => url.includes('/country/'),
      maxEntries: 1000
    },
    {
      name: 'sitemap-static.xml',
      filter: (url: string) => !url.includes('/tours/') && !url.includes('/category/') && !url.includes('/country/'),
      maxEntries: 500
    },
    {
      name: 'sitemap-images.xml',
      type: 'image',
      maxEntries: 10000
    },
    {
      name: 'sitemap-videos.xml',
      type: 'video',
      maxEntries: 1000
    }
  ]
}

// Generate XML sitemap content
export function generateSitemapXML(entries: SitemapEntry[]): string {
  const xml = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:image="http://www.google.com/schemas/sitemap-image/1.1"
        xmlns:video="http://www.google.com/schemas/sitemap-video/1.1"
        xmlns:xhtml="http://www.w3.org/1999/xhtml">
${entries.map(entry => `  <url>
    <loc>${escapeXml(entry.url)}</loc>
    ${entry.lastmod ? `<lastmod>${entry.lastmod}</lastmod>` : ''}
    ${entry.changefreq ? `<changefreq>${entry.changefreq}</changefreq>` : ''}
    ${entry.priority ? `<priority>${entry.priority}</priority>` : ''}
    ${entry.alternates?.map(alt => 
      `<xhtml:link rel="alternate" hreflang="${alt.hreflang}" href="${escapeXml(alt.href)}"/>`
    ).join('\n    ') || ''}
    ${entry.images?.map(img => `
    <image:image>
      <image:loc>${escapeXml(img.url)}</image:loc>
      ${img.title ? `<image:title>${escapeXml(img.title)}</image:title>` : ''}
      ${img.caption ? `<image:caption>${escapeXml(img.caption)}</image:caption>` : ''}
      ${img.geo_location ? `<image:geo_location>${escapeXml(img.geo_location)}</image:geo_location>` : ''}
    </image:image>`).join('') || ''}
    ${entry.videos?.map(video => `
    <video:video>
      <video:thumbnail_loc>${escapeXml(video.thumbnail_loc)}</video:thumbnail_loc>
      <video:title>${escapeXml(video.title)}</video:title>
      <video:description>${escapeXml(video.description)}</video:description>
      ${video.content_loc ? `<video:content_loc>${escapeXml(video.content_loc)}</video:content_loc>` : ''}
      ${video.duration ? `<video:duration>${video.duration}</video:duration>` : ''}
      ${video.publication_date ? `<video:publication_date>${video.publication_date}</video:publication_date>` : ''}
    </video:video>`).join('') || ''}
  </url>`).join('\n')}
</urlset>`
  
  return xml
}

// Generate sitemap index XML
export function generateSitemapIndexXML(sitemaps: Array<{ loc: string; lastmod: string }>): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<sitemapindex xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
${sitemaps.map(sitemap => `  <sitemap>
    <loc>${escapeXml(sitemap.loc)}</loc>
    <lastmod>${sitemap.lastmod}</lastmod>
  </sitemap>`).join('\n')}
</sitemapindex>`
}

// Utility function to escape XML special characters
function escapeXml(text: string): string {
  const replacements: Record<string, string> = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&apos;'
  }
  
  return text.replace(/[&<>"']/g, char => replacements[char])
}

// RSS feed configuration for content updates
export const rssFeedConfig = {
  title: 'AlbaniaVisit Tours - Latest Adventures',
  description: 'New tours, travel tips, and adventure updates from Albania and the Balkans',
  link: 'https://tours.albaniavisit.com',
  language: 'en',
  copyright: `Copyright ${new Date().getFullYear()} AlbaniaVisit Tours`,
  feedLinks: {
    rss: 'https://tours.albaniavisit.com/rss.xml',
    atom: 'https://tours.albaniavisit.com/atom.xml'
  },
  categories: ['Travel', 'Adventure', 'Hiking', 'Albania', 'Balkans']
}