import type { APIRoute } from 'astro'
import { supabaseServer } from '../lib/supabase.server'

// Priority values for different page types
const PRIORITY = {
  HOME: 1.0,
  TOURS_INDEX: 0.9,
  TOUR_DETAIL: 0.8,
  CATEGORY: 0.7,
  COUNTRY: 0.7,
  STATIC: 0.5,
  LEGAL: 0.3
}

// Change frequency for different page types
const CHANGE_FREQ = {
  HOME: 'daily',
  TOURS: 'weekly',
  DYNAMIC: 'weekly',
  STATIC: 'monthly',
  LEGAL: 'yearly'
}

interface SitemapURL {
  loc: string
  lastmod?: string
  changefreq?: string
  priority?: number
}

export const GET: APIRoute = async ({ site }) => {
  const baseURL = site?.toString() || 'https://tours.albaniavisit.com'
  const urls: SitemapURL[] = []
  
  // Add homepage
  urls.push({
    loc: baseURL,
    changefreq: CHANGE_FREQ.HOME,
    priority: PRIORITY.HOME,
    lastmod: new Date().toISOString()
  })
  
  // Add static pages
  const staticPages = [
    { path: '/tours', changefreq: CHANGE_FREQ.TOURS, priority: PRIORITY.TOURS_INDEX },
    { path: '/privacy', changefreq: CHANGE_FREQ.LEGAL, priority: PRIORITY.LEGAL },
    { path: '/terms', changefreq: CHANGE_FREQ.LEGAL, priority: PRIORITY.LEGAL },
    { path: '/travel-disclaimer', changefreq: CHANGE_FREQ.LEGAL, priority: PRIORITY.LEGAL },
    { path: '/thank-you', changefreq: CHANGE_FREQ.STATIC, priority: PRIORITY.STATIC }
  ]
  
  for (const page of staticPages) {
    urls.push({
      loc: `${baseURL}${page.path}`,
      changefreq: page.changefreq,
      priority: page.priority,
      lastmod: new Date().toISOString()
    })
  }
  
  try {
    // Fetch all active tours from database
    const { data: tours, error: toursError } = await supabaseServer
      .from('affiliate_tours')
      .select('slug, updated_at')
      .eq('is_active', true)
      .order('updated_at', { ascending: false })
    
    if (!toursError && tours) {
      // Add individual tour pages
      for (const tour of tours) {
        urls.push({
          loc: `${baseURL}/tours/${tour.slug}`,
          changefreq: CHANGE_FREQ.DYNAMIC,
          priority: PRIORITY.TOUR_DETAIL,
          lastmod: tour.updated_at || new Date().toISOString()
        })
      }
    }
    
    // Fetch all unique categories
    const { data: categoriesData, error: categoriesError } = await supabaseServer
      .from('affiliate_tours')
      .select('activity_type')
      .eq('is_active', true)
      .not('activity_type', 'is', null)
    
    if (!categoriesError && categoriesData) {
      // Get unique categories
      const uniqueCategories = [...new Set(categoriesData.map(t => t.activity_type))]
        .filter(Boolean)
        .map(cat => cat.toLowerCase().replace(/\s+/g, '-'))
      
      // Add category pages
      for (const category of uniqueCategories) {
        urls.push({
          loc: `${baseURL}/category/${category}`,
          changefreq: CHANGE_FREQ.DYNAMIC,
          priority: PRIORITY.CATEGORY,
          lastmod: new Date().toISOString()
        })
      }
    }
    
    // Fetch all unique countries/locations
    const { data: locationsData, error: locationsError } = await supabaseServer
      .from('affiliate_tours')
      .select('locations')
      .eq('is_active', true)
      .not('locations', 'is', null)
    
    if (!locationsError && locationsData) {
      // Extract and flatten all locations
      const allLocations = locationsData
        .flatMap(t => t.locations || [])
        .filter(Boolean)
      
      // Get unique country codes (simplified mapping)
      const countryMap: Record<string, string> = {
        'albania': 'al',
        'kosovo': 'xk',
        'montenegro': 'me',
        'macedonia': 'mk',
        'north macedonia': 'mk',
        'bosnia': 'ba',
        'bosnia and herzegovina': 'ba',
        'croatia': 'hr',
        'serbia': 'rs'
      }
      
      const uniqueCountries = [...new Set(
        allLocations.map(loc => {
          const normalized = loc.toLowerCase().trim()
          return countryMap[normalized]
        }).filter(Boolean)
      )]
      
      // Add country pages
      for (const countryCode of uniqueCountries) {
        urls.push({
          loc: `${baseURL}/country/${countryCode}`,
          changefreq: CHANGE_FREQ.DYNAMIC,
          priority: PRIORITY.COUNTRY,
          lastmod: new Date().toISOString()
        })
      }
    }
  } catch (error) {
    console.error('Error generating sitemap:', error)
    // Continue with static pages even if database fails
  }
  
  // Generate XML sitemap
  const xml = generateSitemapXML(urls)
  
  return new Response(xml, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  })
}

function generateSitemapXML(urls: SitemapURL[]): string {
  const urlElements = urls.map(url => {
    const elements = [`    <loc>${escapeXML(url.loc)}</loc>`]
    
    if (url.lastmod) {
      elements.push(`    <lastmod>${url.lastmod.split('T')[0]}</lastmod>`)
    }
    
    if (url.changefreq) {
      elements.push(`    <changefreq>${url.changefreq}</changefreq>`)
    }
    
    if (url.priority !== undefined) {
      elements.push(`    <priority>${url.priority.toFixed(1)}</priority>`)
    }
    
    return `  <url>\n${elements.join('\n')}\n  </url>`
  }).join('\n')
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${urlElements}
</urlset>`
}

function escapeXML(str: string): string {
  return str
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;')
}