-- AQUI Platform Database Setup Script
-- Single authoritative script for setting up all database tables
-- This script should be the only one used for database initialization

-- =============================================================================
-- CORE TABLES (These should already exist from Supabase setup)
-- =============================================================================
-- users table (managed by Supabase Auth)
-- vendors table (should already exist)

-- =============================================================================
-- ADMIN AUTHENTICATION TABLES
-- =============================================================================

-- Create admin_users table for admin authentication
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password_hash TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- =============================================================================
-- USER INTERACTION TABLES
-- =============================================================================

-- Create favorites table for user-vendor relationships
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, vendor_id)
);

-- Create reviews table for vendor reviews
CREATE TABLE IF NOT EXISTS reviews (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    review_text TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- =============================================================================
-- VENDOR FEATURE TABLES
-- =============================================================================

-- Create vendor_static_locations table for permanent vendor locations
CREATE TABLE IF NOT EXISTS vendor_static_locations (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    address TEXT NOT NULL,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    is_primary BOOLEAN DEFAULT false,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendor_announcements table for vendor announcements
CREATE TABLE IF NOT EXISTS vendor_announcements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    message TEXT NOT NULL,
    is_active BOOLEAN DEFAULT true,
    expires_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendor_specials table for vendor special offers
CREATE TABLE IF NOT EXISTS vendor_specials (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    description TEXT NOT NULL,
    price DECIMAL(10, 2),
    original_price DECIMAL(10, 2),
    is_active BOOLEAN DEFAULT true,
    starts_at TIMESTAMP WITH TIME ZONE NOT NULL,
    ends_at TIMESTAMP WITH TIME ZONE NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendor_live_sessions table for real-time vendor locations
CREATE TABLE IF NOT EXISTS vendor_live_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT,
    start_time TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create vendor_reports table for reporting vendors
CREATE TABLE IF NOT EXISTS vendor_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    reason TEXT NOT NULL,
    description TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- ANALYTICS AND TRACKING TABLES
-- =============================================================================

-- Create analytics_exports table for data export tracking
CREATE TABLE IF NOT EXISTS analytics_exports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    admin_id UUID NOT NULL REFERENCES admin_users(id) ON DELETE CASCADE,
    export_type TEXT NOT NULL,
    file_path TEXT,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'completed', 'failed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE
);

-- Create customer_on_the_way table for tracking customer journeys
CREATE TABLE IF NOT EXISTS customer_on_the_way (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    estimated_arrival TIMESTAMP WITH TIME ZONE,
    status TEXT DEFAULT 'on_way' CHECK (status IN ('on_way', 'arrived', 'cancelled')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create customer_reports table for customer feedback/reports
CREATE TABLE IF NOT EXISTS customer_reports (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID REFERENCES vendors(id) ON DELETE CASCADE,
    report_type TEXT NOT NULL,
    description TEXT NOT NULL,
    status TEXT DEFAULT 'pending' CHECK (status IN ('pending', 'reviewed', 'resolved', 'dismissed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    reviewed_by UUID REFERENCES admin_users(id),
    reviewed_at TIMESTAMP WITH TIME ZONE
);

-- =============================================================================
-- INDEXES FOR PERFORMANCE
-- =============================================================================

-- Admin users indexes
CREATE INDEX IF NOT EXISTS idx_admin_users_username ON admin_users(username);
CREATE INDEX IF NOT EXISTS idx_admin_users_email ON admin_users(email);

-- Favorites indexes
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_vendor_id ON favorites(vendor_id);

-- Reviews indexes
CREATE INDEX IF NOT EXISTS idx_reviews_vendor_id ON reviews(vendor_id);
CREATE INDEX IF NOT EXISTS idx_reviews_user_id ON reviews(user_id);
CREATE INDEX IF NOT EXISTS idx_reviews_rating ON reviews(rating);

-- Vendor features indexes
CREATE INDEX IF NOT EXISTS idx_vendor_static_locations_vendor_id ON vendor_static_locations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_static_locations_primary ON vendor_static_locations(vendor_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_vendor_announcements_vendor_id ON vendor_announcements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_announcements_active ON vendor_announcements(vendor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_specials_vendor_id ON vendor_specials(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_specials_active ON vendor_specials(vendor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_vendor_id ON vendor_live_sessions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_active ON vendor_live_sessions(vendor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_reports_vendor_id ON vendor_reports(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reports_status ON vendor_reports(status);

-- Analytics indexes
CREATE INDEX IF NOT EXISTS idx_analytics_exports_admin_id ON analytics_exports(admin_id);
CREATE INDEX IF NOT EXISTS idx_analytics_exports_status ON analytics_exports(status);
CREATE INDEX IF NOT EXISTS idx_customer_on_the_way_user_id ON customer_on_the_way(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_on_the_way_vendor_id ON customer_on_the_way(vendor_id);
CREATE INDEX IF NOT EXISTS idx_customer_reports_user_id ON customer_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_customer_reports_vendor_id ON customer_reports(vendor_id);

-- =============================================================================
-- TRIGGERS FOR AUTOMATIC TIMESTAMP UPDATES
-- =============================================================================

-- Create or replace the update timestamp function
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- Apply triggers to tables with updated_at columns
CREATE TRIGGER update_admin_users_updated_at BEFORE UPDATE ON admin_users FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_reviews_updated_at BEFORE UPDATE ON reviews FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_static_locations_updated_at BEFORE UPDATE ON vendor_static_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_announcements_updated_at BEFORE UPDATE ON vendor_announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_specials_updated_at BEFORE UPDATE ON vendor_specials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_live_sessions_updated_at BEFORE UPDATE ON vendor_live_sessions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_reports_updated_at BEFORE UPDATE ON vendor_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_on_the_way_updated_at BEFORE UPDATE ON customer_on_the_way FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_customer_reports_updated_at BEFORE UPDATE ON customer_reports FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- =============================================================================
-- ROW LEVEL SECURITY (RLS) POLICIES
-- =============================================================================

-- Enable RLS on all tables
ALTER TABLE admin_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE favorites ENABLE ROW LEVEL SECURITY;
ALTER TABLE reviews ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_static_locations ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_specials ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_live_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE vendor_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE analytics_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_on_the_way ENABLE ROW LEVEL SECURITY;
ALTER TABLE customer_reports ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (these can be customized based on specific requirements)
-- Admin users: Only accessible by service role
CREATE POLICY "Admin users are only accessible by service role" ON admin_users
    FOR ALL USING (auth.role() = 'service_role');

-- Favorites: Users can only access their own favorites
CREATE POLICY "Users can view their own favorites" ON favorites
    FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert their own favorites" ON favorites
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can delete their own favorites" ON favorites
    FOR DELETE USING (auth.uid() = user_id);

-- Reviews: Users can view all reviews, but only insert/update their own
CREATE POLICY "Anyone can view reviews" ON reviews
    FOR SELECT USING (true);
CREATE POLICY "Users can insert their own reviews" ON reviews
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update their own reviews" ON reviews
    FOR UPDATE USING (auth.uid() = user_id);

-- Vendor features: Public read access, vendor write access
CREATE POLICY "Anyone can view vendor locations" ON vendor_static_locations
    FOR SELECT USING (true);
CREATE POLICY "Anyone can view vendor announcements" ON vendor_announcements
    FOR SELECT USING (true);
CREATE POLICY "Anyone can view vendor specials" ON vendor_specials
    FOR SELECT USING (true);
CREATE POLICY "Anyone can view live sessions" ON vendor_live_sessions
    FOR SELECT USING (true);

-- Reports: Users can insert, admins can view all
CREATE POLICY "Users can insert vendor reports" ON vendor_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can insert customer reports" ON customer_reports
    FOR INSERT WITH CHECK (auth.uid() = user_id);

COMMIT;

-- =============================================================================
-- SETUP COMPLETE
-- =============================================================================
-- This script creates all necessary tables for the AQUI platform.
-- Run this script once to set up a new database.
-- For existing databases, review each section carefully before execution.
-- =============================================================================