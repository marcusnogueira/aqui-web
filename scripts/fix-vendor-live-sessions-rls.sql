-- Fix RLS policies for vendor_live_sessions table
-- This script addresses the RLS policy violation when vendors try to go live

-- First, let's check the current policies
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vendor_live_sessions';

-- Drop existing policies
DROP POLICY IF EXISTS "Anyone can view live sessions" ON vendor_live_sessions;
DROP POLICY IF EXISTS "Vendors can manage their own sessions" ON vendor_live_sessions;

-- Create more permissive policies that work with NextAuth
-- Allow anyone to view live sessions (for the map)
CREATE POLICY "Public can view live sessions" ON vendor_live_sessions
    FOR SELECT USING (true);

-- Allow authenticated users to insert/update/delete their own vendor sessions
-- This policy checks if the user_id in the vendors table matches the session user
-- We need both USING (for SELECT/UPDATE/DELETE) and WITH CHECK (for INSERT) clauses
CREATE POLICY "Vendors can manage their sessions" ON vendor_live_sessions
    USING (
        EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.id = vendor_live_sessions.vendor_id 
            AND vendors.user_id = (
                COALESCE(
                    -- Try to get from session variable first
                    NULLIF(current_setting('app.current_user_id', true), '')::UUID,
                    -- Fallback to auth.uid() if available
                    auth.uid(),
                    -- If neither works, allow service role
                    CASE WHEN current_user = 'service_role' THEN vendors.user_id ELSE NULL END
                )
            )
        )
    )
    WITH CHECK (
        EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.id = vendor_live_sessions.vendor_id 
            AND vendors.user_id = (
                COALESCE(
                    -- Try to get from session variable first
                    NULLIF(current_setting('app.current_user_id', true), '')::UUID,
                    -- Fallback to auth.uid() if available
                    auth.uid(),
                    -- If neither works, allow service role
                    CASE WHEN current_user = 'service_role' THEN vendors.user_id ELSE NULL END
                )
            )
        )
    );

-- Alternative: If the above doesn't work, create a more permissive policy for testing
-- Uncomment the lines below if you're still having issues

-- DROP POLICY IF EXISTS "Vendors can manage their sessions" ON vendor_live_sessions;
-- CREATE POLICY "Authenticated users can manage sessions" ON vendor_live_sessions
--     FOR ALL USING (
--         -- Allow if user is authenticated (has a session)
--         current_setting('app.current_user_id', true) IS NOT NULL
--         AND current_setting('app.current_user_id', true) != ''
--     );

-- Grant necessary permissions
GRANT ALL ON TABLE vendor_live_sessions TO authenticated;
GRANT ALL ON TABLE vendor_live_sessions TO service_role;

-- Verify the policies were created
SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
FROM pg_policies 
WHERE tablename = 'vendor_live_sessions';

-- Test the get_current_user_id function
SELECT public.get_current_user_id() as current_user_id;

COMMIT;