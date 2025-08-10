import { createClient } from '@supabase/supabase-js'

// Supabase configuration for Netlify Functions
// Uses process.env which is available in Node.js runtime
const supabaseUrl = process.env.SUPABASE_URL
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY

// Create the client only if we have the env vars
export const supabaseServer = supabaseUrl && supabaseKey
  ? createClient(supabaseUrl, supabaseKey)
  : null

// Helper function to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return supabaseServer !== null
}