import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  let imageType = 'unknown' // Initialize outside try block for catch access
  
  try {
    console.log('🔄 Starting image upload API...')
    
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      console.error('❌ Authentication failed: No session or user ID')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ Authentication successful:', { userId: session.user.id })

    const formData = await request.formData()
    const files = formData.getAll('files') as File[]
    const vendorId = formData.get('vendorId') as string
    imageType = formData.get('imageType') as string || 'unknown' // 'profile', 'banner', or 'gallery'

    console.log('📋 Request data:', {
      filesCount: files.length,
      vendorId,
      imageType,
      fileNames: files.map(f => f.name),
      fileSizes: files.map(f => f.size)
    })

    if (!files.length || !vendorId || !imageType) {
      console.error('❌ Missing required data:', { 
        hasFiles: !!files.length, 
        hasVendorId: !!vendorId, 
        hasImageType: !!imageType 
      })
      return NextResponse.json({ error: 'Missing files, vendor ID, or image type' }, { status: 400 })
    }

    // Validate image type
    if (!['profile', 'banner', 'gallery'].includes(imageType)) {
      console.error('❌ Invalid image type:', imageType)
      return NextResponse.json({ error: 'Invalid image type. Must be profile, banner, or gallery' }, { status: 400 })
    }

    // Profile images should only allow 1 file
    if (imageType === 'profile' && files.length > 1) {
      console.error('❌ Too many files for profile image:', files.length)
      return NextResponse.json({ error: 'Profile image upload only allows 1 file' }, { status: 400 })
    }

    // Create regular client for database operations
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Create SERVICE ROLE client for storage (bypasses ALL RLS)
    const storageClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    // Validate upload permission using DB function (bypasses RLS)
    console.log('🔒 Validating vendor upload permission...', { userId: session.user.id, vendorId })
    const { data: isAuthorized, error: authError } = await supabase
      .rpc('validate_vendor_upload' as any, {
        p_user_id: session.user.id,
        p_vendor_id: vendorId
      })

    if (authError) {
      console.error('❌ Upload authorization DB error:', authError)
      return NextResponse.json({ error: 'Authorization validation failed', details: authError.message }, { status: 500 })
    }

    if (!isAuthorized) {
      console.error('❌ Upload authorization denied for user:', session.user.id, 'vendor:', vendorId)
      return NextResponse.json({ error: 'Vendor not found or access denied' }, { status: 403 })
    }

    console.log('✅ Upload authorized via DB function')

    // Get vendor data for updates
    console.log('📋 Fetching vendor data...', { vendorId })
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, user_id, profile_image_url, banner_image_url, gallery_images')
      .eq('id', vendorId)
      .single()

    if (vendorError) {
      console.error('❌ Vendor data fetch error:', vendorError)
      return NextResponse.json({ error: 'Failed to fetch vendor data', details: vendorError.message }, { status: 500 })
    }

    if (!vendor) {
      console.error('❌ Vendor not found:', vendorId)
      return NextResponse.json({ error: 'Vendor data not found' }, { status: 404 })
    }

    console.log('✅ Vendor data fetched:', { 
      vendorId: vendor.id, 
      imageType,
      currentProfileImage: vendor.profile_image_url ? 'exists' : 'none',
      currentBannerCount: vendor.banner_image_url?.length || 0,
      currentGalleryCount: vendor.gallery_images?.length || 0
    })

    console.log('📤 Starting file uploads...')
    const uploadPromises = files.map(async (file, index) => {
      console.log(`📎 Processing file ${index + 1}: ${file.name} (${file.size} bytes)`)
      
      if (file.size > 5 * 1024 * 1024) {
        throw new Error(`File ${file.name} exceeds the 5MB limit.`)
      }

      const ext = file.name.split('.').pop()
      
      // Generate appropriate filename based on image type
      let fileName: string
      if (imageType === 'profile') {
        fileName = `${vendorId}/profile.${ext}` // Single profile image, overwrite existing
      } else if (imageType === 'banner') {
        fileName = `${vendorId}/banner/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      } else { // gallery
        fileName = `${vendorId}/gallery/${Date.now()}-${Math.random().toString(36).substring(2)}.${ext}`
      }
      
      console.log(`📝 Generated filename for ${imageType}: ${fileName}`)

      // Upload to Supabase storage using SERVICE ROLE (bypasses ALL RLS)
      console.log(`☁️ Uploading to storage...`)
      const { error: uploadError } = await storageClient.storage
        .from('vendor-images')
        .upload(fileName, file, { upsert: imageType === 'profile' }) // Only upsert for profile images

      if (uploadError) {
        console.error(`❌ Upload error for ${fileName}:`, uploadError)
        throw uploadError
      }
      console.log(`✅ File uploaded: ${fileName}`)

      // Get public URL using SERVICE ROLE
      console.log(`🔗 Creating public URL...`)
      const { data: { publicUrl } } = storageClient.storage
        .from('vendor-images')
        .getPublicUrl(fileName)

      console.log(`✅ Public URL created: ${publicUrl}`)
      return publicUrl
    })

    const newImageUrls = await Promise.all(uploadPromises)
    console.log('🎉 All files uploaded successfully:', newImageUrls.length, 'files')
    
    // Prepare update data based on image type
    let updateData: any = {}
    
    if (imageType === 'profile') {
      updateData.profile_image_url = newImageUrls[0] // Single profile image
      console.log('💾 Updating vendor profile image...', { newUrl: newImageUrls[0] })
    } else if (imageType === 'banner') {
      const updatedBannerUrls = [...(vendor.banner_image_url || []), ...newImageUrls]
      updateData.banner_image_url = updatedBannerUrls
      console.log('💾 Updating vendor banner images...', {
        currentCount: vendor.banner_image_url?.length || 0,
        newCount: newImageUrls.length,
        totalAfterUpdate: updatedBannerUrls.length
      })
    } else { // gallery
      const updatedGalleryImages = [...(vendor.gallery_images || []), ...newImageUrls]
      updateData.gallery_images = updatedGalleryImages
      console.log('💾 Updating vendor gallery images...', {
        currentCount: vendor.gallery_images?.length || 0,
        newCount: newImageUrls.length,
        totalAfterUpdate: updatedGalleryImages.length
      })
    }

    // Update vendor record using SERVICE ROLE (since we already validated permission)
    const { data: updatedVendor, error: updateError } = await storageClient
      .from('vendors')
      .update(updateData)
      .eq('id', vendorId)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Database update error:', updateError)
      throw new Error(`Database update failed: ${updateError.message}`)
    }

    console.log(`✅ Vendor record updated successfully with ${imageType} images:`, {
      imageType,
      uploadedCount: newImageUrls.length,
      totalCount: imageType === 'profile' ? 1 : (updateData[imageType === 'banner' ? 'banner_image_url' : 'gallery_images']?.length || 0)
    })

    return NextResponse.json({ 
      vendor: updatedVendor,
      uploadedUrls: newImageUrls 
    })

  } catch (error) {
    console.error(`Error uploading ${imageType || 'unknown'} images:`, error)
    return NextResponse.json(
      { error: `Failed to upload ${imageType || 'unknown'} images: ${error instanceof Error ? error.message : 'Unknown error'}` },
      { status: 500 }
    )
  }
}