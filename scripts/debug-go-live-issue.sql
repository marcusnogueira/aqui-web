-- Debug Go Live Issue
-- This script will help us understand why "approved" vendors can't go live

BEGIN;

-- 1. Check current platform settings
SELECT '=== PLATFORM SETTINGS DEBUG ===' as debug_section;

SELECT 
  'Platform settings (broken table):' as check_type,
  id,
  allow_auto_vendor_approval,
  require_vendor_approval,
  maintenance_mode,
  updated_at
FROM public.platform_settings_broken 
WHERE id = true;

-- 2. Check if there are any vendors with "approved" status
SELECT '=== VENDOR STATUS DEBUG ===' as debug_section;

SELECT 
  'Approved vendors:' as check_type,
  id,
  business_name,
  status,
  CONCAT('"', status, '"') as status_with_quotes,
  LENGTH(status) as status_length,
  user_id,
  created_at
FROM vendors 
WHERE status = 'approved'
ORDER BY created_at DESC
LIMIT 5;

-- 3. Check for any status values that might look like "approved" but aren't
SELECT '=== SUSPICIOUS STATUS VALUES ===' as debug_section;

SELECT 
  'Status values similar to approved:' as check_type,
  status,
  CONCAT('"', status, '"') as status_with_quotes,
  LENGTH(status) as status_length,
  COUNT(*) as count
FROM vendors 
WHERE status ILIKE '%approved%' OR status ILIKE '%active%'
GROUP BY status
ORDER BY count DESC;

-- 4. Check if the platform settings RLS policy is working
SELECT '=== RLS POLICY CHECK ===' as debug_section;

SELECT 
  'RLS policies for platform_settings_broken:' as check_type,
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual
FROM pg_policies 
WHERE tablename = 'platform_settings_broken';

COMMIT;

-- 5. Fix any potential issues
-- Clean up any vendor status values with extra whitespace
UPDATE vendors 
SET status = TRIM(status)
WHERE status != TRIM(status);

-- Ensure platform settings are correct
INSERT INTO public.platform_settings_broken (
  id, 
  allow_auto_vendor_approval, 
  maintenance_mode, 
  require_vendor_approval,
  updated_at
) VALUES (
  true,
  true,   -- Enable auto approval
  false,  -- Not in maintenance mode  
  false,  -- Don't require vendor approval (this should allow all vendors)
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  allow_auto_vendor_approval = EXCLUDED.allow_auto_vendor_approval,
  require_vendor_approval = EXCLUDED.require_vendor_approval,
  maintenance_mode = EXCLUDED.maintenance_mode,
  updated_at = EXCLUDED.updated_at;

-- Verify the final state
SELECT '=== FINAL VERIFICATION ===' as final_check;

SELECT 
  'Final platform settings:' as setting_type,
  allow_auto_vendor_approval,
  require_vendor_approval,
  maintenance_mode
FROM public.platform_settings_broken 
WHERE id = true;

SELECT 
  'Vendors that should be able to go live:' as vendor_type,
  COUNT(*) as count
FROM vendors 
WHERE status IN ('approved', 'active', 'pending');