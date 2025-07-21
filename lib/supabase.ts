import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'
import { errorHandler, ErrorType, ErrorSeverity } from '@/lib/error-handler'

// Client-side Supabase client
export const createClient = () => createBrowserClient<Database>(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
)

// Google OAuth configuration
export const googleOAuthConfig = {
  client_id: process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID!,
  redirect_uri: `${process.env.NEXT_PUBLIC_SUPABASE_URL}/auth/v1/callback`,
}

// Helper function to sign in with Google (using NextAuth.js)
export const signInWithGoogle = async () => {
  const { signIn } = await import('next-auth/react')
  return await signIn('google', { callbackUrl: window.location.origin })
}

// Helper function to sign out (using NextAuth.js)
export const signOut = async () => {
  const { signOut: nextAuthSignOut } = await import('next-auth/react')
  return await nextAuthSignOut({ callbackUrl: window.location.origin })
}

// Helper function to get current user (using NextAuth.js)
export const getCurrentUser = async () => {
  return errorHandler.wrapAsync(async () => {
    const response = await fetch('/api/auth/session')
    if (!response.ok) {
      throw errorHandler.create(
        ErrorType.AUTHENTICATION,
        'Failed to get current user session',
        ErrorSeverity.MEDIUM,
        'GET_USER_FAILED'
      )
    }
    
    const session = await response.json()
    return session?.user || null
  }, 'getCurrentUser')
}

// Helper function to check if user is admin
export const isUserAdmin = async (userId: string) => {
  const supabase = createClient()
  const { data, error } = await supabase
    .from('users')
    .select('is_admin')
    .eq('id', userId)
    .single()
  
  if (error) {
    console.error('Error checking admin status:', error)
    return false
  }
  
  return !!data?.is_admin
}