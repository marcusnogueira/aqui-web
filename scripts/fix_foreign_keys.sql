-- =============================================================================
-- AQUI Platform Database V2.1 - Foreign Key Correction Script
-- =============================================================================
-- This script corrects foreign key constraints that incorrectly point to the
-- `vendors_old` table. It ensures all references point to the correct `vendors`
-- table, restoring data integrity.
--
-- Run this script after the main database setup to fix the schema.
-- =============================================================================

BEGIN;

-- Drop incorrect foreign key constraints
ALTER TABLE customer_on_the_way DROP CONSTRAINT IF EXISTS customer_on_the_way_vendor_id_fkey;
ALTER TABLE customer_reports DROP CONSTRAINT IF EXISTS customer_reports_vendor_id_fkey;
ALTER TABLE review_reports DROP CONSTRAINT IF EXISTS review_reports_vendor_id_fkey;
ALTER TABLE search_logs DROP CONSTRAINT IF EXISTS search_logs_vendor_clicked_fkey;
ALTER TABLE vendor_announcements DROP CONSTRAINT IF EXISTS vendor_announcements_vendor_id_fkey;
ALTER TABLE vendor_feedback DROP CONSTRAINT IF EXISTS vendor_feedback_vendor_id_fkey;
ALTER TABLE vendor_hours DROP CONSTRAINT IF EXISTS vendor_hours_vendor_id_fkey;
ALTER TABLE vendor_specials DROP CONSTRAINT IF EXISTS vendor_specials_vendor_id_fkey;
ALTER TABLE vendor_static_locations DROP CONSTRAINT IF EXISTS vendor_static_locations_vendor_id_fkey;

-- Add correct foreign key constraints
ALTER TABLE customer_on_the_way ADD CONSTRAINT customer_on_the_way_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE customer_reports ADD CONSTRAINT customer_reports_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE review_reports ADD CONSTRAINT review_reports_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE search_logs ADD CONSTRAINT search_logs_vendor_clicked_fkey FOREIGN KEY (vendor_clicked) REFERENCES vendors(id) ON DELETE SET NULL;
ALTER TABLE vendor_announcements ADD CONSTRAINT vendor_announcements_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE vendor_feedback ADD CONSTRAINT vendor_feedback_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE vendor_hours ADD CONSTRAINT vendor_hours_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE vendor_specials ADD CONSTRAINT vendor_specials_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;
ALTER TABLE vendor_static_locations ADD CONSTRAINT vendor_static_locations_vendor_id_fkey FOREIGN KEY (vendor_id) REFERENCES vendors(id) ON DELETE CASCADE;

COMMIT;

-- =============================================================================
-- CORRECTION COMPLETE
-- =============================================================================
