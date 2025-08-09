#!/usr/bin/env node

import { createClient } from '@supabase/supabase-js'

// Supabase connection details
const SUPABASE_URL = 'https://mioqyazjthmrmgsbsvfg.supabase.co'
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Im1pb3F5YXpqdGhtcm1nc2JzdmZnIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NDQ1MjY5NywiZXhwIjoyMDcwMDI4Njk3fQ.Fr6QskdnvByOHLBn-spVyKpOIXGRYZI3DUJ66qQdwJo'

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { persistSession: false }
})

async function generateSchemaSummary() {
  console.log('='.repeat(100))
  console.log('                        AFFILIATE_TOURS TABLE SCHEMA SUMMARY')
  console.log('='.repeat(100))
  
  try {
    const { data, error } = await supabase
      .from('affiliate_tours')
      .select('*')
      .limit(1)
    
    if (error) throw error
    if (!data || data.length === 0) throw new Error('No data found')
    
    const sampleRow = data[0]
    const columns = Object.keys(sampleRow)
    
    console.log(`\n📊 Total Columns: ${columns.length}`)
    console.log(`🏢 Database: Supabase (PostgreSQL)`)
    console.log(`🔗 Connection: ${SUPABASE_URL}`)
    console.log(`📅 Schema checked on: ${new Date().toISOString()}\n`)
    
    // Group columns by category
    const categories = {
      'Core Identity': ['id', 'slug', 'title', 'source_provider', 'source_url'],
      'Timestamps': ['created_at', 'updated_at', 'last_scraped', 'last_clicked'],
      'Content & Description': ['short_description', 'full_description', 'ai_enhanced_title', 'ai_enhanced_description'],
      'AI Enhanced Fields': ['ai_highlights', 'ai_selling_points', 'ai_meta_description'],
      'Tour Details': ['duration', 'price', 'difficulty_level', 'activity_type', 'max_group_size', 'minimum_age'],
      'Location & Itinerary': ['locations', 'starting_point', 'ending_point', 'itinerary'],
      'Tour Logistics': ['inclusions', 'exclusions', 'what_to_bring', 'fitness_requirements'],
      'Media': ['primary_image', 'image_gallery'],
      'Affiliate & Tracking': ['affiliate_url', 'affiliate_params', 'view_count', 'click_count'],
      'SEO & Meta': ['meta_title', 'meta_description', 'meta_keywords', 'schema_markup', 'search_vector'],
      'Status & Visibility': ['is_active', 'is_featured', 'featured_order']
    }
    
    Object.entries(categories).forEach(([category, categoryColumns]) => {
      console.log(`\n📂 ${category.toUpperCase()}`)
      console.log('─'.repeat(50))
      
      categoryColumns.forEach(col => {
        if (columns.includes(col)) {
          const value = sampleRow[col]
          const type = value === null ? 'NULL' : 
                      typeof value === 'string' && value.includes('T') && value.includes('Z') ? 'TIMESTAMP' :
                      typeof value === 'object' && Array.isArray(value) ? 'ARRAY' :
                      typeof value === 'object' ? 'JSON' :
                      typeof value === 'boolean' ? 'BOOLEAN' :
                      typeof value === 'number' ? 'NUMBER' :
                      'STRING'
          
          const description = getColumnDescription(col)
          console.log(`  ${col.padEnd(20)} [${type.padEnd(8)}] ${description}`)
        }
      })
    })
    
    // Show uncategorized columns
    const categorized = Object.values(categories).flat()
    const uncategorized = columns.filter(col => !categorized.includes(col))
    
    if (uncategorized.length > 0) {
      console.log(`\n📂 UNCATEGORIZED`)
      console.log('─'.repeat(50))
      uncategorized.forEach(col => {
        const value = sampleRow[col]
        const type = value === null ? 'NULL' : typeof value
        console.log(`  ${col.padEnd(20)} [${type.padEnd(8)}]`)
      })
    }
    
    console.log('\n' + '='.repeat(100))
    console.log('Schema analysis complete ✅')
    console.log('='.repeat(100))
    
  } catch (error) {
    console.error('❌ Error:', error.message)
  }
}

function getColumnDescription(column) {
  const descriptions = {
    'id': 'Primary key (UUID)',
    'slug': 'URL-friendly identifier',
    'title': 'Tour title/name',
    'source_provider': 'Affiliate partner (e.g., bnadventure)',
    'source_url': 'Original tour URL',
    'created_at': 'Record creation timestamp',
    'updated_at': 'Last modification timestamp',
    'last_scraped': 'Last data scrape timestamp',
    'last_clicked': 'Last affiliate click timestamp',
    'short_description': 'Brief tour description',
    'full_description': 'Detailed tour description',
    'ai_enhanced_title': 'AI-optimized title',
    'ai_enhanced_description': 'AI-optimized description',
    'ai_highlights': 'Key tour highlights (array)',
    'ai_selling_points': 'Marketing selling points (array)',
    'ai_meta_description': 'AI-generated meta description',
    'duration': 'Tour duration (e.g., "Half/Full day")',
    'price': 'Price range (e.g., "€45-80")',
    'difficulty_level': 'Difficulty rating',
    'activity_type': 'Type of activity (e.g., "Adventure")',
    'max_group_size': 'Maximum participants',
    'minimum_age': 'Minimum age requirement',
    'locations': 'Tour locations (array)',
    'starting_point': 'Tour starting location',
    'ending_point': 'Tour ending location',
    'itinerary': 'Detailed itinerary (JSON)',
    'inclusions': 'What\'s included (array)',
    'exclusions': 'What\'s excluded (array)',
    'what_to_bring': 'Required items list (array)',
    'fitness_requirements': 'Physical fitness needs',
    'primary_image': 'Main tour image URL',
    'image_gallery': 'Additional images (array)',
    'affiliate_url': 'Tracking URL with affiliate params',
    'affiliate_params': 'Affiliate tracking parameters (JSON)',
    'view_count': 'Page view counter',
    'click_count': 'Affiliate link click counter',
    'meta_title': 'SEO page title',
    'meta_description': 'SEO meta description',
    'meta_keywords': 'SEO keywords',
    'schema_markup': 'Structured data markup (JSON)',
    'search_vector': 'Full-text search index',
    'is_active': 'Whether tour is active/visible',
    'is_featured': 'Whether tour is featured',
    'featured_order': 'Featured display order'
  }
  
  return descriptions[column] || 'No description available'
}

generateSchemaSummary()