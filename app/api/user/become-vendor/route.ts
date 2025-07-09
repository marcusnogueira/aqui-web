import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import { USER_ROLES, VENDOR_STATUSES, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants'

// Force dynamic rendering for cookie usage
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const {
      business_name,
      business_type,
      subcategory,
      description,
      phone,
      contact_email,
      address,
      latitude,
      longitude,
      tags,
      profile_image_url,
      banner_image_url,
    } = await request.json()

    if (!business_name || !business_type) {
      return NextResponse.json(
        { error: 'Business name and type are required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const supabase = createClient()

    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    // Check if user already has a vendor profile
    const { data: existingVendor } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()

    if (existingVendor) {
      return NextResponse.json(
        { error: 'User already has a vendor profile' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Prepare vendor data for insertion
    const vendorData = {
      user_id: user.id,
      business_name,
      business_type,
      subcategory: subcategory || null,
      description: description || null,
      phone: phone || null,
      contact_email: contact_email || user.email,
      address: address || null,
      latitude: latitude || null,
      longitude: longitude || null,
      tags: tags || [],
      profile_image_url: profile_image_url || null,
      banner_image_url: banner_image_url || [],
      is_active: true, // Default to active, admin can deactivate
      status: VENDOR_STATUSES.PENDING, // Require admin approval
    };

    // Create vendor profile
    const { data: newVendor, error: vendorError } = await supabase
      .from('vendors')
      .insert(vendorData)
      .select()
      .single()

    if (vendorError) {
      console.error('Vendor creation error:', vendorError)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    // Create static location if address and coordinates are provided
    if (address && latitude && longitude) {
      await supabase
        .from('vendor_static_locations')
        .insert({
          vendor_id: newVendor.id,
          address,
          latitude,
          longitude,
        })
    }

    // Update user to mark as vendor and switch active role
    const { data: updatedUser, error: userUpdateError } = await supabase
      .from('users')
      .update({
        is_vendor: true,
        active_role: USER_ROLES.VENDOR,
      })
      .eq('id', user.id)
      .select()
      .single()

    if (userUpdateError) {
      console.error('User update error:', userUpdateError)
      // Attempt to clean up by deleting the created vendor profile
      await supabase.from('vendors').delete().eq('id', newVendor.id)

      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    return NextResponse.json({
      success: true,
      vendor: newVendor,
      user: updatedUser,
      message: 'Vendor profile created successfully. It is now pending approval.'
    })

  } catch (error) {
    console.error('Vendor onboarding error:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}
