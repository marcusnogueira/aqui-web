import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting review submission...')
    
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      console.error('❌ Authentication failed: No session or user ID')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ Authentication successful:', { userId: session.user.id })

    const { vendor_id, rating, review } = await request.json()

    console.log('📋 Review data:', { vendor_id, rating, review: review?.substring(0, 50) + '...' })

    if (!vendor_id || !rating || !review?.trim()) {
      console.error('❌ Missing required data')
      return NextResponse.json({ error: 'Missing vendor ID, rating, or review text' }, { status: 400 })
    }

    if (rating < 1 || rating > 5) {
      console.error('❌ Invalid rating:', rating)
      return NextResponse.json({ error: 'Rating must be between 1 and 5' }, { status: 400 })
    }

    // Create Supabase client and set user context for RLS
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Set user context for RLS policies
    await supabase.rpc('set_current_user_context' as any, {
      user_id: session.user.id
    })

    console.log('✅ User context set for RLS')

    // Check if user already reviewed this vendor
    console.log('🔍 Checking for existing review...')
    const { data: existingReview, error: checkError } = await supabase
      .from('reviews')
      .select('id')
      .eq('vendor_id', vendor_id)
      .eq('user_id', session.user.id)
      .single()

    if (checkError && checkError.code !== 'PGRST116') { // PGRST116 = no rows found
      console.error('❌ Error checking existing review:', checkError)
      return NextResponse.json({ error: 'Failed to check existing review' }, { status: 500 })
    }

    if (existingReview) {
      console.log('❌ User already reviewed this vendor')
      return NextResponse.json({ error: 'You have already reviewed this vendor' }, { status: 400 })
    }

    // Insert the review - the database trigger will automatically update vendor stats
    console.log('💾 Inserting new review...')
    const { data: newReview, error: insertError } = await supabase
      .from('reviews')
      .insert({
        vendor_id,
        user_id: session.user.id,
        rating,
        review: review.trim()
      })
      .select()
      .single()

    if (insertError) {
      console.error('❌ Failed to insert review:', insertError)
      return NextResponse.json({ error: 'Failed to submit review', details: insertError.message }, { status: 500 })
    }

    console.log('✅ Review submitted successfully, database trigger will update vendor stats')

    // Clear user context
    await supabase.rpc('clear_current_user_context' as any)

    return NextResponse.json({ 
      success: true,
      review: newReview
    })

  } catch (error) {
    console.error('❌ Review submission error:', error)
    return NextResponse.json(
      { error: `Failed to submit review: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}

// GET: Fetch reviews for a vendor
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const vendor_id = searchParams.get('vendor_id')

    if (!vendor_id) {
      return NextResponse.json({ error: 'Missing vendor_id parameter' }, { status: 400 })
    }

    console.log('📋 Fetching reviews for vendor:', vendor_id)

    // Create Supabase client
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)

    // Fetch reviews with user info (no auth required for reading)
    const { data: reviews, error } = await supabase
      .from('reviews')
      .select(`
        id,
        rating,
        review,
        created_at,
        user_id,
        users (
          full_name,
          avatar_url
        )
      `)
      .eq('vendor_id', vendor_id)
      .order('created_at', { ascending: false })

    if (error) {
      console.error('❌ Failed to fetch reviews:', error)
      return NextResponse.json({ error: 'Failed to fetch reviews' }, { status: 500 })
    }

    console.log('✅ Reviews fetched successfully:', reviews?.length || 0, 'reviews')

    return NextResponse.json({ reviews })

  } catch (error) {
    console.error('❌ Review fetch error:', error)
    return NextResponse.json(
      { error: `Failed to fetch reviews: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}