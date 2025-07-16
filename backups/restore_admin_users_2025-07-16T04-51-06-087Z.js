#!/usr/bin/env node

/**
 * Admin Users Restoration Script
 * Generated on: 2025-07-16T04:51:06.088Z
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

const adminUsersToRestore = [
  {
    "id": "c05f2be2-2862-46af-a09c-79cb18f98314",
    "username": "mrn",
    "email": "mrn@get-aqui.com",
    "password_hash": "$2b$12$o0xwkfA5v6heOvj7Jyz3jOz6RG.bknmn6WG0Ny.t6w1Rz4n/J5tCO",
    "created_at": "2025-07-07T22:05:48+00:00",
    "updated_at": "2025-07-07T22:05:59.857308+00:00"
  },
  {
    "id": "280a264f-0ae8-460b-91c4-75ee69324cb9",
    "username": "testadmin",
    "email": "admin@test.com",
    "password_hash": "$2b$12$G88q700ZssaGfgfBSvkdlefsaQZqjtobjpTLl66jNN6Yo0K5WpA7e",
    "created_at": "2025-07-07T23:18:09.286974+00:00",
    "updated_at": "2025-07-07T23:18:09.286974+00:00"
  },
  {
    "id": "6f2fd6f5-c2d1-4c1a-982a-20a05de5fb6a",
    "username": "jmsf",
    "email": "jacob.martin@get-aqui.com",
    "password_hash": "$2b$10$kx0an.Eh.V9RZu2jsz2KLOigWmW7CSuCEGF43vNvdF8jtwT8QeXXG\n",
    "created_at": "2025-07-08T05:07:26+00:00",
    "updated_at": "2025-07-08T05:07:28+00:00"
  }
];

async function restoreAdminUsers() {
  console.log('🔄 RESTORING ADMIN USERS...');
  console.log(`📋 Restoring ${adminUsersToRestore.length} admin users`);

  for (const admin of adminUsersToRestore) {
    try {
      // Check if admin already exists
      const { data: existing } = await supabase
        .from('admin_users')
        .select('id')
        .eq('username', admin.username)
        .single();

      if (existing) {
        console.log(`⚠️  Admin ${admin.username} already exists, skipping`);
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
        console.error(`❌ Failed to restore ${admin.username}: ${error.message}`);
      } else {
        console.log(`✅ Restored admin: ${admin.username}`);
      }
    } catch (error) {
      console.error(`💥 Error restoring ${admin.username}: ${error.message}`);
    }
  }

  console.log('\n🎉 Admin users restoration complete!');
}

restoreAdminUsers().catch(console.error);
