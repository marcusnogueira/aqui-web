-- Fix RLS policies for vendor_live_sessions table
-- Run this in your Supabase SQL editor

-- First, let's check if RLS is enabled and what policies exist
-- You can run this to see current state:
-- SELECT schemaname, tablename, rowsecurity FROM pg_tables WHERE tablename = 'vendor_live_sessions';
-- SELECT * FROM pg_policies WHERE tablename = 'vendor_live_sessions';

-- Drop existing policies if they exist (to start fresh)
DROP POLICY IF EXISTS "Vendors can manage their own live sessions" ON vendor_live_sessions;
DROP POLICY IF EXISTS "Vendors can insert their own live sessions" ON vendor_live_sessions;
DROP POLICY IF EXISTS "Vendors can update their own live sessions" ON vendor_live_sessions;
DROP POLICY IF EXISTS "Vendors can view their own live sessions" ON vendor_live_sessions;

-- Create comprehensive RLS policies for vendor_live_sessions
-- Policy for INSERT: Allow vendors to create live sessions for their own vendor profile
CREATE POLICY "Vendors can insert their own live sessions" ON vendor_live_sessions
  FOR INSERT
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors 
      WHERE user_id = COALESCE(
        current_setting('app.current_user_id', true)::uuid,
        auth.uid()
      )
    )
  );

-- Policy for SELECT: Allow vendors to view their own live sessions
CREATE POLICY "Vendors can view their own live sessions" ON vendor_live_sessions
  FOR SELECT
  USING (
    vendor_id IN (
      SELECT id FROM vendors 
      WHERE user_id = COALESCE(
        current_setting('app.current_user_id', true)::uuid,
        auth.uid()
      )
    )
  );

-- Policy for UPDATE: Allow vendors to update their own live sessions
CREATE POLICY "Vendors can update their own live sessions" ON vendor_live_sessions
  FOR UPDATE
  USING (
    vendor_id IN (
      SELECT id FROM vendors 
      WHERE user_id = COALESCE(
        current_setting('app.current_user_id', true)::uuid,
        auth.uid()
      )
    )
  )
  WITH CHECK (
    vendor_id IN (
      SELECT id FROM vendors 
      WHERE user_id = COALESCE(
        current_setting('app.current_user_id', true)::uuid,
        auth.uid()
      )
    )
  );

-- Policy for DELETE: Allow vendors to delete their own live sessions
CREATE POLICY "Vendors can delete their own live sessions" ON vendor_live_sessions
  FOR DELETE
  USING (
    vendor_id IN (
      SELECT id FROM vendors 
      WHERE user_id = COALESCE(
        current_setting('app.current_user_id', true)::uuid,
        auth.uid()
      )
    )
  );

-- Also create a policy for service role to bypass RLS when needed
CREATE POLICY "Service role can manage all live sessions" ON vendor_live_sessions
  FOR ALL
  USING (auth.jwt() ->> 'role' = 'service_role')
  WITH CHECK (auth.jwt() ->> 'role' = 'service_role');

-- Ensure RLS is enabled
ALTER TABLE vendor_live_sessions ENABLE ROW LEVEL SECURITY;

-- Grant necessary permissions
GRANT ALL ON vendor_live_sessions TO authenticated;
GRANT ALL ON vendor_live_sessions TO service_role;