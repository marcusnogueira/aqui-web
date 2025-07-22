import { NextRequest, NextResponse } from 'next/server'
import { setServiceRoleContext, clearUserContext } from '@/lib/nextauth-context'
import { cookies } from 'next/headers'
import { createSupabaseServerClient } from '@/lib/supabase/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'
import { ERROR_MESSAGES, HTTP_STATUS } from '@/lib/constants'

export const dynamic = 'force-dynamic'
export const runtime = 'nodejs'

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const supabase = createSupabaseServerClient(await cookies())
  
  try {
    const adminUser = await verifyAdminTokenServer(request)
    if (!adminUser) {
      return NextResponse.json(
        { error: ERROR_MESSAGES.UNAUTHORIZED },
        { status: HTTP_STATUS.UNAUTHORIZED }
      )
    }

    const resolvedParams = await params
    const vendorId = resolvedParams.id
    const { admin_notes } = await request.json()

    if (!vendorId) {
      return NextResponse.json(
        { error: 'Vendor ID is required' },
        { status: HTTP_STATUS.BAD_REQUEST }
      )
    }

    // Set service role context for RLS policies
    await setServiceRoleContext(supabase)

    const { data: updatedVendor, error } = await supabase
      .from('vendors')
      .update({ admin_notes })
      .eq('id', vendorId)
      .select()
      .single()

    if (error) {
      console.error('Error updating vendor notes:', error)
      return NextResponse.json(
        { error: ERROR_MESSAGES.INTERNAL_ERROR },
        { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
      )
    }

    return NextResponse.json({ success: true, vendor: updatedVendor })

  } catch (error) {
    console.error('Update vendor notes error:', error)
    return NextResponse.json(
      { error: ERROR_MESSAGES.INTERNAL_ERROR },
      { status: HTTP_STATUS.INTERNAL_SERVER_ERROR }
    )
  } finally {
    // Always clear user context when done
    await clearUserContext(supabase)
  }
}
