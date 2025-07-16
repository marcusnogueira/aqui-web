-- =============================================================================
-- Update RLS Policies for NextAuth
-- =============================================================================
-- This script updates all RLS policies to use NextAuth-compatible functions
-- instead of Supabase Auth functions.
-- =============================================================================

BEGIN;

-- =============================================================================
-- DROP EXISTING POLICIES
-- =============================================================================

-- Users policies
DROP POLICY IF EXISTS "Users can view all user profiles" ON users;
DROP POLICY IF EXISTS "Users can update their own profile" ON users;

-- Vendors policies  
DROP POLICY IF EXISTS "Anyone can view vendor profiles" ON vendors;
DROP POLICY IF EXISTS "Vendors can manage their own profile" ON vendors;

-- Admin users policies
DROP POLICY IF EXISTS "Admin users are only accessible by service role" ON admin_users;

-- Favorites policies
DROP POLICY IF EXISTS "Users can view their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can insert their own favorites" ON favorites;
DROP POLICY IF EXISTS "Users can delete their own favorites" ON favorites;

-- Reviews policies
DROP POLICY IF EXISTS "Users can view all reviews" ON reviews;
DROP POLICY IF EXISTS "Users can insert their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update their own reviews" ON reviews;
DROP POLICY IF EXISTS "Users can delete their own reviews" ON reviews;

-- Vendor Static Locations policies
DROP POLICY IF EXISTS "Anyone can view vendor static locations" ON vendor_static_locations;
DROP POLICY IF EXISTS "Vendors can manage their own static locations" ON vendor_static_locations;

-- Vendor Announcements policies
DROP POLICY IF EXISTS "Anyone can view vendor announcements" ON vendor_announcements;
DROP POLICY IF EXISTS "Vendors can manage their own announcements" ON vendor_announcements;

-- Vendor Specials policies
DROP POLICY IF EXISTS "Anyone can view vendor specials" ON vendor_specials;
DROP POLICY IF EXISTS "Vendors can manage their own specials" ON vendor_specials;

-- Vendor Live Sessions policies
DROP POLICY IF EXISTS "Anyone can view live sessions" ON vendor_live_sessions;
DROP POLICY IF EXISTS "Vendors can manage their own sessions" ON vendor_live_sessions;

-- Vendor Reports policies
DROP POLICY IF EXISTS "Users can insert vendor reports" ON vendor_reports;
DROP POLICY IF EXISTS "Users can view their own reports" ON vendor_reports;

-- Analytics Exports policies
DROP POLICY IF EXISTS "Analytics exports are only accessible by service role" ON analytics_exports;

-- Customer On The Way policies
DROP POLICY IF EXISTS "Users can manage their own tracking" ON customer_on_the_way;

-- Customer Reports policies
DROP POLICY IF EXISTS "Users can insert customer reports" ON customer_reports;
DROP POLICY IF EXISTS "Users can view their own customer reports" ON customer_reports;

-- Vendor Feedback policies
DROP POLICY IF EXISTS "Vendors can manage their own feedback" ON vendor_feedback;

-- Vendor Hours policies
DROP POLICY IF EXISTS "Anyone can view vendor hours" ON vendor_hours;
DROP POLICY IF EXISTS "Vendors can manage their own hours" ON vendor_hours;

-- Moderation Logs policies
DROP POLICY IF EXISTS "Moderation logs are only accessible by service role" ON moderation_logs;

-- Platform Settings policies
DROP POLICY IF EXISTS "Platform settings are only accessible by service role" ON platform_settings;

-- Review Reports policies
DROP POLICY IF EXISTS "Users can insert review reports" ON review_reports;
DROP POLICY IF EXISTS "Review reports are manageable by service role" ON review_reports;

-- Search Logs policies
DROP POLICY IF EXISTS "Users can manage their own search logs" ON search_logs;

-- =============================================================================
-- CREATE NEXTAUTH-COMPATIBLE POLICIES
-- =============================================================================

-- Users: Users can view and update their own profile
CREATE POLICY "Users can view all user profiles" ON users
    FOR SELECT USING (true);
CREATE POLICY "Users can update their own profile" ON users
    FOR UPDATE USING (public.get_current_user_id() = id);

-- Vendors: Public read access, only vendor owners can modify
CREATE POLICY "Anyone can view vendor profiles" ON vendors
    FOR SELECT USING (true);
CREATE POLICY "Vendors can manage their own profile" ON vendors
    FOR ALL USING (public.get_current_user_id() = user_id);

-- Admin users: Only accessible by service role
CREATE POLICY "Admin users are only accessible by service role" ON admin_users
    FOR ALL USING (public.is_service_role());

-- Favorites: Users can only access their own favorites
CREATE POLICY "Users can view their own favorites" ON favorites
    FOR SELECT USING (public.get_current_user_id() = customer_id);
CREATE POLICY "Users can insert their own favorites" ON favorites
    FOR INSERT WITH CHECK (public.get_current_user_id() = customer_id);
CREATE POLICY "Users can delete their own favorites" ON favorites
    FOR DELETE USING (public.get_current_user_id() = customer_id);

-- Reviews: Public read access, users can only modify their own reviews
CREATE POLICY "Users can view all reviews" ON reviews
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON reviews
    FOR INSERT WITH CHECK (public.get_current_user_id() = user_id);
CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (public.get_current_user_id() = user_id);
CREATE POLICY "Users can delete their own reviews" ON reviews
    FOR DELETE USING (public.get_current_user_id() = user_id);

-- Vendor Static Locations: Public read access, only vendor owners can modify
CREATE POLICY "Anyone can view vendor static locations" ON vendor_static_locations
    FOR SELECT USING (true);
CREATE POLICY "Vendors can manage their own static locations" ON vendor_static_locations
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.id = vendor_static_locations.vendor_id 
            AND vendors.user_id = public.get_current_user_id()
        )
    );

-- Vendor Announcements: Public read access, only vendor owners can modify
CREATE POLICY "Anyone can view vendor announcements" ON vendor_announcements
    FOR SELECT USING (true);
CREATE POLICY "Vendors can manage their own announcements" ON vendor_announcements
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.id = vendor_announcements.vendor_id 
            AND vendors.user_id = public.get_current_user_id()
        )
    );

-- Vendor Specials: Public read access, only vendor owners can modify
CREATE POLICY "Anyone can view vendor specials" ON vendor_specials
    FOR SELECT USING (true);
CREATE POLICY "Vendors can manage their own specials" ON vendor_specials
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.id = vendor_specials.vendor_id 
            AND vendors.user_id = public.get_current_user_id()
        )
    );

-- Vendor Live Sessions: Public read access, only vendor owners can modify
CREATE POLICY "Anyone can view live sessions" ON vendor_live_sessions
    FOR SELECT USING (true);
CREATE POLICY "Vendors can manage their own sessions" ON vendor_live_sessions
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.id = vendor_live_sessions.vendor_id 
            AND vendors.user_id = public.get_current_user_id()
        )
    );

-- Vendor Reports: Users can insert, only report creators can view their own reports
CREATE POLICY "Users can insert vendor reports" ON vendor_reports
    FOR INSERT WITH CHECK (public.get_current_user_id() = reporter_id);
CREATE POLICY "Users can view their own reports" ON vendor_reports
    FOR SELECT USING (public.get_current_user_id() = reporter_id);

-- Analytics Exports: Only accessible by service role
CREATE POLICY "Analytics exports are only accessible by service role" ON analytics_exports
    FOR ALL USING (public.is_service_role());

-- Customer On The Way: Users can only access their own tracking data
CREATE POLICY "Users can manage their own tracking" ON customer_on_the_way
    FOR ALL USING (public.get_current_user_id() = user_id)
    WITH CHECK (public.get_current_user_id() = user_id);

-- Customer Reports: Users can insert and view their own reports
CREATE POLICY "Users can insert customer reports" ON customer_reports
    FOR INSERT WITH CHECK (public.get_current_user_id() = reporter_id);
CREATE POLICY "Users can view their own customer reports" ON customer_reports
    FOR SELECT USING (public.get_current_user_id() = reporter_id);

-- Vendor Feedback: Vendors can manage their own feedback
CREATE POLICY "Vendors can manage their own feedback" ON vendor_feedback
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.id = vendor_feedback.vendor_id 
            AND vendors.user_id = public.get_current_user_id()
        )
    );

-- Vendor Hours: Public read access, only vendor owners can modify
CREATE POLICY "Anyone can view vendor hours" ON vendor_hours
    FOR SELECT USING (true);
CREATE POLICY "Vendors can manage their own hours" ON vendor_hours
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM vendors 
            WHERE vendors.id = vendor_hours.vendor_id 
            AND vendors.user_id = public.get_current_user_id()
        )
    );

-- Moderation Logs: Only accessible by service role
CREATE POLICY "Moderation logs are only accessible by service role" ON moderation_logs
    FOR ALL USING (public.is_service_role());

-- Platform Settings: Only accessible by service role
CREATE POLICY "Platform settings are only accessible by service role" ON platform_settings
    FOR ALL USING (public.is_service_role());

-- Review Reports: Only accessible by service role (no reporter_id column exists)
CREATE POLICY "Review reports are only accessible by service role" ON review_reports
    FOR ALL USING (public.is_service_role());

-- Search Logs: Users can only access their own search logs
CREATE POLICY "Users can manage their own search logs" ON search_logs
    FOR ALL USING (public.get_current_user_id() = user_id)
    WITH CHECK (public.get_current_user_id() = user_id);

-- Notifications: Only accessible by service role (admin notifications)
CREATE POLICY "Notifications are only accessible by service role" ON notifications
    FOR ALL USING (public.is_service_role());

COMMIT;

-- =============================================================================
-- RLS POLICIES UPDATED FOR NEXTAUTH COMPATIBILITY
-- =============================================================================