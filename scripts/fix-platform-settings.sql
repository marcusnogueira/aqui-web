-- Fix Platform Settings System
-- This ensures the platform_settings_broken table has the correct data and RLS policies

BEGIN;

-- 1. Ensure there's a default row in platform_settings_broken table
INSERT INTO public.platform_settings_broken (
  id, 
  allow_auto_vendor_approval, 
  maintenance_mode, 
  require_vendor_approval,
  updated_at
) VALUES (
  true,
  true,   -- Enable auto approval to fix the current issue
  false,  -- Not in maintenance mode
  false,  -- Don't require vendor approval when auto approval is on
  NOW()
) ON CONFLICT (id) DO UPDATE SET
  allow_auto_vendor_approval = EXCLUDED.allow_auto_vendor_approval,
  require_vendor_approval = EXCLUDED.require_vendor_approval,
  updated_at = EXCLUDED.updated_at;

-- 2. Add RLS policy for platform_settings table (the UUID one) if we want to use it later
DROP POLICY IF EXISTS "Platform settings are only accessible by service role" ON public.platform_settings;

CREATE POLICY "Platform settings are only accessible by service role" 
ON public.platform_settings 
USING (public.is_service_role());

-- 3. Verify the broken table has the right RLS policy (it should already exist)
-- This is just to ensure it's there
DROP POLICY IF EXISTS "Platform settings are only accessible by service role" ON public.platform_settings_broken;

CREATE POLICY "Platform settings are only accessible by service role" 
ON public.platform_settings_broken 
USING (public.is_service_role());

-- 4. Grant necessary permissions
GRANT ALL ON TABLE public.platform_settings_broken TO service_role;
GRANT ALL ON TABLE public.platform_settings TO service_role;

COMMIT;

-- Verify the setup
SELECT '=== PLATFORM SETTINGS VERIFICATION ===' as verification;

SELECT 'Platform settings row exists:' as check_type,
       CASE WHEN EXISTS(SELECT 1 FROM public.platform_settings_broken WHERE id = true) 
            THEN '✅ YES' ELSE '❌ NO' END as status
UNION ALL
SELECT 'Auto approval enabled:' as check_type,
       CASE WHEN (SELECT allow_auto_vendor_approval FROM public.platform_settings_broken WHERE id = true) 
            THEN '✅ YES' ELSE '❌ NO' END as status
UNION ALL
SELECT 'Manual approval required:' as check_type,
       CASE WHEN (SELECT require_vendor_approval FROM public.platform_settings_broken WHERE id = true) 
            THEN '⚠️ YES (may block auto-approval)' ELSE '✅ NO (auto-approval can work)' END as status
UNION ALL
SELECT 'RLS policy exists:' as check_type,
       CASE WHEN EXISTS(SELECT 1 FROM pg_policies 
                       WHERE tablename = 'platform_settings_broken' 
                       AND policyname = 'Platform settings are only accessible by service role') 
            THEN '✅ YES' ELSE '❌ NO' END as status;

-- Show current platform settings
SELECT '=== CURRENT PLATFORM SETTINGS ===' as info;
SELECT 
  'Current Config:' as setting,
  CONCAT(
    'Auto-approval: ', allow_auto_vendor_approval::text,
    ', Require approval: ', require_vendor_approval::text,
    ', Maintenance: ', maintenance_mode::text
  ) as value
FROM public.platform_settings_broken WHERE id = true;

-- Show vendor status distribution
SELECT '=== VENDOR STATUS DISTRIBUTION ===' as info;
SELECT 
  status,
  COUNT(*) as count,
  CASE 
    WHEN status = 'approved' THEN '✅ Can go live'
    WHEN status = 'pending' THEN '⏳ Can go live if auto-approval enabled'
    WHEN status = 'active' THEN '✅ Can go live'
    ELSE '❌ Cannot go live'
  END as go_live_status
FROM vendors 
GROUP BY status 
ORDER BY count DESC;

-- Show recent vendor creations and their status
SELECT '=== RECENT VENDORS (Last 10) ===' as info;
SELECT 
  business_name,
  status,
  created_at,
  CASE 
    WHEN status IN ('approved', 'active') THEN '✅ Ready'
    WHEN status = 'pending' THEN '⏳ Waiting'
    ELSE '❌ Blocked'
  END as ready_status
FROM vendors 
ORDER BY created_at DESC 
LIMIT 10;