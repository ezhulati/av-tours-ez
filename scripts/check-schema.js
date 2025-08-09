#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Supabase connection details
const SUPABASE_URL = 'https://mioqyazjthmrmgsbsvfg.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pb3F5YXpqdGhtcm1nc2JzdmZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ1MjY5NywiZXhwIjoyMDcwMDI4Njk3fQ.Fr6QskdnvByOHLBn-spVyKpOIXGRYZI3DUJ66qQdwJo'

// Create Supabase client
const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: {
    persistSession: false
  }
})

async function checkAffiliateToursSchema() {
  console.log('Connecting to Supabase...')
  console.log('URL:', SUPABASE_URL)
  console.log('')
  
  try {
    // Query information_schema to get table structure
    const { data: columns, error: schemaError } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, ordinal_position')
      .eq('table_name', 'affiliate_tours')
      .eq('table_schema', 'public')
      .order('ordinal_position')
    
    if (schemaError) {
      console.error('Error fetching schema:', schemaError)
      
      // Try alternative approach - query the table directly to understand its structure
      console.log('\nTrying alternative approach - querying table directly...')
      const { data: sampleData, error: dataError } = await supabase
        .from('affiliate_tours')
        .select('*')
        .limit(1)
      
      if (dataError) {
        console.error('Error querying affiliate_tours table:', dataError)
        
        // Try to list all tables to see what's available
        console.log('\nChecking available tables...')
        const { data: tables, error: tablesError } = await supabase
          .from('information_schema.tables')
          .select('table_name')
          .eq('table_schema', 'public')
          .eq('table_type', 'BASE TABLE')
        
        if (tablesError) {
          console.error('Error listing tables:', tablesError)
        } else {
          console.log('Available tables:')
          tables.forEach(table => console.log(`  - ${table.table_name}`))
        }
      } else {
        console.log('Sample data from affiliate_tours:')
        if (sampleData && sampleData.length > 0) {
          const firstRow = sampleData[0]
          console.log('\nColumns found in affiliate_tours table:')
          Object.keys(firstRow).forEach(key => {
            const value = firstRow[key]
            const type = typeof value
            console.log(`  - ${key}: ${type} (sample: ${value})`)
          })
        } else {
          console.log('Table exists but contains no data')
        }
      }
    } else {
      console.log('Schema for affiliate_tours table:')
      console.log('=====================================')
      
      columns.forEach(col => {
        console.log(`Column: ${col.column_name}`)
        console.log(`  Type: ${col.data_type}`)
        console.log(`  Nullable: ${col.is_nullable}`)
        console.log(`  Default: ${col.column_default || 'None'}`)
        console.log(`  Position: ${col.ordinal_position}`)
        console.log('---')
      })
    }
    
  } catch (error) {
    console.error('Unexpected error:', error)
  }
}

// Run the schema check
checkAffiliateToursSchema()