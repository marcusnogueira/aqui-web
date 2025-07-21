-- NextAuth RLS Integration Functions
-- These functions help integrate NextAuth.js with Supabase RLS policies

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

-- Function to get the current authenticated user ID
CREATE OR REPLACE FUNCTION public.auth_user_id()
RETURNS uuid AS $$
DECLARE
  user_id text;
BEGIN
  user_id := current_setting('request.auth.user_id', true);
  IF user_id IS NULL OR user_id = '' THEN
    RETURN NULL;
  END IF;
  RETURN user_id::uuid;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to get the current authenticated user role
CREATE OR REPLACE FUNCTION public.auth_role()
RETURNS text AS $$
DECLARE
  role text;
BEGIN
  role := current_setting('request.auth.role', true);
  IF role IS NULL OR role = '' THEN
    RETURN NULL;
  END IF;
  RETURN role;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if the current user is authenticated
CREATE OR REPLACE FUNCTION public.is_authenticated()
RETURNS boolean AS $$
BEGIN
  RETURN auth_user_id() IS NOT NULL;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if the current user has a specific role
CREATE OR REPLACE FUNCTION public.has_role(required_role text)
RETURNS boolean AS $$
BEGIN
  RETURN auth_role() = required_role;
END;
$$ LANGUAGE plpgsql STABLE;

-- Function to check if the current user is an admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS boolean AS $$
BEGIN
  RETURN has_role('admin') OR has_role('service_role');
END;
$$ LANGUAGE plpgsql STABLE;

-- Example RLS policy using these functions:
-- ALTER TABLE your_table ENABLE ROW LEVEL SECURITY;
-- 
-- CREATE POLICY "Users can view their own data"
-- ON your_table
-- FOR SELECT
-- USING (user_id = auth_user_id());
-- 
-- CREATE POLICY "Admins can do anything"
-- ON your_table
-- USING (is_admin());