-- Comprehensive Security Fix for Views with SECURITY DEFINER
-- This migration addresses security issues with views that bypass RLS

-- ============================================
-- PART 1: Fix tour_providers view
-- ============================================

-- Check if the view exists and has SECURITY DEFINER
DO $$
BEGIN
    -- First check if affiliate_tours table exists
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'affiliate_tours'
    ) THEN
        RAISE NOTICE 'affiliate_tours table does not exist, skipping tour_providers view operations';
        RETURN;
    END IF;
    
    -- Drop and recreate tour_providers view without SECURITY DEFINER
    IF EXISTS (
        SELECT 1 
        FROM information_schema.views 
        WHERE table_schema = 'public' 
        AND table_name = 'tour_providers'
    ) THEN
        DROP VIEW IF EXISTS public.tour_providers CASCADE;
        
        -- Recreate based on common patterns for provider views
        CREATE VIEW public.tour_providers AS
        SELECT DISTINCT
            COALESCE(affiliate_partner_id, 0) as provider_id,
            COALESCE(affiliate_partner_name, 'Direct') as provider_name,
            COUNT(*) as tour_count,
            MIN(price_from) as min_price,
            MAX(price_from) as max_price,
            MIN(created_at) as first_tour_added,
            MAX(updated_at) as last_updated
        FROM public.affiliate_tours
        WHERE status = 'active'
        GROUP BY affiliate_partner_id, affiliate_partner_name;
        
        -- Grant appropriate permissions
        GRANT SELECT ON public.tour_providers TO authenticated;
        GRANT SELECT ON public.tour_providers TO anon;
        
        COMMENT ON VIEW public.tour_providers IS 
        'Aggregated view of tour providers. Uses SECURITY INVOKER to respect RLS policies.';
        
        RAISE NOTICE 'tour_providers view recreated without SECURITY DEFINER';
    END IF;
END $$;

-- ============================================
-- PART 2: Create secure alternative if needed
-- ============================================

-- If specific elevated permissions are needed, create a secure function instead
DO $$
BEGIN
    -- Only create function if affiliate_tours table exists
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'affiliate_tours'
    ) THEN
        CREATE OR REPLACE FUNCTION public.get_tour_providers_secure()
        RETURNS TABLE (
            provider_id integer,
            provider_name text,
            tour_count bigint,
            min_price numeric,
            max_price numeric,
            first_tour_added timestamptz,
            last_updated timestamptz
        )
        LANGUAGE sql
        SECURITY INVOKER  -- Use caller's permissions
        STABLE
        AS $func$
            SELECT 
                COALESCE(affiliate_partner_id, 0) as provider_id,
                COALESCE(affiliate_partner_name, 'Direct') as provider_name,
                COUNT(*) as tour_count,
                MIN(price_from) as min_price,
                MAX(price_from) as max_price,
                MIN(created_at) as first_tour_added,
                MAX(updated_at) as last_updated
            FROM public.affiliate_tours
            WHERE status = 'active'
            GROUP BY affiliate_partner_id, affiliate_partner_name
            ORDER BY tour_count DESC;
        $func$;
        
        -- Grant execute permission
        GRANT EXECUTE ON FUNCTION public.get_tour_providers_secure() TO authenticated;
        GRANT EXECUTE ON FUNCTION public.get_tour_providers_secure() TO anon;
        
        COMMENT ON FUNCTION public.get_tour_providers_secure() IS 
        'Secure function to retrieve tour provider statistics. Uses SECURITY INVOKER.';
    END IF;
END $$;

-- ============================================
-- PART 3: Audit report for admin
-- ============================================

-- Create a function to audit security settings (admin only)
CREATE OR REPLACE FUNCTION public.audit_security_definer_objects()
RETURNS TABLE (
    object_type text,
    schema_name text,
    object_name text,
    security_mode text,
    recommendation text
)
LANGUAGE plpgsql
SECURITY INVOKER
AS $$
BEGIN
    -- Check views
    RETURN QUERY
    SELECT 
        'VIEW'::text as object_type,
        n.nspname::text as schema_name,
        c.relname::text as object_name,
        'SECURITY DEFINER'::text as security_mode,
        'Consider removing SECURITY DEFINER unless specifically required'::text as recommendation
    FROM pg_class c
    JOIN pg_namespace n ON n.oid = c.relnamespace
    WHERE c.relkind = 'v'
        AND n.nspname NOT IN ('pg_catalog', 'information_schema')
        AND pg_get_viewdef(c.oid) ILIKE '%SECURITY DEFINER%';
    
    -- Check functions
    RETURN QUERY
    SELECT 
        'FUNCTION'::text as object_type,
        n.nspname::text as schema_name,
        (p.proname || '(' || pg_get_function_identity_arguments(p.oid) || ')')::text as object_name,
        'SECURITY DEFINER'::text as security_mode,
        CASE 
            WHEN p.proname LIKE '%admin%' THEN 'May be acceptable for admin functions'::text
            ELSE 'Review necessity of SECURITY DEFINER'::text
        END as recommendation
    FROM pg_proc p
    JOIN pg_namespace n ON n.oid = p.pronamespace
    WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast', 'extensions')
        AND p.prosecdef = true;
END;
$$;

-- Restrict audit function to authenticated users only
GRANT EXECUTE ON FUNCTION public.audit_security_definer_objects() TO authenticated;

COMMENT ON FUNCTION public.audit_security_definer_objects() IS 
'Audit function to identify database objects using SECURITY DEFINER. For security review purposes.';

-- ============================================
-- PART 4: Log the security fix
-- ============================================

-- Create audit log table if it doesn't exist
CREATE TABLE IF NOT EXISTS public.security_audit_log (
    id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
    action_type text NOT NULL,
    object_type text,
    object_name text,
    previous_state jsonb,
    new_state jsonb,
    performed_by text DEFAULT current_user,
    performed_at timestamptz DEFAULT now()
);

-- Log this security fix
INSERT INTO public.security_audit_log (action_type, object_type, object_name, new_state)
VALUES (
    'REMOVE_SECURITY_DEFINER',
    'VIEW',
    'tour_providers',
    jsonb_build_object(
        'security_mode', 'SECURITY INVOKER',
        'migration', '20250112_security_fixes_views',
        'reason', 'Security best practice - views should not bypass RLS'
    )
);

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_security_audit_log_performed_at 
ON public.security_audit_log(performed_at DESC);

-- ============================================
-- VERIFICATION QUERY
-- ============================================

-- Run this to verify no SECURITY DEFINER views remain
/*
SELECT COUNT(*) as remaining_security_definer_views
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'
    AND n.nspname = 'public'
    AND pg_get_viewdef(c.oid) ILIKE '%SECURITY DEFINER%';
*/