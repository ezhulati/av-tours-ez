import { createClient } from '@supabase/supabase-js'

// Use process.env for Netlify Edge Functions compatibility
const url = process.env.SUPABASE_URL || import.meta.env.SUPABASE_URL
const key = process.env.SUPABASE_SERVICE_ROLE_KEY || import.meta.env.SUPABASE_SERVICE_ROLE_KEY

if (!url || !key) {
  throw new Error('Missing Supabase environment variables')
}

export const supabaseServer = createClient(url, key, { 
  auth: { 
    persistSession: false 
  } 
})