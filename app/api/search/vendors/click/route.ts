import { NextRequest, NextResponse } from 'next/server'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    const body = await request.json()
    const { vendor_id, latitude, longitude, search_query } = body

    if (!vendor_id) {
      return NextResponse.json(
        { error: 'vendor_id is required' },
        { status: 400 }
      )
    }

    const cookieStore = cookies()
    const supabase = createSupabaseServerClient(cookieStore)

    // Get the current user
    const { data: { user }, error: userError } = await supabase.auth.getUser()
    
    if (userError || !user) {
      // Log anonymous click
      const { error: clickError } = await supabase
        .from('vendor_clicks' as any)
        .insert({
          vendor_id,
          latitude,
          longitude,
          search_query,
          created_at: new Date().toISOString()
        })

      if (clickError) {
        console.error('Error logging anonymous vendor click:', clickError)
        return NextResponse.json(
          { error: 'Failed to log click' },
          { status: 500 }
        )
      }
    } else {
      // Log authenticated user click
      const { error: clickError } = await supabase
        .from('vendor_clicks' as any)
        .insert({
          user_id: user.id,
          vendor_id,
          latitude,
          longitude,
          search_query,
          created_at: new Date().toISOString()
        })

      if (clickError) {
        console.error('Error logging vendor click:', clickError)
        return NextResponse.json(
          { error: 'Failed to log click' },
          { status: 500 }
        )
      }

      // If there's a search query, try to update the most recent search log
      if (search_query?.trim()) {
        await supabase
          .from('search_logs')
          .update({ vendor_clicked: vendor_id })
          .eq('user_id', user.id)
          .eq('query', search_query.trim())
          .order('created_at', { ascending: false })
          .limit(1)
      }
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error in vendor click API:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}