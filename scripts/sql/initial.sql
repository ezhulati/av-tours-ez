-- Create affiliate_clicks table if not exists
CREATE TABLE IF NOT EXISTS affiliate_clicks (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_slug TEXT NOT NULL,
  tour_id UUID,
  affiliate_url TEXT,
  user_agent TEXT,
  ip_address TEXT,
  cookie_id TEXT,
  clicked_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_tour_slug ON affiliate_clicks(tour_slug);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_clicked_at ON affiliate_clicks(clicked_at DESC);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_cookie_id ON affiliate_clicks(cookie_id);

-- Create inquiries table if not exists
CREATE TABLE IF NOT EXISTS inquiries (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL,
  tour_slug TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  travel_date DATE,
  group_size INTEGER,
  utm_source TEXT,
  utm_medium TEXT,
  utm_campaign TEXT,
  affiliate_cookie TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_inquiries_tour_id ON inquiries(tour_id);
CREATE INDEX IF NOT EXISTS idx_inquiries_created_at ON inquiries(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_inquiries_email ON inquiries(email);

-- Create RPC function for search if not exists
CREATE OR REPLACE FUNCTION search_tours(q TEXT, lim INTEGER DEFAULT 10)
RETURNS JSON AS $$
DECLARE
  result JSON;
BEGIN
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
      difficulty,
      primary_image_url,
      featured,
      ts_rank(to_tsvector('english', title || ' ' || COALESCE(short_description, '')), plainto_tsquery('english', q)) AS rank
    FROM affiliate_tours
    WHERE status = 'active'
      AND (
        title ILIKE '%' || q || '%' 
        OR short_description ILIKE '%' || q || '%'
        OR to_tsvector('english', title || ' ' || COALESCE(short_description, '')) @@ plainto_tsquery('english', q)
      )
    ORDER BY rank DESC, featured DESC, created_at DESC
    LIMIT lim
  ),
  suggestions AS (
    SELECT DISTINCT title
    FROM matches
    LIMIT 5
  )
  SELECT json_build_object(
    'suggestions', COALESCE((SELECT json_agg(title) FROM suggestions), '[]'::json),
    'items', COALESCE((SELECT json_agg(row_to_json(matches.*)) FROM matches), '[]'::json)
  ) INTO result;
  
  RETURN result;
END;
$$ LANGUAGE plpgsql;