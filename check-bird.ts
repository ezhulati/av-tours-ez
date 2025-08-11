import { createClient } from '@supabase/supabase-js'
import { config } from 'dotenv'
config()

const supabase = createClient(process.env.SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!)

async function check() {
  const { data } = await supabase
    .from('affiliate_tours')
    .select('title, slug, primary_image')
    .ilike('title', '%bird%')
    
  console.log('Birdwatching tour:', data)
}

check()