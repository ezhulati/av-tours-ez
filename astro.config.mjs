import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import netlify from '@astrojs/netlify'

export default defineConfig({
  site: 'https://tours.albaniavisit.com',
  output: 'server',
  adapter: netlify({
    edgeMiddleware: false,
    functionPerRoute: false,
    imageCDN: false // Disable image CDN to avoid edge functions
  }),
  integrations: [react(), tailwind(), sitemap()],
  vite: {
    ssr: {
      external: ['@supabase/supabase-js'] // Ensure Supabase works in SSR
    }
  }
})