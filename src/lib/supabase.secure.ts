/**
 * Secure Supabase Client Configuration
 * Implements proper separation of concerns for client/server access
 */

import { createClient } from '@supabase/supabase-js'
import type { SupabaseClient } from '@supabase/supabase-js'

/**
 * Get Supabase URL from environment
 */
function getSupabaseUrl(): string {
  const url = import.meta.env.PUBLIC_SUPABASE_URL || import.meta.env.SUPABASE_URL
  if (!url) {
    throw new Error('Missing SUPABASE_URL environment variable')
  }
  return url
}

/**
 * Create public Supabase client (for client-side usage)
 * Uses anon key which respects RLS policies
 */
export function createPublicClient(): SupabaseClient {
  const url = getSupabaseUrl()
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY
  
  if (!anonKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable')
  }
  
  return createClient(url, anonKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
      detectSessionInUrl: false
    },
    global: {
      headers: {
        'X-Client-Info': 'albaniavisit-tours'
      }
    },
    db: {
      schema: 'public'
    }
  })
}

/**
 * Create server Supabase client (for server-side usage only)
 * Uses service role key which bypasses RLS
 * CRITICAL: Never expose this to client-side code
 */
export function createServerClient(): SupabaseClient {
  // Only allow in server context
  if (typeof window !== 'undefined') {
    throw new Error('Server client cannot be used in browser context')
  }
  
  const url = getSupabaseUrl()
  const serviceKey = import.meta.env.SUPABASE_SERVICE_ROLE_KEY
  
  if (!serviceKey) {
    throw new Error('Missing SUPABASE_SERVICE_ROLE_KEY environment variable')
  }
  
  // Additional check to ensure we're not in development with a production key
  if (import.meta.env.DEV && serviceKey.includes('prod')) {
    console.warn('WARNING: Using production service key in development environment')
  }
  
  return createClient(url, serviceKey, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    global: {
      headers: {
        'X-Client-Info': 'albaniavisit-tours-server'
      }
    },
    db: {
      schema: 'public'
    }
  })
}

/**
 * Create authenticated client with user session
 * For future use when user authentication is implemented
 */
export function createAuthClient(accessToken: string): SupabaseClient {
  const url = getSupabaseUrl()
  const anonKey = import.meta.env.PUBLIC_SUPABASE_ANON_KEY || import.meta.env.SUPABASE_ANON_KEY
  
  if (!anonKey) {
    throw new Error('Missing SUPABASE_ANON_KEY environment variable')
  }
  
  return createClient(url, anonKey, {
    auth: {
      persistSession: false
    },
    global: {
      headers: {
        Authorization: `Bearer ${accessToken}`,
        'X-Client-Info': 'albaniavisit-tours-auth'
      }
    }
  })
}

/**
 * Singleton instances
 */
let publicClient: SupabaseClient | null = null
let serverClient: SupabaseClient | null = null

/**
 * Get or create public client singleton
 */
export function getPublicClient(): SupabaseClient {
  if (!publicClient) {
    publicClient = createPublicClient()
  }
  return publicClient
}

/**
 * Get or create server client singleton
 * CRITICAL: Only use in server-side code
 */
export function getServerClient(): SupabaseClient {
  if (typeof window !== 'undefined') {
    throw new Error('getServerClient cannot be called from client-side code')
  }
  
  if (!serverClient) {
    serverClient = createServerClient()
  }
  return serverClient
}

/**
 * Safe query builder with automatic sanitization
 */
export class SafeQueryBuilder {
  private client: SupabaseClient
  
  constructor(client: SupabaseClient) {
    this.client = client
  }
  
  /**
   * Safely query tours with validation
   */
  async queryTours(filters: any = {}) {
    let query = this.client
      .from('tours')
      .select('*')
      .eq('is_active', true)
    
    // Validate and apply filters
    if (filters.country && /^[A-Z]{2}$/.test(filters.country)) {
      query = query.contains('locations', [filters.country])
    }
    
    if (filters.category && /^[a-zA-Z0-9-]+$/.test(filters.category)) {
      query = query.ilike('activity_type', `%${filters.category}%`)
    }
    
    if (filters.limit && Number.isInteger(filters.limit) && filters.limit > 0 && filters.limit <= 100) {
      query = query.limit(filters.limit)
    }
    
    return query
  }
  
  /**
   * Safely search with input sanitization
   */
  async search(searchTerm: string, limit: number = 10) {
    // Sanitize search term
    const sanitized = searchTerm
      .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special characters
      .trim()
      .substring(0, 100) // Limit length
    
    if (sanitized.length < 2) {
      return { data: [], error: null }
    }
    
    // Use parameterized query through Supabase
    return this.client
      .from('tours')
      .select('*')
      .eq('is_active', true)
      .or(`title.ilike.%${sanitized}%,short_description.ilike.%${sanitized}%`)
      .limit(Math.min(limit, 50))
  }
}

/**
 * Supabase error handler
 */
export function handleSupabaseError(error: any): { message: string; code: string } {
  // Don't expose internal error details in production
  if (import.meta.env.PROD) {
    console.error('Supabase error:', error)
    return {
      message: 'A database error occurred. Please try again.',
      code: 'DB_ERROR'
    }
  }
  
  // In development, provide more details
  return {
    message: error.message || 'Unknown database error',
    code: error.code || 'UNKNOWN_ERROR'
  }
}

// Export secure clients
export const supabasePublic = typeof window !== 'undefined' ? getPublicClient() : null
export const supabaseServer = typeof window === 'undefined' ? getServerClient() : null

export default {
  createPublicClient,
  createServerClient,
  createAuthClient,
  getPublicClient,
  getServerClient,
  SafeQueryBuilder,
  handleSupabaseError
}