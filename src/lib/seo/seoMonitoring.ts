/**
 * SEO Monitoring and Tracking System
 * Tracks performance of programmatic SEO pages
 */

import { supabaseServer } from '../supabase.server'

export interface SEOPageMetrics {
  path: string
  pageViews: number
  uniqueVisitors: number
  avgTimeOnPage: number
  bounceRate: number
  conversionRate: number
  organicTraffic: number
  lastUpdated: Date
}

export interface SEOKeywordTracking {
  keyword: string
  path: string
  position: number
  impressions: number
  clicks: number
  ctr: number
  trend: 'up' | 'down' | 'stable'
  lastChecked: Date
}

/**
 * Track page view for SEO monitoring
 */
export async function trackSEOPageView(
  path: string,
  source: 'organic' | 'direct' | 'referral' | 'social',
  sessionId: string,
  userId?: string
) {
  try {
    // Log the page view
    await supabaseServer
      .from('seo_page_views')
      .insert({
        path,
        source,
        session_id: sessionId,
        user_id: userId,
        timestamp: new Date().toISOString()
      })
    
    // Update aggregate metrics
    await updateSEOMetrics(path)
  } catch (error) {
    console.error('Error tracking SEO page view:', error)
  }
}

/**
 * Track conversion (tour click/booking) from SEO page
 */
export async function trackSEOConversion(
  path: string,
  tourSlug: string,
  conversionType: 'click' | 'booking',
  sessionId: string
) {
  try {
    await supabaseServer
      .from('seo_conversions')
      .insert({
        path,
        tour_slug: tourSlug,
        conversion_type: conversionType,
        session_id: sessionId,
        timestamp: new Date().toISOString()
      })
    
    // Update conversion metrics
    await updateConversionMetrics(path)
  } catch (error) {
    console.error('Error tracking SEO conversion:', error)
  }
}

/**
 * Update aggregate SEO metrics for a page
 */
async function updateSEOMetrics(path: string) {
  try {
    // Get current metrics
    const { data: views } = await supabaseServer
      .from('seo_page_views')
      .select('*')
      .eq('path', path)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString()) // Last 30 days
    
    if (!views) return
    
    // Calculate metrics
    const uniqueVisitors = new Set(views.map(v => v.session_id)).size
    const pageViews = views.length
    const organicTraffic = views.filter(v => v.source === 'organic').length
    
    // Upsert metrics
    await supabaseServer
      .from('seo_metrics')
      .upsert({
        path,
        page_views: pageViews,
        unique_visitors: uniqueVisitors,
        organic_traffic: organicTraffic,
        last_updated: new Date().toISOString()
      })
  } catch (error) {
    console.error('Error updating SEO metrics:', error)
  }
}

/**
 * Update conversion metrics for a page
 */
async function updateConversionMetrics(path: string) {
  try {
    // Get conversions
    const { data: conversions } = await supabaseServer
      .from('seo_conversions')
      .select('*')
      .eq('path', path)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    // Get page views for conversion rate
    const { data: views } = await supabaseServer
      .from('seo_page_views')
      .select('*')
      .eq('path', path)
      .gte('timestamp', new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString())
    
    if (!conversions || !views) return
    
    const conversionRate = views.length > 0 ? (conversions.length / views.length) * 100 : 0
    
    // Update metrics
    await supabaseServer
      .from('seo_metrics')
      .update({
        conversion_rate: conversionRate,
        total_conversions: conversions.length
      })
      .eq('path', path)
  } catch (error) {
    console.error('Error updating conversion metrics:', error)
  }
}

/**
 * Get SEO performance report
 */
export async function getSEOPerformanceReport(days: number = 30) {
  try {
    const startDate = new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString()
    
    // Get metrics for all SEO pages
    const { data: metrics } = await supabaseServer
      .from('seo_metrics')
      .select('*')
      .order('page_views', { ascending: false })
    
    // Get top performing pages
    const { data: topPages } = await supabaseServer
      .from('seo_page_views')
      .select('path, count')
      .gte('timestamp', startDate)
      .order('count', { ascending: false })
      .limit(10)
    
    // Get top converting pages
    const { data: topConverting } = await supabaseServer
      .from('seo_conversions')
      .select('path, count')
      .gte('timestamp', startDate)
      .order('count', { ascending: false })
      .limit(10)
    
    return {
      metrics,
      topPages,
      topConverting,
      reportDate: new Date(),
      periodDays: days
    }
  } catch (error) {
    console.error('Error generating SEO report:', error)
    return null
  }
}

/**
 * Get keyword ranking data (would integrate with SEO tools API)
 */
export async function getKeywordRankings(path: string): Promise<SEOKeywordTracking[]> {
  // This would integrate with tools like Ahrefs, SEMrush, or Google Search Console API
  // For now, returning mock data structure
  return [
    {
      keyword: 'albania hiking tours',
      path,
      position: 3,
      impressions: 1500,
      clicks: 120,
      ctr: 8,
      trend: 'up',
      lastChecked: new Date()
    }
  ]
}

/**
 * Check for SEO issues on a page
 */
export interface SEOIssue {
  type: 'error' | 'warning' | 'info'
  category: 'meta' | 'content' | 'technical' | 'performance'
  message: string
  recommendation: string
}

export async function checkSEOIssues(
  path: string,
  title: string,
  description: string,
  content: string
): Promise<SEOIssue[]> {
  const issues: SEOIssue[] = []
  
  // Check meta title
  if (title.length < 30) {
    issues.push({
      type: 'warning',
      category: 'meta',
      message: 'Meta title is too short',
      recommendation: 'Aim for 50-60 characters for optimal SEO'
    })
  } else if (title.length > 60) {
    issues.push({
      type: 'warning',
      category: 'meta',
      message: 'Meta title is too long',
      recommendation: 'Keep under 60 characters to avoid truncation in search results'
    })
  }
  
  // Check meta description
  if (description.length < 120) {
    issues.push({
      type: 'warning',
      category: 'meta',
      message: 'Meta description is too short',
      recommendation: 'Aim for 150-160 characters for optimal SEO'
    })
  } else if (description.length > 160) {
    issues.push({
      type: 'warning',
      category: 'meta',
      message: 'Meta description is too long',
      recommendation: 'Keep under 160 characters to avoid truncation'
    })
  }
  
  // Check content length
  const wordCount = content.split(/\s+/).length
  if (wordCount < 300) {
    issues.push({
      type: 'warning',
      category: 'content',
      message: 'Content is thin',
      recommendation: 'Add more unique, valuable content (aim for 500+ words)'
    })
  }
  
  // Check for duplicate content issues
  const { data: similarPages } = await supabaseServer
    .from('seo_metrics')
    .select('path')
    .neq('path', path)
    .limit(5)
  
  // Would need more sophisticated duplicate content checking here
  
  return issues
}

/**
 * Generate SEO recommendations based on performance
 */
export async function generateSEORecommendations(path: string): Promise<string[]> {
  const recommendations: string[] = []
  
  try {
    // Get metrics for this page
    const { data: metrics } = await supabaseServer
      .from('seo_metrics')
      .select('*')
      .eq('path', path)
      .single()
    
    if (!metrics) return recommendations
    
    // Low traffic recommendation
    if (metrics.page_views < 100) {
      recommendations.push('Consider improving internal linking to this page')
      recommendations.push('Add more unique content to improve search rankings')
    }
    
    // High bounce rate recommendation
    if (metrics.bounce_rate > 70) {
      recommendations.push('Improve page load speed to reduce bounce rate')
      recommendations.push('Ensure content matches user search intent')
    }
    
    // Low conversion rate
    if (metrics.conversion_rate < 2) {
      recommendations.push('Add clearer CTAs above the fold')
      recommendations.push('Improve tour card visibility and appeal')
    }
    
    // Low organic traffic
    if (metrics.organic_traffic < metrics.page_views * 0.3) {
      recommendations.push('Focus on building backlinks to this page')
      recommendations.push('Optimize for more long-tail keywords')
    }
    
  } catch (error) {
    console.error('Error generating recommendations:', error)
  }
  
  return recommendations
}

/**
 * Initialize SEO tracking on page load
 */
export function initSEOTracking(path: string) {
  // This would be called from the client-side
  // Track page view
  const sessionId = getSessionId()
  const source = getTrafficSource()
  
  trackSEOPageView(path, source, sessionId)
  
  // Track time on page
  let startTime = Date.now()
  window.addEventListener('beforeunload', () => {
    const timeOnPage = (Date.now() - startTime) / 1000
    // Send time on page metric
    navigator.sendBeacon('/api/seo/time', JSON.stringify({
      path,
      time: timeOnPage,
      sessionId
    }))
  })
  
  // Track clicks on tour cards
  document.addEventListener('click', (e) => {
    const tourCard = (e.target as HTMLElement).closest('a[href^="/tours/"]')
    if (tourCard) {
      const tourSlug = tourCard.getAttribute('href')?.split('/').pop()
      if (tourSlug) {
        trackSEOConversion(path, tourSlug, 'click', sessionId)
      }
    }
  })
}

// Helper functions
function getSessionId(): string {
  let sessionId = sessionStorage.getItem('seo_session_id')
  if (!sessionId) {
    sessionId = `sess_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    sessionStorage.setItem('seo_session_id', sessionId)
  }
  return sessionId
}

function getTrafficSource(): 'organic' | 'direct' | 'referral' | 'social' {
  const referrer = document.referrer
  
  if (!referrer) return 'direct'
  
  if (referrer.includes('google.') || referrer.includes('bing.') || referrer.includes('yahoo.')) {
    return 'organic'
  }
  
  if (referrer.includes('facebook.') || referrer.includes('twitter.') || referrer.includes('instagram.')) {
    return 'social'
  }
  
  return 'referral'
}