import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
import { errorHandler, createAuthError, Result } from '@/lib/error-handler'

type SupabaseClientOptions = {
  jwt?: string
}

// Server-side Supabase client
export const createClient = (options?: SupabaseClientOptions) => {
  const cookieStore = cookies()

  const supabaseOptions = options?.jwt
    ? {
        global: {
          headers: {
            Authorization: `Bearer ${options.jwt}`,
          },
        },
      }
    : {}

  return createServerClient<Database>(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      ...supabaseOptions,
      cookies: {
        get(name: string) {
          return cookieStore.get(name)?.value
        },
        set(name: string, value: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value, ...options })
          } catch (error) {
            // The `set` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
        remove(name: string, options: CookieOptions) {
          try {
            cookieStore.set({ name, value: '', ...options })
          } catch (error) {
            // The `delete` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing
            // user sessions.
          }
        },
      },
    }
  )
}

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
