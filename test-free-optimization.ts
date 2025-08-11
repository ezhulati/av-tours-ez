import { getOptimizedImageUrl, getStaticallyOptimizedUrl } from './src/lib/imageOptimizationSimple'

// Test with one of your low-quality images
const testImage = 'https://bnadventure.com/wp-content/uploads/2023/09/danish5-768x476-1.jpg'

console.log('🚀 Testing FREE Image Optimization Services (No Signup Required!)\n')
console.log('=' .repeat(60))

console.log('Original Low-Quality Image:')
console.log(`  ${testImage}`)
console.log('  Dimensions: 768x476px (low quality)')

console.log('\n📸 Option 1: Weserv.nl (European CDN)')
const weservUrl = getOptimizedImageUrl(testImage, {
  width: 1920,
  height: 1080,
  quality: 90,
  format: 'webp'
})
console.log(`  ${weservUrl}`)

console.log('\n📸 Option 2: Statically.io (Global CDN)')
const staticallyUrl = getStaticallyOptimizedUrl(testImage, 1920, 90)
console.log(`  ${staticallyUrl}`)

console.log('\n' + '=' .repeat(60))
console.log('✅ Both services are FREE and require NO signup!')
console.log('\nFeatures:')
console.log('  ✓ Automatic WebP conversion')
console.log('  ✓ On-the-fly resizing')
console.log('  ✓ Global CDN delivery')
console.log('  ✓ No API keys needed')
console.log('  ✓ Unlimited usage')

console.log('\n🎯 Copy any URL above and open in your browser to see the optimized image!')

// Test if services are working
console.log('\n🔍 Testing service availability...')

fetch(weservUrl, { method: 'HEAD' })
  .then(res => {
    if (res.ok) {
      console.log('✅ Weserv.nl is working!')
      console.log(`   Content-Type: ${res.headers.get('content-type')}`)
      console.log(`   Size: ${res.headers.get('content-length')} bytes`)
    }
  })
  .catch(() => console.log('❌ Weserv.nl might be blocked'))

fetch(staticallyUrl, { method: 'HEAD' })
  .then(res => {
    if (res.ok) {
      console.log('✅ Statically.io is working!')
      console.log(`   Content-Type: ${res.headers.get('content-type')}`)
    }
  })
  .catch(() => console.log('❌ Statically.io might be blocked'))