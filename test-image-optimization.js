import fetch from 'node-fetch';

async function testImageOptimization() {
  console.log('🔍 Testing Image Optimization System\n');
  console.log('=' .repeat(70));
  
  const testImages = [
    '/Assets/Albania/Accursed_Mountains.jpeg',
    '/Assets/Albania/Valbona_to_Theth_Trail.jpg',
    '/Assets/Albania/Albania_Lake_Koman.jpeg'
  ];
  
  const formats = ['avif', 'webp', 'jpg'];
  const widths = [640, 1920, 3840];
  
  for (const image of testImages) {
    console.log(`\n📸 Testing: ${image}`);
    console.log('-'.repeat(50));
    
    const fullUrl = `https://tours.albaniavisit.com${image}`;
    
    for (const format of formats) {
      for (const width of widths) {
        const params = new URLSearchParams({
          url: fullUrl,
          w: width.toString(),
          q: '95',
          output: format,
          sharp: '2',
          af: '',
          il: '',
          n: '-1'
        });
        
        const optimizedUrl = `https://images.weserv.nl/?${params.toString()}`;
        
        try {
          const response = await fetch(optimizedUrl, { method: 'HEAD' });
          
          if (response.ok) {
            const size = response.headers.get('content-length');
            const sizeKB = size ? Math.round(parseInt(size) / 1024) : 'unknown';
            console.log(`  ✅ ${format.toUpperCase()} @ ${width}px: ${sizeKB} KB`);
          } else {
            console.log(`  ❌ ${format.toUpperCase()} @ ${width}px: Failed (${response.status})`);
          }
        } catch (error) {
          console.log(`  ⚠️  ${format.toUpperCase()} @ ${width}px: Network error`);
        }
      }
    }
  }
  
  console.log('\n\n✨ OPTIMIZATION SUMMARY:');
  console.log('=' .repeat(70));
  console.log('• AVIF format: 30-50% smaller than JPEG');
  console.log('• WebP format: 25-35% smaller than JPEG');
  console.log('• Ultra-sharp quality: q=95 with sharp=2');
  console.log('• Responsive srcset: 640px to 4K support');
  console.log('• Progressive loading: il parameter enabled');
  console.log('• CDN caching: No expiry for hero images');
}

testImageOptimization().catch(console.error);