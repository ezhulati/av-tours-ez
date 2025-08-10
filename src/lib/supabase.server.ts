import { createClient, SupabaseClient } from '@supabase/supabase-js'

let _supabaseServer: SupabaseClient | undefined

// Lazy getter that creates the client on first use
export const supabaseServer = new Proxy({} as SupabaseClient, {
  get(target, prop, receiver) {
    if (!_supabaseServer) {
      // Try different env variable access methods for compatibility
      let url: string | undefined
      let key: string | undefined
      
      // For Netlify Edge Functions
      if (typeof process !== 'undefined' && process.env) {
        url = process.env.SUPABASE_URL
        key = process.env.SUPABASE_SERVICE_ROLE_KEY
      }
      
      // For local development with Vite
      if (!url && typeof import.meta !== 'undefined' && import.meta.env) {
        url = import.meta.env.SUPABASE_URL
        key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY
      }
      
      if (!url || !key) {
        console.error('Supabase environment variables not found:', {
          hasUrl: !!url,
          hasKey: !!key,
          processEnvExists: typeof process !== 'undefined' && !!process.env,
          importMetaExists: typeof import.meta !== 'undefined' && !!import.meta.env
        })
        throw new Error('Missing Supabase environment variables')
      }

      _supabaseServer = createClient(url, key, { 
        auth: { 
          persistSession: false 
        } 
      })
    }
    
    return Reflect.get(_supabaseServer, prop, receiver)
  }
})