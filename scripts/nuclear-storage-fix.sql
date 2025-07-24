-- NUCLEAR STORAGE FIX
-- This completely disables RLS for vendor-images uploads

BEGIN;

-- Step 1: Make bucket completely public
UPDATE storage.buckets 
SET public = true, file_size_limit = 52428800, allowed_mime_types = ARRAY['image/jpeg', 'image/png', 'image/webp', 'image/gif']
WHERE id = 'vendor-images';

-- Step 2: Drop ALL existing policies on storage.objects
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

-- Step 3: Create super permissive policies
CREATE POLICY "Public full access to vendor-images"
ON storage.objects
FOR ALL
TO public
USING (bucket_id = 'vendor-images')
WITH CHECK (bucket_id = 'vendor-images');

CREATE POLICY "Authenticated full access to vendor-images"
ON storage.objects
FOR ALL
TO authenticated
USING (bucket_id = 'vendor-images')
WITH CHECK (bucket_id = 'vendor-images');

CREATE POLICY "Anonymous full access to vendor-images"
ON storage.objects
FOR ALL
TO anon
USING (bucket_id = 'vendor-images')
WITH CHECK (bucket_id = 'vendor-images');

COMMIT;

-- Verify the changes
SELECT * FROM storage.buckets WHERE id = 'vendor-images';
SELECT policyname, cmd, roles FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';