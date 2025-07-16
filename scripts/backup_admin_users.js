#!/usr/bin/env node

/**
 * Admin Users Backup Script
 * 
 * This script backs up admin users before migration and creates
 * a restoration script for the new NextAuth system.
 */

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function backupAdminUsers() {
  console.log('💾 BACKING UP ADMIN USERS...\n');

  try {
    // 1. Fetch all admin users
    const { data: adminUsers, error } = await supabase
      .from('admin_users')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      throw new Error(`Failed to fetch admin users: ${error.message}`);
    }

    if (!adminUsers || adminUsers.length === 0) {
      console.log('⚠️  No admin users found to backup');
      return;
    }

    console.log(`📋 Found ${adminUsers.length} admin users to backup:`);
    adminUsers.forEach((admin, index) => {
      console.log(`   ${index + 1}. ${admin.username} (${admin.email})`);
    });

    // 2. Create backup directory
    const backupDir = path.join(__dirname, '..', 'backups');
    if (!fs.existsSync(backupDir)) {
      fs.mkdirSync(backupDir, { recursive: true });
    }

    // 3. Create backup file
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
    const backupFile = path.join(backupDir, `admin_users_backup_${timestamp}.json`);
    
    const backupData = {
      timestamp: new Date().toISOString(),
      count: adminUsers.length,
      users: adminUsers.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        password_hash: user.password_hash, // Keep for restoration
        created_at: user.created_at,
        updated_at: user.updated_at
      }))
    };

    fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2));
    console.log(`\n✅ Backup saved to: ${backupFile}`);

    // 4. Create restoration script
    const restoreScript = `#!/usr/bin/env node

/**
 * Admin Users Restoration Script
 * Generated on: ${new Date().toISOString()}
 * 
 * This script restores admin users after NextAuth migration.
 * Run this AFTER completing the database schema migration.
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const adminUsersToRestore = ${JSON.stringify(backupData.users, null, 2)};

async function restoreAdminUsers() {
  console.log('🔄 RESTORING ADMIN USERS...');
  console.log(\`📋 Restoring \${adminUsersToRestore.length} admin users\`);

  for (const admin of adminUsersToRestore) {
    try {
      // Check if admin already exists
      const { data: existing } = await supabase
        .from('admin_users')
        .select('id')
        .eq('username', admin.username)
        .single();

      if (existing) {
        console.log(\`⚠️  Admin \${admin.username} already exists, skipping\`);
        continue;
      }

      // Insert admin user
      const { error } = await supabase
        .from('admin_users')
        .insert({
          id: admin.id,
          username: admin.username,
          email: admin.email,
          password_hash: admin.password_hash,
          created_at: admin.created_at,
          updated_at: admin.updated_at
        });

      if (error) {
        console.error(\`❌ Failed to restore \${admin.username}: \${error.message}\`);
      } else {
        console.log(\`✅ Restored admin: \${admin.username}\`);
      }
    } catch (error) {
      console.error(\`💥 Error restoring \${admin.username}: \${error.message}\`);
    }
  }

  console.log('\\n🎉 Admin users restoration complete!');
}

restoreAdminUsers().catch(console.error);
`;

    const restoreFile = path.join(backupDir, `restore_admin_users_${timestamp}.js`);
    fs.writeFileSync(restoreFile, restoreScript);
    fs.chmodSync(restoreFile, '755'); // Make executable
    console.log(`✅ Restoration script created: ${restoreFile}`);

    // 5. Create summary
    console.log('\n📊 BACKUP SUMMARY:');
    console.log('='.repeat(40));
    console.log(`Admin Users Backed Up: ${adminUsers.length}`);
    console.log(`Backup File: ${path.basename(backupFile)}`);
    console.log(`Restore Script: ${path.basename(restoreFile)}`);
    
    console.log('\n🔄 NEXT STEPS:');
    console.log('1. Verify backup file contains correct data');
    console.log('2. Test restoration script in development');
    console.log('3. Proceed with database schema migration');
    console.log(`4. After migration, run: node ${restoreFile}`);

    return {
      backupFile,
      restoreFile,
      adminCount: adminUsers.length
    };

  } catch (error) {
    console.error('💥 Backup failed:', error.message);
    throw error;
  }
}

// Run backup
backupAdminUsers()
  .then(result => {
    console.log('\\n🎉 Admin users backup complete!');
    process.exit(0);
  })
  .catch(error => {
    console.error('💥 Backup process failed:', error);
    process.exit(1);
  });