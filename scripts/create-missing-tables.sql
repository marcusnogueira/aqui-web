-- Create missing tables for vendor profile features

-- Create vendor_static_locations table
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

-- Create vendor_announcements table
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

-- Create vendor_specials table
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

-- Create favorites table
CREATE TABLE IF NOT EXISTS favorites (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id, vendor_id)
);

-- Create admin_users table
CREATE TABLE IF NOT EXISTS admin_users (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    UNIQUE(user_id)
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_static_locations_vendor_id ON vendor_static_locations(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_static_locations_primary ON vendor_static_locations(vendor_id, is_primary);
CREATE INDEX IF NOT EXISTS idx_vendor_announcements_vendor_id ON vendor_announcements(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_announcements_active ON vendor_announcements(vendor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_specials_vendor_id ON vendor_specials(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_specials_active ON vendor_specials(vendor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
CREATE INDEX IF NOT EXISTS idx_favorites_vendor_id ON favorites(vendor_id);

-- Add triggers for updated_at timestamps
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_vendor_static_locations_updated_at BEFORE UPDATE ON vendor_static_locations FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_announcements_updated_at BEFORE UPDATE ON vendor_announcements FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_vendor_specials_updated_at BEFORE UPDATE ON vendor_specials FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Insert sample data for San Francisco landmarks
INSERT INTO vendor_static_locations (vendor_id, name, address, latitude, longitude, is_primary)
SELECT 
    v.id,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 1 THEN 'Golden Gate Park'
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 2 THEN 'Fisherman''s Wharf'
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 3 THEN 'Union Square'
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 4 THEN 'Mission District'
        ELSE 'Castro District'
    END as name,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 1 THEN 'Golden Gate Park, San Francisco, CA'
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 2 THEN 'Fisherman''s Wharf, San Francisco, CA'
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 3 THEN 'Union Square, San Francisco, CA'
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 4 THEN 'Mission District, San Francisco, CA'
        ELSE 'Castro District, San Francisco, CA'
    END as address,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 1 THEN 37.7694
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 2 THEN 37.8080
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 3 THEN 37.7879
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 4 THEN 37.7599
        ELSE 37.7609
    END as latitude,
    CASE 
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 1 THEN -122.4862
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 2 THEN -122.4177
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 3 THEN -122.4075
        WHEN ROW_NUMBER() OVER (ORDER BY v.created_at) = 4 THEN -122.4148
        ELSE -122.4350
    END as longitude,
    true as is_primary
FROM vendors v
WHERE NOT EXISTS (
    SELECT 1 FROM vendor_static_locations vsl WHERE vsl.vendor_id = v.id
);

-- Insert sample announcements
INSERT INTO vendor_announcements (vendor_id, title, message, is_active, expires_at)
SELECT 
    v.id,
    'Welcome to our location!',
    'We''re excited to serve you fresh, delicious food at this amazing San Francisco location.',
    true,
    NOW() + INTERVAL '30 days'
FROM vendors v
WHERE NOT EXISTS (
    SELECT 1 FROM vendor_announcements va WHERE va.vendor_id = v.id
);

-- Insert sample specials
INSERT INTO vendor_specials (vendor_id, title, description, price, original_price, is_active, starts_at, ends_at)
SELECT 
    v.id,
    'Daily Special',
    'Try our chef''s special dish of the day with a 20% discount!',
    12.99,
    15.99,
    true,
    NOW(),
    NOW() + INTERVAL '7 days'
FROM vendors v
WHERE NOT EXISTS (
    SELECT 1 FROM vendor_specials vs WHERE vs.vendor_id = v.id
);

COMMIT;