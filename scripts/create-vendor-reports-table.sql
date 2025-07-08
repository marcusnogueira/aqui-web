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
  admin_notes TEXT
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_vendor_reports_vendor_id ON vendor_reports(vendor_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reports_user_id ON vendor_reports(user_id);
CREATE INDEX IF NOT EXISTS idx_vendor_reports_status ON vendor_reports(status);
CREATE INDEX IF NOT EXISTS idx_vendor_reports_created_at ON vendor_reports(created_at);

-- Enable RLS
ALTER TABLE vendor_reports ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can create reports" ON vendor_reports
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can view their own reports" ON vendor_reports
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all reports" ON vendor_reports
  FOR ALL USING (EXISTS (
    SELECT 1 FROM admin_users WHERE id = auth.uid()
  ));

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_vendor_reports_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_vendor_reports_updated_at
  BEFORE UPDATE ON vendor_reports
  FOR EACH ROW
  EXECUTE FUNCTION update_vendor_reports_updated_at();