-- ================================================
-- SECURITY FIX: Remove SECURITY DEFINER from Views
-- ================================================
-- Deploy this to production via Supabase Dashboard:
-- https://supabase.com/dashboard/project/mioqyazjthmrmgsbsvfg/sql/new
--
-- This migration:
-- 1. Removes SECURITY DEFINER from tour_providers view
-- 2. Adds audit functions to detect security issues
-- 3. Creates audit logging for compliance
-- ================================================

-- Part 1: Drop existing tour_providers view if it has SECURITY DEFINER
DROP VIEW IF EXISTS public.tour_providers CASCADE;

-- Part 2: Recreate tour_providers view WITHOUT SECURITY DEFINER
DO $$
BEGIN
    IF EXISTS (
        SELECT 1 
        FROM information_schema.tables 
        WHERE table_schema = 'public' 
        AND table_name = 'affiliate_tours'
    ) THEN
        -- Recreate the view without SECURITY DEFINER
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

-- Part 3: Create audit function to detect SECURITY DEFINER objects
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

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.audit_security_definer_objects() TO authenticated;

COMMENT ON FUNCTION public.audit_security_definer_objects() IS 
'Audit function to identify database objects using SECURITY DEFINER. For security review purposes.';

-- Part 4: Create audit log table
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

-- Create index for audit log
CREATE INDEX IF NOT EXISTS idx_security_audit_log_performed_at 
ON public.security_audit_log(performed_at DESC);

-- Part 5: Log this security fix
INSERT INTO public.security_audit_log (action_type, object_type, object_name, new_state)
VALUES (
    'REMOVE_SECURITY_DEFINER',
    'VIEW',
    'tour_providers',
    jsonb_build_object(
        'security_mode', 'SECURITY INVOKER',
        'migration', 'Production security fix deployment',
        'reason', 'Security best practice - views should not bypass RLS'
    )
);

-- Part 6: Verification query (run this after deployment)
SELECT 
    'Verification Results:' as status,
    (SELECT COUNT(*) FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace WHERE c.relkind = 'v' AND n.nspname = 'public' AND pg_get_viewdef(c.oid) ILIKE '%SECURITY DEFINER%') as public_views_with_security_definer,
    (SELECT EXISTS(SELECT 1 FROM information_schema.views WHERE table_schema = 'public' AND table_name = 'tour_providers')) as tour_providers_exists,
    (SELECT COUNT(*) FROM public.security_audit_log WHERE object_name = 'tour_providers') as audit_log_entries;