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

function inferPostgreSQLType(value) {
  if (value === null) return 'NULL'
  
  const type = typeof value
  switch (type) {
    case 'string':
      if (/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/.test(value)) {
        return 'TIMESTAMPTZ'
      }
      if (value.includes('http')) {
        return 'TEXT (URL)'
      }
      if (value.length > 255) {
        return 'TEXT'
      }
      return 'VARCHAR'
    case 'number':
      return Number.isInteger(value) ? 'INTEGER' : 'NUMERIC'
    case 'boolean':
      return 'BOOLEAN'
    case 'object':
      if (Array.isArray(value)) {
        return 'JSON ARRAY'
      }
      return 'JSON/JSONB'
    default:
      return 'UNKNOWN'
  }
}

async function getDetailedSchema() {
  console.log('🔍 Analyzing affiliate_tours table schema...')
  console.log('=' .repeat(80))
  
  try {
    // Get multiple rows to better understand the data types
    const { data: sampleData, error } = await supabase
      .from('affiliate_tours')
      .select('*')
      .limit(3)
    
    if (error) {
      console.error('❌ Error querying table:', error)
      return
    }
    
    if (!sampleData || sampleData.length === 0) {
      console.log('⚠️  Table exists but contains no data')
      return
    }
    
    console.log(`📊 Found ${sampleData.length} sample record(s)\n`)
    
    // Get all unique columns from all rows
    const allColumns = new Set()
    sampleData.forEach(row => {
      Object.keys(row).forEach(key => allColumns.add(key))
    })
    
    const sortedColumns = Array.from(allColumns).sort()
    
    console.log('📋 COMPLETE TABLE SCHEMA')
    console.log('─'.repeat(80))
    console.log(`${'Column Name'.padEnd(25)} ${'Inferred Type'.padEnd(20)} Sample Value`)
    console.log('─'.repeat(80))
    
    sortedColumns.forEach(column => {
      const sampleValue = sampleData[0][column]
      const inferredType = inferPostgreSQLType(sampleValue)
      
      let displayValue = sampleValue
      if (displayValue === null) {
        displayValue = 'NULL'
      } else if (typeof displayValue === 'object') {
        displayValue = JSON.stringify(displayValue).substring(0, 50) + '...'
      } else if (typeof displayValue === 'string' && displayValue.length > 50) {
        displayValue = displayValue.substring(0, 47) + '...'
      }
      
      console.log(
        `${column.padEnd(25)} ${inferredType.padEnd(20)} ${displayValue}`
      )
    })
    
    console.log('─'.repeat(80))
    console.log(`\n📈 Total columns: ${sortedColumns.length}`)
    
    // Show data types breakdown
    const typeBreakdown = {}
    sortedColumns.forEach(column => {
      const type = inferPostgreSQLType(sampleData[0][column])
      typeBreakdown[type] = (typeBreakdown[type] || 0) + 1
    })
    
    console.log('\n📊 DATA TYPE BREAKDOWN:')
    Object.entries(typeBreakdown)
      .sort(([,a], [,b]) => b - a)
      .forEach(([type, count]) => {
        console.log(`  ${type}: ${count} column(s)`)
      })
    
    // Show key columns
    console.log('\n🔑 KEY COLUMNS:')
    const keyColumns = sortedColumns.filter(col => 
      ['id', 'slug', 'title', 'source_provider', 'is_active'].includes(col)
    )
    keyColumns.forEach(col => {
      const value = sampleData[0][col]
      console.log(`  ${col}: ${value}`)
    })
    
  } catch (error) {
    console.error('❌ Unexpected error:', error)
  }
}

// Run the detailed schema analysis
getDetailedSchema()