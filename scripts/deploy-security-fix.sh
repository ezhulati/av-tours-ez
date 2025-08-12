#!/bin/bash

# Deploy Security Fix to Production
# This script deploys the security fix migrations to production Supabase

set -e

echo "🔒 Security Fix Deployment Script"
echo "=================================="
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Check if logged in to Supabase
echo "1️⃣  Checking Supabase authentication..."
if ! npx supabase projects list &>/dev/null; then
    echo -e "${YELLOW}⚠️  Not logged in to Supabase${NC}"
    echo "   Please run: npx supabase login"
    echo "   Then run this script again."
    exit 1
fi
echo -e "${GREEN}✅ Authenticated with Supabase${NC}"

# Link to production project
echo ""
echo "2️⃣  Linking to production project..."
PROJECT_REF="mioqyazjthmrmgsbsvfg"
if [ -f "supabase/.temp/project-ref" ]; then
    LINKED_REF=$(cat supabase/.temp/project-ref)
    if [ "$LINKED_REF" = "$PROJECT_REF" ]; then
        echo -e "${GREEN}✅ Already linked to project: $PROJECT_REF${NC}"
    else
        npx supabase link --project-ref $PROJECT_REF
        echo -e "${GREEN}✅ Linked to project: $PROJECT_REF${NC}"
    fi
else
    npx supabase link --project-ref $PROJECT_REF
    echo -e "${GREEN}✅ Linked to project: $PROJECT_REF${NC}"
fi

# Show which migrations will be deployed
echo ""
echo "3️⃣  Migrations to deploy:"
echo "   • 20250113_audit_security_definer_views.sql - Audit queries for SECURITY DEFINER"
echo "   • 20250114_remove_security_definer_tour_providers.sql - Remove SECURITY DEFINER from tour_providers"
echo "   • 20250115_security_fixes_views.sql - Comprehensive security fixes with audit logging"

# Confirm deployment
echo ""
echo -e "${YELLOW}⚠️  WARNING: This will deploy to PRODUCTION${NC}"
echo "   The following changes will be made:"
echo "   - Remove SECURITY DEFINER from tour_providers view"
echo "   - Add audit functions to detect SECURITY DEFINER objects"
echo "   - Create security audit log table"
echo ""
read -p "   Do you want to continue? (yes/no): " CONFIRM

if [ "$CONFIRM" != "yes" ]; then
    echo -e "${RED}❌ Deployment cancelled${NC}"
    exit 1
fi

# Deploy migrations
echo ""
echo "4️⃣  Deploying migrations to production..."
if npx supabase db push; then
    echo -e "${GREEN}✅ Migrations deployed successfully${NC}"
else
    echo -e "${RED}❌ Migration deployment failed${NC}"
    exit 1
fi

# Verify deployment
echo ""
echo "5️⃣  Verifying deployment..."
cat > /tmp/verify-prod-security.sql << 'EOF'
-- Check for views with SECURITY DEFINER
SELECT COUNT(*) as security_definer_views
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
    AND n.nspname = 'public'
    AND pg_get_viewdef(c.oid) ILIKE '%SECURITY DEFINER%';

-- Check if tour_providers view exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'tour_providers'
) as tour_providers_exists;

-- Check audit log
SELECT COUNT(*) as audit_entries
FROM public.security_audit_log
WHERE object_name = 'tour_providers'
    AND action_type = 'REMOVE_SECURITY_DEFINER';
EOF

echo "   Run these verification queries in Supabase Studio to confirm:"
echo "   - No public views should have SECURITY DEFINER"
echo "   - tour_providers view should exist (if affiliate_tours table exists)"
echo "   - Security audit log should have an entry for the fix"

# Summary
echo ""
echo "================================================"
echo "📊 DEPLOYMENT SUMMARY"
echo "================================================"
echo -e "${GREEN}✅ Security fix deployed to production${NC}"
echo ""
echo "Next steps:"
echo "1. Open Supabase Studio: https://supabase.com/dashboard/project/$PROJECT_REF/editor"
echo "2. Run the verification queries shown above"
echo "3. Test your application to ensure everything works"
echo "4. Commit and push changes to git"
echo ""
echo "To rollback if needed:"
echo "   Create a new migration that recreates the view with SECURITY DEFINER"
echo "   (Not recommended - fix permission issues instead)"

# Cleanup
rm -f /tmp/verify-prod-security.sql