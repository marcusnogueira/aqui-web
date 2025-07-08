import { NextRequest, NextResponse } from 'next/server'
import { verifyAdminTokenServer } from '@/lib/admin-auth-server'

// Force Node.js runtime to support crypto module
export const runtime = 'nodejs'

export async function GET(request: NextRequest) {
  try {
    const adminUser = verifyAdminTokenServer(request)
    
    if (!adminUser) {
      return NextResponse.json(
        { error: 'Not authenticated' },
        { status: 401 }
      )
    }
    
    return NextResponse.json({
      admin: {
        id: adminUser.adminId,
        username: adminUser.username,
        email: adminUser.email
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