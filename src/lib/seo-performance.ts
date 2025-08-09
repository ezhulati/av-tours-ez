/**
 * SEO Performance Optimization Module
 * Core Web Vitals and Technical SEO Implementation
 */

// Image optimization configuration
export const imageOptimization = {
  // Responsive image sizes for different contexts
  sizes: {
    thumbnail: { width: 400, height: 300, quality: 85 },
    card: { width: 800, height: 600, quality: 85 },
    hero: { width: 1920, height: 1080, quality: 90 },
    gallery: { width: 1200, height: 900, quality: 90 },
    ogImage: { width: 1200, height: 630, quality: 90 }
  },
  
  // Modern format preferences
  formats: ['avif', 'webp', 'jpg'],
  
  // Lazy loading configuration
  lazyLoading: {
    enabled: true,
    rootMargin: '50px',
    threshold: 0.01,
    // Images to load immediately (above the fold)
    eager: ['hero', 'logo', 'first-card']
  },
  
  // SEO-friendly image attributes
  generateAlt: (tourName: string, imageIndex: number, context: string) => {
    const templates = {
      hero: `${tourName} - breathtaking mountain views in Albania`,
      gallery: `${tourName} - photo ${imageIndex} showing adventure highlights`,
      card: `${tourName} tour in Albania - book your adventure`,
      thumbnail: `${tourName} - Albania adventure tour`
    }
    return templates[context as keyof typeof templates] || `${tourName} - Albania tour`
  }
}

// Critical CSS extraction for above-the-fold content
export const criticalCSS = {
  // Inline critical styles for immediate render
  inline: `
    /* Critical above-the-fold styles */
    :root {
      --color-primary: #10b981;
      --color-accent: #f59e0b;
      --font-sans: system-ui, -apple-system, sans-serif;
    }
    
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: var(--font-sans);
      line-height: 1.6;
      color: #1f2937;
      -webkit-font-smoothing: antialiased;
    }
    
    .hero {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }
    
    /* Prevent layout shift */
    img {
      max-width: 100%;
      height: auto;
      aspect-ratio: attr(width) / attr(height);
    }
    
    /* Font loading optimization */
    .font-loading body {
      opacity: 0;
    }
    
    .fonts-loaded body {
      opacity: 1;
      transition: opacity 0.3s ease;
    }
  `,
  
  // Preload critical resources
  preloads: [
    { rel: 'preload', as: 'font', type: 'font/woff2', href: '/fonts/primary.woff2', crossorigin: 'anonymous' },
    { rel: 'preload', as: 'image', type: 'image/webp', href: '/hero-albania.webp', fetchpriority: 'high' },
    { rel: 'preconnect', href: 'https://fonts.googleapis.com' },
    { rel: 'dns-prefetch', href: 'https://www.google-analytics.com' }
  ]
}

// Resource hints for optimal loading
export const resourceHints = {
  // DNS prefetch for external domains
  dnsPrefetch: [
    'https://www.google-analytics.com',
    'https://www.googletagmanager.com',
    'https://fonts.googleapis.com',
    'https://cdn.jsdelivr.net'
  ],
  
  // Preconnect for critical third-party origins
  preconnect: [
    { href: 'https://fonts.googleapis.com', crossorigin: true },
    { href: 'https://fonts.gstatic.com', crossorigin: true }
  ],
  
  // Prefetch for likely next navigations
  prefetch: (currentPath: string) => {
    const prefetchMap: Record<string, string[]> = {
      '/': ['/tours', '/category/hiking'],
      '/tours': ['/tours/peaks-balkans', '/tours/albania-riviera'],
      '/category/*': ['/tours/*']
    }
    
    return prefetchMap[currentPath] || []
  }
}

// Script loading optimization
export const scriptOptimization = {
  // Third-party script loading strategies
  thirdParty: {
    analytics: {
      strategy: 'defer',
      async: true,
      importance: 'low'
    },
    chatWidget: {
      strategy: 'idle',
      async: true,
      importance: 'low',
      delay: 5000
    },
    maps: {
      strategy: 'interaction',
      async: true,
      importance: 'medium'
    }
  },
  
  // Inline performance monitoring
  performanceMonitor: `
    // Web Vitals monitoring
    if ('PerformanceObserver' in window) {
      // LCP
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const lastEntry = entries[entries.length - 1];
        console.log('LCP:', lastEntry.renderTime || lastEntry.loadTime);
        // Send to analytics
        if (window.gtag) {
          gtag('event', 'web_vitals', {
            event_category: 'Web Vitals',
            event_label: 'LCP',
            value: Math.round(lastEntry.renderTime || lastEntry.loadTime)
          });
        }
      }).observe({ entryTypes: ['largest-contentful-paint'] });
      
      // CLS
      let clsValue = 0;
      new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!entry.hadRecentInput) {
            clsValue += entry.value;
          }
        }
        console.log('CLS:', clsValue);
      }).observe({ entryTypes: ['layout-shift'] });
      
      // FID
      new PerformanceObserver((list) => {
        const entries = list.getEntries();
        const firstEntry = entries[0];
        console.log('FID:', firstEntry.processingStart - firstEntry.startTime);
      }).observe({ entryTypes: ['first-input'] });
    }
  `
}

// Caching strategies for different resource types
export const cachingStrategy = {
  // Static assets (CSS, JS, fonts)
  static: {
    maxAge: 31536000, // 1 year
    immutable: true,
    swr: false
  },
  
  // Images
  images: {
    maxAge: 2592000, // 30 days
    immutable: false,
    swr: 86400 // stale-while-revalidate: 1 day
  },
  
  // HTML pages
  html: {
    maxAge: 0,
    sMaxAge: 3600, // CDN cache: 1 hour
    swr: 86400, // stale-while-revalidate: 1 day
    mustRevalidate: true
  },
  
  // API responses
  api: {
    tours: {
      maxAge: 3600, // 1 hour
      swr: 7200 // 2 hours
    },
    availability: {
      maxAge: 300, // 5 minutes
      swr: 600 // 10 minutes
    },
    static: {
      maxAge: 86400, // 1 day
      swr: 172800 // 2 days
    }
  }
}

// Generate cache headers
export function generateCacheHeaders(type: keyof typeof cachingStrategy): Record<string, string> {
  const strategy = cachingStrategy[type as keyof typeof cachingStrategy]
  const headers: Record<string, string> = {}
  
  if (typeof strategy === 'object' && 'maxAge' in strategy) {
    let cacheControl = [`max-age=${strategy.maxAge}`]
    
    if ('sMaxAge' in strategy && strategy.sMaxAge) {
      cacheControl.push(`s-maxage=${strategy.sMaxAge}`)
    }
    
    if ('swr' in strategy && strategy.swr) {
      cacheControl.push(`stale-while-revalidate=${strategy.swr}`)
    }
    
    if ('immutable' in strategy && strategy.immutable) {
      cacheControl.push('immutable')
    }
    
    if ('mustRevalidate' in strategy && strategy.mustRevalidate) {
      cacheControl.push('must-revalidate')
    }
    
    headers['Cache-Control'] = cacheControl.join(', ')
  }
  
  return headers
}

// Compression settings
export const compressionSettings = {
  // Brotli compression for text assets
  brotli: {
    enabled: true,
    quality: 11, // Max quality for static assets
    types: ['text/html', 'text/css', 'application/javascript', 'application/json', 'image/svg+xml']
  },
  
  // Gzip fallback
  gzip: {
    enabled: true,
    level: 9, // Max compression
    types: ['text/html', 'text/css', 'application/javascript', 'application/json', 'image/svg+xml']
  }
}

// Mobile-specific optimizations
export const mobileOptimizations = {
  // Viewport and touch optimizations
  viewport: 'width=device-width, initial-scale=1.0, maximum-scale=5.0, user-scalable=yes',
  
  // Touch target sizing
  touchTargets: {
    minSize: 48, // 48x48px minimum
    spacing: 8 // 8px minimum between targets
  },
  
  // Font size optimization
  fonts: {
    minSize: 16, // Prevent zoom on input focus
    lineHeight: 1.5, // Improved readability
    scaling: 'font-size: calc(16px + 0.5vw)' // Responsive scaling
  },
  
  // Reduce JavaScript for mobile
  reduceJS: {
    enabled: true,
    threshold: 500, // KB
    criticalOnly: true
  },
  
  // Adaptive loading based on connection
  adaptiveLoading: {
    slow2g: { images: 'low', videos: false, fonts: 'system' },
    '2g': { images: 'medium', videos: false, fonts: 'subset' },
    '3g': { images: 'high', videos: 'preview', fonts: 'full' },
    '4g': { images: 'high', videos: 'auto', fonts: 'full' }
  }
}

// Generate performance budget
export const performanceBudget = {
  metrics: {
    FCP: { budget: 1800, unit: 'ms' }, // First Contentful Paint
    LCP: { budget: 2500, unit: 'ms' }, // Largest Contentful Paint
    TTI: { budget: 3800, unit: 'ms' }, // Time to Interactive
    TBT: { budget: 200, unit: 'ms' }, // Total Blocking Time
    CLS: { budget: 0.1, unit: 'score' }, // Cumulative Layout Shift
    FID: { budget: 100, unit: 'ms' } // First Input Delay
  },
  
  resources: {
    html: { budget: 30, unit: 'KB' },
    css: { budget: 50, unit: 'KB' },
    javascript: { budget: 200, unit: 'KB' },
    images: { budget: 500, unit: 'KB' },
    fonts: { budget: 100, unit: 'KB' },
    total: { budget: 1000, unit: 'KB' }
  },
  
  counts: {
    requests: { budget: 50, unit: 'count' },
    domains: { budget: 5, unit: 'count' },
    fonts: { budget: 3, unit: 'count' }
  }
}