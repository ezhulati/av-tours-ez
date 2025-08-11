/**
 * SQL Injection Security Tests
 * Validates protection against SQL injection attacks
 */

import { describe, it, expect } from 'vitest'
import { SecurityValidator } from '@/lib/security/comprehensive-validator'

describe('SQL Injection Protection', () => {
  describe('Classic SQL Injection Payloads', () => {
    const classicPayloads = [
      "' OR '1'='1",
      "' OR 1=1--",
      "' OR 'a'='a",
      "' OR 1=1#",
      "'; --",
      "' OR '1'='1' --",
      "' OR '1'='1' /*",
      "') OR ('1'='1",
      "') OR ('1'='1'--",
      "') OR ('1'='1'/*"
    ]

    it('should detect classic SQL injection attempts', () => {
      classicPayloads.forEach((payload, i) => {
        const isDetected = SecurityValidator.detectSQLInjection(payload)
        if (!isDetected) {
          console.log(`FAILING at index ${i}: "${payload}"`)
        }
        expect(isDetected).toBe(true, `Failed to detect: ${payload}`)
      })
    })

    it('should sanitize classic SQL injection payloads', () => {
      classicPayloads.forEach(payload => {
        const sanitized = SecurityValidator.sanitizeSQL(payload)
        expect(SecurityValidator.detectSQLInjection(sanitized)).toBe(false)
      })
    })
  })

  describe('Union-Based SQL Injection', () => {
    const unionPayloads = [
      "' UNION SELECT null--",
      "' UNION SELECT 1,2,3--",
      "' UNION SELECT username, password FROM users--",
      "' UNION ALL SELECT null,null,null--",
      "1' UNION SELECT @@version--",
      "' UNION SELECT table_name FROM information_schema.tables--",
      "' UNION SELECT column_name FROM information_schema.columns--"
    ]

    it('should detect union-based attacks', () => {
      unionPayloads.forEach(payload => {
        const isDetected = SecurityValidator.detectSQLInjection(payload)
        expect(isDetected).toBe(true, `Failed to detect UNION attack: ${payload}`)
      })
    })

    it('should sanitize union-based attacks', () => {
      unionPayloads.forEach(payload => {
        const sanitized = SecurityValidator.sanitizeSQL(payload)
        expect(sanitized).not.toContain('UNION')
        expect(sanitized).not.toContain('SELECT')
      })
    })
  })

  describe('Time-Based Blind SQL Injection', () => {
    const timeBasedPayloads = [
      "'; WAITFOR DELAY '00:00:10'--",
      "'; IF (1=1) WAITFOR DELAY '00:00:05'--",
      "'; SLEEP(10)--",
      "' AND SLEEP(5)--",
      "'; pg_sleep(10)--",
      "' AND pg_sleep(5)--",
      "'; BENCHMARK(5000000,MD5(1))--",
      "' AND BENCHMARK(5000000,MD5(1))--"
    ]

    it('should detect time-based attacks', () => {
      timeBasedPayloads.forEach(payload => {
        const isDetected = SecurityValidator.detectSQLInjection(payload)
        expect(isDetected).toBe(true, `Failed to detect time-based attack: ${payload}`)
      })
    })

    it('should sanitize time-based attacks', () => {
      timeBasedPayloads.forEach(payload => {
        const sanitized = SecurityValidator.sanitizeSQL(payload)
        expect(sanitized).not.toMatch(/WAITFOR|SLEEP|BENCHMARK/i)
      })
    })
  })

  describe('Error-Based SQL Injection', () => {
    const errorBasedPayloads = [
      "' AND EXTRACTVALUE(1,CONCAT(0x7e,(SELECT version()),0x7e))--",
      "' AND UPDATEXML(1,CONCAT(0x7e,(SELECT user()),0x7e),1)--",
      "' AND (SELECT * FROM (SELECT COUNT(*),CONCAT(version(),FLOOR(RAND(0)*2))x FROM information_schema.tables GROUP BY x)a)--",
      "' AND EXP(~(SELECT * FROM (SELECT user())x))--",
      "'; EXEC xp_cmdshell('dir')--",
      "' AND UTL_INADDR.GET_HOST_NAME((SELECT user FROM dual))--",
      "' AND XMLTYPE(1)--"
    ]

    it('should detect error-based attacks', () => {
      errorBasedPayloads.forEach(payload => {
        const isDetected = SecurityValidator.detectSQLInjection(payload)
        expect(isDetected).toBe(true, `Failed to detect error-based attack: ${payload}`)
      })
    })

    it('should sanitize error-based attacks', () => {
      errorBasedPayloads.forEach(payload => {
        const sanitized = SecurityValidator.sanitizeSQL(payload)
        expect(sanitized).not.toMatch(/EXTRACTVALUE|UPDATEXML|XMLTYPE|UTL_INADDR/i)
      })
    })
  })

  describe('Data Manipulation Attacks', () => {
    const manipulationPayloads = [
      "'; DROP TABLE users--",
      "'; DELETE FROM tours--",
      "'; UPDATE users SET password='hacked'--",
      "'; INSERT INTO users VALUES('hacker','password')--",
      "'; TRUNCATE TABLE logs--",
      "'; ALTER TABLE users ADD COLUMN backdoor TEXT--",
      "'; CREATE TABLE backdoor (id INT, data TEXT)--"
    ]

    it('should detect data manipulation attempts', () => {
      manipulationPayloads.forEach(payload => {
        const isDetected = SecurityValidator.detectSQLInjection(payload)
        expect(isDetected).toBe(true, `Failed to detect manipulation: ${payload}`)
      })
    })

    it('should sanitize data manipulation attempts', () => {
      manipulationPayloads.forEach(payload => {
        const sanitized = SecurityValidator.sanitizeSQL(payload)
        expect(sanitized).not.toMatch(/DROP|DELETE|UPDATE|INSERT|TRUNCATE|ALTER|CREATE/i)
      })
    })
  })

  describe('Second-Order SQL Injection', () => {
    const secondOrderPayloads = [
      "admin'/**/UNION/**/SELECT/**/password/**/FROM/**/users--",
      "test'+UNION+SELECT+null,version(),null--",
      "user'/**/AND/**/1=1--",
      "data'/**/OR/**/SLEEP(5)--"
    ]

    it('should detect second-order injection attempts', () => {
      secondOrderPayloads.forEach(payload => {
        const isDetected = SecurityValidator.detectSQLInjection(payload)
        expect(isDetected).toBe(true, `Failed to detect second-order injection: ${payload}`)
      })
    })
  })

  describe('Encoded and Obfuscated Payloads', () => {
    const obfuscatedPayloads = [
      "' %55NION %53ELECT null--", // URL encoded UNION SELECT
      "' /**/UNION/**/SELECT/**/null--", // Comment obfuscation
      "' UN/**/ION SE/**/LECT null--", // Broken keywords
      "' UNI%4fN SEL%45CT null--", // Mixed encoding
      String.fromCharCode(39, 32, 85, 78, 73, 79, 78, 32, 83, 69, 76, 69, 67, 84), // Character encoding
      "' UNION(SELECT(null))--", // Parentheses obfuscation
      "' /*!UNION*/ /*!SELECT*/ null--", // MySQL version comments
      "' +UNION+SELECT+null--" // Plus obfuscation
    ]

    it('should detect obfuscated injection attempts', () => {
      obfuscatedPayloads.forEach(payload => {
        const decoded = decodeURIComponent(payload)
        const isDetected = SecurityValidator.detectSQLInjection(decoded)
        expect(isDetected).toBe(true, `Failed to detect obfuscated injection: ${payload}`)
      })
    })
  })

  describe('Database-Specific Payloads', () => {
    describe('MySQL Specific', () => {
      const mysqlPayloads = [
        "' AND @@version--",
        "' UNION SELECT @@datadir--",
        "' AND LOAD_FILE('/etc/passwd')--",
        "' INTO OUTFILE '/tmp/backdoor.php'--",
        "' AND IF(1=1,SLEEP(5),0)--"
      ]

      it('should detect MySQL-specific attacks', () => {
        mysqlPayloads.forEach(payload => {
          const isDetected = SecurityValidator.detectSQLInjection(payload)
          expect(isDetected).toBe(true, `Failed to detect MySQL attack: ${payload}`)
        })
      })
    })

    describe('PostgreSQL Specific', () => {
      const postgresPayloads = [
        "'; COPY users TO '/tmp/users.txt'--",
        "' AND version()--",
        "'; CREATE OR REPLACE FUNCTION backdoor()--",
        "' AND pg_read_file('/etc/passwd')--"
      ]

      it('should detect PostgreSQL-specific attacks', () => {
        postgresPayloads.forEach(payload => {
          const isDetected = SecurityValidator.detectSQLInjection(payload)
          expect(isDetected).toBe(true, `Failed to detect PostgreSQL attack: ${payload}`)
        })
      })
    })

    describe('SQL Server Specific', () => {
      const sqlServerPayloads = [
        "'; EXEC xp_cmdshell('whoami')--",
        "' AND @@servername--",
        "'; BULK INSERT backdoor FROM 'c:\\temp\\data.txt'--",
        "' AND HAS_DBACCESS('master')--"
      ]

      it('should detect SQL Server-specific attacks', () => {
        sqlServerPayloads.forEach(payload => {
          const isDetected = SecurityValidator.detectSQLInjection(payload)
          expect(isDetected).toBe(true, `Failed to detect SQL Server attack: ${payload}`)
        })
      })
    })
  })

  describe('NoSQL Injection Variants', () => {
    const nosqlPayloads = [
      "'; db.users.drop(); //",
      "' || db.users.find() || '",
      "'; this.password = 'hacked'; //",
      "$where: 'this.password.length > 0'",
      "{ $ne: null }",
      "{ $regex: '.*' }",
      "'; db.eval('malicious code'); //"
    ]

    it('should detect NoSQL injection patterns', () => {
      nosqlPayloads.forEach(payload => {
        // While primarily focused on SQL, some patterns overlap
        const scan = SecurityValidator.securityScan(payload)
        expect(scan.threats.length).toBeGreaterThan(0, `Failed to detect potential NoSQL attack: ${payload}`)
      })
    })
  })

  describe('Legitimate Content Protection', () => {
    const legitimateInputs = [
      "John's Bakery",
      "It's a beautiful day",
      "The price is $50-100",
      "Contact us at info@example.com",
      "Address: 123 Main St.",
      "Description: A wonderful tour",
      "Review: 'Amazing experience!'",
      "Note: See details below",
      "Question: What's included?",
      "Answer: Everything you need"
    ]

    it('should not flag legitimate content', () => {
      legitimateInputs.forEach(input => {
        const isDetected = SecurityValidator.detectSQLInjection(input)
        expect(isDetected).toBe(false, `False positive for legitimate input: ${input}`)
      })
    })

    it('should preserve legitimate apostrophes and quotes', () => {
      legitimateInputs.forEach(input => {
        const sanitized = SecurityValidator.sanitizeSQL(input)
        // Should still be readable and meaningful
        expect(sanitized.length).toBeGreaterThan(0)
        expect(sanitized).not.toBe('')
      })
    })
  })

  describe('Edge Cases and Boundary Tests', () => {
    it('should handle empty and null inputs', () => {
      expect(SecurityValidator.detectSQLInjection('')).toBe(false)
      expect(SecurityValidator.detectSQLInjection(null as any)).toBe(false)
      expect(SecurityValidator.detectSQLInjection(undefined as any)).toBe(false)
    })

    it('should handle very long inputs', () => {
      const longPayload = "' OR '1'='1".repeat(1000)
      const isDetected = SecurityValidator.detectSQLInjection(longPayload)
      expect(isDetected).toBe(true)
    })

    it('should handle special characters', () => {
      const specialChars = "!@#$%^&*()_+-=[]{}|;:,.<>?"
      const isDetected = SecurityValidator.detectSQLInjection(specialChars)
      expect(isDetected).toBe(false)
    })

    it('should handle unicode characters', () => {
      const unicodeInput = "café résumé naïve"
      const isDetected = SecurityValidator.detectSQLInjection(unicodeInput)
      expect(isDetected).toBe(false)
    })
  })

  describe('Comprehensive Security Scan Integration', () => {
    it('should integrate SQL injection detection into comprehensive scan', () => {
      const maliciousPayload = "'; DROP TABLE users; --<script>alert('XSS')</script>"
      
      const scan = SecurityValidator.securityScan(maliciousPayload)
      
      expect(scan.safe).toBe(false)
      expect(scan.threats).toContain('SQL_INJECTION')
      expect(scan.threats).toContain('XSS')
      expect(scan.sanitized).toBeDefined()
      expect(SecurityValidator.detectSQLInjection(scan.sanitized)).toBe(false)
    })
  })
})