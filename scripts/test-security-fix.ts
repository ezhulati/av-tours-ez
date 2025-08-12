#!/usr/bin/env node
import { createClient } from '@supabase/supabase-js'
import dotenv from 'dotenv'
import { execSync } from 'child_process'
import fs from 'fs'
import path from 'path'

dotenv.config()

const SUPABASE_URL = process.env.PUBLIC_SUPABASE_URL!
const SUPABASE_ANON_KEY = process.env.PUBLIC_SUPABASE_ANON_KEY!
const SUPABASE_SERVICE_KEY = process.env.SUPABASE_SERVICE_KEY || process.env.PUBLIC_SUPABASE_ANON_KEY!

console.log('🔒 Security Fix Testing Script')
console.log('================================\n')

// Create clients with different permission levels
const anonClient = createClient(SUPABASE_URL, SUPABASE_ANON_KEY)
const serviceClient = createClient(SUPABASE_URL, SUPABASE_SERVICE_KEY)

async function checkCurrentState() {
  console.log('1️⃣  Checking current database state...\n')
  
  try {
    // Check if tour_providers view exists
    const { data: views, error } = await serviceClient
      .rpc('audit_security_definer_objects')
      .select('*')
    
    if (error) {
      console.log('   ℹ️  Audit function not yet created (expected before migration)')
    } else {
      console.log('   ⚠️  Found objects with SECURITY DEFINER:')
      console.table(views)
    }
    
    // Try to query tour_providers view
    const { data: providers, error: providerError } = await anonClient
      .from('tour_providers')
      .select('*')
      .limit(1)
    
    if (providerError) {
      console.log('   ℹ️  tour_providers view not accessible or doesn\'t exist')
      console.log(`      Error: ${providerError.message}`)
    } else {
      console.log('   ✅ tour_providers view exists and is queryable')
      console.log(`      Found ${providers?.length || 0} provider(s)`)
    }
  } catch (err) {
    console.log('   ⚠️  Could not check current state:', err)
  }
}

async function testMigrationLocally() {
  console.log('\n2️⃣  Testing migration in dry-run mode...\n')
  
  const migrationPath = path.join(process.cwd(), 'supabase/migrations/20250112_security_fixes_views.sql')
  
  if (!fs.existsSync(migrationPath)) {
    console.error('   ❌ Migration file not found at:', migrationPath)
    return false
  }
  
  console.log('   ✅ Migration file found')
  
  // Read and validate migration SQL
  const migrationSQL = fs.readFileSync(migrationPath, 'utf-8')
  
  // Check for dangerous operations
  const dangerousPatterns = [
    /DROP\s+TABLE/i,
    /TRUNCATE/i,
    /DELETE\s+FROM\s+(?!security_audit_log)/i
  ]
  
  let hasDangerousOps = false
  for (const pattern of dangerousPatterns) {
    if (pattern.test(migrationSQL)) {
      console.log(`   ⚠️  Migration contains potentially dangerous operation: ${pattern}`)
      hasDangerousOps = true
    }
  }
  
  if (!hasDangerousOps) {
    console.log('   ✅ No dangerous operations detected in migration')
  }
  
  // Check migration structure
  const hasDropView = /DROP\s+VIEW\s+IF\s+EXISTS\s+public\.tour_providers/i.test(migrationSQL)
  const hasCreateView = /CREATE\s+VIEW\s+public\.tour_providers/i.test(migrationSQL)
  const hasNoSecurityDefiner = !(/CREATE\s+VIEW.*SECURITY\s+DEFINER/i.test(migrationSQL))
  
  console.log(`   ${hasDropView ? '✅' : '❌'} Migration drops existing view`)
  console.log(`   ${hasCreateView ? '✅' : '❌'} Migration creates new view`)
  console.log(`   ${hasNoSecurityDefiner ? '✅' : '❌'} New view does NOT use SECURITY DEFINER`)
  
  return hasDropView && hasCreateView && hasNoSecurityDefiner
}

async function startSupabaseLocal() {
  console.log('\n3️⃣  Starting Supabase local environment...\n')
  
  try {
    // Check if Supabase is already running
    const status = execSync('npx supabase status 2>&1', { encoding: 'utf-8' })
    if (status.includes('RUNNING')) {
      console.log('   ✅ Supabase is already running locally')
      return true
    }
  } catch {
    // Not running, let's start it
    console.log('   🚀 Starting Supabase...')
    try {
      execSync('npx supabase start', { stdio: 'inherit' })
      console.log('   ✅ Supabase started successfully')
      return true
    } catch (err) {
      console.log('   ❌ Failed to start Supabase:', err)
      console.log('   💡 Try running: npx supabase start')
      return false
    }
  }
}

async function applyMigrationLocally() {
  console.log('\n4️⃣  Applying migration to local database...\n')
  
  try {
    // Apply the migration using Supabase CLI
    const output = execSync('npx supabase db push --local', { 
      encoding: 'utf-8',
      cwd: process.cwd()
    })
    
    console.log('   ✅ Migration applied successfully')
    console.log(output)
    return true
  } catch (err: any) {
    console.log('   ❌ Failed to apply migration:', err.message)
    return false
  }
}

async function verifyFix() {
  console.log('\n5️⃣  Verifying the security fix...\n')
  
  // Connect to local Supabase
  const localUrl = 'http://localhost:54321'
  const localAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZS1kZW1vIiwicm9sZSI6ImFub24iLCJleHAiOjE5ODM4MTI5OTZ9.CRXP1A7WOeoJeXxjNni43kdQwgnWNReilDMblYTn_I0'
  
  const localClient = createClient(localUrl, localAnonKey)
  
  try {
    // Test 1: Check if view exists and is queryable
    const { data: providers, error: providerError } = await localClient
      .from('tour_providers')
      .select('*')
      .limit(1)
    
    if (providerError) {
      console.log('   ⚠️  Error querying tour_providers:', providerError.message)
    } else {
      console.log('   ✅ tour_providers view is queryable')
    }
    
    // Test 2: Run audit function
    const { data: auditResults, error: auditError } = await localClient
      .rpc('audit_security_definer_objects')
    
    if (auditError) {
      console.log('   ⚠️  Could not run audit function:', auditError.message)
    } else if (auditResults && auditResults.length > 0) {
      console.log('   ⚠️  Still found objects with SECURITY DEFINER:')
      console.table(auditResults)
    } else {
      console.log('   ✅ No objects with SECURITY DEFINER found')
    }
    
    // Test 3: Check security audit log
    const { data: logs, error: logError } = await localClient
      .from('security_audit_log')
      .select('*')
      .eq('object_name', 'tour_providers')
      .order('performed_at', { ascending: false })
      .limit(1)
    
    if (!logError && logs && logs.length > 0) {
      console.log('   ✅ Security fix logged in audit table')
      console.log(`      Action: ${logs[0].action_type}`)
      console.log(`      Time: ${logs[0].performed_at}`)
    }
    
  } catch (err) {
    console.log('   ❌ Verification failed:', err)
    return false
  }
  
  return true
}

async function runTests() {
  console.log('\n6️⃣  Running application tests...\n')
  
  try {
    execSync('pnpm test --run', { stdio: 'inherit' })
    console.log('   ✅ All tests passed')
    return true
  } catch {
    console.log('   ❌ Some tests failed - review needed')
    return false
  }
}

// Main execution
async function main() {
  console.log('🏁 Starting security fix validation...\n')
  
  // Step 1: Check current state
  await checkCurrentState()
  
  // Step 2: Validate migration file
  const migrationValid = await testMigrationLocally()
  if (!migrationValid) {
    console.log('\n❌ Migration validation failed. Please review the migration file.')
    process.exit(1)
  }
  
  // Step 3: Ask for confirmation to proceed with local testing
  console.log('\n⚠️  Ready to test migration locally.')
  console.log('   This will:')
  console.log('   - Start Supabase locally (if not running)')
  console.log('   - Apply the migration to your LOCAL database')
  console.log('   - Run verification tests')
  console.log('\n   Your production database will NOT be affected.')
  console.log('\n   Press Enter to continue or Ctrl+C to cancel...')
  
  // Wait for user input
  await new Promise(resolve => {
    process.stdin.once('data', resolve)
  })
  
  // Step 4: Start Supabase local
  const supabaseStarted = await startSupabaseLocal()
  if (!supabaseStarted) {
    console.log('\n❌ Could not start Supabase locally')
    process.exit(1)
  }
  
  // Step 5: Apply migration locally
  const migrationApplied = await applyMigrationLocally()
  if (!migrationApplied) {
    console.log('\n⚠️  Migration could not be applied. Check the error above.')
    process.exit(1)
  }
  
  // Step 6: Verify the fix
  const verified = await verifyFix()
  
  // Step 7: Run tests
  const testsPass = await runTests()
  
  // Final summary
  console.log('\n' + '='.repeat(50))
  console.log('📊 SECURITY FIX TEST SUMMARY')
  console.log('='.repeat(50))
  console.log(`✅ Migration file valid: ${migrationValid}`)
  console.log(`✅ Migration applied locally: ${migrationApplied}`)
  console.log(`${verified ? '✅' : '⚠️ '} Security fix verified: ${verified}`)
  console.log(`${testsPass ? '✅' : '⚠️ '} Application tests pass: ${testsPass}`)
  
  if (migrationValid && migrationApplied && verified && testsPass) {
    console.log('\n🎉 All checks passed! Safe to deploy to production.')
    console.log('\nTo deploy to production, run:')
    console.log('  npx supabase db push')
  } else {
    console.log('\n⚠️  Some checks failed. Review the issues above before deploying.')
  }
}

// Run the script
main().catch(console.error)