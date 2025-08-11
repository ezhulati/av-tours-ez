/**
 * Input Validation Security Tests
 * Validates comprehensive input validation and sanitization
 */

import { describe, it, expect } from 'vitest'
import { SecurityValidator, secureSchemas, secureTransforms } from '@/lib/security/comprehensive-validator'

describe('Input Validation Security', () => {
  describe('SQL Injection Detection', () => {
    const sqlInjectionPayloads = [
      "'; DROP TABLE users; --",
      "' OR '1'='1",
      "' UNION SELECT * FROM users --",
      "'; DELETE FROM tours; --",
      "admin'--",
      "admin'/*",
      "' OR 1=1#",
      "1'; EXEC xp_cmdshell('dir'); --",
      "'; WAITFOR DELAY '00:00:10'; --",
      "1' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version()),0x7e))"
    ]

    it('should detect SQL injection attempts', () => {
      sqlInjectionPayloads.forEach(payload => {
        const isDetected = SecurityValidator.detectSQLInjection(payload)
        expect(isDetected).toBe(true, `Failed to detect SQL injection: ${payload}`)
      })
    })

    it('should sanitize SQL injection payloads', () => {
      sqlInjectionPayloads.forEach(payload => {
        const sanitized = SecurityValidator.sanitizeSQL(payload)
        expect(sanitized).not.toContain('DROP')
        expect(sanitized).not.toContain('UNION')
        expect(sanitized).not.toContain('DELETE')
        expect(sanitized).not.toContain('--')
        expect(SecurityValidator.detectSQLInjection(sanitized)).toBe(false)
      })
    })

    it('should preserve safe SQL-like text', () => {
      const safeInputs = [
        "John's Restaurant",
        "It's a beautiful day",
        "Price: $50-100",
        "Contact us at info@example.com"
      ]

      safeInputs.forEach(input => {
        const isDetected = SecurityValidator.detectSQLInjection(input)
        expect(isDetected).toBe(false, `False positive for safe input: ${input}`)
      })
    })
  })

  describe('XSS Detection and Prevention', () => {
    const xssPayloads = [
      '<script>alert("XSS")</script>',
      '<img src="x" onerror="alert(1)">',
      'javascript:alert("XSS")',
      '<svg onload="alert(1)">',
      '<iframe src="javascript:alert(1)"></iframe>',
      '<body onload="alert(1)">',
      '<link rel="stylesheet" href="javascript:alert(1)">',
      '<meta http-equiv="refresh" content="0;url=javascript:alert(1)">',
      '<object data="javascript:alert(1)">',
      '<embed src="javascript:alert(1)">',
      '<applet code="javascript:alert(1)">',
      '<form><input type="image" src="javascript:alert(1)"></form>',
      'data:text/html,<script>alert(1)</script>',
      '<script src="data:text/javascript,alert(1)"></script>',
      '<style>@import "javascript:alert(1)"</style>'
    ]

    it('should detect XSS attempts', () => {
      xssPayloads.forEach(payload => {
        const isDetected = SecurityValidator.detectXSS(payload)
        expect(isDetected).toBe(true, `Failed to detect XSS: ${payload}`)
      })
    })

    it('should sanitize XSS payloads', () => {
      xssPayloads.forEach(payload => {
        const sanitized = SecurityValidator.sanitizeXSS(payload)
        expect(sanitized).not.toMatch(/<script[^>]*>/i)
        expect(sanitized).not.toMatch(/javascript:/i)
        expect(sanitized).not.toMatch(/on\w+\s*=/i)
        expect(SecurityValidator.detectXSS(sanitized)).toBe(false)
      })
    })

    it('should preserve safe HTML-like content', () => {
      const safeInputs = [
        'Visit our website at www.example.com',
        'Email: contact@example.com',
        'Price: <$100',
        'Use > and < symbols for comparisons'
      ]

      safeInputs.forEach(input => {
        const sanitized = SecurityValidator.sanitizeXSS(input)
        expect(sanitized).toBeDefined()
        expect(SecurityValidator.detectXSS(sanitized)).toBe(false)
      })
    })
  })

  describe('Path Traversal Detection', () => {
    const pathTraversalPayloads = [
      '../../../../etc/passwd',
      '..\\..\\..\\windows\\system32',
      '%2e%2e%2f%2e%2e%2f%2e%2e%2fetc%2fpasswd',
      '....//....//....//etc/passwd',
      '..%252f..%252f..%252fetc%252fpasswd',
      '..%c0%af..%c0%af..%c0%afetc%c0%afpasswd',
      '..%5c..%5c..%5cetc%5cpasswd'
    ]

    it('should detect path traversal attempts', () => {
      pathTraversalPayloads.forEach(payload => {
        const isDetected = SecurityValidator.detectPathTraversal(payload)
        expect(isDetected).toBe(true, `Failed to detect path traversal: ${payload}`)
      })
    })

    it('should sanitize path traversal payloads', () => {
      pathTraversalPayloads.forEach(payload => {
        const sanitized = SecurityValidator.sanitizePath(payload)
        expect(sanitized).not.toContain('..')
        expect(SecurityValidator.detectPathTraversal(sanitized)).toBe(false)
      })
    })
  })

  describe('Command Injection Detection', () => {
    const commandInjectionPayloads = [
      '; ls -la',
      '| cat /etc/passwd',
      '&& rm -rf /',
      '`whoami`',
      '$(id)',
      '; ping evil.com',
      '|| curl evil.com',
      '& netstat -an'
    ]

    it('should detect command injection attempts', () => {
      commandInjectionPayloads.forEach(payload => {
        const isDetected = SecurityValidator.detectCommandInjection(payload)
        expect(isDetected).toBe(true, `Failed to detect command injection: ${payload}`)
      })
    })

    it('should sanitize command injection payloads', () => {
      commandInjectionPayloads.forEach(payload => {
        const sanitized = SecurityValidator.sanitizeCommand(payload)
        expect(sanitized).not.toMatch(/[;&|`$]/g)
        expect(SecurityValidator.detectCommandInjection(sanitized)).toBe(false)
      })
    })
  })

  describe('Comprehensive Security Scan', () => {
    it('should detect multiple threat types', () => {
      const multiThreatPayload = `'; DROP TABLE users; --<script>alert("XSS")</script>../../../../etc/passwd`
      
      const scan = SecurityValidator.securityScan(multiThreatPayload)
      
      expect(scan.safe).toBe(false)
      expect(scan.threats).toContain('SQL_INJECTION')
      expect(scan.threats).toContain('XSS')
      expect(scan.threats).toContain('PATH_TRAVERSAL')
      expect(scan.sanitized).toBeDefined()
    })

    it('should pass safe content', () => {
      const safeContent = 'Hello world! This is a safe message.'
      
      const scan = SecurityValidator.securityScan(safeContent)
      
      if (!scan.safe) {
        console.log('Unexpected threats detected:', scan.threats)
      }
      
      expect(scan.safe).toBe(true)
      expect(scan.threats).toHaveLength(0)
      expect(scan.sanitized).toBe(safeContent)
    })
  })

  describe('Secure Schema Validation', () => {
    it('should validate and sanitize secure strings', () => {
      const schema = secureSchemas.secureString(1, 50)
      
      const safeInput = 'Hello world'
      const result = schema.parse(safeInput)
      expect(result).toBe(safeInput)
      
      expect(() => {
        schema.parse('<script>alert("XSS")</script>')
      }).toThrow()
    })

    it('should validate secure emails', () => {
      const schema = secureSchemas.secureEmail()
      
      const validEmail = 'test@example.com'
      const result = schema.parse(validEmail)
      expect(result).toBe(validEmail.toLowerCase())
      
      expect(() => {
        schema.parse('invalid-email')
      }).toThrow()
      
      expect(() => {
        schema.parse('<script>alert(1)</script>@evil.com')
      }).toThrow()
    })

    it('should validate secure URLs', () => {
      const schema = secureSchemas.secureURL()
      
      const validUrl = 'https://example.com'
      const result = schema.parse(validUrl)
      expect(result).toBe(validUrl)
      
      expect(() => {
        schema.parse('javascript:alert(1)')
      }).toThrow()
      
      expect(() => {
        schema.parse('http://evil.com/<script>alert(1)</script>')
      }).toThrow()
    })

    it('should validate secure slugs', () => {
      const schema = secureSchemas.secureSlug()
      
      const validSlug = 'valid-slug-123'
      const result = schema.parse(validSlug)
      expect(result).toBe(validSlug)
      
      expect(() => {
        schema.parse('Invalid Slug!')
      }).toThrow()
      
      expect(() => {
        schema.parse('../../../etc/passwd')
      }).toThrow()
    })
  })

  describe('Data Type Validation', () => {
    it('should validate phone numbers securely', () => {
      const validPhones = ['+1234567890', '123-456-7890', '(123) 456-7890']
      const invalidPhones = ['<script>alert(1)</script>', 'DROP TABLE users', '../../../etc/passwd']
      
      validPhones.forEach(phone => {
        const result = SecurityValidator.validateSecurePhone(phone)
        if (!result) {
          console.log(`Phone validation failed for: "${phone}"`)
        }
        expect(result).toBe(true)
      })
      
      invalidPhones.forEach(phone => {
        expect(SecurityValidator.validateSecurePhone(phone)).toBe(false)
      })
    })

    it('should validate URLs securely', () => {
      const validUrls = ['https://example.com', 'http://localhost:3000']
      const invalidUrls = [
        'javascript:alert(1)',
        'data:text/html,<script>alert(1)</script>',
        'ftp://evil.com',
        'https://evil.com/<script>alert(1)</script>'
      ]
      
      validUrls.forEach(url => {
        expect(SecurityValidator.validateSecureURL(url)).toBe(true)
      })
      
      invalidUrls.forEach(url => {
        expect(SecurityValidator.validateSecureURL(url)).toBe(false)
      })
    })
  })

  describe('Edge Cases and Bypasses', () => {
    it('should handle null and undefined inputs', () => {
      expect(SecurityValidator.securityScan('')).toEqual({
        safe: true,
        threats: [],
        sanitized: ''
      })
      
      expect(() => SecurityValidator.securityScan(null as any)).not.toThrow()
      expect(() => SecurityValidator.securityScan(undefined as any)).not.toThrow()
    })

    it('should handle encoded payloads', () => {
      const encodedXSS = '%3Cscript%3Ealert%281%29%3C%2Fscript%3E'
      const decodedXSS = decodeURIComponent(encodedXSS)
      
      const scan = SecurityValidator.securityScan(decodedXSS)
      expect(scan.safe).toBe(false)
      expect(scan.threats).toContain('XSS')
    })

    it('should handle mixed case evasion attempts', () => {
      const mixedCaseXSS = '<ScRiPt>AlErT(1)</ScRiPt>'
      const scan = SecurityValidator.securityScan(mixedCaseXSS)
      expect(scan.safe).toBe(false)
      expect(scan.threats).toContain('XSS')
    })

    it('should handle unicode and special characters', () => {
      const unicodePayload = '\u003cscript\u003ealert(1)\u003c/script\u003e'
      const scan = SecurityValidator.securityScan(unicodePayload)
      expect(scan.safe).toBe(false)
    })
  })
})