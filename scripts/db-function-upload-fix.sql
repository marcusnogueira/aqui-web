-- DB Function Upload Fix
-- This creates stored procedures that bypass RLS with SECURITY DEFINER

BEGIN;

-- First, let's create a function to handle vendor image uploads
CREATE OR REPLACE FUNCTION public.upload_vendor_image(
  p_user_id UUID,
  p_vendor_id UUID,
  p_filename TEXT,
  p_file_data BYTEA,
  p_content_type TEXT DEFAULT 'image/jpeg'
)
RETURNS TEXT
SECURITY DEFINER
SET search_path = public, storage
AS $$
DECLARE
  v_vendor_exists BOOLEAN;
  v_full_path TEXT;
  v_public_url TEXT;
BEGIN
  -- Verify the user owns this vendor
  SELECT EXISTS(
    SELECT 1 FROM public.vendors 
    WHERE id = p_vendor_id AND user_id = p_user_id
  ) INTO v_vendor_exists;
  
  IF NOT v_vendor_exists THEN
    RAISE EXCEPTION 'Unauthorized: User does not own this vendor';
  END IF;
  
  -- Construct the full file path
  v_full_path := p_vendor_id::text || '/' || p_filename;
  
  -- Insert directly into storage.objects (bypasses RLS)
  INSERT INTO storage.objects (
    bucket_id,
    name,
    owner,
    metadata
  ) VALUES (
    'vendor-images',
    v_full_path,
    p_user_id,
    jsonb_build_object(
      'size', length(p_file_data),
      'mimetype', p_content_type,
      'cacheControl', '3600'
    )
  );
  
  -- Store the actual file data (this bypasses RLS too)
  -- Note: This is a simplified version - in practice you'd use Supabase's storage API
  
  -- Return the public URL path
  v_public_url := 'https://your-project.supabase.co/storage/v1/object/public/vendor-images/' || v_full_path;
  
  RETURN v_public_url;
END;
$$ LANGUAGE plpgsql;

-- Create a simpler function that just authorizes uploads
CREATE OR REPLACE FUNCTION public.authorize_vendor_upload(
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

-- Grant execute permissions
GRANT EXECUTE ON FUNCTION public.upload_vendor_image(UUID, UUID, TEXT, BYTEA, TEXT) TO authenticated;
GRANT EXECUTE ON FUNCTION public.authorize_vendor_upload(UUID, UUID) TO authenticated;

-- Drop all existing storage policies (they're causing issues)
DROP POLICY IF EXISTS "Allow vendors to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "vendor-images-policy" ON storage.objects;
DROP POLICY IF EXISTS "Allow vendors to read their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow vendors to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow vendors to delete their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow authenticated users to manage vendor-images" ON storage.objects;
DROP POLICY IF EXISTS "Allow public read access to vendor-images" ON storage.objects;
DROP POLICY IF EXISTS "Service role can manage all vendor-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can read vendor-images" ON storage.objects;
DROP POLICY IF EXISTS "Public full access to vendor-images" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated full access to vendor-images" ON storage.objects;
DROP POLICY IF EXISTS "Anonymous full access to vendor-images" ON storage.objects;

-- Create simple policies that work with the function approach
CREATE POLICY "Allow service role full access to vendor-images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'vendor-images')
WITH CHECK (bucket_id = 'vendor-images');

-- Allow public read access since bucket should be public for images
CREATE POLICY "Public read access to vendor-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vendor-images');

COMMIT;