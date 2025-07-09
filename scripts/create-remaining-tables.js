// ⚠️  DEPRECATED: This script is DEPRECATED and should NOT be used.
// Use scripts/database-setup.sql instead for all table creation.
// This file is kept for reference only.

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createRemainingTables() {
  try {
    console.log('🔧 Creating remaining database tables...');
    
    // Create favorites table
    console.log('📝 Creating favorites table...');
    const favoritesSQL = `
      CREATE TABLE IF NOT EXISTS favorites (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        vendor_id UUID NOT NULL REFERENCES vendors(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id, vendor_id)
      );
    `;
    
    const { error: favoritesError } = await supabase.rpc('exec', { sql: favoritesSQL });
    if (favoritesError) {
      console.log('⚠️  Favorites table creation may have failed:', favoritesError.message);
    }
    
    // Create admin_users table
    console.log('📝 Creating admin_users table...');
    const adminUsersSQL = `
      CREATE TABLE IF NOT EXISTS admin_users (
        id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
        UNIQUE(user_id)
      );
    `;
    
    const { error: adminError } = await supabase.rpc('exec', { sql: adminUsersSQL });
    if (adminError) {
      console.log('⚠️  Admin users table creation may have failed:', adminError.message);
    }
    
    // Create indexes
    console.log('📝 Creating indexes...');
    const indexSQL = `
      CREATE INDEX IF NOT EXISTS idx_favorites_user_id ON favorites(user_id);
      CREATE INDEX IF NOT EXISTS idx_favorites_vendor_id ON favorites(vendor_id);
    `;
    
    const { error: indexError } = await supabase.rpc('exec', { sql: indexSQL });
    if (indexError) {
      console.log('⚠️  Index creation may have failed:', indexError.message);
    }
    
    console.log('✅ Table creation completed!');
    
    // Verify the tables were created
    console.log('\n🔍 Verifying created tables...');
    
    const tablesToCheck = ['favorites', 'admin_users'];
    
    for (const tableName of tablesToCheck) {
      try {
        const { data, error } = await supabase
          .from(tableName)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ Table ${tableName}: ${error.message}`);
        } else {
          console.log(`✅ Table ${tableName}: Created successfully`);
        }
      } catch (err) {
        console.log(`❌ Table ${tableName}: Error checking - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('❌ Error creating tables:', error.message);
    process.exit(1);
  }
}

createRemainingTables();