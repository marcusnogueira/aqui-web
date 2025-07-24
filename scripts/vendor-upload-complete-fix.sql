-- Complete Vendor Upload Fix: Function + RLS Policy
-- This fixes both the missing function and RLS policy issues

BEGIN;

-- 1. Ensure the validate_vendor_upload function exists
CREATE OR REPLACE FUNCTION public.validate_vendor_upload(
  p_user_id UUID,
  p_vendor_id UUID
)
RETURNS BOOLEAN
SECURITY DEFINER
AS $$
BEGIN
  -- Check if user owns the vendor
  RETURN EXISTS(
    SELECT 1 FROM public.vendors 
    WHERE id = p_vendor_id AND user_id = p_user_id
  );
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission
GRANT EXECUTE ON FUNCTION public.validate_vendor_upload(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_vendor_upload(UUID, UUID) TO anon;

-- 2. Fix vendors table RLS policy for NextAuth compatibility
DROP POLICY IF EXISTS "Vendors: owner can manage" ON public.vendors;
DROP POLICY IF EXISTS "Vendors can manage their own profile" ON public.vendors;

-- Create new policy that works with NextAuth
CREATE POLICY "Vendors can manage their own profile" ON public.vendors
    FOR ALL USING (public.get_current_user_id() = user_id)
    WITH CHECK (public.get_current_user_id() = user_id);

-- 3. Storage policies for vendor-images
DROP POLICY IF EXISTS "Service role manages vendor-images" ON storage.objects;
DROP POLICY IF EXISTS "Public read vendor-images" ON storage.objects;

CREATE POLICY "Service role manages vendor-images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'vendor-images')
WITH CHECK (bucket_id = 'vendor-images');

CREATE POLICY "Public read vendor-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vendor-images');

-- 4. Ensure vendor-images bucket is properly configured
UPDATE storage.buckets 
SET 
  public = true, 
  file_size_limit = 52428800, 
  allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'vendor-images';

COMMIT;

-- Verify the setup
SELECT 'Function exists:' as check_type, 
       CASE WHEN EXISTS(SELECT 1 FROM pg_proc WHERE proname = 'validate_vendor_upload') 
            THEN '✅ YES' ELSE '❌ NO' END as status
UNION ALL
SELECT 'Vendors RLS policy:' as check_type,
       CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'vendors' AND policyname = 'Vendors can manage their own profile') 
            THEN '✅ YES' ELSE '❌ NO' END as status
UNION ALL
SELECT 'Storage policies:' as check_type,
       CASE WHEN EXISTS(SELECT 1 FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage') 
            THEN '✅ YES' ELSE '❌ NO' END as status;