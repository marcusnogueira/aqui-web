-- =============================================================================
-- NextAuth RLS Functions
-- =============================================================================
-- This script creates functions to replace Supabase Auth functions in RLS policies
-- with NextAuth-compatible equivalents.
-- =============================================================================

BEGIN;

-- =============================================================================
-- NEXTAUTH RLS HELPER FUNCTIONS
-- =============================================================================

-- Function to get current user ID from NextAuth session
-- This replaces auth.uid() in RLS policies
CREATE OR REPLACE FUNCTION public.get_current_user_id()
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
BEGIN
    -- In NextAuth, we'll pass the user ID through the request context
    -- For now, we'll use a session variable that will be set by our API routes
    SELECT current_setting('app.current_user_id', true)::UUID INTO user_id;
    
    -- If no user ID is set, return NULL (unauthenticated)
    IF user_id IS NULL OR user_id = '00000000-0000-0000-0000-000000000000' THEN
        RETURN NULL;
    END IF;
    
    RETURN user_id;
EXCEPTION
    WHEN OTHERS THEN
        RETURN NULL;
END;
$$;

-- Function to check if current request is from service role
-- This replaces auth.role() = 'service_role' in RLS policies
CREATE OR REPLACE FUNCTION public.is_service_role()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    role_name TEXT;
BEGIN
    -- Check if the current role is the service role
    SELECT current_setting('app.current_role', true) INTO role_name;
    
    -- Service role requests will set this variable
    RETURN role_name = 'service_role';
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Function to check if current user is admin
-- This is a helper for admin-specific policies
CREATE OR REPLACE FUNCTION public.is_current_user_admin()
RETURNS BOOLEAN
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    user_id UUID;
    is_admin BOOLEAN := FALSE;
BEGIN
    user_id := public.get_current_user_id();
    
    IF user_id IS NULL THEN
        RETURN FALSE;
    END IF;
    
    -- Check if user has admin role in users table
    SELECT COALESCE(is_admin, FALSE) INTO is_admin
    FROM public.users
    WHERE id = user_id;
    
    RETURN COALESCE(is_admin, FALSE);
EXCEPTION
    WHEN OTHERS THEN
        RETURN FALSE;
END;
$$;

-- Function to set current user context (called by API routes)
-- This will be used by our NextAuth API routes to set the user context
CREATE OR REPLACE FUNCTION public.set_current_user_context(user_id UUID, role_name TEXT DEFAULT NULL)
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    -- Set the current user ID for RLS policies
    PERFORM set_config('app.current_user_id', user_id::TEXT, true);
    
    -- Set the current role if provided
    IF role_name IS NOT NULL THEN
        PERFORM set_config('app.current_role', role_name, true);
    END IF;
END;
$$;

-- Function to clear current user context
CREATE OR REPLACE FUNCTION public.clear_current_user_context()
RETURNS VOID
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
    PERFORM set_config('app.current_user_id', '', true);
    PERFORM set_config('app.current_role', '', true);
END;
$$;

-- =============================================================================
-- GRANT PERMISSIONS
-- =============================================================================

-- Grant execute permissions to authenticated users and service role
GRANT EXECUTE ON FUNCTION public.get_current_user_id() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_service_role() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.is_current_user_admin() TO authenticated, service_role;
GRANT EXECUTE ON FUNCTION public.set_current_user_context(UUID, TEXT) TO service_role;
GRANT EXECUTE ON FUNCTION public.clear_current_user_context() TO service_role;

-- =============================================================================
-- COMMENTS
-- =============================================================================

COMMENT ON FUNCTION public.get_current_user_id() IS 'NextAuth replacement for auth.uid() - gets current user ID from session context';
COMMENT ON FUNCTION public.is_service_role() IS 'NextAuth replacement for auth.role() = service_role - checks if request is from service role';
COMMENT ON FUNCTION public.is_current_user_admin() IS 'Helper function to check if current user has admin privileges';
COMMENT ON FUNCTION public.set_current_user_context(UUID, TEXT) IS 'Sets user context for RLS policies - called by API routes';
COMMENT ON FUNCTION public.clear_current_user_context() IS 'Clears user context - called at end of API requests';

COMMIT;

-- =============================================================================
-- NEXTAUTH RLS FUNCTIONS CREATED SUCCESSFULLY
-- =============================================================================