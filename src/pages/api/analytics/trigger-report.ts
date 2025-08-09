import type { APIRoute } from 'astro'
import { generateWeeklyReport, generateMonthlyReport, formatReportAsHTML } from '@/lib/analytics/reports'

export const prerender = false

export const POST: APIRoute = async ({ request }) => {
  try {
    // Check for API key in header
    const authHeader = request.headers.get('authorization')
    if (authHeader !== `Bearer ${import.meta.env.ANALYTICS_API_KEY}`) {
      return new Response(JSON.stringify({ error: 'Unauthorized' }), {
        status: 401,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Get report type from request
    const { type } = await request.json()
    
    if (type !== 'weekly' && type !== 'monthly') {
      return new Response(JSON.stringify({ error: 'Invalid report type. Use "weekly" or "monthly"' }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      })
    }

    // Generate the report
    const report = type === 'weekly' 
      ? await generateWeeklyReport()
      : await generateMonthlyReport()

    // For manual trigger, return the report data instead of emailing
    return new Response(JSON.stringify({
      success: true,
      type: type,
      report: {
        period: report.period,
        summary: report.summary,
        top_tours: report.top_tours.slice(0, 5), // Top 5 for preview
        traffic_sources: report.traffic_sources
      },
      note: 'Report generated successfully. Email reports are sent automatically on schedule.'
    }), {
      status: 200,
      headers: { 'Content-Type': 'application/json' }
    })
  } catch (error) {
    console.error('Report generation error:', error)
    return new Response(JSON.stringify({ 
      error: 'Failed to generate report',
      details: error.message 
    }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' }
    })
  }
}