# 🔐 Security Implementation Guide

## Overview

This guide provides step-by-step instructions for implementing the security patches and hardening the AlbaniaVisit Tours platform. Follow these steps in order to ensure proper security implementation.

## 📋 Pre-Implementation Checklist

- [ ] Backup current production database
- [ ] Create staging environment for testing
- [ ] Review all environment variables
- [ ] Prepare rollback plan
- [ ] Schedule maintenance window
- [ ] Notify team members

## 🚀 Implementation Steps

### Phase 1: Environment Setup (Priority: CRITICAL)

#### 1.1 Secure Environment Variables

Create a `.env.production` file with the following variables:

```bash
# Supabase Configuration (NEVER expose service role key)
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_ANON_KEY=your-anon-key  # Public key only
SUPABASE_SERVICE_ROLE_KEY=your-service-key  # Server-side only

# Security Keys
ENCRYPTION_KEY=generate-strong-32-char-key
ENCRYPTION_SALT=generate-unique-salt
HMAC_SECRET=generate-hmac-secret
COOKIE_SECRET=generate-cookie-secret
API_SECRET_KEY=generate-api-secret

# External Services
RECAPTCHA_SITE_KEY=your-recaptcha-v3-site-key
RECAPTCHA_SECRET_KEY=your-recaptcha-v3-secret
RESEND_KEY=your-resend-api-key

# Analytics (optional)
GA4_ID=your-ga4-measurement-id
ANALYTICS_ENDPOINT=your-analytics-endpoint

# Site Configuration
SITE=https://tours.albaniavisit.com
NODE_ENV=production
```

#### 1.2 Generate Secure Keys

Run this script to generate secure keys:

```javascript
// generate-keys.js
const crypto = require('crypto');

console.log('ENCRYPTION_KEY=' + crypto.randomBytes(32).toString('hex'));
console.log('ENCRYPTION_SALT=' + crypto.randomBytes(16).toString('hex'));
console.log('HMAC_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('COOKIE_SECRET=' + crypto.randomBytes(32).toString('hex'));
console.log('API_SECRET_KEY=' + crypto.randomBytes(32).toString('hex'));
```

### Phase 2: Database Security (Priority: CRITICAL)

#### 2.1 Update Supabase RLS Policies

```sql
-- Enable RLS on all tables
ALTER TABLE tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE inquiries ENABLE ROW LEVEL SECURITY;
ALTER TABLE clicks ENABLE ROW LEVEL SECURITY;

-- Create policies for tours (public read)
CREATE POLICY "Tours are viewable by everyone" 
ON tours FOR SELECT 
USING (is_active = true);

-- Create policies for inquiries (insert only)
CREATE POLICY "Anyone can create inquiries" 
ON inquiries FOR INSERT 
WITH CHECK (true);

-- Restrict inquiry reads to service role
CREATE POLICY "Only service role can read inquiries" 
ON inquiries FOR SELECT 
USING (auth.jwt()->>'role' = 'service_role');

-- Create policies for clicks (insert only)
CREATE POLICY "Anyone can log clicks" 
ON clicks FOR INSERT 
WITH CHECK (true);
```

#### 2.2 Add Security Columns

```sql
-- Add security tracking columns to inquiries
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS ip_address_anonymized VARCHAR(45);
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consent_given BOOLEAN DEFAULT false;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consent_timestamp BIGINT;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consent_marketing BOOLEAN DEFAULT false;
ALTER TABLE inquiries ADD COLUMN IF NOT EXISTS consent_analytics BOOLEAN DEFAULT false;

-- Add security tracking to clicks
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS tracking_id VARCHAR(64);
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS user_agent_hash VARCHAR(64);
ALTER TABLE clicks ADD COLUMN IF NOT EXISTS ip_anonymized VARCHAR(45);

-- Create audit log table
CREATE TABLE IF NOT EXISTS audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type VARCHAR(50) NOT NULL,
  entity_id VARCHAR(255),
  user_id VARCHAR(255),
  ip_anonymized VARCHAR(45),
  user_agent_hash VARCHAR(64),
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Index for performance
CREATE INDEX idx_audit_logs_event_type ON audit_logs(event_type);
CREATE INDEX idx_audit_logs_created_at ON audit_logs(created_at);
```

### Phase 3: Code Implementation (Priority: HIGH)

#### 3.1 Replace API Endpoints

1. **Backup existing endpoints:**
```bash
cp src/pages/api/inquiries.ts src/pages/api/inquiries-old.ts
cp src/pages/api/out/[slug].ts src/pages/api/out/[slug]-old.ts
```

2. **Deploy secure endpoints:**
- Copy `inquiries-secure.ts` to `inquiries.ts`
- Copy `out-secure/[slug].ts` to `out/[slug].ts`

3. **Update imports in components:**
```typescript
// In InquiryForm.tsx
const response = await fetch('/api/inquiries', {
  method: 'POST',
  headers: { 
    'Content-Type': 'application/json',
    'X-CSRF-Token': csrfToken // Add CSRF token
  },
  // ... rest of the code
})
```

#### 3.2 Update Netlify Configuration

```bash
# Backup current config
cp netlify.toml netlify-backup.toml

# Deploy secure config
cp netlify-secure.toml netlify.toml
```

#### 3.3 Implement Client-Side Security

Update the `InquiryForm` component:

```typescript
// Add to InquiryForm.tsx
import { useState, useEffect } from 'react'

// Get CSRF token on mount
const [csrfToken, setCSRFToken] = useState('')

useEffect(() => {
  fetch('/api/inquiries', { method: 'GET' })
    .then(res => res.json())
    .then(data => setCSRFToken(data.csrfToken))
}, [])

// Add consent checkboxes
<div className="space-y-2">
  <label className="flex items-center gap-2">
    <input 
      type="checkbox" 
      required
      onChange={(e) => setConsent({...consent, marketing: e.target.checked})}
    />
    <span className="text-sm">I consent to receive marketing communications</span>
  </label>
  <label className="flex items-center gap-2">
    <input 
      type="checkbox" 
      required
      onChange={(e) => setConsent({...consent, analytics: e.target.checked})}
    />
    <span className="text-sm">I consent to analytics tracking</span>
  </label>
</div>
```

### Phase 4: Monitoring & Testing (Priority: HIGH)

#### 4.1 Security Testing Checklist

- [ ] Test rate limiting on all endpoints
- [ ] Verify CSRF protection
- [ ] Test input validation with malicious inputs
- [ ] Check redirect URL validation
- [ ] Verify PII encryption in database
- [ ] Test cookie security
- [ ] Validate security headers with securityheaders.com
- [ ] Run OWASP ZAP scan
- [ ] Test with Burp Suite

#### 4.2 Monitoring Setup

```javascript
// Add to your monitoring service
const securityMetrics = {
  rateLimitHits: 0,
  csrfFailures: 0,
  validationErrors: 0,
  suspiciousRedirects: 0,
  encryptionFailures: 0
}

// Log security events
function logSecurityEvent(type, details) {
  console.error(`SECURITY_EVENT: ${type}`, details)
  // Send to monitoring service
}
```

### Phase 5: Deployment (Priority: CRITICAL)

#### 5.1 Staged Rollout

1. **Stage 1: Deploy to staging**
```bash
git checkout -b security-implementation
git add .
git commit -m "feat: implement comprehensive security hardening"
git push origin security-implementation
```

2. **Stage 2: Test in staging for 48 hours**
- Run automated security tests
- Perform manual penetration testing
- Monitor for errors

3. **Stage 3: Deploy to production**
```bash
# After successful staging tests
git checkout main
git merge security-implementation
git push origin main
```

#### 5.2 Post-Deployment Verification

```bash
# Verify security headers
curl -I https://tours.albaniavisit.com

# Test rate limiting
for i in {1..20}; do curl https://tours.albaniavisit.com/api/search?q=test; done

# Check CSP violations in browser console
# Monitor error logs for security issues
```

## 🔄 Rollback Plan

If issues occur after deployment:

1. **Immediate rollback:**
```bash
git revert HEAD
git push origin main
```

2. **Database rollback:**
```sql
-- Restore from backup if needed
-- Remove new columns if causing issues
ALTER TABLE inquiries DROP COLUMN IF EXISTS ip_address_anonymized;
-- etc.
```

3. **Netlify rollback:**
- Use Netlify dashboard to rollback to previous deployment
- Or restore backup: `cp netlify-backup.toml netlify.toml`

## 📊 Success Metrics

Monitor these metrics post-deployment:

- **Security Score:** Should be A+ on securityheaders.com
- **Rate Limit Effectiveness:** <1% legitimate users affected
- **Performance Impact:** <5% increase in response time
- **Error Rate:** <0.1% increase in 5xx errors
- **Conversion Rate:** No negative impact on bookings

## 🚨 Emergency Contacts

- Security Team Lead: security@albaniavisit.com
- DevOps On-Call: +1-xxx-xxx-xxxx
- Supabase Support: support.supabase.com
- Netlify Support: support.netlify.com

## 📝 Maintenance Schedule

### Daily
- Review security logs
- Check rate limit metrics
- Monitor error rates

### Weekly
- Run automated security scans
- Review audit logs
- Update dependencies

### Monthly
- Penetration testing
- Security policy review
- Key rotation

### Quarterly
- Full security audit
- Update security.txt
- Review and update RLS policies

## 🎯 Next Steps

After successful implementation:

1. Schedule security training for team
2. Implement Web Application Firewall (WAF)
3. Set up Security Information and Event Management (SIEM)
4. Establish bug bounty program
5. Obtain security certifications (ISO 27001, SOC 2)

## 📚 Additional Resources

- [OWASP Security Guidelines](https://owasp.org)
- [Supabase Security Best Practices](https://supabase.com/docs/guides/security)
- [Netlify Security Features](https://docs.netlify.com/security)
- [GDPR Compliance Checklist](https://gdpr.eu/checklist)

---

**Remember:** Security is an ongoing process, not a one-time implementation. Regular reviews and updates are essential to maintain a secure platform.