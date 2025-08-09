import { createClient } from '@supabase/supabase-js'

const url = import.meta.env.SUPABASE_URL!
const key = import.meta.env.SUPABASE_SERVICE_ROLE_KEY!

export const supabaseServer = createClient(url, key, { 
  auth: { 
    persistSession: false 
  } 
})