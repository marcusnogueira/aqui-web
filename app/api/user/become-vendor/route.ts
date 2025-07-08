import { NextRequest, NextResponse } from 'next/server'
import { createClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { 
      business_name, 
      business_type, 
      description, 
      phone, 
      address,
      place_id,
      latitude,
      longitude,
      address_components
    } = await request.json()
    
    if (!business_name || !business_type) {
      return NextResponse.json(
        { error: 'Business name and type are required' },
        { status: 400 }
      )
    }
    
    const supabase = createClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Check if user already has a vendor profile
    const { data: existingVendor, error: vendorCheckError } = await supabase
      .from('vendors')
      .select('id')
      .eq('user_id', user.id)
      .single()
    
    if (existingVendor) {
      return NextResponse.json(
        { error: 'User already has a vendor profile' },
        { status: 400 }
      )
    }
    
    // Create vendor profile
    const { data: newVendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id: user.id,
        business_name,
        business_type,
        description: description || null,
        phone: phone || null,
        is_active: true,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .select()
      .single()
    
    if (vendorError) {
      console.error('Vendor creation error:', vendorError)
      return NextResponse.json(
        { error: 'Failed to create vendor profile' },
        { status: 500 }
      )
    }

    // Create static location if place data is provided
    if (address && latitude && longitude) {
      const { error: locationError } = await supabase
        .from('vendor_static_locations')
        .insert({
          vendor_id: newVendor.id,
          name: business_name,
          address,
          latitude: parseFloat(latitude),
          longitude: parseFloat(longitude),
          is_primary: true,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })

      if (locationError) {
        console.error('Location creation error:', locationError)
        // Don't fail the entire process if location creation fails
      }
    }
    
    // Update user to mark as vendor and switch active role
    const { data: updatedUser, error: userUpdateError } = await supabase
      .from('users')
      .update({
        is_vendor: true,
        active_role: 'vendor',
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()
    
    if (userUpdateError) {
      console.error('User update error:', userUpdateError)
      // Try to clean up the vendor profile if user update fails
      await supabase.from('vendors').delete().eq('id', newVendor.id)
      
      return NextResponse.json(
        { error: 'Failed to update user profile' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      vendor: newVendor,
      user: updatedUser,
      message: 'Vendor profile created successfully'
    })
    
  } catch (error) {
    console.error('Vendor onboarding error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}