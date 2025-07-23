import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export async function PUT(request: NextRequest) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Authentication required' },
        { status: 401 }
      )
    }

    const { imageIndex, title } = await request.json()

    if (typeof imageIndex !== 'number' || imageIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Valid image index is required' },
        { status: 400 }
      )
    }

    if (typeof title !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Title must be a string' },
        { status: 400 }
      )
    }

    // Validate title length
    if (title.length > 100) {
      return NextResponse.json(
        { success: false, error: 'Title must be 100 characters or less' },
        { status: 400 }
      )
    }

    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)

    // Get current vendor data
    const { data: vendor, error: fetchError } = await supabase
      .from('vendors')
      .select('gallery_images, gallery_titles')
      .eq('user_id', session.user.id)
      .single()

    if (fetchError) {
      console.error('Error fetching vendor:', fetchError)
      return NextResponse.json(
        { success: false, error: 'Failed to fetch vendor data' },
        { status: 500 }
      )
    }

    if (!vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    const galleryImages = vendor.gallery_images || []
    const galleryTitles = vendor.gallery_titles || []

    // Validate image index
    if (imageIndex >= galleryImages.length) {
      return NextResponse.json(
        { success: false, error: 'Image index out of range' },
        { status: 400 }
      )
    }

    // Update the titles array
    const updatedTitles = [...galleryTitles]
    
    // Ensure the titles array is at least as long as the images array
    while (updatedTitles.length <= imageIndex) {
      updatedTitles.push('')
    }
    
    updatedTitles[imageIndex] = title

    // Update the vendor record
    const { error: updateError } = await supabase
      .from('vendors')
      .update({ gallery_titles: updatedTitles })
      .eq('user_id', session.user.id)

    if (updateError) {
      console.error('Error updating gallery titles:', updateError)
      return NextResponse.json(
        { success: false, error: 'Failed to update image title' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true,
      message: 'Image title updated successfully',
      updatedTitles
    })

  } catch (error) {
    console.error('Error in update-title API:', error)
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    )
  }
}