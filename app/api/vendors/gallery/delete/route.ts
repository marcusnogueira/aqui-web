import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export const dynamic = 'force-dynamic'

interface DeleteImageRequest {
  imageIndex: number
}

interface DeleteImageResponse {
  success: boolean
  error?: string
  details?: string
}

export async function DELETE(request: NextRequest): Promise<NextResponse<DeleteImageResponse>> {
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
    
    // Create SERVICE ROLE client for storage and database updates (bypasses ALL RLS)
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

    // Validate delete permission using DB function (bypasses RLS)
    const { data: isAuthorized, error: authError } = await supabase
      .rpc('validate_vendor_upload' as any, {
        p_user_id: session.user.id,
        p_vendor_id: vendor.id
      })

    if (authError || !isAuthorized) {
      console.error('❌ Gallery delete authorization failed:', authError)
      return NextResponse.json(
        { success: false, error: 'Delete not authorized' },
        { status: 403 }
      )
    }

    console.log('✅ Gallery delete authorized via DB function')

    // Parse request body
    const { imageIndex }: DeleteImageRequest = await request.json()

    // Validate input
    if (typeof imageIndex !== 'number' || imageIndex < 0) {
      return NextResponse.json(
        { success: false, error: 'Invalid image index' },
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

    // Get the image URL to delete from storage
    const imageUrl = galleryImages[imageIndex]
    
    // Extract filename from URL for storage deletion
    let fileName: string | null = null
    try {
      const url = new URL(imageUrl)
      const pathParts = url.pathname.split('/')
      // URL format: /storage/v1/object/public/vendor-images/{vendor-id}/gallery/{filename}
      if (pathParts.includes('vendor-images')) {
        const vendorImagesIndex = pathParts.indexOf('vendor-images')
        if (vendorImagesIndex + 3 < pathParts.length) {
          fileName = `${pathParts[vendorImagesIndex + 1]}/gallery/${pathParts[vendorImagesIndex + 3]}`
        }
      }
    } catch (urlError) {
      console.warn('Could not parse image URL for storage deletion:', imageUrl)
    }

    // Remove image from arrays
    const updatedGalleryImages = galleryImages.filter((_, index) => index !== imageIndex)
    const galleryTitles = vendor.gallery_titles || []
    const updatedGalleryTitles = galleryTitles.filter((_, index) => index !== imageIndex)

    // Update database first
    const { error: updateError } = await supabase
      .from('vendors')
      .update({
        gallery_images: updatedGalleryImages,
        gallery_titles: updatedGalleryTitles,
        updated_at: new Date().toISOString()
      })
      .eq('id', vendor.id)

    if (updateError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to update gallery',
          details: updateError.message
        },
        { status: 500 }
      )
    }

    // Try to delete from storage (non-blocking)
    if (fileName) {
      try {
        await supabase.storage
          .from('vendor-images')
          .remove([fileName])
      } catch (storageError) {
        console.warn('Failed to delete image from storage:', storageError)
        // Don't fail the request if storage deletion fails
      }
    }

    return NextResponse.json({
      success: true
    })

  } catch (error) {
    console.error('Gallery delete API error:', error)
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