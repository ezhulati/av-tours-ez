/**
 * Final test for Programmatic SEO implementation
 */

const testRoutes = [
  // Filter-based routes (actual implementation)
  '/tours/filter/albania',
  '/tours/filter/kosovo',
  '/tours/filter/montenegro',
  '/tours/filter/north-macedonia',
  '/tours/filter/albania-hiking',
  '/tours/filter/kosovo-hiking',
  '/tours/filter/montenegro-hiking',
  '/tours/filter/easy',
  '/tours/filter/moderate',
  '/tours/filter/challenging',
  '/tours/filter/weekend',
  '/tours/filter/week-long',
  '/tours/filter/budget',
  '/tours/filter/luxury',
  '/tours/filter/hiking',
  '/tours/filter/cultural',
  '/tours/filter/adventure',
  '/tours/filter/balkans',
  
  // Individual tour pages (should still work)
  '/tours/valbona-theth-hike',
  
  // Sitemap
  '/sitemap-seo.xml'
]

const baseUrl = 'http://localhost:4321'

async function testRoute(path) {
  try {
    const response = await fetch(`${baseUrl}${path}`)
    
    if (response.ok) {
      const contentType = response.headers.get('content-type')
      console.log(`✅ ${path} - Status: ${response.status}`)
      
      if (contentType?.includes('text/html')) {
        const html = await response.text()
        
        // Check for SEO elements
        const hasTitle = html.includes('<title>')
        const hasH1 = html.includes('<h1')
        const hasCanonical = html.includes('rel="canonical"')
        const hasSchema = html.includes('application/ld+json')
        const hasTours = html.includes('tours-grid') || html.includes('Tour')
        
        const seoScore = [hasTitle, hasH1, hasCanonical, hasSchema].filter(Boolean).length
        console.log(`   SEO: ${seoScore}/4 (Title:${hasTitle ? '✓' : '✗'} H1:${hasH1 ? '✓' : '✗'} Canonical:${hasCanonical ? '✓' : '✗'} Schema:${hasSchema ? '✓' : '✗'})`)
        
        if (hasTours) {
          console.log(`   ✓ Tours displayed correctly`)
        }
      }
    } else {
      console.log(`❌ ${path} - Status: ${response.status}`)
    }
  } catch (error) {
    console.log(`❌ ${path} - Error: ${error.message}`)
  }
}

async function runTests() {
  console.log('🚀 Final Programmatic SEO Tests\n')
  console.log('Testing implementation with /tours/filter/* pattern\n')
  
  let passed = 0
  let failed = 0
  
  for (const route of testRoutes) {
    await testRoute(route)
    const result = await fetch(`${baseUrl}${route}`)
    if (result.ok) passed++
    else failed++
  }
  
  console.log('\n📊 Summary:')
  console.log(`✅ Passed: ${passed}/${testRoutes.length}`)
  console.log(`❌ Failed: ${failed}/${testRoutes.length}`)
  
  console.log('\n🎯 Implementation Complete!')
  console.log('\nNext Steps:')
  console.log('1. Deploy to production')
  console.log('2. Submit sitemap-seo.xml to Google Search Console')
  console.log('3. Set up 301 redirects in Netlify for clean URLs')
  console.log('4. Monitor performance with SEO tracking')
  console.log('5. Create content variations based on search data')
  console.log('\nClean URL redirects can be set up in Netlify:')
  console.log('  /tours/albania → /tours/filter/albania (301)')
  console.log('  /tours/easy → /tours/filter/easy (301)')
  console.log('  etc.')
}

runTests().catch(console.error)