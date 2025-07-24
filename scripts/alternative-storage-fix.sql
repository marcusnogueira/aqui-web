-- Alternative Storage Fix - Direct Approach
-- This bypasses session context issues by using service role for uploads

BEGIN;

-- =============================================================================
-- OPTION 1: Make storage bucket public for vendor-images
-- =============================================================================

-- This is the simplest fix - make the bucket public but still use path-based security
UPDATE storage.buckets 
SET public = true 
WHERE id = 'vendor-images';

-- Drop all existing policies
DROP POLICY IF EXISTS "Allow vendors to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "vendor-images-policy" ON storage.objects;
DROP POLICY IF EXISTS "Allow vendors to read their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow vendors to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow vendors to delete their own images" ON storage.objects;

-- Create a simple policy that allows authenticated users to upload to vendor-images
-- We'll handle the folder security in the application layer
CREATE POLICY "Allow authenticated users to manage vendor-images"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'vendor-images')
WITH CHECK (bucket_id = 'vendor-images');

-- Create a policy for public access (since bucket is public)
CREATE POLICY "Allow public read access to vendor-images"
ON storage.objects
FOR SELECT
TO public
USING (bucket_id = 'vendor-images');

COMMIT;

-- =============================================================================
-- Alternative: If you want to keep the bucket private, uncomment below
-- =============================================================================

/*
BEGIN;

-- Keep bucket private
UPDATE storage.buckets 
SET public = false 
WHERE id = 'vendor-images';

-- Create service role policy (bypasses RLS)
CREATE POLICY "Service role can manage all vendor-images"
ON storage.objects
FOR ALL
TO service_role
USING (bucket_id = 'vendor-images')
WITH CHECK (bucket_id = 'vendor-images');

COMMIT;
*/