import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'
import type { Database } from '@/types/database'
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

// Helper function to get current user on server
export const getCurrentUserServer = async (): Promise<Result<any>> => {
  return errorHandler.wrapAsyncResult(async () => {
    const supabase = createClient()
    const { data: { user }, error } = await supabase.auth.getUser()
    
    if (error) {
      throw createAuthError(
        `Failed to get current user on server: ${error.message}`,
        'GET_USER_SERVER_FAILED',
        error
      )
    }
    
    return user
  }, 'getCurrentUserServer')
}