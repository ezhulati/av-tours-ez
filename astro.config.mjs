import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import netlify from '@astrojs/netlify'

export default defineConfig({
  site: 'https://tours.albaniavisit.com',
  output: 'server',
  adapter: netlify(),
  integrations: [react(), tailwind(), sitemap()]
})