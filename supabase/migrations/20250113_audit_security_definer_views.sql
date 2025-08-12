-- Audit script to find all views with SECURITY DEFINER property
-- This helps identify other potential security issues

-- Query to find all views with SECURITY DEFINER
SELECT 
    n.nspname as schema_name,
    c.relname as view_name,
    pg_get_viewdef(c.oid) as view_definition,
    CASE 
        WHEN c.relrowsecurity THEN 'RLS ENABLED'
        ELSE 'NO RLS'
    END as rls_status,
    obj_description(c.oid, 'pg_class') as comment
FROM pg_class c
JOIN pg_namespace n ON n.oid = c.relnamespace
WHERE c.relkind = 'v'  -- views only
    AND n.nspname NOT IN ('pg_catalog', 'information_schema')  -- exclude system schemas
    AND pg_get_viewdef(c.oid) ILIKE '%SECURITY DEFINER%'
ORDER BY n.nspname, c.relname;

-- Additional check for functions with SECURITY DEFINER
-- Functions can also have this security issue
SELECT 
    n.nspname as schema_name,
    p.proname as function_name,
    pg_get_function_identity_arguments(p.oid) as arguments,
    CASE p.prosecdef
        WHEN true THEN 'SECURITY DEFINER'
        ELSE 'SECURITY INVOKER'
    END as security_mode
FROM pg_proc p
JOIN pg_namespace n ON n.oid = p.pronamespace
WHERE n.nspname NOT IN ('pg_catalog', 'information_schema', 'pg_toast')
    AND p.prosecdef = true  -- only SECURITY DEFINER functions
ORDER BY n.nspname, p.proname;