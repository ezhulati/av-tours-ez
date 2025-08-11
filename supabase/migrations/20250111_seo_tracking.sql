-- SEO Tracking Tables for Programmatic SEO System

-- Table for tracking page views on SEO pages
CREATE TABLE IF NOT EXISTS seo_page_views (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  source VARCHAR(50) NOT NULL CHECK (source IN ('organic', 'direct', 'referral', 'social')),
  session_id VARCHAR(100) NOT NULL,
  user_id VARCHAR(100),
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for fast queries
CREATE INDEX idx_seo_page_views_path ON seo_page_views(path);
CREATE INDEX idx_seo_page_views_timestamp ON seo_page_views(timestamp);
CREATE INDEX idx_seo_page_views_session ON seo_page_views(session_id);

-- Table for tracking conversions from SEO pages
CREATE TABLE IF NOT EXISTS seo_conversions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  tour_slug VARCHAR(255) NOT NULL,
  conversion_type VARCHAR(50) NOT NULL CHECK (conversion_type IN ('click', 'booking')),
  session_id VARCHAR(100) NOT NULL,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for conversion tracking
CREATE INDEX idx_seo_conversions_path ON seo_conversions(path);
CREATE INDEX idx_seo_conversions_tour ON seo_conversions(tour_slug);
CREATE INDEX idx_seo_conversions_timestamp ON seo_conversions(timestamp);

-- Aggregated metrics table for performance
CREATE TABLE IF NOT EXISTS seo_metrics (
  path VARCHAR(255) PRIMARY KEY,
  page_views INTEGER DEFAULT 0,
  unique_visitors INTEGER DEFAULT 0,
  avg_time_on_page DECIMAL(10,2) DEFAULT 0,
  bounce_rate DECIMAL(5,2) DEFAULT 0,
  conversion_rate DECIMAL(5,2) DEFAULT 0,
  total_conversions INTEGER DEFAULT 0,
  organic_traffic INTEGER DEFAULT 0,
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Table for keyword tracking (would be populated by external SEO tools)
CREATE TABLE IF NOT EXISTS seo_keyword_tracking (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  keyword VARCHAR(255) NOT NULL,
  path VARCHAR(255) NOT NULL,
  position INTEGER,
  impressions INTEGER DEFAULT 0,
  clicks INTEGER DEFAULT 0,
  ctr DECIMAL(5,2) DEFAULT 0,
  trend VARCHAR(10) CHECK (trend IN ('up', 'down', 'stable')),
  last_checked TIMESTAMPTZ DEFAULT NOW(),
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for keyword tracking
CREATE INDEX idx_seo_keywords_path ON seo_keyword_tracking(path);
CREATE INDEX idx_seo_keywords_keyword ON seo_keyword_tracking(keyword);

-- Table for storing SEO issues and recommendations
CREATE TABLE IF NOT EXISTS seo_issues (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  path VARCHAR(255) NOT NULL,
  issue_type VARCHAR(20) CHECK (issue_type IN ('error', 'warning', 'info')),
  category VARCHAR(50) CHECK (category IN ('meta', 'content', 'technical', 'performance')),
  message TEXT NOT NULL,
  recommendation TEXT,
  resolved BOOLEAN DEFAULT FALSE,
  detected_at TIMESTAMPTZ DEFAULT NOW(),
  resolved_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for SEO issues
CREATE INDEX idx_seo_issues_path ON seo_issues(path);
CREATE INDEX idx_seo_issues_resolved ON seo_issues(resolved);

-- Function to update metrics (can be called periodically)
CREATE OR REPLACE FUNCTION update_seo_metrics(target_path VARCHAR)
RETURNS VOID AS $$
BEGIN
  -- Update page views and unique visitors
  UPDATE seo_metrics
  SET 
    page_views = (
      SELECT COUNT(*) 
      FROM seo_page_views 
      WHERE path = target_path 
      AND timestamp > NOW() - INTERVAL '30 days'
    ),
    unique_visitors = (
      SELECT COUNT(DISTINCT session_id) 
      FROM seo_page_views 
      WHERE path = target_path 
      AND timestamp > NOW() - INTERVAL '30 days'
    ),
    organic_traffic = (
      SELECT COUNT(*) 
      FROM seo_page_views 
      WHERE path = target_path 
      AND source = 'organic'
      AND timestamp > NOW() - INTERVAL '30 days'
    ),
    total_conversions = (
      SELECT COUNT(*) 
      FROM seo_conversions 
      WHERE path = target_path 
      AND timestamp > NOW() - INTERVAL '30 days'
    ),
    last_updated = NOW()
  WHERE path = target_path;
  
  -- Calculate conversion rate
  UPDATE seo_metrics
  SET conversion_rate = CASE 
    WHEN page_views > 0 THEN (total_conversions::DECIMAL / page_views) * 100
    ELSE 0
  END
  WHERE path = target_path;
END;
$$ LANGUAGE plpgsql;

-- Function to get top performing SEO pages
CREATE OR REPLACE FUNCTION get_top_seo_pages(limit_count INTEGER DEFAULT 10)
RETURNS TABLE(
  path VARCHAR,
  page_views INTEGER,
  unique_visitors INTEGER,
  conversion_rate DECIMAL,
  organic_traffic INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    m.path,
    m.page_views,
    m.unique_visitors,
    m.conversion_rate,
    m.organic_traffic
  FROM seo_metrics m
  ORDER BY m.page_views DESC
  LIMIT limit_count;
END;
$$ LANGUAGE plpgsql;

-- Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON seo_page_views TO authenticated;
GRANT ALL ON seo_conversions TO authenticated;
GRANT ALL ON seo_metrics TO authenticated;
GRANT ALL ON seo_keyword_tracking TO authenticated;
GRANT ALL ON seo_issues TO authenticated;

-- RLS Policies (optional, adjust based on your needs)
ALTER TABLE seo_page_views ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_conversions ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_metrics ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_keyword_tracking ENABLE ROW LEVEL SECURITY;
ALTER TABLE seo_issues ENABLE ROW LEVEL SECURITY;

-- Allow all authenticated users to insert tracking data
CREATE POLICY "Allow insert for tracking" ON seo_page_views
  FOR INSERT TO authenticated
  WITH CHECK (true);

CREATE POLICY "Allow insert for conversions" ON seo_conversions
  FOR INSERT TO authenticated
  WITH CHECK (true);

-- Only allow admins to view metrics (adjust as needed)
CREATE POLICY "Allow read for metrics" ON seo_metrics
  FOR SELECT TO authenticated
  USING (true);

-- Comments for documentation
COMMENT ON TABLE seo_page_views IS 'Tracks individual page views on programmatic SEO pages';
COMMENT ON TABLE seo_conversions IS 'Tracks conversions (clicks and bookings) from SEO pages';
COMMENT ON TABLE seo_metrics IS 'Aggregated metrics for SEO page performance';
COMMENT ON TABLE seo_keyword_tracking IS 'Keyword ranking data from external SEO tools';
COMMENT ON TABLE seo_issues IS 'SEO issues and recommendations for pages';