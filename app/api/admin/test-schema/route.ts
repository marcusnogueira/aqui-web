import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@supabase/supabase-js';
import { isAdminAuthenticatedServer } from '@/lib/admin-auth-server';

// Development-only route for testing admin API schema compatibility
// This helps detect schema drift when database changes are made

// Force Node.js runtime to support crypto module
export const runtime = 'nodejs'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function POST(request: NextRequest) {
  // Only allow in development environment
  if (process.env.NODE_ENV !== 'development') {
    return NextResponse.json(
      { error: 'This endpoint is only available in development' },
      { status: 404 }
    );
  }

  try {
    // Check admin authentication
    if (!isAdminAuthenticatedServer(request)) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }
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