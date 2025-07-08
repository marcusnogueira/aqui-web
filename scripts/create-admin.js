#!/usr/bin/env node

/**
 * Script to create admin users for the separate admin authentication system
 * Run with: node scripts/create-admin.js <username> <email> <password>
 */

const { createClient } = require('@supabase/supabase-js');
const bcrypt = require('bcryptjs');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdmin() {
  try {
    const username = process.argv[2];
    const email = process.argv[3];
    const password = process.argv[4];
    
    if (!username || !email || !password) {
      console.log('❌ Please provide all required arguments');
      console.log('Usage: node scripts/create-admin.js <username> <email> <password>');
      console.log('Example: node scripts/create-admin.js admin admin@aqui.com securepassword123');
      return;
    }
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      console.log('❌ Please provide a valid email address');
      return;
    }
    
    // Validate password strength
    if (password.length < 8) {
      console.log('❌ Password must be at least 8 characters long');
      return;
    }
    
    console.log(`🔧 Creating admin user: ${username} (${email})`);
    
    // Hash the password
    console.log('🔐 Hashing password...');
    const saltRounds = 12;
    const passwordHash = await bcrypt.hash(password, saltRounds);
    
    // Check if admin already exists
    console.log('🔍 Checking if admin already exists...');
    const { data: existingAdmin, error: checkError } = await supabase
      .from('admin_users')
      .select('id, username, email')
      .or(`username.eq.${username},email.eq.${email}`);
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.log('❌ Error checking existing admin:', checkError.message);
      return;
    }
    
    if (existingAdmin && existingAdmin.length > 0) {
      console.log('❌ Admin user already exists with that username or email');
      console.log('Existing admin:', existingAdmin[0]);
      return;
    }
    
    // Create the admin user
    console.log('👤 Creating admin user...');
    const { data: newAdmin, error: createError } = await supabase
      .from('admin_users')
      .insert({
        username,
        email,
        password_hash: passwordHash
      })
      .select('id, username, email, created_at')
      .single();
    
    if (createError) {
      console.log('❌ Error creating admin user:', createError.message);
      
      if (createError.code === 'PGRST116') {
        console.log('\n⚠️ The admin_users table may not exist yet.');
        console.log('Please run the SQL schema first:');
        console.log('1. Open your Supabase SQL editor');
        console.log('2. Execute the contents of scripts/admin-auth-schema.sql');
        console.log('3. Then run this script again');
      }
      return;
    }
    
    console.log('✅ Admin user created successfully!');
    console.log('📋 Admin details:');
    console.log(`   ID: ${newAdmin.id}`);
    console.log(`   Username: ${newAdmin.username}`);
    console.log(`   Email: ${newAdmin.email}`);
    console.log(`   Created: ${newAdmin.created_at}`);
    
    console.log('\n🔐 Admin credentials:');
    console.log(`   Username: ${username}`);
    console.log(`   Password: ${password}`);
    console.log('\n⚠️ Please store these credentials securely and delete this output!');
    
  } catch (error) {
    console.error('❌ Error creating admin:', error);
  }
}

createAdmin();