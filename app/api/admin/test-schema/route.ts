import { NextRequest, NextResponse } from 'next/server'
import { setServiceRoleContext, clearUserContext } from '@/lib/nextauth-context'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server';
import { verifyAdminTokenServer } from '@/lib/admin-auth-server';

// Development-only route for testing admin API schema compatibility
// This helps detect schema drift when database changes are made

// Force Node.js runtime to support crypto module
export const runtime = 'nodejs'
// Force dynamic rendering since we use authentication cookies
export const dynamic = 'force-dynamic'



export async function POST(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 404 }
    );
  }

  const supabase = createSupabaseServerClient(await cookies())

  try {
    // Check admin authentication
    const adminUser = await verifyAdminTokenServer(request);
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    // Set service role context for RLS policies
    await setServiceRoleContext(supabase);
    const { table, operation, data } = await request.json();

    if (!table || !operation) {
      return NextResponse.json(
        { error: 'Missing required fields: table, operation' },
        { status: 400 }
      );
    }

    let result;
    
    switch (operation) {
      case 'test_insert':
        // Test insert operation without actually inserting
        result = await supabase
          .from(table)
          .insert(data)
          .select()
          .limit(0); // Limit 0 to validate schema without inserting
        break;
        
      case 'test_update':
        // Test update operation without actually updating
        result = await supabase
          .from(table)
          .update(data)
          .eq('id', 'test-id-that-does-not-exist')
          .select()
          .limit(0);
        break;
        
      case 'test_select':
        // Test select operation with specific fields
        const fields = data?.fields || '*';
        result = await supabase
          .from(table)
          .select(fields)
          .limit(1);
        break;
        
      default:
        return NextResponse.json(
          { error: 'Invalid operation. Use: test_insert, test_update, test_select' },
          { status: 400 }
        );
    }

    return NextResponse.json({
      success: true,
      table,
      operation,
      schema_valid: !result.error,
      error: result.error?.message || null,
      details: result.error?.details || null,
      hint: result.error?.hint || null
    });

  } catch (error) {
    console.error('Schema test error:', error);
    return NextResponse.json(
      { 
        success: false,
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  } finally {
    // Always clear user context when done
    await clearUserContext(supabase)
  }
}

// Example usage:
// POST /api/admin/test-schema
// {
//   "table": "vendors",
//   "operation": "test_update",
//   "data": {
//     "admin_notes": "Test note",
//     "is_approved": true
//   }
// }