-- Complete Storage Fix for NextAuth
-- This includes BOTH the missing RLS functions AND the storage policies

BEGIN;

-- =============================================================================
-- STEP 1: Create the missing NextAuth RLS functions
-- =============================================================================

-- Function to set the current user ID for RLS policies
CREATE OR REPLACE FUNCTION public.set_auth_user_id(user_id uuid)
RETURNS void AS $$
BEGIN
  PERFORM set_config('request.auth.user_id', user_id::text, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to set the current user role for RLS policies
CREATE OR REPLACE FUNCTION public.set_auth_role(role text)
RETURNS void AS $$
BEGIN
  PERFORM set_config('request.auth.role', role, false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to clear the current user context
CREATE OR REPLACE FUNCTION public.clear_auth_context()
RETURNS void AS $$
BEGIN
  PERFORM set_config('request.auth.user_id', '', false);
  PERFORM set_config('request.auth.role', '', false);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- =============================================================================
-- STEP 2: Fix Storage RLS policies to use get_current_user_id()
-- =============================================================================

-- First, drop any existing storage policies
DROP POLICY IF EXISTS "Allow vendors to upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "Vendors can upload to their own folder" ON storage.objects;
DROP POLICY IF EXISTS "vendor-images-policy" ON storage.objects;
DROP POLICY IF EXISTS "Allow vendors to read their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow vendors to update their own images" ON storage.objects;
DROP POLICY IF EXISTS "Allow vendors to delete their own images" ON storage.objects;

-- Create comprehensive storage policies using NextAuth-compatible functions
CREATE POLICY "Allow vendors to upload to their own folder"
ON storage.objects
FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'vendor-images'
  AND EXISTS (
    SELECT 1 FROM public.vendors
    WHERE vendors.id = (storage.foldername(name))[1]::uuid
      AND vendors.user_id = public.get_current_user_id()
  )
);

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

-- =============================================================================
-- STEP 3: Grant necessary permissions
-- =============================================================================

-- Grant permissions on the new functions
GRANT EXECUTE ON FUNCTION public.set_auth_user_id(uuid) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_auth_user_id(uuid) TO anon;
GRANT EXECUTE ON FUNCTION public.set_auth_user_id(uuid) TO service_role;

GRANT EXECUTE ON FUNCTION public.set_auth_role(text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.set_auth_role(text) TO anon;
GRANT EXECUTE ON FUNCTION public.set_auth_role(text) TO service_role;

GRANT EXECUTE ON FUNCTION public.clear_auth_context() TO authenticated;
GRANT EXECUTE ON FUNCTION public.clear_auth_context() TO anon;
GRANT EXECUTE ON FUNCTION public.clear_auth_context() TO service_role;

COMMIT;

-- =============================================================================
-- Verification queries (run these after to test)
-- =============================================================================

-- Test the functions work
-- SELECT public.set_auth_user_id('76d54bd8-5a4f-4b53-afd0-cf3b243f9802'::uuid);
-- SELECT public.get_current_user_id();

-- Check policies were created
-- SELECT policyname, cmd FROM pg_policies WHERE tablename = 'objects' AND schemaname = 'storage';