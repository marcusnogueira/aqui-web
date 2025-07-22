const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing Supabase credentials');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function refreshSchema() {
  try {
    console.log('Refreshing PostgREST schema cache...');
    
    // Test the foreign key relationship
    const { data, error } = await supabase
      .from('vendors')
      .select(`
        id,
        business_name,
        vendor_live_sessions(
          id,
          start_time,
          is_active
        )
      `)
      .limit(1);
    
    if (error) {
      console.error('Error testing relationship:', error);
      
      // Try to refresh schema cache by making a request to PostgREST
      const response = await fetch(`${supabaseUrl}/rest/v1/`, {
        method: 'OPTIONS',
        headers: {
          'apikey': supabaseServiceKey,
          'Authorization': `Bearer ${supabaseServiceKey}`
        }
      });
      
      console.log('Schema refresh response status:', response.status);
      
      // Try the query again
      const { data: retryData, error: retryError } = await supabase
        .from('vendors')
        .select(`
          id,
          business_name,
          vendor_live_sessions(
            id,
            start_time,
            is_active
          )
        `)
        .limit(1);
        
      if (retryError) {
        console.error('Still getting error after refresh:', retryError);
      } else {
        console.log('Relationship working after refresh!');
        console.log('Sample data:', retryData);
      }
    } else {
      console.log('Foreign key relationship is working!');
      console.log('Sample data:', data);
    }
    
  } catch (err) {
    console.error('Unexpected error:', err);
  }
}

refreshSchema();