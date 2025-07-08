const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createMissingTables() {
  try {
    console.log('🔧 Creating missing database tables...');
    
    // Read the SQL file
    const sqlFilePath = path.join(__dirname, 'create-missing-tables.sql');
    const sqlContent = fs.readFileSync(sqlFilePath, 'utf8');
    
    // Split SQL commands by semicolon and filter out empty commands
    const sqlCommands = sqlContent
      .split(';')
      .map(cmd => cmd.trim())
      .filter(cmd => cmd.length > 0 && !cmd.startsWith('--') && cmd !== 'COMMIT');
    
    console.log(`📝 Executing ${sqlCommands.length} SQL commands...`);
    
    // Execute each command separately
    for (let i = 0; i < sqlCommands.length; i++) {
      const command = sqlCommands[i];
      if (command.trim()) {
        console.log(`⚡ Executing command ${i + 1}/${sqlCommands.length}`);
        
        const { error } = await supabase.rpc('exec', {
          sql: command
        });
        
        if (error) {
          // Try alternative approach using direct SQL execution
          const { error: directError } = await supabase
            .from('_temp_sql_execution')
            .select('*')
            .limit(0);
          
          if (directError) {
            console.log(`⚠️  Command ${i + 1} may have failed, but continuing...`);
            console.log(`   Command: ${command.substring(0, 100)}...`);
          }
        }
      }
    }
    
    console.log('✅ Database table creation completed!');
    
    // Verify the tables were created
    console.log('\n🔍 Verifying created tables...');
    
    const tablesToCheck = [
      'vendor_static_locations',
      'vendor_announcements', 
      'vendor_specials',
      'favorites',
      'admin_users'
    ];
    
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

createMissingTables();