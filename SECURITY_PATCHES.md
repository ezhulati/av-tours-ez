# 🔧 Security Patches Implementation Guide

This document contains the critical security patches that need to be applied to fix the vulnerabilities identified in the security audit.

## 📦 Required Dependencies

First, install the necessary security packages:

```bash
npm install --save isomorphic-dompurify
npm install --save-dev @types/dompurify
```

## 🛠️ Critical Security Patches

### 1. Fix XSS in Tour Detail Page Image Navigation

**File:** `/src/pages/tours/[slug].astro`

**Replace the script section (lines 750-942) with:**

```javascript
<script>
  import { sanitizeImageUrl } from '@/lib/security/sanitizer';
  
  // Get tour images from data attribute instead of define:vars
  const tourImagesElement = document.getElementById('tour-images-data');
  const tourImagesRaw = tourImagesElement?.dataset.images || '[]';
  let tourImages = [];
  
  try {
    tourImages = JSON.parse(tourImagesRaw).map(url => sanitizeImageUrl(url));
  } catch (e) {
    console.error('Failed to parse tour images:', e);
    tourImages = ['/placeholder.jpg'];
  }
  
  console.log('Tour detail page initialized with', tourImages.length, 'images');
  
  let currentImageIndex = 0;
  let lightboxIndex = 0;
  let imageTransitionTimeout = null;
  
  // DOM elements
  const heroImage = document.getElementById('hero-image');
  const lightboxModal = document.getElementById('lightbox-modal');
  const lightboxImage = document.getElementById('lightbox-image');
  const lightboxCounter = document.getElementById('lightbox-counter');
  
  // Update thumbnail selection
  function updateThumbnailSelection(index) {
    document.querySelectorAll('.thumbnail-btn').forEach((btn, i) => {
      btn.classList.toggle('ring-2', i === index);
      btn.classList.toggle('ring-accent', i === index);
    });
  }
  
  // Navigate to specific image in hero with race condition fix
  function showHeroImage(index) {
    if (index >= 0 && index < tourImages.length && heroImage) {
      currentImageIndex = index;
      
      // Clear any pending transitions
      if (imageTransitionTimeout) {
        clearTimeout(imageTransitionTimeout);
      }
      
      heroImage.style.opacity = '0';
      imageTransitionTimeout = setTimeout(() => {
        heroImage.src = tourImages[index];
        heroImage.style.opacity = '1';
        imageTransitionTimeout = null;
      }, 150);
      updateThumbnailSelection(index);
    }
  }
  
  // Update lightbox with sanitized URLs
  function updateLightbox(index) {
    if (index >= 0 && index < tourImages.length) {
      lightboxIndex = index;
      if (lightboxImage) lightboxImage.src = tourImages[index];
      if (lightboxCounter) lightboxCounter.textContent = `${index + 1} / ${tourImages.length}`;
      
      // Update lightbox thumbnails
      document.querySelectorAll('.lightbox-thumb').forEach((thumb, i) => {
        thumb.classList.toggle('ring-2', i === index);
        thumb.classList.toggle('ring-white', i === index);
        thumb.classList.toggle('scale-110', i === index);
        thumb.classList.toggle('opacity-60', i !== index);
      });
    }
  }
  
  // Event listeners with proper cleanup
  const prevBtn = document.getElementById('prev-image');
  const nextBtn = document.getElementById('next-image');
  
  if (prevBtn) {
    prevBtn.addEventListener('click', () => {
      const newIndex = currentImageIndex === 0 ? tourImages.length - 1 : currentImageIndex - 1;
      showHeroImage(newIndex);
    });
  }
  
  if (nextBtn) {
    nextBtn.addEventListener('click', () => {
      const newIndex = currentImageIndex === tourImages.length - 1 ? 0 : currentImageIndex + 1;
      showHeroImage(newIndex);
    });
  }
  
  // Thumbnail clicks
  const thumbnails = document.querySelectorAll('.thumbnail-btn');
  thumbnails.forEach((btn) => {
    btn.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index, 10);
      if (!isNaN(index)) {
        showHeroImage(index);
      }
    });
  });
  
  // Lightbox controls
  const openLightboxBtn = document.getElementById('open-lightbox');
  const showAllBtn = document.getElementById('show-all-images');
  
  const openLightbox = () => {
    if (lightboxModal) {
      lightboxModal.classList.remove('hidden');
      document.body.style.overflow = 'hidden';
      updateLightbox(currentImageIndex);
    }
  };
  
  if (openLightboxBtn) {
    openLightboxBtn.addEventListener('click', openLightbox);
  }
  
  if (showAllBtn) {
    showAllBtn.addEventListener('click', () => {
      if (lightboxModal) {
        lightboxModal.classList.remove('hidden');
        document.body.style.overflow = 'hidden';
        updateLightbox(0);
      }
    });
  }
  
  // Close lightbox
  const closeLightbox = () => {
    lightboxModal?.classList.add('hidden');
    document.body.style.overflow = 'auto';
  };
  
  document.getElementById('close-lightbox')?.addEventListener('click', closeLightbox);
  
  // Lightbox navigation
  document.getElementById('lightbox-prev')?.addEventListener('click', () => {
    const newIndex = lightboxIndex === 0 ? tourImages.length - 1 : lightboxIndex - 1;
    updateLightbox(newIndex);
  });
  
  document.getElementById('lightbox-next')?.addEventListener('click', () => {
    const newIndex = lightboxIndex === tourImages.length - 1 ? 0 : lightboxIndex + 1;
    updateLightbox(newIndex);
  });
  
  // Lightbox thumbnail clicks
  document.querySelectorAll('.lightbox-thumb').forEach((thumb) => {
    thumb.addEventListener('click', (e) => {
      const index = parseInt(e.currentTarget.dataset.index, 10);
      if (!isNaN(index)) {
        updateLightbox(index);
      }
    });
  });
  
  // Keyboard navigation with cleanup
  const handleKeydown = (e) => {
    if (lightboxModal?.classList.contains('hidden')) {
      if (e.key === 'ArrowLeft') {
        prevBtn?.click();
      } else if (e.key === 'ArrowRight') {
        nextBtn?.click();
      }
    } else {
      if (e.key === 'ArrowLeft') {
        document.getElementById('lightbox-prev')?.click();
      } else if (e.key === 'ArrowRight') {
        document.getElementById('lightbox-next')?.click();
      } else if (e.key === 'Escape') {
        closeLightbox();
      }
    }
  };
  
  document.addEventListener('keydown', handleKeydown);
  
  // Close lightbox when clicking outside
  lightboxModal?.addEventListener('click', (e) => {
    if (e.target === lightboxModal) {
      closeLightbox();
    }
  });
  
  // Handle inquiry button
  document.getElementById('inquiry-btn')?.addEventListener('click', () => {
    if ('vibrate' in navigator) {
      navigator.vibrate(10);
    }
    const event = new CustomEvent('open-inquiry-form');
    window.dispatchEvent(event);
  });
  
  // Cleanup on page unload
  window.addEventListener('unload', () => {
    document.removeEventListener('keydown', handleKeydown);
    if (imageTransitionTimeout) {
      clearTimeout(imageTransitionTimeout);
    }
  });
  
  // Performance optimizations with passive listeners
  let scrollTimeout;
  window.addEventListener('scroll', () => {
    if (scrollTimeout) {
      window.cancelAnimationFrame(scrollTimeout);
    }
    
    scrollTimeout = window.requestAnimationFrame(() => {
      const images = document.querySelectorAll('img[loading="lazy"]');
      images.forEach(img => {
        const rect = img.getBoundingClientRect();
        if (rect.top < window.innerHeight * 1.5) {
          img.loading = 'eager';
        }
      });
    });
  }, { passive: true });
</script>
```

**Also add this data element before the script:**

```html
<!-- Add this after line 749, before the script tag -->
<div id="tour-images-data" data-images={JSON.stringify(tour.images.map(img => img.url))} style="display: none;"></div>
```

---

### 2. Fix JSON-LD XSS in BaseLayout

**File:** `/src/layouts/BaseLayout.astro`

**Replace line 81-84 with:**

```astro
<!-- JSON-LD with proper escaping -->
{jsonLd && (
  <script type="application/ld+json">
    {JSON.stringify(jsonLd)
      .replace(/</g, '\\u003c')
      .replace(/>/g, '\\u003e')
      .replace(/&/g, '\\u0026')
      .replace(/'/g, '\\u0027')}
  </script>
)}
```

---

### 3. Fix InquiryForm Input Validation

**File:** `/src/components/tours/InquiryForm.tsx`

**Add these imports at the top:**

```typescript
import { sanitizeHtml, sanitizePhone, validateEmail, sanitizeNumber } from '@/lib/security/sanitizer'
import { fetchWithCSRF } from '@/lib/security/csrf'
```

**Replace the handleSubmit function (lines 31-74):**

```typescript
const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault()
  setLoading(true)
  setError('')

  // Validate email
  if (!validateEmail(formData.email)) {
    setError('Please enter a valid email address')
    setLoading(false)
    return
  }

  // Validate phone if provided
  if (formData.phone && formData.phone.length > 0) {
    const cleanPhone = sanitizePhone(formData.phone)
    if (cleanPhone.length < 5) {
      setError('Please enter a valid phone number')
      setLoading(false)
      return
    }
  }

  // Sanitize all inputs
  const sanitizedData = {
    tourId,
    tourSlug,
    name: sanitizeHtml(formData.name).slice(0, 100),
    email: formData.email.toLowerCase().trim(),
    phone: sanitizePhone(formData.phone),
    message: sanitizeHtml(formData.message).slice(0, 1000),
    travelDate: formData.travelDate,
    groupSize: sanitizeNumber(formData.groupSize, 1, 50, 1),
    utm_source: new URLSearchParams(window.location.search).get('utm_source'),
    utm_medium: new URLSearchParams(window.location.search).get('utm_medium'),
    utm_campaign: new URLSearchParams(window.location.search).get('utm_campaign')
  }

  // Additional validation
  if (sanitizedData.name.length < 2) {
    setError('Name must be at least 2 characters')
    setLoading(false)
    return
  }

  if (sanitizedData.message.length < 10) {
    setError('Message must be at least 10 characters')
    setLoading(false)
    return
  }

  try {
    const response = await fetchWithCSRF('/api/inquiries', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(sanitizedData)
    })

    const data = await response.json()

    if (response.ok && data.ok) {
      setSuccess(true)
      setFormData({
        name: '',
        email: '',
        phone: '',
        message: '',
        travelDate: '',
        groupSize: 1
      })
      setTimeout(() => {
        setIsOpen(false)
        setSuccess(false)
      }, 3000)
    } else {
      setError(data.error || 'Failed to send inquiry. Please try again.')
    }
  } catch (err) {
    console.error('Inquiry submission error:', err)
    setError('Network error. Please check your connection and try again.')
  } finally {
    setLoading(false)
  }
}
```

---

### 4. Update CSP in netlify.toml

**File:** `/netlify.toml`

**Replace the headers section with:**

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' https://www.googletagmanager.com https://www.google-analytics.com;
      style-src 'self' 'unsafe-inline' https://fonts.googleapis.com;
      img-src 'self' data: https: blob:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://*.supabase.co https://www.google-analytics.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    """
    X-Frame-Options = "DENY"
    X-Content-Type-Options = "nosniff"
    Referrer-Policy = "strict-origin-when-cross-origin"
    Permissions-Policy = "geolocation=(), microphone=(), camera=()"
```

---

### 5. Remove Console Logging in Production

**File:** `/src/components/tours/BookingButton.tsx`

**Replace all console.log statements with:**

```typescript
// Replace lines 45, 62-65, 73, 81, 139
if (import.meta.env.DEV) {
  console.log('Debug info...'); // Only in development
}
```

---

### 6. Add CSRF Token to BaseLayout

**File:** `/src/layouts/BaseLayout.astro`

**Add after line 79 (before closing </head>):**

```astro
<!-- CSRF Token -->
{Astro.cookies.get('csrf_token') && (
  <meta name="csrf-token" content={Astro.cookies.get('csrf_token')?.value} />
)}
```

---

## 🚀 Deployment Checklist

Before deploying these patches:

1. **Test in Staging:**
   - [ ] All forms submit correctly
   - [ ] Image galleries work properly
   - [ ] Affiliate redirects function
   - [ ] No console errors in production build

2. **Security Verification:**
   - [ ] Run security scanner
   - [ ] Test XSS payloads
   - [ ] Verify CSP headers
   - [ ] Check rate limiting

3. **Performance Check:**
   - [ ] Page load times acceptable
   - [ ] No memory leaks
   - [ ] Mobile performance good

4. **Monitoring Setup:**
   - [ ] Error tracking configured
   - [ ] Security alerts enabled
   - [ ] Performance monitoring active

## 📝 Post-Deployment

1. Monitor error logs for 24 hours
2. Check conversion rates remain stable
3. Review security alerts
4. Schedule penetration test
5. Update security documentation

## 🔐 Additional Recommendations

1. **Implement WAF:** Consider Cloudflare or similar
2. **Regular Updates:** Automate dependency updates
3. **Security Training:** Team security awareness
4. **Incident Response:** Document procedures
5. **Regular Audits:** Quarterly security reviews