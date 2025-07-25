import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function DELETE(request: NextRequest) {
  try {
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const vendorId = searchParams.get('vendorId')
    const imageUrl = searchParams.get('imageUrl')
    const imageType = searchParams.get('imageType') || 'gallery' // Default to gallery for backward compatibility

    if (!vendorId || !imageUrl) {
      return NextResponse.json({ error: 'Missing vendor ID or image URL' }, { status: 400 })
    }

    console.log('🗑️ Starting image deletion:', { vendorId, imageUrl, imageType })

    // Create regular client for database operations
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Create SERVICE ROLE client for storage and database updates (bypasses ALL RLS)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate delete permission using DB function (bypasses RLS)
    const { data: isAuthorized, error: authError } = await supabase
      .rpc('validate_vendor_upload' as any, {
        p_user_id: session.user.id,
        p_vendor_id: vendorId
      })

    if (authError || !isAuthorized) {
      console.error('❌ Delete authorization failed:', authError)
      return NextResponse.json({ error: 'Vendor not found or access denied' }, { status: 403 })
    }

    console.log('✅ Delete authorized via DB function')

    // Get vendor data for updates
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, user_id, banner_image_url, gallery_images')
      .eq('id', vendorId)
      .single()

    if (vendorError || !vendor) {
      return NextResponse.json({ error: 'Vendor data not found' }, { status: 404 })
    }

    console.log('📋 Vendor data fetched:', { 
      vendorId: vendor.id,
      bannerCount: vendor.banner_image_url?.length || 0,
      galleryCount: vendor.gallery_images?.length || 0
    })

    // Extract filename from URL and delete from storage using SERVICE ROLE
    const urlParts = imageUrl.split('/')
    const fileName = urlParts[urlParts.length - 1]
    const folderPath = urlParts[urlParts.length - 2] // gallery, banner, or profile
    
    if (fileName) {
      const storagePath = `${vendorId}/${folderPath}/${fileName}`
      console.log('🗑️ Deleting from storage:', storagePath)
      
      const { error: removeError } = await serviceClient.storage
        .from('vendor-images')
        .remove([storagePath])
      
      if (removeError) {
        console.error('❌ Error removing file from storage:', removeError)
        // Continue anyway to update the database
      } else {
        console.log('✅ File removed from storage')
      }
    }

    // Update vendor record to remove the image URL using SERVICE ROLE
    let updateData: any = {}
    
    if (imageType === 'gallery') {
      const updatedGalleryImages = (vendor.gallery_images || []).filter(url => url !== imageUrl)
      updateData.gallery_images = updatedGalleryImages
      console.log('💾 Updating gallery images:', {
        before: vendor.gallery_images?.length || 0,
        after: updatedGalleryImages.length
      })
    } else if (imageType === 'banner') {
      const updatedBannerUrls = (vendor.banner_image_url || []).filter(url => url !== imageUrl)
      updateData.banner_image_url = updatedBannerUrls
      console.log('💾 Updating banner images:', {
        before: vendor.banner_image_url?.length || 0,
        after: updatedBannerUrls.length
      })
    } else {
      return NextResponse.json({ error: 'Invalid image type for deletion' }, { status: 400 })
    }

    const { data: updatedVendor, error: updateError } = await serviceClient
      .from('vendors')
      .update(updateData)
      .eq('id', vendorId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      throw updateError
    }

    console.log('✅ Image deleted successfully')
    return NextResponse.json({ vendor: updatedVendor })

  } catch (error) {
    console.error('Error deleting image:', error)
    return NextResponse.json(
      { error: `Failed to delete image: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}