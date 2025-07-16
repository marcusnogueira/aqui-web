-- =============================================================================
-- User Data Cleanup for NextAuth Migration
-- =============================================================================
-- This script cleans up existing user data to prepare for NextAuth migration.
-- We're starting fresh with users (except admin users which are migrated separately).
-- =============================================================================

BEGIN;

-- =============================================================================
-- BACKUP EXISTING DATA (for reference)
-- =============================================================================

-- Create temporary backup tables
CREATE TABLE IF NOT EXISTS migration_backup_users AS 
SELECT * FROM users;

CREATE TABLE IF NOT EXISTS migration_backup_vendors AS 
SELECT * FROM vendors;

-- =============================================================================
-- CLEAN UP USER-RELATED DATA
-- =============================================================================

-- 1. Delete vendor-related data (will be recreated when vendors re-register)
DELETE FROM vendor_live_sessions;
DELETE FROM vendor_announcements;
DELETE FROM vendor_specials;
DELETE FROM vendor_static_locations;
DELETE FROM vendor_hours;
DELETE FROM vendor_feedback;

-- 2. Delete user-generated content (will be recreated)
DELETE FROM reviews;
DELETE FROM favorites;
DELETE FROM customer_on_the_way;
DELETE FROM customer_reports;
DELETE FROM vendor_reports;
DELETE FROM search_logs;

-- 3. Delete vendors (will be recreated when users re-register as vendors)
DELETE FROM vendors;

-- 4. Delete public users (starting fresh with NextAuth)
DELETE FROM users;

-- =============================================================================
-- RESET SEQUENCES (if any)
-- =============================================================================

-- Reset any sequences that might be affected
-- (Most tables use UUIDs, but some might have sequences)

-- =============================================================================
-- VERIFY CLEANUP
-- =============================================================================

-- Check that tables are empty (except admin_users and system tables)
DO $$
DECLARE
    user_count INTEGER;
    vendor_count INTEGER;
    review_count INTEGER;
BEGIN
    SELECT COUNT(*) INTO user_count FROM users;
    SELECT COUNT(*) INTO vendor_count FROM vendors;
    SELECT COUNT(*) INTO review_count FROM reviews;
    
    RAISE NOTICE 'Cleanup verification:';
    RAISE NOTICE '  Users remaining: %', user_count;
    RAISE NOTICE '  Vendors remaining: %', vendor_count;
    RAISE NOTICE '  Reviews remaining: %', review_count;
    
    IF user_count > 0 OR vendor_count > 0 OR review_count > 0 THEN
        RAISE EXCEPTION 'Cleanup incomplete - some user data remains';
    END IF;
    
    RAISE NOTICE 'User data cleanup completed successfully!';
END $$;

COMMIT;

-- =============================================================================
-- USER DATA CLEANUP COMPLETED
-- =============================================================================
-- All user-generated data has been cleared.
-- Admin users remain intact and will be restored after migration.
-- The system is ready for NextAuth user registration.
-- =============================================================================