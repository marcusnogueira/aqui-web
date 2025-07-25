import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { USER_ROLES } from '@/lib/constants'

export async function POST(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    // Check if user has vendor role
    if (session.user.active_role !== USER_ROLES.VENDOR) {
      return NextResponse.json({ error: 'Not authorized. Vendor role required.' }, { status: 403 })
    }

    // Get request body
    const { message, vendorId } = await request.json()

    if (!message || !vendorId) {
      return NextResponse.json({ error: 'Message and vendorId are required' }, { status: 400 })
    }

    // Create Supabase client with service role to bypass RLS for this operation
    const { createClient } = await import('@supabase/supabase-js')
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      {
        auth: {
          autoRefreshToken: false,
          persistSession: false
        }
      }
    )

    // Verify that the vendor belongs to the authenticated user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id')
      .eq('id', vendorId)
      .eq('user_id', session.user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ 
        error: 'Vendor not found or not owned by the authenticated user' 
      }, { status: 404 })
    }

    // Insert the announcement
    const { data: announcement, error: insertError } = await supabase
      .from('vendor_announcements')
      .insert({
        vendor_id: vendorId,
        message: message
      })
      .select()
      .single()

    if (insertError) {
      console.error('Error inserting announcement:', insertError)
      return NextResponse.json({ 
        error: 'Failed to create announcement', 
        details: insertError.message 
      }, { status: 500 })
    }

    return NextResponse.json({ 
      success: true,
      announcement,
      message: 'Announcement created successfully!'
    })

  } catch (error) {
    console.error('Announcement API error:', error)
    return NextResponse.json(
      { error: `Failed to create announcement: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  try {
    // Get vendor ID from query params
    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')

    if (!vendorId) {
      return NextResponse.json({ error: 'Vendor ID is required' }, { status: 400 })
    }

    // Create Supabase client
    const supabase = createSupabaseServerClient(await cookies())

    // Fetch announcements for the vendor
    const { data: announcements, error } = await supabase
      .from('vendor_announcements')
      .select('*')
      .eq('vendor_id', vendorId)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Error fetching announcements:', error)
      return NextResponse.json({ 
        error: 'Failed to fetch announcements', 
        details: error.message 
      }, { status: 500 })
    }

    return NextResponse.json({ announcements })

  } catch (error) {
    console.error('Announcement API error:', error)
    return NextResponse.json(
      { error: 'Failed to fetch announcements' },
      { status: 500 }
    )
  }
}