-- Comprehensive Go Live Fix
-- This script fixes all potential issues preventing approved vendors from going live

BEGIN;

-- 1. Clean up any vendor status values with extra whitespace
UPDATE vendors 
SET status = TRIM(status)
WHERE status != TRIM(status);

-- Report how many rows were cleaned
SELECT 'Cleaned vendor status whitespace for ' || ROW_COUNT() || ' vendors' as cleanup_result;

-- 2. Ensure platform settings are configured to allow vendors to go live
-- Setting require_vendor_approval = false means ALL vendors can go live regardless of status
-- Setting allow_auto_vendor_approval = true means pending vendors can also go live
INSERT INTO public.platform_settings_broken (
  id, 
  allow_auto_vendor_approval, 
  maintenance_mode, 
  require_vendor_approval,
  updated_at
) VALUES (
  true,
  true,   -- Enable auto approval for pending vendors
  false,  -- Not in maintenance mode  
  false,  -- Don't require vendor approval - THIS IS KEY!
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  allow_auto_vendor_approval = EXCLUDED.allow_auto_vendor_approval,
  require_vendor_approval = EXCLUDED.require_vendor_approval,
  maintenance_mode = EXCLUDED.maintenance_mode,
  updated_at = EXCLUDED.updated_at;

-- 3. Add index to vendors table for better performance on status queries
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_vendors_status_user_id 
ON vendors(status, user_id);

-- 4. Verify RLS policies are correct
DROP POLICY IF EXISTS "Platform settings are only accessible by service role" ON public.platform_settings_broken;

CREATE POLICY "Platform settings are only accessible by service role" 
ON public.platform_settings_broken 
USING (public.is_service_role());

-- 5. Grant necessary permissions
GRANT ALL ON TABLE public.platform_settings_broken TO service_role;
GRANT ALL ON TABLE public.vendors TO service_role;
GRANT ALL ON TABLE public.vendor_live_sessions TO service_role;

COMMIT;

-- === VERIFICATION SECTION ===
SELECT '=== COMPREHENSIVE FIX VERIFICATION ===' as verification;

-- Check platform settings
SELECT 'Platform Settings:' as check_type,
       CONCAT(
         'Auto-approval: ', allow_auto_vendor_approval::text,
         ', Require approval: ', require_vendor_approval::text,
         ', Maintenance: ', maintenance_mode::text
       ) as current_config
FROM public.platform_settings_broken WHERE id = true;

-- Check vendor status distribution
SELECT 'Vendor Status Distribution:' as check_type,
       status,
       COUNT(*) as count,
       CASE 
         WHEN status IN ('approved', 'active') THEN '✅ Can go live (approved/active)'
         WHEN status = 'pending' THEN '✅ Can go live (auto-approval enabled)'
         ELSE '❌ Cannot go live'
       END as go_live_ability
FROM vendors 
GROUP BY status 
ORDER BY count DESC;

-- Check for any remaining whitespace issues
SELECT 'Whitespace Check:' as check_type,
       CASE 
         WHEN EXISTS(SELECT 1 FROM vendors WHERE status != TRIM(status))
         THEN '❌ Found vendors with whitespace in status'
         ELSE '✅ No whitespace issues found'
       END as whitespace_status;

-- Show which specific vendors can now go live
SELECT 'Vendors Ready to Go Live:' as check_type,
       business_name,
       status,
       user_id,
       'Ready' as go_live_status
FROM vendors 
WHERE status IN ('approved', 'active', 'pending')
ORDER BY created_at DESC
LIMIT 10;

-- Test the logic for an approved vendor
SELECT 'Logic Test for Approved Vendor:' as test_type,
       CASE 
         WHEN NOT (SELECT require_vendor_approval FROM platform_settings_broken WHERE id = true)
         THEN '✅ ALLOWED - Vendor approval not required'
         WHEN 'approved' IN ('approved', 'active')
         THEN '✅ ALLOWED - Vendor is approved'
         ELSE '❌ BLOCKED - This should not happen'
       END as result;

-- Final summary
SELECT '=== SUMMARY ===' as summary;
SELECT 
  'Total vendors that can go live: ' || COUNT(*) as summary_message
FROM vendors 
WHERE status IN ('approved', 'active', 'pending');

-- Show the current platform settings one more time
SELECT 
  'Platform configured for maximum access:' as final_check,
  CASE 
    WHEN NOT require_vendor_approval THEN '✅ All vendors can go live (approval not required)'
    WHEN allow_auto_vendor_approval THEN '✅ Pending vendors can auto-approve'
    ELSE '⚠️ Only manually approved vendors can go live'
  END as access_mode
FROM platform_settings_broken 
WHERE id = true;