import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/lib/database.types'
import { errorHandler, createAuthError, Result } from '@/lib/error-handler'

// Server-side Supabase client
export const createClient = () => createServerClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
  {
    cookies: {
      get(name: string) {
        return cookies().get(name)?.value
      },
    },
  }
)

// Helper function to get current user on server (using NextAuth.js)
export const getCurrentUserServer = async (): Promise<Result<any>> => {
  return errorHandler.wrapAsyncResult(async () => {
    const { auth } = await import('@/app/api/auth/[...nextauth]/auth')
    const session = await auth()
    
    if (!session?.user) {
      throw createAuthError(
        'No authenticated user found',
        'GET_USER_SERVER_FAILED'
      )
    }
    
    return session.user
  }, 'getCurrentUserServer')
}