import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

const vendorsToCreate = [
  // San Francisco, CA (10)
  { name: 'La Taqueria', address: '2889 Mission St, San Francisco, CA 94110', lat: 37.7598, lng: -122.4188, type: 'Food & Beverage', subcategory: 'Mexican', city: 'San Francisco', zip_code: '94110' },
  { name: 'Zuni Café', address: '1658 Market St, San Francisco, CA 94102', lat: 37.7749, lng: -122.4213, type: 'Food & Beverage', subcategory: 'Californian', city: 'San Francisco', zip_code: '94102' },
  { name: 'Tartine Bakery', address: '600 Guerrero St, San Francisco, CA 94110', lat: 37.7614, lng: -122.4241, type: 'Food & Beverage', subcategory: 'Bakery', city: 'San Francisco', zip_code: '94110' },
  { name: 'Foreign Cinema', address: '2534 Mission St, San Francisco, CA 94110', lat: 37.7571, lng: -122.4189, type: 'Food & Beverage', subcategory: 'Mediterranean', city: 'San Francisco', zip_code: '94110' },
  { name: 'House of Prime Rib', address: '1906 Van Ness Ave, San Francisco, CA 94109', lat: 37.7925, lng: -122.4219, type: 'Food & Beverage', subcategory: 'Steakhouse', city: 'San Francisco', zip_code: '94109' },
  { name: 'The Slanted Door', address: '1 Ferry Building #32, San Francisco, CA 94111', lat: 37.7956, lng: -122.3935, type: 'Food & Beverage', subcategory: 'Vietnamese', city: 'San Francisco', zip_code: '94111' },
  { name: 'Bi-Rite Creamery', address: '3692 18th St, San Francisco, CA 94110', lat: 37.7616, lng: -122.4274, type: 'Food & Beverage', subcategory: 'Ice Cream', city: 'San Francisco', zip_code: '94110' },
  { name: 'Swan Oyster Depot', address: '1517 Polk St, San Francisco, CA 94109', lat: 37.7903, lng: -122.4218, type: 'Food & Beverage', subcategory: 'Seafood', city: 'San Francisco', zip_code: '94109' },
  { name: 'Nopa', address: '560 Divisadero St, San Francisco, CA 94117', lat: 37.7748, lng: -122.4375, type: 'Food & Beverage', subcategory: 'American', city: 'San Francisco', zip_code: '94117' },
  { name: 'Gary Danko', address: '800 North Point St, San Francisco, CA 94109', lat: 37.8058, lng: -122.4218, type: 'Food & Beverage', subcategory: 'Fine Dining', city: 'San Francisco', zip_code: '94109' },

  // San Jose, CA (3)
  { name: 'The Grandview Restaurant', address: '15005 Mount Hamilton Rd, San Jose, CA 95140', lat: 37.3414, lng: -121.646, type: 'Food & Beverage', subcategory: 'American', city: 'San Jose', zip_code: '95140' },
  { name: 'Falafel\'s Drive-In', address: '2301 Stevens Creek Blvd, San Jose, CA 95128', lat: 37.3233, lng: -121.92, type: 'Food & Beverage', subcategory: 'Middle Eastern', city: 'San Jose', zip_code: '95128' },
  { name: 'Original Joe\'s', address: '301 S 1st St, San Jose, CA 95113', lat: 37.331, lng: -121.886, type: 'Food & Beverage', subcategory: 'Italian', city: 'San Jose', zip_code: '95113' },

  // San Bruno, CA (2)
  { name: 'Gintei', address: '235 El Camino Real, San Bruno, CA 94066', lat: 37.6305, lng: -122.4111, type: 'Food & Beverage', subcategory: 'Japanese', city: 'San Bruno', zip_code: '94066' },
  { name: 'Mazra', address: '504 San Bruno Ave W, San Bruno, CA 94066', lat: 37.628, lng: -122.413, type: 'Food & Beverage', subcategory: 'Mediterranean', city: 'San Bruno', zip_code: '94066' },

  // Austin, TX (5)
  { name: 'Franklin Barbecue', address: '900 E 11th St, Austin, TX 78702', lat: 30.269, lng: -97.731, type: 'Food & Beverage', subcategory: 'BBQ', city: 'Austin', zip_code: '78702' },
  { name: 'Uchi', address: '801 S Lamar Blvd, Austin, TX 78704', lat: 30.257, lng: -97.75, type: 'Food & Beverage', subcategory: 'Japanese', city: 'Austin', zip_code: '78704' },
  { name: 'La Barbecue', address: '2401 E Cesar Chavez St, Austin, TX 78702', lat: 30.255, lng: -97.718, type: 'Food & Beverage', subcategory: 'BBQ', city: 'Austin', zip_code: '78702' },
  { name: 'Torchy\'s Tacos', address: '1822 S Congress Ave, Austin, TX 78704', lat: 30.244, lng: -97.75, type: 'Food & Beverage', subcategory: 'Tacos', city: 'Austin', zip_code: '78704' },
  { name: 'Matt\'s El Rancho', address: '2613 S Lamar Blvd, Austin, TX 78704', lat: 30.24, lng: -97.768, type: 'Food & Beverage', subcategory: 'Tex-Mex', city: 'Austin', zip_code: '78704' },

  // Lima, Peru (10)
  { name: 'Central Restaurante', address: 'Av. Pedro de Osma 301, Barranco, Lima', lat: -12.147, lng: -77.022, type: 'Food & Beverage', subcategory: 'Peruvian', city: 'Lima', zip_code: '15063' },
  { name: 'Maido', address: 'Calle San Martin 399, Miraflores, Lima', lat: -12.121, lng: -77.033, type: 'Food & Beverage', subcategory: 'Nikkei', city: 'Lima', zip_code: '15074' },
  { name: 'Astrid y Gastón', address: 'Av. Paz Soldan 290, San Isidro, Lima', lat: -12.101, lng: -77.04, type: 'Food & Beverage', subcategory: 'Peruvian', city: 'Lima', zip_code: '15073' },
  { name: 'La Mar Cebichería', address: 'Av. Mariscal La Mar 770, Miraflores, Lima', lat: -12.113, lng: -77.044, type: 'Food & Beverage', subcategory: 'Ceviche', city: 'Lima', zip_code: '15074' },
  { name: 'Isolina, Taberna Peruana', address: 'Av. San Martin 101, Barranco, Lima', lat: -12.148, lng: -77.021, type: 'Food & Beverage', subcategory: 'Tavern', city: 'Lima', zip_code: '15063' },
  { name: 'El Mercado', address: 'Hipólito Unanue 203, Miraflores, Lima', lat: -12.118, lng: -77.04, type: 'Food & Beverage', subcategory: 'Seafood', city: 'Lima', zip_code: '15074' },
  { name: 'Panchita', address: 'Calle 2 de Mayo 298, Miraflores, Lima', lat: -12.12, lng: -77.03, type: 'Food & Beverage', subcategory: 'Criollo', city: 'Lima', zip_code: '15074' },
  { name: 'Kjolle', address: 'Av. Pedro de Osma 301, Barranco, Lima', lat: -12.147, lng: -77.022, type: 'Food & Beverage', subcategory: 'Peruvian', city: 'Lima', zip_code: '15063' },
  { name: 'Rafael', address: 'Calle San Martin 300, Miraflores, Lima', lat: -12.121, lng: -77.033, type: 'Food & Beverage', subcategory: 'Fusion', city: 'Lima', zip_code: '15074' },
  { name: 'Amaz', address: 'Av. la Paz 1079, Miraflores, Lima', lat: -12.126, lng: -77.03, type: 'Food & Beverage', subcategory: 'Amazonian', city: 'Lima', zip_code: '15074' }
];

async function createTestVendors() {
  console.log('🚀 Starting test vendor creation...');
  console.log(`📊 Creating ${vendorsToCreate.length} vendors.`);

  let successCount = 0;
  let errorCount = 0;

  for (const vendor of vendorsToCreate) {
    const email = `test.${vendor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}@example.com`;
    const password = 'TestPassword123!';

    try {
      // 1. Create a unique user for the vendor
      const { data: authUser, error: userError } = await supabase.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
      });

      if (userError || !authUser?.user?.id) {
        console.error(`❌ Failed to create user ${email}:`, userError?.message);
        errorCount++;
        continue;
      }
      console.log(`✅ Created user: ${email}`);

      // 2. Insert the vendor linked to the new user
      const { error: vendorError } = await supabase.from('vendors').insert({
        user_id: authUser.user.id,
        business_name: `TEST ${vendor.name}`,
        description: `A test vendor for ${vendor.name}, located in ${vendor.address}.`,
        address: vendor.address,
        latitude: vendor.lat,
        longitude: vendor.lng,
        business_type: vendor.type,
        subcategory: vendor.subcategory,
        status: 'approved',
        approved_at: new Date().toISOString(),
        phone: '555-123-4567',
        contact_email: email,
        city: vendor.city,
        zip_code: vendor.zip_code,
        tags: [vendor.subcategory, vendor.type],
        website: `https://www.example.com/${vendor.name.toLowerCase().replace(/[^a-z0-9]/g, '')}`,
        average_rating: 4.5,
        total_reviews: 100,
      });

      if (vendorError) {
        console.error(`❌ Failed to create vendor for ${vendor.name}:`, vendorError.message);
        errorCount++;
        // Optional: Delete the created user if vendor insertion fails
        await supabase.auth.admin.deleteUser(authUser.user.id);
        console.log(`🗑️ Rolled back user: ${email}`);
        continue;
      }

      console.log(`✅ Vendor added: TEST ${vendor.name}`);
      successCount++;
    } catch (error) {
      console.error(`❌ Unexpected error for ${vendor.name}:`, error);
      errorCount++;
    }
  }

  console.log('\n📈 Summary:');
  console.log(`✅ Successfully created: ${successCount} vendors`);
  console.log(`❌ Errors: ${errorCount}`);
  console.log('🎉 Test vendor creation completed!');
}

createTestVendors()
  .then(() => {
    console.log('✅ Script finished.');
    process.exit(0);
  })
  .catch((error) => {
    console.error('❌ Script failed with a fatal error:', error);
    process.exit(1);
  });