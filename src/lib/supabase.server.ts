import { createClient } from '@supabase/supabase-js'

// Get environment variables - compatible with both Vite and Netlify Edge
function getEnvVar(name: string): string | undefined {
  // Try process.env first (Netlify Edge Functions)
  if (typeof process !== 'undefined' && process.env && process.env[name]) {
    return process.env[name]
  }
  
  // Try import.meta.env (Vite/local dev)
  if (typeof import !== 'undefined' && typeof import.meta !== 'undefined' && import.meta.env && import.meta.env[name]) {
    return import.meta.env[name]
  }
  
  return undefined
}

// Get the environment variables
const supabaseUrl = getEnvVar('SUPABASE_URL')
const supabaseKey = getEnvVar('SUPABASE_SERVICE_ROLE_KEY')

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