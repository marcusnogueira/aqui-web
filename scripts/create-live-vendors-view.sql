-- =============================================================================
-- Create optimized view for live vendors with sessions
-- This view combines vendors and their active live sessions in a single query
-- for better performance on the homepage
-- =============================================================================

CREATE OR REPLACE VIEW live_vendors_with_sessions AS
SELECT 
    v.id,
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
    v.city,
    v.latitude as vendor_latitude,
    v.longitude as vendor_longitude,
    v.status,
    v.approved_by,
    v.approved_at,
    v.average_rating,
    v.total_reviews,
    v.admin_notes,
    v.created_at as vendor_created_at,
    v.updated_at as vendor_updated_at,
    -- Live session data
    vls.id as live_session_id,
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
    -- Business type and subcategory names (if tables exist)
    bt.name as business_type_name,
    bsc.name as subcategory_name
FROM vendors v
INNER JOIN vendor_live_sessions vls ON v.id = vls.vendor_id
LEFT JOIN business_types bt ON v.business_type = bt.id
LEFT JOIN business_subcategories bsc ON v.subcategory = bsc.id
WHERE 
    v.status = 'approved'
    AND vls.is_active = true
    AND vls.latitude IS NOT NULL
    AND vls.longitude IS NOT NULL;

-- Create index on the view for better performance
CREATE INDEX IF NOT EXISTS idx_live_vendors_session_location 
    ON vendor_live_sessions(vendor_id, is_active, latitude, longitude) 
    WHERE is_active = true AND latitude IS NOT NULL AND longitude IS NOT NULL;

-- Grant appropriate permissions
GRANT SELECT ON live_vendors_with_sessions TO authenticated;
GRANT SELECT ON live_vendors_with_sessions TO service_role;

-- Add comment for documentation
COMMENT ON VIEW live_vendors_with_sessions IS 
'Optimized view that combines approved vendors with their active live sessions. Used by the homepage to fetch live vendors in a single query instead of two separate queries.';