import { NextRequest, NextResponse } from 'next/server'
import { setServiceRoleContext, clearUserContext } from '@/lib/nextauth-context'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'

// Force Node.js runtime to support crypto module
export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  try {
    const adminUser = await verifyAdminTokenServer(request)
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      admin: {
        adminId: adminUser.adminId,
        username: adminUser.username,
        email: adminUser.email,
        type: 'admin' as const
      }
    })
    
  } catch (error) {
    console.error('Admin auth check error:', error)
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    )
  }
}