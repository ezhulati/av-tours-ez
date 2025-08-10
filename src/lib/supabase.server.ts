import { createClient } from '@supabase/supabase-js'

// Get environment variables - Astro automatically loads .env files
// In Astro, server-side env vars are available in import.meta.env
const supabaseUrl = import.meta.env.SUPABASE_URL
const supabaseKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY

// Create the client only if we have the env vars
export const supabaseServer = supabaseUrl && supabaseKey 
  ? createClient(supabaseUrl, supabaseKey, { 
      auth: { 
        persistSession: false 
      } 
    })
  : null as any // Return null if no env vars, but typed as any to avoid breaking existing code

// Helper to check if Supabase is configured
export function isSupabaseConfigured(): boolean {
  return !!(supabaseUrl && supabaseKey)
}