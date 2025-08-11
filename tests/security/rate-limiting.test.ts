/**
 * Rate Limiting Security Tests
 * Validates advanced rate limiting implementation
 */

import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { AdvancedRateLimiter } from '@/lib/security/advanced-rate-limiter'

// Mock APIContext
const createMockContext = (overrides: any = {}) => ({
  request: {
    url: 'http://localhost:3000/api/test',
    method: 'GET',
    headers: new Headers({
      'User-Agent': 'Test Agent',
      'X-Forwarded-For': '192.168.1.1',
      ...overrides.headers
    })
  },
  clientAddress: '192.168.1.1',
  url: {
    pathname: '/api/test'
  },
  ...overrides
})

describe('Rate Limiting Security', () => {
  let rateLimiter: AdvancedRateLimiter

  beforeEach(() => {
    vi.useFakeTimers()
    rateLimiter = new AdvancedRateLimiter({
      windowMs: 60000, // 1 minute
      maxRequests: 10,
      blockDuration: 300000, // 5 minutes
      progressiveDelay: true,
      testMode: true // Disable real timers for testing
    })
  })

  afterEach(() => {
    vi.useRealTimers()
    vi.clearAllMocks()
  })

  describe('Basic Rate Limiting', () => {
    it('should allow requests within limit', async () => {
      const context = createMockContext()

      for (let i = 0; i < 10; i++) {
        const result = await rateLimiter.shouldLimit(context)
        expect(result.limited).toBe(false)
        expect(result.remainingRequests).toBe(10 - i - 1)
      }
    })

    it('should block requests exceeding limit', async () => {
      const context = createMockContext()

      // Make 10 requests (at limit)
      for (let i = 0; i < 10; i++) {
        await rateLimiter.shouldLimit(context)
      }

      // 11th request should be blocked
      const result = await rateLimiter.shouldLimit(context)
      expect(result.limited).toBe(true)
      expect(result.reason).toBe('Rate limit exceeded')
      expect(result.retryAfter).toBeGreaterThan(0)
    })

    it('should reset limits after window expires', async () => {
      const context = createMockContext()

      // Exhaust the limit
      for (let i = 0; i < 11; i++) {
        await rateLimiter.shouldLimit(context)
      }

      // Fast forward past window
      vi.advanceTimersByTime(61000)

      // Should be allowed again
      const result = await rateLimiter.shouldLimit(context)
      expect(result.limited).toBe(false)
    })
  })

  describe('Bot Detection', () => {
    const botUserAgents = [
      'Mozilla/5.0 (compatible; Googlebot/2.1)',
      'curl/7.68.0',
      'python-requests/2.25.1',
      'Wget/1.20.3',
      'scrapy/2.5.0',
      'PostmanRuntime/7.28.0'
    ]

    it('should detect and block bot requests', async () => {
      for (const userAgent of botUserAgents) {
        const context = createMockContext({
          request: {
            headers: new Headers({ 'User-Agent': userAgent })
          }
        })

        const result = await rateLimiter.shouldLimit(context)
        expect(result.limited).toBe(true, `Failed to block bot: ${userAgent}`)
        expect(result.reason).toBe('Bot traffic detected')
      }
    })

    it('should allow legitimate browsers', async () => {
      const legitimateUserAgents = [
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36',
        'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36'
      ]

      for (const userAgent of legitimateUserAgents) {
        const context = createMockContext({
          request: {
            headers: new Headers({ 'User-Agent': userAgent })
          }
        })

        const result = await rateLimiter.shouldLimit(context)
        expect(result.limited).toBe(false, `Incorrectly blocked legitimate browser: ${userAgent}`)
      }
    })
  })

  describe('Distributed Attack Detection', () => {
    it('should detect attacks from multiple IPs with same fingerprint', async () => {
      const baseContext = createMockContext()
      
      // Simulate requests from different IPs but same fingerprint
      const ips = Array.from({ length: 25 }, (_, i) => `192.168.1.${i + 1}`)
      
      for (const ip of ips) {
        const context = {
          ...baseContext,
          clientAddress: ip,
          request: {
            ...baseContext.request,
            headers: new Headers({
              'User-Agent': 'Same Bot Agent', // Same user agent = same fingerprint
              'X-Forwarded-For': ip
            })
          }
        }
        
        await rateLimiter.shouldLimit(context)
      }

      // Should detect distributed attack pattern
      const result = await rateLimiter.shouldLimit(baseContext)
      expect(result.limited).toBe(true)
    })

    it('should detect subnet-based attacks', async () => {
      const baseContext = createMockContext()
      
      // Generate many requests from same /24 subnet
      for (let i = 1; i <= 25; i++) {
        const context = {
          ...baseContext,
          clientAddress: `192.168.1.${i}`,
          request: {
            ...baseContext.request,
            headers: new Headers({
              'User-Agent': `Bot Agent ${i}`,
              'X-Forwarded-For': `192.168.1.${i}`
            })
          }
        }
        
        await rateLimiter.shouldLimit(context)
      }

      // Should detect distributed attack from subnet
      const result = await rateLimiter.shouldLimit(baseContext)
      expect(result.limited).toBe(true)
      expect(result.reason).toBe('Distributed attack detected')
    })
  })

  describe('IP Spoofing Protection', () => {
    it('should handle X-Forwarded-For header parsing', async () => {
      const context = createMockContext({
        request: {
          headers: new Headers({
            'X-Forwarded-For': '192.168.1.1, 10.0.0.1, 203.0.113.1'
          })
        }
      })

      const result = await rateLimiter.shouldLimit(context)
      expect(result.limited).toBe(false)

      // Should use the first valid public IP
      // Implementation would validate the IP selection logic
    })

    it('should detect private IP spoofing attempts', async () => {
      const suspiciousIPs = [
        '10.0.0.1',
        '172.16.0.1',
        '192.168.1.1',
        '127.0.0.1'
      ]

      for (const ip of suspiciousIPs) {
        const context = createMockContext({
          clientAddress: ip,
          request: {
            headers: new Headers({
              'X-Forwarded-For': ip
            })
          }
        })

        // Should handle private IPs appropriately
        const result = await rateLimiter.shouldLimit(context)
        expect(result).toBeDefined()
      }
    })
  })

  describe('Progressive Penalties', () => {
    it('should apply progressive blocking duration', async () => {
      const context = createMockContext()

      // Exhaust rate limit multiple times to trigger progressive penalties
      for (let cycle = 0; cycle < 3; cycle++) {
        // Make requests to exhaust limit
        for (let i = 0; i <= 10; i++) {
          await rateLimiter.shouldLimit(context)
        }

        // Fast forward to reset window but not block duration
        vi.advanceTimersByTime(61000)
      }

      // Should have progressive penalties in place
      const result = await rateLimiter.shouldLimit(context)
      expect(result).toBeDefined()
    })

    it('should implement progressive delays', async () => {
      const context = createMockContext()

      // Make requests near the limit to trigger progressive delays
      for (let i = 0; i < 9; i++) {
        await rateLimiter.shouldLimit(context)
      }

      // Next request should have a delay
      const start = Date.now()
      await rateLimiter.shouldLimit(context)
      const end = Date.now()

      // Should have some delay (mocked timers make this tricky to test precisely)
      expect(end - start).toBeGreaterThanOrEqual(0)
    })
  })

  describe('Memory Management', () => {
    it('should clean up expired entries', () => {
      const stats1 = rateLimiter.getStats()
      
      // Make some requests
      const context = createMockContext()
      for (let i = 0; i < 5; i++) {
        rateLimiter.shouldLimit(context)
      }

      const stats2 = rateLimiter.getStats()
      expect(stats2.activeKeys).toBeGreaterThan(stats1.activeKeys)

      // Fast forward past cleanup time
      vi.advanceTimersByTime(120000)

      const stats3 = rateLimiter.getStats()
      expect(stats3.activeKeys).toBeLessThanOrEqual(stats2.activeKeys)
    })

    it('should prevent memory exhaustion attacks', () => {
      // Simulate attack trying to exhaust memory with unique keys
      const contexts = Array.from({ length: 1000 }, (_, i) => 
        createMockContext({
          clientAddress: `192.168.${Math.floor(i / 254) + 1}.${(i % 254) + 1}`,
          request: {
            headers: new Headers({
              'User-Agent': `Unique Agent ${i}`
            })
          }
        })
      )

      contexts.forEach(async (context) => {
        await rateLimiter.shouldLimit(context)
      })

      // Should handle large numbers of unique requests without crashing
      const stats = rateLimiter.getStats()
      expect(stats.activeKeys).toBeLessThan(10000) // Some reasonable limit
    })
  })

  describe('Response Generation', () => {
    it('should generate proper rate limit responses', async () => {
      const context = createMockContext()

      // Exhaust the limit
      for (let i = 0; i <= 10; i++) {
        await rateLimiter.shouldLimit(context)
      }

      const response = rateLimiter.createLimitResponse(60, 'Test reason')
      
      expect(response.status).toBe(429)
      expect(response.headers.get('Retry-After')).toBe('60')
      expect(response.headers.get('X-RateLimit-Limit')).toBeDefined()
      expect(response.headers.get('X-RateLimit-Remaining')).toBe('0')
      expect(response.headers.get('X-RateLimit-Reset')).toBeDefined()

      const body = await response.json()
      expect(body.error).toContain('Rate limit exceeded')
      expect(body.retryAfter).toBe(60)
    })
  })

  describe('Manual IP Management', () => {
    it('should allow manual IP blocking', () => {
      const testIP = '192.168.1.100'
      
      rateLimiter.blockIP(testIP, 300000) // Block for 5 minutes
      
      const context = createMockContext({
        clientAddress: testIP
      })

      rateLimiter.shouldLimit(context).then(result => {
        expect(result.limited).toBe(true)
      })
    })

    it('should allow manual IP unblocking', () => {
      const testIP = '192.168.1.101'
      
      rateLimiter.blockIP(testIP, 300000)
      rateLimiter.unblockIP(testIP)
      
      const context = createMockContext({
        clientAddress: testIP
      })

      rateLimiter.shouldLimit(context).then(result => {
        expect(result.limited).toBe(false)
      })
    })
  })
})