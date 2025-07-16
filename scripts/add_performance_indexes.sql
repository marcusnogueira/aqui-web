-- =============================================================================
-- AQUI Platform Database - Performance Index Additions
-- =============================================================================
-- This script adds missing indexes for frequently queried fields to improve
-- database performance as the application scales.
-- =============================================================================

BEGIN;

-- Add composite index for user authentication queries
CREATE INDEX IF NOT EXISTS idx_users_email_active_role 
ON users(email, active_role);

-- Add index for active live sessions (frequently queried)
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_active_only 
ON vendor_live_sessions(vendor_id, is_active) 
WHERE is_active = true;

-- Add index for vendor status queries (admin dashboard)
CREATE INDEX IF NOT EXISTS idx_vendors_status 
ON vendors(status);

-- Add index for vendor approval queries
CREATE INDEX IF NOT EXISTS idx_vendors_status_created 
ON vendors(status, created_at);

-- Add index for user external_id lookups (OAuth)
CREATE INDEX IF NOT EXISTS idx_users_external_id 
ON users(external_id) 
WHERE external_id IS NOT NULL;

-- Add index for vendor feedback status queries
CREATE INDEX IF NOT EXISTS idx_vendor_feedback_status_created 
ON vendor_feedback(status, created_at);

-- Add index for notification queries
CREATE INDEX IF NOT EXISTS idx_notifications_recipient_read 
ON notifications(recipient_id, is_read, created_at);

-- Add index for review queries by vendor and rating
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_rating_created 
ON reviews(vendor_id, rating, created_at);

-- Add index for search logs analytics
CREATE INDEX IF NOT EXISTS idx_search_logs_searched_at 
ON search_logs(searched_at DESC);

-- Add index for customer reports resolution status
CREATE INDEX IF NOT EXISTS idx_customer_reports_resolved_created 
ON customer_reports(resolved, created_at);

-- Add index for vendor reports resolution status
CREATE INDEX IF NOT EXISTS idx_vendor_reports_resolved_created 
ON vendor_reports(resolved, created_at);

COMMIT;

-- =============================================================================
-- PERFORMANCE INDEXES ADDED SUCCESSFULLY
-- =============================================================================