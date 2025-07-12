
import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';

// ============================================================================
// Vendor Schema Verification Script
// ============================================================================
// This script connects to the database and introspects the 'vendors' table
// to get the definitive list of column names. This is the source of truth
// for building the final insertion script.
// ============================================================================

dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌ Missing Supabase environment variables in .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

async function verifyVendorSchema() {
  console.log("🚀 Introspecting 'vendors' table schema from the database...");

  try {
    // Use a query that will fail but return schema information in the error.
    // This is a reliable way to get column names from Supabase without relying on information_schema.
    const { data, error } = await supabase
      .from('vendors')
      .select('non_existent_column')
      .limit(1);

    if (error && error.message.includes('column "non_existent_column" does not exist')) {
      // Extract the column names from the hint in the error message.
      const hint = error.hint;
      const match = hint.match(/Perhaps you meant to reference one of the following columns: (.*)\./);
      if (match && match[1]) {
        const columns = match[1].split(', ').map(c => c.replace(/"/g, '').replace('public.vendors.', ''));
        console.log('✅ Successfully retrieved vendor schema.');
        console.log('============================================================');
        console.log('DEFINITIVE VENDORS TABLE COLUMNS:');
        console.log(columns.join(', '));
        console.log('============================================================');
        console.log('I will now use THIS EXACT list to build the final insert script.');
      } else {
        throw new Error('Could not parse column names from the error hint.');
      }
    } else if (error) {
      throw error;
    } else {
        console.log('Could not trigger the expected error. Attempting another method.');
        const { data: columns, error: columnsError } = await supabase
            .rpc('get_table_columns', { p_table_name: 'vendors' });

        if(columnsError) throw columnsError;
        console.log(columns);
    }


  } catch (error) {
    console.error('❌ An unexpected error occurred during schema verification:', error);
    process.exit(1);
  }
}

verifyVendorSchema();
