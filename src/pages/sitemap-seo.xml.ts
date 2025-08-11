/**
 * Generates XML sitemap for programmatic SEO pages
 * This complements the main sitemap.xml with high-value filtered pages
 */

import type { APIRoute } from 'astro'
import { getAllSEORoutes } from '@/lib/seo/programmaticSEO'
import { getAllSlugs } from '@/lib/queries'

export const GET: APIRoute = async () => {
  const baseUrl = 'https://tours.albaniavisit.com'
  
  // Get all SEO routes
  const seoRoutes = getAllSEORoutes()
  
  // Get all individual tour slugs
  let tourSlugs: { slug: string }[] = []
  try {
    tourSlugs = await getAllSlugs()
  } catch (error) {
    console.error('Error fetching tour slugs:', error)
  }
  
  // Build sitemap entries
  const entries: string[] = []
  
  // Add homepage
  entries.push(`
    <url>
      <loc>${baseUrl}</loc>
      <changefreq>daily</changefreq>
      <priority>1.0</priority>
      <lastmod>${new Date().toISOString()}</lastmod>
    </url>
  `)
  
  // Add main tours page
  entries.push(`
    <url>
      <loc>${baseUrl}/tours</loc>
      <changefreq>daily</changefreq>
      <priority>0.95</priority>
      <lastmod>${new Date().toISOString()}</lastmod>
    </url>
  `)
  
  // Add all programmatic SEO pages
  seoRoutes.forEach(route => {
    entries.push(`
    <url>
      <loc>${baseUrl}${route.pattern}</loc>
      <changefreq>${route.changefreq}</changefreq>
      <priority>${route.priority}</priority>
      <lastmod>${new Date().toISOString()}</lastmod>
    </url>
    `)
  })
  
  // Add individual tour pages (lower priority)
  tourSlugs.forEach(({ slug }) => {
    entries.push(`
    <url>
      <loc>${baseUrl}/tours/${slug}</loc>
      <changefreq>weekly</changefreq>
      <priority>0.7</priority>
      <lastmod>${new Date().toISOString()}</lastmod>
    </url>
    `)
  })
  
  // Add static pages
  const staticPages = [
    { path: '/about', priority: 0.6, changefreq: 'monthly' },
    { path: '/contact', priority: 0.6, changefreq: 'monthly' },
    { path: '/privacy', priority: 0.3, changefreq: 'yearly' },
    { path: '/terms', priority: 0.3, changefreq: 'yearly' },
    { path: '/cookie-policy', priority: 0.3, changefreq: 'yearly' }
  ]
  
  staticPages.forEach(page => {
    entries.push(`
    <url>
      <loc>${baseUrl}${page.path}</loc>
      <changefreq>${page.changefreq}</changefreq>
      <priority>${page.priority}</priority>
      <lastmod>${new Date().toISOString()}</lastmod>
    </url>
    `)
  })
  
  // Generate the XML sitemap
  const sitemap = `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"
        xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance"
        xsi:schemaLocation="http://www.sitemaps.org/schemas/sitemap/0.9
        http://www.sitemaps.org/schemas/sitemap/0.9/sitemap.xsd">
${entries.join('')}
</urlset>`
  
  return new Response(sitemap, {
    status: 200,
    headers: {
      'Content-Type': 'application/xml',
      'Cache-Control': 'public, max-age=3600' // Cache for 1 hour
    }
  })
}