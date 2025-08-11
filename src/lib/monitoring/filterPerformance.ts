/**
 * Performance monitoring utilities for FilterBar component
 * Tracks metrics like render time, API response time, and interaction latency
 */

interface PerformanceMetrics {
  renderTime: number
  apiResponseTime: number
  interactionLatency: number
  rerenderCount: number
  memoryUsage?: number
}

interface FilterMetrics {
  filterChangeCount: number
  averageResponseTime: number
  errorRate: number
  debounceEffectiveness: number
  lastMeasurement: PerformanceMetrics | null
}

class FilterPerformanceMonitor {
  private metrics: FilterMetrics = {
    filterChangeCount: 0,
    averageResponseTime: 0,
    errorRate: 0,
    debounceEffectiveness: 0,
    lastMeasurement: null
  }
  
  private measurements: PerformanceMetrics[] = []
  private maxMeasurements = 100
  private renderStart: number | null = null
  private apiStart: number | null = null
  private interactionStart: number | null = null
  private rerenderCount = 0
  private errorCount = 0
  private debouncedCalls = 0
  private actualCalls = 0

  /**
   * Start measuring component render time
   */
  startRenderMeasure(): void {
    this.renderStart = performance.now()
    this.rerenderCount++
  }

  /**
   * End render measurement and record
   */
  endRenderMeasure(): void {
    if (!this.renderStart) return
    
    const renderTime = performance.now() - this.renderStart
    this.renderStart = null
    
    // Log if render takes too long
    if (renderTime > 16.67) { // More than one frame (60fps)
      console.warn(`FilterBar render took ${renderTime.toFixed(2)}ms - consider optimization`)
    }
    
    this.updateLastMeasurement({ renderTime })
  }

  /**
   * Start measuring API call time
   */
  startApiMeasure(): void {
    this.apiStart = performance.now()
    this.actualCalls++
  }

  /**
   * End API measurement and record
   */
  endApiMeasure(success: boolean = true): void {
    if (!this.apiStart) return
    
    const apiResponseTime = performance.now() - this.apiStart
    this.apiStart = null
    
    if (!success) {
      this.errorCount++
    }
    
    // Update average response time
    const currentAvg = this.metrics.averageResponseTime
    const newCount = this.metrics.filterChangeCount + 1
    this.metrics.averageResponseTime = (currentAvg * this.metrics.filterChangeCount + apiResponseTime) / newCount
    this.metrics.filterChangeCount = newCount
    
    // Update error rate
    this.metrics.errorRate = this.errorCount / this.actualCalls
    
    this.updateLastMeasurement({ apiResponseTime })
  }

  /**
   * Start measuring user interaction
   */
  startInteractionMeasure(): void {
    this.interactionStart = performance.now()
  }

  /**
   * End interaction measurement
   */
  endInteractionMeasure(): void {
    if (!this.interactionStart) return
    
    const interactionLatency = performance.now() - this.interactionStart
    this.interactionStart = null
    
    // Log if interaction is not responsive
    if (interactionLatency > 100) {
      console.warn(`FilterBar interaction latency: ${interactionLatency.toFixed(2)}ms - aim for < 100ms`)
    }
    
    this.updateLastMeasurement({ interactionLatency })
  }

  /**
   * Track debounced calls vs actual API calls
   */
  trackDebouncedCall(): void {
    this.debouncedCalls++
    this.updateDebounceEffectiveness()
  }

  /**
   * Calculate debounce effectiveness
   */
  private updateDebounceEffectiveness(): void {
    if (this.debouncedCalls === 0) {
      this.metrics.debounceEffectiveness = 0
      return
    }
    
    // Effectiveness = percentage of calls prevented by debouncing
    const preventedCalls = this.debouncedCalls - this.actualCalls
    this.metrics.debounceEffectiveness = (preventedCalls / this.debouncedCalls) * 100
  }

  /**
   * Update the last measurement
   */
  private updateLastMeasurement(partial: Partial<PerformanceMetrics>): void {
    const currentMeasurement = this.metrics.lastMeasurement || {
      renderTime: 0,
      apiResponseTime: 0,
      interactionLatency: 0,
      rerenderCount: this.rerenderCount
    }
    
    // Try to get memory usage if available
    if ('memory' in performance) {
      currentMeasurement.memoryUsage = (performance as any).memory.usedJSHeapSize
    }
    
    this.metrics.lastMeasurement = {
      ...currentMeasurement,
      ...partial,
      rerenderCount: this.rerenderCount
    }
    
    // Store measurement
    this.measurements.push(this.metrics.lastMeasurement)
    
    // Keep only recent measurements
    if (this.measurements.length > this.maxMeasurements) {
      this.measurements.shift()
    }
  }

  /**
   * Get current performance metrics
   */
  getMetrics(): FilterMetrics {
    return { ...this.metrics }
  }

  /**
   * Get performance summary
   */
  getSummary(): {
    metrics: FilterMetrics
    recommendations: string[]
    score: number
  } {
    const recommendations: string[] = []
    let score = 100
    
    // Check render performance
    if (this.metrics.lastMeasurement?.renderTime && this.metrics.lastMeasurement.renderTime > 16.67) {
      recommendations.push('Optimize render performance - consider React.memo for child components')
      score -= 10
    }
    
    // Check API response time
    if (this.metrics.averageResponseTime > 1000) {
      recommendations.push('API response time is slow - consider caching or optimizing queries')
      score -= 15
    }
    
    // Check interaction latency
    if (this.metrics.lastMeasurement?.interactionLatency && this.metrics.lastMeasurement.interactionLatency > 100) {
      recommendations.push('Interaction latency is high - optimize event handlers')
      score -= 10
    }
    
    // Check rerender count
    if (this.rerenderCount > 50) {
      recommendations.push('High rerender count detected - review component dependencies')
      score -= 20
    }
    
    // Check error rate
    if (this.metrics.errorRate > 0.1) {
      recommendations.push('High error rate detected - improve error handling')
      score -= 15
    }
    
    // Check debounce effectiveness
    if (this.metrics.debounceEffectiveness < 50 && this.debouncedCalls > 10) {
      recommendations.push('Debounce could be more effective - consider increasing delay')
      score -= 5
    }
    
    // Add positive feedback
    if (score === 100) {
      recommendations.push('Excellent performance! All metrics are within optimal ranges.')
    } else if (score >= 80) {
      recommendations.push('Good performance overall with minor optimization opportunities.')
    } else if (score >= 60) {
      recommendations.push('Performance is acceptable but could benefit from optimization.')
    } else {
      recommendations.push('Performance needs attention - follow recommendations above.')
    }
    
    return {
      metrics: this.getMetrics(),
      recommendations,
      score: Math.max(0, score)
    }
  }

  /**
   * Log performance report to console
   */
  logReport(): void {
    const summary = this.getSummary()
    
    console.group('FilterBar Performance Report')
    console.log('Score:', summary.score + '/100')
    console.table({
      'Filter Changes': summary.metrics.filterChangeCount,
      'Avg Response Time': summary.metrics.averageResponseTime.toFixed(2) + 'ms',
      'Error Rate': (summary.metrics.errorRate * 100).toFixed(1) + '%',
      'Debounce Effectiveness': summary.metrics.debounceEffectiveness.toFixed(1) + '%',
      'Rerender Count': this.rerenderCount
    })
    
    if (summary.metrics.lastMeasurement) {
      console.group('Last Measurement')
      console.table({
        'Render Time': summary.metrics.lastMeasurement.renderTime?.toFixed(2) + 'ms',
        'API Response': summary.metrics.lastMeasurement.apiResponseTime?.toFixed(2) + 'ms',
        'Interaction Latency': summary.metrics.lastMeasurement.interactionLatency?.toFixed(2) + 'ms',
        'Memory Usage': summary.metrics.lastMeasurement.memoryUsage 
          ? (summary.metrics.lastMeasurement.memoryUsage / 1024 / 1024).toFixed(2) + 'MB'
          : 'N/A'
      })
      console.groupEnd()
    }
    
    console.group('Recommendations')
    summary.recommendations.forEach((rec, i) => {
      console.log(`${i + 1}. ${rec}`)
    })
    console.groupEnd()
    
    console.groupEnd()
  }

  /**
   * Reset all metrics
   */
  reset(): void {
    this.metrics = {
      filterChangeCount: 0,
      averageResponseTime: 0,
      errorRate: 0,
      debounceEffectiveness: 0,
      lastMeasurement: null
    }
    this.measurements = []
    this.rerenderCount = 0
    this.errorCount = 0
    this.debouncedCalls = 0
    this.actualCalls = 0
  }

  /**
   * Export metrics for external monitoring
   */
  exportMetrics(): string {
    return JSON.stringify({
      timestamp: new Date().toISOString(),
      metrics: this.metrics,
      measurements: this.measurements,
      summary: this.getSummary()
    }, null, 2)
  }
}

// Create singleton instance
const filterPerformanceMonitor = new FilterPerformanceMonitor()

// Export for use in components
export { filterPerformanceMonitor, FilterPerformanceMonitor }
export type { PerformanceMetrics, FilterMetrics }

// Development-only auto-logging
if (process.env.NODE_ENV === 'development') {
  // Log report every 30 seconds if there's activity
  setInterval(() => {
    if (filterPerformanceMonitor.getMetrics().filterChangeCount > 0) {
      filterPerformanceMonitor.logReport()
    }
  }, 30000)
  
  // Log report on page unload
  if (typeof window !== 'undefined') {
    window.addEventListener('beforeunload', () => {
      if (filterPerformanceMonitor.getMetrics().filterChangeCount > 0) {
        console.log('Final performance report:')
        filterPerformanceMonitor.logReport()
      }
    })
  }
}