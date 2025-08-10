# Microsoft Clarity Cross-Domain Tracking Setup

## Configuration Complete ✅

Your Microsoft Clarity has been successfully configured for cross-domain session tracking between:
- **Main site:** albaniavisit.com (WordPress)
- **Tours subdomain:** tours.albaniavisit.com (React/Astro)

## Project Details
- **Project ID:** h6lok3y5lg
- **Project Name:** albaniavisit.com
- **Tracking Script:** Installed in BaseLayout.astro

## How Cross-Domain Tracking Works

1. **Same Project ID**: Both sites use the same Clarity project ID (h6lok3y5lg)
2. **Session Stitching**: Clarity automatically links sessions when users navigate between domains
3. **Unified Dashboard**: View all sessions in one Clarity dashboard at clarity.microsoft.com

## Verification Steps

1. **Deploy to Production**
   ```bash
   npm run build
   # Deploy to Netlify
   ```

2. **Test Cross-Domain Journey**
   - Visit albaniavisit.com
   - Navigate to tours.albaniavisit.com
   - Perform some actions on both sites

3. **Check Clarity Dashboard**
   - Go to [Microsoft Clarity Dashboard](https://clarity.microsoft.com)
   - Look for sessions from both domains:
     - Sessions from `albaniavisit.com`
     - Sessions from `tours.albaniavisit.com`
   - Sessions should be linked when users navigate between domains

## Filter Sessions by Domain

In Clarity dashboard, you can filter sessions by hostname:
- Click "Filters" 
- Add filter: URL → Contains → `albaniavisit.com` (for main site)
- Or: URL → Contains → `tours.albaniavisit.com` (for tours subdomain)

## Optional: GA4 Integration

To connect Google Analytics 4 with Clarity for enhanced insights:
1. In Clarity dashboard → Settings → Setup
2. Click "Connect Google Analytics"
3. Select your GA4 property
4. This enables:
   - Direct links from GA4 to session replays
   - Enhanced user journey analysis
   - Conversion tracking with visual context

## Benefits of Cross-Domain Tracking

- **Complete User Journeys**: See how users move between your main site and tours
- **Conversion Analysis**: Track users from blog posts to tour bookings
- **UX Insights**: Identify friction points across the entire funnel
- **Single Dashboard**: No need to switch between multiple Clarity projects

## Troubleshooting

If sessions aren't appearing:
1. Clear browser cache and cookies
2. Check browser console for Clarity errors
3. Verify the script loads on both domains (Network tab)
4. Ensure no ad blockers are interfering
5. Wait 2-3 minutes for data to appear in dashboard

## Privacy & Compliance

- Clarity automatically masks sensitive data
- No PII is captured by default
- Sessions are anonymized
- Compliant with GDPR and other privacy regulations