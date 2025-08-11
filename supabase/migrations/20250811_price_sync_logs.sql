-- Create price_sync_logs table for tracking price synchronization history
CREATE TABLE IF NOT EXISTS price_sync_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW() NOT NULL,
  total_checked INTEGER NOT NULL,
  successful_extractions INTEGER NOT NULL,
  failed_extractions INTEGER NOT NULL,
  tours_updated INTEGER NOT NULL,
  dry_run BOOLEAN DEFAULT FALSE,
  results JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX idx_price_sync_logs_timestamp ON price_sync_logs(timestamp DESC);

-- Add comment to table
COMMENT ON TABLE price_sync_logs IS 'Stores history of price synchronization runs between AlbaniaVisit and BNAdventure';

-- Add comments to columns
COMMENT ON COLUMN price_sync_logs.id IS 'Unique identifier for the sync log entry';
COMMENT ON COLUMN price_sync_logs.timestamp IS 'When the sync was performed';
COMMENT ON COLUMN price_sync_logs.total_checked IS 'Total number of tours checked';
COMMENT ON COLUMN price_sync_logs.successful_extractions IS 'Number of tours where price was successfully extracted';
COMMENT ON COLUMN price_sync_logs.failed_extractions IS 'Number of tours where price extraction failed';
COMMENT ON COLUMN price_sync_logs.tours_updated IS 'Number of tours that had their prices updated';
COMMENT ON COLUMN price_sync_logs.dry_run IS 'Whether this was a dry run (no actual updates)';
COMMENT ON COLUMN price_sync_logs.results IS 'Detailed JSON results of the sync operation';

-- Create a view for the latest sync status
CREATE OR REPLACE VIEW latest_price_sync AS
SELECT 
  timestamp,
  total_checked,
  successful_extractions,
  failed_extractions,
  tours_updated,
  dry_run,
  ROUND((successful_extractions::numeric / NULLIF(total_checked, 0) * 100), 2) as success_rate,
  timestamp > NOW() - INTERVAL '25 hours' as is_recent
FROM price_sync_logs
ORDER BY timestamp DESC
LIMIT 1;

-- Grant permissions (adjust based on your role structure)
GRANT SELECT ON price_sync_logs TO authenticated;
GRANT INSERT ON price_sync_logs TO service_role;
GRANT SELECT ON latest_price_sync TO authenticated;