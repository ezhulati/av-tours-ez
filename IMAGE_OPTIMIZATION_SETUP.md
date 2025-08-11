# Image Optimization Setup for AlbaniaVisit

## 🎯 Current Status
- **8% of images** are low quality (<1024px width)
- **76% of images** are medium quality (1024-1920px)
- **15% of images** are high quality (1920px+)

## 🚀 Quick Setup (5 minutes)

### Option 1: Cloudinary CDN (Recommended - Free Tier)

1. **Create Free Account**
   - Go to [cloudinary.com](https://cloudinary.com)
   - Sign up for free account (25GB bandwidth/month free)
   - Get your Cloud Name from dashboard

2. **Update Configuration**
   ```typescript
   // src/lib/imageOptimization.ts
   const CLOUDINARY_CLOUD_NAME = 'your-cloud-name' // Update this
   ```

3. **That's it!** Images will now be:
   - ✅ Automatically optimized
   - ✅ AI upscaled if low-res
   - ✅ Served as WebP/AVIF
   - ✅ Cached globally via CDN
   - ✅ Enhanced colors/contrast

### Option 2: Netlify Image CDN (If already on Netlify)

1. **Enable in netlify.toml**
   ```toml
   [images]
   remote_images = ["https://bnadventure.com/*"]
   ```

2. **Use Netlify optimization**
   ```typescript
   // Already configured in imageOptimization.ts
   getNetlifyOptimizedUrl(imageUrl, 1920, 'webp')
   ```

## 📊 What Gets Optimized

### Automatic Enhancements
- **AI Upscaling**: Low-res images (<1024px) get AI upscaled
- **Format Conversion**: JPEG → WebP/AVIF (50-80% smaller)
- **Quality Tuning**: Auto-adjusts quality based on content
- **Color Enhancement**: Auto brightness/contrast for travel photos
- **Progressive Loading**: Images load progressively
- **Responsive Srcset**: Multiple sizes for different devices

### Performance Gains
- **50-80% smaller** file sizes
- **2-3x faster** page loads
- **Better SEO** (Core Web Vitals)
- **Higher quality** appearance

## 🎨 Component Usage

### In React Components
```tsx
import OptimizedImage from '@/components/OptimizedImage'

<OptimizedImage
  src={tour.primaryImage}
  alt={tour.title}
  context="hero"  // or "card", "thumbnail", "gallery"
  priority={true}  // for above-fold images
/>
```

### In Astro Components
```astro
---
import { getOptimizedImageUrl } from '@/lib/imageOptimization'

const heroImage = getOptimizedImageUrl(tour.primaryImage, {
  width: 1920,
  height: 1080,
  quality: 'auto:best',
  enhance: true
})
---

<img src={heroImage} alt={tour.title} />
```

## 🤖 Automated Optimization Agent

Run periodically to find and fix low-quality images:

```bash
# Run optimization agent
npx tsx src/lib/imageOptimizationAgent.ts

# Add to package.json
"scripts": {
  "optimize:images": "tsx src/lib/imageOptimizationAgent.ts"
}
```

## 📈 Monitoring

### Check Current Quality
```bash
npx tsx analyze-image-quality.ts
```

### Tours Needing Immediate Attention
1. Downhill Biking - 960x476px
2. E-biking in Peaks of the Balkans - 819x1024px
3. Rock Climbing - 768x476px
4. Theth Albania - 753x448px

## 🚨 Important Notes

1. **Cloudinary Free Tier**: 25GB bandwidth/month (enough for ~50k page views)
2. **Upgrade When Needed**: $99/month for 225GB bandwidth
3. **Alternative**: Use Netlify/Vercel built-in optimization
4. **Fallback**: Original images still work if CDN is down

## ✅ Checklist

- [ ] Sign up for Cloudinary account
- [ ] Update CLOUDINARY_CLOUD_NAME
- [ ] Deploy changes
- [ ] Test on live site
- [ ] Monitor bandwidth usage
- [ ] Run optimization agent monthly

## 🎯 Expected Results

After implementation:
- **Page Load**: 2-3x faster
- **Image Quality**: Higher (AI upscaled)
- **Bandwidth**: 50-80% reduction
- **User Experience**: Professional, world-class
- **SEO**: Better Core Web Vitals scores