/**
 * Encryption Utilities for PII Protection
 * Implements field-level encryption for sensitive data
 */

import crypto from 'crypto'

// Encryption configuration
const ALGORITHM = 'aes-256-gcm'
const SALT_LENGTH = 32
const TAG_LENGTH = 16
const IV_LENGTH = 16
const KEY_LENGTH = 32
const ITERATIONS = 100000

/**
 * Get or generate encryption key from environment
 */
function getEncryptionKey(): Buffer {
  const key = import.meta.env.ENCRYPTION_KEY || process.env.ENCRYPTION_KEY
  
  if (!key) {
    if (import.meta.env.PROD) {
      throw new Error('ENCRYPTION_KEY environment variable is required in production')
    }
    // Use a default key for development only
    console.warn('Using default encryption key for development')
    return Buffer.from('development-key-do-not-use-in-production-ever!!').subarray(0, KEY_LENGTH)
  }
  
  // Derive key from password using PBKDF2
  const salt = Buffer.from(import.meta.env.ENCRYPTION_SALT || 'default-salt', 'utf-8')
  return crypto.pbkdf2Sync(key, salt, ITERATIONS, KEY_LENGTH, 'sha256')
}

/**
 * Encrypt sensitive data
 */
export function encrypt(text: string): string {
  try {
    const key = getEncryptionKey()
    const iv = crypto.randomBytes(IV_LENGTH)
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv)
    
    const encrypted = Buffer.concat([
      cipher.update(text, 'utf8'),
      cipher.final()
    ])
    
    const tag = cipher.getAuthTag()
    
    // Combine iv + tag + encrypted data
    const combined = Buffer.concat([iv, tag, encrypted])
    
    return combined.toString('base64')
  } catch (error) {
    console.error('Encryption error:', error)
    throw new Error('Failed to encrypt data')
  }
}

/**
 * Decrypt sensitive data
 */
export function decrypt(encryptedText: string): string {
  try {
    const key = getEncryptionKey()
    const combined = Buffer.from(encryptedText, 'base64')
    
    // Extract components
    const iv = combined.subarray(0, IV_LENGTH)
    const tag = combined.subarray(IV_LENGTH, IV_LENGTH + TAG_LENGTH)
    const encrypted = combined.subarray(IV_LENGTH + TAG_LENGTH)
    
    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv)
    decipher.setAuthTag(tag)
    
    const decrypted = Buffer.concat([
      decipher.update(encrypted),
      decipher.final()
    ])
    
    return decrypted.toString('utf8')
  } catch (error) {
    console.error('Decryption error:', error)
    throw new Error('Failed to decrypt data')
  }
}

/**
 * Hash data for comparison (one-way)
 */
export function hash(text: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH)
  const hash = crypto.pbkdf2Sync(text, salt, ITERATIONS, 64, 'sha512')
  return salt.toString('hex') + ':' + hash.toString('hex')
}

/**
 * Verify hashed data
 */
export function verifyHash(text: string, hashedText: string): boolean {
  const [salt, originalHash] = hashedText.split(':')
  const hash = crypto.pbkdf2Sync(text, Buffer.from(salt, 'hex'), ITERATIONS, 64, 'sha512')
  return crypto.timingSafeEqual(Buffer.from(originalHash, 'hex'), hash)
}

/**
 * Mask sensitive data for display
 */
export function mask(text: string, type: 'email' | 'phone' | 'custom' = 'custom'): string {
  if (!text) return ''
  
  switch (type) {
    case 'email': {
      const [local, domain] = text.split('@')
      if (!domain) return '***'
      const maskedLocal = local.substring(0, 2) + '***'
      return `${maskedLocal}@${domain}`
    }
    
    case 'phone': {
      const digits = text.replace(/\D/g, '')
      if (digits.length < 4) return '***'
      return '***' + digits.substring(digits.length - 4)
    }
    
    case 'custom':
    default: {
      if (text.length <= 4) return '***'
      return text.substring(0, 2) + '***' + text.substring(text.length - 2)
    }
  }
}

/**
 * Anonymize IP address for GDPR compliance
 */
export function anonymizeIP(ip: string): string {
  if (!ip) return ''
  
  // IPv4
  if (ip.includes('.')) {
    const parts = ip.split('.')
    if (parts.length === 4) {
      parts[3] = '0' // Zero out last octet
      return parts.join('.')
    }
  }
  
  // IPv6
  if (ip.includes(':')) {
    const parts = ip.split(':')
    if (parts.length >= 4) {
      // Zero out last 4 segments
      for (let i = parts.length - 4; i < parts.length; i++) {
        if (i >= 0) parts[i] = '0'
      }
      return parts.join(':')
    }
  }
  
  return '0.0.0.0'
}

/**
 * Generate secure random tokens
 */
export function generateSecureToken(length: number = 32): string {
  return crypto.randomBytes(length).toString('hex')
}

/**
 * Encrypt an object's sensitive fields
 */
export function encryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToEncrypt: (keyof T)[]
): T {
  const encrypted = { ...obj }
  
  for (const field of fieldsToEncrypt) {
    if (encrypted[field] !== undefined && encrypted[field] !== null) {
      encrypted[field] = encrypt(String(encrypted[field])) as T[keyof T]
    }
  }
  
  return encrypted
}

/**
 * Decrypt an object's encrypted fields
 */
export function decryptObject<T extends Record<string, any>>(
  obj: T,
  fieldsToDecrypt: (keyof T)[]
): T {
  const decrypted = { ...obj }
  
  for (const field of fieldsToDecrypt) {
    if (decrypted[field] !== undefined && decrypted[field] !== null) {
      try {
        decrypted[field] = decrypt(String(decrypted[field])) as T[keyof T]
      } catch (error) {
        console.error(`Failed to decrypt field ${String(field)}:`, error)
        decrypted[field] = '' as T[keyof T]
      }
    }
  }
  
  return decrypted
}

/**
 * Redact PII from logs
 */
export function redactPII(text: string): string {
  // Email addresses
  text = text.replace(/\b[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\.[A-Z|a-z]{2,}\b/g, '[EMAIL]')
  
  // Phone numbers (various formats)
  text = text.replace(/(\+?\d{1,3}[-.\s]?)?\(?\d{1,4}\)?[-.\s]?\d{1,4}[-.\s]?\d{1,9}/g, '[PHONE]')
  
  // Credit card numbers
  text = text.replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, '[CREDIT_CARD]')
  
  // Social Security Numbers
  text = text.replace(/\b\d{3}-\d{2}-\d{4}\b/g, '[SSN]')
  
  // IP addresses
  text = text.replace(/\b(?:\d{1,3}\.){3}\d{1,3}\b/g, '[IP]')
  
  return text
}

/**
 * Create a data retention policy handler
 */
export class DataRetention {
  private retentionPeriods: Map<string, number> = new Map([
    ['inquiries', 90 * 24 * 60 * 60 * 1000], // 90 days
    ['clicks', 30 * 24 * 60 * 60 * 1000], // 30 days
    ['sessions', 7 * 24 * 60 * 60 * 1000], // 7 days
    ['logs', 30 * 24 * 60 * 60 * 1000], // 30 days
  ])
  
  /**
   * Check if data should be retained
   */
  shouldRetain(dataType: string, createdAt: Date): boolean {
    const retention = this.retentionPeriods.get(dataType)
    if (!retention) return true // No policy, retain by default
    
    const age = Date.now() - createdAt.getTime()
    return age < retention
  }
  
  /**
   * Get retention period for data type
   */
  getRetentionPeriod(dataType: string): number | undefined {
    return this.retentionPeriods.get(dataType)
  }
  
  /**
   * Set custom retention period
   */
  setRetentionPeriod(dataType: string, periodMs: number): void {
    this.retentionPeriods.set(dataType, periodMs)
  }
}

/**
 * GDPR compliance utilities
 */
export const gdpr = {
  /**
   * Prepare data for export (right to data portability)
   */
  prepareDataExport(data: any[]): string {
    const sanitized = data.map(item => {
      const copy = { ...item }
      // Remove internal fields
      delete copy.id
      delete copy.created_at
      delete copy.updated_at
      delete copy._internal
      return copy
    })
    
    return JSON.stringify(sanitized, null, 2)
  },
  
  /**
   * Anonymize user data (right to be forgotten)
   */
  anonymizeUserData(data: Record<string, any>): Record<string, any> {
    return {
      ...data,
      name: 'DELETED',
      email: 'deleted@deleted.com',
      phone: null,
      ip_address: '0.0.0.0',
      user_agent: 'DELETED',
      // Keep non-PII fields for analytics
      created_at: data.created_at,
      tour_id: data.tour_id,
      utm_source: data.utm_source,
      utm_medium: data.utm_medium
    }
  },
  
  /**
   * Check consent for data processing
   */
  hasConsent(consentData: any, purpose: string): boolean {
    if (!consentData) return false
    return consentData[purpose] === true && 
           consentData.timestamp && 
           Date.now() - consentData.timestamp < 365 * 24 * 60 * 60 * 1000 // 1 year
  }
}

export default {
  encrypt,
  decrypt,
  hash,
  verifyHash,
  mask,
  anonymizeIP,
  generateSecureToken,
  encryptObject,
  decryptObject,
  redactPII,
  DataRetention,
  gdpr
}