#!/usr/bin/env node

/**
 * Script to create an admin user by updating the is_admin field in users table
 * Run with: node scripts/create-admin-user.js <email>
 */

const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

// Initialize Supabase client with service role key for admin operations
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

async function createAdminUser() {
  try {
    const email = process.argv[2];
    
    if (!email) {
      console.log('Please provide an email address');
      console.log('Usage: node scripts/create-admin-user.js <email>');
      console.log('Example: node scripts/create-admin-user.js admin@example.com');
      return;
    }
    
    console.log(`Creating admin user for email: ${email}`);
    
    let userId = null;
    
    // First, check if user exists
    console.log('Checking if user exists...');
    const { data: existingUsers, error: checkError } = await supabase.auth.admin.listUsers();
    
    if (checkError) {
      console.error('Error checking users:', checkError);
      return;
    }
    
    const existingUser = existingUsers.users.find(user => user.email === email);
    
    if (!existingUser) {
      console.log('User not found. Creating new user...');
      
      // Create new auth user
      const { data: newAuthUser, error: createAuthError } = await supabase.auth.admin.createUser({
        email: email,
        password: 'TempPassword123!', // User should change this
        email_confirm: true
      });
      
      if (createAuthError) {
        console.error('Error creating auth user:', createAuthError);
        return;
      }
      
      console.log('Auth user created:', newAuthUser.user.id);
      
      // Create user record in users table
      const { data: newUser, error: createUserError } = await supabase
        .from('users')
        .insert({
          id: newAuthUser.user.id,
          full_name: 'Admin User',
          is_admin: true,
          is_vendor: false,
          active_role: 'customer'
        })
        .select()
        .single();
      
      if (createUserError) {
        console.error('Error creating user record:', createUserError);
        return;
      }
      
      userId = newAuthUser.user.id;
      console.log('Admin user created successfully!');
      console.log('Email:', email);
      console.log('Temporary Password: TempPassword123!');
      console.log('Please ask the user to change their password after first login');
      
    } else {
      console.log('User found. Updating admin status...');
      
      // Update existing user to be admin
      const { data: updatedUser, error: updateError } = await supabase
        .from('users')
        .update({ is_admin: true })
        .eq('id', existingUser.id)
        .select()
        .single();
      
      if (updateError) {
        console.error('Error updating user:', updateError);
        return;
      }
      
      userId = existingUser.id;
      console.log('User updated to admin successfully!');
      console.log('Email:', email);
      console.log('User ID:', existingUser.id);
    }
    
    // Verify admin status
    console.log('Verifying admin status...');
    const { data: adminUser, error: verifyError } = await supabase
      .from('users')
      .select('id, full_name, is_admin')
      .eq('id', userId)
      .single();
    
    if (verifyError) {
      console.error('Error verifying admin:', verifyError);
    } else {
      console.log('Admin verification:', adminUser);
    }
    
  } catch (error) {
    console.error('Error:', error);
  }
}

createAdminUser();