import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// ============================================================================
// Single Test Vendor Insertion Script
// ============================================================================
// This script inserts a single, schema-verified vendor to confirm the process.
// ============================================================================

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const vendorToCreate = {
  name: 'La Taqueria',
  address: '2889 Mission St, San Francisco, CA 94110',
  lat: 37.7598,
  lng: -122.4188,
  type: 'Food & Beverage',
  subcategory: 'Mexican',
  city: 'San Francisco',
  state: 'CA',
  zip_code: '94110',
  country: 'USA'
};

async function createSingleTestVendor() {
  console.log('Starting single test vendor creation...');

  const email = `test.${vendorToCreate.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
  const password = 'TestPassword123!';

  try {
    // 1. Create a unique user for the vendor
    console.log(`Creating user: ${email}`);
    const { data: authUser, error: userError } = await supabase.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
    });

    if (userError || !authUser?.user?.id) {
      console.error(`Failed to create user ${email}:`, userError?.message);
      process.exit(1);
    }
    console.log(`Created user with ID: ${authUser.user.id}`);

    // 2. Prepare the vendor data object, strictly adhering to the schema
    const vendorData = {
      user_id: authUser.user.id,
      business_name: `TEST ${vendorToCreate.name}`,
      description: `A test vendor for ${vendorToCreate.name}, located in ${vendorToCreate.address}.`,
      address: vendorToCreate.address,
      latitude: vendorToCreate.lat,
      longitude: vendorToCreate.lng,
      business_type: vendorToCreate.type,
      subcategory: vendorToCreate.subcategory,
      status: 'approved',
      is_approved: true,
      approved_at: new Date().toISOString(),
      phone: '555-123-4567',
      contact_email: email,
      city: vendorToCreate.city,
      state: vendorToCreate.state,
      zip_code: vendorToCreate.zip_code,
      country: vendorToCreate.country,
      tags: [vendorToCreate.subcategory, vendorToCreate.type],
      website: `https://www.example.com/${vendorToCreate.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
      average_rating: 4.5,
      total_reviews: 100,
    };
    
    console.log('Inserting the following vendor data:');
    console.log(JSON.stringify(vendorData, null, 2));

    // 3. Insert the vendor
    const { error: vendorError } = await supabase.from('vendors').insert(vendorData);

    if (vendorError) {
      console.error(`Failed to create vendor for ${vendorToCreate.name}:`, vendorError.message);
      // Roll back the created user
      await supabase.auth.admin.deleteUser(authUser.user.id);
      console.log(`Rolled back user: ${email}`);
      process.exit(1);
    }

    console.log(`Successfully inserted vendor: TEST ${vendorToCreate.name}`);
    console.log('Verification successful! The script can now be scaled.');

  } catch (error) {
    console.error(`An unexpected error occurred:`, error);
    process.exit(1);
  }
}

createSingleTestVendor()
  .then(() => {
    console.log('Script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('Script failed with a fatal error:', error);
    process.exit(1);
  });