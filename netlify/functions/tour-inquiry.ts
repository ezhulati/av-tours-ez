import type { Handler, HandlerEvent, HandlerContext } from '@netlify/functions'

const handler: Handler = async (event: HandlerEvent, context: HandlerContext) => {
  // Only accept POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      body: JSON.stringify({ error: 'Method not allowed' })
    }
  }

  // Parse the request body
  let data
  try {
    data = JSON.parse(event.body || '{}')
  } catch (error) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid request body' })
    }
  }

  // Validate required fields
  if (!data.name || !data.email || !data.message) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing required fields' })
    }
  }

  try {
    // Prepare the email content
    const emailContent = `
      New Tour Inquiry Received
      
      Name: ${data.name}
      Email: ${data.email}
      Phone: ${data.phone || 'Not provided'}
      
      Tour: ${data.tour_title || 'Not specified'}
      Tour ID: ${data.tour_slug || 'Not specified'}
      
      Travel Date: ${data.travelDate || 'Not specified'}
      Group Size: ${data.groupSize || 'Not specified'}
      
      Message:
      ${data.message}
      
      UTM Source: ${data.utm_source || 'Direct'}
      UTM Medium: ${data.utm_medium || 'None'}
      UTM Campaign: ${data.utm_campaign || 'None'}
      
      Submitted at: ${new Date().toISOString()}
    `

    // Log the inquiry for tracking
    console.log('Tour Inquiry Received:', {
      name: data.name,
      email: data.email,
      tour_slug: data.tour_slug,
      timestamp: new Date().toISOString()
    })

    // Send email using Resend API if available
    if (process.env.RESEND_KEY) {
      try {
        const emailData = {
          from: 'AlbaniaVisit <onboarding@resend.dev>', // Use Resend's test domain for now
          to: ['tours@albaniavisit.com'],
          subject: `New Tour Inquiry: ${data.tour_title || 'General Inquiry'}`,
          text: emailContent,
          html: emailContent.replace(/\n/g, '<br>'),
          reply_to: data.email
        }
        
        console.log('Sending tour inquiry email with Resend:', {
          to: emailData.to,
          subject: emailData.subject,
          from: emailData.from
        })
        
        const resendResponse = await fetch('https://api.resend.com/emails', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${process.env.RESEND_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(emailData)
        })

        const responseText = await resendResponse.text()
        
        if (!resendResponse.ok) {
          console.error('Resend API error:', {
            status: resendResponse.status,
            response: responseText
          })
          throw new Error(`Resend API failed: ${responseText}`)
        } else {
          console.log('Tour inquiry email sent successfully:', responseText)
        }
      } catch (emailError) {
        console.error('Email sending failed:', emailError)
        // Continue anyway - don't fail the whole request
      }
    } else {
      console.warn('RESEND_KEY not configured - email not sent')
    }
    }

    // Store in database if Supabase is configured
    if (process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      const supabaseResponse = await fetch(
        `${process.env.SUPABASE_URL}/rest/v1/tour_inquiries`,
        {
          method: 'POST',
          headers: {
            'apikey': process.env.SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${process.env.SUPABASE_SERVICE_ROLE_KEY}`,
            'Content-Type': 'application/json',
            'Prefer': 'return=minimal'
          },
          body: JSON.stringify({
            name: data.name,
            email: data.email,
            phone: data.phone,
            message: data.message,
            tour_slug: data.tour_slug,
            tour_title: data.tour_title,
            travel_date: data.travelDate,
            group_size: data.groupSize,
            utm_source: data.utm_source,
            utm_medium: data.utm_medium,
            utm_campaign: data.utm_campaign,
            created_at: new Date().toISOString()
          })
        }
      )

      if (!supabaseResponse.ok) {
        console.error('Failed to store in Supabase:', await supabaseResponse.text())
      }
    }

    // Return success response
    return {
      statusCode: 200,
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        success: true,
        message: 'Inquiry submitted successfully'
      })
    }
  } catch (error) {
    console.error('Error processing tour inquiry:', error)
    return {
      statusCode: 500,
      body: JSON.stringify({ 
        error: 'Failed to process inquiry',
        details: error.message 
      })
    }
  }
}

export { handler }