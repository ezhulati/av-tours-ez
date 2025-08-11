import type { Config } from '@netlify/functions'

// This function runs daily at 3 AM UTC
export const config: Config = {
  schedule: '0 3 * * *' // Cron expression for 3 AM UTC daily
}

export default async () => {
  console.log('Starting scheduled price synchronization...')
  
  try {
    // Get the site URL from environment variables
    const siteUrl = process.env.URL || process.env.DEPLOY_URL || 'https://tours.albaniavisit.com'
    const adminKey = process.env.ADMIN_API_KEY
    
    if (!adminKey) {
      console.error('ADMIN_API_KEY not configured')
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Configuration error' })
      }
    }
    
    // Call the sync prices API endpoint
    const response = await fetch(`${siteUrl}/api/admin/sync-prices`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${adminKey}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        dryRun: false // Set to true for testing
      })
    })
    
    if (!response.ok) {
      throw new Error(`Sync failed with status: ${response.status}`)
    }
    
    const result = await response.json()
    
    console.log('Price sync completed:', result.summary)
    
    // If there were significant changes, send notification
    if (result.summary.toursUpdated > 0) {
      console.log(`Updated ${result.summary.toursUpdated} tour prices`)
      
      // You could add email notification here using a service like SendGrid
      // or post to a Slack webhook for monitoring
      if (process.env.SLACK_WEBHOOK_URL) {
        await notifySlack(result.summary, result.results)
      }
    }
    
    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Scheduled price sync completed',
        summary: result.summary
      })
    }
  } catch (error) {
    console.error('Scheduled sync error:', error)
    
    // Send error notification if configured
    if (process.env.SLACK_WEBHOOK_URL) {
      await notifySlackError(error)
    }
    
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      })
    }
  }
}

// Helper function to send Slack notifications
async function notifySlack(summary: any, changes: any[]) {
  if (!process.env.SLACK_WEBHOOK_URL) return
  
  const message = {
    text: '💰 Price Synchronization Report',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '💰 AlbaniaVisit Price Sync Report'
        }
      },
      {
        type: 'section',
        fields: [
          {
            type: 'mrkdwn',
            text: `*Tours Checked:* ${summary.totalChecked}`
          },
          {
            type: 'mrkdwn',
            text: `*Prices Updated:* ${summary.toursUpdated}`
          },
          {
            type: 'mrkdwn',
            text: `*Successful Extractions:* ${summary.successfulExtractions}`
          },
          {
            type: 'mrkdwn',
            text: `*Failed Extractions:* ${summary.failedExtractions}`
          }
        ]
      }
    ]
  }
  
  // Add details of changed prices if any
  if (changes && changes.length > 0) {
    const changesList = changes.slice(0, 5).map(change => 
      `• ${change.title}: ${change.currentPrice} → ${change.bnAdventurePrice}`
    ).join('\n')
    
    message.blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Price Changes:*\n${changesList}${changes.length > 5 ? `\n_...and ${changes.length - 5} more_` : ''}`
      }
    })
  }
  
  try {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
  } catch (error) {
    console.error('Failed to send Slack notification:', error)
  }
}

// Helper function to send error notifications to Slack
async function notifySlackError(error: any) {
  if (!process.env.SLACK_WEBHOOK_URL) return
  
  const message = {
    text: '🚨 Price Sync Error',
    blocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: '🚨 AlbaniaVisit Price Sync Failed'
        }
      },
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `The scheduled price synchronization failed with error:\n\`\`\`${error instanceof Error ? error.message : 'Unknown error'}\`\`\``
        }
      },
      {
        type: 'context',
        elements: [
          {
            type: 'mrkdwn',
            text: `Timestamp: ${new Date().toISOString()}`
          }
        ]
      }
    ]
  }
  
  try {
    await fetch(process.env.SLACK_WEBHOOK_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(message)
    })
  } catch (err) {
    console.error('Failed to send error notification:', err)
  }
}