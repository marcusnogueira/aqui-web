import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/app/api/auth/[...nextauth]/auth'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { createClient } from '@supabase/supabase-js'
import { cookies } from 'next/headers'

export async function POST(request: NextRequest) {
  try {
    console.log('🔄 Starting profile update API...')
    
    // Check authentication
    const session = await auth()
    if (!session?.user?.id) {
      console.error('❌ Authentication failed: No session or user ID')
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 })
    }

    console.log('✅ Authentication successful:', { userId: session.user.id })

    // Parse form data
    const formData = await request.formData()
    const profileData = JSON.parse(formData.get('profileData') as string)
    const profileImageFile = formData.get('profileImage') as File | null
    const bannerImageFile = formData.get('bannerImage') as File | null

    console.log('📋 Request data:', {
      profileData,
      hasProfileImage: !!profileImageFile,
      hasBannerImage: !!bannerImageFile
    })

    // Create regular client for database operations
    const cookieStore = await cookies()
    const supabase = createSupabaseServerClient(cookieStore)
    
    // Create SERVICE ROLE client for storage and database updates (bypasses ALL RLS)
    const serviceClient = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    )

    console.log('✅ Service role client created')

    // Get vendor for this user
    console.log('📋 Fetching vendor data...')
    const { data: vendor, error: vendorError } = await supabase
      .from('vendors')
      .select('id, profile_image_url, banner_image_url')
      .eq('user_id', session.user.id)
      .single()

    if (vendorError) {
      console.error('❌ Vendor data fetch error:', vendorError)
      return NextResponse.json({ error: 'Failed to fetch vendor data', details: vendorError.message }, { status: 500 })
    }

    if (!vendor) {
      console.error('❌ Vendor not found for user:', session.user.id)
      return NextResponse.json({ error: 'Vendor not found' }, { status: 404 })
    }

    console.log('✅ Vendor data fetched:', { vendorId: vendor.id })

    // Validate permission using DB function
    console.log('🔒 Validating vendor ownership...')
    const { data: isAuthorized, error: authError } = await supabase
      .rpc('validate_vendor_upload' as any, {
        p_user_id: session.user.id,
        p_vendor_id: vendor.id
      })

    if (authError) {
      console.error('❌ Authorization validation failed:', authError)
      return NextResponse.json({ error: 'Authorization validation failed', details: authError.message }, { status: 500 })
    }

    if (!isAuthorized) {
      console.error('❌ User not authorized to update this vendor')
      return NextResponse.json({ error: 'Not authorized to update this vendor' }, { status: 403 })
    }

    console.log('✅ Vendor ownership validated')

    let profileImageUrl = vendor.profile_image_url
    let bannerImageUrl: string | null = null

    // Upload profile image if selected
    if (profileImageFile) {
      console.log('📤 Uploading profile image...', {
        fileName: profileImageFile.name,
        size: profileImageFile.size,
        type: profileImageFile.type
      })

      const fileExt = profileImageFile.name.split('.').pop()
      const fileName = `${vendor.id}/profile.${fileExt}`
      
      console.log('☁️ Uploading to storage:', fileName)
      const { error: uploadError } = await serviceClient.storage
        .from('vendor-images')
        .upload(fileName, profileImageFile, { upsert: true })

      if (uploadError) {
        console.error('❌ Profile image upload failed:', uploadError)
        return NextResponse.json({ error: 'Profile image upload failed', details: uploadError.message }, { status: 500 })
      }

      console.log('✅ Profile image uploaded successfully')

      const { data: { publicUrl } } = serviceClient.storage
        .from('vendor-images')
        .getPublicUrl(fileName)

      profileImageUrl = publicUrl
      console.log('🔗 Profile image URL:', profileImageUrl)
    }

    // Upload banner image if selected
    if (bannerImageFile) {
      console.log('📤 Uploading banner image...', {
        fileName: bannerImageFile.name,
        size: bannerImageFile.size,
        type: bannerImageFile.type
      })

      const fileExt = bannerImageFile.name.split('.').pop()
      const fileName = `${vendor.id}/banner.${fileExt}`
      
      console.log('☁️ Uploading to storage:', fileName)
      const { error: uploadError } = await serviceClient.storage
        .from('vendor-images')
        .upload(fileName, bannerImageFile, { upsert: true })

      if (uploadError) {
        console.error('❌ Banner image upload failed:', uploadError)
        return NextResponse.json({ error: 'Banner image upload failed', details: uploadError.message }, { status: 500 })
      }

      console.log('✅ Banner image uploaded successfully')

      const { data: { publicUrl } } = serviceClient.storage
        .from('vendor-images')
        .getPublicUrl(fileName)

      bannerImageUrl = publicUrl
      console.log('🔗 Banner image URL:', bannerImageUrl)
    }

    // Update vendor profile using SERVICE ROLE (since we already validated permission)
    console.log('💾 Updating vendor profile in database...')
    const updateData = {
      business_name: profileData.business_name,
      description: profileData.description,
      business_type: profileData.business_type,
      subcategory: profileData.subcategory,
      contact_email: profileData.contact_email,
      phone: profileData.phone,
      profile_image_url: profileImageUrl,
      banner_image_url: bannerImageUrl ? [bannerImageUrl] : (vendor.banner_image_url || [])
    }

    console.log('📝 Update data:', updateData)

    const { data: updatedVendor, error: updateError } = await serviceClient
      .from('vendors')
      .update(updateData)
      .eq('id', vendor.id)
      .select()
      .single()

    if (updateError) {
      console.error('❌ Database update failed:', updateError)
      return NextResponse.json({ error: 'Database update failed', details: updateError.message }, { status: 500 })
    }

    console.log('✅ Profile updated successfully in database')

    return NextResponse.json({ 
      success: true,
      vendor: updatedVendor
    })

  } catch (error) {
    console.error('❌ Profile update API error:', error)
    return NextResponse.json(
      { 
        error: 'Internal server error',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    )
  }
}