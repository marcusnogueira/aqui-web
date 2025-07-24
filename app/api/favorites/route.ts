import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

// POST: Toggle favorite (add or remove)
export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting favorite toggle...')
    
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      console.error('❌ Authentication failed: No session or user ID')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ Authentication successful:', { userId: session.user.id })

    const { vendor_id } = await request.json()

    console.log('📋 Favorite toggle data:', { vendor_id })

    if (!vendor_id) {
      console.error('❌ Missing vendor_id')
      return NextResponse.json({ error: 'Missing vendor ID' }, { status: 400 })
    }

    // Create Supabase client and set user context for RLS
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Set user context for RLS policies
    await supabase.rpc('set_current_user_context' as any, {
      user_id: session.user.id
    })

    console.log('✅ User context set for RLS')

    // Check if already favorited
    console.log('🔍 Checking existing favorite...')
    const { data: existingFavorite, error: checkError } = await supabase
      .from('favorites')
      .select('id')
      .eq('vendor_id', vendor_id)
      .eq('customer_id', session.user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error checking existing favorite:', checkError)
      return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 })
    }

    let isFavorite = false

    if (existingFavorite) {
      // Remove favorite
      console.log('🗑️ Removing favorite...')
      const { error: deleteError } = await supabase
        .from('favorites')
        .delete()
        .eq('vendor_id', vendor_id)
        .eq('customer_id', session.user.id)

      if (deleteError) {
        console.error('❌ Failed to remove favorite:', deleteError)
        return NextResponse.json({ error: 'Failed to remove favorite' }, { status: 500 })
      }

      console.log('✅ Favorite removed')
      isFavorite = false
    } else {
      // Add favorite
      console.log('❤️ Adding favorite...')
      const { error: insertError } = await supabase
        .from('favorites')
        .insert({
          vendor_id,
          customer_id: session.user.id
        })

      if (insertError) {
        console.error('❌ Failed to add favorite:', insertError)
        return NextResponse.json({ error: 'Failed to add favorite' }, { status: 500 })
      }

      console.log('✅ Favorite added')
      isFavorite = true
    }

    // Clear user context
    await supabase.rpc('clear_current_user_context' as any)

    return NextResponse.json({ 
      success: true,
      isFavorite
    })

  } catch (error) {
    console.error('❌ Favorite toggle error:', error)
    return NextResponse.json(
      { error: `Failed to toggle favorite: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

// GET: Check if vendor is favorited by user
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendor_id = searchParams.get('vendor_id')

    if (!vendor_id) {
      return NextResponse.json({ error: 'Missing vendor_id parameter' }, { status: 400 })
    }

    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ isFavorite: false })
    }

    console.log('📋 Checking favorite status for vendor:', vendor_id, 'user:', session.user.id)

    // Create Supabase client and set user context
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Set user context for RLS policies
    await supabase.rpc('set_current_user_context' as any, {
      user_id: session.user.id
    })

    // Check if favorited
    const { data: favorite, error } = await supabase
      .from('favorites')
      .select('id')
      .eq('vendor_id', vendor_id)
      .eq('customer_id', session.user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Failed to check favorite:', error)
      return NextResponse.json({ error: 'Failed to check favorite status' }, { status: 500 })
    }

    const isFavorite = !!favorite
    console.log('✅ Favorite status:', isFavorite)

    // Clear user context
    await supabase.rpc('clear_current_user_context' as any)

    return NextResponse.json({ isFavorite })

  } catch (error) {
    console.error('❌ Favorite check error:', error)
    return NextResponse.json(
      { error: `Failed to check favorite: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}