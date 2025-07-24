-- Function Validation Fix
-- Use DB function to validate, service role to upload

BEGIN;

-- Create a function to validate vendor upload permissions
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

-- Grant execute permission to authenticated users
GRANT EXECUTE ON FUNCTION public.validate_vendor_upload(UUID, UUID) TO authenticated;
GRANT EXECUTE ON FUNCTION public.validate_vendor_upload(UUID, UUID) TO anon;

-- Simple storage policy for service role
DROP POLICY IF EXISTS "Service role manages vendor-images" ON storage.objects;

CREATE POLICY "Service role manages vendor-images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'vendor-images')
WITH CHECK (bucket_id = 'vendor-images');

-- Public read access for images
DROP POLICY IF EXISTS "Public read vendor-images" ON storage.objects;

CREATE POLICY "Public read vendor-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vendor-images');

COMMIT;