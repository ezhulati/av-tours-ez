import { createClient } from '@supabase/supabase-js'
import { createMockSupabaseClient } from './supabase.mock'

// Check if we're in a test/CI environment
const isTestEnvironment = process?.env?.NODE_ENV === 'test' || 
  process?.env?.CI === 'true' ||
  import.meta.env?.MODE === 'test'

// Production fallback values (public read-only access)
// Only use these in non-test environments
const PROD_SUPABASE_URL = isTestEnvironment 
  ? 'https://placeholder.supabase.co' 
  : 'https://vhnykulvcoqrlidkeaqq.supabase.co'
  
const PROD_SUPABASE_ANON_KEY = isTestEnvironment
  ? 'placeholder-key'
  : 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InZobnlrdWx2Y29xcmxpZGtlYXFxIiwicm9sZSI6ImFub24iLCJpYXQiOjE3MzUzOTM2MjgsImV4cCI6MjA1MDk2OTYyOH0.mgNs5cPuLzVlhNqrrpG0Wx2dPnP5OsThP-9OP4d5N4Y'

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
    // Skip actual Supabase connection in test environment
    if (isTestEnvironment) {
      // Create a mock client that returns empty data
      supabaseServer = createMockSupabaseClient() as any
    } else {
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
              // In production, throw the error
              if (!isTestEnvironment) {
                throw new Error(`Failed to connect to Supabase: ${error instanceof Error ? error.message : 'Unknown error'}`)
              }
              // In test environment, return a mock response
              return new Response(JSON.stringify({ data: [], error: null }), {
                status: 200,
                headers: { 'content-type': 'application/json' }
              })
            }
          }
        }
      })
    }
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