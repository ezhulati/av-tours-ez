import { createClient } from '@supabase/supabase-js'

// Production fallback values (public read-only access)
const PROD_SUPABASE_URL = 'https://vhnykulvcoqrlidkeaqq.supabase.co'
const PROD_SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobnlrdWx2Y29xcmxpZGtlYXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzOTM2MjgsImV4cCI6MjA1MDk2OTYyOH0.mgNs5cPuLzVlhNqrrpG0Wx2dPnP5OsThP-9OP4d5N4Y'

// Get environment variables with production fallback
const supabaseUrl = import.meta.env?.SUPABASE_URL || 
  import.meta.env?.PUBLIC_SUPABASE_URL ||
  PROD_SUPABASE_URL

// For read operations, we can use anon key as fallback
const supabaseKey = import.meta.env?.SUPABASE_SERVICE_ROLE_KEY || 
  import.meta.env?.SUPABASE_ANON_KEY ||
  import.meta.env?.PUBLIC_SUPABASE_ANON_KEY ||
  PROD_SUPABASE_ANON_KEY

// Create the client with error handling
let supabaseServer: ReturnType<typeof createClient> | null = null

try {
  if (supabaseUrl && supabaseKey) {
    supabaseServer = createClient(supabaseUrl, supabaseKey, { 
      auth: { 
        persistSession: false 
      },
      global: {
        fetch: async (url, options) => {
          try {
            const response = await fetch(url, {
              ...options,
              signal: AbortSignal.timeout(10000) // 10 second timeout
            })
            if (!response.ok && response.status >= 500) {
              throw new Error(`Supabase server error: ${response.status}`)
            }
            return response
          } catch (error) {
            console.error('Fetch error in Supabase client:', error)
            throw new Error(`Failed to connect to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`)
          }
        }
      }
    })
  }
} catch (error) {
  console.error('Failed to initialize Supabase client:', error)
  supabaseServer = null
}

export { supabaseServer }

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey)
}