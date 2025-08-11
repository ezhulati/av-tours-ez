import { createClient } from '@supabase/supabase-js'

// Get environment variables - handle Astro, Netlify Functions, and Netlify Edge Functions
// Priority: import.meta.env (Astro) > Netlify.env (Edge) > process.env (Node)
const getEnvVar = (key: string): string | undefined => {
  // Astro's import.meta.env (works in dev and build)
  if (import.meta.env?.[key]) return import.meta.env[key]
  
  // Netlify Edge Functions context
  if (typeof Netlify !== 'undefined' && (Netlify as any).env?.get) {
    return (Netlify as any).env.get(key)
  }
  
  // Node.js process.env (Netlify Functions)
  if (typeof process !== 'undefined' && process.env?.[key]) {
    return process.env[key]
  }
  
  return undefined
}

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