-- =============================================================================
-- NextAuth Migration: Add Required Columns to Users Table
-- =============================================================================
-- This script adds the necessary columns to support NextAuth.js with credentials
-- and OAuth providers while maintaining compatibility with existing data.
-- =============================================================================

BEGIN;

-- Add password column for credentials authentication (nullable for OAuth users)
ALTER TABLE users ADD COLUMN IF NOT EXISTS password TEXT;

-- Add name column (maps to full_name for consistency)
ALTER TABLE users ADD COLUMN IF NOT EXISTS name TEXT;

-- Add image column for OAuth profile pictures
ALTER TABLE users ADD COLUMN IF NOT EXISTS image TEXT;

-- Add email_verified column for NextAuth
ALTER TABLE users ADD COLUMN IF NOT EXISTS email_verified TIMESTAMP;

-- Update existing records to populate name from full_name
UPDATE users SET name = full_name WHERE name IS NULL AND full_name IS NOT NULL;

-- Update existing records to populate image from avatar_url
UPDATE users SET image = avatar_url WHERE image IS NULL AND avatar_url IS NOT NULL;

-- Create indexes for the new columns
CREATE INDEX IF NOT EXISTS idx_users_password ON users(password) WHERE password IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_users_name ON users(name);
CREATE INDEX IF NOT EXISTS idx_users_email_verified ON users(email_verified);

-- Create NextAuth-specific tables (optional but recommended)

-- Accounts table for OAuth providers
CREATE TABLE IF NOT EXISTS accounts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  type TEXT NOT NULL,
  provider TEXT NOT NULL,
  provider_account_id TEXT NOT NULL,
  refresh_token TEXT,
  access_token TEXT,
  expires_at INTEGER,
  token_type TEXT,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(provider, provider_account_id)
);

-- Sessions table (if using database sessions)
CREATE TABLE IF NOT EXISTS sessions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  session_token TEXT UNIQUE NOT NULL,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  expires TIMESTAMP NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

-- Verification tokens table
CREATE TABLE IF NOT EXISTS verification_tokens (
  identifier TEXT NOT NULL,
  token TEXT UNIQUE NOT NULL,
  expires TIMESTAMP NOT NULL,
  PRIMARY KEY (identifier, token)
);

-- Add indexes for NextAuth tables
CREATE INDEX IF NOT EXISTS idx_accounts_user_id ON accounts(user_id);
CREATE INDEX IF NOT EXISTS idx_accounts_provider ON accounts(provider, provider_account_id);
CREATE INDEX IF NOT EXISTS idx_sessions_user_id ON sessions(user_id);
CREATE INDEX IF NOT EXISTS idx_sessions_token ON sessions(session_token);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_identifier ON verification_tokens(identifier);
CREATE INDEX IF NOT EXISTS idx_verification_tokens_token ON verification_tokens(token);

-- Enable RLS on new tables
ALTER TABLE accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE verification_tokens ENABLE ROW LEVEL SECURITY;

-- RLS policies for NextAuth tables
CREATE POLICY "Users can view their own accounts" ON accounts
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role can manage accounts" ON accounts
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Users can view their own sessions" ON sessions
    FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "Service role can manage sessions" ON sessions
    FOR ALL USING (auth.role() = 'service_role');

CREATE POLICY "Service role can manage verification tokens" ON verification_tokens
    FOR ALL USING (auth.role() = 'service_role');

-- Grant permissions for NextAuth tables
GRANT SELECT ON accounts TO authenticated;
GRANT SELECT ON sessions TO authenticated;
GRANT ALL ON accounts TO service_role;
GRANT ALL ON sessions TO service_role;
GRANT ALL ON verification_tokens TO service_role;

COMMIT;

-- =============================================================================
-- MIGRATION COMPLETE
-- =============================================================================
-- The users table now supports:
-- - password: For credentials authentication (nullable for OAuth users)
-- - name: User display name (synced with full_name)
-- - image: Profile picture URL (synced with avatar_url)
-- - email_verified: Email verification timestamp for NextAuth
--
-- Additional NextAuth tables created:
-- - accounts: OAuth provider account linking
-- - sessions: Database session storage (optional)
-- - verification_tokens: Email verification tokens
-- =============================================================================