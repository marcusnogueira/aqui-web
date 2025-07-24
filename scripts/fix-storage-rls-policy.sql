-- Fix Storage RLS policy for NextAuth compatibility
-- Replace auth.uid() with public.get_current_user_id()

BEGIN;

-- First, drop the existing policy if it exists
DROP POLICY IF EXISTS "Allow vendors to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "vendor-images-policy" ON storage.objects;

-- Create the updated policy using get_current_user_id() for NextAuth compatibility
CREATE POLICY "Allow vendors to upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-images'
  AND EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = (storage.foldername(name))[1]::uuid
      AND vendors.user_id = public.get_current_user_id()  -- ✅ NextAuth compatible
  )
);

-- Also add SELECT policy for downloads/signed URLs
CREATE POLICY "Allow vendors to read their own images"
ON storage.objects
FOR SELECT
TO authenticated
USING (
  bucket_id = 'vendor-images'
  AND EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = (storage.foldername(name))[1]::uuid
      AND vendors.user_id = public.get_current_user_id()
  )
);

-- Add UPDATE policy for metadata updates
CREATE POLICY "Allow vendors to update their own images"
ON storage.objects
FOR UPDATE
TO authenticated
USING (
  bucket_id = 'vendor-images'
  AND EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = (storage.foldername(name))[1]::uuid
      AND vendors.user_id = public.get_current_user_id()
  )
);

-- Add DELETE policy for image deletion
CREATE POLICY "Allow vendors to delete their own images"
ON storage.objects
FOR DELETE
TO authenticated
USING (
  bucket_id = 'vendor-images'
  AND EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = (storage.foldername(name))[1]::uuid
      AND vendors.user_id = public.get_current_user_id()
  )
);

COMMIT;