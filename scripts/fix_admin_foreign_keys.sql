-- =============================================================================
-- Aqui Platform Database - Admin Foreign Key Correction Script
-- =============================================================================
-- This script corrects foreign key constraints that incorrectly reference
-- the `users` table instead of `admin_users` table for admin-related operations.
-- =============================================================================

BEGIN;

-- Fix analytics_exports table
-- Drop incorrect foreign key constraint
ALTER TABLE analytics_exports DROP CONSTRAINT IF EXISTS analytics_exports_admin_id_fkey;

-- Add correct foreign key constraint to admin_users table
ALTER TABLE analytics_exports 
ADD CONSTRAINT analytics_exports_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE;

-- Fix moderation_logs table
-- Drop incorrect foreign key constraint
ALTER TABLE moderation_logs DROP CONSTRAINT IF EXISTS moderation_logs_admin_id_fkey;

-- Add correct foreign key constraint to admin_users table
ALTER TABLE moderation_logs 
ADD CONSTRAINT moderation_logs_admin_id_fkey 
FOREIGN KEY (admin_id) REFERENCES admin_users(id) ON DELETE CASCADE;

-- Update RLS policies to reflect the correct relationships
-- Drop existing policies
DROP POLICY IF EXISTS "Analytics exports are only accessible by service role" ON analytics_exports;
DROP POLICY IF EXISTS "Moderation logs are only accessible by service role" ON moderation_logs;

-- Create new policies with correct admin reference
CREATE POLICY "Analytics exports are only accessible by service role" ON analytics_exports
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Moderation logs are only accessible by service role" ON moderation_logs
    FOR ALL USING (auth.role() = 'service_role');

COMMIT;

-- =============================================================================
-- ADMIN FOREIGN KEY CORRECTION COMPLETE
-- =============================================================================