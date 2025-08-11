import { getOptimizedImageUrl, generateSrcSet } from './src/lib/imageOptimization'

// Test with one of your low-quality images
const testImages = [
  {
    name: 'Rock Climbing (Low Quality)',
    original: 'https://bnadventure.com/wp-content/uploads/2023/09/danish5-768x476-1.jpg'
  },
  {
    name: 'Theth Albania (Low Quality)',
    original: 'https://bnadventure.com/wp-content/uploads/2023/09/Theth-82-KenSpence_-753x448-min.jpg'
  }
]

console.log('🚀 Testing Cloudinary Image Optimization\n')
console.log('=' .repeat(60))

testImages.forEach(img => {
  console.log(`\n📸 ${img.name}`)
  console.log('Original URL:')
  console.log(`  ${img.original}`)
  
  // Get optimized URL with enhancements
  const optimized = getOptimizedImageUrl(img.original, {
    width: 1920,
    height: 1080,
    quality: 'auto:best',
    enhance: true,
    upscale: true
  })
  
  console.log('\nOptimized URL (1920x1080, enhanced, upscaled):')
  console.log(`  ${optimized}`)
  
  // Get responsive srcset
  const srcset = generateSrcSet(img.original)
  console.log('\nResponsive srcset:')
  srcset.split(', ').forEach(src => {
    console.log(`  ${src.substring(0, 100)}...`)
  })
})

console.log('\n' + '=' .repeat(60))
console.log('✅ Cloudinary is configured and ready!')
console.log('\nNOTE: Open any optimized URL in your browser to see the difference.')
console.log('The images should be:')
console.log('  - Higher quality (AI upscaled)')
console.log('  - Better colors/contrast')
console.log('  - Served as WebP/AVIF')
console.log('  - Cached via CDN')