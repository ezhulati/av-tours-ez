/**
 * Performance Monitoring Utility
 * Tracks Core Web Vitals and custom metrics for the AlbaniaVisit Tours app
 */

interface PerformanceMetrics {
  FCP?: number // First Contentful Paint
  LCP?: number // Largest Contentful Paint
  FID?: number // First Input Delay
  CLS?: number // Cumulative Layout Shift
  TTI?: number // Time to Interactive
  TBT?: number // Total Blocking Time
  customMetrics?: Record<string, number>
}

class PerformanceMonitor {
  private metrics: PerformanceMetrics = {}
  private observer?: PerformanceObserver
  
  constructor() {
    if (typeof window !== 'undefined' && 'PerformanceObserver' in window) {
      this.initializeObservers()
    }
  }
  
  private initializeObservers() {
    // Observe paint events (FCP, LCP)
    try {
      this.observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'paint') {
            if (entry.name === 'first-contentful-paint') {
              this.metrics.FCP = Math.round(entry.startTime)
            }
          } else if (entry.entryType === 'largest-contentful-paint') {
            this.metrics.LCP = Math.round(entry.startTime)
          }
        }
      })
      
      this.observer.observe({ 
        entryTypes: ['paint', 'largest-contentful-paint'] 
      })
    } catch (e) {
      console.warn('Performance monitoring not supported:', e)
    }
    
    // Observe layout shifts (CLS)
    try {
      let clsValue = 0
      const clsObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (!(entry as any).hadRecentInput) {
            clsValue += (entry as any).value
            this.metrics.CLS = Math.round(clsValue * 1000) / 1000
          }
        }
      })
      
      clsObserver.observe({ entryTypes: ['layout-shift'] })
    } catch (e) {
      console.warn('CLS monitoring not supported:', e)
    }
    
    // Observe first input (FID)
    try {
      const fidObserver = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === 'first-input') {
            this.metrics.FID = Math.round((entry as any).processingStart - entry.startTime)
          }
        }
      })
      
      fidObserver.observe({ entryTypes: ['first-input'] })
    } catch (e) {
      console.warn('FID monitoring not supported:', e)
    }
    
    // Calculate TTI
    if ('requestIdleCallback' in window) {
      requestIdleCallback(() => {
        this.metrics.TTI = Math.round(performance.now())
      })
    }
  }
  
  /**
   * Track a custom metric
   */
  trackCustomMetric(name: string, value: number) {
    if (!this.metrics.customMetrics) {
      this.metrics.customMetrics = {}
    }
    this.metrics.customMetrics[name] = Math.round(value)
  }
  
  /**
   * Mark a specific point in time
   */
  mark(name: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      performance.mark(name)
    }
  }
  
  /**
   * Measure between two marks
   */
  measure(name: string, startMark: string, endMark?: string) {
    if (typeof window !== 'undefined' && 'performance' in window) {
      try {
        if (endMark) {
          performance.measure(name, startMark, endMark)
        } else {
          performance.measure(name, startMark)
        }
        
        const measure = performance.getEntriesByName(name, 'measure')[0]
        if (measure) {
          this.trackCustomMetric(name, measure.duration)
        }
      } catch (e) {
        console.warn('Performance measurement failed:', e)
      }
    }
  }
  
  /**
   * Get all collected metrics
   */
  getMetrics(): PerformanceMetrics {
    return { ...this.metrics }
  }
  
  /**
   * Log metrics to console (for debugging)
   */
  logMetrics() {
    const metrics = this.getMetrics()
    console.group('📊 Performance Metrics')
    
    if (metrics.FCP) {
      console.log(`FCP (First Contentful Paint): ${metrics.FCP}ms`)
    }
    if (metrics.LCP) {
      const rating = metrics.LCP < 2500 ? '✅ Good' : metrics.LCP < 4000 ? '⚠️ Needs Improvement' : '❌ Poor'
      console.log(`LCP (Largest Contentful Paint): ${metrics.LCP}ms ${rating}`)
    }
    if (metrics.FID !== undefined) {
      const rating = metrics.FID < 100 ? '✅ Good' : metrics.FID < 300 ? '⚠️ Needs Improvement' : '❌ Poor'
      console.log(`FID (First Input Delay): ${metrics.FID}ms ${rating}`)
    }
    if (metrics.CLS !== undefined) {
      const rating = metrics.CLS < 0.1 ? '✅ Good' : metrics.CLS < 0.25 ? '⚠️ Needs Improvement' : '❌ Poor'
      console.log(`CLS (Cumulative Layout Shift): ${metrics.CLS} ${rating}`)
    }
    if (metrics.TTI) {
      const rating = metrics.TTI < 3500 ? '✅ Good' : metrics.TTI < 5500 ? '⚠️ Needs Improvement' : '❌ Poor'
      console.log(`TTI (Time to Interactive): ${metrics.TTI}ms ${rating}`)
    }
    
    if (metrics.customMetrics && Object.keys(metrics.customMetrics).length > 0) {
      console.group('Custom Metrics')
      Object.entries(metrics.customMetrics).forEach(([name, value]) => {
        console.log(`${name}: ${value}ms`)
      })
      console.groupEnd()
    }
    
    console.groupEnd()
  }
  
  /**
   * Send metrics to analytics (placeholder for actual implementation)
   */
  sendToAnalytics() {
    const metrics = this.getMetrics()
    
    // Send to Google Analytics 4 if available
    if (typeof window !== 'undefined' && 'gtag' in window) {
      const gtag = (window as any).gtag
      
      // Send Web Vitals as events
      if (metrics.LCP) {
        gtag('event', 'LCP', {
          event_category: 'Web Vitals',
          value: metrics.LCP,
          event_label: this.getRating(metrics.LCP, 2500, 4000)
        })
      }
      
      if (metrics.FID !== undefined) {
        gtag('event', 'FID', {
          event_category: 'Web Vitals',
          value: metrics.FID,
          event_label: this.getRating(metrics.FID, 100, 300)
        })
      }
      
      if (metrics.CLS !== undefined) {
        gtag('event', 'CLS', {
          event_category: 'Web Vitals',
          value: Math.round(metrics.CLS * 1000),
          event_label: this.getRating(metrics.CLS, 0.1, 0.25)
        })
      }
    }
  }
  
  private getRating(value: number, goodThreshold: number, needsImprovementThreshold: number): string {
    if (value < goodThreshold) return 'good'
    if (value < needsImprovementThreshold) return 'needs-improvement'
    return 'poor'
  }
  
  /**
   * Clean up observers
   */
  destroy() {
    if (this.observer) {
      this.observer.disconnect()
    }
  }
}

// Create singleton instance
const performanceMonitor = typeof window !== 'undefined' ? new PerformanceMonitor() : null

// Auto-log metrics when page loads (development only)
if (typeof window !== 'undefined' && process.env.NODE_ENV === 'development') {
  window.addEventListener('load', () => {
    setTimeout(() => {
      performanceMonitor?.logMetrics()
    }, 3000)
  })
}

export default performanceMonitor
export { PerformanceMonitor, type PerformanceMetrics }