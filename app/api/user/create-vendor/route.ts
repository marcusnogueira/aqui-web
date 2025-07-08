import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'

export async function POST(request: NextRequest) {
  try {
    const supabase = createServerClient()
    
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
      // User already has vendor profile, just update their role
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
        return NextResponse.json(
          { error: 'Failed to update user role' },
          { status: 500 }
        )
      }
      
      return NextResponse.json({
        success: true,
        user: updatedUser,
        vendor: existingVendor,
        message: 'Switched to vendor role'
      })
    }
    
    // Create basic vendor profile
    const { data: newVendor, error: vendorError } = await supabase
      .from('vendors')
      .insert({
        user_id: user.id,
        business_name: 'New Business', // Placeholder - will be updated in onboarding
        business_type: null,
        is_approved: false,
        is_active: false,
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
      // Clean up the vendor profile if user update fails
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
      message: 'Vendor profile created successfully. Please complete your profile setup.'
    })
    
  } catch (error) {
    console.error('Create vendor error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}