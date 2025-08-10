import type { APIRoute } from 'astro'

export const GET: APIRoute = async ({ request, url }) => {
  try {
    // Test basic functionality
    const hasSupabaseUrl = !!process.env.SUPABASE_URL
    const hasSupabaseKey = !!process.env.SUPABASE_SERVICE_ROLE_KEY
    
    return new Response(JSON.stringify({
      success: true,
      timestamp: new Date().toISOString(),
      environment: {
        hasSupabaseUrl,
        hasSupabaseKey,
        nodeVersion: process.version,
        platform: process.platform
      }
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  } catch (error: any) {
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Unknown error'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json'
      }
    })
  }
}