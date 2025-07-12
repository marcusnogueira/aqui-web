import { NextRequest, NextResponse } from 'next/server'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { getAdminUserServer } from '@/lib/admin-auth-server'

export async function PATCH(request: NextRequest) {
  try {
    // Check admin authentication
    const adminUser = await getAdminUserServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      )
    }

    const supabase = createSupabaseServerClient(cookies())
    const { vendorIds, action } = await request.json()

    if (!vendorIds || !Array.isArray(vendorIds) || vendorIds.length === 0) {
      return NextResponse.json(
        { error: 'Invalid vendor IDs provided' },
        { status: 400 }
      )
    }

    if (!['approve', 'reject'].includes(action)) {
      return NextResponse.json(
        { error: 'Invalid action provided' },
        { status: 400 }
      )
    }

    let updateData: any = {}
    let statusValue: string

    // Map actions to database updates
    switch (action) {
      case 'approve':
        updateData = {
          status: 'approved',
          approved_by: adminUser.adminId,
          approved_at: new Date().toISOString()
        }
        statusValue = 'approved'
        break
      case 'reject':
        updateData = {
          status: 'rejected',
          approved_by: null,
          approved_at: null
        }
        statusValue = 'rejected'
        break
    }

    // Update vendors in batch
    const { data: updatedVendors, error: updateError } = await supabase
      .from('vendors')
      .update(updateData)
      .in('id', vendorIds)
      .select('id, business_name, user_id')

    if (updateError) {
      console.error('Error updating vendors:', updateError)
      return NextResponse.json(
        { error: 'Failed to update vendors' },
        { status: 500 }
      )
    }

    // Create notifications for affected vendors
    if (updatedVendors && updatedVendors.length > 0) {
      const notifications = updatedVendors.map(vendor => ({
        user_id: vendor.user_id,
        type: 'vendor_status_update',
        title: `Vendor Status Updated`,
        message: `Your vendor "${vendor.business_name}" has been ${statusValue}.`,
        data: {
          vendor_id: vendor.id,
          action: action,
          status: statusValue,
          admin_id: adminUser.adminId
        },
        created_at: new Date().toISOString()
      }))

      const { error: notificationError } = await supabase
        .from('notifications')
        .insert(notifications)

      if (notificationError) {
        console.error('Error creating notifications:', notificationError)
        // Don't fail the request if notifications fail
      }
    }

    return NextResponse.json({
      success: true,
      updated: updatedVendors?.length || 0,
      action: action,
      vendorIds: vendorIds
    })

  } catch (error) {
    console.error('Error in batch vendor update:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}