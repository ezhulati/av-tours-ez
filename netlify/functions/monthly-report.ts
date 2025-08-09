import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'
import { generateMonthlyReport, formatReportAsHTML } from '../../src/lib/analytics/reports'

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Check for scheduled function or manual trigger with auth
  const isScheduled = event.headers['x-netlify-event'] === 'schedule'
  const authHeader = event.headers['authorization']
  
  if (!isScheduled && authHeader !== `Bearer ${process.env.ANALYTICS_API_KEY}`) {
    return {
      statusCode: 401,
      body: JSON.stringify({ error: 'Unauthorized' })
    }
  }

  try {
    // Generate the monthly report
    const report = await generateMonthlyReport()
    const htmlContent = formatReportAsHTML(report)

    // Send email via Netlify Forms email notification
    const formData = new FormData()
    formData.append('form-name', 'monthly-analytics-report')
    formData.append('to', 'tours@albaniavisit.com')
    formData.append('subject', `Monthly Analytics Report - ${new Date().toLocaleDateString()}`)
    formData.append('html_content', htmlContent)
    formData.append('sent_at', new Date().toISOString())

    // Submit to Netlify Forms
    const response = await fetch(`${process.env.URL}/`, {
      method: 'POST',
      body: formData
    })

    if (!response.ok) {
      throw new Error('Failed to send email via Netlify Forms')
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        success: true,
        message: 'Monthly report sent successfully',
        report_summary: {
          total_clicks: report.summary.total_clicks,
          unique_tours: report.summary.unique_tours_clicked,
          sent_to: 'tours@albaniavisit.com'
        }
      })
    }
  } catch (error) {
    console.error('Monthly report error:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to generate or send report',
        details: error.message 
      })
    }
  }
}

export { handler }