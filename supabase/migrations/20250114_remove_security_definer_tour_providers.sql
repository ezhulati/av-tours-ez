-- Migration: Remove SECURITY DEFINER from tour_providers view
-- Issue: Views with SECURITY DEFINER property bypass row-level security of the querying user
-- Solution: Recreate the view without SECURITY DEFINER to use SECURITY INVOKER (default)

-- Step 1: Drop the existing view with SECURITY DEFINER
DROP VIEW IF EXISTS public.tour_providers CASCADE;

-- Step 2: Only recreate if affiliate_tours table exists
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
            affiliate_partner_id as provider_id,
            MAX(affiliate_partner_name) as provider_name,
            COUNT(*) as tour_count,
            MIN(price_from) as min_price,
            MAX(price_from) as max_price,
            array_agg(DISTINCT activity_type) as activity_types,
            MAX(updated_at) as last_updated
        FROM public.affiliate_tours
        WHERE status = 'active'
            AND affiliate_partner_id IS NOT NULL
        GROUP BY affiliate_partner_id;
        
        -- Grant appropriate permissions
        GRANT SELECT ON public.tour_providers TO authenticated;
        GRANT SELECT ON public.tour_providers TO anon;
        
        -- Add comment explaining the security model
        COMMENT ON VIEW public.tour_providers IS 
        'View of tour providers aggregated from affiliate_tours. Uses SECURITY INVOKER (default) to respect row-level security policies of the querying user.';
        
        RAISE NOTICE 'tour_providers view created without SECURITY DEFINER';
    ELSE
        RAISE NOTICE 'affiliate_tours table does not exist, skipping tour_providers view creation';
    END IF;
END $$;