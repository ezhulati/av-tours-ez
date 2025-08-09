-- Create country_hero_images table
CREATE TABLE IF NOT EXISTS country_hero_images (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  country_code VARCHAR(50) NOT NULL,
  image_url TEXT NOT NULL,
  title TEXT,
  display_order INTEGER DEFAULT 0,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_country_hero_images_country_code 
ON country_hero_images(country_code);

CREATE INDEX IF NOT EXISTS idx_country_hero_images_display_order 
ON country_hero_images(display_order);

-- Insert Albania hero images
INSERT INTO country_hero_images (country_code, image_url, title, display_order, is_active) VALUES
  ('albania', '/Assets/Albania/Albanian Riviera Beach Blue Water.jpeg', 'Albanian Riviera - Crystal Blue Waters', 1, true),
  ('albania', '/Assets/Albania/Accursed Mountains.jpeg', 'Accursed Mountains - Majestic Peaks', 2, true),
  ('albania', '/Assets/Albania/Northern Albania Shala River.jpeg', 'Shala River - Northern Albania Paradise', 3, true),
  ('albania', '/Assets/Albania/Albania_Coast.jpeg', 'Albanian Coast - Endless Beauty', 4, true),
  ('albania', '/Assets/Albania/Valbona Valley Guesthouse.jpg', 'Valbona Valley - Mountain Hospitality', 5, true),
  ('albania', '/Assets/Albania/Albania, Lake Koman.jpeg', 'Lake Koman - Hidden Fjords', 6, true),
  ('albania', '/Assets/Albania/Old Mes Bridge.jpeg', 'Mes Bridge - Historic Architecture', 7, true),
  ('albania', '/Assets/Albania/albanian-riviera-5.jpg', 'Albanian Riviera - Coastal Paradise', 8, true)
ON CONFLICT DO NOTHING;