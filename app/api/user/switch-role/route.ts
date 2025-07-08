import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@/lib/supabase-server'
import type { Database } from '@/types/database'

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json()
    
    if (!role || !['customer', 'vendor'].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "customer" or "vendor"' },
        { status: 400 }
      )
    }
    
    const supabase = createServerClient()
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    // Get user profile
    const { data: userProfile, error: profileError } = await supabase
      .from('users')
      .select('*')
      .eq('id', user.id)
      .single()
    
    if (profileError || !userProfile) {
      return NextResponse.json(
        { error: 'User profile not found' },
        { status: 404 }
      )
    }
    
    // If switching to vendor, check if vendor profile exists
    if (role === 'vendor') {
      const { data: vendorProfile, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      // If no vendor profile exists, return error - they need to complete vendor onboarding first
      if (vendorError || !vendorProfile) {
        return NextResponse.json(
          { error: 'Vendor profile not found. Please complete vendor onboarding first.' },
          { status: 400 }
        )
      }
    }
    
    // Update user's active role
    const { data: updatedUser, error: updateError } = await supabase
      .from('users')
      .update({ 
        active_role: role,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select()
      .single()
    
    if (updateError) {
      return NextResponse.json(
        { error: 'Failed to update role' },
        { status: 500 }
      )
    }
    
    return NextResponse.json({
      success: true,
      user: updatedUser,
      message: `Successfully switched to ${role} role`
    })
    
  } catch (error) {
    console.error('Role switch error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}