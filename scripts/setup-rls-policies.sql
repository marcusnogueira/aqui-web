-- Row Level Security (RLS) Policies for AQUI Platform
-- This script sets up comprehensive RLS policies for the new authentication strategy

-- Enable RLS on all tables
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendors ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE search_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_on_the_way ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_static_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;

-- Drop existing policies if they exist
DROP POLICY IF EXISTS "Users can view own profile" ON users;
DROP POLICY IF EXISTS "Users can update own profile" ON users;
DROP POLICY IF EXISTS "Service role full access to users" ON users;

DROP POLICY IF EXISTS "Vendors can view own profile" ON vendors;
DROP POLICY IF EXISTS "Vendors can update own profile" ON vendors;
DROP POLICY IF EXISTS "Users can view vendor profiles" ON vendors;
DROP POLICY IF EXISTS "Service role full access to vendors" ON vendors;

DROP POLICY IF EXISTS "Vendors can manage own sessions" ON vendor_live_sessions;
DROP POLICY IF EXISTS "Users can view live sessions" ON vendor_live_sessions;
DROP POLICY IF EXISTS "Service role full access to vendor_live_sessions" ON vendor_live_sessions;

DROP POLICY IF EXISTS "Users can view reviews" ON reviews;
DROP POLICY IF EXISTS "Users can create reviews" ON reviews;
DROP POLICY IF EXISTS "Users can update own reviews" ON reviews;
DROP POLICY IF EXISTS "Service role full access to reviews" ON reviews;

DROP POLICY IF EXISTS "Users can manage own favorites" ON favorites;
DROP POLICY IF EXISTS "Service role full access to favorites" ON favorites;

DROP POLICY IF EXISTS "Users can view own search logs" ON search_logs;
DROP POLICY IF EXISTS "Service role full access to search_logs" ON search_logs;

DROP POLICY IF EXISTS "Users can manage own tracking" ON customer_on_the_way;
DROP POLICY IF EXISTS "Vendors can view customer tracking" ON customer_on_the_way;
DROP POLICY IF EXISTS "Service role full access to customer_on_the_way" ON customer_on_the_way;

DROP POLICY IF EXISTS "Vendors can manage own locations" ON vendor_static_locations;
DROP POLICY IF EXISTS "Users can view vendor locations" ON vendor_static_locations;
DROP POLICY IF EXISTS "Service role full access to vendor_static_locations" ON vendor_static_locations;

DROP POLICY IF EXISTS "Vendors can manage own announcements" ON vendor_announcements;
DROP POLICY IF EXISTS "Users can view vendor announcements" ON vendor_announcements;
DROP POLICY IF EXISTS "Service role full access to vendor_announcements" ON vendor_announcements;

DROP POLICY IF EXISTS "Vendors can manage own specials" ON vendor_specials;
DROP POLICY IF EXISTS "Users can view vendor specials" ON vendor_specials;
DROP POLICY IF EXISTS "Service role full access to vendor_specials" ON vendor_specials;

DROP POLICY IF EXISTS "Service role only access to admin_users" ON admin_users;

-- USERS TABLE POLICIES
-- Users can view and update their own profile
CREATE POLICY "Users can view own profile" ON users
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON users
  FOR UPDATE USING (auth.uid() = id);

-- Service role has full access for admin operations
CREATE POLICY "Service role full access to users" ON users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- VENDORS TABLE POLICIES
-- Vendors can view and update their own profile
CREATE POLICY "Vendors can view own profile" ON vendors
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Vendors can update own profile" ON vendors
  FOR UPDATE USING (auth.uid() = user_id);

-- All authenticated users can view vendor profiles (for discovery)
CREATE POLICY "Users can view vendor profiles" ON vendors
  FOR SELECT USING (auth.role() = 'authenticated');

-- Service role has full access
CREATE POLICY "Service role full access to vendors" ON vendors
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- VENDOR LIVE SESSIONS POLICIES
-- Vendors can manage their own live sessions
CREATE POLICY "Vendors can manage own sessions" ON vendor_live_sessions
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM vendors WHERE id = vendor_live_sessions.vendor_id
    )
  );

-- All authenticated users can view live sessions
CREATE POLICY "Users can view live sessions" ON vendor_live_sessions
  FOR SELECT USING (auth.role() = 'authenticated');

-- Service role has full access
CREATE POLICY "Service role full access to vendor_live_sessions" ON vendor_live_sessions
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- REVIEWS TABLE POLICIES
-- All authenticated users can view reviews
CREATE POLICY "Users can view reviews" ON reviews
  FOR SELECT USING (auth.role() = 'authenticated');

-- Users can create reviews
CREATE POLICY "Users can create reviews" ON reviews
  FOR INSERT WITH CHECK (auth.uid() = user_id);

-- Users can update their own reviews
CREATE POLICY "Users can update own reviews" ON reviews
  FOR UPDATE USING (auth.uid() = user_id);

-- Service role has full access
CREATE POLICY "Service role full access to reviews" ON reviews
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- FAVORITES TABLE POLICIES
-- Users can manage their own favorites
CREATE POLICY "Users can manage own favorites" ON favorites
  FOR ALL USING (auth.uid() = customer_id);

-- Service role has full access
CREATE POLICY "Service role full access to favorites" ON favorites
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- SEARCH LOGS POLICIES
-- Users can view their own search logs
CREATE POLICY "Users can view own search logs" ON search_logs
  FOR SELECT USING (auth.uid() = user_id);

-- Service role has full access (for analytics)
CREATE POLICY "Service role full access to search_logs" ON search_logs
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- CUSTOMER ON THE WAY POLICIES
-- Users can manage their own tracking data
CREATE POLICY "Users can manage own tracking" ON customer_on_the_way
  FOR ALL USING (auth.uid() = user_id);

-- Vendors can view customer tracking for their sessions
CREATE POLICY "Vendors can view customer tracking" ON customer_on_the_way
  FOR SELECT USING (
    auth.uid() IN (
      SELECT v.user_id 
      FROM vendors v 
      JOIN vendor_live_sessions vls ON v.id = vls.vendor_id 
      WHERE vls.id = customer_on_the_way.session_id
    )
  );

-- Service role has full access
CREATE POLICY "Service role full access to customer_on_the_way" ON customer_on_the_way
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- VENDOR STATIC LOCATIONS POLICIES
-- Vendors can manage their own static locations
CREATE POLICY "Vendors can manage own locations" ON vendor_static_locations
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM vendors WHERE id = vendor_static_locations.vendor_id
    )
  );

-- All authenticated users can view vendor locations
CREATE POLICY "Users can view vendor locations" ON vendor_static_locations
  FOR SELECT USING (auth.role() = 'authenticated');

-- Service role has full access
CREATE POLICY "Service role full access to vendor_static_locations" ON vendor_static_locations
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- VENDOR ANNOUNCEMENTS POLICIES
-- Vendors can manage their own announcements
CREATE POLICY "Vendors can manage own announcements" ON vendor_announcements
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM vendors WHERE id = vendor_announcements.vendor_id
    )
  );

-- All authenticated users can view vendor announcements
CREATE POLICY "Users can view vendor announcements" ON vendor_announcements
  FOR SELECT USING (auth.role() = 'authenticated');

-- Service role has full access
CREATE POLICY "Service role full access to vendor_announcements" ON vendor_announcements
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- VENDOR SPECIALS POLICIES
-- Vendors can manage their own specials
CREATE POLICY "Vendors can manage own specials" ON vendor_specials
  FOR ALL USING (
    auth.uid() IN (
      SELECT user_id FROM vendors WHERE id = vendor_specials.vendor_id
    )
  );

-- All authenticated users can view vendor specials
CREATE POLICY "Users can view vendor specials" ON vendor_specials
  FOR SELECT USING (auth.role() = 'authenticated');

-- Service role has full access
CREATE POLICY "Service role full access to vendor_specials" ON vendor_specials
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- ADMIN USERS TABLE POLICIES
-- Only service role can access admin_users table
-- This ensures complete isolation from regular user authentication
CREATE POLICY "Service role only access to admin_users" ON admin_users
  FOR ALL USING (auth.jwt() ->> 'role' = 'service_role');

-- Grant necessary permissions
GRANT USAGE ON SCHEMA public TO authenticated;
GRANT USAGE ON SCHEMA public TO service_role;

-- Grant table permissions to authenticated users
GRANT SELECT, INSERT, UPDATE ON users TO authenticated;
GRANT SELECT, INSERT, UPDATE ON vendors TO authenticated;
GRANT SELECT ON vendor_live_sessions TO authenticated;
GRANT INSERT, UPDATE ON vendor_live_sessions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON reviews TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON favorites TO authenticated;
GRANT SELECT ON search_logs TO authenticated;
GRANT SELECT, INSERT, UPDATE, DELETE ON customer_on_the_way TO authenticated;
GRANT SELECT ON vendor_static_locations TO authenticated;
GRANT INSERT, UPDATE, DELETE ON vendor_static_locations TO authenticated;
GRANT SELECT ON vendor_announcements TO authenticated;
GRANT INSERT, UPDATE, DELETE ON vendor_announcements TO authenticated;
GRANT SELECT ON vendor_specials TO authenticated;
GRANT INSERT, UPDATE, DELETE ON vendor_specials TO authenticated;

-- Grant full permissions to service role
GRANT ALL ON ALL TABLES IN SCHEMA public TO service_role;
GRANT ALL ON ALL SEQUENCES IN SCHEMA public TO service_role;
GRANT ALL ON ALL FUNCTIONS IN SCHEMA public TO service_role;

COMMIT;