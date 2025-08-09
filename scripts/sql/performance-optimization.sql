-- Performance Optimization Migration
-- Adds indexes, materialized views, and query optimizations

-- ============================================
-- INDEXES FOR QUERY OPTIMIZATION
-- ============================================

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_tours_active_created 
ON affiliate_tours(is_active, created_at DESC) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tours_active_featured 
ON affiliate_tours(is_active, featured, featured_order) 
WHERE is_active = true;

CREATE INDEX IF NOT EXISTS idx_tours_active_views 
ON affiliate_tours(is_active, view_count DESC) 
WHERE is_active = true;

-- GIN index for JSON searches (locations)
CREATE INDEX IF NOT EXISTS idx_tours_locations_gin 
ON affiliate_tours USING gin(locations);

-- Full-text search indexes
CREATE INDEX IF NOT EXISTS idx_tours_title_trgm 
ON affiliate_tours USING gin(title gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_tours_description_trgm 
ON affiliate_tours USING gin(short_description gin_trgm_ops);

-- Add text search vector column and index
ALTER TABLE affiliate_tours 
ADD COLUMN IF NOT EXISTS search_vector tsvector;

UPDATE affiliate_tours 
SET search_vector = to_tsvector('english', 
  coalesce(title, '') || ' ' || 
  coalesce(short_description, '') || ' ' || 
  coalesce(activity_type, '')
);

CREATE INDEX IF NOT EXISTS idx_tours_search_vector 
ON affiliate_tours USING gin(search_vector);

-- Trigger to keep search vector updated
CREATE OR REPLACE FUNCTION update_search_vector() 
RETURNS trigger AS $$
BEGIN
  NEW.search_vector := to_tsvector('english',
    coalesce(NEW.title, '') || ' ' || 
    coalesce(NEW.short_description, '') || ' ' || 
    coalesce(NEW.activity_type, '')
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_search_vector ON affiliate_tours;
CREATE TRIGGER trigger_update_search_vector
BEFORE INSERT OR UPDATE ON affiliate_tours
FOR EACH ROW
EXECUTE FUNCTION update_search_vector();

-- ============================================
-- MATERIALIZED VIEWS FOR COMMON QUERIES
-- ============================================

-- Featured tours materialized view
DROP MATERIALIZED VIEW IF EXISTS mv_featured_tours;
CREATE MATERIALIZED VIEW mv_featured_tours AS
SELECT 
  id,
  slug,
  title,
  short_description,
  price_min,
  price_max,
  currency,
  duration_days,
  duration_display,
  difficulty_level as difficulty,
  primary_image_url,
  image_gallery,
  locations,
  activity_type,
  featured,
  featured_order,
  view_count,
  created_at,
  updated_at
FROM affiliate_tours
WHERE is_active = true 
  AND featured = true
ORDER BY featured_order ASC NULLS LAST, created_at DESC;

CREATE UNIQUE INDEX ON mv_featured_tours(id);
CREATE INDEX ON mv_featured_tours(slug);

-- Tour statistics materialized view
DROP MATERIALIZED VIEW IF EXISTS mv_tour_stats;
CREATE MATERIALIZED VIEW mv_tour_stats AS
SELECT 
  t.id as tour_id,
  t.slug,
  COUNT(DISTINCT ac.cookie_id) as unique_clicks,
  COUNT(DISTINCT i.email) as unique_inquiries,
  COUNT(ac.id) as total_clicks,
  COUNT(i.id) as total_inquiries,
  COALESCE(COUNT(i.id)::float / NULLIF(COUNT(ac.id), 0) * 100, 0) as conversion_rate,
  MAX(ac.clicked_at) as last_click,
  MAX(i.created_at) as last_inquiry
FROM affiliate_tours t
LEFT JOIN affiliate_clicks ac ON t.slug = ac.tour_slug
LEFT JOIN inquiries i ON t.slug = i.tour_slug
WHERE t.is_active = true
GROUP BY t.id, t.slug;

CREATE UNIQUE INDEX ON mv_tour_stats(tour_id);
CREATE INDEX ON mv_tour_stats(slug);

-- Category aggregation view
DROP MATERIALIZED VIEW IF EXISTS mv_category_stats;
CREATE MATERIALIZED VIEW mv_category_stats AS
SELECT 
  activity_type as category,
  COUNT(*) as tour_count,
  AVG(price_min) as avg_price_min,
  AVG(price_max) as avg_price_max,
  MIN(price_min) as min_price,
  MAX(price_max) as max_price
FROM affiliate_tours
WHERE is_active = true
  AND activity_type IS NOT NULL
GROUP BY activity_type;

CREATE UNIQUE INDEX ON mv_category_stats(category);

-- ============================================
-- PARTITIONING FOR LARGE TABLES
-- ============================================

-- Partition affiliate_clicks by month for better performance
-- Note: This requires recreating the table, so only do in maintenance window

-- Create partitioned table
CREATE TABLE IF NOT EXISTS affiliate_clicks_partitioned (
  id UUID DEFAULT gen_random_uuid(),
  tour_slug TEXT NOT NULL,
  tour_id UUID,
  affiliate_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  cookie_id TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (id, clicked_at)
) PARTITION BY RANGE (clicked_at);

-- Create partitions for recent months
CREATE TABLE IF NOT EXISTS affiliate_clicks_y2025m01 
PARTITION OF affiliate_clicks_partitioned
FOR VALUES FROM ('2025-01-01') TO ('2025-02-01');

CREATE TABLE IF NOT EXISTS affiliate_clicks_y2025m02 
PARTITION OF affiliate_clicks_partitioned
FOR VALUES FROM ('2025-02-01') TO ('2025-03-01');

CREATE TABLE IF NOT EXISTS affiliate_clicks_y2025m03 
PARTITION OF affiliate_clicks_partitioned
FOR VALUES FROM ('2025-03-01') TO ('2025-04-01');

-- Create indexes on partitions
CREATE INDEX IF NOT EXISTS idx_clicks_y2025m01_tour_slug 
ON affiliate_clicks_y2025m01(tour_slug);
CREATE INDEX IF NOT EXISTS idx_clicks_y2025m02_tour_slug 
ON affiliate_clicks_y2025m02(tour_slug);
CREATE INDEX IF NOT EXISTS idx_clicks_y2025m03_tour_slug 
ON affiliate_clicks_y2025m03(tour_slug);

-- ============================================
-- OPTIMIZED STORED PROCEDURES
-- ============================================

-- Optimized search function using full-text search
CREATE OR REPLACE FUNCTION search_tours_optimized(
  q TEXT, 
  lim INTEGER DEFAULT 10
)
RETURNS JSON AS $$
DECLARE
  result JSON;
  search_query tsquery;
BEGIN
  -- Convert search query to tsquery
  search_query := plainto_tsquery('english', q);
  
  WITH matches AS (
    SELECT 
      id,
      slug,
      title,
      short_description,
      price_min,
      price_max,
      currency,
      duration_days,
      duration_display,
      difficulty_level as difficulty,
      primary_image_url,
      featured,
      ts_rank(search_vector, search_query) AS rank
    FROM affiliate_tours
    WHERE is_active = true
      AND (
        search_vector @@ search_query
        OR title ILIKE '%' || q || '%'
      )
    ORDER BY 
      CASE WHEN featured THEN 1 ELSE 2 END,
      rank DESC,
      view_count DESC
    LIMIT lim
  ),
  suggestions AS (
    SELECT DISTINCT title
    FROM matches
    ORDER BY title
    LIMIT 5
  )
  SELECT json_build_object(
    'suggestions', COALESCE((SELECT json_agg(title) FROM suggestions), '[]'::json),
    'items', COALESCE((SELECT json_agg(row_to_json(matches.*)) FROM matches), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;

-- Function to increment view count efficiently
CREATE OR REPLACE FUNCTION increment_view_count(tour_slug TEXT)
RETURNS void AS $$
BEGIN
  UPDATE affiliate_tours 
  SET view_count = COALESCE(view_count, 0) + 1
  WHERE slug = tour_slug AND is_active = true;
END;
$$ LANGUAGE plpgsql;

-- Function to get tour availability (placeholder for real-time system)
CREATE OR REPLACE FUNCTION get_tour_availability(
  p_tour_id UUID,
  p_date DATE
)
RETURNS JSON AS $$
BEGIN
  -- This is a placeholder that would connect to real availability system
  -- For now, return mock data
  RETURN json_build_object(
    'available', true,
    'spots_left', floor(random() * 20 + 1)::int,
    'date', p_date
  );
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- REFRESH MATERIALIZED VIEWS
-- ============================================

-- Refresh all materialized views
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_featured_tours;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tour_stats;
REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_stats;

-- ============================================
-- SCHEDULED MAINTENANCE FUNCTIONS
-- ============================================

-- Function to refresh materialized views
CREATE OR REPLACE FUNCTION refresh_materialized_views()
RETURNS void AS $$
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_featured_tours;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_tour_stats;
  REFRESH MATERIALIZED VIEW CONCURRENTLY mv_category_stats;
END;
$$ LANGUAGE plpgsql;

-- Function to analyze tables for query planner
CREATE OR REPLACE FUNCTION analyze_tables()
RETURNS void AS $$
BEGIN
  ANALYZE affiliate_tours;
  ANALYZE affiliate_clicks;
  ANALYZE inquiries;
END;
$$ LANGUAGE plpgsql;

-- ============================================
-- MONITORING QUERIES
-- ============================================

-- View for monitoring slow queries
CREATE OR REPLACE VIEW v_slow_queries AS
SELECT 
  query,
  calls,
  total_time,
  mean_time,
  max_time,
  min_time
FROM pg_stat_statements
WHERE mean_time > 200 -- queries averaging over 200ms
ORDER BY mean_time DESC
LIMIT 20;

-- View for monitoring table sizes and bloat
CREATE OR REPLACE VIEW v_table_stats AS
SELECT 
  schemaname,
  tablename,
  pg_size_pretty(pg_total_relation_size(schemaname||'.'||tablename)) AS size,
  n_live_tup AS live_rows,
  n_dead_tup AS dead_rows,
  CASE 
    WHEN n_live_tup > 0 
    THEN round(100.0 * n_dead_tup / n_live_tup, 2)
    ELSE 0
  END AS dead_percent
FROM pg_stat_user_tables
ORDER BY pg_total_relation_size(schemaname||'.'||tablename) DESC;

-- ============================================
-- PERFORMANCE SETTINGS
-- ============================================

-- Note: These should be set at the database/connection level
-- Included here for documentation

-- Enable query parallelization
-- SET max_parallel_workers_per_gather = 4;

-- Optimize for read-heavy workload
-- SET effective_cache_size = '4GB';
-- SET shared_buffers = '1GB';
-- SET work_mem = '16MB';

-- Enable JIT compilation for complex queries
-- SET jit = on;

-- ============================================
-- GRANT PERMISSIONS
-- ============================================

-- Grant necessary permissions to application user
-- Replace 'app_user' with your actual application user
-- GRANT SELECT ON ALL TABLES IN SCHEMA public TO app_user;
-- GRANT SELECT ON ALL MATERIALIZED VIEWS IN SCHEMA public TO app_user;
-- GRANT EXECUTE ON ALL FUNCTIONS IN SCHEMA public TO app_user;