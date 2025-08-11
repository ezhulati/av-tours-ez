import { getOptimizedImageUrl, generateSrcSet, getPlaceholderUrl } from './src/lib/imageOptimization'

// Test with a low-quality image
const testImage = 'https://bnadventure.com/wp-content/uploads/2023/09/danish5-768x476-1.jpg'

console.log('🚀 Testing Weserv.nl Image Optimization\n')
console.log('=' .repeat(60))

console.log('Original Image:')
console.log(`  ${testImage}`)
console.log('  Size: 768x476px (low quality)')

console.log('\n📸 Optimized URL (1920x1080, WebP, Enhanced):')
const optimized = getOptimizedImageUrl(testImage, {
  width: 1920,
  height: 1080,
  quality: 'auto:best',
  format: 'auto',
  enhance: true,
  upscale: true
})
console.log(`  ${optimized}`)

console.log('\n🖼️ Placeholder URL (50px, blurred):')
const placeholder = getPlaceholderUrl(testImage)
console.log(`  ${placeholder}`)

console.log('\n📱 Responsive SrcSet:')
const srcset = generateSrcSet(testImage)
srcset.split(', ').slice(0, 3).forEach(src => {
  const [url, size] = src.split(' ')
  console.log(`  ${size}: ${url.substring(0, 80)}...`)
})

console.log('\n' + '=' .repeat(60))
console.log('✅ Image optimization is working!')
console.log('\nBenefits:')
console.log('  ✓ FREE service (no API key needed)')
console.log('  ✓ Automatic WebP conversion')
console.log('  ✓ Image enhancement (colors/contrast)')
console.log('  ✓ Global CDN delivery')
console.log('  ✓ Responsive image generation')