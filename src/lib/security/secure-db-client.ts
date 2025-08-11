/**
 * Secure Database Client with RLS Enforcement
 * Ensures all database operations respect Row Level Security policies
 */

import { createClient, type SupabaseClient } from '@supabase/supabase-js'

// Get environment variables
const supabaseUrl = import.meta.env?.SUPABASE_URL || 
  (typeof process !== 'undefined' ? process.env?.SUPABASE_URL : undefined)
const supabaseServiceRoleKey = import.meta.env?.SUPABASE_SERVICE_ROLE_KEY || 
  (typeof process !== 'undefined' ? process.env?.SUPABASE_SERVICE_ROLE_KEY : undefined)
const supabaseAnonKey = import.meta.env?.PUBLIC_SUPABASE_ANON_KEY || 
  (typeof process !== 'undefined' ? process.env?.PUBLIC_SUPABASE_ANON_KEY : undefined)

interface SecureClientOptions {
  enforceRLS?: boolean
  sessionToken?: string
  userRole?: 'admin' | 'authenticated' | 'anon'
  bypassRLS?: boolean
}

/**
 * Create secure Supabase client with RLS enforcement
 */
export function createSecureClient(options: SecureClientOptions = {}): SupabaseClient | null {
  if (!supabaseUrl) {
    console.error('SUPABASE_URL not configured')
    return null
  }
  
  const {
    enforceRLS = true,
    sessionToken,
    userRole = 'anon',
    bypassRLS = false
  } = options
  
  // Use appropriate key based on role and RLS enforcement
  let key: string | undefined
  
  if (bypassRLS && supabaseServiceRoleKey) {
    // Service role bypasses RLS - use only for admin operations
    key = supabaseServiceRoleKey
    console.warn('Database client bypassing RLS - ensure this is intentional')
  } else {
    // Use anon key which respects RLS
    key = supabaseAnonKey
  }
  
  if (!key) {
    console.error('No suitable Supabase key available')
    return null
  }
  
  const client = createClient(supabaseUrl, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false
    },
    db: {
      schema: 'public'
    }
  })
  
  // Set session context for RLS if provided
  if (sessionToken && userRole !== 'anon') {
    // Set JWT claims for RLS policies
    client.auth.getSession = async () => ({
      data: {
        session: {
          access_token: sessionToken,
          user: {
            id: 'admin',
            role: userRole,
            session_id: sessionToken
          }
        } as any
      },
      error: null
    })
  }
  
  return client
}

/**
 * Create public client for read-only operations
 */
export function createPublicClient(): SupabaseClient | null {
  return createSecureClient({
    enforceRLS: true,
    userRole: 'anon'
  })
}

/**
 * Create admin client with session validation
 */
export function createAdminClient(sessionToken: string): SupabaseClient | null {
  if (!sessionToken) {
    throw new Error('Admin session token required')
  }
  
  return createSecureClient({
    enforceRLS: true,
    sessionToken,
    userRole: 'admin'
  })
}

/**
 * Create service role client (bypasses RLS - use carefully)
 */
export function createServiceClient(): SupabaseClient | null {
  if (!supabaseServiceRoleKey) {
    console.error('Service role key not available')
    return null
  }
  
  return createSecureClient({
    enforceRLS: false,
    bypassRLS: true
  })
}

/**
 * Validate that RLS is enabled on a table
 */
export async function validateRLSEnabled(
  client: SupabaseClient, 
  tableName: string
): Promise<boolean> {
  try {
    const { data, error } = await client
      .rpc('check_rls_enabled', { table_name: tableName })
    
    if (error) {
      console.error(`Failed to check RLS for ${tableName}:`, error)
      return false
    }
    
    return data === true
  } catch (error) {
    console.error(`Error checking RLS for ${tableName}:`, error)
    return false
  }
}

/**
 * Audit database operation
 */
export async function auditDatabaseOperation(
  client: SupabaseClient,
  operation: string,
  tableName: string,
  recordId?: string,
  userId?: string,
  details?: Record<string, any>
): Promise<void> {
  try {
    await client
      .from('admin_audit_logs')
      .insert({
        event_type: `db_${operation}`,
        user_id: userId || 'system',
        details: {
          table: tableName,
          record_id: recordId,
          ...details
        }
      })
  } catch (error) {
    console.error('Failed to audit database operation:', error)
  }
}

/**
 * Security wrapper for database queries
 */
export class SecureQuery {
  constructor(
    private client: SupabaseClient,
    private sessionToken?: string,
    private userId?: string
  ) {}
  
  /**
   * Secure select with automatic RLS validation
   */
  async select<T>(
    table: string,
    columns: string = '*',
    filters?: Record<string, any>
  ): Promise<{ data: T[] | null; error: any }> {
    // Validate RLS is enabled
    const rlsEnabled = await validateRLSEnabled(this.client, table)
    if (!rlsEnabled) {
      console.error(`RLS not enabled on table: ${table}`)
      return { data: null, error: new Error('Security policy violation') }
    }
    
    let query = this.client.from(table).select(columns)
    
    // Apply filters
    if (filters) {
      Object.entries(filters).forEach(([key, value]) => {
        query = query.eq(key, value)
      })
    }
    
    const result = await query
    
    // Audit the operation
    await auditDatabaseOperation(
      this.client,
      'select',
      table,
      undefined,
      this.userId,
      { filters, columns }
    )
    
    return result
  }
  
  /**
   * Secure insert with validation
   */
  async insert<T>(
    table: string,
    data: T,
    options: { returning?: string } = {}
  ): Promise<{ data: T[] | null; error: any }> {
    // Validate RLS is enabled
    const rlsEnabled = await validateRLSEnabled(this.client, table)
    if (!rlsEnabled) {
      console.error(`RLS not enabled on table: ${table}`)
      return { data: null, error: new Error('Security policy violation') }
    }
    
    const query = this.client.from(table).insert(data)
    
    if (options.returning) {
      query.select(options.returning)
    }
    
    const result = await query
    
    // Audit the operation
    await auditDatabaseOperation(
      this.client,
      'insert',
      table,
      undefined,
      this.userId,
      { data }
    )
    
    return result
  }
  
  /**
   * Secure update with validation
   */
  async update<T>(
    table: string,
    data: Partial<T>,
    filters: Record<string, any>
  ): Promise<{ data: T[] | null; error: any }> {
    // Validate RLS is enabled
    const rlsEnabled = await validateRLSEnabled(this.client, table)
    if (!rlsEnabled) {
      console.error(`RLS not enabled on table: ${table}`)
      return { data: null, error: new Error('Security policy violation') }
    }
    
    let query = this.client.from(table).update(data)
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
    
    const result = await query
    
    // Audit the operation
    await auditDatabaseOperation(
      this.client,
      'update',
      table,
      undefined,
      this.userId,
      { data, filters }
    )
    
    return result
  }
  
  /**
   * Secure delete with validation
   */
  async delete(
    table: string,
    filters: Record<string, any>
  ): Promise<{ data: any[] | null; error: any }> {
    // Validate RLS is enabled
    const rlsEnabled = await validateRLSEnabled(this.client, table)
    if (!rlsEnabled) {
      console.error(`RLS not enabled on table: ${table}`)
      return { data: null, error: new Error('Security policy violation') }
    }
    
    let query = this.client.from(table).delete()
    
    // Apply filters
    Object.entries(filters).forEach(([key, value]) => {
      query = query.eq(key, value)
    })
    
    const result = await query
    
    // Audit the operation
    await auditDatabaseOperation(
      this.client,
      'delete',
      table,
      undefined,
      this.userId,
      { filters }
    )
    
    return result
  }
}

/**
 * Create secure query instance
 */
export function createSecureQuery(
  sessionToken?: string,
  userId?: string
): SecureQuery | null {
  const client = sessionToken 
    ? createAdminClient(sessionToken)
    : createPublicClient()
    
  if (!client) return null
  
  return new SecureQuery(client, sessionToken, userId)
}

// SQL function to check RLS (run in Supabase)
export const CHECK_RLS_SQL = `
CREATE OR REPLACE FUNCTION check_rls_enabled(table_name text)
RETURNS boolean AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 
    FROM pg_class c
    JOIN pg_namespace n ON c.relnamespace = n.oid
    WHERE c.relname = table_name
    AND n.nspname = 'public'
    AND c.relrowsecurity = true
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
`

export default {
  createSecureClient,
  createPublicClient,
  createAdminClient,
  createServiceClient,
  createSecureQuery,
  validateRLSEnabled,
  auditDatabaseOperation
}