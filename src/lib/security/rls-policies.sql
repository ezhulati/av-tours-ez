-- Supabase Row Level Security (RLS) Policies
-- CRITICAL: Run these SQL commands in your Supabase SQL editor to secure all tables

-- Enable RLS on all tables
ALTER TABLE affiliate_tours ENABLE ROW LEVEL SECURITY;
ALTER TABLE affiliate_clicks ENABLE ROW LEVEL SECURITY;
ALTER TABLE tour_images ENABLE ROW LEVEL SECURITY;
ALTER TABLE price_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE image_sync_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_audit_logs ENABLE ROW LEVEL SECURITY;

-- Create admin role if it doesn't exist
INSERT INTO auth.roles (name) VALUES ('admin') ON CONFLICT (name) DO NOTHING;

-- affiliate_tours table policies
-- Public read access for active tours only
CREATE POLICY "Public can read active tours" ON affiliate_tours
  FOR SELECT USING (is_active = true);

-- Admin full access
CREATE POLICY "Admin full access to tours" ON affiliate_tours
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.uid() IN (
      SELECT user_id FROM admin_sessions 
      WHERE session_id = auth.jwt() ->> 'session_id'
      AND created_at > NOW() - INTERVAL '2 hours'
    )
  );

-- affiliate_clicks table policies  
-- Insert only for tracking (no read access for public)
CREATE POLICY "Allow click tracking inserts" ON affiliate_clicks
  FOR INSERT WITH CHECK (true);

-- Admin read access for analytics
CREATE POLICY "Admin read access to clicks" ON affiliate_clicks
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.uid() IN (
      SELECT user_id FROM admin_sessions 
      WHERE session_id = auth.jwt() ->> 'session_id'
      AND created_at > NOW() - INTERVAL '2 hours'
    )
  );

-- tour_images table policies
-- Public read access for active, non-duplicate images
CREATE POLICY "Public can read tour images" ON tour_images
  FOR SELECT USING (is_active = true AND is_duplicate = false);

-- Admin full access
CREATE POLICY "Admin full access to images" ON tour_images
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.uid() IN (
      SELECT user_id FROM admin_sessions 
      WHERE session_id = auth.jwt() ->> 'session_id'
      AND created_at > NOW() - INTERVAL '2 hours'
    )
  );

-- price_sync_logs table policies
-- Admin access only
CREATE POLICY "Admin only access to price sync logs" ON price_sync_logs
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.uid() IN (
      SELECT user_id FROM admin_sessions 
      WHERE session_id = auth.jwt() ->> 'session_id'
      AND created_at > NOW() - INTERVAL '2 hours'
    )
  );

-- image_sync_logs table policies  
-- Admin access only
CREATE POLICY "Admin only access to image sync logs" ON image_sync_logs
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.uid() IN (
      SELECT user_id FROM admin_sessions 
      WHERE session_id = auth.jwt() ->> 'session_id'
      AND created_at > NOW() - INTERVAL '2 hours'
    )
  );

-- admin_sessions table policies
-- Admins can only see their own sessions
CREATE POLICY "Admin can manage own sessions" ON admin_sessions
  FOR ALL USING (
    auth.uid()::text = user_id OR
    auth.jwt() ->> 'role' = 'admin'
  );

-- admin_audit_logs table policies
-- Admin read-only access (no updates/deletes for audit integrity)
CREATE POLICY "Admin read access to audit logs" ON admin_audit_logs
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.uid() IN (
      SELECT user_id FROM admin_sessions 
      WHERE session_id = auth.jwt() ->> 'session_id'
      AND created_at > NOW() - INTERVAL '2 hours'
    )
  );

-- Insert only policy for audit logs (system inserts)
CREATE POLICY "System can insert audit logs" ON admin_audit_logs
  FOR INSERT WITH CHECK (true);

-- Create function to validate admin permissions
CREATE OR REPLACE FUNCTION validate_admin_session(session_token TEXT)
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM admin_sessions 
    WHERE session_id = session_token
    AND created_at > NOW() - INTERVAL '2 hours'
    AND last_activity > NOW() - INTERVAL '2 hours'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create function to log security events
CREATE OR REPLACE FUNCTION log_security_event(
  event_type TEXT,
  details JSONB DEFAULT NULL
)
RETURNS VOID AS $$
BEGIN
  INSERT INTO admin_audit_logs (
    event_type,
    user_id,
    ip_address,
    details,
    created_at
  ) VALUES (
    event_type,
    COALESCE(auth.uid()::text, 'system'),
    COALESCE((current_setting('request.headers', true)::jsonb ->> 'x-forwarded-for'), 'unknown'),
    details,
    NOW()
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Create trigger to log all admin table changes
CREATE OR REPLACE FUNCTION audit_admin_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    PERFORM log_security_event(
      'admin_' || lower(TG_OP),
      jsonb_build_object('table', TG_TABLE_NAME, 'new', to_jsonb(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'UPDATE' THEN
    PERFORM log_security_event(
      'admin_' || lower(TG_OP),
      jsonb_build_object('table', TG_TABLE_NAME, 'old', to_jsonb(OLD), 'new', to_jsonb(NEW))
    );
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    PERFORM log_security_event(
      'admin_' || lower(TG_OP),
      jsonb_build_object('table', TG_TABLE_NAME, 'old', to_jsonb(OLD))
    );
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Apply audit triggers to sensitive tables
CREATE TRIGGER audit_tours_changes
  AFTER INSERT OR UPDATE OR DELETE ON affiliate_tours
  FOR EACH ROW EXECUTE FUNCTION audit_admin_changes();

CREATE TRIGGER audit_images_changes  
  AFTER INSERT OR UPDATE OR DELETE ON tour_images
  FOR EACH ROW EXECUTE FUNCTION audit_admin_changes();

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_admin_sessions_user_id ON admin_sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_session_id ON admin_sessions(session_id);
CREATE INDEX IF NOT EXISTS idx_admin_sessions_created_at ON admin_sessions(created_at);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_user_id ON admin_audit_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_admin_audit_logs_created_at ON admin_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_affiliate_clicks_created_at ON affiliate_clicks(created_at);
CREATE INDEX IF NOT EXISTS idx_tour_images_tour_slug ON tour_images(tour_slug);
CREATE INDEX IF NOT EXISTS idx_tour_images_active_duplicate ON tour_images(is_active, is_duplicate);

-- Grant necessary permissions
GRANT USAGE ON SCHEMA auth TO postgres, anon, authenticated, service_role;
GRANT ALL ON ALL TABLES IN SCHEMA auth TO postgres, service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA auth TO postgres, service_role;

-- Security monitoring views (admin only)
CREATE OR REPLACE VIEW admin_security_summary AS
SELECT 
  (SELECT COUNT(*) FROM admin_sessions WHERE created_at > NOW() - INTERVAL '24 hours') AS active_sessions_24h,
  (SELECT COUNT(*) FROM admin_audit_logs WHERE event_type = 'login_failed' AND created_at > NOW() - INTERVAL '1 hour') AS failed_logins_1h,
  (SELECT COUNT(*) FROM admin_audit_logs WHERE event_type = 'access_denied' AND created_at > NOW() - INTERVAL '24 hours') AS access_denied_24h,
  (SELECT COUNT(DISTINCT ip_address) FROM admin_audit_logs WHERE created_at > NOW() - INTERVAL '24 hours') AS unique_ips_24h;

-- Revoke access to security views from public
REVOKE ALL ON admin_security_summary FROM public;
GRANT SELECT ON admin_security_summary TO authenticated;

-- Add policy for security summary view
CREATE POLICY "Admin only access to security summary" ON admin_security_summary
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin' OR
    auth.uid() IN (
      SELECT user_id FROM admin_sessions 
      WHERE session_id = auth.jwt() ->> 'session_id'
      AND created_at > NOW() - INTERVAL '2 hours'
    )
  );

-- Create database schema for security tables (run if tables don't exist)
CREATE TABLE IF NOT EXISTS admin_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id TEXT UNIQUE NOT NULL,
  user_id TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  last_activity TIMESTAMPTZ DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

CREATE TABLE IF NOT EXISTS admin_audit_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_type TEXT NOT NULL,
  user_id TEXT,
  session_id TEXT,
  ip_address TEXT,
  user_agent TEXT,
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS price_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  total_checked INTEGER DEFAULT 0,
  successful_extractions INTEGER DEFAULT 0,
  failed_extractions INTEGER DEFAULT 0,
  tours_updated INTEGER DEFAULT 0,
  dry_run BOOLEAN DEFAULT false,
  results JSONB
);

CREATE TABLE IF NOT EXISTS image_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  tour_slug TEXT,
  images_found INTEGER DEFAULT 0,
  images_added INTEGER DEFAULT 0,
  duplicates_removed INTEGER DEFAULT 0,
  errors TEXT[],
  created_at TIMESTAMPTZ DEFAULT NOW()
);