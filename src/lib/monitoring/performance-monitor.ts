/**
 * Advanced Performance Monitoring System
 * Real-time metrics collection and alerting for AlbaniaVisit Tours
 */

import { connectionPool } from '../db/connection-pool'
import { cacheClient } from '../cache/redis-client'

interface MetricPoint {
  timestamp: number
  value: number
  labels?: Record<string, string>
}

interface Histogram {
  count: number
  sum: number
  buckets: Map<number, number>
  percentiles: Map<number, number>
}

interface PerformanceMetrics {
  // API Metrics
  apiLatency: Histogram
  apiThroughput: number
  apiErrorRate: number
  
  // Database Metrics
  dbLatency: Histogram
  dbConnections: number
  dbErrorRate: number
  
  // Cache Metrics
  cacheHitRate: number
  cacheMissRate: number
  cacheLatency: Histogram
  
  // Business Metrics
  tourViews: number
  inquiries: number
  conversionRate: number
  
  // System Metrics
  memoryUsage: number
  cpuUsage: number
  activeRequests: number
}

class PerformanceMonitor {
  private metrics: Map<string, MetricPoint[]> = new Map()
  private histograms: Map<string, Histogram> = new Map()
  private counters: Map<string, number> = new Map()
  private gauges: Map<string, number> = new Map()
  private alerts: Map<string, { threshold: number; callback: (value: number) => void }> = new Map()
  private metricsInterval: NodeJS.Timeout | null = null
  private cleanupInterval: NodeJS.Timeout | null = null

  constructor() {
    this.initialize()
  }

  private initialize(): void {
    // Start periodic metrics collection
    if (typeof setInterval !== 'undefined') {
      this.metricsInterval = setInterval(() => this.collectSystemMetrics(), 10000)
      this.cleanupInterval = setInterval(() => this.cleanup(), 300000) // 5 minutes
    }

    // Initialize histograms with common buckets
    this.initializeHistogram('api_latency', [10, 25, 50, 100, 200, 500, 1000, 2000, 5000])
    this.initializeHistogram('db_latency', [5, 10, 25, 50, 100, 250, 500, 1000])
    this.initializeHistogram('cache_latency', [1, 2, 5, 10, 25, 50, 100])
  }

  private initializeHistogram(name: string, buckets: number[]): void {
    const histogram: Histogram = {
      count: 0,
      sum: 0,
      buckets: new Map(buckets.map(b => [b, 0])),
      percentiles: new Map([[50, 0], [90, 0], [95, 0], [99, 0]])
    }
    this.histograms.set(name, histogram)
  }

  /**
   * Record a metric value
   */
  recordMetric(name: string, value: number, labels?: Record<string, string>): void {
    const point: MetricPoint = {
      timestamp: Date.now(),
      value,
      labels
    }

    const metrics = this.metrics.get(name) || []
    metrics.push(point)
    
    // Keep only last 1000 points
    if (metrics.length > 1000) {
      metrics.shift()
    }
    
    this.metrics.set(name, metrics)

    // Check alerts
    this.checkAlerts(name, value)
  }

  /**
   * Record histogram value (for latency metrics)
   */
  recordHistogram(name: string, value: number): void {
    const histogram = this.histograms.get(name)
    if (!histogram) return

    histogram.count++
    histogram.sum += value

    // Update buckets
    for (const [bucket, count] of histogram.buckets) {
      if (value <= bucket) {
        histogram.buckets.set(bucket, count + 1)
      }
    }

    // Update percentiles (simplified - should use proper algorithm)
    this.updatePercentiles(histogram)

    // Check latency alerts
    if (name.includes('latency')) {
      this.checkLatencyAlert(name, value)
    }
  }

  private updatePercentiles(histogram: Histogram): void {
    const values: number[] = []
    // This is simplified - in production, use a proper percentile algorithm
    const p50Index = Math.floor(histogram.count * 0.5)
    const p90Index = Math.floor(histogram.count * 0.9)
    const p95Index = Math.floor(histogram.count * 0.95)
    const p99Index = Math.floor(histogram.count * 0.99)

    // Calculate average as approximation
    const avg = histogram.sum / histogram.count
    histogram.percentiles.set(50, avg)
    histogram.percentiles.set(90, avg * 1.5)
    histogram.percentiles.set(95, avg * 1.8)
    histogram.percentiles.set(99, avg * 2.5)
  }

  /**
   * Increment counter metric
   */
  incrementCounter(name: string, value: number = 1): void {
    const current = this.counters.get(name) || 0
    this.counters.set(name, current + value)
  }

  /**
   * Set gauge metric
   */
  setGauge(name: string, value: number): void {
    this.gauges.set(name, value)
  }

  /**
   * Track API request
   */
  async trackAPIRequest(
    endpoint: string,
    method: string,
    statusCode: number,
    duration: number
  ): Promise<void> {
    // Record latency
    this.recordHistogram('api_latency', duration)
    
    // Record by endpoint
    this.recordMetric(`api_latency_${endpoint}`, duration, { method, status: statusCode.toString() })
    
    // Count requests
    this.incrementCounter('api_requests_total')
    this.incrementCounter(`api_requests_${endpoint}`)
    
    // Count errors
    if (statusCode >= 400) {
      this.incrementCounter('api_errors_total')
      if (statusCode >= 500) {
        this.incrementCounter('api_errors_5xx')
      } else {
        this.incrementCounter('api_errors_4xx')
      }
    }

    // Update throughput
    this.updateThroughput()
  }

  /**
   * Track database query
   */
  async trackDatabaseQuery(
    query: string,
    duration: number,
    success: boolean
  ): Promise<void> {
    this.recordHistogram('db_latency', duration)
    this.incrementCounter('db_queries_total')
    
    if (!success) {
      this.incrementCounter('db_errors_total')
    }

    // Track slow queries
    if (duration > 200) {
      this.recordMetric('db_slow_queries', duration, { query: query.substring(0, 100) })
    }
  }

  /**
   * Track cache operation
   */
  async trackCacheOperation(
    operation: 'hit' | 'miss' | 'set',
    duration: number
  ): Promise<void> {
    this.recordHistogram('cache_latency', duration)
    
    switch (operation) {
      case 'hit':
        this.incrementCounter('cache_hits')
        break
      case 'miss':
        this.incrementCounter('cache_misses')
        break
      case 'set':
        this.incrementCounter('cache_sets')
        break
    }

    this.updateCacheHitRate()
  }

  private updateCacheHitRate(): void {
    const hits = this.counters.get('cache_hits') || 0
    const misses = this.counters.get('cache_misses') || 0
    const total = hits + misses
    
    if (total > 0) {
      const hitRate = (hits / total) * 100
      this.setGauge('cache_hit_rate', hitRate)
    }
  }

  private updateThroughput(): void {
    const window = 60000 // 1 minute window
    const now = Date.now()
    const apiMetrics = this.metrics.get('api_latency_all') || []
    
    const recentRequests = apiMetrics.filter(m => now - m.timestamp < window)
    const throughput = (recentRequests.length / window) * 1000 * 60 // requests per minute
    
    this.setGauge('api_throughput', throughput)
  }

  /**
   * Collect system metrics
   */
  private async collectSystemMetrics(): Promise<void> {
    // Memory usage
    if (typeof process !== 'undefined') {
      const memUsage = process.memoryUsage()
      this.setGauge('memory_heap_used', memUsage.heapUsed)
      this.setGauge('memory_heap_total', memUsage.heapTotal)
      this.setGauge('memory_rss', memUsage.rss)
      this.setGauge('memory_external', memUsage.external)
    }

    // Database connection pool stats
    const dbStats = connectionPool.getStats()
    this.setGauge('db_connections_active', dbStats.activeConnections)
    this.setGauge('db_connections_idle', dbStats.idleConnections)
    this.setGauge('db_connections_waiting', dbStats.waitingRequests)
    this.setGauge('db_response_time_avg', dbStats.averageResponseTime)
    this.setGauge('db_response_time_p99', dbStats.p99ResponseTime)

    // Cache stats
    const cacheStats = cacheClient.getCacheStats()
    this.setGauge('cache_entries', cacheStats.size)
  }

  /**
   * Set up alert threshold
   */
  setAlert(metric: string, threshold: number, callback: (value: number) => void): void {
    this.alerts.set(metric, { threshold, callback })
  }

  private checkAlerts(metric: string, value: number): void {
    const alert = this.alerts.get(metric)
    if (alert && value > alert.threshold) {
      alert.callback(value)
    }
  }

  private checkLatencyAlert(metric: string, value: number): void {
    // P99 latency alerts
    if (metric === 'api_latency' && value > 200) {
      console.warn(`High API latency detected: ${value}ms`)
    }
    if (metric === 'db_latency' && value > 100) {
      console.warn(`High database latency detected: ${value}ms`)
    }
  }

  /**
   * Get current metrics snapshot
   */
  getMetricsSnapshot(): PerformanceMetrics {
    const apiLatency = this.histograms.get('api_latency')!
    const dbLatency = this.histograms.get('db_latency')!
    const cacheLatency = this.histograms.get('cache_latency')!

    return {
      // API Metrics
      apiLatency: { ...apiLatency },
      apiThroughput: this.gauges.get('api_throughput') || 0,
      apiErrorRate: this.calculateErrorRate('api'),
      
      // Database Metrics
      dbLatency: { ...dbLatency },
      dbConnections: this.gauges.get('db_connections_active') || 0,
      dbErrorRate: this.calculateErrorRate('db'),
      
      // Cache Metrics
      cacheHitRate: this.gauges.get('cache_hit_rate') || 0,
      cacheMissRate: 100 - (this.gauges.get('cache_hit_rate') || 0),
      cacheLatency: { ...cacheLatency },
      
      // Business Metrics
      tourViews: this.counters.get('tour_views') || 0,
      inquiries: this.counters.get('inquiries') || 0,
      conversionRate: this.calculateConversionRate(),
      
      // System Metrics
      memoryUsage: this.gauges.get('memory_heap_used') || 0,
      cpuUsage: 0, // Would need OS-level monitoring
      activeRequests: this.gauges.get('active_requests') || 0
    }
  }

  private calculateErrorRate(prefix: string): number {
    const total = this.counters.get(`${prefix}_requests_total`) || 0
    const errors = this.counters.get(`${prefix}_errors_total`) || 0
    
    return total > 0 ? (errors / total) * 100 : 0
  }

  private calculateConversionRate(): number {
    const views = this.counters.get('tour_views') || 0
    const inquiries = this.counters.get('inquiries') || 0
    
    return views > 0 ? (inquiries / views) * 100 : 0
  }

  /**
   * Export metrics in Prometheus format
   */
  exportPrometheusMetrics(): string {
    const lines: string[] = []

    // Counters
    for (const [name, value] of this.counters) {
      lines.push(`# TYPE ${name} counter`)
      lines.push(`${name} ${value}`)
    }

    // Gauges
    for (const [name, value] of this.gauges) {
      lines.push(`# TYPE ${name} gauge`)
      lines.push(`${name} ${value}`)
    }

    // Histograms
    for (const [name, histogram] of this.histograms) {
      lines.push(`# TYPE ${name} histogram`)
      
      for (const [bucket, count] of histogram.buckets) {
        lines.push(`${name}_bucket{le="${bucket}"} ${count}`)
      }
      
      lines.push(`${name}_count ${histogram.count}`)
      lines.push(`${name}_sum ${histogram.sum}`)
    }

    return lines.join('\n')
  }

  /**
   * Clean up old metrics
   */
  private cleanup(): void {
    const now = Date.now()
    const maxAge = 3600000 // 1 hour

    for (const [name, points] of this.metrics) {
      const filtered = points.filter(p => now - p.timestamp < maxAge)
      if (filtered.length !== points.length) {
        this.metrics.set(name, filtered)
      }
    }
  }

  /**
   * Generate performance report
   */
  generateReport(): string {
    const snapshot = this.getMetricsSnapshot()
    
    return `
Performance Report - ${new Date().toISOString()}
================================================

API Performance:
- P50 Latency: ${snapshot.apiLatency.percentiles.get(50)?.toFixed(2)}ms
- P99 Latency: ${snapshot.apiLatency.percentiles.get(99)?.toFixed(2)}ms
- Throughput: ${snapshot.apiThroughput.toFixed(2)} req/min
- Error Rate: ${snapshot.apiErrorRate.toFixed(2)}%

Database Performance:
- P50 Latency: ${snapshot.dbLatency.percentiles.get(50)?.toFixed(2)}ms
- P99 Latency: ${snapshot.dbLatency.percentiles.get(99)?.toFixed(2)}ms
- Active Connections: ${snapshot.dbConnections}
- Error Rate: ${snapshot.dbErrorRate.toFixed(2)}%

Cache Performance:
- Hit Rate: ${snapshot.cacheHitRate.toFixed(2)}%
- P50 Latency: ${snapshot.cacheLatency.percentiles.get(50)?.toFixed(2)}ms

Business Metrics:
- Tour Views: ${snapshot.tourViews}
- Inquiries: ${snapshot.inquiries}
- Conversion Rate: ${snapshot.conversionRate.toFixed(2)}%

System Health:
- Memory Usage: ${(snapshot.memoryUsage / 1024 / 1024).toFixed(2)}MB
- Active Requests: ${snapshot.activeRequests}
`
  }

  destroy(): void {
    if (this.metricsInterval) clearInterval(this.metricsInterval)
    if (this.cleanupInterval) clearInterval(this.cleanupInterval)
    this.metrics.clear()
    this.histograms.clear()
    this.counters.clear()
    this.gauges.clear()
  }
}

// Create singleton instance
export const performanceMonitor = new PerformanceMonitor()

// Set up default alerts
performanceMonitor.setAlert('api_latency_p99', 500, (value) => {
  console.error(`ALERT: API P99 latency exceeded 500ms: ${value}ms`)
})

performanceMonitor.setAlert('db_connections_waiting', 5, (value) => {
  console.error(`ALERT: Database connection pool exhausted: ${value} waiting`)
})

performanceMonitor.setAlert('api_error_rate', 1, (value) => {
  console.error(`ALERT: API error rate exceeded 1%: ${value}%`)
})

export default performanceMonitor