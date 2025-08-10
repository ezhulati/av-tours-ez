import { supabaseServer, isSupabaseConfigured } from '@/lib/supabase.server'
import { TABLES } from '@/lib/adapters/dbMapper'

interface ClickData {
  tour_id: string
  tour_slug: string
  tour_title: string
  operator: string
  clicked_at: string
  utm_source?: string
  utm_medium?: string
  utm_campaign?: string
}

interface TourPerformance {
  tour_title: string
  tour_slug: string
  operator: string
  total_clicks: number
  unique_visitors: number
  conversion_potential: number // estimated based on clicks
}

interface ReportData {
  period: {
    start: Date
    end: Date
    type: 'weekly' | 'monthly'
  }
  summary: {
    total_clicks: number
    unique_tours_clicked: number
    top_operator: string
    estimated_revenue: number // based on average commission
  }
  top_tours: TourPerformance[]
  traffic_sources: {
    source: string
    clicks: number
    percentage: number
  }[]
  daily_breakdown?: {
    date: string
    clicks: number
  }[]
}

// Get clicks for a specific period
async function getClicksForPeriod(startDate: Date, endDate: Date): Promise<ClickData[]> {
  // Check if Supabase is configured
  if (!isSupabaseConfigured()) {
    console.warn('Supabase not configured - returning empty click data')
    return []
  }
  
  const { data, error } = await supabaseServer
    .from(TABLES.clicks)
    .select('*')
    .gte('clicked_at', startDate.toISOString())
    .lte('clicked_at', endDate.toISOString())
    .order('clicked_at', { ascending: false })

  if (error) {
    console.error('Error fetching clicks:', error)
    return []
  }

  return data || []
}

// Generate weekly report (last 7 days)
export async function generateWeeklyReport(): Promise<ReportData> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 7)

  const clicks = await getClicksForPeriod(startDate, endDate)
  
  // Group clicks by tour
  const tourMap = new Map<string, TourPerformance>()
  const uniqueVisitors = new Set<string>()
  
  clicks.forEach(click => {
    const key = click.tour_slug
    if (!tourMap.has(key)) {
      tourMap.set(key, {
        tour_title: click.tour_title,
        tour_slug: click.tour_slug,
        operator: click.operator,
        total_clicks: 0,
        unique_visitors: 0,
        conversion_potential: 0
      })
    }
    
    const tour = tourMap.get(key)!
    tour.total_clicks++
    // Estimate 5% conversion rate for potential revenue
    tour.conversion_potential = tour.total_clicks * 0.05
    
    // Track unique visitors by IP or cookie (anonymized)
    if (click.ip_address_anonymized) {
      uniqueVisitors.add(click.ip_address_anonymized)
    }
  })

  // Get top 10 tours
  const topTours = Array.from(tourMap.values())
    .sort((a, b) => b.total_clicks - a.total_clicks)
    .slice(0, 10)

  // Analyze traffic sources
  const sourceMap = new Map<string, number>()
  clicks.forEach(click => {
    const source = click.utm_source || 'direct'
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
  })

  const totalClicks = clicks.length
  const trafficSources = Array.from(sourceMap.entries())
    .map(([source, clicks]) => ({
      source,
      clicks,
      percentage: (clicks / totalClicks) * 100
    }))
    .sort((a, b) => b.clicks - a.clicks)

  // Daily breakdown for weekly report
  const dailyMap = new Map<string, number>()
  clicks.forEach(click => {
    const date = new Date(click.clicked_at).toISOString().split('T')[0]
    dailyMap.set(date, (dailyMap.get(date) || 0) + 1)
  })

  const dailyBreakdown = Array.from(dailyMap.entries())
    .map(([date, clicks]) => ({ date, clicks }))
    .sort((a, b) => a.date.localeCompare(b.date))

  // Find top operator
  const operatorMap = new Map<string, number>()
  clicks.forEach(click => {
    operatorMap.set(click.operator, (operatorMap.get(click.operator) || 0) + 1)
  })
  const topOperator = Array.from(operatorMap.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  return {
    period: {
      start: startDate,
      end: endDate,
      type: 'weekly'
    },
    summary: {
      total_clicks: totalClicks,
      unique_tours_clicked: tourMap.size,
      top_operator: topOperator,
      estimated_revenue: totalClicks * 0.05 * 50 // Assume €50 average commission
    },
    top_tours: topTours,
    traffic_sources: trafficSources,
    daily_breakdown: dailyBreakdown
  }
}

// Generate monthly report (last 30 days)
export async function generateMonthlyReport(): Promise<ReportData> {
  const endDate = new Date()
  const startDate = new Date()
  startDate.setDate(startDate.getDate() - 30)

  const clicks = await getClicksForPeriod(startDate, endDate)
  
  // Similar processing as weekly but for 30 days
  const tourMap = new Map<string, TourPerformance>()
  
  clicks.forEach(click => {
    const key = click.tour_slug
    if (!tourMap.has(key)) {
      tourMap.set(key, {
        tour_title: click.tour_title,
        tour_slug: click.tour_slug,
        operator: click.operator,
        total_clicks: 0,
        unique_visitors: 0,
        conversion_potential: 0
      })
    }
    
    const tour = tourMap.get(key)!
    tour.total_clicks++
    tour.conversion_potential = tour.total_clicks * 0.05
  })

  const topTours = Array.from(tourMap.values())
    .sort((a, b) => b.total_clicks - a.total_clicks)
    .slice(0, 20) // Top 20 for monthly

  // Traffic sources
  const sourceMap = new Map<string, number>()
  clicks.forEach(click => {
    const source = click.utm_source || 'direct'
    sourceMap.set(source, (sourceMap.get(source) || 0) + 1)
  })

  const totalClicks = clicks.length
  const trafficSources = Array.from(sourceMap.entries())
    .map(([source, clicks]) => ({
      source,
      clicks,
      percentage: (clicks / totalClicks) * 100
    }))
    .sort((a, b) => b.clicks - a.clicks)

  // Top operator
  const operatorMap = new Map<string, number>()
  clicks.forEach(click => {
    operatorMap.set(click.operator, (operatorMap.get(click.operator) || 0) + 1)
  })
  const topOperator = Array.from(operatorMap.entries())
    .sort((a, b) => b[1] - a[1])[0]?.[0] || 'N/A'

  return {
    period: {
      start: startDate,
      end: endDate,
      type: 'monthly'
    },
    summary: {
      total_clicks: totalClicks,
      unique_tours_clicked: tourMap.size,
      top_operator: topOperator,
      estimated_revenue: totalClicks * 0.05 * 50
    },
    top_tours: topTours,
    traffic_sources: trafficSources
    // No daily breakdown for monthly (too many days)
  }
}

// Format report as HTML email
export function formatReportAsHTML(report: ReportData): string {
  const formatCurrency = (amount: number) => `€${amount.toFixed(2)}`
  const formatDate = (date: Date) => date.toLocaleDateString('en-US', { 
    month: 'short', 
    day: 'numeric', 
    year: 'numeric' 
  })

  return `
    <!DOCTYPE html>
    <html>
    <head>
      <style>
        body { font-family: Arial, sans-serif; color: #333; line-height: 1.6; }
        .header { background: #dc2626; color: white; padding: 20px; text-align: center; }
        .container { max-width: 800px; margin: 0 auto; padding: 20px; }
        .summary { background: #f5f5f5; padding: 20px; border-radius: 8px; margin: 20px 0; }
        .metric { display: inline-block; margin: 10px 20px; }
        .metric-value { font-size: 24px; font-weight: bold; color: #dc2626; }
        .metric-label { font-size: 14px; color: #666; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th { background: #f5f5f5; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; }
        td { padding: 10px; border-bottom: 1px solid #eee; }
        .section-title { font-size: 20px; font-weight: bold; margin: 30px 0 15px; color: #333; }
        .footer { text-align: center; padding: 20px; color: #666; font-size: 12px; }
      </style>
    </head>
    <body>
      <div class="header">
        <h1>AlbaniaVisit Tours - ${report.period.type === 'weekly' ? 'Weekly' : 'Monthly'} Analytics Report</h1>
        <p>${formatDate(report.period.start)} - ${formatDate(report.period.end)}</p>
      </div>
      
      <div class="container">
        <div class="summary">
          <h2>Summary</h2>
          <div class="metric">
            <div class="metric-value">${report.summary.total_clicks}</div>
            <div class="metric-label">Total Clicks</div>
          </div>
          <div class="metric">
            <div class="metric-value">${report.summary.unique_tours_clicked}</div>
            <div class="metric-label">Tours Viewed</div>
          </div>
          <div class="metric">
            <div class="metric-value">${formatCurrency(report.summary.estimated_revenue)}</div>
            <div class="metric-label">Potential Revenue</div>
          </div>
          <div class="metric">
            <div class="metric-value">${report.summary.top_operator}</div>
            <div class="metric-label">Top Operator</div>
          </div>
        </div>

        <div class="section-title">Top Performing Tours</div>
        <table>
          <thead>
            <tr>
              <th>Tour</th>
              <th>Operator</th>
              <th>Clicks</th>
              <th>Conversion Potential</th>
            </tr>
          </thead>
          <tbody>
            ${report.top_tours.map(tour => `
              <tr>
                <td>${tour.tour_title}</td>
                <td>${tour.operator}</td>
                <td>${tour.total_clicks}</td>
                <td>${tour.conversion_potential.toFixed(1)} bookings</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        <div class="section-title">Traffic Sources</div>
        <table>
          <thead>
            <tr>
              <th>Source</th>
              <th>Clicks</th>
              <th>Percentage</th>
            </tr>
          </thead>
          <tbody>
            ${report.traffic_sources.map(source => `
              <tr>
                <td>${source.source}</td>
                <td>${source.clicks}</td>
                <td>${source.percentage.toFixed(1)}%</td>
              </tr>
            `).join('')}
          </tbody>
        </table>

        ${report.daily_breakdown ? `
          <div class="section-title">Daily Activity</div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Clicks</th>
              </tr>
            </thead>
            <tbody>
              ${report.daily_breakdown.map(day => `
                <tr>
                  <td>${day.date}</td>
                  <td>${day.clicks}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
        ` : ''}

        <div class="footer">
          <p>This is an automated report from AlbaniaVisit Tours tracking system.</p>
          <p>For questions, contact tours@albaniavisit.com</p>
        </div>
      </div>
    </body>
    </html>
  `
}