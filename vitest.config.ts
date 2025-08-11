import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import { resolve } from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
    setupFiles: './tests/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html', 'lcov'],
      include: [
        'src/components/**/*.{ts,tsx}',
        'src/lib/utils.ts',
        'src/lib/microcopy.ts'
      ],
      exclude: [
        'node_modules/',
        'tests/',
        '*.config.*',
        '.astro/',
        'dist/',
        'coverage/',
        '**/*.d.ts',
        '**/*.test.*',
        '**/*.spec.*',
        '**/test-*',
        '**/mock-*',
        '**/*.astro',
        'src/components/ui/**',
        'src/components/admin/**',
        'src/lib/scraping/**',
        'src/lib/security/**',
        'src/lib/monitoring/**',
        'src/lib/cache/**',
        'src/lib/db/**',
        'src/lib/middleware/**',
        'src/lib/analytics/**',
        'src/lib/pricing/**',
        'src/lib/seo/**',
        'src/pages/**',
        'src/data/**',
        'src/scripts/**',
        'stories/**',
        'netlify/**',
        '*.ts',
        '*.js'
      ],
      thresholds: {
        branches: 60,
        functions: 60,
        lines: 60,
        statements: 60
      }
    },
    include: ['tests/component/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}'],
    exclude: ['node_modules', 'dist', '.astro'],
  },
  resolve: {
    alias: {
      '@': resolve(__dirname, './src'),
      '@components': resolve(__dirname, './src/components'),
      '@lib': resolve(__dirname, './src/lib'),
      '@data': resolve(__dirname, './src/data'),
    },
  },
})