# Security Setup Guide - AV Tours EZ

This guide provides step-by-step instructions to configure all security features for production deployment.

## 1. Database Security Setup

### Configure Supabase Row Level Security

1. **Login to your Supabase Dashboard**
   ```
   https://supabase.com/dashboard
   ```

2. **Navigate to SQL Editor**
   - Go to your project
   - Click "SQL Editor" in the sidebar

3. **Execute RLS Policies**
   - Copy the entire content from `src/lib/security/rls-policies.sql`
   - Paste and execute in SQL Editor
   - Verify all policies are created successfully

4. **Verify RLS is Enabled**
   ```sql
   SELECT schemaname, tablename, rowsecurity 
   FROM pg_tables 
   WHERE schemaname = 'public' 
   AND rowsecurity = true;
   ```

## 2. Admin Authentication Setup

### Generate Secure Admin Credentials

1. **Create Admin Password Hash**
   ```bash
   cd "your-project-directory"
   node -p "
   const crypto = require('crypto');
   const password = 'YourSecureAdminPassword123!';
   const salt = crypto.randomBytes(32).toString('hex');
   const hash = crypto.pbkdf2Sync(password, salt, 100000, 64, 'sha512').toString('hex');
   console.log('ADMIN_USERNAME=admin');
   console.log('ADMIN_PASSWORD_HASH=' + hash);
   console.log('ADMIN_SALT=' + salt);
   "
   ```

2. **Set Environment Variables**
   ```bash
   # In your .env file
   ADMIN_USERNAME=admin
   ADMIN_PASSWORD_HASH=your_generated_hash
   ADMIN_SALT=your_generated_salt
   ```

3. **Test Admin Login**
   ```bash
   curl -X POST http://localhost:4321/api/admin/login \
   -H "Content-Type: application/json" \
   -d '{"username":"admin","password":"YourSecureAdminPassword123!"}'
   ```

## 3. Environment Variables Configuration

### Required Environment Variables

```bash
# Database Configuration
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
PUBLIC_SUPABASE_ANON_KEY=your_anon_key

# Admin Authentication
ADMIN_USERNAME=admin
ADMIN_PASSWORD_HASH=your_generated_hash
ADMIN_SALT=your_generated_salt

# Security Configuration
SECURITY_MONITORING_ENABLED=true
RATE_LIMITING_ENABLED=true

# API Keys (if using)
API_SECRET_KEY=your_api_secret_key
HMAC_SECRET=your_hmac_secret
```

### Netlify Environment Variables

If deploying on Netlify:

1. Go to your Netlify dashboard
2. Select your site
3. Go to Site Settings > Environment Variables
4. Add all the above variables

## 4. Content Security Policy (CSP) Configuration

### Update netlify.toml

```toml
[[headers]]
  for = "/*"
  [headers.values]
    Content-Security-Policy = """
      default-src 'self';
      script-src 'self' 'nonce-{NONCE}' https://www.googletagmanager.com https://www.google-analytics.com;
      style-src 'self' 'unsafe-inline';
      img-src 'self' data: https: blob:;
      font-src 'self' data:;
      connect-src 'self' https://*.supabase.co https://www.google-analytics.com;
      frame-src 'none';
      object-src 'none';
      base-uri 'self';
      form-action 'self';
      frame-ancestors 'none';
      upgrade-insecure-requests;
      block-all-mixed-content;
    """
    Strict-Transport-Security = "max-age=31536000; includeSubDomains; preload"
    X-Content-Type-Options = "nosniff"
    X-Frame-Options = "DENY"
    X-XSS-Protection = "1; mode=block"
    Referrer-Policy = "strict-origin-when-cross-origin"
```

## 5. Rate Limiting Configuration

### API Endpoint Protection

Rate limiting is automatically applied to:
- `/api/inquiries` - 5 requests per 15 minutes
- `/api/search` - 30 requests per minute
- `/api/admin/*` - 10 requests per minute
- `/api/tours` - 60 requests per minute

### Custom Rate Limit Configuration

```typescript
// In your API endpoints
import { rateLimiters, createAdvancedRateLimitMiddleware } from '@/lib/security/advanced-rate-limiter'

// Use predefined limiters
const rateLimitMiddleware = createAdvancedRateLimitMiddleware(rateLimiters.api)

export const GET: APIRoute = async (context) => {
  return rateLimitMiddleware(context, async () => {
    // Your endpoint logic here
  })
}
```

## 6. Input Validation Setup

### Secure Schema Usage

```typescript
import { secureSchemas } from '@/lib/security/comprehensive-validator'

const inputSchema = z.object({
  email: secureSchemas.secureEmail(),
  name: secureSchemas.secureString(2, 100),
  message: secureSchemas.secureString(10, 1000),
  phone: secureSchemas.securePhone()
})
```

### Custom Validation

```typescript
import { SecurityValidator } from '@/lib/security/comprehensive-validator'

// Security scan any input
const scan = SecurityValidator.securityScan(userInput)
if (!scan.safe) {
  console.error('Security threats detected:', scan.threats)
  // Handle malicious input
}
```

## 7. Security Monitoring Setup

### Enable Security Logging

```typescript
// In your API endpoints
import { auditDatabaseOperation } from '@/lib/security/secure-db-client'

// Log important operations
await auditDatabaseOperation(
  client,
  'update',
  'tours',
  recordId,
  userId,
  { action: 'price_update' }
)
```

### Monitor Admin Activities

All admin activities are automatically logged to the `admin_audit_logs` table:
- Login attempts (successful/failed)
- Permission violations
- Administrative actions
- Session management events

## 8. Testing Security Configuration

### Run Security Tests

```bash
# Run all security tests
pnpm test tests/security/ --run

# Run specific security tests
pnpm test tests/security/input-validation.test.ts --run
pnpm test tests/security/admin-auth.test.ts --run
pnpm test tests/security/rate-limiting.test.ts --run
pnpm test tests/security/sql-injection.test.ts --run
```

### Manual Security Testing

1. **Test Admin Authentication**
   ```bash
   # Test login
   curl -X POST http://localhost:4321/api/admin/login \
     -H "Content-Type: application/json" \
     -d '{"username":"admin","password":"wrong_password"}'
   
   # Should return 401 Unauthorized
   ```

2. **Test Rate Limiting**
   ```bash
   # Make multiple rapid requests
   for i in {1..15}; do
     curl http://localhost:4321/api/search?q=test
   done
   
   # Should return 429 Too Many Requests after limit
   ```

3. **Test Input Validation**
   ```bash
   # Test SQL injection protection
   curl -X POST http://localhost:4321/api/inquiries \
     -H "Content-Type: application/json" \
     -d '{"name":"'; DROP TABLE users; --"}'
   
   # Should return 400 Bad Request with validation error
   ```

## 9. Production Deployment Checklist

### Pre-Deployment Security Verification

- [ ] All environment variables are set in production
- [ ] RLS policies are applied to Supabase database
- [ ] Admin credentials are generated and secure
- [ ] CSP headers are configured
- [ ] Rate limiting is enabled
- [ ] Security tests pass
- [ ] Monitoring and logging are enabled

### Post-Deployment Security Verification

1. **Verify HTTPS is enforced**
2. **Test all security headers are present**
   ```bash
   curl -I https://your-domain.com/
   ```
3. **Verify rate limiting works in production**
4. **Test admin authentication in production**
5. **Check security logs are being generated**

## 10. Ongoing Security Maintenance

### Weekly Tasks
- [ ] Review failed authentication logs
- [ ] Check for unusual traffic patterns
- [ ] Monitor blocked security threats

### Monthly Tasks
- [ ] Review and update bot detection patterns
- [ ] Update security dependencies
- [ ] Review admin access logs

### Quarterly Tasks
- [ ] Conduct security penetration testing
- [ ] Review and update security policies
- [ ] Update incident response procedures

## 11. Security Incident Response

### If Security Breach Detected

1. **Immediate Actions**
   - Block suspicious IP addresses
   - Revoke compromised admin sessions
   - Enable additional monitoring

2. **Investigation**
   - Review audit logs in `admin_audit_logs` table
   - Check failed authentication patterns
   - Analyze blocked security threats

3. **Recovery**
   - Reset admin credentials if compromised
   - Update security policies as needed
   - Document lessons learned

## 12. Contact and Support

For security questions or issues:

1. **Review Security Audit Report**: `SECURITY-AUDIT-REPORT.md`
2. **Check Security Logs**: Monitor `admin_audit_logs` table in Supabase
3. **Run Security Tests**: Execute test suite to verify functionality

---

**Important**: Keep this configuration guide secure and do not commit actual passwords or keys to version control.

---

*This guide ensures your AV Tours EZ application is deployed with enterprise-grade security. Follow all steps carefully for maximum protection.*