import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

interface CaptionUpdateRequest {
  imageIndex: number
  caption: string
}

interface CaptionUpdateResponse {
  success: boolean
  error?: string
  details?: string
}

export async function PUT(request: NextRequest): Promise<NextResponse<CaptionUpdateResponse>> {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      )
    }

    // Get Supabase client
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)

    // Get vendor for this user
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, gallery_images, gallery_titles')
      .eq('user_id', session.user.id)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json(
        { success: false, error: 'Vendor not found' },
        { status: 404 }
      )
    }

    // Parse request body
    const { imageIndex, caption }: CaptionUpdateRequest = await request.json()

    // Validate input
    if (typeof imageIndex !== 'number' || imageIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid image index' },
        { status: 400 }
      )
    }

    if (typeof caption !== 'string') {
      return NextResponse.json(
        { success: false, error: 'Caption must be a string' },
        { status: 400 }
      )
    }

    // Check if image index exists
    const galleryImages = vendor.gallery_images || []
    if (imageIndex >= galleryImages.length) {
      return NextResponse.json(
        { success: false, error: 'Image index out of range' },
        { status: 400 }
      )
    }

    // Update gallery titles array
    const galleryTitles = vendor.gallery_titles || []
    
    // Ensure gallery_titles array is same length as gallery_images
    while (galleryTitles.length < galleryImages.length) {
      galleryTitles.push('')
    }

    // Update the caption at the specified index
    galleryTitles[imageIndex] = caption.trim()

    // Update database
    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        gallery_titles: galleryTitles,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendor.id)

    if (updateError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update caption',
          details: updateError.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Gallery caption update API error:', error)
    return NextResponse.json(
      { 
        success: false, 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}