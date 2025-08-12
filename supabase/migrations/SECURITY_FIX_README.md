# Security Fix: Remove SECURITY DEFINER from Views

## Issue
The `tour_providers` view was defined with the `SECURITY DEFINER` property, which causes it to execute with the permissions of the view creator rather than the querying user. This bypasses Row Level Security (RLS) policies and can lead to privilege escalation.

## Risk Level
**Medium** - Views with SECURITY DEFINER can expose data that should be restricted by RLS policies.

## Solution
We've created migrations to:
1. Remove SECURITY DEFINER from the `tour_providers` view
2. Audit all database objects for similar security issues
3. Implement secure alternatives where elevated permissions are truly needed

## Migration Files

### 1. `20250112_security_fixes_views.sql` (Main Fix)
- Drops and recreates `tour_providers` view without SECURITY DEFINER
- Creates secure function alternative if elevated access is needed
- Adds audit logging for security changes
- Provides audit function to find other SECURITY DEFINER objects

### 2. `20250112_remove_security_definer_tour_providers.sql` (Simple Fix)
- Standalone migration focused only on the `tour_providers` view
- Use this if you only need to fix the immediate issue

### 3. `20250112_audit_security_definer_views.sql` (Audit Only)
- SQL queries to identify all views and functions with SECURITY DEFINER
- Run this first to assess the scope of the issue

## How to Apply

1. **Run the audit first** (optional but recommended):
```sql
-- Connect to your Supabase database
-- Run the queries in 20250112_audit_security_definer_views.sql
```

2. **Apply the main security fix**:
```bash
# Using Supabase CLI
supabase db push

# Or manually in SQL editor
-- Run 20250112_security_fixes_views.sql
```

3. **Verify the fix**:
```sql
-- Check that no views have SECURITY DEFINER
SELECT COUNT(*) as remaining_issues
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
    AND n.nspname = 'public'
    AND pg_get_viewdef(c.oid) ILIKE '%SECURITY DEFINER%';
-- Should return 0
```

## Best Practices Going Forward

1. **Default to SECURITY INVOKER**: Views and functions should use the caller's permissions by default
2. **Document exceptions**: If SECURITY DEFINER is truly needed, document why
3. **Use RLS properly**: Implement Row Level Security policies instead of relying on SECURITY DEFINER
4. **Regular audits**: Periodically run the audit function to catch new issues

## When SECURITY DEFINER Might Be Acceptable

- Admin-only functions that need elevated privileges
- Specific data aggregation functions where RLS would prevent necessary access
- Well-documented, carefully reviewed security boundaries

Always prefer RLS policies and proper permission grants over SECURITY DEFINER when possible.

## Testing

After applying the migration:
1. Test that the application still works correctly
2. Verify that unauthorized users cannot access restricted data
3. Check that legitimate users can still access their allowed data
4. Review any dependent views or functions

## Rollback

If issues occur, you can restore the original behavior:
```sql
-- Recreate with SECURITY DEFINER (NOT RECOMMENDED)
DROP VIEW IF EXISTS public.tour_providers;
CREATE VIEW public.tour_providers 
WITH (security_barrier = true, security_invoker = false)
AS [original view definition]
WITH SECURITY DEFINER;
```

However, it's better to fix the underlying permission issues rather than reverting to SECURITY DEFINER.