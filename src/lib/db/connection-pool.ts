/**
 * Database Connection Pool Manager
 * Optimized connection pooling for Supabase with monitoring
 */

import { createClient, SupabaseClient } from '@supabase/supabase-js'

interface PoolConfig {
  minConnections: number
  maxConnections: number
  idleTimeout: number
  connectionTimeout: number
  statementTimeout: number
  keepAlive: boolean
  keepAliveInterval: number
}

interface ConnectionStats {
  activeConnections: number
  idleConnections: number
  totalConnections: number
  waitingRequests: number
  connectionErrors: number
  averageResponseTime: number
  p99ResponseTime: number
}

class ConnectionPool {
  private clients: Map<string, { client: SupabaseClient; lastUsed: number; inUse: boolean }>
  private config: PoolConfig
  private stats: ConnectionStats
  private responseTimeBuffer: number[] = []
  private cleanupInterval: NodeJS.Timeout | null = null
  private healthCheckInterval: NodeJS.Timeout | null = null

  constructor(config: Partial<PoolConfig> = {}) {
    this.config = {
      minConnections: 2,
      maxConnections: 10,
      idleTimeout: 30000, // 30 seconds
      connectionTimeout: 5000, // 5 seconds
      statementTimeout: 10000, // 10 seconds
      keepAlive: true,
      keepAliveInterval: 60000, // 1 minute
      ...config
    }

    this.clients = new Map()
    this.stats = {
      activeConnections: 0,
      idleConnections: 0,
      totalConnections: 0,
      waitingRequests: 0,
      connectionErrors: 0,
      averageResponseTime: 0,
      p99ResponseTime: 0
    }

    this.initialize()
  }

  private initialize(): void {
    // Create minimum connections
    for (let i = 0; i < this.config.minConnections; i++) {
      this.createConnection()
    }

    // Start cleanup interval
    if (typeof setInterval !== 'undefined') {
      this.cleanupInterval = setInterval(() => this.cleanup(), 10000)
      
      if (this.config.keepAlive) {
        this.healthCheckInterval = setInterval(
          () => this.performHealthCheck(),
          this.config.keepAliveInterval
        )
      }
    }
  }

  private createConnection(): SupabaseClient | null {
    if (this.clients.size >= this.config.maxConnections) {
      return null
    }

    const url = process.env.SUPABASE_URL!
    const key = process.env.SUPABASE_SERVICE_ROLE_KEY!

    const client = createClient(url, key, {
      auth: {
        persistSession: false,
        autoRefreshToken: false
      },
      global: {
        fetch: this.createOptimizedFetch(),
      },
      db: {
        schema: 'public'
      }
    })

    const connectionId = `conn_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
    this.clients.set(connectionId, {
      client,
      lastUsed: Date.now(),
      inUse: false
    })

    this.stats.totalConnections++
    this.stats.idleConnections++

    return client
  }

  private createOptimizedFetch(): typeof fetch {
    return async (url: RequestInfo | URL, init?: RequestInit) => {
      const startTime = performance.now()
      const controller = new AbortController()
      const timeoutId = setTimeout(
        () => controller.abort(),
        this.config.connectionTimeout
      )

      try {
        const response = await fetch(url, {
          ...init,
          signal: controller.signal,
          // Add compression headers
          headers: {
            ...init?.headers,
            'Accept-Encoding': 'gzip, deflate, br',
          }
        })

        const responseTime = performance.now() - startTime
        this.recordResponseTime(responseTime)

        return response
      } catch (error) {
        this.stats.connectionErrors++
        throw error
      } finally {
        clearTimeout(timeoutId)
      }
    }
  }

  async getConnection(): Promise<SupabaseClient> {
    // Find available connection
    for (const [id, conn] of this.clients.entries()) {
      if (!conn.inUse) {
        conn.inUse = true
        conn.lastUsed = Date.now()
        this.stats.activeConnections++
        this.stats.idleConnections--
        return conn.client
      }
    }

    // Create new connection if under limit
    if (this.clients.size < this.config.maxConnections) {
      const newClient = this.createConnection()
      if (newClient) {
        // Mark as in use
        for (const [id, conn] of this.clients.entries()) {
          if (conn.client === newClient) {
            conn.inUse = true
            this.stats.activeConnections++
            this.stats.idleConnections--
            break
          }
        }
        return newClient
      }
    }

    // Wait for available connection
    this.stats.waitingRequests++
    return this.waitForConnection()
  }

  private async waitForConnection(): Promise<SupabaseClient> {
    const maxWaitTime = this.config.connectionTimeout
    const startTime = Date.now()

    while (Date.now() - startTime < maxWaitTime) {
      for (const [id, conn] of this.clients.entries()) {
        if (!conn.inUse) {
          conn.inUse = true
          conn.lastUsed = Date.now()
          this.stats.activeConnections++
          this.stats.idleConnections--
          this.stats.waitingRequests--
          return conn.client
        }
      }
      
      // Wait a bit before checking again
      await new Promise(resolve => setTimeout(resolve, 10))
    }

    throw new Error('Connection timeout: No available connections')
  }

  releaseConnection(client: SupabaseClient): void {
    for (const [id, conn] of this.clients.entries()) {
      if (conn.client === client) {
        conn.inUse = false
        conn.lastUsed = Date.now()
        this.stats.activeConnections--
        this.stats.idleConnections++
        break
      }
    }
  }

  private cleanup(): void {
    const now = Date.now()
    const toRemove: string[] = []

    for (const [id, conn] of this.clients.entries()) {
      if (!conn.inUse && 
          now - conn.lastUsed > this.config.idleTimeout &&
          this.clients.size > this.config.minConnections) {
        toRemove.push(id)
      }
    }

    for (const id of toRemove) {
      this.clients.delete(id)
      this.stats.totalConnections--
      this.stats.idleConnections--
    }
  }

  private async performHealthCheck(): Promise<void> {
    for (const [id, conn] of this.clients.entries()) {
      if (!conn.inUse) {
        try {
          // Perform a simple query to keep connection alive
          await conn.client.from('tours').select('id').limit(1)
          conn.lastUsed = Date.now()
        } catch (error) {
          console.error(`Health check failed for connection ${id}:`, error)
          // Remove unhealthy connection
          this.clients.delete(id)
          this.stats.totalConnections--
          this.stats.idleConnections--
          
          // Create replacement if below minimum
          if (this.clients.size < this.config.minConnections) {
            this.createConnection()
          }
        }
      }
    }
  }

  private recordResponseTime(time: number): void {
    this.responseTimeBuffer.push(time)
    
    // Keep only last 1000 response times
    if (this.responseTimeBuffer.length > 1000) {
      this.responseTimeBuffer.shift()
    }

    // Calculate statistics
    if (this.responseTimeBuffer.length > 0) {
      const sorted = [...this.responseTimeBuffer].sort((a, b) => a - b)
      this.stats.averageResponseTime = 
        sorted.reduce((a, b) => a + b, 0) / sorted.length
      
      const p99Index = Math.floor(sorted.length * 0.99)
      this.stats.p99ResponseTime = sorted[p99Index] || sorted[sorted.length - 1]
    }
  }

  async execute<T>(
    fn: (client: SupabaseClient) => Promise<T>
  ): Promise<T> {
    const client = await this.getConnection()
    const startTime = performance.now()

    try {
      const result = await fn(client)
      const responseTime = performance.now() - startTime
      this.recordResponseTime(responseTime)
      return result
    } finally {
      this.releaseConnection(client)
    }
  }

  getStats(): ConnectionStats {
    return { ...this.stats }
  }

  async destroy(): Promise<void> {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval)
    }
    if (this.healthCheckInterval) {
      clearInterval(this.healthCheckInterval)
    }

    // Close all connections
    this.clients.clear()
  }
}

// Create singleton pool instance
const connectionPool = new ConnectionPool({
  minConnections: parseInt(process.env.DB_MIN_CONNECTIONS || '2'),
  maxConnections: parseInt(process.env.DB_MAX_CONNECTIONS || '10'),
  idleTimeout: parseInt(process.env.DB_IDLE_TIMEOUT || '30000'),
  connectionTimeout: parseInt(process.env.DB_CONNECTION_TIMEOUT || '5000'),
  statementTimeout: parseInt(process.env.DB_STATEMENT_TIMEOUT || '10000'),
  keepAlive: process.env.DB_KEEP_ALIVE !== 'false',
  keepAliveInterval: parseInt(process.env.DB_KEEP_ALIVE_INTERVAL || '60000')
})

export { connectionPool, ConnectionPool, type ConnectionStats }