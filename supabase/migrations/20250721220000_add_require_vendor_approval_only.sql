-- Add require_vendor_approval field to platform_settings table
-- Check if column exists first to avoid errors
DO $$ 
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM information_schema.columns 
        WHERE table_name = 'platform_settings' 
        AND column_name = 'require_vendor_approval'
    ) THEN
        ALTER TABLE platform_settings 
        ADD COLUMN require_vendor_approval boolean DEFAULT false;
    END IF;
END $$;

-- Update the existing record to set the default value if it exists
UPDATE platform_settings 
SET require_vendor_approval = COALESCE(require_vendor_approval, false)
WHERE id = true;