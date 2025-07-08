-- Admin Authentication System Schema
-- This creates a separate admin_users table for independent admin authentication
-- Execute this in your Supabase SQL editor

-- Drop existing table if it exists
DROP TABLE IF EXISTS public.admin_users CASCADE;

-- Create admin_users table for independent admin authentication
CREATE TABLE public.admin_users (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  email VARCHAR(255) UNIQUE NOT NULL,
  username VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX idx_admin_users_email ON public.admin_users(email);
CREATE INDEX idx_admin_users_username ON public.admin_users(username);

-- Enable RLS
ALTER TABLE public.admin_users ENABLE ROW LEVEL SECURITY;

-- Create RLS policy - only allow access via service role (server-side)
CREATE POLICY "Admin users are only accessible via service role" ON public.admin_users
  FOR ALL USING (false); -- No direct access from client

-- Create a function to verify admin credentials (server-side only)
CREATE OR REPLACE FUNCTION verify_admin_credentials(input_username TEXT, input_password_hash TEXT)
RETURNS TABLE(admin_id UUID, admin_email TEXT, admin_username TEXT) 
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT id, email, username
  FROM public.admin_users
  WHERE username = input_username AND password_hash = input_password_hash;
END;
$$ LANGUAGE plpgsql;

-- Grant execute permission to service role
GRANT EXECUTE ON FUNCTION verify_admin_credentials TO service_role;

-- Verification query
SELECT 'admin_users table created successfully' as status;
SELECT table_name, column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'admin_users' 
ORDER BY ordinal_position;