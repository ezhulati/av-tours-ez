-- Create tour_images table for comprehensive image management
CREATE TABLE IF NOT EXISTS tour_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_id UUID NOT NULL,
  tour_slug TEXT NOT NULL,
  image_url TEXT NOT NULL,
  image_alt TEXT,
  image_caption TEXT,
  image_type TEXT DEFAULT 'gallery', -- 'primary', 'gallery', 'thumbnail'
  source_url TEXT, -- BNAdventure source URL
  source_page_url TEXT, -- The BNAdventure tour page URL
  image_hash TEXT, -- For deduplication
  width INTEGER,
  height INTEGER,
  file_size INTEGER,
  mime_type TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  is_duplicate BOOLEAN DEFAULT false,
  duplicate_of UUID REFERENCES tour_images(id),
  last_validated_at TIMESTAMP WITH TIME ZONE,
  validation_status TEXT DEFAULT 'pending', -- 'valid', 'invalid', 'pending'
  validation_error TEXT,
  scraped_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_tour_images_tour_id ON tour_images(tour_id);
CREATE INDEX IF NOT EXISTS idx_tour_images_tour_slug ON tour_images(tour_slug);
CREATE INDEX IF NOT EXISTS idx_tour_images_image_hash ON tour_images(image_hash);
CREATE INDEX IF NOT EXISTS idx_tour_images_is_active ON tour_images(is_active);
CREATE INDEX IF NOT EXISTS idx_tour_images_type ON tour_images(image_type);
CREATE INDEX IF NOT EXISTS idx_tour_images_validation ON tour_images(validation_status);
CREATE UNIQUE INDEX IF NOT EXISTS idx_tour_images_unique_hash_per_tour 
  ON tour_images(tour_slug, image_hash) 
  WHERE is_duplicate = false;

-- Create image_sync_logs table for tracking sync operations
CREATE TABLE IF NOT EXISTS image_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  sync_type TEXT NOT NULL, -- 'manual', 'scheduled', 'partial'
  started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  tours_processed INTEGER DEFAULT 0,
  images_found INTEGER DEFAULT 0,
  images_added INTEGER DEFAULT 0,
  images_updated INTEGER DEFAULT 0,
  images_deactivated INTEGER DEFAULT 0,
  duplicates_found INTEGER DEFAULT 0,
  errors_count INTEGER DEFAULT 0,
  status TEXT DEFAULT 'running', -- 'running', 'completed', 'failed', 'partial'
  error_details JSONB,
  metadata JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for sync logs
CREATE INDEX IF NOT EXISTS idx_image_sync_logs_status ON image_sync_logs(status);
CREATE INDEX IF NOT EXISTS idx_image_sync_logs_created ON image_sync_logs(created_at DESC);

-- Function to calculate image hash (using URL as simple hash)
CREATE OR REPLACE FUNCTION calculate_image_hash(url TEXT) 
RETURNS TEXT AS $$
BEGIN
  -- Simple hash using MD5 of the URL
  -- In production, you might want to hash actual image content
  RETURN md5(url);
END;
$$ LANGUAGE plpgsql;

-- Function to mark duplicates within a tour
CREATE OR REPLACE FUNCTION mark_duplicate_images() 
RETURNS TRIGGER AS $$
BEGIN
  -- Check if this image hash already exists for this tour
  IF EXISTS (
    SELECT 1 FROM tour_images 
    WHERE tour_slug = NEW.tour_slug 
    AND image_hash = NEW.image_hash 
    AND id != NEW.id
    AND is_duplicate = false
  ) THEN
    -- Mark this as duplicate
    NEW.is_duplicate := true;
    NEW.duplicate_of := (
      SELECT id FROM tour_images 
      WHERE tour_slug = NEW.tour_slug 
      AND image_hash = NEW.image_hash 
      AND is_duplicate = false
      ORDER BY created_at ASC
      LIMIT 1
    );
  END IF;
  
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for duplicate detection
CREATE TRIGGER check_duplicate_images
  BEFORE INSERT OR UPDATE ON tour_images
  FOR EACH ROW
  EXECUTE FUNCTION mark_duplicate_images();

-- Function to get unique images for a tour
CREATE OR REPLACE FUNCTION get_tour_images(p_tour_slug TEXT)
RETURNS TABLE (
  id UUID,
  image_url TEXT,
  image_alt TEXT,
  image_caption TEXT,
  image_type TEXT,
  width INTEGER,
  height INTEGER,
  display_order INTEGER
) AS $$
BEGIN
  RETURN QUERY
  SELECT 
    ti.id,
    ti.image_url,
    ti.image_alt,
    ti.image_caption,
    ti.image_type,
    ti.width,
    ti.height,
    ti.display_order
  FROM tour_images ti
  WHERE ti.tour_slug = p_tour_slug
    AND ti.is_active = true
    AND ti.is_duplicate = false
    AND ti.validation_status != 'invalid'
  ORDER BY 
    CASE ti.image_type 
      WHEN 'primary' THEN 1
      WHEN 'gallery' THEN 2
      WHEN 'thumbnail' THEN 3
    END,
    ti.display_order,
    ti.created_at;
END;
$$ LANGUAGE plpgsql;

-- Function to validate image URLs (check if they return 200)
CREATE OR REPLACE FUNCTION validate_image_url(p_image_id UUID)
RETURNS BOOLEAN AS $$
DECLARE
  v_url TEXT;
BEGIN
  SELECT image_url INTO v_url FROM tour_images WHERE id = p_image_id;
  
  -- Update validation timestamp
  UPDATE tour_images 
  SET last_validated_at = NOW()
  WHERE id = p_image_id;
  
  -- Note: Actual HTTP validation would be done in application code
  -- This is a placeholder that marks images as validated
  RETURN true;
END;
$$ LANGUAGE plpgsql;

-- Function to clean up old duplicate images
CREATE OR REPLACE FUNCTION cleanup_duplicate_images(days_old INTEGER DEFAULT 30)
RETURNS INTEGER AS $$
DECLARE
  deleted_count INTEGER;
BEGIN
  DELETE FROM tour_images
  WHERE is_duplicate = true
    AND created_at < NOW() - INTERVAL '1 day' * days_old;
  
  GET DIAGNOSTICS deleted_count = ROW_COUNT;
  RETURN deleted_count;
END;
$$ LANGUAGE plpgsql;

-- Add updated_at trigger
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_tour_images_updated_at
  BEFORE UPDATE ON tour_images
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Grant permissions (adjust based on your Supabase setup)
GRANT ALL ON tour_images TO authenticated;
GRANT ALL ON image_sync_logs TO authenticated;
GRANT SELECT ON tour_images TO anon;
GRANT EXECUTE ON FUNCTION get_tour_images TO anon;
GRANT EXECUTE ON FUNCTION get_tour_images TO authenticated;