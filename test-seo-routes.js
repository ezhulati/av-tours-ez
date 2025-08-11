/**
 * Test script for Programmatic SEO routes
 * Run with: node test-seo-routes.js
 */

const testRoutes = [
  '/tours/albania',
  '/tours/kosovo',
  '/tours/montenegro',
  '/tours/north-macedonia',
  '/tours/albania/hiking',
  '/tours/easy',
  '/tours/weekend',
  '/tours/budget',
  '/tours/balkans',
  '/sitemap-seo.xml'
]

const baseUrl = 'http://localhost:4321'

async function testRoute(path) {
  try {
    console.log(`Testing ${path}...`)
    const response = await fetch(`${baseUrl}${path}`)
    
    if (response.ok) {
      const contentType = response.headers.get('content-type')
      console.log(`✅ ${path} - Status: ${response.status}, Type: ${contentType}`)
      
      // For HTML pages, check for key SEO elements
      if (contentType?.includes('text/html')) {
        const html = await response.text()
        
        // Check for essential SEO elements
        const hasTitle = html.includes('<title>')
        const hasH1 = html.includes('<h1')
        const hasCanonical = html.includes('rel="canonical"')
        const hasSchema = html.includes('application/ld+json')
        
        console.log(`   SEO Check: Title=${hasTitle}, H1=${hasH1}, Canonical=${hasCanonical}, Schema=${hasSchema}`)
        
        if (!hasTitle || !hasH1) {
          console.log(`   ⚠️  Missing essential SEO elements`)
        }
      }
      
      // For XML, just verify it's valid
      if (contentType?.includes('xml')) {
        const xml = await response.text()
        if (xml.includes('<urlset')) {
          console.log(`   ✅ Valid sitemap with URLs`)
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
  console.log('🚀 Starting Programmatic SEO Route Tests\n')
  console.log(`Testing against: ${baseUrl}\n`)
  
  for (const route of testRoutes) {
    await testRoute(route)
    console.log('') // Empty line between tests
  }
  
  console.log('\n✨ Tests complete!')
  console.log('\nNext steps:')
  console.log('1. Submit sitemap-seo.xml to Google Search Console')
  console.log('2. Monitor performance in SEO tracking dashboard')
  console.log('3. Build internal links to these landing pages')
  console.log('4. Create content variations based on search trends')
}

// Run the tests
runTests().catch(console.error)