-- Create optimized view for live vendors with sessions
-- This view combines vendors and their active live sessions for improved homepage performance

CREATE OR REPLACE VIEW live_vendors_with_sessions AS
SELECT 
    -- Vendor information
    v.id as vendor_id,
    v.user_id,
    v.business_name,
    v.description,
    v.business_type,
    v.subcategory,
    v.tags,
    v.profile_image_url,
    v.banner_image_url,
    v.contact_email,
    v.phone,
    v.address,
    v.latitude as vendor_latitude,
    v.longitude as vendor_longitude,
    v.city,
    v.status,
    v.average_rating,
    v.total_reviews,
    v.created_at as vendor_created_at,
    v.updated_at as vendor_updated_at,
    v.subcategory__other,
    
    -- Live session information
    vls.id as session_id,
    vls.start_time,
    vls.end_time,
    vls.was_scheduled_duration,
    vls.estimated_customers,
    vls.latitude as session_latitude,
    vls.longitude as session_longitude,
    vls.address as session_address,
    vls.is_active,
    vls.created_at as session_created_at,
    vls.auto_end_time,
    vls.ended_by,
    
    -- Business type and subcategory names (with proper type casting)
    bt.name as business_type_name,
    bs.name as subcategory_name
    
FROM vendors v
INNER JOIN vendor_live_sessions vls ON v.id = vls.vendor_id
LEFT JOIN business_types bt ON v.business_type::uuid = bt.id
LEFT JOIN business_subcategories bs ON v.subcategory::uuid = bs.id
WHERE 
    v.status = 'approved'
    AND vls.is_active = true
    AND v.latitude IS NOT NULL 
    AND v.longitude IS NOT NULL;

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_live_vendors_performance 
ON vendor_live_sessions (vendor_id, is_active) 
WHERE is_active = true;

-- Grant permissions
GRANT SELECT ON live_vendors_with_sessions TO authenticated;
GRANT SELECT ON live_vendors_with_sessions TO service_role;

-- Add comment
COMMENT ON VIEW live_vendors_with_sessions IS 'Optimized view combining approved vendors with their active live sessions for homepage performance';