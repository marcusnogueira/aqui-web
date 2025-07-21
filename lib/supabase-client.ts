import { createBrowserClient } from '@supabase/ssr'
import type { Database } from '@/lib/database.types'
import { errorHandler, createAuthError, createNetworkError, Result, createResult } from '@/lib/error-handler'

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
export const signInWithGoogle = async (): Promise<Result<any>> => {
  return errorHandler.wrapAsyncResult(async () => {
    const { signIn } = await import('next-auth/react')
    await signIn('google', { callbackUrl: window.location.origin })
    
    // signIn with redirect doesn't return a result, it redirects the page
    return { success: true }
  }, 'signInWithGoogle')
}




// Helper function to sign in with Apple (using NextAuth.js)
export const signInWithApple = async (): Promise<Result<any>> => {
  return errorHandler.wrapAsyncResult(async () => {
    const { signIn } = await import('next-auth/react')
    await signIn('apple', { callbackUrl: window.location.origin })
    
    // signIn with redirect doesn't return a result, it redirects the page
    return { success: true }
  }, 'signInWithApple')
}

// Helper function to sign out (using NextAuth.js)
export const signOut = async (): Promise<Result<void>> => {
  return errorHandler.wrapAsyncResult(async () => {
    const { signOut: nextAuthSignOut } = await import('next-auth/react')
    await nextAuthSignOut({ callbackUrl: window.location.origin })
  }, 'signOut')
}

// Helper function to get current user (using NextAuth.js)
export const getCurrentUser = async (): Promise<Result<any>> => {
  return errorHandler.wrapAsyncResult(async () => {
    const response = await fetch('/api/auth/session')
    if (!response.ok) {
      throw createAuthError(
        'Failed to get current user session',
        'GET_USER_FAILED'
      )
    }
    
    const session = await response.json()
    return session?.user || null
  }, 'getCurrentUser')
}
