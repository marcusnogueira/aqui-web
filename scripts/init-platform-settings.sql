-- Initialize platform_settings table with default values
-- Run this in your Supabase SQL editor if the table is empty

INSERT INTO platform_settings (
  id,
  allow_auto_vendor_approval,
  maintenance_mode,
  require_vendor_approval,
  updated_at
) VALUES (
  'default',
  false,
  false,
  true,
  NOW()
) ON CONFLICT (id) DO NOTHING;

-- Verify the settings were created
SELECT * FROM platform_settings WHERE id = 'default';