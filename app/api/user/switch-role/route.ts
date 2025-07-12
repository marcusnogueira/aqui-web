import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import type { Database } from '@/types/database'
import { USER_ROLES, ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants'

// Force dynamic rendering for cookie usage
export const dynamic = 'force-dynamic'

export async function POST(request: NextRequest) {
  try {
    const { role } = await request.json()
    
    if (!role || ![USER_ROLES.CUSTOMER, USER_ROLES.VENDOR].includes(role)) {
      return NextResponse.json(
        { error: 'Invalid role. Must be "customer" or "vendor"' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }
    
    const supabase = createSupabaseServerClient(cookies())
    
    // Get current user
    const { data: { user }, error: authError } = await supabase.auth.getUser()
    
    if (authError || !user) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
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
        { status: HTTP_STATUS.NOT_FOUND }
      )
    }
    
    // If switching to vendor, check if vendor profile exists
    if (role === USER_ROLES.VENDOR) {
      const { data: vendorProfile, error: vendorError } = await supabase
        .from('vendors')
        .select('id')
        .eq('user_id', user.id)
        .single()
      
      // If no vendor profile exists, return error - they need to complete vendor onboarding first
      if (vendorError || !vendorProfile) {
        return NextResponse.json(
          { error: 'Vendor profile not found. Please complete vendor onboarding first.' },
          { status: HTTP_STATUS.BAD_REQUEST }
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
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
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
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  }
}