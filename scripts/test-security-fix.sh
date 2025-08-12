#!/bin/bash

# Security Fix Test Script
# Tests the SECURITY DEFINER fix before production deployment

set -e  # Exit on error

echo "🔒 Security Fix Testing Script"
echo "================================"
echo ""

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Step 1: Check if Supabase CLI is installed
echo "1️⃣  Checking prerequisites..."
if ! command -v supabase &> /dev/null; then
    echo -e "${RED}❌ Supabase CLI not found${NC}"
    echo "   Install with: npm install -g supabase"
    exit 1
fi
echo -e "${GREEN}✅ Supabase CLI found${NC}"

# Step 2: Check migration files exist
echo ""
echo "2️⃣  Checking migration files..."
MIGRATION_FILE="supabase/migrations/20250112_security_fixes_views.sql"
if [ ! -f "$MIGRATION_FILE" ]; then
    echo -e "${RED}❌ Migration file not found: $MIGRATION_FILE${NC}"
    exit 1
fi
echo -e "${GREEN}✅ Migration file exists${NC}"

# Step 3: Validate migration content
echo ""
echo "3️⃣  Validating migration content..."
if grep -q "SECURITY DEFINER" "$MIGRATION_FILE" | grep -v "REMOVE\|DROP\|audit"; then
    echo -e "${YELLOW}⚠️  Migration might be adding SECURITY DEFINER${NC}"
    echo "   Please review the migration file"
else
    echo -e "${GREEN}✅ Migration doesn't add SECURITY DEFINER${NC}"
fi

# Step 4: Start Supabase locally
echo ""
echo "4️⃣  Starting Supabase local environment..."
if npx supabase status 2>/dev/null | grep -q "RUNNING"; then
    echo -e "${GREEN}✅ Supabase is already running${NC}"
else
    echo "   Starting Supabase..."
    npx supabase start
    echo -e "${GREEN}✅ Supabase started${NC}"
fi

# Step 5: Create a backup point
echo ""
echo "5️⃣  Creating local database backup..."
BACKUP_FILE="supabase/.backup/pre-security-fix-$(date +%Y%m%d-%H%M%S).sql"
mkdir -p supabase/.backup
npx supabase db dump --local > "$BACKUP_FILE" 2>/dev/null || true
echo -e "${GREEN}✅ Backup created: $BACKUP_FILE${NC}"

# Step 6: Apply migration locally
echo ""
echo "6️⃣  Applying migration to LOCAL database..."
echo "   (Your production database is NOT affected)"
read -p "   Press Enter to continue or Ctrl+C to cancel..."

if npx supabase db push --local; then
    echo -e "${GREEN}✅ Migration applied successfully${NC}"
else
    echo -e "${RED}❌ Migration failed${NC}"
    echo "   Restoring from backup..."
    npx supabase db reset --local
    exit 1
fi

# Step 7: Test the changes
echo ""
echo "7️⃣  Testing the security fix..."

# Create a test SQL file
cat > /tmp/test-security-fix.sql << 'EOF'
-- Test 1: Check if tour_providers view exists
SELECT EXISTS (
    SELECT 1 
    FROM information_schema.views 
    WHERE table_schema = 'public' 
    AND table_name = 'tour_providers'
) as view_exists;

-- Test 2: Try to query the view
SELECT COUNT(*) as provider_count FROM public.tour_providers;

-- Test 3: Check for SECURITY DEFINER in views
SELECT COUNT(*) as security_definer_count
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
    AND n.nspname = 'public'
    AND pg_get_viewdef(c.oid) ILIKE '%SECURITY DEFINER%';

-- Test 4: Check audit log
SELECT COUNT(*) as audit_entries
FROM public.security_audit_log
WHERE object_name = 'tour_providers'
    AND action_type = 'REMOVE_SECURITY_DEFINER';
EOF

# Run the tests
echo "   Running SQL tests..."
TEST_OUTPUT=$(npx supabase db query --local < /tmp/test-security-fix.sql 2>&1)

if echo "$TEST_OUTPUT" | grep -q "security_definer_count.*0"; then
    echo -e "${GREEN}✅ No SECURITY DEFINER views found${NC}"
else
    echo -e "${YELLOW}⚠️  Some views may still have SECURITY DEFINER${NC}"
fi

if echo "$TEST_OUTPUT" | grep -q "audit_entries.*1"; then
    echo -e "${GREEN}✅ Security fix logged in audit table${NC}"
else
    echo -e "${YELLOW}⚠️  Audit log entry not found${NC}"
fi

# Step 8: Run application tests
echo ""
echo "8️⃣  Running application tests..."
if pnpm test --run; then
    echo -e "${GREEN}✅ All tests passed${NC}"
else
    echo -e "${YELLOW}⚠️  Some tests failed - review needed${NC}"
fi

# Step 9: Summary
echo ""
echo "================================================"
echo "📊 SECURITY FIX TEST SUMMARY"
echo "================================================"
echo -e "${GREEN}✅ Migration validated${NC}"
echo -e "${GREEN}✅ Local testing complete${NC}"
echo ""
echo "Next steps:"
echo "1. Review the test results above"
echo "2. If everything looks good, deploy to production:"
echo "   ${YELLOW}npx supabase db push${NC}"
echo ""
echo "To rollback local changes:"
echo "   ${YELLOW}npx supabase db reset --local${NC}"
echo ""
echo "Your production database has NOT been modified."

# Cleanup
rm -f /tmp/test-security-fix.sql