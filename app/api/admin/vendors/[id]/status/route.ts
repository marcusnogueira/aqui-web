import { NextRequest, NextResponse } from 'next/server'
import { setServiceRoleContext, clearUserContext } from '@/lib/nextauth-context'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'
import { ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const supabase = createSupabaseServerClient(cookies())
  
  try {
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const vendorId = params.id
    const { status } = await request.json()

    if (!vendorId || !status) {
      return NextResponse.json(
        { error: 'Vendor ID and status are required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    const validStatuses = ['approved', 'rejected', 'pending']
    if (!validStatuses.includes(status)) {
      return NextResponse.json(
        { error: 'Invalid status value' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Set service role context for RLS policies
    await setServiceRoleContext(supabase)

    const updateData: any = { status }
    
    // Add approval fields if approving
    if (status === 'approved') {
      updateData.approved_by = adminUser.adminId
      updateData.approved_at = new Date().toISOString()
    } else if (status === 'rejected') {
      updateData.approved_by = null
      updateData.approved_at = null
    }

    const { data: updatedVendor, error } = await supabase
      .from('vendors')
      .update(updateData)
      .eq('id', vendorId)
      .select()
      .single()

    if (error) {
      console.error('Error updating vendor status:', error)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    return NextResponse.json({ success: true, vendor: updatedVendor })

  } catch (error) {
    console.error('Update vendor status error:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  } finally {
    // Always clear user context when done
    await clearUserContext(supabase)
  }
}
