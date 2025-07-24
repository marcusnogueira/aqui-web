import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

interface ReorderRequest {
  imageUrls: string[]
  imageTitles?: string[]
}

interface ReorderResponse {
  success: boolean
  error?: string
  details?: string
}

export async function PUT(request: NextRequest): Promise<NextResponse<ReorderResponse>> {
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
    
    // Create SERVICE ROLE client for database updates (bypasses ALL RLS)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

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

    // Validate reorder permission using DB function (bypasses RLS)
    const { data: isAuthorized, error: authError } = await supabase
      .rpc('validate_vendor_upload' as any, {
        p_user_id: session.user.id,
        p_vendor_id: vendor.id
      })

    if (authError || !isAuthorized) {
      console.error('❌ Gallery reorder authorization failed:', authError)
      return NextResponse.json(
        { success: false, error: 'Reorder not authorized' },
        { status: 403 }
      )
    }

    console.log('✅ Gallery reorder authorized via DB function')

    // Parse request body
    const { imageUrls, imageTitles }: ReorderRequest = await request.json()

    // Validate input
    if (!Array.isArray(imageUrls)) {
      return NextResponse.json(
        { success: false, error: 'imageUrls must be an array' },
        { status: 400 }
      )
    }

    if (imageTitles && !Array.isArray(imageTitles)) {
      return NextResponse.json(
        { success: false, error: 'imageTitles must be an array if provided' },
        { status: 400 }
      )
    }

    // Validate that all provided URLs exist in current gallery
    const currentGalleryImages = vendor.gallery_images || []
    const currentGalleryTitles = vendor.gallery_titles || []

    if (imageUrls.length !== currentGalleryImages.length) {
      return NextResponse.json(
        { success: false, error: 'Number of images in reorder request does not match current gallery' },
        { status: 400 }
      )
    }

    // Check that all URLs in the request exist in the current gallery
    for (const url of imageUrls) {
      if (!currentGalleryImages.includes(url)) {
        return NextResponse.json(
          { success: false, error: `Image URL not found in current gallery: ${url}` },
          { status: 400 }
        )
      }
    }

    // If imageTitles is provided, validate its length
    let updatedTitles: string[]
    if (imageTitles) {
      if (imageTitles.length !== imageUrls.length) {
        return NextResponse.json(
          { success: false, error: 'imageTitles length must match imageUrls length' },
          { status: 400 }
        )
      }
      updatedTitles = imageTitles
    } else {
      // Reorder existing titles to match new image order
      updatedTitles = imageUrls.map(url => {
        const originalIndex = currentGalleryImages.indexOf(url)
        return currentGalleryTitles[originalIndex] || ''
      })
    }

    // Update database with new order using SERVICE ROLE (since we already validated permission)
    const { error: updateError } = await serviceClient
      .from('vendors')
      .update({
        gallery_images: imageUrls,
        gallery_titles: updatedTitles,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendor.id)

    if (updateError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to reorder gallery',
          details: updateError.message
        },
        { status: 500 }
      )
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Gallery reorder API error:', error)
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