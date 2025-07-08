-- Create vendor_live_sessions table
CREATE TABLE IF NOT EXISTS vendor_live_sessions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
    latitude DECIMAL(10, 8) NOT NULL,
    longitude DECIMAL(11, 8) NOT NULL,
    address TEXT NOT NULL,
    start_time TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    end_time TIMESTAMP WITH TIME ZONE,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_vendor_id ON vendor_live_sessions(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_active ON vendor_live_sessions(vendor_id, is_active);
CREATE INDEX IF NOT EXISTS idx_vendor_live_sessions_start_time ON vendor_live_sessions(start_time);

COMMIT;