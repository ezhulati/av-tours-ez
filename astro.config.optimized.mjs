import { defineConfig } from 'astro/config'
import react from '@astrojs/react'
import tailwind from '@astrojs/tailwind'
import sitemap from '@astrojs/sitemap'
import netlify from '@astrojs/netlify'
import compress from 'astro-compress'

export default defineConfig({
  site: 'https://tours.albaniavisit.com',
  output: 'server',
  adapter: netlify({
    edgeMiddleware: false,
    functionPerRoute: false,
    imageCDN: false // Disable image CDN to avoid edge functions
  }),
  integrations: [
    react(),
    tailwind(),
    sitemap(),
    compress({
      CSS: true,
      HTML: {
        removeAttributeQuotes: false,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        sortClassName: false,
        useShortDoctype: true,
        collapseWhitespace: true,
        minifyCSS: true,
        minifyJS: true
      },
      Image: false, // We handle images with weserv.nl
      JavaScript: true,
      SVG: true
    })
  ],
  vite: {
    ssr: {
      external: ['@supabase/supabase-js'] // Ensure Supabase works in SSR
    },
    build: {
      cssCodeSplit: true,
      rollupOptions: {
        output: {
          manualChunks: {
            'react-vendor': ['react', 'react-dom'],
            'ui-vendor': ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu'],
            'tour-components': [
              '/src/components/tours/TourCard.tsx',
              '/src/components/tours/TourCardOptimized.tsx',
              '/src/components/tours/BookingButton.tsx'
            ]
          }
        }
      }
    },
    optimizeDeps: {
      include: ['react', 'react-dom']
    }
  },
  // Performance optimizations
  prefetch: {
    prefetchAll: false,
    defaultStrategy: 'viewport'
  },
  compressHTML: true,
  build: {
    inlineStylesheets: 'auto'
  }
})