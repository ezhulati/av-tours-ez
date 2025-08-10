import { createClient } from '@supabase/supabase-js'

// Get environment variables - handle both local (import.meta.env) and Netlify (process.env)
// Netlify Functions use process.env, local Astro dev uses import.meta.env
const supabaseUrl = import.meta.env?.SUPABASE_URL || 
  (typeof process !== 'undefined' ? process.env?.SUPABASE_URL : undefined)
const supabaseKey = import.meta.env?.SUPABASE_SERVICE_ROLE_KEY || 
  (typeof process !== 'undefined' ? process.env?.SUPABASE_SERVICE_ROLE_KEY : undefined)

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